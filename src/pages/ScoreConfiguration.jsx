import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";

// ══════════════════════════════════════════════════════════════════
// CONNECTOR MOCK DATA
// ══════════════════════════════════════════════════════════════════

// Field values: null = leaf (no sub-columns), object = has sub-columns
const CONNECTORS = {
  CRM: {
    files: {
      Contacts: {
        "Specialty": null,
        "Sub-Specialty": null,
        "Role": null,
        "Prescriber Status": null,
        "Department": null,
        "KOL Status": null,
        "Innovation Profile": null,
      },
      Accounts: {
        "Hospital Name": null,
        "Department": null,
        "Beds Count": null,
        "Procedures/Year": null,
        "Geography": null,
      },
    },
  },
  LinkedIn: {
    files: {
      Profile: {
        "Job Title": null,
        "Department": null,
        "Connections Count": null,
        "Institution": null,
        "Seniority": null,
      },
    },
  },
  PubMed: {
    files: {
      Publications: {
        "Author Name": null,
        "Publication Count (4 yrs)": null,
        "Last Publication Year": null,
      },
    },
  },
  "External DB": {
    files: {
      "Research Database": {
        "Clinical Trial Status": null,
        "PI Role": null,
        "Sub-Investigator Role": null,
      },
    },
  },
  "Reps (Manual)": { files: {} },
  ERP: {
    files: {
      Orders: { "Order Date": null, SKU: null, Revenue: null, Quantity: null },
      Invoices: { "Due Date": null, "Paid Date": null },
    },
  },
  "Marketing Cloud": {
    files: {
      "Email Activities": { Sent: null, Opened: null, Clicked: null, Bounced: null },
    },
  },
  "Veeva CRM": {
    files: {
      Activities: { "Call Report": null, "Visit Report": null, "Sample Request": null, "Remote Meeting": null },
    },
  },
  "Veeva CLM": {
    files: {
      Presentations: { "Slide Views": null, "Detail Duration": null, "Key Message": null },
    },
  },
  Salesforce: {
    files: {
      Activities: { Task: null, Event: null, Email: null },
      Opportunities: { Stage: null, "Close Date": null },
    },
  },
  LMS: {
    files: {
      "Training Records": { "Completion Status": null, Score: null, "Completion Date": null },
    },
  },
  Website: {
    files: {
      Analytics: { "Page Views": null, Downloads: null, "Session Duration": null },
    },
  },
  "Events CRM": {
    files: {
      Events: { Registration: null, Attendance: null, "Badge Scan": null },
    },
  },
  "Webinar Platform": {
    files: {
      Webinars: { Registration: null, Attendance: null, "Duration Watched": null, "Q&A Participation": null },
    },
  },
  "Data Analytics": {
    files: {
      "Market Data": { "Market Share": null, "Territory Index": null },
    },
  },
  "Nat. Statistics": { files: {} },
  // Uploaded databases (shown only after upload)
  "HCP Registry (uploaded)": {
    isUploaded: true,
    files: {
      "doctors_q1.csv": {
        "Full Name": null,
        "Specialty": null,
        "Contacts": {
          "Sub-Specialty": null,
          "Email": null,
          "Phone": null,
        },
        "Hospital Affiliation": {
          "Hospital Name": null,
          "Department": null,
          "City": null,
        },
      },
    },
  },
};

// Compute active connector names (uploaded ones only visible after upload)
function getConnectorNames() {
  const hasUpload = !!localStorage.getItem("hcp-upload-conflicts");
  return Object.keys(CONNECTORS).filter(
    (name) => !CONNECTORS[name].isUploaded || hasUpload
  );
}

// Build cascade dropdown specs for a given source + path selection
// path = [fileKey, columnKey?, subColumnKey?, ...]
// Returns [{ label, options, value }, ...]
function getCascadeDropdowns(source, path) {
  const conn = CONNECTORS[source];
  if (!conn) return [];
  const fileOptions = Object.keys(conn.files || {});
  if (fileOptions.length === 0) return [];

  const drops = [{ label: "Table / File", options: fileOptions, value: path[0] || "" }];
  if (!path[0]) return drops;

  let node = conn.files[path[0]];
  for (let depth = 1; node && typeof node === "object"; depth++) {
    const opts = Object.keys(node);
    if (opts.length === 0) break;
    drops.push({
      label: depth === 1 ? "Column / Field" : "Sub-column",
      options: opts,
      value: path[depth] || "",
    });
    if (!path[depth] || node[path[depth]] === null) break;
    node = node[path[depth]];
  }
  return drops;
}

// ══════════════════════════════════════════════════════════════════
// DEFAULT HCP ICP DATA
// ══════════════════════════════════════════════════════════════════

