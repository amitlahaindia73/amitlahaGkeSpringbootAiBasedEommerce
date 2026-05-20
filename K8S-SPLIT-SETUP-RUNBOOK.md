# Kubernetes + Separate Infra Local Runbook

## Goal
- Keep infrastructure outside Kubernetes in Docker containers.
- Run all backend microservices on Kubernetes.
- Run nextjs-bff as a separate Docker unit.

## Files added
- `docker-compose.yml` -> infra only
- `docker-compose.bff.yml` -> nextjs-bff only
- `docker-compose.full-local.yml` -> previous all-in-one compose preserved
- `k8s/namespace.yaml`
- `k8s/configmap.yaml`
- `k8s/secret.example.yaml`
- `k8s/deployments.yaml`
- `scripts/build-k8s-images.ps1`
- `scripts/apply-k8s.ps1`

## One-time prerequisites
- Rancher Desktop Kubernetes enabled
- `kubectl` working
- Docker working
- Maven working

## Run sequence
1. Start infra:
   `docker compose up -d`
2. Build microservice images:
   `powershell -ExecutionPolicy Bypass -File .\scripts\build-k8s-images.ps1`
3. Review `k8s/secret.example.yaml` and set your real Gemini key if needed.
4. Apply manifests:
   `powershell -ExecutionPolicy Bypass -File .\scripts\apply-k8s.ps1`
5. Start BFF:
   `docker compose -f docker-compose.bff.yml up --build -d`

## What to validate
- `kubectl get pods -n amitra`
- `kubectl get svc -n amitra`
- Open `http://localhost:30081/actuator/health` for the gateway
- Open `http://localhost:3000` for the BFF
- Login should redirect to Keycloak on `http://localhost:8080`
- Product listing, cart, orders, AI recommendation, and support chat should still work

## Notes
- `api-gateway` is exposed on NodePort `30081`.
- `user-service` is exposed on NodePort `30082` because the BFF still uses direct user-service calls for profile-related flows.
- All other business services stay internal to the cluster behind service discovery and the gateway.
- `product-batch-service` now uses in-cluster `emptyDir` volumes for `batch-input` and `batch-output` so the pod can start cleanly in local Kubernetes.

## Rollback
If you want the previous local all-in-one runtime back:
- `docker compose -f docker-compose.full-local.yml up --build -d`
