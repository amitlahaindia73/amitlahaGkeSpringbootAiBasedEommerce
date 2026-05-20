"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function formatTimestamp(value) {
  if (!value) return "";
  try {
    return new Date(Number(value) * 1000).toLocaleString();
  } catch {
    return "";
  }
}


async function fetchSupportHistory(orderNumber) {
  const response = await fetch(`/api/bff/orders/support-chat?orderNumber=${encodeURIComponent(orderNumber)}`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function recoverHistoryAfterSend(orderNumber, sentMessage) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 450 * attempt));
    const { response, payload } = await fetchSupportHistory(orderNumber);
    if (!response.ok) {
      continue;
    }
    const history = Array.isArray(payload?.history) ? payload.history : [];
    const normalized = String(sentMessage || "").trim().toLowerCase();
    const hasUserMessage = history.some((entry) => entry?.role === "user" && String(entry?.text || "").trim().toLowerCase() === normalized);
    const hasAssistantAfterUser = history.length >= 2 && history[history.length - 1]?.role === "assistant";
    if (hasUserMessage && hasAssistantAfterUser) {
      return history;
    }
  }
  return null;
}

export default function OrderSupportPanel({ order }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const historyBoxRef = useRef(null);
  const helperText = useMemo(() => {
    return `Ask only about ${order.orderNumber}: delivery, payment, ordered items, or address details.`;
  }, [order.orderNumber]);

  useEffect(() => {
    if (!open) return;
    let active = true;

    async function loadHistory() {
      try {
        const { response, payload } = await fetchSupportHistory(order.orderNumber);
        if (!active) return;
        if (response.ok) {
          setHistory(Array.isArray(payload?.history) ? payload.history : []);
        } else {
          setError(payload?.message || "Unable to load chat history right now.");
        }
      } catch {
        if (active) {
          setError("Unable to load chat history right now.");
        }
      }
    }

    loadHistory();
    return () => {
      active = false;
    };
  }, [open, order.orderNumber]);

  useEffect(() => {
    if (!open || !historyBoxRef.current) return;
    historyBoxRef.current.scrollTop = historyBoxRef.current.scrollHeight;
  }, [open, history]);

  async function onSubmit(event) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/bff/orders/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: order.orderNumber, message: trimmed }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const recoveredHistory = await recoverHistoryAfterSend(order.orderNumber, trimmed);
        if (recoveredHistory) {
          setHistory(recoveredHistory);
          setMessage("");
          setOpen(true);
          setError("");
          return;
        }
        setError(payload?.message || payload?.detail || "Unable to reach customer support right now.");
        return;
      }
      setHistory(Array.isArray(payload?.history) ? payload.history : []);
      setMessage("");
      setOpen(true);
      setError("");
    } catch {
      const recoveredHistory = await recoverHistoryAfterSend(order.orderNumber, trimmed);
      if (recoveredHistory) {
        setHistory(recoveredHistory);
        setMessage("");
        setOpen(true);
        setError("");
      } else {
        setError("Customer support is temporarily unavailable. Please try again in a moment.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div>
          <div style={titleRowStyle}>
            <span style={badgeStyle}>Customer Support</span>
            <strong style={{ fontSize: 18 }}>AI chat for this order</strong>
          </div>
          <p style={helperStyle}>{helperText}</p>
        </div>
        <button type="button" style={toggleButtonStyle} onClick={() => setOpen((value) => !value)}>
          {open ? "Hide Support" : "Open Support"}
        </button>
      </div>

      {open ? (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <div ref={historyBoxRef} style={historyBoxStyle}>
            {history.length ? history.map((entry, index) => (
              <div
                key={`${entry.role}-${entry.timestamp || index}-${index}`}
                style={{
                  ...bubbleStyle,
                  marginLeft: entry.role === "assistant" ? 0 : "auto",
                  background: entry.role === "assistant" ? "#f8fafc" : "#eef4ff",
                  borderColor: entry.role === "assistant" ? "#e2e8f0" : "#d7e3ff",
                }}
              >
                <div style={bubbleMetaStyle}>
                  <strong>{entry.role === "assistant" ? "Amitra Support AI" : "You"}</strong>
                  <span>{formatTimestamp(entry.timestamp)}</span>
                </div>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{entry.text}</div>
              </div>
            )) : (
              <div style={{ color: "#64748b" }}>
                No chat history yet for this order. The latest 10 messages are kept for the same signed-in user only.
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={`Example: Where is my order ${order.orderNumber}?`}
              rows={4}
              style={textareaStyle}
              maxLength={1500}
            />
            <div style={actionRowStyle}>
              <span style={{ color: "#64748b", fontSize: 12 }}>Only this order's context is shared with AI.</span>
              <button type="submit" style={sendButtonStyle} disabled={loading}>
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </form>

          {error ? <div style={errorStyle}>{error}</div> : null}
        </div>
      ) : null}
    </section>
  );
}

const panelStyle = { marginTop: 16, padding: 20, borderRadius: 22, border: "1px solid #dbe4f0", background: "#ffffff", boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)" };
const panelHeaderStyle = { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" };
const titleRowStyle = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" };
const badgeStyle = { display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "#eef4ff", color: "#2563eb", fontSize: 13, fontWeight: 700, border: "1px solid #d7e3ff" };
const helperStyle = { margin: "10px 0 0", color: "#475569", lineHeight: 1.7 };
const toggleButtonStyle = { padding: "11px 16px", borderRadius: 14, border: "1px solid #dbe4f0", background: "#ffffff", color: "#0f172a", cursor: "pointer", fontWeight: 700, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" };
const historyBoxStyle = { display: "grid", gap: 10, maxHeight: 360, overflowY: "auto", padding: 10, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" };
const bubbleStyle = { maxWidth: "86%", padding: 12, borderRadius: 16, border: "1px solid #e2e8f0", color: "#0f172a" };
const bubbleMetaStyle = { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8, color: "#64748b", fontSize: 12 };
//const textareaStyle = { width: "100%", borderRadius: 16, background: "rgba(2,6,23,0.72)", color: "#f8fafc", border: "1px solid rgba(148,163,184,0.16)", padding: 14, resize: "vertical" };
const textareaStyle = {
  width: "100%",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  border: "1px solid #dbe4f0",
  borderRadius: "10px",
  padding: "14px",
  fontSize: "16px",        //  THIS FIXES YOUR ISSUE
  lineHeight: "1.6",       // improves readability
  outline: "none",
  resize: "vertical",
};
const actionRowStyle = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" };
const sendButtonStyle = { padding: "10px 16px", borderRadius: 12, border: 0, background: "linear-gradient(135deg, #2563eb, #4f46e5)", color: "white", cursor: "pointer", fontWeight: 700 };
const errorStyle = { padding: 12, borderRadius: 14, border: "1px solid #fecaca", color: "#b91c1c", background: "#fef2f2" };
