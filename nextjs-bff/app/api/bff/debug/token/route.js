import { gatewayFetch } from "../../../../../lib/api";

export async function GET() {
  try {
    const response = await gatewayFetch("/debug/token", {
      method: "GET"
    });

    const text = await response.text();

    return new Response(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json"
      }
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to reach gateway debug endpoint",
        message: error?.message || "Unknown error"
      },
      { status: 503 }
    );
  }
}