# Updated secure flow changes

This package includes the following fixes in the Next.js BFF:

1. Session validity now depends on a non-expired JWT, not only on cookie presence.
2. Home page login state now uses `getSessionUser()` instead of `Boolean(access_token_cookie)`.
3. Logout route now uses the correct Keycloak public realm URL and clears `access_token`, `refresh_token`, and `id_token`.
4. New BFF proxy endpoint added at `/api/bff/debug/token` to inspect what the gateway sees.
5. Products and recommendations pages now show clear 401 and 403 messages.
6. Product action buttons now show failures clearly during track-view and checkout tests.

Recommended verification order:

1. `http://localhost:3000/api/auth/session`
2. `http://localhost:3000/api/bff/debug/token`
3. `http://localhost:3000/products`
4. Logout and repeat the same checks.
