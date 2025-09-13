import React, { createContext, useMemo, useState, useContext } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { lightTheme, darkTheme } from "./theme";

const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const useColorMode = () => useContext(ColorModeContext);

export const AppThemeProvider = ({ children }) => {
  const [mode, setMode] = useState("light");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
    }),
    []
  );

  const theme = useMemo(
    () => (mode === "light" ? lightTheme : darkTheme),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
