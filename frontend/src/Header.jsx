import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  Drawer,
} from "@mui/material";
import { Sun, Menu } from "lucide-react";
import { Moon } from "lucide-react";
const Header = ({ toggleTheme, isDarkMode }) => {
  const theme = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const navItems = [
    { label: "Home", to: "/" },
    { label: "Features", href: "/#features" },
    { label: "Data Selection", href: "/#data-selection" },
    { label: "Graphs", href: "/#graphs" },
    { label: "Login", to: "/login" },
    { label: "Analyze", to: "/analyze" },
  ];

  const drawer = (
    <Box sx={{ width: 250 }} onClick={handleDrawerToggle}>
      <List>
        {navItems.map(({ label, to, href }) => (
          <ListItem key={label} disablePadding>
            <ListItemButton
              component={to ? RouterLink : "a"}
              to={to}
              href={href}
            >
              <ListItemText primary={label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="static"
        color="inherit"
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
        }}
        enableColorOnDark
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            IOT Data Management
          </Typography>

          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
            <Button component={RouterLink} to="/" color="inherit">
              Home
            </Button>
            <Button href="/#features" color="inherit">
              Features
            </Button>
            <Button href="/#data-selection" color="inherit">
              Data Selection
            </Button>
            <Button href="/#graphs" color="inherit">
              Graphs
            </Button>
            <Button component={RouterLink} to="/login" color="inherit">
              Login
            </Button>
            <Button component={RouterLink} to="/analyze" color="inherit">
              Analyze
            </Button>
          </Box>

          <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
            >
              <Menu />
            </IconButton>
          </Box>

          <IconButton
            sx={{ ":hover": "inherit" }}
            onClick={toggleTheme}
            color="inherit"
          >
            {isDarkMode ? <Sun /> : <Moon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Improves performance on mobile
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Header;
