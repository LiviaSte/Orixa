import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  GreenCheckIcon,
  ConflictTriangleIcon,
  TransferIcon,
  ExternalLinkIcon,
} from "../components/icons";

/* ── Exports ──────────────────────────────────────────────────── */
export const HCO_CONFLICT_TOTAL = 2;
export const HCP_CONFLICT_TOTAL = 3;
export const PHARMACIST_CONFLICT_TOTAL = 1;
export const CONFLICT_TOTAL = HCO_CONFLICT_TOTAL;

/* ── Conflict type config ─────────────────────────────────────── */
const TYPE_CONFIG = {
  possible_duplicate: {
    label: "Possible duplicate",
    description:
      "Two records are very similar, but the system is not confident enough to merge automatically.",
    matchText: "closely matches",
    bannerBg: "bg-[#fff7ed]",
    bannerBorder: "border-[#fb923c]",
    titleColor: "text-[#c2410c]",
    bodyColor: "text-[#9a3412]",
    confidenceBg: "bg-[#dcfce7]",
    confidenceText: "text-[#008236]",
  },
  same_name_different_entity: {
    label: "Same name, different entity",
    description:
      "Records share the same or similar name but may refer to entirely different entities. Review carefully before deciding.",
    matchText: "shares the same name as",
    bannerBg: "bg-[#f5f3ff]",
    bannerBorder: "border-[#a78bfa]",
    titleColor: "text-[#6d28d9]",
    bodyColor: "text-[#5b21b6]",
    confidenceBg: "bg-[#fff7ed]",
    confidenceText: "text-[#c2410c]",
  },
};

/* ── Conflict data ────────────────────────────────────────────── */
const hcoConflicts = [
  {
    type: "possible_duplicate",
    entity: "St. Jude Medical Center",
    file: "upload_jan_q1.csv",
    confidence: "94%",
    rows: [
      { attribute: "Entity name",     newValue: "Saint Jude Medical",                existingValue: "St. Jude Hospital",                status: "conflict" },
      { attribute: "NPI/Number",      newValue: "1234569890",                         existingValue: "1234569890",                        status: "match"   },
      { attribute: "Speciality",      newValue: "Cardiology",                         existingValue: "Cardiology",                        status: "match"   },
      { attribute: "Primary address", newValue: "102 Healthcare Plaza, Ste 400",     existingValue: "102 Healthcare Plaza, North Wing",  status: "conflict" },
      { attribute: "DEA Number",      newValue: "XY9876543",                          existingValue: "Not on file",                       status: "conflict", existingItalic: true },
    ],
  },
  {
    type: "same_name_different_entity",
    entity: "Boston General Hospital",
    file: "upload_jan_q1.csv",
    confidence: "61%",
    rows: [
      { attribute: "Entity name",     newValue: "Boston General Hospital",           existingValue: "Boston General Hospital",            status: "match"   },
      { attribute: "NPI/Number",      newValue: "9876543210",                        existingValue: "4412987653",                         status: "conflict" },
      { attribute: "Speciality",      newValue: "Oncology",                          existingValue: "General Surgery",                    status: "conflict" },
      { attribute: "Primary address", newValue: "55 Fruit Street, Boston MA 02114", existingValue: "200 Hospital Drive, Dallas TX 75201", status: "conflict" },
      { attribute: "Phone",           newValue: "+1 617-726-2000",                  existingValue: "+1 214-820-3111",                    status: "conflict" },
    ],
    extraRows: [
      { attribute: "Founded",        newValue: "2008",              existingValue: "1994"                  },
      { attribute: "Bed count",      newValue: "342 beds",          existingValue: "180 beds"              },
      { attribute: "Health network", newValue: "MassGen Partners",  existingValue: "UT Southwestern Network" },
    ],
  },
];

