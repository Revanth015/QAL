import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { getCurrentUserProfile } from "../services/userService";

function Profile() {
  const { userProfile } = useAuth();
  const [profile, setProfile] = useState(userProfile);
  const [loading, setLoading] = useState(!userProfile);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
      setLoading(false);
      return;
    }

    getCurrentUserProfile()
      .then(setProfile)
      .catch((err) => setError(err.message || "Unable to load profile."))
      .finally(() => setLoading(false));
  }, [userProfile]);

  if (loading) {
    return <Layout><div className="p-8 text-gray-500">Loading profile...</div></Layout>;
  }

  if (error) {
    return <Layout><div className="rounded-xl bg-white p-8 text-red-600 shadow">{error}</div></Layout>;
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-xl bg-white p-8 shadow">
          <div className="flex flex-wrap items-center gap-5">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-700">
                {(profile?.full_name || "Q").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-purple-600">QAL Learner</p>
              <h1 className="text-3xl font-bold text-gray-900">{profile?.full_name || "Learner"}</h1>
              <p className="text-gray-500">{profile?.email || ""}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total XP" value={profile?.total_xp || 0} />
          <Stat label="Level" value={profile?.level || 1} />
          <Stat label="Streak" value={`${profile?.streak || 0} days`} />
          <Stat label="Missions" value={profile?.missions_completed || 0} />
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900">Your QAL Journey</h2>
          <p className="mt-2 text-gray-500">Mission history, skill progress, badges and AI feedback will be connected here as the learner analytics layer is built.</p>
        </div>
      </div>
    </Layout>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default Profile;
