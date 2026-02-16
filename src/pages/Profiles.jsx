import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  SearchIcon20,
  FilterIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  WarningIcon,
} from "../components/icons";

const tabs = [
  { label: "HCPs", count: 842 },
  { label: "Hospitals", count: 124 },
];

function getPriority(leadScore) {
  if (leadScore >= 80) return "High";
  if (leadScore >= 50) return "Medium";
  return "Low";
}

const hcpRows = [
  {
    id: 1,
    name: "Dr. Elena Rossi",
    specialty: "Interv. cardiology",
    affiliation: "St. Jude Hospital",
    sap: "Blank",
    leadScore: 92,
    engagementScore: 0,
    icpGrading: 92,
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    specialty: "Cardiology",
    affiliation: "Singapore Hospital",
    sap: "82792",
    leadScore: 88,
    engagementScore: 45,
    icpGrading: 43,
  },
  {
    id: 3,
    name: "Dr. Emily Rost",
    specialty: "Cardiac Surgery",
    affiliation: "Children's National",
    sap: "Blank",
    leadScore: 74,
    engagementScore: 30,
    icpGrading: 44,
  },
  {
    id: 4,
    name: "Dr. James Wilson",
    specialty: "Cardiology",
    affiliation: "UCSF Health",
    sap: "92763",
    leadScore: 54,
    engagementScore: 20,
    icpGrading: 34,
  },
  {
    id: 5,
    name: "Dr. Linda Kim",
    specialty: "Cardiac Surgery",
    affiliation: "UCSF Health",
    sap: "92763",
    leadScore: 32,
    engagementScore: 12,
    icpGrading: 20,
  },
  {
    id: 6,
    name: "Dr. Kelly Cris",
    specialty: "Interv. cardiology",
    affiliation: "St. Jude Hospital",
    sap: "82763",
    leadScore: 82,
    engagementScore: 38,
    icpGrading: 44,
  },
];

const priorityStyles = {
  High: "bg-[#dcfce7] text-[#15803d]",
  Medium: "bg-[#ffedd5] text-[#c2410c]",
  Low: "bg-[#fef9c3] text-[#a16207]",
};

// Each hospital lists which HCP ids are affiliated, so we can compute an aggregated score
const hospitalRows = [
  {
    id: 1,
    name: "Mayo Clinic",
    sales: "$34,822",
    marketShare: "12%",
    potential: "6,267,928.00",
    city: "Rochester",
    management: "Privato",
    hcpIds: [1, 6],
  },
  {
    id: 2,
    name: "Charit\u00e9 Berlin",
    sales: "$28,929",
    marketShare: "9%",
    potential: "5,276,276.00",
    city: "Cleveland",
    management: "Public",
    hcpIds: [2, 3],
  },
  {
    id: 3,
    name: "Cleveland clinic",
    sales: "$12,263",
    marketShare: "4%",
    potential: "4,286,186.00",
    city: "Baltimore",
    management: "Public",
    hcpIds: [4, 5],
  },
  {
    id: 4,
    name: "Singapore General",
    sales: "$35,728",
    marketShare: "15%",
    potential: "5,176,298.00",
    city: "Boston",
    management: "Privato",
    hcpIds: [2],
  },
  {
    id: 5,
    name: "Johns Hopkins",
    sales: "$14,028",
    marketShare: "10%",
    potential: "3,367,286.00",
    city: "Berlin",
    management: "Public",
    hcpIds: [3, 4],
  },
  {
    id: 6,
    name: "Necker-Enfants",
    sales: "$34,256",
    marketShare: "12%",
    potential: "1,273,201.00",
    city: "London",
    management: "Public",
    hcpIds: [1],
  },
  {
    id: 7,
    name: "Barcelona",
    sales: "$31,722",
    marketShare: "11%",
    potential: "2,227,028.00",
    city: "Barcelona",
    management: "Privato",
    hcpIds: [5, 6],
  },
];

// Compute hospital score = average lead score of affiliated HCPs
function getHospitalScore(hcpIds) {
  if (!hcpIds || hcpIds.length === 0) return 0;
  const total = hcpIds.reduce((sum, id) => {
    const hcp = hcpRows.find((h) => h.id === id);
    return sum + (hcp ? hcp.leadScore : 0);
  }, 0);
  return Math.round(total / hcpIds.length);
}


