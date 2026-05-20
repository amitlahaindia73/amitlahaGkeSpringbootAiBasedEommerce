"use client";

import Link from "next/link";
import { useState } from "react";

export default function ProductActionButtons({ product, sessionUser }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const userId = sessionUser?.sub || sessionUser?.username || "anonymous-user";
  const isAdmin = Boolean(sessionUser?.roles?.includes("admin"));

  async function trackView() {
    try {
      setLoading(true);
      setMessage("Tracking product view...");
      const response = await fetch(`/api/bff/products/viewed/${product.id}?userId=${encodeURIComponent(userId)}`, { method: "POST" });
      const text = await response.text();
      setMessage(response.ok ? "Product view tracked successfully." : `Track view failed: ${text}`);
    } catch {
      setMessage("Track view failed: Network or server error.");
    } finally {
      setLoading(false);
    }
  }

  async function addToCart() {
    try {
      setLoading(true);
      setMessage("Adding item to cart...");
      const response = await fetch(`/api/bff/cart/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(`Add to cart failed: ${payload?.message || "Unknown error"}`);
        return;
      }
      const totalItems = payload?.data?.totalItems ?? 0;
      setMessage(`Added to cart. Cart now has ${totalItems} item(s).`);
    } catch {
      setMessage("Add to cart failed: Network or server error.");
    } finally {
      setLoading(false);
    }
  }

  async function checkout() {
    try {
      setLoading(true);
      setMessage("Processing direct checkout...");
      const response = await fetch(`/api/bff/payments/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: `ORD-${Date.now()}`,
          userId,
          productId: product.id,
          amount: product.price
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(`Direct checkout failed: ${payload?.message || "Unknown error"}`);
        return;
      }
      const txn = payload?.data;
      setMessage(`Direct checkout completed. Transaction id: ${txn?.id}, order: ${txn?.orderId}`);
    } catch {
      setMessage("Direct checkout failed: Network or server error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 16 }}>
        {isAdmin ? (
          <button type="button" onClick={trackView} style={secondaryButtonStyle} disabled={loading || !product?.id}>
            {loading ? "Please wait..." : "Track Product View"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={addToCart}
          style={primaryButtonStyle}
          disabled={loading || !product?.id || (product?.availableQuantity ?? 0) <= 0}
        >
          {loading ? "Please wait..." : "Add to Cart"}
        </button>
        {isAdmin ? (
          <button
            type="button"
            onClick={checkout}
            style={successButtonStyle}
            disabled={loading || !product?.id || (product?.availableQuantity ?? 0) <= 0}
          >
            {loading ? "Please wait..." : "Legacy Direct Checkout"}
          </button>
        ) : null}
        <Link href="/cart" style={linkButtonStyle}>View Cart</Link>
      </div>
      {message ? <p style={{ marginTop: 12, color: '#475569' }}>{message}</p> : null}
    </div>
  );
}

const primaryButtonStyle = {
  padding: "11px 16px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #2563eb, #4f46e5)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700
};

const successButtonStyle = {
  padding: "11px 16px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #16a34a, #0f766e)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700
};

const secondaryButtonStyle = {
  padding: "11px 16px",
  borderRadius: 14,
  border: "1px solid #dbe4f0",
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 700,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)"
};

const linkButtonStyle = {
  display: "inline-block",
  padding: "11px 16px",
  borderRadius: 14,
  background: "#eef4ff",
  color: "#2563eb",
  textDecoration: "none",
  border: "1px solid #d7e3ff",
  fontWeight: 700
};
