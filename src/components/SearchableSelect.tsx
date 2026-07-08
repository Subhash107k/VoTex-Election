import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

interface SearchableSelectProps {
  id?: string;
  options: string[] | { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
}

export default function SearchableSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "Select option...",
  disabled = false,
  error = "",
  label = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Parse options to a unified { value, label } format
  const parsedOptions = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Soft reset search query and focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const filteredOptions = parsedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = parsedOptions.find((opt) => opt.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div ref={containerRef} className="relative w-full text-left" id={id ? `${id}-container` : undefined}>
      {label && (
        <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
          {label}
        </label>
      )}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-white flex items-center justify-between cursor-pointer transition-all select-none min-h-[38px] ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-slate-900 border-slate-850"
            : isOpen
            ? "border-emerald-500 ring-1 ring-emerald-500/20"
            : error
            ? "border-rose-500/80"
            : "border-slate-800 hover:border-slate-700"
        }`}
        id={id}
      >
        <span className={`text-xs truncate ${!selectedOption ? "text-slate-550" : "text-white"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          {selectedOption && value && !disabled && (
            <button
              onClick={handleClear}
              type="button"
              className="p-0.5 hover:bg-slate-850 rounded-full text-slate-500 hover:text-slate-350 transition-colors"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-slate-900 flex items-center gap-2 bg-slate-900/45">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search option..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-white border-none outline-none focus:ring-0 p-0.5"
            />
          </div>

          <ul className="max-h-48 overflow-y-auto py-1 divide-y divide-slate-900/30">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-400 font-bold"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-3 text-xs text-slate-500 text-center italic">
                No matching results found
              </li>
            )}
          </ul>
        </div>
      )}

      {error && <span className="text-[10px] text-rose-450 mt-1 font-semibold block">{error}</span>}
    </div>
  );
}
