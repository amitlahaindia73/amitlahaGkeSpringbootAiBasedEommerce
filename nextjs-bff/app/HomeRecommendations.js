import { gatewayFetch } from "../lib/api";

// Customer home-page recommendation strip.
async function fetchRecommendationPayload(userId) {
  const explanationsPath = `/api/recommendations/${encodeURIComponent(userId)}/explanations`;
  const basePath = `/api/recommendations/${encodeURIComponent(userId)}`;

  let response = await gatewayFetch(explanationsPath);
  let payload = null;
  let mode = "explanations";

  if (response.ok) {
    payload = await response.json();
  } else if (response.status === 401 || response.status === 403) {
    return { response, payload: null, mode };
  } else {
    response = await gatewayFetch(basePath);
    mode = "base";
    if (response.ok) {
      payload = await response.json();
    }
  }

  return { response, payload, mode };
}

async function enrichRecommendations(recommendations) {
  const enriched = await Promise.all(
    (recommendations || []).slice(0, 4).map(async (item) => {
      const productId = item?.productId;
      if (!productId) return { ...item, product: null };

      try {
        const response = await gatewayFetch(`/api/products/${encodeURIComponent(productId)}`);
        if (!response.ok) return { ...item, product: null };
        const payload = await response.json();
        return { ...item, product: payload?.data || null };
      } catch {
        return { ...item, product: null };
      }
    })
  );

  return enriched;
}

function formatCurrency(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(amount);
}

export default async function HomeRecommendations({ userId }) {
  let payload = { recommendations: [] };
  let mode = "base";

  try {
    const result = await fetchRecommendationPayload(userId);
    mode = result.mode;

    if (result.response?.ok && result.payload) {
      payload = result.payload;
      payload.recommendations = await enrichRecommendations(result.payload.recommendations || []);
    }
  } catch {
    // Keep the homepage quiet if the recommendation service is unavailable.
  }

  const recommendations = payload?.recommendations || [];
  const usesGemini = mode === "explanations" && payload?.source === "gemini";

  if (!recommendations.length) {
    return (
      <section style={sectionStyle}>
        <div style={headerStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: 36, color: '#0f172a' }}>Recommended for You</h2>
            <p style={subTextStyle}>Browse more products and place an order to build stronger recommendation signals.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, fontSize: 36, color: '#0f172a' }}>Recommended for You</h2>
          <p style={subTextStyle}>Suggestions are ranked from your activity and enriched with explanatory text when available.</p>
        </div>
        <div style={metaStyle}>
          <span style={metaBadgeStyle}>{payload?.source || 'engine'}</span>
          <span style={metaBadgeStyle}>{usesGemini ? 'AI enriched' : (payload?.strategy || 'Behavior ranking')}</span>
        </div>
      </div>

      <div style={gridStyle}>
        {recommendations.map((item, index) => {
          const product = item?.product || null;
          const price = formatCurrency(product?.price);
          return (
            <article key={`${item?.productId || 'unknown'}-${index}`} style={cardStyle}>
              <div style={rankStyle}>#{index + 1}</div>
              <div style={imageShellStyle}>
                <img
                  src={product?.imageUrl || '/product-images/default.svg'}
                  alt={product?.name || item?.productId || 'Recommended product'}
                  style={imageStyle}
                />
              </div>
              <h3 style={{ margin: '14px 0 6px', fontSize: 24, color: '#0f172a' }}>{product?.name || item?.productId || 'Recommended Product'}</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Product ID: <strong style={{ color: '#0f172a' }}>{item?.productId || 'N/A'}</strong></p>
              <p style={{ margin: '14px 0 0', color: '#475569', lineHeight: 1.75 }}>{item?.whyRecommended || item?.reason || product?.description || 'Recommended based on recent catalog and order activity.'}</p>

              <div style={tileGridStyle}>
                <div style={tileStyle}><span style={tileLabelStyle}>Score</span><strong>{item?.score ?? 'N/A'}</strong></div>
                <div style={tileStyle}><span style={tileLabelStyle}>Price</span><strong>{price || 'N/A'}</strong></div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
                <a href="/products" style={primaryButtonStyle}>Browse Products</a>
                {product?.name ? <a href={`/products?keyword=${encodeURIComponent(product.name)}`} style={secondaryButtonStyle}>View Similar</a> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

const sectionStyle = { marginTop: 30, background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: 28, padding: 28, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 20 };
const subTextStyle = { margin: '10px 0 0', color: '#64748b', lineHeight: 1.7, maxWidth: 760 };
const metaStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const metaBadgeStyle = { display: 'inline-flex', padding: '10px 14px', borderRadius: 999, background: 'rgba(37,99,235,0.14)', color: '#2563eb', fontSize: 13, border: '1px solid rgba(59,130,246,0.18)' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 };
const cardStyle = { background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: 22, padding: 22, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)' };
const rankStyle = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, background: '#eef4ff', color: '#2563eb', fontSize: 13 };
const imageShellStyle = { marginTop: 14, height: 220, background: '#f8fafc', borderRadius: 20, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const imageStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const tileGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 };
const tileStyle = { display: 'flex', flexDirection: 'column', gap: 6, padding: 12, borderRadius: 16, background: '#f8fafc', color: '#475569', fontSize: 14 };
const tileLabelStyle = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 };
const primaryButtonStyle = { display: 'inline-block', padding: '13px 18px', borderRadius: 14, textDecoration: 'none', background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', fontWeight: 700 };
const secondaryButtonStyle = { display: 'inline-block', padding: '13px 18px', borderRadius: 14, textDecoration: 'none', background: '#ffffff', color: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', fontWeight: 700 };
