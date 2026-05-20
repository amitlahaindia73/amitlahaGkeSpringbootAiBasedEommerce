This upgrade pass focuses on production-hardening while preserving the current Docker + Maven workflow.

Included changes:
- environment-variable-driven configuration across services
- Flyway schema migrations for SQL-backed services
- standardized API success/error responses
- global validation and exception handling
- request correlation id propagation
- Swagger/OpenAPI endpoints on gateway and services
- product catalog enrichment and filtering
- payment idempotency by orderId plus refund endpoint
- user CRUD validation and uniqueness rules
- delivery/notification filtering APIs
- repo hygiene files (.gitignore and .env.example)

Remaining work for later phases:
- automated test suite
- Jenkins/GitHub Actions pipeline
- full cart/order/inventory/outbox saga
- multi-stage Docker build hardening
