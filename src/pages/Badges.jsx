import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getBadgeCatalog } from "../services/badgeStore";

export default function Badges() {
  const [badges, setBadges] = useState([]);
  useEffect(() => { getBadgeCatalog().then(setBadges); }, []);
  return <Layout><div className="mx-auto max-w-6xl space-y-8"><div><p className="text-sm font-semibold text-purple-600">Collector Cabinet</p><h1 className="mt-1 text-3xl font-bold">QAL Badges</h1><p className="mt-2 text-gray-500">Speciality badges are collectible proof of challenges, skills and seasons you have conquered.</p></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{badges.map((badge) => <div key={badge.id} className="rounded-2xl bg-white p-6 text-center shadow"><BadgeVisual badge={badge}/><h2 className="mt-5 text-lg font-bold">{badge.name}</h2><span className="mt-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">{badge.rarity}</span><p className="mt-3 text-sm text-gray-500">{badge.description}</p></div>)}</div></div></Layout>;
}
function BadgeVisual({ badge }) { return <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-purple-50 text-5xl shadow-inner">{badge.image_url ? <img src={badge.image_url} alt={badge.name} className="h-full w-full object-cover"/> : badge.icon}</div>; }
