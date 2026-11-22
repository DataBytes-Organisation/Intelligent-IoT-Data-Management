import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { logoutUser } from "../services/authClient";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      navigate("/");
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">

        {/* LEFT SIDE */}
        <Link
          to="/home"
          className="navbar__brand"
          onClick={() => window.scrollTo(0, 0)}
        >
          <div className="navbar__logo">
            <span>IoT</span>
          </div>

          <span className="navbar__title">
            IoT Sensors Dashboard
          </span>
        </Link>

        {/* RIGHT SIDE */}
        <div className="navbar__actions">
          <Link
            to="/home"
            className="navbar__link"
            onClick={() => window.scrollTo(0, 0)}
          >
            Home
          </Link>

          <button
            className="navbar__logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;