import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useMappingContext } from "../MappingContext";
import {
  SalesDataIcon,
  ContactsIcon,
  CongressBuildingIcon,
  UploadDbIcon,
  FileIcon,
  SearchIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SettingsIcon,
  SalesCloudIcon,
  MarketoIcon,
  GoogleAnalyticsIcon,
} from "../components/icons";

const domainCardsConfig = [
  {
    key: "sales",
    title: "Sales data",
    description: "Revenue, unit volume and market share datasets",
    icon: SalesDataIcon,
    iconBg: "bg-[#eff6ff]",
    iconColor: "text-[#155dfc]",
    uploadPath: null,
    mappingDomain: null,
  },
  {
    key: "contacts",
    title: "Contacts/Doctors",
    description: "HCP (Healthcare Professional) registry lists",
    icon: ContactsIcon,
    iconBg: "bg-[#eff6ff]",
    iconColor: "text-[#155dfc]",
    uploadPath: null,
    mappingDomain: null,
  },
  {
    key: "congress",
    title: "Congress",
    description: "Congress information",
    icon: CongressBuildingIcon,
    iconBg: "bg-[#f0fdfa]",
    iconColor: "text-[#14b8a6]",
    uploadPath: "/upload/congress",
    mappingPath: "/upload/congress/mapping",
    mappingDomain: "congress",
  },
];

const connectors = [
  {
    title: "Sales Cloud",
    description:
      "Cloud-based CRM for pharmaceutical sales teams and healthcare providers tracking.",
    icon: SalesCloudIcon,
    iconBg: "bg-[#dbeafe]",
    category: "CRM",
    categoryColor: "text-[#155dfc]",
    connected: true,
  },
  {
    title: "Marketo",
    description:
      "Marketing automation for coordinating outreach and HCP engagement programs.",
    icon: MarketoIcon,
    iconBg: "bg-[#f3e8ff]",
    category: "MARKETING",
    categoryColor: "text-[#9810fa]",
    connected: false,
  },
  {
    title: "Google Analytics",
    description:
      "Analyze patient-facing portal traffic and educational material performance.",
    icon: GoogleAnalyticsIcon,
    iconBg: "bg-[#ffedd4]",
    category: "ANALYTICS",
    categoryColor: "text-[#f54900]",
    connected: false,
  },
];

const projectRows = [
  {
    fileName: "Webinar_Records_A1",
    format: "XLSX",
    project: "Aliax awareness",
    uploadDate: "22/01/2026",
    status: "MAPPED",
  },
  {
    fileName: "Marketing_Omnichannel_Q4",
    format: "XLSX",
    project: "EU Expansion",
    uploadDate: "19/01/2026",
    status: "MAPPED",
  },
];

