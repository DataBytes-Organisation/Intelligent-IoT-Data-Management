import React from "react";
import { Link as RouterLink } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import { AlignJustify } from "lucide-react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { Moon } from "lucide-react";
const Header = ({ toggleTheme, isDarkMode }) => {
  const [anchorElNav, setAnchorElNav] = React.useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <AppBar sx={{ background: "black" }} position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            LOGO
          </Typography>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="menu"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <AlignJustify />
            </IconButton>
            <Menu
              anchorEl={anchorElNav}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
            >
              <MenuItem
                component={RouterLink}
                to="/"
                onClick={handleCloseNavMenu}
              >
                Home
              </MenuItem>
              <MenuItem
                component="a"
                href="/#features"
                onClick={handleCloseNavMenu}
              >
                Features
              </MenuItem>
              <MenuItem
                component="a"
                href="/#data-selection"
                onClick={handleCloseNavMenu}
              >
                Data Selection
              </MenuItem>
              <MenuItem
                component="a"
                href="/#graphs"
                onClick={handleCloseNavMenu}
              >
                Graphs
              </MenuItem>
              <MenuItem
                component={RouterLink}
                to="/login"
                onClick={handleCloseNavMenu}
              >
                Login
              </MenuItem>
              <MenuItem
                component={RouterLink}
                to="/analyze"
                onClick={handleCloseNavMenu}
              >
                Analyze
              </MenuItem>
            </Menu>
          </Box>

          {/* Desktop Menu */}
          <Box
            sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, gap: 2 }}
          >
            <Button component={RouterLink} to="/" sx={{ color: "white" }}>
              Home
            </Button>
            <Button component="a" href="/#features" sx={{ color: "white" }}>
              Features
            </Button>
            <Button
              component="a"
              href="/data-selection"
              sx={{ color: "white" }}
            >
              Data Selection
            </Button>
            <Button component="a" href="/#graphs" sx={{ color: "white" }}>
              Graphs
            </Button>

            <Button
              component={RouterLink}
              to="/analyze"
              sx={{ color: "white" }}
            >
              Analyze
            </Button>
          </Box>

          {/* Avatar / Theme Toggle */}
          <Box sx={{ flexGrow: 0 }}>
            <Button component={RouterLink} to="/login" sx={{ color: "white" }}>
              Login
            </Button>
            <Tooltip title="Toggle Theme">
              <IconButton color="inherit" onClick={toggleTheme} sx={{ p: 0 }}>
                <Moon color="#fff" alt="User Avatar" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
