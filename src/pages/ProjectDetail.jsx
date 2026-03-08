import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  HcpIcon,
  TrendDownSmallIcon,
  TrendUpSmallIcon,
} from "../components/icons";

// ── Mock detail data per project ─────────────────────────────────
const TIERS = {
  cold:   { label: "Cold",    dot: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", scoreBg: "#dbeafe" },
  warm:   { label: "Warm",    dot: "#f59e0b", bg: "#fffbeb", border: "#fde68a", text: "#92400e", scoreBg: "#fef3c7" },
  hot:    { label: "Hot",     dot: "#f97316", bg: "#fff7ed", border: "#fed7aa", text: "#9a3412", scoreBg: "#ffedd5" },
  onfire: { label: "On Fire", dot: "#ef4444", bg: "#fef2f2", border: "#fecaca", text: "#991b1b", scoreBg: "#fee2e2" },
};

const DETAIL = {
  1: {
    funnel: { baseline: 842, reach: 680, engagement: 412, conversion: 287 },
    segments: [
      { tier: "cold",   count: 312, score: "0–25",   insight: "No interactions in the last 90 days. Low awareness of the product.", action: "Send introductory email or LinkedIn message" },
      { tier: "warm",   count: 287, score: "26–50",  insight: "Occasional opens and clicks. Attended one webinar in Q4.", action: "Invite to upcoming webinar or share clinical whitepaper" },
      { tier: "hot",    count: 178, score: "51–75",  insight: "Multiple touchpoints across 3+ channels. High content engagement.", action: "Schedule MSL call — high intent signal detected" },
      { tier: "onfire", count:  65, score: "76–100", insight: "Recent cross-channel surge. KOL influence and congress attendance detected.", action: "Priority: advisory board invite or in-person meeting" },
    ],
    channelMix: {
      headline: "AI analyzed 1.2M datapoints from 12.4K journeys with 842 conversion outcomes",
      engagementMetrics: [
        { name: "Unique Channels",    touches: "3+ touches", signal: "strong" },
        { name: "Unique Asset Types", touches: "2+ touches", signal: "strong" },
        { name: "Touchpoint Volume",  touches: "5+ touches", signal: "moderate" },
        { name: "KOL Interaction",    touches: "1+ touches", signal: "weak" },
      ],
      channels: [
        { name: "Email",    touches: "8+ touches", signal: "strong" },
        { name: "Webinar",  touches: "2+ touches", signal: "strong" },
        { name: "Congress", touches: "1+ touches", signal: "moderate" },
        { name: "LinkedIn", touches: "4+ touches", signal: "moderate" },
        { name: "Paid Search", touches: "3+ touches", signal: "weak" },
      ],
      assetTypes: [
        { name: "Clinical Paper",     touches: "2+ touches", signal: "strong" },
        { name: "Webinar Recording",  touches: "1+ touches", signal: "strong" },
        { name: "Whitepaper",         touches: "1+ touches", signal: "moderate" },
        { name: "Case Study",         touches: "2+ touches", signal: "weak" },
      ],
    },
    sequence: {
      steps: [
        { label: "Email",    timing: null },
        { label: "Webinar",  timing: "within 7 days" },
        { label: "MSL Call", timing: "within 14 days" },
        { label: "Converted", timing: "within 30 days" },
      ],
      multiplier: "3.2×",
      insight: "HCPs who open an email, register for a webinar, and then receive an MSL call within 14 days show a 3.2× higher conversion rate. Timing between touchpoints matters as much as the touchpoints themselves.",
    },
    attribution: [
      { channel: "Email",      hcps: 412, reachPct: 68, engPct: 44, convPct: 34, attrPct: 38 },
      { channel: "Webinar",    hcps: 287, reachPct: 52, engPct: 38, convPct: 28, attrPct: 26 },
      { channel: "MSL Visit",  hcps: 178, reachPct: 31, engPct: 27, convPct: 22, attrPct: 18 },
      { channel: "Congress",   hcps: 145, reachPct: 28, engPct: 18, convPct: 12, attrPct: 11 },
      { channel: "LinkedIn",   hcps:  98, reachPct: 22, engPct: 12, convPct:  4, attrPct:  7 },
    ],
  },
  2: {
    funnel: { baseline: 1240, reach: 980, engagement: 610, conversion: 347 },
    segments: [
      { tier: "cold",   count: 498, score: "0–25",   insight: "Large cold pool — broad brand awareness needed. No prior touchpoints.", action: "Launch introductory digital campaign (email + LinkedIn)" },
      { tier: "warm",   count: 412, score: "26–50",  insight: "Attended ESMO or opened disease-area content. Ready for deeper engagement.", action: "Send oncology clinical trial results or invite to roundtable" },
      { tier: "hot",    count: 231, score: "51–75",  insight: "Repeated engagement across email and events. KOL mentions detected.", action: "Schedule 1:1 MSL meeting with personalized oncology data" },
      { tier: "onfire", count:  99, score: "76–100", insight: "High-frequency cross-channel signals. Likely prescribers or decision-makers.", action: "Priority: advisory board or speaker program enrollment" },
    ],
    channelMix: {
      headline: "AI analyzed 2.1M datapoints from 18.7K journeys with 1,240 conversion outcomes",
      engagementMetrics: [
        { name: "Unique Channels",    touches: "4+ touches", signal: "strong" },
        { name: "Unique Asset Types", touches: "3+ touches", signal: "strong" },
        { name: "Touchpoint Volume",  touches: "6+ touches", signal: "moderate" },
        { name: "Peer Interaction",   touches: "2+ touches", signal: "moderate" },
      ],
      channels: [
        { name: "Email",    touches: "12+ touches", signal: "strong" },
        { name: "Congress", touches: "2+ touches",  signal: "strong" },
        { name: "LinkedIn", touches: "5+ touches",  signal: "moderate" },
        { name: "Webinar",  touches: "2+ touches",  signal: "moderate" },
        { name: "Display",  touches: "8+ touches",  signal: "weak" },
      ],
      assetTypes: [
        { name: "Congress Abstract", touches: "1+ touches", signal: "strong" },
        { name: "Clinical Paper",    touches: "2+ touches", signal: "strong" },
        { name: "Video",             touches: "3+ touches", signal: "moderate" },
        { name: "Whitepaper",        touches: "1+ touches", signal: "weak" },
      ],
    },
    sequence: {
      steps: [
        { label: "Congress",     timing: null },
        { label: "Email",        timing: "within 3 days" },
        { label: "Video Call",   timing: "within 21 days" },
        { label: "Converted",    timing: "within 45 days" },
      ],
      multiplier: "4.1×",
      insight: "HCPs who attend a congress and then receive a personalized follow-up email within 3 days, followed by a video call within 21 days, convert at 4.1× the rate of email-only contacts.",
    },
    attribution: [
      { channel: "Email",      hcps: 610, reachPct: 72, engPct: 52, convPct: 38, attrPct: 34 },
      { channel: "Congress",   hcps: 412, reachPct: 48, engPct: 35, convPct: 27, attrPct: 28 },
      { channel: "LinkedIn",   hcps: 287, reachPct: 31, engPct: 21, convPct: 14, attrPct: 18 },
      { channel: "Webinar",    hcps: 198, reachPct: 24, engPct: 16, convPct:  9, attrPct: 12 },
      { channel: "Display",    hcps: 145, reachPct: 19, engPct:  8, convPct:  2, attrPct:  8 },
    ],
  },
  3: {
    funnel: { baseline: 620, reach: 560, engagement: 398, conversion: 280 },
    segments: [
      { tier: "cold",   count: 187, score: "0–25",   insight: "Neurologists with no prior engagement with this product line.", action: "Send educational content on neurology disease burden" },
      { tier: "warm",   count: 213, score: "26–50",  insight: "Downloaded a whitepaper or attended one digital event.", action: "Invite to neurology-focused MSL webinar series" },
      { tier: "hot",    count: 156, score: "51–75",  insight: "Multi-channel engagers. Strong content consumption pattern.", action: "Initiate 1:1 MSL visit with clinical data presentation" },
      { tier: "onfire", count:  64, score: "76–100", insight: "Product launch early adopters. Likely to prescribe.", action: "Enroll in early adopter speaker or advisory program" },
    ],
    channelMix: {
      headline: "AI analyzed 0.9M datapoints from 8.2K journeys with 620 conversion outcomes",
      engagementMetrics: [
        { name: "Unique Channels",    touches: "3+ touches", signal: "strong" },
        { name: "Content Downloads",  touches: "2+ touches", signal: "strong" },
        { name: "Event Attendance",   touches: "1+ touches", signal: "moderate" },
        { name: "Peer Referral",      touches: "1+ touches", signal: "weak" },
      ],
      channels: [
        { name: "MSL Visit",  touches: "2+ touches", signal: "strong" },
        { name: "Email",      touches: "6+ touches", signal: "strong" },
        { name: "Webinar",    touches: "1+ touches", signal: "moderate" },
        { name: "Congress",   touches: "1+ touches", signal: "moderate" },
        { name: "LinkedIn",   touches: "3+ touches", signal: "weak" },
      ],
      assetTypes: [
        { name: "Clinical Paper",   touches: "2+ touches", signal: "strong" },
        { name: "Demo",             touches: "1+ touches", signal: "strong" },
        { name: "Case Study",       touches: "1+ touches", signal: "moderate" },
        { name: "Whitepaper",       touches: "2+ touches", signal: "weak" },
      ],
    },
    sequence: {
      steps: [
        { label: "Email",     timing: null },
        { label: "MSL Visit", timing: "within 10 days" },
        { label: "Webinar",   timing: "within 20 days" },
        { label: "Converted", timing: "within 35 days" },
      ],
      multiplier: "2.8×",
      insight: "For neurology product launches, an email followed by an MSL visit within 10 days, then a webinar invitation within 20 days produced a 2.8× lift in conversion versus email alone.",
    },
    attribution: [
      { channel: "MSL Visit",  hcps: 280, reachPct: 58, engPct: 51, convPct: 45, attrPct: 41 },
      { channel: "Email",      hcps: 398, reachPct: 71, engPct: 42, convPct: 31, attrPct: 29 },
      { channel: "Webinar",    hcps: 213, reachPct: 39, engPct: 28, convPct: 18, attrPct: 17 },
      { channel: "Congress",   hcps: 156, reachPct: 27, engPct: 16, convPct:  8, attrPct:  9 },
      { channel: "LinkedIn",   hcps:  98, reachPct: 18, engPct:  9, convPct:  2, attrPct:  4 },
    ],
  },
  4: {
    funnel: { baseline: 0, reach: 0, engagement: 0, conversion: 0 },
    segments: [
      { tier: "cold",   count: 0, score: "0–25",   insight: "No data yet — project is in draft.", action: "Launch initial outreach campaign" },
      { tier: "warm",   count: 0, score: "26–50",  insight: "No data yet — project is in draft.", action: "Prepare webinar content for diabetes HCPs" },
      { tier: "hot",    count: 0, score: "51–75",  insight: "No data yet — project is in draft.", action: "Identify KOLs for MSL prioritization" },
      { tier: "onfire", count: 0, score: "76–100", insight: "No data yet — project is in draft.", action: "Build advisory board roster" },
    ],
    channelMix: null,
    sequence: null,
    attribution: [],
  },
};

const PROJECTS_META = {
  1: { title: "Q1 Cardiology Lead Generation",  goal: "Lead → MQL",       status: "Active",    startDate: "Jan 15, 2026", targetConvPct: 40 },
  2: { title: "Oncology Awareness Campaign",     goal: "MQL → SQL",        status: "Paused",    startDate: "Dec 1, 2025",  targetConvPct: 35 },
  3: { title: "Neurology Product Launch",        goal: "SQL → Conversion", status: "Completed", startDate: "Oct 10, 2025", targetConvPct: 40 },
  4: { title: "Diabetes Education Series",       goal: "Lead → MQL",       status: "Draft",     startDate: "Mar 1, 2026",  targetConvPct: 30 },
};

// ── Sub-components ────────────────────────────────────────────────

function FunnelCard({ label, value, sub, positive, isDraft, actualPct, targetPct }) {
  const aboveTarget = actualPct != null && targetPct != null && actualPct >= targetPct;
  const gapPp = actualPct != null && targetPct != null ? Math.abs(actualPct - targetPct) : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">{label}</span>
      {isDraft ? (
        <p className="text-2xl font-bold text-[#d1d5db]">—</p>
      ) : (
        <p className="text-2xl font-bold text-[#0a0a0a]">{value.toLocaleString()}</p>
      )}
      {sub && !isDraft && (
        <div className={`flex items-center gap-1 text-xs font-medium ${positive ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
          {positive ? <TrendUpSmallIcon /> : <TrendDownSmallIcon />}
          {sub}
        </div>
      )}
      {isDraft && <p className="text-xs text-[#d1d5db]">No data yet</p>}
      {/* Target comparison — only on the Conversion card */}
      {actualPct != null && targetPct != null && !isDraft && (
        <div className="mt-1 border-t border-gray-100 pt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
            <div
              className={`h-full rounded-full ${aboveTarget ? "bg-[#16a34a]" : "bg-[#155dfc]"}`}
              style={{ width: `${Math.min((actualPct / targetPct) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 whitespace-nowrap text-[10px] text-[#9ca3af]">
            {actualPct}% vs {targetPct}% target
          </p>
          <p className={`whitespace-nowrap text-[10px] font-semibold ${aboveTarget ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
            {aboveTarget ? `+${gapPp}pp above` : `${gapPp}pp below target`}
          </p>
        </div>
      )}
    </div>
  );
}

const SIGNAL_CONFIG = {
  strong:   { bar: "bg-[#16a34a]", text: "text-[#15803d]", bg: "bg-[#f0fdf4]", border: "border-[#bbf7d0]", bars: [true, true, true] },
  moderate: { bar: "bg-[#f59e0b]", text: "text-[#92400e]", bg: "bg-[#fffbeb]", border: "border-[#fde68a]", bars: [true, true, false] },
  weak:     { bar: "bg-[#9ca3af]", text: "text-[#6a7282]", bg: "bg-[#f9fafb]", border: "border-[#e5e7eb]", bars: [true, false, false] },
};

function SignalBars({ signal }) {
  const cfg = SIGNAL_CONFIG[signal];
  return (
    <div className="flex items-end gap-0.5">
      {cfg.bars.map((active, i) => (
        <div key={i} className={`rounded-sm ${active ? cfg.bar : "bg-[#e5e7eb]"}`} style={{ width: 3, height: 6 + i * 3 }} />
      ))}
    </div>
  );
}

function ChannelPill({ name, touches, signal }) {
  const cfg = SIGNAL_CONFIG[signal];
  return (
    <div className={`flex items-center justify-between gap-2 rounded-full border px-3 py-1.5 ${cfg.bg} ${cfg.border}`}>
      <span className={`text-xs font-semibold ${cfg.text}`}>{name}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-xs ${cfg.text} opacity-70`}>{touches}</span>
        <SignalBars signal={signal} />
      </div>
    </div>
  );
}

function SegmentCard({ seg }) {
  const t = TIERS[seg.tier];
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-white px-5 py-5 shadow-sm" style={{ borderColor: t.border }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.dot }} />
          <span className="text-sm font-bold" style={{ color: t.text }}>{t.label}</span>
        </div>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: t.scoreBg, color: t.text }}>
          Score {seg.score}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-[#0a0a0a]">{seg.count > 0 ? seg.count.toLocaleString() : "—"}</p>
        <p className="mt-0.5 text-xs text-[#9ca3af]">HCPs in this tier</p>
      </div>
      <p className="text-sm leading-relaxed text-[#6a7282]">{seg.insight}</p>
      <div className="mt-auto rounded-xl px-3 py-2.5 text-xs font-semibold" style={{ backgroundColor: t.scoreBg, color: t.text }}>
        <span className="mr-1 opacity-60">→</span> {seg.action}
      </div>
    </div>
  );
}

function SequenceFlow({ steps, multiplier, insight }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Flow nodes */}
      <div className="mb-5 flex items-center overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <div key={i} className="flex shrink-0 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                  isLast
                    ? "bg-[#155dfc] text-white"
                    : "border-2 border-[#155dfc] bg-white text-[#155dfc]"
                }`}>
                  {isLast ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span className={`text-xs font-semibold ${isLast ? "text-[#155dfc]" : "text-[#0a0a0a]"}`}>{step.label}</span>
              </div>
              {!isLast && (
                <div className="mx-3 flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <div className="h-0.5 w-10 bg-[#155dfc]" />
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="#155dfc">
                      <path d="M1 4h6M4 1l3 3-3 3" stroke="#155dfc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </div>
                  {steps[i + 1]?.timing && (
                    <span className="whitespace-nowrap text-[10px] text-[#9ca3af]">{steps[i + 1].timing}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div className="ml-6 flex items-center gap-2 rounded-xl bg-[#eff6ff] px-4 py-2">
          <span className="text-lg font-extrabold text-[#155dfc]">{multiplier}</span>
          <span className="text-xs text-[#1d4ed8]">conversion rate</span>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-[#6a7282]">{insight}</p>
    </div>
  );
}

function AttributionBar({ pct, max = 45 }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-right text-xs font-medium text-[#0a0a0a]">{pct}%</span>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#f3f4f6]">
        <div className="h-full rounded-full bg-[#155dfc]" style={{ width: `${(pct / max) * 100}%` }} />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
const STATUS_STYLES = {
  Active:    "bg-[#dcfce7] text-[#15803d]",
  Completed: "bg-[#f0fdf4] text-[#166534]",
  Draft:     "bg-[#f3f4f6] text-[#6a7282]",
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const numId = Number(id);
  const meta   = PROJECTS_META[numId] || { title: "Project", goal: "", status: "Draft", startDate: "" };
  const detail = DETAIL[numId] || DETAIL[4];
  const isDraft = meta.status === "Draft" || detail.funnel.baseline === 0;

  const { funnel, segments, channelMix, sequence, attribution } = detail;

  const funnelDrop = (a, b) => a > 0 ? `-${((1 - b / a) * 100).toFixed(1)}% drop-off` : null;
  const actualConvPct = funnel.baseline > 0 ? Math.round((funnel.conversion / funnel.baseline) * 100) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8fa]">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* ── Sticky header ── */}
        <div className="shrink-0 border-b border-gray-200 bg-white px-8 py-5">
          <button
            onClick={() => navigate("/projects")}
            className="mb-4 flex items-center gap-1.5 text-sm text-[#6a7282] transition-colors hover:text-[#0a0a0a]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Projects
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#0a0a0a]">{meta.title}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[meta.status]}`}>{meta.status}</span>
            {meta.goal && (
              <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                Goal: {meta.goal}
              </span>
            )}
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="flex flex-col gap-10">

            {/* ── 1. Overview ── */}
            <section>
              <SectionHeader label="Overview" />
              <div className="grid grid-cols-4 gap-4">
                <FunnelCard label="Baseline"   value={funnel.baseline}   sub="100% Identification"                              positive isDraft={isDraft} />
                <FunnelCard label="Reach"      value={funnel.reach}      sub={funnelDrop(funnel.baseline, funnel.reach)}                  isDraft={isDraft} />
                <FunnelCard label="Engagement" value={funnel.engagement} sub={funnelDrop(funnel.reach, funnel.engagement)}                isDraft={isDraft} />
                <FunnelCard label="Conversion" value={funnel.conversion} sub={funnelDrop(funnel.engagement, funnel.conversion)}           isDraft={isDraft}
                  actualPct={actualConvPct} targetPct={meta.targetConvPct} />
              </div>
            </section>

            {/* ── 2. HCP Segmentation ── */}
            <section>
              <SectionHeader
                label="HCP Segmentation"
                sub="Segment your HCPs by engagement tier and choose the right strategy for each group."
              />
              {isDraft ? (
                <EmptyState message="No engagement data yet. Launch your campaigns to start seeing HCP segmentation." />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {segments.map((seg) => <SegmentCard key={seg.tier} seg={seg} />)}
                </div>
              )}
            </section>

            {/* ── 3. Optimal channel mix ── */}
            {channelMix && !isDraft && (
              <section>
                <SectionHeader
                  label="Optimal Channel Mix"
                  sub="AI-powered analysis of which channel combinations drive the highest conversion."
                />
                {/* Three columns */}
                <div className="grid grid-cols-3 gap-4">
                  <ChannelMixCol title="Engagement Metrics" items={channelMix.engagementMetrics} />
                  <ChannelMixCol title="Channel"            items={channelMix.channels} />
                  <ChannelMixCol title="Asset Type"         items={channelMix.assetTypes} />
                </div>
                {/* Legend */}
                <div className="mt-3 flex items-center gap-6 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Conversion impact:</span>
                  {["strong", "moderate", "weak"].map((s) => (
                    <div key={s} className="flex items-center gap-1.5">
                      <SignalBars signal={s} />
                      <span className="text-xs capitalize text-[#6a7282]">{s} signal</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── 4. Best channel sequence ── */}
            {sequence && !isDraft && (
              <section>
                <SectionHeader
                  label="Best Channel Sequence"
                  sub="The optimal touchpoint order and timing leading to conversion. HCPs engaging across 3+ channels convert dramatically more often."
                />
                <SequenceFlow steps={sequence.steps} multiplier={sequence.multiplier} insight={sequence.insight} />
              </section>
            )}

            {/* ── 5. Attribution ── */}
            <section>
              <SectionHeader label="Channel Attribution" sub="How each channel contributes to conversion across the funnel." />
              {isDraft || attribution.length === 0 ? (
                <EmptyState message="No attribution data yet. Data will appear once campaigns are active." />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {/* Table */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Channel</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Engaged HCPs</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Reach</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Engagement</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Conversion</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Attribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {attribution.map((row) => (
                        <tr key={row.channel} className="hover:bg-[#f9fafb]">
                          <td className="px-5 py-3 font-medium text-[#0a0a0a]">{row.channel}</td>
                          <td className="px-5 py-3 text-[#4a5565]">{row.hcps.toLocaleString()}</td>
                          <td className="px-5 py-3 text-[#4a5565]">{row.reachPct}%</td>
                          <td className="px-5 py-3 text-[#4a5565]">{row.engPct}%</td>
                          <td className="px-5 py-3 text-[#4a5565]">{row.convPct}%</td>
                          <td className="px-5 py-3">
                            <AttributionBar pct={row.attrPct} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function SectionHeader({ label, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-[#0a0a0a]">{label}</h2>
      {sub && <p className="mt-0.5 text-sm text-[#6a7282]">{sub}</p>}
    </div>
  );
}

function ChannelMixCol({ title, items }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#0a0a0a]">{title}</p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <ChannelPill key={item.name} name={item.name} touches={item.touches} signal={item.signal} />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f6]">
        <HcpIcon />
      </div>
      <p className="max-w-sm text-sm text-[#9ca3af]">{message}</p>
    </div>
  );
}
