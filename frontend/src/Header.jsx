import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  useTheme,
} from "@mui/material";
import { Sun } from "lucide-react";
import { Moon } from "lucide-react";
const Header = ({ toggleTheme, isDarkMode }) => {
  const theme = useTheme();

  return (
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

        <IconButton
          sx={{ ":hover": "inherit" }}
          onClick={toggleTheme}
          color="inherit"
        >
          {isDarkMode ? <Sun /> : <Moon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
