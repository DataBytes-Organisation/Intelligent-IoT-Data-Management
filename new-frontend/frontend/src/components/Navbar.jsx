import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div
          className="navbar__brand"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
        >
          <div className="navbar__logo">●</div>
          <span className="navbar__title">IoT Dashboard</span>
        </div>

        <button
          className="navbar__login-btn"
          type="button"
          onClick={() => navigate("/")}
        >
          Home
        </button>
      </div>
    </nav>
  );
};

export default Navbar;