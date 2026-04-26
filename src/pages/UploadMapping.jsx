import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useMappingContext } from "../MappingContext";
import {
  LinkIcon,
  ChevronDownIcon,
  SortIcon,
  MappingSearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../components/icons";

// ── Orixa system fields ──────────────────────────────────────────
const ORIXA_SYSTEM_FIELDS = [
  { name: "Email", type: "string", description: "HCP email address" },
  { name: "Name", type: "string", description: "First name" },
  { name: "Surname", type: "string", description: "Last name / family name" },
  { name: "Country", type: "string", description: "Country of practice" },
  { name: "City", type: "string", description: "City of practice" },
  { name: "Phone", type: "string", description: "Phone number" },
  { name: "Account Name", type: "string", description: "Hospital / institution" },
  { name: "Specialty", type: "string", description: "Medical specialty" },
  { name: "Organization", type: "string", description: "Parent organization" },
  { name: "Department", type: "string", description: "Department within org" },
  { name: "Title", type: "string", description: "Professional title" },
  { name: "Address", type: "string", description: "Street address" },
  { name: "Postal Code", type: "string", description: "ZIP / postal code" },
  { name: "Region", type: "string", description: "State / region / province" },
  { name: "Sales Rep", type: "string", description: "Assigned sales rep" },
  { name: "HCP ID", type: "number", description: "Unique HCP identifier" },
  { name: "NPI Number", type: "number", description: "National Provider ID" },
  { name: "Congress Name", type: "string", description: "Name of the congress" },
  { name: "Congress Date", type: "date", description: "Date of the congress" },
  { name: "Congress Location", type: "string", description: "Venue / city of congress" },
  { name: "Session Title", type: "string", description: "Presentation / session title" },
  { name: "Speaker Role", type: "string", description: "Chair, speaker, attendee…" },
  { name: "Attendance Status", type: "string", description: "Confirmed, pending, declined" },
  { name: "Booth Visits", type: "number", description: "Number of booth visits" },
  { name: "Engagement Score", type: "number", description: "Computed engagement metric" },
  { name: "Year", type: "number", description: "Calendar year" },
  { name: "Date", type: "date", description: "Generic date field" },
  { name: "Notes", type: "string", description: "Free-text notes" },
];

const FIELD_NAMES = ORIXA_SYSTEM_FIELDS.map((f) => f.name);

// ── Auto-match helper ────────────────────────────────────────────
function matchOrixaField(fileColumn) {
  const col = fileColumn.toLowerCase().trim();
  const exactMap = {
    email: "Email", "e-mail": "Email",
    "first name": "Name", first_name: "Name", firstname: "Name",
    "last name": "Surname", last_name: "Surname", lastname: "Surname",
    surname: "Surname", "full name": "Name", fullname: "Name", name: "Name",
    country: "Country", city: "City",
    phone: "Phone", telephone: "Phone", "phone number": "Phone",
    "account name": "Account Name", account: "Account Name",
    specialty: "Specialty", speciality: "Specialty",
    organization: "Organization", organisation: "Organization",
    department: "Department", title: "Title", address: "Address",
    "postal code": "Postal Code", zip: "Postal Code", zipcode: "Postal Code", "zip code": "Postal Code",
    region: "Region", state: "Region",
    "sales rep": "Sales Rep", sales_rep: "Sales Rep", salesrep: "Sales Rep",
    "hcp id": "HCP ID", hcpid: "HCP ID",
    "npi number": "NPI Number", npi: "NPI Number",
    "congress name": "Congress Name", "congress date": "Congress Date",
    "congress location": "Congress Location", "session title": "Session Title",
    "speaker role": "Speaker Role", "attendance status": "Attendance Status",
    "booth visits": "Booth Visits", "engagement score": "Engagement Score",
    year: "Year", date: "Date", notes: "Notes",
    comments: null, comment: null,
  };
  if (col in exactMap) return exactMap[col];
  for (const field of FIELD_NAMES) {
    if (col.includes(field.toLowerCase()) || field.toLowerCase().includes(col)) return field;
  }
  return null;
}

function computeConfidence(fileColumn, orixaField) {
  if (!orixaField) return null;
  const col = fileColumn.toLowerCase().trim();
  const field = orixaField.toLowerCase();
  if (col === field) return 100;
  if (col.includes(field) || field.includes(col)) return 95;
  return Math.floor(Math.random() * 15) + 80;
}

// ── Searchable Dropdown ──────────────────────────────────────────
function OrixaDropdown({ value, onChange, allFields, readOnly }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const filtered = allFields.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (fieldName) => { onChange(fieldName); setIsOpen(false); setSearch(""); };
  const handleClear = (e) => { e.stopPropagation(); onChange(null); setIsOpen(false); setSearch(""); };

  if (readOnly) {
    return (
      <div className="flex-1">
        {value
          ? <span className="text-sm text-[#0a0a0a]">{value}</span>
          : <span className="text-sm italic text-[#99a1af]">Not mapped</span>}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      {value ? (
        <button
          onClick={() => setIsOpen((o) => !o)}
          className={`flex w-full items-center justify-between rounded-[10px] border bg-white px-[13px] py-[7px] text-left transition-colors ${
            isOpen ? "border-[#155dfc] ring-1 ring-[#155dfc]" : "border-[#d1d5dc] hover:border-[#9ca3af]"
          }`}
        >
          <span className="text-sm text-[#0a0a0a]">{value}</span>
          <ChevronDownIcon />
        </button>
      ) : (
        <div className="relative">
          <input
            ref={!value ? inputRef : undefined}
            type="text"
            placeholder="Search system fields"
            value={search}
            onChange={(e) => { setSearch(e.target.value); if (!isOpen) setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            className={`w-full rounded-[10px] border bg-white px-3 py-[7px] text-sm text-[#0a0a0a] placeholder:text-[#99a1af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc] ${
              isOpen ? "border-[#155dfc] ring-1 ring-[#155dfc]" : "border-[#d1d5dc]"
            }`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <MappingSearchIcon />
          </span>
        </div>
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 flex max-h-[280px] flex-col overflow-hidden rounded-[10px] border border-[#d1d5dc] bg-white shadow-lg">
          {value && (
            <div className="border-b border-gray-200 p-2">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search system fields..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-[#d1d5dc] bg-[#f9fafb] px-3 py-1.5 pl-8 text-sm placeholder:text-[#99a1af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                />
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                  <MappingSearchIcon />
                </span>
              </div>
            </div>
          )}
          <div className="overflow-y-auto">
            {value && (
              <button
                onClick={handleClear}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#dc2626] transition-colors hover:bg-red-50"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3L11 11M3 11L11 3" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Remove mapping
              </button>
            )}
            {filtered.length > 0 ? (
              filtered.map((field) => {
                const isSelected = field.name === value;
                return (
                  <button
                    key={field.name}
                    onClick={() => handleSelect(field.name)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors ${
                      isSelected ? "bg-[#eff6ff] text-[#155dfc]" : "text-[#0a0a0a] hover:bg-[#f9fafb]"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{field.name}</span>
                      <span className="text-xs text-[#6a7282]">{field.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wide text-[#99a1af]">{field.type}</span>
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7L5.5 10L11.5 4" stroke="#155dfc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-sm text-[#99a1af]">No matching fields found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
const PAGE_SIZE = 10;

export default function UploadMapping() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    addUploadedDatabase,
    updateUploadedDatabase,
    removeUploadedDatabase,
    getUploadedDatabase,
  } = useMappingContext();

  // State comes in two forms:
  //   Fresh upload:   { columns, totalRows, fileName }
  //   Existing view:  { recordId }
  const { columns = [], totalRows = 0, fileName = "", recordId = null } = location.state || {};

  // Load existing record if editing/viewing
  const existingRecord = recordId ? getUploadedDatabase(recordId) : null;
  const hasIncomingData = columns.length > 0;
  const hasData = hasIncomingData || !!existingRecord;

  // Track the ID of the record we're currently editing (set after first save)
  const [currentRecordId, setCurrentRecordId] = useState(existingRecord?.id || null);
  const [isReadOnly, setIsReadOnly] = useState(!!existingRecord && !hasIncomingData);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnmappedOnly, setShowUnmappedOnly] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);

  const [mappingRows, setMappingRows] = useState(() => {
    if (hasIncomingData) {
      return columns.map((col) => {
        const orixaField = matchOrixaField(col.fileColumn);
        return {
          fileColumn: col.fileColumn,
          type: col.type,
          preview: col.preview,
          orixaColumn: orixaField,
          confidence: computeConfidence(col.fileColumn, orixaField),
          status: orixaField ? "Mapped" : "Unmapped",
        };
      });
    }
    if (existingRecord) return existingRecord.mappingRows;
    return [];
  });

  const displayFileName = fileName || existingRecord?.fileName || "";
  const isSaved = !!currentRecordId || !!existingRecord;
  // Strip file extension for use as page title
  const fileTitle = displayFileName.replace(/\.[^/.]+$/, "") || "Upload database";

  const handleFieldChange = (rowIndex, newField) => {
    setMappingRows((prev) =>
      prev.map((row, i) => {
        if (i !== rowIndex) return row;
        return {
          ...row,
          orixaColumn: newField,
          confidence: newField ? (computeConfidence(row.fileColumn, newField) ?? 100) : null,
          status: newField ? "Mapped" : "Unmapped",
        };
      }),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    const data = {
      fileName: displayFileName,
      mappingRows,
      totalRows: hasIncomingData ? totalRows : (existingRecord?.totalRows ?? 0),
    };
    if (currentRecordId) {
      updateUploadedDatabase(currentRecordId, data);
    } else {
      const newId = addUploadedDatabase(data);
      setCurrentRecordId(newId);
    }
    setSaving(false);
    setIsReadOnly(true);
    setShowUnmappedOnly(false);
    setPage(0);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 4000);
  };

  const handleDelete = () => {
    if (currentRecordId) removeUploadedDatabase(currentRecordId);
    navigate("/?tab=databases");
  };

  const handleCancel = () => {
    if (existingRecord) setMappingRows(existingRecord.mappingRows);
    setIsReadOnly(true);
    setShowUnmappedOnly(false);
    setPage(0);
  };

  const filtered = showUnmappedOnly
    ? mappingRows.filter((r) => r.status === "Unmapped")
    : mappingRows;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayedRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const mappedCount = mappingRows.filter((r) => r.status === "Mapped").length;
  const getGlobalIndex = (di) => {
    const row = displayedRows[di];
    return mappingRows.findIndex((r) => r.fileColumn === row.fileColumn);
  };

  // ── Empty state ──────────────────────────────────────────────
  if (!hasData) {
    return (
      <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-base text-[#4a5565]">No file data found. Please upload a file first.</p>
            <Link
              to="/?tab=databases"
              className="rounded-[10px] bg-[#155dfc] px-6 py-2.5 text-base font-medium text-white transition-colors hover:bg-[#1247cc]"
            >
              Go to Data sources
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto p-8">
        <div className="flex flex-col gap-6">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/?tab=databases" className="text-[#6a7282] transition-colors hover:text-[#155dfc]">
              Data sources
            </Link>
            <span className="text-[#6a7282]">/</span>
            <span className="text-[#101828]">{isSaved ? fileTitle : "Upload database"}</span>
          </nav>

          {/* Page header */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">
                  {isSaved ? fileTitle : "Upload database"}
                </h1>
              </div>
              <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
                Control the mapping with the Orixa system and fill the unmapped fields.
              </p>
            </div>
            {isReadOnly && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReadOnly(false)}
                  className="rounded-[10px] border border-[#d1d5dc] bg-white px-5 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="rounded-[10px] border border-[#fca5a5] bg-white px-5 py-2 text-sm font-medium text-[#dc2626] transition-colors hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Mapping card */}
          <div className="flex flex-col overflow-hidden rounded-[14px] border border-gray-200 bg-white">
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium text-[#0a0a0a]">Mapping</h2>
                <span className="rounded bg-[#dcfce7] px-2 py-0.5 text-xs font-medium text-[#008236]">
                  {mappedCount} mapped
                </span>
                {mappingRows.length - mappedCount > 0 && (
                  <span className="rounded bg-[#fef9c2] px-2 py-0.5 text-xs font-medium text-[#a65f00]">
                    {mappingRows.length - mappedCount} unmapped
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {!isReadOnly && (
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showUnmappedOnly}
                      onChange={(e) => { setShowUnmappedOnly(e.target.checked); setPage(0); }}
                      className="h-4 w-4 rounded border-gray-300 text-[#155dfc] focus:ring-[#155dfc]"
                    />
                    <span className="text-sm font-medium text-[#4a5565]">Show unmapped only</span>
                  </label>
                )}
                <span className="text-sm text-[#99a1af]">{mappingRows.length} columns</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#f9fafb]">
                    <th className="px-6 py-3 text-left">
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">FILE COLUMNS</span>
                        <SortIcon />
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">PREVIEW DATA</span>
                    </th>
                    <th className="min-w-[280px] px-6 py-3 text-left">
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">ORIXA COLUMNS</span>
                        <SortIcon />
                      </span>
                    </th>
                    <th className="w-[144px] px-6 py-3 text-left">
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">AI CONFIDENCE</span>
                        <SortIcon />
                      </span>
                    </th>
                    <th className="w-[131px] px-6 py-3 text-left">
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">STATUS</span>
                        <SortIcon />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((row, displayIdx) => (
                    <tr key={row.fileColumn} className="border-b border-gray-200 last:border-b-0">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#0a0a0a]">{row.fileColumn}</span>
                          <span className="text-xs text-[#99a1af]">{row.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-sm italic text-[#4a5565]">{row.preview}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <LinkIcon />
                          <OrixaDropdown
                            value={row.orixaColumn}
                            onChange={(newField) => handleFieldChange(getGlobalIndex(displayIdx), newField)}
                            allFields={ORIXA_SYSTEM_FIELDS}
                            readOnly={isReadOnly}
                          />
                        </div>
                      </td>
                      <td className="w-[144px] px-6 py-5">
                        {row.confidence !== null ? (
                          <div className="flex flex-col gap-1">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#e5e7eb]">
                              <div className="h-full rounded-full bg-[#00c950]" style={{ width: `${row.confidence}%` }} />
                            </div>
                            <span className="text-xs text-[#4a5565]">{row.confidence}%</span>
                          </div>
                        ) : null}
                      </td>
                      <td className="w-[131px] px-6 py-5">
                        {row.status === "Mapped" ? (
                          <span className="inline-block rounded px-2.5 py-1 text-xs font-medium bg-[#dcfce7] text-[#008236]">Mapped</span>
                        ) : (
                          <span className="inline-block rounded px-2.5 py-1 text-xs font-medium bg-[#fef9c2] text-[#a65f00]">Unmapped</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card footer */}
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <p className="text-sm text-[#4a5565]">
                Don't see your field?{" "}
                <button className="text-[#155dfc] hover:underline">Create custom field</button>
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#4a5565]">
                  Showing {page * PAGE_SIZE + 1} to{" "}
                  {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} columns
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex h-[30px] w-[30px] items-center justify-center rounded border border-[#d1d5dc] text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeftIcon />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex h-[30px] w-[28px] items-center justify-center rounded bg-[#155dfc] text-white transition-colors hover:bg-[#1247cc] disabled:opacity-40"
                  >
                    <ChevronRightIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save / Cancel */}
          {!isReadOnly && (
            <div className="flex justify-end gap-3">
              {(currentRecordId || existingRecord) && (
                <button
                  onClick={handleCancel}
                  className="rounded-[10px] border border-[#d1d5dc] bg-white px-8 py-2.5 text-base font-medium text-[#4a5565] transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-[10px] bg-[#101828] px-8 py-2.5 text-base font-medium text-white transition-colors hover:bg-[#1d2939] disabled:opacity-70"
              >
                {saving && (
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                )}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Toast — bottom-left */}
      {savedBanner && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 rounded-[12px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 shadow-lg">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
            <circle cx="9" cy="9" r="9" fill="#dcfce7"/>
            <path d="M5.5 9L7.8 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-medium text-[#15803d]">Mapping saved successfully.</span>
          <button onClick={() => setSavedBanner(false)} className="ml-1 text-[#15803d] opacity-60 hover:opacity-100 transition-opacity">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-1 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fee2e2]">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#0a0a0a]">Delete mapping</h3>
            </div>
            <p className="mb-6 mt-3 text-sm leading-5 text-[#4a5565]">
              Are you sure you want to delete this mapping? All column mappings will be lost and cannot be recovered.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-[10px] border border-[#d1d5dc] bg-white px-5 py-2 text-sm font-medium text-[#4a5565] transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-[10px] bg-[#dc2626] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#b91c1c]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
