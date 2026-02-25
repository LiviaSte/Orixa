import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { useDomainDefinitionContext } from "../DomainDefinitionContext";
import SearchableDropdown from "../components/SearchableDropdown";
import { MANUAL_DATABASE_OPTIONS } from "../constants/manualDatabases";
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
  CopyIcon,
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

// ── Field type inference ─────────────────────────────────────────
// Returns "date" | "number" | "boolean" | "enum" | "text"
function inferFieldType(fieldName) {
  if (!fieldName) return "text";
  const lower = fieldName.toLowerCase();
  const lastPart = lower.split(".").pop();

  const dateParts = ["date", "created", "modified", "close", "start", "end", "mql_date", "sql_date", "conversion_date", "activateddate", "usageenddate", "installdate"];
  const numberParts = ["score", "amount", "value", "cost", "revenue", "pct", "percentage", "weight", "probability", "count", "number", "threshold", "net_value", "budgetedcost", "actualcost"];
  const booleanParts = ["isconverted", "converted__c", "is_converted", "iswon", "isclosed", "sales_accepted", "sales_ready", "eligible", "renewal_flag"];
  // Fields that have known enum/picklist values
  const enumParts = ["status", "stagename", "stage__c", "recordtype", "type", "role", "specialty", "lifecycle_stage", "lead_status", "rating", "industry", "channel", "category", "tier__c", "segment__c", "target_status__c"];

  if (dateParts.some((p) => lastPart.includes(p))) return "date";
  if (numberParts.some((p) => lastPart.includes(p))) return "number";
  if (booleanParts.some((p) => lastPart.includes(p))) return "boolean";
  if (enumParts.some((p) => lastPart.includes(p))) return "enum";
  return "text";
}

// ── Operators by field type ──────────────────────────────────────
const OPERATORS_BY_TYPE = {
  date: ["is", "is not", "equals", "greater than", "less than", "is null", "is not null", "last N days", "last N months"],
  number: ["equals", "greater than", "less than", ">=", "<=", "is null", "is not null"],
  boolean: ["is", "is not"],
  enum: ["is", "is not", "in", "not in", "is null", "is not null"],
  text: ["is", "is not", "contains", "does not contain", "equals", "in", "not in", "is null", "is not null"],
};

function getOperatorsForField(fieldName) {
  const type = inferFieldType(fieldName);
  return OPERATORS_BY_TYPE[type] || DEFAULT_OPERATORS;
}

// ── Smart value input ────────────────────────────────────────────
function ConditionValueInput({ field, operator, value, onChange }) {
  const fieldType = inferFieldType(field);
  const inputClass = "w-full rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]";

  // No value needed for null-check operators
  if (operator === "is null" || operator === "is not null") {
    return (
      <div className="flex h-[38px] flex-1 items-center rounded-lg border border-dashed border-[#e5e7eb] px-3.5">
        <span className="text-xs italic text-[#9ca3af]">No value needed</span>
      </div>
    );
  }

  // Boolean fields: always show True/False select
  if (fieldType === "boolean") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">Select...</option>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  if (fieldType === "date") {
    // "last N days/months" needs a number, not a calendar
    if (operator === "last N days" || operator === "last N months") {
      return (
        <input
          type="number"
          min="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={operator === "last N days" ? "Number of days..." : "Number of months..."}
          className={inputClass}
        />
      );
    }
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    );
  }

  if (fieldType === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter number..."
        className={inputClass}
      />
    );
  }

  // "last N" for non-date fields (e.g. activity fields with last N months operator)
  if (operator === "last N days" || operator === "last N months") {
    return (
      <input
        type="number"
        min="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={operator === "last N days" ? "Number of days..." : "Number of months..."}
        className={inputClass}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Value..."
      className={inputClass}
    />
  );
}

