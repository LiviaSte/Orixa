import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useMappingContext } from "../MappingContext";

// ── CONSTANTS ──────────────────────────────────────────────────────

const FAMILY_COLORS = {
  blue:   { dot: "bg-[#155dfc]", badge: "bg-[#eff6ff] text-[#155dfc]", border: "border-[#bfdbfe]" },
  violet: { dot: "bg-[#7c3aed]", badge: "bg-[#ede9fe] text-[#7c3aed]", border: "border-[#ddd6fe]" },
  green:  { dot: "bg-[#16a34a]", badge: "bg-[#dcfce7] text-[#16a34a]", border: "border-[#bbf7d0]" },
  amber:  { dot: "bg-[#d97706]", badge: "bg-[#fef3c7] text-[#d97706]", border: "border-[#fde68a]" },
};
const COLOR_OPTIONS = ["blue", "violet", "green", "amber"];

const PRODUCT_FIELDS = [
  { key: "product_name",       label: "Product Name",        group: "Product Context",     sourceConnector: "CRM · Accounts",                  placeholder: "e.g. D-Heart ECG Home" },
  { key: "product_link",       label: "Product Link",         group: "Product Context",     sourceConnector: "CRM · Accounts",                  placeholder: "https://..." },
  { key: "core_function",      label: "Product Description",  group: "Product Context",     sourceConnector: "CRM · Accounts",  multiline: true, placeholder: "Describe the core function…" },
  { key: "category_primary",   label: "Primary Category",     group: "Classification",      sourceConnector: "CRM · Accounts",                  placeholder: "e.g. Consumer medical device" },
  { key: "category_secondary", label: "Secondary Category",   group: "Classification",      sourceConnector: "CRM · Accounts",                  placeholder: "e.g. Portable ECG monitor" },
  { key: "form_factor",        label: "Form Factor",          group: "Classification",      sourceConnector: "CRM · Accounts",                  placeholder: "e.g. Handheld, Bluetooth" },
  { key: "output_type",        label: "Output Type",          group: "Commercial",          sourceConnector: "CRM · Accounts",                  placeholder: "e.g. ECG trace + PDF report" },
  { key: "pricing_model",      label: "Pricing Model",        group: "Commercial",          sourceConnector: "CRM · Accounts",                  placeholder: "e.g. One-time purchase" },
  { key: "ancillary_service",  label: "Ancillary Service",    group: "Commercial",          sourceConnector: "CRM · Accounts",                  placeholder: "e.g. Remote cardiologist review" },
  { key: "regulatory_status",  label: "Regulatory Status",    group: "Compliance & Origin", sourceConnector: "External DB · Research Database", placeholder: "e.g. Class IIA, CE marked" },
  { key: "country_of_origin",  label: "Country of Origin",    group: "Compliance & Origin", sourceConnector: "External DB · Research Database", placeholder: "e.g. Italy" },
  { key: "unique_IP",          label: "Unique IP / Patents",  group: "IP & Constraints",    sourceConnector: "External DB · Research Database", isArray: true, placeholder: "Add a patent or IP claim…" },
  { key: "key_constraint",     label: "Key Constraint",       group: "IP & Constraints",    sourceConnector: "External DB · Research Database", multiline: true, placeholder: "e.g. Available only in specific countries" },
];

const FIELD_GROUPS = ["Product Context", "Classification", "Commercial", "Compliance & Origin", "IP & Constraints"];

