
# Observability runbook

- Rebuild after this patch because tracing dependencies were added.
- Run: `mvn clean install -DskipTests && docker compose up --build -d`
- Startup and framework background logs can still have blank traceId/spanId.
- Test with a real business request such as `/api/products`.
- This patch adds one request-completion log line per HTTP request so Loki can link to Tempo.
