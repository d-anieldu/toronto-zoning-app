"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * PolicyConformityTab — Policy conformity checklists for PPS, Growth Plan,
 * and Official Plan. Auto-assesses each policy item against the property's
 * GIS layers, effective standards, and development potential data.
 *
 * Session 1: Skeleton with section headings and placeholder items.
 * Session 2: Real checklist rendering with status badges and evidence.
 * Session 3: User notes, collapsible items, edge case states.
 * Session 4: Export buttons, tab badge, expand/collapse all, animations, accessibility.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { SectionHeading, Card, Badge } from "./primitives";
import SectionNoteEditor from "./SectionNoteEditor";
import type {
  PolicyConformityData,
  PolicyConformityChecklist,
  PolicyChecklistItem,
  PolicyConformitySummary,
  ConformityStatus,
} from "../../types/policyConformity";

/* ── Status badge mapping ─────────────────────────────────────────── */

const STATUS_CONFIG: Record<
  ConformityStatus,
  { variant: string; icon: string; label: string }
> = {
  conforms: { variant: "success", icon: "✅", label: "Conforms" },
  requires_assessment: { variant: "warning", icon: "⚠️", label: "Requires Assessment" },
  user_input_needed: { variant: "info", icon: "🔧", label: "User Input Needed" },
  potential_conflict: { variant: "danger", icon: "❌", label: "Potential Conflict" },
  not_applicable: { variant: "default", icon: "⬜", label: "Not Applicable" },
};

