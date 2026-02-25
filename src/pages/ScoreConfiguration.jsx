import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { SearchIcon20, CloseIcon } from "../components/icons";

/* ── Conversion goal options ──────────────────────────────────── */
const conversionGoals = [
  { id: "deal_created", label: "Deal created", description: "A new deal is created in the CRM pipeline" },
  { id: "deal_won", label: "Deal won", description: "A deal is marked as closed/won" },
  { id: "opportunity_created", label: "Opportunity created", description: "A new sales opportunity is generated" },
  { id: "mql_conversion", label: "MQL conversion", description: "A lead converts to Marketing Qualified Lead" },
  { id: "sql_conversion", label: "SQL conversion", description: "A lead converts to Sales Qualified Lead" },
];

/* ── Audience filter options ──────────────────────────────────── */
const filterFields = [
  { id: "exists_in_crm", label: "Exists in CRM", type: "boolean" },
  { id: "deal_won_last_2y", label: "Deal won (last 2 years)", type: "boolean" },
  { id: "deal_lost_last_2y", label: "Deal lost (last 2 years)", type: "boolean" },
  { id: "industry", label: "Industry", type: "multi-select", options: ["Banking", "Media", "Technology", "Healthcare", "Pharma", "Retail", "Insurance", "Energy", "Manufacturing", "Telecom"] },
  { id: "company_size", label: "Company size", type: "select", options: ["1-50", "51-200", "201-1000", "1001-5000", "5000+"] },
  { id: "geography", label: "Geography", type: "multi-select", options: ["North America", "Europe", "APAC", "LATAM", "MEA", "UK", "DACH", "France", "Italy", "Spain"] },
  { id: "has_active_contract", label: "Has active contract", type: "boolean" },
  { id: "engagement_score_above", label: "Engagement score above", type: "number" },
];

/* ── Behavior metrics (Intent through Actions) ────────────────── */
const behaviorMetrics = [
  { id: "page_visits", name: "Website page visits & time spent", description: "Tracks page views, session duration and browsing depth" },
  { id: "content_downloads", name: "Content downloads", description: "Whitepapers, case studies, brochures and technical documentation" },
  { id: "email_engagement", name: "Email opens & clicks", description: "Email open rate, click-through rate and engagement patterns" },
  { id: "webinar_attendance", name: "Webinar attendance", description: "Registration and attendance at live or on-demand webinars" },
  { id: "demo_requests", name: "Demo requests", description: "Requests for product demos or trials" },
  { id: "pricing_page", name: "Pricing page visits", description: "Visits to pricing, plans or quote pages indicating purchase intent" },
];

/* ── Fit score source/object/field options ─────────────────────── */
const fitSources = ["Salesforce", "Veeva CRM", "HubSpot", "SAP", "Manual database"];
const fitObjectsBySource = {
  Salesforce: ["Account", "Contact", "Lead", "Opportunity", "Custom_Object__c"],
  "Veeva CRM": ["Account", "Contact", "Lead__c", "HCP_Profile__c"],
  HubSpot: ["Company", "Contact", "Deal"],
  SAP: ["Business_Partner", "Customer_Master", "Sales_Org"],
  "Manual database": ["Company_Registry", "HCP_Registry", "Account_Data"],
};
const fitFieldsByObject = {
  Account: ["Industry", "Revenue", "Employee_Count", "Region", "Tier__c", "Account_Score__c", "Technology_Stack__c"],
  Contact: ["Title", "Seniority__c", "Department", "Budget_Authority__c", "Decision_Maker__c"],
  Lead: ["Company_Size__c", "Industry", "LeadSource", "Rating", "Annual_Revenue__c"],
  "Lead__c": ["Company_Size__c", "Industry__c", "Source__c", "Rating__c"],
  Opportunity: ["Amount", "StageName", "Type", "Probability"],
  "Custom_Object__c": ["Score__c", "Fit_Rating__c", "Tier__c"],
  "HCP_Profile__c": ["Specialty__c", "Tier__c", "Prescribing_Volume__c", "KOL_Status__c"],
  Company: ["Industry", "Annual_Revenue", "Number_of_Employees", "Country"],
  Deal: ["Amount", "Pipeline", "Stage", "Close_Date"],
  Business_Partner: ["Industry_Code", "Revenue_Range", "Partner_Type"],
  Customer_Master: ["Industry", "Credit_Limit", "Sales_District"],
  Sales_Org: ["Region", "Division", "Distribution_Channel"],
  Company_Registry: ["Industry", "Revenue_Bracket", "Employee_Range", "Region"],
  HCP_Registry: ["Specialty", "Tier", "Prescribing_Score", "Institution_Type"],
  Account_Data: ["Segment", "Annual_Value", "Risk_Level", "Potential_Score"],
};

