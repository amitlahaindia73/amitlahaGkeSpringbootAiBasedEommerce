// Products page for Amitra Commerce Mesh.
import ProductActionButtons from "./product-actions";
import { gatewayFetch } from "../../lib/api";
import { getSessionUser } from "../../lib/session";
import { requireCompletedProfile } from "../../lib/user-profile";

const PAGE_SIZE = 10;

function buildQueryString(keyword, category, page) {
  const query = new URLSearchParams();
  if (keyword) query.set("keyword", keyword);
  if (category) query.set("category", category);
  query.set("page", String(page));
  query.set("size", String(PAGE_SIZE));
  return query.toString();
}

function buildPageHref(keyword, category, page) {
  const query = new URLSearchParams();
  if (keyword) query.set("keyword", keyword);
  if (category) query.set("category", category);
  query.set("page", String(page));
  return `/products?${query.toString()}`;
}

export default async function ProductsPage({ searchParams }) {
  const sessionUser = await getSessionUser();
  await requireCompletedProfile(sessionUser);
  const params = await searchParams;
  const keyword = params?.keyword || "";
  const category = params?.category || "";
  const currentPage = Math.max(Number(params?.page || 1), 1);

  let products = [];
  let errorMessage = "";

  try {
    const currentQuery = buildQueryString(keyword, category, currentPage);
    const response = await gatewayFetch(`/api/products?${currentQuery}`);
    const payload = await response.json();

    if (response.ok) {
      products = payload?.data || [];
    } else {
      errorMessage = payload?.message || `Gateway returned status ${response.status}.`;
    }
  } catch (error) {
    errorMessage = "Gateway is temporarily unavailable. Please wait a moment and refresh.";
  }

  const hasPrevious = currentPage > 1;
  const hasNext = products.length === PAGE_SIZE;

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <div style={pillStyle}>Customer Catalog</div>
          <h1 style={{ margin: '12px 0 8px', fontSize: 46, letterSpacing: '-0.04em', color: '#0f172a' }}>Products</h1>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.8, maxWidth: 760 }}>
            Browse a curated catalog with stock visibility, clean imagery, and a simple buying experience.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/" style={secondaryButtonStyle}>Back</a>
          <a href="/cart" style={secondaryButtonStyle}>Cart</a>
          <a href="/orders" style={secondaryButtonStyle}>My Orders</a>
        </div>
      </section>

      <section style={toolbarStyle}>
        <form style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1 }}>
          <input name="keyword" defaultValue={keyword} placeholder="Search by product name" style={inputStyle} />
          <input name="category" defaultValue={category} placeholder="Filter by category" style={inputStyle} />
          <button type="submit" style={primaryButtonStyle}>Search</button>
        </form>
        {sessionUser ? (
          <div style={userBadgeStyle}>
            Signed in as <strong>{sessionUser.email || sessionUser.username || sessionUser.sub}</strong>
          </div>
        ) : null}
      </section>

      {errorMessage ? <div style={errorStyle}>{errorMessage}</div> : null}

      <div style={{ marginTop: 18, display: "grid", gap: 18 }}>
        {products.map((product) => (
          <article key={product.id} style={cardStyle}>
            <div style={cardContentStyle}>
              <div style={imageWrapperStyle}>
                <img
                  src={product.imageUrl || "/product-images/default.svg"}
                  alt={product.name}
                  style={imageStyle}
                />
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 38, color: '#0f172a', letterSpacing: '-0.03em' }}>{product.name}</h2>
                    <p style={{ marginTop: 12, color: '#475569', lineHeight: 1.8 }}>{product.description}</p>
                  </div>
                  <div style={priceBadgeStyle}>${product.price}</div>
                </div>
                <div style={metaGridStyle}>
                  <div style={metaTileStyle}><span style={metaLabelStyle}>Category</span><strong>{product.category}</strong></div>
                  <div style={metaTileStyle}><span style={metaLabelStyle}>SKU</span><strong>{product.sku || 'N/A'}</strong></div>
                  <div style={metaTileStyle}><span style={metaLabelStyle}>Available</span><strong>{product.availableQuantity ?? 0}</strong></div>
                </div>
                <ProductActionButtons product={product} sessionUser={sessionUser} />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div style={paginationStyle}>
        {hasPrevious ? (
          <a href={buildPageHref(keyword, category, currentPage - 1)} style={secondaryButtonStyle}>Previous</a>
        ) : <span style={disabledButtonStyle}>Previous</span>}
        <span style={{ color: '#475569', fontWeight: 700 }}>Page {currentPage}</span>
        {hasNext ? (
          <a href={buildPageHref(keyword, category, currentPage + 1)} style={secondaryButtonStyle}>Next</a>
        ) : <span style={disabledButtonStyle}>Next</span>}
      </div>
    </main>
  );
}

const pageStyle = { maxWidth: 1240, margin: '0 auto' };
const heroStyle = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 18 };
const pillStyle = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, background: '#eef4ff', color: '#2563eb', fontSize: 13, letterSpacing: 0.3 };
const toolbarStyle = { display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: 24, padding: 22, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)' };
const primaryButtonStyle = { display: 'inline-block', padding: '12px 16px', borderRadius: 12, background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: 'white', textDecoration: 'none', border: 'none', fontWeight: 700 };
const secondaryButtonStyle = { display: 'inline-block', padding: '12px 16px', borderRadius: 12, background: '#ffffff', color: '#0f172a', textDecoration: 'none', border: '1px solid #dbe4f0', fontWeight: 700, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' };
const disabledButtonStyle = { display: 'inline-block', padding: '12px 16px', borderRadius: 12, background: '#334155', color: '#64748b' };
const userBadgeStyle = { padding: '12px 16px', borderRadius: 999, background: '#eef4ff', color: '#2563eb', border: '1px solid #dbe4f0' };
const inputStyle = { minWidth: 220, padding: '12px 14px', borderRadius: 12, border: '1px solid #dbe4f0', background: '#020617', color: 'white' };
const cardStyle = { background: '#ffffff', padding: 20, borderRadius: 24, border: '1px solid #dbe4f0', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)' };
const cardContentStyle = { display: 'flex', gap: 22, alignItems: 'stretch', flexWrap: 'wrap' };
const imageWrapperStyle = { width: 250, minWidth: 250, height: 250, background: 'linear-gradient(180deg, #fff7ed, #ffedd5)', borderRadius: 24, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fde7cf' };
const imageStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const priceBadgeStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 120, height: 56, borderRadius: 18, background: '#e8f5ec', color: '#15803d', fontWeight: 800, fontSize: 22, border: '1px solid #cfe8d7' };
const metaGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 18 };
const metaTileStyle = { padding: 14, borderRadius: 18, background: '#f8fafc', color: '#0f172a', display: 'flex', flexDirection: 'column', gap: 6, border: '1px solid #e2e8f0' };
const metaLabelStyle = { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, color: '#64748b' };
const paginationStyle = { marginTop: 28, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' };
const errorStyle = { marginTop: 16, padding: 16, border: '1px solid #dc2626', borderRadius: 16, color: '#fff', background: 'rgba(127,29,29,0.22)' };