function StatusBadge({ status }: { status: ConformityStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_applicable;
  return (
    <Badge variant={config.variant as any}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}

/* ── localStorage helpers for user notes ──────────────────────────── */

function _notesKey(address: string): string {
  return `policy_conformity_notes_${address.replace(/\s+/g, "_").toLowerCase()}`;
}

function _loadNotes(address: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(_notesKey(address));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function _saveNotes(address: string, notes: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(_notesKey(address), JSON.stringify(notes));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/* ── Summary bar ──────────────────────────────────────────────────── */

function SummaryBar({ summary }: { summary: PolicyConformitySummary }) {
  const items = [
    { count: summary.conforms, label: "Conform", color: "text-emerald-600" },
    { count: summary.requires_assessment, label: "Assess", color: "text-amber-600" },
    { count: summary.user_input_needed, label: "Input Needed", color: "text-blue-600" },
    { count: summary.potential_conflict, label: "Conflict", color: "text-red-600" },
    { count: summary.not_applicable ?? 0, label: "N/A", color: "text-[var(--text-muted)]" },
  ].filter((item) => item.count > 0);
  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-[var(--border)] bg-stone-50 px-4 py-2.5">
      {items.map((item) => (
        <span key={item.label} className={`text-[13px] font-medium ${item.color}`}>
          {item.count} {item.label}
        </span>
      ))}
      <span className="text-[13px] text-[var(--text-muted)]">
        of {summary.total_items} total
      </span>
    </div>
  );
}

/* ── Alert banner ─────────────────────────────────────────────────── */

function AlertBanner({
  variant,
  icon,
  children,
}: {
  variant: "amber" | "blue" | "red";
  icon: string;
  children: React.ReactNode;
}) {
  const colors = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    red: "border-red-200 bg-red-50 text-red-800",
  };
  return (
    <div className={`rounded-lg border p-3 text-[13px] leading-relaxed ${colors[variant]}`}>
      <span className="mr-1.5">{icon}</span>
      {children}
    </div>
  );
}

/* ── Checklist section ────────────────────────────────────────────── */

function ChecklistSection({
  checklist,
  sectionId,
  icon,
  notes,
  onNoteChange,
  expandAll,
  onToggleExpandAll,
}: {
  checklist: PolicyConformityChecklist;
  sectionId: string;
  icon: string;
  notes: Record<string, string>;
  onNoteChange: (itemId: string, value: string) => void;
  expandAll: boolean;
  onToggleExpandAll: () => void;
}) {
  const title = checklist.designation
    ? `${checklist.policy_name} — ${checklist.designation}`
    : checklist.policy_name;

  return (
    <>
      <SectionHeading
        id={sectionId}
        title={title}
        icon={icon}
        count={checklist.summary.total_items}
      />
      <div
        className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
        role="region"
        aria-label={`${title} checklist`}
      >
        {/* R zone ambiguity warning */}
        {checklist.r_zone_ambiguity_note && (
          <div className="mb-3">
            <AlertBanner variant="amber" icon="⚠️">
              {checklist.r_zone_ambiguity_note}
            </AlertBanner>
          </div>
        )}

        {/* Unknown designation warning */}
        {checklist.unknown_designation_note && (
          <div className="mb-3">
            <AlertBanner variant="blue" icon="ℹ️">
              {checklist.unknown_designation_note}
            </AlertBanner>
          </div>
        )}

        {/* Low confidence designation warning */}
        {checklist.designation_confidence &&
          checklist.designation_confidence !== "high" &&
          checklist.designation_confidence !== "none" &&
          checklist.designation && (
          <div className="mb-3">
            <AlertBanner variant="amber" icon="⚠️">
              OP designation <strong>{checklist.designation}</strong> was determined with{" "}
              <strong>{checklist.designation_confidence}</strong> confidence.
              Verify against Schedule 2 (Land Use Plan) of the Official Plan.
            </AlertBanner>
          </div>
        )}

        {/* Summary counts + expand/collapse toggle */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-[12px]">
            <span className="font-medium text-emerald-600">
              ✅ {checklist.summary.conforms}/{checklist.summary.total_items} conform
            </span>
            {checklist.summary.requires_assessment > 0 && (
              <span className="text-amber-600">
                ⚠️ {checklist.summary.requires_assessment} need assessment
              </span>
            )}
            {checklist.summary.user_input_needed > 0 && (
              <span className="text-blue-600">
                🔧 {checklist.summary.user_input_needed} need input
              </span>
            )}
            {checklist.summary.potential_conflict > 0 && (
              <span className="text-red-600">
                ❌ {checklist.summary.potential_conflict} conflicts
              </span>
            )}
            {(checklist.summary.not_applicable ?? 0) > 0 && (
              <span className="text-[var(--text-muted)]">
                ⬜ {checklist.summary.not_applicable} N/A
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleExpandAll}
            className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            aria-label={expandAll ? `Collapse all ${title} items` : `Expand all ${title} items`}
          >
            {expandAll ? "▲ Collapse all" : "▼ Expand all"}
          </button>
        </div>

        {/* Checklist items */}
        <div className="space-y-2" role="list" aria-label={`${title} policy items`}>
          {checklist.items.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              note={notes[item.id] || ""}
              onNoteChange={onNoteChange}
              forceOpen={expandAll}
            />
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Individual checklist item ────────────────────────────────────── */

function ChecklistItem({
  item,
  note,
  onNoteChange,
  forceOpen,
}: {
  item: PolicyChecklistItem;
  note: string;
  onNoteChange: (itemId: string, value: string) => void;
  forceOpen: boolean;
}) {
  const statusColor =
    item.status === "conforms"
      ? "border-emerald-100 bg-emerald-50/30"
      : item.status === "requires_assessment"
        ? "border-amber-100 bg-amber-50/30"
        : item.status === "potential_conflict"
          ? "border-red-100 bg-red-50/30"
          : item.status === "user_input_needed"
            ? "border-blue-100 bg-blue-50/30"
            : "border-[var(--border)] bg-stone-50/30";

  const showNotes =
    item.status === "user_input_needed" || item.status === "requires_assessment";

  return (
    <div role="listitem">
      <Card
        label={`${item.section} ${item.title}`}
        defaultOpen={forceOpen}
        aria-label={`${item.section} ${item.title} — ${STATUS_CONFIG[item.status]?.label || item.status}`}
      >
        <div className={`rounded-lg border p-3 transition-all duration-200 ease-in-out ${statusColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={item.status} />
            <span className="text-[11px] text-[var(--text-muted)]" aria-label={`Data source: ${item.data_source}`}>{item.data_source}</span>
          </div>
          <p className="text-[12px] italic text-[var(--text-secondary)] mb-2">{item.requirement}</p>
          <p className="text-[13px] leading-relaxed text-[var(--text-primary)]">{item.evidence}</p>

          {/* User notes for actionable items */}
          {showNotes && (
            <div className="mt-3">
              <label
                htmlFor={`note-${item.id}`}
                className="text-[11px] font-heading font-semibold uppercase tracking-wide text-blue-500"
              >
                📝 Your Notes
              </label>
              <textarea
                id={`note-${item.id}`}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-[12px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-200"
                placeholder="Add project-specific justification or notes..."
                rows={2}
                value={note}
                onChange={(e) => onNoteChange(item.id, e.target.value)}
                aria-label={`Notes for ${item.section} ${item.title}`}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ── Main tab component ───────────────────────────────────────────── */

interface PolicyConformityTabProps {
  data: Record<string, any>;
  editMode?: boolean;
  sectionNotes?: Record<string, string>;
  onEditNote?: (sectionId: string, note: string) => void;
}

const STATUS_TEXT: Record<ConformityStatus, string> = {
  conforms: "Conforms",
  requires_assessment: "Requires Assessment",
  user_input_needed: "User Input Needed",
  potential_conflict: "Potential Conflict",
  not_applicable: "N/A",
};

export default function PolicyConformityTab({ data, editMode, sectionNotes, onEditNote }: PolicyConformityTabProps) {
  const [liveConformity, setLiveConformity] = useState<PolicyConformityData | undefined>(
    data.policy_conformity as PolicyConformityData | undefined,
  );
  const [loading, setLoading] = useState(!data.policy_conformity);

  const conformity = liveConformity;
  const address = conformity?.property_address || data.address || "";

  /* ── Lazy-fetch on mount if not included in initial lookup ────── */
  useEffect(() => {
    if (data.policy_conformity) return; // already loaded
    if (!data.address) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/policy-conformity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: data.address }),
        });
        if (res.ok && !cancelled) {
          const json = await res.json();
          setLiveConformity(json);
        }
      } catch (err) {
        console.error("Failed to fetch policy conformity:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.address]);

  /* ── User notes state with localStorage persistence ───────────── */
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    address ? _loadNotes(address) : {},
  );

  const handleNoteChange = useCallback(
    (itemId: string, value: string) => {
      setNotes((prev) => {
        const next = { ...prev, [itemId]: value };
        if (address) _saveNotes(address, next);
        return next;
      });
    },
    [address],
  );

  /* ── Expand/collapse all state per tier ───────────────────────── */
  const [expandState, setExpandState] = useState<Record<string, boolean>>({});

  const toggleExpandAll = useCallback((tierId: string) => {
    setExpandState((prev) => ({ ...prev, [tierId]: !prev[tierId] }));
  }, []);

  /* ── Export: copy to clipboard as Markdown table ──────────────── */
  const [showCopied, setShowCopied] = useState(false);

  const handleCopyToClipboard = useCallback(() => {
    if (!conformity) return;

    const lines: string[] = [
      `# Policy Conformity — ${address}`,
      "",
    ];

    const tiers: [string, PolicyConformityChecklist | undefined][] = [
      ["PPS", conformity.pps],
      ["Growth Plan", conformity.growth_plan],
      ["Official Plan", conformity.official_plan],
      ["Secondary Plan", conformity.secondary_plan as any],
      ["SASP", conformity.sasp as any],
    ];

    for (const [tierName, checklist] of tiers) {
      if (!checklist?.items?.length) continue;
      const title = checklist.designation
        ? `${tierName} — ${checklist.designation}`
        : tierName;
      lines.push(`## ${title}`);
      lines.push("");
      lines.push("| Section | Policy Item | Status | Evidence |");
      lines.push("|---------|-------------|--------|----------|");
      for (const item of checklist.items) {
        const statusLabel = STATUS_TEXT[item.status] || item.status;
        const evidence = (item.evidence || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
        const userNote = notes[item.id];
        const evidenceCol = userNote
          ? `${evidence} — _Note: ${userNote.replace(/\|/g, "\\|").replace(/\n/g, " ")}_`
          : evidence;
        lines.push(`| ${item.section} | ${item.title} | ${statusLabel} | ${evidenceCol} |`);
      }
      lines.push("");
    }

    // Overall summary
    if (conformity.overall_summary) {
      const s = conformity.overall_summary;
      const total = s.total_items || 0;
      const pct = total > 0 ? Math.round((s.conforms / total) * 100) : 0;
      lines.push(`**Overall: ${pct}%** — ${s.conforms}/${total} conform`);
    }

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  }, [conformity, address, notes]);

  /* ── Export: PDF via backend ──────────────────────────────────── */
  const handleExportPDF = useCallback(() => {
    if (!address) return;
    const url = `/export/pdf/html?address=${encodeURIComponent(address)}`;
    window.open(url, "_blank");
  }, [address]);

  /* ── Conformity score for tab badge (exposed via data attribute) ── */
  const conformityScore = useMemo(() => {
    if (!conformity?.overall_summary) return null;
    const { conforms, total_items } = conformity.overall_summary;
    if (!total_items || total_items === 0) return null;
    return Math.round((conforms / total_items) * 100);
  }, [conformity]);

  /* ── Loading / empty states ─────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-10 rounded-lg bg-stone-100" />
        <div className="h-24 rounded-xl bg-stone-100" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-8 w-48 rounded bg-stone-100" />
            <div className="h-40 rounded-xl bg-stone-100" />
          </div>
        ))}
      </div>
    );
  }

  if (!conformity) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
        <p className="text-[14px] text-[var(--text-muted)]">
          📋 Policy conformity data is not yet available for this property.
        </p>
      </div>
    );
  }

  if (conformity.error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-[14px] font-medium text-red-700">
          ⚠️ Error generating policy conformity checklist
        </p>
        <p className="mt-1 text-[12px] text-red-600">{conformity.error}</p>
      </div>
    );
  }

  /* ── Main render ──────────────────────────────────────────────── */
  return (
    <div className="space-y-5" data-conformity-score={conformityScore ?? ""}>
      {/* Former by-law banner */}
      {conformity.former_bylaw && (
        <AlertBanner variant="amber" icon="⚠️">
          This property is governed by <strong>{conformity.former_bylaw_name || "a former municipal by-law"}</strong>
          {conformity.former_bylaw_municipality && (
            <> ({conformity.former_bylaw_municipality})</>
          )}.
          Some policy assessments may have reduced accuracy. Zoning-dependent items are marked for manual review.
        </AlertBanner>
      )}

      {/* Overall summary bar with score badge */}
      {conformity.overall_summary && (
        <div className="flex items-center gap-4" aria-live="polite">
          <SummaryBar summary={conformity.overall_summary} />
          {conformityScore !== null && (
            <div
              className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[13px] font-bold text-emerald-700"
              aria-label={`Conformity score: ${conformityScore} percent`}
            >
              <span aria-hidden="true">📊</span> {conformityScore}%
            </div>
          )}
        </div>
      )}

      {/* PPS */}
      {conformity.pps && (
        <ChecklistSection
          checklist={conformity.pps}
          sectionId="pps"
          icon="📜"
          notes={notes}
          onNoteChange={handleNoteChange}
          expandAll={!!expandState["pps"]}
          onToggleExpandAll={() => toggleExpandAll("pps")}
        />
      )}

      {/* Growth Plan */}
      {conformity.growth_plan && (
        <ChecklistSection
          checklist={conformity.growth_plan}
          sectionId="growth-plan"
          icon="🏗️"
          notes={notes}
          onNoteChange={handleNoteChange}
          expandAll={!!expandState["growth-plan"]}
          onToggleExpandAll={() => toggleExpandAll("growth-plan")}
        />
      )}

      {/* Official Plan */}
      {conformity.official_plan && (
        <ChecklistSection
          checklist={conformity.official_plan}
          sectionId="official-plan"
          icon="🏙️"
          notes={notes}
          onNoteChange={handleNoteChange}
          expandAll={!!expandState["official-plan"]}
          onToggleExpandAll={() => toggleExpandAll("official-plan")}
        />
      )}

      {/* Secondary Plan (if applicable) */}
      {conformity.secondary_plan && (
        <ChecklistSection
          checklist={conformity.secondary_plan as any}
          sectionId="secondary-plan"
          icon="📑"
          notes={notes}
          onNoteChange={handleNoteChange}
          expandAll={!!expandState["secondary-plan"]}
          onToggleExpandAll={() => toggleExpandAll("secondary-plan")}
        />
      )}

      {/* SASP (if applicable) */}
      {conformity.sasp && (
        <ChecklistSection
          checklist={conformity.sasp as any}
          sectionId="sasp"
          icon="📌"
          notes={notes}
          onNoteChange={handleNoteChange}
          expandAll={!!expandState["sasp"]}
          onToggleExpandAll={() => toggleExpandAll("sasp")}
        />
      )}

      {editMode && (
        <SectionNoteEditor
          sectionId="policy_conformity"
          note={sectionNotes?.policy_conformity ?? ""}
          onNoteChange={onEditNote!}
          editMode={!!editMode}
        />
      )}

      {/* Export buttons */}
      <div className="flex flex-wrap gap-3 mt-6 print:hidden" role="group" aria-label="Export options">
        <button
          type="button"
          onClick={handleCopyToClipboard}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] shadow-sm transition-all hover:bg-stone-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-stone-300"
          aria-label="Copy conformity checklist to clipboard as Markdown"
        >
          {showCopied ? (
            <>
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              📋 Copy to Clipboard
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleExportPDF}
          className="flex items-center gap-2 rounded-lg bg-stone-800 px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-stone-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-stone-500"
          aria-label="Export full report with conformity matrix as PDF"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          📥 Export as PDF
        </button>
      </div>
    </div>
  );
}
