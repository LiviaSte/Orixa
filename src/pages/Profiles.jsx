import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HCO_CONFLICT_TOTAL, HCP_CONFLICT_TOTAL, PHARMACIST_CONFLICT_TOTAL } from "./ConflictResolution";
import Sidebar from "../components/Sidebar";
import ConversionPointsModal from "../components/ConversionPointsModal";
import { useMappingContext } from "../MappingContext";
import {
  SearchIcon20,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CloseIcon,
  WarningIcon,
  ExportIcon,
  WebVisitIcon,
  DownloadBrochureIcon,
  OpenedEmailIcon,
  LightningIcon,
  TrendUpSmallIcon,
} from "../components/icons";

const tabs = [
  { label: "HCPs", count: 102 },
  { label: "HCOs", count: 57 },
  { label: "Pharmacists", count: 48 },
  { label: "Pharmacys", count: 20 },
  { label: "Signals", count: 280 },
];

function getPriority(score) {
  if (score >= 80) return "Hot";
  if (score >= 50) return "Warm";
  return "Cold";
}

function SortIndicator({ active, direction }) {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" className="shrink-0">
      <path d="M5 2L8 5H2L5 2Z" fill={active && direction === "asc" ? "#0a0a0a" : "#cbd5e1"} />
      <path d="M5 10L2 7H8L5 10Z" fill={active && direction === "desc" ? "#0a0a0a" : "#cbd5e1"} />
    </svg>
  );
}

// Maps hospital display name → hospital route id
const affiliationHospitalIds = {
  "Mayo Clinic": 1,
  "Charité Berlin": 2,
  "Cleveland Clinic": 3,
  "Singapore General": 4,
  "Johns Hopkins": 5,
  "Necker-Enfants": 6,
  "Barcelona": 7,
};

const crmSegmentStyles = {
  Innovator:      "bg-[#ede9fe] text-[#6d28d9]",
  "Early Adopter": "bg-[#dbeafe] text-[#1d4ed8]",
  "Early Majority": "bg-[#dcfce7] text-[#15803d]",
  "Late Majority": "bg-[#fef9c3] text-[#a16207]",
  Laggard:        "bg-[#f3f4f6] text-[#6a7282]",
};

const hcpRows = [
  {
    id: 1,
    name: "Dr. Elena Rossi",
    email: "elena.rossi@stjude.org",
    onekeyId: "OK-10234",
    specialty: "Interv. cardiology",
    subSpecialty: "Structural Heart Disease",
    affiliations: ["Mayo Clinic", "Necker-Enfants"],
    sap: "Blank",
    isKol: true,
    leadScore: 92,
    engagementScore: 0,
    icpGrading: 92,
    interests: ["TAVR", "Cardiology", "Heart Failure"],
    crmSegment: "Innovator",
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    email: "m.chen@sgh.sg",
    onekeyId: "OK-20187",
    specialty: "Cardiology",
    subSpecialty: null,
    affiliations: ["Charité Berlin", "Singapore General"],
    sap: "82792",
    isKol: true,
    leadScore: 88,
    engagementScore: 45,
    icpGrading: 43,
    interests: ["EP", "Ablation", "AF Management"],
    crmSegment: "Early Adopter",
    missingFields: [
      { sectionId: "A", sectionLabel: "Profile Fit Score", variable: "Sub-specialty precision", sources: ["CRM › Contacts › Sub-Specialty", "Reps (Manual)"] },
      { sectionId: "B", sectionLabel: "Role & Influence Score", variable: "KOL / thought leader status", sources: ["CRM › Contacts › KOL Status", "Reps (Manual)"] },
    ],
  },
  {
    id: 3,
    name: "Dr. Emily Rost",
    email: "e.rost@childrens.org",
    onekeyId: "OK-30452",
    specialty: "Cardiac Surgery",
    subSpecialty: "Pediatric Cardiac Surgery",
    affiliations: ["Charité Berlin", "Johns Hopkins"],
    sap: "Blank",
    isKol: false,
    leadScore: 74,
    engagementScore: 30,
    icpGrading: 44,
    interests: ["Congenital Heart Disease", "Minimally Invasive Surgery"],
    crmSegment: "Early Adopter",
  },
  {
    id: 4,
    name: "Dr. James Wilson",
    email: "j.wilson@ucsf.edu",
    onekeyId: "OK-41029",
    specialty: "Cardiology",
    subSpecialty: null,
    affiliations: ["Cleveland Clinic", "Johns Hopkins"],
    sap: "92763",
    isKol: false,
    leadScore: 54,
    engagementScore: 20,
    icpGrading: 34,
    interests: ["Heart Failure", "Cardiac Imaging"],
    crmSegment: "Early Majority",
    missingFields: [
      { sectionId: "A", sectionLabel: "Profile Fit Score", variable: "Sub-specialty precision", sources: ["CRM › Contacts › Sub-Specialty", "Reps (Manual)"] },
      { sectionId: "B", sectionLabel: "Role & Influence Score", variable: "Innovation profile", sources: ["CRM › Contacts › Innovation Profile", "Reps (Manual)"] },
      { sectionId: "D", sectionLabel: "Research & Academic Activity", variable: "Publications", sources: ["PubMed › Publications › Publication Count (4 yrs)"] },
    ],
  },
  {
    id: 5,
    name: "Dr. Linda Kim",
    email: "linda.kim@ucsf.edu",
    onekeyId: "OK-51837",
    specialty: "Cardiac Surgery",
    subSpecialty: null,
    affiliations: ["Cleveland Clinic", "Barcelona"],
    sap: "92763",
    isKol: false,
    leadScore: 32,
    engagementScore: 12,
    icpGrading: 20,
    interests: ["Bypass Surgery", "Valve Repair"],
    crmSegment: "Late Majority",
    missingFields: [
      { sectionId: "A", sectionLabel: "Profile Fit Score", variable: "Sub-specialty precision", sources: ["CRM › Contacts › Sub-Specialty", "Reps (Manual)"] },
      { sectionId: "A", sectionLabel: "Profile Fit Score", variable: "Confirmed prescriber status", sources: ["CRM › Contacts › Prescriber Status", "Reps (Manual)"] },
      { sectionId: "B", sectionLabel: "Role & Influence Score", variable: "KOL / thought leader status", sources: ["CRM › Contacts › KOL Status", "Reps (Manual)"] },
      { sectionId: "D", sectionLabel: "Research & Academic Activity", variable: "Active clinical trial", sources: ["External DB › Research Database › PI Role", "Reps (Manual)"] },
    ],
  },
  {
    id: 6,
    name: "Dr. Kelly Cris",
    email: "k.cris@stjude.org",
    onekeyId: "OK-62094",
    specialty: "Interv. cardiology",
    subSpecialty: "Peripheral Vascular",
    affiliations: ["Mayo Clinic", "Barcelona"],
    sap: "82763",
    isKol: true,
    leadScore: 82,
    engagementScore: 38,
    icpGrading: 44,
    interests: ["TAVI", "Complex PCI", "CTO"],
    crmSegment: "Innovator",
  },
  {
    id: 7,
    name: "Dr. Marco Bianchi",
    email: "m.bianchi@necker.fr",
    onekeyId: "OK-73841",
    specialty: "Cardiology",
    subSpecialty: null,
    affiliations: ["Necker-Enfants", "Barcelona"],
    sap: "93012",
    isKol: false,
    leadScore: 61,
    engagementScore: 28,
    icpGrading: 38,
    interests: ["Heart Failure", "Cardiac Resynchronization"],
    crmSegment: "Early Majority",
    missingFields: [
      { sectionId: "A", sectionLabel: "Profile Fit Score", variable: "Sub-specialty precision", sources: ["CRM › Contacts › Sub-Specialty", "Reps (Manual)"] },
      { sectionId: "D", sectionLabel: "Research & Academic Activity", variable: "Active clinical trial", sources: ["External DB › Research Database › PI Role", "Reps (Manual)"] },
    ],
  },
  {
    id: 8,
    name: "Dr. Sophie Müller",
    email: "s.muller@charite.de",
    onekeyId: "OK-84502",
    specialty: "Cardiac Surgery",
    subSpecialty: "Aortic Surgery",
    affiliations: ["Charité Berlin"],
    sap: "Blank",
    isKol: true,
    leadScore: 77,
    engagementScore: 55,
    icpGrading: 50,
    interests: ["Aortic Aneurysm", "TEVAR", "Open Repair"],
    crmSegment: "Early Adopter",
  },
  {
    id: 9,
    name: "Dr. Hiroshi Tanaka",
    email: "h.tanaka@sgh.sg",
    onekeyId: "OK-95317",
    specialty: "Interv. cardiology",
    subSpecialty: null,
    affiliations: ["Singapore General", "Johns Hopkins"],
    sap: "84201",
    isKol: false,
    leadScore: 45,
    engagementScore: 18,
    icpGrading: 29,
    interests: ["Coronary Stenting", "FFR", "IVUS"],
    crmSegment: "Late Majority",
    missingFields: [
      { sectionId: "A", sectionLabel: "Profile Fit Score", variable: "Sub-specialty precision", sources: ["CRM › Contacts › Sub-Specialty", "Reps (Manual)"] },
      { sectionId: "A", sectionLabel: "Profile Fit Score", variable: "Confirmed prescriber status", sources: ["CRM › Contacts › Prescriber Status", "Reps (Manual)"] },
      { sectionId: "B", sectionLabel: "Role & Influence Score", variable: "Innovation profile", sources: ["CRM › Contacts › Innovation Profile", "Reps (Manual)"] },
    ],
  },
  {
    id: 10,
    name: "Dr. Amara Diallo",
    email: "a.diallo@mayo.edu",
    onekeyId: "OK-10628",
    specialty: "Cardiology",
    subSpecialty: "Electrophysiology",
    affiliations: ["Mayo Clinic", "Cleveland Clinic"],
    sap: "76549",
    isKol: true,
    leadScore: 89,
    engagementScore: 62,
    icpGrading: 71,
    interests: ["Ablation", "AF Management", "Cardiac Mapping"],
    crmSegment: "Innovator",
  },
  {
    id: 11,
    name: "Dr. Fatima Al-Rashid",
    email: "f.alrashid@johns.edu",
    onekeyId: "OK-11743",
    specialty: "Cardiology",
    subSpecialty: null,
    affiliations: ["Johns Hopkins"],
    sap: "81920",
    isKol: false,
    leadScore: 58,
    engagementScore: 22,
    icpGrading: 36,
    interests: ["Preventive Cardiology", "Lipid Management"],
    crmSegment: "Early Majority",
    missingFields: [
      { sectionId: "A", sectionLabel: "Profile Fit Score", variable: "Sub-specialty precision", sources: ["CRM › Contacts › Sub-Specialty", "Reps (Manual)"] },
      { sectionId: "B", sectionLabel: "Role & Influence Score", variable: "KOL / thought leader status", sources: ["CRM › Contacts › KOL Status", "Reps (Manual)"] },
    ],
  },
  {
    id: 12,
    name: "Dr. Lucas Ferreira",
    email: "l.ferreira@barcelona.es",
    onekeyId: "OK-12856",
    specialty: "Cardiac Surgery",
    subSpecialty: "Valve Surgery",
    affiliations: ["Barcelona", "Mayo Clinic"],
    sap: "Blank",
    isKol: true,
    leadScore: 83,
    engagementScore: 47,
    icpGrading: 55,
    interests: ["Mitral Repair", "TEER", "Valve-in-Valve"],
    crmSegment: "Innovator",
  },
  {
    id: 13,
    name: "Dr. Nadia Kowalski",
    email: "n.kowalski@cleveland.org",
    onekeyId: "OK-13971",
    specialty: "Interv. cardiology",
    subSpecialty: "Structural Heart Disease",
    affiliations: ["Cleveland Clinic"],
    sap: "95032",
    isKol: false,
    leadScore: 66,
    engagementScore: 35,
    icpGrading: 42,
    interests: ["PFO Closure", "LAA Occlusion", "ASD"],
    crmSegment: "Early Adopter",
  },
  {
    id: 14,
    name: "Dr. Pierre Lefebvre",
    email: "p.lefebvre@necker.fr",
    onekeyId: "OK-14082",
    specialty: "Cardiology",
    subSpecialty: null,
    affiliations: ["Necker-Enfants", "Charité Berlin"],
    sap: "72841",
    isKol: false,
    leadScore: 37,
    engagementScore: 10,
    icpGrading: 22,
    interests: ["Pediatric Cardiology", "Congenital Defects"],
    crmSegment: "Laggard",
  },
  {
    id: 15,
    name: "Dr. Yuki Nakamura",
    email: "y.nakamura@sgh.sg",
    onekeyId: "OK-15194",
    specialty: "Cardiac Surgery",
    subSpecialty: null,
    affiliations: ["Singapore General"],
    sap: "88374",
    isKol: true,
    leadScore: 91,
    engagementScore: 70,
    icpGrading: 68,
    interests: ["Robotic Surgery", "Minimally Invasive", "Bypass"],
    crmSegment: "Innovator",
  },
  {
    id: 16,
    name: "Dr. Isabella Romano",
    email: "i.romano@mayo.edu",
    onekeyId: "OK-16302",
    specialty: "Cardiology",
    subSpecialty: "Heart Failure",
    affiliations: ["Mayo Clinic"],
    sap: "91023",
    isKol: false,
    leadScore: 63,
    engagementScore: 31,
    icpGrading: 40,
    interests: ["Heart Failure", "LVAD", "Transplant"],
    crmSegment: "Early Majority",
  },
  {
    id: 17,
    name: "Dr. Chen Wei",
    email: "c.wei@sgh.sg",
    onekeyId: "OK-17415",
    specialty: "Interv. cardiology",
    subSpecialty: "Complex PCI",
    affiliations: ["Singapore General", "Johns Hopkins"],
    sap: "Blank",
    isKol: true,
    leadScore: 86,
    engagementScore: 58,
    icpGrading: 62,
    interests: ["Complex PCI", "CTO", "IVUS"],
    crmSegment: "Innovator",
  },
  {
    id: 18,
    name: "Dr. Marie Dubois",
    email: "m.dubois@necker.fr",
    onekeyId: "OK-18528",
    specialty: "Cardiac Surgery",
    subSpecialty: "Aortic Surgery",
    affiliations: ["Necker-Enfants", "Charité Berlin"],
    sap: "74612",
    isKol: false,
    leadScore: 49,
    engagementScore: 19,
    icpGrading: 27,
    interests: ["Aortic Aneurysm", "TEVAR", "Open Repair"],
    crmSegment: "Late Majority",
  },
  {
    id: 19,
    name: "Dr. James O'Brien",
    email: "j.obrien@cleveland.org",
    onekeyId: "OK-19641",
    specialty: "Cardiology",
    subSpecialty: "Preventive Cardiology",
    affiliations: ["Cleveland Clinic"],
    sap: "83920",
    isKol: false,
    leadScore: 55,
    engagementScore: 24,
    icpGrading: 33,
    interests: ["Preventive Cardiology", "Lipid Management", "Hypertension"],
    crmSegment: "Early Majority",
  },
  {
    id: 20,
    name: "Dr. Priya Sharma",
    email: "p.sharma@mayo.edu",
    onekeyId: "OK-20754",
    specialty: "Interv. cardiology",
    subSpecialty: "Structural Heart Disease",
    affiliations: ["Mayo Clinic", "Cleveland Clinic"],
    sap: "92847",
    isKol: true,
    leadScore: 94,
    engagementScore: 75,
    icpGrading: 80,
    interests: ["TAVR", "MitraClip", "LAAO"],
    crmSegment: "Innovator",
  },
  {
    id: 21,
    name: "Dr. Hans Zimmermann",
    email: "h.zimmermann@charite.de",
    onekeyId: "OK-21867",
    specialty: "Cardiac Surgery",
    subSpecialty: "Valve Surgery",
    affiliations: ["Charité Berlin"],
    sap: "67831",
    isKol: false,
    leadScore: 41,
    engagementScore: 15,
    icpGrading: 24,
    interests: ["Mitral Repair", "Valve-in-Valve", "TEER"],
    crmSegment: "Late Majority",
  },
  {
    id: 22,
    name: "Dr. Sun Li",
    email: "s.li@sgh.sg",
    onekeyId: "OK-22980",
    specialty: "Cardiology",
    subSpecialty: "Electrophysiology",
    affiliations: ["Singapore General"],
    sap: "85293",
    isKol: true,
    leadScore: 88,
    engagementScore: 64,
    icpGrading: 70,
    interests: ["Ablation", "AF Management", "Cardiac Mapping"],
    crmSegment: "Innovator",
  },
  {
    id: 23,
    name: "Dr. Valentina Cruz",
    email: "v.cruz@barcelona.es",
    onekeyId: "OK-23093",
    specialty: "Interv. cardiology",
    subSpecialty: null,
    affiliations: ["Barcelona"],
    sap: "Blank",
    isKol: false,
    leadScore: 68,
    engagementScore: 36,
    icpGrading: 45,
    interests: ["PCI", "Stenting", "IVUS"],
    crmSegment: "Early Adopter",
  },
  {
    id: 24,
    name: "Dr. Kenji Watanabe",
    email: "k.watanabe@sgh.sg",
    onekeyId: "OK-24106",
    specialty: "Cardiac Surgery",
    subSpecialty: "Pediatric Cardiac Surgery",
    affiliations: ["Singapore General", "Johns Hopkins"],
    sap: "79104",
    isKol: true,
    leadScore: 84,
    engagementScore: 60,
    icpGrading: 65,
    interests: ["Congenital Heart Disease", "Pediatric Surgery", "ECMO"],
    crmSegment: "Early Adopter",
  },
  {
    id: 25,
    name: "Dr. Olga Petrov",
    email: "o.petrov@johns.edu",
    onekeyId: "OK-25219",
    specialty: "Cardiology",
    subSpecialty: null,
    affiliations: ["Johns Hopkins"],
    sap: "93712",
    isKol: false,
    leadScore: 52,
    engagementScore: 22,
    icpGrading: 31,
    interests: ["Cardiac Imaging", "Echo", "MRI Cardiac"],
    crmSegment: "Early Majority",
  },
  {
    id: 26,
    name: "Dr. Rafael Morales",
    email: "r.morales@barcelona.es",
    onekeyId: "OK-26332",
    specialty: "Interv. cardiology",
    subSpecialty: "Peripheral Vascular",
    affiliations: ["Barcelona", "Necker-Enfants"],
    sap: "71458",
    isKol: false,
    leadScore: 38,
    engagementScore: 11,
    icpGrading: 21,
    interests: ["Peripheral Vascular", "Carotid Stenting", "EVAR"],
    crmSegment: "Laggard",
  },
  {
    id: 27,
    name: "Dr. Fatou Diallo",
    email: "f.diallo@mayo.edu",
    onekeyId: "OK-27445",
    specialty: "Cardiac Surgery",
    subSpecialty: "Coronary Surgery",
    affiliations: ["Mayo Clinic"],
    sap: "86530",
    isKol: false,
    leadScore: 60,
    engagementScore: 27,
    icpGrading: 37,
    interests: ["CABG", "Off-Pump Surgery", "Hybrid Revascularization"],
    crmSegment: "Early Majority",
  },
  {
    id: 28,
    name: "Dr. Erik Lindqvist",
    email: "e.lindqvist@charite.de",
    onekeyId: "OK-28558",
    specialty: "Cardiology",
    subSpecialty: "Sports Cardiology",
    affiliations: ["Charité Berlin"],
    sap: "Blank",
    isKol: false,
    leadScore: 35,
    engagementScore: 13,
    icpGrading: 20,
    interests: ["Sports Cardiology", "HCM", "Sudden Cardiac Death"],
    crmSegment: "Laggard",
  },
  {
    id: 29,
    name: "Dr. Aisha Nkrumah",
    email: "a.nkrumah@johns.edu",
    onekeyId: "OK-29671",
    specialty: "Interv. cardiology",
    subSpecialty: "Structural Heart Disease",
    affiliations: ["Johns Hopkins", "Mayo Clinic"],
    sap: "94823",
    isKol: true,
    leadScore: 92,
    engagementScore: 72,
    icpGrading: 76,
    interests: ["TAVR", "PFO Closure", "LAA Occlusion"],
    crmSegment: "Innovator",
  },
  {
    id: 30,
    name: "Dr. Giovanni Esposito",
    email: "g.esposito@barcelona.es",
    onekeyId: "OK-30784",
    specialty: "Cardiac Surgery",
    subSpecialty: "Minimally Invasive",
    affiliations: ["Barcelona"],
    sap: "76391",
    isKol: true,
    leadScore: 79,
    engagementScore: 52,
    icpGrading: 56,
    interests: ["Minimally Invasive Surgery", "Robotic Surgery", "MIDCAB"],
    crmSegment: "Early Adopter",
  },
  {
    id: 31,
    name: "Dr. Mei Lin Chen",
    email: "m.chen@sgh.sg",
    onekeyId: "OK-31897",
    specialty: "Cardiology",
    subSpecialty: "Pulmonary Hypertension",
    affiliations: ["Singapore General", "Charité Berlin"],
    sap: "89047",
    isKol: false,
    leadScore: 57,
    engagementScore: 25,
    icpGrading: 34,
    interests: ["Pulmonary Hypertension", "Right Heart Failure", "Vasodilators"],
    crmSegment: "Early Majority",
  },
  {
    id: 32,
    name: "Dr. Tomás Reyes",
    email: "t.reyes@necker.fr",
    onekeyId: "OK-32010",
    specialty: "Interv. cardiology",
    subSpecialty: null,
    affiliations: ["Necker-Enfants"],
    sap: "Blank",
    isKol: false,
    leadScore: 45,
    engagementScore: 17,
    icpGrading: 26,
    interests: ["Coronary Stenting", "Rotablation", "Atherectomy"],
    crmSegment: "Late Majority",
  },
  {
    id: 33,
    name: "Dr. Sarah Mitchell",
    email: "s.mitchell@cleveland.org",
    onekeyId: "OK-33123",
    specialty: "Cardiac Surgery",
    subSpecialty: "Transplant Surgery",
    affiliations: ["Cleveland Clinic", "Johns Hopkins"],
    sap: "97265",
    isKol: true,
    leadScore: 90,
    engagementScore: 68,
    icpGrading: 74,
    interests: ["Heart Transplant", "LVAD", "MCS"],
    crmSegment: "Innovator",
  },
  {
    id: 34,
    name: "Dr. Nikolai Volkov",
    email: "n.volkov@charite.de",
    onekeyId: "OK-34236",
    specialty: "Cardiology",
    subSpecialty: "Cardiac Rehabilitation",
    affiliations: ["Charité Berlin"],
    sap: "72918",
    isKol: false,
    leadScore: 29,
    engagementScore: 10,
    icpGrading: 17,
    interests: ["Cardiac Rehab", "Heart Failure", "Exercise Physiology"],
    crmSegment: "Laggard",
  },
  {
    id: 35,
    name: "Dr. Ananya Patel",
    email: "a.patel@mayo.edu",
    onekeyId: "OK-35349",
    specialty: "Interv. cardiology",
    subSpecialty: "Complex PCI",
    affiliations: ["Mayo Clinic", "Singapore General"],
    sap: "81736",
    isKol: false,
    leadScore: 72,
    engagementScore: 40,
    icpGrading: 48,
    interests: ["Complex PCI", "Bifurcation", "Left Main PCI"],
    crmSegment: "Early Adopter",
  },
  {
    id: 36,
    name: "Dr. François Bertrand",
    email: "f.bertrand@necker.fr",
    onekeyId: "OK-36462",
    specialty: "Cardiac Surgery",
    subSpecialty: "Aortic Surgery",
    affiliations: ["Necker-Enfants", "Barcelona"],
    sap: "65204",
    isKol: false,
    leadScore: 43,
    engagementScore: 16,
    icpGrading: 25,
    interests: ["Aortic Dissection", "Emergency Surgery", "Bentall Procedure"],
    crmSegment: "Late Majority",
  },
  {
    id: 37,
    name: "Dr. Yuna Kim",
    email: "y.kim@johns.edu",
    onekeyId: "OK-37575",
    specialty: "Cardiology",
    subSpecialty: "Electrophysiology",
    affiliations: ["Johns Hopkins", "Cleveland Clinic"],
    sap: "96183",
    isKol: true,
    leadScore: 95,
    engagementScore: 78,
    icpGrading: 82,
    interests: ["AF Ablation", "VT Storm", "Sudden Cardiac Death"],
    crmSegment: "Innovator",
  },
  {
    id: 38,
    name: "Dr. Björn Hansen",
    email: "b.hansen@charite.de",
    onekeyId: "OK-38688",
    specialty: "Interv. cardiology",
    subSpecialty: "Peripheral Vascular",
    affiliations: ["Charité Berlin", "Necker-Enfants"],
    sap: "Blank",
    isKol: false,
    leadScore: 54,
    engagementScore: 21,
    icpGrading: 30,
    interests: ["Peripheral Vascular", "PAD", "Renal Denervation"],
    crmSegment: "Early Majority",
  },
  {
    id: 39,
    name: "Dr. Carmen Delgado",
    email: "c.delgado@barcelona.es",
    onekeyId: "OK-39801",
    specialty: "Cardiac Surgery",
    subSpecialty: "Valve Surgery",
    affiliations: ["Barcelona", "Mayo Clinic"],
    sap: "78540",
    isKol: true,
    leadScore: 83,
    engagementScore: 57,
    icpGrading: 61,
    interests: ["Mitral Repair", "Tricuspid Surgery", "Re-do Surgery"],
    crmSegment: "Early Adopter",
  },
  {
    id: 40,
    name: "Dr. Liu Yang",
    email: "l.yang@sgh.sg",
    onekeyId: "OK-40914",
    specialty: "Cardiology",
    subSpecialty: "Heart Failure",
    affiliations: ["Singapore General"],
    sap: "87362",
    isKol: false,
    leadScore: 67,
    engagementScore: 34,
    icpGrading: 43,
    interests: ["Advanced Heart Failure", "LVAD Therapy", "Palliative Cardiology"],
    crmSegment: "Early Adopter",
  },
  {
    id: 41,
    name: "Dr. Patrick Flynn",
    email: "p.flynn@cleveland.org",
    onekeyId: "OK-41027",
    specialty: "Interv. cardiology",
    subSpecialty: "Structural Heart Disease",
    affiliations: ["Cleveland Clinic"],
    sap: "93041",
    isKol: false,
    leadScore: 48,
    engagementScore: 18,
    icpGrading: 28,
    interests: ["TAVR", "ASD Closure", "PFO Closure"],
    crmSegment: "Late Majority",
  },
  {
    id: 42,
    name: "Dr. Ingrid Svensson",
    email: "i.svensson@charite.de",
    onekeyId: "OK-42140",
    specialty: "Cardiac Surgery",
    subSpecialty: "Coronary Surgery",
    affiliations: ["Charité Berlin"],
    sap: "Blank",
    isKol: false,
    leadScore: 36,
    engagementScore: 12,
    icpGrading: 19,
    interests: ["CABG", "Arterial Grafting", "Hybrid Revascularization"],
    crmSegment: "Laggard",
  },
  {
    id: 43,
    name: "Dr. Raj Krishnaswamy",
    email: "r.krishna@mayo.edu",
    onekeyId: "OK-43253",
    specialty: "Cardiology",
    subSpecialty: "Preventive Cardiology",
    affiliations: ["Mayo Clinic", "Johns Hopkins"],
    sap: "84719",
    isKol: true,
    leadScore: 87,
    engagementScore: 62,
    icpGrading: 67,
    interests: ["Preventive Cardiology", "Risk Stratification", "Lipid Disorders"],
    crmSegment: "Early Adopter",
  },
  {
    id: 44,
    name: "Dr. Emilia Kowalczyk",
    email: "e.kowalczyk@necker.fr",
    onekeyId: "OK-44366",
    specialty: "Interv. cardiology",
    subSpecialty: null,
    affiliations: ["Necker-Enfants"],
    sap: "70283",
    isKol: false,
    leadScore: 56,
    engagementScore: 23,
    icpGrading: 32,
    interests: ["Coronary Stenting", "FFR", "OCT"],
    crmSegment: "Early Majority",
  },
  {
    id: 45,
    name: "Dr. Carlos Mendes",
    email: "c.mendes@barcelona.es",
    onekeyId: "OK-45479",
    specialty: "Cardiac Surgery",
    subSpecialty: "Pediatric Cardiac Surgery",
    affiliations: ["Barcelona"],
    sap: "77158",
    isKol: false,
    leadScore: 44,
    engagementScore: 17,
    icpGrading: 26,
    interests: ["Congenital Heart Disease", "Fontan Procedure", "AV Canal Repair"],
    crmSegment: "Late Majority",
  },
  {
    id: 46,
    name: "Dr. Zara Ahmed",
    email: "z.ahmed@johns.edu",
    onekeyId: "OK-46592",
    specialty: "Cardiology",
    subSpecialty: "Electrophysiology",
    affiliations: ["Johns Hopkins"],
    sap: "91604",
    isKol: true,
    leadScore: 93,
    engagementScore: 74,
    icpGrading: 79,
    interests: ["Ventricular Tachycardia", "Cardiac Devices", "ICD Therapy"],
    crmSegment: "Innovator",
  },
  {
    id: 47,
    name: "Dr. Thomas Becker",
    email: "t.becker@charite.de",
    onekeyId: "OK-47705",
    specialty: "Interv. cardiology",
    subSpecialty: "Complex PCI",
    affiliations: ["Charité Berlin", "Cleveland Clinic"],
    sap: "Blank",
    isKol: false,
    leadScore: 62,
    engagementScore: 29,
    icpGrading: 38,
    interests: ["Unprotected Left Main", "CTO Recanalization", "Rotablation"],
    crmSegment: "Early Adopter",
  },
  {
    id: 48,
    name: "Dr. Nour El Amin",
    email: "n.elamin@mayo.edu",
    onekeyId: "OK-48818",
    specialty: "Cardiac Surgery",
    subSpecialty: "Minimally Invasive",
    affiliations: ["Mayo Clinic"],
    sap: "82047",
    isKol: false,
    leadScore: 70,
    engagementScore: 38,
    icpGrading: 46,
    interests: ["Minimally Invasive Valve", "Thoracoscopic Surgery", "MIDCAB"],
    crmSegment: "Early Adopter",
  },
  {
    id: 49,
    name: "Dr. Silvia Ferretti",
    email: "s.ferretti@barcelona.es",
    onekeyId: "OK-49931",
    specialty: "Cardiology",
    subSpecialty: "Cardiac Imaging",
    affiliations: ["Barcelona", "Charité Berlin"],
    sap: "73826",
    isKol: true,
    leadScore: 81,
    engagementScore: 55,
    icpGrading: 60,
    interests: ["Cardiac CT", "3D Echo", "Multimodality Imaging"],
    crmSegment: "Early Adopter",
  },
  {
    id: 50,
    name: "Dr. David Osei",
    email: "d.osei@cleveland.org",
    onekeyId: "OK-50044",
    specialty: "Interv. cardiology",
    subSpecialty: "Structural Heart Disease",
    affiliations: ["Cleveland Clinic", "Singapore General"],
    sap: "95371",
    isKol: false,
    leadScore: 39,
    engagementScore: 14,
    icpGrading: 22,
    interests: ["Transcatheter Therapies", "TAVR", "TEER"],
    crmSegment: "Late Majority",
  },
  {
    id: 51,
    name: "Dr. Hana Novakova",
    email: "h.novakova@necker.fr",
    onekeyId: "OK-51157",
    specialty: "Cardiac Surgery",
    subSpecialty: "Aortic Surgery",
    affiliations: ["Necker-Enfants"],
    sap: "Blank",
    isKol: false,
    leadScore: 33,
    engagementScore: 11,
    icpGrading: 18,
    interests: ["Aortic Aneurysm", "Emergency Dissection", "Endovascular Repair"],
    crmSegment: "Laggard",
  },
  {
    id: 52,
    name: "Dr. Marco Pellegrini",
    email: "m.pellegrini@mayo.edu",
    onekeyId: "OK-52270",
    specialty: "Cardiology",
    subSpecialty: "Cardiac Oncology",
    affiliations: ["Mayo Clinic", "Barcelona"],
    sap: "88593",
    isKol: false,
    leadScore: 53,
    engagementScore: 21,
    icpGrading: 30,
    interests: ["Cardio-Oncology", "Chemotherapy Cardiotoxicity", "Survivorship"],
    crmSegment: "Early Majority",
  },
  {
    id: 53,
    name: "Dr. Ji-Woo Park",
    email: "j.park@sgh.sg",
    onekeyId: "OK-53383",
    specialty: "Interv. cardiology",
    subSpecialty: null,
    affiliations: ["Singapore General"],
    sap: "80261",
    isKol: false,
    leadScore: 76,
    engagementScore: 46,
    icpGrading: 53,
    interests: ["FFR-Guided PCI", "OCT", "IVUS-Guided Intervention"],
    crmSegment: "Early Adopter",
  },
  {
    id: 54,
    name: "Dr. Helena Rodrigues",
    email: "h.rodrigues@johns.edu",
    onekeyId: "OK-54496",
    specialty: "Cardiac Surgery",
    subSpecialty: "Valve Surgery",
    affiliations: ["Johns Hopkins", "Necker-Enfants"],
    sap: "69184",
    isKol: true,
    leadScore: 89,
    engagementScore: 66,
    icpGrading: 72,
    interests: ["Complex Valve Repair", "Redo Operations", "Endocarditis Surgery"],
    crmSegment: "Innovator",
  },
  {
    id: 55,
    name: "Dr. Wolfgang Braun",
    email: "w.braun@charite.de",
    onekeyId: "OK-55609",
    specialty: "Cardiology",
    subSpecialty: "Heart Failure",
    affiliations: ["Charité Berlin", "Mayo Clinic"],
    sap: "Blank",
    isKol: false,
    leadScore: 47,
    engagementScore: 19,
    icpGrading: 27,
    interests: ["Acute Heart Failure", "Cardiogenic Shock", "MCS"],
    crmSegment: "Late Majority",
  },
  {
    id: 56,
    name: "Dr. Amara Traoré",
    email: "a.traore@cleveland.org",
    onekeyId: "OK-56722",
    specialty: "Interv. cardiology",
    subSpecialty: "Peripheral Vascular",
    affiliations: ["Cleveland Clinic"],
    sap: "76940",
    isKol: false,
    leadScore: 64,
    engagementScore: 32,
    icpGrading: 41,
    interests: ["Carotid Artery Stenting", "Endovascular Therapy", "Critical Limb Ischemia"],
    crmSegment: "Early Majority",
  },
  {
    id: 57,
    name: "Dr. Camille Fontaine",
    email: "c.fontaine@necker.fr",
    onekeyId: "OK-57835",
    specialty: "Cardiac Surgery",
    subSpecialty: "Transplant Surgery",
    affiliations: ["Necker-Enfants", "Johns Hopkins"],
    sap: "94057",
    isKol: true,
    leadScore: 91,
    engagementScore: 71,
    icpGrading: 77,
    interests: ["Pediatric Transplant", "BiVAD", "Artificial Heart"],
    crmSegment: "Innovator",
  },
  {
    id: 58,
    name: "Dr. Samir Gupta",
    email: "s.gupta@mayo.edu",
    onekeyId: "OK-58948",
    specialty: "Cardiology",
    subSpecialty: "Electrophysiology",
    affiliations: ["Mayo Clinic"],
    sap: "83608",
    isKol: false,
    leadScore: 59,
    engagementScore: 26,
    icpGrading: 35,
    interests: ["Pacemaker Implantation", "CRT", "His Bundle Pacing"],
    crmSegment: "Early Majority",
  },
  {
    id: 59,
    name: "Dr. Elena Vasquez",
    email: "e.vasquez@barcelona.es",
    onekeyId: "OK-59061",
    specialty: "Interv. cardiology",
    subSpecialty: "Complex PCI",
    affiliations: ["Barcelona", "Singapore General"],
    sap: "Blank",
    isKol: true,
    leadScore: 85,
    engagementScore: 61,
    icpGrading: 66,
    interests: ["Chronic Total Occlusion", "Retrograde Technique", "Antegrade Dissection"],
    crmSegment: "Early Adopter",
  },
  {
    id: 60,
    name: "Dr. Lena Fischer",
    email: "l.fischer@charite.de",
    onekeyId: "OK-60174",
    specialty: "Cardiac Surgery",
    subSpecialty: "Coronary Surgery",
    affiliations: ["Charité Berlin"],
    sap: "71825",
    isKol: false,
    leadScore: 40,
    engagementScore: 15,
    icpGrading: 23,
    interests: ["OPCAB", "MIDCAB", "Arterial Graft Patency"],
    crmSegment: "Late Majority",
  },
  {
    id: 61,
    name: "Dr. Ahmed Al-Farsi",
    email: "a.alfarsi@johns.edu",
    onekeyId: "OK-61287",
    specialty: "Cardiology",
    subSpecialty: "Pulmonary Hypertension",
    affiliations: ["Johns Hopkins", "Cleveland Clinic"],
    sap: "97481",
    isKol: true,
    leadScore: 92,
    engagementScore: 73,
    icpGrading: 78,
    interests: ["PAH", "Group 2 PH", "Vasodilator Testing"],
    crmSegment: "Innovator",
  },
  {
    id: 62,
    name: "Dr. Marina Kozlova",
    email: "m.kozlova@sgh.sg",
    onekeyId: "OK-62400",
    specialty: "Interv. cardiology",
    subSpecialty: "Structural Heart Disease",
    affiliations: ["Singapore General"],
    sap: "86147",
    isKol: false,
    leadScore: 55,
    engagementScore: 23,
    icpGrading: 32,
    interests: ["Tricuspid TEER", "Mitral TEER", "TriClip"],
    crmSegment: "Early Majority",
  },
  {
    id: 63,
    name: "Dr. Adrien Mercier",
    email: "a.mercier@necker.fr",
    onekeyId: "OK-63513",
    specialty: "Cardiac Surgery",
    subSpecialty: "Minimally Invasive",
    affiliations: ["Necker-Enfants", "Charité Berlin"],
    sap: "Blank",
    isKol: false,
    leadScore: 31,
    engagementScore: 11,
    icpGrading: 17,
    interests: ["Thoracoscopic Ablation", "Mini-Maze", "Hybrid AF Surgery"],
    crmSegment: "Laggard",
  },
  {
    id: 64,
    name: "Dr. Rosa Fernandez",
    email: "r.fernandez@mayo.edu",
    onekeyId: "OK-64626",
    specialty: "Cardiology",
    subSpecialty: "Cardiac Imaging",
    affiliations: ["Mayo Clinic", "Cleveland Clinic"],
    sap: "89370",
    isKol: true,
    leadScore: 86,
    engagementScore: 63,
    icpGrading: 69,
    interests: ["Cardiac MRI", "Nuclear Cardiology", "Strain Imaging"],
    crmSegment: "Early Adopter",
  },
  {
    id: 65,
    name: "Dr. Kwame Asante",
    email: "k.asante@cleveland.org",
    onekeyId: "OK-65739",
    specialty: "Interv. cardiology",
    subSpecialty: null,
    affiliations: ["Cleveland Clinic"],
    sap: "74603",
    isKol: false,
    leadScore: 51,
    engagementScore: 20,
    icpGrading: 29,
    interests: ["Coronary Physiology", "FFR", "iFR"],
    crmSegment: "Early Majority",
  },
  {
    id: 66,
    name: "Dr. Andrea Moretti",
    email: "a.moretti@barcelona.es",
    onekeyId: "OK-66852",
    specialty: "Cardiac Surgery",
    subSpecialty: "Valve Surgery",
    affiliations: ["Barcelona", "Johns Hopkins"],
    sap: "81294",
    isKol: false,
    leadScore: 66,
    engagementScore: 33,
    icpGrading: 42,
    interests: ["Aortic Valve Repair", "Neo-chordae Implantation", "Leaflet Augmentation"],
    crmSegment: "Early Adopter",
  },
  {
    id: 67,
    name: "Dr. Tan Mei Ling",
    email: "t.meiling@sgh.sg",
    onekeyId: "OK-67965",
    specialty: "Cardiology",
    subSpecialty: "Preventive Cardiology",
    affiliations: ["Singapore General"],
    sap: "Blank",
    isKol: false,
    leadScore: 42,
    engagementScore: 16,
    icpGrading: 24,
    interests: ["Dyslipidemia", "ASCVD Risk", "Lipid Lowering Therapy"],
    crmSegment: "Late Majority",
  },
  {
    id: 68,
    name: "Dr. Viktor Horvath",
    email: "v.horvath@charite.de",
    onekeyId: "OK-68078",
    specialty: "Interv. cardiology",
    subSpecialty: "Complex PCI",
    affiliations: ["Charité Berlin", "Barcelona"],
    sap: "92817",
    isKol: true,
    leadScore: 88,
    engagementScore: 65,
    icpGrading: 71,
    interests: ["Bifurcation Stenting", "Sheathless Approach", "Radial Access"],
    crmSegment: "Innovator",
  },
  {
    id: 69,
    name: "Dr. Fatima Hassan",
    email: "f.hassan@johns.edu",
    onekeyId: "OK-69191",
    specialty: "Cardiac Surgery",
    subSpecialty: "Aortic Surgery",
    affiliations: ["Johns Hopkins"],
    sap: "67542",
    isKol: false,
    leadScore: 58,
    engagementScore: 25,
    icpGrading: 34,
    interests: ["Thoracic Aorta", "Arch Surgery", "Cerebral Protection"],
    crmSegment: "Early Majority",
  },
  {
    id: 70,
    name: "Dr. Lars Andersen",
    email: "l.andersen@mayo.edu",
    onekeyId: "OK-70304",
    specialty: "Cardiology",
    subSpecialty: "Electrophysiology",
    affiliations: ["Mayo Clinic"],
    sap: "Blank",
    isKol: false,
    leadScore: 69,
    engagementScore: 36,
    icpGrading: 45,
    interests: ["Cryoablation", "Pulmonary Vein Isolation", "3D Mapping"],
    crmSegment: "Early Adopter",
  },
  {
    id: 71,
    name: "Dr. Sofia Papadopoulos",
    email: "s.papadopoulos@sgh.sg",
    onekeyId: "OK-71417",
    specialty: "Interv. cardiology",
    subSpecialty: "Structural Heart Disease",
    affiliations: ["Singapore General", "Necker-Enfants"],
    sap: "84036",
    isKol: false,
    leadScore: 46,
    engagementScore: 18,
    icpGrading: 26,
    interests: ["Balloon Valvuloplasty", "PBMV", "Structural Catheterization"],
    crmSegment: "Late Majority",
  },
  {
    id: 72,
    name: "Dr. Jonathan Hughes",
    email: "j.hughes@cleveland.org",
    onekeyId: "OK-72530",
    specialty: "Cardiac Surgery",
    subSpecialty: "Transplant Surgery",
    affiliations: ["Cleveland Clinic", "Mayo Clinic"],
    sap: "96759",
    isKol: true,
    leadScore: 96,
    engagementScore: 80,
    icpGrading: 85,
    interests: ["Total Artificial Heart", "DCD Heart Transplant", "Ex-vivo Perfusion"],
    crmSegment: "Innovator",
  },
  {
    id: 73,
    name: "Dr. Isabelle Renard",
    email: "i.renard@necker.fr",
    onekeyId: "OK-73643",
    specialty: "Cardiology",
    subSpecialty: "Heart Failure",
    affiliations: ["Necker-Enfants"],
    sap: "71283",
    isKol: false,
    leadScore: 37,
    engagementScore: 13,
    icpGrading: 20,
    interests: ["Chronic Heart Failure", "Remote Monitoring", "Diuretic Optimization"],
    crmSegment: "Laggard",
  },
  {
    id: 74,
    name: "Dr. Kofi Mensah",
    email: "k.mensah@barcelona.es",
    onekeyId: "OK-74756",
    specialty: "Interv. cardiology",
    subSpecialty: "Peripheral Vascular",
    affiliations: ["Barcelona"],
    sap: "Blank",
    isKol: false,
    leadScore: 73,
    engagementScore: 41,
    icpGrading: 49,
    interests: ["Venous Interventions", "DVT Thrombectomy", "Venous Stenting"],
    crmSegment: "Early Adopter",
  },
  {
    id: 75,
    name: "Dr. Natasha Ivanova",
    email: "n.ivanova@charite.de",
    onekeyId: "OK-75869",
    specialty: "Cardiac Surgery",
    subSpecialty: "Coronary Surgery",
    affiliations: ["Charité Berlin", "Singapore General"],
    sap: "79528",
    isKol: false,
    leadScore: 62,
    engagementScore: 29,
    icpGrading: 38,
    interests: ["Total Arterial Revascularization", "BIMA Grafting", "Hybrid CABG"],
    crmSegment: "Early Majority",
  },
  {
    id: 76,
    name: "Dr. Paulo Carvalho",
    email: "p.carvalho@johns.edu",
    onekeyId: "OK-76982",
    specialty: "Cardiology",
    subSpecialty: "Sports Cardiology",
    affiliations: ["Johns Hopkins"],
    sap: "Blank",
    isKol: false,
    leadScore: 28,
    engagementScore: 10,
    icpGrading: 16,
    interests: ["Athlete Heart", "Exercise ECG", "Return-to-Play Protocols"],
    crmSegment: "Laggard",
  },
  {
    id: 77,
    name: "Dr. Ayumi Tanaka",
    email: "a.tanaka@sgh.sg",
    onekeyId: "OK-77095",
    specialty: "Interv. cardiology",
    subSpecialty: null,
    affiliations: ["Singapore General", "Mayo Clinic"],
    sap: "87914",
    isKol: true,
    leadScore: 90,
    engagementScore: 69,
    icpGrading: 75,
    interests: ["Intravascular Lithotripsy", "OA-IVL", "Calcified Coronary Disease"],
    crmSegment: "Innovator",
  },
  {
    id: 78,
    name: "Dr. Benedikt Müller",
    email: "b.muller@charite.de",
    onekeyId: "OK-78208",
    specialty: "Cardiac Surgery",
    subSpecialty: "Minimally Invasive",
    affiliations: ["Charité Berlin"],
    sap: "65817",
    isKol: false,
    leadScore: 50,
    engagementScore: 20,
    icpGrading: 29,
    interests: ["Totally Endoscopic CABG", "Port-Access Surgery", "Robotic Assistance"],
    crmSegment: "Early Majority",
  },
  {
    id: 79,
    name: "Dr. Claire Beaumont",
    email: "c.beaumont@necker.fr",
    onekeyId: "OK-79321",
    specialty: "Cardiology",
    subSpecialty: "Cardiac Imaging",
    affiliations: ["Necker-Enfants", "Barcelona"],
    sap: "80645",
    isKol: false,
    leadScore: 44,
    engagementScore: 17,
    icpGrading: 25,
    interests: ["Speckle Tracking", "Diastology", "Heart Failure Imaging"],
    crmSegment: "Late Majority",
  },
  {
    id: 80,
    name: "Dr. Amir Qureshi",
    email: "a.qureshi@mayo.edu",
    onekeyId: "OK-80434",
    specialty: "Interv. cardiology",
    subSpecialty: "Complex PCI",
    affiliations: ["Mayo Clinic", "Cleveland Clinic"],
    sap: "95162",
    isKol: true,
    leadScore: 97,
    engagementScore: 82,
    icpGrading: 87,
    interests: ["High-Risk PCI", "Hemodynamic Support", "Impella-Assisted PCI"],
    crmSegment: "Innovator",
  },
];

