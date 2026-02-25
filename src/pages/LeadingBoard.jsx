import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  SearchIcon20,
  FilterIcon,
  TrendUpSmallIcon,
  TrendDownSmallIcon,
  ExportIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../components/icons";

/* ── Static mock data ──────────────────────────────────────────── */

const kpiCards = [
  {
    label: "Total Leads",
    value: "2,847",
    change: "+12.5%",
    sub: "vs last month",
    positive: true,
  },
  {
    label: "Qualified Leads",
    value: "1,423",
    change: "+8.3%",
    sub: "vs last month",
    positive: true,
  },
  {
    label: "Conversion Rate",
    value: "23.5%",
    change: "-2.1%",
    sub: "vs last month",
    positive: false,
  },
  {
    label: "Avg. Time to Convert",
    value: "14 days",
    change: "-3 days",
    sub: "vs last month",
    positive: true,
  },
];

const funnelStages = [
  { name: "Lead (All)", count: 2847, pct: 100, color: "#155dfc" },
  { name: "Marketing Qualified", count: 1842, pct: 64.7, color: "#3b82f6" },
  { name: "Sales Qualified", count: 1423, pct: 50.0, color: "#60a5fa" },
  { name: "Opportunity", count: 847, pct: 29.7, color: "#93bbfd" },
  { name: "Customer", count: 392, pct: 13.8, color: "#bfdbfe" },
];

const topInstitutions = [
  { name: "Mayo Clinic", score: 92, tier: 1 },
  { name: "Cleveland Clinic", score: 88, tier: 1 },
  { name: "Johns Hopkins Hospital", score: 85, tier: 2 },
  { name: "Massachusetts General", score: 81, tier: 2 },
  { name: "Stanford Health Care", score: 76, tier: 3 },
];

const allLeads = [
  {
    name: "Dr. Sarah Chen",
    specialty: "Oncology",
    institutions: ["Mayo Clinic", "Stanford Health Care"],
    stage: "Opportunity",
    score: 87,
    date: "Feb 12, 2025",
  },
  {
    name: "Dr. James Wilson",
    specialty: "Cardiology",
    institutions: ["Cleveland Clinic"],
    stage: "Sales Qualified",
    score: 74,
    date: "Feb 11, 2025",
  },
  {
    name: "Dr. Maria Garcia",
    specialty: "Neurology",
    institutions: ["Johns Hopkins Hospital", "Massachusetts General"],
    stage: "Marketing Qualified",
    score: 68,
    date: "Feb 10, 2025",
  },
  {
    name: "Dr. Robert Kim",
    specialty: "Endocrinology",
    institutions: ["Massachusetts General", "Mayo Clinic", "Boston Medical Center"],
    stage: "Lead (All)",
    score: 52,
    date: "Feb 9, 2025",
  },
  {
    name: "Dr. Emily Patel",
    specialty: "Rheumatology",
    institutions: ["Stanford Health Care"],
    stage: "Opportunity",
    score: 91,
    date: "Feb 8, 2025",
  },
  {
    name: "Dr. Thomas Nguyen",
    specialty: "Pulmonology",
    institutions: ["Mayo Clinic", "Cleveland Clinic"],
    stage: "Sales Qualified",
    score: 79,
    date: "Feb 7, 2025",
  },
];

/* ── Helpers ────────────────────────────────────────────────────── */

const tierColors = {
  1: { bg: "bg-[#dcfce7]", text: "text-[#16a34a]" },
  2: { bg: "bg-[#dbeafe]", text: "text-[#2563eb]" },
  3: { bg: "bg-[#f3f4f6]", text: "text-[#6a7282]" },
};

const stageBadge = (stage) => {
  const map = {
    "Lead (All)": { bg: "bg-[#f3f4f6]", text: "text-[#4a5565]" },
    "Marketing Qualified": { bg: "bg-[#dbeafe]", text: "text-[#2563eb]" },
    "Sales Qualified": { bg: "bg-[#fef9c3]", text: "text-[#a16207]" },
    Opportunity: { bg: "bg-[#dcfce7]", text: "text-[#16a34a]" },
    Customer: { bg: "bg-[#e0e7ff]", text: "text-[#4338ca]" },
  };
  const s = map[stage] || map["Lead (All)"];
  return `${s.bg} ${s.text}`;
};

/* ── Component ──────────────────────────────────────────────────── */

