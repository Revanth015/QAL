import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { createBadgeDraft, deleteBadge, getBadgeCatalog } from "../services/badgeStore";

export default function AdminBadges() {
  const [badges, setBadges] = useState([]);
  const [form, setForm] = useState({ name: "", icon: "🏅", image_url: null, imageFile: null, description: "", rarity: "Rare" });
  const [created, setCreated] = useState(null);
  const update = (key, value) => setForm((v) => ({ ...v, [key]: value }));
  async function refresh() { setBadges(await getBadgeCatalog()); }
  useEffect(() => { refresh().catch(console.error); }, []);
  async function create() {
    if (!form.name.trim()) return;
    const badge = await createBadgeDraft(form);
    setCreated(badge);
    await refresh();
    setForm({ name: "", icon: "🏅", image_url: null, imageFile: null, description: "", rarity: "Rare" });
  }
  async function remove(id) {
    if (!window.confirm("Delete this badge? It will be removed from the active catalog.")) return;
    await deleteBadge(id);
    await refresh();
  }
  function handleImage(file) {
    if (!file) return;
    update("imageFile", file);
    const reader = new FileReader();
    reader.onload = () => update("image_url", reader.result);
    reader.readAsDataURL(file);
  }
  return <Layout><div className="mx-auto max-w-6xl space-y-6"><div><p className="text-sm font-semibold text-purple-600">Admin</p><h1 className="text-3xl font-bold">Badge Creator & Catalog</h1><p className="mt-2 text-gray-500">Create collector badges using a real Supabase image asset or an icon fallback.</p></div><div className="grid gap-6 lg:grid-cols-2"><section className="rounded-xl bg-white p-6 shadow space-y-4"><Field label="Badge name" value={form.name} onChange={(v) => update("name", v)} /><label className="block text-sm font-medium">Badge image<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => handleImage(e.target.files?.[0])} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label><p className="text-xs text-gray-400">Images are uploaded to the qal-badges Supabase Storage bucket.</p><Field label="Fallback icon / emoji" value={form.icon} onChange={(v) => update("icon", v)} /><Field label="Description" value={form.description} onChange={(v) => update("description", v)} /><label className="block text-sm font-medium">Rarity<select value={form.rarity} onChange={(e) => update("rarity", e.target.value)} className="mt-1 w-full rounded-lg border p-2.5"><option>Common</option><option>Rare</option><option>Epic</option><option>Legendary</option></select></label><button onClick={create} className="rounded-lg bg-purple-600 px-5 py-2.5 font-semibold text-white">Create Badge</button>{created && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">✓ Created {created.name}</p>}</section><section className="rounded-xl bg-gray-950 p-8 text-center text-white"><BadgeVisual badge={form} large /><h2 className="mt-5 text-2xl font-bold">{form.name || "New Badge"}</h2><p className="mt-2 text-purple-200">{form.rarity}</p><p className="mt-4 text-sm text-gray-300">{form.description || "Your badge description will appear here."}</p></section></div><section><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-purple-600">Catalog</p><h2 className="text-xl font-bold">All Badges</h2></div><span className="text-sm text-gray-500">{badges.length} badges</span></div><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{badges.map((badge) => <div key={badge.id} className="rounded-xl bg-white p-5 shadow"><div className="flex justify-center"><BadgeVisual badge={badge} /></div><h3 className="mt-4 font-bold">{badge.name}</h3><p className="mt-1 text-xs text-gray-400">{badge.rarity}</p><p className="mt-2 text-sm text-gray-500">{badge.description}</p><button onClick={() => remove(badge.id)} className="mt-4 w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Delete Badge</button></div>)}</div></section></div></Layout>;
}
function Field({ label, value, onChange }) { return <label className="block text-sm font-medium">{label}<input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5" /></label>; }
function BadgeVisual({ badge, large = false }) { return <div className={`${large ? "h-32 w-32 text-6xl" : "h-20 w-20 text-4xl"} flex items-center justify-center overflow-hidden rounded-full bg-white/10 shadow-inner`}>{badge.image_url ? <img src={badge.image_url} alt={badge.name || "Badge"} className="h-full w-full object-cover" /> : badge.icon || "🏅"}</div>; }
