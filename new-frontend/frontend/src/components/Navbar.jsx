import { NavLink, Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav__inner">
        <Link to="/" className="brand">
          {/* replace with an <img> if you add a logo */}
          <span className="brand__logo">🛰️</span>
          <span className="brand__text">IoT Dashboard</span>
        </Link>

        <nav className="nav__links">
          <NavLink to="/" end className={({ isActive }) => isActive ? "link active" : "link"}>Home</NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "link active" : "link"}>Dashboard</NavLink>
          <NavLink to="/login" className={({ isActive }) => isActive ? "link active" : "link"}>Login</NavLink>
          <NavLink to="/logout" className={({ isActive }) => isActive ? "link active" : "link"}>Logout</NavLink>
        </nav>
      </div>
    </header>
  );
}
