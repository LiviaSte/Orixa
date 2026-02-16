import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { MappingProvider } from "./MappingContext";
import { OpportunityProvider } from "./OpportunityContext";
import { DomainDefinitionProvider } from "./DomainDefinitionContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MappingProvider>
      <OpportunityProvider>
        <DomainDefinitionProvider>
          <App />
        </DomainDefinitionProvider>
      </OpportunityProvider>
    </MappingProvider>
  </StrictMode>
);
