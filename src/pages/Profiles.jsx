import { useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  SearchIcon20,
  FilterIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WarningIcon,
  SparkleIcon,
  LoaderIcon,
} from "../components/icons";

const tabs = [
  { label: "HCPs", count: 842 },
  { label: "Hospitals", count: 124 },
  { label: "Products", count: 56 },
  { label: "Sales rep", count: 120 },
];

const hcpRows = [
  {
    name: "Dr. Elena Rossi",
    specialty: "Interv. cardiology",
    email: "elena.rossi@stjude.com",
    affiliation: "St. Jude Hospital",
    sap: "Blank",
    status: "New",
  },
  {
    name: "Dr. Michael Chen",
    specialty: null, // searching
    email: "chen.micheal@singaporeabc.com",
    affiliation: null, // searching
    sap: "82792",
    status: "Conflict",
  },
  {
    name: "Dr. Emily Rost",
    specialty: "Cardiac Surgery",
    email: "emily.rost@cn.com",
    affiliation: "Children's National",
    sap: "Blank",
    status: "New",
  },
  {
    name: "Dr. James Wilson",
    specialty: "Cardiology",
    email: "wilson.james@hun.com",
    affiliation: null, // searching
    sap: "92763",
    status: "Conflict",
  },
  {
    name: "Dr. Linda Kim",
    specialty: null, // searching
    email: "kim.linda@uscf.com",
    affiliation: "UCSF Health",
    sap: "92763",
    status: "Conflict",
  },
  {
    name: "Dr. Kelly Cris",
    specialty: "Interv. cardiology",
    email: "cris.kelly@hopkins.com",
    affiliation: null, // searching
    sap: "82763",
    status: "Conflict",
  },
];

const statusStyles = {
  New: "text-[#1447e6]",
  Conflict: "text-[#ff6900]",
};

export default function Profiles() {
  const [activeTab, setActiveTab] = useState("HCPs");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
              <p className="text-sm leading-5 text-[#4a5565]">
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
                  onClick={() => setActiveTab(tab.label)}
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

          {/* Search + Filter + Dropdowns row */}
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[12px] border border-[#d1d5dc] bg-white py-3 pl-10 pr-4 text-base text-[#0a0a0a] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
              />
            </div>

            {/* Filter button */}
            <button className="flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
              <FilterIcon />
              Filter
            </button>

            {/* Score dropdown */}
            <div className="flex w-[215px] flex-col gap-1">
              <label className="text-xs leading-4 text-[#6a7282] tracking-[0.6px]">
                Score
              </label>
              <div className="flex items-center justify-between rounded-[10px] border border-[#d1d5dc] bg-white px-[13px] py-[7px]">
                <span className="text-sm text-[#99a1af]">Select score</span>
                <ChevronDownIcon />
              </div>
            </div>

            {/* Source dropdown */}
            <div className="flex w-[215px] flex-col gap-1">
              <label className="text-xs leading-4 text-[#6a7282] tracking-[0.6px]">
                Source
              </label>
              <div className="flex items-center justify-between rounded-[10px] border border-[#d1d5dc] bg-white px-[13px] py-[7px]">
                <span className="text-sm text-[#4a5565]">Congress</span>
                <ChevronDownIcon />
              </div>
            </div>
          </div>

          {/* Conflicts alert banner */}
          <div className="flex items-center justify-between rounded-[10px] border border-[#ffd6a8] bg-[#fff7ed] px-[17px] py-4">
            <div className="flex items-center gap-3">
              <WarningIcon />
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-[#7e2a0c]">
                  Conflicts detected
                </p>
                <p className="text-sm text-[#9f2d00]">
                  We detected 4 potential duplicated and 2 conflicting
                  attributes for incoming profiles
                </p>
              </div>
            </div>
            <button className="rounded-[10px] bg-[#ff6900] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e55f00]">
              Review conflicts
            </button>
          </div>

          {/* Table */}
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
                  <th className="w-[257px] px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                    Affiliation
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                    SAP
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {hcpRows.map((row) => (
                  <tr
                    key={row.name}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    {/* Checkbox */}
                    <td className="px-6 py-5">
                      <div className="h-4 w-4 border border-[#4a5565]" />
                    </td>

                    {/* HCP Name */}
                    <td className="px-6 py-[19px]">
                      <span className="text-sm font-medium text-[#101828]">
                        {row.name}
                      </span>
                    </td>

                    {/* Specialty */}
                    <td className="px-6 py-5">
                      {row.specialty ? (
                        <span className="text-sm text-[#4a5565]">
                          {row.specialty}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <LoaderIcon />
                          <span className="text-sm text-[#a5adb9]">
                            searching...
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium text-[#6a7282]">
                        {row.email}
                      </span>
                    </td>

                    {/* Affiliation */}
                    <td className="px-6 py-5">
                      {row.affiliation ? (
                        <span className="text-sm text-[#4a5565]">
                          {row.affiliation}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <LoaderIcon />
                          <span className="text-sm text-[#a5adb9]">
                            searching...
                          </span>
                        </div>
                      )}
                    </td>

                    {/* SAP */}
                    <td className="px-6 py-5">
                      <span className="text-sm text-[#4a5565]">{row.sap}</span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">
                      <span
                        className={`text-sm ${statusStyles[row.status]}`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination footer */}
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#4a5565]">
                  Showing 1 to 7 of 842 results
                </span>
                <button className="flex items-center gap-1.5 text-base font-medium text-[#9810fa]">
                  <SparkleIcon />
                  AI enhanced
                </button>
              </div>

              {/* Page numbers */}
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
        </div>
      </main>
    </div>
  );
}
