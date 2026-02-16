import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  SearchIcon20,
  FilterIcon,
  HospitalAvatarIcon,
  PhoneIcon,
  EmailSmallIcon,
} from "../components/icons";

// HCP data (same source as Profiles so scores stay consistent)
const allHcps = [
  { id: 1, name: "Dr. Sarah Jenkins", sapId: "28902", affiliation: "Primary", score: 92, status: "Top 5%", prescribingPct: 90 },
  { id: 2, name: "Dr. Michael Chen", sapId: "82902", affiliation: "Primary", score: 93, status: "Rising", prescribingPct: 85 },
  { id: 3, name: "Dr. Emily Rost", sapId: "02983", affiliation: "Secondary", score: 65, status: "Stable", prescribingPct: 55 },
  { id: 4, name: "Dr. James Wilson", sapId: "02983", affiliation: "Primary", score: 54, status: "Declining", prescribingPct: 30 },
  { id: 5, name: "Dr. Linda Kim", sapId: "02983", affiliation: "Secondary", score: 32, status: "Inactive", prescribingPct: 15 },
  { id: 6, name: "Dr. Kelly Cris", sapId: "91283", affiliation: "Secondary", score: 65, status: "Stable", prescribingPct: 50 },
  { id: 7, name: "Dr. Paul Smith", sapId: "28773", affiliation: "Secondary", score: 65, status: "Stable", prescribingPct: 25 },
  { id: 8, name: "Dr. Emily Rost", sapId: "12828", affiliation: "Secondary", score: 65, status: "Stable", prescribingPct: 55 },
  { id: 9, name: "Dr. James Wilson", sapId: "92882", affiliation: "Primary", score: 54, status: "Declining", prescribingPct: 30 },
  { id: 10, name: "Dr. Linda Kim", sapId: "29182", affiliation: "Secondary", score: 32, status: "Inactive", prescribingPct: 15 },
];

const statusStyles = {
  "Top 5%": "text-[#00a63e]",
  Rising: "text-[#00a63e]",
  Stable: "text-[#6a7282]",
  Declining: "text-[#e7000b]",
  Inactive: "text-[#6a7282]",
};

function getVolLabel(pct) {
  if (pct >= 70) return "High";
  if (pct >= 40) return "Mid";
  return "Low";
}

const tabs = [
  { label: "Affiliated HCPs", count: 142 },
  { label: "Engagement History", count: 24 },
];

