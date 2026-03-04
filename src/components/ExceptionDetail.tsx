"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useRef, useState } from "react";
import { RefLink } from "./ReferencePanel";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

interface RegulationRef {
  ref: string;
  base: string;
  sub?: string;
  chapter?: string;
  url?: string;
  filename?: string;
  preview_title?: string;
  preview_text?: string;
}

interface BylawRef {
  ref: string;
  number: string;
  year: string;
  url: string;
}

interface DiagramRef {
  type: string;
  id: string;
  label: string;
  bylaw?: string;
  url?: string;
  page?: number;
}

interface NumericValue {
  value: number;
  unit: string;
  label: string;
  raw: string;
}

interface DefinitionRef {
  term: string;
  chapter: string;
  url?: string;
}

interface AnnotatedProvision {
  index: number;
  letter: string | null;
  text: string;
  regulation_refs?: RegulationRef[];
  bylaw_refs?: BylawRef[];
  diagram_refs?: DiagramRef[];
  numeric_values?: NumericValue[];
  definitions_referenced?: DefinitionRef[];
  despite_refs?: string[];
}

interface PrevailingBylawEntry {
  text: string;
  letter?: string | null;
  none_apply?: boolean;
  sections?: string[];
  prevailing_bylaw?: {
    number: string;
    municipality: string;
    year?: string;
    url?: string;
  };
  establishing_bylaw?: {
    ref: string;
    number?: string;
    year?: string;
    url?: string;
  };
  establishing_bylaws?: {
    ref: string;
    number?: string;
    year?: string;
    url?: string;
  }[];
}

interface BylawSupplementSection37 {
  letter: string;
  text: string;
}

interface BylawSupplement {
  has_section_37?: boolean;
  has_schedule_a?: boolean;
  section_37?: BylawSupplementSection37[];
  schedule_a_text?: string;
  schedule_a_summary?: string;
  lands_description?: string;
  zone_amendment?: string;
  pdf_provision_count?: number;
  total_pages?: number;
  diagrams_found?: string[];
}

interface ExceptionData {
  exception_number: number;
  has_site_specific_provisions?: boolean;
  has_prevailing_bylaws?: boolean;
  numeric_overrides?: Record<string, number>;
  text_extracted_overrides?: Record<string, number>;
  provisions?: string[];
  annotated_provisions?: AnnotatedProvision[];
  annotated_prevailing?: PrevailingBylawEntry[];
  bylaw_amendments?: string[];
  bylaw_supplement?: BylawSupplement;
}

interface DiffEntry {
  label: string;
  base: number | null;
  effective: number | null;
  unit: string;
  direction: "increased" | "decreased" | "set" | "removed" | "unchanged" | "changed";
  base_display: string;
  effective_display: string;
}

