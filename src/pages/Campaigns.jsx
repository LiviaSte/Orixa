import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
  PlusIcon,
  SalesCloudIcon,
  MarketoIcon,
  GoogleAnalyticsIcon,
  EditPencilIcon,
  TrashIcon,
  SearchIcon,
  ChevronDownIcon,
} from "../components/icons";

// ── Rule builder options ─────────────────────────────────────────
const PROPERTIES = [
  "UTM Campaign", "UTM Source", "UTM Medium", "UTM Content", "UTM Term",
  "Campaign Name", "Program Name", "Form Name", "Campaign Type",
];
const OPERATORS = [
  "contains", "is", "starts with", "ends with", "does not contain",
];

// ── Connected data sources with detected signals ─────────────────
const ALL_SOURCES = [
  {
    id: "salesforce",
    name: "Salesforce Sales Cloud",
    Icon: SalesCloudIcon,
    properties: [
      { name: "Campaign Name",  samples: ["ESMO 2025 Attendance", "Cardio HCP Outreach Q1", "GLP-1 Launch — Digital", "Diabetes Awareness Drive", "Oncology KOL Advisory"], count: 47, status: "available" },
      { name: "Campaign Type",  samples: ["Email", "Event", "Webinar", "Rep Visit"], count: 4, status: "available" },
      { name: "UTM Campaign",   samples: [], count: 0, status: "missing" },
    ],
  },
  {
    id: "marketo",
    name: "Marketo",
    Icon: MarketoIcon,
    properties: [
      { name: "Program Name",  samples: ["2025-ESMO-Oncol-Follow", "2026-Q1-Cardio-Email", "GLP1-Launch-Multitouch", "Diabetes-Q1-Nurture"], count: 23, status: "available" },
      { name: "Campaign Name", samples: ["ESMO Follow-up Email", "Cardiology Webinar Invite", "GLP-1 HCP Awareness", "Diabetes HCP Nurture"], count: 31, status: "available" },
      { name: "UTM Campaign",  samples: [], count: 0, status: "missing" },
    ],
  },
  {
    id: "ga",
    name: "Google Analytics",
    Icon: GoogleAnalyticsIcon,
    properties: [
      { name: "UTM Campaign", samples: ["esmo_2025_oncol", "cardio_hcp_q1", "glp1_launch_search", "diabetes_awareness", "kol_activation"], count: 18, status: "available" },
      { name: "UTM Source",   samples: ["google", "bing", "linkedin", "email", "medscape.com"], count: 12, status: "available" },
      { name: "UTM Medium",   samples: ["cpc", "email", "display", "social", "organic"], count: 5, status: "available" },
      { name: "UTM Content",  samples: ["hcp_banner_v1", "patient_video_30s", "rep_email_link", "cta_learn_more"], count: 27, status: "available" },
      { name: "UTM Term",     samples: [], count: 0, status: "missing" },
    ],
  },
];
const SOURCE_MAP = Object.fromEntries(ALL_SOURCES.map((s) => [s.id, s]));

// ── Campaign groups (umbrella campaigns) — pharma examples ───────
const INITIAL_GROUPS = [
  {
    id: 1,
    name: "ESMO 2025 Congress Engagement",
    description: "All touchpoints related to the ESMO 2025 oncology congress, including paid media, CRM activities, and follow-up emails.",
    keywords: ["ESMO", "esmo_2025", "oncol"],
    sourceIds: ["salesforce", "ga"],
    rules: [
      { id: 2, conditions: [{ id: 3, property: "UTM Campaign", operator: "contains", value: "esmo" }], mappedValue: "ESMO 2025 – Paid Digital" },
      { id: 4, conditions: [{ id: 5, property: "Campaign Name", operator: "contains", value: "ESMO" }], mappedValue: "ESMO 2025 – CRM" },
    ],
  },
  {
    id: 6,
    name: "GLP-1 New Drug Launch",
    description: "Campaigns tied to the GLP-1 product launch, covering paid search, email nurture, and display advertising.",
    keywords: ["GLP-1", "GLP1", "glp1", "launch"],
    sourceIds: ["salesforce", "marketo", "ga"],
    rules: [
      { id: 7,  conditions: [{ id: 8, property: "UTM Campaign", operator: "contains", value: "glp1" }, { id: 9, property: "UTM Source", operator: "is", value: "google" }], mappedValue: "GLP-1 Launch – Paid Search" },
      { id: 10, conditions: [{ id: 11, property: "Program Name", operator: "contains", value: "GLP1" }], mappedValue: "GLP-1 Launch – Email" },
      { id: 12, conditions: [{ id: 13, property: "Campaign Name", operator: "contains", value: "GLP-1" }, { id: 14, property: "UTM Medium", operator: "is", value: "display" }], mappedValue: "GLP-1 Launch – Display" },
    ],
  },
  {
    id: 15,
    name: "Cardiology HCP Education",
    description: "Educational campaigns targeting cardiology HCPs via email and LinkedIn social channels.",
    keywords: ["Cardio", "cardio_hcp", "cardiology", "Cardiology"],
    sourceIds: ["salesforce", "marketo", "ga"],
    rules: [
      { id: 16, conditions: [{ id: 17, property: "Campaign Name", operator: "contains", value: "Cardio" }, { id: 18, property: "UTM Medium", operator: "is", value: "email" }], mappedValue: "Cardio Education – Email" },
      { id: 19, conditions: [{ id: 20, property: "UTM Campaign", operator: "contains", value: "cardio_hcp" }, { id: 21, property: "UTM Source", operator: "is", value: "linkedin" }], mappedValue: "Cardio Education – LinkedIn" },
    ],
  },
  {
    id: 22,
    name: "Diabetes Q1 Awareness",
    description: "Q1 awareness campaigns for the diabetes therapeutic area targeting general practitioners and diabetology HCPs.",
    keywords: ["Diabetes", "diabetes", "diabetes_awareness", "Diabetes-Q1"],
    sourceIds: ["marketo", "ga"],
    rules: [
      { id: 23, conditions: [{ id: 24, property: "UTM Campaign", operator: "contains", value: "diabetes" }], mappedValue: "Diabetes Q1 – Digital" },
      { id: 30, conditions: [{ id: 31, property: "Program Name", operator: "contains", value: "Diabetes" }], mappedValue: "Diabetes Q1 – Email" },
    ],
  },
  {
    id: 25,
    name: "Oncology KOL Activation",
    description: "KOL engagement and activation programs for the oncology therapeutic area, covering advisory boards and rep-triggered communications.",
    keywords: ["KOL", "kol", "Oncol", "kol_activation", "oncology"],
    sourceIds: ["salesforce", "marketo"],
    rules: [
      { id: 26, conditions: [{ id: 27, property: "Campaign Name", operator: "contains", value: "KOL" }], mappedValue: "Oncology KOL – CRM" },
      { id: 28, conditions: [{ id: 29, property: "Program Name", operator: "contains", value: "Oncol" }], mappedValue: "Oncology KOL – Marketo" },
    ],
  },
];

