import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDomainDefinitionContext } from "../DomainDefinitionContext";
import { DURATION_OPTIONS, computeStageStatus, stageStatusConfig } from "./ConditionBuilder";
import SearchableDropdown from "./SearchableDropdown";
import {
  DragHandleIcon,
  EditPencilIcon,
  CloseIcon,
  ChevronDownIcon,
  PlusSmallIcon,
  TrashIcon,
} from "./icons";

// ── HCP / Terminal / Opportunity helpers ──────────────────────────
const HCP_STAGE_NAMES = ["lead", "mql", "sql"];
function isHCPStage(n) { return HCP_STAGE_NAMES.includes(n?.toLowerCase().trim()); }
function isTerminalStage(n) { return ["closed won", "closed lost"].includes(n?.toLowerCase().trim()); }
function isOpportunityStage(n) { return n?.toLowerCase().trim() === "opportunity"; }

// ── Sources & fields (mirrors DomainDefinition) ───────────────────
const ALL_SOURCES = ["Veeva CRM", "Salesforce", "HubSpot", "Marketo", "SAP", "Manual database"];

const FIELDS_BY_SOURCE = {
  "Veeva CRM": [
    "Contact.Role", "Contact.RecordType", "Contact.Status__c", "Contact.Specialty__c",
    "Contact.Credentials__c", "Account.RecordType", "Account.Account_Type__c",
    "Account.Channel__c", "Account.Status__c", "Opportunity__c.Stage__c",
    "Opportunity__c.Value__c", "Opportunity__c.Expected_Close__c",
  ],
  Salesforce: [
    "Lead.Status", "Lead.LeadSource", "Lead.Rating", "Lead.IsConverted", "Lead.CreatedDate",
    "Contact.RecordType", "Contact.HCP_Role__c", "Contact.Status", "Contact.Specialty",
    "Account.RecordType", "Account.Type", "Account.Industry", "Account.Status__c",
    "Opportunity.StageName", "Opportunity.Amount", "Opportunity.CloseDate",
    "Opportunity.Probability", "Opportunity.Type",
  ],
  HubSpot: [
    "Contacts.Lifecycle_Stage", "Contacts.Lead_Status", "Contacts.Lead_Source",
    "Deals.Deal_Stage", "Deals.Amount", "Deals.Close_Date", "Deals.Pipeline",
  ],
  Marketo: [
    "Lead.Lead_Score", "Lead.Lead_Status", "Lead.Acquisition_Date",
    "Lead.Email_Opt_In", "Program.Program_Status",
  ],
  SAP: [
    "Business_Partner.Type", "Business_Partner.Channel",
    "Business_Partner.Category", "Business_Partner.Status",
  ],
  "Manual database": [
    "HCP_Registry.Role", "HCP_Registry.Type", "HCP_Registry.Status", "HCP_Registry.License_Type",
    "Webinar_Records_A1.Attendance", "Webinar_Records_A1.Status",
    "Marketing_Omnichannel_Q4.Channel", "Marketing_Omnichannel_Q4.Response",
  ],
};

// ── Field-type inference & operators (same logic as DomainDefinition) ─
function inferFieldType(fieldName) {
  if (!fieldName) return "text";
  const last = fieldName.toLowerCase().split(".").pop();
  if (["date", "created", "modified", "close", "start", "end", "closedate", "acquisition_date"].some(p => last.includes(p))) return "date";
  if (["score", "amount", "value", "cost", "revenue", "pct", "probability", "count", "number", "threshold"].some(p => last.includes(p))) return "number";
  if (["isconverted", "is_converted", "iswon", "isclosed", "opt_in", "eligible"].some(p => last.includes(p))) return "boolean";
  if (["status", "stagename", "stage__c", "recordtype", "type", "role", "specialty", "lifecycle_stage", "lead_status", "rating", "industry", "channel", "category"].some(p => last.includes(p))) return "enum";
  return "text";
}

const OPERATORS_BY_TYPE = {
  date:    ["equals", "before", "after", "last N days", "last N months", "is null", "is not null"],
  number:  ["=", "≥", "≤", ">", "<", "is null", "is not null"],
  boolean: ["is", "is not"],
  enum:    ["is", "is not", "in", "not in", "is null", "is not null"],
  text:    ["is", "is not", "contains", "does not contain", "equals", "in", "not in"],
};

