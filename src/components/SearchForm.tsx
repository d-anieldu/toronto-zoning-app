"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, MapPin, Layers, FileText, Ruler, Car, RefreshCw, AlertCircle } from "lucide-react";
import ZoningReport from "./ZoningReport";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZoningData = Record<string, any>;

const ALL_EXAMPLE_ADDRESSES = [
  "226 Viewmount Ave",
  "100 Queen St W",
  "671 St Clair Ave W",
  "89 Argyle St",
  "25 The Esplanade",
  "250 Davisville Ave",
  "50 Eglinton Ave E",
  "2300 Yonge St",
  "1 Dundas St W",
  "555 University Ave",
  "150 Balmoral Ave",
  "1200 Lawrence Ave W",
  "33 Harbour Square",
  "100 Floral Pkwy",
  "1 Carlaw Ave",
  "300 Borough Dr",
  "5150 Dundas St W",
  "401 Richmond St W",
  "77 King St W",
  "10 York St",
  "30 Roehampton Ave",
  "2055 Danforth Ave",
  "446 Roselawn Ave",
  "1 Austin Terrace",
];

export default function SearchForm() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ZoningData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pick 4 random example addresses, reshuffled on each refreshKey change
  const exampleAddresses = useMemo(() => {
    const shuffled = [...ALL_EXAMPLE_ADDRESSES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch suggestions from backend
  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSuggestLoading(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        const items: string[] = (data.suggestions || []).map((s: string) => {
          // Strip ", CAN" suffix for cleaner display
          return s.replace(/,\s*CAN$/i, "").trim();
        });
        setSuggestions(items);
        setShowSuggestions(items.length > 0);
        setHighlightIdx(-1);
      }
    } catch {
      // Silently fail — autocomplete is non-critical
    } finally {
      setSuggestLoading(false);
    }
  }, []);

  // Debounced input handler
  function handleInputChange(value: string) {
    setAddress(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 200);
  }

  // Select a suggestion
  const selectSuggestion = useCallback((suggestion: string) => {
    // Extract just the street address portion (before first comma) for the input
    const streetAddress = suggestion.split(",")[0].trim();
    setAddress(streetAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightIdx(-1);
    inputRef.current?.focus();
  }, []);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightIdx]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightIdx(-1);
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function handleSubmit(e?: React.FormEvent, overrideAddress?: string) {
    e?.preventDefault();
    const lookupAddr = overrideAddress || address;
    if (!lookupAddr.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: lookupAddr.trim(), include_parcel: true, include_nearby: false, include_policy: false }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || `Lookup failed (${res.status})`);
      }

      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFill(addr: string) {
    setAddress(addr);
    setSuggestions([]);
    setShowSuggestions(false);
    handleSubmit(undefined, addr);
  }

  return (
    <div>
      {/* Search bar — centered */}
      <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              ref={inputRef}
              type="text"
              value={address}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Enter a Toronto address — e.g. 226 Viewmount Ave"
              className="w-full rounded-xl border border-stone-300 bg-[var(--card)] py-3.5 pl-10 pr-4 text-[15px] text-[var(--text-primary)] shadow-sm placeholder:text-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              disabled={loading}
              autoComplete="off"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-autocomplete="list"
              aria-controls="address-suggestions"
            />

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={dropdownRef}
                id="address-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg"
              >
                {suggestions.map((s, i) => {
                  const parts = s.split(",");
                  const street = parts[0];
                  const rest = parts.slice(1).join(",").trim();
                  return (
                    <button
                      key={s}
                      type="button"
                      role="option"
                      aria-selected={i === highlightIdx}
                      onClick={() => selectSuggestion(s)}
                      onMouseEnter={() => setHighlightIdx(i)}
                      className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                        i === highlightIdx
                          ? "bg-stone-100"
                          : "hover:bg-stone-50"
                      } ${i > 0 ? "border-t border-[var(--border)]" : ""}`}
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                      <span className="min-w-0 flex-1">
                        <span className="text-[13px] font-medium text-[var(--text-primary)]">
                          {street}
                        </span>
                        {rest && (
                          <span className="text-[12px] text-[var(--text-muted)]">
                            {", "}
                            {rest}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
                {suggestLoading && (
                  <div className="flex items-center gap-2 border-t border-[var(--border)] px-3.5 py-2 text-[12px] text-[var(--text-muted)]">
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Loading…
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="rounded-xl bg-[var(--text-primary)] px-6 py-3.5 text-[14px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Looking up…
              </span>
            ) : (
              "Look up"
            )}
          </button>
        </div>

        {/* Quick-fill examples */}
        {!data && !loading && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Try:
            </span>
            {exampleAddresses.map((addr) => (
              <button
                key={addr}
                type="button"
                onClick={() => handleQuickFill(addr)}
                className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[12px] text-[var(--text-secondary)] transition-colors hover:border-stone-400 hover:text-[var(--text-primary)]"
              >
                {addr}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="rounded-full border border-[var(--border)] bg-[var(--card)] px-1.5 py-1 text-[12px] text-[var(--text-muted)] transition-colors hover:border-stone-400 hover:text-[var(--text-secondary)]"
              title="Shuffle addresses"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </form>

      {/* Loading state — educational, shows what's happening */}
      {loading && (
        <div className="mt-10 max-w-4xl mx-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-2 border-[var(--border)]" />
              <div className="absolute inset-0 h-14 w-14 animate-spin rounded-full border-2 border-transparent border-t-[var(--text-primary)]" />
            </div>
            <p className="font-heading mt-5 text-[16px] font-semibold text-[var(--text-primary)]">
              Resolving zoning profile…
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">
              This typically takes 3–8 seconds
            </p>
          </div>

          {/* Step-by-step progress visualization */}
          <div className="mt-8 space-y-3">
            {[
              { label: "Geocoding address & identifying parcel", Icon: MapPin },
              { label: "Querying 19 GIS overlay layers", Icon: Layers },
              { label: "Resolving exception overrides from 6,063 entries", Icon: FileText },
              { label: "Computing effective standards & development potential", Icon: Ruler },
              { label: "Generating parking, loading, and amenity requirements", Icon: Car },
            ].map((step, i) => (
              <div
                key={step.label}
                className="flex items-center gap-3 rounded-lg bg-stone-50 px-4 py-2.5 animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                <step.Icon className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-[12px] font-medium text-[var(--text-secondary)]">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 max-w-4xl mx-auto rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-red-500" />
            <div>
              <p className="text-[13px] font-semibold text-red-700">
                Lookup failed
              </p>
              <p className="mt-0.5 text-[13px] text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {data && !loading && <ZoningReport data={data} />}
    </div>
  );
}
