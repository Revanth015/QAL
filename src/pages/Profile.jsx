import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { getCurrentUserProfile } from "../services/userService";
import { getMyBadges } from "../services/badgeService";

function Profile() {
  const { userProfile } = useAuth();
  const [profile, setProfile] = useState(userProfile);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(!userProfile);
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([userProfile ? Promise.resolve(userProfile) : getCurrentUserProfile(), getMyBadges()]).then(([p, b]) => { setProfile(p); setBadges(b); }).catch((err) => setError(err.message || "Unable to load profile.")).finally(() => setLoading(false)); }, [userProfile]);
  if (loading) return <Layout><div className="p-8 text-gray-500">Loading profile...</div></Layout>;
  if (error) return <Layout><div className="rounded-xl bg-white p-8 text-red-600 shadow">{error}</div></Layout>;
  return <Layout><div className="mx-auto max-w-5xl space-y-6">
    <div className="rounded-2xl bg-gray-950 p-8 text-white shadow"><div className="flex flex-wrap items-center gap-5">{profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="h-20 w-20 rounded-full object-cover"/> : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-500 text-2xl font-bold">{(profile?.full_name || "Q").charAt(0).toUpperCase()}</div>}<div><p className="text-sm font-medium text-purple-300">QAL Collector</p><h1 className="text-3xl font-bold">{profile?.full_name || "Learner"}</h1><p className="text-gray-400">{profile?.email || ""}</p></div></div></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Total XP" value={profile?.total_xp || 0}/><Stat label="Level" value={profile?.level || 1}/><Stat label="Streak" value={`${profile?.streak || 0} days`}/><Stat label="Missions" value={profile?.missions_completed || 0}/></div>
    <section className="rounded-xl bg-white p-6 shadow"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-purple-600">Collector Cabinet</p><h2 className="mt-1 text-xl font-bold">Your Badges</h2></div><span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">{badges.length} collected</span></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{badges.map((badge) => <div key={badge.id} className="rounded-xl border border-gray-100 p-4 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-purple-50 text-3xl">{badge.image_url ? <img src={badge.image_url} alt={badge.name} className="h-full w-full object-cover"/> : badge.icon || "🏅"}</div><p className="mt-3 font-bold">{badge.name}</p><p className="mt-1 text-xs text-gray-400">{badge.rarity}</p></div>)}</div>{badges.length===0&&<p className="mt-5 text-sm text-gray-500">Your collector cabinet is empty. Complete missions and seasons to earn badges.</p>}</section>
    <section className="rounded-xl bg-white p-6 shadow"><h2 className="text-xl font-bold">Your QAL Journey</h2><p className="mt-2 text-gray-500">Missions, seasons, skill progress and AI feedback will accumulate here as your collector history grows.</p><div className="mt-5 grid gap-4 md:grid-cols-3"><div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-400">Next milestone</p><p className="mt-1 font-bold">Complete a season</p></div><div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-400">Collector goal</p><p className="mt-1 font-bold">Unlock a Legendary badge</p></div><div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-400">Current focus</p><p className="mt-1 font-bold">Build analytical mastery</p></div></div></section>
  </div></Layout>;
}
function Stat({ label, value }) { return <div className="rounded-xl bg-white p-5 shadow"><p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p><p className="mt-2 text-2xl font-bold text-gray-900">{value}</p></div>; }
export default Profile;
