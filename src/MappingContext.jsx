import { createContext, useContext, useState } from "react";

const MappingContext = createContext(null);

export function MappingProvider({ children }) {
  // { congress: { mappingRows, totalRows, savedAt } }
  const [savedMappings, setSavedMappings] = useState({});

  // List of uploaded databases: [{ id, fileName, format, uploadDate, savedAt, mappingRows, totalRows }]
  const [uploadedDatabases, setUploadedDatabases] = useState([]);

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

  // ── Uploaded databases ────────────────────────────────────────
  const addUploadedDatabase = (data) => {
    const record = {
      id: `udb-${Date.now()}`,
      savedAt: new Date().toISOString(),
      uploadDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      format: "XLSX",
      ...data,
    };
    setUploadedDatabases((prev) => [record, ...prev]);
    return record.id;
  };

  const updateUploadedDatabase = (id, data) => {
    setUploadedDatabases((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data, savedAt: new Date().toISOString() } : r)),
    );
  };

  const removeUploadedDatabase = (id) => {
    setUploadedDatabases((prev) => prev.filter((r) => r.id !== id));
  };

  const getUploadedDatabase = (id) => uploadedDatabases.find((r) => r.id === id) || null;

  return (
    <MappingContext.Provider
      value={{
        savedMappings,
        saveMapping,
        getMapping,
        deleteMapping,
        uploadedDatabases,
        addUploadedDatabase,
        updateUploadedDatabase,
        removeUploadedDatabase,
        getUploadedDatabase,
      }}
    >
      {children}
    </MappingContext.Provider>
  );
}

export function useMappingContext() {
  const ctx = useContext(MappingContext);
  if (!ctx) throw new Error("useMappingContext must be used inside MappingProvider");
  return ctx;
}
