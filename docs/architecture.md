# Architecture mapping

This document maps the visual design into the local implementation.

## Client and BFF
- Browser or mobile calls Next.js.
- Next.js acts as the BFF and UI layer.
- Next.js handles login redirect and token exchange with Keycloak.

## Identity provider
- Keycloak is the OIDC provider.
- It issues access tokens for the `amitra-commerce` realm.

## Gateway
- Spring Cloud Gateway validates JWT access tokens.
- Gateway also uses Redis for rate limiting.
- Gateway routes to backend services using direct internal service URLs.

## Services
- User Service -> MySQL
- Product Service -> MongoDB
- Payment Service -> MySQL + Kafka producer
- Delivery Service -> MySQL + Kafka consumer and producer
- Notification Service -> MySQL + Kafka consumer
- AI Recommendation Service -> FastAPI + MongoDB + Redis + Kafka consumer

## Event mesh
Main topics:
- `product.viewed`
- `product.viewed.retry`
- `product.viewed.dlt`
- `order.completed`
- `order.completed.retry`
- `order.completed.dlt`
- `delivery.created`

## Observability
- Prometheus scrapes metrics
- Grafana visualizes metrics
- Loki and Tempo are available for log and trace growth later
