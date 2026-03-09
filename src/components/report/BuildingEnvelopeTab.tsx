"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * BuildingEnvelopeTab — Setback diagram, development metrics,
 * GFA breakdown, angular plane, shadow analysis, building types.
 *
 * Everything from the old "What Can I Build" + "Zoning Standards" +
 * "Angular Plane" + "Shadow" sections, consolidated into one tab.
 */

import { Card, Row, Badge, SetbackDiagram, Tag } from "./primitives";
import { RefLink } from "../ReferencePanel";
import LandscapingCard from "./LandscapingCard";

interface BuildingEnvelopeTabProps {
  data: Record<string, any>;
  onAnalyzeUse?: (use: string) => void;
}

function fmt(n: number | undefined | null, decimals = 0) {
  if (n == null) return "—";
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function BuildingEnvelopeTab({ data, onAnalyzeUse }: BuildingEnvelopeTabProps) {
  const eff = data.effective_standards || {};
  const dev = data.development_potential || {};
  const hasEffError = eff.error;
  const hasDevError = dev.error;

  return (
    <div className="space-y-5">
      {/* ============================================================ */}
      {/*  BUILDING ENVELOPE — setback diagram + key metrics            */}
      {/* ============================================================ */}
      {dev && !hasDevError && (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            {/* Setback diagram */}
            {dev.setbacks && (
              <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm md:col-span-2">
                <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
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
              {dev.max_gfa && (
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
                <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <p className="text-[20px] font-bold text-stone-900">{dev.height.max_m != null ? `${dev.height.max_m} m` : "—"}</p>
                  <p className="text-[12px] text-stone-500">Max Height</p>
                  {dev.height.max_storeys && (
                    <p className="text-[11px] text-stone-400">~{dev.height.max_storeys} storeys est.</p>
                  )}
                </div>
              )}
              {dev.coverage && (
                <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <p className="text-[20px] font-bold text-stone-900">{fmt(dev.coverage.max_footprint_sqm)} m²</p>
                  <p className="text-[12px] text-stone-500">Max Footprint</p>
                  <p className="text-[11px] text-stone-400">{dev.coverage.max_pct}% coverage</p>
                </div>
              )}
              {dev.floor_plate && (
                <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <p className="text-[20px] font-bold text-stone-900">{fmt(dev.floor_plate.max_sqm)} m²</p>
                  <p className="text-[12px] text-stone-500">Floor Plate</p>
                  <p className="text-[11px] text-stone-400">by {dev.floor_plate.limiting_factor || "—"}</p>
                </div>
              )}
              {dev.setbacks && (
                <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <p className="text-[20px] font-bold text-stone-900">{fmt(dev.setbacks.buildable_area_sqm)} m²</p>
                  <p className="text-[12px] text-stone-500">Buildable Area</p>
                  <p className="text-[11px] text-stone-400">
                    {dev.setbacks.buildable_width_m != null && dev.setbacks.buildable_depth_m != null ? `${dev.setbacks.buildable_width_m}m × ${dev.setbacks.buildable_depth_m}m` : "—"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* GFA constraints breakdown */}
          {dev.max_gfa?.all_limits && (
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
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
                          <span className={`text-[13px] ${isControlling ? "font-semibold text-stone-900" : "text-stone-500"}`}>
                            {factor}{" "}
                            {isControlling && <span className="text-emerald-600">◀ controls</span>}
                          </span>
                          <span className="font-mono text-[13px] font-semibold text-stone-900">
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
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                Building Types
              </p>
              <div className="flex flex-wrap gap-2">
                {(dev.building_types.permitted || []).map((t: string) => (
                  <Tag key={t} active icon="✓" onClick={() => onAnalyzeUse?.(t)}>
                    {t}
                  </Tag>
                ))}
              </div>
              {dev.building_types.feasible?.length > 0 &&
                dev.building_types.feasible.some((f: any) => f.notes?.length > 0) && (
                  <div className="mt-4 border-t border-stone-100 pt-3">
                    <p className="mb-2 text-[12px] font-medium text-stone-500">Feasibility Notes</p>
                    {dev.building_types.feasible
                      .filter((f: any) => f.notes?.length > 0)
                      .map((f: any) => (
                        <div key={f.type} className="py-1">
                          <span className="text-[13px] font-medium text-stone-700">{f.type}</span>
                          <p className="text-[12px] text-stone-400">{f.notes.join("; ")}</p>
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
          <p className="text-[15px] font-semibold tracking-tight text-stone-900 pt-2">
            Zoning Standards
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Height & Density */}
            <Card label="Height & Density">
              <Row label="Effective height" value={eff.height?.effective_m ? `${eff.height.effective_m} m` : null} />
              <Row label="Max storeys" value={eff.height?.effective_storeys ?? (eff.height?.storeys_unlimited ? "Unlimited" : null)} />
              <Row label="Height source" value={eff.height?.effective_source} />
              <Row label="Base default" value={eff.height?.base_default_m ? `${eff.height.base_default_m} m` : null} sub={eff.height?.source_base} />
              <Row label="Overlay height" value={eff.height?.overlay_m ? `${eff.height.overlay_m} m` : null} />
              <Row label="Overlay storeys" value={eff.height?.overlay_storeys} />
              <div className="my-2 border-t border-stone-100" />
              <Row label="FSI" value={eff.fsi?.effective_total} />
              <Row label="FSI source" value={eff.fsi?.effective_source} />
              {eff.fsi?.is_compound && (
                <>
                  <Row label="Commercial FSI" value={eff.fsi.fsi_commercial_max} />
                  <Row label="Residential FSI" value={eff.fsi.fsi_residential_max} />
                  <Row label="Compound note" value={eff.fsi.compound_note} />
                </>
              )}
            </Card>

            {/* Setbacks */}
            <Card label="Setbacks">
              <Row label="Front" value={eff.setbacks?.effective_front_m ? `${eff.setbacks.effective_front_m} m` : null} />
              <Row label="Rear" value={eff.setbacks?.effective_rear_m ? `${eff.setbacks.effective_rear_m} m` : null} />
              <Row label="Side" value={eff.setbacks?.effective_side_m ? `${eff.setbacks.effective_side_m} m` : null} />
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
                <div className="mt-3 border-t border-stone-100 pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="info">{eff.setbacks.standard_set}</Badge>
                    {eff.setbacks.standard_set_name && (
                      <span className="text-[12px] font-medium text-stone-600">{eff.setbacks.standard_set_name}</span>
                    )}
                  </div>
                  {eff.setbacks.ss_rules?.notes?.length > 0 && (
                    <ul className="space-y-1">
                      {eff.setbacks.ss_rules.notes.map((note: string, i: number) => (
                        <li key={i} className="text-[11px] leading-relaxed text-stone-500">• {note}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {eff.setbacks?.base_side_tiers?.length > 0 && (
                <div className="mt-3 border-t border-stone-100 pt-3">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    Side Setback Tiers
                  </p>
                  <div className="space-y-1">
                    {eff.setbacks.base_side_tiers.map((tier: any, i: number) => (
                      <div key={i} className="flex items-baseline justify-between text-[12px]">
                        <span className="text-stone-400">
                          Frontage {tier.frontage_from_m}m{tier.frontage_to_m ? `–${tier.frontage_to_m}m` : "+"}
                        </span>
                        <span className="font-mono font-medium text-stone-700">{tier.setback_m}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Lot Dimensions */}
            <Card label="Lot Dimensions">
              <Row label="Min frontage" value={eff.lot_dimensions?.min_frontage_m ? `${eff.lot_dimensions.min_frontage_m} m` : null} sub={eff.lot_dimensions?.frontage_source} />
              <Row label="Min lot area" value={eff.lot_dimensions?.min_area_sqm ? `${eff.lot_dimensions.min_area_sqm} m²` : null} sub={eff.lot_dimensions?.area_source} />
              <Row label="Max units" value={eff.zone_label?.max_units || data.layers?.zoning_area?.[0]?.UNITS || (Array.isArray(data.layers?.zoning_area) ? undefined : data.layers?.zoning_area?.UNITS)} />
              {dev.lot && (
                <>
                  <div className="my-2 border-t border-stone-100" />
                  <Row label="Est. lot area" value={dev.lot.area_sqm ? `${dev.lot.area_sqm} m²` : null} sub={dev.lot.area_source} />
                  <Row label="Est. frontage" value={dev.lot.frontage_m ? `${dev.lot.frontage_m} m` : null} sub={dev.lot.frontage_source} />
                  <Row label="Est. depth" value={dev.lot.depth_m ? `${dev.lot.depth_m} m` : null} sub={dev.lot.depth_source} />
                </>
              )}
            </Card>

            {/* Lot Coverage */}
            <Card label="Lot Coverage">
              <Row label="Effective coverage" value={eff.lot_coverage?.effective_pct != null ? `${eff.lot_coverage.effective_pct}%` : "Not determined"} />
              <Row label="Source" value={eff.lot_coverage?.effective_source} />
              <Row label="Overlay %" value={eff.lot_coverage?.overlay_pct ? `${eff.lot_coverage.overlay_pct}%` : null} />
              <Row label="Uses overlay map" value={eff.lot_coverage?.uses_overlay_map ? "Yes" : null} />
              <Row label="No limit if no overlay" value={eff.lot_coverage?.no_limit_if_no_overlay ? "Yes" : null} />
            </Card>

            {/* Landscaping */}
            <LandscapingCard landscaping={eff.landscaping} />
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  ANGULAR PLANE                                                */}
      {/* ============================================================ */}
      {dev.angular_plane?.applies && (
        <>
          <p className="text-[15px] font-semibold tracking-tight text-stone-900 pt-2">
            Angular Plane
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Angular Plane Analysis" defaultOpen>
              <Row label="Angle" value={`${dev.angular_plane.angle_degrees}°`} />
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
                  <p className="text-[12px] font-medium text-stone-700">
                    {rule.type?.replace(/_/g, " ")}
                    {rule.lot_class ? ` (${rule.lot_class} lot)` : ""}
                  </p>
                  {rule.start_height_m != null && (
                    <p className="text-[12px] text-stone-500">
                      Starts at {rule.start_height_m}m
                      {rule.height_at_rear_setback_m ? `, max ${rule.height_at_rear_setback_m}m at rear setback` : ""}
                      {rule.height_at_front_setback_m ? `, max ${rule.height_at_front_setback_m}m at front setback` : ""}
                    </p>
                  )}
                  {rule.note && <p className="mt-1 text-[11px] italic text-stone-400">{rule.note}</p>}
                </div>
              ))}
            </Card>
          )}

          {dev.angular_plane.rear_assumed && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-700">
              ⚠ Assumed lot abuts residential/open-space zone (conservative default).
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  SHADOW ANALYSIS                                              */}
      {/* ============================================================ */}
      {dev.shadow_analysis?.nearest_park_name && (
        <>
          <p className="text-[15px] font-semibold tracking-tight text-stone-900 pt-2">
            Shadow Analysis
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Nearest Park Shadow Impact" defaultOpen>
              <Row label="Nearest park" value={dev.shadow_analysis.nearest_park_name} />
              <Row label="Distance" value={dev.shadow_analysis.nearest_park_distance_m != null ? `${dev.shadow_analysis.nearest_park_distance_m}m` : "—"} />
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
            </Card>
          </div>

          {dev.shadow_analysis.summary_text && (
            <p className="text-[11px] italic text-stone-400">{dev.shadow_analysis.summary_text}</p>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  STEPBACK / TOWER PLATE RULES                                 */}
      {/* ============================================================ */}
      {eff.stepback_rules && (
        <>
          <p className="text-[15px] font-semibold tracking-tight text-stone-900 pt-2">
            Stepback & Tower Rules
          </p>

          <div className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-violet-400">
              From Exception Text
            </p>
            <div className="space-y-3">
              {eff.stepback_rules.stepbacks?.length > 0 && (
                <div>
                  <p className="mb-2 text-[12px] font-medium text-stone-600">Required Stepbacks</p>
                  <div className="space-y-2">
                    {eff.stepback_rules.stepbacks.map((sb: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-violet-50 px-3 py-2">
                        <span className="text-[18px] font-bold text-violet-600">{sb.depth_m}m</span>
                        <div>
                          <p className="text-[12px] font-medium text-stone-700">Stepback depth</p>
                          <p className="text-[11px] text-stone-400">Above {sb.above_height_m} m height</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {eff.stepback_rules.podium_transition_height_m && (
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-[18px] font-bold text-stone-900">{eff.stepback_rules.podium_transition_height_m} m</p>
                    <p className="text-[12px] text-stone-500">Podium Transition Height</p>
                  </div>
                )}
                {eff.stepback_rules.podium_max_height_m && (
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-[18px] font-bold text-stone-900">{eff.stepback_rules.podium_max_height_m} m</p>
                    <p className="text-[12px] text-stone-500">Max Podium Height</p>
                  </div>
                )}
                {eff.stepback_rules.tower_floorplate_max_sqm && (
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-[18px] font-bold text-stone-900">{eff.stepback_rules.tower_floorplate_max_sqm} m²</p>
                    <p className="text-[12px] text-stone-500">Max Tower Floor Plate</p>
                  </div>
                )}
                {eff.stepback_rules.tower_separation_m && (
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-[18px] font-bold text-stone-900">{eff.stepback_rules.tower_separation_m} m</p>
                    <p className="text-[12px] text-stone-500">Min Tower Separation</p>
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
    </div>
  );
}
