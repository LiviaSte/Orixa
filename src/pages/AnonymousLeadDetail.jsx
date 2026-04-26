import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ConversionPointsModal from "../components/ConversionPointsModal";
import {
  ChevronLeftIcon,
  DownloadBrochureIcon,
  WebVisitIcon,
  ClickIcon,
  LightningIcon,
  OpenedEmailIcon,
  ExternalLinkIcon,
} from "../components/icons";

/* ── Conversion points (shared def) ─────────────────────────────────── */
const CONVERSION_POINTS = [
  { label: "Gated download",              weight: "High",      wBg: "bg-[#dcfce7]", wText: "text-[#16a34a]" },
  { label: "Webinar registration",        weight: "High",      wBg: "bg-[#dcfce7]", wText: "text-[#16a34a]" },
  { label: "Request medical info",        weight: "Very high", wBg: "bg-[#fee2e2]", wText: "text-[#dc2626]" },
  { label: "Newsletter opt-in",           weight: "Medium",    wBg: "bg-[#fef9c3]", wText: "text-[#a16207]" },
  { label: "Event RSVP",                  weight: "Medium",    wBg: "bg-[#fef9c3]", wText: "text-[#a16207]" },
];

/* ── Mock detail data ────────────────────────────────────────────────── */
const LEAD_DETAILS = {
  "L-18492": {
    id: "L-18492",
    lastSeen: "Feb 12, 2025 · 14:23",
    firstSeen: "Feb 10, 2025 · 09:14",
    totalSessions: 8,
    totalTime: "34m 12s",
    intentScore: 82,
    intentLevel: "High",
    topDrivers: [
      { label: "Downloaded product brochure", type: "download" },
      { label: "Visited product page 5×",     type: "web" },
      { label: "Viewed contact page 2×",      type: "web" },
      { label: "8 sessions over 3 days",       type: "lightning" },
    ],
    triggeredPoints: ["Gated download", "Request medical info"],
    firstTouch: { source: "google", medium: "cpc", campaign: "cardiovascular-hcp-2025", content: "brochure-ad", term: "cardiovascular intervention", referrer: "https://www.google.com/", landingPage: "/products/cardiovascular", date: "Feb 10, 2025 · 09:14" },
    lastTouch:  { source: "direct", medium: "(none)", campaign: "(not set)", referrer: "(direct)", landingPage: "/products/cardiovascular", date: "Feb 12, 2025 · 14:18" },
    sessions: [
      {
        n: 1, date: "Feb 10, 2025", time: "09:14 – 09:47", duration: "33m 02s", source: "google / cpc",
        pages: [
          { path: "/products/cardiovascular",            timeSpent: "14m 22s", hi: true,  label: "Product page" },
          { path: "/clinical-evidence/cardiovascular",   timeSpent: "12m 18s", hi: true,  label: "Clinical evidence" },
          { path: "/about",                              timeSpent: "6m 22s",  hi: false, label: "About" },
        ],
        events: [
          { type: "scroll",   label: "75% scroll depth on product page" },
          { type: "click",    label: "Clicked 'Download Brochure' CTA" },
          { type: "download", label: "Downloaded cardiovascular brochure" },
        ],
      },
      {
        n: 2, date: "Feb 11, 2025", time: "16:10 – 16:42", duration: "32m 18s", source: "direct",
        pages: [
          { path: "/clinical-evidence/cardiovascular",        timeSpent: "8m 45s",  hi: true,  label: "Clinical evidence" },
          { path: "/products/cardiovascular/clinical-data",   timeSpent: "11m 03s", hi: true,  label: "Clinical data" },
          { path: "/products/cardiovascular",                 timeSpent: "7m 20s",  hi: true,  label: "Product page" },
          { path: "/contact",                                 timeSpent: "5m 10s",  hi: true,  label: "Contact page" },
        ],
        events: [
          { type: "web",    label: "Played clinical evidence video (2m 14s)" },
          { type: "scroll", label: "90% scroll on /clinical-data" },
          { type: "click",  label: "Clicked 'Request Product Information'" },
        ],
      },
      {
        n: 3, date: "Feb 12, 2025", time: "12:05 – 12:22", duration: "17m 40s", source: "direct",
        pages: [
          { path: "/products/cardiovascular", timeSpent: "11m 30s", hi: true, label: "Product page" },
          { path: "/contact",                 timeSpent: "6m 10s",  hi: true, label: "Contact page" },
        ],
        events: [
          { type: "scroll", label: "95% scroll on product page" },
          { type: "click",  label: "Clicked CTA: 'Get in touch'" },
        ],
      },
    ],
    topPages: [
      { path: "/products/cardiovascular",                views: 5, avgTime: "10m 58s", hi: true  },
      { path: "/clinical-evidence/cardiovascular",       views: 4, avgTime: "7m 15s",  hi: true  },
      { path: "/contact",                                views: 2, avgTime: "5m 10s",  hi: true  },
      { path: "/products/cardiovascular/clinical-data",  views: 2, avgTime: "11m 03s", hi: true  },
      { path: "/about",                                  views: 1, avgTime: "6m 22s",  hi: false },
    ],
    topics: [
      { label: "Cardiovascular",    confidence: "High"   },
      { label: "Clinical Evidence", confidence: "High"   },
      { label: "Product Interest",  confidence: "Medium" },
    ],
    downloads: [{ label: "Cardiovascular Product Brochure", date: "Feb 10, 2025" }],
    searchTerms: [],
    events: [
      { ts: "Feb 12 · 12:22", type: "click",    label: "Clicked CTA: 'Get in touch'" },
      { ts: "Feb 12 · 12:10", type: "scroll",   label: "95% scroll depth on /products/cardiovascular" },
      { ts: "Feb 12 · 12:05", type: "web",      label: "Session 3 start → /products/cardiovascular" },
      { ts: "Feb 11 · 16:42", type: "click",    label: "Clicked 'Request Product Information'" },
      { ts: "Feb 11 · 16:30", type: "scroll",   label: "90% scroll on /products/cardiovascular/clinical-data" },
      { ts: "Feb 11 · 16:22", type: "web",      label: "Played video: Clinical Evidence Overview (2m 14s)" },
      { ts: "Feb 11 · 16:10", type: "web",      label: "Session 2 start → /clinical-evidence/cardiovascular" },
      { ts: "Feb 10 · 09:47", type: "download", label: "Downloaded Cardiovascular Product Brochure" },
      { ts: "Feb 10 · 09:32", type: "click",    label: "Clicked CTA: 'Download Brochure'" },
      { ts: "Feb 10 · 09:20", type: "scroll",   label: "75% scroll depth on /products/cardiovascular" },
      { ts: "Feb 10 · 09:14", type: "web",      label: "Session 1 start → /products/cardiovascular (google / cpc)" },
    ],
    device: "Desktop",
    os: "macOS 14.2",
    browser: "Chrome 121",
    language: "en-US",
    location: "Boston, MA · US",
    returningVisitor: true,
    sessionsByDay: [
      { date: "Feb 10", sessions: 3 },
      { date: "Feb 11", sessions: 3 },
      { date: "Feb 12", sessions: 2 },
    ],
    possibleOrg: {
      name: "Massachusetts General Hospital",
      confidence: "High",
      confidenceScore: 87,
      why: [
        "IP address maps to MGH network subnet",
        "Geo consistent with Boston, MA (approx.)",
        "Browser fingerprint matches known MGH workstation pool",
      ],
    },
    crmCandidates: [
      { name: "Dr. Sarah Chen", onekeyId: "OK-10234", matchScore: 72, specialty: "Oncology", org: "Mayo Clinic / Stanford", reason: "Same institution city + cardiovascular content interest" },
    ],
    idStatus: "Candidate match",
    recommendations: [
      { action: "Retarget with Cardiovascular campaign", detail: "CV-HCP-Retarget-2025", why: "3 visits to product page + brochure download signal active evaluation. Strike while intent is high.", priority: "High" },
      { action: "Invite to cardiovascular webinar",      detail: "Cardiovascular Evidence Symposium · Mar 18, 2025", why: "4 visits to /clinical-evidence. Live KOL panel directly matches content consumption pattern.", priority: "High" },
      { action: "Serve clinical evidence content pack",  detail: "Content pack: Cardiovascular Clinical Evidence 2025", why: "Deep clinical evidence browsing signals evaluation mindset. Deliver deeper content to accelerate identification.", priority: "Medium" },
    ],
  },
};

