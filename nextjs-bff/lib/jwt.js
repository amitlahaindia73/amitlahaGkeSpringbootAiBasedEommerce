/**
 * Tiny JWT payload decoder for local debugging and server-side session helpers.
 * Signature validation is still done by the API Gateway, not by the BFF.
 */
export function decodeJwtPayload(token) {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export function extractRoles(payload) {
  if (!payload) {
    return [];
  }

  const roles = new Set();

  for (const role of payload?.realm_access?.roles || []) {
    roles.add(role);
  }

  for (const clientAccess of Object.values(payload?.resource_access || {})) {
    for (const role of clientAccess?.roles || []) {
      roles.add(role);
    }
  }

  return [...roles];
}
