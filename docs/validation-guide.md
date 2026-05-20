# Validation guide

## Step 1: Start everything
```bash
docker compose up --build -d
```

## Step 2: Wait for initial startup
Give the system time to initialize, especially Keycloak and the first Maven builds.

## Step 3: Verify URLs
- Next.js -> http://localhost:3000
- Keycloak -> http://localhost:8080
- Gateway -> http://localhost:8081/actuator/health
- Product Service -> http://localhost:8083/actuator/health
- AI Service -> http://localhost:8000/health

## Step 4: Login
Use demo / demo123

## Step 5: Test product view
Trigger a product view from the UI or call the gateway endpoint manually.

## Step 6: Test checkout
Trigger simulated checkout from the UI.

## Step 7: Validate consumers
- Delivery records:
  `curl http://localhost:8081/api/deliveries/order/<ORDER_ID>`
- Notifications:
  `curl http://localhost:8081/api/notifications`
- AI recommendations:
  `curl http://localhost:8000/api/recommendations/demo-user`
