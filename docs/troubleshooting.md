# Troubleshooting

## Gateway says 401
Likely the request reached the gateway without a valid Bearer token. Login in Next.js first.

## Service routing checks
Services may still be starting. Refresh after 20-30 seconds.

## Kafka consumer not working
Check:
```bash
docker compose logs -f kafka
docker compose logs -f ai-recommendation-service
docker compose logs -f delivery-service
docker compose logs -f notification-service
```

## Next.js callback fails
Make sure Keycloak realm imported correctly and the client redirect URI matches:
`http://localhost:3000/api/auth/callback`

## Clean restart
```bash
docker compose down -v
docker compose up --build -d
```
