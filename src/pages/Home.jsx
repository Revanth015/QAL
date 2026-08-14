import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { getCurrentUserProfile } from "../services/userService";

function Home() {
  const { session, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      if (!session) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const data = await getCurrentUserProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load QAL profile:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadProfile();
    }
  }, [session, authLoading]);

  if (authLoading || loading) {
    return (
      <Layout>
        <p>Loading your QAL profile...</p>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <h1 className="text-3xl font-bold">Welcome to QAL</h1>
        <p className="mt-4">Please log in to continue.</p>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <h1 className="text-3xl font-bold">QAL</h1>
        <p className="mt-4 text-red-600">
          Unable to load your profile.
        </p>
        <p className="mt-2 text-sm text-gray-600">{error}</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold">
        Welcome, {profile?.full_name}
      </h1>
      <p className="mt-2 text-gray-600">
        {profile?.email}
      </p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm text-gray-500">XP</p>
          <p className="mt-2 text-2xl font-bold">
            {profile?.total_xp ?? 0}
          </p>
        </div>

        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Level</p>
          <p className="mt-2 text-2xl font-bold">
            {profile?.level ?? 1}
          </p>
        </div>

        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Missions Completed</p>
          <p className="mt-2 text-2xl font-bold">
            {profile?.missions_completed ?? 0}
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default Home;