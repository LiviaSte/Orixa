import { CloseIcon } from "./icons";

const CONVERSION_POINTS = [
  {
    label: "Gated download",
    desc: "Whitepaper, brochure, or clinical study — requires identity capture",
    weight: "High",
    wBg: "bg-[#dcfce7]",
    wText: "text-[#16a34a]",
  },
  {
    label: "Webinar registration",
    desc: "Live or on-demand event sign-up",
    weight: "High",
    wBg: "bg-[#dcfce7]",
    wText: "text-[#16a34a]",
  },
  {
    label: "Request medical info / contact",
    desc: "Explicit interest in products or medical services",
    weight: "Very high",
    wBg: "bg-[#fee2e2]",
    wText: "text-[#dc2626]",
  },
  {
    label: "Newsletter opt-in",
    desc: "Newsletter subscription — lighter intent signal",
    weight: "Medium",
    wBg: "bg-[#fef9c3]",
    wText: "text-[#a16207]",
  },
  {
    label: "Event RSVP",
    desc: "Conference, symposium, or workshop registration",
    weight: "Medium",
    wBg: "bg-[#fef9c3]",
    wText: "text-[#a16207]",
  },
];

export default function ConversionPointsModal({ onClose, leadIntentLevel }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[500px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-[#0a0a0a]">Conversion points</h2>
            <p className="mt-1 text-sm text-[#6a7282]">
              Signals that contribute to an anonymous lead's Intent score
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 text-[#9ca3af] hover:text-[#6a7282]"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Points list */}
        <div className="flex flex-col gap-2 p-6">
          {CONVERSION_POINTS.map((pt) => (
            <div
              key={pt.label}
              className="flex items-start justify-between gap-4 rounded-[10px] border border-gray-100 bg-[#f9fafb] px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-[#0a0a0a]">{pt.label}</span>
                <span className="text-xs text-[#6a7282]">{pt.desc}</span>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${pt.wBg} ${pt.wText}`}
              >
                {pt.weight}
              </span>
            </div>
          ))}
        </div>

        {/* Lead context (optional) */}
        {leadIntentLevel && (
          <div className="mx-6 mb-4 rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3">
            <p className="text-sm text-[#2563eb]">
              <span className="font-semibold">This lead is {leadIntentLevel} Intent</span> — reached
              score ≥ 70 through multiple high-weight conversion signals over a 3-day window.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 bg-[#f9fafb] px-6 py-4">
          <p className="text-xs text-[#6a7282]">
            <span className="font-medium">Score thresholds: </span>
            High Intent ≥ 70 · Medium Intent 40–69 · Low Intent &lt; 40
          </p>
        </div>
      </div>
    </>
  );
}
