import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { CHANNEL_KPIS } from "../constants/channelKPIs";
import { SearchIcon20, EditPencilIcon, TrashIcon } from "../components/icons";

// ─── Sample "last changed" dates spread across the last 6 months ──────────────
const SAMPLE_DATES = [
  "Jan 14, 2026", "Jan 22, 2026", "Feb 3, 2026",  "Feb 10, 2026",
  "Feb 18, 2026", "Dec 5, 2025",  "Dec 19, 2025", "Nov 7, 2025",
  "Nov 28, 2025", "Oct 15, 2025",
];

// Build flat list of all metrics from the channel KPIs constant
function buildAllMetrics() {
  const rows = [];
  let globalIdx = 0;
  Object.entries(CHANNEL_KPIS).forEach(([channel, kpis]) => {
    kpis.forEach((kpi, localIdx) => {
      rows.push({
        id: `${channel}-${localIdx}`,
        name: kpi.name,
        calculation: kpi.calculation,
        sources: kpi.sources,
        type: kpi.type,
        channel,
        field: kpi.field,
        lastChanged: SAMPLE_DATES[globalIdx % SAMPLE_DATES.length],
        status: "Active",
        version: "v1.0",
      });
      globalIdx++;
    });
  });
  return rows;
}

const ALL_METRICS = buildAllMetrics();

// ─── Channel tab config ────────────────────────────────────────────────────────
const CHANNEL_TABS = [
  { label: "All Channels", key: "All Channels" },
  { label: "Email / RTE",  key: "Email" },
  { label: "Call",         key: "Call" },
  { label: "Webinar",      key: "Webinar" },
  { label: "Events",       key: "Events" },
  { label: "Web",          key: "Web" },
  { label: "Congress",     key: "Congress" },
  { label: "F2F",          key: "F2F" },
];

// ─── Channel icons / emoji ────────────────────────────────────────────────────
const CHANNEL_ICON = {
  Email:    "✉️",
  Call:     "📞",
  Webinar:  "🎥",
  Events:   "📅",
  Web:      "🌐",
  Congress: "🏛️",
  F2F:      "🤝",
};

// ─── Type badge colours ───────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const cfg = {
    engagement: { bg: "bg-[#dcfce7]", text: "text-[#15803d]", label: "Engagement" },
    reach:      { bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]", label: "Reach" },
    conversion: { bg: "bg-[#fef3c7]", text: "text-[#b45309]", label: "Conversion" },
    score:      { bg: "bg-[#ede9fe]", text: "text-[#6d28d9]", label: "Score" },
  }[type] ?? { bg: "bg-[#f3f4f6]", text: "text-[#374151]", label: type };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

// ─── Tiny icon: eye ──────────────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 10s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z"/>
      <circle cx="10" cy="10" r="3"/>
    </svg>
  );
}

