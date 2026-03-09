"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

interface ReferenceTarget {
  type: string; // "exception" | "bylaw-section" | "sasp" | "op-designation"
  id: string;
  zone_code?: string;
  label?: string; // Display label for the panel title
}

interface ReferenceResult {
  found: boolean;
  type: string;
  id: string;
  title?: string;
  text?: string;
  ref?: string;
  source?: string;
  data?: any;
  error?: string;
}

/* ================================================================== */
/*  CONTEXT                                                            */
/* ================================================================== */

interface ReferenceContextValue {
  openReference: (target: ReferenceTarget) => void;
  closeReference: () => void;
  isOpen: boolean;
}

const ReferenceContext = createContext<ReferenceContextValue>({
  openReference: () => {},
  closeReference: () => {},
  isOpen: false,
});

export function useReference() {
  return useContext(ReferenceContext);
}

/* ================================================================== */
/*  PROVIDER (wrap around ZoningReport)                                */
/* ================================================================== */

export function ReferenceProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<ReferenceTarget | null>(null);
  const [result, setResult] = useState<ReferenceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ReferenceTarget[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const openReference = useCallback((t: ReferenceTarget) => {
    setTarget((prev) => {
      if (prev) {
        setHistory((h) => [...h, prev]);
      }
      return t;
    });
    setResult(null);
    setLoading(true);
  }, []);

  const closeReference = useCallback(() => {
    setTarget(null);
    setResult(null);
    setHistory([]);
  }, []);

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setTarget(last);
      setResult(null);
      setLoading(true);
      return prev.slice(0, -1);
    });
  }, []);

  // Fetch reference data when target changes
  useEffect(() => {
    if (!target) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/reference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: target.type,
            id: target.id,
            zone_code: target.zone_code || "",
          }),
        });
        if (!cancelled) {
          const data = await res.json();
          setResult(data);
        }
      } catch {
        if (!cancelled) {
          setResult({ found: false, type: target.type, id: target.id, error: "Network error" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [target]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && target) closeReference();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, closeReference]);

  return (
    <ReferenceContext.Provider
      value={{ openReference, closeReference, isOpen: !!target }}
    >
      {children}

      {/* Backdrop */}
      {target && (
        <div
          className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] transition-opacity"
          onClick={closeReference}
        />
      )}

      {/* Slide-over panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-lg flex-col border-l border-stone-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          target ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {target && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <div className="flex items-center gap-3 min-w-0">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="shrink-0 rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                    title="Back"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                )}
                <div className="min-w-0">
                  <span className="block text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    {typeLabel(target.type)}
                  </span>
                  <h3 className="truncate text-[15px] font-semibold text-stone-900">
                    {target.label || `${typePrefix(target.type)}${target.id}`}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={closeReference}
                className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {loading ? (
                <LoadingSkeleton />
              ) : result?.found ? (
                <ReferenceBody result={result} onNavigate={openReference} />
              ) : (
                <NotFound type={target.type} id={target.id} error={result?.error} />
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-stone-200 px-6 py-3">
              <p className="text-[11px] text-stone-400">
                Source: {result?.source || typeLabel(target.type)}
              </p>
            </div>
          </>
        )}
      </div>
    </ReferenceContext.Provider>
  );
}

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    "bylaw-section": "By-law 569-2013",
    exception: "Exception",
    sasp: "Site & Area Specific Policy",
    "op-designation": "Official Plan Designation",
    "zone-info": "Zone Category",
  };
  return map[type] || type;
}

function typePrefix(type: string): string {
  const map: Record<string, string> = {
    "bylaw-section": "s. ",
    exception: "Exception #",
    sasp: "SASP #",
    "op-designation": "",
    "zone-info": "",
  };
  return map[type] ?? "";
}

/* ================================================================== */
/*  LOADING SKELETON                                                   */
/* ================================================================== */

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-3/4 rounded bg-stone-100" />
      <div className="h-4 w-full rounded bg-stone-100" />
      <div className="h-4 w-5/6 rounded bg-stone-100" />
      <div className="h-4 w-full rounded bg-stone-100" />
      <div className="mt-6 h-4 w-2/3 rounded bg-stone-100" />
      <div className="h-4 w-full rounded bg-stone-100" />
      <div className="h-4 w-4/5 rounded bg-stone-100" />
    </div>
  );
}