let _nextId = 300;
const uid = () => ++_nextId;

// ── Detected campaigns mock data ─────────────────────────────────
const INITIAL_DETECTED_CAMPAIGNS = [
  // ESMO 2025 Congress Engagement (groupId: 1)
  { id: 101, groupId: 1,    value: "ESMO 2025 Attendance",         sourceId: "salesforce", property: "Campaign Name", count: 12,
    details: [{ label: "Campaign Type", value: "Event" }, { label: "Status", value: "Completed" }, { label: "Start Date", value: "Oct 20, 2025" }] },
  { id: 102, groupId: 1,    value: "esmo_2025_oncol",              sourceId: "ga",         property: "UTM Campaign",  count: 847,
    details: [{ label: "UTM Source", value: "google" }, { label: "UTM Medium", value: "cpc" }, { label: "UTM Content", value: "hcp_banner_v1" }] },
  { id: 103, groupId: 1,    value: "ESMO Follow-up Email",         sourceId: "marketo",    property: "Campaign Name", count: 3,
    details: [{ label: "Program Name", value: "2025-ESMO-Oncol-Follow" }, { label: "Program Type", value: "Email Batch" }] },
  { id: 104, groupId: 1,    value: "2025-ESMO-Oncol-Follow",       sourceId: "marketo",    property: "Program Name",  count: 1,
    details: [{ label: "Program Type", value: "Nurture" }, { label: "Status", value: "Completed" }] },
  // GLP-1 New Drug Launch (groupId: 6)
  { id: 201, groupId: 6,    value: "GLP-1 Launch — Digital",       sourceId: "salesforce", property: "Campaign Name", count: 8,
    details: [{ label: "Campaign Type", value: "Digital" }, { label: "Status", value: "Active" }, { label: "Start Date", value: "Jan 15, 2026" }] },
  { id: 202, groupId: 6,    value: "glp1_launch_search",           sourceId: "ga",         property: "UTM Campaign",  count: 1203,
    details: [{ label: "UTM Source", value: "google" }, { label: "UTM Medium", value: "cpc" }, { label: "UTM Term", value: "glp1 medication" }] },
  { id: 203, groupId: 6,    value: "GLP1-Launch-Multitouch",       sourceId: "marketo",    property: "Program Name",  count: 2,
    details: [{ label: "Program Type", value: "Engagement" }, { label: "Status", value: "Active" }] },
  { id: 204, groupId: 6,    value: "GLP-1 HCP Awareness",          sourceId: "marketo",    property: "Campaign Name", count: 9,
    details: [{ label: "Program Name", value: "GLP1-Launch-Multitouch" }, { label: "Segment", value: "Endocrinology HCP" }] },
  // Cardiology HCP Education (groupId: 15)
  { id: 301, groupId: 15,   value: "Cardio HCP Outreach Q1",       sourceId: "salesforce", property: "Campaign Name", count: 15,
    details: [{ label: "Campaign Type", value: "Email" }, { label: "Status", value: "Active" }, { label: "Owner", value: "Field Medical Team" }] },
  { id: 302, groupId: 15,   value: "cardio_hcp_q1",                sourceId: "ga",         property: "UTM Campaign",  count: 634,
    details: [{ label: "UTM Source", value: "linkedin" }, { label: "UTM Medium", value: "social" }, { label: "UTM Content", value: "hcp_banner_v1" }] },
  { id: 303, groupId: 15,   value: "Cardiology Webinar Invite",     sourceId: "marketo",    property: "Campaign Name", count: 7,
    details: [{ label: "Program Name", value: "2026-Q1-Cardio-Email" }, { label: "Program Type", value: "Webinar" }] },
  { id: 304, groupId: 15,   value: "2026-Q1-Cardio-Email",         sourceId: "marketo",    property: "Program Name",  count: 1,
    details: [{ label: "Program Type", value: "Email Send" }, { label: "Status", value: "Completed" }] },
  // Diabetes Q1 Awareness (groupId: 22)
  { id: 401, groupId: 22,   value: "Diabetes Awareness Drive",      sourceId: "salesforce", property: "Campaign Name", count: 6,
    details: [{ label: "Campaign Type", value: "Email" }, { label: "Status", value: "Active" }, { label: "Target", value: "General Practitioners" }] },
  { id: 402, groupId: 22,   value: "diabetes_awareness",           sourceId: "ga",         property: "UTM Campaign",  count: 412,
    details: [{ label: "UTM Source", value: "medscape.com" }, { label: "UTM Medium", value: "display" }, { label: "UTM Content", value: "patient_video_30s" }] },
  { id: 403, groupId: 22,   value: "Diabetes-Q1-Nurture",          sourceId: "marketo",    property: "Program Name",  count: 1,
    details: [{ label: "Program Type", value: "Nurture" }, { label: "Status", value: "Active" }] },
  { id: 404, groupId: 22,   value: "Diabetes HCP Nurture",         sourceId: "marketo",    property: "Campaign Name", count: 5,
    details: [{ label: "Program Name", value: "Diabetes-Q1-Nurture" }, { label: "Segment", value: "Diabetology HCP" }] },
  // Oncology KOL Activation (groupId: 25)
  { id: 501, groupId: 25,   value: "Oncology KOL Advisory",        sourceId: "salesforce", property: "Campaign Name", count: 4,
    details: [{ label: "Campaign Type", value: "Rep Visit" }, { label: "Status", value: "Active" }, { label: "Target", value: "Oncology KOLs" }] },
  { id: 502, groupId: 25,   value: "kol_activation",               sourceId: "ga",         property: "UTM Campaign",  count: 189,
    details: [{ label: "UTM Source", value: "email" }, { label: "UTM Medium", value: "email" }, { label: "UTM Content", value: "rep_email_link" }] },
  { id: 503, groupId: 25,   value: "2025-ESMO-Oncol-Follow",       sourceId: "marketo",    property: "Program Name",  count: 1,
    details: [{ label: "Program Type", value: "Webinar" }, { label: "Status", value: "Completed" }] },
  // Unmatched
  { id: 601, groupId: null, value: "MSL Field Visit — Hematology", sourceId: "salesforce", property: "Campaign Name", count: 3,
    details: [{ label: "Campaign Type", value: "Rep Visit" }, { label: "Status", value: "Active" }, { label: "Target", value: "Hematology HCPs" }] },
  { id: 602, groupId: null, value: "hema_launch_2025",             sourceId: "ga",         property: "UTM Campaign",  count: 97,
    details: [{ label: "UTM Source", value: "bing" }, { label: "UTM Medium", value: "cpc" }] },
  { id: 603, groupId: null, value: "Rep Visit — Neurology Q4",     sourceId: "salesforce", property: "Campaign Name", count: 2,
    details: [{ label: "Campaign Type", value: "Rep Visit" }, { label: "Status", value: "Planned" }, { label: "Quarter", value: "Q4 2025" }] },
  { id: 604, groupId: null, value: "Hematology-KOL-Invite",        sourceId: "marketo",    property: "Program Name",  count: 1,
    details: [{ label: "Program Type", value: "Invitation" }, { label: "Status", value: "Draft" }] },
];