const priorityStyles = {
  Hot:  "bg-[#ffe4e6] text-[#be123c]",
  Warm: "bg-[#fef9c3] text-[#a16207]",
  Cold: "bg-[#cffafe] text-[#0e7490]",
};

// Funnel stage derived from lead score
function getFunnelStage(leadScore) {
  if (leadScore >= 80) return "SQL";
  if (leadScore >= 50) return "MQL";
  return "Lead";
}

const funnelStageStyles = {
  Lead: "bg-[#dbeafe] text-[#1d4ed8]",
  MQL:  "bg-[#e0e7ff] text-[#4338ca]",
  SQL:  "bg-[#ede9fe] text-[#6d28d9]",
};

const FUNNEL_STAGES = ["Lead", "MQL", "SQL"];

// Country derived from primary (first) affiliation
const affiliationCountries = {
  "Mayo Clinic": "USA",
  "Charité Berlin": "Germany",
  "Cleveland Clinic": "USA",
  "Singapore General": "Singapore",
  "Johns Hopkins": "USA",
  "Necker-Enfants": "France",
  "Barcelona": "Spain",
};

function getCountry(row) {
  const primary = row.affiliations?.[0];
  return affiliationCountries[primary] || "—";
}

const ALL_SPECIALTIES = [...new Set(hcpRows.map((r) => r.specialty))];
const ALL_AFFILIATIONS = Object.keys(affiliationHospitalIds);
const ALL_CRM_SEGMENTS = ["Innovator", "Early Adopter", "Early Majority", "Late Majority", "Laggard"];
const ALL_COUNTRIES = [...new Set(Object.values(affiliationCountries))].sort();
const ALL_PRODUCTS = [...new Set(hcpRows.flatMap((r) => r.interests || []))].sort();

/* ── Product-family score modifiers ─────────────────────────────── */
const FAMILY_ICP_OFFSETS = { cardiovascular: 0, structural: 8, ep: -5, hf: 3, vascular: -8, "cardiac-surgery": 5, all: 0 };
const FAMILY_ENG_MULT    = { cardiovascular: 1, structural: 1.1, ep: 0.9, hf: 1.05, vascular: 0.85, "cardiac-surgery": 0.95, all: 1 };

function getAffiliationIcp(baseIcp, affName, family = "all") {
  const h = affName.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);
  return Math.max(10, Math.min(99, baseIcp + ((h % 21) - 10) + (FAMILY_ICP_OFFSETS[family] ?? 0)));
}
function getFamilyEngScore(baseEng, family = "all") {
  return Math.max(0, Math.min(100, Math.round(baseEng * (FAMILY_ENG_MULT[family] ?? 1))));
}

function getClassification(id) { return id % 3 === 0 ? "Secondary" : "Primary"; }

const CRM_LABEL_MAP = {
  "Innovator":      ["Innovator", "Informed"],
  "Early Adopter":  ["Early Adopter", "Progressive"],
  "Early Majority": ["Early Majority", "Mainstream"],
  "Late Majority":  ["Late Majority", "Conservative"],
  "Laggard":        ["Laggard", "Traditional"],
};
function getCrmLabels(segment) { return CRM_LABEL_MAP[segment] ?? [segment]; }

/* ── HCP column definitions ─────────────────────────────────────── */
const HCP_COLUMN_DEFS = [
  { id: "onekeyId",        label: "OneKey ID",       sortKey: null,         rowspan: true  },
  { id: "name",            label: "HCP Name",         sortKey: "name",       rowspan: true  },
  { id: "email",           label: "Email",            sortKey: null,         rowspan: true  },
  { id: "specialty",       label: "Specialty",        sortKey: null,         rowspan: true  },
  { id: "country",         label: "Country",          sortKey: null,         rowspan: true  },
  { id: "affiliation",     label: "Affiliation",      sortKey: null,         rowspan: false },
  { id: "icpScore",        label: "ICP Score",        sortKey: "icp",        rowspan: false },
  { id: "engagementScore", label: "Engagement Score", sortKey: "engagement", rowspan: true  },
  { id: "priority",        label: "Priority",         sortKey: null,         rowspan: true  },
  { id: "kol",             label: "KOL",              sortKey: null,         rowspan: true  },
  { id: "funnel",          label: "Funnel",           sortKey: null,         rowspan: true  },
  { id: "crmSegment",      label: "CRM Segment",      sortKey: null,         rowspan: true  },
  { id: "classification",  label: "Classification",   sortKey: null,         rowspan: true  },
  { id: "interests",       label: "Interests",        sortKey: null,         rowspan: true  },
];
const HCP_DEFAULT_COL_ORDER = HCP_COLUMN_DEFS.map((c) => c.id);
const HCP_COL_BY_ID = Object.fromEntries(HCP_COLUMN_DEFS.map((c) => [c.id, c]));

const EMPTY_FILTERS = {
  priorities: [],
  specialties: [],
  affiliations: [],
  icpMin: "",
  icpMax: "",
  engMin: "",
  engMax: "",
  kolOnly: false,
  crmSegments: [],
  countries: [],
  products: [],
  funnelStages: [],
  classification: [],
};

