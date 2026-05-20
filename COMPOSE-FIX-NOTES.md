This package fixes the Docker Compose validation errors that happened after disabling tracing/observability.

What was fixed:
- Added valid `environment` mappings for all Spring Boot services using `SERVER_PORT`.
- Kept tracing disabled in application.yml files.
- Put observability services behind the `observability` profile so they do not start by default:
  - prometheus
  - grafana
  - loki
  - tempo
  - promtail

Default run:
  docker compose up --build -d

Run with observability later:
  docker compose --profile observability up --build -d
