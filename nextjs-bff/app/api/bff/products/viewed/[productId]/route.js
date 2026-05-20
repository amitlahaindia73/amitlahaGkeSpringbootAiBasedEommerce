import { NextResponse } from "next/server";
import { gatewayFetch } from "../../../../../../lib/api";

export const dynamic = "force-dynamic";

export async function POST(_req, { params }) {
  const resolvedParams = await params;
  try {
    const response = await gatewayFetch(`/api/products/viewed/${resolvedParams.productId}`, { method: "POST" });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" }
    });
  } catch (error) {
    return NextResponse.json({ message: "Product view tracking failed", details: [String(error?.message || error)] }, { status: 500 });
  }
}
