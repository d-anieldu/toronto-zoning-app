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
 * Session 4: Export buttons, animations, accessibility.
 */

import { useState, useCallback } from "react";
import { SectionHeading, Card, Badge } from "./primitives";
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
    { count: summary.not_applicable ?? 0, label: "N/A", color: "text-stone-400" },
  ].filter((item) => item.count > 0);
  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5">
      {items.map((item) => (
        <span key={item.label} className={`text-[13px] font-medium ${item.color}`}>
          {item.count} {item.label}
        </span>
      ))}
      <span className="text-[13px] text-stone-400">
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
}: {
  checklist: PolicyConformityChecklist;
  sectionId: string;
  icon: string;
  notes: Record<string, string>;
  onNoteChange: (itemId: string, value: string) => void;
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
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
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

        {/* Summary counts for this tier */}
        <div className="mb-4 flex flex-wrap gap-3 text-[12px]">
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
            <span className="text-stone-400">
              ⬜ {checklist.summary.not_applicable} N/A
            </span>
          )}
        </div>

        {/* Checklist items */}
        <div className="space-y-2">
          {checklist.items.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              note={notes[item.id] || ""}
              onNoteChange={onNoteChange}
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
}: {
  item: PolicyChecklistItem;
  note: string;
  onNoteChange: (itemId: string, value: string) => void;
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
            : "border-stone-100 bg-stone-50/30";

  const showNotes =
    item.status === "user_input_needed" || item.status === "requires_assessment";

  return (
    <Card label={`${item.section} ${item.title}`} defaultOpen={false}>
      <div className={`rounded-lg border p-3 ${statusColor}`}>
        <div className="flex items-center gap-2 mb-2">
          <StatusBadge status={item.status} />
          <span className="text-[11px] text-stone-400">{item.data_source}</span>
        </div>
        <p className="text-[12px] italic text-stone-500 mb-2">{item.requirement}</p>
        <p className="text-[13px] leading-relaxed text-stone-700">{item.evidence}</p>

        {/* User notes for actionable items */}
        {showNotes && (
          <div className="mt-3">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-blue-500">
              📝 Your Notes
            </label>
            <textarea
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white p-2 text-[12px] leading-relaxed text-stone-700 placeholder:text-stone-300 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-200"
              placeholder="Add project-specific justification or notes..."
              rows={2}
              value={note}
              onChange={(e) => onNoteChange(item.id, e.target.value)}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── Main tab component ───────────────────────────────────────────── */

interface PolicyConformityTabProps {
  data: Record<string, any>;
}

export default function PolicyConformityTab({ data }: PolicyConformityTabProps) {
  const conformity = data.policy_conformity as PolicyConformityData | undefined;
  const address = conformity?.property_address || data.address || "";

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

  /* ── Empty / error states ─────────────────────────────────────── */
  if (!conformity) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <p className="text-[14px] text-stone-400">
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
    <div className="space-y-5">
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

      {/* Overall summary bar */}
      {conformity.overall_summary && (
        <SummaryBar summary={conformity.overall_summary} />
      )}

      {/* PPS */}
      {conformity.pps && (
        <ChecklistSection
          checklist={conformity.pps}
          sectionId="pps"
          icon="📜"
          notes={notes}
          onNoteChange={handleNoteChange}
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
        />
      )}
    </div>
  );
}
