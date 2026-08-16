import { NavLink, Link } from "react-router-dom"; 
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "../services/authService";


function Navbar() {
  const { session, userProfile } = useAuth();

  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-md transition ${
      isActive
        ? "bg-purple-600 text-white"
        : "text-gray-700 hover:bg-purple-100"
    }`;

  async function handleSignOut() {
    const { error } = await signOut();

    if (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <nav className="flex items-center justify-between bg-white px-6 py-4 shadow-md">
      <h1 className="text-2xl font-bold text-purple-600">QAL</h1>

      <div className="flex items-center gap-2">
        <NavLink to="/" className={linkClass}>
          Home
        </NavLink>

        {userProfile?.role === "admin" && (
  <NavLink to="/admin" className={linkClass}>
    Admin
  </NavLink>
)}

        <NavLink to="/dashboard" className={linkClass}>
          Dashboard
        </NavLink>
        

        <NavLink to="/missions" className={linkClass}>
          Missions
        </NavLink>

        <NavLink to="/leaderboard" className={linkClass}>
          Leaderboard
        </NavLink>

        <NavLink to="/profile" className={linkClass}>
          Profile
        </NavLink>

        {session ? (
  <button
    onClick={handleSignOut}
    className="ml-2 rounded-md bg-gray-800 px-4 py-2 text-white transition hover:bg-gray-700"
  >
    Logout
  </button>
) : (
  <NavLink to="/login" className={linkClass}>
    Login
  </NavLink>
)}
   
      </div>
    </nav>
  );
}

export default Navbar;