import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  HcpIcon,
  ConversionIcon,
  CalendarIcon,
  SalesCloudIcon,
  MarketoIcon,
  GoogleAnalyticsIcon,
  ChevronDownIcon,
  TrashIcon,
} from "../components/icons";

// ── Funnel stages ─────────────────────────────────────────────────
const FUNNEL_STAGES = [
  { id: "lead",        label: "Lead" },
  { id: "mql",         label: "MQL" },
  { id: "sql",         label: "SQL" },
  { id: "opportunity", label: "Opportunity" },
  { id: "conversion",  label: "Conversion" },
];

const REGIONS = [
  "Global", "EMEA", "North America", "APAC", "LATAM",
  "Germany", "France", "United Kingdom", "Italy", "Spain", "United States",
];

const PRODUCTS = [
  "Cardio Drug X",
  "GLP-1 Therapy",
  "Oncology Agent Z",
  "Neurology Compound A",
  "Diabetes Solution B",
  "Hematology Drug C",
];

// ── Mock data mirroring Campaigns ────────────────────────────────
const CAMPAIGN_GROUPS = [
  { id: 1,  name: "ESMO 2025 Congress Engagement",  signalCount: 4, keywords: ["ESMO", "esmo_2025", "oncol"] },
  { id: 6,  name: "GLP-1 New Drug Launch",           signalCount: 4, keywords: ["GLP-1", "GLP1", "glp1"] },
  { id: 15, name: "Cardiology HCP Education",        signalCount: 4, keywords: ["Cardio", "cardio_hcp"] },
  { id: 22, name: "Diabetes Q1 Awareness",           signalCount: 4, keywords: ["Diabetes", "diabetes"] },
  { id: 25, name: "Oncology KOL Activation",         signalCount: 3, keywords: ["KOL", "kol"] },
];

const SOURCE_ICON = { salesforce: SalesCloudIcon, marketo: MarketoIcon, ga: GoogleAnalyticsIcon };
const SOURCE_NAME = { salesforce: "Salesforce Sales Cloud", marketo: "Marketo", ga: "Google Analytics" };

const CAMPAIGNS = [
  { id: 101, name: "ESMO 2025 Attendance",          source: "salesforce", type: "Campaign Name" },
  { id: 102, name: "esmo_2025_oncol",               source: "ga",         type: "UTM Campaign"  },
  { id: 103, name: "ESMO Follow-up Email",          source: "marketo",    type: "Campaign Name" },
  { id: 201, name: "GLP-1 Launch — Digital",        source: "salesforce", type: "Campaign Name" },
  { id: 202, name: "glp1_launch_search",            source: "ga",         type: "UTM Campaign"  },
  { id: 203, name: "GLP1-Launch-Multitouch",        source: "marketo",    type: "Program Name"  },
  { id: 301, name: "Cardio HCP Outreach Q1",        source: "salesforce", type: "Campaign Name" },
  { id: 303, name: "Cardiology Webinar Invite",     source: "marketo",    type: "Campaign Name" },
  { id: 401, name: "Diabetes Awareness Drive",      source: "salesforce", type: "Campaign Name" },
  { id: 501, name: "Oncology KOL Advisory",         source: "salesforce", type: "Campaign Name" },
  { id: 601, name: "MSL Field Visit — Hematology",  source: "salesforce", type: "Campaign Name" },
  { id: 604, name: "Hematology-KOL-Invite",         source: "marketo",    type: "Program Name"  },
];

const OTHER_CHANNELS = [
  { id: "ch1", name: "ESMO 2025 Annual Meeting",      type: "Congress",    source: "Excel upload" },
  { id: "ch2", name: "ASH 2025 Congress",             type: "Congress",    source: "Excel upload" },
  { id: "ch3", name: "ADA 2026 Scientific Sessions",  type: "Congress",    source: "Excel upload" },
  { id: "ch4", name: "ACC 2026 Annual Meeting",       type: "Congress",    source: "Excel upload" },
  { id: "ch5", name: "LinkedIn Sponsored Content",    type: "Paid Social", source: "LinkedIn Ads" },
  { id: "ch6", name: "Medscape Display Ads",          type: "Display",     source: "Manual"       },
];

