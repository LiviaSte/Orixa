import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "./icons";

export default function SearchableDropdown({
  value,
  options,
  onChange,
  placeholder,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Outside click detection
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  if (disabled) {
    return (
      <div className="flex w-full items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3.5 py-2 text-sm text-[#9ca3af] cursor-not-allowed">
        <span>{placeholder || "Select..."}</span>
        <ChevronDownIcon />
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-left text-sm transition-colors hover:border-[#d1d5dc] focus:border-[#155dfc] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
        >
          <span className={value ? "text-[#111318]" : "text-[#9ca3af]"}>
            {value || placeholder || "Select..."}
          </span>
          <ChevronDownIcon />
        </button>
      ) : (
        <div className="flex w-full items-center gap-2 rounded-lg border border-[#155dfc] bg-white px-3.5 py-2 ring-1 ring-[#155dfc]">
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="shrink-0 text-[#9ca3af]"
          >
            <path
              d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
              stroke="currentColor"
              strokeWidth="1.66667"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              value ? `Search (current: ${value})...` : "Type to search..."
            }
            className="w-full bg-transparent text-sm text-[#111318] placeholder:text-[#9ca3af] outline-none"
          />
          {value && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setSearch("");
                setOpen(false);
              }}
              className="shrink-0 text-xs font-medium text-[#6a7282] hover:text-[#dc2626]"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-[#e5e7eb] bg-white shadow-lg">
          {filtered.length > 0 ? (
            filtered.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                  setSearch("");
                }}
                className={`flex w-full items-center px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-[#f9fafb] ${
                  value === option
                    ? "bg-[#eff6ff] font-medium text-[#135bec]"
                    : "text-[#4a5565]"
                }`}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-3.5 py-3 text-center text-sm text-[#9ca3af]">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
