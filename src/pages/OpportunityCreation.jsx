import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useOpportunityContext } from "../OpportunityContext";
import {
  StagesIcon,
  ConversionTriggersIcon,
  ArrowRightLongIcon,
  PlusSmallIcon,
  ChevronDownIcon,
} from "../components/icons";

// ── Pharma funnel stage options ─────────────────────────────────
const fromStageOptions = [
  "Lead (All)",
  "Suspect",
  "Prospect",
  "Marketing Qualified Lead",
  "Sales Qualified Lead",
  "Engaged HCP",
  "Active Prescriber",
  "Champion / Advocate",
];

// ── Type options ──────────────────────────────────────────────────
const typeOptions = [
  "Attended Medical Congress",
  "Email Engagement",
  "Web Visit",
  "Content Download",
  "Sales Meeting",
  "Product Demo Request",
];

// ── Contextual options based on selected Type ────────────────────
const conditionsByType = {
  "Attended Medical Congress": ["at least", "exactly", "at most"],
  "Email Engagement": ["opened", "clicked", "replied", "bounced"],
  "Web Visit": ["visited", "spent at least", "viewed at least"],
  "Content Download": ["downloaded", "at least", "exactly"],
  "Sales Meeting": ["attended", "scheduled", "at least"],
  "Product Demo Request": ["requested", "completed", "at least"],
};

const sourcesByType = {
  "Attended Medical Congress": ["Manual database", "Veeva CRM", "Salesforce", "Event platform"],
  "Email Engagement": ["Marketo", "Salesforce Marketing Cloud", "HubSpot", "Mailchimp"],
  "Web Visit": ["Google Analytics", "Adobe Analytics", "Mixpanel"],
  "Content Download": ["Manual database", "Marketo", "HubSpot", "Website CMS"],
  "Sales Meeting": ["Veeva CRM", "Salesforce", "Microsoft Dynamics"],
  "Product Demo Request": ["Salesforce", "HubSpot", "Manual database"],
};

// ── Targets keyed by Type → Source (what the system finds in that source) ──
const targetsBySource = {
  "Attended Medical Congress": {
    "Manual database": ["Congress_2024_Q1", "Congress_2024_Q2", "Congress_2024_Q3", "Congress_2024_Q4"],
    "Veeva CRM": ["ASCO_2024", "ESC_2024", "AHA_2024"],
    "Salesforce": ["ESC_2024", "Congress_2024_Q1", "ESMO_2024"],
    "Event platform": ["ASCO_2024", "ESC_2024", "AHA_2024", "Congress_2024_Q1", "Congress_2024_Q2"],
  },
  "Email Engagement": {
    "Marketo": ["Summer_promotion", "Product_launch_Q1", "Webinar_invite", "Follow_up_campaign"],
    "Salesforce Marketing Cloud": ["Newsletter_monthly", "Product_launch_Q1", "Re_engagement_series"],
    "HubSpot": ["Summer_promotion", "Newsletter_monthly", "Onboarding_drip"],
    "Mailchimp": ["Newsletter_monthly", "Follow_up_campaign"],
  },
  "Web Visit": {
    "Google Analytics": ["Product_page", "Pricing_page", "Case_studies", "Blog_content"],
    "Adobe Analytics": ["Product_page", "Clinical_evidence", "Pricing_page"],
    "Mixpanel": ["Product_page", "Feature_comparison", "Blog_content"],
  },
  "Content Download": {
    "Manual database": ["Whitepaper_2024", "Product_catalog"],
    "Marketo": ["Whitepaper_2024", "Clinical_data_brochure", "ROI_calculator"],
    "HubSpot": ["Product_catalog", "ROI_calculator", "Clinical_data_brochure"],
    "Website CMS": ["Whitepaper_2024", "Product_catalog", "Clinical_data_brochure", "ROI_calculator"],
  },
  "Sales Meeting": {
    "Veeva CRM": ["Initial_meeting", "Follow_up", "Contract_review"],
    "Salesforce": ["Initial_meeting", "Follow_up", "QBR", "Contract_review"],
    "Microsoft Dynamics": ["Initial_meeting", "QBR"],
  },
  "Product Demo Request": {
    "Salesforce": ["WATCHMAN_FLX_demo", "ACURATE_neo2_demo", "General_portfolio"],
    "HubSpot": ["WATCHMAN_FLX_demo", "General_portfolio"],
    "Manual database": ["ACURATE_neo2_demo", "General_portfolio"],
  },
};

