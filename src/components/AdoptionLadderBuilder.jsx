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
import ConditionBuilder, {
  ADOPTION_SOURCE_OPTIONS,
  ADOPTION_FIELDS_BY_SOURCE,
  DURATION_OPTIONS,
  computeStageStatus,
  stageStatusConfig,
} from "./ConditionBuilder";
import SearchableDropdown from "./SearchableDropdown";
import {
  DragHandleIcon,
  EditPencilIcon,
  CloseIcon,
  ChevronDownIcon,
  PlusSmallIcon,
  TrashIcon,
} from "./icons";

// ── Sortable Stage Card (unified: DnD + expandable definition) ──
function SortableStageCard({
  stage,
  index,
  isFirst,
  allStages,
  expandedId,
  onToggleExpand,
  onRename,
  onRemove,
  canRemove,
}) {
  const [editing, setEditing] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const {
    adoptionLadder,
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
  } = useDomainDefinitionContext();

  const def = adoptionLadder.stageDefinitions[stage.id];
  const isExpanded = expandedId === stage.id;
  const stageStatus = computeStageStatus(def, isFirst);
  const statusCfg = stageStatusConfig[stageStatus];

  // Move-to options for exit rules
  const otherStages = allStages.filter((s) => s.id !== stage.id);
  const moveToOptions = adoptionLadder.settings.allowBackward
    ? otherStages.map((s) => s.name)
    : otherStages.filter((s) => s.order > stage.order).map((s) => s.name);

  const getStageIdByName = (name) =>
    allStages.find((s) => s.name === name)?.id || "";
  const getStageNameById = (id) =>
    allStages.find((s) => s.id === id)?.name || "";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  if (!def) return null;

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col items-center">
      <div
        className={`w-full overflow-hidden rounded-xl border transition-shadow ${
          isDragging
            ? "border-[#155dfc] shadow-lg"
            : "border-[#e5e7eb] hover:border-[#d1d5dc]"
        } bg-white`}
      >
        {/* ── Collapsed header row ── */}
        <div
          {...attributes}
          {...listeners}
          className="flex w-full cursor-grab items-center gap-3 touch-none px-4 py-3 active:cursor-grabbing"
        >
          {/* Drag handle (visual indicator) */}
          <span className="shrink-0 text-[#9ca3af]">
            <DragHandleIcon />
          </span>

          {/* Number badge */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#155dfc]">
            <span className="text-xs font-bold text-white">{index + 1}</span>
          </div>

          {/* Clickable expand zone */}
          <div
            className="flex flex-1 cursor-pointer items-center gap-3"
            onClick={() => onToggleExpand(stage.id)}
          >
            {/* Name — editable inline */}
            {editing ? (
              <input
                type="text"
                value={stage.name}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onRename(stage.id, e.target.value)}
                onBlur={() => setEditing(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
                autoFocus
                className="flex-1 rounded border-b-2 border-[#155dfc] bg-[#f9fafb] px-1.5 py-0.5 text-sm font-medium text-[#111318] outline-none"
              />
            ) : (
              <span className="flex-1 text-sm font-medium text-[#111318]">
                {stage.name}
              </span>
            )}

            {/* Status badge */}
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.badgeBg} ${statusCfg.badgeColor}`}
            >
              {statusCfg.text}
            </span>

            {/* Chevron */}
            <span
              className={`text-[#6a7282] transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            >
              <ChevronDownIcon />
            </span>
          </div>

          {/* Edit name button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="shrink-0 p-1 text-[#9ca3af] transition-colors hover:text-[#155dfc]"
          >
            <EditPencilIcon />
          </button>

          {/* Remove button */}
          {canRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(stage.id);
              }}
              className="shrink-0 p-1 text-[#9ca3af] transition-colors hover:text-[#dc2626]"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* ── Expanded definition content ── */}
        {isExpanded && (
          <div className="border-t border-[#e5e7eb] px-5 py-4">
            <div className="flex flex-col gap-5">
              {/* ── Section 1: Definition ── */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                  Definition
                </label>
                <textarea
                  value={def.definition}
                  onChange={(e) =>
                    updateStageDefinition(
                      stage.id,
                      "definition",
                      e.target.value
                    )
                  }
                  placeholder={`What does "${stage.name}" mean in your organization?`}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                />

                <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                  How is this stage determined?
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      value: "rep-assessed",
                      label: "Rep-assessed",
                      desc: "Manually set by rep in CRM",
                    },
                    {
                      value: "data-driven",
                      label: "Data-driven",
                      desc: "Calculated from rules below",
                    },
                    {
                      value: "hybrid",
                      label: "Hybrid",
                      desc: "System suggests, rep confirms",
                    },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="radio"
                        name={`detection-${stage.id}`}
                        checked={def.detectionMethod === opt.value}
                        onChange={() =>
                          updateStageDefinition(
                            stage.id,
                            "detectionMethod",
                            opt.value
                          )
                        }
                        className="h-4 w-4 border-[#d1d5dc] text-[#155dfc] focus:ring-[#155dfc]"
                      />
                      <span className="text-sm text-[#111318]">
                        {opt.label}
                      </span>
                      <span className="text-xs text-[#9ca3af]">
                        — {opt.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#f3f4f6]" />

              {/* ── Section 2: Qualifying Criteria ── */}
              <div className="flex flex-col gap-4">
                <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                  Qualifying Criteria
                </label>

                {/* Entry Criteria — only for the first stage */}
                {isFirst && (
                  <div className="flex flex-col gap-3 rounded-lg border border-[#e5e7eb] p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-wide text-[#4a5565]">
                        Entry Criteria
                      </span>
                      <p className="text-xs leading-relaxed text-[#6a7282]">
                        Define the conditions that place an HCP into this stage.
                        Select a data source and field, then build rules using
                        AND/OR logic to describe what qualifies someone for entry.
                      </p>
                    </div>

                    {/* Source mapping */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-[#4a5565]">
                          Source
                        </label>
                        <SearchableDropdown
                          value={def.entryCriteria.source}
                          options={ADOPTION_SOURCE_OPTIONS}
                          onChange={(val) =>
                            updateStageEntryCriteria(stage.id, "source", val)
                          }
                          placeholder="Select source..."
                        />
                      </div>
                      {def.entryCriteria.source && (
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-[#4a5565]">
                            Field
                          </label>
                          <SearchableDropdown
                            value={def.entryCriteria.sourceField}
                            options={
                              ADOPTION_FIELDS_BY_SOURCE[
                                def.entryCriteria.source
                              ] || []
                            }
                            onChange={(val) =>
                              updateStageEntryCriteria(
                                stage.id,
                                "sourceField",
                                val
                              )
                            }
                            placeholder="Select field..."
                          />
                        </div>
                      )}
                    </div>

                    <ConditionBuilder
                      conditions={def.entryCriteria.conditions}
                      conditionOperators={def.entryCriteria.conditionOperators}
                      source={def.entryCriteria.source}
                      onAddCondition={() => addEntryCondition(stage.id)}
                      onRemoveCondition={(condId) =>
                        removeEntryCondition(stage.id, condId)
                      }
                      onUpdateCondition={(condId, field, val) =>
                        updateEntryCondition(stage.id, condId, field, val)
                      }
                      onSetOperator={(gapIdx, val) =>
                        setEntryConditionOperator(stage.id, gapIdx, val)
                      }
                    />
                  </div>
                )}

                {/* Exit Criteria */}
                <div className="flex flex-col gap-3 rounded-lg border border-[#e5e7eb] p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#4a5565]">
                      Exit Criteria
                    </span>
                    <p className="text-xs leading-relaxed text-[#6a7282]">
                      Define the conditions that move an HCP out of this stage
                      and into the next. Each exit rule specifies the target
                      stage and the criteria that trigger the transition.
                    </p>
                  </div>

                  {def.exitRules.length === 0 && (
                    <p className="text-xs italic text-[#9ca3af]">
                      No exit rules defined yet.
                    </p>
                  )}

                  {def.exitRules.map((rule, ruleIdx) => (
                    <div
                      key={rule.id}
                      className="flex flex-col gap-3 rounded-lg border border-dashed border-[#d1d5dc] bg-[#fafbfc] p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#4a5565]">
                          Exit Rule {ruleIdx + 1}
                        </span>
                        <button
                          onClick={() => removeExitRule(stage.id, rule.id)}
                          className="p-1 text-[#6a7282] transition-colors hover:text-[#dc2626]"
                        >
                          <TrashIcon />
                        </button>
                      </div>

                      {/* Source for this exit rule */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-[#4a5565]">
                            Source
                          </label>
                          <SearchableDropdown
                            value={rule.source}
                            options={ADOPTION_SOURCE_OPTIONS}
                            onChange={(val) =>
                              updateExitRuleSource(
                                stage.id,
                                rule.id,
                                "source",
                                val
                              )
                            }
                            placeholder="Select source..."
                          />
                        </div>
                        {rule.source && (
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-[#4a5565]">
                              Field
                            </label>
                            <SearchableDropdown
                              value={rule.sourceField}
                              options={
                                ADOPTION_FIELDS_BY_SOURCE[rule.source] || []
                              }
                              onChange={(val) =>
                                updateExitRuleSource(
                                  stage.id,
                                  rule.id,
                                  "sourceField",
                                  val
                                )
                              }
                              placeholder="Select field..."
                            />
                          </div>
                        )}
                      </div>

                      <ConditionBuilder
                        conditions={rule.conditions}
                        conditionOperators={rule.conditionOperators}
                        source={rule.source}
                        onAddCondition={() =>
                          addExitRuleCondition(stage.id, rule.id)
                        }
                        onRemoveCondition={(condId) =>
                          removeExitRuleCondition(stage.id, rule.id, condId)
                        }
                        onUpdateCondition={(condId, field, val) =>
                          updateExitRuleCondition(
                            stage.id,
                            rule.id,
                            condId,
                            field,
                            val
                          )
                        }
                        onSetOperator={(gapIdx, val) =>
                          setExitRuleConditionOperator(
                            stage.id,
                            rule.id,
                            gapIdx,
                            val
                          )
                        }
                      />

                      {/* Moves to */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-[#4a5565]">
                          Moves to:
                        </span>
                        <div className="w-48">
                          <SearchableDropdown
                            value={getStageNameById(rule.movesTo)}
                            options={moveToOptions}
                            onChange={(val) =>
                              updateExitRuleMovesTo(
                                stage.id,
                                rule.id,
                                getStageIdByName(val)
                              )
                            }
                            placeholder="Select stage..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addExitRule(stage.id)}
                    className="flex items-center gap-2 self-start rounded-xl border-2 border-dashed border-[#cbd5e1] px-3 py-1.5 transition-colors hover:border-[#94a3b8] hover:bg-gray-50"
                  >
                    <PlusSmallIcon />
                    <span className="text-xs font-semibold text-[#616f89]">
                      Add Exit Rule
                    </span>
                  </button>
                </div>
              </div>

              <div className="border-t border-[#f3f4f6]" />

              {/* ── Section 3: Operational Context ── */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                  Operational Context
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#4a5565]">
                      Expected Duration in this Stage
                    </label>
                    <SearchableDropdown
                      value={def.operationalContext.expectedDuration}
                      options={DURATION_OPTIONS}
                      onChange={(val) =>
                        updateOperationalContext(
                          stage.id,
                          "expectedDuration",
                          val
                        )
                      }
                      placeholder="Select duration..."
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#4a5565]">
                      Flag if Stuck Longer Than
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={def.operationalContext.flagStuckAfter}
                        onChange={(e) =>
                          updateOperationalContext(
                            stage.id,
                            "flagStuckAfter",
                            e.target.value
                          )
                        }
                        placeholder="e.g. 9"
                        className="w-24 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                      />
                      <span className="text-sm text-[#6a7282]">months</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#4a5565]">
                    Key Barriers{" "}
                    <span className="text-[#9ca3af]">(optional)</span>
                  </label>
                  <textarea
                    value={def.operationalContext.keyBarriers}
                    onChange={(e) =>
                      updateOperationalContext(
                        stage.id,
                        "keyBarriers",
                        e.target.value
                      )
                    }
                    placeholder="e.g., Concerned about side effects in elderly patients. Wants more RWE."
                    rows={2}
                    className="w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#4a5565]">
                    Recommended Actions{" "}
                    <span className="text-[#9ca3af]">(optional)</span>
                  </label>
                  <textarea
                    value={def.operationalContext.recommendedActions}
                    onChange={(e) =>
                      updateOperationalContext(
                        stage.id,
                        "recommendedActions",
                        e.target.value
                      )
                    }
                    placeholder="e.g., Share Phase IV data. Invite to peer-to-peer program with adopters."
                    rows={2}
                    className="w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Builder Component ──────────────────────────────────────
export default function AdoptionLadderBuilder() {
  const {
    adoptionLadder,
    addStage,
    removeStage,
    renameStage,
    reorderStages,
  } = useDomainDefinitionContext();
  const [newStageName, setNewStageName] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const { stages } = adoptionLadder;
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = () => {
    setExpandedId(null); // collapse any expanded card during drag
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedStages.findIndex((s) => s.id === active.id);
    const newIndex = sortedStages.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sortedStages, oldIndex, newIndex);
    reorderStages(reordered);
  };

  const handleAddStage = () => {
    const name = newStageName.trim() || `Stage ${stages.length + 1}`;
    addStage(name);
    setNewStageName("");
  };

  const handleToggleExpand = (stageId) => {
    setExpandedId((prev) => (prev === stageId ? null : stageId));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stage list with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedStages.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-0">
            {sortedStages.map((stage, index) => (
              <div key={stage.id}>
                <SortableStageCard
                  stage={stage}
                  index={index}
                  isFirst={index === 0}
                  allStages={sortedStages}
                  expandedId={expandedId}
                  onToggleExpand={handleToggleExpand}
                  onRename={renameStage}
                  onRemove={removeStage}
                  canRemove={stages.length > 2}
                />
                {/* Arrow between stages */}
                {index < sortedStages.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-0.5 bg-[#d1d5dc]" />
                      <svg
                        width="10"
                        height="6"
                        viewBox="0 0 10 6"
                        fill="none"
                      >
                        <path d="M0 0L5 6L10 0" fill="#d1d5dc" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Stage */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={newStageName}
          onChange={(e) => setNewStageName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddStage()}
          placeholder="New stage name..."
          className="flex-1 rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
        />
        <button
          onClick={handleAddStage}
          className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#cbd5e1] px-4 py-2 transition-colors hover:border-[#94a3b8] hover:bg-gray-50"
        >
          <PlusSmallIcon />
          <span className="text-sm font-semibold text-[#616f89]">
            Add Stage
          </span>
        </button>
      </div>

      {/* Settings toggles — hidden for now */}
    </div>
  );
}
