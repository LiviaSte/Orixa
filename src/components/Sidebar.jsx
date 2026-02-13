import { useLocation, useNavigate } from "react-router-dom";
import {
  DataSourcesIcon,
  ProjectsIcon,
  ProfilesIcon,
  LeadingBoardIcon,
  DictionaryIcon,
  MetricLibraryIcon,
  ThemeToggleIcon,
} from "./icons";

const navItems = [
  { label: "Data sources", icon: DataSourcesIcon, path: "/" },
  { label: "Projects", icon: ProjectsIcon, path: "/projects" },
  { label: "Profiles", icon: ProfilesIcon, path: "/profiles" },
  { label: "Leading board", icon: LeadingBoardIcon, path: null },
  { label: "Dictionary", icon: DictionaryIcon, path: null },
  { label: "Metric library", icon: MetricLibraryIcon, path: null },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (item) => {
    if (item.label === "Data sources") {
      return location.pathname === "/" || location.pathname.startsWith("/upload");
    }
    if (!item.path) return false;
    if (item.path === "/") return location.pathname === "/";
    return location.pathname === item.path || location.pathname.startsWith(item.path + "/");
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col gap-3 p-6">
        {/* User profile */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#155dfc]">
            <span className="text-base font-semibold tracking-tight text-white">AJ</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5 text-[#0a0a0a]">Alex Johnson</p>
            <p className="text-xs leading-4 text-[#6a7282]">Omnichannel manager</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.label}
                onClick={() => item.path && navigate(item.path)}
                className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium tracking-tight transition-colors ${
                  active
                    ? "bg-[#eff6ff] text-[#155dfc]"
                    : "text-[#4a5565] hover:bg-gray-50"
                }`}
              >
                <span className={active ? "text-[#155dfc]" : "text-[#4a5565]"}>
                  <item.icon />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div className="border-t border-gray-200 pl-4 pt-4">
          <button className="flex items-center gap-3 text-sm font-medium text-[#4a5565]">
            <ThemeToggleIcon />
            Theme Toggle
          </button>
        </div>
      </div>
    </aside>
  );
}
