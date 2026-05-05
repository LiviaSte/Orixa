import { createContext, useContext, useState } from "react";

const MappingContext = createContext(null);

export function MappingProvider({ children }) {
  // { congress: { mappingRows, totalRows, savedAt } }
  const [savedMappings, setSavedMappings] = useState({});

  // List of uploaded databases: [{ id, fileName, format, uploadDate, savedAt, mappingRows, totalRows }]
  const [uploadedDatabases, setUploadedDatabases] = useState([
    {
      id: "udb-001", fileName: "Sales.xlsx", format: "XLSX", uploadDate: "01/01/2025",
      savedAt: "2025-01-01T00:00:00.000Z", totalRows: 1240,
      mappingRows: [
        { fileColumn: "Order ID",      type: "number", orixaColumn: "HCP ID",           confidence: 85,  status: "Mapped", preview: "ORD-00142" },
        { fileColumn: "Customer ID",   type: "number", orixaColumn: "NPI Number",       confidence: 85,  status: "Mapped", preview: "CUS-3821" },
        { fileColumn: "Product SKU",   type: "string", orixaColumn: "Notes",            confidence: 80,  status: "Mapped", preview: "DHH-ECG-01" },
        { fileColumn: "Product Name",  type: "string", orixaColumn: "Account Name",     confidence: 82,  status: "Mapped", preview: "D-Heart Home ECG Monitor" },
        { fileColumn: "Revenue",       type: "number", orixaColumn: "Engagement Score", confidence: 80,  status: "Mapped", preview: "€2,450.00" },
        { fileColumn: "Units Sold",    type: "number", orixaColumn: "Booth Visits",     confidence: 83,  status: "Mapped", preview: "8" },
        { fileColumn: "Sale Date",     type: "date",   orixaColumn: "Date",             confidence: 95,  status: "Mapped", preview: "12/03/2025" },
        { fileColumn: "Country",       type: "string", orixaColumn: "Country",          confidence: 100, status: "Mapped", preview: "Italy" },
        { fileColumn: "Region",        type: "string", orixaColumn: "Region",           confidence: 100, status: "Mapped", preview: "Lombardy" },
        { fileColumn: "Sales Rep",     type: "string", orixaColumn: "Sales Rep",        confidence: 100, status: "Mapped", preview: "Alice Martin" },
        { fileColumn: "Account Name",  type: "string", orixaColumn: "Account Name",     confidence: 100, status: "Mapped", preview: "Policlinico di Milano" },
        { fileColumn: "Year",          type: "number", orixaColumn: "Year",             confidence: 100, status: "Mapped", preview: "2025" },
      ],
    },
    {
      id: "udb-002", fileName: "Customers.xlsx", format: "XLSX", uploadDate: "01/01/2025",
      savedAt: "2025-01-01T00:00:00.000Z", totalRows: 890,
      mappingRows: [
        { fileColumn: "First Name",    type: "string", orixaColumn: "Name",         confidence: 95,  status: "Mapped", preview: "Elena" },
        { fileColumn: "Last Name",     type: "string", orixaColumn: "Surname",      confidence: 95,  status: "Mapped", preview: "Rossi" },
        { fileColumn: "Email",         type: "string", orixaColumn: "Email",        confidence: 100, status: "Mapped", preview: "elena.rossi@stjude.org" },
        { fileColumn: "Phone",         type: "string", orixaColumn: "Phone",        confidence: 100, status: "Mapped", preview: "+39 02 8943 7000" },
        { fileColumn: "Specialty",     type: "string", orixaColumn: "Specialty",    confidence: 100, status: "Mapped", preview: "Interventional Cardiology" },
        { fileColumn: "Title",         type: "string", orixaColumn: "Title",        confidence: 100, status: "Mapped", preview: "Dr." },
        { fileColumn: "Account Name",  type: "string", orixaColumn: "Account Name", confidence: 100, status: "Mapped", preview: "Mayo Clinic" },
        { fileColumn: "City",          type: "string", orixaColumn: "City",         confidence: 100, status: "Mapped", preview: "Milan" },
        { fileColumn: "Country",       type: "string", orixaColumn: "Country",      confidence: 100, status: "Mapped", preview: "Italy" },
        { fileColumn: "Region",        type: "string", orixaColumn: "Region",       confidence: 100, status: "Mapped", preview: "Lombardy" },
        { fileColumn: "HCP ID",        type: "number", orixaColumn: "HCP ID",       confidence: 100, status: "Mapped", preview: "1042387" },
        { fileColumn: "NPI Number",    type: "number", orixaColumn: "NPI Number",   confidence: 100, status: "Mapped", preview: "1427356819" },
        { fileColumn: "Department",    type: "string", orixaColumn: "Department",   confidence: 100, status: "Mapped", preview: "Cardiology" },
        { fileColumn: "Customer Type", type: "string", orixaColumn: "Specialty",    confidence: 82,  status: "Mapped", preview: "HCP" },
        { fileColumn: "Tier",          type: "string", orixaColumn: "Department",   confidence: 80,  status: "Mapped", preview: "Tier 1" },
      ],
    },
    {
      id: "udb-003", fileName: "Products.xlsx", format: "XLSX", uploadDate: "01/01/2025",
      savedAt: "2025-01-01T00:00:00.000Z", totalRows: 356,
      mappingRows: [
        { fileColumn: "Product Name",       type: "string", orixaColumn: "Account Name", confidence: 82,  status: "Mapped", preview: "D-Heart Home ECG Monitor" },
        { fileColumn: "SKU",                type: "string", orixaColumn: "HCP ID",       confidence: 80,  status: "Mapped", preview: "DHH-ECG-01" },
        { fileColumn: "Primary Category",   type: "string", orixaColumn: "Specialty",    confidence: 84,  status: "Mapped", preview: "Consumer medical device" },
        { fileColumn: "Secondary Category", type: "string", orixaColumn: "Department",   confidence: 82,  status: "Mapped", preview: "Portable ECG monitor" },
        { fileColumn: "Description",        type: "string", orixaColumn: "Notes",        confidence: 88,  status: "Mapped", preview: "Single-lead ECG for home monitoring" },
        { fileColumn: "Pricing Model",      type: "string", orixaColumn: "Notes",        confidence: 80,  status: "Mapped", preview: "One-time hardware purchase" },
        { fileColumn: "Country of Origin",  type: "string", orixaColumn: "Country",      confidence: 90,  status: "Mapped", preview: "Italy" },
        { fileColumn: "Launch Date",        type: "date",   orixaColumn: "Date",         confidence: 90,  status: "Mapped", preview: "15/01/2024" },
        { fileColumn: "Regulatory Status",  type: "string", orixaColumn: "Title",        confidence: 81,  status: "Mapped", preview: "Class IIA, CE marked" },
        { fileColumn: "Notes",              type: "string", orixaColumn: "Notes",        confidence: 100, status: "Mapped", preview: "FDA 510(k) pending" },
      ],
    },
    {
      id: "udb-004", fileName: "Congress.xlsx", format: "XLSX", uploadDate: "01/01/2025",
      savedAt: "2025-01-01T00:00:00.000Z", totalRows: 720,
      mappingRows: [
        { fileColumn: "Congress Name",     type: "string", orixaColumn: "Congress Name",     confidence: 100, status: "Mapped", preview: "ESC Congress 2025" },
        { fileColumn: "Congress Date",     type: "date",   orixaColumn: "Congress Date",     confidence: 100, status: "Mapped", preview: "30/08/2025" },
        { fileColumn: "Congress Location", type: "string", orixaColumn: "Congress Location", confidence: 100, status: "Mapped", preview: "Barcelona, Spain" },
        { fileColumn: "Speaker Name",      type: "string", orixaColumn: "Name",              confidence: 90,  status: "Mapped", preview: "Dr. Marco Ferretti" },
        { fileColumn: "Session Title",     type: "string", orixaColumn: "Session Title",     confidence: 100, status: "Mapped", preview: "Novel Approaches in Cardiac Imaging" },
        { fileColumn: "Speaker Role",      type: "string", orixaColumn: "Speaker Role",      confidence: 100, status: "Mapped", preview: "Chair" },
        { fileColumn: "Attendance Status", type: "string", orixaColumn: "Attendance Status", confidence: 100, status: "Mapped", preview: "Confirmed" },
        { fileColumn: "Booth Visits",      type: "number", orixaColumn: "Booth Visits",      confidence: 100, status: "Mapped", preview: "14" },
        { fileColumn: "HCP ID",            type: "number", orixaColumn: "HCP ID",            confidence: 100, status: "Mapped", preview: "1042387" },
        { fileColumn: "Email",             type: "string", orixaColumn: "Email",             confidence: 100, status: "Mapped", preview: "m.ferretti@gemelli.it" },
        { fileColumn: "Country",           type: "string", orixaColumn: "Country",           confidence: 100, status: "Mapped", preview: "Italy" },
        { fileColumn: "Engagement Score",  type: "number", orixaColumn: "Engagement Score",  confidence: 100, status: "Mapped", preview: "78" },
      ],
    },
    {
      id: "udb-005", fileName: "Contacts.xlsx", format: "XLSX", uploadDate: "01/01/2025",
      savedAt: "2025-01-01T00:00:00.000Z", totalRows: 2100,
      mappingRows: [
        { fileColumn: "First Name",   type: "string", orixaColumn: "Name",         confidence: 95,  status: "Mapped", preview: "Sophie" },
        { fileColumn: "Last Name",    type: "string", orixaColumn: "Surname",      confidence: 95,  status: "Mapped", preview: "Laurent" },
        { fileColumn: "Email",        type: "string", orixaColumn: "Email",        confidence: 100, status: "Mapped", preview: "s.laurent@larib.fr" },
        { fileColumn: "Phone",        type: "string", orixaColumn: "Phone",        confidence: 100, status: "Mapped", preview: "+33 1 49 95 65 65" },
        { fileColumn: "Account Name", type: "string", orixaColumn: "Account Name", confidence: 100, status: "Mapped", preview: "Hôpital Lariboisière" },
        { fileColumn: "City",         type: "string", orixaColumn: "City",         confidence: 100, status: "Mapped", preview: "Paris" },
        { fileColumn: "Country",      type: "string", orixaColumn: "Country",      confidence: 100, status: "Mapped", preview: "France" },
        { fileColumn: "Specialty",    type: "string", orixaColumn: "Specialty",    confidence: 100, status: "Mapped", preview: "Oncology" },
        { fileColumn: "Title",        type: "string", orixaColumn: "Title",        confidence: 100, status: "Mapped", preview: "Dr." },
        { fileColumn: "Sales Rep",    type: "string", orixaColumn: "Sales Rep",    confidence: 100, status: "Mapped", preview: "Marie Dupont" },
        { fileColumn: "NPI Number",   type: "number", orixaColumn: "NPI Number",   confidence: 100, status: "Mapped", preview: "9038471256" },
        { fileColumn: "Address",      type: "string", orixaColumn: "Address",      confidence: 100, status: "Mapped", preview: "2 Rue Ambroise Paré" },
        { fileColumn: "Postal Code",  type: "string", orixaColumn: "Postal Code",  confidence: 100, status: "Mapped", preview: "75010" },
        { fileColumn: "Notes",        type: "string", orixaColumn: "Notes",        confidence: 100, status: "Mapped", preview: "High-priority contact" },
        { fileColumn: "Lead Source",  type: "string", orixaColumn: "Notes",        confidence: 82,  status: "Mapped", preview: "Congress" },
      ],
    },
  ]);

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
