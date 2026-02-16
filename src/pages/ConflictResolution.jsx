import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  InfoCircleIcon,
  GreenCheckIcon,
  ConflictTriangleIcon,
  TransferIcon,
  ExternalLinkIcon,
} from "../components/icons";

const initialRows = [
  {
    attribute: "Entity name",
    newValue: "Saint Jude Medical",
    existingValue: "St. Jude Hospital",
    status: "conflict",
  },
  {
    attribute: "NPI/Number",
    newValue: "1234569890",
    existingValue: "1234569890",
    status: "match",
  },
  {
    attribute: "Speciality",
    newValue: "Cardiology",
    existingValue: "Cardiology",
    status: "match",
  },
  {
    attribute: "Primary address",
    newValue: "102 Healthcare Plaza, Ste 400",
    existingValue: "102 Healthcare Plaza, North Wing",
    status: "conflict",
  },
  {
    attribute: "DEA Number",
    newValue: "XY9876543",
    existingValue: "Not on file",
    status: "conflict",
    existingItalic: true,
  },
];

export default function ConflictResolution() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(initialRows);

  const handleSwap = (idx) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        return {
          ...row,
          newValue: row.existingValue,
          existingValue: row.newValue,
        };
      }),
    );
  };

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
            <span className="text-[#6a7282]">/</span>
            <Link
              to="/profiles?tab=Hospitals"
              className="text-[#6a7282] transition-colors hover:text-[#155dfc]"
            >
              Hospitals
            </Link>
            <span className="text-[#6a7282]">/</span>
            <span className="text-[#101828]">Conflict resolution</span>
          </nav>

          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">
              Conflict resolution
            </h1>
            <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
              Control the profile conflict and resolve it to maintain a Golden
              Record.
            </p>
          </div>

          {/* Match banner */}
          <div className="flex items-center justify-between rounded-[14px] border border-gray-200 bg-white px-[17px] py-4">
            <p className="text-sm text-[#364153]">
              We found an existing profile that closely matches the new entry
              from{" "}
              <span className="text-[#155dfc]">upload_jan_q1.csv</span>
            </p>
            <span className="rounded bg-[#dcfce7] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3px] text-[#008236]">
              🔗 94% CONFIDENCE MATCH
            </span>
          </div>

          {/* Conflict detected alert */}
          <div className="flex items-start gap-3 rounded-[14px] border border-[#155dfc] bg-[#eff6ff] p-[17px]">
            <span className="shrink-0">
              <InfoCircleIcon />
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm font-semibold text-[#155dfc]">
                CONFLICT DETECTED
              </p>
              <p className="text-sm leading-5 text-[#155dfc]">
                The incoming record for "St. Jude Medical Center" shares a
                matching NPI and Address with an existing profile. Merging will
                prioritize existing "Golden Record" values unless otherwise
                specified.
              </p>
            </div>
            <button className="flex shrink-0 items-center gap-1 text-sm font-medium text-[#155dfc] transition-colors hover:text-[#1247cc]">
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
                      <span className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        NEW ENTITY
                      </span>
                      <span className="text-xs tracking-[0.6px] text-[#155dfc]">
                        (file_name.csv)
                      </span>
                    </div>
                  </th>
                  <th className="w-[68px] px-6 py-4" />
                  <th className="px-6 py-3 text-left">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                        EXISTING PROFILE
                      </span>
                      <span className="text-xs tracking-[0.6px] text-[#155dfc]">
                        (master_data.csv)
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.attribute}
                    className={`border-b border-gray-200 last:border-b-0 transition-colors ${
                      idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                    }`}
                  >
                    {/* Attribute */}
                    <td className="px-6 py-5">
                      <span className="text-sm italic text-[#6a7282]">
                        {row.attribute}
                      </span>
                    </td>

                    {/* New entity value */}
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium text-[#101828]">
                        {row.newValue}
                      </span>
                    </td>

                    {/* Center icon column */}
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

                    {/* Existing profile value */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {row.status === "conflict" ? (
                          <ConflictTriangleIcon />
                        ) : (
                          <GreenCheckIcon />
                        )}
                        <span
                          className={`text-sm text-[#364153] ${
                            row.existingItalic ? "italic" : ""
                          }`}
                        >
                          {row.existingValue}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Metadata row */}
                <tr className="bg-[#f9fafb]">
                  <td className="px-6 py-5">
                    <span className="text-xs font-semibold uppercase tracking-[0.6px] text-[#99a1af]">
                      Metadata
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm text-[#6a7282]">
                      Created 12/01/2024
                    </span>
                  </td>
                  <td className="px-6 py-5" />
                  <td className="px-6 py-5">
                    <span className="text-sm text-[#6a7282]">
                      Last updated 24/10/2023
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => navigate("/profiles")}
              className="rounded-[10px] border border-[#d1d5dc] bg-white px-6 py-2.5 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50"
            >
              Create new entry
            </button>
            <button
              onClick={() => navigate("/profiles")}
              className="rounded-[10px] bg-[#101828] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d2939]"
            >
              Merge as same
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
