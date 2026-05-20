// Recommendations page for Amitra Commerce Mesh.
import { gatewayFetch } from "../../lib/api";
import { getSessionUser } from "../../lib/session";
import { requireCompletedProfile } from "../../lib/user-profile";

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
    (recommendations || []).map(async (item) => {
      const productId = item?.productId;

      if (!productId) {
        return { ...item, product: null };
      }

      try {
        const response = await gatewayFetch(`/api/products/${encodeURIComponent(productId)}`);
        if (!response.ok) {
          return { ...item, product: null };
        }

        const payload = await response.json();
        return {
          ...item,
          product: payload?.data || null
        };
      } catch {
        return { ...item, product: null };
      }
    })
  );

  return enriched;
}

function buildStatusMessage(response) {
  if (!response) {
    return "Unable to load recommendations right now.";
  }

  if (response.status === 401) {
    return "Unauthorized. Please log in again because the token is missing or expired.";
  }

  if (response.status === 403) {
    return "Forbidden. The current token does not allow access to recommendations.";
  }

  return `Request failed with status ${response.status}.`;
}

function formatCurrency(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(amount);
}

export default async function RecommendationsPage() {
  const sessionUser = await getSessionUser();
  await requireCompletedProfile(sessionUser);
  const userId = sessionUser?.sub || "experience-user";

  let payload = { recommendations: [] };
  let errorMessage = "";
  let mode = "base";

  try {
    const result = await fetchRecommendationPayload(userId);
    mode = result.mode;

    if (result.response?.ok && result.payload) {
      payload = result.payload;
      payload.recommendations = await enrichRecommendations(result.payload.recommendations || []);
    } else {
      errorMessage = buildStatusMessage(result.response);
    }
  } catch {
    errorMessage = "Gateway is temporarily unavailable. Please wait a moment and refresh.";
  }

  const recommendations = payload?.recommendations || [];
  const usesGemini = mode === "explanations" && payload?.source === "gemini";

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <div style={pillStyle}>AI Recommendations</div>
          <h1 style={{ margin: "12px 0 8px", fontSize: 46 }}>Recommendations</h1>
          <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.8, maxWidth: 780 }}>
            Personalized suggestions generated from your recommendation engine and enriched with AI explanations when available.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/" style={secondaryButtonStyle}>Back</a>
          <a href="/products" style={secondaryButtonStyle}>Products</a>
          <a href="/orders" style={secondaryButtonStyle}>My Orders</a>
        </div>
      </section>

      <section style={summaryPanelStyle}>
        <div style={summaryTileStyle}>
          <span style={summaryLabelStyle}>User ID</span>
          <strong style={summaryValueStyle}>{userId}</strong>
        </div>
        <div style={summaryTileStyle}>
          <span style={summaryLabelStyle}>Recommendation source</span>
          <strong style={summaryValueStyle}>{payload?.source || "n/a"}</strong>
        </div>
        <div style={summaryTileStyle}>
          <span style={summaryLabelStyle}>Strategy</span>
          <strong style={summaryValueStyle}>{payload?.strategy || (usesGemini ? "gemini-enriched" : "n/a")}</strong>
        </div>
        <div style={summaryTileStyle}>
          <span style={summaryLabelStyle}>AI explanation</span>
          <strong style={summaryValueStyle}>{usesGemini ? "Enabled" : "Fallback / Base"}</strong>
        </div>
      </section>

      {errorMessage ? <div style={errorStyle}>{errorMessage}</div> : null}

      {!errorMessage && recommendations.length === 0 ? (
        <div style={emptyStateStyle}>No recommendations are available yet. View products or place an order to generate more behavior data.</div>
      ) : null}

      <div style={{ marginTop: 20, display: "grid", gap: 18 }}>
        {recommendations.map((item, index) => {
          const product = item?.product || null;
          const price = formatCurrency(product?.price);
          const score = Number(item?.score || 0);

          return (
            <article key={`${item?.productId || "unknown"}-${index}`} style={cardStyle}>
              <div style={cardContentStyle}>
                <div style={imageWrapperStyle}>
                  <img
                    src={product?.imageUrl || "/product-images/default.svg"}
                    alt={product?.name || item?.productId || "Recommended product"}
                    style={imageStyle}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={headerRowStyle}>
                    <div>
                      <div style={rankBadgeStyle}>#{index + 1}</div>
                      <h2 style={{ margin: "12px 0 6px", fontSize: 34, color: "#f8fafc" }}>
                        {product?.name || item?.productId || "Recommended Product"}
                      </h2>
                      <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
                        Product ID: <strong style={{ color: "#e2e8f0" }}>{item?.productId || "N/A"}</strong>
                      </p>
                    </div>
                    <div style={scoreBadgeStyle}>Score {score}</div>
                  </div>

                  <p style={{ marginTop: 16, color: "#cbd5e1", lineHeight: 1.8 }}>
                    {product?.description || item?.whyRecommended || item?.reason || "Recommended based on your current behavior signals."}
                  </p>

                  <div style={metaGridStyle}>
                    <div style={metaTileStyle}><span style={metaLabelStyle}>Category</span><strong>{product?.category || "N/A"}</strong></div>
                    <div style={metaTileStyle}><span style={metaLabelStyle}>Price</span><strong>{price || "N/A"}</strong></div>
                    <div style={metaTileStyle}><span style={metaLabelStyle}>Available</span><strong>{product?.availableQuantity ?? "N/A"}</strong></div>
                  </div>

                  <div style={insightGridStyle}>
                    <div style={insightTileStyle}>
                      <span style={insightLabelStyle}>Why recommended</span>
                      <p style={insightTextStyle}>{item?.whyRecommended || item?.reason || "Derived from local behavior events."}</p>
                    </div>
                    <div style={insightTileStyle}>
                      <span style={insightLabelStyle}>Customer intent</span>
                      <p style={insightTextStyle}>{item?.customerIntent || "Behavior-driven ranking"}</p>
                    </div>
                    <div style={insightTileStyle}>
                      <span style={insightLabelStyle}>Recommended use case</span>
                      <p style={insightTextStyle}>{item?.recommendedUseCase || "Suitable based on similar interactions and product affinity."}</p>
                    </div>
                    <div style={insightTileStyle}>
                      <span style={insightLabelStyle}>Cross-sell hint</span>
                      <p style={insightTextStyle}>{item?.crossSellHint || "Explore related accessories and complementary items."}</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
                    <a href="/products" style={primaryButtonStyle}>Explore Catalog</a>
                    {product?.id ? <a href={`/products?keyword=${encodeURIComponent(product.name || product.id)}`} style={secondaryButtonStyle}>View Similar</a> : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <details style={debugPanelStyle}>
        <summary style={{ cursor: "pointer", fontWeight: 700, color: "#cbd5e1" }}>Debug payload</summary>
        <pre style={debugPreStyle}>{JSON.stringify(payload, null, 2)}</pre>
      </details>
    </main>
  );
}

const pageStyle = { maxWidth: 1240, margin: "0 auto" };
const heroStyle = { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 18 };
const pillStyle = { display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "rgba(59,130,246,0.14)", color: "#93c5fd", fontSize: 13, letterSpacing: 0.3 };
const summaryPanelStyle = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginTop: 20, marginBottom: 18 };
const summaryTileStyle = { padding: 18, borderRadius: 20, background: "rgba(15,23,42,0.72)", border: "1px solid rgba(148,163,184,0.14)" };
const summaryLabelStyle = { display: "block", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, color: "#94a3b8", marginBottom: 10 };
const summaryValueStyle = { color: "#f8fafc", fontSize: 16, wordBreak: "break-word" };
const primaryButtonStyle = { display: "inline-block", padding: "12px 16px", borderRadius: 12, background: "linear-gradient(135deg, #2563eb, #4f46e5)", color: "white", textDecoration: "none", border: "none", fontWeight: 700 };
const secondaryButtonStyle = { display: "inline-block", padding: "12px 16px", borderRadius: 12, background: "rgba(15,23,42,0.72)", color: "#e2e8f0", textDecoration: "none", border: "1px solid rgba(148,163,184,0.18)", fontWeight: 700 };
const cardStyle = { background: "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(17,24,39,0.92))", padding: 20, borderRadius: 24, border: "1px solid rgba(148,163,184,0.14)", boxShadow: "0 20px 45px rgba(2,6,23,0.18)" };
const cardContentStyle = { display: "flex", gap: 22, alignItems: "stretch", flexWrap: "wrap" };
const imageWrapperStyle = { width: 240, minWidth: 240, height: 240, background: "#f8fafc", borderRadius: 20, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" };
const imageStyle = { width: "100%", height: "100%", objectFit: "cover" };
const headerRowStyle = { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" };
const rankBadgeStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 52, height: 32, padding: "0 12px", borderRadius: 999, background: "rgba(59,130,246,0.14)", color: "#93c5fd", fontWeight: 800 };
const scoreBadgeStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 110, height: 46, borderRadius: 16, background: "rgba(34,197,94,0.16)", color: "#86efac", fontWeight: 800, fontSize: 18 };
const metaGridStyle = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 18 };
const metaTileStyle = { padding: 14, borderRadius: 16, background: "rgba(2,6,23,0.58)", color: "#e2e8f0", display: "flex", flexDirection: "column", gap: 6 };
const metaLabelStyle = { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, color: "#94a3b8" };
const insightGridStyle = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 18 };
const insightTileStyle = { padding: 16, borderRadius: 18, background: "rgba(15,23,42,0.7)", border: "1px solid rgba(148,163,184,0.12)" };
const insightLabelStyle = { display: "block", marginBottom: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, color: "#93c5fd" };
const insightTextStyle = { margin: 0, color: "#e2e8f0", lineHeight: 1.7 };
const emptyStateStyle = { marginTop: 18, padding: 18, borderRadius: 18, background: "rgba(15,23,42,0.72)", border: "1px solid rgba(148,163,184,0.14)", color: "#cbd5e1" };
const errorStyle = { marginTop: 16, padding: 16, border: "1px solid #fecaca", borderRadius: 16, color: "#b91c1c", background: "#fef2f2" };
const debugPanelStyle = { marginTop: 24, padding: 18, borderRadius: 18, background: "rgba(2,6,23,0.58)", border: "1px solid rgba(148,163,184,0.12)" };
const debugPreStyle = { marginTop: 14, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#cbd5e1" };
