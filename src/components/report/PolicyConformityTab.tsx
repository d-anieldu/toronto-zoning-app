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

/* ── Checklist section ────────────────────────────────────────────── */

function ChecklistSection({
  checklist,
  sectionId,
  icon,
}: {
  checklist: PolicyConformityChecklist;
  sectionId: string;
  icon: string;
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
            <ChecklistItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Individual checklist item ────────────────────────────────────── */

function ChecklistItem({ item }: { item: PolicyChecklistItem }) {
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

  return (
    <Card label={`${item.section} ${item.title}`} defaultOpen={false}>
      <div className={`rounded-lg border p-3 ${statusColor}`}>
        <div className="flex items-center gap-2 mb-2">
          <StatusBadge status={item.status} />
          <span className="text-[11px] text-stone-400">{item.data_source}</span>
        </div>
        <p className="text-[12px] italic text-stone-500 mb-2">{item.requirement}</p>
        <p className="text-[13px] leading-relaxed text-stone-700">{item.evidence}</p>
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
        />
      )}

      {/* Growth Plan */}
      {conformity.growth_plan && (
        <ChecklistSection
          checklist={conformity.growth_plan}
          sectionId="growth-plan"
          icon="🏗️"
        />
      )}

      {/* Official Plan */}
      {conformity.official_plan && (
        <ChecklistSection
          checklist={conformity.official_plan}
          sectionId="official-plan"
          icon="🏙️"
        />
      )}

      {/* Secondary Plan (if applicable) */}
      {conformity.secondary_plan && (
        <ChecklistSection
          checklist={conformity.secondary_plan as any}
          sectionId="secondary-plan"
          icon="📑"
        />
      )}

      {/* SASP (if applicable) */}
      {conformity.sasp && (
        <ChecklistSection
          checklist={conformity.sasp as any}
          sectionId="sasp"
          icon="📌"
        />
      )}
    </div>
  );
}
