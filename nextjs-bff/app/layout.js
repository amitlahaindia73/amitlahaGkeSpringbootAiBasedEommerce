import GlobalHeader from "./components/GlobalHeader";
// Global application shell and footer.
export const metadata = {
  title: "Amitra Commerce Mesh | Amit Laha",
  description: "AI-enabled commerce experience built by Amit Laha"
};

const shellStyle = {
  fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
  margin: 0,
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #f8fbff 0%, #f3f7fc 55%, #eef4fb 100%)',
  color: '#0f172a'
};

const contentStyle = {
  flex: 1,
  width: '100%',
  boxSizing: 'border-box',
  padding: '28px 24px 40px'
};

const footerStyle = {
  borderTop: '1px solid #dbe4f0',
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(10px)',
  padding: '18px 24px',
  color: '#64748b',
  fontSize: 14
};

const footerInnerStyle = {
  maxWidth: 1240,
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={shellStyle}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <GlobalHeader />
          <div style={contentStyle}>{children}</div>
          <footer style={footerStyle}>
            <div style={footerInnerStyle}>
              <span>© 2026 Amitra Commerce Mesh. All rights reserved.</span>
              <span>Built and maintained by Amit Laha.</span>
              <span>Copying, redistribution, reuse, or commercial use without written permission is restricted.</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
