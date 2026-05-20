import { NextResponse } from "next/server";
import { gatewayFetch } from "../../../../../lib/api";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const response = await gatewayFetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" }
    });
  } catch (error) {
    return NextResponse.json({ message: "Checkout request failed", details: [String(error?.message || error)] }, { status: 500 });
  }
}