// Each hospital lists which HCP ids are affiliated, so we can compute an aggregated score
const hospitalRows = [
  {
    id: 1,
    name: "Mayo Clinic",
    sales: "$34,822",
    marketShare: "12%",
    potential: "6,267,928.00",
    city: "Rochester",
    management: "Privato",
    sap: "10045821",
    hcpIds: [1, 6],
  },
  {
    id: 2,
    name: "Charit\u00e9 Berlin",
    sales: "$28,929",
    marketShare: "9%",
    potential: "5,276,276.00",
    city: "Cleveland",
    management: "Public",
    sap: "10038274",
    hcpIds: [2, 3],
  },
  {
    id: 3,
    name: "Cleveland clinic",
    sales: "$12,263",
    marketShare: "4%",
    potential: "4,286,186.00",
    city: "Baltimore",
    management: "Public",
    sap: "10061938",
    hcpIds: [4, 5],
  },
  {
    id: 4,
    name: "Singapore General",
    sales: "$35,728",
    marketShare: "15%",
    potential: "5,176,298.00",
    city: "Boston",
    management: "Privato",
    sap: "10072846",
    hcpIds: [2],
  },
  {
    id: 5,
    name: "Johns Hopkins",
    sales: "$14,028",
    marketShare: "10%",
    potential: "3,367,286.00",
    city: "Berlin",
    management: "Public",
    sap: "10053917",
    hcpIds: [3, 4],
  },
  {
    id: 6,
    name: "Necker-Enfants",
    sales: "$34,256",
    marketShare: "12%",
    potential: "1,273,201.00",
    city: "London",
    management: "Public",
    sap: "10029463",
    hcpIds: [1],
  },
  {
    id: 7,
    name: "Barcelona",
    sales: "$31,722",
    marketShare: "11%",
    potential: "2,227,028.00",
    city: "Barcelona",
    management: "Privato",
    sap: "10084752",
    hcpIds: [5, 6],
  },
  { id: 8,  name: "Massachusetts General",          sales: "$39,472", marketShare: "14%", potential: "6,892,451.00", city: "Boston",       management: "Public",  sap: "10091823", hcpIds: [3, 9]  },
  { id: 9,  name: "UCSF Medical Center",            sales: "$33,186", marketShare: "11%", potential: "5,448,293.00", city: "San Francisco", management: "Public",  sap: "10027364", hcpIds: [4, 12] },
  { id: 10, name: "Toronto General Hospital",       sales: "$27,654", marketShare: "9%",  potential: "4,823,017.00", city: "Toronto",       management: "Public",  sap: "10056182", hcpIds: [7, 15] },
  { id: 11, name: "Royal Melbourne Hospital",       sales: "$21,839", marketShare: "7%",  potential: "3,792,648.00", city: "Melbourne",     management: "Public",  sap: "10043729", hcpIds: [6, 18] },
  { id: 12, name: "St. Mary's Hospital",            sales: "$18,293", marketShare: "6%",  potential: "3,241,580.00", city: "London",        management: "Public",  sap: "10074852", hcpIds: [8, 20] },
  { id: 13, name: "Karolinska University Hospital", sales: "$36,712", marketShare: "13%", potential: "6,173,924.00", city: "Stockholm",     management: "Public",  sap: "10038471", hcpIds: [2, 22] },
  { id: 14, name: "Tokyo Medical University",       sales: "$29,381", marketShare: "10%", potential: "5,027,836.00", city: "Tokyo",         management: "Privato", sap: "10062917", hcpIds: [5, 25] },
  { id: 15, name: "Asan Medical Center",            sales: "$31,948", marketShare: "11%", potential: "5,682,103.00", city: "Seoul",         management: "Privato", sap: "10085634", hcpIds: [9, 28] },
  { id: 16, name: "AIIMS New Delhi",                sales: "$14,273", marketShare: "5%",  potential: "2,918,467.00", city: "New Delhi",     management: "Public",  sap: "10029481", hcpIds: [11, 30] },
  { id: 17, name: "Hospital Univ. La Paz",          sales: "$22,891", marketShare: "8%",  potential: "4,127,592.00", city: "Madrid",        management: "Public",  sap: "10071836", hcpIds: [13, 35] },
  { id: 18, name: "Policlinico di Milano",          sales: "$19,437", marketShare: "7%",  potential: "3,548,271.00", city: "Milan",         management: "Public",  sap: "10046293", hcpIds: [16, 38] },
  { id: 19, name: "Pitié-Salpêtrière",             sales: "$34,128", marketShare: "12%", potential: "5,938,402.00", city: "Paris",         management: "Public",  sap: "10083741", hcpIds: [1, 42]  },
  { id: 20, name: "UMC Utrecht",                   sales: "$26,583", marketShare: "9%",  potential: "4,673,819.00", city: "Utrecht",       management: "Public",  sap: "10057294", hcpIds: [14, 44] },
  { id: 21, name: "Rigshospitalet",                sales: "$30,847", marketShare: "10%", potential: "5,284,637.00", city: "Copenhagen",    management: "Public",  sap: "10034872", hcpIds: [17, 47] },
  { id: 22, name: "Oslo University Hospital",      sales: "$28,394", marketShare: "9%",  potential: "4,927,381.00", city: "Oslo",          management: "Public",  sap: "10062847", hcpIds: [19, 50] },
  { id: 23, name: "Helsinki University Hospital",  sales: "$23,719", marketShare: "8%",  potential: "4,283,926.00", city: "Helsinki",      management: "Public",  sap: "10078193", hcpIds: [21, 52] },
  { id: 24, name: "Vienna General Hospital",       sales: "$32,615", marketShare: "11%", potential: "5,719,284.00", city: "Vienna",        management: "Public",  sap: "10049283", hcpIds: [23, 55] },
  { id: 25, name: "University Hospital Zurich",    sales: "$37,284", marketShare: "13%", potential: "6,384,712.00", city: "Zurich",        management: "Public",  sap: "10091724", hcpIds: [24, 58] },
  { id: 26, name: "CHUV Lausanne",                 sales: "$35,192", marketShare: "12%", potential: "6,028,473.00", city: "Lausanne",      management: "Public",  sap: "10036482", hcpIds: [26, 60] },
  { id: 27, name: "Saint Luc University Clinics",  sales: "$20,847", marketShare: "7%",  potential: "3,748,291.00", city: "Brussels",      management: "Public",  sap: "10073629", hcpIds: [27, 62] },
  { id: 28, name: "Erasmus MC",                    sales: "$33,721", marketShare: "12%", potential: "5,893,017.00", city: "Rotterdam",     management: "Public",  sap: "10058274", hcpIds: [29, 64] },
  { id: 29, name: "HUG Geneva",                    sales: "$38,492", marketShare: "14%", potential: "6,748,293.00", city: "Geneva",        management: "Public",  sap: "10027483", hcpIds: [31, 67] },
  { id: 30, name: "Hospital das Clínicas",         sales: "$16,384", marketShare: "6%",  potential: "2,847,391.00", city: "São Paulo",     management: "Public",  sap: "10084739", hcpIds: [33, 70] },
  { id: 31, name: "Instituto Nacional de Cardiología", sales: "$12,847", marketShare: "4%", potential: "2,183,749.00", city: "Mexico City", management: "Public",  sap: "10063827", hcpIds: [34, 72] },
  { id: 32, name: "Fundación Valle del Lili",      sales: "$11,293", marketShare: "4%",  potential: "1,947,283.00", city: "Bogotá",        management: "Privato", sap: "10047291", hcpIds: [36, 74] },
  { id: 33, name: "Hospital Italiano",             sales: "$17,634", marketShare: "6%",  potential: "3,082,647.00", city: "Buenos Aires",  management: "Privato", sap: "10082947", hcpIds: [37, 76] },
  { id: 34, name: "Cairo University Hospitals",    sales: "$9,472",  marketShare: "3%",  potential: "1,628,394.00", city: "Cairo",         management: "Public",  sap: "10039284", hcpIds: [39, 78] },
  { id: 35, name: "Aga Khan Hospital Nairobi",     sales: "$8,937",  marketShare: "3%",  potential: "1,384,729.00", city: "Nairobi",       management: "Privato", sap: "10076291", hcpIds: [40, 80] },
  { id: 36, name: "Groote Schuur Hospital",        sales: "$10,284", marketShare: "4%",  potential: "1,849,273.00", city: "Cape Town",     management: "Public",  sap: "10053847", hcpIds: [41, 79] },
  { id: 37, name: "King Faisal Specialist",        sales: "$28,473", marketShare: "10%", potential: "4,928,374.00", city: "Riyadh",        management: "Public",  sap: "10069283", hcpIds: [43, 77] },
  { id: 38, name: "Cleveland Medical Abu Dhabi",   sales: "$34,728", marketShare: "12%", potential: "5,847,293.00", city: "Abu Dhabi",     management: "Privato", sap: "10037284", hcpIds: [45, 75] },
  { id: 39, name: "Bumrungrad International",      sales: "$29,183", marketShare: "10%", potential: "5,028,473.00", city: "Bangkok",       management: "Privato", sap: "10094827", hcpIds: [46, 73] },
  { id: 40, name: "Gleneagles Hospital",           sales: "$31,274", marketShare: "11%", potential: "5,472,839.00", city: "Singapore",     management: "Privato", sap: "10061923", hcpIds: [48, 71] },
  { id: 41, name: "Prince of Wales Hospital",      sales: "$26,847", marketShare: "9%",  potential: "4,728,391.00", city: "Hong Kong",     management: "Public",  sap: "10048273", hcpIds: [49, 69] },
  { id: 42, name: "Peking Union Medical College",  sales: "$33,482", marketShare: "12%", potential: "5,938,274.00", city: "Beijing",       management: "Public",  sap: "10072839", hcpIds: [51, 68] },
  { id: 43, name: "Ruijin Hospital",               sales: "$27,391", marketShare: "9%",  potential: "4,827,391.00", city: "Shanghai",      management: "Public",  sap: "10037482", hcpIds: [53, 66] },
  { id: 44, name: "St. Vincent's Hospital",        sales: "$19,284", marketShare: "7%",  potential: "3,427,391.00", city: "Dublin",        management: "Public",  sap: "10083724", hcpIds: [54, 65] },
  { id: 45, name: "Western General Hospital",      sales: "$17,847", marketShare: "6%",  potential: "3,182,749.00", city: "Edinburgh",     management: "Public",  sap: "10046927", hcpIds: [56, 63] },
  { id: 46, name: "Hospital de Santa Maria",       sales: "$15,293", marketShare: "5%",  potential: "2,748,392.00", city: "Lisbon",        management: "Public",  sap: "10092837", hcpIds: [57, 61] },
  { id: 47, name: "Semmelweis University Hospital",sales: "$14,728", marketShare: "5%",  potential: "2,584,729.00", city: "Budapest",      management: "Public",  sap: "10058294", hcpIds: [59, 61] },
  { id: 48, name: "Motol University Hospital",     sales: "$13,847", marketShare: "5%",  potential: "2,384,729.00", city: "Prague",        management: "Public",  sap: "10037491", hcpIds: [32, 62] },
  { id: 49, name: "Medical University Warsaw",     sales: "$12,384", marketShare: "4%",  potential: "2,184,729.00", city: "Warsaw",        management: "Public",  sap: "10074829", hcpIds: [28, 63] },
  { id: 50, name: "Evangelismos Hospital",         sales: "$11,847", marketShare: "4%",  potential: "2,047,382.00", city: "Athens",        management: "Public",  sap: "10063748", hcpIds: [10, 65] },
  { id: 51, name: "Hacettepe University Hospital", sales: "$16,473", marketShare: "6%",  potential: "2,847,382.00", city: "Ankara",        management: "Public",  sap: "10092748", hcpIds: [20, 66] },
  { id: 52, name: "Sheba Medical Center",          sales: "$32,847", marketShare: "11%", potential: "5,728,374.00", city: "Tel Aviv",      management: "Public",  sap: "10047382", hcpIds: [15, 68] },
  { id: 53, name: "Auckland City Hospital",        sales: "$18,372", marketShare: "6%",  potential: "3,182,748.00", city: "Auckland",      management: "Public",  sap: "10083927", hcpIds: [25, 70] },
  { id: 54, name: "Vancouver General Hospital",    sales: "$23,847", marketShare: "8%",  potential: "4,183,728.00", city: "Vancouver",     management: "Public",  sap: "10074831", hcpIds: [30, 72] },
  { id: 55, name: "University of Alberta Hospital",sales: "$19,384", marketShare: "7%",  potential: "3,428,374.00", city: "Edmonton",      management: "Public",  sap: "10063829", hcpIds: [35, 74] },
  { id: 56, name: "Hôtel-Dieu de France",         sales: "$15,728", marketShare: "5%",  potential: "2,748,392.00", city: "Beirut",        management: "Privato", sap: "10038271", hcpIds: [40, 76] },
  { id: 57, name: "Rashid Hospital",               sales: "$22,483", marketShare: "8%",  potential: "3,928,374.00", city: "Dubai",         management: "Public",  sap: "10092831", hcpIds: [45, 78] },
];

/* ── Anonymous lead signals data ──────────────────────────────────── */

// ── Pharmacist data ───────────────────────────────────────────────
const pharmacistRows = [
  {
    id: 1, licenseId: "PH-20341", title: "PharmD", name: "Sophie Laurent",
    type: "Clinical", specialtyArea: "Cardiovascular", role: "Head Pharmacist",
    academicAffiliation: "Boston University School of Pharmacy",
    associations: ["APhA", "ACCP"],
    pharmacyName: "Mass General Pharmacy", chainAffiliation: "Independent",
    city: "Boston", region: "MA", zip: "02114", catchment: "Urban",
    staffCount: 8, patientVolume: "High traffic",
    topTherapeuticAreas: ["Cardiovascular", "Anticoagulants"],
    topBrands: ["Eliquis", "Xarelto"],
    genericRatio: 68, substitution: "Selective", avgRxPerMonth: 420,
    repContact: "Alice Martin", visitFrequency: "Monthly",
    preferredChannel: "In-person", sentiment: "Champion",
    kolScore: 78, leadScore: 78, reimbursement: "Mixed",
  },
  {
    id: 2, licenseId: "PH-18204", title: "Dr.", name: "Marco Ferretti",
    type: "Hospital", specialtyArea: "Oncology", role: "Employee",
    academicAffiliation: "Università Vita-Salute San Raffaele",
    associations: ["SIFO", "FIP"],
    pharmacyName: "San Raffaele Hospital Pharmacy", chainAffiliation: "Independent",
    city: "Milan", region: "Lombardy", zip: "20132", catchment: "Urban",
    staffCount: 24, patientVolume: "High traffic",
    topTherapeuticAreas: ["Oncology", "Biologics"],
    topBrands: ["Herceptin", "Keytruda"],
    genericRatio: 35, substitution: "No", avgRxPerMonth: 310,
    repContact: "Luca Rossi", visitFrequency: "Bi-weekly",
    preferredChannel: "Email", sentiment: "Warm",
    kolScore: 64, leadScore: 64, reimbursement: "Public",
  },
  {
    id: 3, licenseId: "PH-31122", title: "PharmD", name: "Emma Wilson",
    type: "Specialty", specialtyArea: "Rare Diseases", role: "Owner",
    academicAffiliation: "Northwestern University Feinberg School of Medicine",
    associations: ["APhA", "NASP", "FIP"],
    pharmacyName: "Wilson Specialty Pharmacy", chainAffiliation: "Independent",
    city: "Chicago", region: "IL", zip: "60611", catchment: "Urban",
    staffCount: 5, patientVolume: "Boutique",
    topTherapeuticAreas: ["Rare Diseases", "Gene Therapy", "Immunology"],
    topBrands: ["Zolgensma", "Spinraza"],
    genericRatio: 10, substitution: "No", avgRxPerMonth: 85,
    repContact: "Sarah Cole", visitFrequency: "Weekly",
    preferredChannel: "In-person", sentiment: "Champion",
    kolScore: 91, leadScore: 91, reimbursement: "Private",
  },
  {
    id: 4, licenseId: "PH-22789", title: "Lic. Farm.", name: "Carlos Mendoza",
    type: "Community", specialtyArea: "Dermatology", role: "Owner",
    academicAffiliation: null,
    associations: ["COFB"],
    pharmacyName: "Farmacia Del Pueblo", chainAffiliation: "Independent",
    city: "Barcelona", region: "Catalonia", zip: "08001", catchment: "Urban",
    staffCount: 3, patientVolume: "Moderate",
    topTherapeuticAreas: ["Dermatology", "OTC"],
    topBrands: ["Epiduo", "Differin"],
    genericRatio: 74, substitution: "Yes", avgRxPerMonth: 260,
    repContact: "Jordi Mas", visitFrequency: "Quarterly",
    preferredChannel: "Phone", sentiment: "Cold",
    kolScore: 45, leadScore: 45, reimbursement: "Mixed",
  },
  {
    id: 5, licenseId: "PH-40156", title: "PharmD", name: "Yuki Tanaka",
    type: "Hospital", specialtyArea: "Immunosuppression", role: "Employee",
    academicAffiliation: "University of Tokyo",
    associations: ["JPA", "JST"],
    pharmacyName: "Tokyo Medical Centre Pharmacy", chainAffiliation: "Independent",
    city: "Tokyo", region: "Kanto", zip: "113-8655", catchment: "Urban",
    staffCount: 18, patientVolume: "High traffic",
    topTherapeuticAreas: ["Immunosuppressants", "Transplant", "Nephrology"],
    topBrands: ["Prograf", "CellCept"],
    genericRatio: 42, substitution: "Selective", avgRxPerMonth: 380,
    repContact: "Hiroshi Kato", visitFrequency: "Monthly",
    preferredChannel: "Email", sentiment: "Warm",
    kolScore: 73, leadScore: 73, reimbursement: "Public",
  },
  {
    id: 6, licenseId: "PH-15880", title: "Dr.", name: "Isabelle Moreau",
    type: "Hospital", specialtyArea: "Haematology", role: "Head Pharmacist",
    academicAffiliation: "Université Paris Cité",
    associations: ["SFPC", "ESCP", "FIP"],
    pharmacyName: "AP-HP Pharmacie Centrale", chainAffiliation: "Independent",
    city: "Paris", region: "Île-de-France", zip: "75014", catchment: "Urban",
    staffCount: 32, patientVolume: "High traffic",
    topTherapeuticAreas: ["Haematology", "Coagulation", "Oncology"],
    topBrands: ["Revlimid", "Darzalex"],
    genericRatio: 28, substitution: "No", avgRxPerMonth: 510,
    repContact: "Marie Dupont", visitFrequency: "Bi-weekly",
    preferredChannel: "In-person", sentiment: "Champion",
    kolScore: 85, leadScore: 85, reimbursement: "Public",
  },
  {
    id: 7, licenseId: "PH-29034", title: "MPharm", name: "James Okafor",
    type: "Community", specialtyArea: "Cardiovascular", role: "Employee",
    academicAffiliation: null,
    associations: ["RPS"],
    pharmacyName: "Boots Pharmacy – Canary Wharf", chainAffiliation: "Boots UK",
    city: "London", region: "England", zip: "E14 5AB", catchment: "Urban",
    staffCount: 6, patientVolume: "High traffic",
    topTherapeuticAreas: ["Cardiovascular", "Hypertension", "Statins"],
    topBrands: ["Lipitor", "Crestor"],
    genericRatio: 82, substitution: "Yes", avgRxPerMonth: 610,
    repContact: "Fiona Clarke", visitFrequency: "Monthly",
    preferredChannel: "Digital", sentiment: "Warm",
    kolScore: 55, leadScore: 55, reimbursement: "Mixed",
  },
  {
    id: 8, licenseId: "PH-38210", title: "PharmD", name: "Priya Sharma",
    type: "Specialty", specialtyArea: "Oncology", role: "Head Pharmacist",
    academicAffiliation: "Homi Bhabha National Institute",
    associations: ["IPA", "FIP", "ISOPP"],
    pharmacyName: "Tata Memorial Pharmacy", chainAffiliation: "Independent",
    city: "Mumbai", region: "Maharashtra", zip: "400012", catchment: "Urban",
    staffCount: 14, patientVolume: "High traffic",
    topTherapeuticAreas: ["Chemotherapy", "Targeted Therapy", "Immunotherapy"],
    topBrands: ["Keytruda", "Opdivo", "Ibrance"],
    genericRatio: 22, substitution: "No", avgRxPerMonth: 190,
    repContact: "Rajiv Nair", visitFrequency: "Weekly",
    preferredChannel: "In-person", sentiment: "Champion",
    kolScore: 94, leadScore: 94, reimbursement: "Private",
  },
  {
    id: 9, licenseId: "PH-11560", title: "Apotekare", name: "Lars Eriksson",
    type: "Community", specialtyArea: "General", role: "Owner",
    academicAffiliation: null,
    associations: ["Sveriges Farmaceuter"],
    pharmacyName: "Apotek Hjärtat – Södermalm", chainAffiliation: "Apotek Hjärtat",
    city: "Stockholm", region: "Stockholm County", zip: "118 20", catchment: "Urban",
    staffCount: 4, patientVolume: "Moderate",
    topTherapeuticAreas: ["General", "OTC", "Vitamins"],
    topBrands: ["Alvedon", "Ipren"],
    genericRatio: 79, substitution: "Yes", avgRxPerMonth: 230,
    repContact: "Anna Berg", visitFrequency: "Quarterly",
    preferredChannel: "Email", sentiment: "Cold",
    kolScore: 42, leadScore: 42, reimbursement: "Public",
  },
  {
    id: 10, licenseId: "PH-26701", title: "Dr.", name: "Ana García",
    type: "Clinical", specialtyArea: "Cardiovascular", role: "Employee",
    academicAffiliation: "Universidad Autónoma de Madrid",
    associations: ["SEFH", "EAHP"],
    pharmacyName: "Hospital La Paz Farmacia", chainAffiliation: "Independent",
    city: "Madrid", region: "Community of Madrid", zip: "28046", catchment: "Urban",
    staffCount: 20, patientVolume: "High traffic",
    topTherapeuticAreas: ["Cardiovascular", "Anticoagulants", "Heart Failure"],
    topBrands: ["Entresto", "Eliquis"],
    genericRatio: 55, substitution: "Selective", avgRxPerMonth: 450,
    repContact: "Pablo Torres", visitFrequency: "Monthly",
    preferredChannel: "In-person", sentiment: "Warm",
    kolScore: 69, leadScore: 69, reimbursement: "Public",
  },
  {
    id: 11, licenseId: "PH-44801", title: "B.Pharm", name: "Nguyen Van Minh",
    type: "Hospital", specialtyArea: "Infectious Disease", role: "Employee",
    academicAffiliation: null,
    associations: ["VPA"],
    pharmacyName: "Bach Mai Hospital Pharmacy", chainAffiliation: "Independent",
    city: "Hanoi", region: "Red River Delta", zip: "100000", catchment: "Urban",
    staffCount: 22, patientVolume: "High traffic",
    topTherapeuticAreas: ["Antibiotics", "Infectious Disease", "Antivirals"],
    topBrands: ["Augmentin", "Ciprofloxacin"],
    genericRatio: 88, substitution: "Yes", avgRxPerMonth: 720,
    repContact: "Tran Thi Lan", visitFrequency: "Monthly",
    preferredChannel: "Phone", sentiment: "Cold",
    kolScore: 60, leadScore: 60, reimbursement: "Public",
  },
  {
    id: 12, licenseId: "PH-33190", title: "PharmD", name: "Fatima Al-Rashid",
    type: "Specialty", specialtyArea: "Oncology", role: "Head Pharmacist",
    academicAffiliation: "King Saud University",
    associations: ["SCCP", "ISOPP", "FIP"],
    pharmacyName: "King Faisal Hospital Pharmacy", chainAffiliation: "Independent",
    city: "Riyadh", region: "Riyadh Province", zip: "11564", catchment: "Urban",
    staffCount: 16, patientVolume: "High traffic",
    topTherapeuticAreas: ["Oncology", "Biologics", "Immunotherapy"],
    topBrands: ["Herceptin", "Avastin"],
    genericRatio: 18, substitution: "No", avgRxPerMonth: 220,
    repContact: "Omar Al-Farsi", visitFrequency: "Bi-weekly",
    preferredChannel: "In-person", sentiment: "Champion",
    kolScore: 82, leadScore: 82, reimbursement: "Mixed",
  },
  {
    id: 13, licenseId: "PH-17435", title: "PharmD", name: "David Park",
    type: "Community", specialtyArea: "Pain Management", role: "Employee",
    academicAffiliation: null,
    associations: ["APhA"],
    pharmacyName: "Rite Aid – West LA", chainAffiliation: "Rite Aid",
    city: "Los Angeles", region: "CA", zip: "90024", catchment: "Suburban",
    staffCount: 7, patientVolume: "High traffic",
    topTherapeuticAreas: ["Pain Management", "OTC", "Diabetes"],
    topBrands: ["Celebrex", "Lyrica"],
    genericRatio: 76, substitution: "Yes", avgRxPerMonth: 540,
    repContact: "Kevin Chen", visitFrequency: "Monthly",
    preferredChannel: "Digital", sentiment: "Warm",
    kolScore: 48, leadScore: 48, reimbursement: "Mixed",
  },
  {
    id: 14, licenseId: "PH-21980", title: "Dr.", name: "Clara Becker",
    type: "Hospital", specialtyArea: "Neurology", role: "Employee",
    academicAffiliation: "Charité – Universitätsmedizin Berlin",
    associations: ["ADKA", "ESCP"],
    pharmacyName: "Charité Apotheke", chainAffiliation: "Independent",
    city: "Berlin", region: "Berlin", zip: "10117", catchment: "Urban",
    staffCount: 28, patientVolume: "High traffic",
    topTherapeuticAreas: ["Neurology", "Epilepsy", "MS"],
    topBrands: ["Tecfidera", "Tysabri"],
    genericRatio: 44, substitution: "Selective", avgRxPerMonth: 390,
    repContact: "Hans Weber", visitFrequency: "Bi-weekly",
    preferredChannel: "Email", sentiment: "Warm",
    kolScore: 77, leadScore: 77, reimbursement: "Public",
  },
  {
    id: 15, licenseId: "PH-35620", title: "PharmD", name: "Rafael Costa",
    type: "Clinical", specialtyArea: "Infectious Disease", role: "Head Pharmacist",
    academicAffiliation: "Universidade de São Paulo",
    associations: ["SBRAFH", "FIP"],
    pharmacyName: "Hospital das Clínicas Farmácia", chainAffiliation: "Independent",
    city: "São Paulo", region: "São Paulo State", zip: "05403-000", catchment: "Urban",
    staffCount: 19, patientVolume: "High traffic",
    topTherapeuticAreas: ["Infectious Disease", "Antivirals", "HIV"],
    topBrands: ["Biktarvy", "Descovy"],
    genericRatio: 52, substitution: "Selective", avgRxPerMonth: 340,
    repContact: "Camila Souza", visitFrequency: "Monthly",
    preferredChannel: "Email", sentiment: "Champion",
    kolScore: 89, leadScore: 89, reimbursement: "Mixed",
  },
  {
    id: 16, licenseId: "PH-48230", title: "PharmD", name: "Mei Lin Zhang",
    type: "Specialty", specialtyArea: "Oncology", role: "Head Pharmacist",
    academicAffiliation: "Peking Union Medical College",
    associations: ["CSP", "CSCO", "FIP"],
    pharmacyName: "PUMCH Pharmacy", chainAffiliation: "Independent",
    city: "Beijing", region: "Beijing Municipality", zip: "100730", catchment: "Urban",
    staffCount: 35, patientVolume: "High traffic",
    topTherapeuticAreas: ["Chemotherapy", "CAR-T Therapy", "Targeted Therapy"],
    topBrands: ["Gleevec", "Tagrisso", "Yescarta"],
    genericRatio: 15, substitution: "No", avgRxPerMonth: 280,
    repContact: "Wei Liu", visitFrequency: "Weekly",
    preferredChannel: "In-person", sentiment: "Champion",
    kolScore: 96, leadScore: 96, reimbursement: "Mixed",
  },
  {
    id: 17, licenseId: "PH-13740", title: "Apotheker", name: "Thomas Müller",
    type: "Community", specialtyArea: "Diabetes", role: "Owner",
    academicAffiliation: null,
    associations: ["ABDA", "DAV"],
    pharmacyName: "Müller Apotheke", chainAffiliation: "Independent",
    city: "Munich", region: "Bavaria", zip: "80333", catchment: "Urban",
    staffCount: 5, patientVolume: "Moderate",
    topTherapeuticAreas: ["Diabetes", "Statins", "Hypertension"],
    topBrands: ["Metformin", "Jardiance"],
    genericRatio: 71, substitution: "Yes", avgRxPerMonth: 340,
    repContact: "Klaus Schmidt", visitFrequency: "Quarterly",
    preferredChannel: "In-person", sentiment: "Warm",
    kolScore: 53, leadScore: 53, reimbursement: "Public",
  },
  {
    id: 18, licenseId: "PH-30015", title: "PharmD", name: "Amira Hassan",
    type: "Clinical", specialtyArea: "Cardiovascular", role: "Employee",
    academicAffiliation: "Cairo University Faculty of Pharmacy",
    associations: ["EPS", "FIP"],
    pharmacyName: "Cairo University Hospital Pharmacy", chainAffiliation: "Independent",
    city: "Cairo", region: "Cairo Governorate", zip: "12613", catchment: "Urban",
    staffCount: 15, patientVolume: "High traffic",
    topTherapeuticAreas: ["Cardiovascular", "Hypertension", "Diabetes"],
    topBrands: ["Amlovasc", "Glucophage"],
    genericRatio: 80, substitution: "Yes", avgRxPerMonth: 580,
    repContact: "Mohamed Salah", visitFrequency: "Monthly",
    preferredChannel: "Phone", sentiment: "Warm",
    kolScore: 67, leadScore: 67, reimbursement: "Public",
  },
  {
    id: 19, licenseId: "PH-22456", title: "PharmD", name: "Olivia Thompson",
    type: "Specialty", specialtyArea: "Rare Diseases", role: "Owner",
    academicAffiliation: "University of Minnesota College of Pharmacy",
    associations: ["APhA", "NASP", "NORD"],
    pharmacyName: "Mayo Clinic Specialty Pharmacy", chainAffiliation: "Independent",
    city: "Rochester", region: "MN", zip: "55905", catchment: "Suburban",
    staffCount: 11, patientVolume: "Boutique",
    topTherapeuticAreas: ["Rare Diseases", "Enzyme Therapy", "Haematology"],
    topBrands: ["Cerezyme", "Naglazyme"],
    genericRatio: 8, substitution: "No", avgRxPerMonth: 70,
    repContact: "Laura Kim", visitFrequency: "Weekly",
    preferredChannel: "In-person", sentiment: "Champion",
    kolScore: 83, leadScore: 83, reimbursement: "Private",
  },
  {
    id: 20, licenseId: "PH-41700", title: "PharmD", name: "Kenji Watanabe",
    type: "Hospital", specialtyArea: "Cardiovascular", role: "Employee",
    academicAffiliation: "Osaka University Graduate School of Medicine",
    associations: ["JPA", "JSC"],
    pharmacyName: "Osaka Medical Centre Pharmacy", chainAffiliation: "Independent",
    city: "Osaka", region: "Kansai", zip: "565-0871", catchment: "Urban",
    staffCount: 21, patientVolume: "High traffic",
    topTherapeuticAreas: ["Cardiovascular", "Beta-Blockers", "Antiplatelet"],
    topBrands: ["Brilinta", "Plavix"],
    genericRatio: 60, substitution: "Selective", avgRxPerMonth: 410,
    repContact: "Akiko Yamamoto", visitFrequency: "Monthly",
    preferredChannel: "Email", sentiment: "Warm",
    kolScore: 72, leadScore: 72, reimbursement: "Public",
  },
];

