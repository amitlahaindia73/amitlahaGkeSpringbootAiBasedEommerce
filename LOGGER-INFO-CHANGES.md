# INFO Logging Enhancements

This patch adds safe INFO-level logging without changing business logic.

## Added
- AOP-based entry/exit/error logging for controller, service, and filter classes in all Spring Boot modules
- Explicit application package INFO level in each `application.yml`
- Extra INFO logs for Kafka consumer event receipt in order, delivery, and notification flows

## Intentionally not changed
- Business logic
- Database schemas
- API contracts
- Existing trace/log correlation configuration

## Notes
- Logs are intentionally summarized and truncated to avoid oversized payload dumps.
- Reactive return types are logged safely by class name to avoid side effects.
