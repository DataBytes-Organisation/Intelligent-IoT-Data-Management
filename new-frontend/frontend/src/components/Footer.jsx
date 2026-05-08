import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__left">
          <span>About</span>
          <span>Contact</span>
        </div>

        <div className="footer__right">
          © 2026 IoT Dashboard
        </div>
      </div>
    </footer>
  );
};

export default Footer;