export default function Profiles() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "HCPs";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [scoreModal, setScoreModal] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

  // Filter HCP rows by search query and priority
  const filteredRows = hcpRows.filter((row) => {
    // Search filter — match name, SAP, or affiliation
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchesName = row.name.toLowerCase().includes(query);
      const matchesSap = row.sap.toLowerCase().includes(query);
      const matchesAffiliation = row.affiliation.toLowerCase().includes(query);
      if (!matchesName && !matchesSap && !matchesAffiliation) return false;
    }

    // Priority filter
    if (priorityFilter !== "All") {
      if (getPriority(row.leadScore) !== priorityFilter) return false;
    }

    return true;
  });

  // Filter Hospital rows by search query (name or city)
  const filteredHospitalRows = hospitalRows.filter((row) => {
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchesName = row.name.toLowerCase().includes(query);
      const matchesCity = row.city.toLowerCase().includes(query);
      if (!matchesName && !matchesCity) return false;
    }
    return true;
  });

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">
                Profiles
              </h1>
              <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
                Control and confirm your HCP, Hospitals and products profiles.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-[10px] border border-[#d1d5dc] px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
                Export
              </button>
              <button className="rounded-[10px] bg-[#101828] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d2939]">
                Add profile
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-gray-200">
            {tabs.map((tab) => {
              const active = activeTab === tab.label;
              return (
                <button
                  key={tab.label}
                  onClick={() => {
                    setActiveTab(tab.label);
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
                    active
                      ? "border-b-2 border-[#155dfc] text-[#155dfc]"
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

          {/* ── HCPs Tab Content ─────────────────────────────────── */}
          {activeTab === "HCPs" && (
            <>
              {/* Search + Filter + Priority dropdown */}
              <div className="flex items-end gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                    <SearchIcon20 />
                  </span>
                  <input
                    type="text"
                    placeholder="Search profiles by name, SAP, or affiliation"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-[12px] border border-[#d1d5dc] bg-white py-3 pl-10 pr-4 text-base text-[#0a0a0a] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  />
                </div>

                {/* Filter button */}
                <button className="flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
                  <FilterIcon />
                  Filter
                </button>

                {/* Priority dropdown */}
                <div className="relative flex w-[215px] flex-col gap-1">
                  <label className="text-xs leading-4 tracking-[0.6px] text-[#6a7282]">
                    Priority
                  </label>
                  <button
                    onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                    className="flex items-center justify-between rounded-[10px] border border-[#d1d5dc] bg-white px-[13px] py-[7px]"
                  >
                    <span
                      className={`text-sm ${priorityFilter === "All" ? "text-[#99a1af]" : "text-[#4a5565]"}`}
                    >
                      {priorityFilter === "All"
                        ? "Select priority"
                        : priorityFilter}
                    </span>
                    <ChevronDownIcon />
                  </button>
                  {priorityDropdownOpen && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-full overflow-hidden rounded-[10px] border border-[#d1d5dc] bg-white shadow-lg">
                      {["All", "High", "Medium", "Low"].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setPriorityFilter(option);
                            setPriorityDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`flex w-full items-center gap-2 px-[13px] py-[10px] text-left text-sm transition-colors hover:bg-[#f9fafb] ${
                            priorityFilter === option
                              ? "bg-[#f9fafb] font-medium text-[#155dfc]"
                              : "text-[#4a5565]"
                          }`}
                        >
                          {option === "All" ? (
                            "All priorities"
                          ) : (
                            <>
                              <span
                                className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityStyles[option]}`}
                              >
                                {option}
                              </span>
                              {option}
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* HCP Table */}
              <div className="overflow-hidden rounded-[14px] border border-gray-200 bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-[#f9fafb]">
                      <th className="px-6 py-[14px] text-left">
                        <div className="h-4 w-4 border border-[#77808b]" />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        HCP Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Specialty
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Affiliation
                      </th>
                      <th className="w-[149px] px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        SAP
                      </th>
                      <th className="w-[173px] px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Lead Score
                      </th>
                      <th className="w-[128px] px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Priority
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length > 0 ? (
                      filteredRows.map((row) => (
                        <tr
                          key={row.name}
                          className="border-b border-gray-200 last:border-b-0"
                        >
                          <td className="px-6 py-5">
                            <div className="h-4 w-4 border border-[#4a5565]" />
                          </td>
                          <td className="px-6 py-[19px]">
                            <button
                              onClick={() => navigate(`/profiles/hcp/${row.id}`)}
                              className="text-sm font-medium text-[#101828] transition-colors hover:text-[#155dfc] hover:underline"
                            >
                              {row.name}
                            </button>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-[#4a5565]">
                              {row.specialty}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-[#4a5565]">
                              {row.affiliation}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-[#4a5565]">
                              {row.sap}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <button
                              onClick={() => setScoreModal(row)}
                              className="text-sm font-medium text-[#5598f6] underline opacity-90 transition-colors hover:text-[#155dfc]"
                            >
                              {row.leadScore}
                            </button>
                          </td>
                          <td className="px-6 py-[17px]">
                            <div className="flex justify-center">
                              <span
                                className={`rounded px-2.5 py-1 text-xs font-medium ${priorityStyles[getPriority(row.leadScore)]}`}
                              >
                                {getPriority(row.leadScore)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <p className="text-sm text-[#6a7282]">
                            No profiles match your search.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination footer */}
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                  <span className="text-sm text-[#4a5565]">
                    Showing {filteredRows.length} of {hcpRows.length} results
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronLeftIcon />
                    </button>
                    {[1, 2, 3, 4, 5].map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-8 min-w-[30px] items-center justify-center rounded text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-[#155dfc] text-white"
                            : "text-[#364153] hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <span className="px-1 text-base text-[#99a1af]">...</span>
                    <button
                      onClick={() => setCurrentPage(8)}
                      className={`flex h-8 min-w-[30px] items-center justify-center rounded text-sm font-medium transition-colors ${
                        currentPage === 8
                          ? "bg-[#155dfc] text-white"
                          : "text-[#364153] hover:bg-gray-50"
                      }`}
                    >
                      8
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(8, p + 1))}
                      disabled={currentPage === 8}
                      className="flex h-8 w-8 items-center justify-center rounded text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Hospitals Tab Content ────────────────────────────── */}
          {activeTab === "Hospitals" && (
            <>
              {/* Conflict alert banner */}
              <div className="flex items-center justify-between rounded-[12px] border border-[#fed7aa] bg-[#fff7ed] px-4 py-3">
                <div className="flex items-center gap-3">
                  <WarningIcon />
                  <span className="text-sm font-medium text-[#9f2d00]">
                    2 conflicts detected in hospital profiles. Please review and resolve them.
                  </span>
                </div>
                <button
                  onClick={() => navigate("/profiles/conflict")}
                  className="rounded-[10px] bg-[#f54900] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#dc4200]"
                >
                  Review conflicts
                </button>
              </div>

              {/* Search + Filter */}
              <div className="flex items-end gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                    <SearchIcon20 />
                  </span>
                  <input
                    type="text"
                    placeholder="Search hospitals by name or city"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-[12px] border border-[#d1d5dc] bg-white py-3 pl-10 pr-4 text-base text-[#0a0a0a] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  />
                </div>

                {/* Filter button */}
                <button className="flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
                  <FilterIcon />
                  Filter
                </button>
              </div>

              {/* Hospital Table */}
              <div className="overflow-hidden rounded-[14px] border border-gray-200 bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-[#f9fafb]">
                      <th className="px-6 py-[14px] text-left">
                        <div className="h-4 w-4 border border-[#77808b]" />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Hospital Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Sales
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Market Share
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Potential
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        City
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Management
                      </th>
                      <th className="w-[120px] px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHospitalRows.length > 0 ? (
                      filteredHospitalRows.map((row) => (
                        <tr
                          key={row.name}
                          className="border-b border-gray-200 last:border-b-0"
                        >
                          <td className="px-6 py-5">
                            <div className="h-4 w-4 border border-[#4a5565]" />
                          </td>
                          <td className="px-6 py-[19px]">
                            <button
                              onClick={() => navigate(`/profiles/hospital/${row.id}`)}
                              className="text-sm font-medium text-[#101828] transition-colors hover:text-[#155dfc] hover:underline"
                            >
                              {row.name}
                            </button>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-[#4a5565]">
                              {row.sales}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-[#4a5565]">
                              {row.marketShare}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-[#4a5565]">
                              {row.potential}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-[#4a5565]">
                              {row.city}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-[#4a5565]">
                              {row.management}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm font-medium text-[#5598f6] underline opacity-90">
                              {getHospitalScore(row.hcpIds)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <p className="text-sm text-[#6a7282]">
                            No hospitals match your search.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination footer */}
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                  <span className="text-sm text-[#4a5565]">
                    Showing 1 to {filteredHospitalRows.length} of 842 results
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronLeftIcon />
                    </button>
                    {[1, 2, 3, 4, 5].map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-8 min-w-[30px] items-center justify-center rounded text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-[#155dfc] text-white"
                            : "text-[#364153] hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <span className="px-1 text-base text-[#99a1af]">...</span>
                    <button
                      onClick={() => setCurrentPage(8)}
                      className={`flex h-8 min-w-[30px] items-center justify-center rounded text-sm font-medium transition-colors ${
                        currentPage === 8
                          ? "bg-[#155dfc] text-white"
                          : "text-[#364153] hover:bg-gray-50"
                      }`}
                    >
                      8
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(8, p + 1))}
                      disabled={currentPage === 8}
                      className="flex h-8 w-8 items-center justify-center rounded text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Lead Score Modal */}
      {scoreModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setScoreModal(null)}
        >
          <div
            className="w-[680px] overflow-hidden rounded-[24px] border border-[rgba(154,168,188,0.2)] bg-white shadow-[0px_16px_32px_0px_rgba(0,0,0,0.16)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6">
              <h2 className="text-[22px] font-semibold leading-[30px] text-[#1a212b]">
                Lead score
              </h2>
              <button
                onClick={() => setScoreModal(null)}
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex flex-col gap-4 px-6">
              <div className="flex flex-col gap-1">
                <p className="text-base font-medium text-[#0a0a0a]">
                  HCP name
                </p>
                <p className="text-sm text-[#4a5565]">{scoreModal.name}</p>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-2 rounded-[14px] border border-gray-200 bg-white px-[21px] pb-4 pt-[21px]">
                  <p className="text-sm text-[#4a5565]">Engagement score</p>
                  <p className="text-[30px] font-bold leading-9 tracking-[0.4px] text-[#0a0a0a]">
                    {scoreModal.engagementScore}
                  </p>
                  <p className="text-xs font-light leading-4 text-[#525e6f]">
                    Engagement based on recent activity signals
                  </p>
                </div>

                <div className="flex flex-1 flex-col gap-2 rounded-[14px] border border-gray-200 bg-white px-[21px] pb-4 pt-[21px]">
                  <p className="text-sm text-[#4a5565]">ICP grading</p>
                  <p className="text-[30px] font-bold leading-9 tracking-[0.4px] text-[#0a0a0a]">
                    {scoreModal.icpGrading}
                  </p>
                  <p className="text-xs font-light leading-4 text-[#525e6f]">
                    Fit to your ideal customer profile (ICP)
                  </p>
                </div>

                <div className="flex flex-1 flex-col gap-2 rounded-[14px] border border-gray-200 bg-[#e0edff] px-[22px] pb-4 pt-[22px]">
                  <p className="text-sm text-[#4a5565]">Lead score</p>
                  <p className="text-[30px] font-bold leading-9 tracking-[0.4px] text-[#0a0a0a]">
                    {scoreModal.leadScore}
                  </p>
                  <p className="text-xs font-light leading-4 text-[#525e6f]">
                    Engagement score + ICP grading
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end p-6">
              <button
                onClick={() => setScoreModal(null)}
                className="rounded-2xl bg-[#5c17e5] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#4c12c0]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close priority dropdown when clicking outside */}
      {priorityDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setPriorityDropdownOpen(false)}
        />
      )}
    </div>
  );
}
