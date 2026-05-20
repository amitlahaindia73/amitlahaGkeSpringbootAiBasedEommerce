import Link from "next/link";
import { getSessionUser } from "../lib/session";
import { requireCompletedProfile } from "../lib/user-profile";
import HomeRecommendations from "./HomeRecommendations";

// Home page keeps the admin entry flow intact and adds customer recommendations below the hero.
export default async function HomePage() {
  const sessionUser = await getSessionUser();
  await requireCompletedProfile(sessionUser);
  const loggedIn = Boolean(sessionUser);
  const isAdmin = Boolean(sessionUser?.roles?.includes("admin"));

  if (isAdmin) {
    return (
      <main style={pageStyle}>
        <section style={adminHeroStyle}>
          <div>
            <div style={eyebrowStyle}>Operations</div>
            <h1 style={{ margin: '12px 0 10px', fontSize: 46, color: '#0f172a', letterSpacing: '-0.03em' }}>Amitra Commerce Mesh</h1>
            <p style={adminTextStyle}>
              Unified control surface for catalog, orders, customer activity, AI responses, and protected admin utilities.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
            {!loggedIn ? (
              <a href="/api/auth/login" style={buttonStyle}>Login with Keycloak / Google</a>
            ) : (
              <>
                <a href="/api/auth/logout" style={buttonStyle}>Logout</a>
                <Link href="/products" style={buttonStyle}>Products</Link>
                <Link href="/cart" style={buttonStyle}>Cart</Link>
                <Link href="/orders" style={buttonStyle}>My Orders</Link>
                <Link href="/recommendations" style={buttonStyle}>Recommendations</Link>
                <Link href="/admin" style={buttonStyle}>Admin Dashboard</Link>
                <a href="/api/auth/session" style={buttonStyle}>View Session JSON</a>
                <a href="/api/bff/debug/token" style={buttonStyle}>Gateway Token Debug</a>
              </>
            )}
          </div>
        </section>

        <section style={adminGridStyle}>
          <section style={adminCardStyle}>
            <h2 style={adminHeadingStyle}>Session status</h2>
            <p style={adminBodyStyle}>{loggedIn ? "Authenticated session found in a valid HTTP-only cookie." : "You are not logged in right now."}</p>
            {sessionUser ? (
              <>
                <p style={adminBodyStyle}><strong>User:</strong> {sessionUser.name || sessionUser.username || sessionUser.sub}</p>
                <p style={adminBodyStyle}><strong>Email:</strong> {sessionUser.email || "Not present in token"}</p>
                <p style={adminBodyStyle}><strong>Roles:</strong> {sessionUser.roles.length ? sessionUser.roles.join(", ") : "No roles found in token"}</p>
                <p style={adminBodyStyle}><strong>Token expiry:</strong> {sessionUser.expiresAt ? new Date(sessionUser.expiresAt * 1000).toLocaleString() : "Not present in token"}</p>
              </>
            ) : null}
          </section>

          <section style={adminCardStyle}>
            <h2 style={adminHeadingStyle}>Admin checklist</h2>
            <ol style={{ margin: 0, paddingLeft: 22, color: '#475569', lineHeight: 1.9 }}>
              <li>Start from <code>localhost:3000</code> and sign in through Keycloak / Google.</li>
              <li>Confirm the role mapping in Session JSON or Gateway Token Debug.</li>
              <li>Review products, checkout flow, batch import status, and admin GraphQL access.</li>
              <li>Use the dashboard to validate current operational counts and recent jobs.</li>
            </ol>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={eyebrowStyle}>AI-enabled commerce</div>
          <h1 style={heroTitleStyle}>Amitra Commerce Mesh</h1>
          <p style={heroTextStyle}>
            Search products, manage your cart, place orders, and view recommendations through a connected storefront experience built by Amit Laha.
          </p>
          {!loggedIn ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
              <a href="/api/auth/login" style={primaryButtonStyle}>Login with Google</a>
              <a href="#journey" style={secondaryButtonStyle}>See Customer Flow</a>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
              <Link href="/products" style={primaryButtonStyle}>Browse Products</Link>
              <Link href="/cart" style={secondaryButtonStyle}>Open Cart</Link>
              <Link href="/orders" style={secondaryButtonStyle}>My Orders</Link>
              <Link href="/recommendations" style={secondaryButtonStyle}>Recommendations</Link>
              <a href="/api/auth/logout" style={ghostButtonStyle}>Logout</a>
            </div>
          )}
          {sessionUser ? (
            <div style={userPillStyle}>
              Signed in as <strong style={{ color: '#0f172a' }}>{sessionUser.email || sessionUser.username || sessionUser.sub}</strong>
            </div>
          ) : null}
        </div>

        <div style={spotlightCardStyle}>
          <div style={spotlightBadgeStyle}>Live customer journey</div>
          <div style={spotlightMetricStyle}>Search. Buy. Track.</div>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.8 }}>
            Catalog, cart, orders, and recommendation experiences are connected to the same gateway-backed platform and protected sign-in flow.
          </p>
          <div style={spotlightGridStyle}>
            <div style={spotlightTileStyle}><strong>Catalog</strong><span>Search, filters, stock, and imagery</span></div>
            <div style={spotlightTileStyle}><strong>Cart</strong><span>Quantity controls and checkout</span></div>
            <div style={spotlightTileStyle}><strong>Orders</strong><span>Payment and delivery visibility</span></div>
            <div style={spotlightTileStyle}><strong>AI</strong><span>Recommendation ranking with enriched explanations</span></div>
          </div>
        </div>
      </section>

      {loggedIn && sessionUser?.sub ? <HomeRecommendations userId={sessionUser.sub} /> : null}

      <section id="journey" style={sectionStyle}>
        <div style={sectionHeadingStyle}>
          <h2 style={{ margin: 0 }}>Customer journey</h2>
          <p style={sectionSubStyle}>Every screen focuses on the customer path while keeping admin utilities and internal diagnostics out of the storefront.</p>
        </div>
        <div style={featureGridStyle}>
          {FEATURES.map((feature) => (
            <article key={feature.title} style={featureCardStyle}>
              <div style={featureIconStyle}>{feature.icon}</div>
              <h3 style={{ margin: '0 0 10px', fontSize: 22 }}>{feature.title}</h3>
              <p style={{ margin: 0, color: '#475569', lineHeight: 1.8 }}>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const FEATURES = [
  { icon: '🛍️', title: 'Catalog experience', text: 'Fast product browsing with keyword search, category filters, stock visibility, and image-backed cards.' },
  { icon: '🛒', title: 'Checkout flow', text: 'Cart updates, pricing summary, and order creation stay simple while the backend continues through payment and delivery orchestration.' },
  { icon: '📦', title: 'Status tracking', text: 'Orders, payment state, and delivery state stay visible from one place after login.' }
];

const pageStyle = { maxWidth: 1240, margin: '0 auto' };
const eyebrowStyle = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, background: '#eef4ff', color: '#2563eb', fontSize: 13, letterSpacing: 0.3 };
const adminHeroStyle = { display: 'grid', gap: 20, marginBottom: 22, padding: 28, borderRadius: 28, background: 'linear-gradient(135deg, #ffffff, #f8fbff)', border: '1px solid #dbe4f0' };
const adminGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 };
const adminCardStyle = { background: '#ffffff', padding: 22, borderRadius: 22, border: '1px solid #dbe4f0', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)' };
const adminHeadingStyle = { marginTop: 0, color: '#0f172a' };
const adminBodyStyle = { color: '#475569', lineHeight: 1.8 };
const adminTextStyle = { margin: 0, color: '#475569', lineHeight: 1.8, maxWidth: 900 };
const buttonStyle = { display: 'inline-block', padding: '11px 16px', borderRadius: 14, background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: 'white', textDecoration: 'none', fontWeight: 700, boxShadow: '0 10px 24px rgba(37, 99, 235, 0.22)' };
const heroStyle = { display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 24, alignItems: 'stretch', background: 'linear-gradient(135deg, #ffffff, #f7fbff)', border: '1px solid rgba(96,165,250,0.16)', borderRadius: 30, padding: 34, boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)' };
const heroTitleStyle = { margin: '16px 0 0', fontSize: 58, lineHeight: 1.02, color: '#0f172a', letterSpacing: '-0.04em' };
const heroTextStyle = { marginTop: 18, maxWidth: 760, color: '#475569', fontSize: 18, lineHeight: 1.8 };
const primaryButtonStyle = { display: 'inline-block', padding: '13px 18px', borderRadius: 14, textDecoration: 'none', background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', fontWeight: 700 };
const secondaryButtonStyle = { display: 'inline-block', padding: '13px 18px', borderRadius: 14, textDecoration: 'none', background: '#ffffff', color: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', fontWeight: 700 };
const ghostButtonStyle = { ...secondaryButtonStyle, background: '#f8fafc' };
const userPillStyle = { marginTop: 18, display: 'inline-flex', gap: 6, padding: '10px 14px', borderRadius: 999, background: '#eef4ff', color: '#2563eb', border: '1px solid #d7e3ff' };
const spotlightCardStyle = { background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 };
const spotlightBadgeStyle = { color: '#4f46e5', fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700 };
const spotlightMetricStyle = { fontSize: 32, fontWeight: 800, color: '#0f172a' };
const spotlightGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 6 };
const spotlightTileStyle = { display: 'flex', flexDirection: 'column', gap: 6, padding: 14, borderRadius: 18, background: '#f8fafc', color: '#475569', fontSize: 14, border: '1px solid #e2e8f0' };
const sectionStyle = { marginTop: 30 };
const sectionHeadingStyle = { marginBottom: 18 };
const sectionSubStyle = { marginTop: 10, color: '#475569', lineHeight: 1.7, maxWidth: 760 };
const featureGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 };
const featureCardStyle = { background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: 22, padding: 22, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)' };
const featureIconStyle = { width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#eef4ff', color: '#2563eb', fontSize: 24, marginBottom: 14, border: '1px solid #d7e3ff' };
