import { cookies } from "next/headers";
import { appConfig } from "./config";
import { getSessionUser } from "./session";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createRequestId() {
  return globalThis.crypto?.randomUUID?.() || `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function getAccessToken() {
  const store = await cookies();
  return store.get("access_token")?.value || null;
}

async function fetchWithRetry(url, options = {}) {
  let lastError;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await fetch(url, {
        ...options,
        cache: "no-store"
      });
    } catch (error) {
      lastError = error;
      if (attempt < 4) {
        await sleep(750 * attempt);
      }
    }
  }

  throw lastError;
}

export async function gatewayFetch(path, options = {}) {
  const token=REDACTED getAccessToken();
  const headers = new Headers(options.headers || {});
  headers.set("X-Request-Id", createRequestId());

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${appConfig.gatewayBaseUrl}${path}`;
  return fetchWithRetry(url, { ...options, headers });
}

export async function userServiceFetch(path, options = {}) {
  const sessionUser = await getSessionUser();
  const headers = new Headers(options.headers || {});
  headers.set("X-Request-Id", createRequestId());

  if (sessionUser?.sub) {
    headers.set("X-Auth-User-Id", sessionUser.sub);
  }
  if (sessionUser?.email) {
    headers.set("X-Auth-Email", sessionUser.email);
  }
  if (sessionUser?.username) {
    headers.set("X-Auth-Username", sessionUser.username);
  }
  if (sessionUser?.name) {
    headers.set("X-Auth-Full-Name", sessionUser.name);
  }
  if (sessionUser?.roles?.length) {
    headers.set("X-Auth-Roles", sessionUser.roles.join(","));
  }

  const url = `${appConfig.userServiceBaseUrl}${path}`;
  return fetchWithRetry(url, { ...options, headers });
}