const hcpConflicts = [
  {
    type: "possible_duplicate",
    entity: "Dr. Marco Ferretti",
    file: "doctors_q1.csv",
    confidence: "91%",
    rows: [
      { attribute: "Full name",   newValue: "Marco Ferretti",               existingValue: "M. Ferretti",                        status: "conflict" },
      { attribute: "NPI",         newValue: "1427356819",                    existingValue: "1427356819",                         status: "match"   },
      { attribute: "Specialty",   newValue: "Interventional Cardiology",     existingValue: "Cardiology",                         status: "conflict" },
      { attribute: "Affiliation", newValue: "Policlinico Gemelli, Rome",     existingValue: "Gemelli University Hospital",        status: "conflict" },
      { attribute: "License No.", newValue: "IT-RM-20341",                   existingValue: "Not on file",                        status: "conflict", existingItalic: true },
    ],
  },
  {
    type: "same_name_different_entity",
    entity: "Dr. Sophie Laurent",
    file: "doctors_q1.csv",
    confidence: "58%",
    rows: [
      { attribute: "Full name",   newValue: "Sophie Laurent",               existingValue: "Sophie Laurent",                     status: "match"   },
      { attribute: "NPI",         newValue: "9038471256",                   existingValue: "3821047593",                         status: "conflict" },
      { attribute: "Specialty",   newValue: "Oncology",                     existingValue: "Pediatrics",                         status: "conflict" },
      { attribute: "Affiliation", newValue: "Hôpital Lariboisière, Paris",  existingValue: "CHU Nantes, Nantes",                 status: "conflict" },
      { attribute: "Email",       newValue: "s.laurent@larib.fr",           existingValue: "sophie.l@chu-nantes.fr",             status: "conflict" },
    ],
    extraRows: [
      { attribute: "Date of birth", newValue: "14 Mar 1982",         existingValue: "29 Jul 1975"    },
      { attribute: "Gender",        newValue: "Female",               existingValue: "Female"         },
      { attribute: "Languages",     newValue: "French, English",      existingValue: "French"         },
    ],
  },
  {
    type: "possible_duplicate",
    entity: "Dr. Andrew Müller",
    file: "doctors_q1.csv",
    confidence: "87%",
    rows: [
      { attribute: "Full name",   newValue: "Andrew Müller",                existingValue: "A. Müller",                           status: "conflict" },
      { attribute: "NPI",         newValue: "5612034789",                   existingValue: "5612034789",                          status: "match"   },
      { attribute: "Specialty",   newValue: "Nephrology",                   existingValue: "Nephrology",                          status: "match"   },
      { attribute: "Affiliation", newValue: "Charité Berlin",               existingValue: "Charité – Universitätsmedizin Berlin",status: "conflict" },
      { attribute: "License No.", newValue: "DE-BE-78432",                  existingValue: "Not on file",                         status: "conflict", existingItalic: true },
    ],
  },
];

const pharmacistConflicts = [
  {
    type: "possible_duplicate",
    entity: "Dr. Elena Vasquez",
    file: "pharmacy_q1.csv",
    confidence: "89%",
    rows: [
      { attribute: "Full name",    newValue: "Elena Vasquez",        existingValue: "E. Vasquez",         status: "conflict" },
      { attribute: "License No.",  newValue: "PH-2893712",           existingValue: "PH-2893712",         status: "match"   },
      { attribute: "Specialty",    newValue: "Clinical Pharmacy",    existingValue: "Hospital Pharmacy",  status: "conflict" },
      { attribute: "Affiliation",  newValue: "CVS Health, Chicago",  existingValue: "Walgreens, Chicago", status: "conflict" },
      { attribute: "Email",        newValue: "e.vasquez@cvs.com",    existingValue: "Not on file",        status: "conflict", existingItalic: true },
    ],
  },
];

/* ── Helpers ──────────────────────────────────────────────────── */
const getResolvedSet = (key) => {
  try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); }
  catch { return new Set(); }
};

/* ── Type icons ───────────────────────────────────────────────── */
function PossibleDupIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
      <path d="M9 2.25L15.75 14.25H2.25L9 2.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 7.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="12.75" r="0.75" fill="currentColor"/>
    </svg>
  );
}

function SameNameIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
      <circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 15c0-2.761 2.239-4.5 5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M17 15c0-2.761-2.239-4.5-5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 10.5C8.5 10.5 12 10.5 12 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/* ── Merge confirmation modal ─────────────────────────────────── */
