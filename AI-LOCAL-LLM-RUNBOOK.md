# Local AI Runbook

This project now supports a local lightweight LLM using Ollama while preserving the existing recommendation logic.

## Run

```bash
docker compose up --build -d
```

## Notes
- Existing endpoint remains unchanged: `/api/recommendations/{userId}`
- New AI endpoints:
  - `/api/recommendations/{userId}/explanations`
  - `/api/ai/product-assistant`
  - `/api/ai/compare-products`
  - `/api/ai/home-summary`
- If Ollama or the model is not ready yet, the AI service returns fallback JSON instead of failing.

## Useful checks

```bash
curl http://localhost:8000/health
curl http://localhost:11434/api/tags
```

## Recommended first test

```bash
curl http://localhost:8081/api/recommendations/demo-user/explanations \
  -H "Authorization: Bearer <token>"
```


## AI response quality fix
- The explanation endpoint now validates the Ollama response shape before returning it.
- If Ollama returns plain base recommendations instead of rich explanation fields, the service falls back to deterministic enriched output.
- Invalid product identifiers such as `ORDER` are ignored during Kafka score ingestion.
