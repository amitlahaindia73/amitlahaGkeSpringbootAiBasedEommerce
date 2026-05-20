# Notification service fix

## Root cause

The notification service had two Kafka listeners:
- `order.completed` expecting `OrderCompletedEvent`
- `delivery.created` expecting `DeliveryCreatedEvent`

But the service was using only one Kafka consumer factory configured with:
- `JsonDeserializer<OrderCompletedEvent>`

Because of that, messages from `delivery.created` were also deserialized as `OrderCompletedEvent`.
Spring then failed with:

`Cannot convert from [OrderCompletedEvent] to [DeliveryCreatedEvent]`

## Fix applied

Only notification-service Kafka configuration was changed:
- added one container factory for `OrderCompletedEvent`
- added one container factory for `DeliveryCreatedEvent`
- bound each `@KafkaListener` to its matching container factory

## Logic impact

No business logic was changed.
Only Kafka payload deserialization was corrected.
