# Amitra Commerce Mesh

## Split local runtime model

This project now supports a split local architecture:
- `docker-compose.yml` starts infra only: MySQL, MongoDB, Redis, Kafka, Keycloak, Postgres for Keycloak.
- `docker-compose.bff.yml` starts only the browser-facing `nextjs-bff`.
- `k8s/` contains Kubernetes manifests for all backend microservices, `api-gateway`, and the AI services.
- `docker-compose.full-local.yml` preserves the previous all-in-one local stack as a fallback.

### Recommended startup order
1. `docker compose up -d`
2. `./scripts/build-k8s-images.ps1`
3. `./scripts/apply-k8s.ps1`
4. `docker compose -f docker-compose.bff.yml up --build -d`

### Key local endpoints after the split
- BFF: `http://localhost:3000`
- Keycloak: `http://localhost:8080`
- API Gateway from host: `http://localhost:30081`


### Important local networking note
The Kubernetes manifests use `host.docker.internal` to reach Docker-hosted infra containers from pods. This is intended for your Windows/Rancher Desktop local setup.

---

<!-- Amitra Commerce Mesh project notes by Amit Laha -->
# AmitAI Commerce Mesh

A fully local, production-style reference microservices system based on your architecture diagram.

## What this project includes

- Next.js BFF with SSR-friendly server routes and Keycloak login flow
- Keycloak for local OAuth2 / OIDC authentication
- Spring Cloud Gateway for JWT validation, routing, rate limiting, and fallbacks
- User, Product, Payment, Delivery, and Notification services
- AI Recommendation service built with FastAPI
- MySQL, MongoDB, Redis, Kafka, Zookeeper
- Prometheus, Grafana, Loki, and Tempo
- Docker Compose for one-command local startup

## Important honesty note

This repository is designed as a **local production-style starter** rather than a finished business product.
It gives you a strong, well-commented foundation that you can download, run locally, and extend.

## High-level flow

1. Browser hits Next.js BFF.
2. Next.js redirects user to Keycloak for login.
3. Keycloak sends authorization code back to Next.js callback route.
4. Next.js exchanges code for tokens and stores them in cookies.
5. Next.js forwards the access token to the API Gateway.
6. Gateway validates JWT and routes request to the correct service.
7. Services use Kafka for async events and databases for persistence.
8. AI Recommendation Service consumes events and serves recommendations.
9. Metrics are scraped by Prometheus and visualized in Grafana.

## Main ports

| Component | Port |
|---|---:|
| Next.js BFF | 3000 |
| Keycloak | 8080 |
| API Gateway | 8081 |
| User Service | 8082 |
| Product Service | 8083 |
| Payment Service | 8084 |
| Delivery Service | 8085 |
| Notification Service | 8086 |
| AI Recommendation Service | 8000 |
| Prometheus | 9090 |
| Grafana | 3001 |
| Loki | 3100 |
| Tempo | 3200 |
| MySQL | 3306 |
| MongoDB | 27017 |
| Redis | 6379 |
| Kafka | 9092 |

## Quick start

### 1) Copy environment file

```bash
cp .env.example .env
```

### 2) Start the full stack

```bash
docker compose up --build -d
```

### 3) Watch logs if needed

```bash
docker compose logs -f api-gateway
docker compose logs -f nextjs-bff
docker compose logs -f product-service
docker compose logs -f ai-recommendation-service
```

## Default local credentials

### Keycloak
- Admin user: `admin`
- Admin password: `admin`

### Demo application user
- Username: `demo`
- Password: `demo123`

### Grafana
- Username: `admin`
- Password: `admin`

## Validation checklist

### Infrastructure health
- Open `http://localhost:8080` and confirm Keycloak loads.
- Open `http://localhost:3000` and confirm Next.js home page loads.
- Open `http://localhost:9090` and confirm Prometheus loads.
- Open `http://localhost:3001` and confirm Grafana loads.

