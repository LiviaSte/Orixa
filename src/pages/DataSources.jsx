import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import Sidebar from "../components/Sidebar";
import { useMappingContext } from "../MappingContext";
import {
  SalesDataIcon,
  ContactsIcon,
  CongressBuildingIcon,
  UploadDbIcon,
  FileIcon,
  SearchIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../components/icons";

const domainCardsConfig = [
  {
    key: "sales",
    title: "Sales data",
    description: "Revenue, unit volume and market share datasets",
    icon: SalesDataIcon,
    iconBg: "bg-[#eff6ff]",
    iconColor: "text-[#155dfc]",
    uploadPath: null,
    mappingDomain: null,
  },
  {
    key: "contacts",
    title: "Contacts/Doctors",
    description: "HCP (Healthcare Professional) registry lists",
    icon: ContactsIcon,
    iconBg: "bg-[#eff6ff]",
    iconColor: "text-[#155dfc]",
    uploadPath: null,
    mappingDomain: null,
  },
  {
    key: "congress",
    title: "Congress",
    description: "Congress information",
    icon: CongressBuildingIcon,
    iconBg: "bg-[#f0fdfa]",
    iconColor: "text-[#14b8a6]",
    uploadPath: "/upload/congress",
    mappingPath: "/upload/congress/mapping",
    mappingDomain: "congress",
  },
];

const projectRows = [];

function detectType(values) {
  for (const v of values) {
    if (v == null || v === "") continue;
    if (typeof v === "number" || (typeof v === "string" && v !== "" && !isNaN(Number(v)))) return "number";
    if (typeof v === "boolean") return "boolean";
    if (v instanceof Date) return "date";
    return "string";
  }
  return "string";
}

function parseXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (json.length === 0) { reject(new Error("The file is empty or has no data rows.")); return; }
        const headers = Object.keys(json[0]);
        const columns = headers.map((header) => {
          const vals = json.map((row) => row[header]);
          const first = vals.find((v) => v != null && v !== "");
          return { fileColumn: header, type: detectType(vals), preview: first != null ? String(first) : "" };
        });
        resolve({ columns, totalRows: json.length });
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsArrayBuffer(file);
  });
}

