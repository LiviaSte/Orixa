import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  HospitalBuildingIcon,
  CalendarEventIcon,
  PublicationIcon,
  LightningIcon,
  EmailEnvelopeIcon,
  GreenCheckCircleIcon,
  RefreshSyncIcon,
  DocumentFileIcon,
  LogInteractionIcon,
  ShareIcon,
  MoreDotsIcon,
  WebVisitIcon,
  ClickIcon,
  DownloadBrochureIcon,
  OpenedEmailIcon,
  CrmIcon,
  MarketingCloudIcon,
  ErpIcon,
} from "../components/icons";

const interactionTabs = ["All", "Emails", "In-person"];

const ADOPTION_STAGES = [
  { key: "unaware", label: "Unaware" },
  { key: "aware", label: "Aware" },
  { key: "interest", label: "Interest" },
  { key: "evaluation", label: "Evaluation" },
  { key: "trial", label: "Trial" },
  { key: "adoption", label: "Adoption" },
  { key: "loyalty", label: "Loyalty" },
];

function AdoptionLadder({ currentStage }) {
  const currentIndex = ADOPTION_STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {ADOPTION_STAGES.map((stage, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div key={stage.key} className="flex flex-1 flex-col items-center gap-1">
              {/* Bar segment */}
              <div
                className={`h-1.5 w-full rounded-full ${
                  isCompleted
                    ? "bg-[#155dfc]"
                    : isCurrent
                      ? "bg-[#155dfc]"
                      : "bg-[#e5e7eb]"
                }`}
              />
            </div>
          );
        })}
      </div>
      {/* Labels: only show first, current, and last */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#9ca3af]">
          {ADOPTION_STAGES[0].label}
        </span>
        <span className="text-[10px] font-semibold text-[#155dfc]">
          {ADOPTION_STAGES[currentIndex]?.label}
        </span>
        <span className="text-[10px] text-[#9ca3af]">
          {ADOPTION_STAGES[ADOPTION_STAGES.length - 1].label}
        </span>
      </div>
    </div>
  );
}