/* ── Component ──────────────────────────────────────────────────── */
export default function ScoreConfiguration() {
  const [scores, setScores] = useState([]); // array of saved score configs

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  // 1=type, 2=name+desc, 3=conversion goal, 4=audience filters,
  // 5=fit scoring (source/object/field), 6=behavior score, 7=review

  const [scoreType, setScoreType] = useState(null);
  const [scoreName, setScoreName] = useState("");
  const [scoreDescription, setScoreDescription] = useState("");
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Audience filters
  const [audienceFilters, setAudienceFilters] = useState([]);

  // Fit score - source/object/field rows
  const [fitRows, setFitRows] = useState([]);

  // Behavior score metrics + weights
  const [selectedBehavior, setSelectedBehavior] = useState([]);
  const [metricSearch, setMetricSearch] = useState("");

  // Category weights
  const [behaviorCategoryWeight, setBehaviorCategoryWeight] = useState(50);
  const [fitCategoryWeight, setFitCategoryWeight] = useState(50);

  // Expanded card
  const [expandedCard, setExpandedCard] = useState(null);

  const stepLabels = ["Score type", "Details", "Conversion goal", "Audience filters", "Fit score", "Behavior score", "Review"];
  const totalSteps = 7;

  const resetWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setScoreType(null);
    setScoreName("");
    setScoreDescription("");
    setSelectedGoal(null);
    setAudienceFilters([]);
    setFitRows([]);
    setSelectedBehavior([]);
    setMetricSearch("");
    setBehaviorCategoryWeight(50);
    setFitCategoryWeight(50);
  };

  // ── Audience filter helpers ────────────────────────────────────
  const addAudienceFilter = () => {
    setAudienceFilters((prev) => [...prev, { id: Date.now(), fieldId: "", operator: "is", value: "" }]);
  };
  const updateAudienceFilter = (id, key, val) => {
    setAudienceFilters((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: val } : f)));
  };
  const removeAudienceFilter = (id) => {
    setAudienceFilters((prev) => prev.filter((f) => f.id !== id));
  };

  // ── Fit row helpers ────────────────────────────────────────────
  const addFitRow = () => {
    setFitRows((prev) => [...prev, { id: Date.now(), source: "", object: "", field: "", weight: 0 }]);
  };
  const updateFitRow = (id, key, val) => {
    setFitRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (key === "source") return { ...r, source: val, object: "", field: "", weight: r.weight };
        if (key === "object") return { ...r, object: val, field: "", weight: r.weight };
        if (key === "weight") return { ...r, weight: Math.max(0, Math.min(100, parseInt(val) || 0)) };
        return { ...r, [key]: val };
      })
    );
  };
  const removeFitRow = (id) => {
    setFitRows((prev) => prev.filter((r) => r.id !== id));
  };
  const distributeFitEvenly = () => {
    const count = fitRows.length;
    if (!count) return;
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;
    setFitRows((prev) => prev.map((r, i) => ({ ...r, weight: base + (i < remainder ? 1 : 0) })));
  };
  const fitTotal = fitRows.reduce((s, r) => s + r.weight, 0);

  // ── Behavior metric helpers ────────────────────────────────────
  const toggleBehaviorMetric = (metric) => {
    setSelectedBehavior((prev) => {
      const exists = prev.find((m) => m.id === metric.id);
      if (exists) return prev.filter((m) => m.id !== metric.id);
      return [...prev, { ...metric, weight: 0 }];
    });
  };
  const updateBehaviorWeight = (id, w) => {
    setSelectedBehavior((prev) =>
      prev.map((m) => (m.id === id ? { ...m, weight: Math.max(0, Math.min(100, w)) } : m))
    );
  };
  const distributeBehaviorEvenly = () => {
    const count = selectedBehavior.length;
    if (!count) return;
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;
    setSelectedBehavior((prev) => prev.map((m, i) => ({ ...m, weight: base + (i < remainder ? 1 : 0) })));
  };
  const behaviorTotal = selectedBehavior.reduce((s, m) => s + m.weight, 0);

  const handleSaveScore = () => {
    const scoreData = {
      id: Date.now(),
      type: scoreType,
      name: scoreName,
      description: scoreDescription,
      goal: conversionGoals.find((g) => g.id === selectedGoal),
      audienceFilters,
      fitRows,
      behaviorMetrics: selectedBehavior,
      behaviorWeight: behaviorCategoryWeight,
      fitWeight: fitCategoryWeight,
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setScores((prev) => [...prev, scoreData]);
    resetWizard();
  };

  const handleDeleteScore = (scoreId) => {
    setScores((prev) => prev.filter((s) => s.id !== scoreId));
    setExpandedCard(null);
  };

  const canProceed = () => {
    if (wizardStep === 1) return !!scoreType;
    if (wizardStep === 2) return scoreName.trim().length > 0;
    if (wizardStep === 3) return !!selectedGoal;
    if (wizardStep === 4) return true; // filters are optional
    if (wizardStep === 5) return fitRows.length > 0 && fitTotal === 100 && fitRows.every((r) => r.source && r.object && r.field);
    if (wizardStep === 6) return selectedBehavior.length > 0 && behaviorTotal === 100;
    return true;
  };

  /* ── Render a configured score card ────────────────────────────── */
  const renderScoreCard = (score) => {
    const isExpanded = expandedCard === score.id;
    const typeLabel = score.type === "hcp" ? "HCP" : "Account";

    return (
      <div key={score.id} className="flex flex-col overflow-hidden rounded-[14px] border border-gray-200 bg-white transition-shadow hover:shadow-sm">
        <button onClick={() => setExpandedCard(isExpanded ? null : score.id)} className="flex items-center justify-between px-6 py-5 text-left">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-semibold text-[#0a0a0a]">{score.name}</h3>
              <span className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[#dbeafe] text-[#2563eb]">{typeLabel}</span>
              <span className="flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#16a34a]">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Configured
              </span>
            </div>
            {score.description && <p className="text-sm text-[#6a7282]">{score.description}</p>}
            <p className="text-xs text-[#9ca3af]">
              Goal: {score.goal.label} · {score.behaviorMetrics.length} behavior + {score.fitRows.length} fit signals · {score.behaviorWeight}% / {score.fitWeight}% split
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs text-[#9ca3af]">Created</span>
              <span className="text-sm text-[#4a5565]">{score.createdAt}</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={`text-[#6a7282] transition-transform ${isExpanded ? "rotate-180" : ""}`}>
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>

        {isExpanded && (
          <div className="border-t border-gray-200 px-6 py-5">
            <div className="flex gap-8">
              <div className="flex flex-1 flex-col gap-6">
                {/* Category split */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-[#eff6ff] px-3 py-1.5">
                    <span className="text-xs font-semibold text-[#155dfc]">Behavior</span>
                    <span className="text-xs font-bold text-[#155dfc]">{score.behaviorWeight}%</span>
                  </div>
                  <div className="h-2 flex-1 rounded-full bg-[#e5e7eb] overflow-hidden">
                    <div className="h-full bg-[#155dfc] rounded-full" style={{ width: `${score.behaviorWeight}%` }} />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-[#f0fdf4] px-3 py-1.5">
                    <span className="text-xs font-semibold text-[#16a34a]">Fit</span>
                    <span className="text-xs font-bold text-[#16a34a]">{score.fitWeight}%</span>
                  </div>
                </div>

                {/* Audience filters */}
                {score.audienceFilters.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Audience filters</p>
                    <div className="flex flex-wrap gap-2">
                      {score.audienceFilters.map((f) => {
                        const field = filterFields.find((ff) => ff.id === f.fieldId);
                        return (
                          <span key={f.id} className="rounded-lg bg-[#f3f4f6] px-2.5 py-1 text-xs text-[#4a5565]">
                            {field?.label || f.fieldId} {f.operator} <strong>{f.value || "true"}</strong>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Behavior metrics */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#155dfc]">Behavior score metrics</p>
                  {score.behaviorMetrics.map((m) => (
                    <div key={m.id} className="flex items-center gap-4">
                      <span className="w-[220px] text-sm font-medium text-[#0a0a0a]">{m.name}</span>
                      <div className="relative h-2 flex-1 rounded-full bg-[#f3f4f6]"><div className="h-full rounded-full bg-[#155dfc]" style={{ width: `${m.weight}%` }} /></div>
                      <span className="w-[40px] text-right text-sm font-semibold text-[#0a0a0a]">{m.weight}%</span>
                    </div>
                  ))}
                </div>

                {/* Fit signals */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#16a34a]">Fit score signals</p>
                  {score.fitRows.map((r) => (
                    <div key={r.id} className="flex items-center gap-4">
                      <span className="w-[220px] text-sm font-medium text-[#0a0a0a] truncate">{r.source} → {r.object}.{r.field}</span>
                      <div className="relative h-2 flex-1 rounded-full bg-[#f3f4f6]"><div className="h-full rounded-full bg-[#16a34a]" style={{ width: `${r.weight}%` }} /></div>
                      <span className="w-[40px] text-right text-sm font-semibold text-[#0a0a0a]">{r.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex w-[200px] shrink-0 flex-col gap-4 rounded-[10px] bg-[#f9fafb] p-4">
                <div className="flex flex-col gap-1"><span className="text-xs text-[#9ca3af]">Type</span><span className="text-sm font-medium text-[#0a0a0a]">{typeLabel}</span></div>
                <div className="flex flex-col gap-1"><span className="text-xs text-[#9ca3af]">Conversion goal</span><span className="text-sm font-medium text-[#0a0a0a]">{score.goal.label}</span></div>
                <div className="flex flex-col gap-1"><span className="text-xs text-[#9ca3af]">Audience filters</span><span className="text-sm font-medium text-[#0a0a0a]">{score.audienceFilters.length}</span></div>
                <div className="flex flex-col gap-1"><span className="text-xs text-[#9ca3af]">Score split</span><span className="text-sm font-medium text-[#0a0a0a]">{score.behaviorWeight}% / {score.fitWeight}%</span></div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => handleDeleteScore(score.id)} className="rounded-[10px] border border-[#fca5a5] bg-white px-4 py-2 text-sm font-medium text-[#dc2626] transition-colors hover:bg-red-50">Delete</button>
              <button className="rounded-[10px] bg-[#101828] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d2939]">Edit</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── Render radio option ────────────────────────────────────── */
  const renderRadioOption = (isSelected, onClick, label, desc, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between rounded-[12px] border-2 px-5 py-4 text-left transition-all ${
        disabled ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
          : isSelected ? "border-[#155dfc] bg-[#eff6ff]"
          : "border-[#e5e7eb] hover:border-[#d1d5dc] hover:bg-[#f9fafb]"
      }`}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-[#0a0a0a]">{label}</span>
        <span className="text-xs text-[#6a7282]">{desc}</span>
      </div>
      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? "border-[#155dfc] bg-[#155dfc]" : "border-[#d1d5dc]"}`}>
        {isSelected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="2.5" fill="white"/></svg>}
      </div>
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/leading-board" className="text-[#6a7282] transition-colors hover:text-[#155dfc]">Leading board</Link>
            <span className="text-[#6a7282]">/</span>
            <span className="text-[#101828]">Score configuration</span>
          </nav>

          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">Score configuration</h1>
            <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
              Define and manage the scoring models used to rank HCPs and accounts. Each score combines a behavior score (intent through actions) with a fit score (lead qualification).
            </p>
          </div>

          {/* Saved scores */}
          {scores.length > 0 && (
            <div className="flex flex-col gap-3">
              {scores.map((score) => renderScoreCard(score))}
            </div>
          )}

          {/* Single placeholder CTA */}
          <div className="flex flex-col items-center gap-4 rounded-[14px] border-2 border-dashed border-[#d1d5dc] bg-white py-12 px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f4f6]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                <path d="M5 12H19" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex flex-col items-center gap-1">
              <h3 className="text-base font-semibold text-[#0a0a0a]">Configure a new score</h3>
              <p className="max-w-[460px] text-center text-sm text-[#6a7282]">
                Create an HCP or Account score that combines behavioral intent signals with fit qualification criteria to prioritize your pipeline.
              </p>
            </div>
            <button
              onClick={() => { setWizardStep(1); setShowWizard(true); }}
              className="rounded-[10px] border border-[#d1d5dc] bg-transparent px-5 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-[#f3f4f6]"
            >
              Configure score
            </button>
          </div>
        </div>
      </main>

      {/* ── Wizard Modal ──────────────────────────────────────────── */}
      {showWizard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="mx-4 flex w-full max-w-[820px] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-lg font-semibold text-[#0a0a0a]">
                  {scoreType ? `Configure ${scoreType === "hcp" ? "HCP" : "Account"} score` : "Configure score"}
                </h2>
                <p className="text-xs text-[#6a7282]">Step {wizardStep} of {totalSteps} — {stepLabels[wizardStep - 1]}</p>
              </div>
              <button onClick={resetWizard} className="rounded-full p-1 transition-colors hover:bg-gray-100"><CloseIcon /></button>
            </div>

            {/* Steps bar */}
            <div className="flex gap-1 px-6 pt-4">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < wizardStep ? "bg-[#155dfc]" : "bg-[#e5e7eb]"}`} />
              ))}
            </div>

            {/* Body */}
            <div className="flex flex-col gap-5 px-6 py-5 max-h-[70vh] overflow-y-auto">

              {/* Step 1: Score type */}
              {wizardStep === 1 && (
                <>
                  <p className="text-sm text-[#4a5565]">What type of score would you like to configure?</p>
                  <div className="flex flex-col gap-3">
                    {renderRadioOption(scoreType === "hcp", () => setScoreType("hcp"), "HCP Score", "Score individual Healthcare Professionals based on engagement and profile fit")}
                    {renderRadioOption(scoreType === "account", () => setScoreType("account"), "Account Score", "Score institutional accounts based on organizational engagement and qualification")}
                  </div>
                </>
              )}

              {/* Step 2: Name & description */}
              {wizardStep === 2 && (
                <>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-[#0a0a0a]">Name your score</p>
                    <p className="text-xs text-[#6a7282]">Give this score a recognizable name and an optional description.</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#0a0a0a]">Score name</label>
                    <input type="text" placeholder="e.g. HCP Engagement Score" value={scoreName} onChange={(e) => setScoreName(e.target.value)}
                      className="rounded-[10px] border border-[#d1d5dc] px-4 py-2.5 text-sm text-[#0a0a0a] placeholder:text-[#99a1af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#0a0a0a]">Description <span className="text-[#9ca3af] font-normal">(optional)</span></label>
                    <textarea placeholder="Describe what this score measures..." value={scoreDescription} onChange={(e) => setScoreDescription(e.target.value)} rows={3}
                      className="resize-none rounded-[10px] border border-[#d1d5dc] px-4 py-2.5 text-sm text-[#0a0a0a] placeholder:text-[#99a1af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
                  </div>
                </>
              )}

              {/* Step 3: Conversion goal */}
              {wizardStep === 3 && (
                <>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-[#0a0a0a]">Define conversion goal</p>
                    <p className="text-xs text-[#6a7282]">Select the primary conversion event this score should optimize for.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {conversionGoals.map((goal) => renderRadioOption(selectedGoal === goal.id, () => setSelectedGoal(goal.id), goal.label, goal.description))}
                  </div>
                </>
              )}

              {/* Step 4: Audience filters */}
              {wizardStep === 4 && (
                <>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-[#0a0a0a]">Apply audience filters</p>
                    <p className="text-xs text-[#6a7282]">Narrow the selection of {scoreType === "hcp" ? "HCPs" : "accounts"} this score applies to. Filters are optional.</p>
                  </div>

                  {audienceFilters.map((filter) => {
                    const fieldDef = filterFields.find((f) => f.id === filter.fieldId);
                    return (
                      <div key={filter.id} className="flex items-center gap-3 rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb] p-3">
                        <select
                          value={filter.fieldId}
                          onChange={(e) => updateAudienceFilter(filter.id, "fieldId", e.target.value)}
                          className="flex-1 rounded-lg border border-[#d1d5dc] bg-white px-3 py-2 text-sm text-[#0a0a0a] focus:border-[#155dfc] focus:outline-none"
                        >
                          <option value="">Select field...</option>
                          {filterFields.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>

                        {fieldDef?.type === "boolean" ? (
                          <select
                            value={filter.value || "true"}
                            onChange={(e) => updateAudienceFilter(filter.id, "value", e.target.value)}
                            className="w-[120px] rounded-lg border border-[#d1d5dc] bg-white px-3 py-2 text-sm text-[#0a0a0a] focus:border-[#155dfc] focus:outline-none"
                          >
                            <option value="true">is true</option>
                            <option value="false">is false</option>
                          </select>
                        ) : fieldDef?.type === "select" || fieldDef?.type === "multi-select" ? (
                          <select
                            value={filter.value}
                            onChange={(e) => updateAudienceFilter(filter.id, "value", e.target.value)}
                            className="flex-1 rounded-lg border border-[#d1d5dc] bg-white px-3 py-2 text-sm text-[#0a0a0a] focus:border-[#155dfc] focus:outline-none"
                          >
                            <option value="">Select value...</option>
                            {fieldDef.options.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            type={fieldDef?.type === "number" ? "number" : "text"}
                            value={filter.value}
                            onChange={(e) => updateAudienceFilter(filter.id, "value", e.target.value)}
                            placeholder="Value..."
                            className="flex-1 rounded-lg border border-[#d1d5dc] bg-white px-3 py-2 text-sm text-[#0a0a0a] placeholder:text-[#99a1af] focus:border-[#155dfc] focus:outline-none"
                          />
                        )}

                        <button onClick={() => removeAudienceFilter(filter.id)} className="shrink-0 p-1 text-[#6a7282] hover:text-[#dc2626]">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    );
                  })}

                  <button onClick={addAudienceFilter} className="flex items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-[#d1d5dc] px-4 py-3 transition-colors hover:border-[#9ca3af] hover:bg-gray-50">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2V12" stroke="#6a7282" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 7H12" stroke="#6a7282" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span className="text-sm font-medium text-[#6a7282]">Add filter</span>
                  </button>
                </>
              )}

              {/* Step 5: Fit score - source/object/field */}
              {wizardStep === 5 && (
                <>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-[#16a34a]" />
                      <p className="text-sm font-medium text-[#0a0a0a]">Fit Score — Lead Qualification</p>
                    </div>
                    <p className="text-xs text-[#6a7282]">
                      Define where the system finds fit data. For each signal, select the source system, object, and field, then assign a weight. Weights must total 100%.
                    </p>
                  </div>

                  {fitRows.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[#0a0a0a]">Fit signals ({fitRows.length})</p>
                        <div className="flex items-center gap-3">
                          <button onClick={distributeFitEvenly} className="rounded-lg border border-[#d1d5dc] px-3 py-1 text-xs font-medium text-[#4a5565] hover:bg-gray-50">Distribute evenly</button>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${fitTotal === 100 ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fef9c3] text-[#a16207]"}`}>Total: {fitTotal}%</span>
                        </div>
                      </div>

                      {fitRows.map((row) => {
                        const objects = row.source ? (fitObjectsBySource[row.source] || []) : [];
                        const fields = row.object ? (fitFieldsByObject[row.object] || []) : [];
                        return (
                          <div key={row.id} className="flex items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb] p-3">
                            <select value={row.source} onChange={(e) => updateFitRow(row.id, "source", e.target.value)}
                              className="w-[140px] rounded-lg border border-[#d1d5dc] bg-white px-2 py-1.5 text-xs text-[#0a0a0a] focus:border-[#155dfc] focus:outline-none">
                              <option value="">Source...</option>
                              {fitSources.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select value={row.object} onChange={(e) => updateFitRow(row.id, "object", e.target.value)}
                              className="w-[140px] rounded-lg border border-[#d1d5dc] bg-white px-2 py-1.5 text-xs text-[#0a0a0a] focus:border-[#155dfc] focus:outline-none">
                              <option value="">Object...</option>
                              {objects.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                            <select value={row.field} onChange={(e) => updateFitRow(row.id, "field", e.target.value)}
                              className="flex-1 rounded-lg border border-[#d1d5dc] bg-white px-2 py-1.5 text-xs text-[#0a0a0a] focus:border-[#155dfc] focus:outline-none">
                              <option value="">Field...</option>
                              {fields.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <div className="flex w-[72px] items-center gap-1">
                              <input type="number" min={0} max={100} value={row.weight} onChange={(e) => updateFitRow(row.id, "weight", e.target.value)}
                                className="w-[48px] rounded-lg border border-[#d1d5dc] px-2 py-1 text-center text-xs text-[#0a0a0a] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
                              <span className="text-xs text-[#6a7282]">%</span>
                            </div>
                            <button onClick={() => removeFitRow(row.id)} className="shrink-0 p-1 text-[#6a7282] hover:text-[#dc2626]">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2L10 10M2 10L10 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button onClick={addFitRow} className="flex items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-[#d1d5dc] px-4 py-3 transition-colors hover:border-[#9ca3af] hover:bg-gray-50">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2V12" stroke="#6a7282" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 7H12" stroke="#6a7282" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span className="text-sm font-medium text-[#6a7282]">Add fit signal</span>
                  </button>
                </>
              )}

              {/* Step 6: Behavior score */}
              {wizardStep === 6 && (() => {
                const q = metricSearch.trim().toLowerCase();
                const available = behaviorMetrics.filter((m) => !selectedBehavior.find((s) => s.id === m.id));
                const filtered = q ? available.filter((m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)) : available;
                return (
                  <>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-[#155dfc]" />
                        <p className="text-sm font-medium text-[#0a0a0a]">Behavior Score — Intent through Actions</p>
                      </div>
                      <p className="text-xs text-[#6a7282]">Measures what prospects actually do — their digital footprint and engagement patterns. Select signals and assign weights totaling 100%.</p>
                    </div>

                    {selectedBehavior.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-[#0a0a0a]">Selected ({selectedBehavior.length})</p>
                          <div className="flex items-center gap-3">
                            <button onClick={distributeBehaviorEvenly} className="rounded-lg border border-[#d1d5dc] px-3 py-1 text-xs font-medium text-[#4a5565] hover:bg-gray-50">Distribute evenly</button>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${behaviorTotal === 100 ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fef9c3] text-[#a16207]"}`}>Total: {behaviorTotal}%</span>
                          </div>
                        </div>
                        {selectedBehavior.map((m) => (
                          <div key={m.id} className="flex items-center gap-3">
                            <button onClick={() => toggleBehaviorMetric(m)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#d1d5dc] text-[#dc2626] hover:bg-red-50 hover:border-[#fca5a5]">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            </button>
                            <span className="w-[200px] text-sm font-medium text-[#0a0a0a] truncate">{m.name}</span>
                            <div className="relative h-2 flex-1 rounded-full bg-[#e5e7eb]"><div className="h-full rounded-full bg-[#155dfc] transition-all" style={{ width: `${m.weight}%` }} /></div>
                            <div className="flex w-[72px] items-center gap-1">
                              <input type="number" min={0} max={100} value={m.weight} onChange={(e) => updateBehaviorWeight(m.id, parseInt(e.target.value) || 0)}
                                className="w-[52px] rounded-lg border border-[#d1d5dc] px-2 py-1 text-center text-sm text-[#0a0a0a] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
                              <span className="text-sm text-[#6a7282]">%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Available metrics</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"><SearchIcon20 /></span>
                        <input type="text" placeholder="Search metrics..." value={metricSearch} onChange={(e) => setMetricSearch(e.target.value)}
                          className="w-full rounded-[10px] border border-[#d1d5dc] bg-white py-2 pl-10 pr-4 text-sm text-[#0a0a0a] placeholder:text-[#99a1af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
                      </div>
                      <div className="flex max-h-[220px] flex-col gap-1 overflow-y-auto">
                        {filtered.length === 0 && <p className="px-4 py-3 text-sm text-[#9ca3af]">No metrics found.</p>}
                        {filtered.map((metric) => (
                          <button key={metric.id} onClick={() => toggleBehaviorMetric(metric)} className="flex items-center justify-between rounded-[10px] px-4 py-3 text-left transition-colors hover:bg-[#f9fafb]">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium text-[#0a0a0a]">{metric.name}</span>
                              <span className="text-xs text-[#6a7282]">{metric.description}</span>
                            </div>
                            <div className="flex h-5 w-5 items-center justify-center rounded border border-[#d1d5dc]">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2V8" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 5H8" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Step 7: Review */}
              {wizardStep === 7 && (
                <>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-[#0a0a0a]">Review your score configuration</p>
                    <p className="text-xs text-[#6a7282]">Adjust the overall weight split between behavior and fit, then confirm.</p>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-1 flex-col gap-1 rounded-[10px] bg-[#f9fafb] p-4">
                      <span className="text-xs text-[#9ca3af]">Score name</span>
                      <p className="text-sm font-semibold text-[#0a0a0a]">{scoreName}</p>
                      {scoreDescription && <p className="text-xs text-[#6a7282]">{scoreDescription}</p>}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 rounded-[10px] bg-[#f9fafb] p-4">
                      <span className="text-xs text-[#9ca3af]">Conversion goal</span>
                      <p className="text-sm font-semibold text-[#0a0a0a]">{conversionGoals.find((g) => g.id === selectedGoal)?.label}</p>
                    </div>
                  </div>

                  {audienceFilters.length > 0 && (
                    <div className="rounded-[10px] bg-[#f9fafb] p-4">
                      <span className="text-xs text-[#9ca3af]">Audience filters ({audienceFilters.length})</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {audienceFilters.map((f) => {
                          const field = filterFields.find((ff) => ff.id === f.fieldId);
                          return <span key={f.id} className="rounded bg-white px-2 py-0.5 text-xs text-[#4a5565] border border-[#e5e7eb]">{field?.label} = {f.value || "true"}</span>;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Weight split */}
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Score category weight split</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-[#155dfc]" /><span className="text-sm font-medium text-[#0a0a0a]">Behavior</span></div>
                      <input type="range" min={10} max={90} value={behaviorCategoryWeight}
                        onChange={(e) => { const v = parseInt(e.target.value); setBehaviorCategoryWeight(v); setFitCategoryWeight(100 - v); }}
                        className="flex-1 accent-[#155dfc]" />
                      <div className="flex items-center gap-2"><span className="text-sm font-medium text-[#0a0a0a]">Fit</span><div className="h-3 w-3 rounded-sm bg-[#16a34a]" /></div>
                    </div>
                    <div className="flex justify-between">
                      <span className="rounded-lg bg-[#eff6ff] px-3 py-1 text-sm font-bold text-[#155dfc]">{behaviorCategoryWeight}%</span>
                      <span className="rounded-lg bg-[#f0fdf4] px-3 py-1 text-sm font-bold text-[#16a34a]">{fitCategoryWeight}%</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-1 flex-col gap-2 rounded-[10px] border border-[#dbeafe] bg-[#eff6ff] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#155dfc]">Behavior metrics ({selectedBehavior.length})</p>
                      {selectedBehavior.map((m) => (
                        <div key={m.id} className="flex items-center justify-between"><span className="text-xs text-[#0a0a0a]">{m.name}</span><span className="text-xs font-semibold text-[#155dfc]">{m.weight}%</span></div>
                      ))}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#16a34a]">Fit signals ({fitRows.length})</p>
                      {fitRows.map((r) => (
                        <div key={r.id} className="flex items-center justify-between"><span className="text-xs text-[#0a0a0a] truncate">{r.object}.{r.field}</span><span className="text-xs font-semibold text-[#16a34a]">{r.weight}%</span></div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => { if (wizardStep <= 1) resetWizard(); else { setMetricSearch(""); setWizardStep((s) => s - 1); } }}
                className="rounded-[10px] border border-[#d1d5dc] bg-white px-5 py-2 text-sm font-medium text-[#4a5565] transition-colors hover:bg-gray-50"
              >
                {wizardStep <= 1 ? "Cancel" : "Back"}
              </button>
              <button
                onClick={() => { if (wizardStep === totalSteps) handleSaveScore(); else { setMetricSearch(""); setWizardStep((s) => s + 1); } }}
                disabled={!canProceed()}
                className="rounded-[10px] bg-[#101828] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d2939] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {wizardStep === totalSteps ? "Save score" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
