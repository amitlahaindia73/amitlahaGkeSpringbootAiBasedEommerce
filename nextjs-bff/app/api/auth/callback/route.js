export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const KEYCLOAK_INTERNAL_URL =
    process.env.KEYCLOAK_INTERNAL_URL || "http://keycloak:8080";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "amitra-commerce";
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || "nextjs-bff";
const KEYCLOAK_CLIENT_SECRET =
    process.env.KEYCLOAK_CLIENT_SECRET || "nextjs-secret";
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";
const USER_SERVICE_BASE_URL = process.env.USER_SERVICE_BASE_URL || "http://user-service:8082";

function decodeJwtPayload(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch (error) {
    console.error("Failed to decode JWT payload:", error);
    return null;
  }
}

function hasAdminRole(tokenData) {
  const payload =
      decodeJwtPayload(tokenData?.access_token) ||
      decodeJwtPayload(tokenData?.id_token);

  const roles = [
    ...(payload?.roles || []),
    ...(payload?.realm_access?.roles || []),
  ];

  return roles.some((role) => String(role).toLowerCase() === "admin");
}

async function resolveCustomerRedirect(tokenData) {
  try {
    const payload = decodeJwtPayload(tokenData?.access_token) || decodeJwtPayload(tokenData?.id_token) || {};
    const roles = [
      ...(payload?.roles || []),
      ...(payload?.realm_access?.roles || []),
    ];
    const fullName = payload?.name || [payload?.given_name, payload?.family_name].filter(Boolean).join(" ") || payload?.preferred_username || payload?.email || "";

    const response = await fetch(`${USER_SERVICE_BASE_URL}/api/users/me`, {
      headers: {
        "X-Request-Id": globalThis.crypto?.randomUUID?.() || `req-${Date.now()}`,
        "X-Auth-User-Id": payload?.sub || "",
        "X-Auth-Email": payload?.email || "",
        "X-Auth-Username": payload?.preferred_username || payload?.email || payload?.sub || "",
        "X-Auth-Full-Name": fullName,
        "X-Auth-Roles": roles.join(",")
      },
      cache: "no-store"
    });
    const profilePayload = await response.json().catch(() => null);
    const profile = profilePayload?.data;
    return profile?.profileComplete ? `${APP_BASE_URL}/` : `${APP_BASE_URL}/profile`;
  } catch (error) {
    console.error("Failed to resolve customer redirect:", error);
    return `${APP_BASE_URL}/profile`;
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "No code" }, { status: 400 });
    }

    const tokenRes = await fetch(
        `${KEYCLOAK_INTERNAL_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: KEYCLOAK_CLIENT_ID,
            client_secret: KEYCLOAK_CLIENT_SECRET,
            code,
            redirect_uri: `${APP_BASE_URL}/api/auth/callback`,
          }).toString(),
        }
    );

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      return NextResponse.json(
          { error: "Token exchange failed", details: tokenData },
          { status: 500 }
      );
    }

    const isAdmin = hasAdminRole(tokenData);
    const redirectUrl = isAdmin
      ? `${APP_BASE_URL}/admin`
      : await resolveCustomerRedirect(tokenData);

    const res = NextResponse.redirect(redirectUrl);

    res.cookies.set("access_token", tokenData.access_token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    });

    if (tokenData.refresh_token) {
      res.cookies.set("refresh_token", tokenData.refresh_token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: false,
      });
    }

    if (tokenData.id_token) {
      res.cookies.set("id_token", tokenData.id_token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: false,
      });
    }

    return res;
  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
