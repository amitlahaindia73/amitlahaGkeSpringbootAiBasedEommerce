import { NextResponse } from "next/server";
import { gatewayFetch, getAccessToken } from "../../../../../lib/api";
import { appConfig } from "../../../../../lib/config";
import { getSessionUser } from "../../../../../lib/session";

function buildSafeOrderContext(order) {
  return {
    orderNumber: order?.orderNumber,
    createdAt: order?.createdAt || null,
    totalAmount: order?.totalAmount ?? null,
    orderStatus: order?.orderStatus || null,
    paymentStatus: order?.paymentStatus || null,
    deliveryStatus: order?.deliveryStatus || null,
    deliveryRecipientName: order?.deliveryRecipientName || null,
    deliveryPhoneNumber: order?.deliveryPhoneNumber || null,
    deliveryAddressLine1: order?.deliveryAddressLine1 || null,
    deliveryAddressLine2: order?.deliveryAddressLine2 || null,
    deliveryCity: order?.deliveryCity || null,
    deliveryState: order?.deliveryState || null,
    deliveryPostalCode: order?.deliveryPostalCode || null,
    deliveryCountry: order?.deliveryCountry || null,
    items: Array.isArray(order?.items)
      ? order.items.map((item) => ({
          productId: item?.productId || null,
          productName: item?.productName || "Unknown Product",
          quantity: Number(item?.quantity || 0),
          lineTotal: item?.lineTotal ?? null,
        }))
      : [],
  };
}

async function parseJsonSafe(response) {
  const raw = await response.text();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("❌ Failed to parse JSON:", error);
    return { raw };
  }
}