// ── Read-only field display ─────────────────────────────────────
function ReadOnlyField({ label, value }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.6px] text-[#616f89]">
        {label}
      </span>
      <span className="text-sm text-[#111318]">{value || "—"}</span>
    </div>
  );
}

// ── Dropdown Component ──────────────────────────────────────────
function Dropdown({ value, options, onChange, placeholder }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-left transition-colors hover:border-[#c4c9d2]"
      >
        <span className={`text-sm ${value ? "text-[#111318]" : "text-[#9ca3af]"}`}>
          {value || placeholder}
        </span>
        <ChevronDownIcon />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-lg border border-[#e5e7eb] bg-white py-1 shadow-lg">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`flex w-full px-3.5 py-2 text-left text-sm transition-colors hover:bg-[#f3f4f6] ${
                  opt === value ? "bg-[#eff6ff] text-[#135bec] font-medium" : "text-[#111318]"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export default function OpportunityCreation() {
  const navigate = useNavigate();
  const { saveOpportunity, getOpportunity } = useOpportunityContext();
  const savedData = getOpportunity();

  const [triggers, setTriggers] = useState(() =>
    savedData ? savedData.triggers : []
  );
  const [operators, setOperators] = useState(() =>
    savedData ? savedData.operators : {}
  );
  const [fromStage, setFromStage] = useState(() =>
    savedData ? savedData.fromStage : "Lead (All)"
  );
  const [toStage] = useState("Opportunity");
  const [saved, setSaved] = useState(!!savedData);

  const getOperator = (index) => operators[index] || "AND";

  const setOperator = (index, value) => {
    setOperators((prev) => ({ ...prev, [index]: value }));
  };

  const removeTrigger = (id) => {
    setTriggers((prev) => prev.filter((t) => t.id !== id));
  };

  const addTrigger = () => {
    const newId = triggers.length > 0 ? Math.max(...triggers.map((t) => t.id)) + 1 : 1;
    setTriggers((prev) => [
      ...prev,
      { id: newId, type: "", condition: "", number: "", source: "", target: "" },
    ]);
  };

  const updateTrigger = (id, field, value) => {
    setTriggers((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (field === "type") {
          return { ...t, type: value, condition: "", source: "", target: "", number: "" };
        }
        if (field === "source") {
          return { ...t, source: value, target: "" };
        }
        return { ...t, [field]: value };
      })
    );
  };

  // Build preview text
  const previewParts = triggers
    .filter((t) => t.type)
    .map((t, i) => {
      let text = t.type;
      if (t.condition) text += ` - ${t.condition}`;
      if (t.number) text += ` ${t.number}`;
      if (t.target) text += ` from ${t.target}`;
      return { text, index: i };
    });

  let previewText = "No triggers defined yet";
  if (previewParts.length > 0) {
    previewText = previewParts
      .map((p, i) => {
        if (i === 0) return p.text;
        const op = getOperator(i - 1);
        return `${op} ${p.text}`;
      })
      .join(" ");
  }

  const handleSave = () => {
    saveOpportunity({ triggers, operators, fromStage, toStage });
    setSaved(true);
  };

  const handleEdit = () => {
    setSaved(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/goal-tracking"
              className="text-[#6a7282] transition-colors hover:text-[#155dfc]"
            >
              Goal tracking
            </Link>
            <span className="text-[#6a7282]">&rsaquo;</span>
            <span className="text-[#101828]">Opportunity creation</span>
          </nav>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">
                Opportunity creation
              </h1>
              <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
                Track the creation of opportunities inside your funnel
              </p>
            </div>

            <div className="flex items-center gap-3">
              {saved ? (
                <button
                  onClick={handleEdit}
                  className="rounded-lg border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      const currentSaved = getOpportunity();
                      if (currentSaved) {
                        setTriggers(currentSaved.triggers);
                        setOperators(currentSaved.operators);
                        setFromStage(currentSaved.fromStage);
                        setSaved(true);
                      } else {
                        navigate("/goal-tracking");
                      }
                    }}
                    className="rounded-lg border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="rounded-lg bg-[#135bec] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1150d4]"
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ═══ Stages Section ═══ */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <StagesIcon />
              <h2 className="text-lg font-bold text-[#111318]">Stages</h2>
            </div>

            <div className="flex items-center gap-6 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
              {/* From Stage */}
              <div className="flex flex-1 flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-[0.6px] text-[#616f89]">
                  From Stage
                </label>
                {saved ? (
                  <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3.5 py-2">
                    <span className="text-sm text-[#111318]">{fromStage}</span>
                  </div>
                ) : (
                  <Dropdown
                    value={fromStage}
                    options={fromStageOptions}
                    onChange={setFromStage}
                    placeholder="Select stage..."
                  />
                )}
              </div>

              {/* Arrow */}
              <div className="pt-5">
                <ArrowRightLongIcon />
              </div>

              {/* To Stage (Goal) */}
              <div className="flex flex-1 flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-[0.6px] text-[#135bec]">
                  To Stage (Goal)
                </label>
                <div className="flex items-center rounded-lg border border-[rgba(19,91,236,0.3)] bg-[rgba(19,91,236,0.05)] px-3.5 py-2">
                  <span className="text-sm font-semibold text-[#135bec]">
                    {toStage}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Conversion Triggers Section ═══ */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <ConversionTriggersIcon />
              <h2 className="text-lg font-bold text-[#111318]">
                Conversion Triggers
              </h2>
            </div>

            <div className="relative flex flex-col gap-4">
              {/* Vertical connector line */}
              {triggers.length > 1 && (
                <div
                  className="absolute left-[19px] top-10 w-0.5 bg-[#e2e8f0]"
                  style={{ bottom: "40px" }}
                />
              )}

              {/* ── Empty State (edit mode only) ── */}
              {triggers.length === 0 && !saved && (
                <div className="flex items-start gap-4">
                  <div className="w-10" />
                  <div className="flex flex-1 flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#e2e8f0] bg-white py-12 px-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9]">
                      <ConversionTriggersIcon />
                    </div>
                    <p className="text-sm font-medium text-[#616f89]">
                      No conversion triggers defined yet
                    </p>
                    <p className="text-xs text-[#9ca3af]">
                      Add trigger logic to define when a lead converts to an opportunity
                    </p>
                    <button
                      onClick={addTrigger}
                      className="mt-2 flex items-center gap-2 rounded-lg bg-[#135bec] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1150d4]"
                    >
                      <span className="text-white">
                        <PlusSmallIcon />
                      </span>
                      Add First Trigger
                    </button>
                  </div>
                </div>
              )}

              {/* ── Empty State (saved mode) ── */}
              {triggers.length === 0 && saved && (
                <div className="flex items-start gap-4">
                  <div className="w-10" />
                  <div className="flex flex-1 flex-col items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white py-12 px-6">
                    <p className="text-sm text-[#9ca3af]">
                      No conversion triggers configured
                    </p>
                  </div>
                </div>
              )}

              {/* ── Trigger Cards ── */}
              {triggers.map((trigger, index) => (
                <div key={trigger.id}>
                  <div className="flex items-start gap-4">
                    {/* Number badge */}
                    <div className="flex flex-col items-start pt-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#e2e8f0] bg-white">
                        <span className="text-[10px] font-black text-[#111318]">
                          {index + 1}
                        </span>
                      </div>
                    </div>

                    {/* Card */}
                    <div className="flex flex-1 flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                      {saved ? (
                        /* ── Read-only view ── */
                        <>
                          <ReadOnlyField label="Type" value={trigger.type} />
                          {trigger.type && (
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                              <ReadOnlyField label="Condition" value={trigger.condition} />
                              <ReadOnlyField label="Number" value={trigger.number ? `${trigger.number} min` : ""} />
                              <ReadOnlyField label="Source" value={trigger.source} />
                              <ReadOnlyField label="Target" value={trigger.target} />
                            </div>
                          )}
                        </>
                      ) : (
                        /* ── Edit view ── */
                        <>
                          {/* Type — always visible */}
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-[0.6px] text-[#616f89]">
                              Type
                            </label>
                            <Dropdown
                              value={trigger.type}
                              options={typeOptions}
                              onChange={(val) => updateTrigger(trigger.id, "type", val)}
                              placeholder="Select type..."
                            />
                          </div>

                          {/* Condition, Number, Source, Target */}
                          {trigger.type && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold uppercase tracking-[0.6px] text-[#616f89]">
                                    Condition
                                  </label>
                                  <Dropdown
                                    value={trigger.condition}
                                    options={conditionsByType[trigger.type] || []}
                                    onChange={(val) => updateTrigger(trigger.id, "condition", val)}
                                    placeholder="Select..."
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold uppercase tracking-[0.6px] text-[#616f89]">
                                    Number
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={trigger.number}
                                      onChange={(e) =>
                                        updateTrigger(trigger.id, "number", e.target.value)
                                      }
                                      placeholder="0"
                                      className="w-full rounded-lg border border-[#e5e7eb] bg-white py-2 pl-3.5 pr-10 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#616f89]">
                                      min
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold uppercase tracking-[0.6px] text-[#616f89]">
                                    Source
                                  </label>
                                  <Dropdown
                                    value={trigger.source}
                                    options={sourcesByType[trigger.type] || []}
                                    onChange={(val) => updateTrigger(trigger.id, "source", val)}
                                    placeholder="Select source..."
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold uppercase tracking-[0.6px] text-[#616f89]">
                                    Target
                                  </label>
                                  <Dropdown
                                    value={trigger.target}
                                    options={
                                      trigger.source && targetsBySource[trigger.type]
                                        ? targetsBySource[trigger.type][trigger.source] || []
                                        : []
                                    }
                                    onChange={(val) => updateTrigger(trigger.id, "target", val)}
                                    placeholder={trigger.source ? "Select target..." : "Select source first"}
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {/* Delete trigger */}
                          <button
                            onClick={() => removeTrigger(trigger.id)}
                            className="flex items-center gap-1 self-start text-sm font-semibold text-[#dc2626] transition-colors hover:text-[#b91c1c]"
                          >
                            Delete trigger
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* AND/OR operator between triggers */}
                  {index < triggers.length - 1 && (
                    <div className="flex justify-center pl-10 py-1">
                      {saved ? (
                        <span className="rounded-full bg-[#135bec] px-4 py-1 text-xs font-bold text-white shadow-sm">
                          {getOperator(index)}
                        </span>
                      ) : (
                        <div className="flex items-center rounded-full border border-[#e2e8f0] bg-[#f1f5f9] p-[5px]">
                          <button
                            onClick={() => setOperator(index, "AND")}
                            className={`rounded-full px-4 py-1 text-xs font-bold transition-colors ${
                              getOperator(index) === "AND"
                                ? "bg-[#135bec] text-white shadow-sm"
                                : "text-[#616f89]"
                            }`}
                          >
                            AND
                          </button>
                          <button
                            onClick={() => setOperator(index, "OR")}
                            className={`rounded-full px-4 py-1 text-xs font-bold transition-colors ${
                              getOperator(index) === "OR"
                                ? "bg-[#135bec] text-white shadow-sm"
                                : "text-[#616f89]"
                            }`}
                          >
                            OR
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add Trigger Logic button (edit mode only) */}
              {triggers.length > 0 && !saved && (
                <div className="pl-14 pt-2">
                  <button
                    onClick={addTrigger}
                    className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#cbd5e1] px-[18px] py-2.5 transition-colors hover:border-[#94a3b8] hover:bg-gray-50"
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 11 11"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5.5 0.5V10.5"
                        stroke="#616f89"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M0.5 5.5H10.5"
                        stroke="#616f89"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-[#616f89]">
                      Add Trigger Logic
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ═══ Preview Section ═══ */}
          <div className="flex flex-col gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-[17px] pb-4 pt-[17px]">
            <span className="text-xs font-medium text-[#4a5565]">Preview</span>
            <p className="text-sm font-medium text-[#0a0a0a]">
              {previewText}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