/* ================================================================== */
/*  SMALL COMPONENTS                                                   */
/* ================================================================== */

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "active" | "warning" | "danger" | "info";
}) {
  const styles = {
    default: "border-stone-200 bg-stone-50 text-stone-600",
    active: "border-stone-300 bg-stone-100 text-stone-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    info: "border-sky-200 bg-sky-50 text-sky-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      className="inline-block h-3 w-3 ml-0.5 -mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  );
}

/* ================================================================== */
/*  REGULATION PREVIEW POPOVER                                         */
/* ================================================================== */

function RegulationPopover({
  title,
  text,
  visible,
}: {
  title?: string;
  text: string;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 max-w-[90vw] pointer-events-none">
      <div className="rounded-lg border border-sky-200 bg-white shadow-lg ring-1 ring-sky-100/50 p-3">
        {title && (
          <p className="text-[11px] font-semibold text-sky-800 mb-1">
            {title}
          </p>
        )}
        <p className="text-[11px] leading-relaxed text-stone-600 whitespace-pre-line">
          {text}
        </p>
      </div>
      {/* Arrow */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 border-b border-r border-sky-200 bg-white" />
    </div>
  );
}

/* ================================================================== */
/*  REGULATION LINK                                                    */
/* ================================================================== */

function RegulationLink({ reg }: { reg: RegulationRef }) {
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasPreview = !!reg.preview_text;

  const showPopover = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHovered(true);
  };
  const hidePopover = () => {
    timerRef.current = setTimeout(() => setHovered(false), 120);
  };

  const pill = reg.url ? (
    <a
      href={reg.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 rounded bg-sky-50 border border-sky-200 px-1.5 py-0.5 text-[11px] font-mono font-medium text-sky-700 hover:bg-sky-100 hover:text-sky-800 transition-colors"
      title={hasPreview ? undefined : `View regulation ${reg.ref} in Chapter ${reg.chapter}`}
    >
      {reg.ref}
      <ExternalLinkIcon />
    </a>
  ) : (
    <span className="inline-flex items-center rounded bg-stone-50 border border-stone-200 px-1.5 py-0.5 text-[11px] font-mono font-medium text-stone-600">
      {reg.ref}
    </span>
  );

  if (!hasPreview) return pill;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={showPopover}
      onMouseLeave={hidePopover}
      onFocus={showPopover}
      onBlur={hidePopover}
    >
      <RegulationPopover
        title={reg.preview_title}
        text={reg.preview_text!}
        visible={hovered}
      />
      {pill}
    </span>
  );
}

/* ================================================================== */
/*  BYLAW LINK                                                         */
/* ================================================================== */

function BylawLink({ bylaw }: { bylaw: BylawRef }) {
  return (
    <a
      href={bylaw.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors"
      title={`View By-law ${bylaw.ref} (PDF)`}
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
      </svg>
      By-law {bylaw.ref}
      <ExternalLinkIcon />
    </a>
  );
}

/* ================================================================== */
/*  DIAGRAM LINK                                                       */
/* ================================================================== */

function DiagramLink({ diagram }: { diagram: DiagramRef }) {
  if (diagram.url) {
    return (
      <a
        href={diagram.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded bg-violet-50 border border-violet-200 px-2 py-0.5 text-[11px] font-medium text-violet-700 hover:bg-violet-100 transition-colors"
        title={`View ${diagram.label}${diagram.bylaw ? ` from By-law ${diagram.bylaw}` : ""}${diagram.page ? ` (page ${diagram.page})` : ""} (PDF)`}
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
        {diagram.label}
        {diagram.page && (
          <span className="text-violet-400 text-[10px]">p.{diagram.page}</span>
        )}
        <ExternalLinkIcon />
      </a>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-violet-50 border border-violet-200 px-2 py-0.5 text-[11px] font-medium text-violet-600">
      {diagram.label}
    </span>
  );
}

/* ================================================================== */
/*  DEFINITION TAG                                                     */
/* ================================================================== */

function DefinitionTag({ def: d }: { def: DefinitionRef }) {
  if (d.url) {
    return (
      <a
        href={d.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
        title={`Definition: ${d.term} (Chapter ${d.chapter})`}
      >
        <span className="text-emerald-500">§</span>
        {d.term}
      </a>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-stone-50 border border-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">
      <span>§</span>
      {d.term}
    </span>
  );
}

/* ================================================================== */
/*  EXCEPTION DIFF TABLE                                               */
/* ================================================================== */

/* ================================================================== */
/*  PREVAILING BY-LAWS PANEL                                           */
/* ================================================================== */

function PrevailingBylawEntry({ entry }: { entry: PrevailingBylawEntry }) {
  if (entry.none_apply) {
    return (
      <div className="flex items-center gap-2 py-1.5 text-[12px] text-stone-400 italic">
        {entry.letter && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-bold text-stone-400">
            {entry.letter}
          </span>
        )}
        <span>None apply</span>
        {entry.establishing_bylaw?.url && (
          <a
            href={entry.establishing_bylaw.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-500 hover:text-sky-700"
          >
            (By-law {entry.establishing_bylaw.ref})
          </a>
        )}
      </div>
    );
  }

  const pbl = entry.prevailing_bylaw;
  const ebl = entry.establishing_bylaw;
  const ebls = entry.establishing_bylaws;

  return (
    <div className="rounded-lg border border-stone-100 bg-white p-3 hover:border-stone-200 transition-colors">
      <div className="flex items-start gap-2.5">
        {entry.letter && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-600">
            {entry.letter}
          </span>
        )}
        <div className="flex-1 min-w-0">
          {/* Prevailing by-law reference */}
          {pbl && (
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-[12px] font-semibold text-stone-700">
                By-law {pbl.number}
              </span>
              {pbl.municipality && (
                <span className="text-[11px] text-stone-400">
                  ({pbl.municipality})
                </span>
              )}
              {pbl.url && (
                <a
                  href={pbl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-500 hover:text-sky-600"
                >
                  <ExternalLinkIcon />
                </a>
              )}
            </div>
          )}

          {/* Sections */}
          {entry.sections && entry.sections.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {entry.sections.map((s, i) => (
                <RefLink
                  key={i}
                  type="bylaw-section"
                  id={s}
                  label={`§ ${s}`}
                >
                  <span className="inline-flex items-center rounded bg-sky-50 border border-sky-200 px-1.5 py-0.5 text-[10px] font-mono font-medium text-sky-700 cursor-pointer hover:bg-sky-100 transition-colors">
                    § {s}
                  </span>
                </RefLink>
              ))}
            </div>
          )}

          {/* Establishing by-law(s) */}
          {ebl && (
            <div className="text-[11px] text-stone-400">
              Established by{" "}
              {ebl.url ? (
                <a
                  href={ebl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-500 hover:text-stone-700 underline decoration-dotted"
                >
                  By-law {ebl.ref}
                  <ExternalLinkIcon />
                </a>
              ) : (
                <span className="text-stone-500">By-law {ebl.ref}</span>
              )}
            </div>
          )}
          {ebls && ebls.length > 0 && (
            <div className="text-[11px] text-stone-400">
              Established by{" "}
              {ebls.map((eb, i) => (
                <span key={i}>
                  {i > 0 && ", "}
                  {eb.url ? (
                    <a
                      href={eb.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-500 hover:text-stone-700 underline decoration-dotted"
                    >
                      By-law {eb.ref}
                    </a>
                  ) : (
                    <span className="text-stone-500">By-law {eb.ref}</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Fallback: show raw text if no structured data */}
          {!pbl && !entry.none_apply && (
            <p className="text-[12px] text-stone-600">{entry.text}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PrevailingBylawsPanel({ entries }: { entries: PrevailingBylawEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const nonEmpty = entries.filter((e) => !e.none_apply);
  const allNoneApply = nonEmpty.length === 0;

  return (
    <div className="mb-5 rounded-lg border border-sky-100 bg-gradient-to-br from-sky-50/60 to-white p-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-sky-600">
            Prevailing By-laws
          </p>
          <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-600">
            {entries.length}
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-sky-300 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {allNoneApply ? (
            <p className="text-[12px] italic text-stone-400">No prevailing by-laws apply.</p>
          ) : (
            entries.map((entry, i) => (
              <PrevailingBylawEntry key={i} entry={entry} />
            ))
          )}
          <p className="mt-2 text-[10px] text-stone-400 leading-relaxed">
            Prevailing by-laws are provisions from former municipality zoning by-laws that continue to apply
            to this property despite the adoption of City-wide By-law 569-2013.
          </p>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  BYLAW SUPPLEMENT PANEL (Section 37 / Schedule A)                   */
/* ================================================================== */

function BylawSupplementPanel({ supplement }: { supplement: BylawSupplement }) {
  const [expanded, setExpanded] = useState(false);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-emerald-600">
            Amending By-law Details
          </p>
          <div className="flex gap-1">
            {supplement.has_section_37 && (
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                S.37
              </span>
            )}
            {supplement.has_schedule_a && (
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                Sched A
              </span>
            )}
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-emerald-300 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Lands description */}
          {supplement.lands_description && (
            <p className="text-[12px] text-stone-500">
              <span className="font-medium text-stone-600">Lands:</span>{" "}
              {supplement.lands_description}
            </p>
          )}

          {/* Section 37 Conditions */}
          {supplement.section_37 && supplement.section_37.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
                Section 37 — Community Benefits
              </p>
              <div className="space-y-2">
                {supplement.section_37.map((cond, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-emerald-100 bg-white p-3"
                  >
                    <div className="flex items-start gap-2">
                      {cond.letter && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">
                          {cond.letter}
                        </span>
                      )}
                      <p className="text-[12px] leading-relaxed text-stone-600">
                        {cond.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule A */}
          {supplement.has_schedule_a && supplement.schedule_a_summary && (
            <div>
              <button
                type="button"
                onClick={() => setScheduleExpanded(!scheduleExpanded)}
                className="flex items-center gap-1.5 mb-2"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
                  Schedule A — Development Conditions
                </p>
                <svg
                  className={`h-3 w-3 text-emerald-300 transition-transform duration-200 ${scheduleExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {scheduleExpanded ? (
                <div className="rounded-lg border border-stone-100 bg-white p-3">
                  <p className="whitespace-pre-line text-[12px] leading-relaxed text-stone-600">
                    {supplement.schedule_a_text || supplement.schedule_a_summary}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-3">
                  <p className="text-[12px] text-stone-400 line-clamp-3">
                    {supplement.schedule_a_summary}
                  </p>
                </div>
              )}
            </div>
          )}

          <p className="mt-2 text-[10px] text-stone-400 leading-relaxed">
            Section 37 of the Planning Act allows municipalities to authorize height/density
            increases beyond zoning limits in exchange for community benefits such as parks,
            public art, affordable housing, and other facilities.
          </p>
        </div>
      )}
    </div>
  );
}

function DiffArrow({ direction }: { direction: DiffEntry["direction"] }) {
  const colors = {
    increased: "text-emerald-500",
    decreased: "text-rose-500",
    set: "text-sky-500",
    removed: "text-stone-400",
    unchanged: "text-stone-300",
    changed: "text-amber-500",
  };
  return (
    <span className={`text-[11px] font-bold ${colors[direction]}`}>
      →
    </span>
  );
}

function DiffBadge({ direction }: { direction: DiffEntry["direction"] }) {
  const styles = {
    increased: "bg-emerald-50 text-emerald-700 border-emerald-200",
    decreased: "bg-rose-50 text-rose-700 border-rose-200",
    set: "bg-sky-50 text-sky-700 border-sky-200",
    removed: "bg-stone-50 text-stone-500 border-stone-200",
    unchanged: "bg-stone-50 text-stone-400 border-stone-200",
    changed: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const labels = {
    increased: "▲ increased",
    decreased: "▼ decreased",
    set: "● new",
    removed: "○ removed",
    unchanged: "— same",
    changed: "↔ changed",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-semibold tracking-wide ${styles[direction]}`}
    >
      {labels[direction]}
    </span>
  );
}

function ExceptionDiffTable({ diffs }: { diffs: DiffEntry[] }) {
  return (
    <div className="mb-5 rounded-lg border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-4">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-indigo-600">
        What the Exception Changes
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              <th className="pb-2 pr-4">Standard</th>
              <th className="pb-2 pr-2 text-right">Base</th>
              <th className="pb-2 w-5"></th>
              <th className="pb-2 pr-2 text-right">Exception</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {diffs.map((d, i) => (
              <tr
                key={i}
                className="border-t border-stone-100"
              >
                <td className="py-1.5 pr-4 font-medium text-stone-700">
                  {d.label}
                </td>
                <td className="py-1.5 pr-2 text-right font-mono text-stone-400">
                  {d.base_display}
                </td>
                <td className="py-1.5 text-center">
                  <DiffArrow direction={d.direction} />
                </td>
                <td className="py-1.5 pr-2 text-right font-mono font-semibold text-stone-800">
                  {d.effective_display}
                </td>
                <td className="py-1.5 pl-2">
                  <DiffBadge direction={d.direction} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SINGLE PROVISION CLAUSE                                            */
/* ================================================================== */

function ProvisionClause({ provision }: { provision: AnnotatedProvision }) {
  const [expanded, setExpanded] = useState(false);

  const hasAnnotations =
    (provision.regulation_refs && provision.regulation_refs.length > 0) ||
    (provision.bylaw_refs && provision.bylaw_refs.length > 0) ||
    (provision.diagram_refs && provision.diagram_refs.length > 0) ||
    (provision.numeric_values && provision.numeric_values.length > 0) ||
    (provision.definitions_referenced && provision.definitions_referenced.length > 0);

  return (
    <div className="group rounded-lg border border-stone-100 bg-stone-50/50 p-4 hover:border-stone-200 transition-colors">
      {/* Letter + Text */}
      <div className="flex gap-3">
        {provision.letter ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[11px] font-bold text-stone-600">
            {provision.letter}
          </span>
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[11px] font-medium text-stone-400">
            {provision.index + 1}
          </span>
        )}
        <p className="text-[13px] leading-relaxed text-stone-700">
          {/* Display text without the leading (X) since we show the letter badge */}
          {provision.letter
            ? provision.text.replace(/^\([A-Z]\)\s*/, "")
            : provision.text}
        </p>
      </div>

      {/* Annotations bar — always show inline regulation refs */}
      {hasAnnotations && (
        <div className="mt-3 ml-9">
          {/* Regulation refs — always visible inline */}
          {provision.regulation_refs && provision.regulation_refs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {provision.regulation_refs.map((reg, i) => (
                <RegulationLink key={i} reg={reg} />
              ))}
            </div>
          )}

          {/* Bylaw + Diagram refs — always visible */}
          {((provision.bylaw_refs && provision.bylaw_refs.length > 0) ||
            (provision.diagram_refs && provision.diagram_refs.length > 0)) && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {provision.bylaw_refs?.map((bl, i) => (
                <BylawLink key={`bl-${i}`} bylaw={bl} />
              ))}
              {provision.diagram_refs?.map((d, i) => (
                <DiagramLink key={`dg-${i}`} diagram={d} />
              ))}
            </div>
          )}

          {/* Numeric values — highlighted */}
          {provision.numeric_values && provision.numeric_values.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {provision.numeric_values.map((nv, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-100 px-2 py-0.5 text-[11px] font-medium"
                >
                  <span className="text-amber-600">{nv.label}:</span>
                  <span className="font-mono font-semibold text-amber-800">
                    {typeof nv.value === "number"
                      ? nv.value.toLocaleString()
                      : nv.value}{" "}
                    {nv.unit}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Definitions — expandable */}
          {provision.definitions_referenced &&
            provision.definitions_referenced.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="text-[11px] font-medium text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {expanded ? "Hide" : "Show"} definitions (
                  {provision.definitions_referenced.length})
                </button>
                {expanded && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {provision.definitions_referenced.map((def_, i) => (
                      <DefinitionTag key={i} def={def_} />
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function ExceptionDetail({
  exception,
  exceptionDiff,
}: {
  exception: ExceptionData;
  exceptionDiff?: DiffEntry[];
}) {
  const annotated = exception.annotated_provisions;
  const hasAnnotated = annotated && annotated.length > 0;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      {/* Header badges */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="warning">
          Exception #{exception.exception_number}
        </Badge>
        {exception.has_site_specific_provisions && (
          <Badge variant="active">Site-specific provisions</Badge>
        )}
        {exception.has_prevailing_bylaws && (
          <Badge variant="info">Prevailing by-laws</Badge>
        )}
        {exception.bylaw_amendments && exception.bylaw_amendments.length > 0 && (
          <span className="text-[11px] text-stone-400">
            Amended by:{" "}
            {exception.bylaw_amendments.map((bl: string, i: number) => (
              <span key={i}>
                <RefLink type="exception" id={String(exception.exception_number)} label={bl}>
                  <span className="text-stone-500 underline decoration-dotted cursor-pointer hover:text-stone-700 transition-colors">{bl}</span>
                </RefLink>
                {i < (exception.bylaw_amendments?.length ?? 0) - 1 && ", "}
              </span>
            ))}
          </span>
        )}
      </div>

      {/* Exception Diff Table */}
      {exceptionDiff && exceptionDiff.length > 0 && (
        <ExceptionDiffTable diffs={exceptionDiff} />
      )}

      {/* Numeric Overrides */}
      {exception.numeric_overrides &&
        Object.keys(exception.numeric_overrides).length > 0 && (
          <div className="mb-5 rounded-lg border border-amber-100 bg-amber-50 p-4">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-amber-600">
              Numeric Overrides
            </p>
            <div className="space-y-1.5">
              {Object.entries(exception.numeric_overrides).map(
                ([key, val]: [string, any]) => (
                  <div
                    key={key}
                    className="flex items-baseline justify-between"
                  >
                    <span className="text-[13px] text-amber-700">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-mono text-[13px] font-semibold text-amber-900">
                      {typeof val === "number" ? val.toLocaleString() : val}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

      {/* Annotated Provisions */}
      {hasAnnotated ? (
        <div>
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
            Provisions ({annotated.length})
          </p>
          <div className="space-y-2">
            {annotated.map((p) => (
              <ProvisionClause key={p.index} provision={p} />
            ))}
          </div>
        </div>
      ) : exception.provisions && exception.provisions.length > 0 ? (
        /* Fallback: plain text provisions if no annotations available */
        <div>
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
            Provisions ({exception.provisions.length})
          </p>
          <div className="space-y-3">
            {exception.provisions.map((p: string, i: number) => (
              <div key={i} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-semibold text-stone-500">
                  {i + 1}
                </span>
                <p className="text-[13px] leading-relaxed text-stone-600">
                  {p}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Prevailing By-laws */}
      {exception.annotated_prevailing &&
        exception.annotated_prevailing.length > 0 && (
          <div className="mt-5">
            <PrevailingBylawsPanel entries={exception.annotated_prevailing} />
          </div>
        )}

      {/* Amending By-law Supplement (Section 37 / Schedule A) */}
      {exception.bylaw_supplement &&
        (exception.bylaw_supplement.has_section_37 ||
          exception.bylaw_supplement.has_schedule_a) && (
          <div className="mt-5">
            <BylawSupplementPanel supplement={exception.bylaw_supplement} />
          </div>
        )}
    </div>
  );
}
