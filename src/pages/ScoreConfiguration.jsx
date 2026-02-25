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
    // Three editable tier values
    tier1: 33,
    tier2: 66,
    tier3: 100,
    ranged: true,
    scoringCriteria: "Tier classification by customer (tier 1, 2, 3)",
    note: "",
    editable: true,
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

const CLASSIFICATION_OPTIONS = [
  "Reach Event",
  "Engagement Event",
  "Interactive Engagement",
  "Advocacy",
];

// Default KPIs per channel — weights within each channel must sum to 100
const DEFAULT_CHANNELS = [
  {
    id: "email",
    name: "Email",
    active: true,
    kpis: [
      { id: "e1", name: "Email Opens",         classification: "Reach Event",          weight: 34 },
      { id: "e2", name: "Email Click-Through",  classification: "Reach Event",          weight: 33 },
      { id: "e3", name: "Email Reply",          classification: "Engagement Event",     weight: 33 },
    ],
  },
  {
    id: "call",
    name: "Call",
    active: true,
    kpis: [
      { id: "c1", name: "Call Completed",           classification: "Reach Event",            weight: 34 },
      { id: "c2", name: "Call Duration > 5 min",    classification: "Engagement Event",       weight: 33 },
      { id: "c3", name: "Customer-Initiated Call",   classification: "Interactive Engagement", weight: 33 },
    ],
  },
  {
    id: "webinar",
    name: "Webinar",
    active: true,
    kpis: [
      { id: "w1", name: "Webinar Registration", classification: "Reach Event",      weight: 34 },
      { id: "w2", name: "Webinar Attendance",   classification: "Engagement Event", weight: 33 },
      { id: "w3", name: "Q&A Participation",    classification: "Engagement Event", weight: 33 },
    ],
  },
  {
    id: "events",
    name: "Events",
    active: true,
    kpis: [
      { id: "ev1", name: "Event Registration",   classification: "Reach Event",            weight: 34 },
      { id: "ev2", name: "Event Attendance",     classification: "Engagement Event",       weight: 33 },
      { id: "ev3", name: "1:1 Meeting at Event", classification: "Interactive Engagement", weight: 33 },
    ],
  },
  {
    id: "web",
    name: "Web",
    active: true,
    kpis: [
      { id: "wb1", name: "Webpage Views",    classification: "Reach Event",      weight: 34 },
      { id: "wb2", name: "Content Download", classification: "Engagement Event", weight: 33 },
      { id: "wb3", name: "Portal Login",     classification: "Engagement Event", weight: 33 },
    ],
  },
  {
    id: "congress",
    name: "Congress",
    active: true,
    kpis: [
      { id: "cg1", name: "Session Attendance",             classification: "Engagement Event",       weight: 34 },
      { id: "cg2", name: "HCP Speaker at Corporate Event", classification: "Advocacy",               weight: 33 },
      { id: "cg3", name: "Booth Visit",                    classification: "Interactive Engagement", weight: 33 },
    ],
  },
  {
    id: "f2f",
    name: "F2F",
    active: true,
    kpis: [
      { id: "f1", name: "F2F Visit Completed",    classification: "Reach Event",            weight: 34 },
      { id: "f2", name: "F2F Visit > 15 min",     classification: "Engagement Event",       weight: 33 },
      { id: "f3", name: "Customer-Initiated F2F", classification: "Interactive Engagement", weight: 33 },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classificationStyle(cls) {
  if (cls === "Reach Event")            return { bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]", bar: "bg-[#3b82f6]" };
  if (cls === "Engagement Event")       return { bg: "bg-[#ede9fe]", text: "text-[#6d28d9]", bar: "bg-[#8b5cf6]" };
  if (cls === "Interactive Engagement") return { bg: "bg-[#fef3c7]", text: "text-[#b45309]", bar: "bg-[#f59e0b]" };
  if (cls === "Advocacy")               return { bg: "bg-[#ffedd5]", text: "text-[#c2410c]", bar: "bg-[#f97316]" };
  return { bg: "bg-[#f3f4f6]", text: "text-[#374151]", bar: "bg-[#9ca3af]" };
}

function getSuggested(weight) {
  if (weight >= 40) return { label: "High",   cls: "text-[#d97706] font-semibold" };
  if (weight >= 20) return { label: "Medium", cls: "text-[#7c3aed] font-semibold" };
  return                   { label: "Low",    cls: "text-[#2563eb] font-semibold" };
}

/**
 * When the user changes one KPI's weight to `newWeight`,
 * redistribute the remaining (100 - newWeight) proportionally
 * across all other KPIs in the group. Weights are integers summing to 100.
 */
function redistributeWeights(kpis, changedId, newWeight) {
  const clamped = Math.max(0, Math.min(100, newWeight));
  const others = kpis.filter((k) => k.id !== changedId);

  if (others.length === 0) {
    return kpis.map((k) => ({ ...k, weight: 100 }));
  }

  const remaining = 100 - clamped;
  const oldOtherTotal = others.reduce((s, k) => s + k.weight, 0);

  let newOthers;
  if (oldOtherTotal === 0) {
    // distribute evenly
    const base = Math.floor(remaining / others.length);
    const extra = remaining - base * others.length;
    newOthers = others.map((k, i) => ({ ...k, weight: base + (i < extra ? 1 : 0) }));
  } else {
    // proportional redistribution
    const scaled = others.map((k) => ({
      ...k,
      weight: Math.round((k.weight / oldOtherTotal) * remaining),
    }));
    // fix rounding so total is exactly 100
    const scaledTotal = scaled.reduce((s, k) => s + k.weight, 0);
    const diff = remaining - scaledTotal;
    if (diff !== 0 && scaled.length > 0) scaled[0].weight += diff;
    newOthers = scaled;
  }

  return kpis.map((k) => {
    if (k.id === changedId) return { ...k, weight: clamped };
    return newOthers.find((o) => o.id === k.id) || k;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle component (fixed — uses controlled checked prop)
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? "bg-[#155dfc]" : "bg-[#d1d5dc]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
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
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] w-[240px]">Component</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] w-[200px]">Max Points</th>
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
                  {/* Component name */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-[#111318]">{comp.component}</span>
                      {comp.note && <span className="text-xs italic text-[#9ca3af]">{comp.note}</span>}
                    </div>
                  </td>

                  {/* Max points — tiering gets three separate inputs */}
                  <td className="px-6 py-4">
                    {comp.ranged ? (
                      isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number" min={0}
                            value={comp.tier1}
                            onChange={(e) => update(comp.id, "tier1", parseInt(e.target.value) || 0)}
                            className="w-14 rounded-lg border border-[#155dfc] px-2 py-1 text-center text-sm text-[#111318] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                          />
                          <span className="text-[#9ca3af]">–</span>
                          <input
                            type="number" min={0}
                            value={comp.tier2}
                            onChange={(e) => update(comp.id, "tier2", parseInt(e.target.value) || 0)}
                            className="w-14 rounded-lg border border-[#155dfc] px-2 py-1 text-center text-sm text-[#111318] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                          />
                          <span className="text-[#9ca3af]">–</span>
                          <input
                            type="number" min={0}
                            value={comp.tier3}
                            onChange={(e) => update(comp.id, "tier3", parseInt(e.target.value) || 0)}
                            className="w-14 rounded-lg border border-[#155dfc] px-2 py-1 text-center text-sm text-[#111318] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                          />
                          <span className="text-xs text-[#9ca3af]">pts</span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-[#374151]">
                          {comp.tier1} – {comp.tier2} – {comp.tier3} pts
                        </span>
                      )
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

                  {/* Scoring criteria */}
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

                  {/* Edit toggle */}
                  <td className="px-4 py-4">
                    <button
                      onClick={() => { setEditingId(isEditing ? null : comp.id); setDirty(true); }}
                      className={`rounded p-1.5 transition-colors ${isEditing ? "bg-[#155dfc] text-white" : "text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151]"}`}
                      title={isEditing ? "Done" : "Edit"}
                    >
                      {isEditing ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer total */}
        <div className="flex items-center justify-between border-t border-[#e5e7eb] bg-[#f9fafb] px-6 py-3">
          <span className="text-xs text-[#9ca3af]">Total max score (excluding tiering)</span>
          <span className="text-sm font-bold text-[#111318]">
            {components.filter((c) => !c.ranged).reduce((s, c) => s + (parseInt(c.maxPoints) || 0), 0)} pts
          </span>
        </div>
      </div>

      {/* Save / reset — only shown when dirty */}
      {dirty && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => { setComponents(DEFAULT_ICP_COMPONENTS); setDirty(false); setEditingId(null); }}
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#9ca3af]">
              <path d="M1 3v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1.5 7A6 6 0 1 0 3 3.3L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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

  // ── Weight change with auto-redistribution ────────────────────────────────
  const changeWeight = (chId, kpiId, newWeight) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== chId) return ch;
        return { ...ch, kpis: redistributeWeights(ch.kpis, kpiId, newWeight) };
      })
    );
  };

  // ── Other KPI field updates ───────────────────────────────────────────────
  const updateKPI = (chId, kpiId, key, value) => {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id !== chId ? ch : {
          ...ch,
          kpis: ch.kpis.map((k) => k.id !== kpiId ? k : { ...k, [key]: value }),
        }
      )
    );
  };

  // ── Add KPI — new entry gets an even share, others auto-adjust ────────────
  const addKPI = (chId) => {
    const newKPI = {
      id: `kpi_${Date.now()}`,
      name: "",
      classification: "Reach Event",
      weight: 0,
      isNew: true,
    };
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== chId) return ch;
        const updatedKPIs = [...ch.kpis, newKPI];
        // Redistribute evenly across all including the new one
        const base = Math.floor(100 / updatedKPIs.length);
        const extra = 100 - base * updatedKPIs.length;
        return {
          ...ch,
          kpis: updatedKPIs.map((k, i) => ({ ...k, weight: base + (i < extra ? 1 : 0) })),
        };
      })
    );
  };

  // ── Remove KPI — remaining weights auto-redistribute to 100 ──────────────
  const removeKPI = (chId, kpiId) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== chId) return ch;
        const remaining = ch.kpis.filter((k) => k.id !== kpiId);
        if (remaining.length === 0) return { ...ch, kpis: [] };
        const base = Math.floor(100 / remaining.length);
        const extra = 100 - base * remaining.length;
        return {
          ...ch,
          kpis: remaining.map((k, i) => ({ ...k, weight: base + (i < extra ? 1 : 0) })),
        };
      })
    );
  };

  const toggleChannelActive = (chId) => {
    setChannels((prev) => prev.map((ch) => ch.id !== chId ? ch : { ...ch, active: !ch.active }));
  };

  const handleReset = () => {
    setChannels(DEFAULT_CHANNELS.map((ch) => ({ ...ch, kpis: ch.kpis.map((k) => ({ ...k })) })));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6a7282]">
          Edit KPI classifications and weights per channel. Weights within each channel are automatically adjusted to sum to 100%.
        </p>
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
      </div>

      {/* Channel cards */}
      <div className="flex flex-col gap-4">
        {channels.map((ch) => {
          const total = ch.kpis.reduce((s, k) => s + k.weight, 0);
          return (
            <div
              key={ch.id}
              className={`rounded-xl border bg-white transition-opacity ${ch.active ? "border-[#e5e7eb]" : "border-[#f3f4f6] opacity-60"}`}
            >
              {/* Channel header */}
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-semibold text-[#111318]">{ch.name}</span>
                  <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs text-[#6a7282]">
                    {ch.kpis.length} KPI{ch.kpis.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${ch.active ? "text-[#16a34a]" : "text-[#9ca3af]"}`}>
                    {ch.active ? "● Active" : "● Inactive"}
                  </span>
                  <Toggle checked={ch.active} onChange={() => toggleChannelActive(ch.id)} />
                </div>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_190px_1fr_90px_36px] border-t border-[#f3f4f6] bg-[#fafafa] px-6 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">KPI (Event)</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Orixa Classification</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Weight</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Suggested</span>
                <span />
              </div>

              {/* KPI rows */}
              <div className="flex flex-col divide-y divide-[#f3f4f6]">
                {ch.kpis.map((kpi) => {
                  const style = classificationStyle(kpi.classification);
                  const suggested = getSuggested(kpi.weight);

                  return (
                    <div
                      key={kpi.id}
                      className="grid grid-cols-[1fr_190px_1fr_90px_36px] items-center gap-0 px-6 py-3 hover:bg-[#fafafa] transition-colors"
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
                            onBlur={() => updateKPI(ch.id, kpi.id, "isNew", false)}
                            className="w-full rounded-lg border border-[#d1d5dc] px-2.5 py-1.5 text-sm text-[#111318] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                          />
                        ) : (
                          <span className="text-sm font-medium text-[#111318]">{kpi.name}</span>
                        )}
                      </div>

                      {/* Classification pill dropdown — no dot circle */}
                      <div className="pr-4">
                        <div className="relative inline-flex items-center">
                          <select
                            value={kpi.classification}
                            onChange={(e) => updateKPI(ch.id, kpi.id, "classification", e.target.value)}
                            className={`appearance-none rounded-full border-0 py-1 pl-3 pr-6 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#155dfc] cursor-pointer ${style.bg} ${style.text}`}
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

                      {/* Weight input + bar (auto-redistributes others) */}
                      <div className="flex items-center gap-2 pr-4">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={kpi.weight}
                          onChange={(e) => changeWeight(ch.id, kpi.id, parseInt(e.target.value) || 0)}
                          className="w-14 rounded-lg border border-[#e5e7eb] px-2 py-1 text-center text-sm font-semibold text-[#111318] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                        />
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e5e7eb]">
                          <div
                            className={`h-full rounded-full transition-all ${style.bar}`}
                            style={{ width: `${kpi.weight}%` }}
                          />
                        </div>
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

              {/* Footer: Add KPI + total indicator */}
              <div className="flex items-center justify-between border-t border-[#f3f4f6] px-6 py-3">
                <button
                  onClick={() => addKPI(ch.id)}
                  className="flex items-center gap-1.5 text-sm text-[#9ca3af] hover:text-[#374151] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Add KPI
                </button>
                <span className={`text-xs font-semibold ${total === 100 ? "text-[#16a34a]" : "text-[#f59e0b]"}`}>
                  Total: {total}%
                </span>
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
            { cls: "Reach Event",            desc: "Awareness signals — the customer has encountered your brand but reveals nothing about intent. Score them low." },
            { cls: "Engagement Event",        desc: "Deliberate action signals — the customer chose to engage, indicating genuine interest. Score them moderately." },
            { cls: "Interactive Engagement",  desc: "High-investment interactions requiring significant time commitment. Score them highly." },
            { cls: "Advocacy",                desc: "Highest form — the customer is actively promoting your brand to peers. Score them highest." },
          ].map((item) => {
            const s = classificationStyle(item.cls);
            return (
              <div key={item.cls} className="flex items-start gap-2.5">
                <span className={`mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>
                  {item.cls}
                </span>
                <p className="text-xs text-[#6a7282] leading-snug">{item.desc}</p>
              </div>
            );
          })}
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