async function fetchOrdersForUser() {
  const ordersResponse = await gatewayFetch("/api/orders/me");
  const ordersPayload = await parseJsonSafe(ordersResponse);

  console.log("📦 Orders Response Status:", ordersResponse.status);
  console.log("📦 Orders Payload:", ordersPayload);

  return { ordersResponse, ordersPayload };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callSupportViaGateway(path, options = {}) {
  const firstResponse = await gatewayFetch(path, options);
  const firstPayload = await parseJsonSafe(firstResponse);

  console.log("📡 First Support Call Status:", firstResponse.status);
  console.log("📡 First Support Call Payload:", firstPayload);

  if (![401, 405].includes(firstResponse.status)) {
    return { response: firstResponse, payload: firstPayload };
  }

  console.log("♻️ Retrying support call with direct gateway URL...");

  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const retryResponse = await fetch(`${appConfig.gatewayBaseUrl}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
  const retryPayload = await parseJsonSafe(retryResponse);

  console.log("📡 Retry Support Call Status:", retryResponse.status);
  console.log("📡 Retry Support Call Payload:", retryPayload);

  return { response: retryResponse, payload: retryPayload };
}

async function fetchSupportHistory(orderNumber, sessionUser) {
  return callSupportViaGateway(
    `/api/support-chat/history/${encodeURIComponent(orderNumber)}`,
    {
      method: "GET",
      headers: {
        "X-Auth-User-Id": sessionUser.sub,
        "X-Auth-Email": sessionUser.email || "",
      },
    }
  );
}

function recoverSuccessfulSend(historyPayload, attemptedMessage, orderNumber) {
  const history = Array.isArray(historyPayload?.history) ? historyPayload.history : [];
  if (!history.length) {
    return null;
  }

  const trimmedAttempt = String(attemptedMessage || "").trim();
  const reversed = [...history].reverse();
  const latestUserIndex = reversed.findIndex(
    (item) => item?.role === "user" && String(item?.text || "").trim() === trimmedAttempt
  );

  if (latestUserIndex === -1) {
    return null;
  }

  const assistantAfterUser = reversed.slice(0, latestUserIndex).find((item) => item?.role === "assistant");
  if (!assistantAfterUser) {
    return null;
  }

  return {
    orderNumber,
    answer: assistantAfterUser.text,
    history,
    source: historyPayload?.source || "history_recovered",
  };
}

export async function POST(request) {
  console.log("🔥 SUPPORT CHAT POST HIT");

  const sessionUser = await getSessionUser();
  console.log("👤 Session User:", sessionUser);

  if (!sessionUser?.sub) {
    return NextResponse.json(
      { message: "Unauthorized. Please log in again." },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
    console.log("📩 Request Body:", body);
  } catch (error) {
    console.error("❌ Invalid JSON:", error);
    return NextResponse.json(
      { message: "Invalid request payload." },
      { status: 400 }
    );
  }

  const orderNumber = String(body?.orderNumber || "").trim();
  const message = String(body?.message || "").trim();

  if (!orderNumber) {
    return NextResponse.json(
      { message: "orderNumber is required." },
      { status: 400 }
    );
  }

  if (!message) {
    return NextResponse.json(
      { message: "message is required." },
      { status: 400 }
    );
  }

  try {
    console.log("➡️ Fetching orders from gateway...");
    const { ordersResponse, ordersPayload } = await fetchOrdersForUser();

    if (!ordersResponse.ok) {
      return NextResponse.json(
        {
          message:
            ordersPayload?.message ||
            `Unable to load your orders. Status ${ordersResponse.status}.`,
        },
        { status: ordersResponse.status }
      );
    }

    const orders = Array.isArray(ordersPayload?.data) ? ordersPayload.data : [];
    const order = orders.find(
      (item) => String(item?.orderNumber || "") === orderNumber
    );

    console.log("🔍 Matched Order:", order);

    if (!order) {
      return NextResponse.json(
        { message: "The selected order does not belong to the current user." },
        { status: 403 }
      );
    }

    const payload = {
      order: buildSafeOrderContext(order),
      message,
    };

    console.log("➡️ Calling support service via gateway...");
    console.log("🌐 Gateway Base URL:", appConfig.gatewayBaseUrl);
    console.log("📨 Support Payload:", payload);

    const { response: supportResponse, payload: supportPayload } =
      await callSupportViaGateway("/api/support-chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-User-Id": sessionUser.sub,
          "X-Auth-Email": sessionUser.email || "",
        },
        body: JSON.stringify(payload),
      });

    if (supportResponse.ok) {
      return NextResponse.json(supportPayload, {
        status: supportResponse.status,
      });
    }

    console.log("⚠️ Support POST returned non-OK. Attempting history recovery...");
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (attempt > 0) {
        await sleep(600);
      }
      const { response: historyResponse, payload: historyPayload } =
        await fetchSupportHistory(orderNumber, sessionUser);

      console.log(`📚 History recovery attempt ${attempt + 1} status:`, historyResponse.status);
      console.log(`📚 History recovery attempt ${attempt + 1} payload:`, historyPayload);

      if (historyResponse.ok) {
        const recovered = recoverSuccessfulSend(historyPayload, message, orderNumber);
        if (recovered) {
          console.log("✅ Recovered successful send from history after non-OK POST.");
          return NextResponse.json(recovered, { status: 200 });
        }
      }
    }

    return NextResponse.json(
      {
        message:
          supportPayload?.message ||
          supportPayload?.detail ||
          "Customer support is temporarily unavailable. Please try again shortly.",
        details: supportPayload,
      },
      { status: supportResponse.status }
    );
  } catch (error) {
    console.error("🔥 SUPPORT CHAT ERROR FULL:", error);
    return NextResponse.json(
      {
        message:
          "Customer support is temporarily unavailable. Please try again shortly.",
      },
      { status: 503 }
    );
  }
}

export async function GET(request) {
  console.log("🔥 SUPPORT CHAT GET HIT");

  const sessionUser = await getSessionUser();
  console.log("👤 Session User:", sessionUser);

  if (!sessionUser?.sub) {
    return NextResponse.json(
      { message: "Unauthorized. Please log in again." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const orderNumber = String(searchParams.get("orderNumber") || "").trim();

  if (!orderNumber) {
    return NextResponse.json(
      { message: "orderNumber is required." },
      { status: 400 }
    );
  }

  try {
    console.log("➡️ Fetching orders for history...");
    const { ordersResponse, ordersPayload } = await fetchOrdersForUser();

    if (!ordersResponse.ok) {
      return NextResponse.json(
        {
          message:
            ordersPayload?.message ||
            `Unable to load your orders. Status ${ordersResponse.status}.`,
        },
        { status: ordersResponse.status }
      );
    }

    const orders = Array.isArray(ordersPayload?.data) ? ordersPayload.data : [];
    const order = orders.find(
      (item) => String(item?.orderNumber || "") === orderNumber
    );

    console.log("🔍 Matched Order (GET):", order);

    if (!order) {
      return NextResponse.json(
        { message: "The selected order does not belong to the current user." },
        { status: 403 }
      );
    }

    console.log("➡️ Fetching chat history via gateway...");
    console.log("🌐 Gateway Base URL:", appConfig.gatewayBaseUrl);

    const { response: supportResponse, payload: supportPayload } =
      await fetchSupportHistory(orderNumber, sessionUser);

    if (!supportResponse.ok) {
      return NextResponse.json(
        {
          message:
            supportPayload?.message ||
            supportPayload?.detail ||
            "Customer support history is temporarily unavailable. Please try again shortly.",
          details: supportPayload,
        },
        { status: supportResponse.status }
      );
    }

    return NextResponse.json(supportPayload, {
      status: supportResponse.status,
    });
  } catch (error) {
    console.error("🔥 SUPPORT CHAT GET ERROR:", error);
    return NextResponse.json(
      {
        message:
          "Customer support history is temporarily unavailable. Please try again shortly.",
      },
      { status: 503 }
    );
  }
}
