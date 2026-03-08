"use client";

/**
 * LandscapingCard — Detailed landscaping requirements card showing
 * front / side / rear yard percentages, soft-landscape ratios,
 * apartment lot-wide rules, and abutting residential strip.
 *
 * Data comes from `data.effective_standards.landscaping`.
 * Returns null when landscaping is not applicable.
 */

import { Card, Row, Badge } from "./primitives";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface YardRequirement {
  landscaping_pct?: number | null;
  soft_pct_of_landscaping?: number | null;
  soft_pct?: number | null;
  condition?: string;
  tier_condition?: string;
  effective_source?: string;
  display?: string;
}

interface LandscapingData {
  applicable?: boolean;
  note?: string;
  source_section?: string;
  zone_category?: string;
  lot_frontage_used_m?: number | null;
  front_yard?: YardRequirement | null;
  side_yard?: YardRequirement | null;
  rear_yard?: YardRequirement | null;
  lot_wide_apartment?: YardRequirement | null;
  abutting_residential_strip_m?: number | null;
  abutting_residential_strip_type?: string;
  standard_set_rules?: Record<string, unknown>;
  notes?: string[];
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

function YardRow({
  label,
  yard,
  icon,
}: {
  label: string;
  yard: YardRequirement | null | undefined;
  icon: string;
}) {
  if (!yard) return null;

  const display = yard.display || "—";
  const isOverride = yard.effective_source === "exception override";
  const condition =
    yard.tier_condition || yard.condition || null;

  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[14px] leading-none shrink-0">{icon}</span>
          <span className="text-[13px] font-medium text-stone-700">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isOverride && (
            <Badge variant="warning">exception</Badge>
          )}
          <span className="font-mono text-[14px] font-semibold text-emerald-800">
            {display}
          </span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="ml-7 mt-1 space-y-0.5">
        {yard.landscaping_pct != null && (
          <p className="text-[11px] text-stone-400">
            Min landscaping: <span className="font-medium text-stone-500">{yard.landscaping_pct}%</span> of yard area
          </p>
        )}
        {yard.soft_pct_of_landscaping != null && (
          <p className="text-[11px] text-stone-400">
            Soft landscaping: <span className="font-medium text-stone-500">{yard.soft_pct_of_landscaping}%</span> of landscaped area
          </p>
        )}
        {yard.soft_pct != null && !yard.soft_pct_of_landscaping && (
          <p className="text-[11px] text-stone-400">
            Soft landscaping: <span className="font-medium text-stone-500">{yard.soft_pct}%</span>
          </p>
        )}
        {condition && (
          <p className="text-[10px] italic text-stone-400">{condition}</p>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────────── */

export default function LandscapingCard({
  landscaping,
}: {
  landscaping: LandscapingData | null | undefined;
}) {
  if (!landscaping || !landscaping.applicable) return null;

  const hasAnyYard =
    landscaping.front_yard ||
    landscaping.side_yard ||
    landscaping.rear_yard ||
    landscaping.lot_wide_apartment;

  if (!hasAnyYard) return null;

  return (
    <Card label="Landscaping Requirements" defaultOpen>
      {/* Source reference */}
      {landscaping.source_section && (
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="info">
            s. {landscaping.source_section}
          </Badge>
          {landscaping.zone_category && (
            <span className="text-[11px] text-stone-400">
              {landscaping.zone_category} zone
            </span>
          )}
          {landscaping.lot_frontage_used_m != null && (
            <span className="text-[11px] text-stone-400">
              · frontage {landscaping.lot_frontage_used_m} m
            </span>
          )}
        </div>
      )}

      {/* Yard requirements */}
      <div className="divide-y divide-stone-100">
        <YardRow
          label="Front Yard"
          yard={landscaping.front_yard}
          icon="🌿"
        />
        <YardRow
          label="Side Yard"
          yard={landscaping.side_yard}
          icon="🌳"
        />
        <YardRow
          label="Rear Yard"
          yard={landscaping.rear_yard}
          icon="🌲"
        />
        {landscaping.lot_wide_apartment && (
          <YardRow
            label="Lot-Wide (Apartment)"
            yard={landscaping.lot_wide_apartment}
            icon="🏢"
          />
        )}
      </div>

      {/* Abutting residential strip */}
      {landscaping.abutting_residential_strip_m && (
        <>
          <div className="my-2 border-t border-stone-100" />
          <Row
            label="Abutting residential strip"
            value={`${landscaping.abutting_residential_strip_m} m (${landscaping.abutting_residential_strip_type || "soft landscaping"})`}
          />
        </>
      )}

      {/* Notes */}
      {landscaping.notes && landscaping.notes.length > 0 && (
        <div className="mt-3 border-t border-stone-100 pt-3">
          <ul className="space-y-1">
            {landscaping.notes.map((note: string, i: number) => (
              <li
                key={i}
                className="text-[11px] leading-relaxed text-stone-500"
              >
                • {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
