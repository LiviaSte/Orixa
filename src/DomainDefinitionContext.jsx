import { createContext, useContext, useState } from "react";

const DomainDefinitionContext = createContext(null);

// ── Concept IDs grouped by tab ─────────────────────────────────
const TAB_CONCEPT_IDS = {
  people: [
    "hcp",
    "lead",
    "lead-new",
    "lead-lapsed",
    "lead-active",
    "lead-connected",
    "lead-qualified",
    "lead-converted",
    "contact",
    "contact-new",
    "contact-lapsed",
    "contact-active",
    "contact-converted",
    "mql",
    "mqc",
    "sql",
    "conversion",
  ],
  account: [
    "account",
    "account-new",
    "account-active",
    "account-inactive",
    "opportunity",
    "opp-prospecting",
    "opp-qualification",
    "opp-proposal",
    "opp-negotiation",
    "opp-closed-won",
    "opp-closed-lost",
    "order",
    "order-draft",
    "order-activated",
    "order-cancelled",
    "contract",
    "contract-draft",
    "contract-in-review",
    "contract-activated",
    "contract-expired",
    "asset",
    "asset-active",
    "asset-inactive",
  ],
  channel: [
    "interaction-types",
    "digital-channel",
    "field-force-channel",
    "channel-attribution",
    "channel-mix",
  ],
  campaign: [
    "campaign",
    "campaign-type",
    "campaign-audience",
    "campaign-response",
    "campaign-roi",
    "content-asset",
  ],
};

// ── Default names ───────────────────────────────────────────────
const DEFAULT_NAMES = {
  // People
  hcp: "HCP",
  lead: "Lead",
  "lead-new": "Lead New",
  "lead-lapsed": "Lead Lapsed",
  "lead-active": "Lead Active",
  "lead-connected": "Lead Connected",
  "lead-qualified": "Lead Qualified",
  "lead-converted": "Lead Converted",
  contact: "Contact",
  "contact-new": "Contact New",
  "contact-lapsed": "Contact Lapsed",
  "contact-active": "Contact Active",
  "contact-converted": "Contact Converted",
  mql: "MQL",
  mqc: "MQC",
  sql: "SQL",
  conversion: "Conversion",
  // Account
  account: "Account",
  "account-new": "Account New",
  "account-active": "Account Active",
  "account-inactive": "Account Inactive",
  opportunity: "Opportunity",
  "opp-prospecting": "Prospecting",
  "opp-qualification": "Qualification",
  "opp-proposal": "Proposal",
  "opp-negotiation": "Negotiation",
  "opp-closed-won": "Closed Won",
  "opp-closed-lost": "Closed Lost",
  order: "Order",
  "order-draft": "Order Draft",
  "order-activated": "Order Activated",
  "order-cancelled": "Order Cancelled",
  contract: "Contract",
  "contract-draft": "Contract Draft",
  "contract-in-review": "Contract In Review",
  "contract-activated": "Contract Activated",
  "contract-expired": "Contract Expired",
  asset: "Asset",
  "asset-active": "Asset Active",
  "asset-inactive": "Asset Inactive",
  // Channel
  "interaction-types": "Interaction Types",
  "digital-channel": "Digital Channel",
  "field-force-channel": "Field Force Channel",
  "channel-attribution": "Channel Attribution",
  "channel-mix": "Channel Mix",
  // Campaign
  campaign: "Campaign",
  "campaign-type": "Campaign Type",
  "campaign-audience": "Campaign Audience",
  "campaign-response": "Campaign Response",
  "campaign-roi": "Campaign ROI",
  "content-asset": "Content Asset",
};

// ── Status computation ──────────────────────────────────────────
function computeStatus({ definition, sources, constraints }) {
  const hasDefinition = definition && definition.trim() !== "";
  const hasSources =
    sources &&
    sources.length > 0 &&
    sources.some(
      (s) =>
        s.source &&
        s.source.trim() !== "" &&
        s.conditions.length > 0 &&
        s.conditions.some((c) => c.field && c.operator && c.value)
    );
  const hasAnySource =
    sources && sources.length > 0 && sources.some((s) => s.source && s.source.trim() !== "");

  if (hasDefinition && hasSources) return "defined";
  if (
    hasDefinition ||
    hasAnySource ||
    (constraints && constraints.trim() !== "")
  )
    return "needs_attention";
  return "not_configured";
}

