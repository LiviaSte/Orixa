import { createContext, useContext, useState } from "react";

const DomainDefinitionContext = createContext(null);

// ── Concept IDs grouped by tab ─────────────────────────────────
const TAB_CONCEPT_IDS = {
  "people-organizations": [
    "hcp",
    "hcp-specialty",
    "hcp-tier",
    "account",
    "account-hierarchy",
    "hcp-account-link",
    "kol",
  ],
  "products-therapy": [
    "product-hierarchy",
    "product",
    "competitors",
    "indication",
    "product-hcp-relevance",
  ],
  "commercial-funnel": [
    "lead",
    "conversion",
    "interaction-types",
    "interaction-weighting",
    "call-plan-rules",
  ],
  "geography-territories": [
    "territory-structure",
    "territory-assignment",
    "territory-overlap-rules",
    "rep-territory-mapping",
  ],
  "metrics-kpis": [
    "sales-metric",
    "sales-type",
    "market-share-definition",
    "time-periods",
    "targets-goals",
  ],
};

// ── Default names ───────────────────────────────────────────────
const DEFAULT_NAMES = {
  hcp: "HCP",
  "hcp-specialty": "HCP Specialty",
  "hcp-tier": "HCP Tier",
  account: "Account",
  "account-hierarchy": "Account Hierarchy",
  "hcp-account-link": "HCP \u2194 Account Link",
  kol: "KOL",
  "product-hierarchy": "Product Hierarchy",
  product: "Product",
  competitors: "Competitors",
  indication: "Indication",
  "product-hcp-relevance": "Product \u2194 HCP Relevance",
  lead: "Lead",
  conversion: "Conversion",
  "interaction-types": "Interaction Types",
  "interaction-weighting": "Interaction Weighting",
  "call-plan-rules": "Call Plan Rules",
  "territory-structure": "Territory Structure",
  "territory-assignment": "Territory Assignment",
  "territory-overlap-rules": "Territory Overlap Rules",
  "rep-territory-mapping": "Rep\u2013Territory Mapping",
  "sales-metric": "Sales Metric",
  "sales-type": "Sales Type",
  "market-share-definition": "Market Share Definition",
  "time-periods": "Time Periods",
  "targets-goals": "Targets/Goals",
};

// ── Status computation ──────────────────────────────────────────
function computeStatus({ definition, source, conditions, constraints }) {
  const hasDefinition = definition && definition.trim() !== "";
  const hasSource = source && source.trim() !== "";
  const hasConditions =
    conditions &&
    conditions.length > 0 &&
    conditions.some((c) => c.field && c.operator && c.value);

  if (hasDefinition && hasSource && hasConditions) return "defined";
  if (
    hasDefinition ||
    hasSource ||
    hasConditions ||
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
        source: "",
        sourceField: "",
        conditions: [],
        conditionOperators: {},
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
    detectionMethod: "rep-assessed",
    entryCriteria: {
      conditions: [],
      conditionOperators: {},
      source: "",
      sourceField: "",
    },
    exitRules: [],
    operationalContext: {
      expectedDuration: "",
      flagStuckAfter: "",
      keyBarriers: "",
      recommendedActions: "",
    },
  };
}

const DEFAULT_STAGES = [
  { id: "stage-1", name: "Unaware", order: 0 },
  { id: "stage-2", name: "Aware", order: 1 },
  { id: "stage-3", name: "Interested", order: 2 },
  { id: "stage-4", name: "Trialist", order: 3 },
  { id: "stage-5", name: "Adopter", order: 4 },
  { id: "stage-6", name: "Advocate", order: 5 },
];

function buildDefaultAdoptionLadder() {
  const defs = {};
  for (const stage of DEFAULT_STAGES) {
    defs[stage.id] = buildEmptyStageDefinition();
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
    const isLast = stage.order === stages.length - 1;
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
  const [adoptionLadder, setAdoptionLadder] = useState(buildDefaultAdoptionLadder);

  // ═══ Concept actions ══════════════════════════════════════════

  const updateConcept = (conceptId, field, value) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;
      const updated = { ...current, [field]: value };
      if (field === "source") {
        updated.sourceField = "";
      }
      updated.status = computeStatus(updated);
      return { ...prev, [conceptId]: updated };
    });
  };

  const addCondition = (conceptId) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;
      const newCondition = {
        id: Date.now() + Math.random(),
        field: "",
        operator: "",
        value: "",
      };
      const updated = {
        ...current,
        conditions: [...current.conditions, newCondition],
      };
      updated.status = computeStatus(updated);
      return { ...prev, [conceptId]: updated };
    });
  };

  const removeCondition = (conceptId, conditionId) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;

      const oldConditions = current.conditions;
      const removedIndex = oldConditions.findIndex((c) => c.id === conditionId);
      if (removedIndex === -1) return prev;

      const newConditions = oldConditions.filter((c) => c.id !== conditionId);
      const oldOps = current.conditionOperators;
      const newOps = {};
      let newGap = 0;
      for (let i = 0; i < oldConditions.length - 1; i++) {
        if (i === removedIndex || i === removedIndex - 1) {
          if (i === removedIndex - 1 && removedIndex < oldConditions.length - 1) {
            newOps[newGap] = oldOps[i] || "AND";
            newGap++;
          }
          continue;
        }
        newOps[newGap] = oldOps[i] || "AND";
        newGap++;
      }

      const updated = {
        ...current,
        conditions: newConditions,
        conditionOperators: newOps,
      };
      updated.status = computeStatus(updated);
      return { ...prev, [conceptId]: updated };
    });
  };

  const updateCondition = (conceptId, conditionId, field, value) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;
      const newConditions = current.conditions.map((c) => {
        if (c.id !== conditionId) return c;
        if (field === "field") {
          return { ...c, field: value, operator: "", value: "" };
        }
        return { ...c, [field]: value };
      });
      const updated = { ...current, conditions: newConditions };
      updated.status = computeStatus(updated);
      return { ...prev, [conceptId]: updated };
    });
  };

  const setConditionOperator = (conceptId, gapIndex, value) => {
    setConcepts((prev) => {
      const current = prev[conceptId];
      if (!current) return prev;
      return {
        ...prev,
        [conceptId]: {
          ...current,
          conditionOperators: {
            ...current.conditionOperators,
            [gapIndex]: value,
          },
        },
      };
    });
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
    const ids = TAB_CONCEPT_IDS[tabKey] || [];
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

  const addExitRule = (stageId) => {
    setAdoptionLadder((prev) => {
      const def = prev.stageDefinitions[stageId];
      if (!def) return prev;
      const newRule = {
        id: Date.now() + Math.random(),
        conditions: [],
        conditionOperators: {},
        movesTo: "",
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
        updateConcept,
        addCondition,
        removeCondition,
        updateCondition,
        setConditionOperator,
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
