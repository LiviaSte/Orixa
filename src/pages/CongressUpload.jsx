import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import Sidebar from "../components/Sidebar";
import {
  UploadIcon,
  InfoIcon,
  DownloadIcon,
  ArrowRightIcon,
} from "../components/icons";

const dataRequirements = [
  { field: "HCP name", example: "Eg. John Smith" },
  { field: "Email", example: "Eg. john_smith@gmail.com" },
  { field: "Account name", example: "Eg. Sinai hospital" },
  { field: "Sales rep name", example: "Eg. Mike Oslon" },
];

function detectType(values) {
  for (const v of values) {
    if (v == null || v === "") continue;
    if (typeof v === "number" || (typeof v === "string" && v !== "" && !isNaN(Number(v)))) {
      return "number";
    }
    if (typeof v === "boolean") return "boolean";
    if (v instanceof Date) return "date";
    return "string";
  }
  return "string";
}

function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (json.length === 0) {
          reject(new Error("The file is empty or has no data rows."));
          return;
        }

        const headers = Object.keys(json[0]);
        const columns = headers.map((header) => {
          const columnValues = json.map((row) => row[header]);
          const firstNonEmpty = columnValues.find((v) => v != null && v !== "");
          return {
            fileColumn: header,
            type: detectType(columnValues),
            preview: firstNonEmpty != null ? String(firstNonEmpty) : "",
          };
        });

        resolve({ columns, totalRows: json.length });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsArrayBuffer(file);
  });
}

export default function CongressUpload() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const { columns, totalRows } = await parseFile(files[0]);
      navigate("/upload/congress/mapping", { state: { columns, totalRows } });
    } catch {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main className="flex-1 overflow-auto p-8">
        <div className="flex flex-col gap-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-[#6a7282] transition-colors hover:text-[#155dfc]">
              Data sources
            </Link>
            <span className="text-[#6a7282]">/</span>
            <span className="text-[#101828]">Upload database</span>
          </nav>

          {/* Page header */}
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-medium leading-9 text-[#0a0a0a]">Congress</h1>
            <p className="max-w-[700px] text-base leading-6 text-[#4a5565]">
              Upload your congress dataset to augment your automated pipeline. Ensure your files meet
              the validation standards to maintain data integrity across the platform.
            </p>
          </div>

          {/* Content area */}
          <div className="flex items-start gap-10">
            {/* Data requirements card */}
            <div className="flex w-[280px] shrink-0 flex-col gap-6 rounded-[14px] border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <InfoIcon />
                <h3 className="text-lg font-semibold text-[#0a0a0a]">Data requirements</h3>
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#6a7282]">
                Your file should include:
              </p>

              <div className="flex flex-col gap-6">
                {dataRequirements.map((req) => (
                  <div key={req.field} className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-[#0a0a0a]">{req.field}</p>
                    <p className="text-sm italic text-[#6a7282]">{req.example}</p>
                  </div>
                ))}
              </div>

              <button className="flex items-center gap-2.5 rounded-[10px] border border-[#d1d5dc] bg-white p-2.5 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50">
                <DownloadIcon />
                Download sample
              </button>
            </div>

            {/* Upload area */}
            <div className="flex flex-1 flex-col gap-6">
              <div
                className={`flex flex-1 flex-col items-center justify-center gap-5 rounded-[14px] border-2 border-dashed bg-white px-8 py-20 transition-colors ${
                  isDragging ? "border-[#155dfc] bg-blue-50" : "border-[#d1d5dc]"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <UploadIcon />

                <h3 className="text-lg font-medium text-[#101828]">
                  Drag and drop your files here
                </h3>

                <div className="flex flex-col items-center text-sm text-[#6a7282]">
                  <p>Support: Excel (.xlsx), CSV (.csv).</p>
                  <p>Maximum file size: 100MB.</p>
                </div>

                <button
                  onClick={handleBrowse}
                  className="rounded-[10px] border border-[#d1d5dc] bg-white px-6 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-gray-50"
                >
                  Browse files
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />

                {files.length > 0 && (
                  <div className="mt-2 text-sm text-[#4a5565]">
                    {files.length} file{files.length > 1 ? "s" : ""} selected
                  </div>
                )}
              </div>

              {/* Upload button */}
              <div className="flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={files.length === 0 || isUploading}
                  className="flex items-center gap-2 rounded-[10px] bg-[#101828] px-6 py-2.5 text-base font-medium text-white transition-colors hover:bg-[#1d2939] disabled:opacity-50"
                >
                  {isUploading ? "Processing..." : "Upload"}
                  {!isUploading && <ArrowRightIcon />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
