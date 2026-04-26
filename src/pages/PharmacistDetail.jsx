import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  GreenCheckCircleIcon,
  RefreshSyncIcon,
  CrmIcon,
  MarketingCloudIcon,
  ErpIcon,
  EmailEnvelopeIcon,
  LogInteractionIcon,
  ShareIcon,
  DocumentFileIcon,
} from "../components/icons";

// ── Static profile data (would come from API in production) ──────────
const PROFILE = {
  licenseId:          "PH-20341",
  title:              "PharmD",
  name:               "Sophie Laurent",
  fullTitle:          "Sophie Laurent, PharmD",
  type:               "Clinical",
  specialty:          "Cardiovascular & Anticoagulation",
  role:               "Head Pharmacist",
  status:             "Active",
  targetStatus:       "Targeted",
  engagementScore:    72,
  kolScore:           68,
  receptivity:        "Warm",
  preferredChannel:   "Email",
  repContact:         "Marc Dupont",
  visitFrequency:     "Monthly",

  // Pharmacy & location
  pharmacyName:       "CVS Health – Fenway",
  chainAffiliation:   "CVS Health (Chain)",
  address:            "147 Brookline Ave",
  region:             "New England",
  city:               "Boston, MA",
  zip:                "02215",
  country:            "US",
  catchmentArea:      "Urban",
  staff:              12,
  openingHours:       "Mon–Sat 8 AM – 9 PM, Sun 9 AM – 6 PM",
  patientVolume:      "High traffic",

  // Academic & associations
  academicAffiliation: "Harvard School of Pharmacy (Adjunct Lecturer)",
  associations:       ["FIP – International Pharmaceutical Federation", "APhA – American Pharmacists Association", "ASHP – American Society of Health-System Pharmacists"],

  // Dispensing profile
  topTherapeuticAreas: ["Cardiovascular", "Anticoagulants", "Antihypertensives", "Lipid-lowering agents"],
  topBrands:           ["Eliquis (apixaban)", "Xarelto (rivaroxaban)", "Crestor (rosuvastatin)", "Entresto (sacubitril/valsartan)"],
  genericRatio:        62,   // % generic dispensed
  substitutionBehavior: "Substitutes to generics when therapeutically equivalent and insurer-approved",
  avgRxPerMonth:       2_840,
  reimbursementModel:  "Mixed (Public + Private)",

  // Opt-ins
  emailOptIn:   true,
  phoneOptIn:   true,
  digitalOptIn: true,
};

// ── Helpers ─────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const color =
    score >= 75 ? "bg-[#dcfce7] text-[#15803d]"
    : score >= 45 ? "bg-[#fef9c3] text-[#a16207]"
    : "bg-[#f3f4f6] text-[#6a7282]";
  const label = score >= 75 ? "High" : score >= 45 ? "Medium" : "Low";
  return (
    <span className={`rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.3px] ${color}`}>
      {label}
    </span>
  );
}

