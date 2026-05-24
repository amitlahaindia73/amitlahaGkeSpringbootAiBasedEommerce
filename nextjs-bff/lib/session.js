import { cookies } from "next/headers";
import { decodeJwtPayload, extractRoles } from "./jwt";

/**
 * Helper functions for reading auth cookies and deriving the current session.
 * The BFF does lightweight JWT payload checks for UX only.
 * Cryptographic token validation still happens in the API Gateway.
 */
export async function getAccessToken() {
  const store = await cookies();
  return store.get("access_token")?.value || null;
}

export async function getIdToken() {
  const store = await cookies();
  return store.get("id_token")?.value || null;
}

export async function getRefreshToken() {
  const store = await cookies();
  return store.get("refresh_token")?.value || null;
}

export function isJwtExpired(payload) {
  if (!payload?.exp) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

export async function getSessionUser() {
  const token=REDACTED getAccessToken();
  const payload = decodeJwtPayload(token);

  if (!payload || isJwtExpired(payload)) {
    return null;
  }

  return {
    sub: payload.sub || null,
    username: payload.preferred_username || payload.email || payload.sub || null,
    email: payload.email || null,
    name: payload.name || [payload.given_name, payload.family_name].filter(Boolean).join(" ") || null,
    roles: extractRoles(payload),
    expiresAt: payload.exp || null,
    payload
  };
}