### Login flow
1. Go to `http://localhost:3000`
2. Click **Login with Keycloak**
3. Login with `demo / demo123`
4. Return to the app and confirm the session is shown

### Product flow
1. Open Products page in Next.js
2. Confirm products are loaded from Product Service through Gateway
3. Click **Track Product View** to publish Kafka product-viewed event

### Payment flow
1. On the home page, click checkout simulation
2. Confirm Payment Service persists a transaction
3. Confirm Delivery and Notification services consume the event

### AI recommendation flow
1. Generate at least one product view event
2. Open Recommendations page
3. Confirm recommendations are returned for the user

## Important URLs

- Next.js: `http://localhost:3000`
- Keycloak realm URL:
  `http://localhost:8080/realms/amitra-commerce`
- Gateway fallback endpoint:
  `http://localhost:8081/fallback/default`
  `http://localhost:8761`

## Useful curl examples

### Gateway fallback
```bash
curl http://localhost:8081/fallback/default
```

### Product list through gateway
```bash
curl http://localhost:8081/api/products
```

### Product view event through gateway
```bash
curl -X POST "http://localhost:8081/api/products/viewed/p1?userId=demo-user"
```

### Simulated checkout through gateway
```bash
curl -X POST http://localhost:8081/api/payments/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "orderId":"ORD-1001",
    "userId":"demo-user",
    "productId":"p1",
    "amount":1999.99
  }'
```

### Delivery lookup through gateway
```bash
curl http://localhost:8081/api/deliveries/order/ORD-1001
```

### Notification list through gateway
```bash
curl http://localhost:8081/api/notifications
```

### AI recommendations directly
```bash
curl http://localhost:8000/api/recommendations/demo-user
```

## How to stop

```bash
docker compose down
```

## How to remove volumes too

```bash
docker compose down -v
```

## Troubleshooting

### Problem: Keycloak starts slowly
Wait 20-40 seconds after first startup. It depends on Postgres initialization and realm import.

### Problem: Services start before dependencies are ready
The compose file uses `depends_on`, but some frameworks still need a few retries on first startup. Restart the specific service:

```bash
docker compose restart api-gateway
docker compose restart product-service
```

### Problem: You changed config and want a clean rebuild
```bash
docker compose down -v
docker compose up --build -d
```

## Google login and role verification

After signing in through the Next.js BFF, use either of these local debug paths:

- `http://localhost:3000/api/auth/session`
- `http://localhost:8081/debug/token` with `Authorization: Bearer <access_token>`

Expected token content for a customer login:

```json
{
  "realm_access": {
    "roles": [
      "default-roles-amitra-commerce",
      "offline_access",
      "uma_authorization",
      "customer"
    ]
  }
}
```

If `customer` is missing, log out, log in again, and verify the user is still mapped to the `CUSTOMER` group in Keycloak.


## GCP deployment layout

This repository is the GCP-ready copy of Amitra Commerce Mesh.

### What was changed from local version
- Flattened local `k8s/*.yaml` manifests were replaced with `k8s/base` and `k8s/overlays/gcp`.
- `host.docker.internal`, `localhost`, local `NodePort`, and `:local` image tags were removed from Kubernetes deployment files.
- `nextjs-bff` now deploys inside GKE.
- Kubernetes services are `ClusterIP`; public access is through `k8s/overlays/gcp/ingress.yaml`.
- Jenkins pipeline now builds and pushes to Artifact Registry, then deploys to GKE.
- `docker-compose.bff.yml` and local Kubernetes helper scripts were removed from this GCP copy.

### Replace placeholders before first deploy
Update these files with real values:
- `.env.gcp.example`
- `k8s/overlays/gcp/configmap.yaml`
- `k8s/overlays/gcp/ingress.yaml`
- `Jenkinsfile`

### Secret handling
Do not commit real secrets into Git. Jenkins reads them from Google Secret Manager and recreates the Kubernetes secret at deploy time.
