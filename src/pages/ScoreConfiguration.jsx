import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";

// ══════════════════════════════════════════════════════════════════
// CONNECTOR MOCK DATA
// ══════════════════════════════════════════════════════════════════

// Field values: null = leaf (no sub-columns), object = has sub-columns
const CONNECTORS = {
  CRM: {
    files: {
      Contacts: {
        "Specialty": null,
        "Sub-Specialty": null,
        "Role": null,
        "Prescriber Status": null,
        "Department": null,
        "KOL Status": null,
        "Innovation Profile": null,
      },
      Accounts: {
        "Hospital Name": null,
        "Department": null,
        "Beds Count": null,
        "Procedures/Year": null,
        "Geography": null,
      },
    },
  },
  LinkedIn: {
    files: {
      Profile: {
        "Job Title": null,
        "Department": null,
        "Connections Count": null,
        "Institution": null,
        "Seniority": null,
      },
    },
  },
  PubMed: {
    files: {
      Publications: {
        "Author Name": null,
        "Publication Count (4 yrs)": null,
        "Last Publication Year": null,
      },
    },
  },
  "External DB": {
    files: {
      "Research Database": {
        "Clinical Trial Status": null,
        "PI Role": null,
        "Sub-Investigator Role": null,
      },
    },
  },
  "Reps (Manual)": { files: {} },
  // Uploaded databases (shown only after upload)
  "HCP Registry (uploaded)": {
    isUploaded: true,
    files: {
      "doctors_q1.csv": {
        "Full Name": null,
        "Specialty": null,
        "Contacts": {
          "Sub-Specialty": null,
          "Email": null,
          "Phone": null,
        },
        "Hospital Affiliation": {
          "Hospital Name": null,
          "Department": null,
          "City": null,
        },
      },
    },
  },
};

// Compute active connector names (uploaded ones only visible after upload)
function getConnectorNames() {
  const hasUpload = !!localStorage.getItem("hcp-upload-conflicts");
  return Object.keys(CONNECTORS).filter(
    (name) => !CONNECTORS[name].isUploaded || hasUpload
  );
}

// Build cascade dropdown specs for a given source + path selection
// path = [fileKey, columnKey?, subColumnKey?, ...]
// Returns [{ label, options, value }, ...]
function getCascadeDropdowns(source, path) {
  const conn = CONNECTORS[source];
  if (!conn) return [];
  const fileOptions = Object.keys(conn.files || {});
  if (fileOptions.length === 0) return [];

  const drops = [{ label: "Table / File", options: fileOptions, value: path[0] || "" }];
  if (!path[0]) return drops;

  let node = conn.files[path[0]];
  for (let depth = 1; node && typeof node === "object"; depth++) {
    const opts = Object.keys(node);
    if (opts.length === 0) break;
    drops.push({
      label: depth === 1 ? "Column / Field" : "Sub-column",
      options: opts,
      value: path[depth] || "",
    });
    if (!path[depth] || node[path[depth]] === null) break;
    node = node[path[depth]];
  }
  return drops;
}

// ══════════════════════════════════════════════════════════════════
// DEFAULT HCP ICP DATA
// ══════════════════════════════════════════════════════════════════

