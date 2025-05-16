import { useState, useEffect } from "react";
import "./App.css";
import { Route, Routes, useLocation } from "react-router-dom";
import Header from "./Header";
import Home from "./Home";
import Footer from "./Footer";
import Login from "./Login";
import Register from "./Register.jsx";
import AnalyzePanel from "./AnalyzePanel"; // ✅ Import the AnalyzePanel component
import { CssBaseline, ThemeProvider } from "@mui/material";
import { darkTheme, lightTheme } from "./utils/theme.jsx";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false); // State for dark mode
  const location = useLocation();
  useEffect(() => {
    // Get the theme from localStorage on load and set the state accordingly
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    // Whenever the theme changes, save the theme to localStorage
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode); // Toggle dark mode
  };

  const hideLayout = ["/login", "/register"].includes(location.pathname);
  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      {!hideLayout && (
        <Header toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      )}
      {/* Navigation includes link */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/analyze" element={<AnalyzePanel />} />{" "}
        {/* ✅ New Analyze route */}
      </Routes>
      {!hideLayout && <Footer />}
    </ThemeProvider>
  );
}

export default App;