function operatorsFor(fieldName) {
  return OPERATORS_BY_TYPE[inferFieldType(fieldName)] || OPERATORS_BY_TYPE.text;
}

// Numeric operators for score / action counts
const NUMERIC_OPS = ["=", "≥", "≤", ">", "<"];

// ── THEN action presets ───────────────────────────────────────────
const THEN_ACTION_OPTIONS = [
  "Notify local omnichannel team",
  "Trigger AM follow-up task in CRM",
  "Mark as passed to next stage",
  "Schedule rep visit",
  "Send automated email sequence",
  "Alert medical science liaison",
  "Log event in CRM",
  "Assign to key account manager",
];

// ── Condition type config (no Mix) ────────────────────────────────
const CONDITION_TYPES = [
  { value: "score",      label: "HCP score",          badge: "bg-[#ede9fe] text-[#6d28d9]", border: "border-[#ddd6fe]" },
  { value: "reach",      label: "Reach actions",       badge: "bg-[#dbeafe] text-[#1d4ed8]", border: "border-[#bfdbfe]", hint: "Passive exposure — e.g. opened an email, registered for a webinar" },
  { value: "engagement", label: "Engagement actions",  badge: "bg-[#dcfce7] text-[#15803d]", border: "border-[#bbf7d0]", hint: "Active interaction — e.g. downloaded material, replied to a communication" },
  // { value: "custom",     label: "Custom condition",    badge: "bg-[#f3f4f6] text-[#374151]",  border: "border-[#e5e7eb]" }, // Hidden for now
];

// ── Natural-language summary helpers ─────────────────────────────
function conditionToText(g) {
  if (g.type === "score") {
    if (!g.threshold) return "HCP score (threshold not set)";
    return `HCP score ${g.condOp || "≥"} ${g.threshold} points`;
  }
  if (g.type === "reach") {
    if (!g.minCount) return "reach actions (count not set)";
    return `at least ${g.minCount} reach action${g.minCount > 1 ? "s" : ""}`;
  }
  if (g.type === "engagement") {
    if (!g.minCount) return "engagement actions (count not set)";
    return `at least ${g.minCount} engagement action${g.minCount > 1 ? "s" : ""}`;
  }
  if (g.type === "custom") {
    const parts = [g.source, g.field, g.operator, g.value].filter(Boolean);
    return parts.length ? parts.join(" ") : "custom condition (incomplete)";
  }
  return "condition";
}

function buildSummary(groups, ops, thenActions, nextStageName) {
  if (!groups?.length && !thenActions?.length) return null;
  let ifText = "";
  if (groups?.length) {
    ifText = groups.map((g, i) => {
      const opLabel = i === 0 ? "" : ` ${(ops?.[i - 1] || "AND")} `;
      return `${opLabel}${conditionToText(g)}`;
    }).join("");
  }
  const thenText = thenActions?.filter(a => a.value).map(a => a.value).join(", ");
  return { ifText, thenText, nextStageName };
}

