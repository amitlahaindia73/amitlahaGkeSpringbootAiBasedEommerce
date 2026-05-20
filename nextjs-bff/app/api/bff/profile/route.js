import { userServiceFetch } from "../../../../lib/api";

export async function GET() {
  try {
    const response = await userServiceFetch("/api/users/me");
    const payload = await response.json().catch(() => null);
    return Response.json(payload || { message: "Profile fetch completed." }, { status: response.status });
  } catch (error) {
    return Response.json({ message: error?.message || "Profile fetch failed." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const response = await userServiceFetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => null);
    return Response.json(payload || { message: "Profile update completed." }, { status: response.status });
  } catch (error) {
    return Response.json({ message: error?.message || "Profile update failed." }, { status: 500 });
  }
}