export default function HospitalDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Affiliated HCPs");
  const [searchQuery, setSearchQuery] = useState("");

  // Compute aggregate leading score
  const aggregateScore = Math.round(
    allHcps.reduce((sum, h) => sum + h.score, 0) / allHcps.length,
  );

  // Filter HCPs by search
  const filteredHcps = allHcps.filter((hcp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      hcp.name.toLowerCase().includes(q) ||
      hcp.sapId.includes(q)
    );
  });

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/profiles"
              className="text-[#6a7282] transition-colors hover:text-[#155dfc]"
            >
              Profiles
            </Link>
            <span className="text-[#6a7282]">&rsaquo;</span>
            <Link
              to="/profiles?tab=Hospitals"
              className="text-[#101828] transition-colors hover:text-[#155dfc]"
            >
              Hospitals
            </Link>
            <span className="text-[#6a7282]">&rsaquo;</span>
            <span className="text-[#101828]">Saint Jude Medical Center</span>
          </nav>

          {/* Header: Hospital info + Aggregate score */}
          <div className="flex items-end justify-between">
            {/* Left: hospital info */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-[#93c5fd]">
                <HospitalAvatarIcon />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-medium leading-8 text-[#0a0a0a]">
                    Saint Jude Medical Center
                  </h1>
                  <span className="rounded-full bg-[#d1fae5] px-3 py-1 text-xs font-medium text-[#065f46]">
                    Active account
                  </span>
                </div>
                <p className="text-sm text-[#6a7282]">
                  ID: HOSP-9821 &bull; Academic Medical Center &bull; New York, NY
                </p>
              </div>
            </div>

            {/* Right: Aggregate leading score card */}
            <div className="rounded-[10px] border border-[#e5e7eb] bg-white px-6 py-2">
              <div className="flex items-center justify-between gap-10">
                <span className="text-xs text-[#6a7282]">
                  Aggregate leading score
                </span>
                <button className="text-xs text-[#155dfc] underline">
                  Logic
                </button>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-[30px] font-semibold leading-9 text-[#0a0a0a]">
                  {aggregateScore}
                </span>
                <span className="text-sm font-medium text-[#00a63e]">
                  +124%
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b border-[#e5e7eb]">
            <div className="flex gap-6">
              {tabs.map((tab) => {
                const active = activeTab === tab.label;
                return (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(tab.label)}
                    className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
                      active
                        ? "border-b-2 border-[#155dfc] text-[#4a5565]"
                        : "text-[#4a5565] hover:text-[#0a0a0a]"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        active
                          ? "bg-[#dbeafe] text-[#155dfc]"
                          : "bg-[#f3f4f6] text-[#4a5565]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Three metric cards */}
          <div className="grid grid-cols-3 gap-6">
            {/* Annual Revenue */}
            <div className="rounded-[10px] border border-[#e5e7eb] bg-white px-6 pt-6 pb-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#155dfc]" />
                <span className="text-sm font-medium uppercase tracking-[0.2px] text-[#4a5565]">
                  Annual Revenue
                </span>
              </div>
              <p className="text-[30px] font-semibold leading-9 text-[#0a0a0a]">
                $3.2 B
              </p>
              <p className="mt-2 text-sm text-[#6a7282]">FY 2025 Reported</p>
            </div>

            {/* Total Bed Count */}
            <div className="rounded-[10px] border border-[#e5e7eb] bg-white px-6 pt-6 pb-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#155dfc]" />
                <span className="text-sm font-medium uppercase tracking-[0.2px] text-[#4a5565]">
                  Total Bed Count
                </span>
              </div>
              <p className="text-[30px] font-semibold leading-9 text-[#0a0a0a]">
                840
              </p>
              <p className="mt-2 text-sm text-[#6a7282]">Licensed capacity</p>
            </div>

            {/* Therapeutic Areas */}
            <div className="rounded-[10px] border border-[#e5e7eb] bg-white px-6 pt-6 pb-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#155dfc]" />
                <span className="text-sm font-medium uppercase tracking-[0.2px] text-[#4a5565]">
                  Therapeutic Areas
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg bg-[#f3e8ff] px-3 py-1.5 text-sm font-medium text-[#6b21a8]">
                  Oncology
                </span>
                <span className="rounded-lg bg-[#dbeafe] px-3 py-1.5 text-sm font-medium text-[#1e40af]">
                  Cardiology
                </span>
                <span className="rounded-lg bg-[#d1fae5] px-3 py-1.5 text-sm font-medium text-[#065f46]">
                  Neurology
                </span>
              </div>
            </div>
          </div>

          {/* Bottom grid: Affiliated HCPs + right sidebar */}
          <div className="grid grid-cols-[1fr_320px] gap-6">
            {/* ═══ Affiliated HCPs table ═══ */}
            <div className="rounded-[10px] border border-[#e5e7eb] bg-white">
              {/* Section header */}
              <div className="border-b border-[#e5e7eb] px-6 pt-6 pb-4">
                <h2 className="text-lg font-medium text-[#0a0a0a]">
                  Affiliated HCPs
                </h2>
              </div>

              {/* Search + Filter */}
              <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-6 py-4">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                    <SearchIcon20 />
                  </span>
                  <input
                    type="text"
                    placeholder="Search HCPs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-[10px] border border-[#e5e7eb] py-2 pl-10 pr-4 text-sm text-[#0a0a0a] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  />
                </div>
                <button className="flex items-center gap-2 rounded-[10px] border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#4a5565] transition-colors hover:bg-gray-50">
                  <FilterIcon />
                  Filter
                </button>
              </div>

              {/* Table */}
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        HCP Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        SAP ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Affiliation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Prescribing Vol.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHcps.map((hcp) => {
                      const volLabel = getVolLabel(hcp.prescribingPct);
                      return (
                        <tr
                          key={hcp.id}
                          className="border-b border-[#e5e7eb] last:border-b-0"
                        >
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-[#0a0a0a]">
                              {hcp.name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-[#6a7282]">
                              {hcp.sapId}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                hcp.affiliation === "Primary"
                                  ? "bg-[#d1fae5] text-[#065f46]"
                                  : "bg-[#dbeafe] text-[#1e40af]"
                              }`}
                            >
                              {hcp.affiliation}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#0a0a0a]">
                                {hcp.score}
                              </span>
                              <span
                                className={`text-xs ${statusStyles[hcp.status]}`}
                              >
                                {(hcp.status === "Top 5%" || hcp.status === "Rising") && "\u2197"}
                                {hcp.status === "Declining" && "\u2198"}
                                {hcp.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {/* Progress bar */}
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-[#e5e7eb]">
                                <div
                                  className="h-full rounded-full bg-[#155dfc]"
                                  style={{ width: `${hcp.prescribingPct}%` }}
                                />
                              </div>
                              <span className="w-8 text-xs text-[#6a7282]">
                                {volLabel}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="border-t border-[#e5e7eb] py-5 text-center">
                <button className="text-sm font-medium text-[#155dfc] transition-colors hover:text-[#1247cc]">
                  Show all 142 affiliated HCPs
                </button>
              </div>
            </div>

            {/* ═══ Right sidebar: Potential Products + Primary Admin ═══ */}
            <div className="flex flex-col gap-6">
              {/* Potential Products */}
              <div className="rounded-[10px] border border-[#e5e7eb] bg-white">
                <div className="border-b border-[#e5e7eb] px-6 pt-6 pb-4">
                  <h2 className="text-lg font-medium text-[#0a0a0a]">
                    Potential products
                  </h2>
                </div>

                <div className="flex flex-col px-6 pt-5 pb-6">
                  {/* CardioFix */}
                  <div className="border-b border-[#e5e7eb] pb-4">
                    <p className="text-sm font-medium text-[#0a0a0a]">
                      CardioFix
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#6a7282]">
                      Using similar product for 2 years
                    </p>
                  </div>

                  {/* Lipbop */}
                  <div className="border-b border-[#e5e7eb] py-4">
                    <p className="text-sm font-medium text-[#0a0a0a]">
                      Lipbop
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#6a7282]">
                      6 HCPs affiliated with this hospital participated in the
                      webinar about this product
                    </p>
                  </div>

                  {/* Valve spo */}
                  <div className="pt-4">
                    <p className="text-sm font-medium text-[#0a0a0a]">
                      Valve spo
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#6a7282]">
                      12 HCPs affiliated with this hospital opened and email
                      promoting this product
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary Admin Contact */}
              <div className="rounded-[10px] border border-[#e5e7eb] bg-[#fefcfb]">
                <div className="border-b border-[#e5e7eb] px-6 pt-6 pb-4">
                  <h2 className="text-lg font-medium text-[#0a0a0a]">
                    Primary Admin contact
                  </h2>
                </div>

                <div className="flex items-start gap-4 px-6 py-6">
                  {/* Avatar placeholder */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e5e7eb]">
                    <span className="text-sm font-semibold text-[#4a5565]">
                      JW
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-base font-medium text-[#0a0a0a]">
                        Jennifer Wu
                      </p>
                      <p className="text-sm text-[#6a7282]">
                        Director of Pharmacy
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#e5e7eb] transition-colors hover:bg-gray-50">
                        <EmailSmallIcon />
                      </button>
                      <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#e5e7eb] transition-colors hover:bg-gray-50">
                        <PhoneIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
