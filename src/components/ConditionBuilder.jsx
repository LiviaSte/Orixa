import SearchableDropdown from "./SearchableDropdown";
import {
  PlusSmallIcon,
  TrashIcon,
  GreenCheckIcon,
  ConflictTriangleIcon,
  NotConfiguredIcon,
} from "./icons";

// ── Source & field options for adoption ladder criteria ──────────
export const ADOPTION_SOURCE_OPTIONS = [
  "Veeva CRM",
  "Salesforce",
  "IQVIA",
  "Manual database",
];
export const ADOPTION_FIELDS_BY_SOURCE = {
  "Veeva CRM": [
    "Contact.Adoption_Stage__c",
    "Call2_vod__c.Rx_Count__c",
    "Contact.Last_Rx_Date__c",
    "Contact.Engagement_Score__c",
    "Call2_vod__c.Detail_Group__c",
    "Contact.Email_Opens__c",
  ],
  Salesforce: [
    "Contact.Adoption_Stage__c",
    "HCP_Activity__c.Rx_Count",
    "HCP_Activity__c.Last_Rx_Date",
    "Contact.Engagement_Score__c",
    "Task.Activity_Count__c",
  ],
  IQVIA: [
    "NRx.Count",
    "NRx.Volume",
    "TRx.Count",
    "TRx.Volume",
    "Market_Share.Pct",
    "Time_Period.Months",
    "Consecutive_Quarters.Count",
  ],
  "Manual database": [
    "Rx_Tracking.Count",
    "Rx_Tracking.Date",
    "Engagement_Log.Type",
    "Engagement_Log.Count",
    "Rep_Assessment.Stage",
    "Rep_Assessment.Date",
  ],
};

export const DEFAULT_OPERATORS = [
  "is",
  "is not",
  "equals",
  "greater than",
  "less than",
  ">=",
  "<=",
  "contains",
  "in",
  "not in",
];

export const DURATION_OPTIONS = [
  "< 1 month",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "12+ months",
];

// ── Compute per-stage status ────────────────────────────────────
export function computeStageStatus(def, isFirst) {
  if (!def) return "not_configured";
  const hasDef = def.definition && def.definition.trim() !== "";
  const hasEntry =
    def.entryCriteria.conditions.length > 0 &&
    def.entryCriteria.conditions.some((c) => c.field && c.operator && c.value);
  if (hasDef && (hasEntry || isFirst)) return "defined";
  if (hasDef || hasEntry) return "needs_attention";
  return "not_configured";
}

export const stageStatusConfig = {
  defined: {
    icon: <GreenCheckIcon />,
    badgeBg: "bg-[#dcfce7]",
    badgeColor: "text-[#15803d]",
    text: "Defined",
  },
  needs_attention: {
    icon: <ConflictTriangleIcon />,
    badgeBg: "bg-[#ffedd5]",
    badgeColor: "text-[#c2410c]",
    text: "Needs attention",
  },
  not_configured: {
    icon: <NotConfiguredIcon />,
    badgeBg: "bg-[#fef2f2]",
    badgeColor: "text-[#dc2626]",
    text: "Not configured",
  },
};

// ── Condition Builder (reusable pattern) ────────────────────────
export default function ConditionBuilder({
  conditions,
  conditionOperators,
  source,
  onAddCondition,
  onRemoveCondition,
  onUpdateCondition,
  onSetOperator,
}) {
  const availableFields =
    source && ADOPTION_FIELDS_BY_SOURCE[source]
      ? ADOPTION_FIELDS_BY_SOURCE[source]
      : [];

  if (conditions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#e2e8f0] bg-white px-6 py-6">
        <p className="text-xs text-[#9ca3af]">No conditions defined</p>
        <button
          onClick={onAddCondition}
          className="flex items-center gap-2 rounded-lg bg-[#135bec] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1150d4]"
        >
          <span className="text-white">
            <PlusSmallIcon />
          </span>
          Add Condition
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {conditions.map((cond, index) => (
        <div key={cond.id}>
          <div className="flex items-start gap-2">
            <div className="mt-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#e2e8f0] bg-white">
              <span className="text-[9px] font-black text-[#111318]">
                {index + 1}
              </span>
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2">
              <div className="flex-1">
                <SearchableDropdown
                  value={cond.field}
                  options={availableFields}
                  onChange={(val) => onUpdateCondition(cond.id, "field", val)}
                  placeholder={
                    source ? "Select field..." : "Select a source first"
                  }
                  disabled={!source}
                />
              </div>
              <div className="w-32">
                <SearchableDropdown
                  value={cond.operator}
                  options={DEFAULT_OPERATORS}
                  onChange={(val) =>
                    onUpdateCondition(cond.id, "operator", val)
                  }
                  placeholder="Operator..."
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={cond.value}
                  onChange={(e) =>
                    onUpdateCondition(cond.id, "value", e.target.value)
                  }
                  placeholder="Value..."
                  className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                />
              </div>
              <button
                onClick={() => onRemoveCondition(cond.id)}
                className="shrink-0 p-1 text-[#6a7282] transition-colors hover:text-[#dc2626]"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
          {/* AND/OR toggle */}
          {index < conditions.length - 1 && (
            <div className="flex justify-center py-1 pl-7">
              <div className="flex items-center rounded-full border border-[#e2e8f0] bg-[#f1f5f9] p-[3px]">
                <button
                  onClick={() => onSetOperator(index, "AND")}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                    (conditionOperators[index] || "AND") === "AND"
                      ? "bg-[#135bec] text-white shadow-sm"
                      : "text-[#616f89]"
                  }`}
                >
                  AND
                </button>
                <button
                  onClick={() => onSetOperator(index, "OR")}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                    (conditionOperators[index] || "AND") === "OR"
                      ? "bg-[#135bec] text-white shadow-sm"
                      : "text-[#616f89]"
                  }`}
                >
                  OR
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="pl-7 pt-1">
        <button
          onClick={onAddCondition}
          className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#cbd5e1] px-3 py-1.5 transition-colors hover:border-[#94a3b8] hover:bg-gray-50"
        >
          <PlusSmallIcon />
          <span className="text-xs font-semibold text-[#616f89]">
            Add Condition
          </span>
        </button>
      </div>
    </div>
  );
}
