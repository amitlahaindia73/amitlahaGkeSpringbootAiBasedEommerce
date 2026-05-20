"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const initialDeliveryForm = {
  recipientName: "",
  phoneNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India"
};

function validateDeliveryForm(form) {
  const errors = {};
  if (!form.recipientName.trim()) errors.recipientName = "Recipient name is required.";
  else if (!/^[A-Za-z .'-]{2,120}$/.test(form.recipientName.trim())) errors.recipientName = "Enter a valid name.";

  if (!/^[0-9]{8,15}$/.test(form.phoneNumber.trim())) errors.phoneNumber = "Phone number must be 8 to 15 digits.";
  if (!form.addressLine1.trim()) errors.addressLine1 = "Address Line 1 is required.";
  if (form.addressLine2 && form.addressLine2.trim().length > 200) errors.addressLine2 = "Address Line 2 is too long.";
  if (!/^[A-Za-z .'-]{2,120}$/.test(form.city.trim())) errors.city = "Enter a valid city.";
  if (!/^[A-Za-z .'-]{2,120}$/.test(form.state.trim())) errors.state = "Enter a valid state.";
  if (!/^[A-Za-z0-9 -]{4,12}$/.test(form.postalCode.trim())) errors.postalCode = "Postal code must be 4 to 12 characters.";
  if (!/^[A-Za-z .'-]{2,120}$/.test(form.country.trim())) errors.country = "Enter a valid country.";
  return errors;
}

export default function CartActions({ productId, quantity, checkout = false, subtotalAmount = 0 }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [nextQuantity, setNextQuantity] = useState(quantity || 1);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState(initialDeliveryForm);
  const [deliveryErrors, setDeliveryErrors] = useState({});

  useEffect(() => {
    if (!checkout || !showCheckoutForm) return;
    let cancelled = false;
    async function loadProfile() {
      try {
        setPrefillLoading(true);
        const response = await fetch('/api/bff/profile', { cache: 'no-store' });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.data || cancelled) return;
        const profile = payload.data;
        setDeliveryForm((current) => ({
          ...current,
          recipientName: current.recipientName || profile.fullName || profile.username || '',
          phoneNumber: current.phoneNumber || profile.phoneNumber || '',
          addressLine1: current.addressLine1 || profile.addressLine1 || '',
          addressLine2: current.addressLine2 || profile.addressLine2 || '',
          city: current.city || profile.city || '',
          state: current.state || profile.state || '',
          postalCode: current.postalCode || profile.postalCode || '',
          country: current.country || profile.country || 'India'
        }));
      } catch (_) {
        // ignore prefill errors
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [checkout, showCheckoutForm]);

  const shippingAmount = useMemo(() => (subtotalAmount > 0 ? 15 : 0), [subtotalAmount]);
  const taxAmount = useMemo(() => Number((subtotalAmount * 0.05).toFixed(2)), [subtotalAmount]);

  async function updateCartItem() {
    try {
      setLoading(true);
      setMessage("Updating cart item...");
      const response = await fetch(`/api/bff/cart/items/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: Number(nextQuantity) })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.message || "Failed to update cart item.");
        return;
      }
      setMessage("Cart updated successfully.");
      router.refresh();
    } catch {
      setMessage("Failed to update cart item.");
    } finally {
      setLoading(false);
    }
  }

  async function removeCartItem() {
    try {
      setLoading(true);
      setMessage("Removing cart item...");
      const response = await fetch(`/api/bff/cart/items/${productId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.message || "Failed to remove cart item.");
        return;
      }
      setMessage("Item removed from cart.");
      router.refresh();
    } catch {
      setMessage("Failed to remove cart item.");
    } finally {
      setLoading(false);
    }
  }

  async function clearCart() {
    try {
      setLoading(true);
      setMessage("Clearing cart...");
      const response = await fetch(`/api/bff/cart/clear`, { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.message || "Failed to clear cart.");
        return;
      }
      setMessage("Cart cleared successfully.");
      router.refresh();
    } catch {
      setMessage("Failed to clear cart.");
    } finally {
      setLoading(false);
    }
  }

  function onDeliveryFieldChange(event) {
    const { name, value } = event.target;
    let nextValue = value;
    if (name === 'phoneNumber') nextValue = value.replace(/\D/g, '').slice(0, 15);
    if (name === 'postalCode') nextValue = value.replace(/[^A-Za-z0-9 -]/g, '').slice(0, 12);
    setDeliveryForm((current) => ({ ...current, [name]: nextValue }));
    setDeliveryErrors((current) => ({ ...current, [name]: '' }));
  }

  async function checkoutCart() {
    const validationErrors = validateDeliveryForm(deliveryForm);
    setDeliveryErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      setMessage("Please correct the delivery address fields before continuing.");
      return;
    }

    try {
      setLoading(true);
      setMessage("Creating order and processing checkout...");
      const response = await fetch(`/api/bff/cart/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: "USD",
          taxAmount,
          shippingAmount,
          discountAmount: 0,
          notes: `Checkout created from Next.js cart flow for ${deliveryForm.recipientName.trim()}`,
          deliveryAddress: {
            recipientName: deliveryForm.recipientName.trim(),
            phoneNumber: deliveryForm.phoneNumber.trim(),
            addressLine1: deliveryForm.addressLine1.trim(),
            addressLine2: deliveryForm.addressLine2.trim(),
            city: deliveryForm.city.trim(),
            state: deliveryForm.state.trim(),
            postalCode: deliveryForm.postalCode.trim(),
            country: deliveryForm.country.trim()
          }
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.message || "Checkout failed.");
        return;
      }
      const orderNumber = payload?.data?.orderNumber;
      setMessage(orderNumber ? `Checkout completed. Order number: ${orderNumber}` : "Checkout completed.");
      router.push(`/orders?created=${encodeURIComponent(orderNumber || "")}`);
      router.refresh();
    } catch {
      setMessage("Checkout failed.");
    } finally {
      setLoading(false);
    }
  }

  if (checkout) {
    return (
      <div>
        {!showCheckoutForm ? (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={() => { setShowCheckoutForm(true); setMessage(""); }} style={primaryButtonStyle} disabled={loading}>
              Add Delivery Address
            </button>
            <button type="button" onClick={clearCart} style={dangerButtonStyle} disabled={loading}>
              {loading ? "Please wait..." : "Clear Cart"}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={summaryBoxStyle}>
              <div><strong>Tax:</strong> ${taxAmount.toFixed(2)}</div>
              <div><strong>Shipping:</strong> ${shippingAmount.toFixed(2)}</div>
              <div><strong>Total before payment:</strong> ${(subtotalAmount + taxAmount + shippingAmount).toFixed(2)}</div>
            </div>
            {prefillLoading ? <p style={{ margin: 0, color: '#2563eb' }}>Loading saved profile address...</p> : null}
            <div style={formGridStyle}>
              {checkoutFields.map((field) => (
                <label key={field.name} style={field.fullWidth ? fullWidthFieldStyle : fieldStyle}>
                  <span style={labelTextStyle}>{field.label}</span>
                  <input
                    name={field.name}
                    value={deliveryForm[field.name]}
                    onChange={onDeliveryFieldChange}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    autoComplete={field.autoComplete}
                    inputMode={field.inputMode}
                    style={inputStyle}
                  />
                  {deliveryErrors[field.name] ? <span style={errorTextStyle}>{deliveryErrors[field.name]}</span> : null}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" onClick={checkoutCart} style={primaryButtonStyle} disabled={loading}>
                {loading ? "Please wait..." : "Create Order"}
              </button>
              <button type="button" onClick={() => { setShowCheckoutForm(false); setDeliveryErrors({}); setMessage(''); }} style={secondaryButtonStyle} disabled={loading}>
                Back
              </button>
              <button type="button" onClick={clearCart} style={dangerButtonStyle} disabled={loading}>
                {loading ? "Please wait..." : "Clear Cart"}
              </button>
            </div>
          </div>
        )}
        {message ? <p style={{ marginTop: 12, color: '#475569' }}>{message}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="number"
          min="1"
          value={nextQuantity}
          onChange={(event) => setNextQuantity(event.target.value)}
          style={{ ...inputStyle, width: 96 }}
        />
        <button type="button" onClick={updateCartItem} style={primaryButtonStyle} disabled={loading}>
          {loading ? "Please wait..." : "Update Quantity"}
        </button>
        <button type="button" onClick={removeCartItem} style={dangerButtonStyle} disabled={loading}>
          {loading ? "Please wait..." : "Remove"}
        </button>
      </div>
      {message ? <p style={{ marginTop: 12, color: '#475569' }}>{message}</p> : null}
    </div>
  );
}

const checkoutFields = [
  { name: 'recipientName', label: 'Recipient Name *', placeholder: 'Full name', maxLength: 120, autoComplete: 'shipping name' },
  { name: 'phoneNumber', label: 'Phone Number *', placeholder: 'Enter phone number', maxLength: 15, autoComplete: 'tel', inputMode: 'numeric' },
  { name: 'addressLine1', label: 'Address Line 1 *', placeholder: 'House, street, locality', maxLength: 200, autoComplete: 'shipping address-line1', fullWidth: true },
  { name: 'addressLine2', label: 'Address Line 2', placeholder: 'Apartment, landmark', maxLength: 200, autoComplete: 'shipping address-line2', fullWidth: true },
  { name: 'city', label: 'City *', placeholder: 'Enter city', maxLength: 120, autoComplete: 'shipping address-level2' },
  { name: 'state', label: 'State *', placeholder: 'Enter state', maxLength: 120, autoComplete: 'shipping address-level1' },
  { name: 'postalCode', label: 'Postal Code *', placeholder: 'Enter postal code', maxLength: 12, autoComplete: 'shipping postal-code' },
  { name: 'country', label: 'Country *', placeholder: 'Enter country', maxLength: 120, autoComplete: 'shipping country' }
];

const primaryButtonStyle = { padding: "11px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #2563eb, #4f46e5)", color: "white", cursor: "pointer", fontWeight: 700 };
const secondaryButtonStyle = { padding: "11px 16px", borderRadius: 14, border: "1px solid #dbe4f0", background: "#ffffff", color: "#0f172a", cursor: "pointer", fontWeight: 700, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" };
const dangerButtonStyle = { padding: "11px 16px", borderRadius: 12, border: "1px solid rgba(248,113,113,0.18)", background: "rgba(153,27,27,0.88)", color: "white", cursor: "pointer", fontWeight: 700 };
const inputStyle = { padding: "12px 14px", borderRadius: 14, border: "1px solid #dbe4f0", background: "#ffffff", color: "#0f172a", width: '100%' };
const summaryBoxStyle = { display: 'grid', gap: 8, padding: 16, borderRadius: 18, background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' };
const formGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 };
const fieldStyle = { display: 'grid', gap: 8 };
const fullWidthFieldStyle = { display: 'grid', gap: 8, gridColumn: '1 / -1' };
const labelTextStyle = { color: '#334155', fontWeight: 700 };
const errorTextStyle = { color: '#fca5a5', fontSize: 13 };
