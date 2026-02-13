import { createContext, useContext, useState } from "react";

const MappingContext = createContext(null);

export function MappingProvider({ children }) {
  // { congress: { mappingRows, totalRows, savedAt } }
  const [savedMappings, setSavedMappings] = useState({});

  const saveMapping = (domain, data) => {
    setSavedMappings((prev) => ({
      ...prev,
      [domain]: { ...data, savedAt: new Date().toISOString() },
    }));
  };

  const deleteMapping = (domain) => {
    setSavedMappings((prev) => {
      const next = { ...prev };
      delete next[domain];
      return next;
    });
  };

  const getMapping = (domain) => savedMappings[domain] || null;

  return (
    <MappingContext.Provider value={{ savedMappings, saveMapping, getMapping, deleteMapping }}>
      {children}
    </MappingContext.Provider>
  );
}

export function useMappingContext() {
  const ctx = useContext(MappingContext);
  if (!ctx) throw new Error("useMappingContext must be used inside MappingProvider");
  return ctx;
}