// ── Existing projects ─────────────────────────────────────────────
const INITIAL_PROJECTS = [
  {
    id: 1,
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
    id: 2,
    title: "Oncology Awareness Campaign",
    description: "Brand awareness",
    status: "Paused",
    hcps: "1,240",
    conversion: "28%",
    target: "35%",
    startDate: "Started Dec 1, 2025",
    channels: ["Email", "Social", "Events"],
  },
  {
    id: 3,
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
    id: 4,
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
  Active:    "bg-[#dcfce7] text-[#008236]",
  Completed: "bg-[#dbeafe] text-[#1447e6]",
  Draft:     "bg-[#f3f4f6] text-[#364153]",
  Paused:    "bg-[#fff7ed] text-[#9a3412]",
};

const STEPS = [
  { id: 1, label: "Define project" },
  { id: 2, label: "Set goal" },
  { id: 3, label: "Channels & campaigns" },
];

// ── Checkbox helper ───────────────────────────────────────────────
function Checkbox({ checked }) {
  return (
    <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
      checked ? "border-[#155dfc] bg-[#155dfc]" : "border-gray-300 bg-white"
    }`}>
      {checked && (
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
}

// ── Step 1: Project info ──────────────────────────────────────────
function Step1({ name, setName, description, setDescription, product, setProduct, region, setRegion }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0a0a0a]">Define your project</h2>
        <p className="mt-1 text-sm text-[#6a7282]">Give your project a name and describe its purpose.</p>
      </div>

      {/* Name */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
          Project name <span className="text-[#ef4444]">*</span>
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Q1 Cardiology Lead Generation"
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#0a0a0a] outline-none placeholder:text-[#9ca3af] focus:border-[#155dfc]"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the purpose and objectives of this project…"
          rows={3}
          className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#0a0a0a] outline-none placeholder:text-[#9ca3af] focus:border-[#155dfc]"
        />
      </div>

      {/* Product + Region */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
            Specific product{" "}
            <span className="font-normal normal-case text-[#d1d5db]">(optional)</span>
          </label>
          <div className="relative">
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#0a0a0a] outline-none focus:border-[#155dfc]"
            >
              <option value="">Select product…</option>
              {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
              <ChevronDownIcon />
            </span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
            Geographic region{" "}
            <span className="font-normal normal-case text-[#d1d5db]">(optional)</span>
          </label>
          <div className="relative">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#0a0a0a] outline-none focus:border-[#155dfc]"
            >
              <option value="">Select region…</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
              <ChevronDownIcon />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Goal ──────────────────────────────────────────────────
function Step2({ fromStage, toStage, onStageClick, targetConversion, setTargetConversion }) {
  const stageIdx = (id) => FUNNEL_STAGES.findIndex((s) => s.id === id);

  const isInRange = (id) => {
    if (!fromStage) return false;
    if (!toStage) return id === fromStage;
    const fi = stageIdx(fromStage);
    const ti = stageIdx(toStage);
    const ci = stageIdx(id);
    return ci >= Math.min(fi, ti) && ci <= Math.max(fi, ti);
  };

  const isConnectorActive = (i) => {
    if (!fromStage || !toStage) return false;
    const fi = stageIdx(fromStage);
    const ti = stageIdx(toStage);
    return i >= Math.min(fi, ti) && i < Math.max(fi, ti);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0a0a0a]">Set a conversion goal</h2>
        <p className="mt-1 text-sm text-[#6a7282]">
          Select the funnel stages you want to observe. Click a starting stage, then an ending stage.
        </p>
      </div>

      {/* Funnel pipeline */}
      <div className="rounded-2xl border border-gray-100 bg-white px-8 py-8 shadow-sm">
        <div className="flex items-center">
          {FUNNEL_STAGES.map((stage, i) => {
            const inRange  = isInRange(stage.id);
            const isFrom   = stage.id === fromStage;
            const isTo     = stage.id === toStage;
            const isAnchor = isFrom || isTo;
            return (
              <div key={stage.id} className="flex flex-1 items-center">
                <button
                  onClick={() => onStageClick(stage.id)}
                  className="flex flex-1 flex-col items-center gap-2 rounded-xl py-3 transition-all hover:bg-gray-50 focus:outline-none"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    isAnchor ? "bg-[#155dfc] text-white shadow-md shadow-blue-200"
                    : inRange ? "bg-[#bfdbfe] text-[#1d4ed8]"
                    : "bg-gray-100 text-[#9ca3af]"
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-semibold ${inRange ? "text-[#155dfc]" : "text-[#6a7282]"}`}>
                    {stage.label}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${
                    isFrom ? "text-[#155dfc]" : isTo ? "text-[#155dfc]" : "invisible"
                  }`}>
                    {isFrom ? "from" : isTo ? "to" : "·"}
                  </span>
                </button>
                {i < FUNNEL_STAGES.length - 1 && (
                  <div className={`h-0.5 w-6 shrink-0 transition-colors ${
                    isConnectorActive(i) ? "bg-[#155dfc]" : "bg-gray-200"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {fromStage && toStage ? (
        <div className="flex items-center gap-3 rounded-xl bg-[#eff6ff] px-5 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#155dfc]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3L13 8L8 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 8H13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-sm text-[#155dfc]">
            Track conversion from{" "}
            <span className="font-semibold">{FUNNEL_STAGES.find((s) => s.id === fromStage)?.label}</span>
            {" → "}
            <span className="font-semibold">{FUNNEL_STAGES.find((s) => s.id === toStage)?.label}</span>
          </p>
          <button
            onClick={() => onStageClick("__clear__")}
            className="ml-auto text-xs text-[#93c5fd] hover:text-[#1d4ed8]"
          >
            Clear
          </button>
        </div>
      ) : fromStage ? (
        <p className="text-sm text-[#9ca3af]">
          Now select the ending stage to complete your goal.
        </p>
      ) : null}

      {/* Target conversion rate — shown once goal is set */}
      {fromStage && toStage && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
            Target conversion rate <span className="text-[#ef4444]">*</span>
          </label>
          <p className="mb-2 text-xs text-[#9ca3af]">
            Set the expected conversion rate from{" "}
            <span className="font-medium text-[#6a7282]">{FUNNEL_STAGES.find((s) => s.id === fromStage)?.label}</span>
            {" → "}
            <span className="font-medium text-[#6a7282]">{FUNNEL_STAGES.find((s) => s.id === toStage)?.label}</span>.
            This will be used as the benchmark on the project dashboard.
          </p>
          <div className="relative w-40">
            <input
              type="number"
              min="1"
              max="100"
              value={targetConversion}
              onChange={(e) => setTargetConversion(e.target.value)}
              placeholder="e.g. 40"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-8 text-sm text-[#0a0a0a] outline-none placeholder:text-[#9ca3af] focus:border-[#155dfc]"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#9ca3af]">%</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Channels & campaigns ──────────────────────────────────
function Step3({
  selectedGroups,    setSelectedGroups,
  selectedCampaigns, setSelectedCampaigns,
  selectedChannels,  setSelectedChannels,
}) {
  const [groupSearch,    setGroupSearch]    = useState("");
  const [campaignSearch, setCampaignSearch] = useState("");
  const [channelSearch,  setChannelSearch]  = useState("");

  const toggle = (setter, id) =>
    setter((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const filteredGroups = CAMPAIGN_GROUPS.filter((g) => {
    const q = groupSearch.toLowerCase();
    return !q || g.name.toLowerCase().includes(q) || g.keywords.some((k) => k.toLowerCase().includes(q));
  });

  const filteredCampaigns = CAMPAIGNS.filter((c) => {
    const q = campaignSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || SOURCE_NAME[c.source]?.toLowerCase().includes(q);
  });

  const filteredChannels = OTHER_CHANNELS.filter((c) => {
    const q = channelSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) || c.source.toLowerCase().includes(q);
  });

  const totalSelected = selectedGroups.size + selectedCampaigns.size + selectedChannels.size;

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="text-xl font-semibold text-[#0a0a0a]">Channels & campaigns</h2>
        <p className="mt-1 text-sm text-[#6a7282]">
          Add the campaign groups, individual campaigns, or other channels to include in this project.
          {totalSelected > 0 && (
            <span className="ml-1 font-medium text-[#155dfc]">{totalSelected} selected.</span>
          )}
        </p>
      </div>

      {/* ── Campaign Groups ── */}
      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Campaign groups</p>
          {selectedGroups.size > 0 && (
            <span className="text-xs font-medium text-[#155dfc]">{selectedGroups.size} selected</span>
          )}
        </div>
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <SearchIcon />
          <input
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            placeholder="Search campaign groups…"
            className="flex-1 text-sm text-[#0a0a0a] outline-none placeholder:text-[#9ca3af]"
          />
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white divide-y divide-gray-50">
          {filteredGroups.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#9ca3af]">No groups match your search.</p>
          ) : filteredGroups.map((g) => (
            <div
              key={g.id}
              onClick={() => toggle(setSelectedGroups, g.id)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-[#f9fafb] ${
                selectedGroups.has(g.id) ? "bg-[#f0fdf4]" : ""
              }`}
            >
              <Checkbox checked={selectedGroups.has(g.id)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#0a0a0a]">{g.name}</p>
                <p className="text-xs text-[#9ca3af]">
                  {g.signalCount} signals · {g.keywords.slice(0, 3).join(", ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Individual Campaigns ── */}
      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Individual campaigns</p>
          {selectedCampaigns.size > 0 && (
            <span className="text-xs font-medium text-[#155dfc]">{selectedCampaigns.size} selected</span>
          )}
        </div>
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <SearchIcon />
          <input
            value={campaignSearch}
            onChange={(e) => setCampaignSearch(e.target.value)}
            placeholder="Search campaigns…"
            className="flex-1 text-sm text-[#0a0a0a] outline-none placeholder:text-[#9ca3af]"
          />
        </div>
        <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-white divide-y divide-gray-50">
          {filteredCampaigns.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#9ca3af]">No campaigns match your search.</p>
          ) : filteredCampaigns.map((c) => {
            const Icon = SOURCE_ICON[c.source];
            return (
              <div
                key={c.id}
                onClick={() => toggle(setSelectedCampaigns, c.id)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#f9fafb] ${
                  selectedCampaigns.has(c.id) ? "bg-[#f0fdf4]" : ""
                }`}
              >
                <Checkbox checked={selectedCampaigns.has(c.id)} />
                {Icon && <div className="shrink-0"><Icon /></div>}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#0a0a0a]">{c.name}</p>
                  <p className="text-xs text-[#9ca3af]">{SOURCE_NAME[c.source]} · {c.type}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Other Channels ── */}
      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Other channels</p>
          {selectedChannels.size > 0 && (
            <span className="text-xs font-medium text-[#155dfc]">{selectedChannels.size} selected</span>
          )}
        </div>
        <p className="mb-2 text-xs text-[#9ca3af]">
          Include other connected channels.
        </p>
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <SearchIcon />
          <input
            value={channelSearch}
            onChange={(e) => setChannelSearch(e.target.value)}
            placeholder="Search channels…"
            className="flex-1 text-sm text-[#0a0a0a] outline-none placeholder:text-[#9ca3af]"
          />
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white divide-y divide-gray-50">
          {filteredChannels.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#9ca3af]">No channels match your search.</p>
          ) : filteredChannels.map((ch) => (
            <div
              key={ch.id}
              onClick={() => toggle(setSelectedChannels, ch.id)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-[#f9fafb] ${
                selectedChannels.has(ch.id) ? "bg-[#f0fdf4]" : ""
              }`}
            >
              <Checkbox checked={selectedChannels.has(ch.id)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#0a0a0a]">{ch.name}</p>
                <p className="text-xs text-[#9ca3af]">{ch.type} · {ch.source}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs text-[#6a7282]">
                {ch.type}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Project Creator (full stepper page) ───────────────────────────
function ProjectCreator({ onCancel, onCreate }) {
  const [step, setStep] = useState(1);

  // Step 1
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [product,     setProduct]     = useState("");
  const [region,      setRegion]      = useState("");

  // Step 2
  const [fromStage,         setFromStage]         = useState(null);
  const [toStage,           setToStage]           = useState(null);
  const [targetConversion,  setTargetConversion]  = useState("");

  // Step 3
  const [selectedGroups,    setSelectedGroups]    = useState(new Set());
  const [selectedCampaigns, setSelectedCampaigns] = useState(new Set());
  const [selectedChannels,  setSelectedChannels]  = useState(new Set());

  const handleStageClick = (id) => {
    if (id === "__clear__") { setFromStage(null); setToStage(null); return; }
    const idx = (sid) => FUNNEL_STAGES.findIndex((s) => s.id === sid);
    if (!fromStage) {
      setFromStage(id);
    } else if (!toStage) {
      if (id === fromStage) { setFromStage(null); return; }
      if (idx(id) > idx(fromStage)) setToStage(id);
      else { setFromStage(id); setToStage(null); }
    } else {
      setFromStage(id); setToStage(null);
    }
  };

  const canNext =
    step === 1 ? name.trim().length > 0 :
    step === 2 ? !!(fromStage && toStage && targetConversion > 0) :
    true;

  const handleNext = () => {
    if (step < 3) { setStep((s) => s + 1); return; }
    onCreate({
      name, description, product, region,
      goal: fromStage && toStage ? { fromStage, toStage, target: targetConversion } : null,
      groups:    [...selectedGroups],
      campaigns: [...selectedCampaigns],
      channels:  [...selectedChannels],
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f9fafb]">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* ── Stepper header ─── */}
        <div className="border-b border-gray-200 bg-white px-8 py-5">
          {/* Back link */}
          <div className="mb-5">
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 text-sm text-[#6a7282] transition-colors hover:text-[#0a0a0a]"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Projects
            </button>
          </div>

          {/* Steps */}
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step > s.id  ? "bg-[#155dfc] text-white"
                    : step === s.id ? "bg-[#155dfc] text-white"
                    : "bg-gray-100 text-[#9ca3af]"
                  }`}>
                    {step > s.id ? (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : s.id}
                  </div>
                  <span className={`text-sm font-medium ${step >= s.id ? "text-[#0a0a0a]" : "text-[#9ca3af]"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mx-4 h-px w-16 transition-colors ${step > s.id ? "bg-[#155dfc]" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Content ─── */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto max-w-[680px]">
            {step === 1 && (
              <Step1
                name={name}               setName={setName}
                description={description} setDescription={setDescription}
                product={product}         setProduct={setProduct}
                region={region}           setRegion={setRegion}
              />
            )}
            {step === 2 && (
              <Step2
                fromStage={fromStage}
                toStage={toStage}
                onStageClick={handleStageClick}
                targetConversion={targetConversion}
                setTargetConversion={setTargetConversion}
              />
            )}
            {step === 3 && (
              <Step3
                selectedGroups={selectedGroups}       setSelectedGroups={setSelectedGroups}
                selectedCampaigns={selectedCampaigns} setSelectedCampaigns={setSelectedCampaigns}
                selectedChannels={selectedChannels}   setSelectedChannels={setSelectedChannels}
              />
            )}
          </div>
        </div>

        {/* ── Footer ─── */}
        <div className="border-t border-gray-200 bg-white px-8 py-4">
          <div className="mx-auto flex max-w-[680px] items-center justify-between">
            <button
              onClick={() => (step > 1 ? setStep((s) => s - 1) : onCancel())}
              className="text-sm font-medium text-[#6a7282] transition-colors hover:text-[#0a0a0a]"
            >
              {step > 1 ? "← Back" : "Cancel"}
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleNext}
                disabled={!canNext}
                className="rounded-xl bg-[#155dfc] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a4fd6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {step === 3 ? "Create project" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Main Projects page ────────────────────────────────────────────
export default function Projects() {
  const navigate = useNavigate();
  const [searchQuery,  setSearchQuery]  = useState("");
  const [showCreator,  setShowCreator]  = useState(false);
  const [projects,     setProjects]     = useState(INITIAL_PROJECTS);

  const handleCreate = (data) => {
    const channelLabels = [
      ...[...data.groups].map((id) => CAMPAIGN_GROUPS.find((g) => g.id === id)?.name ?? ""),
      ...[...data.campaigns].map((id) => CAMPAIGNS.find((c) => c.id === id)?.name ?? ""),
      ...[...data.channels].map((id) => OTHER_CHANNELS.find((c) => c.id === id)?.name ?? ""),
    ].filter(Boolean).slice(0, 4);

    const goalLabel = data.goal
      ? `${FUNNEL_STAGES.find((s) => s.id === data.goal.fromStage)?.label} → ${FUNNEL_STAGES.find((s) => s.id === data.goal.toStage)?.label}`
      : "";

    setProjects((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: data.name,
        description: goalLabel || data.description || "No goal defined",
        status: "Draft",
        hcps: "0",
        conversion: "0%",
        target: data.goal?.target ? `${data.goal.target}%` : "—",
        startDate: `Started ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        channels: channelLabels,
      },
    ]);
    setShowCreator(false);
  };

  if (showCreator) {
    return <ProjectCreator onCancel={() => setShowCreator(false)} onCreate={handleCreate} />;
  }

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa]">
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
            <button
              onClick={() => setShowCreator(true)}
              className="flex items-center gap-2 rounded-[10px] bg-[#155dfc] px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-[#1247cc]"
            >
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
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="flex cursor-pointer flex-col gap-4 rounded-[14px] border border-gray-200 bg-white px-[25px] pb-[25px] pt-[25px] transition-shadow hover:shadow-md"
              >
                {/* Title + status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-col gap-2">
                    <h3 className="text-lg font-medium text-[#0a0a0a]">{project.title}</h3>
                    <p className="text-sm text-[#4a5565]">{project.description}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[project.status]}`}>
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

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon />
                    <span className="text-sm text-[#4a5565]">{project.startDate}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {project.channels.slice(0, 3).map((channel) => (
                      <span key={channel} className="rounded bg-[#eff6ff] px-2 py-0.5 text-xs text-[#1447e6]">
                        {channel}
                      </span>
                    ))}
                    {project.channels.length > 3 && (
                      <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-xs text-[#9ca3af]">
                        +{project.channels.length - 3}
                      </span>
                    )}
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
