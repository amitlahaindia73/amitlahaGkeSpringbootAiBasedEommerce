import { redirect } from "next/navigation";
import { userServiceFetch } from "./api";

export async function fetchCurrentUserProfile() {
  try {
    const response = await userServiceFetch("/api/users/me");
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return { profile: null, error: payload?.message || `Profile fetch failed with status ${response.status}.` };
    }

    return { profile: payload?.data || null, error: "" };
  } catch (error) {
    return { profile: null, error: "User profile service is temporarily unavailable." };
  }
}

export async function requireCompletedProfile(sessionUser) {
  if (!sessionUser) {
    return null;
  }

  if (sessionUser?.roles?.includes("admin")) {
    return null;
  }

  const { profile, error } = await fetchCurrentUserProfile();
  if (!error && (!profile || !profile.profileComplete)) {
    redirect("/profile");
  }
  return profile;
}