const makeDefaultHCPProfiles = () => [
  {
    id: "cardiovascular",
    name: "Cardiovascular",
    isDefault: true,
    sections: [
      {
        id: "A", label: "Profile Fit Score", maxPoints: 35, enabled: true, productImpactedAll: true,
        rows: [
          {
            id: "A1", variable: "Specialty match",
            subValues: [
              { id: "A1a", label: "Primary match", points: 15 },
              { id: "A1b", label: "Related", points: 8 },
              { id: "A1c", label: "Unrelated", points: 0 },
            ],
            sources: [
              { id: "s1", connector: "CRM", file: "Contacts", field: "Specialty" },
              { id: "s2", connector: "Reps (Manual)", file: "", field: "" },
            ],
          },
          {
            id: "A2", variable: "Role (Prescriptive Autonomy)",
            subValues: [
              { id: "A2a", label: "Primario del reparto", points: 12 },
              { id: "A2b", label: "Strutturato senior", points: 6 },
              { id: "A2c", label: "Other", points: 0 },
            ],
            sources: [
              { id: "s3", connector: "CRM", file: "Contacts", field: "Role" },
              { id: "s4", connector: "LinkedIn", file: "Profile", field: "Job Title" },
            ],
          },
          {
            id: "A3", variable: "Sub-specialty precision",
            subValues: [
              { id: "A3a", label: "Matches indication", points: 5 },
              { id: "A3b", label: "No match", points: 0 },
            ],
            sources: [
              { id: "s5", connector: "CRM", file: "Contacts", field: "Sub-Specialty" },
              { id: "s6", connector: "Reps (Manual)", file: "", field: "" },
            ],
          },
          {
            id: "A4", variable: "Confirmed prescriber status",
            subValues: [
              { id: "A4a", label: "Confirmed in category", points: 3 },
              { id: "A4b", label: "Unconfirmed", points: 0 },
            ],
            sources: [
              { id: "s7", connector: "CRM", file: "Contacts", field: "Prescriber Status" },
              { id: "s8", connector: "Reps (Manual)", file: "", field: "" },
            ],
          },
        ],
        removedRows: [],
      },
      {
        id: "B", label: "Role & Influence Score", maxPoints: 35, enabled: true, productImpactedAll: true,
        rows: [
          {
            id: "B1", variable: "Decision-making role",
            subValues: [
              { id: "B1a", label: "Dept Head", points: 20 },
              { id: "B1b", label: "Senior clinician", points: 10 },
              { id: "B1c", label: "Staff", points: 0 },
            ],
            sources: [
              { id: "s9", connector: "CRM", file: "Contacts", field: "Role" },
              { id: "s10", connector: "Reps (Manual)", file: "", field: "" },
            ],
          },
          {
            id: "B2", variable: "KOL / thought leader status",
            subValues: [
              { id: "B2a", label: "National KOL", points: 10 },
              { id: "B2b", label: "Local", points: 5 },
              { id: "B2c", label: "None", points: 0 },
            ],
            sources: [
              { id: "s11", connector: "CRM", file: "Contacts", field: "KOL Status" },
              { id: "s12", connector: "Reps (Manual)", file: "", field: "" },
            ],
          },
          {
            id: "B3", variable: "Innovation profile",
            subValues: [
              { id: "B3a", label: "Early adopter", points: 5 },
              { id: "B3b", label: "Mainstream", points: 3 },
              { id: "B3c", label: "Late adopter", points: 0 },
            ],
            sources: [
              { id: "s13", connector: "CRM", file: "Contacts", field: "Innovation Profile" },
              { id: "s14", connector: "Reps (Manual)", file: "", field: "" },
            ],
          },
        ],
        removedRows: [],
      },
      {
        id: "C", label: "HCO ICP Score", maxPoints: 10, enabled: true, fixedSource: true, productImpactedAll: true,
        rows: [
          { id: "C1", variable: "HCO ICP associated account is ≥ 70", subValues: [{ id: "C1a", label: "≥ 70", points: 10 }], sources: [{ id: "c-src-1", connector: "HCO ICP Score", path: [] }] },
          { id: "C2", variable: "HCO ICP associated account is 40–69", subValues: [{ id: "C2a", label: "40–69", points: 5 }], sources: [{ id: "c-src-2", connector: "HCO ICP Score", path: [] }] },
          { id: "C3", variable: "HCO ICP associated account is < 40", subValues: [{ id: "C3a", label: "< 40", points: 0 }], sources: [{ id: "c-src-3", connector: "HCO ICP Score", path: [] }] },
        ],
        removedRows: [],
      },
      {
        id: "D", label: "Research & Academic Activity", maxPoints: 20, enabled: true, productImpactedAll: true,
        rows: [
          {
            id: "D1", variable: "Publications",
            subValues: [
              { id: "D1a", label: "≥3 papers in last 4 years", points: 10 },
              { id: "D1b", label: "1–2 papers", points: 5 },
              { id: "D1c", label: "0 papers", points: 0 },
            ],
            sources: [
              { id: "s15", connector: "PubMed", file: "Publications", field: "Publication Count (4 yrs)" },
              { id: "s16", connector: "External DB", file: "Research Database", field: "Clinical Trial Status" },
            ],
          },
          {
            id: "D2", variable: "Active clinical trial",
            subValues: [
              { id: "D2a", label: "Principal Investigator", points: 10 },
              { id: "D2b", label: "Sub-investigator", points: 5 },
              { id: "D2c", label: "None", points: 0 },
            ],
            sources: [
              { id: "s17", connector: "External DB", file: "Research Database", field: "PI Role" },
              { id: "s18", connector: "Reps (Manual)", file: "", field: "" },
            ],
          },
        ],
        removedRows: [],
      },
    ],
    scoreBands: [
      { id: "sb1", threshold: "≥ 70", priority: "High Priority", color: "green", action: "Priority target: field engagement (high freq. of visits) + event invitation" },
      { id: "sb2", threshold: "40–69", priority: "Medium Priority", color: "amber", action: "Digital + selective field contact (lower freq. of visits)" },
      { id: "sb3", threshold: "< 40", priority: "Low Priority", color: "blue", action: "Digital nurture only" },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════
// DEFAULT HCO ICP DATA
// ══════════════════════════════════════════════════════════════════

const makeDefaultHCOProfile = () => ({
  id: "hco-default",
  name: "Default HCO ICP",
  sections: [
    {
      id: "A",
      label: "Firmographic Variables",
      maxPoints: 30,
      enabled: true,
      rows: [
        {
          id: "A1", variable: "Facility type",
          subValues: [
            { id: "A1a", label: "Academic / teaching hospital", points: 5 },
            { id: "A1b", label: "General hospital",             points: 3 },
            { id: "A1c", label: "Specialty hospital",           points: 2 },
            { id: "A1d", label: "Clinic group",                 points: 1 },
            { id: "A1e", label: "Ambulatory",                   points: 1 },
          ],
          sources: [
            { id: "hco-s1", connector: "CRM",         path: ["Accounts"] },
            { id: "hco-s2", connector: "External DB",  path: ["Research Database"] },
          ],
        },
        {
          id: "A2", variable: "Ownership type",
          subValues: [
            { id: "A2a", label: "Mixed",   points: 5 },
            { id: "A2b", label: "Private", points: 3 },
            { id: "A2c", label: "Public",  points: 1 },
          ],
          sources: [
            { id: "hco-s3", connector: "CRM",        path: ["Accounts"] },
            { id: "hco-s4", connector: "External DB", path: ["Research Database"] },
          ],
        },
        {
          id: "A3", variable: "Specialty departments", productImpacted: true,
          subValues: [
            { id: "A3a", label: "Target-indication match", points: 5 },
            { id: "A3b", label: "No match",                points: 0 },
          ],
          sources: [
            { id: "hco-s5", connector: "CRM",        path: ["Accounts", "Department"] },
            { id: "hco-s6", connector: "External DB", path: ["Research Database"] },
          ],
        },
        {
          id: "A4", variable: "Bed count",
          subValues: [
            { id: "A4a", label: "> 500 beds",     points: 5 },
            { id: "A4b", label: "200 – 499 beds", points: 3 },
            { id: "A4c", label: "50 – 199 beds",  points: 2 },
            { id: "A4d", label: "< 50 beds",      points: 1 },
          ],
          sources: [
            { id: "hco-s7", connector: "CRM",        path: ["Accounts", "Beds Count"] },
            { id: "hco-s8", connector: "External DB", path: ["Research Database"] },
          ],
        },
        {
          id: "A5", variable: "Geography",
          subValues: [
            { id: "A5a", label: "Urban high-density", points: 5 },
            { id: "A5b", label: "Suburban",           points: 3 },
            { id: "A5c", label: "Rural",              points: 1 },
          ],
          sources: [
            { id: "hco-s9",  connector: "CRM",             path: ["Accounts", "Geography"] },
            { id: "hco-s10", connector: "Nat. Statistics",  path: [] },
          ],
        },
        {
          id: "A6", variable: "Group member",
          subValues: [
            { id: "A6a", label: "Part of a group", points: 5 },
            { id: "A6b", label: "Standalone",      points: 0 },
          ],
          sources: [
            { id: "hco-s11", connector: "CRM",        path: ["Accounts"] },
            { id: "hco-s12", connector: "External DB", path: ["Research Database"] },
          ],
        },
      ],
      removedRows: [],
    },
    {
      id: "B",
      label: "Commercial Variables",
      maxPoints: 70,
      enabled: true,
      productImpactedAll: true,
      rows: [
        {
          id: "B1", variable: "Revenue",
          subValues: [
            { id: "B1a", label: "Top quartile",           points: 15 },
            { id: "B1b", label: "2nd quartile",           points: 8  },
            { id: "B1c", label: "3rd quartile",           points: 3  },
            { id: "B1d", label: "4th quartile or zero",   points: 0  },
          ],
          sources: [{ id: "hco-b1", connector: "ERP", path: [] }],
        },
        {
          id: "B2", variable: "Revenue trend",
          subValues: [
            { id: "B2a", label: "Growing > 3%", points: 5 },
            { id: "B2b", label: "Stable",       points: 0 },
            { id: "B2c", label: "Declining",    points: 0 },
          ],
          sources: [{ id: "hco-b2", connector: "ERP", path: [] }],
        },
        {
          id: "B3", variable: "Purchase frequency",
          subValues: [
            { id: "B3a", label: "≥ 6 orders / yr",   points: 10 },
            { id: "B3b", label: "3 – 5 orders / yr", points: 6  },
            { id: "B3c", label: "1 – 2 orders / yr", points: 3  },
            { id: "B3d", label: "0 orders",           points: 0  },
          ],
          sources: [{ id: "hco-b3", connector: "ERP", path: [] }],
        },
        {
          id: "B4", variable: "Surgeries frequency",
          subValues: [
            { id: "B4a", label: "High volume (> 500 / yr)",      points: 5 },
            { id: "B4b", label: "Medium volume (200 – 499 / yr)", points: 3 },
            { id: "B4c", label: "Low volume (< 200 / yr)",        points: 1 },
            { id: "B4d", label: "None / unknown",                 points: 0 },
          ],
          sources: [{ id: "hco-b4", connector: "External DB", path: ["Research Database"] }],
        },
        {
          id: "B5", variable: "SKU breadth",
          subValues: [
            { id: "B5a", label: "3+ SKUs", points: 10 },
            { id: "B5b", label: "2 SKUs",  points: 6  },
            { id: "B5c", label: "1 SKU",   points: 3  },
          ],
          sources: [{ id: "hco-b5", connector: "ERP", path: [] }],
        },
        {
          id: "B6", variable: "Competitive product usage",
          subValues: [
            { id: "B6a", label: "No competitor product", points: 5 },
            { id: "B6b", label: "Mixed usage",           points: 2 },
            { id: "B6c", label: "Competitor-dominant",   points: 0 },
          ],
          sources: [
            { id: "hco-b6a", connector: "CRM",          path: ["Accounts"] },
            { id: "hco-b6b", connector: "Reps (Manual)", path: [] },
          ],
        },
        {
          id: "B7", variable: "Tender status",
          subValues: [
            { id: "B7a", label: "On formulary / active tender", points: 5 },
            { id: "B7b", label: "Pending",                      points: 2 },
            { id: "B7c", label: "Not on formulary",             points: 0 },
          ],
          sources: [
            { id: "hco-b7a", connector: "CRM",          path: ["Accounts"] },
            { id: "hco-b7b", connector: "Reps (Manual)", path: [] },
          ],
        },
        {
          id: "B8", variable: "Contract status",
          subValues: [
            { id: "B8a", label: "Active contract", points: 5 },
            { id: "B8b", label: "No contract",     points: 0 },
          ],
          sources: [
            { id: "hco-b8a", connector: "ERP", path: [] },
            { id: "hco-b8b", connector: "CRM", path: ["Accounts"] },
          ],
        },
        {
          id: "B9", variable: "Payment reliability", productIndependent: true,
          subValues: [
            { id: "B9a", label: "No overdue invoices",   points: 5 },
            { id: "B9b", label: "Minor delays",          points: 2 },
            { id: "B9c", label: "Chronic late payments", points: 0 },
          ],
          sources: [{ id: "hco-b9", connector: "ERP", path: [] }],
        },
        {
          id: "B10", variable: "Market share",
          subValues: [
            { id: "B10a", label: "High – dominant", points: 5 },
            { id: "B10b", label: "Medium",          points: 3 },
            { id: "B10c", label: "Low",             points: 1 },
            { id: "B10d", label: "Unknown",         points: 0 },
          ],
          sources: [{ id: "hco-b10", connector: "Data Analytics", path: [] }],
        },
      ],
      removedRows: [],
    },
  ],
  scoreBands: [
    { id: "hco-sb1", threshold: "≥ 70",    priority: "High Affinity",   color: "green", action: "Full omnichannel engagement + Dedicated Account Manager + Monthly visits" },
    { id: "hco-sb2", threshold: "40 – 69", priority: "Medium Affinity", color: "amber", action: "Digital outreach + Quarterly field visits" },
    { id: "hco-sb3", threshold: "< 40",    priority: "Low Affinity",    color: "blue",  action: "Low effort engagement / No active engagement" },
  ],
});

// ══════════════════════════════════════════════════════════════════
// ENGAGEMENT SCORE DATA
// ══════════════════════════════════════════════════════════════════


const TIER_META = {
  reach:       { label: "Reach",       weightRange: "0.1–0.5", bg: "bg-[#f3f4f6]",  text: "text-[#374151]", border: "border-[#d1d5dc]" },
  interaction: { label: "Interaction", weightRange: "0.5–2.0", bg: "bg-[#dbeafe]",  text: "text-[#1d4ed8]", border: "border-[#bfdbfe]" },
  engagement:  { label: "Engagement",  weightRange: "1.5–5.0", bg: "bg-[#ede9fe]",  text: "text-[#6d28d9]", border: "border-[#ddd6fe]" },
  advocacy:    { label: "Advocacy",    weightRange: "4.0–8.0", bg: "bg-[#dcfce7]",  text: "text-[#15803d]",  border: "border-[#bbf7d0]" },
};

const DEFAULT_EVENTS = [
  { id: "ev1",  name: "Email received",                         tier: "reach",       weight: 0.1, sources: [{ id: "ev1-s1",  connector: "Marketing Cloud", path: ["Email Activities", "Sent"]              }, { id: "ev1-s2",  connector: "Veeva CLM",        path: ["Presentations",    "Key Message"]        }] },
  { id: "ev2",  name: "Ad impression",                          tier: "reach",       weight: 0.1, sources: [{ id: "ev2-s1",  connector: "LinkedIn",        path: ["Profile"]                                }, { id: "ev2-s2",  connector: "Salesforce",       path: ["Activities",       "Task"]               }] },
  { id: "ev3",  name: "Call attempted",                         tier: "reach",       weight: 0.2, sources: [{ id: "ev3-s1",  connector: "Salesforce",      path: ["Activities",       "Task"]               }, { id: "ev3-s2",  connector: "Veeva CRM",        path: ["Activities",       "Call Report"]        }] },
  { id: "ev4",  name: "Email opened",                           tier: "interaction", weight: 0.5, sources: [{ id: "ev4-s1",  connector: "Marketing Cloud", path: ["Email Activities",  "Opened"]             }] },
  { id: "ev5",  name: "Webinar registered",                     tier: "interaction", weight: 0.5, sources: [{ id: "ev5-s1",  connector: "Webinar Platform",path: ["Webinars",          "Registration"]       }, { id: "ev5-s2",  connector: "CRM",              path: ["Contacts"]                                }] },
  { id: "ev6",  name: "Social media engaged",                   tier: "interaction", weight: 0.5, sources: [{ id: "ev6-s1",  connector: "LinkedIn",        path: ["Profile",          "Connections Count"]   }] },
  { id: "ev7",  name: "Leave-behind accepted (e.g., brochure)", tier: "interaction", weight: 1.0, sources: [{ id: "ev7-s1",  connector: "Salesforce",      path: ["Activities",       "Task"]               }, { id: "ev7-s2",  connector: "Veeva CRM",        path: ["Activities",       "Call Report"]        }] },
  { id: "ev8",  name: "Product-page visited",                   tier: "interaction", weight: 1.0, sources: [{ id: "ev8-s1",  connector: "Website",         path: ["Analytics",        "Page Views"]         }] },
  { id: "ev9",  name: "Email clicked",                          tier: "interaction", weight: 1.0, sources: [{ id: "ev9-s1",  connector: "Marketing Cloud", path: ["Email Activities",  "Clicked"]            }] },
  { id: "ev10", name: "Ad clicked",                             tier: "interaction", weight: 1.0, sources: [{ id: "ev10-s1", connector: "LinkedIn",        path: ["Profile"]                                }, { id: "ev10-s2", connector: "Salesforce",       path: ["Activities",       "Task"]               }] },
  { id: "ev11", name: "Call connected",                         tier: "interaction", weight: 2.0, sources: [{ id: "ev11-s1", connector: "Salesforce",      path: ["Activities",       "Task"]               }, { id: "ev11-s2", connector: "Veeva CRM",        path: ["Activities",       "Call Report"]        }] },
  { id: "ev12", name: "Content downloaded",                     tier: "engagement",  weight: 2.0, sources: [{ id: "ev12-s1", connector: "Website",         path: ["Analytics",        "Downloads"]          }, { id: "ev12-s2", connector: "Veeva CLM",        path: ["Presentations",    "Slide Views"]        }] },
  { id: "ev13", name: "Remote detailing session",               tier: "engagement",  weight: 2.5, sources: [{ id: "ev13-s1", connector: "Veeva CRM",       path: ["Activities",       "Remote Meeting"]     }] },
  { id: "ev14", name: "Webinar attended",                       tier: "engagement",  weight: 2.5, sources: [{ id: "ev14-s1", connector: "Webinar Platform",path: ["Webinars",          "Attendance"]         }, { id: "ev14-s2", connector: "CRM",              path: ["Contacts"]                                }] },
  { id: "ev15", name: "CLM digital detailing",                  tier: "engagement",  weight: 3.0, sources: [{ id: "ev15-s1", connector: "Veeva CRM",       path: ["Activities",       "Visit Report"]       }, { id: "ev15-s2", connector: "Veeva CLM",        path: ["Presentations",    "Slide Views"]        }] },
  { id: "ev16", name: "Booth visited at event",                 tier: "engagement",  weight: 3.0, sources: [{ id: "ev16-s1", connector: "Events CRM",      path: ["Events",           "Badge Scan"]         }] },
  { id: "ev17", name: "MSL / KAM Detailing visit (standard)",   tier: "engagement",  weight: 3.0, sources: [{ id: "ev17-s1", connector: "Veeva CRM",       path: ["Activities",       "Visit Report"]       }, { id: "ev17-s2", connector: "Salesforce",       path: ["Activities",       "Event"]              }] },
  { id: "ev18", name: "Sample requested",                       tier: "engagement",  weight: 3.5, sources: [{ id: "ev18-s1", connector: "Veeva CRM",       path: ["Activities",       "Sample Request"]     }, { id: "ev18-s2", connector: "Salesforce",       path: ["Activities",       "Task"]               }] },
  { id: "ev19", name: "Congress attended",                      tier: "engagement",  weight: 4.0, sources: [{ id: "ev19-s1", connector: "Events CRM",      path: ["Events",           "Attendance"]         }] },
  { id: "ev20", name: "Training / CME completed",               tier: "engagement",  weight: 4.0, sources: [{ id: "ev20-s1", connector: "LMS",             path: ["Training Records", "Completion Status"]  }, { id: "ev20-s2", connector: "CRM",              path: ["Contacts"]                                }, { id: "ev20-s3", connector: "Salesforce", path: ["Activities", "Event"] }] },
  { id: "ev21", name: "Meeting completed (planned)",            tier: "engagement",  weight: 4.0, sources: [{ id: "ev21-s1", connector: "Veeva CRM",       path: ["Activities",       "Visit Report"]       }, { id: "ev21-s2", connector: "Salesforce",       path: ["Activities",       "Event"]              }] },
  { id: "ev22", name: "MSL / KAM Detailing visit (in-depth)",   tier: "engagement",  weight: 4.5, sources: [{ id: "ev22-s1", connector: "Veeva CRM",       path: ["Activities",       "Visit Report"]       }, { id: "ev22-s2", connector: "Salesforce",       path: ["Activities",       "Event"]              }] },
  { id: "ev23", name: "Demo attended",                          tier: "engagement",  weight: 5.0, sources: [{ id: "ev23-s1", connector: "CRM",             path: ["Contacts"]                               }, { id: "ev23-s2", connector: "Veeva CRM",        path: ["Activities",       "Visit Report"]       }] },
  { id: "ev24", name: "Speaker engagement",                     tier: "advocacy",    weight: 5.0, sources: [{ id: "ev24-s1", connector: "CRM",             path: ["Contacts"]                               }, { id: "ev24-s2", connector: "Veeva CRM",        path: ["Activities",       "Call Report"]        }] },
  { id: "ev25", name: "Clinical study requested",               tier: "advocacy",    weight: 5.0, sources: [{ id: "ev25-s1", connector: "CRM",             path: ["Contacts"]                               }, { id: "ev25-s2", connector: "External DB",      path: ["Research Database","Clinical Trial Status"]}] },
  { id: "ev26", name: "Peer referral given",                    tier: "advocacy",    weight: 6.0, sources: [{ id: "ev26-s1", connector: "CRM",             path: ["Contacts"]                               }] },
  { id: "ev27", name: "Sample distributed to patient",          tier: "advocacy",    weight: 7.0, sources: [{ id: "ev27-s1", connector: "Events CRM",      path: ["Events",           "Attendance"]         }] },
  { id: "ev28", name: "Advisory board participation",           tier: "advocacy",    weight: 7.0, sources: [{ id: "ev28-s1", connector: "Events CRM",      path: ["Events",           "Attendance"]         }] },
  { id: "ev29", name: "Product prescribed",                     tier: "advocacy",    weight: 8.0, sources: [{ id: "ev29-s1", connector: "CRM",             path: ["Contacts"]                               }, { id: "ev29-s2", connector: "ERP",             path: ["Orders",           "SKU"]                }, { id: "ev29-s3", connector: "External DB", path: ["Research Database"] }] },
];

const DEFAULT_BREADTH = [
  { id: "br1", channels: "1 channel",   score: 20 },
  { id: "br2", channels: "2 channels",  score: 45 },
  { id: "br3", channels: "3 channels",  score: 70 },
  { id: "br4", channels: "4+ channels", score: 100 },
];

const TRAJECTORY_LEVELS = [
  { id: "t1", symbol: "↑↑", label: "Strongly Accelerating", bgClass: "bg-[#15803d]", textClass: "text-white",     definition: "Current Period score > +50% higher than prior period" },
  { id: "t2", symbol: "↑",  label: "Accelerating",          bgClass: "bg-[#86efac]", textClass: "text-[#14532d]", definition: "Current period +10% to +50% higher than prior period" },
  { id: "t3", symbol: "→",  label: "Stable",                bgClass: "bg-[#fde68a]", textClass: "text-[#78350f]", definition: "Within ±10% of prior period" },
  { id: "t4", symbol: "↓",  label: "Declining",             bgClass: "bg-[#fb923c]", textClass: "text-white",     definition: "Current period score -10% to -50% lower than prior period" },
  { id: "t5", symbol: "↓↓", label: "Strongly Declining",    bgClass: "bg-[#dc2626]", textClass: "text-white",     definition: "Current period score < -50% lower than prior period" },
];

const DEFAULT_ENG_BANDS = [
  { id: "eb1", threshold: "≥ 70",  label: "High Engagement",   color: "green", nba: "Follow up within a week · Meet face-to-face · Increase detailing frequency" },
  { id: "eb2", threshold: "40–69", label: "Medium Engagement", color: "amber", nba: "Adjust detailing material and campaigns · Digital nurture" },
  { id: "eb3", threshold: "< 40",  label: "Low Engagement",    color: "red",   nba: "Minimal investment · Re-evaluate ICP fit before committing field resources" },
];

// ══════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ══════════════════════════════════════════════════════════════════

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

function redistributeWeights(kpis, changedId, newWeight) {
  const clamped = Math.max(0, Math.min(100, newWeight));
  const others = kpis.filter((k) => k.id !== changedId);
  if (others.length === 0) return kpis.map((k) => ({ ...k, weight: 100 }));
  const remaining = 100 - clamped;
  const oldOtherTotal = others.reduce((s, k) => s + k.weight, 0);
  let newOthers;
  if (oldOtherTotal === 0) {
    const base = Math.floor(remaining / others.length);
    const extra = remaining - base * others.length;
    newOthers = others.map((k, i) => ({ ...k, weight: base + (i < extra ? 1 : 0) }));
  } else {
    const scaled = others.map((k) => ({ ...k, weight: Math.round((k.weight / oldOtherTotal) * remaining) }));
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

function rowMax(row) {
  return Math.max(0, ...row.subValues.map((sv) => sv.points));
}

// ══════════════════════════════════════════════════════════════════
// SHARED UI PRIMITIVES
// ══════════════════════════════════════════════════════════════════

function Toggle({ checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? "bg-[#155dfc]" : "bg-[#d1d5dc]"}`}>
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3L13 13M3 13L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// SOURCE COMPONENTS
// ══════════════════════════════════════════════════════════════════

function SourcePill({ source, onRemove, onEdit }) {
  // Support both old { connector, file, field } and new { connector, path: [] } formats
  const parts = source.path
    ? [source.connector, ...source.path.filter(Boolean)]
    : [source.connector, source.file, source.field].filter(Boolean);
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-2 py-0.5 text-[11px] text-[#374151]">
      {parts.join(" › ")}
      {onEdit && (
        <button onClick={onEdit} className="ml-0.5 text-[#9ca3af] hover:text-[#155dfc] leading-none" title="Edit source">
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <path d="M6.5 1.5L8.5 3.5L3.5 8.5H1.5V6.5L6.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 text-[#9ca3af] hover:text-[#dc2626] leading-none" title="Remove source">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 1L7 7M1 7L7 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </span>
  );
}

// Normalise old { connector, file, field } to { id, connector, path: [] }
function normaliseSrc(src) {
  return {
    id: src.id,
    connector: src.connector ?? "",
    path: src.path ?? [src.file, src.field].filter(Boolean),
  };
}

function SourceEditor({ sources, onChange }) {
  const connectorNames = getConnectorNames();
  const selectCls = "rounded-lg border border-[#d1d5dc] bg-white px-2 py-1 text-xs focus:border-[#155dfc] focus:outline-none";

  // Work with normalised sources throughout
  const normalised = sources.map(normaliseSrc);

  const updateConnector = (id, connector) => {
    onChange(normalised.map((s) => s.id === id ? { ...s, connector, path: [] } : s));
  };

  const updatePath = (id, levelIdx, value) => {
    onChange(normalised.map((s) => {
      if (s.id !== id) return s;
      return { ...s, path: [...s.path.slice(0, levelIdx), value] };
    }));
  };

  const removeSource = (id) => onChange(normalised.filter((s) => s.id !== id));

  const addSource = () =>
    onChange([...normalised, { id: `s${Date.now()}`, connector: "", path: [] }]);

  return (
    <div className="flex flex-col gap-2">
      {normalised.length === 0 && (
        <span className="text-xs text-[#9ca3af] italic">No sources — add one below.</span>
      )}

      {normalised.map((src) => {
        const cascades = src.connector ? getCascadeDropdowns(src.connector, src.path) : [];
        return (
          <div key={src.id} className="flex flex-wrap items-center gap-1.5">
            {/* Connector selector */}
            <select
              value={src.connector}
              onChange={(e) => updateConnector(src.id, e.target.value)}
              className={selectCls}
            >
              <option value="">— Select source —</option>
              {connectorNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Cascade column/field dropdowns */}
            {cascades.map((dd, idx) => (
              <select
                key={idx}
                value={dd.value}
                onChange={(e) => updatePath(src.id, idx, e.target.value)}
                className={selectCls}
              >
                <option value="">— {dd.label} —</option>
                {dd.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ))}

            {/* Delete bin */}
            <button
              onClick={() => removeSource(src.id)}
              className="ml-auto shrink-0 rounded p-1 text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626] transition-colors"
              title="Remove source"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M5 4V3h4v1M3 4l.7 8h6.6L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        );
      })}

      {/* Add source row */}
      <button
        onClick={addSource}
        className="self-start flex items-center gap-1 text-[11px] text-[#9ca3af] hover:text-[#374151] transition-colors mt-0.5"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        Add source
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// EDIT ROW MODAL
// ══════════════════════════════════════════════════════════════════

function EditRowModal({ row, sectionMaxPoints, allRows, onSave, onClose, fixedSource = false }) {
  const [varName, setVarName] = useState(row.variable);
  const [subValues, setSubValues] = useState(row.subValues.map((sv) => ({ ...sv })));
  const [sources, setSources] = useState(row.sources.map((s) => ({ ...s })));

  const thisMax = Math.max(0, ...subValues.map((sv) => sv.points));
  const otherMaxSum = allRows
    .filter((r) => r.id !== row.id)
    .reduce((sum, r) => sum + rowMax(r), 0);
  const totalMax = thisMax + otherMaxSum;
  const overBudget = totalMax > sectionMaxPoints;

  const updateSV = (svId, field, val) => {
    setSubValues((prev) =>
      prev.map((sv) => sv.id === svId ? { ...sv, [field]: field === "points" ? Math.max(0, parseInt(val) || 0) : val } : sv)
    );
  };

  const addSV = () => {
    setSubValues((prev) => [...prev, { id: `sv${Date.now()}`, label: "", points: 0 }]);
  };

  const removeSV = (svId) => {
    if (subValues.length <= 1) return;
    setSubValues((prev) => prev.filter((sv) => sv.id !== svId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[560px] max-h-[85vh] flex flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4 shrink-0">
          <h3 className="text-base font-semibold text-[#111318]">Edit variable</h3>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Variable name — read-only */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Variable name</label>
            <p className="w-full rounded-lg border border-[#f3f4f6] bg-[#f9fafb] px-3 py-2 text-sm text-[#374151]">{varName}</p>
          </div>

          {/* Score tiers — labels read-only, only points editable */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282]">Score tiers</label>
            </div>
            <div className="flex flex-col gap-2">
              {subValues.map((sv) => (
                <div key={sv.id} className="flex items-center gap-2">
                  {/* Tier label — read-only */}
                  <span className="flex-1 rounded-lg border border-[#f3f4f6] bg-[#f9fafb] px-3 py-1.5 text-sm text-[#374151]">{sv.label}</span>
                  {/* Points — editable */}
                  <input type="number" min={0} value={sv.points}
                    onChange={(e) => updateSV(sv.id, "points", e.target.value)}
                    className="w-16 rounded-lg border border-[#e5e7eb] px-2 py-1.5 text-center text-sm font-semibold focus:border-[#155dfc] focus:outline-none" />
                  <span className="text-xs text-[#9ca3af] shrink-0">pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-3">Sources</label>
            {fixedSource ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap gap-1">
                  {sources.map((s) => <SourcePill key={s.id} source={s} />)}
                </div>
                <p className="text-xs text-[#9ca3af] italic">Source is fixed and cannot be changed.</p>
              </div>
            ) : (
              <SourceEditor sources={sources} onChange={setSources} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4 shrink-0">
          <button onClick={onClose}
            className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(row.id, { variable: varName, subValues, sources })}
            className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] transition-colors">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// REMOVED ROWS MODAL
// ══════════════════════════════════════════════════════════════════

function RemovedModal({ sectionLabel, removedRows, onRestore, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[480px] rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#111318]">Removed variables</h3>
            <p className="text-xs text-[#9ca3af] mt-0.5">{sectionLabel}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
        </div>
        <div className="p-6">
          {removedRows.length === 0 ? (
            <p className="text-sm text-[#9ca3af] text-center py-8">No removed variables in this section.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {removedRows.map((row) => (
                <div key={row.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#e5e7eb] px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111318]">{row.variable}</p>
                    <p className="text-xs text-[#9ca3af] mt-0.5">
                      {row.subValues?.map((sv) => `${sv.label}: ${sv.points} pts`).join(" · ")}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {row.sources?.map((s) => <SourcePill key={s.id} source={s} />)}
                    </div>
                  </div>
                  <button onClick={() => onRestore(row.id)}
                    className="shrink-0 rounded-lg border border-[#155dfc] px-3 py-1.5 text-xs font-medium text-[#155dfc] hover:bg-[#dbeafe] transition-colors">
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SECTION CARD
// ══════════════════════════════════════════════════════════════════

function SectionCard({ section, onToggle, onUpdateRow, onRemoveRow, onRestoreRow, collapsed, onCollapse }) {
  const [removedOpen, setRemovedOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const totalUsed = section.rows.reduce((sum, r) => sum + rowMax(r), 0);
  const isOver = totalUsed > section.maxPoints;

  const handleSaveRow = (rowId, updates) => {
    onUpdateRow(rowId, updates);
    setEditingRow(null);
  };

  return (
    <>
      <div className={`rounded-xl border bg-white transition-opacity ${section.enabled ? "border-[#e5e7eb]" : "border-[#f3f4f6] opacity-60"}`}>
        {/* Section header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3f4f6]">
          <button
            onClick={onCollapse}
            className="flex items-center gap-3 flex-1 text-left"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#155dfc] text-xs font-bold text-white shrink-0">
              {section.id}
            </span>
            <span className="text-sm font-semibold text-[#111318]">{section.label}</span>
            {section.productImpactedAll && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#ddd6fe] bg-[#ede9fe] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6d28d9]">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1 1.5h7M2 4h5M3 6.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Product-impacted
              </span>
            )}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              className={`shrink-0 text-[#9ca3af] transition-transform duration-150 ${collapsed ? "-rotate-90" : ""}`}>
              <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-3 shrink-0">
            {section.removedRows.length > 0 && (
              <button onClick={(e) => { e.stopPropagation(); setRemovedOpen(true); }}
                className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-xs text-[#6a7282] hover:bg-[#f9fafb] transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 3h10M4 3V2h4v1M3 3l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {section.removedRows.length} removed
              </button>
            )}
            <span className={`text-xs font-medium ${section.enabled ? "text-[#16a34a]" : "text-[#9ca3af]"}`}>
              {section.enabled ? "● Enabled" : "● Disabled"}
            </span>
            <Toggle checked={section.enabled} onChange={(e) => { e.stopPropagation?.(); onToggle(); }} />
          </div>
        </div>

        {/* Section body */}
        {!collapsed && section.enabled && (
          /* Standard rows table */
          <div>
            <div className="grid grid-cols-[1.4fr_1.6fr_1.1fr_72px] border-b border-[#f3f4f6] bg-[#fafafa] px-6 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Variable</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Score</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Source</span>
              <span />
            </div>

            {section.rows.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-[#9ca3af]">No variables. Restore removed ones using the button above.</div>
            ) : section.rows.map((row, idx) => (
              <div key={row.id}
                className={`grid grid-cols-[1.4fr_1.6fr_1.1fr_72px] items-start gap-0 px-6 py-4 hover:bg-[#fafafa] transition-colors ${idx < section.rows.length - 1 ? "border-b border-[#f3f4f6]" : ""}`}>
                {/* Variable name */}
                <div className="pr-4 pt-0.5 flex flex-col gap-1.5">
                  <p className="text-sm font-semibold text-[#111318]">{row.variable}</p>
                  {row.productImpacted && !section.productImpactedAll && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[#ddd6fe] bg-[#ede9fe] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6d28d9]">
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1 1.5h7M2 4h5M3 6.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      Product-impacted
                    </span>
                  )}
                  {row.productIndependent && section.productImpactedAll && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[#e5e7eb] bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6a7282]">
                      Product-independent
                    </span>
                  )}
                </div>

                {/* Sub-values */}
                <div className="pr-4 flex flex-col gap-1">
                  {row.subValues.map((sv) => (
                    <div key={sv.id} className="flex items-baseline gap-1.5">
                      <span className={`w-8 text-right text-sm font-bold tabular-nums shrink-0 ${sv.points > 0 ? "text-[#155dfc]" : "text-[#d1d5dc]"}`}>
                        {sv.points}
                      </span>
                      <span className="text-xs text-[#9ca3af] shrink-0">pts</span>
                      <span className="text-sm text-[#374151] leading-snug">{sv.label}</span>
                    </div>
                  ))}
                </div>

                {/* Sources */}
                <div className="pr-2 flex flex-wrap gap-1">
                  {row.sources.map((s) => <SourcePill key={s.id} source={s} />)}
                </div>

                {/* Actions */}
                <div className="flex items-start gap-1 pt-0.5">
                  <button onClick={() => setEditingRow(row)}
                    className="rounded p-1.5 text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors" title="Edit">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button onClick={() => onRemoveRow(row.id)}
                    className="rounded p-1.5 text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626] transition-colors" title="Remove">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M2 4h10M5 4V3h4v1M3 4l.7 8h6.6L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Block-level over-budget banner */}
            {isOver && (
              <div className="flex items-start gap-3 border-t border-[#fecaca] bg-[#fff5f5] px-6 py-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5 text-[#dc2626]">
                  <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                  <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <circle cx="8" cy="11" r="0.6" fill="currentColor"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#dc2626]">
                    Punteggio massimo superato di {totalUsed - section.maxPoints} pt{totalUsed - section.maxPoints > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-[#b91c1c] mt-0.5">
                    La somma dei valori delle variabili ({totalUsed} pts) supera il limite del blocco ({section.maxPoints} pts).
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-[#dc2626]">{totalUsed} / {section.maxPoints} pts</span>
              </div>
            )}

            {/* Footer total */}
            <div className="flex items-center justify-between border-t border-[#f3f4f6] bg-[#fafafa] px-6 py-2.5">
              <span className="text-xs text-[#9ca3af]">Somma dei valori massimi per variabile</span>
              <span className={`text-sm font-bold ${isOver ? "text-[#dc2626]" : totalUsed === section.maxPoints ? "text-[#16a34a]" : "text-[#f59e0b]"}`}>
                {totalUsed} / {section.maxPoints} pts
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {removedOpen && (
        <RemovedModal
          sectionLabel={section.label}
          removedRows={section.removedRows}
          onRestore={(id) => { onRestoreRow(id); if (section.removedRows.length === 1) setRemovedOpen(false); }}
          onClose={() => setRemovedOpen(false)}
        />
      )}
      {editingRow && (
        <EditRowModal
          row={editingRow}
          sectionMaxPoints={section.maxPoints}
          allRows={section.rows}
          fixedSource={!!section.fixedSource}
          onSave={handleSaveRow}
          onClose={() => setEditingRow(null)}
        />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCORE BANDS
// ══════════════════════════════════════════════════════════════════

const BAND_COLORS = {
  green: { bg: "bg-[#dcfce7]", text: "text-[#16a34a]", border: "border-[#bbf7d0]" },
  amber: { bg: "bg-[#fef3c7]", text: "text-[#d97706]", border: "border-[#fde68a]" },
  blue:  { bg: "bg-[#dbeafe]", text: "text-[#2563eb]", border: "border-[#bfdbfe]" },
};

const ENG_BAND_COLORS = {
  green: { bg: "bg-[#dcfce7]", text: "text-[#16a34a]", border: "border-[#bbf7d0]" },
  amber: { bg: "bg-[#fef3c7]", text: "text-[#d97706]", border: "border-[#fde68a]" },
  red:   { bg: "bg-[#fee2e2]", text: "text-[#dc2626]", border: "border-[#fecaca]" },
};

const PREDEFINED_ACTIONS = [
  "Priority target: field engagement (high freq. of visits) + event invitation",
  "Selective field engagement + digital follow-up",
  "Digital + selective field contact (lower freq. of visits)",
  "Digital nurture only",
  "Key Account Management (KAM) engagement",
  "Medical Science Liaison (MSL) engagement",
  "Peer-to-peer event invitation",
  "Congress attendance + follow-up",
  "Speaker bureau invitation",
  "Sample / trial program",
  "Awareness campaign (email + web)",
  "Full omnichannel engagement + Dedicated Account Manager + Monthly visits",
  "Digital outreach + Quarterly field visits",
  "Low effort engagement / No active engagement",
  "No action",
];

function EditActionModal({ band, onSave, onClose }) {
  const colors = BAND_COLORS[band.color] || BAND_COLORS.blue;
  const [selected, setSelected] = useState(band.action);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[520px] rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#111318]">Edit action</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-bold ${colors.text}`}>{band.threshold}</span>
              <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                {band.priority}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282]">Select action</label>
          <div className="flex flex-col gap-2">
            {PREDEFINED_ACTIONS.map((action) => (
              <label
                key={action}
                className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors ${
                  selected === action
                    ? "border-[#155dfc] bg-[#eff6ff]"
                    : "border-[#e5e7eb] hover:border-[#d1d5dc]"
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value={action}
                  checked={selected === action}
                  onChange={() => setSelected(action)}
                  className="mt-0.5 accent-[#155dfc] shrink-0"
                />
                <span className="text-sm text-[#374151] leading-snug">{action}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4">
          <button onClick={onClose}
            className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(band.id, selected)}
            className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] transition-colors">
            Save action
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreBandsSection({ bands, onChange, title = "A+B+C+D — Score Bands & Actions", showActions = true, inlineActions = false }) {
  const [editingBand, setEditingBand] = useState(null);

  const handleSave = (bandId, action) => {
    onChange(bandId, action);
    setEditingBand(null);
  };

  // Determine grid layout
  const gridCols = !showActions
    ? "grid-cols-[100px_1fr]"
    : inlineActions
      ? "grid-cols-[100px_180px_1fr]"
      : "grid-cols-[100px_180px_1fr_44px]";

  return (
    <>
      <div className="rounded-xl border border-[#e5e7eb] bg-white">
        <div className="border-b border-[#f3f4f6] px-6 py-4">
          <h3 className="text-sm font-semibold text-[#111318]">{title}</h3>
          {showActions && !inlineActions && (
            <p className="text-xs text-[#9ca3af] mt-0.5">Score thresholds are fixed. Assign a predefined action to each classification.</p>
          )}
        </div>
        <div className={`grid ${gridCols} border-b border-[#f3f4f6] bg-[#fafafa] px-6 py-2`}>
          <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Score</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Classification</span>
          {showActions && <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Action</span>}
          {showActions && !inlineActions && <span />}
        </div>
        {bands.map((band, idx) => {
          const colors = BAND_COLORS[band.color] || BAND_COLORS.blue;
          return (
            <div key={band.id}
              className={`grid ${gridCols} items-center px-6 py-4 hover:bg-[#fafafa] transition-colors ${idx < bands.length - 1 ? "border-b border-[#f3f4f6]" : ""}`}>
              <span className={`text-sm font-bold ${colors.text}`}>{band.threshold}</span>
              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                  {band.priority}
                </span>
              </div>
              {showActions && inlineActions && (
                <input
                  type="text"
                  value={band.action}
                  onChange={(e) => onChange(band.id, e.target.value)}
                  className="w-full rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-sm text-[#374151] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  placeholder="Describe the action…"
                />
              )}
              {showActions && !inlineActions && (
                <p className="pr-3 text-sm text-[#374151] leading-snug">{band.action}</p>
              )}
              {showActions && !inlineActions && (
                <button
                  onClick={() => setEditingBand(band)}
                  className="rounded p-1.5 text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors"
                  title="Edit action"
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showActions && !inlineActions && editingBand && (
        <EditActionModal
          band={editingBand}
          onSave={handleSave}
          onClose={() => setEditingBand(null)}
        />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// NEW ICP WIZARD
// ══════════════════════════════════════════════════════════════════

function NewICPWizard({ onComplete, onClose }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("default");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[480px] rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#111318]">New ICP Score</h3>
            <div className="flex items-center gap-1.5 mt-1">
              {[1, 2].map((s) => (
                <div key={s} className={`h-1 w-8 rounded-full transition-colors ${s <= step ? "bg-[#155dfc]" : "bg-[#e5e7eb]"}`} />
              ))}
              <span className="text-xs text-[#9ca3af] ml-1">Step {step} of 2</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 1 ? (
            <div className="flex flex-col gap-3">
              <label className="block text-sm font-medium text-[#374151]">Product family name</label>
              <input autoFocus type="text" value={name} placeholder="e.g. Neurology, Oncology, Orthopedics…"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) setStep(2); }}
                className="w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-sm focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
              <p className="text-xs text-[#9ca3af]">This name will identify the ICP score for this product family.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-[#374151]">Start from:</p>
              {[
                { value: "default", title: "Default template", desc: "Copy the structure from the default ICP score — same sections, variables, sources, and score bands. Edit from there." },
                { value: "blank", title: "Blank", desc: "Start with empty sections A, B, C, D. You'll add all variables manually." },
              ].map((opt) => (
                <label key={opt.value}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-colors ${template === opt.value ? "border-[#155dfc] bg-[#eff6ff]" : "border-[#e5e7eb] hover:border-[#d1d5dc]"}`}>
                  <input type="radio" name="template" value={opt.value} checked={template === opt.value}
                    onChange={() => setTemplate(opt.value)} className="mt-0.5 accent-[#155dfc]" />
                  <div>
                    <p className="text-sm font-semibold text-[#111318]">{opt.title}</p>
                    <p className="text-xs text-[#6a7282] mt-0.5 leading-snug">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#e5e7eb] px-6 py-4">
          {step === 2
            ? <button onClick={() => setStep(1)} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">Back</button>
            : <div />
          }
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">Cancel</button>
            {step === 1 ? (
              <button onClick={() => setStep(2)} disabled={!name.trim()}
                className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] disabled:opacity-40 disabled:cursor-not-allowed">
                Next
              </button>
            ) : (
              <button onClick={() => onComplete({ name: name.trim(), template })}
                className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8]">
                Create ICP Score
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HCP ICP SCORE TAB
// ══════════════════════════════════════════════════════════════════

function HCPICPScoreTab() {
  const [profile, setProfile] = useState(() => makeDefaultHCPProfiles()[0]);
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try {
      const saved = localStorage.getItem("hcp-icp-collapsed");
      if (saved) return JSON.parse(saved);
      return Object.fromEntries(makeDefaultHCPProfiles()[0].sections.map((s) => [s.id, true]));
    } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem("hcp-icp-collapsed", JSON.stringify(collapsedSections)); } catch {}
  }, [collapsedSections]);

  const updateProfile = (updater) => setProfile((prev) => updater(prev));

  const toggleSection = (sectionId) =>
    updateProfile((p) => ({
      ...p,
      sections: p.sections.map((s) => s.id === sectionId ? { ...s, enabled: !s.enabled } : s),
    }));

  const toggleCollapse = (sectionId) =>
    setCollapsedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));

  const allCollapsed = profile?.sections.every((s) => collapsedSections[s.id]);
  const toggleAll = () => {
    if (allCollapsed) setCollapsedSections({});
    else setCollapsedSections(Object.fromEntries((profile?.sections ?? []).map((s) => [s.id, true])));
  };

  const updateRow = (sectionId, rowId, updates) =>
    updateProfile((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id !== sectionId ? s : { ...s, rows: s.rows.map((r) => r.id === rowId ? { ...r, ...updates } : r) }
      ),
    }));

  const removeRow = (sectionId, rowId) =>
    updateProfile((p) => ({
      ...p,
      sections: p.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const row = s.rows.find((r) => r.id === rowId);
        return { ...s, rows: s.rows.filter((r) => r.id !== rowId), removedRows: [...s.removedRows, row] };
      }),
    }));

  const restoreRow = (sectionId, rowId) =>
    updateProfile((p) => ({
      ...p,
      sections: p.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const row = s.removedRows.find((r) => r.id === rowId);
        return { ...s, rows: [...s.rows, row], removedRows: s.removedRows.filter((r) => r.id !== rowId) };
      }),
    }));

  const updateBandAction = (bandId, action) =>
    updateProfile((p) => ({
      ...p,
      scoreBands: p.scoreBands.map((b) => b.id === bandId ? { ...b, action } : b),
    }));

  return (
    <div className="flex flex-col gap-6">
      {/* Section cards header with toggle all */}
      <div className="flex items-center justify-end">
        <button
          onClick={toggleAll}
          className="text-xs font-medium text-[#155dfc] hover:underline"
        >
          {allCollapsed ? "Open all" : "Close all"}
        </button>
      </div>
      {profile?.sections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          collapsed={!!collapsedSections[section.id]}
          onCollapse={() => toggleCollapse(section.id)}
          onToggle={() => toggleSection(section.id)}
          onUpdateRow={(rowId, updates) => updateRow(section.id, rowId, updates)}
          onRemoveRow={(rowId) => removeRow(section.id, rowId)}
          onRestoreRow={(rowId) => restoreRow(section.id, rowId)}
        />
      ))}

      {/* Score bands */}
      {profile && (
        <ScoreBandsSection bands={profile.scoreBands} onChange={updateBandAction} inlineActions />
      )}

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HCO ICP SCORE TAB
// ══════════════════════════════════════════════════════════════════

function HCOICPScoreTab() {
  const [profile, setProfile] = useState(() => makeDefaultHCOProfile());
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try {
      const saved = localStorage.getItem("hco-icp-collapsed");
      if (saved) return JSON.parse(saved);
      return Object.fromEntries(makeDefaultHCOProfile().sections.map((s) => [s.id, true]));
    } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem("hco-icp-collapsed", JSON.stringify(collapsedSections)); } catch {}
  }, [collapsedSections]);

  const updateProfile = (updater) => setProfile((prev) => updater(prev));

  const toggleSection = (sectionId) =>
    updateProfile((p) => ({
      ...p,
      sections: p.sections.map((s) => s.id === sectionId ? { ...s, enabled: !s.enabled } : s),
    }));

  const toggleCollapse = (sectionId) =>
    setCollapsedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));

  const allCollapsed = profile?.sections.every((s) => collapsedSections[s.id]);
  const toggleAll = () => {
    if (allCollapsed) setCollapsedSections({});
    else setCollapsedSections(Object.fromEntries((profile?.sections ?? []).map((s) => [s.id, true])));
  };

  const updateRow = (sectionId, rowId, updates) =>
    updateProfile((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id !== sectionId ? s : { ...s, rows: s.rows.map((r) => r.id === rowId ? { ...r, ...updates } : r) }
      ),
    }));

  const removeRow = (sectionId, rowId) =>
    updateProfile((p) => ({
      ...p,
      sections: p.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const row = s.rows.find((r) => r.id === rowId);
        return { ...s, rows: s.rows.filter((r) => r.id !== rowId), removedRows: [...s.removedRows, row] };
      }),
    }));

  const restoreRow = (sectionId, rowId) =>
    updateProfile((p) => ({
      ...p,
      sections: p.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const row = s.removedRows.find((r) => r.id === rowId);
        return { ...s, rows: [...s.rows, row], removedRows: s.removedRows.filter((r) => r.id !== rowId) };
      }),
    }));

  const updateBandAction = (bandId, action) =>
    updateProfile((p) => ({
      ...p,
      scoreBands: p.scoreBands.map((b) => b.id === bandId ? { ...b, action } : b),
    }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <button onClick={toggleAll} className="text-xs font-medium text-[#155dfc] hover:underline">
          {allCollapsed ? "Open all" : "Close all"}
        </button>
      </div>
      {profile?.sections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          collapsed={!!collapsedSections[section.id]}
          onCollapse={() => toggleCollapse(section.id)}
          onToggle={() => toggleSection(section.id)}
          onUpdateRow={(rowId, updates) => updateRow(section.id, rowId, updates)}
          onRemoveRow={(rowId) => removeRow(section.id, rowId)}
          onRestoreRow={(rowId) => restoreRow(section.id, rowId)}
        />
      ))}
      {profile && (
        <ScoreBandsSection
          bands={profile.scoreBands}
          onChange={updateBandAction}
          title="A+B - Score bands"
          inlineActions={true}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HCO ENGAGEMENT SCORE TAB
// ══════════════════════════════════════════════════════════════════

function HCOEngagementScoreTab() {
  const [tiers, setTiers] = useState([
    { key: "reach",       label: "Reach",       def: "Content delivered. No action required.",    wMin: "0.1", wMax: "0.5", examples: "Email sent, banner impression, event invitation, ad impression, call attempted",   bg: "bg-[#f3f4f6]", text: "text-[#374151]", sources: [{ id: "hco-eng-r1", connector: "Marketing Cloud", path: ["Email Activities", "Sent"] }, { id: "hco-eng-r2", connector: "LinkedIn", path: ["Profile"] }] },
    { key: "interaction", label: "Interaction",  def: "Minimal voluntary action by someone.",      wMin: "0.5", wMax: "1.5", examples: "Email open, product page visited, social like, event registration",                bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]", sources: [{ id: "hco-eng-i1", connector: "Marketing Cloud", path: ["Email Activities", "Opened"] }, { id: "hco-eng-i2", connector: "Website",         path: ["Analytics",        "Page Views"] }] },
  ]);

  const [editingTier, setEditingTier] = useState(null);

  const saveTier = (key, updates) => {
    setTiers((prev) => prev.map((t) => t.key === key ? { ...t, ...updates } : t));
    setEditingTier(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[16px] border border-[#e5e7eb] bg-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e7eb]">
          <h3 className="text-sm font-semibold text-[#111318]">A Base score</h3>
        </div>
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_110px_120px_1fr_1fr_36px] items-center gap-x-4 border-b border-[#f3f4f6] bg-[#fafafa] px-6 py-2">
          {["Event", "Type", "Score", "Examples", "Sources", ""].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">{h}</span>
          ))}
        </div>
        {/* Rows */}
        {tiers.map((t, i) => (
          <div key={t.key} className={`grid grid-cols-[1fr_110px_120px_1fr_1fr_36px] items-center gap-x-4 px-6 py-3.5 ${i < tiers.length - 1 ? "border-b border-[#f3f4f6]" : ""}`}>
            <span className="text-xs text-[#374151] leading-4">{t.def}</span>
            <span className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.bg} ${t.text}`}>{t.label}</span>
            <span className="font-mono text-xs font-semibold text-[#155dfc]">{t.wMin} – {t.wMax}</span>
            <span className="text-xs text-[#6a7282] leading-4">{t.examples}</span>
            <div className="flex flex-wrap gap-1">
              {t.sources.map((s) => <SourcePill key={s.id} source={s} />)}
            </div>
            <button
              onClick={() => setEditingTier(t)}
              className="rounded p-1.5 text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors"
              title="Edit"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Trajectory (Trend Indicator) — HCO signal score uses only ↑ → ↓ */}
      <div className="rounded-[16px] border border-[#e5e7eb] bg-white overflow-hidden">
        <div className="border-b border-[#f3f4f6] px-6 py-4">
          <span className="text-sm font-semibold text-[#111318]">Trajectory (Trend Indicator)</span>
        </div>
        <div className="grid grid-cols-[56px_170px_1fr] border-b border-[#f3f4f6] bg-[#fafafa] px-6 py-2">
          {["", "Definition", "Momentum"].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">{h}</span>
          ))}
        </div>
        {TRAJECTORY_LEVELS.filter((t) => ["↑", "→", "↓"].includes(t.symbol)).map((t, idx, arr) => (
          <div key={t.id}
            className={`grid grid-cols-[56px_170px_1fr] items-center px-6 py-3 hover:bg-[#fafafa] transition-colors ${idx < arr.length - 1 ? "border-b border-[#f3f4f6]" : ""}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${t.bgClass} ${t.textClass}`}>
              {t.symbol}
            </div>
            <span className="text-sm font-semibold text-[#111318]">{t.label}</span>
            <span className="text-xs text-[#6a7282] leading-snug">{t.definition}</span>
          </div>
        ))}
      </div>

      {/* Edit tier modal */}
      {editingTier && (
        <HCOTierEditModal
          tier={editingTier}
          onSave={saveTier}
          onClose={() => setEditingTier(null)}
        />
      )}
    </div>
  );
}

function HCOTierEditModal({ tier, onSave, onClose }) {
  const [wMin, setWMin] = useState(tier.wMin);
  const [wMax, setWMax] = useState(tier.wMax);
  const [sources, setSources] = useState(tier.sources.map((s) => ({ ...s })));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[520px] max-h-[85vh] flex flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4 shrink-0">
          <h3 className="text-base font-semibold text-[#111318]">Edit tier</h3>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Type — read-only */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Type</label>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tier.bg} ${tier.text}`}>{tier.label}</span>
          </div>

          {/* Event — read-only */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Event</label>
            <p className="w-full rounded-lg border border-[#f3f4f6] bg-[#f9fafb] px-3 py-2 text-sm text-[#374151]">{tier.def}</p>
          </div>

          {/* Score range */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Score range</label>
            <div className="flex items-center gap-2">
              <input type="text" value={wMin} onChange={(e) => setWMin(e.target.value)}
                className="w-20 rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-mono text-center focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
              <span className="text-sm text-[#9ca3af]">–</span>
              <input type="text" value={wMax} onChange={(e) => setWMax(e.target.value)}
                className="w-20 rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-mono text-center focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
            </div>
          </div>

          {/* Sources */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-3">Sources</label>
            <SourceEditor sources={sources} onChange={setSources} />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4 shrink-0">
          <button onClick={onClose}
            className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(tier.key, { wMin, wMax, sources })}
            className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] transition-colors">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// EDIT BREADTH MODAL
// ══════════════════════════════════════════════════════════════════

function EditBreadthModal({ entry, onSave, onClose }) {
  const [score, setScore] = useState(entry.score);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[400px] flex flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4 shrink-0">
          <h3 className="text-base font-semibold text-[#111318]">Edit breadth score</h3>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
        </div>
        <div className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Channels</label>
            <p className="w-full rounded-lg border border-[#f3f4f6] bg-[#f9fafb] px-3 py-2 text-sm text-[#374151]">{entry.channels}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Breadth Score</label>
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="100" value={score}
                onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                className="w-24 rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-semibold text-center focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
              <span className="text-xs text-[#9ca3af]">pts</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4 shrink-0">
          <button onClick={onClose}
            className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(entry.id, score)}
            className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] transition-colors">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// EDIT EVENT MODAL
// ══════════════════════════════════════════════════════════════════

function EditEventModal({ event, onSave, onClose }) {
  const [weight, setWeight] = useState(event.weight);
  const [cap, setCap]       = useState(event.cap ?? "");
  const [sources, setSources] = useState((event.sources || []).map((s) => ({ ...s })));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[520px] max-h-[85vh] flex flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4 shrink-0">
          <h3 className="text-base font-semibold text-[#111318]">Edit event</h3>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Event name — read-only */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Event name</label>
            <p className="w-full rounded-lg border border-[#f3f4f6] bg-[#f9fafb] px-3 py-2 text-sm text-[#374151]">{event.name}</p>
          </div>

          {/* Score + Cap side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Score</label>
              <div className="flex items-center gap-2">
                <input type="number" step="0.1" min="0" value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-24 rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-semibold text-center focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
                <span className="text-xs text-[#9ca3af]">pts</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">
                Cap
                <span className="ml-1 font-normal text-[#9ca3af] normal-case tracking-normal">— optional</span>
              </label>
              <div className="flex items-center gap-2">
                <input type="number" min="1" step="1" value={cap}
                  onChange={(e) => setCap(e.target.value)}
                  placeholder="No limit"
                  className="w-24 rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-semibold text-center placeholder:font-normal placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
                <span className="text-xs text-[#9ca3af]">max</span>
              </div>
            </div>
          </div>

          {/* Sources */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-3">Sources</label>
            <SourceEditor sources={sources} onChange={setSources} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4 shrink-0">
          <button onClick={onClose}
            className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(event.id, { weight, cap: cap === "" ? "" : Number(cap), sources })}
            className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] transition-colors">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// REMOVED EVENTS MODAL
// ══════════════════════════════════════════════════════════════════

function RemovedEventsModal({ tierLabel, removedEvents, onRestore, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[480px] rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#111318]">Removed events</h3>
            <p className="text-xs text-[#9ca3af] mt-0.5">{tierLabel}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
        </div>
        <div className="p-6">
          {removedEvents.length === 0 ? (
            <p className="text-sm text-[#9ca3af] text-center py-8">No removed events in this tier.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {removedEvents.map((ev) => (
                <div key={ev.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#e5e7eb] px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111318]">{ev.name}</p>
                    <p className="text-xs text-[#9ca3af] mt-0.5">Score: {ev.weight}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(ev.sources || []).map((s) => <SourcePill key={s.id} source={s} />)}
                    </div>
                  </div>
                  <button onClick={() => onRestore(ev.id)}
                    className="shrink-0 rounded-lg border border-[#155dfc] px-3 py-1.5 text-xs font-medium text-[#155dfc] hover:bg-[#dbeafe] transition-colors">
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ENGAGEMENT SCORE TAB
// ══════════════════════════════════════════════════════════════════

function AddEventModal({ tier, onSave, onClose }) {
  const [name, setName]       = useState("");
  const [weight, setWeight]   = useState(1.0);
  const [cap, setCap]         = useState("");
  const [sources, setSources] = useState([]);
  const meta = TIER_META[tier];
  const canSave = name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[520px] max-h-[85vh] flex flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4 shrink-0">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-[#111318]">Add event</h3>
            <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}>
              {meta.label}
            </span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Event name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Webinar attended"
              autoFocus
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm text-[#111318] placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Score</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" step="0.1" min="0" value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-24 rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-semibold text-center focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                />
                <span className="text-xs text-[#9ca3af]">pts</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">
                Cap
                <span className="ml-1 font-normal text-[#9ca3af] normal-case tracking-normal">— optional</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="1" step="1" value={cap}
                  onChange={(e) => setCap(e.target.value)}
                  placeholder="No limit"
                  className="w-24 rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-semibold text-center placeholder:font-normal placeholder:text-[#9ca3af] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                />
                <span className="text-xs text-[#9ca3af]">max</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-3">Sources</label>
            <SourceEditor sources={sources} onChange={setSources} />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4 shrink-0">
          <button onClick={onClose}
            className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors">
            Cancel
          </button>
          <button
            onClick={() => canSave && onSave(tier, { name: name.trim(), weight, cap: cap === "" ? "" : Number(cap), sources })}
            disabled={!canSave}
            className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Add event
          </button>
        </div>
      </div>
    </div>
  );
}

function EngagementScoreTab() {
  const [events, setEvents] = useState(() => DEFAULT_EVENTS.map((e) => ({ ...e })));
  const [removedEvents, setRemovedEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [addingEventTier, setAddingEventTier] = useState(null);
  const [removedModalTier, setRemovedModalTier] = useState(null);
  const [editingBreadth, setEditingBreadth] = useState(null);
  const [breadth, setBreadth] = useState(() => DEFAULT_BREADTH.map((b) => ({ ...b })));
  const [engBands, setEngBands] = useState(() => DEFAULT_ENG_BANDS.map((b) => ({ ...b })));
  const [collapsedTiers, setCollapsedTiers] = useState(() => {
    try {
      const saved = localStorage.getItem("eng-score-collapsed");
      if (saved) return JSON.parse(saved);
      return Object.fromEntries(Object.keys(TIER_META).map((t) => [t, true]));
    } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem("eng-score-collapsed", JSON.stringify(collapsedTiers)); } catch {}
  }, [collapsedTiers]);

  const removeEvent = (id) => {
    const ev = events.find((e) => e.id === id);
    if (ev) {
      setRemovedEvents((prev) => [...prev, ev]);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const restoreEvent = (id) => {
    const ev = removedEvents.find((e) => e.id === id);
    if (ev) {
      setEvents((prev) => {
        const inserted = [...prev, ev];
        const order = DEFAULT_EVENTS.map((d) => d.id);
        return inserted.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      });
      setRemovedEvents((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const saveEventEdit = (id, updates) => {
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e));
    setEditingEvent(null);
  };

  const addEvent = (tier, { name, weight, cap, sources }) => {
    setEvents((prev) => [...prev, {
      id: `ev-custom-${Date.now()}`,
      name,
      tier,
      weight,
      cap: cap ?? "",
      sources,
    }]);
    setAddingEventTier(null);
  };

  const toggleTier = (tier) =>
    setCollapsedTiers((prev) => ({ ...prev, [tier]: !prev[tier] }));

  const updateBreadthScore = (id, score) =>
    setBreadth((prev) => prev.map((b) => b.id === id ? { ...b, score } : b));

  const updateBandNBA = (id, nba) =>
    setEngBands((prev) => prev.map((b) => b.id === id ? { ...b, nba } : b));

  const tiers = ["reach", "interaction", "engagement", "advocacy"];

  return (
    <div className="flex flex-col gap-6">

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { id: "A", title: "Depth", weight: "70% of base", desc: "How significant are the interactions? Each event carries a score based on its tier." },
          { id: "B", title: "Breadth", weight: "30% of base", desc: "How many distinct channels is the HCP engaging through?" },
          { id: null, title: "Trajectory", weight: "↑↑ / ↑ / → / ↓ / ↓↓", desc: "Is engagement increasing, stable, or declining? Compares current period to prior period." },
        ].map((card) => (
          <div key={card.title} className="rounded-xl border border-[#e5e7eb] bg-white p-5">
            <div className="flex items-center gap-2 mb-2">
              {card.id && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#155dfc] text-[10px] font-bold text-white shrink-0">{card.id}</span>
              )}
              <span className="text-sm font-semibold text-[#111318]">{card.title}</span>
              <span className="ml-auto text-xs font-semibold text-[#155dfc] shrink-0">{card.weight}</span>
            </div>
            <p className="text-xs text-[#6a7282] leading-snug">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Section A: Depth Score */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#f3f4f6] px-6 py-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#155dfc] text-xs font-bold text-white shrink-0">A</span>
          <span className="text-sm font-semibold text-[#111318]">Depth Score — Event Type Table</span>
          <button
            onClick={() => {
              const allCollapsed = tiers.every((t) => collapsedTiers[t]);
              const next = {};
              tiers.forEach((t) => { next[t] = !allCollapsed; });
              setCollapsedTiers(next);
            }}
            className="ml-auto text-xs font-medium text-[#6a7282] hover:text-[#155dfc] transition-colors shrink-0">
            {tiers.every((t) => collapsedTiers[t]) ? "Open all" : "Close all"}
          </button>
        </div>
        <div className="grid grid-cols-[1.4fr_110px_60px_60px_1fr_72px] border-b border-[#f3f4f6] bg-[#fafafa] px-6 py-2 gap-x-3">
          {["Event", "Type", "Score", "Cap", "Source"].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">{h}</span>
          ))}
          <span />
        </div>
        {tiers.map((tier) => {
          const meta = TIER_META[tier];
          const tierEvents = events.filter((e) => e.tier === tier);
          const tierRemoved = removedEvents.filter((e) => e.tier === tier);
          const isCollapsed = !!collapsedTiers[tier];
          return (
            <div key={tier}>
              {/* Tier header — expand/collapse + removed count */}
              <div className={`flex items-center gap-3 border-b border-[#f3f4f6] px-6 py-2 ${meta.bg}`}>
                <button
                  type="button"
                  onClick={() => toggleTier(tier)}
                  className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}>
                    {meta.label}
                  </span>
                  <span className={`text-[11px] ${meta.text} opacity-60`}>{tierEvents.length} event{tierEvents.length !== 1 ? "s" : ""}</span>
                  <svg
                    className={`ml-auto transition-transform ${isCollapsed ? "-rotate-90" : ""} ${meta.text} opacity-60`}
                    width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {tierRemoved.length > 0 && (
                  <button
                    onClick={() => setRemovedModalTier(tier)}
                    className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1 text-xs text-[#6a7282] hover:bg-[#f9fafb] transition-colors shrink-0">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 3h10M4 3V2h4v1M3 3l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {tierRemoved.length} removed
                  </button>
                )}
              </div>

              {!isCollapsed && tierEvents.map((ev) => (
                <div key={ev.id}
                  className="grid grid-cols-[1.4fr_110px_60px_60px_1fr_72px] items-start px-6 py-4 gap-x-3 hover:bg-[#fafafa] transition-colors border-b border-[#f3f4f6]">
                  <p className="text-sm font-semibold text-[#111318] pt-0.5">{ev.name}</p>
                  <div className="pt-0.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className={`text-sm font-bold tabular-nums pt-0.5 ${ev.weight > 0 ? "text-[#155dfc]" : "text-[#d1d5dc]"}`}>{ev.weight}</p>
                  <p className="text-sm tabular-nums pt-0.5 text-[#374151]">
                    {ev.cap !== "" && ev.cap != null ? ev.cap : <span className="text-[#d1d5dc]">—</span>}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {(ev.sources || []).map((s) => <SourcePill key={s.id} source={s} />)}
                  </div>
                  <div className="flex items-start gap-1 pt-0.5">
                    <button onClick={() => setEditingEvent(ev)}
                      className="rounded p-1.5 text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors" title="Edit">
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button onClick={() => removeEvent(ev.id)}
                      className="rounded p-1.5 text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626] transition-colors" title="Remove">
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M2 4h10M5 4V3h4v1M3 4l.7 8h6.6L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {!isCollapsed && tierEvents.length === 0 && (
                <div className="px-6 py-4 text-center text-sm text-[#9ca3af] border-b border-[#f3f4f6]">
                  No events. Restore removed ones or add a new one below.
                </div>
              )}
              {!isCollapsed && (
                <button
                  onClick={() => setAddingEventTier(tier)}
                  className="flex w-full items-center gap-2 border-b border-[#f3f4f6] px-6 py-2.5 text-xs font-medium text-[#155dfc] hover:bg-[#eff6ff] transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Add event
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {editingEvent && (
        <EditEventModal event={editingEvent} onSave={saveEventEdit} onClose={() => setEditingEvent(null)} />
      )}
      {addingEventTier && (
        <AddEventModal tier={addingEventTier} onSave={addEvent} onClose={() => setAddingEventTier(null)} />
      )}
      {removedModalTier && (
        <RemovedEventsModal
          tierLabel={TIER_META[removedModalTier]?.label}
          removedEvents={removedEvents.filter((e) => e.tier === removedModalTier)}
          onRestore={(id) => { restoreEvent(id); }}
          onClose={() => setRemovedModalTier(null)}
        />
      )}
      {editingBreadth && (
        <EditBreadthModal
          entry={editingBreadth}
          onSave={(id, score) => { updateBreadthScore(id, score); setEditingBreadth(null); }}
          onClose={() => setEditingBreadth(null)}
        />
      )}

      {/* Section B + Trajectory side by side */}
      <div className="grid grid-cols-2 gap-4">

        {/* Section B: Breadth Score */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#f3f4f6] px-6 py-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#155dfc] text-xs font-bold text-white shrink-0">B</span>
            <span className="text-sm font-semibold text-[#111318]">Breadth Score</span>
          </div>
          <div className="grid grid-cols-[1fr_100px_44px] border-b border-[#f3f4f6] bg-[#fafafa] px-6 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Distinct Channels Active</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">Score</span>
            <span />
          </div>
          {breadth.map((b, idx) => (
            <div key={b.id}
              className={`grid grid-cols-[1fr_100px_44px] items-center px-6 py-3 hover:bg-[#fafafa] transition-colors ${idx < breadth.length - 1 ? "border-b border-[#f3f4f6]" : ""}`}>
              <span className="text-sm font-medium text-[#111318]">{b.channels}</span>
              <span className="text-sm font-bold text-[#155dfc] tabular-nums">{b.score}</span>
              <button onClick={() => setEditingBreadth(b)}
                className="rounded p-1.5 text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors" title="Edit">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Trajectory */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
          <div className="border-b border-[#f3f4f6] px-6 py-4">
            <span className="text-sm font-semibold text-[#111318]">Trajectory (Trend Indicator)</span>
          </div>
          <div className="grid grid-cols-[56px_170px_1fr] border-b border-[#f3f4f6] bg-[#fafafa] px-6 py-2">
            {["", "Definition", "Momentum"].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">{h}</span>
            ))}
          </div>
          {TRAJECTORY_LEVELS.map((t, idx) => (
            <div key={t.id}
              className={`grid grid-cols-[56px_170px_1fr] items-center px-6 py-3 hover:bg-[#fafafa] transition-colors ${idx < TRAJECTORY_LEVELS.length - 1 ? "border-b border-[#f3f4f6]" : ""}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${t.bgClass} ${t.textClass}`}>
                {t.symbol}
              </div>
              <span className="text-sm font-semibold text-[#111318]">{t.label}</span>
              <span className="text-xs text-[#6a7282] leading-snug">{t.definition}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Score Bands */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
        <div className="border-b border-[#f3f4f6] px-6 py-4">
          <h3 className="text-sm font-semibold text-[#111318]">Score Bands</h3>
        </div>
        <div className="grid grid-cols-[100px_1fr] border-b border-[#f3f4f6] bg-[#fafafa] px-6 py-2">
          {["Score", "Band"].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">{h}</span>
          ))}
        </div>
        {engBands.map((band, idx) => {
          const colors = ENG_BAND_COLORS[band.color] || ENG_BAND_COLORS.green;
          return (
            <div key={band.id}
              className={`grid grid-cols-[100px_1fr] items-center px-6 py-3 hover:bg-[#fafafa] transition-colors ${idx < engBands.length - 1 ? "border-b border-[#f3f4f6]" : ""}`}>
              <span className={`text-sm font-bold ${colors.text}`}>{band.threshold}</span>
              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                  {band.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════

export default function ScoreConfiguration() {
  const [searchParams] = useSearchParams();
  const rawEntity = searchParams.get("entity");
  const entity = rawEntity === "hco" ? "hco" : rawEntity === "signal" ? "signal" : "hcp";
  const isSignal = entity === "signal";

  const tabs = isSignal
    ? [{ key: "engagement", label: "Engagement Score" }]
    : [{ key: "icp", label: "ICP Score" }, { key: "engagement", label: "Engagement Score" }];

  const [activeTab, setActiveTab] = useState(isSignal ? "engagement" : "icp");

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col gap-0 p-8 pb-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-5">
            <Link
              to={entity === "hco" ? "/profiles?tab=HCOs" : entity === "signal" ? "/profiles?tab=Signals" : "/profiles?tab=HCPs"}
              className="text-[#6a7282] transition-colors hover:text-[#155dfc]"
            >
              Profiles
            </Link>
            <span className="text-[#6a7282]">/</span>
            <span className="text-[#111318] font-medium">
              {entity === "hco" ? "HCO score configuration" : entity === "signal" ? "Lead signal score configuration" : "HCP score configuration"}
            </span>
          </nav>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-[#0a0a0a]">
                {entity === "hco" ? "HCO Score Configuration" : entity === "signal" ? "Lead Signal Score Configuration" : "HCP Score Configuration"}
              </h1>
              <p className="text-sm text-[#6a7282] max-w-[560px]">
                {entity === "hco"
                  ? "Configure ICP fit scores and engagement models for Healthcare Organizations."
                  : entity === "signal"
                  ? "Configure the Engagement Score model for anonymous lead signals."
                  : "Configure ICP fit scores and engagement models for Healthcare Professionals."}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-[#e5e7eb]">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-5 pb-3 pt-1 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key ? "border-[#155dfc] text-[#155dfc]" : "border-transparent text-[#6a7282] hover:text-[#374151]"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto px-8 py-6">
          {activeTab === "icp" && entity === "hcp" && <HCPICPScoreTab />}
          {activeTab === "icp" && entity === "hco" && <HCOICPScoreTab />}
          {activeTab === "engagement" && entity === "hco" && <HCOEngagementScoreTab />}
          {activeTab === "engagement" && entity !== "hco" && <EngagementScoreTab />}
        </div>
      </main>
    </div>
  );
}
