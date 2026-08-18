import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "../services/authService";

function Navbar() {
  const { session, userProfile } = useAuth();
  const linkClass = ({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition ${isActive ? "bg-purple-600 text-white" : "text-gray-700 hover:bg-purple-100"}`;
  async function handleSignOut() { const { error } = await signOut(); if (error) console.error("Logout failed:", error); }
  return <nav className="flex flex-wrap items-center justify-between gap-3 bg-white px-6 py-4 shadow-md"><NavLink to="/" className="text-2xl font-bold text-purple-600">QAL</NavLink><div className="flex flex-wrap items-center gap-1"><NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink><NavLink to="/missions" className={linkClass}>Missions</NavLink><NavLink to="/events" className={linkClass}>Events</NavLink><NavLink to="/badges" className={linkClass}>Badges</NavLink><NavLink to="/leaderboard" className={linkClass}>Leaderboard</NavLink><NavLink to="/profile" className={linkClass}>Profile</NavLink>{userProfile?.role === "admin" && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}{session ? <button onClick={handleSignOut} className="ml-2 rounded-md bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700">Logout</button> : <NavLink to="/login" className={linkClass}>Login</NavLink>}</div></nav>;
}
export default Navbar;