/* ================================================================== */
/*  NOT FOUND                                                          */
/* ================================================================== */

function NotFound({
  type,
  id,
  error,
}: {
  type: string;
  id: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
        <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="mt-3 text-[14px] font-medium text-stone-700">
        Reference not found
      </p>
      <p className="mt-1 text-[13px] text-stone-400">
        {error || `Could not find ${typePrefix(type)}${id}`}
      </p>
    </div>
  );
}

/* ================================================================== */
/*  REFERENCE BODY — renders based on type                             */
/* ================================================================== */

function ReferenceBody({
  result,
  onNavigate,
}: {
  result: ReferenceResult;
  onNavigate: (target: ReferenceTarget) => void;
}) {
  switch (result.type) {
    case "bylaw-section":
      return <BylawSectionBody result={result} />;
    case "exception":
      return <ExceptionBody result={result} onNavigate={onNavigate} />;
    case "sasp":
      return <SaspBody result={result} />;
    case "op-designation":
      return <OpDesignationBody result={result} onNavigate={onNavigate} />;
    case "zone-info":
      return <ZoneInfoBody result={result} onNavigate={onNavigate} />;
    default:
      return <GenericBody result={result} />;
  }
}

/* ── By-law Section ─────────────────────────────────────────────────── */

function BylawSectionBody({ result }: { result: ReferenceResult }) {
  return (
    <div className="space-y-4">
      {result.title && (
        <h4 className="text-[14px] font-semibold text-stone-900">
          {result.title}
        </h4>
      )}
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-stone-700">
          {result.text}
        </p>
      </div>
      <div className="flex items-center gap-2 text-[12px] text-stone-400">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        <span>Regulation {result.ref || result.id}</span>
      </div>
    </div>
  );
}

/* ── Exception ──────────────────────────────────────────────────────── */

