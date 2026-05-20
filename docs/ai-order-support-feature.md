# AI Order Support Chat Feature

This feature adds a new standalone service for order-specific customer support chat.

## What was added
- New Python service: `ai-order-support-service`
- New BFF endpoint: `POST /api/bff/orders/support-chat`
- New gateway route: `/api/support-chat/**`
- New UI panel on each order card in `My Orders`
- Redis-backed last 10 message history with 24h TTL
- Kafka event publishing to `customer.support.chat.events`

## Security model
- Browser sends only `orderNumber` and `message`
- BFF fetches `/api/orders/me` for the signed-in user
- BFF rejects access if the selected order is not part of the current user order list
- Only the matched order context is forwarded to the AI support service
- Redis keys are isolated by `userId + orderNumber`
- History is therefore not visible across users

## Database impact
- No SQL schema change
- No Mongo schema change
- No existing recommendation logic changed
