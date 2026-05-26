import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appConfig, keycloakPublicRealmUrl } from "../../../../lib/config";

export async function GET() {
  try {
    const store = await cookies();
    const idToken = store.get("id_token")?.value;

    const logoutUrl =
      `${keycloakPublicRealmUrl()}/protocol/openid-connect/logout` +
      `?post_logout_redirect_uri=${encodeURIComponent(appConfig.appBaseUrl)}` +
      `${idToken ? `&id_token_hint=${encodeURIComponent(idToken)}` : ""}`;

    const response = NextResponse.redirect(logoutUrl);

    response.cookies.set("access_token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax"
    });

    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax"
    });

    response.cookies.set("id_token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax"
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: "Logout failed",
        message: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}