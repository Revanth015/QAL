import { NavLink } from 'react-router-dom';

function Navbar() {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-md transition ${
      isActive
        ? 'bg-purple-600 text-white'
        : 'text-gray-700 hover:bg-purple-100'
    }`;

  return (
    <nav className="flex items-center justify-between bg-white shadow-md px-6 py-4">
      <h1 className="text-2xl font-bold text-purple-600">QAL</h1>

      <div className="flex gap-2">
        <NavLink to="/" className={linkClass}>
          Home
        </NavLink>

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
      </div>
    </nav>
  );
}

export default Navbar;
