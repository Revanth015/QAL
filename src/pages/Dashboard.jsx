import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getCurrentUserProfile } from "../services/userService";
import { getActiveTopics } from "../services/topicService";

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getCurrentUserProfile();
        setProfile(data);
        const topicData = await getActiveTopics();
        setTopics(topicData);
      } catch (error) {
        console.error("Failed to load dashboard profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold text-gray-900">
            Unable to load your dashboard
          </h1>
          <p className="mt-2 text-gray-500">
            We couldn't load your QAL profile.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <p className="text-sm font-medium text-purple-600">QAL Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Welcome back, {profile.full_name}
          </h1>
          <p className="mt-2 text-gray-500">
            Track your analytics learning journey and competition progress.
          </p>
        </div>

        {/* Profile stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total XP"
            value={profile.total_xp}
            description="Experience earned"
          />

          <StatCard
            title="Level"
            value={profile.level}
            description="Current level"
          />

          <StatCard
            title="Streak"
            value={profile.streak}
            description="Current streak"
          />

          <StatCard
            title="Missions"
            value={profile.missions_completed}
            description="Completed missions"
          />
        </div>

        {/* Learning journey */}
        <section>
          <h2 className="text-xl font-bold text-gray-900">
            Your Learning Journey
          </h2>

          <div className="mt-4 rounded-xl bg-white p-6 shadow">
            {topics.length === 0 ? (
  <p className="text-gray-500">
    No learning topics are available yet.
  </p>
) : (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {topics.map((topic) => (
      <div
        key={topic.id}
        className="rounded-lg border border-gray-100 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            {topic.icon || "📚"}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">
              {topic.name}
            </h3>

            <p className="text-sm text-gray-500">
              {topic.description || "Start learning this topic."}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-0 rounded-full bg-purple-600" />
          </div>

          <p className="mt-2 text-xs text-gray-400">
            Progress will appear after completing missions
          </p>
        </div>
      </div>
    ))}
  </div>
)}
          </div>
        </section>

        {/* Missions + Events */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900">
              Active Missions
            </h2>

            <p className="mt-3 text-gray-500">
              Missions will appear here once the mission system is connected.
            </p>
          </section>

          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900">
              Upcoming Events
            </h2>

            <p className="mt-3 text-gray-500">
              Upcoming club events will appear here.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, description }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-purple-600">{value ?? 0}</p>
      <p className="mt-1 text-sm text-gray-400">{description}</p>
    </div>
  );
}

export default Dashboard;