import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#f4f7f9",
      contrastText: "#000000",
    },
    checkbox: {
      main: "#000",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#000000",
      secondary: "#555555",
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1e1e1e",
      contrastText: "#ffffff",
    },
    background: {
      default: "#4e5d6d",
      paper: "#1e1e1e",
    },
    checkbox: {
      main: "#000",
    },
    text: {
      primary: "#ffffff",
      secondary: "#cccccc",
    },
  },
});