function ExceptionBody({
  result,
  onNavigate,
}: {
  result: ReferenceResult;
  onNavigate: (target: ReferenceTarget) => void;
}) {
  const exc = result.data;
  if (!exc) return <GenericBody result={result} />;

  const numOverrides = exc.numeric_overrides || {};
  const provisions = exc.annotated_provisions || exc.provisions || [];
  const prevailing = exc.prevailing_bylaws || [];

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="flex flex-wrap gap-3">
        {exc.entry_count && (
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-500">
            {exc.entry_count} {exc.entry_count === 1 ? "entry" : "entries"}
          </span>
        )}
        {exc.has_prevailing_bylaws && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
            Prevailing by-laws
          </span>
        )}
        {exc.has_site_specific_provisions && (
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-medium text-violet-700">
            Site-specific
          </span>
        )}
      </div>

      {/* Numeric overrides */}
      {Object.keys(numOverrides).length > 0 && (
        <div>
          <h5 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
            Numeric Overrides
          </h5>
          <div className="space-y-1.5">
            {Object.entries(numOverrides).map(([key, val]: [string, any]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2"
              >
                <span className="text-[13px] text-stone-600">
                  {val?.label || key}
                </span>
                <span className="text-[14px] font-semibold text-stone-900">
                  {val?.value ?? val}
                  {val?.unit ? ` ${val.unit}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Annotated provisions */}
      {provisions.length > 0 && (
        <div>
          <h5 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
            Provisions ({provisions.length})
          </h5>
          <div className="space-y-3">
            {provisions.map((p: any, i: number) => (
              <div key={i} className="rounded-lg border border-stone-200 bg-white p-3.5">
                <div className="flex items-start gap-2.5">
                  {p.letter && (
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-stone-900 text-[10px] font-bold text-white">
                      {p.letter}
                    </span>
                  )}
                  <p className="flex-1 whitespace-pre-wrap text-[13px] leading-relaxed text-stone-700">
                    {p.text || p}
                  </p>
                </div>

                {/* Regulation refs inside provision — clickable */}
                {p.regulation_refs?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.regulation_refs.map((r: any, j: number) => (
                      <button
                        key={j}
                        type="button"
                        onClick={() =>
                          onNavigate({
                            type: "bylaw-section",
                            id: r.ref,
                            label: `s. ${r.ref}${r.preview_title ? ` — ${r.preview_title}` : ""}`,
                          })
                        }
                        className="rounded border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] font-medium text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-900"
                      >
                        s. {r.ref}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prevailing by-laws */}
      {prevailing.length > 0 && (
        <div>
          <h5 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
            Prevailing By-laws
          </h5>
          <div className="space-y-1.5">
            {prevailing.map((pbl: any, i: number) => (
              <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-[13px] text-amber-800">
                {typeof pbl === "string" ? pbl : pbl.text || JSON.stringify(pbl)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By-law amendments */}
      {exc.bylaw_amendments?.length > 0 && (
        <div>
          <h5 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
            Amended By
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {exc.bylaw_amendments.map((bl: string, i: number) => (
              <button
                type="button"
                key={i}
                onClick={() =>
                  onNavigate({
                    type: "exception",
                    id: exc.exception_number?.toString() || bl,
                    label: bl,
                  })
                }
                className="rounded border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] font-medium text-stone-500 cursor-pointer hover:border-stone-300 hover:bg-stone-100 transition-colors"
              >
                {bl}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── SASP ───────────────────────────────────────────────────────────── */

function SaspBody({ result }: { result: ReferenceResult }) {
  const sasp = result.data;
  if (!sasp) return <GenericBody result={result} />;

  return (
    <div className="space-y-4">
      {sasp.title && (
        <h4 className="text-[14px] font-semibold text-stone-900">
          {sasp.title}
        </h4>
      )}
      <div className="flex items-center gap-2 text-[12px]">
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-700">
          SASP #{sasp.sasp_no || result.id}
        </span>
        {sasp.source_pdf && (
          <span className="text-stone-400">{sasp.source_pdf}</span>
        )}
      </div>
      {sasp.policy_summary && (
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-stone-700">
            {sasp.policy_summary}
          </p>
        </div>
      )}
      {sasp.key_provisions?.length > 0 && (
        <div>
          <h5 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
            Key Provisions
          </h5>
          <ul className="space-y-1.5">
            {sasp.key_provisions.map((p: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[13px] text-stone-600"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── OP Designation ─────────────────────────────────────────────────── */

function OpDesignationBody({
  result,
  onNavigate,
}: {
  result: ReferenceResult;
  onNavigate: (target: ReferenceTarget) => void;
}) {
  const des = result.data;
  if (!des) return <GenericBody result={result} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h4 className="text-[14px] font-semibold text-stone-900">
          {des.designation}
        </h4>
        {des.confidence && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            des.confidence === "high" ? "bg-emerald-100 text-emerald-700"
              : des.confidence === "medium" ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-700"
          }`}>
            {des.confidence}
          </span>
        )}
      </div>
      {des.section && (
        <button
          type="button"
          onClick={() =>
            onNavigate({
              type: "op-designation",
              id: des.section,
              label: `OP s. ${des.section}`,
            })
          }
          className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-500 cursor-pointer hover:bg-stone-200 transition-colors"
        >
          OP s. {des.section}
        </button>
      )}
      {des.caveat && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-[12px] leading-relaxed text-amber-700">
            <span className="mr-1" aria-hidden="true">⚠</span>{des.caveat}
          </p>
        </div>
      )}
      {des.alternate_designations?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-stone-400">Possible alternates:</span>
          {des.alternate_designations.map((alt: string) => (
            <span key={alt} className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 border border-stone-200">{alt}</span>
          ))}
        </div>
      )}
      {des.description && (
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-stone-700">
            {des.description}
          </p>
        </div>
      )}
      {des.policy_highlights?.length > 0 && (
        <div>
          <h5 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
            Policy Highlights
          </h5>
          <ul className="space-y-1.5">
            {des.policy_highlights.map((h: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[13px] text-stone-600"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Zone Info ───────────────────────────────────────────────────────── */

function ZoneInfoBody({
  result,
  onNavigate,
}: {
  result: ReferenceResult;
  onNavigate: (target: ReferenceTarget) => void;
}) {
  const info = result.data as {
    zone_code: string;
    zone_prefix: string;
    description: string;
    section_ref: string;
    sections: { ref: string; label: string; title: string; text: string }[];
  } | undefined;
  if (!info) return <GenericBody result={result} />;

  const labelMap: Record<string, string> = {
    general: "General",
    permitted_use: "Permitted Uses",
    building_requirements: "Building Requirements",
    height: "Height",
    floor_area: "Floor Area",
    setbacks: "Setbacks",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="rounded-lg bg-stone-900 px-3 py-1 text-[13px] font-bold tracking-wide text-white">
          {info.zone_prefix}
        </span>
        <span className="text-[13px] font-medium text-stone-600">
          {info.description}
        </span>
      </div>

      <p className="text-[12px] text-stone-400">
        By-law 569-2013 ·{" "}
        <button
          type="button"
          onClick={() =>
            onNavigate({
              type: "bylaw-section",
              id: info.section_ref,
              label: `s. ${info.section_ref}`,
            })
          }
          className="text-stone-500 underline decoration-dotted cursor-pointer hover:text-stone-700 transition-colors"
        >
          Section {info.section_ref}
        </button>
      </p>

      {/* Sections grid */}
      <div className="space-y-3">
        {info.sections.map((sec) => (
          <button
            type="button"
            key={sec.ref}
            onClick={() =>
              onNavigate({
                type: "bylaw-section",
                id: sec.ref,
                label: `s. ${sec.ref}`,
              })
            }
            className="block w-full rounded-lg border border-stone-200 bg-stone-50 p-3 text-left transition-colors hover:border-stone-300 hover:bg-stone-100"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-stone-700">
                {labelMap[sec.label] || sec.title || sec.label}
              </span>
              <span className="font-mono text-[11px] text-stone-400">
                s. {sec.ref}
              </span>
            </div>
            {sec.text && (
              <p className="mt-1 text-[11px] leading-relaxed text-stone-500 line-clamp-2">
                {sec.text}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Generic fallback ───────────────────────────────────────────────── */

function GenericBody({ result }: { result: ReferenceResult }) {
  return (
    <div className="space-y-4">
      {result.title && (
        <h4 className="text-[14px] font-semibold text-stone-900">
          {result.title}
        </h4>
      )}
      {result.text && (
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-stone-700">
            {result.text}
          </p>
        </div>
      )}
      {result.data && !result.text && (
        <pre className="rounded-lg bg-stone-50 p-4 text-[12px] text-stone-600 overflow-auto">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

/* ================================================================== */
/*  RefLink — the clickable wrapper                                    */
/* ================================================================== */

export function RefLink({
  type,
  id,
  zone_code,
  label,
  children,
  className = "",
}: {
  type: string;
  id: string;
  zone_code?: string;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  const { openReference } = useReference();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openReference({ type, id, zone_code, label });
      }}
      className={`inline-flex items-center gap-0.5 border-b border-dashed border-stone-400/50 text-inherit transition-colors hover:border-stone-600 hover:text-stone-900 ${className}`}
      title={`View ${typeLabel(type)}: ${label || id}`}
    >
      {children}
    </button>
  );
}
