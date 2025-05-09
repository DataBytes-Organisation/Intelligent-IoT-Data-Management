import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./utils/theme";
import ChatBotComponent from "./components/chatbot";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
      <ChatBotComponent/>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
