# Request flows

## Login flow
1. User opens Next.js.
2. Login button redirects to Keycloak authorization endpoint.
3. Keycloak authenticates user.
4. Keycloak redirects back with authorization code.
5. Next.js exchanges code for access token and stores it in cookies.

## Product view flow
1. User clicks product view in UI.
2. Next.js BFF calls Gateway.
3. Gateway routes to Product Service.
4. Product Service publishes `product.viewed` event.
5. AI service consumes event and updates affinity score.

## Checkout flow
1. User clicks checkout in UI.
2. Next.js BFF calls Gateway.
3. Gateway routes to Payment Service.
4. Payment Service persists transaction and publishes `order.completed`.
5. Delivery Service consumes and creates delivery.
6. Notification Service consumes and persists notification.
7. AI service consumes and boosts recommendation score.