function MergeModal({ conflict, rows, onConfirm, onCancel }) {
  const origRows = conflict.rows;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl overflow-hidden rounded-[16px] bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-8 py-6">
          <h2 className="text-lg font-semibold text-[#0a0a0a]">Review & confirm merge</h2>
          <p className="mt-1 text-sm text-[#6a7282]">
            The master record for{" "}
            <span className="font-medium text-[#0a0a0a]">{conflict.entity}</span> will be
            saved with the values below. Review any changes before confirming.
          </p>
        </div>
        <div className="max-h-[380px] overflow-y-auto px-8 py-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6a7282]">Attribute</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6a7282]">Final value</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6a7282]">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const wasSwapped = origRows[idx].existingValue !== row.existingValue;
                let badge;
                if (row.status === "match") {
                  badge = <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-medium text-[#15803d]">Match</span>;
                } else if (wasSwapped) {
                  badge = <span className="rounded-full bg-[#fef9c3] px-2.5 py-0.5 text-xs font-medium text-[#a16207]">Updated</span>;
                } else {
                  badge = <span className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-xs font-medium text-[#1d4ed8]">Kept</span>;
                }
                return (
                  <tr key={row.attribute} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4 text-sm italic text-[#6a7282] w-[180px]">{row.attribute}</td>
                    <td className="py-3 pr-4 text-sm font-medium text-[#0a0a0a]">{row.existingValue}</td>
                    <td className="py-3">{badge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-200 px-8 py-5">
          <button onClick={onCancel} className="rounded-[10px] border border-[#d1d5dc] bg-white px-6 py-2.5 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded-[10px] bg-[#101828] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d2939]">
            Confirm merge
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Keep separate confirmation modal ────────────────────────── */
function KeepSeparateModal({ conflict, rows, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl overflow-hidden rounded-[16px] bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <h2 className="text-lg font-semibold text-[#0a0a0a]">Keep as separate records</h2>
          <p className="mt-1 text-sm text-[#6a7282]">
            The record for{" "}
            <span className="font-medium text-[#0a0a0a]">{conflict.entity}</span> will be
            saved as a new, separate profile with the values below. The existing profile remains unchanged.
          </p>
        </div>

        {/* New record attribute table */}
        <div className="max-h-[380px] overflow-y-auto px-8 py-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6a7282]">Attribute</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6a7282]">New record value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.attribute} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-4 text-sm italic text-[#6a7282] w-[180px]">{row.attribute}</td>
                  <td className="py-3 text-sm font-medium text-[#0a0a0a]">{row.newValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-8 py-5">
          <button onClick={onCancel} className="rounded-[10px] border border-[#d1d5dc] bg-white px-6 py-2.5 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded-[10px] bg-[#101828] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d2939]">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Review more attributes modal ────────────────────────────── */
function ReviewAttributesModal({ conflict, onClose, onKeepSeparate }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl overflow-hidden rounded-[16px] bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-8 py-6">
          <h2 className="text-lg font-semibold text-[#0a0a0a]">Additional attributes</h2>
          <p className="mt-1 text-sm text-[#6a7282]">
            Review these extra attributes to help determine whether these are truly the same entity.
          </p>
        </div>
        <div className="max-h-[360px] overflow-y-auto px-8 py-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6a7282] w-[160px]">Attribute</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6a7282]">Existing profile</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6a7282]">New entity</th>
              </tr>
            </thead>
            <tbody>
              {(conflict.extraRows || []).map((row) => (
                <tr key={row.attribute} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-4 text-sm italic text-[#6a7282]">{row.attribute}</td>
                  <td className="py-3 pr-4 text-sm text-[#0a0a0a]">{row.existingValue}</td>
                  <td className="py-3 text-sm text-[#0a0a0a]">{row.newValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 px-8 py-5">
          <button onClick={onClose} className="rounded-[10px] border border-[#d1d5dc] bg-white px-6 py-2.5 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
            Close
          </button>
          <button onClick={onKeepSeparate} className="rounded-[10px] bg-[#101828] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d2939]">
            Keep separate
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
export default function ConflictResolution() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const entityParam = searchParams.get("entity");
  const entityType = ["hcp", "hco", "pharmacist"].includes(entityParam) ? entityParam : "hco";

  const conflictsByEntity = { hcp: hcpConflicts, hco: hcoConflicts, pharmacist: pharmacistConflicts };
  const conflicts = conflictsByEntity[entityType];
  const LS_KEY = `${entityType}-resolved-conflicts`;
  const returnTab = { hcp: "HCPs", hco: "HCOs", pharmacist: "Pharmacists" }[entityType];

  const rawIndex = parseInt(searchParams.get("index") ?? "0", 10);
  const conflictIndex = isNaN(rawIndex) || rawIndex < 0 || rawIndex >= conflicts.length ? 0 : rawIndex;
  const conflict = conflicts[conflictIndex];
  const total = conflicts.length;
  const typeConf = TYPE_CONFIG[conflict.type] || TYPE_CONFIG.possible_duplicate;
  const isPossibleDup = conflict.type === "possible_duplicate";

  useEffect(() => {
    const resolved = getResolvedSet(LS_KEY);
    if (!resolved.has(conflictIndex)) return;
    const firstUnresolved = conflicts.findIndex((_, i) => !resolved.has(i));
    if (firstUnresolved >= 0) {
      navigate(`/profiles/conflict?entity=${entityType}&index=${firstUnresolved}`, { replace: true });
    } else {
      navigate(`/profiles?tab=${returnTab}`, { replace: true });
    }
  }, [conflictIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedSet = getResolvedSet(LS_KEY);
  const prevIdx = (() => {
    for (let i = conflictIndex - 1; i >= 0; i--) {
      if (!resolvedSet.has(i)) return i;
    }
    return null;
  })();
  const nextIdx = (() => {
    for (let i = conflictIndex + 1; i < conflicts.length; i++) {
      if (!resolvedSet.has(i)) return i;
    }
    return null;
  })();

  const [rowsByConflict, setRowsByConflict] = useState(() =>
    conflicts.map((c) => c.rows.map((r) => ({ ...r })))
  );
  const rows = rowsByConflict[conflictIndex];

  const [mergeModal, setMergeModal]               = useState(false);
  const [keepSeparateModal, setKeepSeparateModal] = useState(false);
  const [reviewAttrModal, setReviewAttrModal]     = useState(false); // used by ReviewAttributesModal (same_name type)

  const handleSwap = (idx) => {
    setRowsByConflict((prev) =>
      prev.map((conflictRows, ci) => {
        if (ci !== conflictIndex) return conflictRows;
        return conflictRows.map((row, i) =>
          i !== idx ? row : { ...row, newValue: row.existingValue, existingValue: row.newValue }
        );
      })
    );
  };

  const goToConflict = (idx) =>
    navigate(`/profiles/conflict?entity=${entityType}&index=${idx}`);

  const resolveAndAdvance = (actionType) => {
    const updated = new Set([...getResolvedSet(LS_KEY), conflictIndex]);
    try { localStorage.setItem(LS_KEY, JSON.stringify([...updated])); } catch {}

    if (entityType === "hcp" && updated.size >= conflicts.length) {
      try { localStorage.setItem("hcp-upload-conflicts", "resolved"); } catch {}
    }

    let next = -1;
    for (let i = conflictIndex + 1; i < conflicts.length; i++) {
      if (!updated.has(i)) { next = i; break; }
    }
    if (next === -1) {
      for (let i = 0; i < conflictIndex; i++) {
        if (!updated.has(i)) { next = i; break; }
      }
    }

    if (next >= 0) {
      goToConflict(next);
    } else {
      navigate(`/profiles?tab=${returnTab}&resolved=${actionType}`);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm">
            <Link to={`/profiles?tab=${returnTab}`} className="text-[#6a7282] transition-colors hover:text-[#155dfc]">
              Profiles
            </Link>
            <span className="text-[#6a7282]">/</span>
            <Link to={`/profiles?tab=${returnTab}`} className="text-[#6a7282] transition-colors hover:text-[#155dfc]">
              {returnTab}
            </Link>
            <span className="text-[#6a7282]">/</span>
            <span className="text-[#101828]">Conflict resolution</span>
          </nav>

          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">Conflict resolution</h1>
              <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
                Control the profile conflict and resolve it to maintain a Golden Record.
              </p>
            </div>

            {/* Conflict navigator */}
            {total > 1 && (
              <div className="flex shrink-0 items-center gap-2 pt-1">
                {prevIdx !== null ? (
                  <button
                    onClick={() => goToConflict(prevIdx)}
                    className="flex items-center gap-1.5 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Previous conflict
                  </button>
                ) : (
                  <div className="w-[155px]" />
                )}
                <span className="w-[100px] text-center text-sm text-[#6a7282]">
                  Conflict{" "}
                  <span className="font-medium text-[#0a0a0a]">{conflictIndex + 1}</span> of{" "}
                  <span className="font-medium text-[#0a0a0a]">{total}</span>
                </span>
                {nextIdx !== null ? (
                  <button
                    onClick={() => goToConflict(nextIdx)}
                    className="flex items-center gap-1.5 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50"
                  >
                    Next conflict
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ) : (
                  <div className="w-[120px]" />
                )}
              </div>
            )}
          </div>

          {/* Match banner */}
          <div className="flex items-center justify-between rounded-[14px] border border-gray-200 bg-white px-[17px] py-4">
            <p className="text-sm text-[#364153]">
              We found an existing profile that{" "}
              <span className="font-medium text-[#0a0a0a]">{typeConf.matchText}</span>{" "}
              the new entry from{" "}
              <span className="text-[#155dfc]">{conflict.file}</span>
            </p>
            <span className={`rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3px] ${typeConf.confidenceBg} ${typeConf.confidenceText}`}>
              🔗 {conflict.confidence} confidence match
            </span>
          </div>

          {/* Conflict type banner — always warning (orange) */}
          <div className="flex items-start gap-3 rounded-[14px] border border-[#fb923c] bg-[#fff7ed] p-[17px]">
            <span className="mt-0.5 text-[#c2410c]">
              {isPossibleDup ? <PossibleDupIcon /> : <SameNameIcon />}
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#c2410c]">
                {typeConf.label}
              </p>
              <p className="text-sm leading-5 text-[#9a3412]">
                {isPossibleDup
                  ? `The incoming record for "${conflict.entity}" shares a matching NPI and Address with an existing profile. Merging will prioritize existing master record values unless otherwise specified.`
                  : `The incoming record for "${conflict.entity}" shares the same name as an existing profile, but key identifiers (NPI, address, phone) differ significantly. These may be two completely distinct entities.`}
              </p>
            </div>
            <button className="flex shrink-0 items-center gap-1 text-sm font-medium text-[#c2410c] transition-colors hover:opacity-75">
              View match logic
              <ExternalLinkIcon />
            </button>
          </div>

          {/* Comparison table */}
          <div className="overflow-hidden rounded-[14px] border border-gray-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f9fafb]">
                  <th className="w-[240px] px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                    Attribute
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Existing Profile</span>
                      <span className="text-xs tracking-[0.6px] text-[#155dfc]">(master_data.csv)</span>
                    </div>
                  </th>
                  <th className="w-[68px] px-6 py-4" />
                  <th className="px-6 py-3 text-left">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">New Entity</span>
                      <span className="text-xs tracking-[0.6px] text-[#155dfc]">({conflict.file})</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.attribute}
                    className={`border-b border-gray-200 last:border-b-0 transition-colors ${idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"}`}
                  >
                    <td className="px-6 py-5">
                      <span className="text-sm italic text-[#6a7282]">{row.attribute}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-sm text-[#364153] ${row.existingItalic ? "italic" : ""}`}>
                        {row.existingValue}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center">
                        {row.status === "conflict" && (
                          <button
                            onClick={() => handleSwap(idx)}
                            className="rounded-md transition-transform hover:scale-110 active:scale-95"
                            title={`Swap values for ${row.attribute}`}
                          >
                            <TransferIcon />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {row.status === "conflict" ? <ConflictTriangleIcon /> : <GreenCheckIcon />}
                        <span className="text-sm font-medium text-[#101828]">{row.newValue}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#f9fafb]">
                  <td className="px-6 py-5">
                    <span className="text-xs font-semibold uppercase tracking-[0.6px] text-[#99a1af]">Metadata</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm text-[#6a7282]">Last updated 24/10/2023</span>
                  </td>
                  <td className="px-6 py-5" />
                  <td className="px-6 py-5">
                    <span className="text-sm text-[#6a7282]">Created 12/01/2024</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setKeepSeparateModal(true)}
              className="rounded-[10px] border border-[#d1d5dc] bg-white px-6 py-2.5 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50"
            >
              Keep separate
            </button>
            <button
              onClick={() => setMergeModal(true)}
              className="rounded-[10px] bg-[#101828] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d2939]"
            >
              Merge with master
            </button>
          </div>

        </div>
      </main>

      {/* Merge confirmation modal */}
      {mergeModal && (
        <MergeModal
          conflict={conflict}
          rows={rows}
          onConfirm={() => { setMergeModal(false); resolveAndAdvance("merge"); }}
          onCancel={() => setMergeModal(false)}
        />
      )}

      {/* Keep separate confirmation modal */}
      {keepSeparateModal && (
        <KeepSeparateModal
          conflict={conflict}
          rows={rows}
          onConfirm={() => { setKeepSeparateModal(false); resolveAndAdvance("separate"); }}
          onCancel={() => setKeepSeparateModal(false)}
        />
      )}

      {/* Review more attributes modal */}
      {reviewAttrModal && (
        <ReviewAttributesModal
          conflict={conflict}
          onClose={() => setReviewAttrModal(false)}
          onKeepSeparate={() => { setReviewAttrModal(false); setKeepSeparateModal(true); }}
        />
      )}
    </div>
  );
}
