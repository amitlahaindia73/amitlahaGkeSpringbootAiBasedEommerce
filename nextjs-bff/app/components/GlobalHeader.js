"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const headerStyle = {
  position: "sticky",
  top: 0,
  zIndex: 100,
  backdropFilter: "blur(14px)",
  background: "rgba(255,255,255,0.92)",
  borderBottom: "1px solid #dbe4f0",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.05)"
};

const innerStyle = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: "14px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  flexWrap: "wrap"
};

const brandWrapStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 2
};

const navStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center"
};

const navItemStyle = (active) => ({
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  transition: "all 0.2s ease",
  background: active ? "#2563eb" : "transparent",
  color: active ? "#ffffff" : "#334155",
  border: active ? "1px solid #2563eb" : "1px solid transparent"
});

export default function GlobalHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/cart", label: "Cart" },
    { href: "/orders", label: "Orders" },
    { href: "/recommendations", label: "AI Recommendations" },
    { href: "/profile", label: "Profile" }
  ];

  return (
    <header style={headerStyle}>
      <div style={innerStyle}>
        <div style={brandWrapStyle}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
            Amitra Commerce Mesh
          </div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            Cloud-native AI commerce platform by Amit Laha
          </div>
        </div>

        <nav style={navStyle}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={navItemStyle(pathname === item.href)}
            >
              {item.label}
            </Link>
          ))}

          <a
            href="/api/auth/login"
            style={{
              ...navItemStyle(false),
              background: "#0f172a",
              color: "#ffffff",
              border: "1px solid #0f172a"
            }}
          >
            Login
          </a>
        </nav>
      </div>
    </header>
  );
}
