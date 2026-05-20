import { NextResponse } from "next/server";
import { gatewayFetch } from "../../../../../../lib/api";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const resolvedParams = await params;
  try {
    const body = await req.json();
    const response = await gatewayFetch(`/api/cart/items/${resolvedParams.productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" }
    });
  } catch (error) {
    return NextResponse.json({ message: "Update cart request failed", details: [String(error?.message || error)] }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const resolvedParams = await params;
  try {
    const response = await gatewayFetch(`/api/cart/items/${resolvedParams.productId}`, {
      method: "DELETE"
    });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" }
    });
  } catch (error) {
    return NextResponse.json({ message: "Remove cart item request failed", details: [String(error?.message || error)] }, { status: 500 });
  }
}
