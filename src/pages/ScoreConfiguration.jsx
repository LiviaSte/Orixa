import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";

// ─────────────────────────────────────────────────────────────────────────────
// ICP SCORE — default component config
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_ICP_COMPONENTS = [
  {
    id: "tiering",
    component: "Current Tiering",
    maxPoints: "33 – 66 – 100 pts",
    ranged: true,
    scoringCriteria: "Tier classification by customer (tier 1, 2, 3)",
    note: "",
    editable: false,
  },
  {
    id: "firmographic",
    component: "Firmographic Score",
    maxPoints: 20,
    ranged: false,
    scoringCriteria: "Hospital size (beds, procedures/yr), Geography, case mix compatible with device (clinical criteria)",
    note: "May overlap with current tiering",
    editable: true,
  },
  {
    id: "historical",
    component: "Historical Performance",
    maxPoints: 50,
    ranged: false,
    scoringCriteria: "Past purchase history with company, revenue contribution, payment reliability",
    note: "May overlap with current tiering. Applies to this product only or across the portfolio?",
    editable: true,
  },
  {
    id: "timeline",
    component: "Timeline Consideration",
    maxPoints: 10,
    ranged: false,
    scoringCriteria: "Based on geography and public vs. private. Understanding when a lead plans to purchase is highly important — aligns the lead's buying timeline with the business's sales cycle.",
    note: "",
    editable: true,
  },
  {
    id: "physicians",
    component: "N° physicians associated to the account",
    maxPoints: 10,
    ranged: false,
    scoringCriteria: "Increases score based on number of associated physicians",
    note: "",
    editable: true,
  },
  {
    id: "potential",
    component: "Potential Score",
    maxPoints: 30,
    ranged: false,
    scoringCriteria: "Estimated procedure volume for product category, budget / purchasing power, competitive products currently in use",
    note: "",
    editable: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ENGAGEMENT SCORE — channel-based KPI config
// ─────────────────────────────────────────────────────────────────────────────

// Classification options (Engagement Depth tiers)
const CLASSIFICATION_OPTIONS = [
  "Reach Event",
  "Engagement Event",
  "Interactive Engagement",
  "Advocacy",
];

// Channel dot colours
const CHANNEL_DOT = {
  "Email":    "bg-[#3b82f6]",
  "Call":     "bg-[#10b981]",
  "Webinar":  "bg-[#8b5cf6]",
  "Events":   "bg-[#f59e0b]",
  "Web":      "bg-[#6366f1]",
  "Congress": "bg-[#f97316]",
  "F2F":      "bg-[#ec4899]",
};

// Default KPIs per channel — classification follows Engagement Depth logic
const DEFAULT_CHANNELS = [
  {
    id: "email",
    name: "Email",
    active: true,
    kpis: [
      { id: "e1", name: "Email Opens",          classification: "Reach Event",       weight: 25,  cap: false, capCount: null },
      { id: "e2", name: "Email Click-Through",  classification: "Reach Event",       weight: 25,  cap: false, capCount: null },
      { id: "e3", name: "Email Reply",          classification: "Engagement Event",  weight: 50,  cap: false, capCount: null },
    ],
  },
  {
    id: "call",
    name: "Call",
    active: true,
    kpis: [
      { id: "c1", name: "Call Completed",          classification: "Reach Event",          weight: 25,  cap: false, capCount: null },
      { id: "c2", name: "Call Duration > 5 min",   classification: "Engagement Event",     weight: 50,  cap: false, capCount: null },
      { id: "c3", name: "Customer-Initiated Call",  classification: "Interactive Engagement", weight: 75, cap: false, capCount: null },
    ],
  },
  {
    id: "webinar",
    name: "Webinar",
    active: true,
    kpis: [
      { id: "w1", name: "Webinar Registration",  classification: "Reach Event",      weight: 25,  cap: false, capCount: null },
      { id: "w2", name: "Webinar Attendance",    classification: "Engagement Event", weight: 50,  cap: false, capCount: null },
      { id: "w3", name: "Q&A Participation",     classification: "Engagement Event", weight: 50,  cap: false, capCount: null },
    ],
  },
  {
    id: "events",
    name: "Events",
    active: true,
    kpis: [
      { id: "ev1", name: "Event Registration",       classification: "Reach Event",          weight: 25,  cap: false, capCount: null },
      { id: "ev2", name: "Event Attendance",         classification: "Engagement Event",     weight: 50,  cap: false, capCount: null },
      { id: "ev3", name: "1:1 Meeting at Event",     classification: "Interactive Engagement", weight: 75, cap: false, capCount: null },
    ],
  },
  {
    id: "web",
    name: "Web",
    active: true,
    kpis: [
      { id: "wb1", name: "Webpage Views",       classification: "Reach Event",      weight: 25,  cap: false, capCount: null },
      { id: "wb2", name: "Content Download",    classification: "Engagement Event", weight: 50,  cap: false, capCount: null },
      { id: "wb3", name: "Portal Login",        classification: "Engagement Event", weight: 50,  cap: false, capCount: null },
    ],
  },
  {
    id: "congress",
    name: "Congress",
    active: true,
    kpis: [
      { id: "cg1", name: "Session Attendance",              classification: "Engagement Event",     weight: 50,  cap: false, capCount: null },
      { id: "cg2", name: "HCP Speaker at Corporate Event",  classification: "Advocacy",             weight: 100, cap: true,  capCount: 2 },
      { id: "cg3", name: "Booth Visit",                     classification: "Interactive Engagement", weight: 75, cap: false, capCount: null },
    ],
  },
  {
    id: "f2f",
    name: "F2F",
    active: true,
    kpis: [
      { id: "f1", name: "F2F Visit Completed",       classification: "Reach Event",          weight: 25,  cap: false, capCount: null },
      { id: "f2", name: "F2F Visit > 15 min",        classification: "Engagement Event",     weight: 50,  cap: false, capCount: null },
      { id: "f3", name: "Customer-Initiated F2F",    classification: "Interactive Engagement", weight: 75, cap: false, capCount: null },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classificationStyle(cls) {
  if (cls === "Reach Event")           return { bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]", dot: "bg-[#3b82f6]", bar: "bg-[#3b82f6]" };
  if (cls === "Engagement Event")      return { bg: "bg-[#ede9fe]", text: "text-[#6d28d9]", dot: "bg-[#8b5cf6]", bar: "bg-[#8b5cf6]" };
  if (cls === "Interactive Engagement")return { bg: "bg-[#fef3c7]", text: "text-[#b45309]", dot: "bg-[#f59e0b]", bar: "bg-[#f59e0b]" };
  if (cls === "Advocacy")              return { bg: "bg-[#ffedd5]", text: "text-[#c2410c]", dot: "bg-[#f97316]", bar: "bg-[#f97316]" };
  return { bg: "bg-[#f3f4f6]", text: "text-[#374151]", dot: "bg-[#9ca3af]", bar: "bg-[#9ca3af]" };
}

function getSuggested(weight) {
  if (weight >= 100) return { label: "Highest", cls: "text-[#ea580c] font-bold" };
  if (weight >= 75)  return { label: "High",    cls: "text-[#d97706] font-semibold" };
  if (weight >= 40)  return { label: "Medium",  cls: "text-[#7c3aed] font-semibold" };
  return                    { label: "Low",     cls: "text-[#2563eb] font-semibold" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: ICP Score tab
// ─────────────────────────────────────────────────────────────────────────────

function ICPScoreTab() {
  const [components, setComponents] = useState(DEFAULT_ICP_COMPONENTS);
  const [editingId, setEditingId] = useState(null);
  const [dirty, setDirty] = useState(false);

  const update = (id, key, value) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: value } : c)));
    setDirty(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Info banner */}
      <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-5 py-4">
        <p className="text-sm text-[#92400e]">
          <span className="font-semibold">ICP Score</span> measures how well an account fits your Ideal Customer Profile. The system provides default component weights — adjust max points and scoring criteria to match your business context.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] w-[260px]">Component</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] w-[150px]">Max Points</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282]">Scoring Criteria</th>
              <th className="px-6 py-3 w-[52px]" />
            </tr>
          </thead>
          <tbody>
            {components.map((comp, idx) => {
              const isEditing = editingId === comp.id;
              const isLast = idx === components.length - 1;
              return (
                <tr key={comp.id} className={`transition-colors hover:bg-[#f9fafb] ${isLast ? "" : "border-b border-[#e5e7eb]"}`}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-[#111318]">{comp.component}</span>
                      {comp.note && <span className="text-xs italic text-[#9ca3af]">{comp.note}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {comp.ranged ? (
                      <span className="text-sm font-medium text-[#374151]">{comp.maxPoints}</span>
                    ) : isEditing ? (
                      <input
                        type="number"
                        value={comp.maxPoints}
                        onChange={(e) => update(comp.id, "maxPoints", parseInt(e.target.value) || 0)}
                        className="w-20 rounded-lg border border-[#155dfc] px-2 py-1 text-sm text-[#111318] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                      />
                    ) : (
                      <span className="text-sm font-medium text-[#374151]">{comp.maxPoints} pts</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <textarea
                        value={comp.scoringCriteria}
                        onChange={(e) => update(comp.id, "scoringCriteria", e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-[#155dfc] px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                      />
                    ) : (
                      <span className="text-sm text-[#4a5565] leading-relaxed">{comp.scoringCriteria}</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {comp.editable && (
                      <button
                        onClick={() => setEditingId(isEditing ? null : comp.id)}
                        className={`rounded p-1.5 transition-colors ${isEditing ? "bg-[#155dfc] text-white" : "text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151]"}`}
                        title={isEditing ? "Done" : "Edit"}
                      >
                        {isEditing ? (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-[#e5e7eb] bg-[#f9fafb] px-6 py-3">
          <span className="text-xs text-[#9ca3af]">Total max score (excluding tiering)</span>
          <span className="text-sm font-bold text-[#111318]">
            {components.filter((c) => !c.ranged).reduce((s, c) => s + (parseInt(c.maxPoints) || 0), 0)} pts
          </span>
        </div>
      </div>

      {dirty && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => { setComponents(DEFAULT_ICP_COMPONENTS); setDirty(false); setEditingId(null); }}
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#9ca3af]"><path d="M1 3v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 7A6 6 0 1 0 3 3.3L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Reset to defaults
          </button>
          <button
            onClick={() => { setDirty(false); setEditingId(null); }}
            className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] transition-colors"
          >
            Save configuration
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Engagement Score tab  (channel-based)
// ─────────────────────────────────────────────────────────────────────────────

function EngagementScoreTab() {
  const [channels, setChannels] = useState(() =>
    DEFAULT_CHANNELS.map((ch) => ({ ...ch, kpis: ch.kpis.map((k) => ({ ...k })) }))
  );
  const [dirty, setDirty] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const updateKPI = (chId, kpiId, key, value) => {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id !== chId ? ch : {
          ...ch,
          kpis: ch.kpis.map((k) => k.id !== kpiId ? k : { ...k, [key]: value }),
        }
      )
    );
    setDirty(true);
  };

  const addKPI = (chId) => {
    const newKPI = {
      id: `kpi_${Date.now()}`,
      name: "",
      classification: "Reach Event",
      weight: 25,
      cap: false,
      capCount: null,
      isNew: true,
    };
    setChannels((prev) =>
      prev.map((ch) => ch.id !== chId ? ch : { ...ch, kpis: [...ch.kpis, newKPI] })
    );
    setDirty(true);
  };

  const removeKPI = (chId, kpiId) => {
    setChannels((prev) =>
      prev.map((ch) => ch.id !== chId ? ch : { ...ch, kpis: ch.kpis.filter((k) => k.id !== kpiId) })
    );
    setDirty(true);
  };

  const toggleChannelActive = (chId) => {
    setChannels((prev) => prev.map((ch) => ch.id !== chId ? ch : { ...ch, active: !ch.active }));
    setDirty(true);
  };

  const handleReset = () => {
    setChannels(DEFAULT_CHANNELS.map((ch) => ({ ...ch, kpis: ch.kpis.map((k) => ({ ...k })) })));
    setDirty(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header actions — always visible, greyed when no changes */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6a7282]">
          Edit KPI classifications and weights per channel. Changes update the scoring model in real time.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#9ca3af]">
              <path d="M1 3v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1.5 7A6 6 0 1 0 3 3.3L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Reset to defaults
          </button>
          <button
            onClick={() => setDirty(false)}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${dirty ? "bg-[#155dfc] hover:bg-[#1a4fd8]" : "bg-[#155dfc]/50 cursor-not-allowed"}`}
            disabled={!dirty}
          >
            Save configuration
          </button>
        </div>
      </div>

      {/* Channel cards */}
      <div className="flex flex-col gap-4">
        {channels.map((ch) => {
          const dotCls = CHANNEL_DOT[ch.name] || "bg-[#9ca3af]";
          return (
            <div
              key={ch.id}
              className={`rounded-xl border bg-white transition-opacity ${ch.active ? "border-[#e5e7eb]" : "border-[#f3f4f6] opacity-60"}`}
            >
              {/* Channel header */}
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <span className={`h-3 w-3 rounded-full ${dotCls}`} />
                  <span className="text-base font-semibold text-[#111318]">{ch.name}</span>
                  <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs text-[#6a7282]">
                    {ch.kpis.length} KPI{ch.kpis.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${ch.active ? "text-[#16a34a]" : "text-[#9ca3af]"}`}>
                    {ch.active ? "● Active" : "● Inactive"}
                  </span>
                  <button
                    onClick={() => toggleChannelActive(ch.id)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${ch.active ? "bg-[#155dfc]" : "bg-[#d1d5dc]"}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${ch.active ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_190px_200px_90px_90px_36px] border-t border-[#f3f4f6] bg-[#fafafa] px-6 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">KPI (Event)</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Orixa Classification</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Suggested Weight</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Cap?</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Suggested</span>
                <span />
              </div>

              {/* KPI rows */}
              <div className="flex flex-col divide-y divide-[#f3f4f6]">
                {ch.kpis.map((kpi) => {
                  const style = classificationStyle(kpi.classification);
                  const suggested = getSuggested(kpi.weight);
                  const barPct = Math.min(100, kpi.weight);

                  return (
                    <div
                      key={kpi.id}
                      className="grid grid-cols-[1fr_190px_200px_90px_90px_36px] items-center gap-0 px-6 py-3 hover:bg-[#fafafa] transition-colors"
                    >
                      {/* Name */}
                      <div className="pr-4">
                        {kpi.isNew ? (
                          <input
                            autoFocus
                            type="text"
                            placeholder="KPI name…"
                            value={kpi.name}
                            onChange={(e) => updateKPI(ch.id, kpi.id, "name", e.target.value)}
                            className="w-full rounded-lg border border-[#d1d5dc] px-2.5 py-1.5 text-sm text-[#111318] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                          />
                        ) : (
                          <span className="text-sm font-medium text-[#111318]">{kpi.name}</span>
                        )}
                      </div>

                      {/* Classification pill dropdown */}
                      <div className="pr-4">
                        <div className="relative inline-flex items-center">
                          <span className={`pointer-events-none absolute left-2 h-2 w-2 rounded-full ${style.dot}`} />
                          <select
                            value={kpi.classification}
                            onChange={(e) => updateKPI(ch.id, kpi.id, "classification", e.target.value)}
                            className={`appearance-none rounded-full border-0 py-1 pl-6 pr-6 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#155dfc] cursor-pointer ${style.bg} ${style.text}`}
                          >
                            {CLASSIFICATION_OPTIONS.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                          <svg className={`pointer-events-none absolute right-2 ${style.text}`} width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>

                      {/* Weight input + bar */}
                      <div className="flex items-center gap-2 pr-4">
                        <input
                          type="number"
                          min={0}
                          max={999}
                          value={kpi.weight}
                          onChange={(e) => updateKPI(ch.id, kpi.id, "weight", Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-14 rounded-lg border border-[#e5e7eb] px-2 py-1 text-center text-sm font-semibold text-[#111318] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                        />
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e5e7eb]">
                          <div
                            className={`h-full rounded-full transition-all ${style.bar}`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Cap toggle + count */}
                      <div className="flex flex-col items-start gap-1">
                        <button
                          onClick={() => updateKPI(ch.id, kpi.id, "cap", !kpi.cap)}
                          className={`relative h-5 w-9 rounded-full transition-colors ${kpi.cap ? "bg-[#155dfc]" : "bg-[#d1d5dc]"}`}
                        >
                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${kpi.cap ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                        {kpi.cap && (
                          <input
                            type="number"
                            min={1}
                            value={kpi.capCount || ""}
                            placeholder="cap"
                            onChange={(e) => updateKPI(ch.id, kpi.id, "capCount", parseInt(e.target.value) || null)}
                            className="w-10 rounded border border-[#d1d5dc] px-1 py-0.5 text-center text-xs text-[#374151] focus:border-[#155dfc] focus:outline-none"
                          />
                        )}
                      </div>

                      {/* Suggested label */}
                      <div>
                        <span className={`text-xs ${suggested.cls}`}>{suggested.label}</span>
                      </div>

                      {/* Remove */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => removeKPI(ch.id, kpi.id)}
                          className="rounded p-1 text-[#d1d5dc] hover:text-[#dc2626] hover:bg-[#fee2e2] transition-colors"
                          title="Remove KPI"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 2L10 10M2 10L10 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add KPI row */}
              <div className="border-t border-[#f3f4f6] px-6 py-3">
                <button
                  onClick={() => addKPI(ch.id)}
                  className="flex items-center gap-1.5 text-sm text-[#9ca3af] hover:text-[#374151] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Add KPI
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Classification legend */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white px-6 py-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282]">Engagement Depth — Classification Guide</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {[
            { cls: "Reach Event",            dot: "bg-[#3b82f6]", desc: "Awareness signals — the customer has encountered your brand but reveals nothing about intent. Score them low." },
            { cls: "Engagement Event",        dot: "bg-[#8b5cf6]", desc: "Deliberate action signals — the customer chose to engage, indicating genuine interest. Score them moderately." },
            { cls: "Interactive Engagement",  dot: "bg-[#f59e0b]", desc: "High-investment interactions requiring significant time commitment. Score them highly." },
            { cls: "Advocacy",                dot: "bg-[#f97316]", desc: "Highest form — the customer is actively promoting your brand to peers. Score them highest." },
          ].map((item) => (
            <div key={item.cls} className="flex items-start gap-2.5">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`} />
              <div>
                <span className="text-sm font-semibold text-[#111318]">{item.cls}</span>
                <p className="text-xs text-[#6a7282] leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function ScoreConfiguration() {
  const [activeTab, setActiveTab] = useState("icp");

  const tabs = [
    { key: "icp",        label: "ICP Score" },
    { key: "engagement", label: "Engagement Score" },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col gap-0 p-8 pb-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-5">
            <Link to="/leading-board" className="text-[#6a7282] transition-colors hover:text-[#155dfc]">
              Leading board
            </Link>
            <span className="text-[#6a7282]">/</span>
            <span className="text-[#111318] font-medium">Score configuration</span>
          </nav>

          {/* Header */}
          <div className="flex flex-col gap-1 mb-6">
            <h1 className="text-2xl font-semibold text-[#0a0a0a]">Score Configuration</h1>
            <p className="text-sm text-[#6a7282] max-w-[640px]">
              Configure the ICP fit score and the engagement model. Adjust default weights, criteria, and KPI classifications to match your brand strategy.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-[#e5e7eb]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 pb-3 pt-1 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? "border-[#155dfc] text-[#155dfc]"
                    : "border-transparent text-[#6a7282] hover:text-[#374151]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable tab content */}
        <div className="flex-1 overflow-auto px-8 py-6">
          {activeTab === "icp"        && <ICPScoreTab />}
          {activeTab === "engagement" && <EngagementScoreTab />}
        </div>
      </main>
    </div>
  );
}