export default function DataSources() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getMapping } = useMappingContext();
  const initialTab = searchParams.get("tab") || "connectors";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [connectorSearch, setConnectorSearch] = useState("");

  const filteredRows = projectRows.filter(
    (row) =>
      row.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.project.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredConnectors = connectors.filter(
    (c) =>
      c.title.toLowerCase().includes(connectorSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(connectorSearch.toLowerCase()),
  );

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">
          {/* Page header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">Data sources</h1>
            <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
              Centralize your pharma enterprise data. Securely integrate CRM, clinical analytics, and
              marketing platforms through our pre-build API connectors.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("connectors")}
              className={`pb-3 text-base font-medium transition-colors ${
                activeTab === "connectors"
                  ? "border-b-2 border-[#155dfc] text-[#155dfc]"
                  : "text-[#4a5565] hover:text-[#0a0a0a]"
              }`}
            >
              Connectors
            </button>
            <button
              onClick={() => setActiveTab("databases")}
              className={`pb-3 text-base font-medium transition-colors ${
                activeTab === "databases"
                  ? "border-b-2 border-[#155dfc] text-[#155dfc]"
                  : "text-[#4a5565] hover:text-[#0a0a0a]"
              }`}
            >
              Databases
            </button>
          </div>

          {activeTab === "databases" ? (
            <div className="flex flex-col gap-6">
              {/* Databases header + upload button */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-medium leading-[30px] text-[#0a0a0a]">Databases</h2>
                  <p className="text-sm text-[#4a5565]">
                    Manually upload the files you need to perform analysis.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/upload/congress")}
                  className="flex items-center gap-2 rounded-[10px] bg-[#155dfc] px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-[#1247cc]"
                >
                  <UploadDbIcon />
                  Upload database
                </button>
              </div>

              {/* Recommended data domains */}
              <div className="flex flex-col gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#99a1af]">
                  Recommended data domains
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {domainCardsConfig.map((card) => {
                    const saved = card.mappingDomain ? getMapping(card.mappingDomain) : null;
                    const isMapped = !!saved;
                    const clickPath = isMapped ? card.mappingPath : card.uploadPath;

                    return (
                      <div
                        key={card.key}
                        onClick={() => clickPath && navigate(clickPath)}
                        className={`flex flex-col gap-4 rounded-[14px] border bg-white px-6 pb-4 pt-6 ${
                          clickPath
                            ? "cursor-pointer transition-all hover:border-[#155dfc] hover:shadow-sm"
                            : ""
                        } ${isMapped ? "border-[#00c950]/30" : "border-gray-200"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${card.iconBg}`}
                          >
                            <span className={card.iconColor}>
                              <card.icon />
                            </span>
                          </div>
                          {isMapped ? (
                            <span className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium uppercase tracking-[0.3px] text-[#008236] bg-[#f0fdf4]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#00c950]" />
                              Mapped
                            </span>
                          ) : (
                            <span className="rounded px-2.5 py-1 text-xs font-medium uppercase tracking-[0.3px] text-[#6a7282] bg-[#f3f4f6]">
                              Not uploaded
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-medium text-[#0a0a0a]">{card.title}</h3>
                        <p className="text-sm text-[#6a7282]">{card.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Projects database */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-medium leading-[30px] text-[#0a0a0a]">
                    Projects database
                  </h2>
                  <div className="flex items-center gap-3">
                    {/* Search input */}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                        <SearchIcon />
                      </span>
                      <input
                        type="text"
                        placeholder="Search by file name or project..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-[320px] rounded-[10px] border border-[#d1d5dc] bg-white py-2 pl-10 pr-4 text-sm text-[#0a0a0a] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                      />
                    </div>
                    {/* Filter button */}
                    <button className="flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
                      <FilterIcon />
                      Filter
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-[14px] border border-gray-200 bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-[#f9fafb]">
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                          File name
                        </th>
                        <th className="w-[99px] px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                          Format
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                          Upload date
                        </th>
                        <th className="w-[131px] px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr
                          key={row.fileName}
                          className="border-b border-gray-200 last:border-b-0"
                        >
                          <td className="px-6 py-[19px]">
                            <div className="flex items-center gap-3">
                              <FileIcon />
                              <span className="text-sm font-medium text-[#101828]">
                                {row.fileName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-[17px]">
                            <span className="rounded px-2.5 py-0.5 text-xs font-medium uppercase text-[#008236] bg-[#f0fdf4]">
                              {row.format}
                            </span>
                          </td>
                          <td className="px-6 py-[19px] text-sm text-[#4a5565]">{row.project}</td>
                          <td className="px-6 py-[19px] text-sm text-[#4a5565]">
                            {row.uploadDate}
                          </td>
                          <td className="px-6 py-[17px]">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f0fdf4] px-2.5 py-0.5 text-xs font-medium text-[#008236]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#00c950]" />
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination footer */}
                  <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                    <p className="text-xs font-normal uppercase tracking-[0.3px] text-[#6a7282]">
                      Showing 1 to 3 of 12 files
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        disabled
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#d1d5dc] bg-white text-[#6a7282] opacity-50"
                      >
                        <ChevronLeftIcon />
                      </button>
                      <button className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#d1d5dc] bg-white text-[#6a7282] transition-colors hover:bg-gray-50">
                        <ChevronRightIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Connectors header + create button */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-medium leading-[30px] text-[#0a0a0a]">Connectors</h2>
                  <p className="text-sm text-[#4a5565]">
                    Create connectors for your main platforms.
                  </p>
                </div>
                <button className="flex items-center gap-2 rounded-[10px] bg-[#155dfc] px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-[#1247cc]">
                  <PlusIcon />
                  Create connector
                </button>
              </div>

              {/* Search + filter */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    placeholder="Search connectors (eg. Salesforce, Veeva)"
                    value={connectorSearch}
                    onChange={(e) => setConnectorSearch(e.target.value)}
                    className="w-full rounded-[12px] border border-[#d1d5dc] bg-white py-3 pl-10 pr-4 text-base text-[#0a0a0a] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  />
                </div>
                <button className="flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
                  <FilterIcon />
                  Filter
                </button>
              </div>

              {/* Connector cards */}
              <div className="grid grid-cols-3 gap-6">
                {filteredConnectors.map((connector) => (
                  <div
                    key={connector.title}
                    className="flex flex-col gap-4 rounded-[14px] border border-gray-200 bg-white p-[25px]"
                  >
                    {/* Icon + status badge */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-[10px] ${connector.iconBg}`}
                      >
                        <connector.icon />
                      </div>
                      {connector.connected ? (
                        <span className="rounded-lg bg-[#f0fdf4] px-3 py-1 text-xs font-medium text-[#008236]">
                          CONNECTED
                        </span>
                      ) : (
                        <span className="rounded-lg bg-[#f3f4f6] px-3 py-1 text-xs font-medium text-[#4a5565]">
                          NOT CONNECTED
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-medium text-[#0a0a0a]">{connector.title}</h3>

                    {/* Description */}
                    <p className="text-sm leading-[22.75px] text-[#4a5565]">
                      {connector.description}
                    </p>

                    {/* Footer: category + action */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium uppercase tracking-[0.3px] ${connector.categoryColor}`}
                      >
                        {connector.category}
                      </span>
                      {connector.connected ? (
                        <button className="flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors hover:bg-gray-100">
                          <SettingsIcon />
                        </button>
                      ) : (
                        <button className="rounded-[10px] bg-[#101828] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1d2939]">
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
