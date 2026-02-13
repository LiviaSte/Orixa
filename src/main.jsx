import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { MappingProvider } from "./MappingContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MappingProvider>
      <App />
    </MappingProvider>
  </StrictMode>
);
