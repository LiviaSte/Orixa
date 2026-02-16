import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import Sidebar from "../components/Sidebar";
import {
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

// ── Inline SVG icons for file uploader ──────────────────────────
function FileDocIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4C6 3.44772 6.44772 3 7 3H13L19 9V20C19 20.5523 18.5523 21 18 21H7C6.44772 21 6 20.5523 6 20V4Z" stroke="#6a7282" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M13 3V9H19" stroke="#6a7282" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2V6" stroke="#6a7282" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 18V22" stroke="#6a7282" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <path d="M4.93 4.93L7.76 7.76" stroke="#6a7282" strokeWidth="2" strokeLinecap="round" opacity="0.85"/>
      <path d="M16.24 16.24L19.07 19.07" stroke="#6a7282" strokeWidth="2" strokeLinecap="round" opacity="0.2"/>
      <path d="M2 12H6" stroke="#6a7282" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <path d="M18 12H22" stroke="#6a7282" strokeWidth="2" strokeLinecap="round" opacity="0.1"/>
      <path d="M4.93 19.07L7.76 16.24" stroke="#6a7282" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M16.24 7.76L19.07 4.93" stroke="#6a7282" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

function WarningFillIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.57 2.998L1.514 15.001A1.667 1.667 0 003.002 17.5h14.006a1.667 1.667 0 001.42-2.499L11.44 2.998a1.667 1.667 0 00-2.87 0z" fill="#f14a58"/>
      <path d="M10 7.5V10.833" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="13.333" r="0.833" fill="white"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4L12 12M4 12L12 4" stroke="#6a7282" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function UploadCloudIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.333 28.333a8.333 8.333 0 01-1.086-16.587 11.667 11.667 0 0122.756 2.584 6.667 6.667 0 01-1.67 13.112" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 21.667V35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
      <path d="M15 26.667L20 21.667L25 26.667" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Uploader states ─────────────────────────────────────────────
// "idle" | "hover" | "dragging-page" | "dragging-input" | "has-file" | "uploading" | "error-empty" | "error-file" | "error-uploading"

export default function CongressUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploaderState, setUploaderState] = useState("idle"); // tracks visual state
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const ALLOWED_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ];
  const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB

  function validateFile(f) {
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_TYPES.includes(f.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return "Invalid file format. Please upload .xlsx or .csv files only.";
    }
    if (f.size > MAX_SIZE) {
      return "File exceeds 100MB limit. Please upload a smaller file.";
    }
    return null;
  }

  function acceptFile(f) {
    const validationError = validateFile(f);
    if (validationError) {
      setFile(f);
      setErrorMessage(validationError);
      setUploaderState("error-file");
    } else {
      setFile(f);
      setErrorMessage("");
      setUploaderState("has-file");
    }
  }

  function clearFile() {
    setFile(null);
    setErrorMessage("");
    setUploaderState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Drag handlers ──
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setUploaderState("dragging-page");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if cursor is over the drop zone
    if (dropRef.current && dropRef.current.contains(e.target)) {
      setUploaderState("dragging-input");
    } else {
      setUploaderState("dragging-page");
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if leaving the main content area
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (!file) {
        setUploaderState("idle");
      } else {
        setUploaderState(errorMessage ? "error-file" : "has-file");
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      acceptFile(droppedFiles[0]);
    } else {
      setUploaderState(file ? (errorMessage ? "error-file" : "has-file") : "idle");
    }
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) {
      acceptFile(selected[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // If there's a validation error, don't proceed
    if (errorMessage) return;

    setUploaderState("uploading");
    setErrorMessage("");

    try {
      const { columns, totalRows } = await parseFile(file);
      navigate("/upload/congress/mapping", { state: { columns, totalRows } });
    } catch (err) {
      setErrorMessage(err.message || "Failed to process the file. Please try again.");
      setUploaderState("error-uploading");
    }
  };

  // ── Compute styles from state ──
  const isError = uploaderState === "error-empty" || uploaderState === "error-file" || uploaderState === "error-uploading";
  const hasFileSelected = uploaderState === "has-file" || uploaderState === "error-file";
  const isUploading = uploaderState === "uploading" || uploaderState === "error-uploading";
  const isDragging = uploaderState === "dragging-page" || uploaderState === "dragging-input";

  function getDropZoneClasses() {
    const base = "flex flex-col items-center justify-center gap-4 rounded-lg px-8 py-16 transition-all w-full";

    switch (uploaderState) {
      case "idle":
        return `${base} border-2 border-dashed border-[#9ca3af] bg-white`;
      case "hover":
        return `${base} border-2 border-dashed border-[#6a7282] bg-white`;
      case "dragging-page":
        return `${base} border-2 border-dashed border-[#155dfc] bg-[#f8f8ff]`;
      case "dragging-input":
        return `${base} border-2 border-solid border-[#155dfc] bg-[#f8f8ff]`;
      case "has-file":
        return `${base} border border-solid border-[#9ca3af] bg-white`;
      case "uploading":
        return `${base} border border-solid border-[#9ca3af] bg-white`;
      case "error-empty":
        return `${base} border-2 border-dashed border-[#f14a58] bg-white`;
      case "error-file":
        return `${base} border border-solid border-[#f14a58] bg-white`;
      case "error-uploading":
        return `${base} border border-solid border-[#f14a58] bg-white`;
      default:
        return `${base} border-2 border-dashed border-[#9ca3af] bg-white`;
    }
  }

  return (
    <div className="flex h-screen w-full bg-[#f7f8fa] font-['Inter',sans-serif]">
      <Sidebar />

      <main
        className="flex-1 overflow-auto p-8"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col gap-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/?tab=databases" className="text-[#6a7282] transition-colors hover:text-[#155dfc]">
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
            <div className="flex flex-1 flex-col gap-4">
              {/* Label */}
              <p className="text-xs font-semibold text-[#6a7282]">Upload file</p>

              {/* Drop zone */}
              <div
                ref={dropRef}
                className={getDropZoneClasses()}
                onMouseEnter={() => {
                  if (uploaderState === "idle") setUploaderState("hover");
                }}
                onMouseLeave={() => {
                  if (uploaderState === "hover") setUploaderState("idle");
                }}
              >
                {/* Uploading state */}
                {isUploading && (
                  <div className="flex items-center gap-3">
                    <SpinnerIcon />
                    <span className="text-sm text-[#6a7282]">Uploading...</span>
                  </div>
                )}

                {/* File selected state (not uploading) */}
                {hasFileSelected && !isUploading && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <FileDocIcon />
                        <span className="text-sm text-[#0a0a0a]">{file?.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile();
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                      >
                        <XIcon />
                      </button>
                    </div>
                    <p className="text-xs text-[#6a7282]">
                      <span>Drag and drop your file here or </span>
                      <button
                        onClick={handleBrowse}
                        className="text-[#155dfc] underline transition-colors hover:text-[#1247cc]"
                      >
                        Browse files
                      </button>
                    </p>
                  </>
                )}

                {/* Empty states (idle, hover, dragging, error-empty) */}
                {!hasFileSelected && !isUploading && (
                  <>
                    <UploadCloudIcon />
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-sm text-[#0a0a0a]">Drag and drop your file here</p>
                      <p className="text-xs text-[#6a7282]">or</p>
                    </div>
                    <button
                      onClick={handleBrowse}
                      className="rounded-full bg-[#dee2ec]/60 px-4 py-2 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#dee2ec]"
                    >
                      Browse files
                    </button>
                  </>
                )}
              </div>

              {/* Error message */}
              {isError && errorMessage && (
                <div className="flex items-center gap-1.5 pl-4">
                  <WarningFillIcon />
                  <p className="text-xs text-[#b1000f]">{errorMessage}</p>
                </div>
              )}

              {/* Assistive text (when no error) */}
              {!isError && (
                <p className="pl-4 text-xs text-[#6a7282]">
                  Supported formats: Excel (.xlsx), CSV (.csv). Maximum file size: 100MB.
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Upload button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading || isError}
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
