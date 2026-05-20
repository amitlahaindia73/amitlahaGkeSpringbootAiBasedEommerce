import { NextResponse } from "next/server";
import { gatewayFetch } from "../../../../../lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const response = await gatewayFetch("/api/cart", { method: "DELETE" });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" }
    });
  } catch (error) {
    return NextResponse.json({ message: "Clear cart request failed", details: [String(error?.message || error)] }, { status: 500 });
  }
}
