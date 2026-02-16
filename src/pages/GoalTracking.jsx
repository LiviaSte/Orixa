import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useOpportunityContext } from "../OpportunityContext";
import {
  SearchIcon20,
  FilterIcon,
  TrendUpIcon,
  CheckCircleOutlineIcon,
} from "../components/icons";

const goals = [
  {
    id: 1,
    title: "Opportunity Creation",
    description: "Track the creation of opportunities inside your funnel",
    icon: TrendUpIcon,
    path: "/goal-tracking/opportunity-creation",
  },
  {
    id: 2,
    title: "Deal Closed/Not Closed",
    description: "Track deal outcomes from opportunities to closed deals.",
    icon: CheckCircleOutlineIcon,
    path: null,
  },
];

export default function GoalTracking() {
  const navigate = useNavigate();
  const { getOpportunity } = useOpportunityContext();
  const isOpportunitySaved = !!getOpportunity();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGoals = goals.filter((goal) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      goal.title.toLowerCase().includes(q) ||
      goal.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">
              Goal tracking
            </h1>
            <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
              Define your goals to track success metrics in your projects
            </p>
          </div>

          {/* Search + Filter */}
          <div className="flex items-end gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                <SearchIcon20 />
              </span>
              <input
                type="text"
                placeholder="Search for goal"
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

          {/* Goal cards */}
          <div className="grid grid-cols-2 gap-6">
            {filteredGoals.map((goal) => {
              const isConfigured = goal.id === 1 && isOpportunitySaved;
              return (
                <button
                  key={goal.id}
                  onClick={() => goal.path && navigate(goal.path)}
                  className={`flex flex-col items-start gap-3 rounded-[10px] border-2 bg-white p-[26px] text-left transition-colors hover:border-[#155dfc] hover:shadow-sm ${
                    isConfigured
                      ? "border-[#00c950]/30"
                      : "border-[#e5e7eb]"
                  }`}
                >
                  {/* Icon + badge row */}
                  <div className="flex w-full items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#f3f4f6]">
                      <goal.icon />
                    </div>
                    {isConfigured && (
                      <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-medium text-[#16a34a]">
                        Configured
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-medium leading-6 text-[#0a0a0a]">
                    {goal.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm font-medium leading-[22.75px] text-[#6a7282]">
                    {goal.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
