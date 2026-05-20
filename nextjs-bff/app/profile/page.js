import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";
import { getSessionUser } from "../../lib/session";
import { fetchCurrentUserProfile } from "../../lib/user-profile";

export default async function ProfilePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/api/auth/login");
  }

  const { profile, error } = await fetchCurrentUserProfile();

  if (profile?.profileComplete) {
    redirect("/");
  }

  return (
    <main style={{ maxWidth: 1140, margin: "0 auto" }}>
      {error ? <div style={errorStyle}>{error}</div> : null}
      <ProfileForm profile={profile} sessionUser={sessionUser} />
    </main>
  );
}

const errorStyle = { margin: "0 auto 18px", maxWidth: 1040, padding: 16, border: "1px solid #fecaca", borderRadius: 16, color: "#b91c1c", background: "#fef2f2" };
