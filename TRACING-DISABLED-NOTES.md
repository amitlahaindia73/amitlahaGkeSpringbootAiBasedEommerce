Tracing export has been disabled across all services for the low-memory setup.

Changes made:
- Removed MANAGEMENT_OTLP_TRACING_ENDPOINT from docker-compose.yml
- Set management.tracing.enabled: false in all Spring Boot services
- Removed OTLP tracing endpoint blocks from application.yml files

To re-enable later, restore the Tempo service, re-add the docker-compose endpoint env vars, and set management.tracing.enabled: true.
