import { executeAdminGraphQL } from "../../../../lib/admin-graphql";
import { getSessionUser } from "../../../../lib/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const isAdmin =
      Array.isArray(sessionUser.roles) &&
      sessionUser.roles.some((role) => String(role).toLowerCase() === "admin");

  if (!isAdmin) {
    return Response.json({ error: "Admin role required" }, { status: 403 });
  }

  const body = await request.json();
  const result = await executeAdminGraphQL(body.query, body.variables || {});

  return Response.json(result, {
    status: result.errors?.length ? 400 : 200,
  });
}