export default function HcpDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");

  const hcpName = "Dr. Elena Rossi";
  const initials = "ER";

  // Hospital affiliations with aggregated scores (avg lead score of affiliated HCPs)
  const affiliations = [
    {
      name: "Ospedale San Raffaele",
      department: "Cardiac Surgery",
      score: 87, // avg of Dr. Rossi (92) + Dr. Kelly Cris (82)
    },
    {
      name: "Policlinico di Milano",
      department: "Cardiology",
      score: 81, // avg of Dr. Michael Chen (88) + Dr. Emily Rost (74)
    },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/profiles"
              className="text-[#6a7282] transition-colors hover:text-[#155dfc]"
            >
              Profiles
            </Link>
            <span className="text-[#6a7282]">&rsaquo;</span>
            <Link
              to="/profiles"
              className="text-[#6a7282] transition-colors hover:text-[#155dfc]"
            >
              HCPs
            </Link>
            <span className="text-[#6a7282]">&rsaquo;</span>
            <span className="text-[#101828]">{hcpName}</span>
          </nav>

          {/* Header section */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e5e7eb]">
                <span className="text-lg font-semibold text-[#4a5565]">
                  {initials}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                {/* Name + badges */}
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">
                    {hcpName}
                  </h1>
                  <span className="rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.3px] bg-[#eff6ff] text-[#155dfc]">
                    Targeted
                  </span>
                  <span className="rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.3px] bg-[#dcfce7] text-[#15803d]">
                    Active
                  </span>
                </div>

                {/* Subtitle */}
                <p className="text-sm text-[#4a5565]">
                  Cardiologist &bull; London, UK
                </p>

                {/* IDs */}
                <p className="text-xs text-[#6a7282]">
                  HCP ID: 9621 &nbsp;&nbsp; OneKey: OK-442
                </p>
              </div>
            </div>

            {/* Action buttons */}
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

          {/* Two-column grid: left narrower, right wider */}
          <div className="grid grid-cols-[380px_1fr] gap-6">
            {/* ======== LEFT COLUMN ======== */}
            <div className="flex flex-col gap-6">
              {/* Profile Summary card */}
              <div className="rounded-[14px] border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#155dfc]" />
                  <h2 className="text-base font-semibold text-[#0a0a0a]">
                    Profile Summary
                  </h2>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs text-[#6a7282]">Primary Specialty</p>
                    <p className="mt-0.5 text-sm font-medium text-[#101828]">
                      Cardiology
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6a7282]">Preferred Channel</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <EmailEnvelopeIcon />
                      <span className="text-sm font-medium text-[#101828]">
                        Email
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#6a7282]">Languages</p>
                    <p className="mt-0.5 text-sm font-medium text-[#101828]">
                      Italian, English
                    </p>
                  </div>
                </div>

                {/* Compliance & Opt-ins */}
                <div className="mt-5 border-t border-gray-200 pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                    Compliance &amp; Opt-ins
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-[#101828]">
                      <GreenCheckCircleIcon />
                      Email Opt-in
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#101828]">
                      <GreenCheckCircleIcon />
                      Webinar Opt-in
                    </div>
                  </div>
                </div>
              </div>

              {/* Interest Signals card */}
              <div className="rounded-[14px] border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                  <LightningIcon />
                  <h2 className="text-base font-semibold text-[#0a0a0a]">
                    Interest Signals
                  </h2>
                </div>

                {/* WATCHMAN FLX */}
                <div className="mb-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-medium text-[#101828]">
                      WATCHMAN FLX
                    </span>
                    <span className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3px] bg-[#dcfce7] text-[#15803d]">
                      High Interest
                    </span>
                  </div>

                  {/* Adoption Ladder */}
                  <AdoptionLadder currentStage="evaluation" />

                  <div className="mt-3 flex flex-col gap-2 pl-1">
                    <div className="flex items-center gap-2 text-sm text-[#4a5565]">
                      <GreenCheckCircleIcon />
                      Attended Webinar
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#4a5565]">
                      <ClickIcon />
                      Clicked CTA (3x)
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#4a5565]">
                      <DownloadBrochureIcon />
                      Downloaded Brochure
                    </div>
                  </div>
                </div>

                {/* ACURATE neo2 */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-medium text-[#101828]">
                      ACURATE neo2
                    </span>
                    <span className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3px] bg-[#f3f4f6] text-[#6a7282]">
                      Moderate
                    </span>
                  </div>

                  {/* Adoption Ladder */}
                  <AdoptionLadder currentStage="interest" />

                  <div className="mt-3 flex flex-col gap-2 pl-1">
                    <div className="flex items-center gap-2 text-sm text-[#4a5565]">
                      <OpenedEmailIcon />
                      Opened Email (5x)
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#4a5565]">
                      <WebVisitIcon />
                      Web Site Visit
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ======== RIGHT COLUMN ======== */}
            <div className="flex flex-col gap-6">
              {/* Top row: Lead Score + Data Provenance */}
              <div className="grid grid-cols-2 gap-6">
                {/* Lead Score card */}
                <div className="rounded-[14px] border border-gray-200 bg-white p-6">
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-[#0a0a0a]">
                      Lead Score
                    </h2>
                    <button
                      onClick={() => navigate("/profiles")}
                      className="text-sm font-medium text-[#0a0a0a] transition-colors hover:text-[#4a5565]"
                    >
                      Edit lead score
                    </button>
                  </div>
                  <p className="mb-4 text-xs text-[#6a7282]">
                    Predicted potential
                  </p>

                  <div className="mb-5 flex items-end gap-3">
                    <span className="text-[40px] font-bold leading-none text-[#0a0a0a]">
                      82
                    </span>
                    <span className="mb-1 rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.3px] bg-[#dcfce7] text-[#15803d]">
                      High Potential
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between rounded-lg bg-[#f9fafb] px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <HospitalBuildingIcon />
                        <span className="text-sm text-[#4a5565]">
                          Hospital Rank
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#101828]">
                          Tier 1
                        </span>
                        <span className="text-xs font-medium text-[#15803d]">
                          (+10)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[#f9fafb] px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <CalendarEventIcon />
                        <span className="text-sm text-[#4a5565]">
                          Event frequency
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#101828]">
                          High
                        </span>
                        <span className="text-xs font-medium text-[#15803d]">
                          (+12)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[#f9fafb] px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <PublicationIcon />
                        <span className="text-sm text-[#4a5565]">
                          Publication
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#101828]">
                          High
                        </span>
                        <span className="text-xs font-medium text-[#15803d]">
                          (+12)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Provenance card */}
                <div className="rounded-[14px] border border-gray-200 bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-[#0a0a0a]">
                      Data Provenance
                    </h2>
                    <button className="rounded-lg p-1.5 text-[#6a7282] transition-colors hover:bg-gray-100 hover:text-[#155dfc]">
                      <RefreshSyncIcon />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* CRM System */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#dbeafe]">
                        <CrmIcon />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-[#101828]">
                          CRM System
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.3px] text-[#6a7282]">
                          Last sync: 12/31/24V
                        </span>
                      </div>
                    </div>

                    {/* Marketing Cloud */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#ffedd4]">
                        <MarketingCloudIcon />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-[#101828]">
                          Marketing Cloud
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.3px] text-[#6a7282]">
                          Last sync: 12/30/24V
                        </span>
                      </div>
                    </div>

                    {/* ERP Sales Data */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#dcfce7]">
                        <ErpIcon />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-[#101828]">
                          ERP Sales Data
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.3px] text-[#6a7282]">
                          Last sync: 12/31/24V
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 border-t border-gray-200 pt-4 text-xs italic text-[#6a7282]">
                    Data aggregated from 8 disparate systems to build this
                    profile
                  </p>
                </div>
              </div>

              {/* Hospital Affiliations */}
              <div className="rounded-[14px] border border-gray-200 bg-white">
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                  <h2 className="text-base font-semibold text-[#0a0a0a]">
                    Hospital Affiliations
                  </h2>
                  <button className="text-sm font-medium text-[#0a0a0a] transition-colors hover:text-[#4a5565]">
                    Manage Affiliations
                  </button>
                </div>

                <table className="w-full">
                  <thead>
                    <tr className="border-b border-t border-gray-200 bg-[#f9fafb]">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Institution Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Score
                      </th>
                      <th className="w-12 px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliations.map((aff) => (
                      <tr
                        key={aff.name}
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        <td className="px-6 py-4">
                          <span className="cursor-pointer text-sm font-medium text-[#155dfc] hover:underline">
                            {aff.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[#4a5565]">
                            {aff.department}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-[#5598f6] underline opacity-90">
                            {aff.score}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-[#6a7282] hover:text-[#101828]">
                            <MoreDotsIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Interaction History */}
              <div className="rounded-[14px] border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-base font-semibold text-[#0a0a0a]">
                  Interaction history
                </h2>

                {/* Tabs */}
                <div className="mb-6 flex gap-6 border-b border-gray-200">
                  {interactionTabs.map((tab) => {
                    const active = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-medium transition-colors ${
                          active
                            ? "border-b-2 border-[#155dfc] text-[#155dfc]"
                            : "text-[#4a5565] hover:text-[#0a0a0a]"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                {/* Timeline */}
                <div className="relative flex flex-col gap-8 pl-6">
                  {/* Vertical line */}
                  <div className="absolute left-[5px] top-1 bottom-8 w-px bg-gray-200" />

                  {/* Entry 1 - Email Open */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#155dfc]" />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-[#6a7282]">
                          Yesterday
                        </span>
                        <span className="text-xs text-[#99a1af]">9:42 AM</span>
                        <span className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3px] bg-[#eff6ff] text-[#155dfc]">
                          Email Open
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#101828]">
                        Opened &ldquo;New Clinical Trial Results - Phase
                        3&rdquo;
                      </p>
                      <p className="text-sm leading-5 text-[#4a5565]">
                        This email highlighted efficacy data for new lipid
                        compound.
                      </p>
                      <button className="flex w-fit items-center gap-1.5 text-sm font-medium text-[#155dfc] transition-colors hover:text-[#1247cc]">
                        <DocumentFileIcon />
                        Full Study PDF
                      </button>
                    </div>
                  </div>

                  {/* Entry 2 - Webinar */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#ff6900]" />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-[#6a7282]">
                          Last week
                        </span>
                        <span className="text-xs text-[#99a1af]">Jan 22</span>
                        <span className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3px] bg-[#fff7ed] text-[#c2410c]">
                          Webinar
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#101828]">
                        Attended &ldquo;Future of statins &amp; lipid lowering
                        therapies&rdquo;
                      </p>
                      <p className="text-sm leading-5 text-[#4a5565]">
                        Webinar explaining new therapies with Kim Mattheus
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[#6a7282]">
                        <span>Duration: 45m</span>
                        <span>Poll answered: 3</span>
                      </div>
                    </div>
                  </div>

                  {/* Entry 3 - In-person */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#00c950]" />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-[#6a7282]">
                          Last week
                        </span>
                        <span className="text-xs text-[#99a1af]">Jan 20</span>
                        <span className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3px] bg-[#dcfce7] text-[#15803d]">
                          In-Person
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#101828]">
                        Face-to-face meeting
                      </p>
                      <p className="text-sm leading-5 text-[#4a5565]">
                        Discussed new clinical trial data for CoreValve Evolut.
                        HCP expressed strong interest in Pro-series results.
                      </p>
                      <div className="flex items-center gap-1 text-xs text-[#6a7282]">
                        <span>Sales rep:</span>
                        <span className="font-medium text-[#101828]">
                          Sarah Jenkins
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Load more */}
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