// ─── Tiny icon: history ───────────────────────────────────────────────────────
function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-5.5"/>
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function MetricLibrary() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]     = useState("All Channels");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter]   = useState("All");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  // Local deleted-ids set (session only — no real persistence)
  const [deletedIds, setDeletedIds]   = useState(new Set());

  // ── Filter logic ─────────────────────────────────────────────────────────
  const filteredMetrics = useMemo(() => {
    return ALL_METRICS.filter((m) => {
      if (deletedIds.has(m.id)) return false;

      // Channel tab
      if (activeTab !== "All Channels" && m.channel !== activeTab) return false;

      // Type filter
      if (typeFilter !== "All" && m.type !== typeFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !m.name.toLowerCase().includes(q) &&
          !m.calculation.toLowerCase().includes(q) &&
          !m.sources.some((s) => s.toLowerCase().includes(q))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [activeTab, searchQuery, typeFilter, deletedIds]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = () => navigate("/adoption-ladder");

  const confirmDelete = (metric) => {
    setDeletedIds((prev) => new Set([...prev, metric.id]));
    setDeleteConfirm(null);
  };

  // ── Unique types for the filter dropdown ─────────────────────────────────
  const availableTypes = useMemo(() => {
    const types = new Set(ALL_METRICS.map((m) => m.type));
    return ["All", ...types];
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col gap-0 p-8 pb-0">
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1 mb-6">
            <h1 className="text-2xl font-semibold text-[#0a0a0a]">Metric Library</h1>
            <p className="text-sm text-[#6a7282]">
              Standardize and track performance metrics across all omnichannel touchpoints.
            </p>
          </div>

          {/* ── Channel Tabs ────────────────────────────────────────────── */}
          <div className="flex items-center gap-0 border-b border-[#e5e7eb]">
            {CHANNEL_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 pb-3 pt-1 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? "border-[#155dfc] text-[#155dfc]"
                    : "border-transparent text-[#6a7282] hover:text-[#374151]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Toolbar ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 py-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                <SearchIcon20 />
              </span>
              <input
                type="text"
                placeholder="Search metrics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#e5e7eb] bg-white py-2 pl-9 pr-4 text-sm text-[#0a0a0a] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
              />
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#374151] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
            >
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All types" : t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>

            {/* Count */}
            <span className="ml-auto text-xs text-[#9ca3af]">
              {filteredMetrics.length} metric{filteredMetrics.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ── Table (scrollable area) ──────────────────────────────────── */}
        <div className="flex-1 overflow-auto px-8 pb-8">
          <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
            {filteredMetrics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <p className="text-sm font-medium text-[#374151]">No metrics found</p>
                <p className="text-xs text-[#9ca3af]">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] w-[220px]">
                      Metric
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282]">
                      Calculation
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] w-[200px]">
                      Source
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] w-[110px]">
                      Type
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] w-[100px]">
                      Channel
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] w-[120px]">
                      Last Changed
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] w-[100px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMetrics.map((metric, idx) => (
                    <tr
                      key={metric.id}
                      className={`border-b border-[#e5e7eb] transition-colors hover:bg-[#f9fafb] ${
                        idx === filteredMetrics.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      {/* Metric name + channel icon */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 text-base leading-none">
                            {CHANNEL_ICON[metric.channel] ?? "📊"}
                          </span>
                          <span className="text-sm font-medium text-[#111318] leading-snug">
                            {metric.name}
                          </span>
                        </div>
                      </td>

                      {/* Calculation — monospace pill */}
                      <td className="px-5 py-4">
                        <span className="inline-block rounded bg-[#f3f4f6] px-2.5 py-1.5 font-mono text-[11px] leading-snug text-[#374151] max-w-[380px]">
                          {metric.calculation}
                        </span>
                      </td>

                      {/* Source links */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          {metric.sources.map((src) => (
                            <a
                              key={src}
                              href="#"
                              onClick={(e) => e.preventDefault()}
                              className="text-xs text-[#155dfc] hover:underline leading-snug"
                            >
                              {src}
                            </a>
                          ))}
                        </div>
                      </td>

                      {/* Type badge */}
                      <td className="px-5 py-4">
                        <TypeBadge type={metric.type} />
                      </td>

                      {/* Channel label */}
                      <td className="px-5 py-4 text-sm text-[#4a5565]">
                        {metric.channel}
                      </td>

                      {/* Last changed */}
                      <td className="px-5 py-4 text-xs text-[#9ca3af] whitespace-nowrap">
                        {metric.lastChanged}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            title="Preview"
                            className="rounded p-1.5 text-[#9ca3af] transition-colors hover:bg-[#f3f4f6] hover:text-[#374151]"
                          >
                            <EyeIcon />
                          </button>
                          <button
                            onClick={handleEdit}
                            title="Edit in Adoption Ladder"
                            className="rounded p-1.5 text-[#9ca3af] transition-colors hover:bg-[#f3f4f6] hover:text-[#155dfc]"
                          >
                            <EditPencilIcon />
                          </button>
                          <button
                            title="History"
                            className="rounded p-1.5 text-[#9ca3af] transition-colors hover:bg-[#f3f4f6] hover:text-[#374151]"
                          >
                            <HistoryIcon />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(metric)}
                            title="Delete"
                            className="rounded p-1.5 text-[#9ca3af] transition-colors hover:bg-[#fee2e2] hover:text-[#dc2626]"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-base font-semibold text-[#111318]">Delete Metric</h3>
            <p className="mb-1 text-sm font-medium text-[#374151]">{deleteConfirm.name}</p>
            <p className="mb-6 text-sm text-[#6a7282]">
              This will remove the metric from the library. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirm)}
                className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-medium text-white hover:bg-[#b91c1c] transition-colors"
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
