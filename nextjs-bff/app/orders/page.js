// Orders page for Amitra Commerce Mesh.
import Link from "next/link";
import { gatewayFetch } from "../../lib/api";
import { getSessionUser } from "../../lib/session";
import { requireCompletedProfile } from "../../lib/user-profile";
import OrderSupportPanel from "./OrderSupportPanel";

export const dynamic = "force-dynamic";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOrdersWithRecovery(createdOrderNumber) {
  const attempts = createdOrderNumber ? 6 : 1;
  let lastErrorMessage = "";

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await gatewayFetch("/api/orders/me", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        lastErrorMessage = payload?.message || `Gateway returned status ${response.status}.`;
      } else {
        const orders = Array.isArray(payload?.data) ? payload.data : [];
        if (!createdOrderNumber || orders.some((order) => order?.orderNumber === createdOrderNumber)) {
          return { orders, errorMessage: "" };
        }

        if (attempt < attempts) {
          await sleep(800);
          continue;
        }

        return {
          orders,
          errorMessage: createdOrderNumber
            ? "Your new order is being finalized. It should appear automatically in a moment."
            : "",
        };
      }
    } catch (error) {
      lastErrorMessage = "Order service is temporarily unavailable. Please refresh in a moment.";
    }

    if (attempt < attempts) {
      await sleep(800);
    }
  }

  return { orders: [], errorMessage: lastErrorMessage };
}

export default async function OrdersPage({ searchParams }) {
  const sessionUser = await getSessionUser();
  await requireCompletedProfile(sessionUser);
  const params = await searchParams;
  const created = params?.created || "";

  if (!sessionUser) {
    return (
      <main style={pageStyle}>
        <h1>My Orders</h1>
        <p>Please sign in first.</p>
        <a href="/api/auth/login" style={primaryButtonStyle}>Login</a>
      </main>
    );
  }

  const { orders, errorMessage } = await fetchOrdersWithRecovery(created);

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <div style={pillStyle}>Order history</div>
          <h1 style={{ margin: '12px 0 8px', fontSize: 44, letterSpacing: '-0.04em', color: '#0f172a' }}>My Orders</h1>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.8 }}>Track order, payment, and delivery status from one place.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={secondaryButtonStyle}>Home</Link>
          <Link href="/products" style={secondaryButtonStyle}>Products</Link>
          <Link href="/cart" style={secondaryButtonStyle}>Cart</Link>
        </div>
      </section>

      {created ? <div style={successStyle}>Order created successfully: <strong>{created}</strong></div> : null}
      {errorMessage ? <div style={errorStyle}>{errorMessage}</div> : null}

      <div style={{ display: "grid", gap: 16, marginTop: 18 }}>
        {orders.length ? orders.map((order) => (
          <section key={order.orderNumber} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 28 }}>{order.orderNumber}</h2>
                <p style={{ marginTop: 12, color: '#475569' }}><strong>Created:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
              <div style={amountBadgeStyle}>${Number(order.totalAmount || 0).toFixed(2)}</div>
            </div>
            <div style={statusRowStyle}>
              <div style={statusTileStyle}><span style={labelStyle}>Order</span><strong>{order.orderStatus}</strong></div>
              <div style={statusTileStyle}><span style={labelStyle}>Payment</span><strong>{order.paymentStatus}</strong></div>
              <div style={statusTileStyle}><span style={labelStyle}>Delivery</span><strong>{order.deliveryStatus}</strong></div>
            </div>
            <div style={{ marginTop: 12 }}>
              <strong>Delivery Address</strong>
              <p style={{ marginTop: 8, color: '#475569', lineHeight: 1.7 }}>
                {order.deliveryRecipientName} ({order.deliveryPhoneNumber})<br />
                {order.deliveryAddressLine1}
                {order.deliveryAddressLine2 ? <><br />{order.deliveryAddressLine2}</> : null}
                <br />{order.deliveryCity}, {order.deliveryState} {order.deliveryPostalCode}
                <br />{order.deliveryCountry}
              </p>
            </div>
            <div style={{ marginTop: 12 }}>
              <strong>Items</strong>
              <ul style={{ marginTop: 10 }}>
                {(order.items || []).map((item) => (
                  <li key={`${order.orderNumber}-${item.productId}`} style={{ marginBottom: 8 }}>
                    {item.productName} × {item.quantity} — ${Number(item.lineTotal || 0).toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
            <OrderSupportPanel order={order} />
          </section>
        )) : (
          <section style={cardStyle}>
            <h2>No orders yet</h2>
            <p style={{ color: '#475569' }}>
              {created
                ? 'Your new order is being finalized. Stay on this page for a moment and it should appear automatically.'
                : 'Your orders will appear here after a successful checkout.'}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

const pageStyle = { maxWidth: 1100, margin: '0 auto' };
const heroStyle = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' };
const pillStyle = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, background: '#f2ecff', color: '#c4b5fd', fontSize: 13, letterSpacing: 0.3 };
const primaryButtonStyle = { display: 'inline-block', padding: '12px 16px', borderRadius: 14, background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: 'white', textDecoration: 'none', fontWeight: 700, boxShadow: '0 10px 24px rgba(37, 99, 235, 0.22)' };
const secondaryButtonStyle = { display: 'inline-block', padding: '12px 16px', borderRadius: 14, background: '#ffffff', color: '#0f172a', textDecoration: 'none', border: '1px solid #dbe4f0', fontWeight: 700, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' };
const cardStyle = { background: '#ffffff', padding: 22, borderRadius: 24, border: '1px solid #dbe4f0', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)' };
const amountBadgeStyle = { minWidth: 120, height: 54, display: 'grid', placeItems: 'center', borderRadius: 18, background: '#e8f5ec', color: '#15803d', fontWeight: 800, fontSize: 22, border: '1px solid #cfe8d7' };
const statusRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 18 };
const statusTileStyle = { display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 16px', borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0' };
const labelStyle = { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, color: '#64748b' };
const errorStyle = { marginTop: 16, padding: 16, border: '1px solid #fecaca', borderRadius: 16, color: '#b91c1c', background: '#fef2f2' };
const successStyle = { marginTop: 16, padding: 16, border: '1px solid #bbf7d0', borderRadius: 16, color: '#166534', background: '#f0fdf4' };
