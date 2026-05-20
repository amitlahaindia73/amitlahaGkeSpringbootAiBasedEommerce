export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  const keycloakPublicUrl =
    process.env.KEYCLOAK_PUBLIC_URL ||
    process.env.KEYCLOAK_PUBLIC_BASE_URL ||
    "http://localhost:8080";

  const keycloakRealm = process.env.KEYCLOAK_REALM || "amitra-commerce";
  const keycloakClientId = process.env.KEYCLOAK_CLIENT_ID || "nextjs-bff";
  const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

  const authUrl = new URL(
    `${keycloakPublicUrl}/realms/${keycloakRealm}/protocol/openid-connect/auth`
  );

  authUrl.searchParams.set("client_id", keycloakClientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid profile email");
  authUrl.searchParams.set("redirect_uri", `${appBaseUrl}/api/auth/callback`);

  return NextResponse.redirect(authUrl.toString());
}