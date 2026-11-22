import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__left">
          <Link
            to="/about"
            className="footer__link"
            onClick={() => window.scrollTo(0, 0)}
          >
            About
          </Link>
        </div>

        <div className="footer__right">
          © 2026 IoT Dashboard
        </div>
      </div>
    </footer>
  );
};

export default Footer;