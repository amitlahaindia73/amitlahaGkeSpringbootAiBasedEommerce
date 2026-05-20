pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    parameters {
        choice(
            name: 'SERVICE_NAME',
            choices: [
                'user-service',
                'product-service',
                'payment-service',
                'delivery-service',
                'notification-service',
                'product-batch-service',
                'order-service',
                'cart-service',
                'api-gateway',
                'nextjs-bff',
                'ai-recommendation-service',
                'ai-order-support-service',
                'all'
            ],
            description: 'Select one service to build and push, or all'
        )
    }

    environment {
        GCP_PROJECT_ID = 'amitra-commerce-dev'
        ARTIFACT_REGISTRY_REGION = 'asia-south1'
        ARTIFACT_REPOSITORY = 'amitra-repo'
        REGISTRY_BASE = "${ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REPOSITORY}"
    }

    stages {
        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Verify Required Tools') {
            steps {
                sh '''
                set -e
                echo "Checking required tools..."
                git --version
                mvn -v
                docker --version
                gcloud --version
                '''
            }
        }

        stage('Configure Google Artifact Registry') {
            steps {
                sh '''
                set -e
                echo "Setting GCP project..."
                gcloud config set project "$GCP_PROJECT_ID"

                echo "Configuring Docker authentication for Artifact Registry..."
                gcloud auth configure-docker "${ARTIFACT_REGISTRY_REGION}-docker.pkg.dev" --quiet
                '''
            }
        }

        stage('Resolve Image Tags') {
            steps {
                sh '''
                set -e

                mkdir -p .image-tags

                get_next_tag() {
                  service="$1"
                  image_path="${REGISTRY_BASE}/${service}"

                  echo "Checking existing tags for ${image_path}"

                  existing_tags=$(gcloud artifacts docker tags list "$image_path" \
                    --format="value(tag)" 2>/dev/null | awk -F: '{print $NF}' | grep -E '^[0-9]+$' || true)

                  if [ -z "$existing_tags" ]; then
                    next_tag=1
                  else
                    max_tag=$(echo "$existing_tags" | sort -n | tail -1)
                    next_tag=$((max_tag + 1))
                  fi

                  echo "$next_tag" > ".image-tags/${service}.tag"
                  echo "${service} will be pushed as tag: ${next_tag}"
                }

                if [ "$SERVICE_NAME" = "all" ]; then
                  for service in user-service product-service payment-service delivery-service notification-service product-batch-service order-service cart-service api-gateway nextjs-bff ai-recommendation-service ai-order-support-service; do
                    get_next_tag "$service"
                  done
                else
                  get_next_tag "$SERVICE_NAME"
                fi
                '''
            }
        }

        stage('Build Maven Services') {
            steps {
                sh '''
                set -e

                build_maven_service() {
                  service="$1"

                  if [ "$service" = "nextjs-bff" ]; then
                    echo "Skipping Maven build for nextjs-bff"
                  elif echo "$service" | grep -q "^ai-"; then
                    echo "Skipping Maven build for Python AI service: $service"
                  else
                    echo "Building Maven module: $service"
                    mvn -pl "$service" -am clean install -DskipTests
                  fi
                }

                if [ "$SERVICE_NAME" = "all" ]; then
                  echo "Building all Maven modules once..."
                  mvn clean install -DskipTests
                else
                  build_maven_service "$SERVICE_NAME"
                fi
                '''
            }
        }

        stage('Build and Push Docker Images') {
            steps {
                sh '''
                set -e

                build_and_push() {
                  service="$1"
                  tag=$(cat ".image-tags/${service}.tag")

                  local_image="amitra-${service}:${tag}"
                  remote_image="${REGISTRY_BASE}/${service}:${tag}"

                  echo "========================================"
                  echo "Service      : $service"
                  echo "Local image  : $local_image"
                  echo "Remote image : $remote_image"
                  echo "========================================"

                  echo "Building Docker image from repo root..."
                  docker build -t "$local_image" -f "$service/Dockerfile" .

                  echo "Tagging image for Artifact Registry..."
                  docker tag "$local_image" "$remote_image"

                  echo "Pushing image to Artifact Registry..."
                  docker push "$remote_image"

                  echo "Cleaning local images from Jenkins VM..."
                  docker rmi "$local_image" || true
                  docker rmi "$remote_image" || true

                  echo "Completed: $remote_image"
                }

                if [ "$SERVICE_NAME" = "all" ]; then
                  for service in user-service product-service payment-service delivery-service notification-service product-batch-service order-service cart-service api-gateway nextjs-bff ai-recommendation-service ai-order-support-service; do
                    build_and_push "$service"
                  done
                else
                  build_and_push "$SERVICE_NAME"
                fi

                echo "Cleaning dangling images..."
                docker image prune -f || true
                '''
            }
        }
		stage('Create Kubernetes Secrets from Secret Manager') {
    steps {
        sh '''
        set -e

        echo "Connecting to GKE..."
        gcloud container clusters get-credentials amitra-gke-cluster \
          --zone asia-south1-a \
          --project amitra-commerce-dev

        kubectl apply -f k8s/base/namespace.yaml

        set +x
        MYSQL_APP_USER=$(gcloud secrets versions access latest --secret=amitra-mysql-app-user)
        MYSQL_APP_PASSWORD=$(gcloud secrets versions access latest --secret=amitra-mysql-app-password)
        KEYCLOAK_REALM=$(gcloud secrets versions access latest --secret=amitra-keycloak-realm)
        KEYCLOAK_CLIENT_ID=$(gcloud secrets versions access latest --secret=amitra-keycloak-client-id)
        KEYCLOAK_CLIENT_SECRET=$(gcloud secrets versions access latest --secret=amitra-keycloak-client-secret)
        GEMINI_API_KEY=$(gcloud secrets versions access latest --secret=amitra-gemini-api-key)

        kubectl -n amitra create secret generic amitra-common-secrets \
          --from-literal=MYSQL_APP_USER="$MYSQL_APP_USER" \
          --from-literal=MYSQL_APP_PASSWORD="$MYSQL_APP_PASSWORD" \
          --from-literal=KEYCLOAK_REALM="$KEYCLOAK_REALM" \
          --from-literal=KEYCLOAK_CLIENT_ID="$KEYCLOAK_CLIENT_ID" \
          --from-literal=KEYCLOAK_CLIENT_SECRET="$KEYCLOAK_CLIENT_SECRET" \
          --from-literal=GEMINI_API_KEY="$GEMINI_API_KEY" \
          --dry-run=client -o yaml | kubectl apply -f -
        set -x
        '''
    }
}
		stage('Deploy to GKE') {
    steps {
        sh '''
        set -e

        service="$SERVICE_NAME"
        tag=$(cat ".image-tags/${service}.tag")
        image="${REGISTRY_BASE}/${service}:${tag}"

        echo "Connecting to GKE..."
        gcloud container clusters get-credentials amitra-gke-cluster \
          --zone asia-south1-a \
          --project amitra-commerce-dev

        echo "Creating namespace..."
        kubectl apply -f k8s/base/namespace.yaml

        echo "Applying configmap..."
        kubectl apply -f k8s/overlays/gcp/configmap.yaml

        echo "Deploying service YAML..."
        kubectl -n amitra apply -f k8s/base/${service}.yaml

        echo "Updating image..."
        kubectl -n amitra set image deployment/${service} ${service}=${image}

        echo "Waiting for rollout..."
        kubectl -n amitra rollout status deployment/${service} --timeout=300s
        '''
    }
}
stage('Deploy Ingress') {
    when {
        expression { params.SERVICE_NAME == 'nextjs-bff' }
    }
    steps {
        sh '''
        set -e

        echo "Deploying Ingress for Next.js BFF..."
        kubectl apply -f k8s/overlays/gcp/ingress.yaml

        echo "Current Ingress status:"
        kubectl get ingress -n amitra
        '''
    }
}
        stage('Show Docker Disk Usage') {
            steps {
                sh '''
                echo "Docker disk usage after cleanup:"
                docker system df
                '''
            }
        }
    }

    post {
        success {
            echo 'Build and Artifact Registry push completed successfully.'
        }
        failure {
            echo 'Build or push failed. Check console output.'
        }
        always {
            sh '''
            echo "Final cleanup of dangling images..."
            docker image prune -f || true
            '''
        }
    }
}