const GROUP_ICONS = {
  "Product Context": (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  "Classification": (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 4h10M2 7h7M2 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  "Commercial": (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7 4V4.8M7 9.2V10M5.2 6C5.2 5.34 6 4.8 7 4.8C8 4.8 8.8 5.34 8.8 6C8.8 6.66 8 7.2 7 7.2C6 7.2 5.2 7.74 5.2 8.4C5.2 9.06 6 9.6 7 9.6C8 9.6 8.8 9.06 8.8 8.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  "Compliance & Origin": (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5L2.5 3.2V7C2.5 9.74 4.45 12.08 7 12.8C9.55 12.08 11.5 9.74 11.5 7V3.2L7 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M5 7l1.5 1.5L9 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "IP & Constraints": (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2.5" y="6.5" width="9" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4.5 6.5V4.5a2.5 2.5 0 0 1 5 0V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
};

// ── SHOPIFY THERAPEUTIC AREAS ─────────────────────────────────────
// Hierarchy: Therapeutic Area → Franchise/Brand → Range/Sub-brand

const SHOPIFY_THERAPEUTIC_AREAS = [
  {
    id: "ta1",
    name: "Home Diagnostics",
    description: "Consumer diagnostic devices for at-home monitoring",
    color: "blue",
    franchises: [
      {
        id: "fr1",
        name: "D-Heart",
        description: "Portable cardiac ECG solutions",
        ranges: [
          {
            id: "rng1",
            sku: "DHH-ECG-01",
            product_name: "D-Heart Home ECG Monitor",
            product_link: "https://www.d-heart.com/home",
            category_primary: "Consumer medical device",
            category_secondary: "Portable ECG monitor",
            form_factor: "Handheld, Bluetooth smartphone connection",
            core_function: "Single-lead ECG recording for home cardiac monitoring",
            ancillary_service: "",
            output_type: "ECG trace + shareable PDF report",
            pricing_model: "One-time hardware purchase",
            regulatory_status: "Class IIA medical device, CE marked",
            country_of_origin: "",
            unique_IP: ["Patent-pending electrode placement guide", "AI-assisted arrhythmia detection"],
            key_constraint: "For indicative use only — not a substitute for clinical ECG",
            connectedFields: ["product_name", "product_link", "core_function", "category_primary", "category_secondary", "form_factor", "output_type", "pricing_model", "regulatory_status", "key_constraint"],
          },
          {
            id: "rng1b",
            sku: "DHH-CP-02",
            product_name: "D-Heart Clinic Pro",
            product_link: "https://www.d-heart.com/clinic-pro",
            category_primary: "Professional medical device",
            category_secondary: "12-lead ECG system",
            form_factor: "Desktop unit with electrode kit",
            core_function: "Full 12-lead ECG acquisition for clinic and point-of-care settings",
            ancillary_service: "Priority cardiologist reporting with 10-min turnaround",
            output_type: "Certified 12-lead ECG report with AI interpretation",
            pricing_model: "",
            regulatory_status: "Class IIA medical device, CE + FDA 510(k)",
            country_of_origin: "Italy",
            unique_IP: ["AI triage algorithm (patent pending)", "Wireless electrode synchronisation"],
            key_constraint: "",
            connectedFields: ["product_name", "product_link", "core_function", "category_primary", "category_secondary", "form_factor", "ancillary_service", "output_type", "regulatory_status", "country_of_origin"],
          },
          {
            id: "rng1c",
            sku: "DHH-EXP-03",
            product_name: "D-Heart Express",
            product_link: "",
            category_primary: "Consumer medical device",
            category_secondary: "Single-lead ECG monitor",
            form_factor: "",
            core_function: "Quick single-lead ECG check in under 30 seconds",
            ancillary_service: "Instant AI rhythm classification via app",
            output_type: "ECG strip + pass/flag result",
            pricing_model: "One-time hardware purchase",
            regulatory_status: "Class IIA medical device, CE marked",
            country_of_origin: "Italy",
            unique_IP: ["Ultra-low-latency signal acquisition (patent)"],
            key_constraint: "Screening use only; abnormal results require clinical follow-up",
            connectedFields: ["product_name", "core_function", "category_primary", "category_secondary", "ancillary_service", "output_type", "pricing_model", "regulatory_status", "country_of_origin", "key_constraint"],
          },
        ],
      },
      {
        id: "fr2",
        name: "SmartPressure",
        description: "Blood pressure monitoring devices",
        ranges: [
          {
            id: "rng2",
            sku: "SPC-BP-02",
            product_name: "SmartPressure Cuff",
            product_link: "",
            category_primary: "Consumer medical device",
            category_secondary: "Automatic blood pressure monitor",
            form_factor: "Upper arm cuff, wireless",
            core_function: "Automated systolic/diastolic BP and pulse rate measurement",
            ancillary_service: "App-based trend tracking and health insights",
            output_type: "BP reading + pulse rate, synced to health app",
            pricing_model: "",
            regulatory_status: "Class IIA, CE & FDA cleared",
            country_of_origin: "Germany",
            unique_IP: ["Dual-measurement validation algorithm (patent)"],
            key_constraint: "Not suitable for patients with atrial fibrillation without supervision",
            connectedFields: ["product_name", "core_function", "category_primary", "category_secondary", "form_factor", "ancillary_service", "output_type", "regulatory_status", "country_of_origin", "key_constraint"],
          },
          {
            id: "rng2b",
            sku: "SPC-WR-03",
            product_name: "SmartPressure Wrist",
            product_link: "https://smartpressure.com/wrist",
            category_primary: "Consumer medical device",
            category_secondary: "Wrist blood pressure monitor",
            form_factor: "Wrist-worn band, Bluetooth",
            core_function: "On-demand wrist BP measurement with posture detection",
            ancillary_service: "",
            output_type: "BP reading with posture correction flag",
            pricing_model: "One-time hardware purchase",
            regulatory_status: "Class IIA, CE marked",
            country_of_origin: "",
            unique_IP: ["Posture-aware calibration algorithm"],
            key_constraint: "Readings may differ from upper-arm cuff in certain conditions",
            connectedFields: ["product_name", "product_link", "core_function", "category_primary", "category_secondary", "form_factor", "output_type", "pricing_model", "regulatory_status", "key_constraint"],
          },
          {
            id: "rng2c",
            sku: "SPC-KD-04",
            product_name: "SmartPressure Kids",
            product_link: "https://smartpressure.com/kids",
            category_primary: "Paediatric medical device",
            category_secondary: "Paediatric blood pressure monitor",
            form_factor: "Small upper arm cuff, wireless",
            core_function: "Accurate BP measurement for children aged 3–12 with age-specific reference ranges",
            ancillary_service: "Paediatrician-shareable growth report",
            output_type: "",
            pricing_model: "One-time hardware purchase",
            regulatory_status: "",
            country_of_origin: "Germany",
            unique_IP: ["Age-calibrated cuff pressure algorithm"],
            key_constraint: "For use under parental supervision; clinical confirmation recommended",
            connectedFields: ["product_name", "product_link", "core_function", "category_primary", "category_secondary", "form_factor", "ancillary_service", "pricing_model", "country_of_origin", "key_constraint"],
          },
        ],
      },
      {
        id: "fr3",
        name: "OxyClip",
        description: "Pulse oximetry solutions",
        ranges: [
          {
            id: "rng3",
            sku: "OCP-SPO2-03",
            product_name: "OxyClip Pro",
            product_link: "https://oxyclip.com/pro",
            category_primary: "Consumer medical device",
            category_secondary: "Pulse oximeter",
            form_factor: "Fingertip clip, Bluetooth",
            core_function: "",
            ancillary_service: "Sleep apnea screening mode via companion app",
            output_type: "SpO2 %, pulse rate, perfusion index",
            pricing_model: "One-time hardware purchase",
            regulatory_status: "Class IIA, CE marked",
            country_of_origin: "China",
            unique_IP: ["Multi-wavelength optical sensor array"],
            key_constraint: "",
            connectedFields: ["product_name", "product_link", "category_primary", "category_secondary", "form_factor", "ancillary_service", "output_type", "pricing_model", "regulatory_status", "country_of_origin"],
          },
          {
            id: "rng3b",
            sku: "OCP-SPT-04",
            product_name: "OxyClip Sport",
            product_link: "",
            category_primary: "Consumer medical device",
            category_secondary: "Sports pulse oximeter",
            form_factor: "Finger clip with secure sport strap, ANT+/Bluetooth",
            core_function: "Continuous SpO2 and HR monitoring during high-intensity exercise",
            ancillary_service: "",
            output_type: "Real-time SpO2, HR, estimated VO2 max",
            pricing_model: "One-time hardware purchase",
            regulatory_status: "Class IIA, CE marked",
            country_of_origin: "China",
            unique_IP: ["Motion-artefact cancellation algorithm (patent)"],
            key_constraint: "Not validated for medical diagnosis; sport and wellness use only",
            connectedFields: ["product_name", "core_function", "category_primary", "category_secondary", "form_factor", "output_type", "pricing_model", "regulatory_status", "country_of_origin", "key_constraint"],
          },
          {
            id: "rng3c",
            sku: "OCP-PED-05",
            product_name: "OxyClip Paediatric",
            product_link: "https://oxyclip.com/paediatric",
            category_primary: "Paediatric medical device",
            category_secondary: "Paediatric pulse oximeter",
            form_factor: "Soft wrap sensor, disposable",
            core_function: "Non-invasive SpO2 monitoring for neonates and infants",
            ancillary_service: "Continuous alarm monitoring with nurse-call integration",
            output_type: "SpO2 % + HR with age-adjusted alarm thresholds",
            pricing_model: "",
            regulatory_status: "Class IIb, CE + FDA 510(k)",
            country_of_origin: "",
            unique_IP: ["Neonatal skin-safe adhesive formula", "Low-perfusion signal amplification"],
            key_constraint: "Single-use only; clinical supervision required",
            connectedFields: ["product_name", "product_link", "core_function", "category_primary", "category_secondary", "form_factor", "ancillary_service", "output_type", "regulatory_status", "key_constraint"],
          },
        ],
      },
    ],
  },
  {
    id: "ta2",
    name: "Cardiac Wellness",
    description: "Wearables and supplements for cardiac health management",
    color: "violet",
    franchises: [
      {
        id: "fr4",
        name: "CardioTrack",
        description: "Cardiac monitoring wearables",
        ranges: [
          {
            id: "rng4",
            sku: "CTB-WEAR-01",
            product_name: "CardioTrack Band",
            product_link: "",
            category_primary: "Consumer wearable",
            category_secondary: "Cardiac monitoring smartband",
            form_factor: "Wristband, continuous wear",
            core_function: "24/7 heart rate monitoring with irregular rhythm alerts",
            ancillary_service: "Weekly cardiac summary report via app",
            output_type: "",
            pricing_model: "Hardware + optional monthly app subscription",
            regulatory_status: "Wellness device — not classified as a medical device",
            country_of_origin: "USA",
            unique_IP: ["PPG + accelerometer sensor fusion patent"],
            key_constraint: "Rhythm alerts are indicative; not a clinical diagnosis",
            connectedFields: ["product_name", "core_function", "category_primary", "category_secondary", "form_factor", "ancillary_service", "pricing_model", "regulatory_status", "country_of_origin", "key_constraint"],
          },
          {
            id: "rng4b",
            sku: "CTB-RING-02",
            product_name: "CardioTrack Ring",
            product_link: "https://cardiotrack.com/ring",
            category_primary: "Consumer wearable",
            category_secondary: "Smart ring with cardiac monitoring",
            form_factor: "Titanium smart ring, size-adjustable",
            core_function: "",
            ancillary_service: "Nightly HRV and recovery score",
            output_type: "HR, HRV, SpO2, skin temperature, sleep stages",
            pricing_model: "One-time hardware purchase",
            regulatory_status: "",
            country_of_origin: "Finland",
            unique_IP: ["360° optical sensor array in ring form factor", "Proprietary HRV analysis engine"],
            key_constraint: "Not a medical device; wellness and lifestyle use only",
            connectedFields: ["product_name", "product_link", "category_primary", "category_secondary", "form_factor", "ancillary_service", "output_type", "pricing_model", "country_of_origin", "key_constraint"],
          },
          {
            id: "rng4c",
            sku: "CTB-PCH-03",
            product_name: "CardioTrack Patch",
            product_link: "https://cardiotrack.com/patch",
            category_primary: "Consumer wearable",
            category_secondary: "Adhesive cardiac monitoring patch",
            form_factor: "Chest adhesive patch, 7-day wear",
            core_function: "Continuous single-lead ECG and activity monitoring over 7 days",
            ancillary_service: "",
            output_type: "7-day ECG recording + AI arrhythmia summary",
            pricing_model: "Single-use per patch, subscription for analysis service",
            regulatory_status: "Class IIA, CE marked",
            country_of_origin: "USA",
            unique_IP: ["Ultra-thin flexible electrode matrix", "Long-duration signal drift compensation"],
            key_constraint: "",
            connectedFields: ["product_name", "product_link", "core_function", "category_primary", "category_secondary", "form_factor", "output_type", "pricing_model", "regulatory_status", "country_of_origin"],
          },
        ],
      },
      {
        id: "fr5",
        name: "CardioSupport",
        description: "Cardiac health nutraceuticals",
        ranges: [
          {
            id: "rng5",
            sku: "CSO3-SUPP-02",
            product_name: "CardioSupport Omega-3",
            product_link: "",
            category_primary: "Nutraceutical",
            category_secondary: "Cardiac supplement",
            form_factor: "Softgel capsule, 60-count bottle",
            core_function: "High-concentration EPA/DHA omega-3 for cardiovascular support",
            ancillary_service: "Nutritionist consultation (optional add-on)",
            output_type: "Dietary supplement",
            pricing_model: "Monthly subscription or single purchase",
            regulatory_status: "",
            country_of_origin: "Norway",
            unique_IP: [],
            key_constraint: "May interact with anticoagulant medications; consult physician",
            connectedFields: ["product_name", "core_function", "category_primary", "category_secondary", "form_factor", "ancillary_service", "output_type", "pricing_model", "country_of_origin", "key_constraint"],
          },
          {
            id: "rng5b",
            sku: "CSQ10-SUPP-03",
            product_name: "CardioSupport CoQ10",
            product_link: "https://cardiosupport.com/coq10",
            category_primary: "Nutraceutical",
            category_secondary: "Mitochondrial support supplement",
            form_factor: "Softgel capsule, 90-count bottle",
            core_function: "Ubiquinol CoQ10 supplementation to support cardiac energy metabolism",
            ancillary_service: "Personalised dosage guidance via app",
            output_type: "Dietary supplement",
            pricing_model: "",
            regulatory_status: "Food supplement — not a medicinal product",
            country_of_origin: "",
            unique_IP: ["Enhanced bioavailability lipid matrix"],
            key_constraint: "Consult physician if taking statins",
            connectedFields: ["product_name", "product_link", "core_function", "category_primary", "category_secondary", "form_factor", "ancillary_service", "output_type", "regulatory_status", "key_constraint"],
          },
          {
            id: "rng5c",
            sku: "CSMG-SUPP-04",
            product_name: "CardioSupport Magnesium",
            product_link: "https://cardiosupport.com/magnesium",
            category_primary: "Nutraceutical",
            category_secondary: "Electrolyte supplement",
            form_factor: "Effervescent tablet, 30-count tube",
            core_function: "Highly bioavailable magnesium bisglycinate for cardiac muscle and rhythm support",
            ancillary_service: "",
            output_type: "",
            pricing_model: "Monthly subscription or single purchase",
            regulatory_status: "Food supplement — not a medicinal product",
            country_of_origin: "Switzerland",
            unique_IP: [],
            key_constraint: "Reduce dose if experiencing loose stools",
            connectedFields: ["product_name", "product_link", "core_function", "category_primary", "category_secondary", "form_factor", "pricing_model", "regulatory_status", "country_of_origin", "key_constraint"],
          },
        ],
      },
    ],
  },
  {
    id: "ta3",
    name: "Connected Health Platform",
    description: "Digital health services and integrated telehealth solutions",
    color: "green",
    franchises: [
      {
        id: "fr6",
        name: "HealthSync",
        description: "Personal health management software",
        ranges: [
          {
            id: "rng6",
            sku: "HSP-APP-01",
            product_name: "HealthSync Premium App",
            product_link: "https://healthsync.io/premium",
            category_primary: "Digital health software",
            category_secondary: "Personal health management app",
            form_factor: "iOS & Android application",
            core_function: "Aggregates all connected device data into a unified health dashboard",
            ancillary_service: "",
            output_type: "Unified health timeline, trend reports, physician-shareable PDF",
            pricing_model: "Monthly or annual subscription",
            regulatory_status: "Class I SaMD, CE",
            country_of_origin: "",
            unique_IP: ["Federated health data model (patent pending)"],
            key_constraint: "Requires at least one compatible connected device for full functionality",
            connectedFields: ["product_name", "product_link", "core_function", "category_primary", "category_secondary", "form_factor", "output_type", "pricing_model", "regulatory_status", "key_constraint"],
          },
          {
            id: "rng6b",
            sku: "HSP-BSC-02",
            product_name: "HealthSync Basic App",
            product_link: "",
            category_primary: "Digital health software",
            category_secondary: "Entry-level health tracking app",
            form_factor: "iOS & Android application",
            core_function: "Manual health log with step count, sleep and hydration tracking",
            ancillary_service: "In-app health tips and weekly goal suggestions",
            output_type: "Daily health summary + monthly trend chart",
            pricing_model: "Free with optional premium upgrade",
            regulatory_status: "Not classified as a medical device",
            country_of_origin: "United Kingdom",
            unique_IP: [],
            key_constraint: "",
            connectedFields: ["product_name", "core_function", "category_primary", "category_secondary", "form_factor", "ancillary_service", "output_type", "pricing_model", "regulatory_status", "country_of_origin"],
          },
          {
            id: "rng6c",
            sku: "HSP-FAM-03",
            product_name: "HealthSync Family Plan",
            product_link: "https://healthsync.io/family",
            category_primary: "Digital health software",
            category_secondary: "Multi-user health management plan",
            form_factor: "iOS & Android application, up to 6 profiles",
            core_function: "",
            ancillary_service: "Caregiver dashboard with alert notifications",
            output_type: "Per-member dashboards + family health overview",
            pricing_model: "",
            regulatory_status: "Class I SaMD, CE",
            country_of_origin: "United Kingdom",
            unique_IP: ["Cross-profile anonymised benchmarking engine"],
            key_constraint: "Guardian consent required for members under 16",
            connectedFields: ["product_name", "product_link", "category_primary", "category_secondary", "form_factor", "ancillary_service", "output_type", "regulatory_status", "country_of_origin", "key_constraint"],
          },
        ],
      },
      {
        id: "fr7",
        name: "TeleHealth",
        description: "Remote patient monitoring kits",
        ranges: [
          {
            id: "rng7",
            sku: "THS-PACK-02",
            product_name: "TeleHealth Starter Pack",
            product_link: "",
            category_primary: "Telehealth service bundle",
            category_secondary: "Remote patient monitoring kit",
            form_factor: "Physical kit + digital service",
            core_function: "Complete starter kit for remote patient monitoring with clinician access",
            ancillary_service: "3 included video consultations with a specialist",
            output_type: "Connected monitoring setup + clinician-validated reports",
            pricing_model: "One-time kit purchase + monthly service fee",
            regulatory_status: "Includes Class IIA devices; service is CE-compliant",
            country_of_origin: "Netherlands",
            unique_IP: [],
            key_constraint: "",
            connectedFields: ["product_name", "core_function", "category_primary", "category_secondary", "form_factor", "ancillary_service", "output_type", "pricing_model", "regulatory_status", "country_of_origin"],
          },
          {
            id: "rng7b",
            sku: "THS-PRO-03",
            product_name: "TeleHealth Pro Kit",
            product_link: "https://telehealth.io/pro",
            category_primary: "Telehealth service bundle",
            category_secondary: "Advanced remote monitoring kit",
            form_factor: "Physical kit (ECG patch + BP cuff + oximeter) + digital service",
            core_function: "Comprehensive multi-parameter remote monitoring for chronic disease management",
            ancillary_service: "",
            output_type: "Multi-parameter dashboard + weekly clinician review report",
            pricing_model: "Monthly all-inclusive subscription",
            regulatory_status: "",
            country_of_origin: "Netherlands",
            unique_IP: ["Unified multi-device telemetry protocol"],
            key_constraint: "Requires GP or specialist referral to activate",
            connectedFields: ["product_name", "product_link", "core_function", "category_primary", "category_secondary", "form_factor", "output_type", "pricing_model", "country_of_origin", "key_constraint"],
          },
          {
            id: "rng7c",
            sku: "THS-ENT-04",
            product_name: "TeleHealth Enterprise",
            product_link: "https://telehealth.io/enterprise",
            category_primary: "Telehealth service bundle",
            category_secondary: "Hospital-grade remote monitoring solution",
            form_factor: "Fleet deployment — hardware + white-label platform",
            core_function: "Scalable remote patient monitoring for hospital and insurance programmes",
            ancillary_service: "Dedicated clinical operations team + SLA support",
            output_type: "Population health dashboard + HL7 FHIR data export",
            pricing_model: "Annual enterprise contract",
            regulatory_status: "Includes Class IIA devices; GDPR and ISO 27001 compliant",
            country_of_origin: "",
            unique_IP: ["Adaptive patient cohort risk-stratification model (patent pending)"],
            key_constraint: "",
            connectedFields: ["product_name", "product_link", "core_function", "category_primary", "category_secondary", "form_factor", "ancillary_service", "output_type", "pricing_model", "regulatory_status", "key_constraint"],
          },
        ],
      },
    ],
  },
];

const DEFAULT_THERAPEUTIC_AREAS = [];

// ── HELPERS ───────────────────────────────────────────────────────

const FIELD_GROUP_MAP = (() => {
  const map = {};
  PRODUCT_FIELDS.forEach((f) => {
    if (!map[f.group]) map[f.group] = [];
    map[f.group].push(f);
  });
  return map;
})();

function countConnected(range) {
  return (range.connectedFields || []).length;
}

function lookupSKU(sku, areas) {
  for (const ta of areas) {
    for (const fr of ta.franchises) {
      const hit = fr.ranges.find((r) => r.sku.toLowerCase() === sku.toLowerCase());
      if (hit) return { ...hit, unique_IP: [...(hit.unique_IP || [])] };
    }
  }
  return {
    sku: sku.toUpperCase(),
    product_name: sku.split("-").slice(0, 2).join(" "),
    product_link: "", category_primary: "", category_secondary: "",
    form_factor: "", core_function: "", ancillary_service: "",
    output_type: "", pricing_model: "", regulatory_status: "",
    country_of_origin: "", unique_IP: [], key_constraint: "",
    connectedFields: [],
  };
}

// ── SHARED ────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3L13 13M3 13L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function LockIcon({ size = 10 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <rect x="1.5" y="4.5" width="7" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
}

function SourceBadge({ connector, connected }) {
  if (connected && !connector) {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] whitespace-nowrap">
        Auto
      </span>
    );
  }
  if (!connector) return null;
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${
      connected ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#f3f4f6] text-[#6a7282]"
    }`}>
      {connected ? `● Auto · ${connector}` : `○ ${connector}`}
    </span>
  );
}

// ── MODAL: Therapeutic Area (create + edit) ───────────────────────

function AreaModal({ area, onSave, onClose }) {
  const [name, setName] = useState(area?.name || "");
  const [desc, setDesc] = useState(area?.description || "");
  const [color, setColor] = useState(area?.color || "blue");
  const isEdit = !!area;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[480px] rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <h3 className="text-base font-semibold text-[#111318]">{isEdit ? "Edit therapeutic area" : "New therapeutic area"}</h3>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Area name</label>
            <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave({ name: name.trim(), desc: desc.trim(), color })}
              placeholder="e.g. Cardiovascular"
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Description <span className="font-normal text-[#9ca3af]">(optional)</span></label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Briefly describe this therapeutic area…" rows={2}
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc] resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-2">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full ${FAMILY_COLORS[c].dot} ring-offset-2 transition-all ${color === c ? "ring-2 ring-[#155dfc]" : "hover:ring-2 hover:ring-[#d1d5dc]"}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">Cancel</button>
          <button onClick={() => name.trim() && onSave({ name: name.trim(), desc: desc.trim(), color })}
            disabled={!name.trim()}
            className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] disabled:opacity-40 disabled:cursor-not-allowed">
            {isEdit ? "Save changes" : "Create area"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteAreaModal({ area, onConfirm, onClose }) {
  const total = area.franchises.reduce((s, f) => s + f.ranges.length, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[420px] rounded-xl bg-white shadow-2xl">
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fee2e2]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 6v4M9 12.5h.01M17 9A8 8 0 1 1 1 9a8 8 0 0 1 16 0z" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111318]">Delete "{area.name}"?</p>
              <p className="text-xs text-[#6a7282] mt-0.5">
                Permanently removes this area, its {area.franchises.length} franchise{area.franchises.length !== 1 ? "s" : ""}, and all {total} product{total !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">Cancel</button>
          <button onClick={onConfirm} className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-medium text-white hover:bg-[#b91c1c]">Delete area</button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL: Franchise (create + edit) ─────────────────────────────

function FranchiseModal({ franchise, onSave, onClose }) {
  const [name, setName] = useState(franchise?.name || "");
  const [desc, setDesc] = useState(franchise?.description || "");
  const isEdit = !!franchise;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[480px] rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <h3 className="text-base font-semibold text-[#111318]">{isEdit ? "Edit franchise" : "New franchise"}</h3>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Franchise / Brand name</label>
            <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave({ name: name.trim(), desc: desc.trim() })}
              placeholder="e.g. Nurofen"
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Description <span className="font-normal text-[#9ca3af]">(optional)</span></label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Briefly describe this franchise…" rows={2}
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc] resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">Cancel</button>
          <button onClick={() => name.trim() && onSave({ name: name.trim(), desc: desc.trim() })}
            disabled={!name.trim()}
            className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] disabled:opacity-40 disabled:cursor-not-allowed">
            {isEdit ? "Save changes" : "Create franchise"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteFranchiseModal({ franchise, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[420px] rounded-xl bg-white shadow-2xl">
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fee2e2]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 6v4M9 12.5h.01M17 9A8 8 0 1 1 1 9a8 8 0 0 1 16 0z" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111318]">Delete "{franchise.name}"?</p>
              <p className="text-xs text-[#6a7282] mt-0.5">
                Permanently removes this franchise and all {franchise.ranges.length} product{franchise.ranges.length !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">Cancel</button>
          <button onClick={onConfirm} className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-medium text-white hover:bg-[#b91c1c]">Delete franchise</button>
        </div>
      </div>
    </div>
  );
}

// ── PRODUCT FORM ──────────────────────────────────────────────────
// Auto-synced fields (connectedFields) are read-only with lock badge.

function ProductForm({ product, onChange }) {
  const autoFields = product.connectedFields || [];

  const updateField = (key, val) => onChange({ ...product, [key]: val });
  const updateIP = (idx, val) => {
    const arr = [...(product.unique_IP || [])];
    arr[idx] = val;
    onChange({ ...product, unique_IP: arr });
  };
  const addIP = () => onChange({ ...product, unique_IP: [...(product.unique_IP || []), ""] });
  const removeIP = (idx) => onChange({ ...product, unique_IP: (product.unique_IP || []).filter((_, i) => i !== idx) });

  return (
    <div className="flex flex-col gap-6">
      {FIELD_GROUPS.map((groupName) => {
        const fields = FIELD_GROUP_MAP[groupName] || [];
        return (
          <div key={groupName}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#155dfc]">{GROUP_ICONS[groupName]}</span>
              <h4 className="text-sm font-semibold text-[#111318]">{groupName}</h4>
            </div>
            <div className="flex flex-col gap-3">
              {fields.map((field) => {
                const isAuto = autoFields.includes(field.key);

                if (field.isArray) {
                  return (
                    <div key={field.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282]">{field.label}</label>
                        <SourceBadge connector={field.sourceConnector} connected={false} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {(product.unique_IP || []).map((val, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input type="text" value={val} onChange={(e) => updateIP(idx, e.target.value)}
                              placeholder={field.placeholder}
                              className="flex-1 rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-sm focus:border-[#155dfc] focus:outline-none" />
                            <button onClick={() => removeIP(idx)} className="shrink-0 rounded p-1 text-[#9ca3af] hover:text-[#dc2626]">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M1.5 1.5l7 7M1.5 8.5l7-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button onClick={addIP} className="self-start flex items-center gap-1 text-[11px] text-[#9ca3af] hover:text-[#374151] mt-0.5">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                          </svg>
                          Add IP claim
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={field.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282]">{field.label}</label>
                      <SourceBadge connector={field.sourceConnector} connected={isAuto} />
                    </div>
                    {field.multiline ? (
                      <textarea value={product[field.key] || ""} onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder} rows={2}
                        className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#155dfc] focus:outline-none resize-none" />
                    ) : (
                      <input type="text" value={product[field.key] || ""} onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#155dfc] focus:outline-none" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── MODAL: Add Range ──────────────────────────────────────────────

function AddRangeModal({ onSave, onClose, areas }) {
  const [step, setStep] = useState(1);
  const [sku, setSku] = useState("");
  const [product, setProduct] = useState(null);

  const handleLookup = () => {
    if (!sku.trim()) return;
    setProduct(lookupSKU(sku.trim(), areas));
    setStep(2);
  };

  const connected = (product?.connectedFields || []).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[640px] max-h-[90vh] flex flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-[#111318]">
              {step === 1 ? "Add product" : `Configure product — ${product?.sku}`}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              {[1, 2].map((s) => (
                <div key={s} className={`h-1 w-8 rounded-full transition-colors ${s <= step ? "bg-[#155dfc]" : "bg-[#e5e7eb]"}`} />
              ))}
              <span className="text-xs text-[#9ca3af] ml-1">Step {step} of 2</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
        </div>

        {step === 1 ? (
          <div className="p-6 flex flex-col gap-5">
            <p className="text-sm text-[#6a7282] leading-relaxed">
              Enter the product SKU. The system will auto-populate known fields from connected sources — these will be locked. Complete the 2 remaining fields manually.
            </p>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#6a7282] mb-1.5">Product SKU</label>
              <input autoFocus type="text" value={sku} onChange={(e) => setSku(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sku.trim() && handleLookup()}
                placeholder="e.g. DHH-ECG-01"
                className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm font-mono focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">Cancel</button>
              <button onClick={handleLookup} disabled={!sku.trim()}
                className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] disabled:opacity-40 disabled:cursor-not-allowed">
                Look up SKU →
              </button>
            </div>
          </div>
        ) : (
          <>
            {connected > 0 && (
              <div className="mx-6 mt-4 shrink-0 flex items-center gap-2 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-[#16a34a]">
                  <circle cx="7" cy="7" r="5.8" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4.5 7l1.8 1.8 3.2-3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-xs text-[#15803d]">
                  <span className="font-semibold">{connected} field{connected > 1 ? "s" : ""}</span> auto-populated and locked from connected sources. Complete the remaining fields manually.
                </p>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <ProductForm product={product} onChange={setProduct} />
            </div>
            <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4 shrink-0">
              <button onClick={() => setStep(1)} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">← Back</button>
              <button onClick={() => onSave(product)}
                className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8]">
                Save product
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── MODAL: Range Detail / Edit ────────────────────────────────────

function RangeDetailModal({ range: initialRange, areas, currentFranchiseId, onSave, onClose }) {
  const [range, setRange] = useState({ ...initialRange, unique_IP: [...(initialRange.unique_IP || [])] });
  const [editing, setEditing] = useState(false);
  const [targetFranchiseId, setTargetFranchiseId] = useState(currentFranchiseId);

  const connected = countConnected(range);

  const handleCancel = () => {
    setRange({ ...initialRange, unique_IP: [...(initialRange.unique_IP || [])] });
    setTargetFranchiseId(currentFranchiseId);
    setEditing(false);
  };

  const allFranchises = areas.flatMap((ta) =>
    ta.franchises.map((fr) => ({ ...fr, taName: ta.name }))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-[720px] max-h-[90vh] flex flex-col rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e5e7eb] px-6 py-5 shrink-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-md bg-[#f3f4f6] px-2 py-0.5 text-xs font-mono text-[#374151]">{range.sku}</span>
              {connected > 0 && (
                <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-semibold text-[#15803d]">
                  {connected} auto-synced
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-[#111318]">{range.product_name}</h2>
            <p className="text-sm text-[#6a7282]">
              {range.category_primary}{range.category_secondary ? ` · ${range.category_secondary}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Edit
              </button>
            )}
            <button onClick={onClose} className="rounded p-1.5 text-[#9ca3af] hover:text-[#374151]"><CloseIcon /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {editing ? (
            <div className="flex flex-col gap-6">
              {/* Franchise selector */}
              {allFranchises.length > 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#155dfc]">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 4h10M2 7h7M2 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <h4 className="text-sm font-semibold text-[#111318]">Franchise / Brand</h4>
                  </div>
                  <select value={targetFranchiseId} onChange={(e) => setTargetFranchiseId(e.target.value)}
                    className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm text-[#111318] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]">
                    {allFranchises.map((fr) => (
                      <option key={fr.id} value={fr.id}>{fr.name} ({fr.taName})</option>
                    ))}
                  </select>
                  {targetFranchiseId !== currentFranchiseId && (
                    <p className="mt-1.5 text-xs text-[#d97706]">
                      This product will be moved to "{allFranchises.find((f) => f.id === targetFranchiseId)?.name}".
                    </p>
                  )}
                </div>
              )}
              <ProductForm product={range} onChange={setRange} />
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              {FIELD_GROUPS.map((groupName) => {
                const fields = FIELD_GROUP_MAP[groupName] || [];
                return (
                  <div key={groupName}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[#155dfc]">{GROUP_ICONS[groupName]}</span>
                      <h4 className="text-sm font-semibold text-[#111318]">{groupName}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      {fields.map((field) => {
                        const isConnected = (range.connectedFields || []).includes(field.key);
                        const val = range[field.key];
                        const isWide = field.multiline || field.isArray;
                        return (
                          <div key={field.key} className={isWide ? "col-span-2" : ""}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">{field.label}</span>
                              <SourceBadge connector={field.sourceConnector} connected={isConnected} />
                            </div>
                            {field.isArray ? (
                              <div className="flex flex-col gap-1 mt-1">
                                {(Array.isArray(val) && val.length > 0)
                                  ? val.map((v, idx) => (
                                      <div key={idx} className="flex items-start gap-2">
                                        <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#155dfc]" />
                                        <span className="text-sm text-[#374151] leading-snug">{v}</span>
                                      </div>
                                    ))
                                  : <span className="text-sm text-[#9ca3af] italic">—</span>
                                }
                              </div>
                            ) : field.key === "product_link" && val ? (
                              <a href={val} target="_blank" rel="noreferrer"
                                className="block text-sm text-[#155dfc] hover:underline truncate mt-0.5">{val}</a>
                            ) : (
                              <p className={`mt-0.5 text-sm leading-relaxed ${val ? "text-[#374151]" : "text-[#9ca3af] italic"}`}>
                                {val || "—"}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {editing && (
          <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4 shrink-0">
            <button onClick={handleCancel} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">Cancel</button>
            <button onClick={() => { onSave(range, targetFranchiseId); setEditing(false); }}
              className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8]">
              Save changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────

export default function Products() {
  const navigate = useNavigate();
  const { uploadedDatabases } = useMappingContext();
  const hasSource = uploadedDatabases.length > 0;

  const isShopify = () => uploadedDatabases.some((db) => db.fileName === "Shopify sample.xlsx");

  const [areas, setAreas] = useState(() =>
    isShopify() ? SHOPIFY_THERAPEUTIC_AREAS : DEFAULT_THERAPEUTIC_AREAS
  );
  const [expandedTaIds, setExpandedTaIds] = useState(() =>
    isShopify() ? new Set(SHOPIFY_THERAPEUTIC_AREAS.map((ta) => ta.id)) : new Set()
  );
  const [selectedFranchiseId, setSelectedFranchiseId] = useState(() =>
    isShopify() ? SHOPIFY_THERAPEUTIC_AREAS[0].franchises[0].id : null
  );
  const [areaSearch, setAreaSearch] = useState("");

  // Modals
  const [newAreaModal, setNewAreaModal] = useState(false);
  const [editAreaModal, setEditAreaModal] = useState(null);
  const [deleteAreaModal, setDeleteAreaModal] = useState(null);
  const [newFranchiseForTa, setNewFranchiseForTa] = useState(null); // taId
  const [editFranchiseModal, setEditFranchiseModal] = useState(null); // { taId, franchise }
  const [deleteFranchiseModal, setDeleteFranchiseModal] = useState(null); // { taId, franchise }
  const [addRangeModal, setAddRangeModal] = useState(false);
  const [rangeDetailModal, setRangeDetailModal] = useState(null); // { range, franchiseId }

  // Auto-populate when Shopify file is uploaded while on this page
  useEffect(() => {
    if (isShopify()) {
      setAreas((prev) => {
        if (prev.length === 0) {
          setExpandedTaIds(new Set(SHOPIFY_THERAPEUTIC_AREAS.map((ta) => ta.id)));
          setSelectedFranchiseId(SHOPIFY_THERAPEUTIC_AREAS[0].franchises[0].id);
          return SHOPIFY_THERAPEUTIC_AREAS;
        }
        return prev;
      });
    }
  }, [uploadedDatabases]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ──────────────────────────────────────────────────

  const toggleTa = (taId) =>
    setExpandedTaIds((prev) => {
      const next = new Set(prev);
      next.has(taId) ? next.delete(taId) : next.add(taId);
      return next;
    });

  const findFranchise = (franchiseId) => {
    for (const ta of areas) {
      const fr = ta.franchises.find((f) => f.id === franchiseId);
      if (fr) return { ta, franchise: fr };
    }
    return null;
  };

  const selectedCtx = selectedFranchiseId ? findFranchise(selectedFranchiseId) : null;
  const selectedFranchise = selectedCtx?.franchise || null;
  const selectedTa = selectedCtx?.ta || null;

  const totalRanges = areas.reduce((s, ta) => s + ta.franchises.reduce((ss, fr) => ss + fr.ranges.length, 0), 0);
  const totalFranchises = areas.reduce((s, ta) => s + ta.franchises.length, 0);

  const filteredAreas = areaSearch.trim()
    ? areas
        .map((ta) => ({
          ...ta,
          franchises: ta.franchises.filter((fr) =>
            fr.name.toLowerCase().includes(areaSearch.toLowerCase()) ||
            ta.name.toLowerCase().includes(areaSearch.toLowerCase())
          ),
        }))
        .filter((ta) =>
          ta.name.toLowerCase().includes(areaSearch.toLowerCase()) || ta.franchises.length > 0
        )
    : areas;

  // ── CRUD: Areas ───────────────────────────────────────────────

  const createArea = ({ name, desc, color }) => {
    const ta = { id: `ta${Date.now()}`, name, description: desc, color, franchises: [] };
    setAreas((prev) => [...prev, ta]);
    setExpandedTaIds((prev) => new Set([...prev, ta.id]));
    setNewAreaModal(false);
  };

  const editArea = ({ name, desc, color }) => {
    setAreas((prev) => prev.map((ta) => ta.id === editAreaModal.id ? { ...ta, name, description: desc, color } : ta));
    setEditAreaModal(null);
  };

  const deleteArea = () => {
    const id = deleteAreaModal.id;
    setAreas((prev) => prev.filter((ta) => ta.id !== id));
    if (selectedTa?.id === id) setSelectedFranchiseId(null);
    setDeleteAreaModal(null);
  };

  // ── CRUD: Franchises ──────────────────────────────────────────

  const createFranchise = ({ name, desc }) => {
    const taId = newFranchiseForTa;
    const fr = { id: `fr${Date.now()}`, name, description: desc, ranges: [] };
    setAreas((prev) => prev.map((ta) => ta.id === taId ? { ...ta, franchises: [...ta.franchises, fr] } : ta));
    setExpandedTaIds((prev) => new Set([...prev, taId]));
    setSelectedFranchiseId(fr.id);
    setNewFranchiseForTa(null);
  };

  const editFranchise = ({ name, desc }) => {
    const { taId, franchise } = editFranchiseModal;
    setAreas((prev) =>
      prev.map((ta) =>
        ta.id === taId
          ? { ...ta, franchises: ta.franchises.map((fr) => fr.id === franchise.id ? { ...fr, name, description: desc } : fr) }
          : ta
      )
    );
    setEditFranchiseModal(null);
  };

  const deleteFranchise = () => {
    const { taId, franchise } = deleteFranchiseModal;
    setAreas((prev) =>
      prev.map((ta) => ta.id === taId ? { ...ta, franchises: ta.franchises.filter((fr) => fr.id !== franchise.id) } : ta)
    );
    if (selectedFranchiseId === franchise.id) setSelectedFranchiseId(null);
    setDeleteFranchiseModal(null);
  };

  // ── CRUD: Ranges ──────────────────────────────────────────────

  const addRange = (range) => {
    const franchiseId = selectedFranchiseId;
    setAreas((prev) =>
      prev.map((ta) => ({
        ...ta,
        franchises: ta.franchises.map((fr) =>
          fr.id === franchiseId
            ? { ...fr, ranges: [...fr.ranges, { ...range, id: `rng${Date.now()}` }] }
            : fr
        ),
      }))
    );
    setAddRangeModal(false);
  };

  const saveRange = (updated, targetFranchiseId) => {
    const sourceFranchiseId = rangeDetailModal.franchiseId;
    setAreas((prev) =>
      prev.map((ta) => ({
        ...ta,
        franchises: ta.franchises.map((fr) => {
          if (targetFranchiseId !== sourceFranchiseId) {
            if (fr.id === sourceFranchiseId) return { ...fr, ranges: fr.ranges.filter((r) => r.id !== updated.id) };
            if (fr.id === targetFranchiseId)  return { ...fr, ranges: [...fr.ranges, updated] };
          } else {
            if (fr.id === sourceFranchiseId) return { ...fr, ranges: fr.ranges.map((r) => r.id === updated.id ? updated : r) };
          }
          return fr;
        }),
      }))
    );
    setRangeDetailModal(null);
  };

  const removeRange = (franchiseId, rangeId) => {
    setAreas((prev) =>
      prev.map((ta) => ({
        ...ta,
        franchises: ta.franchises.map((fr) =>
          fr.id === franchiseId ? { ...fr, ranges: fr.ranges.filter((r) => r.id !== rangeId) } : fr
        ),
      }))
    );
  };

  // ── No source state ───────────────────────────────────────────

  if (!hasSource) {
    return (
      <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3f4f6]">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 3C8.477 3 4 7.477 4 13s4.477 10 10 10 10-4.477 10-10S19.523 3 14 3z" stroke="#9ca3af" strokeWidth="1.5"/>
                <path d="M14 9v5l3 3" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-base font-semibold text-[#0a0a0a]">No source connected</p>
              <p className="max-w-[340px] text-sm text-[#6a7282]">
                Upload a database to start managing your product catalogue.
              </p>
            </div>
            <button onClick={() => navigate("/")}
              className="mt-1 rounded-[10px] bg-[#155dfc] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1247cc]">
              Go to Data sources
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Page header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-5 shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-[#111318]">Products</h1>
            <p className="text-sm text-[#6a7282] mt-0.5">
              {areas.length} therapeutic area{areas.length !== 1 ? "s" : ""} · {totalFranchises} franchise{totalFranchises !== 1 ? "s" : ""} · {totalRanges} product{totalRanges !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={() => setNewAreaModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8] transition-colors">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1V12M1 6.5H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New therapeutic area
          </button>
        </div>

        {/* Two-panel body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left panel — hierarchy */}
          <div className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M9 9L11.5 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <input type="text" value={areaSearch} onChange={(e) => setAreaSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] py-1.5 pl-8 pr-3 text-sm focus:border-[#155dfc] focus:outline-none" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-1">
              {filteredAreas.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-[#9ca3af]">No results.</p>
              ) : filteredAreas.map((ta) => {
                const expanded = expandedTaIds.has(ta.id);
                const colors = FAMILY_COLORS[ta.color] || FAMILY_COLORS.blue;
                return (
                  <div key={ta.id}>
                    {/* Therapeutic Area row */}
                    <div className="group relative">
                      <button onClick={() => toggleTa(ta.id)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#f9fafb] transition-colors text-left">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors.dot}`} />
                        <span className="flex-1 min-w-0 text-xs font-semibold uppercase tracking-[0.5px] text-[#374151] truncate pr-12">
                          {ta.name}
                        </span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                          className={`shrink-0 text-[#9ca3af] transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}>
                          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <div className="absolute right-7 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); setEditAreaModal(ta); }}
                          className="rounded p-1 text-[#9ca3af] hover:bg-[#e5e7eb] hover:text-[#374151]" title="Edit area">
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                            <path d="M9.5 2.5l2 2M2 10l.5 2 2-.5L11 5a1.414 1.414 0 00-2-2L2 10z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteAreaModal(ta); }}
                          className="rounded p-1 text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Delete area">
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                            <path d="M2 3.5h10M5.5 3.5V2.5h3v1M5 3.5l.5 8M9 3.5l-.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Franchise rows */}
                    {expanded && (
                      <div>
                        {ta.franchises.map((fr) => {
                          const active = fr.id === selectedFranchiseId;
                          return (
                            <div key={fr.id} className="group relative">
                              <button onClick={() => setSelectedFranchiseId(fr.id)}
                                className={`w-full flex items-center gap-2 pl-8 pr-4 py-2 transition-colors text-left ${active ? "bg-[#eff6ff]" : "hover:bg-[#f9fafb]"}`}>
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot} opacity-60`} />
                                <span className={`flex-1 min-w-0 text-sm truncate pr-12 ${active ? "font-medium text-[#155dfc]" : "text-[#374151]"}`}>
                                  {fr.name}
                                </span>
                                <span className="text-xs text-[#9ca3af] shrink-0">{fr.ranges.length}</span>
                              </button>
                              <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                                <button onClick={(e) => { e.stopPropagation(); setEditFranchiseModal({ taId: ta.id, franchise: fr }); }}
                                  className="rounded p-1 text-[#9ca3af] hover:bg-[#e5e7eb] hover:text-[#374151]" title="Edit franchise">
                                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                                    <path d="M9.5 2.5l2 2M2 10l.5 2 2-.5L11 5a1.414 1.414 0 00-2-2L2 10z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setDeleteFranchiseModal({ taId: ta.id, franchise: fr }); }}
                                  className="rounded p-1 text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Delete franchise">
                                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                                    <path d="M2 3.5h10M5.5 3.5V2.5h3v1M5 3.5l.5 8M9 3.5l-.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {/* Add franchise inline */}
                        <button onClick={() => setNewFranchiseForTa(ta.id)}
                          className="w-full flex items-center gap-1.5 pl-8 pr-4 py-2 text-xs text-[#9ca3af] hover:text-[#155dfc] hover:bg-[#f9fafb] transition-colors text-left">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                          </svg>
                          Add franchise
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel — range cards */}
          {selectedFranchise && selectedTa ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Sub-header with breadcrumb */}
              <div className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4 shrink-0">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${FAMILY_COLORS[selectedTa.color]?.badge} ${FAMILY_COLORS[selectedTa.color]?.border}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${FAMILY_COLORS[selectedTa.color]?.dot}`} />
                      {selectedTa.name}
                    </span>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-[#d1d5dc]">
                      <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-xs font-medium text-[#374151]">{selectedFranchise.name}</span>
                  </div>
                  <h2 className="text-base font-semibold text-[#111318]">{selectedFranchise.name}</h2>
                  {selectedFranchise.description && (
                    <p className="text-xs text-[#6a7282] mt-0.5">{selectedFranchise.description}</p>
                  )}
                </div>
                <button onClick={() => setAddRangeModal(true)}
                  className="flex items-center gap-2 rounded-lg border border-[#155dfc] px-3 py-1.5 text-sm font-medium text-[#155dfc] hover:bg-[#eff6ff] transition-colors">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Add product
                </button>
              </div>

              {/* Range cards */}
              <div className="flex-1 overflow-y-auto p-8">
                {selectedFranchise.ranges.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f4f6]">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M20 7L12 3L4 7M20 7V17L12 21M20 7L12 11M4 7V17L12 21M4 7L12 11M12 11V21" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-[#374151]">No products yet</p>
                    <p className="text-xs text-[#9ca3af] text-center max-w-[240px]">
                      Add the first product by entering its SKU — known fields will be auto-populated and locked.
                    </p>
                    <button onClick={() => setAddRangeModal(true)}
                      className="mt-1 rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4fd8]">
                      + Add product
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                    {selectedFranchise.ranges.map((range) => {
                      const connected = countConnected(range);
                      const colors = FAMILY_COLORS[selectedTa.color] || FAMILY_COLORS.blue;
                      const filledCount = PRODUCT_FIELDS.filter((f) => {
                        const v = range[f.key];
                        return f.isArray ? (Array.isArray(v) && v.length > 0) : !!v;
                      }).length;
                      return (
                        <div key={range.id}
                          onClick={() => setRangeDetailModal({ range, franchiseId: selectedFranchise.id })}
                          className="group flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-5 hover:shadow-sm hover:border-[#d1d5dc] transition-all cursor-pointer">

                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-md bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-mono text-[#374151]">{range.sku}</span>
                            {connected > 0 && (
                              <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-semibold text-[#15803d] shrink-0">
                                {connected} auto
                              </span>
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-[#111318] leading-snug">{range.product_name}</p>
                            {range.core_function && (
                              <p className="text-xs text-[#6a7282] mt-1 leading-relaxed line-clamp-2">{range.core_function}</p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {range.category_primary && (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${colors.badge} ${colors.border}`}>
                                {range.category_primary}
                              </span>
                            )}
                            {range.form_factor && (
                              <span className="rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-2 py-0.5 text-[10px] text-[#374151]">
                                {range.form_factor}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between border-t border-[#f3f4f6] pt-3 mt-auto">
                            <span className="text-xs text-[#9ca3af]">
                              {filledCount}/{PRODUCT_FIELDS.length} fields filled
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeRange(selectedFranchise.id, range.id); }}
                              className="rounded p-1 text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626] transition-colors opacity-0 group-hover:opacity-100"
                              title="Remove product">
                              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                <path d="M2 4h10M5 4V3h4v1M3 4l.7 8h6.6L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-[#d1d5dc]">
                  <path d="M16 4L4 10V18C4 23.52 9.33 28.74 16 30C22.67 28.74 28 23.52 28 18V10L16 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M11 16l3.5 3.5L21 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-sm text-[#9ca3af]">Select a franchise to view its products.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {newAreaModal    && <AreaModal onSave={createArea} onClose={() => setNewAreaModal(false)} />}
      {editAreaModal   && <AreaModal area={editAreaModal} onSave={editArea} onClose={() => setEditAreaModal(null)} />}
      {deleteAreaModal && <DeleteAreaModal area={deleteAreaModal} onConfirm={deleteArea} onClose={() => setDeleteAreaModal(null)} />}
      {newFranchiseForTa  && <FranchiseModal onSave={createFranchise} onClose={() => setNewFranchiseForTa(null)} />}
      {editFranchiseModal && <FranchiseModal franchise={editFranchiseModal.franchise} onSave={editFranchise} onClose={() => setEditFranchiseModal(null)} />}
      {deleteFranchiseModal && <DeleteFranchiseModal franchise={deleteFranchiseModal.franchise} onConfirm={deleteFranchise} onClose={() => setDeleteFranchiseModal(null)} />}
      {addRangeModal && <AddRangeModal onSave={addRange} onClose={() => setAddRangeModal(false)} areas={areas} />}
      {rangeDetailModal && (
        <RangeDetailModal
          range={rangeDetailModal.range}
          areas={areas}
          currentFranchiseId={rangeDetailModal.franchiseId}
          onSave={saveRange}
          onClose={() => setRangeDetailModal(null)}
        />
      )}
    </div>
  );
}
