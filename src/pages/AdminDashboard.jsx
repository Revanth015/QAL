import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";

function AdminDashboard() {
  const { userProfile } = useAuth();

  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-sm font-medium text-purple-600">QAL Administration</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-500">Welcome, {userProfile?.full_name || "Administrator"}.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Students" value="—" />
          <StatCard title="Active Missions" value="—" />
          <StatCard title="Submissions" value="—" />
          <StatCard title="Pending Evaluation" value="—" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Link to="/admin/missions" className="rounded-xl bg-white p-6 shadow transition hover:shadow-md">
            <h2 className="text-lg font-bold text-gray-900">Mission Management</h2>
            <p className="mt-2 text-sm text-gray-500">Create, edit, deactivate, and manage QAL missions.</p>
          </Link>

          <Link to="/admin/submissions" className="rounded-xl bg-white p-6 shadow transition hover:shadow-md">
            <h2 className="text-lg font-bold text-gray-900">Submission Evaluation</h2>
            <p className="mt-2 text-sm text-gray-500">Review student submissions and AI evaluation results.</p>
          </Link>

          <Link to="/admin/ai" className="rounded-xl bg-white p-6 shadow transition hover:shadow-md">
            <h2 className="text-lg font-bold text-gray-900">AI Mission Studio</h2>
            <p className="mt-2 text-sm text-gray-500">Generate story-driven mission blueprints and future AI workflows.</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value }) {
  return <div className="rounded-xl bg-white p-6 shadow"><p className="text-sm text-gray-500">{title}</p><p className="mt-2 text-3xl font-bold text-gray-900">{value}</p></div>;
}

export default AdminDashboard;