// ── Single condition row with 2-line layout ───────────────────────
function ConditionRow({ group, showOperator, operator, onOperatorChange, onUpdate, onRemove }) {
  const typeCfg = CONDITION_TYPES.find(c => c.value === group.type) || CONDITION_TYPES[3];
  const fieldsForSource = group.source ? (FIELDS_BY_SOURCE[group.source] || []) : [];
  const opsForField = group.field ? operatorsFor(group.field) : OPERATORS_BY_TYPE.text;
  const fieldType = inferFieldType(group.field);

  // Determine unit label for display
  const getUnitLabel = () => {
    if (group.type === "score") return "points";
    if (group.type === "reach" || group.type === "engagement") return "actions";
    return "";
  };

  return (
    <div>
      {/* AND / OR toggle between conditions */}
      {showOperator && (
        <div className="flex justify-center py-1">
          <div className="flex items-center rounded-full border border-[#e2e8f0] bg-[#f1f5f9] p-[3px]">
            {["AND", "OR"].map(op => (
              <button
                key={op}
                onClick={() => onOperatorChange(op)}
                className={`rounded-full px-3 py-0.5 text-xs font-bold transition-colors ${
                  operator === op ? "bg-[#135bec] text-white shadow-sm" : "text-[#616f89]"
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* For Score / Reach / Engagement: Single line layout */}
      {(group.type === "score" || group.type === "reach" || group.type === "engagement") && (
        <div className="flex items-center gap-3">
          {/* Action Type dropdown (largest) */}
          <div className="flex-1">
            <SearchableDropdown
              value={typeCfg.label}
              options={CONDITION_TYPES.map(c => c.label)}
              onChange={val => {
                const found = CONDITION_TYPES.find(c => c.label === val);
                if (found) onUpdate("type", found.value);
              }}
              placeholder="Select action..."
            />
          </div>

          {/* Condition dropdown (regular select, not searchable) */}
          <div className="w-32 shrink-0">
            <select
              value={group.condOp || "≥"}
              onChange={val => onUpdate("condOp", val.target.value)}
              className="w-full rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-sm text-[#111318] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
            >
              {NUMERIC_OPS.map(op => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          {/* Value input */}
          <div className="w-32 shrink-0">
            <input
              type="number"
              min={group.type === "reach" || group.type === "engagement" ? "1" : "0"}
              value={group.type === "score" ? (group.threshold || "") : (group.minCount || "")}
              onChange={e => {
                if (group.type === "score") {
                  onUpdate("threshold", e.target.value);
                } else {
                  onUpdate("minCount", e.target.value);
                }
              }}
              placeholder={group.type === "score" ? "e.g. 50" : "e.g. 3"}
              className="w-full rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
            />
          </div>

          {/* Delete button */}
          <button onClick={onRemove} className="shrink-0 p-1 text-[#6a7282] transition-colors hover:text-[#dc2626]">
            <TrashIcon />
          </button>
        </div>
      )}

      {/* For Custom Condition: Two-line layout */}
      {group.type === "custom" && (
        <>
          {/* Line 1: Action Type + Source */}
          <div className="flex items-center gap-3 mb-3">
            {/* Action Type dropdown (largest) */}
            <div className="flex-1">
              <SearchableDropdown
                value={typeCfg.label}
                options={CONDITION_TYPES.map(c => c.label)}
                onChange={val => {
                  const found = CONDITION_TYPES.find(c => c.label === val);
                  if (found) onUpdate("type", found.value);
                }}
                placeholder="Select action..."
              />
            </div>

            {/* Source dropdown */}
            <div className="flex-1">
              <SearchableDropdown
                value={group.source || ""}
                options={ALL_SOURCES}
                onChange={val => { onUpdate("source", val); onUpdate("field", ""); onUpdate("operator", ""); onUpdate("value", ""); }}
                placeholder="Source..."
              />
            </div>

            {/* Delete button */}
            <button onClick={onRemove} className="shrink-0 p-1 text-[#6a7282] transition-colors hover:text-[#dc2626]">
              <TrashIcon />
            </button>
          </div>

          {/* Line 2: Field + Operator + Value */}
          <div className="flex items-center gap-3">
            {/* Field dropdown */}
            <div className="flex-1">
              <SearchableDropdown
                value={group.field || ""}
                options={fieldsForSource}
                onChange={val => { onUpdate("field", val); onUpdate("operator", ""); onUpdate("value", ""); }}
                placeholder={group.source ? "Field..." : "Select source first"}
                disabled={!group.source}
              />
            </div>

            {/* Operator dropdown (regular select, not searchable) */}
            <div className="w-32 shrink-0">
              <select
                value={group.operator || ""}
                onChange={val => { onUpdate("operator", val.target.value); onUpdate("value", ""); }}
                disabled={!group.field}
                className="w-full rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-sm text-[#111318] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc] disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
              >
                <option value="">Operator</option>
                {group.field && opsForField.map(op => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>

            {/* Value input */}
            <div className="w-32 shrink-0">
              {group.operator && group.operator !== "is null" && group.operator !== "is not null" ? (
                fieldType === "boolean" ? (
                  <select
                    value={group.value || ""}
                    onChange={e => onUpdate("value", e.target.value)}
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-sm text-[#111318] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  >
                    <option value="">Select…</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : fieldType === "date" ? (
                  (group.operator === "last N days" || group.operator === "last N months") ? (
                    <input
                      type="number"
                      min="1"
                      value={group.value || ""}
                      onChange={e => onUpdate("value", e.target.value)}
                      placeholder={group.operator === "last N days" ? "Days" : "Months"}
                      className="w-full rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                    />
                  ) : (
                    <input
                      type="date"
                      value={group.value || ""}
                      onChange={e => onUpdate("value", e.target.value)}
                      className="w-full rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-sm text-[#111318] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                    />
                  )
                ) : fieldType === "number" ? (
                  <input
                    type="number"
                    value={group.value || ""}
                    onChange={e => onUpdate("value", e.target.value)}
                    placeholder="Value"
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  />
                ) : (
                  <input
                    type="text"
                    value={group.value || ""}
                    onChange={e => onUpdate("value", e.target.value)}
                    placeholder="Value"
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  />
                )
              ) : (
                <div className="rounded-lg border border-dashed border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1.5 text-xs text-[#9ca3af] text-center">
                  —
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Hint - show below for custom conditions */}
      {typeCfg.hint && (
        <p className="text-[10px] italic text-[#9ca3af] mt-2">{typeCfg.hint}</p>
      )}
    </div>
  );
}

// ── Natural-language summary panel ────────────────────────────────
function TriggerSummary({ groups, groupOperators, thenActions, nextStageName }) {
  const summary = buildSummary(groups, groupOperators, thenActions, nextStageName);
  if (!summary) return null;
  const { ifText, thenText } = summary;
  if (!ifText && !thenText) return null;

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">Summary</p>
      <p className="text-sm leading-relaxed text-[#111318]">
        {ifText && nextStageName && (
          <>
            To move to{" "}
            <span className="font-semibold">{nextStageName}</span>
            {", "}the HCP must have{" "}
            <span className="text-[#155dfc]">{ifText}</span>
            {thenText ? "." : "."}
          </>
        )}
        {thenText && (
          <>
            {ifText ? " " : ""}
            The system will then:{" "}
            <span className="text-[#155dfc]">{thenText}</span>.
          </>
        )}
        {!ifText && !thenText && (
          <span className="italic text-[#9ca3af]">No trigger configured yet.</span>
        )}
      </p>
    </div>
  );
}

// ── IF block (conditions list) ────────────────────────────────────
function IfBlock({ stageId, trigger, nextStageName, onGroupsChange }) {
  const { updateTrigger, addActionGroup, updateActionGroup, removeActionGroup } =
    useDomainDefinitionContext();

  const t = trigger || {};
  const groups = t.actionGroups || [];
  const groupOperators = t.groupOperators || {};

  const addCondition = () => addActionGroup(stageId);

  const updateCondition = (groupId, field, value) =>
    updateActionGroup(stageId, groupId, field, value);

  const removeCondition = (groupId) => removeActionGroup(stageId, groupId);

  const setOperator = (idx, op) => {
    const ops = { ...groupOperators, [idx]: op };
    updateTrigger(stageId, "groupOperators", ops);
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#e5e7eb] bg-[#fafbfc] p-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">
        If — to move to <span className="font-semibold text-[#111318]">{nextStageName}</span>
      </span>

      {groups.length === 0 && (
        <p className="text-xs italic text-[#9ca3af]">No conditions yet. Add one below.</p>
      )}

      {groups.map((group, idx) => (
        <ConditionRow
          key={group.id}
          group={group}
          showOperator={idx > 0}
          operator={groupOperators[idx - 1] || "AND"}
          onOperatorChange={op => setOperator(idx - 1, op)}
          onUpdate={(field, value) => updateCondition(group.id, field, value)}
          onRemove={() => removeCondition(group.id)}
        />
      ))}

      <button
        onClick={addCondition}
        className="flex items-center gap-1.5 self-start rounded-lg border border-dashed border-[#cbd5e1] px-3 py-1.5 text-xs font-medium text-[#616f89] transition-colors hover:border-[#94a3b8] hover:bg-white"
      >
        <PlusSmallIcon />
        Add condition
      </button>
    </div>
  );
}

// ── THEN block ────────────────────────────────────────────────────
function ThenBlock({ stageId, thenActions, updateTrigger }) {
  const actions = thenActions || [];

  const add = () =>
    updateTrigger(stageId, "thenActions", [...actions, { id: `ta-${Date.now()}`, value: "" }]);
  const remove = id =>
    updateTrigger(stageId, "thenActions", actions.filter(a => a.id !== id));
  const update = (id, value) =>
    updateTrigger(stageId, "thenActions", actions.map(a => (a.id === id ? { ...a, value } : a)));

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#e5e7eb] bg-[#fafbfc] p-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">Then</span>
      <p className="text-xs text-[#6a7282]">What the system should do when conditions are met.</p>
      {actions.map(action => (
        <div key={action.id} className="flex items-center gap-2">
          <div className="flex-1">
            <SearchableDropdown
              value={action.value}
              options={THEN_ACTION_OPTIONS}
              onChange={val => update(action.id, val)}
              placeholder="Select or type an action..."
            />
          </div>
          <button onClick={() => remove(action.id)} className="shrink-0 p-1 text-[#9ca3af] hover:text-[#dc2626]">
            <TrashIcon />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1.5 self-start rounded-lg border border-dashed border-[#cbd5e1] px-3 py-1.5 text-xs font-medium text-[#616f89] transition-colors hover:border-[#94a3b8] hover:bg-white"
      >
        <PlusSmallIcon />
        {actions.length === 0 ? "Add system action" : "Add another action"}
      </button>
    </div>
  );
}

// ── Full IF + THEN + Summary section ─────────────────────────────
function TriggerSection({ stageId, trigger, nextStageName }) {
  const { updateTrigger } = useDomainDefinitionContext();
  const t = trigger || {};

  return (
    <div className="flex flex-col gap-2">
      <IfBlock stageId={stageId} trigger={t} nextStageName={nextStageName} />
      <ThenBlock stageId={stageId} thenActions={t.thenActions} updateTrigger={updateTrigger} />
      <TriggerSummary
        groups={t.actionGroups}
        groupOperators={t.groupOperators}
        thenActions={t.thenActions}
        nextStageName={nextStageName}
      />
    </div>
  );
}

// ── Terminal THEN-only block (Closed Won / Closed Lost) ───────────
function TerminalThenBlock({ stageId, thenActions, stageName }) {
  const { updateTrigger } = useDomainDefinitionContext();
  return (
    <div className="flex flex-col gap-2">
      <ThenBlock stageId={stageId} thenActions={thenActions} updateTrigger={updateTrigger} />
      <TriggerSummary
        groups={[]}
        groupOperators={{}}
        thenActions={thenActions}
        nextStageName={stageName}
      />
    </div>
  );
}

// ── Opportunity sub-trigger (IF + THEN + Summary) ─────────────────
function OpportunitySubTrigger({ stageId, subKey, subTrigger, nextStageName, updateSubTrigger }) {
  const groups = subTrigger.actionGroups || [];
  const groupOperators = subTrigger.groupOperators || {};
  const thenActions = subTrigger.thenActions || [];

  const addGroup = () => {
    const g = { id: `ag-${Date.now()}-${Math.random()}`, type: "score", condOp: "≥", threshold: "", minCount: "" };
    updateSubTrigger(subKey, "actionGroups", [...groups, g]);
  };
  const updateGroup = (id, field, value) =>
    updateSubTrigger(subKey, "actionGroups", groups.map(g => (g.id === id ? { ...g, [field]: value } : g)));
  const removeGroup = id =>
    updateSubTrigger(subKey, "actionGroups", groups.filter(g => g.id !== id));
  const setOp = (idx, op) =>
    updateSubTrigger(subKey, "groupOperators", { ...groupOperators, [idx]: op });

  const addThen = () =>
    updateSubTrigger(subKey, "thenActions", [...thenActions, { id: `ta-${Date.now()}`, value: "" }]);
  const removeThen = id =>
    updateSubTrigger(subKey, "thenActions", thenActions.filter(a => a.id !== id));
  const updateThen = (id, value) =>
    updateSubTrigger(subKey, "thenActions", thenActions.map(a => (a.id === id ? { ...a, value } : a)));

  return (
    <div className="flex flex-col gap-2">
      {/* IF */}
      <div className="flex flex-col gap-2 rounded-xl border border-[#e5e7eb] bg-[#fafbfc] p-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">
          If — to move to <span className="font-semibold text-[#111318]">{nextStageName}</span>
        </span>
        {groups.length === 0 && <p className="text-xs italic text-[#9ca3af]">No conditions yet. Add one below.</p>}
        {groups.map((group, idx) => (
          <ConditionRow
            key={group.id}
            group={group}
            showOperator={idx > 0}
            operator={groupOperators[idx - 1] || "AND"}
            onOperatorChange={op => setOp(idx - 1, op)}
            onUpdate={(field, value) => updateGroup(group.id, field, value)}
            onRemove={() => removeGroup(group.id)}
          />
        ))}
        <button
          onClick={addGroup}
          className="flex items-center gap-1.5 self-start rounded-lg border border-dashed border-[#cbd5e1] px-3 py-1.5 text-xs font-medium text-[#616f89] transition-colors hover:border-[#94a3b8] hover:bg-white"
        >
          <PlusSmallIcon />
          Add condition
        </button>
      </div>

      {/* THEN */}
      <div className="flex flex-col gap-2 rounded-xl border border-[#e5e7eb] bg-[#fafbfc] p-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">Then</span>
        {thenActions.map(action => (
          <div key={action.id} className="flex items-center gap-2">
            <div className="flex-1">
              <SearchableDropdown
                value={action.value}
                options={THEN_ACTION_OPTIONS}
                onChange={val => updateThen(action.id, val)}
                placeholder="Select or type an action..."
              />
            </div>
            <button onClick={() => removeThen(action.id)} className="shrink-0 p-1 text-[#9ca3af] hover:text-[#dc2626]">
              <TrashIcon />
            </button>
          </div>
        ))}
        <button
          onClick={addThen}
          className="flex items-center gap-1.5 self-start rounded-lg border border-dashed border-[#cbd5e1] px-3 py-1.5 text-xs font-medium text-[#616f89] transition-colors hover:border-[#94a3b8] hover:bg-white"
        >
          <PlusSmallIcon />
          {thenActions.length === 0 ? "Add system action" : "Add another action"}
        </button>
      </div>

      {/* Summary */}
      <TriggerSummary
        groups={groups}
        groupOperators={groupOperators}
        thenActions={thenActions}
        nextStageName={nextStageName}
      />
    </div>
  );
}

// ── Opportunity dual-trigger wrapper ──────────────────────────────
function OpportunityTriggers({ stageId, trigger }) {
  const { updateTrigger } = useDomainDefinitionContext();

  const updateSubTrigger = (subKey, field, value) =>
    updateTrigger(stageId, subKey, { ...(trigger?.[subKey] || {}), [field]: value });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-semibold text-[#15803d]">
          → Closed Won
        </span>
        <OpportunitySubTrigger
          stageId={stageId} subKey="toWon"
          subTrigger={trigger?.toWon || {}} nextStageName="Closed Won"
          updateSubTrigger={updateSubTrigger}
        />
      </div>
      <div className="border-t border-dashed border-[#e5e7eb]" />
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center rounded-full bg-[#fee2e2] px-2.5 py-0.5 text-xs font-semibold text-[#b91c1c]">
          → Closed Lost
        </span>
        <OpportunitySubTrigger
          stageId={stageId} subKey="toLost"
          subTrigger={trigger?.toLost || {}} nextStageName="Closed Lost"
          updateSubTrigger={updateSubTrigger}
        />
      </div>
    </div>
  );
}

// ── Sortable Stage Card ───────────────────────────────────────────
function SortableStageCard({
  stage, index, isFirst, isLast, nextStage, allStages,
  expandedId, onToggleExpand, onRename, onRemove, canRemove,
}) {
  const [editing, setEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stage.id });

  const { adoptionLadder, updateStageDefinition, updateOperationalContext } =
    useDomainDefinitionContext();

  const def = adoptionLadder.stageDefinitions[stage.id];
  const isExpanded = expandedId === stage.id;
  const stageStatus = computeStageStatus(def, isFirst);
  const statusCfg = stageStatusConfig[stageStatus];

  const isTerminal = isTerminalStage(stage.name);
  const isOpportunity = isOpportunityStage(stage.name);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  if (!def) return null;

  return (
    <div ref={setNodeRef} style={style}>
      <div className={`w-full overflow-hidden rounded-xl border bg-white transition-shadow ${
        isDragging ? "border-[#155dfc] shadow-lg"
          : isExpanded ? "border-[#155dfc] shadow-sm"
          : "border-[#e5e7eb] hover:border-[#d1d5dc]"
      }`}>

        {/* ── Header ── */}
        <div className="flex w-full items-center gap-3 px-4 py-3">
          <span {...attributes} {...listeners}
            className="shrink-0 cursor-grab touch-none text-[#9ca3af] active:cursor-grabbing">
            <DragHandleIcon />
          </span>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#155dfc]">
            <span className="text-xs font-bold text-white">{index + 1}</span>
          </div>
          <div className="flex flex-1 cursor-pointer items-center gap-3" onClick={() => onToggleExpand(stage.id)}>
            {editing ? (
              <input
                type="text" value={stage.name} autoFocus
                onClick={e => e.stopPropagation()}
                onChange={e => onRename(stage.id, e.target.value)}
                onBlur={() => setEditing(false)}
                onKeyDown={e => e.key === "Enter" && setEditing(false)}
                className="flex-1 rounded border-b-2 border-[#155dfc] bg-[#f9fafb] px-1.5 py-0.5 text-sm font-medium text-[#111318] outline-none"
              />
            ) : (
              <span className="flex-1 text-sm font-medium text-[#111318]">{stage.name}</span>
            )}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.badgeBg} ${statusCfg.badgeColor}`}>
              {statusCfg.text}
            </span>
            <span className={`text-[#6a7282] transition-transform ${isExpanded ? "rotate-180" : ""}`}>
              <ChevronDownIcon />
            </span>
          </div>
          <button onClick={e => { e.stopPropagation(); setEditing(true); }}
            className="shrink-0 p-1 text-[#9ca3af] hover:text-[#155dfc]">
            <EditPencilIcon />
          </button>
          {canRemove && (
            <button onClick={e => { e.stopPropagation(); onRemove(stage.id); }}
              className="shrink-0 p-1 text-[#9ca3af] hover:text-[#dc2626]">
              <CloseIcon />
            </button>
          )}
        </div>

        {/* ── Expanded body ── */}
        {isExpanded && (
          <div className="border-t border-[#e5e7eb] px-5 py-5">
            <div className="flex flex-col gap-6">

              {/* 1. Definition */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Definition</label>
                <textarea
                  value={def.definition}
                  onChange={e => updateStageDefinition(stage.id, "definition", e.target.value)}
                  placeholder={`Describe in plain language what "${stage.name}" means in your organization.`}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                />
              </div>

              {/* 2. Transition trigger — ALL stages get one (Lead included) */}
              <>
                <div className="border-t border-[#f3f4f6]" />
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                    {isTerminal ? "Outcome actions" : "Transition trigger"}
                  </label>
                  <p className="text-xs text-[#6a7282]">
                    {isTerminal
                      ? `What the system should do when an account reaches "${stage.name}".`
                      : isFirst
                      ? `Define the conditions to move from "Lead" to "MQL".`
                      : isOpportunity
                      ? "Define the conditions to move from opportunity to Closed Won or Closed Lost."
                      : `Define the conditions to move from "${stage.name}" to "${nextStage?.name || "next stage"}".`}
                  </p>

                  {/* Terminal: only THEN */}
                  {isTerminal && (
                    <TerminalThenBlock stageId={stage.id} thenActions={def.trigger?.thenActions} stageName={stage.name} />
                  )}

                  {/* Opportunity: dual triggers */}
                  {isOpportunity && (
                    <OpportunityTriggers stageId={stage.id} trigger={def.trigger} />
                  )}

                  {/* All other stages (including Lead): IF + THEN + Summary */}
                  {!isTerminal && !isOpportunity && (
                    <TriggerSection
                      stageId={stage.id}
                      trigger={def.trigger}
                      nextStageName={isFirst ? (stage.name === "Lead" ? "MQL" : stage.name) : (nextStage?.name || "next stage")}
                    />
                  )}
                </div>
              </>

              {/* 3. Timing — skip for terminal stages */}
              {!isTerminal && (
                <>
                  <div className="border-t border-[#f3f4f6]" />
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Timing</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-[#4a5565]">Expected duration in this stage</label>
                        <SearchableDropdown
                          value={def.operationalContext.expectedDuration}
                          options={DURATION_OPTIONS}
                          onChange={val => updateOperationalContext(stage.id, "expectedDuration", val)}
                          placeholder="Select duration..."
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-[#4a5565]">Flag if stuck longer than</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min="1"
                            value={def.operationalContext.flagStuckAfter}
                            onChange={e => updateOperationalContext(stage.id, "flagStuckAfter", e.target.value)}
                            placeholder="e.g. 9"
                            className="w-24 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                          />
                          <span className="text-sm text-[#6a7282]">months</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── HCP → Account dashed divider ─────────────────────────────────
function HCPAccountDivider() {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="h-4 w-0.5 bg-[#d1d5dc]" />
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path d="M0 0L5 6L10 0" fill="#d1d5dc" />
      </svg>
      <div className="relative my-1 w-full">
        <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-[#cbd5e1]" />
        <div className="relative flex justify-center">
          <span className="rounded-full border border-[#cbd5e1] bg-[#f7f8fa] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
            HCP stages → Account stages
          </span>
        </div>
      </div>
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path d="M0 0L5 6L10 0" fill="#d1d5dc" />
      </svg>
      <div className="h-4 w-0.5 bg-[#d1d5dc]" />
    </div>
  );
}

function ArrowConnector() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center">
        <div className="h-4 w-0.5 bg-[#d1d5dc]" />
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M0 0L5 6L10 0" fill="#d1d5dc" />
        </svg>
      </div>
    </div>
  );
}

// ── Main Builder ──────────────────────────────────────────────────
export default function AdoptionLadderBuilder() {
  const { adoptionLadder, addStage, removeStage, renameStage, reorderStages } =
    useDomainDefinitionContext();
  const [newStageName, setNewStageName] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const { stages } = adoptionLadder;
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = sortedStages.findIndex(s => s.id === active.id);
    const newIdx = sortedStages.findIndex(s => s.id === over.id);
    reorderStages(arrayMove(sortedStages, oldIdx, newIdx));
  };

  const handleAddStage = () => {
    addStage(newStageName.trim() || `Stage ${stages.length + 1}`);
    setNewStageName("");
  };

  const lastHCPIndex = sortedStages.reduce((last, s, i) => isHCPStage(s.name) ? i : last, -1);

  return (
    <div className="flex flex-col gap-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={() => setExpandedId(null)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortedStages.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-0">
            {sortedStages.map((stage, index) => {
              const isLast = index === sortedStages.length - 1;
              const showDivider = lastHCPIndex >= 0 && index === lastHCPIndex && !isLast;
              const nextStage = sortedStages[index + 1] || null;
              return (
                <div key={stage.id}>
                  <SortableStageCard
                    stage={stage} index={index}
                    isFirst={index === 0} isLast={isLast}
                    nextStage={nextStage} allStages={sortedStages}
                    expandedId={expandedId}
                    onToggleExpand={id => setExpandedId(p => p === id ? null : id)}
                    onRename={renameStage} onRemove={removeStage}
                    canRemove={stages.length > 2}
                  />
                  {!isLast && (showDivider ? <HCPAccountDivider /> : <ArrowConnector />)}
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Stage */}
      <div className="flex items-center gap-3">
        <input
          type="text" value={newStageName}
          onChange={e => setNewStageName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAddStage()}
          placeholder="New stage name..."
          className="flex-1 rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
        />
        <button
          onClick={handleAddStage}
          className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#cbd5e1] px-4 py-2 transition-colors hover:border-[#94a3b8] hover:bg-gray-50"
        >
          <PlusSmallIcon />
          <span className="text-sm font-semibold text-[#616f89]">Add Stage</span>
        </button>
      </div>
    </div>
  );
}
