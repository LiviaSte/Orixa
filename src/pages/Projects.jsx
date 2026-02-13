import { useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  HcpIcon,
  ConversionIcon,
  CalendarIcon,
} from "../components/icons";

const projects = [
  {
    title: "Q1 Cardiology Lead Generation",
    description: "Tier uplift (Lead → MQL)",
    status: "Active",
    hcps: "842",
    conversion: "34%",
    target: "40%",
    startDate: "Started Jan 15, 2026",
    channels: ["Email", "Webinar", "In-person"],
  },
  {
    title: "Oncology Awareness Campaign",
    description: "Brand awareness",
    status: "Active",
    hcps: "1,240",
    conversion: "28%",
    target: "35%",
    startDate: "Started Dec 1, 2025",
    channels: ["Email", "Social", "Events"],
  },
  {
    title: "Neurology Product Launch",
    description: "Product adoption",
    status: "Completed",
    hcps: "620",
    conversion: "45%",
    target: "40%",
    startDate: "Started Oct 10, 2025",
    channels: ["Email", "Webinar"],
  },
  {
    title: "Diabetes Education Series",
    description: "Tier uplift (Lead → MQL)",
    status: "Draft",
    hcps: "0",
    conversion: "0%",
    target: "30%",
    startDate: "Started Mar 1, 2026",
    channels: ["Email", "Webinar"],
  },
];

const statusStyles = {
  Active: "bg-[#dcfce7] text-[#008236]",
  Completed: "bg-[#dbeafe] text-[#1447e6]",
  Draft: "bg-[#f3f4f6] text-[#364153]",
};

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">Projects</h1>
              <p className="text-base leading-6 text-[#4a5565]">
                Manage and track your projects and HCP engagement initiatives.
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-[10px] bg-[#155dfc] px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-[#1247cc]">
              <PlusIcon />
              Create new project
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
                placeholder="Search project name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[12px] border border-[#d1d5dc] bg-white py-3 pl-10 pr-4 text-base text-[#0a0a0a] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
              />
            </div>
            <button className="flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
              <FilterIcon />
              Filter
            </button>
          </div>

          {/* Project cards grid */}
          <div className="grid grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.title}
                className="flex flex-col gap-4 rounded-[14px] border border-gray-200 bg-white px-[25px] pb-[25px] pt-[25px]"
              >
                {/* Title + status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-col gap-2">
                    <h3 className="text-lg font-medium text-[#0a0a0a]">{project.title}</h3>
                    <p className="text-sm text-[#4a5565]">{project.description}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[project.status]}`}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 border-b border-gray-200 pb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <HcpIcon />
                      <span className="text-xs text-[#6a7282]">HCPs</span>
                    </div>
                    <p className="text-base font-semibold text-[#0a0a0a]">{project.hcps}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <ConversionIcon />
                      <span className="text-xs text-[#6a7282]">Conversion</span>
                    </div>
                    <p className="text-base font-semibold text-[#0a0a0a]">{project.conversion}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-[#6a7282]">Target</span>
                    <p className="text-base font-semibold text-[#0a0a0a]">{project.target}</p>
                  </div>
                </div>

                {/* Footer: date + channels */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon />
                    <span className="text-sm text-[#4a5565]">{project.startDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {project.channels.map((channel) => (
                      <span
                        key={channel}
                        className="rounded bg-[#eff6ff] px-2 py-0.5 text-xs text-[#1447e6]"
                      >
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