// ── Initial state builder ───────────────────────────────────────
function buildInitialState() {
  const state = {};
  for (const [, ids] of Object.entries(TAB_CONCEPT_IDS)) {
    for (const id of ids) {
      state[id] = {
        name: DEFAULT_NAMES[id] || id,
        definition: "",
        sources: [],
        sourceOperators: {},
        constraints: "",
        status: "not_configured",
      };
    }
  }
  return state;
}

// ── Adoption Ladder helpers ─────────────────────────────────────
function buildEmptyStageDefinition() {
  return {
    definition: "",
    detectionMethod: "data-driven",
    entryCriteria: {
      conditions: [],
      conditionOperators: {},
      source: "",
      sourceField: "",
    },
    trigger: {
      scoreThreshold: "",
      actionGroups: [], // each: { id, type: "reach"|"engagement"|"mix", minCount: "", operator: "AND"|"OR" }
      groupOperator: "AND",
      customRules: [],
      customRuleOperators: {},
      thenActions: [], // each: { id, value: string }
    },
    exitRules: [],
    operationalContext: {
      expectedDuration: "",
      flagStuckAfter: "",
    },
  };
}

const DEFAULT_STAGES = [
  { id: "stage-1", name: "Lead", order: 0, type: "hcp" },
  { id: "stage-2", name: "MQL", order: 1, type: "hcp" },
  { id: "stage-3", name: "SQL", order: 2, type: "hcp" },
  { id: "stage-4", name: "Opportunity", order: 3, type: "account" },
  { id: "stage-5", name: "Closed Won", order: 4, type: "account", terminal: true },
  { id: "stage-6", name: "Closed Lost", order: 5, type: "account", terminal: true },
];

function buildSampleMetrics() {
  // Sample metrics for different channels
  const sampleMetrics = [
    // Email metrics
    { type: "engagement", minCount: 1, source: "Marketing Cloud", field: "Email.Opened", condOp: "≥", channel: "Email", stageName: "Lead" },
    { type: "engagement", minCount: 2, source: "Salesforce", field: "Email.Clicked", condOp: "≥", channel: "Email", stageName: "MQL" },
    { type: "reach", minCount: 3, source: "Marketing Cloud", field: "Email.Delivered", condOp: "≥", channel: "Email", stageName: "Lead" },

    // Call/F2F metrics
    { type: "engagement", minCount: 1, source: "Salesforce", field: "Call.Duration", condOp: "≥", channel: "F2F", stageName: "SQL" },
    { type: "reach", minCount: 2, source: "Veeva CRM", field: "Visit.Count", condOp: "≥", channel: "F2F", stageName: "MQL" },

    // Webinar metrics
    { type: "engagement", minCount: 1, source: "Veeva CRM", field: "Webinar.Attended", condOp: "≥", channel: "Webinar", stageName: "Lead" },
    { type: "reach", minCount: 1, source: "Marketo", field: "Webinar.Registered", condOp: "≥", channel: "Webinar", stageName: "MQL" },

    // Events metrics
    { type: "engagement", minCount: 1, source: "Manual database", field: "Event.Attendance", condOp: "≥", channel: "Events", stageName: "Lead" },
    { type: "reach", minCount: 1, source: "Veeva CRM", field: "Congress.Attended", condOp: "≥", channel: "Congress", stageName: "SQL" },

    // Web metrics
    { type: "engagement", minCount: 2, source: "Google Analytics", field: "Web.PageViews", condOp: "≥", channel: "Web", stageName: "Lead" },
    { type: "reach", minCount: 1, source: "Google Analytics", field: "Web.SessionCount", condOp: "≥", channel: "Web", stageName: "MQL" },
    { type: "engagement", minCount: 3, source: "Marketing Cloud", field: "Web.FormSubmit", condOp: "≥", channel: "Web", stageName: "SQL" },
  ];

  return sampleMetrics;
}

function buildDefaultAdoptionLadder() {
  const defs = {};

  for (const stage of DEFAULT_STAGES) {
    const def = buildEmptyStageDefinition();
    // Triggers start empty — users configure them manually
    defs[stage.id] = def;
  }

  return {
    stages: DEFAULT_STAGES.map((s) => ({ ...s })),
    settings: {
      perProduct: false,
      selectedProduct: null,
      allowBackward: true,
    },
    stageDefinitions: defs,
    configurationStatus: "not_configured",
  };
}