export default function DataSources() {
  const navigate = useNavigate();
  const { getMapping, uploadedDatabases } = useMappingContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const { columns, totalRows } = await parseXlsx(file);
      navigate("/upload/mapping", { state: { columns, totalRows, fileName: file.name } });
    } catch (err) {
      setUploadError(err.message || "Failed to process the file.");
    } finally {
      setUploading(false);
    }
  }

  const filteredRows = projectRows.filter(
    (row) =>
      row.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.project.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-8">

          {/* Page header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">Data sources</h1>
            <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
              Centralize your pharma enterprise data. Manually upload the files you need to perform analysis.
            </p>
          </div>

          {/* Databases header + upload button */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-medium leading-[30px] text-[#0a0a0a]">Databases</h2>
              <p className="text-sm text-[#4a5565]">
                Manually upload the files you need to perform analysis.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 rounded-[10px] bg-[#155dfc] px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-[#1247cc] disabled:opacity-60"
              >
                <UploadDbIcon />
                {uploading ? "Processing…" : "Upload database"}
              </button>
              {uploadError && (
                <p className="text-xs text-[#b1000f]">{uploadError}</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleFileSelected}
                className="hidden"
              />
            </div>
          </div>

          {/* Recommended data domains */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#99a1af]">
              Recommended data domains
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {domainCardsConfig.map((card) => {
                const saved = card.mappingDomain ? getMapping(card.mappingDomain) : null;
                const isMapped = !!saved;
                const clickPath = isMapped ? card.mappingPath : card.uploadPath;

                return (
                  <div
                    key={card.key}
                    onClick={() => clickPath && navigate(clickPath)}
                    className={`flex flex-col gap-4 rounded-[14px] border bg-white px-6 pb-4 pt-6 ${
                      clickPath
                        ? "cursor-pointer transition-all hover:border-[#155dfc] hover:shadow-sm"
                        : ""
                    } ${isMapped ? "border-[#00c950]/30" : "border-gray-200"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${card.iconBg}`}>
                        <span className={card.iconColor}>
                          <card.icon />
                        </span>
                      </div>
                      {isMapped ? (
                        <span className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium uppercase tracking-[0.3px] text-[#008236] bg-[#f0fdf4]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#00c950]" />
                          Mapped
                        </span>
                      ) : (
                        <span className="rounded px-2.5 py-1 text-xs font-medium uppercase tracking-[0.3px] text-[#6a7282] bg-[#f3f4f6]">
                          Not uploaded
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-medium text-[#0a0a0a]">{card.title}</h3>
                    <p className="text-sm text-[#6a7282]">{card.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Uploaded databases table */}
          {uploadedDatabases.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#99a1af]">
                Uploaded databases
              </p>
              <div className="overflow-hidden rounded-[14px] border border-gray-200 bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-[#f9fafb]">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">File name</th>
                      <th className="w-[99px] px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Format</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Upload date</th>
                      <th className="w-[131px] px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedDatabases.map((record) => {
                      const mappedCount = record.mappingRows.filter((r) => r.status === "Mapped").length;
                      const total = record.mappingRows.length;
                      const allMapped = mappedCount === total;
                      return (
                        <tr
                          key={record.id}
                          onClick={() => navigate("/upload/mapping", { state: { recordId: record.id } })}
                          className="cursor-pointer border-b border-gray-200 transition-colors last:border-b-0 hover:bg-[#f9fafb]"
                        >
                          <td className="px-6 py-[19px]">
                            <div className="flex items-center gap-3">
                              <FileIcon />
                              <span className="text-sm font-medium text-[#101828]">
                                {record.fileName || "Untitled"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-[17px]">
                            <span className="rounded px-2.5 py-0.5 text-xs font-medium uppercase text-[#008236] bg-[#f0fdf4]">
                              {record.format}
                            </span>
                          </td>
                          <td className="px-6 py-[19px] text-sm text-[#4a5565]">{record.uploadDate}</td>
                          <td className="px-6 py-[17px]">
                            {allMapped ? (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f0fdf4] px-2.5 py-0.5 text-xs font-medium text-[#008236]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#00c950]" />
                                Mapped
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#fef9c2] px-2.5 py-0.5 text-xs font-medium text-[#a65f00]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                                {mappedCount}/{total} mapped
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Projects database */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium leading-[30px] text-[#0a0a0a]">Projects database</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by file name or project..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[320px] rounded-[10px] border border-[#d1d5dc] bg-white py-2 pl-10 pr-4 text-sm text-[#0a0a0a] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
                  />
                </div>
                <button className="flex items-center gap-2 rounded-[10px] border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
                  <FilterIcon />
                  Filter
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-[14px] border border-gray-200 bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#f9fafb]">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">File name</th>
                    <th className="w-[99px] px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Format</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Upload date</th>
                    <th className="w-[131px] px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length > 0 ? (
                    filteredRows.map((row) => (
                      <tr key={row.fileName} className="border-b border-gray-200 last:border-b-0">
                        <td className="px-6 py-[19px]">
                          <div className="flex items-center gap-3">
                            <FileIcon />
                            <span className="text-sm font-medium text-[#101828]">{row.fileName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-[17px]">
                          <span className="rounded px-2.5 py-0.5 text-xs font-medium uppercase text-[#008236] bg-[#f0fdf4]">
                            {row.format}
                          </span>
                        </td>
                        <td className="px-6 py-[19px] text-sm text-[#4a5565]">{row.project}</td>
                        <td className="px-6 py-[19px] text-sm text-[#4a5565]">{row.uploadDate}</td>
                        <td className="px-6 py-[17px]">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f0fdf4] px-2.5 py-0.5 text-xs font-medium text-[#008236]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#00c950]" />
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#99a1af]">
                        No files uploaded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
