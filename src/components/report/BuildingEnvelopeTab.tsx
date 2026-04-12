"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * BuildingEnvelopeTab — Setback diagram, development metrics,
 * GFA breakdown, angular plane, shadow analysis, building types.
 *
 * Everything from the old "What Can I Build" + "Zoning Standards" +
 * "Angular Plane" + "Shadow" sections, consolidated into one tab.
 */

import { Card, Row, Badge, SetbackDiagram, Tag, FlagProvider } from "./primitives";
import { RefLink } from "../ReferencePanel";
import { Check, AlertTriangle } from "lucide-react";
import LandscapingCard from "./LandscapingCard";
import EditableField from "./EditableField";
import SectionNoteEditor from "./SectionNoteEditor";
import { getFieldValue } from "@/lib/report-edits";

interface BuildingEnvelopeTabProps {
  data: Record<string, any>;
  onAnalyzeUse?: (use: string) => void;
  editMode?: boolean;
  userEdits?: Record<string, { value: unknown; note?: string; edited_at: string }>;
  sectionNotes?: Record<string, string>;
  onEditField?: (path: string, value: unknown, note?: string) => void;
  onRevertField?: (path: string) => void;
  onEditNote?: (sectionId: string, note: string) => void;
  reportId?: string;
}

function fmt(n: number | undefined | null, decimals = 0) {
  if (n == null) return "—";
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function BuildingEnvelopeTab({ data, onAnalyzeUse, editMode, userEdits, sectionNotes, onEditField, onRevertField, onEditNote, reportId }: BuildingEnvelopeTabProps) {
  const eff = data.effective_standards || {};
  const dev = data.development_potential || {};
  const hasEffError = eff.error;
  const hasDevError = dev.error;
  const addr = data.address || "";

  /* ── resolve editable fields through user-edit overlay ── */
  const rv = (p: string, fallback?: unknown) => getFieldValue(data, userEdits, p, fallback);
  type FV = ReturnType<typeof rv>;
  const ep = (path: string, field: FV) => ({
    fieldPath: path, value: field.value, isEdited: field.isEdited,
    original: field.original, editNote: field.editNote,
    onEdit: onEditField || (() => {}), onRevert: onRevertField, editMode: !!editMode,
  });
  /** Wrap a Row value with EditableField in edit mode; pass-through otherwise. */
  const ev = (path: string, field: FV, display: string | null) => {
    if (!editMode) return display;
    if (display === null && !field.isEdited) return null;
    return (<EditableField {...ep(path, field)}><span>{display ?? "\u2014"}</span></EditableField>);
  };

  const baseDefaultH = rv("effective_standards.height.base_default_m");
  const overlayH = rv("effective_standards.height.overlay_m");
  const commercialFsi = rv("effective_standards.fsi.commercial_max", eff.fsi?.fsi_commercial_max);
  const residentialFsi = rv("effective_standards.fsi.residential_max", eff.fsi?.fsi_residential_max);
  const overlayCovPct = rv("effective_standards.lot_coverage.overlay_pct");
  const minFrontage = rv("effective_standards.lot_dimensions.min_frontage_m");
  const minArea = rv("effective_standards.lot_dimensions.min_area_sqm");
  const maxUnitsField = rv("effective_standards.zone_label.max_units", eff.zone_label?.max_units || data.layers?.zoning_area?.[0]?.UNITS);
  const angularAngle = rv("development_potential.angular_plane.angle_degrees");
  const parkDistance = rv("development_potential.shadow_analysis.nearest_park_distance_m");
  const towerSepField = rv("development_potential.separation_distances.tower_separation.min_distance_m");
  const podiumMaxH = rv("effective_standards.stepback_rules.podium_max_height_m");
  const towerFloorplate = rv("effective_standards.stepback_rules.tower_floorplate_max_sqm");
  const towerSepRule = rv("effective_standards.stepback_rules.tower_separation_m");
  const floorPlateMax = rv("development_potential.floor_plate.max_sqm");
  const devHeightMax = rv("development_potential.height.max_m");

  return (
    <FlagProvider address={addr} tabName="building_envelope" reportId={reportId}>
    <div className="space-y-5">
      {dev && !hasDevError && (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            {/* Setback diagram */}
            {dev.setbacks && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm md:col-span-2">
                <p className="mb-3 font-heading text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Building Envelope
                </p>
                <SetbackDiagram
                  front={dev.setbacks.front_m ?? 0}
                  rear={dev.setbacks.rear_m ?? 0}
                  side={dev.setbacks.side_m ?? 0}
                  buildableWidth={dev.setbacks.buildable_width_m ?? 0}
                  buildableDepth={dev.setbacks.buildable_depth_m ?? 0}
                  buildableArea={dev.setbacks.buildable_area_sqm ?? 0}
                />
              </div>
            )}

            {/* Development metrics */}
            <div className={`grid gap-3 ${dev.setbacks ? "md:col-span-3" : "md:col-span-5"} grid-cols-2 content-start`}>
              {dev.max_gfa?.sqm != null && (
                <div className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[28px] font-bold tracking-tight text-emerald-900">
                    {fmt(dev.max_gfa.sqm)} m²
                  </p>
                  <p className="text-[12px] font-medium text-emerald-600">Maximum GFA</p>
                  <p className="mt-0.5 text-[11px] text-emerald-500">
                    Limited by {dev.max_gfa.limiting_factor || "—"}
                  </p>
                </div>
              )}
              {dev.height && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
                  <EditableField {...ep("development_potential.height.max_m", devHeightMax)}>
                    <p className="text-[20px] font-bold text-[var(--text-primary)]">{devHeightMax.value != null ? `${devHeightMax.value} m` : "\u2014"}</p>
                  </EditableField>
                  <p className="text-[12px] text-[var(--text-secondary)]">Max Height</p>
                  {dev.height.max_storeys && (
                    <p className="text-[11px] text-[var(--text-muted)]">~{dev.height.max_storeys} storeys est.</p>
                  )}
                </div>
              )}
              {dev.coverage?.max_footprint_sqm != null && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
                  <p className="text-[20px] font-bold text-[var(--text-primary)]">{fmt(dev.coverage.max_footprint_sqm)} m²</p>
                  <p className="text-[12px] text-[var(--text-secondary)]">Max Footprint</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{dev.coverage.max_pct != null ? `${dev.coverage.max_pct}% coverage` : ""}</p>
                </div>
              )}
              {dev.floor_plate?.max_sqm != null && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
                  <EditableField {...ep("development_potential.floor_plate.max_sqm", floorPlateMax)}>
                    <p className="text-[20px] font-bold text-[var(--text-primary)]">{fmt(floorPlateMax.value as number)} m²</p>
                  </EditableField>
                  <p className="text-[12px] text-[var(--text-secondary)]">Max Floor Area</p>
                  <p className="text-[11px] text-[var(--text-muted)]">per storey · by {dev.floor_plate.limiting_factor || "—"}</p>
                </div>
              )}
              {dev.setbacks?.buildable_area_sqm != null && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
                  <p className="text-[20px] font-bold text-[var(--text-primary)]">{fmt(dev.setbacks.buildable_area_sqm)} m²</p>
                  <p className="text-[12px] text-[var(--text-secondary)]">Building Footprint</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {dev.setbacks.buildable_width_m != null && dev.setbacks.buildable_depth_m != null ? `${dev.setbacks.buildable_width_m}m × ${dev.setbacks.buildable_depth_m}m` : "—"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* GFA constraints breakdown */}
          {dev.max_gfa?.all_limits && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <p className="mb-3 font-heading text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                GFA Constraints Breakdown
              </p>
              <div className="space-y-3">
                {Object.entries(dev.max_gfa.all_limits).map(
                  ([factor, val]: [string, any]) => {
                    const maxVal = Math.max(...Object.values(dev.max_gfa.all_limits).map(Number));
                    const pct = maxVal > 0 ? (Number(val) / maxVal) * 100 : 0;
                    const isControlling = factor === dev.max_gfa.limiting_factor;
                    return (
                      <div key={factor}>
                        <div className="flex items-baseline justify-between">
                          <span className={`text-[13px] ${isControlling ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                            {factor}{" "}
                            {isControlling && <span className="text-emerald-600">◀ controls</span>}
                          </span>
                          <span className="font-mono text-[13px] font-semibold text-[var(--text-primary)]">
                            {fmt(Number(val))} m²
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className={`h-full rounded-full transition-all ${isControlling ? "bg-emerald-500" : "bg-stone-300"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* Building types */}
          {dev.building_types && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <p className="mb-3 font-heading text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Building Types
              </p>
              <div className="flex flex-wrap gap-2">
                {(dev.building_types.permitted || []).map((t: string) => (
                  <Tag key={t} active icon={<Check className="h-3.5 w-3.5" />} onClick={() => onAnalyzeUse?.(t)}>
                    {t}
                  </Tag>
                ))}
              </div>
              {dev.building_types.feasible?.length > 0 &&
                dev.building_types.feasible.some((f: any) => f.notes?.length > 0) && (
                  <div className="mt-4 border-t border-[var(--border)] pt-3">
                    <p className="mb-2 text-[12px] font-medium text-[var(--text-secondary)]">Feasibility Notes</p>
                    {dev.building_types.feasible
                      .filter((f: any) => f.notes?.length > 0)
                      .map((f: any) => (
                        <div key={f.type} className="py-1">
                          <span className="text-[13px] font-medium text-[var(--text-primary)]">{f.type}</span>
                          <p className="text-[12px] text-[var(--text-muted)]">{f.notes.join("; ")}</p>
                        </div>
                      ))}
                  </div>
                )}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  ZONING STANDARDS — Height, Setbacks, Lot, Coverage           */}
      {/* ============================================================ */}
      {!hasEffError && (
        <>
          <p className="font-heading text-[15px] font-semibold tracking-tight text-[var(--text-primary)] pt-2">
            Zoning Standards
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Height & Density */}
            <Card label="Height & Density">
              <Row label="Effective height" value={eff.height?.effective_m ? `${eff.height.effective_m} m` : null} flagAddress={addr} flagFieldPath="effective_standards.height.effective_m" flagTabName="building_envelope" reportId={reportId} />
              <Row label="Max storeys" value={eff.height?.effective_storeys ?? (eff.height?.storeys_unlimited ? "Unlimited" : null)} flagAddress={addr} flagFieldPath="effective_standards.height.effective_storeys" flagTabName="building_envelope" reportId={reportId} />
              <Row label="Height source" value={eff.height?.effective_source} />
              <Row label="Base default" value={ev("effective_standards.height.base_default_m", baseDefaultH, baseDefaultH.value != null ? `${baseDefaultH.value} m` : null)} sub={eff.height?.source_base} />
              <Row label="Overlay height" value={ev("effective_standards.height.overlay_m", overlayH, overlayH.value != null ? `${overlayH.value} m` : null)} />
              <Row label="Overlay storeys" value={eff.height?.overlay_storeys} />
              <div className="my-2 border-t border-[var(--border)]" />
              <Row label="FSI" value={eff.fsi?.effective_total} flagAddress={addr} flagFieldPath="effective_standards.fsi.effective_total" flagTabName="building_envelope" reportId={reportId} />
              <Row label="FSI source" value={eff.fsi?.effective_source} />
              {eff.fsi?.is_compound && (
                <>
                  <Row label="Commercial FSI" value={ev("effective_standards.fsi.commercial_max", commercialFsi, commercialFsi.value != null ? String(commercialFsi.value) : null)} />
                  <Row label="Residential FSI" value={ev("effective_standards.fsi.residential_max", residentialFsi, residentialFsi.value != null ? String(residentialFsi.value) : null)} />
                  <Row label="Compound note" value={eff.fsi.compound_note} />
                </>
              )}
            </Card>

            {/* Setbacks */}
            <Card label="Setbacks">
              <Row label="Front" value={eff.setbacks?.effective_front_m ? `${eff.setbacks.effective_front_m} m` : null} flagAddress={addr} flagFieldPath="effective_standards.setbacks.effective_front_m" flagTabName="building_envelope" reportId={reportId} />
              <Row label="Rear" value={eff.setbacks?.effective_rear_m ? `${eff.setbacks.effective_rear_m} m` : null} flagAddress={addr} flagFieldPath="effective_standards.setbacks.effective_rear_m" flagTabName="building_envelope" reportId={reportId} />
              <Row label="Side" value={eff.setbacks?.effective_side_m ? `${eff.setbacks.effective_side_m} m` : null} flagAddress={addr} flagFieldPath="effective_standards.setbacks.effective_side_m" flagTabName="building_envelope" reportId={reportId} />
              {eff.setbacks?.exception_side_m && (
                <Row label="Side (exception)" value={`${eff.setbacks.exception_side_m} m`} />
              )}
              {eff.setbacks?.overlay_m && (
                <Row
                  label="Overlay setback"
                  value={`${eff.setbacks.overlay_m} m${eff.setbacks.overlay_type ? ` (${eff.setbacks.overlay_type})` : ""}`}
                  sub="Additional overlay requirement"
                />
              )}
              {eff.setbacks?.standard_set && (
                <div className="mt-3 border-t border-[var(--border)] pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="info">{eff.setbacks.standard_set}</Badge>
                    {eff.setbacks.standard_set_name && (
                      <span className="text-[12px] font-medium text-[var(--text-secondary)]">{eff.setbacks.standard_set_name}</span>
                    )}
                  </div>
                  {eff.setbacks.ss_rules?.notes?.length > 0 && (
                    <ul className="space-y-1">
                      {eff.setbacks.ss_rules.notes.map((note: string, i: number) => (
                        <li key={i} className="text-[11px] leading-relaxed text-[var(--text-secondary)]">• {note}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {eff.setbacks?.base_side_tiers?.length > 0 && (
                <div className="mt-3 border-t border-[var(--border)] pt-3">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    Side Setback Tiers
                  </p>
                  <div className="space-y-1">
                    {eff.setbacks.base_side_tiers.map((tier: any, i: number) => (
                      <div key={i} className="flex items-baseline justify-between text-[12px]">
                        <span className="text-[var(--text-muted)]">
                          Frontage {tier.frontage_from_m}m{tier.frontage_to_m ? `–${tier.frontage_to_m}m` : "+"}
                        </span>
                        <span className="font-mono font-medium text-[var(--text-primary)]">{tier.setback_m}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Setbacks by building type */}
              {dev.setbacks_by_type && Object.keys(dev.setbacks_by_type).length > 0 && (
                <div className="mt-3 border-t border-[var(--border)] pt-3">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    Side Setback by Building Type
                  </p>
                  <div className="space-y-1">
                    {Object.entries(dev.setbacks_by_type).map(([type, vals]: [string, any]) => (
                      <div key={type} className="flex items-baseline justify-between text-[12px]">
                        <span className="text-[var(--text-muted)]">{type}</span>
                        <span className="font-mono font-medium text-[var(--text-primary)]">{vals.side_m} m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
            <Card label="Lot Dimensions">
              <Row label="Min frontage" value={ev("effective_standards.lot_dimensions.min_frontage_m", minFrontage, minFrontage.value != null ? `${fmt(minFrontage.value as number, 1)} m` : null)} sub={eff.lot_dimensions?.frontage_source} />
              <Row label="Min lot area" value={ev("effective_standards.lot_dimensions.min_area_sqm", minArea, minArea.value != null ? `${fmt(minArea.value as number)} m²` : null)} sub={eff.lot_dimensions?.area_source} />
              <Row label="Max units" value={ev("effective_standards.zone_label.max_units", maxUnitsField, maxUnitsField.value != null ? String(maxUnitsField.value) : null)} />
              {dev.lot && (
                <>
                  <div className="my-2 border-t border-[var(--border)]" />
                  <Row label="Est. lot area" value={dev.lot.area_sqm ? `${fmt(dev.lot.area_sqm)} m²` : null} sub={dev.lot.area_source} />
                  <Row label="Est. frontage" value={dev.lot.frontage_m ? `${fmt(dev.lot.frontage_m, 1)} m` : null} sub={dev.lot.frontage_source} />
                  <Row label="Est. depth" value={dev.lot.depth_m ? `${fmt(dev.lot.depth_m, 1)} m` : null} sub={dev.lot.depth_source} />
                </>
              )}
            </Card>

            {/* Lot Coverage */}
            <Card label="Lot Coverage">
              <Row label="Effective coverage" value={eff.lot_coverage?.effective_pct != null ? `${eff.lot_coverage.effective_pct}%` : "Not determined"} />
              <Row label="Source" value={eff.lot_coverage?.effective_source} />
              <Row label="Overlay %" value={ev("effective_standards.lot_coverage.overlay_pct", overlayCovPct, overlayCovPct.value != null ? `${overlayCovPct.value}%` : null)} />
              <Row label="Uses overlay map" value={eff.lot_coverage?.uses_overlay_map ? "Yes" : null} />
              <Row label="No limit if no overlay" value={eff.lot_coverage?.no_limit_if_no_overlay ? "Yes" : null} />
            </Card>

            {/* Landscaping */}
            <LandscapingCard landscaping={eff.landscaping} />

            {/* Existing GFA & headroom */}
            {dev.existing_gfa && (
              <Card label="Existing GFA & Headroom">
                <Row label="Existing GFA" value={dev.existing_gfa.existing_sqm != null ? `${fmt(dev.existing_gfa.existing_sqm)} m²` : null} />
                <Row label="Max permitted" value={dev.existing_gfa.max_permitted_sqm != null ? `${fmt(dev.existing_gfa.max_permitted_sqm)} m²` : null} />
                <Row
                  label="Headroom"
                  value={
                    dev.existing_gfa.headroom_sqm != null
                      ? `${dev.existing_gfa.headroom_sqm > 0 ? "+" : ""}${fmt(dev.existing_gfa.headroom_sqm)} m²`
                      : null
                  }
                />
                {dev.existing_gfa.development_strategy && (
                  <div className="mt-2 pt-2 border-t border-[var(--border)]">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)] mr-2">Strategy</span>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      dev.existing_gfa.development_strategy === "demolish_rebuild" ? "bg-red-100 text-red-700"
                      : dev.existing_gfa.development_strategy === "addition" ? "bg-amber-100 text-amber-700"
                      : dev.existing_gfa.development_strategy === "at_capacity" ? "bg-stone-200 text-stone-600"
                      : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {dev.existing_gfa.development_strategy.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
              </Card>
            )}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  ANGULAR PLANE                                                */}
      {/* ============================================================ */}
      {dev.angular_plane?.applies && (
        <>
          <p className="font-heading text-[15px] font-semibold tracking-tight text-[var(--text-primary)] pt-2">
            Angular Plane
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Angular Plane Analysis" defaultOpen>
              <Row label="Angle" value={ev("development_potential.angular_plane.angle_degrees", angularAngle, angularAngle.value != null ? `${angularAngle.value}°` : "\u2014")} />
              {dev.angular_plane.zone_section && (
                <Row
                  label="By-law section"
                  value={
                    <RefLink type="bylaw-section" id={dev.angular_plane.zone_section} label={`s. ${dev.angular_plane.zone_section}`}>
                      s. {dev.angular_plane.zone_section}
                    </RefLink>
                  }
                />
              )}
              {dev.angular_plane.constrains_envelope != null && (
                <Row label="Constrains envelope" value={dev.angular_plane.constrains_envelope ? "Yes" : "No"} />
              )}
              {dev.angular_plane.binding_constraint && (
                <Row label="Binding constraint" value={dev.angular_plane.binding_constraint} />
              )}
            </Card>

            {dev.angular_plane.height_limits && (
              <Card label="Height Limits from Angular Plane" defaultOpen>
                {Object.entries(dev.angular_plane.height_limits).map(
                  ([location, limit]: [string, any]) => (
                    <Row
                      key={location}
                      label={location.replace(/_/g, " ")}
                      value={typeof limit === "number" ? `${limit}m` : limit != null ? String(limit) : "N/A"}
                    />
                  )
                )}
              </Card>
            )}
          </div>

          {dev.angular_plane.rules?.length > 0 && (
            <Card label="Angular Plane Rules" defaultOpen={false}>
              {dev.angular_plane.rules.map((rule: any, i: number) => (
                <div key={i} className="mb-3 last:mb-0">
                  <p className="text-[12px] font-medium text-[var(--text-primary)]">
                    {rule.type?.replace(/_/g, " ")}
                    {rule.lot_class ? ` (${rule.lot_class} lot)` : ""}
                  </p>
                  {rule.start_height_m != null && (
                    <p className="text-[12px] text-[var(--text-secondary)]">
                      Starts at {rule.start_height_m}m
                      {rule.height_at_rear_setback_m ? `, max ${rule.height_at_rear_setback_m}m at rear setback` : ""}
                      {rule.height_at_front_setback_m ? `, max ${rule.height_at_front_setback_m}m at front setback` : ""}
                    </p>
                  )}
                  {rule.note && <p className="mt-1 text-[11px] italic text-[var(--text-muted)]">{rule.note}</p>}
                </div>
              ))}
            </Card>
          )}

          {dev.angular_plane.rear_assumed && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-700">
              <AlertTriangle className="mr-1 inline h-3.5 w-3.5" /> Assumed lot abuts residential/open-space zone (conservative default).
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  SEPARATION DISTANCES                                         */}
      {/* ============================================================ */}
      {dev.separation_distances?.applies && (
        <>
          <p className="font-heading text-[15px] font-semibold tracking-tight text-[var(--text-primary)] pt-2">
            Separation Distances
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Building Separation Rules" defaultOpen>
              {dev.separation_distances.bylaw_section && (
                <Row label="By-law section" value={
                  <RefLink type="bylaw-section" id={dev.separation_distances.bylaw_section} label={`s. ${dev.separation_distances.bylaw_section}`}>
                    s. {dev.separation_distances.bylaw_section}
                  </RefLink>
                } />
              )}
              <Row label="Zone" value={dev.separation_distances.zone_code} />
              {dev.separation_distances.base_rules?.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {dev.separation_distances.base_rules.map((rule: any, i: number) => (
                    <div key={i} className="rounded-lg bg-stone-50 px-3 py-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[12px] text-[var(--text-secondary)]">
                          {rule.max_height_m ? `Up to ${rule.max_height_m}m height` : "All heights"}
                        </span>
                      </div>
                      <div className="mt-1 flex gap-4">
                        <div>
                          <span className="text-[11px] text-[var(--text-muted)]">With openings: </span>
                          <span className="text-[12px] font-medium text-[var(--text-primary)]">{typeof rule.with_openings_m === "number" ? `${rule.with_openings_m}m` : rule.with_openings_m}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-[var(--text-muted)]">Without: </span>
                          <span className="text-[12px] font-medium text-[var(--text-primary)]">{typeof rule.without_openings_m === "number" ? `${rule.without_openings_m}m` : rule.without_openings_m}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {dev.separation_distances.note && (
                <p className="mt-2 text-[11px] italic text-[var(--text-muted)]">{dev.separation_distances.note}</p>
              )}
            </Card>

            {dev.separation_distances.tower_separation?.applies && (
              <Card label="Tower Separation" defaultOpen>
                <Row label="Min distance" value={ev("development_potential.separation_distances.tower_separation.min_distance_m", towerSepField, towerSepField.value != null ? `${towerSepField.value}m` : "\u2014")} />
                <Row label="Height threshold" value={`${dev.separation_distances.tower_separation.threshold_height_m}m`} />
                <Row label="Source" value={dev.separation_distances.tower_separation.source} />
                {dev.separation_distances.tower_separation.note && (
                  <p className="mt-2 text-[11px] italic text-[var(--text-muted)]">{dev.separation_distances.tower_separation.note}</p>
                )}
              </Card>
            )}
          </div>

          {dev.separation_distances.exception_override && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-700">
              <AlertTriangle className="mr-1 inline h-3.5 w-3.5" /> Exception override: {dev.separation_distances.exception_override.separation_m}m separation ({dev.separation_distances.exception_override.source})
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  SHADOW ANALYSIS                                              */}
      {/* ============================================================ */}
      {dev.shadow_analysis?.nearest_park_name && (
        <>
          <p className="font-heading text-[15px] font-semibold tracking-tight text-[var(--text-primary)] pt-2">
            Shadow Analysis
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Nearest Park Shadow Impact" defaultOpen>
              <Row label="Nearest park" value={dev.shadow_analysis.nearest_park_name} />
              <Row label="Distance" value={ev("development_potential.shadow_analysis.nearest_park_distance_m", parkDistance, parkDistance.value != null ? `${parkDistance.value}m` : "\u2014")} />
              {dev.shadow_analysis.nearest_park_class && (
                <Row label="Park class" value={dev.shadow_analysis.nearest_park_class} />
              )}
              {dev.shadow_analysis.shadow_equinox_m != null && (
                <Row
                  label="Shadow (Sep 21 noon)"
                  value={`${dev.shadow_analysis.shadow_equinox_m}m`}
                  sub={dev.shadow_analysis.shadow_reaches_park_equinox ? "⚠ Reaches park" : "Does not reach park"}
                />
              )}
              {dev.shadow_analysis.shadow_equinox_918am_m != null && (
                <Row label="Shadow (Sep 21 9:18AM)" value={`${dev.shadow_analysis.shadow_equinox_918am_m}m`} />
              )}
              {dev.shadow_analysis.shadow_winter_solstice_m != null && (
                <Row
                  label="Shadow (winter solstice noon)"
                  value={`${dev.shadow_analysis.shadow_winter_solstice_m}m`}
                  sub={dev.shadow_analysis.shadow_reaches_park_winter ? "⚠ Reaches park" : "Does not reach park"}
                />
              )}
              {dev.shadow_analysis.constraint_severity && (
                <Row
                  label="Constraint severity"
                  value={
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      dev.shadow_analysis.constraint_severity === "high" ? "bg-red-100 text-red-700"
                        : dev.shadow_analysis.constraint_severity === "medium" ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {dev.shadow_analysis.constraint_severity}
                    </span>
                  }
                />
              )}
              {dev.shadow_analysis.nearby_park_count > 0 && (
                <Row label="Parks within range" value={dev.shadow_analysis.nearby_park_count} />
              )}
              {dev.shadow_analysis.worst_case_shadow_m != null && (
                <Row label="Worst-case shadow" value={`${dev.shadow_analysis.worst_case_shadow_m}m`} sub={dev.shadow_analysis.worst_case_time ? `at ${dev.shadow_analysis.worst_case_time}` : undefined} />
              )}
              {dev.shadow_analysis.hours_impacting_park > 0 && (
                <Row label="Hours impacting park" value={`${dev.shadow_analysis.hours_impacting_park} hrs`} />
              )}
              {dev.shadow_analysis.impacted_parks?.length > 0 && (
                <Row label="Impacted parks" value={dev.shadow_analysis.impacted_parks.join(", ")} />
              )}
            </Card>

            {/* Hourly sweep table */}
            {dev.shadow_analysis.hourly_sweep?.length > 0 && (
              <Card label="Hourly Shadow Sweep (Sep 21)" defaultOpen={false}>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-left">
                        <th className="px-2 py-1.5 font-semibold text-[var(--text-secondary)]">Time</th>
                        <th className="px-2 py-1.5 font-semibold text-[var(--text-secondary)]">Shadow</th>
                        <th className="px-2 py-1.5 font-semibold text-[var(--text-secondary)]">Direction</th>
                        <th className="px-2 py-1.5 font-semibold text-[var(--text-secondary)]">Park Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dev.shadow_analysis.hourly_sweep.map((h: any, i: number) => (
                        <tr key={i} className="border-b border-[var(--border)]">
                          <td className="px-2 py-1.5 font-medium text-[var(--text-primary)]">{h.time_edt}</td>
                          {h.sun_below_horizon ? (
                            <>
                              <td colSpan={3} className="px-2 py-1.5 text-[var(--text-muted)] italic">Sun below horizon</td>
                            </>
                          ) : (
                            <>
                              <td className="px-2 py-1.5 text-[var(--text-secondary)]">{h.shadow_length_m != null ? `${Math.round(h.shadow_length_m)}m` : "—"}</td>
                              <td className="px-2 py-1.5 text-[var(--text-secondary)]">{h.shadow_direction_deg != null ? `${Math.round(h.shadow_direction_deg)}°` : "—"}</td>
                              <td className="px-2 py-1.5">
                                {h.reaches_park ? (
                                  <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700"><AlertTriangle className="mr-0.5 inline h-3 w-3" />Yes</span>
                                ) : (
                                  <span className="text-[var(--text-muted)]">No</span>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {dev.shadow_analysis.summary_text && (
            <p className="text-[11px] italic text-[var(--text-muted)]">{dev.shadow_analysis.summary_text}</p>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  STEPBACK / TOWER PLATE RULES                                 */}
      {/* ============================================================ */}
      {eff.stepback_rules && (
        <>
          <p className="font-heading text-[15px] font-semibold tracking-tight text-[var(--text-primary)] pt-2">
            Stepback & Tower Rules
          </p>

          <div className="rounded-xl border border-violet-200 bg-[var(--card)] p-5 shadow-sm">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-violet-400">
              From Exception Text
            </p>
            <div className="space-y-3">
              {eff.stepback_rules.stepbacks?.length > 0 && (
                <div>
                  <p className="mb-2 text-[12px] font-medium text-[var(--text-secondary)]">Required Stepbacks</p>
                  <div className="space-y-2">
                    {eff.stepback_rules.stepbacks.map((sb: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-violet-50 px-3 py-2">
                        <span className="text-[18px] font-bold text-violet-600">{sb.depth_m}m</span>
                        <div>
                          <p className="text-[12px] font-medium text-[var(--text-primary)]">Stepback depth</p>
                          <p className="text-[11px] text-[var(--text-muted)]">Above {sb.above_height_m} m height</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {eff.stepback_rules.podium_transition_height_m && (
                  <div className="rounded-lg border border-[var(--border)] bg-stone-50 p-3">
                    <p className="text-[18px] font-bold text-[var(--text-primary)]">{eff.stepback_rules.podium_transition_height_m} m</p>
                    <p className="text-[12px] text-[var(--text-secondary)]">Podium Transition Height</p>
                  </div>
                )}
                {(eff.stepback_rules.podium_max_height_m || podiumMaxH.isEdited) && (
                  <div className="rounded-lg border border-[var(--border)] bg-stone-50 p-3">
                    <EditableField {...ep("effective_standards.stepback_rules.podium_max_height_m", podiumMaxH)}>
                      <p className="text-[18px] font-bold text-[var(--text-primary)]">{podiumMaxH.value as number} m</p>
                    </EditableField>
                    <p className="text-[12px] text-[var(--text-secondary)]">Max Podium Height</p>
                  </div>
                )}
                {(eff.stepback_rules.tower_floorplate_max_sqm || towerFloorplate.isEdited) && (
                  <div className="rounded-lg border border-[var(--border)] bg-stone-50 p-3">
                    <EditableField {...ep("effective_standards.stepback_rules.tower_floorplate_max_sqm", towerFloorplate)}>
                      <p className="text-[18px] font-bold text-[var(--text-primary)]">{fmt(towerFloorplate.value as number)} m²</p>
                    </EditableField>
                    <p className="text-[12px] text-[var(--text-secondary)]">Max Tower Floor Plate</p>
                  </div>
                )}
                {(eff.stepback_rules.tower_separation_m || towerSepRule.isEdited) && (
                  <div className="rounded-lg border border-[var(--border)] bg-stone-50 p-3">
                    <EditableField {...ep("effective_standards.stepback_rules.tower_separation_m", towerSepRule)}>
                      <p className="text-[18px] font-bold text-[var(--text-primary)]">{towerSepRule.value as number} m</p>
                    </EditableField>
                    <p className="text-[12px] text-[var(--text-secondary)]">Min Tower Separation</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Error banners */}
      {hasEffError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-700">
          <span className="font-semibold">Standards Error:</span> {eff.error}
        </div>
      )}
      {hasDevError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-700">
          <span className="font-semibold">Development Potential Error:</span> {dev.error}
        </div>
      )}

      {/* ── Section Note ── */}
      <SectionNoteEditor
        sectionId="building_envelope"
        note={sectionNotes?.building_envelope || ""}
        onNoteChange={onEditNote || (() => {})}
        editMode={!!editMode}
      />
    </div>
    </FlagProvider>
  );
}
