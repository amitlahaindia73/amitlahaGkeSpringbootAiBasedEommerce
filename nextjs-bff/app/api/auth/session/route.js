import { getAccessToken, getSessionUser } from "../../../../lib/session";
import { decodeJwtPayload } from "../../../../lib/jwt";

/**
 * Local debug endpoint to confirm the current browser session and token roles.
 * This does not cryptographically validate the token; the gateway remains the source of truth.
 */
export async function GET() {
  const token = await getAccessToken();
  const sessionUser = await getSessionUser();
  const payload = decodeJwtPayload(token);

  if (!token || !sessionUser) {
    return Response.json({
      authenticated: false,
      reason: payload?.exp ? "missing_or_expired_token" : "missing_token"
    }, { status: 200 });
  }

  return Response.json({
    authenticated: true,
    sub: sessionUser.sub,
    username: sessionUser.username,
    email: sessionUser.email,
    name: sessionUser.name,
    roles: sessionUser.roles,
    expires_at: sessionUser.expiresAt,
    realm_access: sessionUser.payload?.realm_access || null,
    resource_access: sessionUser.payload?.resource_access || null
  });
}
