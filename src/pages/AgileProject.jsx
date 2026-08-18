import Layout from "../components/Layout";

const columns = [
  { title: "Backlog", items: ["Define Season 01 scoring contract", "Design badge rarity rules"] },
  { title: "In Progress", items: ["QAL Intelligence evaluator", "AI Mission Studio"] },
  { title: "Review", items: ["Excel generation contract", "Admin submission workflow"] },
  { title: "Done", items: ["Authentication", "Mission submissions", "Leaderboard", "Profile"] },
];

export default function AgileProject() {
  return <Layout><div className="mx-auto max-w-7xl space-y-8"><div><p className="text-sm font-semibold text-purple-600">Management View</p><h1 className="mt-1 text-3xl font-bold">QAL Agile Project Workspace</h1><p className="mt-2 max-w-3xl text-gray-500">A simplified project-management view showing what the team is building, what is currently being worked on, what is under review and what is complete.</p></div><div className="grid gap-4 sm:grid-cols-3"><Metric title="Product areas" value="8" detail="Core workstreams"/><Metric title="Active work" value="2" detail="Intelligence + AI"/><Metric title="Completed" value="6" detail="Connected modules"/></div><div className="grid gap-5 lg:grid-cols-4">{columns.map((column) => <section key={column.title} className="rounded-xl bg-white p-4 shadow"><div className="flex items-center justify-between"><h2 className="font-bold">{column.title}</h2><span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold">{column.items.length}</span></div><div className="mt-4 space-y-3">{column.items.map((item) => <div key={item} className="rounded-lg border border-gray-200 p-3 text-sm font-medium text-gray-700">{item}</div>)}</div></section>)}</div><section className="rounded-xl bg-gray-950 p-6 text-white"><h2 className="text-xl font-bold">Current product flow</h2><div className="mt-5 grid gap-3 md:grid-cols-6">{["Mission Design", "Excel Contract", "Student Work", "AI Evaluation", "Feedback", "Badges / Seasons"].map((x, i) => <div key={x} className="rounded-lg border border-gray-700 p-3 text-center text-sm"><div className="text-xs text-purple-300">0{i + 1}</div><div className="mt-1 font-semibold">{x}</div></div>)}</div></section></div></Layout>;
}
function Metric({ title, value, detail }) { return <div className="rounded-xl bg-white p-5 shadow"><p className="text-sm text-gray-500">{title}</p><p className="mt-2 text-3xl font-bold text-purple-600">{value}</p><p className="mt-1 text-xs text-gray-400">{detail}</p></div>; }