function ReceptivityBadge({ value }) {
  const map = {
    Champion: "bg-[#dcfce7] text-[#15803d]",
    Warm:     "bg-[#fef9c3] text-[#a16207]",
    Cold:     "bg-[#f3f4f6] text-[#6a7282]",
  };
  return (
    <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${map[value] ?? map.Cold}`}>
      {value}
    </span>
  );
}

function SectionHeader({ children }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="h-2 w-2 shrink-0 rounded-full bg-[#155dfc]" />
      <h2 className="text-base font-semibold text-[#0a0a0a]">{children}</h2>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs text-[#6a7282]">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-[#101828]">{children}</div>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-gray-100" />;
}

// ── Channel icon ─────────────────────────────────────────────────────
function ChannelIcon({ channel }) {
  if (channel === "Email")     return <EmailEnvelopeIcon />;
  if (channel === "In-person") return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M17 20H22V18C22 16.3431 20.6569 15 19 15C18.0444 15 17.1931 15.4468 16.6438 16.1429M17 20H7M17 20V18C17 17.3438 16.8736 16.717 16.6438 16.1429M7 20H2V18C2 16.3431 3.34315 15 5 15C5.95561 15 6.80686 15.4468 7.35625 16.1429M7 20V18C7 17.3438 7.12642 16.717 7.35625 16.1429M7.35625 16.1429C7.99479 14.301 9.84638 13 12 13C14.1536 13 16.0052 14.301 16.6438 16.1429M15 7C15 8.65685 13.6569 10 12 10C10.3431 10 9 8.65685 9 7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7ZM21 10C21 11.1046 20.1046 12 19 12C17.8954 12 17 11.1046 17 10C17 8.89543 17.8954 8 19 8C20.1046 8 21 8.89543 21 10ZM7 10C7 11.1046 6.10457 12 5 12C3.89543 12 3 11.1046 3 10C3 8.89543 3.89543 8 5 8C6.10457 8 7 8.89543 7 10Z" stroke="#6a7282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  );
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 5.5L10.2 10.65C11.2667 11.45 12.7333 11.45 13.8 10.65L21 5.5" stroke="#6a7282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="5" width="18" height="14" rx="2" stroke="#6a7282" strokeWidth="1.5"/></svg>
  );
}

// ── Gauge (circular arc) ─────────────────────────────────────────────
function ScoreGauge({ score, label, color = "#155dfc" }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
        />
        <text x="48" y="48" dominantBaseline="middle" textAnchor="middle" className="font-bold" style={{ fontSize: 20, fontWeight: 700, fill: "#0a0a0a" }}>
          {score}
        </text>
      </svg>
      <span className="text-xs text-[#6a7282]">{label}</span>
    </div>
  );
}

// ── Interaction timeline entries ─────────────────────────────────────
const INTERACTIONS = [
  {
    dot: "#155dfc", when: "Yesterday", time: "10:14 AM", badge: "Email Open",
    badgeCls: "bg-[#eff6ff] text-[#155dfc]",
    title: 'Opened \'Anticoagulation Therapy Update \u2013 Spring 2025\'',
    body: "Email campaign covering apixaban dose-adjustment protocols. Clicked through to PDF summary.",
    meta: null,
  },
  {
    dot: "#ff6900", when: "2 weeks ago", time: "Mar 28", badge: "In-Person Visit",
    badgeCls: "bg-[#fff7ed] text-[#c2410c]",
    title: "Rep visit – product discussion",
    body: "Marc Dupont discussed Eliquis patient support program and new reimbursement code. Sophie requested updated dosing card.",
    meta: "Duration: 25 min",
  },
  {
    dot: "#00c950", when: "Last month", time: "Mar 12", badge: "Webinar",
    badgeCls: "bg-[#dcfce7] text-[#15803d]",
    title: "Attended 'Cardiovascular Risk in the Pharmacy Setting'",
    body: "CME-accredited session. Completed post-webinar quiz. Scored 90%.",
    meta: "Duration: 60 min · Polls answered: 4",
  },
];

// ════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════
export default function PharmacistDetail() {
  useParams(); // captures :id for future data fetch
  const [interactionTab, setInteractionTab] = useState("All");

  const p = PROFILE;
  const initials = p.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">

          {/* ── Breadcrumb ─────────────────────────────────────── */}
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/profiles" className="text-[#6a7282] transition-colors hover:text-[#155dfc]">Profiles</Link>
            <span className="text-[#6a7282]">&rsaquo;</span>
            <Link to="/profiles?tab=Pharmacists" className="text-[#6a7282] transition-colors hover:text-[#155dfc]">Pharmacists</Link>
            <span className="text-[#6a7282]">&rsaquo;</span>
            <span className="text-[#101828]">{p.fullTitle}</span>
          </nav>

          {/* ── Header ─────────────────────────────────────────── */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#dbeafe]">
                <span className="text-lg font-semibold text-[#1d4ed8]">{initials}</span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">{p.fullTitle}</h1>
                  <span className="rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.3px] bg-[#eff6ff] text-[#155dfc]">{p.targetStatus}</span>
                  <span className="rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.3px] bg-[#dcfce7] text-[#15803d]">{p.status}</span>
                  {p.kolScore >= 60 && (
                    <span className="rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.3px] bg-[#fef9c3] text-[#a16207]">KOL</span>
                  )}
                </div>
                <p className="text-sm text-[#4a5565]">{p.type} Pharmacist &bull; {p.specialty} &bull; {p.city}, {p.country}</p>
                <p className="text-xs text-[#6a7282]">License ID: {p.licenseId} &nbsp;&nbsp; Role: {p.role}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
                <LogInteractionIcon />
                Log Interaction
              </button>
              <button className="flex items-center gap-2 rounded-[10px] bg-[#155dfc] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1247cc]">
                <ShareIcon />
                Share Profile
              </button>
            </div>
          </div>

          {/* ── Two-column grid ────────────────────────────────── */}
          <div className="grid grid-cols-[360px_1fr] gap-6">

            {/* ════ LEFT COLUMN ════ */}
            <div className="flex flex-col gap-6">

              {/* Profile Summary */}
              <div className="rounded-[14px] border border-gray-200 bg-white p-6">
                <SectionHeader>Profile Summary</SectionHeader>
                <div className="flex flex-col gap-4">
                  <Field label="License ID">
                    <span className="font-mono text-[#155dfc]">{p.licenseId}</span>
                  </Field>
                  <Field label="Pharmacist Type">{p.type}</Field>
                  <Field label="Specialty Area">{p.specialty}</Field>
                  <Field label="Role">{p.role}</Field>
                  <Field label="Catchment Area">{p.catchmentArea}</Field>
                  <Divider />
                  <Field label="Patient Volume">{p.patientVolume}</Field>
                  <Field label="Number of Staff">{p.staff} people</Field>
                  <Field label="Opening Hours">{p.openingHours}</Field>
                </div>

                {/* Opt-ins */}
                <div className="mt-5 border-t border-gray-200 pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Opt-ins &amp; Compliance</p>
                  <div className="flex flex-col gap-2">
                    {p.emailOptIn   && <div className="flex items-center gap-2 text-sm text-[#101828]"><GreenCheckCircleIcon /> Email Opt-in</div>}
                    {p.phoneOptIn   && <div className="flex items-center gap-2 text-sm text-[#101828]"><GreenCheckCircleIcon /> Phone Opt-in</div>}
                    {p.digitalOptIn && <div className="flex items-center gap-2 text-sm text-[#101828]"><GreenCheckCircleIcon /> Digital / eDetailing Opt-in</div>}
                  </div>
                </div>
              </div>

              {/* Pharmacy & Location */}
              <div className="rounded-[14px] border border-gray-200 bg-white p-6">
                <SectionHeader>Pharmacy &amp; Location</SectionHeader>
                <div className="flex flex-col gap-4">
                  <Field label="Pharmacy Name">{p.pharmacyName}</Field>
                  <Field label="Chain Affiliation">{p.chainAffiliation}</Field>
                  <Divider />
                  <Field label="Address">{p.address}</Field>
                  <Field label="City / ZIP">{p.city} · {p.zip}</Field>
                  <Field label="Region">{p.region}</Field>
                  <Field label="Country">{p.country}</Field>
                </div>
              </div>

              {/* Contact & Rep */}
              <div className="rounded-[14px] border border-gray-200 bg-white p-6">
                <SectionHeader>Contact &amp; Rep Information</SectionHeader>
                <div className="flex flex-col gap-4">
                  <Field label="Preferred Channel">
                    <div className="flex items-center gap-1.5">
                      <ChannelIcon channel={p.preferredChannel} />
                      {p.preferredChannel}
                    </div>
                  </Field>
                  <Field label="Current Rep">{p.repContact}</Field>
                  <Field label="Visit Frequency">{p.visitFrequency}</Field>
                  <Divider />
                  <Field label="Receptivity / Sentiment">
                    <div className="mt-1"><ReceptivityBadge value={p.receptivity} /></div>
                  </Field>
                  <Field label="Reimbursement Model">{p.reimbursementModel}</Field>
                </div>
              </div>
            </div>

            {/* ════ RIGHT COLUMN ════ */}
            <div className="flex flex-col gap-6">

              {/* Scores row */}
              <div className="grid grid-cols-2 gap-6">

                {/* Engagement + KOL scores */}
                <div className="rounded-[14px] border border-gray-200 bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-[#0a0a0a]">Scores</h2>
                    <ScoreBadge score={p.engagementScore} />
                  </div>
                  <div className="flex items-center justify-around gap-4 py-2">
                    <ScoreGauge score={p.engagementScore} label="Engagement Score" color="#155dfc" />
                    <ScoreGauge score={p.kolScore} label="KOL / Influence Index" color="#7c3aed" />
                  </div>
                  <p className="mt-4 text-xs text-[#6a7282] text-center">Scores are updated monthly from CRM + digital touchpoints</p>
                </div>

                {/* Data Provenance */}
                <div className="rounded-[14px] border border-gray-200 bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-[#0a0a0a]">Data Provenance</h2>
                    <button className="rounded-lg p-1.5 text-[#6a7282] transition-colors hover:bg-gray-100 hover:text-[#155dfc]">
                      <RefreshSyncIcon />
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#dbeafe]"><CrmIcon /></div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-[#101828]">CRM System</span>
                        <span className="text-[11px] uppercase tracking-[0.3px] text-[#6a7282]">Last sync: Apr 15, 2025</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#ffedd4]"><MarketingCloudIcon /></div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-[#101828]">Marketing Cloud</span>
                        <span className="text-[11px] uppercase tracking-[0.3px] text-[#6a7282]">Last sync: Apr 14, 2025</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#dcfce7]"><ErpIcon /></div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-[#101828]">ERP / Sales Data</span>
                        <span className="text-[11px] uppercase tracking-[0.3px] text-[#6a7282]">Last sync: Apr 15, 2025</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-5 border-t border-gray-200 pt-4 text-xs italic text-[#6a7282]">
                    Profile assembled from 6 data sources
                  </p>
                </div>
              </div>

              {/* Dispensing Profile */}
              <div className="rounded-[14px] border border-gray-200 bg-white p-6">
                <SectionHeader>Dispensing Profile</SectionHeader>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <div>
                    <p className="text-xs text-[#6a7282]">Top Therapeutic Areas Dispensed</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.topTherapeuticAreas.map((t) => (
                        <span key={t} className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-xs font-medium text-[#155dfc]">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#6a7282]">Top Brands / Molecules Dispensed</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.topBrands.map((b) => (
                        <span key={b} className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs font-medium text-[#4a5565]">{b}</span>
                      ))}
                    </div>
                  </div>

                  {/* Generic vs. branded bar */}
                  <div className="col-span-2">
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-xs text-[#6a7282]">Generic vs. Branded Dispensing Ratio</p>
                      <span className="text-xs font-semibold text-[#0a0a0a]">{p.genericRatio}% generic</span>
                    </div>
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#e5e7eb]">
                      <div className="h-full rounded-full bg-[#155dfc]" style={{ width: `${p.genericRatio}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-[#9ca3af]">
                      <span>Generic</span>
                      <span>Branded</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-[#6a7282]">Substitution Behavior</p>
                    <p className="mt-0.5 text-sm font-medium text-[#101828]">{p.substitutionBehavior}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6a7282]">Avg. Prescription Volume / Month</p>
                    <p className="mt-0.5 text-2xl font-bold text-[#0a0a0a]">
                      {p.avgRxPerMonth.toLocaleString()}
                      <span className="ml-1 text-sm font-normal text-[#6a7282]">Rx</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Academic & Associations */}
              <div className="rounded-[14px] border border-gray-200 bg-white p-6">
                <SectionHeader>Academic &amp; Professional Associations</SectionHeader>
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="text-xs text-[#6a7282]">Academic / Teaching Affiliation</p>
                    <p className="mt-0.5 text-sm font-medium text-[#101828]">{p.academicAffiliation}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-[#ede9fe] px-2.5 py-0.5 text-xs font-semibold text-[#6d28d9]">KOL Potential</span>
                  </div>
                  <Divider />
                  <div>
                    <p className="mb-2 text-xs text-[#6a7282]">Professional Associations</p>
                    <div className="flex flex-col gap-2">
                      {p.associations.map((a) => (
                        <div key={a} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#155dfc]" />
                          <span className="text-sm text-[#101828]">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interaction History */}
              <div className="rounded-[14px] border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-base font-semibold text-[#0a0a0a]">Interaction History</h2>

                {/* Tabs */}
                <div className="mb-6 flex gap-6 border-b border-gray-200">
                  {["All", "Emails", "In-person", "Webinars"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setInteractionTab(tab)}
                      className={`pb-3 text-sm font-medium transition-colors ${
                        interactionTab === tab
                          ? "border-b-2 border-[#155dfc] text-[#155dfc]"
                          : "text-[#4a5565] hover:text-[#0a0a0a]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Timeline */}
                <div className="relative flex flex-col gap-8 pl-6">
                  <div className="absolute left-[5px] top-1 bottom-8 w-px bg-gray-200" />

                  {INTERACTIONS.map((entry, i) => (
                    <div key={i} className="relative">
                      <span
                        className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white"
                        style={{ backgroundColor: entry.dot }}
                      />
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-medium text-[#6a7282]">{entry.when}</span>
                          <span className="text-xs text-[#99a1af]">{entry.time}</span>
                          <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3px] ${entry.badgeCls}`}>
                            {entry.badge}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[#101828]">{entry.title}</p>
                        <p className="text-sm leading-5 text-[#4a5565]">{entry.body}</p>
                        {entry.meta && (
                          <p className="text-xs text-[#6a7282]">{entry.meta}</p>
                        )}
                        {i === 0 && (
                          <button className="flex w-fit items-center gap-1.5 text-sm font-medium text-[#155dfc] transition-colors hover:text-[#1247cc]">
                            <DocumentFileIcon />
                            View email
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-gray-200 pt-4 text-center">
                  <button className="text-sm font-medium text-[#155dfc] transition-colors hover:text-[#1247cc]">
                    Load full interaction history
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
