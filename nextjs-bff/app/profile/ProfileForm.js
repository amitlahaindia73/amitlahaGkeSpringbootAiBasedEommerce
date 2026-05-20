"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function normalizeInitial(profile, sessionUser) {
  return {
    username: profile?.username || sessionUser?.username || "",
    email: profile?.email || sessionUser?.email || "",
    fullName: profile?.fullName || sessionUser?.name || sessionUser?.username || "",
    phoneNumber: profile?.phoneNumber || "",
    addressLine1: profile?.addressLine1 || "",
    addressLine2: profile?.addressLine2 || "",
    city: profile?.city || "",
    state: profile?.state || "",
    postalCode: profile?.postalCode || "",
    country: profile?.country || "India"
  };
}

function isProfileComplete(profile) {
  return Boolean(
    profile?.phoneNumber &&
    profile?.addressLine1 &&
    profile?.city &&
    profile?.state &&
    profile?.postalCode &&
    profile?.country
  );
}

function validate(form) {
  const errors = {};
  if (!/^[A-Za-z0-9._@-]{3,80}$/.test(form.username)) errors.username = "Username can contain letters, numbers, . _ - @ only.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address.";
  if (!/^[A-Za-z][A-Za-z .'-]{1,159}$/.test(form.fullName)) errors.fullName = "Enter a valid full name.";
  if (!/^\d{8,15}$/.test(form.phoneNumber)) errors.phoneNumber = "Phone number must contain 8 to 15 digits only.";
  if (!form.addressLine1.trim()) errors.addressLine1 = "Address Line 1 is required.";
  if (!/^[A-Za-z][A-Za-z .'-]{1,119}$/.test(form.city)) errors.city = "Enter a valid city.";
  if (!/^[A-Za-z][A-Za-z .'-]{1,119}$/.test(form.state)) errors.state = "Enter a valid state.";
  if (!/^[A-Za-z0-9 -]{4,12}$/.test(form.postalCode)) errors.postalCode = "Postal code must be 4 to 12 characters.";
  if (!/^[A-Za-z][A-Za-z .'-]{1,119}$/.test(form.country)) errors.country = "Enter a valid country.";
  return errors;
}

export default function ProfileForm({ profile, sessionUser }) {
  const router = useRouter();
  const [form, setForm] = useState(() => normalizeInitial(profile, sessionUser));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const completed = useMemo(() => Boolean(profile?.profileComplete) || isProfileComplete(form), [profile?.profileComplete, form]);

  useEffect(() => {
    let active = true;
    async function loadLatest() {
      try {
        const response = await fetch("/api/bff/profile", { cache: "no-store" });
        const payload = await response.json().catch(() => null);
        const latest = payload?.data;
        if (!active || !latest) return;
        if (latest.profileComplete) {
          router.replace("/");
          router.refresh();
          return;
        }
        setForm(normalizeInitial(latest, sessionUser));
      } catch {}
    }
    loadLatest();
    return () => { active = false; };
  }, [router, sessionUser]);

  function onChange(event) {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "phoneNumber") {
      nextValue = value.replace(/\D/g, "").slice(0, 15);
    } else if (name === "postalCode") {
      nextValue = value.slice(0, 12);
    } else if (name === "fullName") {
      nextValue = value.replace(/\s+/g, " ").slice(0, 160);
    } else if (["city", "state", "country"].includes(name)) {
      nextValue = value.replace(/\s+/g, " ").slice(0, 120);
    } else if (["addressLine1", "addressLine2"].includes(name)) {
      nextValue = value.slice(0, 200);
    }

    setForm((current) => ({ ...current, [name]: nextValue }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setMessage("");
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage("Please correct the highlighted fields.");
      return;
    }

    setSaving(true);
    setMessage("Saving profile...");

    try {
      const response = await fetch("/api/bff/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.message || "Failed to save profile.");
        return;
      }
      setMessage("Profile saved successfully. Redirecting...");
      router.replace("/");
      router.refresh();
    } catch {
      setMessage("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <div style={pillStyle}>{completed ? "Profile details" : "Complete your profile"}</div>
          <h1 style={{ margin: "14px 0 10px", fontSize: 42 }}>Customer Profile</h1>
          <p style={subTextStyle}>
            {completed
              ? "Your details are already saved. You can review or update them below."
              : "Please complete your phone number and address before continuing to the storefront."}
          </p>
        </div>
        <a href="/api/auth/logout" style={linkButtonStyle}>Logout</a>
      </div>

      <form onSubmit={onSubmit} style={formStyle}>
        {FIELDS.map((field) => (
          <label key={field.name} style={fieldStyle}>
            <span style={labelStyle}>{field.label}{field.required ? " *" : ""}</span>
            <input
              name={field.name}
              type={field.type || "text"}
              required={field.required}
              value={form[field.name]}
              onChange={onChange}
              disabled={field.disabled}
              readOnly={field.readOnly}
              maxLength={field.maxLength}
              inputMode={field.inputMode}
              autoComplete={field.autoComplete}
              style={{
                ...inputStyle,
                ...(field.disabled ? disabledInputStyle : {}),
                borderColor: errors[field.name] ? "#ef4444" : "#dbe4f0"
              }}
              placeholder={field.placeholder}
            />
            {errors[field.name] ? <span style={errorTextStyle}>{errors[field.name]}</span> : null}
          </label>
        ))}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          <button type="submit" disabled={saving} style={primaryButtonStyle}>{saving ? "Please wait..." : "Save and Continue"}</button>
          {completed ? <a href="/" style={secondaryButtonStyle}>Back to Home</a> : null}
        </div>
        {message ? <p style={{ margin: 0, color: "#cbd5e1" }}>{message}</p> : null}
      </form>
    </section>
  );
}

const FIELDS = [
  { name: "username", label: "Username", required: true, placeholder: "Enter username", readOnly: true, maxLength: 80, autoComplete: "username" },
  { name: "email", label: "Email", required: true, placeholder: "Enter email", type: "email", disabled: true, readOnly: true, maxLength: 160, autoComplete: "email" },
  { name: "fullName", label: "Full Name", required: true, placeholder: "Enter full name", maxLength: 160, autoComplete: "name" },
  { name: "phoneNumber", label: "Phone Number", required: true, placeholder: "Enter phone number", inputMode: "numeric", maxLength: 15, autoComplete: "tel" },
  { name: "addressLine1", label: "Address Line 1", required: true, placeholder: "House, street, locality", maxLength: 200, autoComplete: "address-line1" },
  { name: "addressLine2", label: "Address Line 2", required: false, placeholder: "Apartment, landmark", maxLength: 200, autoComplete: "address-line2" },
  { name: "city", label: "City", required: true, placeholder: "Enter city", maxLength: 120, autoComplete: "address-level2" },
  { name: "state", label: "State", required: true, placeholder: "Enter state", maxLength: 120, autoComplete: "address-level1" },
  { name: "postalCode", label: "Postal Code", required: true, placeholder: "Enter postal code", maxLength: 12, autoComplete: "postal-code" },
  { name: "country", label: "Country", required: true, placeholder: "Enter country", maxLength: 120, autoComplete: "country-name" }
];

const cardStyle = { maxWidth: 1040, margin: "0 auto", background: "linear-gradient(180deg, rgba(15,23,42,0.94), rgba(17,24,39,0.94))", borderRadius: 28, padding: 28, border: "1px solid rgba(148,163,184,0.14)", boxShadow: "0 25px 60px rgba(2,6,23,0.28)" };
const pillStyle = { display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "rgba(59,130,246,0.14)", color: "#93c5fd", fontSize: 13 };
const subTextStyle = { margin: 0, color: "#cbd5e1", lineHeight: 1.8, maxWidth: 760 };
const formStyle = { marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 };
const fieldStyle = { display: "flex", flexDirection: "column", gap: 8 };
const labelStyle = { color: "#e2e8f0", fontWeight: 700 };
const inputStyle = { padding: "13px 14px", borderRadius: 14, border: "1px solid #dbe4f0", background: "#ffffff", color: "#0f172a" };
const disabledInputStyle = { opacity: 0.88, cursor: "not-allowed", background: "#f8fafc", color: "#64748b" };
const errorTextStyle = { color: "#dc2626", fontSize: 13 };
const primaryButtonStyle = { padding: "12px 18px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #2563eb, #4f46e5)", color: "white", cursor: "pointer", fontWeight: 700 };
const secondaryButtonStyle = { display: "inline-block", padding: "12px 18px", borderRadius: 12, background: "rgba(15,23,42,0.72)", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.18)", textDecoration: "none", fontWeight: 700 };
const linkButtonStyle = { ...secondaryButtonStyle };
