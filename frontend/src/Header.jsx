import { Link } from 'react-router-dom'; // ✅ Import Link from react-router-dom

const Header = ({ toggleTheme, isDarkMode }) => {
  return (
    <div>
      {/* Top Navigation Bar */}
      <header className="top-nav">
        <div className="nav-links">
          <Link to="/">Home</Link>
          <a href="/#features">Features</a>
          <a href="/#data-selection">Data Selection</a>
          <a href="/#graphs">Graphs</a>
          <Link to="/login">Login</Link>
          <Link to="/analyze">Analyze</Link> {/* ✅ New Analyze route */}
        </div>
        <button onClick={toggleTheme} className="theme-toggle-btn">
          {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </button>
      </header>
    </div>
  );
};

export default Header;