// Fallback for other IDs
["L-17891","L-17654","L-17423","L-17210","L-16988","L-16745","L-16502"].forEach((id) => {
  if (!LEAD_DETAILS[id]) LEAD_DETAILS[id] = { ...LEAD_DETAILS["L-18492"], id };
});

/* ── Color maps ─────────────────────────────────────────────────────── */
const intentColors = {
  High:   { bg: "bg-[#dcfce7]", text: "text-[#16a34a]", border: "border-[#86efac]" },
  Medium: { bg: "bg-[#fef9c3]", text: "text-[#a16207]", border: "border-[#fde047]" },
  Low:    { bg: "bg-[#f3f4f6]", text: "text-[#6a7282]", border: "border-[#e5e7eb]" },
};
const confidenceColors = {
  High:   { bg: "bg-[#dcfce7]", text: "text-[#16a34a]" },
  Medium: { bg: "bg-[#dbeafe]", text: "text-[#2563eb]" },
  Low:    { bg: "bg-[#f3f4f6]", text: "text-[#6a7282]" },
};
const idStatusColors = {
  "Candidate match":       { bg: "bg-[#fef9c3]", text: "text-[#a16207]" },
  "Not enough signals":    { bg: "bg-[#f3f4f6]", text: "text-[#6a7282]" },
  "Ready to merge":        { bg: "bg-[#dcfce7]", text: "text-[#16a34a]" },
};
const priorityColors = {
  High:   { bg: "bg-[#fee2e2]", text: "text-[#dc2626]" },
  Medium: { bg: "bg-[#fef9c3]", text: "text-[#a16207]" },
  Low:    { bg: "bg-[#f3f4f6]", text: "text-[#6a7282]" },
};