// ── Pharmacys (pharmaceutical companies) data ─────────────────────
const pharmaRows = [
  {
    id: 1, identityId: "COMP-001",
    legalName: "Pfizer Inc.", brandName: "Pfizer", hqLocation: "New York, NY · US",
    companyType: "Big Pharma", headcount: "83,000", revenueTier: ">$50B", marketCap: "$156B",
    publiclyTraded: true, ticker: "PFE",
    parentCompany: null, subsidiaries: ["Pfizer CentreOne", "Meridian Medical"],
    marketedProducts: [{ ta: "Oncology", products: ["Ibrance", "Xtandi"] }, { ta: "Vaccines", products: ["Prevnar 20", "Comirnaty"] }, { ta: "Rare Disease", products: ["Vyndamax"] }],
    otcRxSplit: "12% OTC / 88% Rx",
    biosimilarsPortfolio: ["Inflectra", "Retacrit", "Zirabev"],
    marketShareByTA: [{ ta: "Vaccines", share: "28%" }, { ta: "Oncology", share: "9%" }],
    competitivePositioning: "Leader",
    keyGeographies: ["US", "EU", "Japan", "China"],
    budgetTier: "Tier 1",
    keyChannels: ["Rep visits", "Congresses", "Digital", "MSL"],
    publicationActivity: "High", mslPresence: "Global", kolNetworkStrength: "Strong",
    targetHcpSegments: ["Oncologists", "Cardiologists", "GPs", "Pharmacists"],
    engagementModel: "Field-first",
  },
  {
    id: 2, identityId: "COMP-002",
    legalName: "Roche Holding AG", brandName: "Roche", hqLocation: "Basel · Switzerland",
    companyType: "Big Pharma", headcount: "101,000", revenueTier: ">$50B", marketCap: "$210B",
    publiclyTraded: true, ticker: "ROG",
    parentCompany: null, subsidiaries: ["Genentech", "Chugai Pharmaceutical"],
    marketedProducts: [{ ta: "Oncology", products: ["Herceptin", "Avastin", "Tecentriq"] }, { ta: "Neurology", products: ["Ocrevus", "Hemlibra"] }],
    otcRxSplit: "0% OTC / 100% Rx",
    biosimilarsPortfolio: [],
    marketShareByTA: [{ ta: "Oncology", share: "18%" }, { ta: "Neurology", share: "22%" }],
    competitivePositioning: "Leader",
    keyGeographies: ["US", "EU", "Japan"],
    budgetTier: "Tier 1",
    keyChannels: ["MSL", "Congresses", "Rep visits", "Publications"],
    publicationActivity: "High", mslPresence: "Global", kolNetworkStrength: "Strong",
    targetHcpSegments: ["Oncologists", "Neurologists", "Haematologists"],
    engagementModel: "Field-first",
  },
  {
    id: 3, identityId: "COMP-003",
    legalName: "Novartis AG", brandName: "Novartis", hqLocation: "Basel · Switzerland",
    companyType: "Big Pharma", headcount: "108,000", revenueTier: ">$50B", marketCap: "$185B",
    publiclyTraded: true, ticker: "NOVN",
    parentCompany: null, subsidiaries: ["Advanced Accelerator Applications"],
    marketedProducts: [{ ta: "Cardiovascular", products: ["Entresto", "Leqvio"] }, { ta: "Oncology", products: ["Kisqali", "Kymriah"] }, { ta: "Immunology", products: ["Cosentyx"] }],
    otcRxSplit: "0% OTC / 100% Rx",
    biosimilarsPortfolio: [],
    marketShareByTA: [{ ta: "Cardiovascular", share: "14%" }, { ta: "Immunology", share: "11%" }],
    competitivePositioning: "Leader",
    keyGeographies: ["US", "EU", "China", "Japan"],
    budgetTier: "Tier 1",
    keyChannels: ["Rep visits", "Digital", "MSL", "Congresses"],
    publicationActivity: "High", mslPresence: "Global", kolNetworkStrength: "Strong",
    targetHcpSegments: ["Cardiologists", "Oncologists", "Rheumatologists"],
    engagementModel: "Balanced",
  },
  {
    id: 4, identityId: "COMP-004",
    legalName: "AstraZeneca PLC", brandName: "AstraZeneca", hqLocation: "Cambridge · UK",
    companyType: "Big Pharma", headcount: "89,000", revenueTier: ">$40B", marketCap: "$230B",
    publiclyTraded: true, ticker: "AZN",
    parentCompany: null, subsidiaries: ["Alexion Pharmaceuticals", "Rare Disease Therapeutics"],
    marketedProducts: [{ ta: "Oncology", products: ["Tagrisso", "Imfinzi", "Lynparza"] }, { ta: "Cardiovascular", products: ["Farxiga", "Brilinta"] }, { ta: "Respiratory", products: ["Symbicort", "Breztri"] }],
    otcRxSplit: "0% OTC / 100% Rx",
    biosimilarsPortfolio: [],
    marketShareByTA: [{ ta: "Oncology", share: "14%" }, { ta: "Respiratory", share: "19%" }],
    competitivePositioning: "Leader",
    keyGeographies: ["US", "EU", "China", "Emerging Markets"],
    budgetTier: "Tier 1",
    keyChannels: ["Rep visits", "Digital", "MSL", "Events"],
    publicationActivity: "High", mslPresence: "Global", kolNetworkStrength: "Strong",
    targetHcpSegments: ["Oncologists", "Cardiologists", "Pulmonologists"],
    engagementModel: "Balanced",
  },
  {
    id: 5, identityId: "COMP-005",
    legalName: "Sanofi S.A.", brandName: "Sanofi", hqLocation: "Paris · France",
    companyType: "Big Pharma", headcount: "91,000", revenueTier: ">$40B", marketCap: "$120B",
    publiclyTraded: true, ticker: "SAN",
    parentCompany: null, subsidiaries: ["Genzyme", "Ablynx"],
    marketedProducts: [{ ta: "Immunology", products: ["Dupixent", "Kevzara"] }, { ta: "Rare Disease", products: ["Cerdelga", "Aldurazyme"] }, { ta: "Vaccines", products: ["Fluzone", "Shingrix"] }],
    otcRxSplit: "8% OTC / 92% Rx",
    biosimilarsPortfolio: ["Praluent biosimilar"],
    marketShareByTA: [{ ta: "Immunology", share: "16%" }, { ta: "Rare Disease", share: "21%" }],
    competitivePositioning: "Leader",
    keyGeographies: ["EU", "US", "Emerging Markets"],
    budgetTier: "Tier 1",
    keyChannels: ["Rep visits", "MSL", "Digital", "Congresses"],
    publicationActivity: "High", mslPresence: "Global", kolNetworkStrength: "Strong",
    targetHcpSegments: ["Allergists", "Rheumatologists", "Dermatologists"],
    engagementModel: "Field-first",
  },
  {
    id: 6, identityId: "COMP-006",
    legalName: "Bristol Myers Squibb Co.", brandName: "BMS", hqLocation: "New York, NY · US",
    companyType: "Big Pharma", headcount: "34,000", revenueTier: ">$40B", marketCap: "$140B",
    publiclyTraded: true, ticker: "BMY",
    parentCompany: null, subsidiaries: ["Celgene", "MyoKardia"],
    marketedProducts: [{ ta: "Oncology", products: ["Opdivo", "Revlimid", "Breyanzi"] }, { ta: "Cardiovascular", products: ["Eliquis", "Camzyos"] }],
    otcRxSplit: "0% OTC / 100% Rx",
    biosimilarsPortfolio: [],
    marketShareByTA: [{ ta: "Oncology", share: "13%" }, { ta: "Cardiovascular", share: "18%" }],
    competitivePositioning: "Leader",
    keyGeographies: ["US", "EU", "Japan"],
    budgetTier: "Tier 1",
    keyChannels: ["Rep visits", "MSL", "Congresses", "Publications"],
    publicationActivity: "High", mslPresence: "Global", kolNetworkStrength: "Strong",
    targetHcpSegments: ["Oncologists", "Haematologists", "Cardiologists"],
    engagementModel: "Field-first",
  },
  {
    id: 7, identityId: "COMP-007",
    legalName: "Eli Lilly and Company", brandName: "Lilly", hqLocation: "Indianapolis, IN · US",
    companyType: "Big Pharma", headcount: "43,000", revenueTier: ">$30B", marketCap: "$750B",
    publiclyTraded: true, ticker: "LLY",
    parentCompany: null, subsidiaries: ["Lilly Research Labs"],
    marketedProducts: [{ ta: "Diabetes & Obesity", products: ["Mounjaro", "Zepbound", "Trulicity"] }, { ta: "Oncology", products: ["Verzenio"] }, { ta: "Immunology", products: ["Taltz", "Olumiant"] }],
    otcRxSplit: "0% OTC / 100% Rx",
    biosimilarsPortfolio: ["Rezvoglar", "Lyumjev biosimilar"],
    marketShareByTA: [{ ta: "Diabetes & Obesity", share: "24%" }, { ta: "Immunology", share: "9%" }],
    competitivePositioning: "Leader",
    keyGeographies: ["US", "EU", "Japan", "China"],
    budgetTier: "Tier 1",
    keyChannels: ["Digital", "Rep visits", "MSL", "Events"],
    publicationActivity: "High", mslPresence: "Global", kolNetworkStrength: "Strong",
    targetHcpSegments: ["Endocrinologists", "GPs", "Oncologists"],
    engagementModel: "Digital-first",
  },
  {
    id: 8, identityId: "COMP-008",
    legalName: "Amgen Inc.", brandName: "Amgen", hqLocation: "Thousand Oaks, CA · US",
    companyType: "Biotech", headcount: "25,000", revenueTier: ">$25B", marketCap: "$155B",
    publiclyTraded: true, ticker: "AMGN",
    parentCompany: null, subsidiaries: ["deCODE genetics", "BioVex"],
    marketedProducts: [{ ta: "Oncology", products: ["Kyprolis", "Lumakras", "Blincyto"] }, { ta: "Cardiovascular", products: ["Repatha"] }, { ta: "Inflammation", products: ["Enbrel", "Otezla"] }],
    otcRxSplit: "0% OTC / 100% Rx",
    biosimilarsPortfolio: ["Amjevita", "Riabni", "Mvasi", "Kanjinti"],
    marketShareByTA: [{ ta: "Oncology", share: "8%" }, { ta: "Cardiovascular", share: "11%" }],
    competitivePositioning: "Leader",
    keyGeographies: ["US", "EU", "Japan"],
    budgetTier: "Tier 1",
    keyChannels: ["MSL", "Congresses", "Rep visits", "Digital"],
    publicationActivity: "High", mslPresence: "Global", kolNetworkStrength: "Strong",
    targetHcpSegments: ["Oncologists", "Cardiologists", "Rheumatologists"],
    engagementModel: "Balanced",
  },
  {
    id: 9, identityId: "COMP-009",
    legalName: "Gilead Sciences Inc.", brandName: "Gilead", hqLocation: "Foster City, CA · US",
    companyType: "Biotech", headcount: "17,000", revenueTier: ">$20B", marketCap: "$88B",
    publiclyTraded: true, ticker: "GILD",
    parentCompany: null, subsidiaries: ["Kite Pharma", "MiroBio"],
    marketedProducts: [{ ta: "HIV", products: ["Biktarvy", "Descovy", "Sunlenca"] }, { ta: "Oncology", products: ["Yescarta", "Trodelvy"] }, { ta: "Liver Disease", products: ["Vemlidy", "Epclusa"] }],
    otcRxSplit: "0% OTC / 100% Rx",
    biosimilarsPortfolio: [],
    marketShareByTA: [{ ta: "HIV", share: "55%" }, { ta: "Oncology", share: "6%" }],
    competitivePositioning: "Leader",
    keyGeographies: ["US", "EU", "Sub-Saharan Africa"],
    budgetTier: "Tier 1",
    keyChannels: ["Rep visits", "Digital", "MSL", "Patient programs"],
    publicationActivity: "High", mslPresence: "Global", kolNetworkStrength: "Strong",
    targetHcpSegments: ["Infectious Disease Specialists", "Oncologists", "Hepatologists"],
    engagementModel: "Balanced",
  },
  {
    id: 10, identityId: "COMP-010",
    legalName: "BioNTech SE", brandName: "BioNTech", hqLocation: "Mainz · Germany",
    companyType: "Biotech", headcount: "5,500", revenueTier: "$5–15B", marketCap: "$25B",
    publiclyTraded: true, ticker: "BNTX",
    parentCompany: null, subsidiaries: ["BioNTech US", "InstaDeep"],
    marketedProducts: [{ ta: "Vaccines", products: ["Comirnaty"] }, { ta: "Oncology", products: ["BNT111 (pipeline)", "BNT122 (pipeline)"] }],
    otcRxSplit: "0% OTC / 100% Rx",
    biosimilarsPortfolio: [],
    marketShareByTA: [{ ta: "mRNA Vaccines", share: "48%" }],
    competitivePositioning: "Challenger",
    keyGeographies: ["EU", "US", "Global via Pfizer partnership"],
    budgetTier: "Tier 2",
    keyChannels: ["Publications", "Congresses", "Digital", "MSL"],
    publicationActivity: "High", mslPresence: "Regional", kolNetworkStrength: "Moderate",
    targetHcpSegments: ["Oncologists", "Infectious Disease Specialists", "GPs"],
    engagementModel: "Digital-first",
  },
  {
    id: 11, identityId: "COMP-011",
    legalName: "Moderna Inc.", brandName: "Moderna", hqLocation: "Cambridge, MA · US",
    companyType: "Biotech", headcount: "5,900", revenueTier: "$5–15B", marketCap: "$42B",
    publiclyTraded: true, ticker: "MRNA",
    parentCompany: null, subsidiaries: ["Moderna Genomics"],
    marketedProducts: [{ ta: "Vaccines", products: ["Spikevax"] }, { ta: "Oncology", products: ["mRNA-4157 (pipeline)"] }, { ta: "Respiratory", products: ["mRESVIA"] }],
    otcRxSplit: "0% OTC / 100% Rx",
    biosimilarsPortfolio: [],
    marketShareByTA: [{ ta: "mRNA Vaccines", share: "38%" }],
    competitivePositioning: "Challenger",
    keyGeographies: ["US", "EU", "Japan"],
    budgetTier: "Tier 2",
    keyChannels: ["Digital", "Publications", "Congresses"],
    publicationActivity: "High", mslPresence: "Regional", kolNetworkStrength: "Moderate",
    targetHcpSegments: ["Infectious Disease Specialists", "Oncologists", "GPs"],
    engagementModel: "Digital-first",
  },
  {
    id: 12, identityId: "COMP-012",
    legalName: "Teva Pharmaceutical Industries Ltd.", brandName: "Teva", hqLocation: "Tel Aviv · Israel",
    companyType: "Generic", headcount: "37,000", revenueTier: "$10–20B", marketCap: "$18B",
    publiclyTraded: true, ticker: "TEVA",
    parentCompany: null, subsidiaries: ["Actavis", "Teva API"],
    marketedProducts: [{ ta: "CNS", products: ["Austedo", "Ajovy"] }, { ta: "Respiratory", products: ["ProAir", "QVAR"] }],
    otcRxSplit: "18% OTC / 82% Rx",
    biosimilarsPortfolio: ["Truxima", "Herzuma", "Granix"],
    marketShareByTA: [{ ta: "Generic CNS", share: "22%" }, { ta: "Generic Respiratory", share: "15%" }],
    competitivePositioning: "Leader",
    keyGeographies: ["US", "EU", "Rest of World"],
    budgetTier: "Tier 2",
    keyChannels: ["Rep visits", "Digital", "Trade channels"],
    publicationActivity: "Medium", mslPresence: "Regional", kolNetworkStrength: "Moderate",
    targetHcpSegments: ["GPs", "Neurologists", "Pharmacists"],
    engagementModel: "Field-first",
  },
  {
    id: 13, identityId: "COMP-013",
    legalName: "Viatris Inc.", brandName: "Viatris", hqLocation: "Canonsburg, PA · US",
    companyType: "Generic", headcount: "38,000", revenueTier: "$10–20B", marketCap: "$12B",
    publiclyTraded: true, ticker: "VTRS",
    parentCompany: null, subsidiaries: ["Mylan", "Upjohn (Pfizer spinoff)"],
    marketedProducts: [{ ta: "Cardiovascular", products: ["Norvasc", "Lipitor generics"] }, { ta: "Infectious Disease", products: ["Zithromax generics"] }],
    otcRxSplit: "22% OTC / 78% Rx",
    biosimilarsPortfolio: ["Semglee", "Hulio", "Ogivri"],
    marketShareByTA: [{ ta: "Generic Cardiovascular", share: "18%" }, { ta: "Generic Anti-infectives", share: "12%" }],
    competitivePositioning: "Challenger",
    keyGeographies: ["US", "EU", "Emerging Markets", "China"],
    budgetTier: "Tier 2",
    keyChannels: ["Rep visits", "Trade channels", "Digital"],
    publicationActivity: "Low", mslPresence: "Regional", kolNetworkStrength: "Limited",
    targetHcpSegments: ["GPs", "Pharmacists", "Cardiologists"],
    engagementModel: "Field-first",
  },
  {
    id: 14, identityId: "COMP-014",
    legalName: "Sandoz Group AG", brandName: "Sandoz", hqLocation: "Basel · Switzerland",
    companyType: "Generic", headcount: "22,000", revenueTier: "$5–15B", marketCap: "$9B",
    publiclyTraded: true, ticker: "SDZ",
    parentCompany: null, subsidiaries: ["Hexal", "Salutas Pharma"],
    marketedProducts: [{ ta: "Oncology Biosimilars", products: ["Zarxio", "Rixathon", "Zessly"] }, { ta: "Ophthalmology", products: ["Erelzi"] }],
    otcRxSplit: "15% OTC / 85% Rx",
    biosimilarsPortfolio: ["Zarxio", "Rixathon", "Zessly", "Hyrimoz", "Omnitrope"],
    marketShareByTA: [{ ta: "Biosimilars", share: "19%" }, { ta: "Generic Anti-infectives", share: "8%" }],
    competitivePositioning: "Leader",
    keyGeographies: ["EU", "US", "Rest of World"],
    budgetTier: "Tier 2",
    keyChannels: ["Rep visits", "Trade channels", "Congresses"],
    publicationActivity: "Medium", mslPresence: "Regional", kolNetworkStrength: "Moderate",
    targetHcpSegments: ["Oncologists", "Rheumatologists", "Pharmacists"],
    engagementModel: "Field-first",
  },
  {
    id: 15, identityId: "COMP-015",
    legalName: "Sun Pharmaceutical Industries Ltd.", brandName: "Sun Pharma", hqLocation: "Mumbai · India",
    companyType: "Generic", headcount: "36,000", revenueTier: "$4–8B", marketCap: "$38B",
    publiclyTraded: true, ticker: "SUNPHARMA",
    parentCompany: null, subsidiaries: ["Taro Pharmaceutical", "Ranbaxy (legacy)"],
    marketedProducts: [{ ta: "Dermatology", products: ["Ilumya", "Cequa"] }, { ta: "Oncology", products: ["Odomzo", "Absorica"] }],
    otcRxSplit: "25% OTC / 75% Rx",
    biosimilarsPortfolio: ["Adalimumab biosimilar"],
    marketShareByTA: [{ ta: "Dermatology", share: "7%" }, { ta: "Generic Specialty", share: "6%" }],
    competitivePositioning: "Niche",
    keyGeographies: ["India", "US", "Emerging Markets"],
    budgetTier: "Tier 3",
    keyChannels: ["Rep visits", "Trade channels"],
    publicationActivity: "Low", mslPresence: "Limited", kolNetworkStrength: "Limited",
    targetHcpSegments: ["Dermatologists", "GPs", "Pharmacists"],
    engagementModel: "Field-first",
  },
  {
    id: 16, identityId: "COMP-016",
    legalName: "Haleon PLC", brandName: "Haleon", hqLocation: "Weybridge · UK",
    companyType: "OTC", headcount: "24,000", revenueTier: "$10–15B", marketCap: "$32B",
    publiclyTraded: true, ticker: "HLN",
    parentCompany: null, subsidiaries: ["GSK Consumer Healthcare (legacy)"],
    marketedProducts: [{ ta: "Pain Relief", products: ["Panadol", "Advil"] }, { ta: "Oral Health", products: ["Sensodyne", "Aquafresh"] }, { ta: "Vitamins & Supplements", products: ["Centrum", "Caltrate"] }],
    otcRxSplit: "100% OTC / 0% Rx",
    biosimilarsPortfolio: [],
    marketShareByTA: [{ ta: "OTC Pain Relief", share: "20%" }, { ta: "Oral Health", share: "23%" }],
    competitivePositioning: "Leader",
    keyGeographies: ["US", "EU", "APAC", "Emerging Markets"],
    budgetTier: "Tier 1",
    keyChannels: ["Digital", "Events", "Trade channels", "TV advertising"],
    publicationActivity: "Low", mslPresence: "Limited", kolNetworkStrength: "Limited",
    targetHcpSegments: ["GPs", "Pharmacists", "Dentists"],
    engagementModel: "Digital-first",
  },
  {
    id: 17, identityId: "COMP-017",
    legalName: "Bayer AG", brandName: "Bayer", hqLocation: "Leverkusen · Germany",
    companyType: "OTC", headcount: "99,000", revenueTier: ">$40B", marketCap: "$28B",
    publiclyTraded: true, ticker: "BAYN",
    parentCompany: null, subsidiaries: ["Monsanto (Crop Science)", "Bayer Consumer Health"],
    marketedProducts: [{ ta: "Cardiovascular", products: ["Xarelto", "Adalat"] }, { ta: "OTC", products: ["Aspirin", "Aleve", "Claritin"] }, { ta: "Oncology", products: ["Nubeqa", "Stivarga"] }],
    otcRxSplit: "35% OTC / 65% Rx",
    biosimilarsPortfolio: [],
    marketShareByTA: [{ ta: "OTC Analgesics", share: "16%" }, { ta: "Cardiovascular", share: "12%" }],
    competitivePositioning: "Leader",
    keyGeographies: ["EU", "US", "APAC", "Latin America"],
    budgetTier: "Tier 1",
    keyChannels: ["Rep visits", "Digital", "TV advertising", "Congresses"],
    publicationActivity: "Medium", mslPresence: "Regional", kolNetworkStrength: "Moderate",
    targetHcpSegments: ["Cardiologists", "GPs", "Pharmacists"],
    engagementModel: "Balanced",
  },
  {
    id: 18, identityId: "COMP-018",
    legalName: "Ipsen S.A.", brandName: "Ipsen", hqLocation: "Paris · France",
    companyType: "Specialty", headcount: "5,800", revenueTier: "$3–6B", marketCap: "$9B",
    publiclyTraded: true, ticker: "IPN",
    parentCompany: null, subsidiaries: ["Clementia Pharmaceuticals"],
    marketedProducts: [{ ta: "Oncology", products: ["Cabometyx", "Somatuline"] }, { ta: "Neuroscience", products: ["Dysport", "Xerava"] }, { ta: "Rare Disease", products: ["Palovarotene"] }],
    otcRxSplit: "0% OTC / 100% Rx",
    biosimilarsPortfolio: [],
    marketShareByTA: [{ ta: "Neuroendocrine Tumors", share: "24%" }, { ta: "Neurotoxins", share: "12%" }],
    competitivePositioning: "Niche",
    keyGeographies: ["EU", "US", "Japan", "China"],
    budgetTier: "Tier 2",
    keyChannels: ["MSL", "Congresses", "Rep visits"],
    publicationActivity: "Medium", mslPresence: "Regional", kolNetworkStrength: "Moderate",
    targetHcpSegments: ["Oncologists", "Neurologists", "Endocrinologists"],
    engagementModel: "Field-first",
  },
  {
    id: 19, identityId: "COMP-019",
    legalName: "Jazz Pharmaceuticals PLC", brandName: "Jazz Pharma", hqLocation: "Dublin · Ireland",
    companyType: "Specialty", headcount: "5,600", revenueTier: "$3–5B", marketCap: "$7B",
    publiclyTraded: true, ticker: "JAZZ",
    parentCompany: null, subsidiaries: ["GW Pharmaceuticals"],
    marketedProducts: [{ ta: "Sleep & CNS", products: ["Xyrem", "Lumryz", "Epidiolex"] }, { ta: "Oncology", products: ["Zepzelca", "Defitelio"] }],
    otcRxSplit: "0% OTC / 100% Rx",
    biosimilarsPortfolio: [],
    marketShareByTA: [{ ta: "Narcolepsy", share: "38%" }, { ta: "Pediatric Epilepsy", share: "18%" }],
    competitivePositioning: "Niche",
    keyGeographies: ["US", "EU"],
    budgetTier: "Tier 2",
    keyChannels: ["Rep visits", "MSL", "Digital", "Patient programs"],
    publicationActivity: "Medium", mslPresence: "Regional", kolNetworkStrength: "Moderate",
    targetHcpSegments: ["Neurologists", "Sleep Specialists", "Oncologists"],
    engagementModel: "Balanced",
  },
  {
    id: 20, identityId: "COMP-020",
    legalName: "Recordati S.p.A.", brandName: "Recordati", hqLocation: "Milan · Italy",
    companyType: "Specialty", headcount: "4,400", revenueTier: "$2–4B", marketCap: "$10B",
    publiclyTraded: true, ticker: "REC",
    parentCompany: null, subsidiaries: ["Recordati Rare Diseases"],
    marketedProducts: [{ ta: "Rare Disease", products: ["Signifor", "Isturisa", "Cystadrops"] }, { ta: "Urology", products: ["Urorec", "Silodyx"] }],
    otcRxSplit: "5% OTC / 95% Rx",
    biosimilarsPortfolio: [],
    marketShareByTA: [{ ta: "Cushing's Disease", share: "42%" }, { ta: "Urology", share: "9%" }],
    competitivePositioning: "Niche",
    keyGeographies: ["EU", "US", "MENA"],
    budgetTier: "Tier 3",
    keyChannels: ["MSL", "Rep visits", "Congresses"],
    publicationActivity: "Medium", mslPresence: "Regional", kolNetworkStrength: "Moderate",
    targetHcpSegments: ["Endocrinologists", "Urologists", "Rare Disease Specialists"],
    engagementModel: "Field-first",
  },
];

const signalKpis = [
  { label: "Anonymous Visitors", value: "1,284", change: "+18.3%", sub: "last 30 days" },
  { label: "High Intent Leads",  value: "247",   change: "+9.1%",  sub: "vs last month" },
  { label: "Orgs Identified",    value: "89",    change: "+5 new", sub: "this week" },
];

