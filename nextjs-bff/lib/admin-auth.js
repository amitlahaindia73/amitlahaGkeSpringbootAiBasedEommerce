export async function requireAdminUser() {
  const sessionUser = await getSessionUser();
  console.log("ADMIN CHECK sessionUser =", sessionUser);

  if (!sessionUser || !sessionUser.roles?.some((role) => role.toLowerCase() === "admin")) {
    console.log("ADMIN CHECK failed");
    redirect("/");
  }

  console.log("ADMIN CHECK passed");
  return sessionUser;
}