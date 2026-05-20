// Cart page for Amitra Commerce Mesh.
import Link from "next/link";
import { gatewayFetch } from "../../lib/api";
import { getSessionUser } from "../../lib/session";
import { requireCompletedProfile } from "../../lib/user-profile";
import CartActions from "./cart-actions";

export const dynamic = "force-dynamic";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCartWithRecovery() {
  const attempts = 4;
  let lastErrorMessage = "";

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await gatewayFetch("/api/cart", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        lastErrorMessage = payload?.message || `Gateway returned status ${response.status}.`;
      } else {
        const cart = payload?.data || { items: [], subtotalAmount: 0, totalItems: 0, currency: "USD" };
        const hasItems = Array.isArray(cart?.items) && cart.items.length > 0;
        if (hasItems || attempt === attempts) {
          return { cart, errorMessage: "" };
        }
      }
    } catch (error) {
      lastErrorMessage = "Cart service is temporarily unavailable. Please refresh in a moment.";
    }

    if (attempt < attempts) {
      await sleep(500);
    }
  }

  return {
    cart: { items: [], subtotalAmount: 0, totalItems: 0, currency: "USD" },
    errorMessage: lastErrorMessage,
  };
}

export default async function CartPage() {
  const sessionUser = await getSessionUser();
  await requireCompletedProfile(sessionUser);

  if (!sessionUser) {
    return (
      <main style={pageStyle}>
        <h1>Cart</h1>
        <p>Please sign in first.</p>
        <a href="/api/auth/login" style={primaryButtonStyle}>Login</a>
      </main>
    );
  }

  const { cart, errorMessage } = await fetchCartWithRecovery();

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <div style={pillStyle}>Your cart</div>
          <h1 style={{ margin: '12px 0 8px', fontSize: 44, letterSpacing: '-0.04em', color: '#0f172a' }}>Shopping Cart</h1>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.8 }}>Review selected items, adjust quantities, and complete checkout when you are ready.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={secondaryButtonStyle}>Home</Link>
          <Link href="/products" style={secondaryButtonStyle}>Products</Link>
          <Link href="/orders" style={secondaryButtonStyle}>My Orders</Link>
        </div>
      </section>

      <p style={{ marginTop: 16, color: '#2563eb' }}>Signed in as <strong style={{ color: '#0f172a' }}>{sessionUser.email || sessionUser.username || sessionUser.sub}</strong></p>
      {errorMessage ? <div style={errorStyle}>{errorMessage}</div> : null}

      <section style={summaryCardStyle}>
        <div>
          <span style={summaryLabelStyle}>Total Items</span>
          <div style={summaryValueStyle}>{cart.totalItems}</div>
        </div>
        <div>
          <span style={summaryLabelStyle}>Subtotal</span>
          <div style={summaryValueStyle}>${Number(cart.subtotalAmount || 0).toFixed(2)}</div>
        </div>
        <div>
          <span style={summaryLabelStyle}>Currency</span>
          <div style={summaryValueStyle}>{cart.currency || 'USD'}</div>
        </div>
      </section>

      <div style={{ display: 'grid', gap: 16, marginTop: 18 }}>
        {cart.items?.length ? cart.items.map((item) => (
          <article key={item.productId} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 28 }}>{item.productName}</h2>
                <p style={{ marginTop: 14, color: '#475569' }}><strong>SKU:</strong> {item.sku || 'N/A'}</p>
              </div>
              <div style={lineTotalStyle}>${Number(item.lineTotal || 0).toFixed(2)}</div>
            </div>
            <div style={metaRowStyle}>
              <div style={metaChipStyle}><span style={metaLabelStyle}>Quantity</span><strong>{item.quantity}</strong></div>
              <div style={metaChipStyle}><span style={metaLabelStyle}>Unit Price</span><strong>${Number(item.unitPrice || 0).toFixed(2)}</strong></div>
            </div>
            <CartActions productId={item.productId} quantity={item.quantity} />
          </article>
        )) : (
          <section style={cardStyle}>
            <h2>Your cart is empty</h2>
            <p style={{ color: '#475569' }}>Add products to the cart from the catalog page, then come back here to check out.</p>
          </section>
        )}
      </div>

      {cart.items?.length ? <CheckoutCard cart={cart} /> : null}
    </main>
  );
}

function CheckoutCard({ cart }) {
  return (
    <section style={{ ...cardStyle, marginTop: 24 }}>
      <h2 style={{ marginTop: 0 }}>Checkout</h2>
      <p style={{ color: '#475569', lineHeight: 1.7 }}>Your order will be created from the cart and routed through the existing order, payment, and delivery flow.</p>
      <CartActions checkout subtotalAmount={Number(cart.subtotalAmount || 0)} />
    </section>
  );
}

const pageStyle = { maxWidth: 1100, margin: '0 auto' };
const heroStyle = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' };
const pillStyle = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, background: 'rgba(34,197,94,0.14)', color: '#15803d', fontSize: 13, letterSpacing: 0.3 };
const primaryButtonStyle = { display: 'inline-block', padding: '12px 16px', borderRadius: 14, background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: 'white', textDecoration: 'none', fontWeight: 700, boxShadow: '0 10px 24px rgba(37, 99, 235, 0.22)' };
const secondaryButtonStyle = { display: 'inline-block', padding: '12px 16px', borderRadius: 14, background: '#ffffff', color: '#0f172a', textDecoration: 'none', border: '1px solid #dbe4f0', fontWeight: 700, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' };
const summaryCardStyle = { marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, background: '#ffffff', borderRadius: 24, padding: 22, border: '1px solid #dbe4f0', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)' };
const summaryLabelStyle = { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, color: '#64748b' };
const summaryValueStyle = { marginTop: 8, fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' };
const cardStyle = { background: '#ffffff', padding: 22, borderRadius: 24, border: '1px solid #dbe4f0', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)' };
const lineTotalStyle = { minWidth: 120, height: 54, display: 'grid', placeItems: 'center', borderRadius: 16, background: '#e8f5ec', color: '#2563eb', fontWeight: 800, fontSize: 22 };
const metaRowStyle = { display: 'flex', gap: 12, flexWrap: 'wrap', margin: '16px 0' };
const metaChipStyle = { display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' };
const metaLabelStyle = { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, color: '#64748b' };
const errorStyle = { marginTop: 16, padding: 16, border: '1px solid #dc2626', borderRadius: 16, color: '#fff', background: 'rgba(127,29,29,0.22)' };