const makeDefaultHCPProfiles = () => [
  {
    id: "cardiovascular",
    name: "Cardiovascular",
    isDefault: true,
    sections: [
      {
        id: "A", label: "Profile Fit Score", maxPoints: 35, enabled: true,
        rows: [
          {
            id: "A1", variable: "Specialty match",
            subValues: [
              { id: "A1a", label: "Primary match", points: 15 },
              { id: "A1b", label: "Related", points: 8 },
              { id: "A1c", label: "Unrelated", points: 0 },
            ],
            sources: [
              { id: "s1", connector: "CRM", file: "Contacts", field: "Specialty" },
              { id: "s2", connector: "Reps (Manual)", file: "", field: "" },
            ],
          },
          {
            id: "A2", variable: "Role (Prescriptive Autonomy)",
            subValues: [
              { id: "A2a", label: "Primario del reparto", points: 12 },
              { id: "A2b", label: "Strutturato senior", points: 6 },
              { id: "A2c", label: "Other", points: 0 },
            ],
            sources: [
              { id: "s3", connector: "CRM", file: "Contacts", field: "Role" },
              { id: "s4", connector: "LinkedIn", file: "Profile", field: "Job Title" },
            ],
          },
          {
            id: "A3", variable: "Sub-specialty precision",
            subValues: [
              { id: "A3a", label: "Matches indication", points: 5 },
              { id: "A3b", label: "No match", points: 0 },
            ],
            sources: [
              { id: "s5", connector: "CRM", file: "Contacts", field: "Sub-Specialty" },
              { id: "s6", connector: "Reps (Manual)", file: "", field: "" },
            ],
          },
          {
            id: "A4", variable: "Confirmed prescriber status",
            subValues: [
              { id: "A4a", label: "Confirmed in category", points: 3 },
              { id: "A4b", label: "Unconfirmed", points: 0 },
            ],
            sources: [
              { id: "s7", connector: "CRM", file: "Contacts", field: "Prescriber Status" },
              { id: "s8", connector: "Reps (Manual)", file: "", field: "" },
            ],
          },
        ],
        removedRows: [],
      },
      {
        id: "B", label: "Role & Influence Score", maxPoints: 35, enabled: true,
        rows: [
          {
            id: "B1", variable: "Decision-making role",
            subValues: [
              { id: "B1a", label: "Dept Head", points: 20 },
              { id: "B1b", label: "Senior clinician", points: 10 },
              { id: "B1c", label: "Staff", points: 0 },
            ],
            sources: [
              { id: "s9", connector: "CRM", file: "Contacts", field: "Role" },
              { id: "s10", connector: "Reps (Manual)", file: "", field: "" },
            ],
          },
          {
            id: "B2", variable: "KOL / thought leader status",
            subValues: [
              { id: "B2a", label: "National KOL", points: 10 },
              { id: "B2b", label: "Local", points: 5 },
              { id: "B2c", label: "None", points: 0 },
            ],
            sources: [
              { id: "s11", connector: "CRM", file: "Contacts", field: "KOL Status" },
              { id: "s12", connector: "Reps (Manual)", file: "", field: "" },
            ],
          },
          {
            id: "B3", variable: "Innovation profile",
            subValues: [
              { id: "B3a", label: "Early adopter", points: 5 },
              { id: "B3b", label: "Mainstream", points: 3 },
              { id: "B3c", label: "Late adopter", points: 0 },
            ],
            sources: [
              { id: "s13", connector: "CRM", file: "Contacts", field: "Innovation Profile" },
              { id: "s14", connector: "Reps (Manual)", file: "", field: "" },
            ],
          },
        ],
        removedRows: [],
      },
      {
        id: "C", label: "HCO ICP Score", maxPoints: 10, enabled: true, fixedSource: true,
        rows: [
          { id: "C1", variable: "HCO ICP associated account is ≥ 70", subValues: [{ id: "C1a", label: "≥ 70", points: 10 }], sources: [{ id: "c-src-1", connector: "HCO ICP Score", path: [] }] },
          { id: "C2", variable: "HCO ICP associated account is 40–69", subValues: [{ id: "C2a", label: "40–69", points: 5 }], sources: [{ id: "c-src-2", connector: "HCO ICP Score", path: [] }] },
          { id: "C3", variable: "HCO ICP associated account is < 40", subValues: [{ id: "C3a", label: "< 40", points: 0 }], sources: [{ id: "c-src-3", connector: "HCO ICP Score", path: [] }] },
        ],
        removedRows: [],
      },
      {
        id: "D", label: "Research & Academic Activity", maxPoints: 20, enabled: true,
        rows: [
          {
            id: "D1", variable: "Publications",
            subValues: [
              { id: "D1a", label: "≥3 papers in last 4 years", points: 10 },
              { id: "D1b", label: "1–2 papers", points: 5 },
              { id: "D1c", label: "0 papers", points: 0 },
            ],
            sources: [
              { id: "s15", connector: "PubMed", file: "Publications", field: "Publication Count (4 yrs)" },
              { id: "s16", connector: "External DB", file: "Research Database", field: "Clinical Trial Status" },
            ],
          },
          {
            id: "D2", variable: "Active clinical trial",
            subValues: [
              { id: "D2a", label: "Principal Investigator", points: 10 },
              { id: "D2b", label: "Sub-investigator", points: 5 },
              { id: "D2c", label: "None", points: 0 },
            ],
            sources: [
              { id: "s17", connector: "External DB", file: "Research Database", field: "PI Role" },
              { id: "s18", connector: "Reps (Manual)", file: "", field: "" },
            ],
          },
        ],
        removedRows: [],
      },
    ],
    scoreBands: [
      { id: "sb1", threshold: "≥ 70", priority: "High Priority", color: "green", action: "Priority target: field engagement (high freq. of visits) + event invitation" },
      { id: "sb2", threshold: "40–69", priority: "Medium Priority", color: "amber", action: "Digital + selective field contact (lower freq. of visits)" },
      { id: "sb3", threshold: "< 40", priority: "Low Priority", color: "blue", action: "Digital nurture only" },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════
// EXISTING HCO ICP DATA (account-level, unchanged structure)
// ══════════════════════════════════════════════════════════════════

const DEFAULT_HCO_COMPONENTS = [
  { id: "tiering", component: "Current Tiering", tier1: 33, tier2: 66, tier3: 100, ranged: true, scoringCriteria: "Tier classification by customer (tier 1, 2, 3)", note: "", editable: true },
  { id: "firmographic", component: "Firmographic Score", maxPoints: 17, ranged: false, scoringCriteria: "Hospital size (beds, procedures/yr), Geography, case mix compatible with device", note: "", editable: true },
  { id: "historical", component: "Historical Performance", maxPoints: 42, ranged: false, scoringCriteria: "Past purchase history with company, revenue contribution, payment reliability", note: "", editable: true },
  { id: "timeline", component: "Timeline Consideration", maxPoints: 8, ranged: false, scoringCriteria: "Based on geography and public vs. private. Understanding when a lead plans to purchase.", note: "", editable: true },
  { id: "physicians", component: "N° physicians associated to the account", maxPoints: 8, ranged: false, scoringCriteria: "Increases score based on number of associated physicians", note: "", editable: true },
  { id: "potential", component: "Potential Score", maxPoints: 25, ranged: false, scoringCriteria: "Estimated procedure volume for product category, budget / purchasing power, competitive products currently in use", note: "", editable: true },
];

// ══════════════════════════════════════════════════════════════════
// ENGAGEMENT SCORE DATA
// ══════════════════════════════════════════════════════════════════

const CLASSIFICATION_OPTIONS = ["Reach Event", "Engagement Event", "Interactive Engagement", "Advocacy"];

const DEFAULT_CHANNELS = [
  { id: "email", name: "Email", active: true, kpis: [
    { id: "e1", name: "Email Opens", classification: "Reach Event", weight: 34 },
    { id: "e2", name: "Email Click-Through", classification: "Reach Event", weight: 33 },
    { id: "e3", name: "Email Reply", classification: "Engagement Event", weight: 33 },
  ]},
  { id: "call", name: "Call", active: true, kpis: [
    { id: "c1", name: "Call Completed", classification: "Reach Event", weight: 34 },
    { id: "c2", name: "Call Duration > 5 min", classification: "Engagement Event", weight: 33 },
    { id: "c3", name: "Customer-Initiated Call", classification: "Interactive Engagement", weight: 33 },
  ]},
  { id: "webinar", name: "Webinar", active: true, kpis: [
    { id: "w1", name: "Webinar Registration", classification: "Reach Event", weight: 34 },
    { id: "w2", name: "Webinar Attendance", classification: "Engagement Event", weight: 33 },
    { id: "w3", name: "Q&A Participation", classification: "Engagement Event", weight: 33 },
  ]},
  { id: "events", name: "Events", active: true, kpis: [
    { id: "ev1", name: "Event Registration", classification: "Reach Event", weight: 34 },
    { id: "ev2", name: "Event Attendance", classification: "Engagement Event", weight: 33 },
    { id: "ev3", name: "1:1 Meeting at Event", classification: "Interactive Engagement", weight: 33 },
  ]},
  { id: "web", name: "Web", active: true, kpis: [
    { id: "wb1", name: "Webpage Views", classification: "Reach Event", weight: 34 },
    { id: "wb2", name: "Content Download", classification: "Engagement Event", weight: 33 },
    { id: "wb3", name: "Portal Login", classification: "Engagement Event", weight: 33 },
  ]},
  { id: "congress", name: "Congress", active: true, kpis: [
    { id: "cg1", name: "Session Attendance", classification: "Engagement Event", weight: 34 },
    { id: "cg2", name: "HCP Speaker at Corporate Event", classification: "Advocacy", weight: 33 },
    { id: "cg3", name: "Booth Visit", classification: "Interactive Engagement", weight: 33 },
  ]},
  { id: "f2f", name: "F2F", active: true, kpis: [
    { id: "f1", name: "F2F Visit Completed", classification: "Reach Event", weight: 34 },
    { id: "f2", name: "F2F Visit > 15 min", classification: "Engagement Event", weight: 33 },
    { id: "f3", name: "Customer-Initiated F2F", classification: "Interactive Engagement", weight: 33 },
  ]},
];

// ══════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ══════════════════════════════════════════════════════════════════

function classificationStyle(cls) {
  if (cls === "Reach Event")            return { bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]", bar: "bg-[#3b82f6]" };
  if (cls === "Engagement Event")       return { bg: "bg-[#ede9fe]", text: "text-[#6d28d9]", bar: "bg-[#8b5cf6]" };
  if (cls === "Interactive Engagement") return { bg: "bg-[#fef3c7]", text: "text-[#b45309]", bar: "bg-[#f59e0b]" };
  if (cls === "Advocacy")               return { bg: "bg-[#ffedd5]", text: "text-[#c2410c]", bar: "bg-[#f97316]" };
  return { bg: "bg-[#f3f4f6]", text: "text-[#374151]", bar: "bg-[#9ca3af]" };
}

function getSuggested(weight) {
  if (weight >= 40) return { label: "High",   cls: "text-[#d97706] font-semibold" };
  if (weight >= 20) return { label: "Medium", cls: "text-[#7c3aed] font-semibold" };
  return                   { label: "Low",    cls: "text-[#2563eb] font-semibold" };
}

function redistributeWeights(kpis, changedId, newWeight) {
  const clamped = Math.max(0, Math.min(100, newWeight));
  const others = kpis.filter((k) => k.id !== changedId);
  if (others.length === 0) return kpis.map((k) => ({ ...k, weight: 100 }));
  const remaining = 100 - clamped;
  const oldOtherTotal = others.reduce((s, k) => s + k.weight, 0);
  let newOthers;
  if (oldOtherTotal === 0) {
    const base = Math.floor(remaining / others.length);
    const extra = remaining - base * others.length;
    newOthers = others.map((k, i) => ({ ...k, weight: base + (i < extra ? 1 : 0) }));
  } else {
    const scaled = others.map((k) => ({ ...k, weight: Math.round((k.weight / oldOtherTotal) * remaining) }));
    const scaledTotal = scaled.reduce((s, k) => s + k.weight, 0);
    const diff = remaining - scaledTotal;
    if (diff !== 0 && scaled.length > 0) scaled[0].weight += diff;
    newOthers = scaled;
  }
  return kpis.map((k) => {
    if (k.id === changedId) return { ...k, weight: clamped };
    return newOthers.find((o) => o.id === k.id) || k;
  });
}

function rowMax(row) {
  return Math.max(0, ...row.subValues.map((sv) => sv.points));
}

// ══════════════════════════════════════════════════════════════════
// SHARED UI PRIMITIVES
// ══════════════════════════════════════════════════════════════════

function Toggle({ checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? "bg-[#155dfc]" : "bg-[#d1d5dc]"}`}>
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3L13 13M3 13L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// SOURCE COMPONENTS
// ══════════════════════════════════════════════════════════════════

function SourcePill({ source, onRemove, onEdit }) {
  // Support both old { connector, file, field } and new { connector, path: [] } formats
  const parts = source.path
    ? [source.connector, ...source.path.filter(Boolean)]
    : [source.connector, source.file, source.field].filter(Boolean);
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-2 py-0.5 text-[11px] text-[#374151]">
      {parts.join(" › ")}
      {onEdit && (
        <button onClick={onEdit} className="ml-0.5 text-[#9ca3af] hover:text-[#155dfc] leading-none" title="Edit source">
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <path d="M6.5 1.5L8.5 3.5L3.5 8.5H1.5V6.5L6.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 text-[#9ca3af] hover:text-[#dc2626] leading-none" title="Remove source">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 1L7 7M1 7L7 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </span>
  );
}

// Normalise old { connector, file, field } to { id, connector, path: [] }
function normaliseSrc(src) {
  return {
    id: src.id,
    connector: src.connector ?? "",
    path: src.path ?? [src.file, src.field].filter(Boolean),
  };
}

function SourceEditor({ sources, onChange }) {
  const connectorNames = getConnectorNames();
  const selectCls = "rounded-lg border border-[#d1d5dc] bg-white px-2 py-1 text-xs focus:border-[#155dfc] focus:outline-none";

  // Work with normalised sources throughout
  const normalised = sources.map(normaliseSrc);

  const updateConnector = (id, connector) => {
    onChange(normalised.map((s) => s.id === id ? { ...s, connector, path: [] } : s));
  };

  const updatePath = (id, levelIdx, value) => {
    onChange(normalised.map((s) => {
      if (s.id !== id) return s;
      return { ...s, path: [...s.path.slice(0, levelIdx), value] };
    }));
  };

  const removeSource = (id) => onChange(normalised.filter((s) => s.id !== id));

  const addSource = () =>
    onChange([...normalised, { id: `s${Date.now()}`, connector: "", path: [] }]);

  return (
    <div className="flex flex-col gap-2">
      {normalised.length === 0 && (
        <span className="text-xs text-[#9ca3af] italic">No sources — add one below.</span>
      )}

      {normalised.map((src) => {
        const cascades = src.connector ? getCascadeDropdowns(src.connector, src.path) : [];
        return (
          <div key={src.id} className="flex flex-wrap items-center gap-1.5">
            {/* Connector selector */}
            <select
              value={src.connector}
              onChange={(e) => updateConnector(src.id, e.target.value)}
              className={selectCls}
            >
              <option value="">— Select source —</option>
              {connectorNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Cascade column/field dropdowns */}
            {cascades.map((dd, idx) => (
              <select
                key={idx}
                value={dd.value}
                onChange={(e) => updatePath(src.id, idx, e.target.value)}
                className={selectCls}
              >
                <option value="">— {dd.label} —</option>
                {dd.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ))}

            {/* Delete bin */}
            <button
              onClick={() => removeSource(src.id)}
              className="ml-auto shrink-0 rounded p-1 text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626] transition-colors"
              title="Remove source"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M5 4V3h4v1M3 4l.7 8h6.6L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        );
      })}

      {/* Add source row */}
      <button
        onClick={addSource}
        className="self-start flex items-center gap-1 text-[11px] text-[#9ca3af] hover:text-[#374151] transition-colors mt-0.5"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        Add source
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// EDIT ROW MODAL
// ══════════════════════════════════════════════════════════════════

function EditRowModal({ row, sectionMaxPoints, allRows, onSave, onClose, fixedSource = false }) {
  const [varName, setVarName] = useState(row.variable);
  const [subValues, setSubValues] = useState(row.subValues.map((sv) => ({ ...sv })));
  const [sources, setSources] = useState(row.sources.map((s) => ({ ...s })));

  const thisMax = Math.max(0, ...subValues.map((sv) => sv.points));
  const otherMaxSum = allRows
    .filter((r) => r.id !== row.id)
    .reduce((sum, r) => sum + rowMax(r), 0);
  const totalMax = thisMax + otherMaxSum;
  const overBudget = totalMax > sectionMaxPoints;

  const updateSV = (svId, field, val) => {
    setSubValues((prev) =>
      prev.map((sv) => sv.id === svId ? { ...sv, [field]: field === "points" ? Math.max(0, parseInt(val) || 0) : val } : sv)
    );
  };

  const addSV = () => {
    setSubValues((prev) => [...prev, { id: `sv${Date.now()}`, label: "", points: 0 }]);
  };

  const removeSV = (svId) => {
    if (subValues.length <= 1) return;
    setSubValues((prev) => prev.filter((sv) => sv.id !== svId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[560px] max-h-[85vh] flex flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4 shrink-0">
          <h3 className="text-base font-semibold text-[#111318]">Edit variable</h3>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Variable name — read-only */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Variable name</label>
            <p className="w-full rounded-lg border border-[#f3f4f6] bg-[#f9fafb] px-3 py-2 text-sm text-[#374151]">{varName}</p>
          </div>

          {/* Score tiers — labels read-only, only points editable */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282]">Score tiers</label>
              {overBudget && (
                <span className="text-xs font-medium text-[#dc2626]">
                  ⚠ Exceeds section budget by {totalMax - sectionMaxPoints} pts
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {subValues.map((sv) => (
                <div key={sv.id} className="flex items-center gap-2">
                  {/* Tier label — read-only */}
                  <span className="flex-1 rounded-lg border border-[#f3f4f6] bg-[#f9fafb] px-3 py-1.5 text-sm text-[#374151]">{sv.label}</span>
                  {/* Points — editable */}
                  <input type="number" min={0} value={sv.points}
                    onChange={(e) => updateSV(sv.id, "points", e.target.value)}
                    className="w-16 rounded-lg border border-[#e5e7eb] px-2 py-1.5 text-center text-sm font-semibold focus:border-[#155dfc] focus:outline-none" />
                  <span className="text-xs text-[#9ca3af] shrink-0">pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-3">Sources</label>
            {fixedSource ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap gap-1">
                  {sources.map((s) => <SourcePill key={s.id} source={s} />)}
                </div>
                <p className="text-xs text-[#9ca3af] italic">Source is fixed and cannot be changed.</p>
              </div>
            ) : (
              <SourceEditor sources={sources} onChange={setSources} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4 shrink-0">
          <button onClick={onClose}
            className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(row.id, { variable: varName, subValues, sources })}
            className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] transition-colors">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// REMOVED ROWS MODAL
// ══════════════════════════════════════════════════════════════════

function RemovedModal({ sectionLabel, removedRows, onRestore, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[480px] rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#111318]">Removed variables</h3>
            <p className="text-xs text-[#9ca3af] mt-0.5">{sectionLabel}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
        </div>
        <div className="p-6">
          {removedRows.length === 0 ? (
            <p className="text-sm text-[#9ca3af] text-center py-8">No removed variables in this section.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {removedRows.map((row) => (
                <div key={row.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#e5e7eb] px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111318]">{row.variable}</p>
                    <p className="text-xs text-[#9ca3af] mt-0.5">
                      {row.subValues?.map((sv) => `${sv.label}: ${sv.points} pts`).join(" · ")}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {row.sources?.map((s) => <SourcePill key={s.id} source={s} />)}
                    </div>
                  </div>
                  <button onClick={() => onRestore(row.id)}
                    className="shrink-0 rounded-lg border border-[#155dfc] px-3 py-1.5 text-xs font-medium text-[#155dfc] hover:bg-[#dbeafe] transition-colors">
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SECTION CARD
// ══════════════════════════════════════════════════════════════════

function SectionCard({ section, onToggle, onUpdateRow, onRemoveRow, onRestoreRow }) {
  const [removedOpen, setRemovedOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const totalUsed = section.rows.reduce((sum, r) => sum + rowMax(r), 0);
  const isOver = totalUsed > section.maxPoints;

  const handleSaveRow = (rowId, updates) => {
    onUpdateRow(rowId, updates);
    setEditingRow(null);
  };

  return (
    <>
      <div className={`rounded-xl border bg-white transition-opacity ${section.enabled ? "border-[#e5e7eb]" : "border-[#f3f4f6] opacity-60"}`}>
        {/* Section header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3f4f6]">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#155dfc] text-xs font-bold text-white shrink-0">
              {section.id}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[#111318]">{section.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {section.removedRows.length > 0 && (
              <button onClick={() => setRemovedOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-xs text-[#6a7282] hover:bg-[#f9fafb] transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 3h10M4 3V2h4v1M3 3l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {section.removedRows.length} removed
              </button>
            )}
            <span className={`text-xs font-medium ${section.enabled ? "text-[#16a34a]" : "text-[#9ca3af]"}`}>
              {section.enabled ? "● Enabled" : "● Disabled"}
            </span>
            <Toggle checked={section.enabled} onChange={onToggle} />
          </div>
        </div>

        {/* Section body */}
        {section.enabled && (
          /* Standard rows table */
          <div>
            <div className="grid grid-cols-[1.4fr_1.6fr_1.1fr_72px] border-b border-[#f3f4f6] bg-[#fafafa] px-6 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Variable</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Score</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Source</span>
              <span />
            </div>

            {section.rows.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-[#9ca3af]">No variables. Restore removed ones using the button above.</div>
            ) : section.rows.map((row, idx) => (
              <div key={row.id}
                className={`grid grid-cols-[1.4fr_1.6fr_1.1fr_72px] items-start gap-0 px-6 py-4 hover:bg-[#fafafa] transition-colors ${idx < section.rows.length - 1 ? "border-b border-[#f3f4f6]" : ""}`}>
                {/* Variable name */}
                <div className="pr-4 pt-0.5">
                  <p className="text-sm font-semibold text-[#111318]">{row.variable}</p>
                </div>

                {/* Sub-values */}
                <div className="pr-4 flex flex-col gap-1">
                  {row.subValues.map((sv) => (
                    <div key={sv.id} className="flex items-baseline gap-1.5">
                      <span className={`w-8 text-right text-sm font-bold tabular-nums shrink-0 ${sv.points > 0 ? "text-[#155dfc]" : "text-[#d1d5dc]"}`}>
                        {sv.points}
                      </span>
                      <span className="text-xs text-[#9ca3af] shrink-0">pts</span>
                      <span className="text-sm text-[#374151] leading-snug">{sv.label}</span>
                    </div>
                  ))}
                </div>

                {/* Sources */}
                <div className="pr-2 flex flex-wrap gap-1">
                  {row.sources.map((s) => <SourcePill key={s.id} source={s} />)}
                </div>

                {/* Actions */}
                <div className="flex items-start gap-1 pt-0.5">
                  <button onClick={() => setEditingRow(row)}
                    className="rounded p-1.5 text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors" title="Edit">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button onClick={() => onRemoveRow(row.id)}
                    className="rounded p-1.5 text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626] transition-colors" title="Remove">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M2 4h10M5 4V3h4v1M3 4l.7 8h6.6L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Footer total */}
            <div className="flex items-center justify-between border-t border-[#f3f4f6] bg-[#fafafa] px-6 py-2.5">
              <span className="text-xs text-[#9ca3af]">Sum of max values per variable</span>
              <span className={`text-sm font-bold ${isOver ? "text-[#dc2626]" : totalUsed === section.maxPoints ? "text-[#16a34a]" : "text-[#f59e0b]"}`}>
                {totalUsed} / {section.maxPoints} pts
                {isOver && " ⚠"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {removedOpen && (
        <RemovedModal
          sectionLabel={section.label}
          removedRows={section.removedRows}
          onRestore={(id) => { onRestoreRow(id); if (section.removedRows.length === 1) setRemovedOpen(false); }}
          onClose={() => setRemovedOpen(false)}
        />
      )}
      {editingRow && (
        <EditRowModal
          row={editingRow}
          sectionMaxPoints={section.maxPoints}
          allRows={section.rows}
          fixedSource={!!section.fixedSource}
          onSave={handleSaveRow}
          onClose={() => setEditingRow(null)}
        />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCORE BANDS
// ══════════════════════════════════════════════════════════════════

const BAND_COLORS = {
  green: { bg: "bg-[#dcfce7]", text: "text-[#16a34a]", border: "border-[#bbf7d0]" },
  amber: { bg: "bg-[#fef3c7]", text: "text-[#d97706]", border: "border-[#fde68a]" },
  blue:  { bg: "bg-[#dbeafe]", text: "text-[#2563eb]", border: "border-[#bfdbfe]" },
};

const PREDEFINED_ACTIONS = [
  "Priority target: field engagement (high freq. of visits) + event invitation",
  "Selective field engagement + digital follow-up",
  "Digital + selective field contact (lower freq. of visits)",
  "Digital nurture only",
  "Key Account Management (KAM) engagement",
  "Medical Science Liaison (MSL) engagement",
  "Peer-to-peer event invitation",
  "Congress attendance + follow-up",
  "Speaker bureau invitation",
  "Sample / trial program",
  "Awareness campaign (email + web)",
  "No action",
];

function EditActionModal({ band, onSave, onClose }) {
  const colors = BAND_COLORS[band.color] || BAND_COLORS.blue;
  const [selected, setSelected] = useState(band.action);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[520px] rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#111318]">Edit action</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-bold ${colors.text}`}>{band.threshold}</span>
              <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                {band.priority}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282]">Select action</label>
          <div className="flex flex-col gap-2">
            {PREDEFINED_ACTIONS.map((action) => (
              <label
                key={action}
                className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors ${
                  selected === action
                    ? "border-[#155dfc] bg-[#eff6ff]"
                    : "border-[#e5e7eb] hover:border-[#d1d5dc]"
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value={action}
                  checked={selected === action}
                  onChange={() => setSelected(action)}
                  className="mt-0.5 accent-[#155dfc] shrink-0"
                />
                <span className="text-sm text-[#374151] leading-snug">{action}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4">
          <button onClick={onClose}
            className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(band.id, selected)}
            className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] transition-colors">
            Save action
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreBandsSection({ bands, onChange }) {
  const [editingBand, setEditingBand] = useState(null);

  const handleSave = (bandId, action) => {
    onChange(bandId, action);
    setEditingBand(null);
  };

  return (
    <>
      <div className="rounded-xl border border-[#e5e7eb] bg-white">
        <div className="border-b border-[#f3f4f6] px-6 py-4">
          <h3 className="text-sm font-semibold text-[#111318]">A+B+C+D — Score Bands & Actions</h3>
          <p className="text-xs text-[#9ca3af] mt-0.5">Score thresholds are fixed. Assign a predefined action to each classification.</p>
        </div>
        <div className="grid grid-cols-[100px_180px_1fr_44px] border-b border-[#f3f4f6] bg-[#fafafa] px-6 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Score</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Classification</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Action</span>
          <span />
        </div>
        {bands.map((band, idx) => {
          const colors = BAND_COLORS[band.color] || BAND_COLORS.blue;
          return (
            <div key={band.id}
              className={`grid grid-cols-[100px_180px_1fr_44px] items-center px-6 py-4 hover:bg-[#fafafa] transition-colors ${idx < bands.length - 1 ? "border-b border-[#f3f4f6]" : ""}`}>
              <span className={`text-sm font-bold ${colors.text}`}>{band.threshold}</span>
              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                  {band.priority}
                </span>
              </div>
              <p className="pr-3 text-sm text-[#374151] leading-snug">{band.action}</p>
              <button
                onClick={() => setEditingBand(band)}
                className="rounded p-1.5 text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors"
                title="Edit action"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {editingBand && (
        <EditActionModal
          band={editingBand}
          onSave={handleSave}
          onClose={() => setEditingBand(null)}
        />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// NEW ICP WIZARD
// ══════════════════════════════════════════════════════════════════

function NewICPWizard({ onComplete, onClose }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("default");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[480px] rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#111318]">New ICP Score</h3>
            <div className="flex items-center gap-1.5 mt-1">
              {[1, 2].map((s) => (
                <div key={s} className={`h-1 w-8 rounded-full transition-colors ${s <= step ? "bg-[#155dfc]" : "bg-[#e5e7eb]"}`} />
              ))}
              <span className="text-xs text-[#9ca3af] ml-1">Step {step} of 2</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 1 ? (
            <div className="flex flex-col gap-3">
              <label className="block text-sm font-medium text-[#374151]">Product family name</label>
              <input autoFocus type="text" value={name} placeholder="e.g. Neurology, Oncology, Orthopedics…"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) setStep(2); }}
                className="w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-sm focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
              <p className="text-xs text-[#9ca3af]">This name will identify the ICP score for this product family.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-[#374151]">Start from:</p>
              {[
                { value: "default", title: "Default template", desc: "Copy the structure from the default ICP score — same sections, variables, sources, and score bands. Edit from there." },
                { value: "blank", title: "Blank", desc: "Start with empty sections A, B, C, D. You'll add all variables manually." },
              ].map((opt) => (
                <label key={opt.value}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-colors ${template === opt.value ? "border-[#155dfc] bg-[#eff6ff]" : "border-[#e5e7eb] hover:border-[#d1d5dc]"}`}>
                  <input type="radio" name="template" value={opt.value} checked={template === opt.value}
                    onChange={() => setTemplate(opt.value)} className="mt-0.5 accent-[#155dfc]" />
                  <div>
                    <p className="text-sm font-semibold text-[#111318]">{opt.title}</p>
                    <p className="text-xs text-[#6a7282] mt-0.5 leading-snug">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#e5e7eb] px-6 py-4">
          {step === 2
            ? <button onClick={() => setStep(1)} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">Back</button>
            : <div />
          }
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">Cancel</button>
            {step === 1 ? (
              <button onClick={() => setStep(2)} disabled={!name.trim()}
                className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] disabled:opacity-40 disabled:cursor-not-allowed">
                Next
              </button>
            ) : (
              <button onClick={() => onComplete({ name: name.trim(), template })}
                className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8]">
                Create ICP Score
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HCP ICP SCORE TAB
// ══════════════════════════════════════════════════════════════════

function HCPICPScoreTab() {
  const [profile, setProfile] = useState(() => makeDefaultHCPProfiles()[0]);

  const updateProfile = (updater) => setProfile((prev) => updater(prev));

  const toggleSection = (sectionId) =>
    updateProfile((p) => ({
      ...p,
      sections: p.sections.map((s) => s.id === sectionId ? { ...s, enabled: !s.enabled } : s),
    }));

  const updateRow = (sectionId, rowId, updates) =>
    updateProfile((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id !== sectionId ? s : { ...s, rows: s.rows.map((r) => r.id === rowId ? { ...r, ...updates } : r) }
      ),
    }));

  const removeRow = (sectionId, rowId) =>
    updateProfile((p) => ({
      ...p,
      sections: p.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const row = s.rows.find((r) => r.id === rowId);
        return { ...s, rows: s.rows.filter((r) => r.id !== rowId), removedRows: [...s.removedRows, row] };
      }),
    }));

  const restoreRow = (sectionId, rowId) =>
    updateProfile((p) => ({
      ...p,
      sections: p.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const row = s.removedRows.find((r) => r.id === rowId);
        return { ...s, rows: [...s.rows, row], removedRows: s.removedRows.filter((r) => r.id !== rowId) };
      }),
    }));

  const updateBandAction = (bandId, action) =>
    updateProfile((p) => ({
      ...p,
      scoreBands: p.scoreBands.map((b) => b.id === bandId ? { ...b, action } : b),
    }));

  return (
    <div className="flex flex-col gap-6">
      {/* Section cards */}
      {profile?.sections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          onToggle={() => toggleSection(section.id)}
          onUpdateRow={(rowId, updates) => updateRow(section.id, rowId, updates)}
          onRemoveRow={(rowId) => removeRow(section.id, rowId)}
          onRestoreRow={(rowId) => restoreRow(section.id, rowId)}
        />
      ))}

      {/* Score bands */}
      {profile && (
        <ScoreBandsSection bands={profile.scoreBands} onChange={updateBandAction} />
      )}

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HCO ICP SCORE TAB (existing account-level score)
// ══════════════════════════════════════════════════════════════════

function HCOICPScoreTab() {
  const [components, setComponents] = useState(DEFAULT_HCO_COMPONENTS);
  const [editingId, setEditingId] = useState(null);

  const nonRanged = components.filter((c) => !c.ranged);
  const total = nonRanged.reduce((s, c) => s + (parseInt(c.maxPoints) || 0), 0);

  const updateTiering = (id, key, value) =>
    setComponents((prev) => prev.map((c) => c.id === id ? { ...c, [key]: value } : c));

  const changePoints = (id, newPts) => {
    setComponents((prev) => {
      const pool = prev.filter((c) => !c.ranged).map((c) => ({ ...c, weight: c.maxPoints }));
      const redistributed = redistributeWeights(pool, id, newPts);
      return prev.map((c) => {
        if (c.ranged) return c;
        const updated = redistributed.find((r) => r.id === c.id);
        return updated ? { ...c, maxPoints: updated.weight } : c;
      });
    });
  };

  const updateCriteria = (id, value) =>
    setComponents((prev) => prev.map((c) => c.id === id ? { ...c, scoringCriteria: value } : c));

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-[#93c5fd] bg-[#dbeafe] px-5 py-4">
        <p className="text-sm text-[#1d4ed8]">
          <span className="font-semibold">HCO ICP Score</span> — account-level score measuring how well a hospital fits your Ideal Customer Profile. Component points must sum to 100.
        </p>
      </div>
      <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] w-[240px]">Component</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] w-[220px]">Max Points</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282]">Scoring Criteria</th>
              <th className="px-6 py-3 w-[52px]" />
            </tr>
          </thead>
          <tbody>
            {components.map((comp, idx) => {
              const isEditing = editingId === comp.id;
              const isLast = idx === components.length - 1;
              return (
                <tr key={comp.id} className={`transition-colors hover:bg-[#f9fafb] ${isLast ? "" : "border-b border-[#e5e7eb]"}`}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-[#111318]">{comp.component}</span>
                      {comp.note && <span className="text-xs italic text-[#9ca3af]">{comp.note}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {comp.ranged ? (
                      isEditing ? (
                        <div className="flex items-center gap-1.5">
                          {["tier1","tier2","tier3"].map((k) => (
                            <input key={k} type="number" min={0} value={comp[k]}
                              onChange={(e) => updateTiering(comp.id, k, parseInt(e.target.value) || 0)}
                              className="w-14 rounded-lg border border-[#155dfc] px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
                          ))}
                          <span className="text-xs text-[#9ca3af]">pts</span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-[#374151]">{comp.tier1} – {comp.tier2} – {comp.tier3} pts</span>
                      )
                    ) : (
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <input type="number" min={0} max={100} value={comp.maxPoints}
                            onChange={(e) => changePoints(comp.id, parseInt(e.target.value) || 0)}
                            className="w-16 rounded-lg border border-[#155dfc] px-2 py-1 text-center text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
                        ) : (
                          <span className="w-16 text-center text-sm font-semibold text-[#111318]">{comp.maxPoints} pts</span>
                        )}
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e5e7eb]">
                          <div className="h-full rounded-full bg-[#155dfc] transition-all" style={{ width: `${comp.maxPoints}%` }} />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <textarea value={comp.scoringCriteria} onChange={(e) => updateCriteria(comp.id, e.target.value)}
                        rows={3} className="w-full resize-none rounded-lg border border-[#155dfc] px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
                    ) : (
                      <span className="text-sm text-[#4a5565] leading-relaxed">{comp.scoringCriteria}</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => setEditingId(isEditing ? null : comp.id)}
                      className={`rounded p-1.5 transition-colors ${isEditing ? "bg-[#155dfc] text-white" : "text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151]"}`}>
                      {isEditing
                        ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      }
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-[#e5e7eb] bg-[#f9fafb] px-6 py-3">
          <span className="text-xs text-[#9ca3af]">Total max points (excluding tiering)</span>
          <span className={`text-sm font-bold ${total === 100 ? "text-[#16a34a]" : "text-[#f59e0b]"}`}>{total} pts</span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ENGAGEMENT SCORE TAB
// ══════════════════════════════════════════════════════════════════

function EngagementScoreTab() {
  const [channels, setChannels] = useState(() =>
    DEFAULT_CHANNELS.map((ch) => ({ ...ch, kpis: ch.kpis.map((k) => ({ ...k })) }))
  );
  const [searchQuery, setSearchQuery] = useState("");

  const changeWeight = (chId, kpiId, newWeight) => {
    setChannels((prev) =>
      prev.map((ch) => ch.id !== chId ? ch : { ...ch, kpis: redistributeWeights(ch.kpis, kpiId, newWeight) })
    );
  };

  const updateKPI = (chId, kpiId, key, value) => {
    setChannels((prev) =>
      prev.map((ch) => ch.id !== chId ? ch : {
        ...ch, kpis: ch.kpis.map((k) => k.id !== kpiId ? k : { ...k, [key]: value }),
      })
    );
  };

  const addKPI = (chId) => {
    const newKPI = { id: `kpi_${Date.now()}`, name: "", classification: "Reach Event", weight: 0, isNew: true };
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== chId) return ch;
        const updated = [...ch.kpis, newKPI];
        const base = Math.floor(100 / updated.length);
        const extra = 100 - base * updated.length;
        return { ...ch, kpis: updated.map((k, i) => ({ ...k, weight: base + (i < extra ? 1 : 0) })) };
      })
    );
  };

  const removeKPI = (chId, kpiId) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== chId) return ch;
        const remaining = ch.kpis.filter((k) => k.id !== kpiId);
        if (remaining.length === 0) return { ...ch, kpis: [] };
        const base = Math.floor(100 / remaining.length);
        const extra = 100 - base * remaining.length;
        return { ...ch, kpis: remaining.map((k, i) => ({ ...k, weight: base + (i < extra ? 1 : 0) })) };
      })
    );
  };

  const toggleChannelActive = (chId) =>
    setChannels((prev) => prev.map((ch) => ch.id !== chId ? ch : { ...ch, active: !ch.active }));

  const handleReset = () =>
    setChannels(DEFAULT_CHANNELS.map((ch) => ({ ...ch, kpis: ch.kpis.map((k) => ({ ...k })) })));

  const visibleChannels = searchQuery.trim()
    ? channels.map((ch) => ({ ...ch, kpis: ch.kpis.filter((k) => k.name.toLowerCase().includes(searchQuery.toLowerCase())) })).filter((ch) => ch.kpis.length > 0)
    : channels;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[#6a7282]">Edit KPI classifications and weights per channel. Weights within each channel auto-adjust to sum to 100%.</p>
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16ZM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <input type="text" placeholder="Search KPIs…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[200px] rounded-lg border border-[#e5e7eb] bg-white py-2 pl-9 pr-4 text-sm placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
          </div>
          <button onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#9ca3af]">
              <path d="M1 3v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1.5 7A6 6 0 1 0 3 3.3L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Reset to defaults
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {visibleChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 rounded-xl border border-[#e5e7eb] bg-white">
            <p className="text-sm font-medium text-[#374151]">No KPIs found</p>
            <p className="text-xs text-[#9ca3af]">Try a different search term.</p>
          </div>
        ) : visibleChannels.map((ch) => (
          <div key={ch.id} className={`rounded-xl border bg-white transition-opacity ${ch.active ? "border-[#e5e7eb]" : "border-[#f3f4f6] opacity-60"}`}>
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-semibold text-[#111318]">{ch.name}</span>
                <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs text-[#6a7282]">{ch.kpis.length} KPI{ch.kpis.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${ch.active ? "text-[#16a34a]" : "text-[#9ca3af]"}`}>{ch.active ? "● Active" : "● Inactive"}</span>
                <Toggle checked={ch.active} onChange={() => toggleChannelActive(ch.id)} />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_190px_1fr_90px_36px] border-t border-[#f3f4f6] bg-[#fafafa] px-6 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">KPI (Event)</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Classification</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Weight</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Suggested</span>
              <span />
            </div>
            <div className="flex flex-col divide-y divide-[#f3f4f6]">
              {ch.kpis.map((kpi) => {
                const style = classificationStyle(kpi.classification);
                const suggested = getSuggested(kpi.weight);
                return (
                  <div key={kpi.id} className="grid grid-cols-[1fr_190px_1fr_90px_36px] items-center gap-0 px-6 py-3 hover:bg-[#fafafa]">
                    <div className="pr-4">
                      {kpi.isNew ? (
                        <input autoFocus type="text" placeholder="KPI name…" value={kpi.name}
                          onChange={(e) => updateKPI(ch.id, kpi.id, "name", e.target.value)}
                          onBlur={() => updateKPI(ch.id, kpi.id, "isNew", false)}
                          className="w-full rounded-lg border border-[#d1d5dc] px-2.5 py-1.5 text-sm focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
                      ) : (
                        <span className="text-sm font-medium text-[#111318]">{kpi.name}</span>
                      )}
                    </div>
                    <div className="pr-4">
                      <div className="relative inline-flex items-center">
                        <select value={kpi.classification} onChange={(e) => updateKPI(ch.id, kpi.id, "classification", e.target.value)}
                          className={`appearance-none rounded-full border-0 py-1 pl-3 pr-6 text-xs font-medium focus:outline-none cursor-pointer ${style.bg} ${style.text}`}>
                          {CLASSIFICATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <svg className={`pointer-events-none absolute right-2 ${style.text}`} width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pr-4">
                      <input type="number" min={0} max={100} value={kpi.weight}
                        onChange={(e) => changeWeight(ch.id, kpi.id, parseInt(e.target.value) || 0)}
                        className="w-14 rounded-lg border border-[#e5e7eb] px-2 py-1 text-center text-sm font-semibold focus:border-[#155dfc] focus:outline-none" />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e5e7eb]">
                        <div className={`h-full rounded-full transition-all ${style.bar}`} style={{ width: `${kpi.weight}%` }} />
                      </div>
                    </div>
                    <div><span className={`text-xs ${suggested.cls}`}>{suggested.label}</span></div>
                    <div className="flex justify-center">
                      <button onClick={() => removeKPI(ch.id, kpi.id)}
                        className="rounded p-1 text-[#d1d5dc] hover:text-[#dc2626] hover:bg-[#fee2e2] transition-colors">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 2L10 10M2 10L10 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center border-t border-[#f3f4f6] px-6 py-3">
              <button onClick={() => addKPI(ch.id)}
                className="flex items-center gap-1.5 text-sm text-[#9ca3af] hover:text-[#374151] transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Add KPI
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#e5e7eb] bg-white px-6 py-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282]">Engagement Depth — Classification Guide</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {[
            { cls: "Reach Event", desc: "Awareness signals — the customer has encountered your brand but reveals nothing about intent. Score them low." },
            { cls: "Engagement Event", desc: "Deliberate action signals — the customer chose to engage, indicating genuine interest. Score them moderately." },
            { cls: "Interactive Engagement", desc: "High-investment interactions requiring significant time commitment. Score them highly." },
            { cls: "Advocacy", desc: "Highest form — the customer is actively promoting your brand to peers. Score them highest." },
          ].map((item) => {
            const s = classificationStyle(item.cls);
            return (
              <div key={item.cls} className="flex items-start gap-2.5">
                <span className={`mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>{item.cls}</span>
                <p className="text-xs text-[#6a7282] leading-snug">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════

export default function ScoreConfiguration() {
  const [searchParams] = useSearchParams();
  const rawEntity = searchParams.get("entity");
  const entity = rawEntity === "hco" ? "hco" : rawEntity === "signal" ? "signal" : "hcp";
  const isSignal = entity === "signal";

  const tabs = isSignal
    ? [{ key: "engagement", label: "Engagement Score" }]
    : [{ key: "icp", label: "ICP Score" }, { key: "engagement", label: "Engagement Score" }];

  const [activeTab, setActiveTab] = useState(isSignal ? "engagement" : "icp");

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col gap-0 p-8 pb-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-5">
            <Link
              to={entity === "hco" ? "/profiles?tab=HCOs" : entity === "signal" ? "/profiles?tab=Signals" : "/profiles?tab=HCPs"}
              className="text-[#6a7282] transition-colors hover:text-[#155dfc]"
            >
              Profiles
            </Link>
            <span className="text-[#6a7282]">/</span>
            <span className="text-[#111318] font-medium">
              {entity === "hco" ? "HCO score configuration" : entity === "signal" ? "Lead signal score configuration" : "HCP score configuration"}
            </span>
          </nav>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-[#0a0a0a]">
                {entity === "hco" ? "HCO Score Configuration" : entity === "signal" ? "Lead Signal Score Configuration" : "HCP Score Configuration"}
              </h1>
              <p className="text-sm text-[#6a7282] max-w-[560px]">
                {entity === "hco"
                  ? "Configure ICP fit scores and engagement models for Healthcare Organizations."
                  : entity === "signal"
                  ? "Configure the Engagement Score model for anonymous lead signals."
                  : "Configure ICP fit scores and engagement models for Healthcare Professionals."}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-[#e5e7eb]">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-5 pb-3 pt-1 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key ? "border-[#155dfc] text-[#155dfc]" : "border-transparent text-[#6a7282] hover:text-[#374151]"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto px-8 py-6">
          {activeTab === "icp" && entity === "hcp" && <HCPICPScoreTab />}
          {activeTab === "icp" && entity === "hco" && <HCOICPScoreTab />}
          {activeTab === "engagement" && <EngagementScoreTab />}
        </div>
      </main>
    </div>
  );
}