const anonymousLeads = [
  {
    id: "L-18492", lastActivityTs: "Feb 12 · 14:23", lastActivityRel: "5 min ago",
    visits: 8, firstContact: "Feb 10, 2025", activeDays: 3,
    source: "google / cpc", sourceType: "paid-search",
    landingPage: "/products/cardiovascular",
    topics: ["Cardiovascular", "Clinical Evidence"],
    intent: { score: 82, level: "High", reason: "Visited product page 4× + downloaded brochure + viewed contact page" },
    location: { label: "Boston, MA · US" },
    possibleOrg: { name: "Massachusetts General", confidence: "High" },
    keyAction: { label: "Downloaded brochure", type: "download" },
  },
  {
    id: "L-17891", lastActivityTs: "Feb 12 · 13:47", lastActivityRel: "41 min ago",
    visits: 3, firstContact: "Feb 12, 2025", activeDays: 1,
    source: "linkedin / paid", sourceType: "paid-social",
    landingPage: "/clinical-evidence/oncology",
    topics: ["Oncology"],
    intent: { score: 61, level: "Medium", reason: "Visited 2 evidence pages + spent 12m on clinical trial summary" },
    location: { label: "New York, NY · US" },
    possibleOrg: { name: "Memorial Sloan Kettering", confidence: "Medium" },
    keyAction: { label: "Spent 12m on page", type: "web" },
  },
  {
    id: "L-17654", lastActivityTs: "Feb 12 · 12:10", lastActivityRel: "2h ago",
    visits: 12, firstContact: "Feb 6, 2025", activeDays: 7,
    source: "direct", sourceType: "direct",
    landingPage: "/products/neurology",
    topics: ["Neurology", "Product X"],
    intent: { score: 91, level: "High", reason: "12 visits over 7 days, viewed pricing 3× + visited contact page" },
    location: { label: "Chicago, IL · US" },
    possibleOrg: { name: "Northwestern Medicine", confidence: "High" },
    keyAction: { label: "Visited contact page", type: "web" },
  },
  {
    id: "L-17423", lastActivityTs: "Feb 12 · 10:55", lastActivityRel: "3h ago",
    visits: 2, firstContact: "Feb 12, 2025", activeDays: 1,
    source: "email / newsletter", sourceType: "email",
    landingPage: "/news/cardiovascular-trial",
    topics: ["Cardiovascular"],
    intent: { score: 34, level: "Low", reason: "2 visits, browsed news section only — no product page views" },
    location: { label: "Houston, TX · US" },
    possibleOrg: null,
    keyAction: { label: "Opened email link", type: "email" },
  },
  {
    id: "L-17210", lastActivityTs: "Feb 12 · 09:32", lastActivityRel: "5h ago",
    visits: 5, firstContact: "Feb 11, 2025", activeDays: 2,
    source: "google / organic", sourceType: "organic-search",
    landingPage: "/clinical-evidence/cardiology",
    topics: ["Cardiology", "Clinical Evidence"],
    intent: { score: 58, level: "Medium", reason: "5 visits, read 4 clinical evidence pages + 1 product overview" },
    location: { label: "Los Angeles, CA · US" },
    possibleOrg: { name: "Cedars-Sinai Medical", confidence: "Low" },
    keyAction: { label: "Spent 8m on site", type: "lightning" },
  },
  {
    id: "L-16988", lastActivityTs: "Feb 11 · 16:44", lastActivityRel: "22h ago",
    visits: 1, firstContact: "Feb 11, 2025", activeDays: 1,
    source: "twitter / organic", sourceType: "social",
    landingPage: "/about",
    topics: ["General"],
    intent: { score: 18, level: "Low", reason: "1 visit, viewed homepage + about page only" },
    location: { label: "Seattle, WA · US" },
    possibleOrg: null,
    keyAction: { label: "Visited homepage", type: "web" },
  },
  {
    id: "L-16745", lastActivityTs: "Feb 11 · 14:20", lastActivityRel: "1d ago",
    visits: 7, firstContact: "Feb 8, 2025", activeDays: 4,
    source: "linkedin / organic", sourceType: "social",
    landingPage: "/products/endocrinology",
    topics: ["Endocrinology", "Product Y"],
    intent: { score: 74, level: "High", reason: "7 visits over 4 days, viewed product pages + downloaded resources" },
    location: { label: "Philadelphia, PA · US" },
    possibleOrg: { name: "Penn Medicine", confidence: "Medium" },
    keyAction: { label: "Downloaded brochure", type: "download" },
  },
  {
    id: "L-16502", lastActivityTs: "Feb 10 · 11:05", lastActivityRel: "2d ago",
    visits: 4, firstContact: "Feb 6, 2025", activeDays: 5,
    source: "medscape.com / referral", sourceType: "referral",
    landingPage: "/clinical-evidence/rheumatology",
    topics: ["Rheumatology"],
    intent: { score: 47, level: "Medium", reason: "4 visits via referral, read 3 clinical evidence pages" },
    location: { label: "Baltimore, MD · US" },
    possibleOrg: { name: "Johns Hopkins Hospital", confidence: "Low" },
    keyAction: { label: "Spent 6m reading", type: "web" },
  },
  {
    id: "L-16280", lastActivityTs: "Feb 10 · 08:41", lastActivityRel: "2d ago",
    visits: 9, firstContact: "Feb 5, 2025", activeDays: 6,
    source: "google / cpc", sourceType: "paid-search",
    landingPage: "/products/oncology",
    topics: ["Oncology", "Immunotherapy"],
    intent: { score: 79, level: "High", reason: "9 visits over 6 days, downloaded two resources + viewed pricing page" },
    location: { label: "San Francisco, CA · US" },
    possibleOrg: { name: "UCSF Medical Center", confidence: "High" },
    keyAction: { label: "Downloaded brochure", type: "download" },
  },
  {
    id: "L-16041", lastActivityTs: "Feb 09 · 17:12", lastActivityRel: "3d ago",
    visits: 2, firstContact: "Feb 9, 2025", activeDays: 1,
    source: "facebook / paid", sourceType: "paid-social",
    landingPage: "/news/oncology-symposium",
    topics: ["Oncology"],
    intent: { score: 22, level: "Low", reason: "2 visits from social ad, read news article only" },
    location: { label: "Phoenix, AZ · US" },
    possibleOrg: null,
    keyAction: { label: "Visited news page", type: "web" },
  },
  {
    id: "L-15820", lastActivityTs: "Feb 09 · 14:55", lastActivityRel: "3d ago",
    visits: 6, firstContact: "Feb 7, 2025", activeDays: 3,
    source: "bing / cpc", sourceType: "paid-search",
    landingPage: "/products/cardiology/stents",
    topics: ["Cardiology", "Interventional"],
    intent: { score: 66, level: "Medium", reason: "6 visits, product page 3× + specifications PDF + contacted support chat" },
    location: { label: "Dallas, TX · US" },
    possibleOrg: { name: "Baylor Scott & White", confidence: "Medium" },
    keyAction: { label: "Opened support chat", type: "lightning" },
  },
  {
    id: "L-15603", lastActivityTs: "Feb 09 · 11:30", lastActivityRel: "3d ago",
    visits: 14, firstContact: "Feb 1, 2025", activeDays: 9,
    source: "direct", sourceType: "direct",
    landingPage: "/products/pulmonology",
    topics: ["Pulmonology", "Clinical Evidence"],
    intent: { score: 94, level: "High", reason: "14 visits over 9 days, downloaded 3 assets, viewed contact page 4×" },
    location: { label: "Cleveland, OH · US" },
    possibleOrg: { name: "Cleveland Clinic", confidence: "High" },
    keyAction: { label: "Downloaded brochure", type: "download" },
  },
  {
    id: "L-15387", lastActivityTs: "Feb 08 · 19:02", lastActivityRel: "4d ago",
    visits: 3, firstContact: "Feb 8, 2025", activeDays: 1,
    source: "email / campaign", sourceType: "email",
    landingPage: "/clinical-evidence/pulmonology",
    topics: ["Pulmonology"],
    intent: { score: 39, level: "Low", reason: "3 visits from email, read clinical evidence pages, no product views" },
    location: { label: "Denver, CO · US" },
    possibleOrg: null,
    keyAction: { label: "Opened email link", type: "email" },
  },
  {
    id: "L-15140", lastActivityTs: "Feb 08 · 15:44", lastActivityRel: "4d ago",
    visits: 5, firstContact: "Feb 6, 2025", activeDays: 3,
    source: "pubmed.com / referral", sourceType: "referral",
    landingPage: "/clinical-evidence/neurology",
    topics: ["Neurology", "Clinical Evidence"],
    intent: { score: 52, level: "Medium", reason: "5 visits via PubMed referral, read 4 clinical studies" },
    location: { label: "Pittsburgh, PA · US" },
    possibleOrg: { name: "UPMC Medical Center", confidence: "Medium" },
    keyAction: { label: "Spent 14m reading", type: "lightning" },
  },
  {
    id: "L-14912", lastActivityTs: "Feb 08 · 10:18", lastActivityRel: "4d ago",
    visits: 10, firstContact: "Feb 3, 2025", activeDays: 6,
    source: "google / organic", sourceType: "organic-search",
    landingPage: "/products/hematology",
    topics: ["Hematology", "Product Z"],
    intent: { score: 85, level: "High", reason: "10 visits over 6 days, viewed all product sub-pages + downloaded whitepaper" },
    location: { label: "Memphis, TN · US" },
    possibleOrg: { name: "St. Jude Children's Hospital", confidence: "High" },
    keyAction: { label: "Downloaded whitepaper", type: "download" },
  },
  {
    id: "L-14677", lastActivityTs: "Feb 07 · 22:33", lastActivityRel: "5d ago",
    visits: 1, firstContact: "Feb 7, 2025", activeDays: 1,
    source: "instagram / organic", sourceType: "social",
    landingPage: "/about",
    topics: ["General"],
    intent: { score: 11, level: "Low", reason: "1 visit from Instagram, only viewed about page" },
    location: { label: "Miami, FL · US" },
    possibleOrg: null,
    keyAction: { label: "Visited about page", type: "web" },
  },
  {
    id: "L-14440", lastActivityTs: "Feb 07 · 16:05", lastActivityRel: "5d ago",
    visits: 6, firstContact: "Feb 5, 2025", activeDays: 3,
    source: "linkedin / paid", sourceType: "paid-social",
    landingPage: "/products/gastroenterology",
    topics: ["Gastroenterology", "Clinical Evidence"],
    intent: { score: 63, level: "Medium", reason: "6 visits, product overview + clinical data + registered for webinar" },
    location: { label: "Minneapolis, MN · US" },
    possibleOrg: { name: "Mayo Clinic", confidence: "Medium" },
    keyAction: { label: "Registered for webinar", type: "lightning" },
  },
  {
    id: "L-14203", lastActivityTs: "Feb 07 · 11:49", lastActivityRel: "5d ago",
    visits: 8, firstContact: "Feb 2, 2025", activeDays: 6,
    source: "google / cpc", sourceType: "paid-search",
    landingPage: "/products/nephrology",
    topics: ["Nephrology"],
    intent: { score: 71, level: "High", reason: "8 visits over 6 days, viewed product page 5× + requested info" },
    location: { label: "Portland, OR · US" },
    possibleOrg: { name: "Oregon Health & Science", confidence: "Medium" },
    keyAction: { label: "Requested info", type: "lightning" },
  },
  {
    id: "L-13968", lastActivityTs: "Feb 06 · 20:14", lastActivityRel: "6d ago",
    visits: 4, firstContact: "Feb 4, 2025", activeDays: 3,
    source: "nejm.org / referral", sourceType: "referral",
    landingPage: "/clinical-evidence/cardiology",
    topics: ["Cardiology"],
    intent: { score: 44, level: "Medium", reason: "4 visits via NEJM referral, read 3 studies, no product page views" },
    location: { label: "Nashville, TN · US" },
    possibleOrg: { name: "Vanderbilt Medical Center", confidence: "Low" },
    keyAction: { label: "Spent 9m reading", type: "lightning" },
  },
  {
    id: "L-13731", lastActivityTs: "Feb 06 · 14:28", lastActivityRel: "6d ago",
    visits: 11, firstContact: "Jan 30, 2025", activeDays: 8,
    source: "direct", sourceType: "direct",
    landingPage: "/products/cardiovascular/tavi",
    topics: ["Cardiovascular", "Structural Heart"],
    intent: { score: 88, level: "High", reason: "11 visits over 8 days, downloaded TAVI brochure + contacted sales rep" },
    location: { label: "Rochester, MN · US" },
    possibleOrg: { name: "Mayo Clinic", confidence: "High" },
    keyAction: { label: "Contacted sales rep", type: "lightning" },
  },
  {
    id: "L-13494", lastActivityTs: "Feb 06 · 09:50", lastActivityRel: "6d ago",
    visits: 2, firstContact: "Feb 6, 2025", activeDays: 1,
    source: "email / newsletter", sourceType: "email",
    landingPage: "/news/clinical-trial-results",
    topics: ["Oncology"],
    intent: { score: 27, level: "Low", reason: "2 visits from newsletter, browsed news only" },
    location: { label: "Charlotte, NC · US" },
    possibleOrg: null,
    keyAction: { label: "Opened email link", type: "email" },
  },
  {
    id: "L-13257", lastActivityTs: "Feb 05 · 18:33", lastActivityRel: "7d ago",
    visits: 7, firstContact: "Feb 1, 2025", activeDays: 5,
    source: "google / organic", sourceType: "organic-search",
    landingPage: "/products/rheumatology",
    topics: ["Rheumatology", "Clinical Evidence"],
    intent: { score: 69, level: "Medium", reason: "7 visits over 5 days, product page 4× + clinical data pages" },
    location: { label: "Indianapolis, IN · US" },
    possibleOrg: { name: "IU Health", confidence: "Low" },
    keyAction: { label: "Spent 11m on product page", type: "lightning" },
  },
  {
    id: "L-13020", lastActivityTs: "Feb 05 · 13:07", lastActivityRel: "7d ago",
    visits: 5, firstContact: "Feb 3, 2025", activeDays: 3,
    source: "medscape.com / referral", sourceType: "referral",
    landingPage: "/clinical-evidence/endocrinology",
    topics: ["Endocrinology"],
    intent: { score: 51, level: "Medium", reason: "5 visits via Medscape, read 4 evidence pages + 1 product page" },
    location: { label: "San Antonio, TX · US" },
    possibleOrg: { name: "UT Health San Antonio", confidence: "Low" },
    keyAction: { label: "Spent 7m reading", type: "lightning" },
  },
  {
    id: "L-12783", lastActivityTs: "Feb 05 · 08:22", lastActivityRel: "7d ago",
    visits: 15, firstContact: "Jan 27, 2025", activeDays: 10,
    source: "direct", sourceType: "direct",
    landingPage: "/products/oncology/immunotherapy",
    topics: ["Oncology", "Immunotherapy", "Clinical Evidence"],
    intent: { score: 96, level: "High", reason: "15 visits over 10 days, 4 downloads, viewed contact page 6×, requested demo" },
    location: { label: "Houston, TX · US" },
    possibleOrg: { name: "MD Anderson Cancer Center", confidence: "High" },
    keyAction: { label: "Requested demo", type: "lightning" },
  },
  {
    id: "L-12546", lastActivityTs: "Feb 04 · 21:40", lastActivityRel: "8d ago",
    visits: 3, firstContact: "Feb 4, 2025", activeDays: 1,
    source: "twitter / organic", sourceType: "social",
    landingPage: "/products/neurology",
    topics: ["Neurology"],
    intent: { score: 31, level: "Low", reason: "3 visits, product overview only, no deeper engagement" },
    location: { label: "Detroit, MI · US" },
    possibleOrg: null,
    keyAction: { label: "Visited product page", type: "web" },
  },
  {
    id: "L-12309", lastActivityTs: "Feb 04 · 16:14", lastActivityRel: "8d ago",
    visits: 6, firstContact: "Feb 2, 2025", activeDays: 3,
    source: "linkedin / paid", sourceType: "paid-social",
    landingPage: "/products/cardiology/ep",
    topics: ["Cardiology", "Electrophysiology"],
    intent: { score: 67, level: "Medium", reason: "6 visits, EP product page 3× + clinical evidence + webinar registration" },
    location: { label: "Columbus, OH · US" },
    possibleOrg: { name: "Ohio State Wexner Medical", confidence: "Medium" },
    keyAction: { label: "Registered for webinar", type: "lightning" },
  },
  {
    id: "L-12072", lastActivityTs: "Feb 04 · 10:58", lastActivityRel: "8d ago",
    visits: 9, firstContact: "Jan 29, 2025", activeDays: 7,
    source: "google / cpc", sourceType: "paid-search",
    landingPage: "/products/hematology",
    topics: ["Hematology", "Product Z"],
    intent: { score: 77, level: "High", reason: "9 visits over 7 days, downloaded 2 brochures + viewed pricing" },
    location: { label: "Washington, DC · US" },
    possibleOrg: { name: "Georgetown University Hospital", confidence: "Medium" },
    keyAction: { label: "Downloaded brochure", type: "download" },
  },
  {
    id: "L-11835", lastActivityTs: "Feb 03 · 19:45", lastActivityRel: "9d ago",
    visits: 1, firstContact: "Feb 3, 2025", activeDays: 1,
    source: "facebook / paid", sourceType: "paid-social",
    landingPage: "/about",
    topics: ["General"],
    intent: { score: 8, level: "Low", reason: "1 visit from Facebook ad, viewed about page only" },
    location: { label: "Las Vegas, NV · US" },
    possibleOrg: null,
    keyAction: { label: "Visited about page", type: "web" },
  },
  {
    id: "L-11598", lastActivityTs: "Feb 03 · 14:20", lastActivityRel: "9d ago",
    visits: 4, firstContact: "Feb 1, 2025", activeDays: 3,
    source: "bing / cpc", sourceType: "paid-search",
    landingPage: "/products/gastroenterology",
    topics: ["Gastroenterology"],
    intent: { score: 42, level: "Medium", reason: "4 visits, product page 2× + clinical overview + support chat" },
    location: { label: "Atlanta, GA · US" },
    possibleOrg: { name: "Emory University Hospital", confidence: "Low" },
    keyAction: { label: "Opened support chat", type: "lightning" },
  },
  {
    id: "L-11361", lastActivityTs: "Feb 03 · 09:03", lastActivityRel: "9d ago",
    visits: 8, firstContact: "Jan 28, 2025", activeDays: 7,
    source: "google / organic", sourceType: "organic-search",
    landingPage: "/products/cardiovascular",
    topics: ["Cardiovascular", "Structural Heart"],
    intent: { score: 80, level: "High", reason: "8 visits over 7 days, product page 4× + downloaded clinical summary" },
    location: { label: "Tampa, FL · US" },
    possibleOrg: { name: "Tampa General Hospital", confidence: "Medium" },
    keyAction: { label: "Downloaded clinical summary", type: "download" },
  },
  {
    id: "L-11124", lastActivityTs: "Feb 02 · 22:17", lastActivityRel: "10d ago",
    visits: 5, firstContact: "Jan 31, 2025", activeDays: 3,
    source: "direct", sourceType: "direct",
    landingPage: "/clinical-evidence/hematology",
    topics: ["Hematology", "Clinical Evidence"],
    intent: { score: 56, level: "Medium", reason: "5 visits, read 5 clinical evidence pages, no product page views" },
    location: { label: "St. Louis, MO · US" },
    possibleOrg: { name: "Barnes-Jewish Hospital", confidence: "Low" },
    keyAction: { label: "Spent 13m reading", type: "lightning" },
  },
  {
    id: "L-10887", lastActivityTs: "Feb 02 · 15:51", lastActivityRel: "10d ago",
    visits: 11, firstContact: "Jan 25, 2025", activeDays: 9,
    source: "google / cpc", sourceType: "paid-search",
    landingPage: "/products/neurology/ms",
    topics: ["Neurology", "Multiple Sclerosis"],
    intent: { score: 90, level: "High", reason: "11 visits over 9 days, MS product page 5× + downloaded 3 assets + contact page" },
    location: { label: "Rochester, NY · US" },
    possibleOrg: { name: "University of Rochester Medical", confidence: "High" },
    keyAction: { label: "Downloaded brochure", type: "download" },
  },
  {
    id: "L-10650", lastActivityTs: "Feb 02 · 10:29", lastActivityRel: "10d ago",
    visits: 2, firstContact: "Feb 2, 2025", activeDays: 1,
    source: "email / campaign", sourceType: "email",
    landingPage: "/news/ms-treatment-update",
    topics: ["Neurology"],
    intent: { score: 25, level: "Low", reason: "2 visits from email, read 1 news article only" },
    location: { label: "Sacramento, CA · US" },
    possibleOrg: null,
    keyAction: { label: "Opened email link", type: "email" },
  },
  {
    id: "L-10413", lastActivityTs: "Feb 01 · 18:04", lastActivityRel: "11d ago",
    visits: 7, firstContact: "Jan 28, 2025", activeDays: 5,
    source: "linkedin / organic", sourceType: "social",
    landingPage: "/products/cardiology",
    topics: ["Cardiology", "Clinical Evidence"],
    intent: { score: 72, level: "High", reason: "7 visits over 5 days, product page 4× + clinical data + webinar RSVP" },
    location: { label: "Kansas City, MO · US" },
    possibleOrg: { name: "University of Kansas Medical", confidence: "Medium" },
    keyAction: { label: "Registered for webinar", type: "lightning" },
  },
  {
    id: "L-10176", lastActivityTs: "Feb 01 · 12:38", lastActivityRel: "11d ago",
    visits: 4, firstContact: "Jan 30, 2025", activeDays: 3,
    source: "medscape.com / referral", sourceType: "referral",
    landingPage: "/clinical-evidence/oncology",
    topics: ["Oncology"],
    intent: { score: 48, level: "Medium", reason: "4 visits via Medscape, read clinical evidence pages + 1 product view" },
    location: { label: "Richmond, VA · US" },
    possibleOrg: { name: "VCU Health System", confidence: "Low" },
    keyAction: { label: "Spent 8m reading", type: "lightning" },
  },
  {
    id: "L-09939", lastActivityTs: "Jan 31 · 20:55", lastActivityRel: "12d ago",
    visits: 6, firstContact: "Jan 27, 2025", activeDays: 5,
    source: "google / organic", sourceType: "organic-search",
    landingPage: "/products/endocrinology/diabetes",
    topics: ["Endocrinology", "Diabetes"],
    intent: { score: 65, level: "Medium", reason: "6 visits, diabetes product page 3× + clinical trial data + newsletter sign-up" },
    location: { label: "Albuquerque, NM · US" },
    possibleOrg: { name: "UNM Health System", confidence: "Low" },
    keyAction: { label: "Newsletter sign-up", type: "email" },
  },
  {
    id: "L-09702", lastActivityTs: "Jan 31 · 14:10", lastActivityRel: "12d ago",
    visits: 13, firstContact: "Jan 20, 2025", activeDays: 12,
    source: "direct", sourceType: "direct",
    landingPage: "/products/rheumatology/biologics",
    topics: ["Rheumatology", "Biologics"],
    intent: { score: 93, level: "High", reason: "13 visits over 12 days, 5 downloads, 3 webinars registered, contact page 5×" },
    location: { label: "Salt Lake City, UT · US" },
    possibleOrg: { name: "Intermountain Healthcare", confidence: "High" },
    keyAction: { label: "Downloaded brochure", type: "download" },
  },
  {
    id: "L-09465", lastActivityTs: "Jan 31 · 08:44", lastActivityRel: "12d ago",
    visits: 2, firstContact: "Jan 31, 2025", activeDays: 1,
    source: "twitter / organic", sourceType: "social",
    landingPage: "/news/biologics-approval",
    topics: ["Rheumatology"],
    intent: { score: 19, level: "Low", reason: "2 visits from Twitter, browsed news only" },
    location: { label: "Tucson, AZ · US" },
    possibleOrg: null,
    keyAction: { label: "Visited news page", type: "web" },
  },
  {
    id: "L-09228", lastActivityTs: "Jan 30 · 17:22", lastActivityRel: "13d ago",
    visits: 8, firstContact: "Jan 24, 2025", activeDays: 7,
    source: "linkedin / paid", sourceType: "paid-social",
    landingPage: "/products/pulmonology/copd",
    topics: ["Pulmonology", "COPD"],
    intent: { score: 76, level: "High", reason: "8 visits over 7 days, COPD product page 4× + downloaded treatment guide" },
    location: { label: "Louisville, KY · US" },
    possibleOrg: { name: "Norton Healthcare", confidence: "Medium" },
    keyAction: { label: "Downloaded treatment guide", type: "download" },
  },
  {
    id: "L-08991", lastActivityTs: "Jan 30 · 11:56", lastActivityRel: "13d ago",
    visits: 3, firstContact: "Jan 29, 2025", activeDays: 2,
    source: "bing / cpc", sourceType: "paid-search",
    landingPage: "/products/cardiology/heart-failure",
    topics: ["Cardiology"],
    intent: { score: 37, level: "Low", reason: "3 visits, product overview only, no contact or download events" },
    location: { label: "Oklahoma City, OK · US" },
    possibleOrg: null,
    keyAction: { label: "Visited product page", type: "web" },
  },
  {
    id: "L-08754", lastActivityTs: "Jan 29 · 20:30", lastActivityRel: "14d ago",
    visits: 9, firstContact: "Jan 22, 2025", activeDays: 8,
    source: "google / cpc", sourceType: "paid-search",
    landingPage: "/products/hematology/lymphoma",
    topics: ["Hematology", "Oncology"],
    intent: { score: 83, level: "High", reason: "9 visits over 8 days, lymphoma product pages 5× + downloaded 2 studies" },
    location: { label: "Omaha, NE · US" },
    possibleOrg: { name: "Nebraska Medicine", confidence: "Medium" },
    keyAction: { label: "Downloaded clinical study", type: "download" },
  },
  {
    id: "L-08517", lastActivityTs: "Jan 29 · 14:04", lastActivityRel: "14d ago",
    visits: 5, firstContact: "Jan 27, 2025", activeDays: 3,
    source: "healio.com / referral", sourceType: "referral",
    landingPage: "/clinical-evidence/gastroenterology",
    topics: ["Gastroenterology", "Clinical Evidence"],
    intent: { score: 53, level: "Medium", reason: "5 visits via Healio referral, 4 evidence pages + 1 product page" },
    location: { label: "Raleigh, NC · US" },
    possibleOrg: { name: "Duke University Medical Center", confidence: "Low" },
    keyAction: { label: "Spent 10m reading", type: "lightning" },
  },
  {
    id: "L-08280", lastActivityTs: "Jan 28 · 22:48", lastActivityRel: "15d ago",
    visits: 1, firstContact: "Jan 28, 2025", activeDays: 1,
    source: "instagram / paid", sourceType: "paid-social",
    landingPage: "/about",
    topics: ["General"],
    intent: { score: 9, level: "Low", reason: "1 visit from Instagram ad, viewed about page only" },
    location: { label: "Honolulu, HI · US" },
    possibleOrg: null,
    keyAction: { label: "Visited about page", type: "web" },
  },
  {
    id: "L-08043", lastActivityTs: "Jan 28 · 15:19", lastActivityRel: "15d ago",
    visits: 6, firstContact: "Jan 24, 2025", activeDays: 5,
    source: "google / organic", sourceType: "organic-search",
    landingPage: "/products/nephrology/dialysis",
    topics: ["Nephrology", "Dialysis"],
    intent: { score: 62, level: "Medium", reason: "6 visits, dialysis product page 3× + clinical evidence + newsletter sign-up" },
    location: { label: "Anchorage, AK · US" },
    possibleOrg: { name: "Providence Alaska Medical", confidence: "Low" },
    keyAction: { label: "Newsletter sign-up", type: "email" },
  },
  {
    id: "L-07806", lastActivityTs: "Jan 28 · 09:52", lastActivityRel: "15d ago",
    visits: 10, firstContact: "Jan 18, 2025", activeDays: 11,
    source: "direct", sourceType: "direct",
    landingPage: "/products/cardiovascular/valve",
    topics: ["Cardiovascular", "Valve Repair"],
    intent: { score: 87, level: "High", reason: "10 visits over 11 days, valve product page 5× + 3 downloads + contact form" },
    location: { label: "Burlington, VT · US" },
    possibleOrg: { name: "UVM Medical Center", confidence: "Medium" },
    keyAction: { label: "Downloaded brochure", type: "download" },
  },
  {
    id: "L-07569", lastActivityTs: "Jan 27 · 18:35", lastActivityRel: "16d ago",
    visits: 4, firstContact: "Jan 25, 2025", activeDays: 3,
    source: "email / newsletter", sourceType: "email",
    landingPage: "/news/valve-innovation",
    topics: ["Cardiovascular"],
    intent: { score: 33, level: "Low", reason: "4 visits from newsletter, browsed news + 1 product page view" },
    location: { label: "Baton Rouge, LA · US" },
    possibleOrg: null,
    keyAction: { label: "Opened email link", type: "email" },
  },
  {
    id: "L-07332", lastActivityTs: "Jan 27 · 12:08", lastActivityRel: "16d ago",
    visits: 7, firstContact: "Jan 22, 2025", activeDays: 6,
    source: "linkedin / paid", sourceType: "paid-social",
    landingPage: "/products/neurology/epilepsy",
    topics: ["Neurology", "Epilepsy"],
    intent: { score: 70, level: "High", reason: "7 visits over 6 days, epilepsy product page 4× + clinical data + contact page" },
    location: { label: "Allentown, PA · US" },
    possibleOrg: { name: "Lehigh Valley Health Network", confidence: "Medium" },
    keyAction: { label: "Visited contact page", type: "web" },
  },
  {
    id: "L-07095", lastActivityTs: "Jan 26 · 21:44", lastActivityRel: "17d ago",
    visits: 3, firstContact: "Jan 26, 2025", activeDays: 1,
    source: "facebook / paid", sourceType: "paid-social",
    landingPage: "/products/endocrinology",
    topics: ["Endocrinology"],
    intent: { score: 28, level: "Low", reason: "3 visits, product overview only, no downloads or engagement signals" },
    location: { label: "Fargo, ND · US" },
    possibleOrg: null,
    keyAction: { label: "Visited product page", type: "web" },
  },
  {
    id: "L-06858", lastActivityTs: "Jan 26 · 15:17", lastActivityRel: "17d ago",
    visits: 8, firstContact: "Jan 20, 2025", activeDays: 7,
    source: "google / cpc", sourceType: "paid-search",
    landingPage: "/products/oncology/lung",
    topics: ["Oncology", "Lung Cancer"],
    intent: { score: 78, level: "High", reason: "8 visits over 7 days, lung cancer product page 4× + downloaded KOL white paper" },
    location: { label: "Hartford, CT · US" },
    possibleOrg: { name: "Yale New Haven Hospital", confidence: "Medium" },
    keyAction: { label: "Downloaded white paper", type: "download" },
  },
  {
    id: "L-06621", lastActivityTs: "Jan 25 · 20:50", lastActivityRel: "18d ago",
    visits: 5, firstContact: "Jan 22, 2025", activeDays: 4,
    source: "pubmed.com / referral", sourceType: "referral",
    landingPage: "/clinical-evidence/rheumatology",
    topics: ["Rheumatology", "Clinical Evidence"],
    intent: { score: 55, level: "Medium", reason: "5 visits via PubMed, 4 clinical study pages + 1 product overview" },
    location: { label: "Providence, RI · US" },
    possibleOrg: { name: "Brown University Health", confidence: "Low" },
    keyAction: { label: "Spent 12m reading", type: "lightning" },
  },
  {
    id: "L-06384", lastActivityTs: "Jan 25 · 13:24", lastActivityRel: "18d ago",
    visits: 12, firstContact: "Jan 14, 2025", activeDays: 12,
    source: "direct", sourceType: "direct",
    landingPage: "/products/cardiology/afib",
    topics: ["Cardiology", "Electrophysiology", "Clinical Evidence"],
    intent: { score: 92, level: "High", reason: "12 visits over 12 days, AFib product 6× + 4 downloads + webinar + contact form" },
    location: { label: "Bridgeport, CT · US" },
    possibleOrg: { name: "Bridgeport Hospital", confidence: "High" },
    keyAction: { label: "Downloaded brochure", type: "download" },
  },
];