// ── Reusable select dropdown ──────────────────────────────────────
function FilterSelect({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-[#0a0a0a] outline-none transition-colors hover:border-gray-300 focus:border-[#155dfc] cursor-pointer"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]">
        <ChevronDownIcon />
      </span>
    </div>
  );
}

// ── Campaigns Tab ─────────────────────────────────────────────────
function CampaignsTab({ groups, detectedCampaigns }) {
  const [search,       setSearch]       = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Derive unique types from data
  const allTypes = [...new Set(detectedCampaigns.map((c) => c.property))].sort();

  const getGroupKeywords = (groupId) =>
    groupId ? (groups.find((g) => g.id === groupId)?.keywords ?? []) : [];

  const getGroupName = (groupId) =>
    groupId ? (groups.find((g) => g.id === groupId)?.name ?? null) : null;

  const filtered = detectedCampaigns.filter((c) => {
    const q            = search.toLowerCase();
    const groupKw      = getGroupKeywords(c.groupId);
    const matchesSearch =
      !q ||
      c.value.toLowerCase().includes(q) ||
      groupKw.some((kw) => kw.toLowerCase().includes(q));
    const matchesSource = sourceFilter === "all" || c.sourceId === sourceFilter;
    const matchesType   = typeFilter   === "all" || c.property  === typeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "matched"   && c.groupId !== null) ||
      (statusFilter === "unmatched" && c.groupId === null);
    return matchesSearch && matchesSource && matchesType && matchesStatus;
  });

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex w-64 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <SearchIcon />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or keywords…"
            className="flex-1 text-sm text-[#0a0a0a] outline-none placeholder:text-[#9ca3af]"
          />
        </div>

        {/* Source dropdown */}
        <FilterSelect value={sourceFilter} onChange={setSourceFilter}>
          <option value="all">All sources</option>
          {ALL_SOURCES.map((src) => (
            <option key={src.id} value={src.id}>{src.name}</option>
          ))}
        </FilterSelect>

        {/* Type dropdown */}
        <FilterSelect value={typeFilter} onChange={setTypeFilter}>
          <option value="all">All types</option>
          {allTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </FilterSelect>

        {/* Status dropdown */}
        <FilterSelect value={statusFilter} onChange={setStatusFilter}>
          <option value="all">All statuses</option>
          <option value="matched">Matched</option>
          <option value="unmatched">Unmatched</option>
        </FilterSelect>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-gray-100 bg-[#f9fafb]">
              <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af]">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af]">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af]">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#9ca3af]">Occurrences</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af]">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af]">Keywords</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-[#9ca3af]">
                  No signals match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const src       = SOURCE_MAP[c.sourceId];
                const keywords  = getGroupKeywords(c.groupId);
                const groupName = getGroupName(c.groupId);
                const isMatched = c.groupId !== null;
                return (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-[#f9fafb]">
                    {/* ID */}
                    <td className="px-6 py-3">
                      <p className="text-sm font-medium text-[#0a0a0a]">{c.value}</p>
                      {groupName && (
                        <p className="mt-0.5 text-xs text-[#9ca3af]">{groupName}</p>
                      )}
                    </td>
                    {/* Source */}
                    <td className="px-6 py-3">
                      {src && (
                        <div className="flex items-center gap-2">
                          <src.Icon />
                          <span className="text-sm text-[#4a5565]">{src.name}</span>
                        </div>
                      )}
                    </td>
                    {/* Type (property) */}
                    <td className="px-6 py-3">
                      <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs font-medium text-[#6a7282]">
                        {c.property}
                      </span>
                    </td>
                    {/* Occurrences */}
                    <td className="px-6 py-3 text-right text-sm tabular-nums text-[#4a5565]">
                      {c.count.toLocaleString()}
                    </td>
                    {/* Status */}
                    <td className="px-6 py-3">
                      {isMatched ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-semibold text-[#15803d]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
                          Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-xs font-semibold text-[#92400e]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                          Unmatched
                        </span>
                      )}
                    </td>
                    {/* Keywords */}
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {keywords.slice(0, 3).map((kw) => (
                          <span
                            key={kw}
                            className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-xs font-medium text-[#155dfc]"
                          >
                            {kw}
                          </span>
                        ))}
                        {keywords.length > 3 && (
                          <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs text-[#9ca3af]">
                            +{keywords.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Add-Signal Modal ─────────────────────────────────────────────
function AddSignalModal({ isOpen, onClose, detectedCampaigns, currentGroupId, currentGroupName, onAddSignal, groups }) {
  const [search, setSearch] = useState("");
  if (!isOpen) return null;

  const q = search.toLowerCase();
  const filtered = detectedCampaigns.filter((c) => {
    if (!q) return true;
    const src = SOURCE_MAP[c.sourceId];
    return (
      c.value.toLowerCase().includes(q) ||
      c.property.toLowerCase().includes(q) ||
      src?.name.toLowerCase().includes(q) ||
      (c.details || []).some((d) => d.value.toLowerCase().includes(q))
    );
  });

  const getGroupName = (gId) => groups.find((g) => g.id === gId)?.name ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="flex h-[78vh] w-[740px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#0a0a0a]">Add signals</h2>
            <p className="text-sm text-[#6a7282]">to {currentGroupName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#9ca3af] transition-colors hover:bg-gray-100 hover:text-[#0a0a0a]"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-gray-100 px-6 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-[#f9fafb] px-3 py-2">
            <SearchIcon />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, property or source…"
              className="flex-1 bg-transparent text-sm text-[#0a0a0a] outline-none placeholder:text-[#9ca3af]"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-[#9ca3af]">No signals match your search.</p>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-[#9ca3af]">Signal</th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-[#9ca3af]">Source</th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-[#9ca3af]">Currently in</th>
                  <th className="px-6 py-2.5 text-right text-xs font-medium text-[#9ca3af]">Occ.</th>
                  <th className="px-6 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const src = SOURCE_MAP[c.sourceId];
                  const inThisGroup = c.groupId === currentGroupId;
                  const ownerName = c.groupId ? getGroupName(c.groupId) : null;
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-gray-50 last:border-0 ${inThisGroup ? "bg-[#f0fdf4]" : "hover:bg-[#f9fafb]"}`}
                    >
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-[#0a0a0a]">{c.value}</p>
                        <span className="mt-0.5 inline-block rounded-full bg-[#f3f4f6] px-1.5 py-0.5 text-xs text-[#6a7282]">
                          {c.property}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {src && (
                          <div className="flex items-center gap-2">
                            <src.Icon />
                            <span className="text-xs text-[#6a7282]">{src.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {inThisGroup ? (
                          <span className="text-xs font-semibold text-[#15803d]">✓ This group</span>
                        ) : ownerName ? (
                          <span className="text-xs text-[#6a7282]">{ownerName}</span>
                        ) : (
                          <span className="text-xs font-medium text-[#f59e0b]">Unmatched</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right text-xs text-[#9ca3af]">
                        {c.count.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {!inThisGroup && (
                          <button
                            onClick={() => onAddSignal(c.id)}
                            className="rounded-lg bg-[#155dfc] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1a4fd6]"
                          >
                            Add
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── New Campaign Group Modal ──────────────────────────────────────
// Stop-words to exclude from name/description fuzzy matching
const SIGNAL_STOP_WORDS = new Set([
  "the","and","for","this","with","that","from","have","will","been","they","their",
  "what","when","which","were","your","also","into","than","then","both","each",
  "more","such","some","most","over","very","just","like","only","but","its","who",
  "how","our","are","was","all","any","can","had","has","may","new","not","now",
  "per","set","use","you","via","about","after","before","between","campaign",
]);

function NewGroupModal({ isOpen, onClose, onCreate, detectedCampaigns, groups }) {
  const [name,              setName]              = useState("");
  const [description,       setDescription]       = useState("");
  const [keyInput,          setKeyInput]          = useState("");
  const [keywords,          setKeywords]          = useState([]);
  // deselectedIds: signals the user has explicitly unchecked (all others are selected by default)
  const [deselectedIds,  setDeselectedIds]  = useState(new Set());
  const [signalSearch,   setSignalSearch]   = useState("");

  if (!isOpen) return null;

  // ── Live signal matching ────────────────────────────────────────
  const nameWords = name.toLowerCase().split(/[\s\-_/]+/).filter(
    (w) => w.length > 2 && !SIGNAL_STOP_WORDS.has(w)
  );
  const descWords = description.toLowerCase().split(/[\s\-_/]+/).filter(
    (w) => w.length > 3 && !SIGNAL_STOP_WORDS.has(w)
  );
  const lowerKw = keywords.map((k) => k.toLowerCase());
  const terms   = [...new Set([...lowerKw, ...nameWords, ...descWords])];

  // Progressive matches from name/desc/keywords
  const progressiveMatches = terms.length > 0
    ? detectedCampaigns.filter((c) => terms.some((t) => c.value.toLowerCase().includes(t)))
    : [];

  // Default: only unmatched progressive matches
  // With search: all signals matching the query (matched + unmatched)
  const sq = signalSearch.toLowerCase().trim();
  const matchingSignals = sq
    ? detectedCampaigns.filter((c) => c.value.toLowerCase().includes(sq))
    : progressiveMatches.filter((c) => c.groupId === null);

  const getOwnerName = (gId) => groups.find((g) => g.id === gId)?.name ?? null;

  // ── Selection helpers ────────────────────────────────────────────
  // All signals are selected by default; deselectedIds tracks explicitly unchecked ones
  const isSignalSelected = (c) => !deselectedIds.has(c.id);

  const toggleSignal = (c) => {
    if (isSignalSelected(c)) {
      setDeselectedIds((prev) => new Set([...prev, c.id]));
    } else {
      setDeselectedIds((prev) => { const n = new Set(prev); n.delete(c.id); return n; });
    }
  };

  const selectedCount = matchingSignals.filter((c) => isSignalSelected(c)).length;
  const allSelected   = matchingSignals.length > 0 && selectedCount === matchingSignals.length;

  const selectAll   = () => setDeselectedIds(new Set());
  const deselectAll = () => setDeselectedIds(new Set(matchingSignals.map((c) => c.id)));

  const addKeyword = () => {
    const kw = keyInput.trim();
    if (kw && !keywords.includes(kw)) setKeywords((p) => [...p, kw]);
    setKeyInput("");
  };

  const removeKeyword = (kw) => setKeywords((p) => p.filter((k) => k !== kw));

  const resetForm = () => {
    setName(""); setDescription(""); setKeyInput(""); setKeywords([]);
    setDeselectedIds(new Set()); setSignalSearch("");
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const signalsToAdd = new Set(
      matchingSignals.filter((c) => isSignalSelected(c)).map((c) => c.id)
    );
    onCreate({ name: name.trim(), description: description.trim(), keywords, selectedSignalIds: signalsToAdd });
    resetForm();
  };

  const handleClose = () => { resetForm(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="flex w-[560px] max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-[#0a0a0a]">New campaign group</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-[#9ca3af] transition-colors hover:bg-gray-100 hover:text-[#0a0a0a]"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
              Name <span className="text-[#ef4444]">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") document.getElementById("ng-desc")?.focus(); }}
              placeholder="e.g. ESMO 2025 Congress Engagement"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#0a0a0a] outline-none placeholder:text-[#9ca3af] focus:border-[#155dfc]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
              Description
            </label>
            <textarea
              id="ng-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what this campaign group represents…"
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#0a0a0a] outline-none placeholder:text-[#9ca3af] focus:border-[#155dfc]"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
              Keywords
            </label>
            <p className="mb-2.5 text-xs text-[#9ca3af]">
              Signals whose value matches any keyword will be auto-assigned to this group.
            </p>
            <div className="flex gap-2">
              <input
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addKeyword(); }
                }}
                placeholder="Type a keyword and press Enter…"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-[#0a0a0a] outline-none placeholder:text-[#9ca3af] focus:border-[#155dfc]"
              />
              <button
                onClick={addKeyword}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-[#6a7282] transition-colors hover:border-[#155dfc] hover:text-[#155dfc]"
              >
                Add
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="flex items-center gap-1.5 rounded-full bg-[#eff6ff] px-2.5 py-1 text-xs font-medium text-[#155dfc]"
                  >
                    {kw}
                    <button
                      onClick={() => removeKeyword(kw)}
                      className="text-[#93c5fd] transition-colors hover:text-[#ef4444]"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Live matching signals preview ───────────────────── */}
          {terms.length > 0 && (
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
                  Potential matches
                </p>
                {matchingSignals.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#9ca3af]">
                      {selectedCount} of {matchingSignals.length} selected
                    </span>
                    <button
                      onClick={allSelected ? deselectAll : selectAll}
                      className="text-xs font-medium text-[#155dfc] hover:underline"
                    >
                      {allSelected ? "Deselect all" : "Add all"}
                    </button>
                  </div>
                )}
              </div>

              {/* Search to find matched signals too */}
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-[#f9fafb] px-3 py-1.5">
                <SearchIcon />
                <input
                  value={signalSearch}
                  onChange={(e) => setSignalSearch(e.target.value)}
                  placeholder="Search all signals…"
                  className="flex-1 bg-transparent text-xs text-[#0a0a0a] outline-none placeholder:text-[#9ca3af]"
                />
              </div>

              {matchingSignals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-5 text-center">
                  <p className="text-xs text-[#9ca3af]">
                    {sq ? "No signals match your search." : "No unmatched signals found. Search above to find and add matched signals."}
                  </p>
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
                  {matchingSignals.map((c) => {
                    const src      = SOURCE_MAP[c.sourceId];
                    const selected = isSignalSelected(c);
                    const ownerName = c.groupId ? getOwnerName(c.groupId) : null;
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleSignal(c)}
                        className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors ${
                          selected ? "bg-[#f0fdf4]" : "bg-[#f9fafb] opacity-50 hover:opacity-70"
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                            selected
                              ? "border-[#155dfc] bg-[#155dfc]"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {selected && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>

                        {src && <div className="shrink-0"><src.Icon /></div>}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#0a0a0a]">{c.value}</p>
                          <p className="text-xs text-[#9ca3af]">{src?.name} · {c.property}</p>
                        </div>

                        {ownerName && (
                          <div className="flex shrink-0 flex-col items-end gap-0.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 text-xs font-semibold text-[#15803d]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
                              Matched
                            </span>
                            <span className="max-w-[110px] truncate text-xs text-[#9ca3af]">{ownerName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#6a7282] transition-colors hover:text-[#0a0a0a]"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="rounded-xl bg-[#155dfc] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a4fd6] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create campaign group
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Campaign Groups Tab ──────────────────────────────────────────
function CampaignGroupsTab({ groups, setGroups, selectedId, setSelectedId, detectedCampaigns, setDetectedCampaigns }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName,  setEditName]  = useState("");
  const [editDesc,  setEditDesc]  = useState("");
  const [newKeyword,     setNewKeyword]     = useState("");
  const [showSignalModal, setShowSignalModal] = useState(false);

  // Reset local state when the selected group changes
  useEffect(() => {
    setIsEditing(false);
    setEditName("");
    setEditDesc("");
    setNewKeyword("");
    setShowSignalModal(false);
  }, [selectedId]);

  const selected = groups.find((g) => g.id === selectedId);

  // ── Group-level helpers ────────────────────────────────────────
  const updateGroup = (fn) =>
    setGroups((prev) => prev.map((g) => (g.id !== selectedId ? g : fn(g))));

  const startEditing = () => {
    setEditName(selected?.name ?? "");
    setEditDesc(selected?.description ?? "");
    setIsEditing(true);
  };

  const saveEdits = () => {
    if (editName.trim()) {
      updateGroup((g) => ({ ...g, name: editName.trim(), description: editDesc.trim() }));
    }
    setIsEditing(false);
  };

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw) return;
    updateGroup((g) => ({
      ...g,
      keywords: [...(g.keywords || []).filter((k) => k !== kw), kw],
    }));
    setNewKeyword("");
  };

  const removeKeyword = (kw) =>
    updateGroup((g) => ({ ...g, keywords: (g.keywords || []).filter((k) => k !== kw) }));

  const deleteGroup = (groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (selectedId === groupId) {
      const remaining = groups.filter((g) => g.id !== groupId);
      setSelectedId(remaining[0]?.id ?? null);
    }
  };

  // ── Signal helpers ─────────────────────────────────────────────
  const groupSignals = detectedCampaigns.filter((c) => c.groupId === selectedId);

  const removeSignal = (signalId) =>
    setDetectedCampaigns((prev) =>
      prev.map((c) => (c.id !== signalId ? c : { ...c, groupId: null }))
    );

  const addSignal = (signalId) => {
    setDetectedCampaigns((prev) =>
      prev.map((c) => (c.id !== signalId ? c : { ...c, groupId: selectedId }))
    );
  };

  // ── Rule/condition helpers ─────────────────────────────────────
  const updateCondition = (ruleId, condId, field, value) =>
    updateGroup((g) => ({
      ...g,
      rules: g.rules.map((r) =>
        r.id !== ruleId ? r : {
          ...r,
          conditions: r.conditions.map((c) =>
            c.id !== condId ? c : { ...c, [field]: value }
          ),
        }
      ),
    }));

  const updateMappedValue = (ruleId, value) =>
    updateGroup((g) => ({
      ...g,
      rules: g.rules.map((r) => (r.id !== ruleId ? r : { ...r, mappedValue: value })),
    }));

  const addCondition = (ruleId) =>
    updateGroup((g) => ({
      ...g,
      rules: g.rules.map((r) =>
        r.id !== ruleId ? r : {
          ...r,
          conditions: [
            ...r.conditions,
            { id: uid(), property: PROPERTIES[0], operator: OPERATORS[0], value: "" },
          ],
        }
      ),
    }));

  const removeCondition = (ruleId, condId) =>
    updateGroup((g) => ({
      ...g,
      rules: g.rules.map((r) =>
        r.id !== ruleId ? r : {
          ...r,
          conditions: r.conditions.filter((c) => c.id !== condId),
        }
      ),
    }));

  const addRule = () =>
    updateGroup((g) => ({
      ...g,
      rules: [
        ...g.rules,
        {
          id: uid(),
          conditions: [{ id: uid(), property: PROPERTIES[0], operator: OPERATORS[0], value: "" }],
          mappedValue: "",
        },
      ],
    }));

  const removeRule = (ruleId) =>
    updateGroup((g) => ({ ...g, rules: g.rules.filter((r) => r.id !== ruleId) }));


  return (
    <div className="flex flex-1 overflow-hidden">
      {showSignalModal && (
        <AddSignalModal
          isOpen={showSignalModal}
          onClose={() => setShowSignalModal(false)}
          detectedCampaigns={detectedCampaigns}
          currentGroupId={selectedId}
          currentGroupName={selected?.name ?? ""}
          onAddSignal={(signalId) => { addSignal(signalId); }}
          groups={groups}
        />
      )}

      {/* ── Left panel: group list ───────────────────────────── */}
      <div className="flex w-64 shrink-0 flex-col border-r border-gray-100 bg-white overflow-y-auto p-3 gap-0.5">
        {groups.length === 0 && (
          <p className="px-3 py-4 text-xs text-[#9ca3af]">No campaign groups yet. Click "New campaign group" to create one.</p>
        )}
        {groups.map((g) => {
          const active = g.id === selectedId;
          return (
            <div
              key={g.id}
              className={`group flex items-center rounded-xl px-3 py-2.5 transition-colors ${
                active ? "bg-[#eff6ff]" : "hover:bg-gray-50"
              }`}
            >
              <button
                onClick={() => setSelectedId(g.id)}
                className="min-w-0 flex-1 text-left"
              >
                <p className={`truncate text-sm font-medium ${active ? "text-[#155dfc]" : "text-[#0a0a0a]"}`}>
                  {g.name}
                </p>
                <p className="mt-0.5 text-xs text-[#9ca3af]">
                  {g.rules.length} rule{g.rules.length !== 1 ? "s" : ""}
                </p>
              </button>
              <button
                onClick={() => deleteGroup(g.id)}
                className="ml-1 shrink-0 p-1 text-[#9ca3af] opacity-0 transition-all hover:text-[#ef4444] group-hover:opacity-100"
              >
                <TrashIcon />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Right panel: group detail ─────────────────────────── */}
      {selected ? (
        <div className="flex-1 overflow-y-auto p-8">

          {/* Editable campaign name + description */}
          {isEditing ? (
            <div className="mb-5">
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setIsEditing(false); }}
                className="mb-3 w-full rounded-xl border border-[#155dfc] px-3 py-2 text-lg font-semibold text-[#0a0a0a] outline-none"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                placeholder="Add a description…"
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-[#0a0a0a] outline-none placeholder:text-[#9ca3af] focus:border-[#155dfc]"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={saveEdits}
                  className="rounded-lg bg-[#155dfc] px-3 py-1.5 text-xs font-medium text-white"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-[#9ca3af] hover:text-[#6a7282]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[#0a0a0a]">{selected.name}</h2>
                <button
                  onClick={startEditing}
                  className="text-[#9ca3af] transition-colors hover:text-[#6a7282]"
                >
                  <EditPencilIcon />
                </button>
              </div>
              <div
                onClick={startEditing}
                className="cursor-pointer rounded-xl px-1 py-1 hover:bg-gray-50"
              >
                {selected.description ? (
                  <p className="text-sm text-[#6a7282]">{selected.description}</p>
                ) : (
                  <p className="text-sm italic text-[#d1d5db]">Add a description…</p>
                )}
              </div>
            </div>
          )}

          {/* Keywords */}
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Keywords</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {(selected.keywords || []).map((kw) => (
                <span
                  key={kw}
                  className="group/kw flex items-center gap-1 rounded-full bg-[#eff6ff] px-2.5 py-1 text-xs font-medium text-[#155dfc]"
                >
                  {kw}
                  <button
                    onClick={() => removeKeyword(kw)}
                    className="text-[#93c5fd] opacity-0 transition-colors hover:text-[#ef4444] group-hover/kw:opacity-100"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {/* Inline add-keyword input */}
              <div className="flex items-center gap-1">
                <input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addKeyword(); }
                  }}
                  placeholder="+ Add keyword"
                  className="w-28 rounded-full border border-dashed border-gray-300 bg-transparent px-2.5 py-1 text-xs text-[#6a7282] outline-none placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:placeholder:text-transparent"
                />
              </div>
            </div>
          </div>

          {/* Detected signals */}
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
                Detected signals
                <span className="ml-2 font-normal text-[#d1d5db]">({groupSignals.length})</span>
              </p>
              <button
                onClick={() => setShowSignalModal(true)}
                className="flex items-center gap-1 text-xs font-medium text-[#155dfc] transition-colors hover:underline"
              >
                + Add signal
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
              {groupSignals.length === 0 ? (
                <p className="px-5 py-4 text-sm text-[#9ca3af]">
                  No signals auto-detected for this group.
                </p>
              ) : (
                groupSignals.map((c) => {
                  const src = SOURCE_MAP[c.sourceId];
                  return (
                    <div key={c.id} className="group/signal px-4 py-3 hover:bg-[#f9fafb]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {/* Source header */}
                          {src && (
                            <div className="mb-1 flex items-center gap-1.5">
                              <src.Icon />
                              <span className="text-xs text-[#9ca3af]">{src.name}</span>
                            </div>
                          )}
                          {/* Value + property badge */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-[#0a0a0a]">{c.value}</span>
                            <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-xs font-medium text-[#155dfc]">
                              {c.property}
                            </span>
                          </div>
                          {/* Source-specific details */}
                          {c.details && c.details.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                              {c.details.map((d) => (
                                <span key={d.label} className="text-xs text-[#9ca3af]">
                                  <span className="font-medium text-[#6a7282]">{d.label}:</span>{" "}{d.value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-3 pt-0.5">
                          <span className="text-xs text-[#9ca3af]">{c.count.toLocaleString()}</span>
                          <button
                            onClick={() => removeSignal(c.id)}
                            title="Remove from this group"
                            className="text-[#d1d5db] transition-colors hover:text-[#ef4444] opacity-0 group-hover/signal:opacity-100"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Mapping rules */}
          <section>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
              Mapping rules
            </p>
            <div className="flex flex-col gap-4">
              {selected.rules.length === 0 && (
                <p className="text-sm text-[#9ca3af]">No mapping rules yet. Add one below.</p>
              )}
              {selected.rules.map((rule, ruleIndex) => (
                <div
                  key={rule.id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  {/* Rule header */}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
                      Rule {ruleIndex + 1}
                    </span>
                    <button
                      onClick={() => removeRule(rule.id)}
                      className="text-xs text-[#9ca3af] transition-colors hover:text-[#ef4444]"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Conditions */}
                  <div className="mb-4 flex flex-col gap-2">
                    {rule.conditions.map((cond, ci) => (
                      <div key={cond.id} className="flex items-center gap-2">
                        <span className="w-10 shrink-0 text-right text-xs font-semibold text-[#6a7282]">
                          {ci === 0 ? "Where" : "And"}
                        </span>
                        <select
                          value={cond.property}
                          onChange={(e) => updateCondition(rule.id, cond.id, "property", e.target.value)}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-[#0a0a0a] outline-none focus:border-[#155dfc]"
                        >
                          {PROPERTIES.map((p) => <option key={p}>{p}</option>)}
                        </select>
                        <select
                          value={cond.operator}
                          onChange={(e) => updateCondition(rule.id, cond.id, "operator", e.target.value)}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-[#0a0a0a] outline-none focus:border-[#155dfc]"
                        >
                          {OPERATORS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                        <input
                          value={cond.value}
                          onChange={(e) => updateCondition(rule.id, cond.id, "value", e.target.value)}
                          placeholder="value…"
                          className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#155dfc]"
                        />
                        {rule.conditions.length > 1 && (
                          <button
                            onClick={() => removeCondition(rule.id, cond.id)}
                            className="shrink-0 text-[#9ca3af] transition-colors hover:text-[#ef4444]"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="pl-12">
                      <button
                        onClick={() => addCondition(rule.id)}
                        className="text-xs font-medium text-[#155dfc] hover:underline"
                      >
                        + Add condition
                      </button>
                    </div>
                  </div>

                  {/* Map to */}
                  <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                    <span className="shrink-0 text-sm font-medium text-[#6a7282]">→ Map to</span>
                    <input
                      value={rule.mappedValue}
                      onChange={(e) => updateMappedValue(rule.id, e.target.value)}
                      placeholder="Mapped campaign name…"
                      className="flex-1 rounded-lg border border-gray-200 bg-[#f9fafb] px-3 py-1.5 text-sm font-medium text-[#0a0a0a] outline-none focus:border-[#155dfc] focus:bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addRule}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 py-3 text-sm font-medium text-[#6a7282] transition-colors hover:border-[#155dfc] hover:text-[#155dfc]"
            >
              + Add rule
            </button>
          </section>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-[#9ca3af]">
          Select a campaign group or create a new one.
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function Campaigns() {
  const [activeTab,          setActiveTab]          = useState("campaigns");
  const [groups,             setGroups]             = useState(INITIAL_GROUPS);
  const [selectedId,         setSelectedId]         = useState(INITIAL_GROUPS[0].id);
  const [detectedCampaigns,  setDetectedCampaigns]  = useState(INITIAL_DETECTED_CAMPAIGNS);
  const [showNewGroupModal,  setShowNewGroupModal]  = useState(false);

  const handleAddGroup = ({ name, description, keywords, selectedSignalIds }) => {
    const newId = uid();

    // Assign exactly the signals the user selected in the modal
    if (selectedSignalIds && selectedSignalIds.size > 0) {
      setDetectedCampaigns((prev) =>
        prev.map((c) => (selectedSignalIds.has(c.id) ? { ...c, groupId: newId } : c))
      );
    }

    setGroups((prev) => [
      ...prev,
      { id: newId, name, description, keywords, sourceIds: [], rules: [] },
    ]);
    setSelectedId(newId);
    setActiveTab("groups");
    setShowNewGroupModal(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f9fafb]">
      <Sidebar />

      {/* New group modal — rendered at root level so it overlays everything */}
      <NewGroupModal
        isOpen={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        onCreate={handleAddGroup}
        detectedCampaigns={detectedCampaigns}
        groups={groups}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-8 py-5">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[#0a0a0a]">Campaigns</h1>
              <p className="text-sm text-[#6a7282]">
                Define mapping rules to unify campaign signals across sources
              </p>
            </div>

            <button
              onClick={() => setShowNewGroupModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#155dfc] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a4fd6]"
            >
              <PlusIcon />
              New campaign group
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex px-8">
            {[
              { key: "campaigns", label: "Campaigns" },
              { key: "groups",    label: "Campaign groups" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-[#155dfc] text-[#155dfc]"
                    : "border-transparent text-[#6a7282] hover:text-[#0a0a0a]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "campaigns" ? (
          <CampaignsTab groups={groups} detectedCampaigns={detectedCampaigns} />
        ) : (
          <CampaignGroupsTab
            groups={groups}
            setGroups={setGroups}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            detectedCampaigns={detectedCampaigns}
            setDetectedCampaigns={setDetectedCampaigns}
          />
        )}
      </main>
    </div>
  );
}