// ── Tab & concept data ──────────────────────────────────────────
const TABS = [
  {
    key: "people",
    label: "People",
    concepts: [
      {
        id: "hcp",
        defaultName: "HCP",
        defaultDefinition:
          "A Healthcare Professional with prescribing authority or clinical influence who is a target for commercial engagement. Define whether this includes only prescribers, or also pharmacists, nurses, and KOLs.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Contact.Role", "Contact.RecordType", "Contact.Status__c", "Contact.Specialty__c", "Contact.Credentials__c"],
          Salesforce: ["Contact.RecordType", "Contact.HCP_Role__c", "Contact.Status", "Contact.Specialty"],
          "Manual database": ["HCP_Registry.Role", "HCP_Registry.Type", "HCP_Registry.Status", "HCP_Registry.License_Type"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      /* ── Lead (parent with sub-types) ──────────────────────────── */
      {
        id: "lead",
        defaultName: "Lead",
        isParent: true,
        defaultDefinition:
          "An unqualified or new contact entering the commercial pipeline. A lead has shown initial interest but has not yet been qualified by marketing or sales. The system classifies leads into sub-types based on their lifecycle stage.",
        sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
        fieldsBySource: {
          Salesforce: ["Lead.Status", "Lead.LeadSource", "Lead.Rating", "Lead.Type__c", "Lead.IsConverted", "Lead.CreatedDate", "Lead.OwnerId"],
          "Veeva CRM": ["Lead__c.Status__c", "Lead__c.Source__c", "Lead__c.Type__c"],
          HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.Lead_Status", "Contacts.Lead_Source"],
        },
        operatorOptions: DEFAULT_OPERATORS,
        subTypes: [
          {
            id: "lead-new",
            defaultName: "Lead New",
            defaultDefinition:
              "Default value for new leads, indicating no outreach has been made yet. The lead exists in Sales Cloud, is of type Lead, and has a status of New/Open.",
            sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
            fieldsBySource: {
              Salesforce: ["Lead.Status", "Lead.IsConverted", "Lead.LeadSource", "Lead.CreatedDate", "Lead.OwnerId"],
              "Veeva CRM": ["Lead__c.Status__c", "Lead__c.Source__c", "Lead__c.Type__c", "Lead__c.Created_Date__c"],
              HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.Lead_Status", "Contacts.Lead_Source", "Contacts.Create_Date"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
          {
            id: "lead-lapsed",
            defaultName: "Lead Lapsed",
            defaultDefinition:
              "The lead does not meet criteria or is not interested. Exists in Sales Cloud as a Lead, but has had null interaction in the last 24 months. The lead has gone cold or been disqualified.",
            sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
            fieldsBySource: {
              Salesforce: ["Lead.Status", "Lead.IsConverted", "Lead.LastActivityDate", "Lead.Last_Interaction__c", "Lead.CreatedDate"],
              "Veeva CRM": ["Lead__c.Status__c", "Lead__c.Last_Activity__c", "Lead__c.Interaction_Date__c"],
              HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.Last_Activity_Date", "Contacts.Last_Contacted"],
            },
            operatorOptions: [...DEFAULT_OPERATORS, "is null", "is not null", "last N days", "last N months"],
          },
          {
            id: "lead-active",
            defaultName: "Lead Active",
            defaultDefinition:
              "Working / Attempting to Contact: Sales has begun outreach, such as calls or emails. The lead exists in the CRM and has an active status indicating outreach is underway, but a direct two-way conversation has not yet occurred.",
            sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
            fieldsBySource: {
              Salesforce: ["Lead.Status", "Lead.IsConverted", "Lead.LastActivityDate", "Lead.Last_Interaction__c", "Lead.CreatedDate", "Lead.OwnerId"],
              "Veeva CRM": ["Lead__c.Status__c", "Lead__c.Last_Activity__c", "Lead__c.Interaction_Date__c", "Lead__c.Owner__c"],
              HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.Lead_Status", "Contacts.Last_Activity_Date", "Contacts.HubSpot_Owner"],
            },
            operatorOptions: [...DEFAULT_OPERATORS, "is null", "is not null", "last N days", "last N months"],
          },
          {
            id: "lead-connected",
            defaultName: "Lead Connected",
            defaultDefinition:
              "Connected / Contacted: A direct, two-way conversation or engagement has occurred. The lead has responded to outreach and a meaningful interaction has taken place, but qualification criteria have not yet been assessed.",
            sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
            fieldsBySource: {
              Salesforce: ["Lead.Status", "Lead.IsConverted", "Lead.LastActivityDate", "Lead.Last_Interaction__c", "Lead.First_Response_Date__c", "Lead.OwnerId"],
              "Veeva CRM": ["Lead__c.Status__c", "Lead__c.Last_Activity__c", "Lead__c.Interaction_Date__c", "Lead__c.Owner__c"],
              HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.Lead_Status", "Contacts.Last_Activity_Date", "Contacts.First_Contacted", "Contacts.HubSpot_Owner"],
            },
            operatorOptions: [...DEFAULT_OPERATORS, "is null", "is not null", "last N days", "last N months"],
          },
          {
            id: "lead-qualified",
            defaultName: "Lead Qualified",
            defaultDefinition:
              "Qualified / Marketing Qualified: The lead fits buyer criteria and is ready for further sales engagement or opportunity conversion. The lead has been assessed against qualification criteria (e.g. ICP match, engagement score, BANT) and is ready to be passed to sales or converted.",
            sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot", "Marketo"],
            fieldsBySource: {
              Salesforce: ["Lead.Status", "Lead.IsConverted", "Lead.Rating", "Lead.Marketing_Score__c", "Lead.LeadScore", "Lead.Qualification_Status__c", "Lead.MQL_Date__c", "Lead.LeadSource"],
              "Veeva CRM": ["Lead__c.Status__c", "Lead__c.Tier__c", "Lead__c.Segment__c", "Lead__c.Target_Status__c"],
              HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.Lead_Status", "Contacts.Lead_Score", "Contacts.MQL_Date"],
              Marketo: ["Lead.Score", "Lead.MQL_Date__c", "Lead.Behavior_Score__c", "Lead.Qualification_Status__c"],
            },
            operatorOptions: [...DEFAULT_OPERATORS, "greater than", "less than"],
          },
          {
            id: "lead-converted",
            defaultName: "Lead Converted",
            defaultDefinition:
              "The lead has been converted into an Account, Contact, and/or Opportunity. In Salesforce this maps to Lead.IsConverted = true. The lead lifecycle is complete and records have been created in the appropriate objects.",
            sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
            fieldsBySource: {
              Salesforce: ["Lead.IsConverted", "Lead.ConvertedAccountId", "Lead.ConvertedContactId", "Lead.ConvertedOpportunityId", "Lead.ConvertedDate"],
              "Veeva CRM": ["Lead__c.Converted__c", "Lead__c.Converted_Account__c", "Lead__c.Converted_Contact__c"],
              HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.Associated_Deals", "Contacts.Associated_Company"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
        ],
      },
      /* ── Contact (parent with sub-types) ───────────────────────── */
      {
        id: "contact",
        defaultName: "Contact",
        isParent: true,
        defaultDefinition:
          "A known individual associated with an account who has been identified and entered into the CRM. Contacts are created from converted leads or directly entered. The system classifies contacts into sub-types based on their engagement stage.",
        sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
        fieldsBySource: {
          Salesforce: ["Contact.Status__c", "Contact.LeadSource", "Contact.AccountId", "Contact.CreatedDate", "Contact.LastActivityDate", "Contact.OwnerId"],
          "Veeva CRM": ["Contact.Status__c", "Contact.Account__c", "Contact.RecordType", "Contact.Last_Activity__c"],
          HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.Associated_Company", "Contacts.Create_Date", "Contacts.Last_Activity_Date"],
        },
        operatorOptions: DEFAULT_OPERATORS,
        subTypes: [
          {
            id: "contact-new",
            defaultName: "Contact New",
            defaultDefinition:
              "A newly created contact with no outreach or engagement yet. The contact exists in the CRM but has not been worked by sales.",
            sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
            fieldsBySource: {
              Salesforce: ["Contact.Status__c", "Contact.CreatedDate", "Contact.LeadSource", "Contact.OwnerId", "Contact.LastActivityDate"],
              "Veeva CRM": ["Contact.Status__c", "Contact.Created_Date__c", "Contact.Source__c"],
              HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.Create_Date", "Contacts.Lead_Status"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
          {
            id: "contact-lapsed",
            defaultName: "Contact Lapsed",
            defaultDefinition:
              "A contact that has gone cold — no meaningful interaction in the last 24 months. The contact exists in the CRM but is no longer actively engaged.",
            sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
            fieldsBySource: {
              Salesforce: ["Contact.Status__c", "Contact.LastActivityDate", "Contact.Last_Interaction__c", "Contact.AccountId"],
              "Veeva CRM": ["Contact.Status__c", "Contact.Last_Activity__c", "Contact.Interaction_Date__c"],
              HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.Last_Activity_Date", "Contacts.Last_Contacted"],
            },
            operatorOptions: [...DEFAULT_OPERATORS, "is null", "is not null", "last N days", "last N months"],
          },
          {
            id: "contact-active",
            defaultName: "Contact Active",
            defaultDefinition:
              "An active contact where sales or marketing engagement is ongoing. The contact has had interactions in the last 24 months and/or has an active status (Working, Contacted, Qualified).",
            sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
            fieldsBySource: {
              Salesforce: ["Contact.Status__c", "Contact.LastActivityDate", "Contact.Last_Interaction__c", "Contact.OwnerId", "Contact.AccountId"],
              "Veeva CRM": ["Contact.Status__c", "Contact.Last_Activity__c", "Contact.Owner__c"],
              HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.Last_Activity_Date", "Contacts.HubSpot_Owner"],
            },
            operatorOptions: [...DEFAULT_OPERATORS, "is null", "is not null", "last N days", "last N months"],
          },
          {
            id: "contact-converted",
            defaultName: "Contact Converted",
            defaultDefinition:
              "A contact that has been converted into an opportunity. The contact's account has an active or won deal, indicating a successful sales conversion.",
            sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
            fieldsBySource: {
              Salesforce: ["Contact.Status__c", "Contact.AccountId", "Opportunity.StageName", "Opportunity.Amount", "Opportunity.CloseDate"],
              "Veeva CRM": ["Contact.Status__c", "Contact.Account__c", "Opportunity__c.Stage__c"],
              HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.Associated_Deals", "Deals.Deal_Stage"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
        ],
      },
      /* ── MQL ───────────────────────────────────────────────────── */
      {
        id: "mql",
        defaultName: "MQL",
        defaultDefinition:
          "Marketing Qualified Lead — a lead that meets minimum fit criteria and/or shows interest signals sufficient to pass to Sales for verification. Simple rule: MQL = (ICP match) and/or (engagement/score ≥ threshold) and consent/contactability ok (if applicable). CRM field: Lead.Status = MQL or LifecycleStage = MQL or LeadScore ≥ threshold. Salesforce: Lead record with Status = MQL/Qualified by Marketing (custom value), often with LeadSource/Campaign populated. Veeva: often no 'MQL' exists — practical equivalent = HCP/HCO 'Eligible/Target Candidate' (segmentation/tiering) or insertion into a target list (pre-sales/marketing).",
        sourceOptions: ["Salesforce", "HubSpot", "Marketo", "Veeva CRM"],
        fieldsBySource: {
          Salesforce: ["Lead.Status", "Lead.MQL_Date__c", "Lead.Marketing_Score__c", "Lead.LeadScore", "Lead.Qualification_Status__c", "Lead.Engagement_Score__c", "Lead.LeadSource", "CampaignMember.Status"],
          HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.MQL_Date", "Contacts.Lead_Score", "Contacts.Lead_Status"],
          Marketo: ["Lead.Score", "Lead.MQL_Date__c", "Lead.Behavior_Score__c", "Lead.Qualification_Status__c"],
          "Veeva CRM": ["Contact.Tier__c", "Contact.Segment__c", "Contact.Target_Status__c", "Target_List__c.Status__c"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      /* ── MQC ───────────────────────────────────────────────────── */
      {
        id: "mqc",
        defaultName: "MQC",
        defaultDefinition:
          "Marketing Qualified Contact — a contact that meets minimum fit criteria and/or shows interest signals sufficient to pass to Sales for verification. Simple rule: MQC = (ICP match) and/or (engagement/score ≥ threshold) and consent/contactability ok (if applicable). CRM field: Contact.Status = MQL or LifecycleStage = MQL or LeadScore ≥ threshold. Salesforce: Contact record with Status = MQL/Qualified by Marketing (custom value), often with LeadSource/Campaign populated. Veeva: often no 'MQL' exists — practical equivalent = HCP/HCO 'Eligible/Target Candidate' (segmentation/tiering) or insertion into a target list (pre-sales/marketing).",
        sourceOptions: ["Salesforce", "HubSpot", "Marketo", "Veeva CRM"],
        fieldsBySource: {
          Salesforce: ["Contact.Status__c", "Contact.MQL_Date__c", "Contact.Marketing_Score__c", "Contact.LeadScore__c", "Contact.Engagement_Score__c", "Contact.LeadSource", "CampaignMember.Status"],
          HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.MQL_Date", "Contacts.Lead_Score", "Contacts.Lead_Status"],
          Marketo: ["Lead.Score", "Lead.MQL_Date__c", "Lead.Behavior_Score__c", "Lead.Qualification_Status__c"],
          "Veeva CRM": ["Contact.Tier__c", "Contact.Segment__c", "Contact.Target_Status__c", "Target_List__c.Status__c"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      /* ── SQL ───────────────────────────────────────────────────── */
      {
        id: "sql",
        defaultName: "SQL",
        defaultDefinition:
          "Sales Qualified Contact — Sales has verified that a real need exists and minimum conditions to open an opportunity are met. Simple rule: SQL = meeting/discovery has occurred and qualification criteria have been passed (e.g. BANT/MEDDICC light). CRM field: Contact.Status = SQL or Contact.Status = Qualified (ready for conversion) + qualifier fields populated. Salesforce: Contact with Status = Qualified ready for conversion (often with qualification fields filled). Veeva: often no 'SQL' exists — practical equivalent = HCP/HCO with a defined objective in the call plan and a 'next best action' planned (engagement 'sales-ready' in the pharma model).",
        sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
        fieldsBySource: {
          Salesforce: ["Contact.Status__c", "Contact.SQL_Date__c", "Contact.Sales_Accepted__c", "Contact.Qualification_Notes__c", "Contact.BANT_Score__c", "Opportunity.StageName"],
          "Veeva CRM": ["Contact.Status__c", "Contact.Call_Plan__c", "Contact.Next_Best_Action__c", "Contact.Sales_Ready__c"],
          HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.SQL_Date", "Contacts.Sales_Qualified", "Contacts.Deal_Stage"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      /* ── Conversion ────────────────────────────────────────────── */
      {
        id: "conversion",
        defaultName: "Conversion",
        defaultDefinition:
          "Sales Conversion — Sales has verified that the contact can be converted into an opportunity. CRM field: Contact.Status = Conversion or equivalent (ready for conversion) + qualifier fields and notes populated. The conversion event creates or links the contact to an Opportunity record. Note: the exact status value may vary by CRM — confirm the field and value used in your system.",
        sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
        fieldsBySource: {
          Salesforce: ["Contact.Status__c", "Contact.Conversion_Date__c", "Opportunity.StageName", "Opportunity.Amount", "Opportunity.CreatedDate", "Opportunity.ContactId"],
          "Veeva CRM": ["Contact.Status__c", "Contact.Conversion_Status__c", "Opportunity__c.Stage__c", "Opportunity__c.Contact__c"],
          HubSpot: ["Contacts.Lifecycle_Stage", "Contacts.Associated_Deals", "Deals.Deal_Stage", "Deals.Create_Date"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
    ],
  },
  {
    key: "account",
    label: "Account",
    concepts: [
      /* ── Account (parent with sub-types) ───────────────────────── */
      {
        id: "account",
        defaultName: "Account",
        isParent: true,
        defaultDefinition:
          "An organization (hospital, clinic, pharmacy chain, buying group, or other entity) that employs or is affiliated with HCPs. Accounts go through an identity resolution pipeline to determine their status based on existence in connected systems and purchasing activity.",
        sourceOptions: ["Veeva CRM", "Salesforce", "SAP"],
        fieldsBySource: {
          "Veeva CRM": ["Account.RecordType", "Account.Account_Type__c", "Account.Channel__c", "Account.Status__c", "Account.Exist_In_System__c"],
          Salesforce: ["Account.RecordType", "Account.Type", "Account.Industry", "Account.Status__c", "Account.Exist_In_System__c"],
          SAP: ["Business_Partner.Type", "Business_Partner.Channel", "Business_Partner.Category", "Business_Partner.Status"],
        },
        operatorOptions: DEFAULT_OPERATORS,
        subTypes: [
          {
            id: "account-new",
            defaultName: "Account New",
            defaultDefinition:
              "A new account that exists in Sales Cloud but not yet in SAP (no purchase history). Has at least one Contact with a creation date. No closed-won opportunities exist for this account.",
            sourceOptions: ["Veeva CRM", "Salesforce", "SAP"],
            fieldsBySource: {
              "Veeva CRM": ["Account.Status__c", "Account.Exist_In_System__c", "Account.CreatedDate", "Contact.CreatedDate"],
              Salesforce: ["Account.Status__c", "Account.Exist_In_System__c", "Account.CreatedDate", "Contact.AccountId", "Contact.CreatedDate", "Opportunity.StageName"],
              SAP: ["Business_Partner.Status", "Business_Partner.FirstOrderDate"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
          {
            id: "account-active",
            defaultName: "Account Active",
            defaultDefinition:
              "An account that exists in both Sales Cloud and SAP, has at least one Contact with a creation date, and has at least one closed-won opportunity (or purchase) in the last 24 months.",
            sourceOptions: ["Veeva CRM", "Salesforce", "SAP"],
            fieldsBySource: {
              "Veeva CRM": ["Account.Status__c", "Account.Exist_In_System__c", "Account.Last_Purchase__c", "Contact.CreatedDate"],
              Salesforce: ["Account.Status__c", "Account.Exist_In_System__c", "Opportunity.StageName", "Opportunity.CloseDate", "Contact.CreatedDate"],
              SAP: ["Business_Partner.Status", "Sales_Order.LastOrderDate", "Sales_Order.Net_Value", "Sales_Order.SKU"],
            },
            operatorOptions: [...DEFAULT_OPERATORS, "last N days", "last N months"],
          },
          {
            id: "account-inactive",
            defaultName: "Account Inactive",
            defaultDefinition:
              "An account that exists in both Sales Cloud and SAP, has at least one Contact, but has no closed-won opportunity or purchase of the relevant SKU in the last 24 months.",
            sourceOptions: ["Veeva CRM", "Salesforce", "SAP"],
            fieldsBySource: {
              "Veeva CRM": ["Account.Status__c", "Account.Exist_In_System__c", "Account.Last_Purchase__c", "Contact.CreatedDate"],
              Salesforce: ["Account.Status__c", "Account.Exist_In_System__c", "Opportunity.StageName", "Opportunity.CloseDate", "Contact.CreatedDate"],
              SAP: ["Business_Partner.Status", "Sales_Order.LastOrderDate", "Sales_Order.Net_Value", "Sales_Order.SKU"],
            },
            operatorOptions: [...DEFAULT_OPERATORS, "last N days", "last N months"],
          },
        ],
      },
      /* ── Opportunity (parent with sub-types) ────────────────────── */
      {
        id: "opportunity",
        defaultName: "Opportunity",
        isParent: true,
        defaultDefinition:
          "A qualified sales opportunity linked to an account with a defined value and expected close date. Opportunities progress through stages from initial prospecting through to closed outcome. Define when a lead becomes an opportunity and how pipeline value is tracked.",
        sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
        fieldsBySource: {
          Salesforce: ["Opportunity.StageName", "Opportunity.Amount", "Opportunity.CloseDate", "Opportunity.Probability", "Opportunity.Type", "Opportunity.AccountId"],
          "Veeva CRM": ["Opportunity__c.Stage__c", "Opportunity__c.Value__c", "Opportunity__c.Expected_Close__c", "Opportunity__c.Account__c"],
          HubSpot: ["Deals.Deal_Stage", "Deals.Amount", "Deals.Close_Date", "Deals.Pipeline", "Deals.Associated_Company"],
        },
        operatorOptions: DEFAULT_OPERATORS,
        subTypes: [
          {
            id: "opp-prospecting",
            defaultName: "Prospecting",
            defaultDefinition:
              "The opportunity exists in the CRM and initial research or outreach is underway. The account has been identified as a potential opportunity but no formal engagement has started.",
            sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
            fieldsBySource: {
              Salesforce: ["Opportunity.StageName", "Opportunity.Amount", "Opportunity.CloseDate", "Opportunity.Probability"],
              "Veeva CRM": ["Opportunity__c.Stage__c", "Opportunity__c.Value__c", "Opportunity__c.Expected_Close__c"],
              HubSpot: ["Deals.Deal_Stage", "Deals.Amount", "Deals.Close_Date"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
          {
            id: "opp-qualification",
            defaultName: "Qualification",
            defaultDefinition:
              "The opportunity has been assessed against qualification criteria. A discovery call or meeting has occurred and the account has confirmed a need, budget, and timeline.",
            sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
            fieldsBySource: {
              Salesforce: ["Opportunity.StageName", "Opportunity.Amount", "Opportunity.CloseDate", "Opportunity.Probability", "Opportunity.Qualification_Notes__c"],
              "Veeva CRM": ["Opportunity__c.Stage__c", "Opportunity__c.Value__c", "Opportunity__c.Qualification_Date__c"],
              HubSpot: ["Deals.Deal_Stage", "Deals.Amount", "Deals.Close_Date", "Deals.Qualification_Status"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
          {
            id: "opp-proposal",
            defaultName: "Proposal",
            defaultDefinition:
              "A formal proposal or quote has been submitted to the account. The opportunity is in active commercial discussion and a pricing or solution proposal is under review.",
            sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
            fieldsBySource: {
              Salesforce: ["Opportunity.StageName", "Opportunity.Amount", "Opportunity.CloseDate", "Opportunity.Proposal_Date__c", "Opportunity.Discount_Level__c"],
              "Veeva CRM": ["Opportunity__c.Stage__c", "Opportunity__c.Value__c", "Opportunity__c.Proposal_Date__c"],
              HubSpot: ["Deals.Deal_Stage", "Deals.Amount", "Deals.Close_Date", "Deals.Proposal_Sent"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
          {
            id: "opp-negotiation",
            defaultName: "Negotiation",
            defaultDefinition:
              "The opportunity has entered active negotiation — pricing, contract terms, or procurement processes are underway. Define the criteria that move an opportunity from proposal to negotiation stage.",
            sourceOptions: ["Salesforce", "Veeva CRM", "Manual database"],
            fieldsBySource: {
              Salesforce: ["Opportunity.StageName", "Opportunity.Negotiation_Start__c", "Opportunity.Contract_Status__c", "Opportunity.Discount_Level__c"],
              "Veeva CRM": ["Opportunity__c.Stage__c", "Opportunity__c.Negotiation_Date__c", "Opportunity__c.Pricing_Status__c"],
              "Manual database": ["Negotiation_Log.Status", "Negotiation_Log.Start_Date", "Negotiation_Log.Terms_Agreed"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
          {
            id: "opp-closed-won",
            defaultName: "Closed Won",
            defaultDefinition:
              "A closed-won opportunity — contract signed, purchase order received, or formulary listing confirmed. Define the exact event that marks a deal as won and triggers revenue recognition or onboarding workflows.",
            sourceOptions: ["Salesforce", "Veeva CRM", "SAP"],
            fieldsBySource: {
              Salesforce: ["Opportunity.StageName", "Opportunity.CloseDate", "Opportunity.Amount", "Opportunity.Won_Reason__c", "Opportunity.IsWon"],
              "Veeva CRM": ["Opportunity__c.Stage__c", "Opportunity__c.Close_Date__c", "Opportunity__c.Win_Reason__c"],
              SAP: ["Sales_Order.Status", "Sales_Order.Order_Date", "Sales_Order.Net_Value"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
          {
            id: "opp-closed-lost",
            defaultName: "Closed Lost",
            defaultDefinition:
              "A closed-lost opportunity — the prospect chose a competitor, delayed indefinitely, or the deal was disqualified. Define the loss reasons your organization tracks and how lost deals feed back into nurturing or competitive intelligence.",
            sourceOptions: ["Salesforce", "Veeva CRM", "Manual database"],
            fieldsBySource: {
              Salesforce: ["Opportunity.StageName", "Opportunity.CloseDate", "Opportunity.Loss_Reason__c", "Opportunity.Competitor_Won__c", "Opportunity.IsClosed"],
              "Veeva CRM": ["Opportunity__c.Stage__c", "Opportunity__c.Loss_Reason__c", "Opportunity__c.Competitor__c"],
              "Manual database": ["Deal_Loss_Log.Reason", "Deal_Loss_Log.Competitor", "Deal_Loss_Log.Date", "Deal_Loss_Log.Feedback"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
        ],
      },
      /* ── Order (parent with sub-types) ─────────────────────────── */
      {
        id: "order",
        defaultName: "Order",
        isParent: true,
        defaultDefinition:
          "A commercial order placed by an account for products or services. Orders flow through lifecycle stages from creation through fulfilment or cancellation. Define how orders are tracked and linked to opportunities and accounts.",
        sourceOptions: ["Salesforce", "SAP", "Veeva CRM"],
        fieldsBySource: {
          Salesforce: ["Order.Status", "Order.OrderNumber", "Order.TotalAmount", "Order.EffectiveDate", "Order.AccountId", "Order.OpportunityId"],
          SAP: ["Sales_Order.Status", "Sales_Order.Order_Date", "Sales_Order.Net_Value", "Sales_Order.Customer_ID", "Sales_Order.SKU"],
          "Veeva CRM": ["Order__c.Status__c", "Order__c.Account__c", "Order__c.Total_Value__c", "Order__c.Order_Date__c"],
        },
        operatorOptions: DEFAULT_OPERATORS,
        subTypes: [
          {
            id: "order-draft",
            defaultName: "Order Draft",
            defaultDefinition:
              "An order that has been initiated but not yet activated or submitted for fulfilment. The order is in a draft state pending review or approval.",
            sourceOptions: ["Salesforce", "SAP", "Veeva CRM"],
            fieldsBySource: {
              Salesforce: ["Order.Status", "Order.OrderNumber", "Order.TotalAmount", "Order.EffectiveDate"],
              SAP: ["Sales_Order.Status", "Sales_Order.Order_Date", "Sales_Order.Net_Value"],
              "Veeva CRM": ["Order__c.Status__c", "Order__c.Total_Value__c", "Order__c.Order_Date__c"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
          {
            id: "order-activated",
            defaultName: "Order Activated",
            defaultDefinition:
              "An order that has been approved and activated for fulfilment. Products or services are being delivered or scheduled for delivery.",
            sourceOptions: ["Salesforce", "SAP", "Veeva CRM"],
            fieldsBySource: {
              Salesforce: ["Order.Status", "Order.ActivatedDate", "Order.TotalAmount", "Order.AccountId"],
              SAP: ["Sales_Order.Status", "Sales_Order.Delivery_Date", "Sales_Order.Net_Value", "Sales_Order.SKU"],
              "Veeva CRM": ["Order__c.Status__c", "Order__c.Activation_Date__c", "Order__c.Total_Value__c"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
          {
            id: "order-cancelled",
            defaultName: "Order Cancelled",
            defaultDefinition:
              "An order that has been cancelled before fulfilment. Define the cancellation reasons tracked and how cancelled orders affect pipeline and revenue reporting.",
            sourceOptions: ["Salesforce", "SAP", "Veeva CRM"],
            fieldsBySource: {
              Salesforce: ["Order.Status", "Order.CancelledDate__c", "Order.Cancellation_Reason__c", "Order.TotalAmount"],
              SAP: ["Sales_Order.Status", "Sales_Order.Cancellation_Date", "Sales_Order.Cancellation_Reason"],
              "Veeva CRM": ["Order__c.Status__c", "Order__c.Cancellation_Date__c", "Order__c.Reason__c"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
        ],
      },
      /* ── Contract (parent with sub-types) ──────────────────────── */
      {
        id: "contract",
        defaultName: "Contract",
        isParent: true,
        defaultDefinition:
          "A legal agreement between your organization and an account defining terms, pricing, and duration for products or services. Contracts progress through lifecycle stages from draft through activation and eventual expiry.",
        sourceOptions: ["Salesforce", "SAP", "Manual database"],
        fieldsBySource: {
          Salesforce: ["Contract.Status", "Contract.ContractNumber", "Contract.StartDate", "Contract.EndDate", "Contract.AccountId", "Contract.TotalAmount"],
          SAP: ["Contract.Status", "Contract.Contract_ID", "Contract.Start_Date", "Contract.End_Date", "Contract.Customer_ID"],
          "Manual database": ["Contract_Log.Status", "Contract_Log.Start_Date", "Contract_Log.End_Date", "Contract_Log.Value"],
        },
        operatorOptions: DEFAULT_OPERATORS,
        subTypes: [
          {
            id: "contract-draft",
            defaultName: "Contract Draft",
            defaultDefinition:
              "A contract that has been created but not yet reviewed or signed. The terms are being prepared or are pending legal/commercial review.",
            sourceOptions: ["Salesforce", "SAP", "Manual database"],
            fieldsBySource: {
              Salesforce: ["Contract.Status", "Contract.ContractNumber", "Contract.StartDate", "Contract.EndDate"],
              SAP: ["Contract.Status", "Contract.Contract_ID", "Contract.Start_Date"],
              "Manual database": ["Contract_Log.Status", "Contract_Log.Start_Date"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
          {
            id: "contract-in-review",
            defaultName: "Contract In Review",
            defaultDefinition:
              "A contract that is under active review by legal, procurement, or commercial teams. Amendments and negotiations on specific terms may be underway.",
            sourceOptions: ["Salesforce", "SAP", "Manual database"],
            fieldsBySource: {
              Salesforce: ["Contract.Status", "Contract.ContractNumber", "Contract.Review_Date__c", "Contract.Approver__c"],
              SAP: ["Contract.Status", "Contract.Contract_ID", "Contract.Review_Date"],
              "Manual database": ["Contract_Log.Status", "Contract_Log.Reviewer", "Contract_Log.Review_Date"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
          {
            id: "contract-activated",
            defaultName: "Contract Activated",
            defaultDefinition:
              "A contract that has been signed and is currently active. Delivery of products or services under the contract terms is underway or scheduled.",
            sourceOptions: ["Salesforce", "SAP", "Manual database"],
            fieldsBySource: {
              Salesforce: ["Contract.Status", "Contract.ActivatedDate", "Contract.StartDate", "Contract.EndDate", "Contract.TotalAmount"],
              SAP: ["Contract.Status", "Contract.Start_Date", "Contract.End_Date", "Contract.Net_Value"],
              "Manual database": ["Contract_Log.Status", "Contract_Log.Start_Date", "Contract_Log.End_Date"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
          {
            id: "contract-expired",
            defaultName: "Contract Expired",
            defaultDefinition:
              "A contract that has passed its end date without renewal. Define how expired contracts trigger renewal opportunities and how they affect account status.",
            sourceOptions: ["Salesforce", "SAP", "Manual database"],
            fieldsBySource: {
              Salesforce: ["Contract.Status", "Contract.EndDate", "Contract.ContractNumber", "Contract.Renewal_Opportunity__c"],
              SAP: ["Contract.Status", "Contract.End_Date", "Contract.Contract_ID"],
              "Manual database": ["Contract_Log.Status", "Contract_Log.End_Date", "Contract_Log.Renewal_Flag"],
            },
            operatorOptions: [...DEFAULT_OPERATORS, "last N days", "last N months"],
          },
        ],
      },
      /* ── Asset (parent with sub-types) ─────────────────────────── */
      {
        id: "asset",
        defaultName: "Asset",
        isParent: true,
        defaultDefinition:
          "A product or solution installed or deployed at an account. Assets represent the current usage state of products purchased by an account and are used to track adoption, renewal, and upsell opportunities.",
        sourceOptions: ["Salesforce", "SAP", "Veeva CRM"],
        fieldsBySource: {
          Salesforce: ["Asset.Status", "Asset.Name", "Asset.Product2Id", "Asset.AccountId", "Asset.InstallDate", "Asset.UsageEndDate"],
          SAP: ["Asset.Status", "Asset.Product_ID", "Asset.Customer_ID", "Asset.Install_Date", "Asset.End_Date"],
          "Veeva CRM": ["Asset__c.Status__c", "Asset__c.Product__c", "Asset__c.Account__c", "Asset__c.Install_Date__c"],
        },
        operatorOptions: DEFAULT_OPERATORS,
        subTypes: [
          {
            id: "asset-active",
            defaultName: "Asset Active",
            defaultDefinition:
              "An asset that is currently installed and in active use at an account. The product is within its usage period and the account is an active customer.",
            sourceOptions: ["Salesforce", "SAP", "Veeva CRM"],
            fieldsBySource: {
              Salesforce: ["Asset.Status", "Asset.InstallDate", "Asset.UsageEndDate", "Asset.AccountId", "Asset.Product2Id"],
              SAP: ["Asset.Status", "Asset.Install_Date", "Asset.End_Date", "Asset.Customer_ID"],
              "Veeva CRM": ["Asset__c.Status__c", "Asset__c.Install_Date__c", "Asset__c.Account__c"],
            },
            operatorOptions: DEFAULT_OPERATORS,
          },
          {
            id: "asset-inactive",
            defaultName: "Asset Inactive",
            defaultDefinition:
              "An asset that is no longer in active use — the usage period has ended, the product has been decommissioned, or the account has churned. Define how inactive assets trigger win-back or reactivation workflows.",
            sourceOptions: ["Salesforce", "SAP", "Veeva CRM"],
            fieldsBySource: {
              Salesforce: ["Asset.Status", "Asset.UsageEndDate", "Asset.AccountId", "Asset.Product2Id", "Asset.Decommission_Date__c"],
              SAP: ["Asset.Status", "Asset.End_Date", "Asset.Customer_ID", "Asset.Decommission_Date"],
              "Veeva CRM": ["Asset__c.Status__c", "Asset__c.End_Date__c", "Asset__c.Account__c"],
            },
            operatorOptions: [...DEFAULT_OPERATORS, "last N days", "last N months"],
          },
        ],
      },
    ],
  },
  {
    key: "channel",
    label: "Channel",
    hidden: true,
    concepts: [
      {
        id: "interaction-types",
        defaultName: "Interaction Types",
        defaultDefinition:
          "The types of commercial engagement your teams execute. Define each type: face-to-face visit, remote detail, email, webinar, congress meeting, sample drop, phone call, etc.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Call2_vod__c.Call_Type", "Call2_vod__c.Channel__c", "Call2_vod__c.Status__c"],
          Salesforce: ["Task.Type", "Task.Subject", "Task.Channel__c", "Task.Status"],
          "Manual database": ["Interaction_Type_Lookup.Name", "Interaction_Type_Lookup.Channel", "Interaction_Type_Lookup.Category"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "digital-channel",
        defaultName: "Digital Channel",
        defaultDefinition:
          "Online and digital engagement channels: email, website, social media, webinars, approved email, remote detailing. Define how each digital touchpoint is tracked and attributed.",
        sourceOptions: ["Salesforce", "HubSpot", "Marketo", "Veeva CRM"],
        fieldsBySource: {
          Salesforce: ["Task.Channel__c", "Task.Digital_Type__c", "CampaignMember.Channel__c"],
          HubSpot: ["Engagement.Type", "Engagement.Channel", "Engagement.Source"],
          Marketo: ["Activity.Channel", "Activity.Type", "Activity.Source"],
          "Veeva CRM": ["Multichannel_Activity_vod__c.Channel__c", "Multichannel_Activity_vod__c.Type__c"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "field-force-channel",
        defaultName: "Field Force Channel",
        defaultDefinition:
          "In-person and field-based engagement: face-to-face visits, congress meetings, sample drops, speaker programs. Define rep activity types, call objectives, and how field interactions are logged.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Call2_vod__c.Call_Type", "Call2_vod__c.Objectives__c", "Call2_vod__c.Products_Detailed__c", "Call2_vod__c.Samples_Given__c"],
          Salesforce: ["Event.Type", "Event.Subject", "Event.Call_Objective__c", "Task.Activity_Type__c"],
          "Manual database": ["Field_Activity.Type", "Field_Activity.Objective", "Field_Activity.Products_Discussed"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "channel-attribution",
        defaultName: "Channel Attribution",
        defaultDefinition:
          "How credit for conversions is distributed across channels. Define the attribution model: first-touch, last-touch, multi-touch, time-decay, or custom weighted. Specify the lookback window and interaction weights.",
        sourceOptions: ["Salesforce", "HubSpot", "Manual database"],
        fieldsBySource: {
          Salesforce: ["CampaignInfluence.Model", "CampaignInfluence.Weight", "CampaignInfluence.Revenue_Share__c"],
          HubSpot: ["Attribution.Model", "Attribution.Source", "Attribution.Revenue_Credit"],
          "Manual database": ["Attribution_Config.Model_Type", "Attribution_Config.Lookback_Days", "Attribution_Config.Channel_Weights"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "channel-mix",
        defaultName: "Channel Mix",
        defaultDefinition:
          "The optimal combination of channels per HCP segment or account tier. Define the recommended mix of digital vs. field vs. congress engagement per target segment.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["Channel_Plan__c.Tier__c", "Channel_Plan__c.Digital_Pct__c", "Channel_Plan__c.Field_Pct__c"],
          Salesforce: ["Channel_Mix_Config__c.Segment__c", "Channel_Mix_Config__c.Channel__c", "Channel_Mix_Config__c.Target_Pct__c"],
          "Manual database": ["Channel_Mix_Rules.Segment", "Channel_Mix_Rules.Channel", "Channel_Mix_Rules.Percentage"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
    ],
  },
  {
    key: "campaign",
    label: "Campaign",
    hidden: true,
    concepts: [
      {
        id: "campaign",
        defaultName: "Campaign",
        defaultDefinition:
          "A coordinated marketing initiative with defined objectives, audience, channels, and timeline. Define what constitutes a campaign: product launch, disease awareness, congress, email nurture sequence, or multi-channel promotional wave.",
        sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot", "Marketo"],
        fieldsBySource: {
          Salesforce: ["Campaign.Name", "Campaign.Type", "Campaign.Status", "Campaign.StartDate", "Campaign.EndDate", "Campaign.BudgetedCost"],
          "Veeva CRM": ["Campaign__c.Name", "Campaign__c.Type__c", "Campaign__c.Status__c", "Campaign__c.Start_Date__c"],
          HubSpot: ["Campaigns.Name", "Campaigns.Type", "Campaigns.Status", "Campaigns.Budget"],
          Marketo: ["Program.Name", "Program.Type", "Program.Status", "Program.Period_Cost"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "campaign-type",
        defaultName: "Campaign Type",
        defaultDefinition:
          "The classification of campaigns by purpose and format. Define your campaign taxonomy: product promotion, disease awareness, medical education, congress, webinar series, sample program, or patient support.",
        sourceOptions: ["Salesforce", "Veeva CRM", "Manual database"],
        fieldsBySource: {
          Salesforce: ["Campaign.Type", "Campaign.Sub_Type__c", "Campaign.Therapeutic_Area__c"],
          "Veeva CRM": ["Campaign__c.Type__c", "Campaign__c.Category__c", "Campaign__c.Therapeutic_Area__c"],
          "Manual database": ["Campaign_Type_Lookup.Name", "Campaign_Type_Lookup.Category", "Campaign_Type_Lookup.Description"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "campaign-audience",
        defaultName: "Campaign Audience",
        defaultDefinition:
          "The target audience definition for a campaign. Define how segments are built: by HCP specialty, tier, prescribing behavior, adoption ladder stage, geography, or account attributes.",
        sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot"],
        fieldsBySource: {
          Salesforce: ["CampaignMember.Status", "CampaignMember.Type", "CampaignMember.Segment__c"],
          "Veeva CRM": ["Campaign_Member__c.Segment__c", "Campaign_Member__c.Tier__c", "Campaign_Member__c.Specialty__c"],
          HubSpot: ["Contacts.List_Membership", "Contacts.Segment", "Contacts.Lifecycle_Stage"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "campaign-response",
        defaultName: "Campaign Response",
        defaultDefinition:
          "How campaign engagement is measured and tracked. Define the response types: attended, clicked, opened, downloaded, requested demo, responded to call, registered. Specify what counts as a meaningful response vs. passive exposure.",
        sourceOptions: ["Salesforce", "Veeva CRM", "HubSpot", "Marketo"],
        fieldsBySource: {
          Salesforce: ["CampaignMember.Status", "CampaignMember.FirstRespondedDate", "CampaignMember.Response_Type__c"],
          "Veeva CRM": ["Campaign_Response__c.Type__c", "Campaign_Response__c.Date__c", "Campaign_Response__c.Channel__c"],
          HubSpot: ["Engagement.Type", "Engagement.Timestamp", "Engagement.Response_Status"],
          Marketo: ["Activity.Type", "Activity.DateTime", "Activity.Success"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "campaign-roi",
        defaultName: "Campaign ROI",
        defaultDefinition:
          "How campaign return on investment is calculated. Define cost inputs (media spend, content production, field time, agency fees), revenue attribution methodology, and the timeframe for measuring impact.",
        sourceOptions: ["Salesforce", "Manual database"],
        fieldsBySource: {
          Salesforce: ["Campaign.BudgetedCost", "Campaign.ActualCost", "Campaign.AmountAllOpportunities", "Campaign.NumberOfWonOpportunities"],
          "Manual database": ["Campaign_ROI.Total_Cost", "Campaign_ROI.Attributed_Revenue", "Campaign_ROI.Time_Period", "Campaign_ROI.Model"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
      {
        id: "content-asset",
        defaultName: "Content Asset",
        defaultDefinition:
          "Approved marketing materials used in campaigns: CLM presentations, approved emails, brochures, whitepapers, videos, KOL talks. Define the content taxonomy, approval workflow status, and how assets are linked to campaigns and channels.",
        sourceOptions: ["Veeva CRM", "Salesforce", "Manual database"],
        fieldsBySource: {
          "Veeva CRM": ["CLM_Presentation_vod__c.Name", "CLM_Presentation_vod__c.Status__c", "CLM_Presentation_vod__c.Product__c"],
          Salesforce: ["Content_Asset__c.Name", "Content_Asset__c.Type__c", "Content_Asset__c.Approval_Status__c"],
          "Manual database": ["Content_Library.Name", "Content_Library.Type", "Content_Library.Status", "Content_Library.Product"],
        },
        operatorOptions: DEFAULT_OPERATORS,
      },
    ],
  },
];

// ── Natural-language summary builder ────────────────────────────
function formatConditionText(c) {
  const field = c.field || "";
  const shortField = field.includes(".") ? field.split(".").pop() : field;
  const op = c.operator || "";
  const val = c.value || "";

  switch (op) {
    case "is":
      return `${shortField} is "${val}"`;
    case "is not":
      return `${shortField} is not "${val}"`;
    case "contains":
      return `${shortField} contains "${val}"`;
    case "does not contain":
      return `${shortField} does not contain "${val}"`;
    case "equals":
      return `${shortField} equals "${val}"`;
    case "greater than":
      return `${shortField} is greater than ${val}`;
    case "less than":
      return `${shortField} is less than ${val}`;
    case "in":
      return `${shortField} is one of "${val}"`;
    case "not in":
      return `${shortField} is not one of "${val}"`;
    default:
      return `${shortField}${op ? ` ${op}` : ""}${val ? ` "${val}"` : ""}`;
  }
}

function buildCombinedPreview(sources, sourceOperators, conceptName) {
  const blocks = sources
    .map((srcBlock, srcIdx) => {
      const valid = srcBlock.conditions.filter((c) => c.field);
      if (valid.length === 0) return null;
      const bullets = valid.map((c, i) => {
        const text = formatConditionText(c);
        const op = i > 0 ? (srcBlock.conditionOperators[i - 1] || "AND") : null;
        return { text, operator: op };
      });
      const sourceName = srcBlock.source || "Unknown source";
      const manualLabel = srcBlock.manualDb ? ` → ${srcBlock.manualDb}` : "";
      const betweenOp = srcIdx > 0 ? (sourceOperators[srcIdx - 1] || "AND") : null;
      return { sourceName: `${sourceName}${manualLabel}`, bullets, betweenOp };
    })
    .filter(Boolean);

  return { blocks, conceptName };
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
  onAddSource,
  onRemoveSource,
  onUpdateSourceField,
  onAddSourceCondition,
  onRemoveSourceCondition,
  onUpdateSourceCondition,
  onSetSourceConditionOperator,
  onSetSourceOperator,
  onDuplicate,
  onResetDefinition,
  onSetCustomDefault,
  onClearCustomDefault,
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const isSystemConfigured = concept.systemConfigured;
  const effectiveStatus = isSystemConfigured ? "defined" : data.status;
  const status = statusConfig[effectiveStatus];
  const nameRenamed = data.name !== concept.defaultName;

  const activeDefault = customDefault || concept.defaultDefinition;

  const getFieldsForSource = (sourceName) =>
    sourceName && concept.fieldsBySource[sourceName]
      ? concept.fieldsBySource[sourceName]
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
                if (e.key === "Enter") setEditingName(false);
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
          {isSystemConfigured && (
            <span className="flex items-center gap-1 rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2563eb]">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5L4 7L8 3" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              System configured
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.badgeBg} ${status.badgeColor}`}>
            {status.text}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setEditingName(true); }}
            className="shrink-0 p-1 text-[#9ca3af] transition-colors hover:text-[#155dfc]"
            title="Rename"
          >
            <EditPencilIcon />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(concept.id); }}
            className="shrink-0 p-1 text-[#9ca3af] transition-colors hover:text-[#155dfc]"
            title="Duplicate"
          >
            <CopyIcon />
          </button>
          <span className={`text-[#6a7282] transition-transform ${expanded ? "rotate-180" : ""}`}>
            <ChevronDownIcon />
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[#e5e7eb] px-6 py-5">
          <div className="flex flex-col gap-6">
            {/* ── Section 1: Definition ── */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                Definition
              </label>
              <div className="flex items-start gap-2 rounded-lg bg-[#f9fafb] px-3.5 py-2.5">
                <span className="shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9ca3af]">
                  System:
                </span>
                <span className="text-sm italic leading-relaxed text-[#6a7282]">{activeDefault}</span>
              </div>
            </div>

            {/* ── Pre-configured rules (system-configured concepts) ── */}
            {isSystemConfigured && concept.preConfiguredRules && (
              <>
                <div className="border-t border-[#f3f4f6]" />
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                    Pre-configured rules (system)
                  </label>
                  <div className="rounded-lg border border-[#dbeafe] bg-[#eff6ff] p-4">
                    <div className="flex flex-col gap-2">
                      {concept.preConfiguredRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="min-w-[130px] rounded border border-[#e5e7eb] bg-white px-2.5 py-1 text-xs font-medium text-[#4a5565]">
                            {rule.field}
                          </span>
                          <span className="rounded bg-[#dbeafe] px-2.5 py-1 text-xs font-medium text-[#2563eb]">
                            {rule.source}
                          </span>
                          <span className="rounded bg-[#dbeafe] px-2.5 py-1 text-xs font-medium text-[#2563eb]">
                            {rule.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs italic text-[#6a7282]">
                      These rules are automatically configured based on your connected data sources. You can add additional rules below.
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="border-t border-[#f3f4f6]" />

            {/* ── Section 2: Sources & Classification Rules ── */}
            <div className="flex flex-col gap-4">
              <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                Sources & Classification Rules
              </label>

              {data.sources.map((srcBlock, srcIdx) => {
                const fieldsForSrc = getFieldsForSource(srcBlock.source);
                return (
                  <div key={srcBlock.id}>
                    <div className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-5">
                      {/* Source header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#4a5565]">Source {srcIdx + 1}</span>
                        <button
                          onClick={() => onRemoveSource(concept.id, srcBlock.id)}
                          className="shrink-0 p-1 text-[#6a7282] transition-colors hover:text-[#dc2626]"
                          title="Remove source"
                        >
                          <TrashIcon />
                        </button>
                      </div>

                      {/* Source dropdown + optional manual DB */}
                      <div className="flex gap-4">
                        <div className="w-1/2">
                          <SearchableDropdown
                            value={srcBlock.source}
                            options={concept.sourceOptions.filter(
                              (opt) => opt === srcBlock.source || !data.sources.some((s) => s.id !== srcBlock.id && s.source === opt)
                            )}
                            onChange={(val) => onUpdateSourceField(concept.id, srcBlock.id, "source", val)}
                            placeholder="Select source system..."
                          />
                        </div>
                        {srcBlock.source === "Manual database" && (
                          <div className="w-1/2">
                            <SearchableDropdown
                              value={srcBlock.manualDb || ""}
                              options={MANUAL_DATABASE_OPTIONS}
                              onChange={(val) => onUpdateSourceField(concept.id, srcBlock.id, "manualDb", val)}
                              placeholder="Select manual database..."
                            />
                          </div>
                        )}
                      </div>

                      {/* Conditions */}
                      {srcBlock.source && (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-medium text-[#6a7282]">Rules</span>

                          {srcBlock.conditions.length === 0 && (
                            <button
                              onClick={() => onAddSourceCondition(concept.id, srcBlock.id)}
                              className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#cbd5e1] px-3.5 py-2 transition-colors hover:border-[#94a3b8] hover:bg-white"
                            >
                              <PlusSmallIcon />
                              <span className="text-sm font-semibold text-[#616f89]">Add First Condition</span>
                            </button>
                          )}

                          {srcBlock.conditions.length > 0 && (
                            <div className="flex flex-col gap-2">
                              {srcBlock.conditions.map((condition, index) => (
                                <div key={condition.id}>
                                  <div className="flex items-start gap-3">
                                    <div className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#e2e8f0] bg-white">
                                      <span className="text-[10px] font-black text-[#111318]">{index + 1}</span>
                                    </div>
                                    <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-4 py-3">
                                      <div className="flex-1">
                                        <SearchableDropdown
                                          value={condition.field}
                                          options={fieldsForSrc}
                                          onChange={(val) =>
                                            onUpdateSourceCondition(concept.id, srcBlock.id, condition.id, "field", val)
                                          }
                                          placeholder="Select field..."
                                        />
                                      </div>
                                      <div className="w-40">
                                        <SearchableDropdown
                                          value={condition.operator}
                                          options={condition.field ? getOperatorsForField(condition.field) : concept.operatorOptions}
                                          onChange={(val) =>
                                            onUpdateSourceCondition(concept.id, srcBlock.id, condition.id, "operator", val)
                                          }
                                          placeholder="Operator..."
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <ConditionValueInput
                                          field={condition.field}
                                          operator={condition.operator}
                                          value={condition.value}
                                          onChange={(val) =>
                                            onUpdateSourceCondition(concept.id, srcBlock.id, condition.id, "value", val)
                                          }
                                        />
                                      </div>
                                      <button
                                        onClick={() => onRemoveSourceCondition(concept.id, srcBlock.id, condition.id)}
                                        className="shrink-0 p-1 text-[#6a7282] transition-colors hover:text-[#dc2626]"
                                      >
                                        <TrashIcon />
                                      </button>
                                    </div>
                                  </div>

                                  {index < srcBlock.conditions.length - 1 && (
                                    <div className="flex justify-center py-1 pl-9">
                                      <div className="flex items-center rounded-full border border-[#e2e8f0] bg-[#f1f5f9] p-[3px]">
                                        {["AND", "OR"].map((op) => (
                                          <button
                                            key={op}
                                            onClick={() => onSetSourceConditionOperator(concept.id, srcBlock.id, index, op)}
                                            className={`rounded-full px-3 py-0.5 text-xs font-bold transition-colors ${
                                              (srcBlock.conditionOperators[index] || "AND") === op
                                                ? "bg-[#135bec] text-white shadow-sm"
                                                : "text-[#616f89]"
                                            }`}
                                          >
                                            {op}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}

                              <div className="pl-9 pt-1">
                                <button
                                  onClick={() => onAddSourceCondition(concept.id, srcBlock.id)}
                                  className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#cbd5e1] px-3.5 py-2 transition-colors hover:border-[#94a3b8] hover:bg-white"
                                >
                                  <PlusSmallIcon />
                                  <span className="text-sm font-semibold text-[#616f89]">Add Condition</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* AND/OR between source blocks */}
                    {srcIdx < data.sources.length - 1 && (
                      <div className="flex justify-center py-2">
                        <div className="flex items-center rounded-full border border-[#e2e8f0] bg-[#f1f5f9] p-[3px]">
                          {["AND", "OR"].map((op) => (
                            <button
                              key={op}
                              onClick={() => onSetSourceOperator(concept.id, srcIdx, op)}
                              className={`rounded-full px-3 py-0.5 text-xs font-bold transition-colors ${
                                ((data.sourceOperators || {})[srcIdx] || "AND") === op
                                  ? "bg-[#135bec] text-white shadow-sm"
                                  : "text-[#616f89]"
                              }`}
                            >
                              {op}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => onAddSource(concept.id)}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#cbd5e1] px-4 py-4 transition-colors hover:border-[#94a3b8] hover:bg-gray-50"
              >
                <PlusSmallIcon />
                <span className="text-sm font-semibold text-[#616f89]">Add Source</span>
              </button>

              {/* Rule summary */}
              {data.sources.length > 0 && data.sources.some((s) => s.conditions.some((c) => c.field)) && (() => {
                const { blocks, conceptName } = buildCombinedPreview(data.sources, data.sourceOperators || {}, data.name);
                if (blocks.length === 0) return null;
                return (
                  <div className="flex flex-col gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-[17px] pb-4 pt-[17px]">
                    <span className="text-xs font-medium text-[#4a5565]">Rule summary</span>
                    <p className="text-sm font-medium text-[#0a0a0a]">
                      To classify a record as &ldquo;{conceptName},&rdquo; it must match:
                    </p>
                    <div className="flex flex-col gap-1">
                      {blocks.map((block, bIdx) => (
                        <div key={bIdx}>
                          {block.betweenOp && (
                            <p className="py-0.5 pl-4 text-xs font-bold text-[#135bec]">{block.betweenOp}</p>
                          )}
                          <p className="pl-4 text-xs font-semibold text-[#6a7282]">From {block.sourceName}:</p>
                          {block.bullets.map((bullet, cIdx) => (
                            <div key={cIdx}>
                              {bullet.operator && (
                                <p className="py-0.5 pl-8 text-xs font-bold text-[#135bec]">{bullet.operator}</p>
                              )}
                              <p className="pl-8 text-sm text-[#0a0a0a]">&bull; {bullet.text}</p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
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
    addSource,
    removeSource,
    updateSourceField,
    addSourceCondition,
    removeSourceCondition,
    updateSourceCondition,
    setSourceConditionOperator,
    setSourceOperator,
    resetDefinition,
    setCustomDefault,
    clearCustomDefault,
    getTabStats,
    customConcepts,
    duplicateConcept,
  } = useDomainDefinitionContext();

  const visibleTabs = TABS.filter((t) => !t.hidden);
  const currentTab = TABS.find((t) => t.key === activeTab);

  const tabCustomConcepts = customConcepts
    .filter((cc) => cc.tabKey === activeTab)
    .map((cc) => cc.concept);
  const allTabConcepts = [...currentTab.concepts, ...tabCustomConcepts];

  const filteredConcepts = allTabConcepts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const d = concepts[c.id];
    if (!d) return false;
    const subMatch = c.subTypes?.some((st) => {
      const sd = concepts[st.id];
      return sd && (sd.name.toLowerCase().includes(q) || st.defaultDefinition.toLowerCase().includes(q));
    });
    return (
      d.name.toLowerCase().includes(q) ||
      c.defaultDefinition.toLowerCase().includes(q) ||
      subMatch
    );
  });

  const sharedSubProps = {
    onUpdate: updateConcept,
    onAddSource: addSource,
    onRemoveSource: removeSource,
    onUpdateSourceField: updateSourceField,
    onAddSourceCondition: addSourceCondition,
    onRemoveSourceCondition: removeSourceCondition,
    onUpdateSourceCondition: updateSourceCondition,
    onSetSourceConditionOperator: setSourceConditionOperator,
    onSetSourceOperator: setSourceOperator,
    onResetDefinition: resetDefinition,
    onSetCustomDefault: setCustomDefault,
    onClearCustomDefault: clearCustomDefault,
  };

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">Domain Definition</h1>
            <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
              Help the system understand your commercial language. Define what each concept means for your organization and where to find it in your data.
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
                  onClick={() => { setActiveTab(tab.key); setSearchQuery(""); }}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap pb-3 text-sm font-medium transition-colors ${
                    active ? "border-b-2 border-[#155dfc] text-[#155dfc]" : "text-[#4a5565] hover:text-[#0a0a0a]"
                  }`}
                >
                  {tab.label}
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${active ? "bg-[#dbeafe] text-[#155dfc]" : "bg-[#f3f4f6] text-[#4a5565]"}`}>
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
            {filteredConcepts.length === 0 && (
              <div className="flex items-center justify-center rounded-xl border border-[#e5e7eb] bg-white py-12">
                <p className="text-sm text-[#6a7282]">No concepts match your search.</p>
              </div>
            )}
            {filteredConcepts.map((concept) => {
              const cardProps = {
                concept,
                data: concepts[concept.id],
                customDefault: customDefaults[concept.id],
                ...sharedSubProps,
                onDuplicate: () => duplicateConcept(concept.id, activeTab, concept),
              };

              if (concept.isParent && concept.subTypes) {
                return (
                  <div key={concept.id} className="flex flex-col gap-3">
                    <ConceptCard {...cardProps} />
                    <div className="relative flex flex-col gap-2 pl-8">
                      <div className="absolute bottom-0 left-[14px] top-0 w-px bg-[#e5e7eb]" />
                      {concept.subTypes.map((sub) => (
                        <div key={sub.id} className="relative">
                          <div className="absolute left-[-18px] top-[20px] h-px w-[18px] bg-[#e5e7eb]" />
                          <ConceptCard
                            concept={sub}
                            data={concepts[sub.id]}
                            customDefault={customDefaults[sub.id]}
                            {...sharedSubProps}
                            onDuplicate={() => duplicateConcept(sub.id, activeTab, sub)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return <ConceptCard key={concept.id} {...cardProps} />;
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
