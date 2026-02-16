import { createContext, useContext, useState } from "react";

const OpportunityContext = createContext(null);

export function OpportunityProvider({ children }) {
  // { triggers, operators, fromStage, toStage, savedAt } | null
  const [savedOpportunity, setSavedOpportunity] = useState(null);

  const saveOpportunity = (data) => {
    setSavedOpportunity({
      ...data,
      savedAt: new Date().toISOString(),
    });
  };

  const getOpportunity = () => savedOpportunity;

  const deleteOpportunity = () => {
    setSavedOpportunity(null);
  };

  return (
    <OpportunityContext.Provider
      value={{ savedOpportunity, saveOpportunity, getOpportunity, deleteOpportunity }}
    >
      {children}
    </OpportunityContext.Provider>
  );
}

export function useOpportunityContext() {
  const ctx = useContext(OpportunityContext);
  if (!ctx)
    throw new Error("useOpportunityContext must be used inside OpportunityProvider");
  return ctx;
}
