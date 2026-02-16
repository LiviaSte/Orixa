import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { useDomainDefinitionContext } from "../DomainDefinitionContext";
import SearchableDropdown from "../components/SearchableDropdown";
import {
  SearchIcon20,
  FilterIcon,
  ChevronDownIcon,
  GreenCheckIcon,
  ConflictTriangleIcon,
  NotConfiguredIcon,
  PlusSmallIcon,
  TrashIcon,
  EditPencilIcon,
} from "../components/icons";

// ── Shared operator options ─────────────────────────────────────
const DEFAULT_OPERATORS = [
  "is",
  "is not",
  "contains",
  "does not contain",
  "equals",
  "greater than",
  "less than",
  "in",
  "not in",
];

// ── Tab & concept data ──────────────────────────────────────────
const TABS = [
  {
    key: "people-organizations",
    label: "People & Organizations",
    concepts: [
      {
        id: "hcp",
        defaultName: "HCP",
        defaultDefinition:
          "An HCP is any individual healthcare professional with prescribing authority or clinical influence who is a target for commercial engagement. Define whether this includes only prescribers, or also pharmacists, nurses, and KOLs.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Contact.Role", "Contact.RecordType", "Contact.Status__c", "Contact.Specialty__c", "Contact.Credentials__c"],
          Salesforce: ["Contact.RecordType", "Contact.HCP_Role__c", "Contact.Status", "Contact.Specialty"],
          "Manual database": ["HCP_Registry.Role", "HCP_Registry.Type", "HCP_Registry.Status", "HCP_Registry.License_Type"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "hcp-specialty",
        defaultName: "HCP Specialty",
        defaultDefinition:
          "The medical discipline or therapeutic focus an HCP practices. Define which specialties matter for your business and how you group them (e.g., Specialists vs. PCPs).",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Contact.Specialty__c", "Contact.Primary_Specialty__c", "Contact.Sub_Specialty__c"],
          Salesforce: ["Contact.Specialty", "Contact.Specialty_Group__c"],
          "Manual database": ["Specialty_Lookup.Name", "Specialty_Lookup.Group", "Specialty_Lookup.Category"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "hcp-tier",
        defaultName: "HCP Tier",
        defaultDefinition:
          "The segmentation tier that determines an HCP's priority level. Define what makes an HCP A-tier, B-tier, etc. (e.g., A-tier = top decile by Rx volume, Target = on current call plan).",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Contact.Tier__c", "Contact.Target_Flag__c", "Contact.Rx_Decile__c", "Contact.Status__c"],
          Salesforce: ["Contact.HCP_Tier__c", "Contact.Priority__c", "Contact.Target_Status__c"],
          "Manual database": ["HCP_Tier.Level", "HCP_Tier.Rx_Volume", "HCP_Tier.Active_Flag"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "account",
        defaultName: "Account",
        defaultDefinition:
          "An organization that employs or is affiliated with HCPs. Define what counts as an account: hospitals, clinics, pharmacy chains, buying groups, or other entities.",
        sourceOptions: ["Veeva CRM", "Salesforce", "SAP"],
        fieldsBySource: {
          "Veeva CRM": ["Account.RecordType", "Account.Account_Type__c", "Account.Channel__c", "Account.Status__c"],
          Salesforce: ["Account.RecordType", "Account.Type", "Account.Industry", "Account.Status__c"],
          SAP: ["Business_Partner.Type", "Business_Partner.Channel", "Business_Partner.Category"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "account-hierarchy",
        defaultName: "Account Hierarchy",
        defaultDefinition:
          "The parent-child relationships between accounts. Define how many hierarchy levels exist (e.g., ward → department → hospital → hospital group) and how data should roll up.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Account.ParentId", "Account.Hierarchy_Level__c", "Account.Ultimate_Parent__c"],
          Salesforce: ["Account.ParentId", "Account.Hierarchy_Level__c", "Account.Top_Level_Account__c"],
          "Manual database": ["Org_Hierarchy.Parent_ID", "Org_Hierarchy.Level", "Org_Hierarchy.Level_Name"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "hcp-account-link",
        defaultName: "HCP ↔ Account Link",
        defaultDefinition:
          "The relationship between HCPs and their affiliated accounts. Define whether an HCP can belong to multiple accounts, which is primary, and what role they play at each.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Affiliation.Role__c", "Affiliation.Is_Primary__c", "Affiliation.Status__c"],
          Salesforce: ["AccountContactRelation.Roles", "AccountContactRelation.IsDirect", "AccountContactRelation.IsActive"],
          "Manual database": ["HCP_Account_Map.Relationship_Type", "HCP_Account_Map.Is_Primary", "HCP_Account_Map.Status"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "kol",
        defaultName: "KOL",
        defaultDefinition:
          "A Key Opinion Leader — an HCP who influences prescribing behavior through publications, advisory boards, or peer authority. Define the criteria that distinguish a KOL from a regular HCP.",
        sourceOptions: ["Veeva CRM", "Manual database", "Third-party"],
        fieldsBySource: {
          "Veeva CRM": ["Contact.KOL_Flag__c", "Contact.KOL_Score__c", "Contact.Publication_Count__c", "Contact.Advisory_Board__c"],
          "Manual database": ["KOL_Registry.Status", "KOL_Registry.Influence_Score", "KOL_Registry.Criteria"],
          "Third-party": ["KOL_Intelligence.Score", "KOL_Intelligence.Tier", "KOL_Intelligence.Therapeutic_Area"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
    ],
  },
  {
    key: "products-therapy",
    label: "Products & Therapy",
    concepts: [
      {
        id: "product-hierarchy",
        defaultName: "Product Hierarchy",
        defaultDefinition:
          "The levels at which you organize products: Therapeutic Area → Molecule → Brand → SKU → Formulation. Define which levels your organization uses and how they nest.",
        sourceOptions: ["Veeva CRM", "Salesforce", "SAP"],
        fieldsBySource: {
          "Veeva CRM": ["Product_vod__c.ParentId", "Product_vod__c.Level__c", "Product_vod__c.Therapeutic_Area__c"],
          Salesforce: ["Product2.Family", "Product2.Product_Level__c", "Product2.Therapeutic_Area__c"],
          SAP: ["Material_Group.Level", "Material_Group.Parent_Group", "Material_Group.Category"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "product",
        defaultName: "Product",
        defaultDefinition:
          "The core unit you track commercially. Define whether you track at Brand level, SKU level, or another unit. This is the fundamental dimension for all sales and prescribing analyses.",
        sourceOptions: ["Veeva CRM", "Salesforce", "SAP"],
        fieldsBySource: {
          "Veeva CRM": ["Product_vod__c.Name", "Product_vod__c.Type__c", "Product_vod__c.Status__c", "Product_vod__c.Is_Active__c"],
          Salesforce: ["Product2.Name", "Product2.ProductCode", "Product2.IsActive", "Product2.Family"],
          SAP: ["Material_Master.Material_Type", "Material_Master.Material_Group", "Material_Master.Status"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "competitors",
        defaultName: "Competitors",
        defaultDefinition:
          "Competing products or molecules you track for market share, share of voice, and competitive intelligence. Define which competitor products/molecules are in scope.",
        sourceOptions: ["Veeva CRM", "Manual database", "IQVIA"],
        fieldsBySource: {
          "Veeva CRM": ["Product_vod__c.Competitor__c", "Product_vod__c.Competitor_Name__c", "Product_vod__c.Molecule__c"],
          "Manual database": ["Competitor_Products.Name", "Competitor_Products.Molecule", "Competitor_Products.Manufacturer"],
          IQVIA: ["Competitor_Feed.Product_Name", "Competitor_Feed.Molecule", "Competitor_Feed.Market_Segment"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "indication",
        defaultName: "Indication",
        defaultDefinition:
          "The therapeutic indication(s) a product is approved for. Define whether you track strategies per indication, especially when the same molecule serves multiple indications.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Indication__c.Name", "Indication__c.Product__c", "Indication__c.Is_Primary__c"],
          Salesforce: ["Indication__c.Name", "Indication__c.Therapeutic_Area__c", "Indication__c.Approval_Status__c"],
          "Manual database": ["Indication_Lookup.Name", "Indication_Lookup.Product_ID", "Indication_Lookup.Status"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "product-hcp-relevance",
        defaultName: "Product ↔ HCP Relevance",
        defaultDefinition:
          "Which products are relevant to which HCP specialties or segments. Define the matching logic so that a dermatologist doesn't appear in a cardiology dashboard.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Product_Metrics_vod__c.Specialty__c", "Product_Metrics_vod__c.Relevance_Score__c"],
          Salesforce: ["HCP_Product_Interest__c.Product__c", "HCP_Product_Interest__c.Specialty__c", "HCP_Product_Interest__c.Score__c"],
          "Manual database": ["Product_HCP_Map.Product_ID", "Product_HCP_Map.Specialty", "Product_HCP_Map.Relevance"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
    ],
  },
  {
    key: "commercial-funnel",
    label: "Commercial Funnel",
    concepts: [
      {
        id: "lead",
        defaultName: "Lead",
        defaultDefinition:
          "An unqualified or new target entering your commercial pipeline. Define what a lead means: a new HCP to convert, a hospital to onboard, a formulary opportunity, or a tender to pursue.",
        sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
        fieldsBySource: {
          Salesforce: ["Lead.Status", "Lead.LeadSource", "Lead.Rating", "Lead.Type__c"],
          "Veeva CRM": ["Lead__c.Status__c", "Lead__c.Source__c", "Lead__c.Type__c"],
          HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.Lead_Status", "Contacts.Lead_Source"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "conversion",
        defaultName: "Conversion",
        defaultDefinition:
          "The ultimate success event in your funnel. Define what 'converted' means: first prescription, sustained prescribing above threshold, formulary win, or contract signature.",
        sourceOptions: ["Salesforce", "Veeva CRM", "Manual database"],
        fieldsBySource: {
          Salesforce: ["Lead.ConvertedOpportunityId", "Lead.ConvertedDate", "Opportunity.StageName"],
          "Veeva CRM": ["Conversion_Event__c.Type__c", "Conversion_Event__c.Date__c", "Conversion_Event__c.Criteria_Met__c"],
          "Manual database": ["Conversion_Log.Event_Type", "Conversion_Log.Date", "Conversion_Log.Criteria"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "interaction-types",
        defaultName: "Interaction Types",
        defaultDefinition:
          "The types of commercial engagement your teams execute. Define each type: face-to-face visit, remote detail, email, webinar, congress meeting, sample drop, etc.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Call2_vod__c.Call_Type", "Call2_vod__c.Channel__c", "Call2_vod__c.Status__c"],
          Salesforce: ["Task.Type", "Task.Subject", "Task.Channel__c", "Task.Status"],
          "Manual database": ["Interaction_Type_Lookup.Name", "Interaction_Type_Lookup.Channel", "Interaction_Type_Lookup.Category"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "interaction-weighting",
        defaultName: "Interaction Weighting",
        defaultDefinition:
          "The relative value or weight assigned to each interaction type. Define whether a face-to-face counts more than an email, and what scoring model applies.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Call2_vod__c.Score__c", "Call2_vod__c.Weight__c", "Call2_vod__c.Impact__c"],
          Salesforce: ["Activity.Value__c", "Activity.Weight__c", "Activity.Points__c"],
          "Manual database": ["Interaction_Value_Rules.Type", "Interaction_Value_Rules.Weight", "Interaction_Value_Rules.Multiplier"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "call-plan-rules",
        defaultName: "Call Plan Rules",
        defaultDefinition:
          "The engagement frequency targets per HCP tier per cycle. Define how many interactions each rep should complete per tier (e.g., A-tier: 6 F2F/quarter, B-tier: 3 F2F/quarter).",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Call_Plan__c.Tier__c", "Call_Plan__c.Target_Calls__c", "Call_Plan__c.Period__c", "Call_Plan__c.Channel__c"],
          Salesforce: ["Call_Plan_Config__c.Tier__c", "Call_Plan_Config__c.Target__c", "Call_Plan_Config__c.Period__c"],
          "Manual database": ["Call_Plan_Rules.Tier", "Call_Plan_Rules.Target_Count", "Call_Plan_Rules.Cycle"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
    ],
  },
  {
    key: "geography-territories",
    label: "Geography & Territories",
    concepts: [
      {
        id: "territory-structure",
        defaultName: "Territory Structure",
        defaultDefinition:
          "The geographic hierarchy your organization uses. Define how many levels exist (e.g., Nation → Region → Area → Brick), what each level is called, and how they nest.",
        sourceOptions: ["Veeva CRM", "Salesforce", "SAP"],
        fieldsBySource: {
          "Veeva CRM": ["Territory__c.Level__c", "Territory__c.Parent__c", "Territory__c.Type__c", "Territory__c.Name"],
          Salesforce: ["Territory2.Level", "Territory2.ParentId", "Territory2.Name", "Territory2.Type"],
          SAP: ["Sales_Region.Level", "Sales_Region.Parent_Region", "Sales_Region.Name"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "territory-assignment",
        defaultName: "Territory Assignment",
        defaultDefinition:
          "How HCPs and Accounts are assigned to territories. Define the method: by postal code, brick code, explicit assignment list, or address-based geocoding.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Territory_Assignment__c.Method__c", "Territory_Assignment__c.Zip_Code__c", "Territory_Assignment__c.Brick_Code__c"],
          Salesforce: ["UserTerritory2Association.RoleInTerritory", "UserTerritory2Association.IsActive"],
          "Manual database": ["Territory_Assignment.Assignment_Type", "Territory_Assignment.Postal_Code", "Territory_Assignment.Brick_Code"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "territory-overlap-rules",
        defaultName: "Territory Overlap Rules",
        defaultDefinition:
          "Whether territories can overlap, and under what conditions. Define if a specialist rep and generalist rep can cover the same area, and how to handle attribution.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Territory_Overlap__c.Overlap_Type__c", "Territory_Overlap__c.Priority__c", "Territory_Overlap__c.Attribution_Rule__c"],
          Salesforce: ["Territory_Rule__c.Allow_Overlap__c", "Territory_Rule__c.Priority__c"],
          "Manual database": ["Overlap_Config.Rule_Type", "Overlap_Config.Priority", "Overlap_Config.Attribution_Method"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "rep-territory-mapping",
        defaultName: "Rep–Territory Mapping",
        defaultDefinition:
          "How sales representatives are assigned to territories. Define whether it's one rep per territory or shared, and how handoffs work during vacancies.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Rep_Territory_vod__c.Rep_Id__c", "Rep_Territory_vod__c.Is_Primary__c", "Rep_Territory_vod__c.Start_Date__c"],
          Salesforce: ["UserTerritory2Association.UserId", "UserTerritory2Association.IsActive", "UserTerritory2Association.StartDate"],
          "Manual database": ["Rep_Territory_Map.Rep_ID", "Rep_Territory_Map.Territory_ID", "Rep_Territory_Map.Is_Shared"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
    ],
  },
  {
    key: "metrics-kpis",
    label: "Metrics & KPIs",
    hidden: true,
    concepts: [
      {
        id: "sales-metric",
        defaultName: "Sales Metric",
        defaultDefinition:
          "The fundamental number your organization tracks: units sold, revenue, patients treated, defined daily doses (DDD), or prescription count. This is the base measure for all commercial analysis.",
        sourceOptions: ["Veeva CRM", "IQVIA", "SAP"],
        fieldsBySource: {
          "Veeva CRM": ["Sales_Data_vod__c.Metric_Type__c", "Sales_Data_vod__c.Value__c", "Sales_Data_vod__c.Unit__c"],
          IQVIA: ["Sales_Metric_Feed.Metric_Type", "Sales_Metric_Feed.Value", "Sales_Metric_Feed.Unit"],
          SAP: ["Sales_Stat.Stat_Type", "Sales_Stat.Value", "Sales_Stat.Unit_of_Measure"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "sales-type",
        defaultName: "Sales Type",
        defaultDefinition:
          "Whether you track sell-in (to pharmacy/wholesaler), sell-out (to patient), or prescriptions. These are completely different data sources and meanings — define which one is primary.",
        sourceOptions: ["Veeva CRM", "IQVIA", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Sales_Data_vod__c.Type", "Sales_Data_vod__c.Channel__c", "Sales_Data_vod__c.Source__c"],
          IQVIA: ["Channel_Type.Name", "Channel_Type.Category", "Channel_Type.Data_Source"],
          "Manual database": ["Sales_Type_Lookup.Type", "Sales_Type_Lookup.Description", "Sales_Type_Lookup.Source"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "market-share-definition",
        defaultName: "Market Share Definition",
        defaultDefinition:
          "How you define market share: share of what total market, which competitors are in the denominator, and what the geographic/therapeutic perimeter is.",
        sourceOptions: ["IQVIA", "Veeva CRM", "Manual database"],
        fieldsBySource: {
          IQVIA: ["Market_Share_Report.Market_Definition", "Market_Share_Report.Denominator", "Market_Share_Report.Perimeter"],
          "Veeva CRM": ["Market_Share__c.Market_Scope__c", "Market_Share__c.Competitor_Set__c", "Market_Share__c.Calculation_Method__c"],
          "Manual database": ["Market_Share_Config.Definition", "Market_Share_Config.Scope", "Market_Share_Config.Competitors_Included"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "time-periods",
        defaultName: "Time Periods",
        defaultDefinition:
          "Your fiscal calendar configuration. Define the fiscal year start date, whether you think in months, quarters, or MAT (moving annual total), and any custom period names.",
        sourceOptions: ["Salesforce", "Veeva CRM", "Manual database"],
        fieldsBySource: {
          Salesforce: ["FiscalYearSettings.StartMonth", "FiscalYearSettings.IsStandard", "FiscalYearSettings.PeriodType"],
          "Veeva CRM": ["Period__c.Start_Date__c", "Period__c.Type__c", "Period__c.Name"],
          "Manual database": ["Time_Period_Config.Period_Type", "Time_Period_Config.Start_Date", "Time_Period_Config.Name"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "targets-goals",
        defaultName: "Targets/Goals",
        defaultDefinition:
          "Where targets live and at what level they're set: individual rep, territory, district, or national. Define how attainment and gap-to-target are calculated.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Goal__c.Type__c", "Goal__c.Level__c", "Goal__c.Target_Value__c", "Goal__c.Period__c"],
          Salesforce: ["Quota.Amount", "Quota.Period", "Quota.Owner", "Quota.Level__c"],
          "Manual database": ["Target_Config.Target_Type", "Target_Config.Level", "Target_Config.Value", "Target_Config.Period"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
    ],
  },
];

// ── Rule summary builder ────────────────────────────────────────
function buildRuleSummary(conditions, operators, conceptName) {
  const valid = conditions.filter((c) => c.field);
  if (valid.length === 0) return "No rules defined yet";

  const parts = valid.map((c, i) => {
    let text = c.field;
    if (c.operator) text += ` ${c.operator}`;
    if (c.value) text += ` "${c.value}"`;
    if (i > 0) {
      const op = operators[i - 1] || "AND";
      text = `${op} ${text}`;
    }
    return text;
  });

  return `Where ${parts.join(" ")} → classify as ${conceptName}`;
}

// ── Status helpers ──────────────────────────────────────────────
const statusConfig = {
  defined: {
    icon: <GreenCheckIcon />,
    text: "Defined",
    badgeBg: "bg-[#dcfce7]",
    badgeColor: "text-[#15803d]",
  },
  needs_attention: {
    icon: <ConflictTriangleIcon />,
    text: "Needs attention",
    badgeBg: "bg-[#ffedd5]",
    badgeColor: "text-[#c2410c]",
  },
  not_configured: {
    icon: <NotConfiguredIcon />,
    text: "Not configured",
    badgeBg: "bg-[#fef2f2]",
    badgeColor: "text-[#dc2626]",
  },
};

// ── ConceptCard component ───────────────────────────────────────
function ConceptCard({
  concept,
  data,
  customDefault,
  onUpdate,
  onAddCondition,
  onRemoveCondition,
  onUpdateCondition,
  onSetConditionOperator,
  onResetDefinition,
  onSetCustomDefault,
  onClearCustomDefault,
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const status = statusConfig[data.status];
  const nameRenamed = data.name !== concept.defaultName;

  // The current active default is either a custom override or the original system default
  const activeDefault = customDefault || concept.defaultDefinition;

  // Resolve field options for condition rows — empty when no source selected
  const availableFields =
    data.source && concept.fieldsBySource[data.source]
      ? concept.fieldsBySource[data.source]
      : [];

  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
      {/* Collapsed header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-[#f9fafb]"
      >
        <div className="flex items-center gap-3">
          {status.icon}
          {editingName ? (
            <input
              type="text"
              value={data.name}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                onUpdate(concept.id, "name", e.target.value);
              }}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditingName(false);
                }
              }}
              autoFocus
              className="rounded border-b-2 border-[#155dfc] bg-[#f9fafb] px-1.5 py-0.5 text-sm font-medium text-[#111318] outline-none"
            />
          ) : (
            <span className="px-1.5 py-0.5 text-sm font-medium text-[#111318]">
              {data.name}
              {nameRenamed && (
                <span className="ml-1.5 text-xs font-normal text-[#9ca3af]">
                  ({concept.defaultName})
                </span>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.badgeBg} ${status.badgeColor}`}
          >
            {status.text}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingName(true);
            }}
            className="shrink-0 p-1 text-[#9ca3af] transition-colors hover:text-[#155dfc]"
            title="Rename"
          >
            <EditPencilIcon />
          </button>
          <span
            className={`text-[#6a7282] transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <ChevronDownIcon />
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[#e5e7eb] px-6 py-5">
          <div className="flex flex-col gap-6">
            {/* ── Section 1: Definition ── */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                Definition
              </label>

              {/* Current default reference */}
              <div className="flex items-start gap-2 rounded-lg bg-[#f9fafb] px-3.5 py-2.5">
                <span className="shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9ca3af]">
                  {customDefault ? "Your default:" : "System default:"}
                </span>
                <span className="text-sm italic leading-relaxed text-[#6a7282]">
                  {activeDefault}
                </span>
              </div>

              {/* User's definition */}
              <textarea
                value={data.definition}
                onChange={(e) =>
                  onUpdate(concept.id, "definition", e.target.value)
                }
                placeholder="Enter your organization's definition..."
                rows={3}
                className="w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
              />

              {/* Action links */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Set as my default */}
                {data.definition &&
                  data.definition.trim() !== "" &&
                  data.definition !== activeDefault && (
                    <button
                      onClick={() =>
                        onSetCustomDefault(concept.id, data.definition)
                      }
                      className="text-xs font-medium text-[#155dfc] transition-colors hover:text-[#1150d4]"
                    >
                      Set as my default
                    </button>
                  )}

                {/* Reset to current default */}
                {data.definition &&
                  data.definition !== activeDefault && (
                    <button
                      onClick={() =>
                        onResetDefinition(concept.id, activeDefault)
                      }
                      className="text-xs font-medium text-[#155dfc] transition-colors hover:text-[#1150d4]"
                    >
                      Reset to {customDefault ? "my" : "system"} default
                    </button>
                  )}

                {/* Restore original system default (only when custom default exists) */}
                {customDefault && (
                  <button
                    onClick={() => {
                      onClearCustomDefault(concept.id);
                      onResetDefinition(concept.id, concept.defaultDefinition);
                    }}
                    className="text-xs font-medium text-[#6a7282] transition-colors hover:text-[#dc2626]"
                  >
                    Restore original system default
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-[#f3f4f6]" />

            {/* ── Section 2: Source Mapping ── */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                Source Mapping
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#4a5565]">
                    Source
                  </label>
                  <SearchableDropdown
                    value={data.source}
                    options={concept.sourceOptions}
                    onChange={(val) => onUpdate(concept.id, "source", val)}
                    placeholder="Select source system..."
                  />
                </div>
                {data.source && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#4a5565]">
                      Table / Field
                    </label>
                    <SearchableDropdown
                      value={data.sourceField}
                      options={availableFields}
                      onChange={(val) => onUpdate(concept.id, "sourceField", val)}
                      placeholder="Select field..."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#f3f4f6]" />

            {/* ── Section 3: Classification Rules ── */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                Classification Rules
              </label>

              {/* Empty state */}
              {data.conditions.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#e2e8f0] bg-white px-6 py-8">
                  <p className="text-sm font-medium text-[#616f89]">
                    No rules defined
                  </p>
                  <p className="text-xs text-[#9ca3af]">
                    Add a condition to start classifying this concept
                  </p>
                  <button
                    onClick={() => onAddCondition(concept.id)}
                    className="mt-1 flex items-center gap-2 rounded-lg bg-[#135bec] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1150d4]"
                  >
                    <span className="text-white">
                      <PlusSmallIcon />
                    </span>
                    Add First Condition
                  </button>
                </div>
              )}

              {/* Condition rows */}
              {data.conditions.length > 0 && (
                <div className="relative flex flex-col gap-2">
                  {data.conditions.map((condition, index) => (
                    <div key={condition.id}>
                      {/* Condition row */}
                      <div className="flex items-start gap-3">
                        {/* Number badge */}
                        <div className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#e2e8f0] bg-white">
                          <span className="text-[10px] font-black text-[#111318]">
                            {index + 1}
                          </span>
                        </div>

                        {/* Condition fields */}
                        <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-4 py-3">
                          {/* Field dropdown */}
                          <div className="flex-1">
                            <SearchableDropdown
                              value={condition.field}
                              options={availableFields}
                              onChange={(val) =>
                                onUpdateCondition(
                                  concept.id,
                                  condition.id,
                                  "field",
                                  val
                                )
                              }
                              placeholder={
                                data.source
                                  ? "Select field..."
                                  : "Select a source first"
                              }
                              disabled={!data.source}
                            />
                          </div>

                          {/* Operator dropdown */}
                          <div className="w-40">
                            <SearchableDropdown
                              value={condition.operator}
                              options={concept.operatorOptions}
                              onChange={(val) =>
                                onUpdateCondition(
                                  concept.id,
                                  condition.id,
                                  "operator",
                                  val
                                )
                              }
                              placeholder="Operator..."
                            />
                          </div>

                          {/* Value input */}
                          <div className="flex-1">
                            <input
                              type="text"
                              value={condition.value}
                              onChange={(e) =>
                                onUpdateCondition(
                                  concept.id,
                                  condition.id,
                                  "value",
                                  e.target.value
                                )
                              }
                              placeholder="Value..."
                              className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                            />
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={() =>
                              onRemoveCondition(concept.id, condition.id)
                            }
                            className="shrink-0 p-1 text-[#6a7282] transition-colors hover:text-[#dc2626]"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>

                      {/* AND/OR toggle between conditions */}
                      {index < data.conditions.length - 1 && (
                        <div className="flex justify-center py-1 pl-9">
                          <div className="flex items-center rounded-full border border-[#e2e8f0] bg-[#f1f5f9] p-[3px]">
                            <button
                              onClick={() =>
                                onSetConditionOperator(
                                  concept.id,
                                  index,
                                  "AND"
                                )
                              }
                              className={`rounded-full px-3 py-0.5 text-xs font-bold transition-colors ${
                                (data.conditionOperators[index] || "AND") ===
                                "AND"
                                  ? "bg-[#135bec] text-white shadow-sm"
                                  : "text-[#616f89]"
                              }`}
                            >
                              AND
                            </button>
                            <button
                              onClick={() =>
                                onSetConditionOperator(
                                  concept.id,
                                  index,
                                  "OR"
                                )
                              }
                              className={`rounded-full px-3 py-0.5 text-xs font-bold transition-colors ${
                                (data.conditionOperators[index] || "AND") ===
                                "OR"
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

                  {/* Add condition button */}
                  <div className="pl-9 pt-1">
                    <button
                      onClick={() => onAddCondition(concept.id)}
                      className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#cbd5e1] px-3.5 py-2 transition-colors hover:border-[#94a3b8] hover:bg-gray-50"
                    >
                      <PlusSmallIcon />
                      <span className="text-sm font-semibold text-[#616f89]">
                        Add Condition
                      </span>
                    </button>
                  </div>

                  {/* Rule summary */}
                  <div className="mt-2 rounded-lg bg-[#f9fafb] px-4 py-2.5">
                    <span className="text-xs font-medium text-[#4a5565]">
                      Summary:{" "}
                    </span>
                    <span className="text-xs text-[#111318]">
                      {buildRuleSummary(
                        data.conditions,
                        data.conditionOperators,
                        data.name
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#f3f4f6]" />

            {/* ── Section 4: Business Rules & Constraints ── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                Business Rules & Constraints
              </label>
              <textarea
                value={data.constraints}
                onChange={(e) =>
                  onUpdate(concept.id, "constraints", e.target.value)
                }
                placeholder="e.g., Hierarchies: ward → department → hospital → group. Cardinality: an HCP can belong to max 3 Accounts. Validation: Tier must be A, B, or C."
                rows={3}
                className="w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export default function DomainDefinition() {
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const [searchQuery, setSearchQuery] = useState("");
  const {
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
  } = useDomainDefinitionContext();

  const visibleTabs = TABS.filter((t) => !t.hidden);
  const currentTab = TABS.find((t) => t.key === activeTab);

  const filteredConcepts = currentTab.concepts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const d = concepts[c.id];
    return (
      d.name.toLowerCase().includes(q) ||
      c.defaultDefinition.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">
              Domain Definition
            </h1>
            <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
              Help the system understand your commercial language. Define what
              each concept means for your organization and where to find it in
              your data.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 overflow-x-auto border-b border-gray-200">
            {visibleTabs.map((tab) => {
              const active = activeTab === tab.key;
              const stats = getTabStats(tab.key);
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSearchQuery("");
                  }}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap pb-3 text-sm font-medium transition-colors ${
                    active
                      ? "border-b-2 border-[#155dfc] text-[#155dfc]"
                      : "text-[#4a5565] hover:text-[#0a0a0a]"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      active
                        ? "bg-[#dbeafe] text-[#155dfc]"
                        : "bg-[#f3f4f6] text-[#4a5565]"
                    }`}
                  >
                    {stats.configured}/{stats.total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + Filter */}
          <div className="flex items-end gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                <SearchIcon20 />
              </span>
              <input
                type="text"
                placeholder="Search concepts..."
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

          {/* Concept cards */}
          <div className="flex flex-col gap-3">
            {filteredConcepts.map((concept) => (
              <ConceptCard
                key={concept.id}
                concept={concept}
                data={concepts[concept.id]}
                customDefault={customDefaults[concept.id]}
                onUpdate={updateConcept}
                onAddCondition={addCondition}
                onRemoveCondition={removeCondition}
                onUpdateCondition={updateCondition}
                onSetConditionOperator={setConditionOperator}
                onResetDefinition={resetDefinition}
                onSetCustomDefault={setCustomDefault}
                onClearCustomDefault={clearCustomDefault}
              />
            ))}
            {filteredConcepts.length === 0 && (
              <div className="flex items-center justify-center rounded-xl border border-[#e5e7eb] bg-white py-12">
                <p className="text-sm text-[#6a7282]">
                  No concepts match your search.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