const intentColors = {
  High:   { bg: "bg-[#dcfce7]", text: "text-[#16a34a]" },
  Medium: { bg: "bg-[#fef9c3]", text: "text-[#a16207]" },
  Low:    { bg: "bg-[#f3f4f6]", text: "text-[#6a7282]" },
};
const confidenceColors = {
  High:   { bg: "bg-[#dcfce7]", text: "text-[#16a34a]" },
  Medium: { bg: "bg-[#dbeafe]", text: "text-[#2563eb]" },
  Low:    { bg: "bg-[#f3f4f6]", text: "text-[#6a7282]" },
};
const sourceTypeDot = {
  "paid-search":    "bg-[#3b82f6]",
  "paid-social":    "bg-[#0a66c2]",
  "organic-search": "bg-[#16a34a]",
  social:           "bg-[#7c3aed]",
  direct:           "bg-[#9ca3af]",
  email:            "bg-[#ea580c]",
  referral:         "bg-[#0891b2]",
};

function SignalKeyAction({ action }) {
  const iconMap = {
    download:  <DownloadBrochureIcon />,
    email:     <OpenedEmailIcon />,
    lightning: <LightningIcon />,
    web:       <WebVisitIcon />,
  };
  return (
    <div className="flex items-center gap-1.5 text-sm text-[#4a5565]">
      <span className="text-[#9ca3af]">{iconMap[action.type] ?? iconMap.web}</span>
      {action.label}
    </div>
  );
}

function InfoCircleSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 11V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="8" r="0.75" fill="currentColor" />
    </svg>
  );
}

function generateSignalTimeline(lead) {
  const events = [];
  if (lead.keyAction.type === "download") {
    events.push({ type: "download", label: "Downloaded brochure",             page: lead.landingPage,     time: lead.lastActivityRel });
  } else if (lead.keyAction.type === "email") {
    events.push({ type: "email",    label: "Clicked email link",              page: lead.landingPage,     time: lead.lastActivityRel });
  } else {
    events.push({ type: "web",      label: lead.keyAction.label,              page: lead.landingPage,     time: lead.lastActivityRel });
  }
  if (lead.visits > 2)
    events.push({ type: "web",      label: "Visited product page",            page: lead.landingPage,     time: "2h ago" });
  if (lead.visits > 4)
    events.push({ type: "web",      label: "Browsed clinical evidence",       page: "/clinical-evidence", time: "1d ago" });
  events.push({ type: "web",        label: `First visit via ${lead.source}`,  page: lead.landingPage,     time: lead.firstContact });
  return events;
}