function computeAdoptionLadderStatus(ladder) {
  const { stages, stageDefinitions } = ladder;
  if (stages.length < 2) return "not_configured";

  let anyDefined = false;
  let allDefined = true;

  for (const stage of stages) {
    const def = stageDefinitions[stage.id];
    if (!def) {
      allDefined = false;
      continue;
    }
    const hasDef = def.definition && def.definition.trim() !== "";
    const hasEntry =
      def.entryCriteria.conditions.length > 0 &&
      def.entryCriteria.conditions.some((c) => c.field && c.operator && c.value);
    const isFirst = stage.order === 0;
    const isLast = stage.terminal === true || stage.order === stages.length - 1;
    const hasExit = isLast || def.exitRules.length > 0;

    if (hasDef && (hasEntry || isFirst) && hasExit) {
      anyDefined = true;
    } else {
      allDefined = false;
    }
  }

  if (allDefined) return "defined";
  if (anyDefined) return "needs_attention";
  return "not_configured";
}

// ── Provider ────────────────────────────────────────────────────
export function DomainDefinitionProvider({ children }) {
  const [concepts, setConcepts] = useState(buildInitialState);
  const [customDefaults, setCustomDefaultsState] = useState({});
  const [customConcepts, setCustomConcepts] = useState([]);
  const [adoptionLadder, setAdoptionLadder] = useState(buildDefaultAdoptionLadder);

  // ═══ Concept actions ══════════════════════════════════════════

  const updateConcept = (conceptId, field, value) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;
      const updated = { ...current, [field]: value };
      updated.status = computeStatus(updated);
      return { ...prev, [conceptId]: updated };
    });
  };

  // ── Multi-source actions ──────────────────────────────────────

  const addSource = (conceptId) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;
      const newSource = {
        id: `src-${Date.now()}-${Math.random()}`,
        source: "",
        manualDb: "",
        conditions: [],
        conditionOperators: {},
      };
      const updated = {
        ...current,
        sources: [...current.sources, newSource],
      };
      updated.status = computeStatus(updated);
      return { ...prev, [conceptId]: updated };
    });
  };

  const removeSource = (conceptId, sourceId) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;
      const oldSources = current.sources;
      const removedIdx = oldSources.findIndex((s) => s.id === sourceId);
      if (removedIdx === -1) return prev;
      const newSources = oldSources.filter((s) => s.id !== sourceId);
      // Rebuild sourceOperators
      const oldOps = current.sourceOperators || {};
      const newOps = {};
      let gap = 0;
      for (let i = 0; i < oldSources.length - 1; i++) {
        if (i === removedIdx || i === removedIdx - 1) {
          if (i === removedIdx - 1 && removedIdx < oldSources.length - 1) {
            newOps[gap] = oldOps[i] || "AND";
            gap++;
          }
          continue;
        }
        newOps[gap] = oldOps[i] || "AND";
        gap++;
      }
      const updated = {
        ...current,
        sources: newSources,
        sourceOperators: newOps,
      };
      updated.status = computeStatus(updated);
      return { ...prev, [conceptId]: updated };
    });
  };

  const updateSourceField = (conceptId, sourceId, field, value) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;
      const updated = {
        ...current,
        sources: current.sources.map((s) => {
          if (s.id !== sourceId) return s;
          if (field === "source") {
            return { ...s, source: value, manualDb: "", conditions: [], conditionOperators: {} };
          }
          return { ...s, [field]: value };
        }),
      };
      updated.status = computeStatus(updated);
      return { ...prev, [conceptId]: updated };
    });
  };

  const addSourceCondition = (conceptId, sourceId) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;
      const newCond = { id: Date.now() + Math.random(), field: "", operator: "", value: "" };
      const updated = {
        ...current,
        sources: current.sources.map((s) => {
          if (s.id !== sourceId) return s;
          return { ...s, conditions: [...s.conditions, newCond] };
        }),
      };
      updated.status = computeStatus(updated);
      return { ...prev, [conceptId]: updated };
    });
  };

  const removeSourceCondition = (conceptId, sourceId, conditionId) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;
      const updated = {
        ...current,
        sources: current.sources.map((s) => {
          if (s.id !== sourceId) return s;
          const oldConds = s.conditions;
          const removedIdx = oldConds.findIndex((c) => c.id === conditionId);
          if (removedIdx === -1) return s;
          const newConds = oldConds.filter((c) => c.id !== conditionId);
          const oldOps = s.conditionOperators;
          const newOps = {};
          let gap = 0;
          for (let i = 0; i < oldConds.length - 1; i++) {
            if (i === removedIdx || i === removedIdx - 1) {
              if (i === removedIdx - 1 && removedIdx < oldConds.length - 1) {
                newOps[gap] = oldOps[i] || "AND";
                gap++;
              }
              continue;
            }
            newOps[gap] = oldOps[i] || "AND";
            gap++;
          }
          return { ...s, conditions: newConds, conditionOperators: newOps };
        }),
      };
      updated.status = computeStatus(updated);
      return { ...prev, [conceptId]: updated };
    });
  };

  const updateSourceCondition = (conceptId, sourceId, conditionId, field, value) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;
      const updated = {
        ...current,
        sources: current.sources.map((s) => {
          if (s.id !== sourceId) return s;
          return {
            ...s,
            conditions: s.conditions.map((c) => {
              if (c.id !== conditionId) return c;
              if (field === "field") return { ...c, field: value, operator: "", value: "" };
              return { ...c, [field]: value };
            }),
          };
        }),
      };
      updated.status = computeStatus(updated);
      return { ...prev, [conceptId]: updated };
    });
  };

  const setSourceConditionOperator = (conceptId, sourceId, gapIndex, value) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;
      return {
        ...prev,
        [conceptId]: {
          ...current,
          sources: current.sources.map((s) => {
            if (s.id !== sourceId) return s;
            return {
              ...s,
              conditionOperators: { ...s.conditionOperators, [gapIndex]: value },
            };
          }),
        },
      };
    });
  };

  const setSourceOperator = (conceptId, gapIndex, value) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;
      return {
        ...prev,
        [conceptId]: {
          ...current,
          sourceOperators: { ...(current.sourceOperators || {}), [gapIndex]: value },
        },
      };
    });
  };

  // ── Copy / duplicate concept ─────────────────────────────────

  const duplicateConcept = (conceptId, tabKey, conceptMeta) => {
    const newId = `${conceptId}-copy-${Date.now()}`;

    setConcepts((prev) => {
      const original = prev[conceptId];
      if (!original) return prev;
      const cloned = {
        ...original,
        name: `${original.name} (copy)`,
        sources: original.sources.map((s) => ({
          ...s,
          id: `src-${Date.now()}-${Math.random()}`,
          conditions: s.conditions.map((c) => ({
            ...c,
            id: Date.now() + Math.random(),
          })),
          conditionOperators: { ...s.conditionOperators },
        })),
        sourceOperators: { ...(original.sourceOperators || {}) },
      };
      cloned.status = computeStatus(cloned);
      return { ...prev, [newId]: cloned };
    });

    setCustomConcepts((prev) => [
      ...prev,
      {
        id: newId,
        tabKey,
        concept: {
          ...conceptMeta,
          id: newId,
          defaultName: `${conceptMeta.defaultName} (copy)`,
        },
      },
    ]);
  };

  const setCustomDefault = (conceptId, text) => {
    setCustomDefaultsState((prev) => ({ ...prev, [conceptId]: text }));
  };

  const clearCustomDefault = (conceptId) => {
    setCustomDefaultsState((prev) => {
      const next = { ...prev };
      delete next[conceptId];
      return next;
    });
  };

  const resetDefinition = (conceptId, defaultText) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;
      const updated = { ...current, definition: defaultText };
      updated.status = computeStatus(updated);
      return { ...prev, [conceptId]: updated };
    });
  };

  const getTabStats = (tabKey) => {
    const staticIds = TAB_CONCEPT_IDS[tabKey] || [];
    const customIds = customConcepts
      .filter((cc) => cc.tabKey === tabKey)
      .map((cc) => cc.id);
    const ids = [...staticIds, ...customIds];
    const total = ids.length;
    const configured = ids.filter((id) => concepts[id]?.status === "defined").length;
    return { configured, total };
  };

  // ═══ Adoption Ladder actions ══════════════════════════════════

  // ── Panel A: Structure ────────────────────────────────────────

  const addStage = (name) => {
    setAdoptionLadder((prev) => {
      const newId = `stage-${Date.now()}`;
      const newOrder = prev.stages.length;
      const newStage = { id: newId, name: name || `Stage ${newOrder + 1}`, order: newOrder };
      const updated = {
        ...prev,
        stages: [...prev.stages, newStage],
        stageDefinitions: {
          ...prev.stageDefinitions,
          [newId]: buildEmptyStageDefinition(),
        },
      };
      updated.configurationStatus = computeAdoptionLadderStatus(updated);
      return updated;
    });
  };

  const removeStage = (stageId) => {
    setAdoptionLadder((prev) => {
      if (prev.stages.length <= 2) return prev; // minimum 2 stages
      const newStages = prev.stages
        .filter((s) => s.id !== stageId)
        .map((s, i) => ({ ...s, order: i }));
      const newDefs = { ...prev.stageDefinitions };
      delete newDefs[stageId];
      // Clean up exit rules referencing the removed stage
      for (const sid of Object.keys(newDefs)) {
        newDefs[sid] = {
          ...newDefs[sid],
          exitRules: newDefs[sid].exitRules.map((r) =>
            r.movesTo === stageId ? { ...r, movesTo: "" } : r
          ),
        };
      }
      const updated = { ...prev, stages: newStages, stageDefinitions: newDefs };
      updated.configurationStatus = computeAdoptionLadderStatus(updated);
      return updated;
    });
  };

  const renameStage = (stageId, name) => {
    setAdoptionLadder((prev) => ({
      ...prev,
      stages: prev.stages.map((s) => (s.id === stageId ? { ...s, name } : s)),
    }));
  };

  const reorderStages = (newStagesArray) => {
    setAdoptionLadder((prev) => ({
      ...prev,
      stages: newStagesArray.map((s, i) => ({ ...s, order: i })),
    }));
  };

  const updateLadderSettings = (field, value) => {
    setAdoptionLadder((prev) => ({
      ...prev,
      settings: { ...prev.settings, [field]: value },
    }));
  };

  // ── Panel B: Stage Definitions ────────────────────────────────

  const updateStageDefinition = (stageId, field, value) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      const updated = {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: { ...def, [field]: value },
        },
      };
      updated.configurationStatus = computeAdoptionLadderStatus(updated);
      return updated;
    });
  };

  const updateStageEntryCriteria = (stageId, field, value) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      const newEntry = { ...def.entryCriteria, [field]: value };
      if (field === "source") newEntry.sourceField = "";
      const updated = {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: { ...def, entryCriteria: newEntry },
        },
      };
      updated.configurationStatus = computeAdoptionLadderStatus(updated);
      return updated;
    });
  };

  const addEntryCondition = (stageId) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      const newCond = { id: Date.now() + Math.random(), field: "", operator: "", value: "" };
      const updated = {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            entryCriteria: {
              ...def.entryCriteria,
              conditions: [...def.entryCriteria.conditions, newCond],
            },
          },
        },
      };
      updated.configurationStatus = computeAdoptionLadderStatus(updated);
      return updated;
    });
  };

  const removeEntryCondition = (stageId, conditionId) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      const oldConds = def.entryCriteria.conditions;
      const removedIndex = oldConds.findIndex((c) => c.id === conditionId);
      if (removedIndex === -1) return prev;
      const newConds = oldConds.filter((c) => c.id !== conditionId);
      const oldOps = def.entryCriteria.conditionOperators;
      const newOps = {};
      let gap = 0;
      for (let i = 0; i < oldConds.length - 1; i++) {
        if (i === removedIndex || i === removedIndex - 1) {
          if (i === removedIndex - 1 && removedIndex < oldConds.length - 1) {
            newOps[gap] = oldOps[i] || "AND";
            gap++;
          }
          continue;
        }
        newOps[gap] = oldOps[i] || "AND";
        gap++;
      }
      const updated = {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            entryCriteria: { ...def.entryCriteria, conditions: newConds, conditionOperators: newOps },
          },
        },
      };
      updated.configurationStatus = computeAdoptionLadderStatus(updated);
      return updated;
    });
  };

  const updateEntryCondition = (stageId, conditionId, field, value) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      const newConds = def.entryCriteria.conditions.map((c) => {
        if (c.id !== conditionId) return c;
        if (field === "field") return { ...c, field: value, operator: "", value: "" };
        return { ...c, [field]: value };
      });
      const updated = {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            entryCriteria: { ...def.entryCriteria, conditions: newConds },
          },
        },
      };
      updated.configurationStatus = computeAdoptionLadderStatus(updated);
      return updated;
    });
  };

  const setEntryConditionOperator = (stageId, gapIndex, value) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            entryCriteria: {
              ...def.entryCriteria,
              conditionOperators: {
                ...def.entryCriteria.conditionOperators,
                [gapIndex]: value,
              },
            },
          },
        },
      };
    });
  };

  // ── Exit rules ────────────────────────────────────────────────

  const addExitRule = (stageId, defaultMovesTo = "") => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      const newRule = {
        id: Date.now() + Math.random(),
        conditions: [],
        conditionOperators: {},
        movesTo: defaultMovesTo,
        source: "",
        sourceField: "",
      };
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: { ...def, exitRules: [...def.exitRules, newRule] },
        },
      };
    });
  };

  const removeExitRule = (stageId, ruleId) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      const updated = {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            exitRules: def.exitRules.filter((r) => r.id !== ruleId),
          },
        },
      };
      updated.configurationStatus = computeAdoptionLadderStatus(updated);
      return updated;
    });
  };

  const updateExitRuleMovesTo = (stageId, ruleId, targetStageId) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            exitRules: def.exitRules.map((r) =>
              r.id === ruleId ? { ...r, movesTo: targetStageId } : r
            ),
          },
        },
      };
    });
  };

  const updateExitRuleSource = (stageId, ruleId, field, value) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            exitRules: def.exitRules.map((r) => {
              if (r.id !== ruleId) return r;
              if (field === "source") return { ...r, source: value, sourceField: "" };
              return { ...r, [field]: value };
            }),
          },
        },
      };
    });
  };

  const addExitRuleCondition = (stageId, ruleId) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      const newCond = { id: Date.now() + Math.random(), field: "", operator: "", value: "" };
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            exitRules: def.exitRules.map((r) =>
              r.id === ruleId
                ? { ...r, conditions: [...r.conditions, newCond] }
                : r
            ),
          },
        },
      };
    });
  };

  const removeExitRuleCondition = (stageId, ruleId, conditionId) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            exitRules: def.exitRules.map((r) => {
              if (r.id !== ruleId) return r;
              const oldConds = r.conditions;
              const removedIdx = oldConds.findIndex((c) => c.id === conditionId);
              if (removedIdx === -1) return r;
              const newConds = oldConds.filter((c) => c.id !== conditionId);
              const oldOps = r.conditionOperators;
              const newOps = {};
              let gap = 0;
              for (let i = 0; i < oldConds.length - 1; i++) {
                if (i === removedIdx || i === removedIdx - 1) {
                  if (i === removedIdx - 1 && removedIdx < oldConds.length - 1) {
                    newOps[gap] = oldOps[i] || "AND";
                    gap++;
                  }
                  continue;
                }
                newOps[gap] = oldOps[i] || "AND";
                gap++;
              }
              return { ...r, conditions: newConds, conditionOperators: newOps };
            }),
          },
        },
      };
    });
  };

  const updateExitRuleCondition = (stageId, ruleId, conditionId, field, value) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            exitRules: def.exitRules.map((r) => {
              if (r.id !== ruleId) return r;
              return {
                ...r,
                conditions: r.conditions.map((c) => {
                  if (c.id !== conditionId) return c;
                  if (field === "field") return { ...c, field: value, operator: "", value: "" };
                  return { ...c, [field]: value };
                }),
              };
            }),
          },
        },
      };
    });
  };

  const setExitRuleConditionOperator = (stageId, ruleId, gapIndex, value) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            exitRules: def.exitRules.map((r) => {
              if (r.id !== ruleId) return r;
              return {
                ...r,
                conditionOperators: { ...r.conditionOperators, [gapIndex]: value },
              };
            }),
          },
        },
      };
    });
  };

  // ── Trigger actions ───────────────────────────────────────────

  const updateTrigger = (stageId, field, value) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            trigger: { ...(def.trigger || {}), [field]: value },
          },
        },
      };
    });
  };

  const addActionGroup = (stageId) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      const newGroup = {
        id: `ag-${Date.now()}-${Math.random()}`,
        type: "score",
        condOp: "≥",
        threshold: "",
        minCount: "",
        // custom condition fields
        source: "",
        field: "",
        operator: "",
        value: "",
      };
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            trigger: {
              ...(def.trigger || {}),
              actionGroups: [...(def.trigger?.actionGroups || []), newGroup],
            },
          },
        },
      };
    });
  };

  const updateActionGroup = (stageId, groupId, field, value) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            trigger: {
              ...(def.trigger || {}),
              actionGroups: (def.trigger?.actionGroups || []).map((g) =>
                g.id === groupId ? { ...g, [field]: value } : g
              ),
            },
          },
        },
      };
    });
  };

  const removeActionGroup = (stageId, groupId) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            trigger: {
              ...(def.trigger || {}),
              actionGroups: (def.trigger?.actionGroups || []).filter((g) => g.id !== groupId),
            },
          },
        },
      };
    });
  };

  const addCustomRule = (stageId) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      const newRule = { id: `cr-${Date.now()}-${Math.random()}`, field: "", operator: "", value: "" };
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            trigger: {
              ...(def.trigger || {}),
              customRules: [...(def.trigger?.customRules || []), newRule],
            },
          },
        },
      };
    });
  };

  const updateCustomRule = (stageId, ruleId, field, value) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            trigger: {
              ...(def.trigger || {}),
              customRules: (def.trigger?.customRules || []).map((r) =>
                r.id === ruleId ? { ...r, [field]: value } : r
              ),
            },
          },
        },
      };
    });
  };

  const removeCustomRule = (stageId, ruleId) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            trigger: {
              ...(def.trigger || {}),
              customRules: (def.trigger?.customRules || []).filter((r) => r.id !== ruleId),
            },
          },
        },
      };
    });
  };

  const setCustomRuleOperator = (stageId, gapIndex, value) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            trigger: {
              ...(def.trigger || {}),
              customRuleOperators: { ...(def.trigger?.customRuleOperators || {}), [gapIndex]: value },
            },
          },
        },
      };
    });
  };

  // ── Operational context ───────────────────────────────────────

  const updateOperationalContext = (stageId, field, value) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      return {
        ...prev,
        stageDefinitions: {
          ...prev.stageDefinitions,
          [stageId]: {
            ...def,
            operationalContext: { ...def.operationalContext, [field]: value },
          },
        },
      };
    });
  };

  // ═══ Provider ═════════════════════════════════════════════════

  return (
    <DomainDefinitionContext.Provider
      value={{
        // Concept state
        concepts,
        customDefaults,
        customConcepts,
        updateConcept,
        addSource,
        removeSource,
        updateSourceField,
        addSourceCondition,
        removeSourceCondition,
        updateSourceCondition,
        setSourceConditionOperator,
        setSourceOperator,
        duplicateConcept,
        resetDefinition,
        setCustomDefault,
        clearCustomDefault,
        getTabStats,
        // Adoption Ladder state
        adoptionLadder,
        addStage,
        removeStage,
        renameStage,
        reorderStages,
        updateLadderSettings,
        updateStageDefinition,
        updateStageEntryCriteria,
        addEntryCondition,
        removeEntryCondition,
        updateEntryCondition,
        setEntryConditionOperator,
        addExitRule,
        removeExitRule,
        updateExitRuleMovesTo,
        updateExitRuleSource,
        addExitRuleCondition,
        removeExitRuleCondition,
        updateExitRuleCondition,
        setExitRuleConditionOperator,
        updateOperationalContext,
        // Trigger actions
        updateTrigger,
        addActionGroup,
        updateActionGroup,
        removeActionGroup,
        addCustomRule,
        updateCustomRule,
        removeCustomRule,
        setCustomRuleOperator,
      }}
    >
      {children}
    </DomainDefinitionContext.Provider>
  );
}

export function useDomainDefinitionContext() {
  const ctx = useContext(DomainDefinitionContext);
  if (!ctx)
    throw new Error(
      "useDomainDefinitionContext must be used inside DomainDefinitionProvider"
    );
  return ctx;
}
