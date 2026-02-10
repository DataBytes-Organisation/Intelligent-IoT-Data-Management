import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563eb" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiTextField: {
      defaultProps: { variant: "outlined" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",               // keep the field white
        },
        input: {
          backgroundColor: "transparent",
        },
      },
    },
  },
});

export default theme;
