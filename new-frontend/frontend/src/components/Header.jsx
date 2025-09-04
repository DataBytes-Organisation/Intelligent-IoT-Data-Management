import React, { useState, useCallback } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Button, IconButton, Box,
  List, ListItem, ListItemButton, ListItemText, useTheme, Drawer, Container
} from "@mui/material";
import { Sun, Moon, Menu } from "lucide-react";

const Header = ({ toggleTheme, isDarkMode }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen((p) => !p);

  const navItems = [
    { label: "Home", to: "/" },
    { label: "Features", href: "/#features" },
    { label: "Data Selection", href: "/#data-selection" },
    { label: "Graphs", href: "/#graphs" },
    { label: "Login", to: "/login" },
    { label: "Analyze", to: "/analyze" },
  ];

  const handleHashNav = useCallback(
    (href) => (e) => {
      if (!href?.startsWith("/#")) return;
      e.preventDefault();
      const [, hash] = href.split("#");

      const scrollTo = () => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(scrollTo, 50);
      } else {
        scrollTo();
      }
      setMobileOpen(false);
    },
    [location.pathname, navigate]
  );

  const isActive = (item) => {
    if (item.to) return location.pathname === item.to || location.pathname.startsWith(item.to + "/");
    if (item.href?.startsWith("/#")) {
      const currentHash = location.hash?.replace("#", "");
      const itemHash = item.href.split("#")[1];
      return location.pathname === "/" && currentHash === itemHash;
    }
    return false;
  };

  const linkSx = (active) => ({
    color: active ? "#673ab7" : theme.palette.text.primary,
    fontSize: "0.95rem",
    textTransform: "none",
    px: 2,
    py: 1,
    borderRadius: "999px",
    fontWeight: 500,
    position: "relative",
    transition: "all 0.25s ease",
    textDecoration: "none",
    "&:hover": {
      backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "#f4f4f4",
      boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
      color: "#673ab7",
      textDecoration: "none",
    },
  });

  const drawer = (
    <Box
      sx={{
        width: 250,
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        height: "100%",
      }}
      onClick={handleDrawerToggle}
    >
      <List>
        {navItems.map(({ label, to, href }) => (
          <ListItem key={label} disablePadding>
            {to ? (
              <ListItemButton component={RouterLink} to={to} sx={{ textDecoration: "none" }}>
                <ListItemText primary={label} />
              </ListItemButton>
            ) : (
              <ListItemButton component="a" href={href} onClick={handleHashNav(href)} sx={{ textDecoration: "none" }}>
                <ListItemText primary={label} />
              </ListItemButton>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          width: "100%",            
          left: 0,
          right: 0,
          margin: 0,
          padding: 0,
          boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Container maxWidth="xl" disableGutters>
          <Toolbar sx={{ px: 2, py: 1, alignItems: "center" }}>
            {/* Mobile Menu Button */}
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <Menu />
            </IconButton>

            {/* Brand (badge + title) */}
            <Box
              component={RouterLink}
              to="/"
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                textDecoration: "none",
                color: theme.palette.text.primary,
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 28,
                  height: 28,
                  borderRadius: "6px",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  color: "white",
                  background: "linear-gradient(to top right, #4f46e5, #3b82f6)",
                }}
              >
                IoT
              </Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ letterSpacing: "0.02em" }}>
                Intelligent IoT
              </Typography>
            </Box>

            {/* Nav Links */}
            <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 2, alignItems: "center" }}>
              {navItems.map((item) =>
                item.to ? (
                  <Button key={item.label} component={RouterLink} to={item.to} sx={linkSx(isActive(item))}>
                    {item.label}
                  </Button>
                ) : (
                  <Button
                    key={item.label}
                    component="a"
                    href={item.href}
                    onClick={handleHashNav(item.href)}
                    sx={linkSx(isActive(item))}
                  >
                    {item.label}
                  </Button>
                )
              )}
            </Box>

            {/* Theme Toggle */}
            <IconButton
              onClick={toggleTheme}
              color="inherit"
              sx={{
                ml: 1,
                border: "1px solid",
                borderColor: theme.palette.divider,
                borderRadius: "50%",
                p: 1,
                "&:hover": { backgroundColor: theme.palette.action.hover },
              }}
              aria-label="Toggle color mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Drawer Menu */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 250,
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Header;