function SignalDetailPanel({ lead, onClose }) {
  const ic = intentColors[lead.intent.level] ?? intentColors.Low;
  const timeline = generateSignalTimeline(lead);
  const iconMap = { download: <DownloadBrochureIcon />, email: <OpenedEmailIcon />, lightning: <LightningIcon />, web: <WebVisitIcon /> };
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-screen w-[420px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-[#0a0a0a]">{lead.id}</span>
              <span className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs font-medium text-[#6a7282]">Anonymous</span>
            </div>
            <span className="text-xs text-[#9ca3af]">Last seen {lead.lastActivityRel}</span>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#6a7282]"><CloseIcon /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Intent */}
          <div className="border-b border-[#f3f4f6] px-6 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#9ca3af]">Intent Score</p>
            <div className="flex items-center gap-4">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-[3px] border-[#e5e7eb] text-xl font-bold text-[#0a0a0a]">
                {lead.intent.score}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={`inline-block self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${ic.bg} ${ic.text}`}>
                  {lead.intent.level} Intent
                </span>
                <p className="text-xs leading-5 text-[#6a7282]">{lead.intent.reason}</p>
              </div>
            </div>
          </div>
          {/* Identity */}
          <div className="border-b border-[#f3f4f6] px-6 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#9ca3af]">Identity Signals</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className="text-xs text-[#6a7282]">Location</span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-sm font-medium text-[#0a0a0a]">{lead.location.label}</span>
                  <span className="text-xs text-[#9ca3af]">IP-based · approx.</span>
                </div>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-xs text-[#6a7282]">Possible org.</span>
                {lead.possibleOrg ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-medium text-[#0a0a0a]">{lead.possibleOrg.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${confidenceColors[lead.possibleOrg.confidence].bg} ${confidenceColors[lead.possibleOrg.confidence].text}`}>
                      {lead.possibleOrg.confidence} confidence
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-[#9ca3af]">Not identified</span>
                )}
              </div>
            </div>
          </div>
          {/* Session */}
          <div className="border-b border-[#f3f4f6] px-6 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#9ca3af]">Session Details</p>
            <div className="grid grid-cols-2 gap-y-3">
              {[
                { label: "Total visits",  value: `${lead.visits}` },
                { label: "Active for",    value: `${lead.activeDays} days` },
                { label: "First contact", value: lead.firstContact },
                { label: "Last seen",     value: lead.lastActivityTs },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-[#6a7282]">{label}</span>
                  <span className="text-sm font-medium text-[#0a0a0a]">{value}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Acquisition */}
          <div className="border-b border-[#f3f4f6] px-6 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#9ca3af]">Acquisition</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6a7282]">Source</span>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${sourceTypeDot[lead.sourceType] ?? "bg-[#9ca3af]"}`} />
                  <span className="text-sm font-medium text-[#0a0a0a]">{lead.source}</span>
                </div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-xs text-[#6a7282]">Landing page</span>
                <span className="truncate font-mono text-xs text-[#4a5565]">{lead.landingPage}</span>
              </div>
            </div>
          </div>
          {/* Topics */}
          <div className="border-b border-[#f3f4f6] px-6 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#9ca3af]">Topics of Interest</p>
            <div className="flex flex-wrap gap-2">
              {lead.topics.map((t) => (
                <span key={t} className="rounded-full bg-[#dbeafe] px-2.5 py-1 text-xs font-medium text-[#2563eb]">{t}</span>
              ))}
            </div>
          </div>
          {/* Timeline */}
          <div className="px-6 py-4">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-[#9ca3af]">Recent Activity</p>
            <div className="flex flex-col">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[#6a7282]">
                      <span className="scale-75">{iconMap[event.type] ?? iconMap.web}</span>
                    </div>
                    {i < timeline.length - 1 && <div className="my-1 w-px flex-1 bg-[#e5e7eb]" />}
                  </div>
                  <div className={`flex flex-col gap-0.5 ${i < timeline.length - 1 ? "pb-4" : ""}`}>
                    <span className="text-sm font-medium text-[#0a0a0a]">{event.label}</span>
                    <span className="text-xs text-[#9ca3af]">{event.page} · {event.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Compute aggregated hospital scores from affiliated HCPs ──────── */
// Compute aggregated hospital scores from affiliated HCPs
function getHospitalScores(hcpIds) {
  if (!hcpIds || hcpIds.length === 0) return { engagement: 0, icp: 0, account: 0 };
  const hcps = hcpIds.map((id) => hcpRows.find((h) => h.id === id)).filter(Boolean);
  const avgEngagement = Math.round(hcps.reduce((s, h) => s + h.engagementScore, 0) / hcps.length);
  const avgIcp        = Math.round(hcps.reduce((s, h) => s + h.icpGrading, 0) / hcps.length);
  const account       = avgEngagement + avgIcp;
  return { engagement: avgEngagement, icp: avgIcp, account };
}

function getHospitalScore(hcpIds) {
  return getHospitalScores(hcpIds).account;
}

// Aggregate engagement score for a pharma from its linked pharmacists
function getPharmaScore(pharmacistIds) {
  if (!pharmacistIds || pharmacistIds.length === 0) return 0;
  const linked = pharmacistIds.map((id) => pharmacistRows.find((p) => p.id === id)).filter(Boolean);
  return Math.round(linked.reduce((s, p) => s + p.leadScore, 0) / linked.length);
}


export default function Profiles() {
  const navigate = useNavigate();
  const { uploadedDatabases } = useMappingContext();
  const hasSource = uploadedDatabases.length > 0;
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "HCPs";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [scoreModal, setScoreModal] = useState(null);
  const [hospitalScoreModal, setHospitalScoreModal] = useState(null);
  const [resolvedConflictCount, setResolvedConflictCount] = useState(() => {
    try { const r = JSON.parse(localStorage.getItem("hco-resolved-conflicts") || "[]"); return Array.isArray(r) ? r.length : 0; } catch { return 0; }
  });
  const [hcpResolvedCount, setHcpResolvedCount] = useState(() => {
    try { const r = JSON.parse(localStorage.getItem("hcp-resolved-conflicts") || "[]"); return Array.isArray(r) ? r.length : 0; } catch { return 0; }
  });
  const [hcpUploadPending, setHcpUploadPending] = useState(() =>
    !!localStorage.getItem("hcp-upload-conflicts")
  );
  const [pharmacistResolvedCount, setPharmacistResolvedCount] = useState(() => {
    try { const r = JSON.parse(localStorage.getItem("pharmacist-resolved-conflicts") || "[]"); return Array.isArray(r) ? r.length : 0; } catch { return 0; }
  });
  const [successBanner, setSuccessBanner] = useState(null); // { type: "merge"|"separate", tab: string } | null

  // Effective conflict totals — scale with number of uploaded databases
  const uploadCount = uploadedDatabases.length;
  const hasShopifyFile = uploadedDatabases.some((db) => db.fileName === "Shopify sample.xlsx");
  const effectiveHcpTotal   = uploadCount >= 5 ? HCP_CONFLICT_TOTAL : uploadCount >= 1 ? 2 : 0;
  const effectiveHcoTotal   = uploadCount >= 5 || hasShopifyFile ? HCO_CONFLICT_TOTAL : 0;
  const effectivePharmTotal = uploadCount >= 2 ? PHARMACIST_CONFLICT_TOTAL : 0;

  // Which stakeholder tabs currently have unresolved conflicts
  const tabConflicts = {
    HCPs:        effectiveHcpTotal  > 0 && hcpResolvedCount        < effectiveHcpTotal,
    HCOs:        effectiveHcoTotal  > 0 && resolvedConflictCount    < effectiveHcoTotal,
    Pharmacists: effectivePharmTotal > 0 && pharmacistResolvedCount < effectivePharmTotal,
  };

  // Read ?resolved param on mount (set by ConflictResolution after last conflict is done)
  useEffect(() => {
    const resolved = searchParams.get("resolved");
    const tab = searchParams.get("tab") || "HCPs";
    if (resolved === "merge" || resolved === "entry" || resolved === "separate") {
      setSuccessBanner({ type: resolved, tab });
      navigate(`/profiles?tab=${tab}`, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss success toast after 4 s
  useEffect(() => {
    if (!successBanner) return;
    const t = setTimeout(() => setSuccessBanner(null), 4000);
    return () => clearTimeout(t);
  }, [successBanner]);

  // Reset resolved-conflict counts whenever the upload count grows past what
  // was last seen. We persist "conflict-last-reset-count" in localStorage so
  // the comparison survives page navigations (avoids re-clearing after user
  // resolves conflicts and comes back to this page).
  useEffect(() => {
    const lastReset = (() => {
      try { return parseInt(localStorage.getItem("conflict-last-reset-count") ?? "-1", 10); }
      catch { return -1; }
    })();
    if (uploadCount === lastReset) return; // count unchanged — preserve resolved state
    try { localStorage.setItem("conflict-last-reset-count", String(uploadCount)); } catch {}
    try { localStorage.removeItem("hcp-resolved-conflicts"); } catch {}
    try { localStorage.removeItem("hco-resolved-conflicts"); } catch {}
    try { localStorage.removeItem("pharmacist-resolved-conflicts"); } catch {}
    try { localStorage.removeItem("hcp-upload-conflicts"); } catch {}
    setHcpResolvedCount(0);
    setResolvedConflictCount(0);
    setPharmacistResolvedCount(0);
  }, [uploadCount]); // eslint-disable-line react-hooks/exhaustive-deps
  const [stakeholderOpen, setStakeholderOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [filterDropdown, setFilterDropdown] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const tableBodyRef = useRef(null);
  const signalTableRef = useRef(null);
  const pharmacistTableRef = useRef(null);
  const pharmaTableRef = useRef(null);
  const [pageSize, setPageSize] = useState(8);
  const [signalPageSize, setSignalPageSize] = useState(8);
  const [pharmacistPageSize, setPharmacistPageSize] = useState(8);
  const [pharmacistPage, setPharmacistPage] = useState(1);
  const [pharmaPageSize, setPharmaPageSize] = useState(8);
  const [pharmaPage, setPharmaPage] = useState(1);
  const [signalSearch, setSignalSearch] = useState("");
  const [pharmacistSearch, setPharmacistSearch] = useState("");
  const [pharmaSearch, setPharmaSearch] = useState("");
  // Column drag-and-drop — order persisted in localStorage
  const [columnOrder, setColumnOrder] = useState(() => {
    try {
      const saved = localStorage.getItem("hcp-column-order");
      if (saved) {
        const p = JSON.parse(saved);
        if (Array.isArray(p) && p.length === HCP_DEFAULT_COL_ORDER.length && p.every((id) => HCP_COL_BY_ID[id]))
          return p;
      }
    } catch {}
    return HCP_DEFAULT_COL_ORDER;
  });
  const dragColRef = useRef(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  function updateColumnOrder(next) {
    setColumnOrder(next);
    try { localStorage.setItem("hcp-column-order", JSON.stringify(next)); } catch {}
  }

  // Header context selectors (HCPs tab)
  const [productFamily, setProductFamily] = useState("cardiovascular");
  const [timePeriod, setTimePeriod] = useState("cal-year");

  // Score detail modals (click on a specific number in the table)
  const [scoreDetailModal, setScoreDetailModal] = useState(null); // { type: "icp"|"eng", row, aff, score }

  useEffect(() => {
    if (activeTab !== "HCPs") return;
    const el = tableBodyRef.current;
    if (!el) return;
    const ROW_HEIGHT = 53;
    const HEADER_HEIGHT = 49;
    const recompute = () => {
      const available = el.clientHeight - HEADER_HEIGHT;
      const rows = Math.max(4, Math.floor(available / ROW_HEIGHT));
      setPageSize(rows);
    };
    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "Pharmacists") return;
    const el = pharmacistTableRef.current;
    if (!el) return;
    const ROW_HEIGHT = 64;
    const HEADER_HEIGHT = 49;
    const recompute = () => {
      const available = el.clientHeight - HEADER_HEIGHT;
      const rows = Math.max(4, Math.floor(available / ROW_HEIGHT));
      setPharmacistPageSize(rows);
      setPharmacistPage(1);
    };
    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "Pharmacys") return;
    const el = pharmaTableRef.current;
    if (!el) return;
    const ROW_HEIGHT = 80;
    const HEADER_HEIGHT = 49;
    const recompute = () => {
      const available = el.clientHeight - HEADER_HEIGHT;
      const rows = Math.max(4, Math.floor(available / ROW_HEIGHT));
      setPharmaPageSize(rows);
      setPharmaPage(1);
    };
    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "Signals") return;
    const el = signalTableRef.current;
    if (!el) return;
    const ROW_HEIGHT = 70;
    const HEADER_HEIGHT = 49;
    const recompute = () => {
      const available = el.clientHeight - HEADER_HEIGHT;
      const rows = Math.max(4, Math.floor(available / ROW_HEIGHT));
      setSignalPageSize(rows);
    };
    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab]);

  // Re-sync conflict state from localStorage whenever a tab is focused
  useEffect(() => {
    if (activeTab === "HCOs") {
      try {
        const r = JSON.parse(localStorage.getItem("hco-resolved-conflicts") || "[]");
        setResolvedConflictCount(Array.isArray(r) ? r.length : 0);
      } catch {}
    }
    if (activeTab === "HCPs") {
      try {
        const r = JSON.parse(localStorage.getItem("hcp-resolved-conflicts") || "[]");
        setHcpResolvedCount(Array.isArray(r) ? r.length : 0);
      } catch {}
      setHcpUploadPending(!!localStorage.getItem("hcp-upload-conflicts"));
    }
    if (activeTab === "Pharmacists") {
      try {
        const r = JSON.parse(localStorage.getItem("pharmacist-resolved-conflicts") || "[]");
        setPharmacistResolvedCount(Array.isArray(r) ? r.length : 0);
      } catch {}
    }
  }, [activeTab]);

  function toggleSort(key) {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
  }

  const activeFilterCount =
    appliedFilters.priorities.length +
    appliedFilters.specialties.length +
    appliedFilters.affiliations.length +
    (appliedFilters.icpMin !== "" || appliedFilters.icpMax !== "" ? 1 : 0) +
    (appliedFilters.engMin !== "" || appliedFilters.engMax !== "" ? 1 : 0) +
    (appliedFilters.kolOnly ? 1 : 0) +
    appliedFilters.crmSegments.length +
    appliedFilters.countries.length +
    appliedFilters.products.length +
    appliedFilters.funnelStages.length +
    appliedFilters.classification.length;

  // Filter HCP rows by search query and applied filters
  const filteredRows = hcpRows.filter((row) => {
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchesName = row.name.toLowerCase().includes(query);
      const matchesAffiliation = row.affiliations.some((a) => a.toLowerCase().includes(query));
      if (!matchesName && !matchesAffiliation) return false;
    }
    const f = appliedFilters;
    if (f.priorities.length > 0 && !f.priorities.includes(getPriority(row.leadScore))) return false;
    if (f.specialties.length > 0 && !f.specialties.includes(row.specialty)) return false;
    if (f.affiliations.length > 0 && !row.affiliations.some((a) => f.affiliations.includes(a))) return false;
    if (f.icpMin !== "" && row.icpGrading < Number(f.icpMin)) return false;
    if (f.icpMax !== "" && row.icpGrading > Number(f.icpMax)) return false;
    if (f.engMin !== "" && row.engagementScore < Number(f.engMin)) return false;
    if (f.engMax !== "" && row.engagementScore > Number(f.engMax)) return false;
    if (f.kolOnly && !row.isKol) return false;
    if (f.crmSegments.length > 0 && !f.crmSegments.includes(row.crmSegment)) return false;
    if (f.countries.length > 0 && !f.countries.includes(getCountry(row))) return false;
    if (f.products.length > 0 && !(row.interests || []).some((p) => f.products.includes(p))) return false;
    if (f.funnelStages.length > 0 && !f.funnelStages.includes(getFunnelStage(row.leadScore))) return false;
    if (f.classification.length > 0 && !f.classification.includes(getClassification(row.id))) return false;
    return true;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const dir = sortConfig.direction === "asc" ? 1 : -1;
    let av, bv;
    switch (sortConfig.key) {
      case "name":
        av = a.name; bv = b.name; break;
      case "icp":
        av = a.icpGrading; bv = b.icpGrading; break;
      case "engagement":
        av = a.engagementScore; bv = b.engagementScore; break;
      default:
        return 0;
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return  1 * dir;
    return 0;
  });

  const hcpPageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pagedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleDraft(field, value) {
    setDraftFilters((prev) => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  }

  // Filter Hospital rows by search query (name or city)
  const filteredHospitalRows = hospitalRows.filter((row) => {
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchesName = row.name.toLowerCase().includes(query);
      const matchesCity = row.city.toLowerCase().includes(query);
      if (!matchesName && !matchesCity) return false;
    }
    return true;
  });

  if (!hasSource) {
    return (
      <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3f4f6]">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="10" stroke="#9ca3af" strokeWidth="1.5"/>
                <path d="M10 14h8M14 10v8" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-base font-semibold text-[#0a0a0a]">No source connected</p>
              <p className="max-w-[360px] text-sm text-[#6a7282]">
                No source has been connected or uploaded. Connect a source or upload a database to visualize your healthcare professional profiles.
              </p>
            </div>
            <button
              onClick={() => navigate("/?tab=databases")}
              className="mt-1 rounded-[10px] bg-[#155dfc] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1247cc]"
            >
              Go to Data sources
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col gap-6 px-8 pt-8 pb-10">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">
              Profiles
            </h1>
            <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
              Visualize your Healthcare Professionals and organizations identified by the system with their engagement priorities, as well as anonymous intent signals from online visitors not yet matched to a known contact.
            </p>
          </div>

          {/* ── Success toast (shown after conflict resolution) — fixed bottom-right ── */}
          {successBanner && (
            <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 rounded-[12px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 shadow-lg">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                <circle cx="9" cy="9" r="9" fill="#dcfce7"/>
                <path d="M5.5 9L7.8 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm font-medium text-[#15803d]">Conflicts resolved successfully.</span>
              <button
                onClick={() => setSuccessBanner(null)}
                className="shrink-0 text-[#15803d] opacity-60 transition-opacity hover:opacity-100"
                aria-label="Dismiss"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}

          {/* Filters bar */}
          <div className="flex items-center gap-4">
            {/* Stakeholders dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#6a7282]">Stakeholders</span>
              <div className="relative">
                {/* Trigger */}
                <button
                  onClick={() => setStakeholderOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-[8px] border border-[#d1d5dc] bg-white px-3 py-1.5 text-sm text-[#0a0a0a] hover:bg-gray-50 focus:outline-none"
                >
                  {tabConflicts[activeTab] && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                      <path d="M7 1.75L12.25 11.25H1.75L7 1.75Z" fill="#f97316" stroke="#f97316" strokeWidth="0.5" strokeLinejoin="round"/>
                      <path d="M7 5.5V8" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                      <circle cx="7" cy="9.75" r="0.6" fill="white"/>
                    </svg>
                  )}
                  <span>{activeTab} ({tabs.find((t) => t.label === activeTab)?.count})</span>
                  <span className={`transition-transform duration-150 ${stakeholderOpen ? "rotate-180" : ""}`}>
                    <ChevronDownIcon />
                  </span>
                </button>

                {/* Backdrop + list */}
                {stakeholderOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setStakeholderOpen(false)} />
                    <div className="absolute left-0 top-full z-20 mt-1 min-w-[170px] overflow-hidden rounded-[10px] border border-[#d1d5dc] bg-white shadow-lg">
                      {tabs.map((tab) => (
                        <button
                          key={tab.label}
                          onClick={() => {
                            setActiveTab(tab.label);
                            setSearchQuery("");
                            setCurrentPage(1);
                            setStakeholderOpen(false);
                          }}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                            activeTab === tab.label ? "font-semibold text-[#155dfc]" : "text-[#0a0a0a]"
                          }`}
                        >
                          <span>{tab.label} ({tab.count})</span>
                          {tabConflicts[tab.label] && (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                              <path d="M7 1.75L12.25 11.25H1.75L7 1.75Z" fill="#f97316" stroke="#f97316" strokeWidth="0.5" strokeLinejoin="round"/>
                              <path d="M7 5.5V8" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                              <circle cx="7" cy="9.75" r="0.6" fill="white"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Product family dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#6a7282]">Product family</span>
              <select
                value={productFamily}
                onChange={(e) => { setProductFamily(e.target.value); setCurrentPage(1); }}
                className="rounded-[8px] border border-[#d1d5dc] bg-white px-3 py-1.5 text-sm text-[#0a0a0a] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
              >
                <option value="cardiovascular">Cardiovascular</option>
                <option value="structural">Structural Heart</option>
                <option value="ep">Electrophysiology</option>
                <option value="hf">Heart Failure</option>
                <option value="vascular">Vascular</option>
                <option value="cardiac-surgery">Cardiac Surgery</option>
              </select>
            </div>

            {/* Range dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#6a7282]">Range</span>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="rounded-[8px] border border-[#d1d5dc] bg-white px-3 py-1.5 text-sm text-[#0a0a0a] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
              >
                <option value="cal-year">Calendar Year</option>
                <option value="rolling-12m">Rolling 12M</option>
                <option value="ytd">YTD</option>
                <option value="quarter">Quarter</option>
              </select>
            </div>
          </div>

          {/* ── HCPs Tab Content ─────────────────────────────────── */}
          {activeTab === "HCPs" && (
            <div className="flex flex-1 flex-col gap-6 min-h-0">
              {/* HCP conflict banner */}
              {effectiveHcpTotal > 0 && hcpResolvedCount < effectiveHcpTotal && (
                <div className="flex items-center justify-between rounded-[12px] border border-[#fed7aa] bg-[#fff7ed] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <WarningIcon />
                    <span className="text-sm font-medium text-[#9f2d00]">
                      {effectiveHcpTotal - hcpResolvedCount} conflict{effectiveHcpTotal - hcpResolvedCount > 1 ? "s" : ""} detected after the new database upload. Please review and resolve them.
                    </span>
                  </div>
                  <button
                    onClick={() => navigate("/profiles/conflict?entity=hcp")}
                    className="rounded-[10px] bg-[#f54900] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#dc4200]"
                  >
                    Review conflicts
                  </button>
                </div>
              )}
              {/* Toolbar: search · product family · time period · filter · config */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                    <SearchIcon20 />
                  </span>
                  <input
                    type="text"
                    placeholder="Search profiles by name or affiliation"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full rounded-[12px] border border-[#d1d5dc] bg-white py-3 pl-10 pr-4 text-base text-[#0a0a0a] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  />
                </div>

                {/* Filter */}
                <button
                  onClick={() => { setDraftFilters(appliedFilters); setFilterDropdown(null); setFilterOpen(true); }}
                  className="relative flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50"
                >
                  <FilterIcon />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#155dfc] text-[10px] font-semibold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* HCP score configuration */}
                <button
                  onClick={() => navigate("/leading-board/score-configuration?entity=hcp")}
                  className="flex items-center gap-2 rounded-[10px] bg-[#155dfc] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1249cc]"
                >
                  HCP score configuration
                </button>
              </div>

              {/* HCP Table */}
              <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[14px] border border-gray-200 bg-white">
                <div ref={tableBodyRef} className="flex-1 min-h-0 overflow-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-gray-200 bg-[#f9fafb]">
                      {columnOrder.map((colId, colIdx) => {
                        const col = HCP_COL_BY_ID[colId];
                        return (
                          <th
                            key={colId}
                            draggable
                            onDragStart={() => { dragColRef.current = colIdx; }}
                            onDragOver={(e) => { e.preventDefault(); setDragOverCol(colIdx); }}
                            onDragLeave={() => setDragOverCol(null)}
                            onDrop={() => {
                              const from = dragColRef.current;
                              setDragOverCol(null);
                              if (from == null || from === colIdx) return;
                              const next = [...columnOrder];
                              const [item] = next.splice(from, 1);
                              next.splice(colIdx, 0, item);
                              updateColumnOrder(next);
                            }}
                            className={`cursor-grab select-none whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282] transition-colors ${dragOverCol === colIdx ? "bg-[#dbeafe]" : ""}`}
                          >
                            {col.sortKey ? (
                              <button
                                onClick={() => toggleSort(col.sortKey)}
                                className="inline-flex items-center gap-1 font-semibold uppercase tracking-[0.6px] hover:text-[#0a0a0a]"
                              >
                                {col.label}
                                <SortIndicator active={sortConfig.key === col.sortKey} direction={sortConfig.direction} />
                              </button>
                            ) : col.label}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.length > 0 ? (
                      pagedRows.flatMap((row) => {
                        const affCount = row.affiliations.length;
                        return row.affiliations.map((aff, affIdx) => {
                          const affIcp = getAffiliationIcp(row.icpGrading, aff, productFamily);
                          const affEngScore = getFamilyEngScore(row.engagementScore, productFamily);
                          const hospitalId = affiliationHospitalIds[aff];
                          const classification = getClassification(row.id);
                          const crmLabels = getCrmLabels(row.crmSegment);
                          return (
                            <tr key={`${row.id}-${affIdx}`} className={affIdx === affCount - 1 ? "border-b border-gray-200 last:border-b-0" : ""}>
                              {columnOrder.map((colId) => {
                                const col = HCP_COL_BY_ID[colId];
                                if (col.rowspan && affIdx > 0) return null;
                                const spanProps = col.rowspan && affCount > 1
                                  ? { rowSpan: affCount, className: "px-6 py-4 align-top" }
                                  : { className: "px-6 py-4" };
                                // With only 1 file uploaded, only basic identity columns have real data
                                const BASIC_COLS = new Set(["onekeyId", "name", "email", "specialty", "country", "affiliation"]);
                                if (uploadCount === 1 && !BASIC_COLS.has(colId)) {
                                  return <td key={colId} {...spanProps}><span className="text-sm text-[#d1d5dc]">—</span></td>;
                                }

                                let cell;
                                switch (colId) {
                                  case "onekeyId":
                                    cell = <span className="whitespace-nowrap text-sm text-[#4a5565]">{row.onekeyId}</span>;
                                    break;
                                  case "name":
                                    cell = <button onClick={() => navigate(`/profiles/hcp/${row.id}`)} className="whitespace-nowrap text-sm font-medium text-[#155dfc] hover:underline">{row.name}</button>;
                                    break;
                                  case "email":
                                    cell = <span className="whitespace-nowrap text-sm text-[#4a5565]">{row.email}</span>;
                                    break;
                                  case "specialty":
                                    cell = <span className="whitespace-nowrap text-sm text-[#4a5565]">{row.specialty}</span>;
                                    break;
                                  case "country":
                                    cell = <span className="whitespace-nowrap text-sm text-[#4a5565]">{getCountry(row)}</span>;
                                    break;
                                  case "affiliation":
                                    cell = hospitalId
                                      ? <button onClick={() => navigate(`/profiles/hospital/${hospitalId}`)} className="whitespace-nowrap text-sm text-[#155dfc] hover:underline">{aff}</button>
                                      : <span className="whitespace-nowrap text-sm text-[#4a5565]">{aff}</span>;
                                    break;
                                  case "icpScore":
                                    cell = (
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => setScoreDetailModal({ type: "icp", row, aff, score: affIcp })}
                                          className="text-sm font-medium text-[#0a0a0a] underline decoration-dotted underline-offset-2 hover:text-[#155dfc]"
                                        >
                                          {affIcp}
                                        </button>
                                        {(row.missingFields?.length ?? 0) > 0 && (
                                          <button
                                            onClick={() => setScoreDetailModal({ type: "icp", row, aff, score: affIcp })}
                                            className="flex shrink-0 items-center text-[#f59e0b] hover:text-[#d97706] transition-colors"
                                            title={`${row.missingFields.length} field${row.missingFields.length > 1 ? "s" : ""} missing from configured sources`}
                                          >
                                            <WarningIcon />
                                          </button>
                                        )}
                                      </div>
                                    );
                                    break;
                                  case "engagementScore":
                                    cell = <button onClick={() => setScoreDetailModal({ type: "eng", row, aff, score: affEngScore })} className="text-sm text-[#4a5565] underline decoration-dotted underline-offset-2 hover:text-[#155dfc]">{affEngScore}</button>;
                                    break;
                                  case "priority":
                                    cell = <div className="flex justify-center"><span className={`rounded px-2.5 py-1 text-xs font-medium ${priorityStyles[getPriority(row.leadScore)]}`}>{getPriority(row.leadScore)}</span></div>;
                                    break;
                                  case "kol":
                                    cell = <div className="flex justify-center">{row.isKol ? <span className="rounded px-2.5 py-1 text-xs font-medium bg-[#dcfce7] text-[#15803d]">KOL</span> : <span className="text-sm text-[#d1d5dc]">—</span>}</div>;
                                    break;
                                  case "funnel":
                                    cell = <span className={`rounded px-2.5 py-1 text-xs font-medium ${funnelStageStyles[getFunnelStage(row.leadScore)]}`}>{getFunnelStage(row.leadScore)}</span>;
                                    break;
                                  case "crmSegment":
                                    cell = <span className="text-sm text-[#4a5565]">{crmLabels.join(" · ")}</span>;
                                    break;
                                  case "classification":
                                    cell = <span className="text-sm text-[#4a5565]">{classification}</span>;
                                    break;
                                  case "interests":
                                    cell = (
                                      <div className="flex flex-wrap gap-1">
                                        {row.interests.map((interest) => (
                                          <span key={interest} className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-2 py-0.5 text-xs text-[#1d4ed8]">{interest}</span>
                                        ))}
                                      </div>
                                    );
                                    break;
                                  default:
                                    cell = null;
                                }
                                return <td key={colId} {...spanProps}>{cell}</td>;
                              })}
                            </tr>
                          );
                        });
                      })
                    ) : (
                      <tr>
                        <td colSpan={columnOrder.length} className="px-6 py-12 text-center">
                          <p className="text-sm text-[#6a7282]">
                            No profiles match your search.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>

                {/* Pagination footer */}
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                  <span className="text-sm text-[#4a5565]">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, sortedRows.length)}–{Math.min(currentPage * pageSize, sortedRows.length)} of {sortedRows.length} results
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronLeftIcon />
                    </button>
                    {Array.from({ length: hcpPageCount }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-8 min-w-[30px] items-center justify-center rounded text-sm font-medium transition-colors ${
                          currentPage === page ? "bg-[#155dfc] text-white" : "text-[#364153] hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(hcpPageCount, p + 1))}
                      disabled={currentPage === hcpPageCount}
                      className="flex h-8 w-8 items-center justify-center rounded text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── HCOs Tab Content ─────────────────────────────────── */}
          {activeTab === "HCOs" && (
            <div className="flex flex-1 flex-col gap-6 min-h-0">
              {/* HCO conflict banner */}
              {effectiveHcoTotal > 0 && resolvedConflictCount < effectiveHcoTotal && (
                <div className="flex items-center justify-between rounded-[12px] border border-[#fed7aa] bg-[#fff7ed] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <WarningIcon />
                    <span className="text-sm font-medium text-[#9f2d00]">
                      {effectiveHcoTotal - resolvedConflictCount} conflict{effectiveHcoTotal - resolvedConflictCount > 1 ? "s" : ""} detected in hospital profiles. Please review and resolve them.
                    </span>
                  </div>
                  <button
                    onClick={() => navigate("/profiles/conflict?entity=hco")}
                    className="rounded-[10px] bg-[#f54900] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#dc4200]"
                  >
                    Review conflicts
                  </button>
                </div>
              )}

              {/* Search + Filter */}
              <div className="flex items-end gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                    <SearchIcon20 />
                  </span>
                  <input
                    type="text"
                    placeholder="Search hospitals by name or city"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-[12px] border border-[#d1d5dc] bg-white py-3 pl-10 pr-4 text-base text-[#0a0a0a] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  />
                </div>

                {/* Score configuration button */}
                <button
                  onClick={() => navigate("/leading-board/score-configuration?entity=hco")}
                  className="flex items-center gap-2 rounded-[10px] bg-[#155dfc] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1249cc]"
                >
                  HCO score configuration
                </button>
                {/* Filter button */}
                <button className="flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
                  <FilterIcon />
                  Filter
                </button>
              </div>

              {/* Hospital Table */}
              <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[14px] border border-gray-200 bg-white">
                <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-[#f9fafb]">
                      <th className="px-6 py-[14px] text-left">
                        <div className="h-4 w-4 border border-[#77808b]" />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Hospital Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Sales
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Market Share
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Potential
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        City
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Management
                      </th>
                      <th className="w-[120px] px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        SAP
                      </th>
                      <th className="w-[120px] px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Score
                      </th>
                      <th className="w-[120px] px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Priority
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHospitalRows.length > 0 ? (
                      filteredHospitalRows.map((row) => (
                        <tr
                          key={row.name}
                          className="border-b border-gray-200 last:border-b-0"
                        >
                          <td className="px-6 py-5">
                            <div className="h-4 w-4 border border-[#4a5565]" />
                          </td>
                          <td className="px-6 py-[19px]">
                            <button
                              onClick={() => navigate(`/profiles/hospital/${row.id}`)}
                              className="text-sm font-medium text-[#101828] transition-colors hover:text-[#155dfc] hover:underline"
                            >
                              {row.name}
                            </button>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-[#4a5565]">
                              {row.sales}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-[#4a5565]">
                              {row.marketShare}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-[#4a5565]">
                              {row.potential}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-[#4a5565]">
                              {row.city}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-[#4a5565]">
                              {row.management}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-[#4a5565]">
                              {row.sap}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <button
                              onClick={() => setHospitalScoreModal(row)}
                              className="text-sm font-medium text-[#5598f6] underline opacity-90 transition-colors hover:text-[#155dfc]"
                            >
                              {getHospitalScore(row.hcpIds)}
                            </button>
                          </td>
                          <td className="px-6 py-[17px]">
                            <div className="flex justify-center">
                              <span className={`rounded px-2.5 py-1 text-xs font-medium ${priorityStyles[getPriority(getHospitalScore(row.hcpIds))]}`}>
                                {getPriority(getHospitalScore(row.hcpIds))}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center">
                          <p className="text-sm text-[#6a7282]">
                            No hospitals match your search.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>

                {/* Pagination footer */}
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                  <span className="text-sm text-[#4a5565]">
                    Showing 1 to {filteredHospitalRows.length} of 842 results
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronLeftIcon />
                    </button>
                    {[1, 2, 3, 4, 5].map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-8 min-w-[30px] items-center justify-center rounded text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-[#155dfc] text-white"
                            : "text-[#364153] hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <span className="px-1 text-base text-[#99a1af]">...</span>
                    <button
                      onClick={() => setCurrentPage(8)}
                      className={`flex h-8 min-w-[30px] items-center justify-center rounded text-sm font-medium transition-colors ${
                        currentPage === 8
                          ? "bg-[#155dfc] text-white"
                          : "text-[#364153] hover:bg-gray-50"
                      }`}
                    >
                      8
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(8, p + 1))}
                      disabled={currentPage === 8}
                      className="flex h-8 w-8 items-center justify-center rounded text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Pharmacists Tab Content ──────────────────────────── */}
          {activeTab === "Pharmacists" && (() => {
            const filteredPharmacists = pharmacistRows.filter((row) => {
              const q = pharmacistSearch.toLowerCase().trim();
              if (!q) return true;
              return (
                row.name.toLowerCase().includes(q) ||
                row.licenseId.toLowerCase().includes(q) ||
                row.role.toLowerCase().includes(q) ||
                row.specialtyArea.toLowerCase().includes(q) ||
                row.pharmacyName.toLowerCase().includes(q) ||
                row.chainAffiliation.toLowerCase().includes(q) ||
                row.city.toLowerCase().includes(q) ||
                row.region.toLowerCase().includes(q)
              );
            });
            const pharmacistPageCount = Math.max(1, Math.ceil(filteredPharmacists.length / pharmacistPageSize));
            const pagedPharmacists = filteredPharmacists.slice(
              (pharmacistPage - 1) * pharmacistPageSize,
              pharmacistPage * pharmacistPageSize
            );
            const typeStyles = {
              Community:   "bg-[#f3f4f6] text-[#4a5565]",
              Hospital:    "bg-[#dbeafe] text-[#1d4ed8]",
              Clinical:    "bg-[#ede9fe] text-[#6d28d9]",
              Compounding: "bg-[#fef3c7] text-[#92400e]",
              Specialty:   "bg-[#dcfce7] text-[#15803d]",
            };
            const catchmentStyles = {
              Urban:    "bg-[#dbeafe] text-[#1d4ed8]",
              Suburban: "bg-[#ede9fe] text-[#6d28d9]",
              Rural:    "bg-[#dcfce7] text-[#15803d]",
            };
            const substitutionStyles = {
              Yes:       "bg-[#dcfce7] text-[#15803d]",
              No:        "bg-[#fee2e2] text-[#b91c1c]",
              Selective: "bg-[#fef9c3] text-[#a16207]",
            };
            const sentimentStyles = {
              Cold:     "bg-[#f3f4f6] text-[#4a5565]",
              Warm:     "bg-[#fef9c3] text-[#a16207]",
              Champion: "bg-[#dcfce7] text-[#15803d]",
            };
            const reimbStyles = {
              Public:  "bg-[#dbeafe] text-[#1d4ed8]",
              Private: "bg-[#ede9fe] text-[#6d28d9]",
              Mixed:   "bg-[#f3f4f6] text-[#4a5565]",
            };
            const TH = ({ children, w }) => (
              <th style={w ? { minWidth: w } : undefined} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282] whitespace-nowrap">{children}</th>
            );
            return (
              <div className="flex flex-1 min-h-0 flex-col gap-6">
                {/* Pharmacist conflict banner */}
                {effectivePharmTotal > 0 && pharmacistResolvedCount < effectivePharmTotal && (
                  <div className="flex items-center justify-between rounded-[12px] border border-[#fed7aa] bg-[#fff7ed] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <WarningIcon />
                      <span className="text-sm font-medium text-[#9f2d00]">
                        {effectivePharmTotal - pharmacistResolvedCount} conflict{effectivePharmTotal - pharmacistResolvedCount > 1 ? "s" : ""} detected in pharmacist profiles. Please review and resolve them.
                      </span>
                    </div>
                    <button
                      onClick={() => navigate("/profiles/conflict?entity=pharmacist")}
                      className="shrink-0 rounded-[8px] border border-[#fed7aa] bg-white px-3 py-1.5 text-sm font-medium text-[#9f2d00] transition-colors hover:bg-[#fff7ed]"
                    >
                      Resolve conflicts
                    </button>
                  </div>
                )}
                {/* Toolbar */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"><SearchIcon20 /></span>
                    <input
                      type="text"
                      placeholder="Search by name, license, specialty, pharmacy…"
                      value={pharmacistSearch}
                      onChange={(e) => setPharmacistSearch(e.target.value)}
                      className="w-full rounded-[12px] border border-[#d1d5dc] bg-white py-3 pl-10 pr-4 text-base text-[#0a0a0a] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                    />
                  </div>
                  <button
                    onClick={() => navigate("/leading-board/score-configuration?entity=hcp")}
                    className="flex items-center gap-2 rounded-[10px] bg-[#155dfc] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1249cc]"
                  >
                    Pharmacist score configuration
                  </button>
                  <button className="flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
                    <FilterIcon />
                    Filter
                  </button>
                </div>

                {/* Table */}
                <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[14px] border border-gray-200 bg-white">
                  <div ref={pharmacistTableRef} className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full" style={{ minWidth: "2800px" }}>
                      <thead>
                        <tr className="border-b border-gray-200 bg-[#f9fafb]">
                          <TH w="120px">License ID</TH>
                          <TH w="180px">Full Name / Title</TH>
                          <TH w="130px">Type</TH>
                          <TH w="160px">Specialty Area</TH>
                          <TH w="160px">Role</TH>
                          <TH w="220px">Academic Affiliation</TH>
                          <TH w="180px">Associations</TH>
                          <TH w="220px">Pharmacy / Chain</TH>
                          <TH w="180px">City · Region · ZIP</TH>
                          <TH w="110px">Catchment</TH>
                          <TH w="130px">Patient Volume</TH>
                          <TH w="220px">Top Therapeutic Areas</TH>
                          <TH w="180px">Top Brands</TH>
                          <TH w="110px">Generic Ratio</TH>
                          <TH w="110px">Avg Rx / mo</TH>
                          <TH w="180px">Rep · Frequency</TH>
                          <TH w="140px">Pref. Channel</TH>
                          <TH w="110px">Sentiment</TH>
                          <TH w="120px">Engagement Score</TH>
                          <TH w="110px">Reimbursement</TH>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedPharmacists.length > 0 ? pagedPharmacists.map((row) => (
                          <tr key={row.id} className="border-b border-gray-200 last:border-b-0 transition-colors hover:bg-[#f9fafb]">
                            {/* License ID */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="font-mono text-xs text-[#6a7282]">{row.licenseId}</span>
                            </td>
                            {/* Full Name / Title */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium text-[#0a0a0a]">{row.name}</span>
                                <span className="text-xs text-[#9ca3af]">{row.title}</span>
                              </div>
                            </td>
                            {/* Type */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeStyles[row.type] ?? "bg-[#f3f4f6] text-[#4a5565]"}`}>{row.type}</span>
                            </td>
                            {/* Specialty Area */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-[#4a5565]">{row.specialtyArea}</span>
                            </td>
                            {/* Role */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-[#4a5565]">{row.role}</span>
                            </td>
                            {/* Academic Affiliation */}
                            <td className="px-4 py-4">
                              {row.academicAffiliation
                                ? <span className="text-sm text-[#4a5565]">{row.academicAffiliation}</span>
                                : <span className="text-sm text-[#c0c7d0]">—</span>}
                            </td>
                            {/* Associations */}
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {row.associations.map((a) => (
                                  <span key={a} className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs font-medium text-[#4a5565]">{a}</span>
                                ))}
                              </div>
                            </td>
                            {/* Pharmacy / Chain */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium text-[#0a0a0a]">{row.pharmacyName}</span>
                                <span className="text-xs text-[#9ca3af]">{row.chainAffiliation === "Independent" ? "Independent" : `Chain · ${row.chainAffiliation}`}</span>
                              </div>
                            </td>
                            {/* City · Region · ZIP */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm text-[#0a0a0a]">{row.city}</span>
                                <span className="text-xs text-[#9ca3af]">{row.region} · {row.zip}</span>
                              </div>
                            </td>
                            {/* Catchment */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${catchmentStyles[row.catchment] ?? "bg-[#f3f4f6] text-[#4a5565]"}`}>{row.catchment}</span>
                            </td>
                            {/* Patient Volume */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-[#4a5565]">{row.patientVolume}</span>
                            </td>
                            {/* Top Therapeutic Areas */}
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {row.topTherapeuticAreas.map((t) => (
                                  <span key={t} className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-xs font-medium text-[#2563eb]">{t}</span>
                                ))}
                              </div>
                            </td>
                            {/* Top Brands */}
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {row.topBrands.map((b) => (
                                  <span key={b} className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs font-medium text-[#4a5565]">{b}</span>
                                ))}
                              </div>
                            </td>
                            {/* Generic Ratio */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-[#0a0a0a]">{row.genericRatio}%</span>
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#e5e7eb]">
                                  <div className="h-full rounded-full bg-[#155dfc]" style={{ width: `${row.genericRatio}%` }} />
                                </div>
                              </div>
                            </td>
                            {/* Avg Rx / mo */}
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className="text-sm font-medium text-[#0a0a0a]">{row.avgRxPerMonth.toLocaleString()}</span>
                            </td>
                            {/* Rep · Frequency */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm text-[#0a0a0a]">{row.repContact}</span>
                                <span className="text-xs text-[#9ca3af]">{row.visitFrequency}</span>
                              </div>
                            </td>
                            {/* Preferred Channel */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-[#4a5565]">{row.preferredChannel}</span>
                            </td>
                            {/* Sentiment */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sentimentStyles[row.sentiment] ?? "bg-[#f3f4f6] text-[#4a5565]"}`}>{row.sentiment}</span>
                            </td>
                            {/* Engagement Score */}
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => setScoreDetailModal({ type: "eng", row: { name: row.name }, aff: row.pharmacyName, score: row.kolScore })}
                                className="text-sm font-medium text-[#0a0a0a] underline decoration-dotted underline-offset-2 hover:text-[#155dfc]"
                              >
                                {row.kolScore}
                              </button>
                            </td>
                            {/* Reimbursement */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${reimbStyles[row.reimbursement] ?? "bg-[#f3f4f6] text-[#4a5565]"}`}>{row.reimbursement}</span>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={20} className="px-6 py-12 text-center">
                              <p className="text-sm text-[#6a7282]">No pharmacists match your search.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination footer */}
                  <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                    <span className="text-sm text-[#4a5565]">
                      Showing {Math.min((pharmacistPage - 1) * pharmacistPageSize + 1, filteredPharmacists.length)}–{Math.min(pharmacistPage * pharmacistPageSize, filteredPharmacists.length)} of {filteredPharmacists.length} results
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPharmacistPage((p) => Math.max(1, p - 1))}
                        disabled={pharmacistPage === 1}
                        className="flex h-8 w-8 items-center justify-center rounded text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                      >
                        <ChevronLeftIcon />
                      </button>
                      {Array.from({ length: pharmacistPageCount }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setPharmacistPage(page)}
                          className={`flex h-8 min-w-[30px] items-center justify-center rounded text-sm font-medium transition-colors ${
                            pharmacistPage === page ? "bg-[#155dfc] text-white" : "text-[#364153] hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setPharmacistPage((p) => Math.min(pharmacistPageCount, p + 1))}
                        disabled={pharmacistPage === pharmacistPageCount}
                        className="flex h-8 w-8 items-center justify-center rounded text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                      >
                        <ChevronRightIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Pharmacys Tab Content ────────────────────────────────── */}
          {activeTab === "Pharmacys" && (() => {
            const filteredPharmas = pharmaRows.filter((row) => {
              const q = pharmaSearch.toLowerCase().trim();
              if (!q) return true;
              return (
                row.identityId.toLowerCase().includes(q) ||
                row.legalName.toLowerCase().includes(q) ||
                row.brandName.toLowerCase().includes(q) ||
                row.hqLocation.toLowerCase().includes(q) ||
                row.companyType.toLowerCase().includes(q)
              );
            });
            const pharmaPageCount = Math.max(1, Math.ceil(filteredPharmas.length / pharmaPageSize));
            const pagedPharmas = filteredPharmas.slice(
              (pharmaPage - 1) * pharmaPageSize,
              pharmaPage * pharmaPageSize
            );
            const companyTypeStyles = {
              "Big Pharma": "bg-[#dbeafe] text-[#1d4ed8]",
              "Biotech":    "bg-[#ede9fe] text-[#6d28d9]",
              "Generic":    "bg-[#f3f4f6] text-[#4a5565]",
              "OTC":        "bg-[#fef9c3] text-[#a16207]",
              "Specialty":  "bg-[#dcfce7] text-[#15803d]",
            };
            const positioningStyles = {
              "Leader":     "bg-[#dcfce7] text-[#15803d]",
              "Challenger": "bg-[#fef9c3] text-[#a16207]",
              "Niche":      "bg-[#f3f4f6] text-[#4a5565]",
            };
            const budgetTierStyles = {
              "Tier 1": "bg-[#dbeafe] text-[#1d4ed8]",
              "Tier 2": "bg-[#ede9fe] text-[#6d28d9]",
              "Tier 3": "bg-[#f3f4f6] text-[#4a5565]",
            };
            const activityStyles = {
              "High":   "bg-[#dcfce7] text-[#15803d]",
              "Medium": "bg-[#fef9c3] text-[#a16207]",
              "Low":    "bg-[#f3f4f6] text-[#4a5565]",
            };
            const presenceStyles = {
              "Global":   "bg-[#dbeafe] text-[#1d4ed8]",
              "Regional": "bg-[#ede9fe] text-[#6d28d9]",
              "Limited":  "bg-[#f3f4f6] text-[#4a5565]",
            };
            const kolStrengthStyles = {
              "Strong":   "bg-[#dcfce7] text-[#15803d]",
              "Moderate": "bg-[#fef9c3] text-[#a16207]",
              "Limited":  "bg-[#f3f4f6] text-[#4a5565]",
            };
            const engModelStyles = {
              "Digital-first": "bg-[#dbeafe] text-[#1d4ed8]",
              "Field-first":   "bg-[#dcfce7] text-[#15803d]",
              "Balanced":      "bg-[#ede9fe] text-[#6d28d9]",
            };
            const TH = ({ children, w }) => (
              <th style={w ? { minWidth: w } : undefined} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282] whitespace-nowrap">{children}</th>
            );
            return (
              <div className="flex flex-1 min-h-0 flex-col gap-6">
                {/* Toolbar */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"><SearchIcon20 /></span>
                    <input
                      type="text"
                      placeholder="Search by name, brand, HQ location or type…"
                      value={pharmaSearch}
                      onChange={(e) => setPharmaSearch(e.target.value)}
                      className="w-full rounded-[12px] border border-[#d1d5dc] bg-white py-3 pl-10 pr-4 text-base text-[#0a0a0a] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                    />
                  </div>
                  <button
                    onClick={() => navigate("/leading-board/score-configuration?entity=hco")}
                    className="flex items-center gap-2 rounded-[10px] bg-[#155dfc] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1249cc]"
                  >
                    Pharmacy score configuration
                  </button>
                  <button className="flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
                    <FilterIcon />
                    Filter
                  </button>
                </div>

                {/* Table */}
                <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[14px] border border-gray-200 bg-white">
                  <div ref={pharmaTableRef} className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full" style={{ minWidth: "2500px" }}>
                      <thead>
                        <tr className="border-b border-gray-200 bg-[#f9fafb]">
                          <TH w="120px">Identity ID</TH>
                          <TH w="220px">Legal Name · Brand · HQ</TH>
                          <TH w="130px">Company Type</TH>
                          <TH w="220px">Size</TH>
                          <TH w="120px">Public / Private</TH>
                          <TH w="260px">Top selling products</TH>
                          <TH w="130px">OTC vs Rx Split</TH>
                          <TH w="160px">Market share</TH>
                          <TH w="160px">Competitive Positioning</TH>
                          <TH w="200px">Key Geographies</TH>
                          <TH w="110px">Budget Tier</TH>
                          <TH w="200px">Key Channels</TH>
                          <TH w="130px">MSL Presence</TH>
                          <TH w="220px">Target HCP Segments</TH>
                          <TH w="150px">Engagement Model</TH>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedPharmas.length > 0 ? pagedPharmas.map((row) => (
                          <tr key={row.id} className="border-b border-gray-200 last:border-b-0 transition-colors hover:bg-[#f9fafb]">
                            {/* Identity ID */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="font-mono text-xs text-[#6a7282]">{row.identityId}</span>
                            </td>
                            {/* Legal Name · Brand · HQ */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium text-[#0a0a0a]">{row.legalName}</span>
                                <span className="text-xs text-[#6a7282]">{row.brandName}</span>
                                <span className="text-xs text-[#9ca3af]">{row.hqLocation}</span>
                              </div>
                            </td>
                            {/* Company Type */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${companyTypeStyles[row.companyType] ?? "bg-[#f3f4f6] text-[#4a5565]"}`}>{row.companyType}</span>
                            </td>
                            {/* Size */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-[#4a5565]">{row.headcount} employees</span>
                                <span className="text-xs text-[#4a5565]">Rev: {row.revenueTier}</span>
                                <span className="text-xs text-[#9ca3af]">Mkt Cap: {row.marketCap}</span>
                              </div>
                            </td>
                            {/* Public / Private */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              {row.publiclyTraded ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-medium text-[#15803d] inline-block w-fit">Public</span>
                                  <span className="text-xs text-[#9ca3af]">{row.ticker}</span>
                                </div>
                              ) : (
                                <span className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs font-medium text-[#4a5565]">Private</span>
                              )}
                            </td>
                            {/* Top selling products */}
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {(() => {
                                  const allProducts = row.marketedProducts.flatMap((mp) => mp.products);
                                  const top = allProducts.slice(0, 5);
                                  return (
                                    <>
                                      {top.map((p) => (
                                        <span key={p} className="rounded bg-[#ede9fe] px-1.5 py-0.5 text-xs text-[#6d28d9]">{p}</span>
                                      ))}
                                      {allProducts.length > top.length && (
                                        <span className="text-xs text-[#9ca3af]">+{allProducts.length - top.length}</span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </td>
                            {/* OTC vs Rx Split */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-[#4a5565]">{row.otcRxSplit}</span>
                            </td>
                            {/* Market share (global) */}
                            <td className="px-4 py-4">
                              {(() => {
                                const shares = row.marketShareByTA.map((ms) => parseFloat(ms.share));
                                const global = shares.length ? (shares.reduce((a, b) => a + b, 0) / shares.length).toFixed(1) : "0";
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#e5e7eb]">
                                      <div className="h-full rounded-full bg-[#155dfc]" style={{ width: `${Math.min(Number(global) * 2, 100)}%` }} />
                                    </div>
                                    <span className="text-sm text-[#4a5565]">{global}%</span>
                                  </div>
                                );
                              })()}
                            </td>
                            {/* Competitive Positioning */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${positioningStyles[row.competitivePositioning] ?? "bg-[#f3f4f6] text-[#4a5565]"}`}>{row.competitivePositioning}</span>
                            </td>
                            {/* Key Geographies */}
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {row.keyGeographies.slice(0, 4).map((g) => (
                                  <span key={g} className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-xs text-[#4a5565]">{g}</span>
                                ))}
                                {row.keyGeographies.length > 4 && (
                                  <span className="text-xs text-[#9ca3af]">+{row.keyGeographies.length - 4}</span>
                                )}
                              </div>
                            </td>
                            {/* Budget Tier */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${budgetTierStyles[row.budgetTier] ?? "bg-[#f3f4f6] text-[#4a5565]"}`}>{row.budgetTier}</span>
                            </td>
                            {/* Key Channels */}
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {row.keyChannels.map((c) => (
                                  <span key={c} className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-xs text-[#4a5565]">{c}</span>
                                ))}
                              </div>
                            </td>
                            {/* MSL Presence */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${presenceStyles[row.mslPresence] ?? "bg-[#f3f4f6] text-[#4a5565]"}`}>{row.mslPresence}</span>
                            </td>
                            {/* Target HCP Segments */}
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {row.targetHcpSegments.map((s) => (
                                  <span key={s} className="rounded bg-[#dbeafe] px-1.5 py-0.5 text-xs text-[#2563eb]">{s}</span>
                                ))}
                              </div>
                            </td>
                            {/* Engagement Model */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${engModelStyles[row.engagementModel] ?? "bg-[#f3f4f6] text-[#4a5565]"}`}>{row.engagementModel}</span>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={15} className="px-6 py-12 text-center">
                              <p className="text-sm text-[#6a7282]">No pharmaceutical companies match your search.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination footer */}
                  <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                    <span className="text-sm text-[#4a5565]">
                      Showing {Math.min((pharmaPage - 1) * pharmaPageSize + 1, filteredPharmas.length)}–{Math.min(pharmaPage * pharmaPageSize, filteredPharmas.length)} of {filteredPharmas.length} results
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPharmaPage((p) => Math.max(1, p - 1))}
                        disabled={pharmaPage === 1}
                        className="flex h-8 w-8 items-center justify-center rounded text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                      >
                        <ChevronLeftIcon />
                      </button>
                      {Array.from({ length: pharmaPageCount }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setPharmaPage(page)}
                          className={`flex h-8 min-w-[30px] items-center justify-center rounded text-sm font-medium transition-colors ${
                            pharmaPage === page ? "bg-[#155dfc] text-white" : "text-[#364153] hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setPharmaPage((p) => Math.min(pharmaPageCount, p + 1))}
                        disabled={pharmaPage === pharmaPageCount}
                        className="flex h-8 w-8 items-center justify-center rounded text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                      >
                        <ChevronRightIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Signals Tab Content ─────────────────────────── */}
          {activeTab === "Signals" && (() => {
            const filteredSignals = anonymousLeads.filter((lead) => {
              if (!signalSearch.trim()) return true;
              const q = signalSearch.toLowerCase();
              return (
                lead.id.toLowerCase().includes(q) ||
                lead.source.toLowerCase().includes(q) ||
                lead.landingPage.toLowerCase().includes(q) ||
                lead.topics.some((t) => t.toLowerCase().includes(q)) ||
                (lead.possibleOrg?.name ?? "").toLowerCase().includes(q)
              );
            });
            const signalPageCount = Math.max(1, Math.ceil(filteredSignals.length / signalPageSize));
            const signalPage = 1;
            const pagedSignals = filteredSignals.slice(0, signalPageSize);
            return (
              <div className="flex flex-1 min-h-0 flex-col gap-6">
                {/* toolbar – matches HCPs layout */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"><SearchIcon20 /></span>
                    <input
                      type="text"
                      placeholder="Search by ID, source, topic…"
                      value={signalSearch}
                      onChange={(e) => setSignalSearch(e.target.value)}
                      className="w-full rounded-[12px] border border-[#d1d5dc] bg-white py-3 pl-10 pr-4 text-base text-[#0a0a0a] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                    />
                  </div>
                  <button
                    onClick={() => navigate("/leading-board/score-configuration?entity=signal")}
                    className="flex items-center gap-2 rounded-[10px] bg-[#155dfc] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1249cc]"
                  >
                    Signal configuration
                  </button>
                  <button className="flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
                    <FilterIcon />
                    Filter
                  </button>
                </div>

                {/* Anonymous leads table */}
                <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[14px] border border-gray-200 bg-white">
                  {/* scrollable table */}
                  <div ref={signalTableRef} className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full min-w-[1200px]">
                      <thead>
                        <tr className="border-b border-gray-200 bg-[#f9fafb]">
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Lead ID</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Last Activity</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Recency / Freq.</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Source</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Landing Page</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Topics</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Engagement Score</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                            Location <span className="font-normal normal-case text-[#c0c7d0]">approx.</span>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Possible Org.</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Key Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedSignals.map((lead) => {
                          return (
                            <tr
                              key={lead.id}
                              onClick={() => navigate(`/profiles/lead-signal/${lead.id}`)}
                              className="cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors hover:bg-[#f9fafb]"
                            >
                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-[#0a0a0a]">{lead.id}</span>
                                  <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs font-medium text-[#6a7282]">Anonymous</span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm text-[#0a0a0a]">{lead.lastActivityTs}</span>
                                  <span className="text-xs text-[#9ca3af]">{lead.lastActivityRel}</span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm font-medium text-[#0a0a0a]">{lead.visits} visits</span>
                                  <span className="text-xs text-[#9ca3af]">Active {lead.activeDays}d · since {lead.firstContact}</span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex items-center gap-1.5">
                                  <span className={`h-2 w-2 shrink-0 rounded-full ${sourceTypeDot[lead.sourceType] ?? "bg-[#9ca3af]"}`} />
                                  <span className="text-sm text-[#4a5565]">{lead.source}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span title={lead.landingPage} className="block max-w-[150px] truncate font-mono text-xs text-[#4a5565]">
                                  {lead.landingPage}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {lead.topics.map((t) => (
                                    <span key={t} className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-xs font-medium text-[#2563eb]">{t}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setScoreDetailModal({ type: "eng", row: lead, aff: lead.source, score: lead.intent.score }); }}
                                  className="text-sm font-medium text-[#0a0a0a] underline decoration-dotted underline-offset-2 hover:text-[#155dfc]"
                                >
                                  {lead.intent.score}
                                </button>
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-[#4a5565]">
                                {lead.location.label}
                              </td>
                              <td className="px-6 py-4">
                                {lead.possibleOrg ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium text-[#0a0a0a]">{lead.possibleOrg.name}</span>
                                    <span className={`inline-block self-start rounded-full px-2 py-0.5 text-xs font-medium ${confidenceColors[lead.possibleOrg.confidence].bg} ${confidenceColors[lead.possibleOrg.confidence].text}`}>
                                      {lead.possibleOrg.confidence}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-[#9ca3af]">—</span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                <SignalKeyAction action={lead.keyAction} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* pagination */}
                  <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                    <span className="text-sm text-[#4a5565]">
                      Showing 1–{pagedSignals.length} of {filteredSignals.length} results
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={signalPage === 1}
                        className="flex h-8 w-8 items-center justify-center rounded text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                      >
                        <ChevronLeftIcon />
                      </button>
                      {Array.from({ length: Math.min(signalPageCount, 5) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          className={`flex h-8 min-w-[30px] items-center justify-center rounded text-sm font-medium transition-colors ${
                            signalPage === page ? "bg-[#155dfc] text-white" : "text-[#364153] hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        disabled={signalPage === signalPageCount}
                        className="flex h-8 w-8 items-center justify-center rounded text-[#6a7282] transition-colors hover:bg-gray-50 disabled:opacity-40"
                      >
                        <ChevronRightIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </main>


      {/* Filter Dialog */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setFilterOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-[520px] flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-[#0a0a0a]">Filters</h2>
              <button
                onClick={() => setFilterOpen(false)}
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Dialog body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

              {/* Priority */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-[#0a0a0a]">Priority</p>
                <div className="relative">
                  <button
                    onClick={() => setFilterDropdown(filterDropdown === "priorities" ? null : "priorities")}
                    className="flex w-full items-center justify-between rounded-[10px] border border-[#d1d5dc] bg-white px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50"
                  >
                    <span className={draftFilters.priorities.length === 0 ? "text-[#99a1af]" : ""}>
                      {draftFilters.priorities.length === 0 ? "Select priorities…" : `${draftFilters.priorities.join(", ")}`}
                    </span>
                    <span className={`transition-transform ${filterDropdown === "priorities" ? "rotate-180" : ""}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                  {filterDropdown === "priorities" && (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border border-[#d1d5dc] bg-white shadow-lg">
                      {["Hot", "Warm", "Cold"].map((v) => (
                        <button
                          key={v}
                          onClick={() => toggleDraft("priorities", v)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50"
                        >
                          <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${draftFilters.priorities.includes(v) ? "border-[#155dfc] bg-[#155dfc]" : "border-[#d1d5dc] bg-white"}`}>
                            {draftFilters.priorities.includes(v) && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </span>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Specialty */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-[#0a0a0a]">Specialty</p>
                <div className="relative">
                  <button
                    onClick={() => setFilterDropdown(filterDropdown === "specialties" ? null : "specialties")}
                    className="flex w-full items-center justify-between rounded-[10px] border border-[#d1d5dc] bg-white px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50"
                  >
                    <span className={draftFilters.specialties.length === 0 ? "text-[#99a1af]" : ""}>
                      {draftFilters.specialties.length === 0 ? "Select specialties…" : `${draftFilters.specialties.join(", ")}`}
                    </span>
                    <span className={`transition-transform ${filterDropdown === "specialties" ? "rotate-180" : ""}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                  {filterDropdown === "specialties" && (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border border-[#d1d5dc] bg-white shadow-lg">
                      {ALL_SPECIALTIES.map((v) => (
                        <button
                          key={v}
                          onClick={() => toggleDraft("specialties", v)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50"
                        >
                          <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${draftFilters.specialties.includes(v) ? "border-[#155dfc] bg-[#155dfc]" : "border-[#d1d5dc] bg-white"}`}>
                            {draftFilters.specialties.includes(v) && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </span>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Affiliation */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-[#0a0a0a]">Affiliation</p>
                <div className="relative">
                  <button
                    onClick={() => setFilterDropdown(filterDropdown === "affiliations" ? null : "affiliations")}
                    className="flex w-full items-center justify-between rounded-[10px] border border-[#d1d5dc] bg-white px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50"
                  >
                    <span className={draftFilters.affiliations.length === 0 ? "text-[#99a1af]" : ""}>
                      {draftFilters.affiliations.length === 0 ? "Select affiliations…" : `${draftFilters.affiliations.join(", ")}`}
                    </span>
                    <span className={`transition-transform ${filterDropdown === "affiliations" ? "rotate-180" : ""}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                  {filterDropdown === "affiliations" && (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border border-[#d1d5dc] bg-white shadow-lg">
                      {ALL_AFFILIATIONS.map((v) => (
                        <button
                          key={v}
                          onClick={() => toggleDraft("affiliations", v)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50"
                        >
                          <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${draftFilters.affiliations.includes(v) ? "border-[#155dfc] bg-[#155dfc]" : "border-[#d1d5dc] bg-white"}`}>
                            {draftFilters.affiliations.includes(v) && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </span>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ICP Score range */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-[#0a0a0a]">ICP Score</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={draftFilters.icpMin}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, icpMin: e.target.value }))}
                    className="w-full rounded-[10px] border border-[#d1d5dc] px-3 py-2 text-sm text-[#0a0a0a] placeholder:text-[#99a1af] focus:border-[#155dfc] focus:outline-none"
                  />
                  <span className="text-sm text-[#6a7282]">–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={draftFilters.icpMax}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, icpMax: e.target.value }))}
                    className="w-full rounded-[10px] border border-[#d1d5dc] px-3 py-2 text-sm text-[#0a0a0a] placeholder:text-[#99a1af] focus:border-[#155dfc] focus:outline-none"
                  />
                </div>
              </div>

              {/* Engagement Score range */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-[#0a0a0a]">Engagement Score</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={draftFilters.engMin}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, engMin: e.target.value }))}
                    className="w-full rounded-[10px] border border-[#d1d5dc] px-3 py-2 text-sm text-[#0a0a0a] placeholder:text-[#99a1af] focus:border-[#155dfc] focus:outline-none"
                  />
                  <span className="text-sm text-[#6a7282]">–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={draftFilters.engMax}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, engMax: e.target.value }))}
                    className="w-full rounded-[10px] border border-[#d1d5dc] px-3 py-2 text-sm text-[#0a0a0a] placeholder:text-[#99a1af] focus:border-[#155dfc] focus:outline-none"
                  />
                </div>
              </div>

              {/* KOL */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDraftFilters((p) => ({ ...p, kolOnly: !p.kolOnly }))}
                  className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                    draftFilters.kolOnly ? "border-[#155dfc] bg-[#155dfc]" : "border-[#d1d5dc] bg-white"
                  }`}
                >
                  {draftFilters.kolOnly && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-[#0a0a0a]">KOL only</span>
              </div>

              {/* Classification */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-[#0a0a0a]">Classification</p>
                {["Primary", "Secondary"].map((val) => (
                  <label key={val} className="flex cursor-pointer items-center gap-3">
                    <button
                      onClick={() => toggleDraft("classification", val)}
                      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                        draftFilters.classification.includes(val) ? "border-[#155dfc] bg-[#155dfc]" : "border-[#d1d5dc] bg-white"
                      }`}
                    >
                      {draftFilters.classification.includes(val) && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <span className="text-sm text-[#0a0a0a]">{val}</span>
                  </label>
                ))}
              </div>

              {/* Country */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-[#0a0a0a]">Country</p>
                <div className="relative">
                  <button
                    onClick={() => setFilterDropdown(filterDropdown === "countries" ? null : "countries")}
                    className="flex w-full items-center justify-between rounded-[10px] border border-[#d1d5dc] bg-white px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50"
                  >
                    <span className={draftFilters.countries.length === 0 ? "text-[#99a1af]" : ""}>
                      {draftFilters.countries.length === 0 ? "Select countries…" : `${draftFilters.countries.join(", ")}`}
                    </span>
                    <span className={`transition-transform ${filterDropdown === "countries" ? "rotate-180" : ""}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                  {filterDropdown === "countries" && (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border border-[#d1d5dc] bg-white shadow-lg">
                      {ALL_COUNTRIES.map((v) => (
                        <button
                          key={v}
                          onClick={() => toggleDraft("countries", v)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50"
                        >
                          <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${draftFilters.countries.includes(v) ? "border-[#155dfc] bg-[#155dfc]" : "border-[#d1d5dc] bg-white"}`}>
                            {draftFilters.countries.includes(v) && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </span>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Product */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-[#0a0a0a]">Product</p>
                <div className="relative">
                  <button
                    onClick={() => setFilterDropdown(filterDropdown === "products" ? null : "products")}
                    className="flex w-full items-center justify-between rounded-[10px] border border-[#d1d5dc] bg-white px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50"
                  >
                    <span className={`truncate pr-2 ${draftFilters.products.length === 0 ? "text-[#99a1af]" : ""}`}>
                      {draftFilters.products.length === 0 ? "Select products…" : `${draftFilters.products.join(", ")}`}
                    </span>
                    <span className={`transition-transform ${filterDropdown === "products" ? "rotate-180" : ""}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                  {filterDropdown === "products" && (
                    <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-[10px] border border-[#d1d5dc] bg-white shadow-lg">
                      {ALL_PRODUCTS.map((v) => (
                        <button
                          key={v}
                          onClick={() => toggleDraft("products", v)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50"
                        >
                          <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${draftFilters.products.includes(v) ? "border-[#155dfc] bg-[#155dfc]" : "border-[#d1d5dc] bg-white"}`}>
                            {draftFilters.products.includes(v) && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </span>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* CRM Segment */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-[#0a0a0a]">CRM Segment</p>
                <div className="relative">
                  <button
                    onClick={() => setFilterDropdown(filterDropdown === "crmSegments" ? null : "crmSegments")}
                    className="flex w-full items-center justify-between rounded-[10px] border border-[#d1d5dc] bg-white px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50"
                  >
                    <span className={draftFilters.crmSegments.length === 0 ? "text-[#99a1af]" : ""}>
                      {draftFilters.crmSegments.length === 0 ? "Select segments…" : `${draftFilters.crmSegments.join(", ")}`}
                    </span>
                    <span className={`transition-transform ${filterDropdown === "crmSegments" ? "rotate-180" : ""}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                  {filterDropdown === "crmSegments" && (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border border-[#d1d5dc] bg-white shadow-lg">
                      {ALL_CRM_SEGMENTS.map((v) => (
                        <button
                          key={v}
                          onClick={() => toggleDraft("crmSegments", v)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50"
                        >
                          <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${draftFilters.crmSegments.includes(v) ? "border-[#155dfc] bg-[#155dfc]" : "border-[#d1d5dc] bg-white"}`}>
                            {draftFilters.crmSegments.includes(v) && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </span>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dialog footer */}
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => { setDraftFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); setFilterOpen(false); setFilterDropdown(null); setCurrentPage(1); }}
                className="text-sm font-medium text-[#6a7282] hover:text-[#0a0a0a]"
              >
                Reset all
              </button>
              <button
                onClick={() => { setAppliedFilters(draftFilters); setFilterOpen(false); setFilterDropdown(null); setCurrentPage(1); }}
                className="rounded-[10px] bg-[#155dfc] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1249cc]"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score Detail Modal — ICP or Engagement, specific to clicked row */}
      {scoreDetailModal && (() => {
        const { type, row, aff, score } = scoreDetailModal;
        const isIcp = type === "icp";
        const dims = isIcp
          ? [
              { dim: "Specialty fit",                  weight: "40%", pct: Math.round(score * 0.40), badge: "bg-[#dbeafe] text-[#155dfc]", source: `${row.specialty} aligned with target segment` },
              { dim: "Institutional affiliation tier", weight: "35%", pct: Math.round(score * 0.35), badge: "bg-[#dbeafe] text-[#155dfc]", source: `${aff} — Tier ${score > 75 ? 1 : score > 50 ? 2 : 3} institution` },
              { dim: "Practice volume & influence",    weight: "25%", pct: Math.round(score * 0.25), badge: "bg-[#dbeafe] text-[#155dfc]", source: `${row.isKol ? "KOL — elevated peer recognition" : "Standard practice volume"}` },
            ]
          : [
              { dim: "Email opens & clicks",  weight: "30%", pct: Math.round(score * 0.30), badge: "bg-[#dcfce7] text-[#15803d]", source: "CRM email activity — trailing 12 months" },
              { dim: "Webinar attendance",     weight: "25%", pct: Math.round(score * 0.25), badge: "bg-[#dcfce7] text-[#15803d]", source: "Webinar platform logs" },
              { dim: "Content downloads",      weight: "25%", pct: Math.round(score * 0.25), badge: "bg-[#dcfce7] text-[#15803d]", source: "Asset management system" },
              { dim: "Event participation",    weight: "20%", pct: Math.round(score * 0.20), badge: "bg-[#dcfce7] text-[#15803d]", source: "Event management & congress attendance" },
            ];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setScoreDetailModal(null)}>
            <div className="w-[580px] max-h-[90vh] flex flex-col overflow-hidden rounded-[24px] border border-[rgba(154,168,188,0.2)] bg-white shadow-[0px_16px_32px_0px_rgba(0,0,0,0.16)]" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4 shrink-0">
                <div>
                  <h2 className="text-[22px] font-semibold leading-[30px] text-[#1a212b]">
                    {isIcp ? "ICP Score" : "Engagement Score"} — <span className="text-[#155dfc]">{score}</span>
                    {isIcp && (row.missingFields?.length ?? 0) > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2 py-0.5 text-xs font-medium text-[#92400e]">
                        <WarningIcon />
                        {row.missingFields.length} field{row.missingFields.length > 1 ? "s" : ""} missing
                      </span>
                    )}
                  </h2>
                  <p className="mt-1 text-sm text-[#4a5565]">{row.name} · {aff}</p>
                </div>
                <button onClick={() => setScoreDetailModal(null)} className="rounded-full p-1 transition-colors hover:bg-gray-100"><CloseIcon /></button>
              </div>

              {/* Scrollable body */}
              <div className="flex flex-col gap-4 px-6 pb-6 overflow-y-auto">
                <p className="text-sm leading-6 text-[#4a5565]">
                  {isIcp
                    ? "Measures how closely this HCP matches your Ideal Customer Profile at the selected institution. Each dimension contributes a weighted sub-score."
                    : "Reflects the depth and recency of this HCP's brand interactions, adjusted for the selected product family context."}
                </p>

                {/* Score breakdown */}
                <div className="flex flex-col divide-y divide-[#f3f4f6] rounded-[12px] border border-[#e5e7eb]">
                  {dims.map(({ dim, weight, pct, badge, source }) => (
                    <div key={dim} className="flex items-start gap-4 px-4 py-3">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`rounded px-2 py-0.5 text-center text-xs font-semibold ${badge}`}>{weight}</span>
                        <span className="text-[11px] font-semibold text-[#0a0a0a]">{pct} pts</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0a0a0a]">{dim}</p>
                        <p className="text-xs text-[#6a7282]">Source: {source}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between rounded-[10px] bg-[#f9fafb] px-4 py-3">
                  <span className="text-sm text-[#4a5565]">Total {isIcp ? "ICP" : "Engagement"} Score</span>
                  <span className="text-lg font-bold text-[#0a0a0a]">{score} / 100</span>
                </div>

                {/* Missing data — ICP only */}
                {isIcp && (row.missingFields?.length ?? 0) > 0 && (
                  <div className="rounded-[12px] border border-[#fde68a] bg-[#fffbeb] p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[#f59e0b]"><WarningIcon /></span>
                      <p className="text-sm font-semibold text-[#92400e]">
                        Score incomplete — {row.missingFields.length} variable{row.missingFields.length > 1 ? "s" : ""} could not be scored
                      </p>
                    </div>
                    <p className="text-xs text-[#78350f] leading-relaxed">
                      The following variables are part of this HCP's score configuration but the required data was not found in any of the configured sources. Completing this data will improve score accuracy.
                    </p>
                    <div className="flex flex-col divide-y divide-[#fde68a] rounded-[10px] border border-[#fde68a] overflow-hidden">
                      {row.missingFields.map((mf, idx) => (
                        <div key={idx} className="bg-white px-4 py-3 flex flex-col gap-1.5">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-[#0a0a0a]">{mf.variable}</p>
                            <span className="shrink-0 rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6a7282]">
                              {mf.sectionId} — {mf.sectionLabel}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {mf.sources.map((src, si) => (
                              <span key={si} className="inline-flex items-center rounded-full border border-[#fde68a] bg-[#fef9c3] px-2 py-0.5 text-[11px] text-[#92400e]">
                                {src}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-[#9ca3af]">Recalculated nightly. May vary when a different product family context is selected.</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lead Score Modal */}
      {scoreModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setScoreModal(null)}
        >
          <div
            className="w-[680px] overflow-hidden rounded-[24px] border border-[rgba(154,168,188,0.2)] bg-white shadow-[0px_16px_32px_0px_rgba(0,0,0,0.16)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6">
              <h2 className="text-[22px] font-semibold leading-[30px] text-[#1a212b]">
                Lead score
              </h2>
              <button
                onClick={() => setScoreModal(null)}
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex flex-col gap-4 px-6">
              <div className="flex flex-col gap-1">
                <p className="text-base font-medium text-[#0a0a0a]">
                  HCP name
                </p>
                <p className="text-sm text-[#4a5565]">{scoreModal.name}</p>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-2 rounded-[14px] border border-gray-200 bg-white px-[21px] pb-4 pt-[21px]">
                  <p className="text-sm text-[#4a5565]">Engagement score</p>
                  <p className="text-[30px] font-bold leading-9 tracking-[0.4px] text-[#0a0a0a]">
                    {scoreModal.engagementScore}
                  </p>
                  <p className="text-xs font-light leading-4 text-[#525e6f]">
                    Engagement based on recent activity signals
                  </p>
                </div>

                <div className="flex flex-1 flex-col gap-2 rounded-[14px] border border-gray-200 bg-white px-[21px] pb-4 pt-[21px]">
                  <p className="text-sm text-[#4a5565]">ICP grading</p>
                  <p className="text-[30px] font-bold leading-9 tracking-[0.4px] text-[#0a0a0a]">
                    {scoreModal.icpGrading}
                  </p>
                  <p className="text-xs font-light leading-4 text-[#525e6f]">
                    Fit to your ideal customer profile (ICP)
                  </p>
                </div>

                <div className="flex flex-1 flex-col gap-2 rounded-[14px] border border-gray-200 bg-[#e0edff] px-[22px] pb-4 pt-[22px]">
                  <p className="text-sm text-[#4a5565]">Lead score</p>
                  <p className="text-[30px] font-bold leading-9 tracking-[0.4px] text-[#0a0a0a]">
                    {scoreModal.leadScore}
                  </p>
                  <p className="text-xs font-light leading-4 text-[#525e6f]">
                    Engagement score + ICP grading
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end p-6">
              <button
                onClick={() => setScoreModal(null)}
                className="rounded-2xl bg-[#5c17e5] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#4c12c0]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Score Modal */}
      {hospitalScoreModal && (() => {
        const { engagement, icp, account } = getHospitalScores(hospitalScoreModal.hcpIds);
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setHospitalScoreModal(null)}
          >
            <div
              className="w-[680px] overflow-hidden rounded-[24px] border border-[rgba(154,168,188,0.2)] bg-white shadow-[0px_16px_32px_0px_rgba(0,0,0,0.16)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between p-6">
                <h2 className="text-[22px] font-semibold leading-[30px] text-[#1a212b]">
                  Account score
                </h2>
                <button
                  onClick={() => setHospitalScoreModal(null)}
                  className="rounded-full p-1 transition-colors hover:bg-gray-100"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="flex flex-col gap-4 px-6">
                <div className="flex flex-col gap-1">
                  <p className="text-base font-medium text-[#0a0a0a]">Hospital name</p>
                  <p className="text-sm text-[#4a5565]">{hospitalScoreModal.name}</p>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-1 flex-col gap-2 rounded-[14px] border border-gray-200 bg-white px-[21px] pb-4 pt-[21px]">
                    <p className="text-sm text-[#4a5565]">Engagement score</p>
                    <p className="text-[30px] font-bold leading-9 tracking-[0.4px] text-[#0a0a0a]">
                      {engagement}
                    </p>
                    <p className="text-xs font-light leading-4 text-[#525e6f]">
                      Average engagement score of affiliated HCPs
                    </p>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 rounded-[14px] border border-gray-200 bg-white px-[21px] pb-4 pt-[21px]">
                    <p className="text-sm text-[#4a5565]">ICP grading</p>
                    <p className="text-[30px] font-bold leading-9 tracking-[0.4px] text-[#0a0a0a]">
                      {icp}
                    </p>
                    <p className="text-xs font-light leading-4 text-[#525e6f]">
                      Average ICP grading of affiliated HCPs
                    </p>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 rounded-[14px] border border-gray-200 bg-[#e0edff] px-[22px] pb-4 pt-[22px]">
                    <p className="text-sm text-[#4a5565]">Account score</p>
                    <p className="text-[30px] font-bold leading-9 tracking-[0.4px] text-[#0a0a0a]">
                      {account}
                    </p>
                    <p className="text-xs font-light leading-4 text-[#525e6f]">
                      Engagement score + ICP grading
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end p-6">
                <button
                  onClick={() => setHospitalScoreModal(null)}
                  className="rounded-2xl bg-[#5c17e5] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#4c12c0]"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