/* ── Event icon ─────────────────────────────────────────────────────── */
function EvIcon({ type }) {
  const cls = "text-[#9ca3af]";
  if (type === "download") return <span className={cls}><DownloadBrochureIcon /></span>;
  if (type === "click")    return <span className={cls}><ClickIcon /></span>;
  if (type === "scroll")   return <span className={cls}><LightningIcon /></span>;
  if (type === "email")    return <span className={cls}><OpenedEmailIcon /></span>;
  if (type === "outbound") return <span className={cls}><ExternalLinkIcon /></span>;
  return <span className={cls}><WebVisitIcon /></span>;
}

/* ── Section card ────────────────────────────────────────────────────── */
function Card({ title, subtitle, right, children, noPad }) {
  return (
    <div className="rounded-[14px] border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[#0a0a0a]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-[#9ca3af]">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className={noPad ? "" : "p-6"}>{children}</div>
    </div>
  );
}

/* ── Session card (section C) ────────────────────────────────────────── */
function SessionCard({ s }) {
  const hasHI = s.pages.some((p) => p.hi);
  return (
    <div className={`rounded-[10px] border bg-white p-4 ${hasHI ? "border-[#93bbfd]" : "border-gray-200"}`}>
      {/* Session header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${hasHI ? "bg-[#dbeafe] text-[#2563eb]" : "bg-[#f3f4f6] text-[#6a7282]"}`}>
            Session {s.n}
          </span>
          {hasHI && (
            <span className="rounded-full bg-[#fef9c3] px-2 py-0.5 text-xs font-medium text-[#a16207]">
              High-intent moments
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
          <span>{s.date} · {s.time}</span>
          <span>{s.duration}</span>
          <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[#6a7282]">{s.source}</span>
        </div>
      </div>

      {/* Pages */}
      <div className="mb-3 flex flex-col gap-1">
        {s.pages.map((p, i) => (
          <div
            key={i}
            className={`flex items-center justify-between rounded-[6px] px-3 py-1.5 ${p.hi ? "bg-[#eff6ff]" : "bg-[#f9fafb]"}`}
          >
            <div className="flex items-center gap-2">
              {p.hi && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3b82f6]" />}
              <span className={`font-mono text-xs ${p.hi ? "text-[#2563eb]" : "text-[#6a7282]"}`}>{p.path}</span>
            </div>
            <span className="text-xs text-[#9ca3af]">{p.timeSpent}</span>
          </div>
        ))}
      </div>

      {/* Events */}
      <div className="flex flex-col gap-1 border-t border-gray-100 pt-2.5">
        {s.events.map((ev, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="scale-75 text-[#9ca3af]"><EvIcon type={ev.type} /></span>
            <span className="text-xs text-[#4a5565]">{ev.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */
export default function AnonymousLeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [convModalOpen, setConvModalOpen] = useState(false);
  const d = LEAD_DETAILS[id] ?? LEAD_DETAILS["L-18492"];
  const ic = intentColors[d.intentLevel] ?? intentColors.Low;

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#6a7282]">
            <button onClick={() => navigate("/profiles?tab=Signals")} className="hover:text-[#0a0a0a]">
              Profiles
            </button>
            <span>/</span>
            <button onClick={() => navigate("/profiles?tab=Signals")} className="hover:text-[#0a0a0a]">
              Signals
            </button>
            <span>/</span>
            <span className="text-[#0a0a0a]">{d.id}</span>
          </div>

          {/* ── A: Header snapshot ─────────────────────────────────── */}
          <div className="rounded-[14px] border border-gray-200 bg-white p-6">
            <div className="grid grid-cols-3 gap-8">

              {/* Left: identity */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f4f6] text-base font-bold text-[#6a7282]">
                    ?
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-[#0a0a0a]">{d.id}</span>
                      <span className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs font-medium text-[#6a7282]">Anonymous</span>
                    </div>
                    <span className="text-xs text-[#9ca3af]">Last seen {d.lastSeen}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "First seen",       value: d.firstSeen },
                    { label: "Last seen",         value: d.lastSeen },
                    { label: "Total sessions",    value: `${d.totalSessions}` },
                    { label: "Time on site",      value: d.totalTime },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-xs text-[#9ca3af]">{label}</span>
                      <span className="text-sm font-medium text-[#0a0a0a]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center: intent score */}
              <div className="flex flex-col items-center justify-center gap-3 border-x border-gray-100">
                <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 ${ic.border} text-3xl font-bold text-[#0a0a0a]`}>
                  {d.intentScore}
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${ic.bg} ${ic.text}`}>
                  {d.intentLevel} Intent
                </span>
                <button
                  onClick={() => setConvModalOpen(true)}
                  className="text-xs text-[#155dfc] hover:underline"
                >
                  What drives this score?
                </button>
              </div>

              {/* Right: top drivers */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Top drivers</p>
                </div>
                <div className="flex flex-col gap-2">
                  {d.topDrivers.map((driver, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-[8px] bg-[#f9fafb] border border-gray-100 px-3 py-2">
                      <span className="scale-90 text-[#9ca3af]"><EvIcon type={driver.type} /></span>
                      <span className="text-sm text-[#0a0a0a]">{driver.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {d.triggeredPoints.map((pt) => {
                    const point = CONVERSION_POINTS.find((p) => p.label === pt);
                    return point ? (
                      <span key={pt} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${point.wBg} ${point.wText}`}>
                        {pt}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── B–H: Two-column layout ──────────────────────────────── */}
          <div className="grid grid-cols-3 gap-6">

            {/* Left column: B, C, D, E */}
            <div className="col-span-2 flex flex-col gap-6">

              {/* B: Acquisition */}
              <Card title="Acquisition" subtitle="Where this lead really came from">
                <div className="grid grid-cols-2 gap-6">
                  {/* First touch */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-xs font-medium text-[#2563eb]">First touch</span>
                      <span className="text-xs text-[#9ca3af]">{d.firstTouch.date}</span>
                    </div>
                    {[
                      { label: "Source",    value: d.firstTouch.source },
                      { label: "Medium",    value: d.firstTouch.medium },
                      { label: "Campaign",  value: d.firstTouch.campaign },
                      { label: "Content",   value: d.firstTouch.content },
                      { label: "Term",      value: d.firstTouch.term },
                      { label: "Referrer",  value: d.firstTouch.referrer },
                      { label: "Landing",   value: d.firstTouch.landingPage },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start justify-between gap-4">
                        <span className="shrink-0 text-xs text-[#9ca3af]">{label}</span>
                        <span className="truncate text-right font-mono text-xs text-[#4a5565]">{value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Last touch */}
                  <div className="flex flex-col gap-3 border-l border-gray-100 pl-6">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs font-medium text-[#6a7282]">Last touch</span>
                      <span className="text-xs text-[#9ca3af]">{d.lastTouch.date}</span>
                    </div>
                    {[
                      { label: "Source",   value: d.lastTouch.source },
                      { label: "Medium",   value: d.lastTouch.medium },
                      { label: "Campaign", value: d.lastTouch.campaign },
                      { label: "Referrer", value: d.lastTouch.referrer },
                      { label: "Landing",  value: d.lastTouch.landingPage },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start justify-between gap-4">
                        <span className="shrink-0 text-xs text-[#9ca3af]">{label}</span>
                        <span className="truncate text-right font-mono text-xs text-[#4a5565]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* C: Journey / Timeline */}
              <Card title="Journey" subtitle="Session-by-session activity · Blue = high-intent moment">
                <div className="flex flex-col gap-3">
                  {d.sessions.map((s) => (
                    <SessionCard key={s.n} s={s} />
                  ))}
                </div>
              </Card>

              {/* D: Content & interests */}
              <Card title="Content & Interests" subtitle="What this lead consumed">
                <div className="grid grid-cols-2 gap-6">
                  {/* Top pages */}
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Top pages visited</p>
                    <div className="flex flex-col gap-1.5">
                      {d.topPages.map((p, i) => (
                        <div key={i} className={`flex items-center justify-between gap-3 rounded-[6px] px-3 py-2 ${p.hi ? "bg-[#eff6ff]" : "bg-[#f9fafb]"}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            {p.hi && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3b82f6]" />}
                            <span className={`truncate font-mono text-xs ${p.hi ? "text-[#2563eb]" : "text-[#6a7282]"}`} title={p.path}>
                              {p.path}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 text-xs text-[#9ca3af]">
                            <span>{p.views}×</span>
                            <span>{p.avgTime}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-5">
                    {/* Topics */}
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Inferred topics</p>
                      <div className="flex flex-col gap-1.5">
                        {d.topics.map((t) => {
                          const cc = confidenceColors[t.confidence] ?? confidenceColors.Low;
                          return (
                            <div key={t.label} className="flex items-center justify-between">
                              <span className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-xs font-medium text-[#2563eb]">{t.label}</span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cc.bg} ${cc.text}`}>{t.confidence}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Downloads */}
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Assets downloaded</p>
                      {d.downloads.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {d.downloads.map((dl, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-[6px] bg-[#f9fafb] px-3 py-2">
                              <span className="scale-75 text-[#9ca3af]"><DownloadBrochureIcon /></span>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-medium text-[#0a0a0a]">{dl.label}</span>
                                <span className="text-xs text-[#9ca3af]">{dl.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">None tracked</span>
                      )}
                    </div>
                    {/* Search terms */}
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Internal searches</p>
                      {d.searchTerms.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {d.searchTerms.map((t) => (
                            <span key={t} className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs text-[#4a5565]">{t}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">None tracked</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* E: Actions / Events */}
              <Card title="Actions & Events" subtitle="Full event log · most recent first" noPad>
                <div className="divide-y divide-gray-100">
                  {d.events.map((ev, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-3 hover:bg-[#f9fafb]">
                      <span className="w-[128px] shrink-0 font-mono text-xs text-[#9ca3af]">{ev.ts}</span>
                      <span className="scale-90 text-[#9ca3af]"><EvIcon type={ev.type} /></span>
                      <span className="text-sm text-[#4a5565]">{ev.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right column: F, G, H */}
            <div className="flex flex-col gap-6">

              {/* F: Tech & context */}
              <Card title="Tech & Context" subtitle="Device, location, session pattern">
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-y-3">
                    {[
                      { label: "Device",    value: d.device },
                      { label: "OS",        value: d.os },
                      { label: "Browser",   value: d.browser },
                      { label: "Language",  value: d.language },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span className="text-xs text-[#9ca3af]">{label}</span>
                        <span className="text-sm font-medium text-[#0a0a0a]">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#9ca3af]">Location</span>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-sm font-medium text-[#0a0a0a]">{d.location}</span>
                        <span className="text-xs text-[#9ca3af]">IP-based · approx.</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <span className="text-xs text-[#9ca3af]">Returning visitor</span>
                    <div className="mt-1.5">
                      {d.returningVisitor ? (
                        <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-medium text-[#16a34a]">Yes</span>
                      ) : (
                        <span className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs font-medium text-[#6a7282]">First visit</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <p className="mb-2 text-xs text-[#9ca3af]">Sessions by day</p>
                    <div className="flex items-end gap-2">
                      {d.sessionsByDay.map((day) => (
                        <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                          <div
                            className="w-full rounded-[4px] bg-[#3b82f6]"
                            style={{ height: `${day.sessions * 12}px`, opacity: 0.7 + day.sessions * 0.1 }}
                          />
                          <span className="text-[10px] text-[#9ca3af]">{day.date.replace("Feb ", "")}</span>
                          <span className="text-[10px] font-medium text-[#4a5565]">{day.sessions}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* G: Identity resolution */}
              <Card title="Identity Resolution" subtitle="Best-effort matching — not guaranteed">
                <div className="flex flex-col gap-4">
                  {/* Possible org */}
                  {d.possibleOrg && (
                    <div className="rounded-[10px] border border-gray-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Possible org.</span>
                        {(() => {
                          const cc = confidenceColors[d.possibleOrg.confidence] ?? confidenceColors.Low;
                          return (
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cc.bg} ${cc.text}`}>
                              {d.possibleOrg.confidence} confidence
                            </span>
                          );
                        })()}
                      </div>
                      <p className="mb-2 text-base font-semibold text-[#0a0a0a]">{d.possibleOrg.name}</p>
                      <div className="flex flex-col gap-1">
                        {d.possibleOrg.why.map((w, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#9ca3af]" />
                            <span className="text-xs text-[#6a7282]">{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CRM candidates */}
                  {d.crmCandidates.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Possible CRM match</p>
                      <div className="flex flex-col gap-2">
                        {d.crmCandidates.map((c, i) => (
                          <div key={i} className="rounded-[10px] border border-gray-200 p-3">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-medium text-[#0a0a0a]">{c.name}</span>
                              <span className="text-xs text-[#9ca3af]">{c.onekeyId}</span>
                            </div>
                            <div className="mb-2 flex items-center gap-1.5 text-xs text-[#6a7282]">
                              <span>{c.specialty}</span>
                              <span>·</span>
                              <span>{c.org}</span>
                            </div>
                            <div className="mb-2 flex items-center gap-2">
                              <div className="h-1.5 flex-1 rounded-full bg-[#f3f4f6]">
                                <div className="h-full rounded-full bg-[#155dfc]" style={{ width: `${c.matchScore}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-[#155dfc]">{c.matchScore}%</span>
                            </div>
                            <p className="text-xs text-[#9ca3af]">{c.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#9ca3af]">Resolution status</span>
                      {(() => {
                        const sc = idStatusColors[d.idStatus] ?? idStatusColors["Not enough signals"];
                        return (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.bg} ${sc.text}`}>
                            {d.idStatus}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="mt-2 text-xs text-[#9ca3af]">
                      Manual review required before merging with an existing CRM record.
                    </p>
                  </div>
                </div>
              </Card>

              {/* H: Recommended next steps */}
              <Card title="Recommended Next Steps" subtitle="Based on behavior patterns">
                <div className="flex flex-col gap-3">
                  {d.recommendations.map((rec, i) => {
                    const pc = priorityColors[rec.priority] ?? priorityColors.Low;
                    return (
                      <div key={i} className="rounded-[10px] border border-gray-200 p-4">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-[#0a0a0a]">{rec.action}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${pc.bg} ${pc.text}`}>
                            {rec.priority}
                          </span>
                        </div>
                        {rec.detail && (
                          <p className="mb-2 text-xs font-medium text-[#155dfc]">{rec.detail}</p>
                        )}
                        <p className="text-xs leading-5 text-[#6a7282]">{rec.why}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>

            </div>
          </div>
        </div>
      </main>

      {convModalOpen && (
        <ConversionPointsModal
          leadIntentLevel={d.intentLevel}
          onClose={() => setConvModalOpen(false)}
        />
      )}
    </div>
  );
}