export default function LeadingBoard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeads = allLeads.filter((lead) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.specialty.toLowerCase().includes(q) ||
      lead.institutions.some((inst) => inst.toLowerCase().includes(q)) ||
      lead.stage.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">
                Leading board
              </h1>
              <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
                Monitor lead progression, funnel performance, and institutional
                engagement
              </p>
            </div>
            <button
              onClick={() => navigate("/leading-board/score-configuration")}
              className="rounded-[10px] bg-[#101828] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d2939]"
            >
              Score configuration
            </button>
          </div>

          {/* ── KPI Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-4">
            {kpiCards.map((card) => (
              <div
                key={card.label}
                className="flex flex-col gap-2 rounded-[10px] border border-[#e5e7eb] bg-white p-6"
              >
                <span className="text-sm font-medium text-[#6a7282]">
                  {card.label}
                </span>
                <span className="text-2xl font-semibold text-[#0a0a0a]">
                  {card.value}
                </span>
                <div className="flex items-center gap-1.5">
                  {card.positive ? (
                    <TrendUpSmallIcon />
                  ) : (
                    <TrendDownSmallIcon />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      card.positive ? "text-[#16a34a]" : "text-[#dc2626]"
                    }`}
                  >
                    {card.change}
                  </span>
                  <span className="text-xs text-[#9ca3af]">{card.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Middle Row: Funnel + Top Institutions ──────────── */}
          <div className="grid grid-cols-5 gap-6">
            {/* Lead Funnel */}
            <div className="col-span-3 flex flex-col gap-5 rounded-[10px] border border-[#e5e7eb] bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#0a0a0a]">
                  Lead Funnel
                </h2>
                <select className="rounded-lg border border-[#d1d5dc] bg-white px-3 py-1.5 text-sm text-[#4a5565]">
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>Last 12 months</option>
                </select>
              </div>

              <div className="flex flex-col gap-3">
                {funnelStages.map((stage) => (
                  <div key={stage.name} className="flex items-center gap-4">
                    <span className="w-[140px] shrink-0 text-sm font-medium text-[#4a5565]">
                      {stage.name}
                    </span>
                    <div className="relative h-8 flex-1 rounded-md bg-[#f3f4f6]">
                      <div
                        className="flex h-full items-center rounded-md px-3"
                        style={{
                          width: `${Math.max(stage.pct, 12)}%`,
                          backgroundColor: stage.color,
                        }}
                      >
                        <span className="text-xs font-semibold text-white">
                          {stage.count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <span className="w-[52px] text-right text-sm font-medium text-[#6a7282]">
                      {stage.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Institutions */}
            <div className="col-span-2 flex flex-col gap-4 rounded-[10px] border border-[#e5e7eb] bg-white p-6">
              <h2 className="text-base font-semibold text-[#0a0a0a]">
                Top Institutions
              </h2>

              <div className="flex flex-col divide-y divide-[#f3f4f6]">
                {topInstitutions.map((inst, i) => {
                  const tc = tierColors[inst.tier];
                  return (
                    <div
                      key={inst.name}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f3f4f6] text-xs font-semibold text-[#6a7282]">
                          {i + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#0a0a0a]">
                            {inst.name}
                          </span>
                          <span className="text-xs text-[#9ca3af]">
                            Score: {inst.score}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tc.bg} ${tc.text}`}
                      >
                        Tier {inst.tier}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── New Leads Table ─────────────────────────────────── */}
          <div className="flex flex-col rounded-[10px] border border-[#e5e7eb] bg-white">
            {/* Table header bar */}
            <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
              <h2 className="text-base font-semibold text-[#0a0a0a]">
                New Leads
              </h2>
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                    <SearchIcon20 />
                  </span>
                  <input
                    type="text"
                    placeholder="Search leads"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[220px] rounded-[10px] border border-[#d1d5dc] bg-white py-2 pl-10 pr-4 text-sm text-[#0a0a0a] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  />
                </div>
                {/* Filter */}
                <button className="flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
                  <FilterIcon />
                  Filter
                </button>
                {/* Export */}
                <button className="flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
                  <ExportIcon />
                  Export
                </button>
              </div>
            </div>

            {/* Table */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6a7282]">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6a7282]">
                    Specialty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6a7282]">
                    Institution
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6a7282]">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6a7282]">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6a7282]">
                    Date Added
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.name}
                    className="transition-colors hover:bg-[#f9fafb]"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-[#0a0a0a]">
                      {lead.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[#4a5565]">
                      {lead.specialty}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4a5565]">
                      {lead.institutions.join(", ")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${stageBadge(
                          lead.stage
                        )}`}
                      >
                        {lead.stage}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-[#0a0a0a]">
                      {lead.score}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[#6a7282]">
                      {lead.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination footer */}
            <div className="flex items-center justify-between border-t border-[#e5e7eb] px-6 py-3">
              <span className="text-sm text-[#6a7282]">
                Showing 1-{filteredLeads.length} of 48 results
              </span>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 rounded-lg border border-[#d1d5dc] bg-white px-3 py-1.5 text-sm font-medium text-[#6a7282] transition-colors hover:bg-gray-50">
                  <ChevronLeftIcon />
                  Prev
                </button>
                <button className="flex items-center gap-1 rounded-lg border border-[#d1d5dc] bg-white px-3 py-1.5 text-sm font-medium text-[#6a7282] transition-colors hover:bg-gray-50">
                  Next
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
