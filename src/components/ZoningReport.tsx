"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";

interface Props {
  data: Record<string, any>;
}

/* ------------------------------------------------------------------ */
/*  Tiny primitives                                                    */
/* ------------------------------------------------------------------ */

function Card({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-lg border border-stone-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-stone-400">
          {label}
        </h3>
        <svg
          className={`h-4 w-4 text-stone-300 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div className="border-t border-stone-100 px-5 py-4">{children}</div>}
    </section>
  );
}

function Metric({
  value,
  unit,
  label,
  accent,
}: {
  value: string | number;
  unit?: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-lg px-4 py-3 ${accent ? "bg-stone-900 text-white" : "bg-stone-50"}`}>
      <p className={`text-[22px] font-semibold tracking-tight ${accent ? "text-white" : "text-stone-900"}`}>
        {value}
        {unit && (
          <span className={`ml-0.5 text-[13px] font-normal ${accent ? "text-stone-400" : "text-stone-400"}`}>
            {unit}
          </span>
        )}
      </p>
      <p className={`mt-0.5 text-[12px] ${accent ? "text-stone-400" : "text-stone-500"}`}>
        {label}
      </p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  if (value === null || value === undefined || value === "" || value === "not specified")
    return null;
  const display = typeof value === "object" ? JSON.stringify(value) : String(value);
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-stone-50 py-2 last:border-0">
      <span className="shrink-0 text-[13px] text-stone-400">{label}</span>
      <span
        className={`text-right text-[13px] font-medium text-stone-900 ${mono ? "font-mono" : ""}`}
      >
        {display}
      </span>
    </div>
  );
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "active" | "warning" | "danger" | "success";
}) {
  const styles = {
    default: "border-stone-200 bg-stone-50 text-stone-500",
    active: "border-stone-300 bg-stone-100 text-stone-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ZoningReport({ data }: Props) {
  const eff = data.effective_standards || {};
  const dev = data.development_potential || {};
  const layers = data.layers || {};
  const coords = data.coordinates || {};

  const hasEffError = eff.error;
  const hasDevError = dev.error;

  /* -------- zone info -------- */
  const zoneLabel = eff.zone_label || {};
  const zoneCode = eff.zone_code || zoneLabel.zone_code || "";
  const zoneString = eff.zone_string || "";
  const exceptionNum = zoneLabel.exception_number || eff.exception?.exception_number;

  /* -------- overlay status -------- */
  const overlayDefs = [
    { key: "height_overlay", label: "Height Overlay", detail: layers.height_overlay ? `${layers.height_overlay.HT_LABEL}m / ${layers.height_overlay.HT_STORIES} st` : undefined },
    { key: "lot_coverage_overlay", label: "Lot Coverage", detail: layers.lot_coverage_overlay ? `${layers.lot_coverage_overlay.PRCNT_CVER}%` : undefined },
    { key: "building_setback_overlay", label: "Setback Overlay", detail: layers.building_setback_overlay?.SETBACK ? `${layers.building_setback_overlay.SETBACK}m` : undefined },
    { key: "parking_zone_overlay", label: "Parking Zone", detail: layers.parking_zone_overlay?.ZN_PARKZONE },
    { key: "policy_area_overlay", label: "Policy Area", detail: layers.policy_area_overlay?.POLICY_ARE || layers.policy_area_overlay?.POLICY_ID },
    { key: "policy_road_overlay", label: "Policy Road", detail: layers.policy_road_overlay?.ROAD_NAME },
    { key: "heritage_register", label: "Heritage", detail: layers.heritage_register?.STATUS },
    { key: "heritage_conservation_district", label: "Heritage Conservation District", detail: layers.heritage_conservation_district?.HCD_NAME },
    { key: "secondary_plan", label: "Secondary Plan", detail: layers.secondary_plan?.SECONDARY_PLAN_NAME },
    { key: "major_transit_station_area", label: "MTSA", detail: layers.major_transit_station_area?.StationNam },
    { key: "ravine_protection", label: "Ravine Protection" },
    { key: "environmentally_significant_area", label: "ESA", detail: layers.environmentally_significant_area?.ESA_NAME },
    { key: "natural_heritage_system", label: "Natural Heritage" },
    { key: "archaeological_potential", label: "Archaeological" },
    { key: "rooming_house_overlay", label: "Rooming House" },
    { key: "priority_retail_street_overlay", label: "Priority Retail" },
  ];

  const activeOverlays = overlayDefs.filter((o) => !!layers[o.key]);
  const inactiveOverlays = overlayDefs.filter((o) => !layers[o.key]);

  /* -------- constraints -------- */
  const constraints = dev.constraints?.items || [];
  const severityColor: Record<string, "danger" | "warning" | "default"> = {
    high: "danger",
    medium: "warning",
    low: "default",
  };

  return (
    <div className="mt-10 space-y-4">
      {/* ====== ADDRESS HEADER ====== */}
      <div className="rounded-lg border border-stone-200 bg-white px-5 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[20px] font-semibold tracking-tight text-stone-900">
              {data.address}
            </h2>
            <p className="mt-1 font-mono text-[12px] text-stone-400">
              {coords.latitude?.toFixed(6)}°N, {Math.abs(coords.longitude)?.toFixed(6)}°W
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {zoneCode && (
              <span className="rounded bg-stone-900 px-2.5 py-1 text-[12px] font-semibold text-white">
                {zoneCode}
              </span>
            )}
            {zoneString && (
              <span className="font-mono text-[12px] text-stone-500">
                {zoneString}
              </span>
            )}
            {exceptionNum && (
              <Badge variant="warning">Exception #{exceptionNum}</Badge>
            )}
            {eff.holding_provision && (
              <Badge variant="danger">Holding (H)</Badge>
            )}
          </div>
        </div>
      </div>

      {/* ====== ERROR BANNERS ====== */}
      {hasEffError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
          {eff.error}
        </div>
      )}
      {hasDevError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
          {dev.error}
        </div>
      )}

      {/* ====== KEY METRICS ====== */}
      {!hasEffError && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {eff.height?.effective_m != null && (
            <Metric value={eff.height.effective_m} unit="m" label="Max height" />
          )}
          {(eff.height?.effective_storeys ?? dev.height?.max_storeys) != null && (
            <Metric
              value={eff.height?.effective_storeys ?? dev.height?.max_storeys}
              label="Storeys"
            />
          )}
          {eff.fsi?.effective_total != null && (
            <Metric value={eff.fsi.effective_total} label="FSI" />
          )}
          {eff.lot_coverage?.effective_pct != null && (
            <Metric value={eff.lot_coverage.effective_pct} unit="%" label="Lot coverage" />
          )}
          {dev.max_gfa?.sqm != null && (
            <Metric
              value={Number(dev.max_gfa.sqm).toLocaleString()}
              unit="m²"
              label="Max GFA"
              accent
            />
          )}
        </div>
      )}

      {/* ====== CONSTRAINTS ====== */}
      {constraints.length > 0 && (
        <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-stone-400">
            Constraints
            <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
              {constraints.length}
            </span>
          </h3>
          <div className="mt-3 space-y-2">
            {constraints.map((c: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <Badge variant={severityColor[c.severity] || "default"}>
                  {c.severity}
                </Badge>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-stone-700">{c.layer}</p>
                  <p className="text-[12px] leading-relaxed text-stone-400">{c.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====== ZONING STANDARDS ====== */}
      {!hasEffError && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card label="Height & Density">
            <Row label="Effective height" value={eff.height?.effective_m ? `${eff.height.effective_m} m` : null} />
            <Row label="Storeys" value={eff.height?.effective_storeys} />
            <Row label="Source" value={eff.height?.effective_source} />
            <Row label="Base default" value={eff.height?.base_default_m ? `${eff.height.base_default_m} m` : null} />
            <Row label="Overlay" value={eff.height?.overlay_m ? `${eff.height.overlay_m} m` : null} />
            <Row label="FSI" value={eff.fsi?.effective_total} />
            <Row label="FSI source" value={eff.fsi?.effective_source} />
            {eff.fsi?.is_compound && (
              <>
                <Row label="Commercial FSI" value={eff.fsi.fsi_commercial_max} />
                <Row label="Residential FSI" value={eff.fsi.fsi_residential_max} />
                <Row label="Note" value={eff.fsi.compound_note} />
              </>
            )}
          </Card>

          <Card label="Setbacks">
            <Row label="Front" value={eff.setbacks?.effective_front_m ? `${eff.setbacks.effective_front_m} m` : null} />
            <Row label="Rear" value={eff.setbacks?.effective_rear_m ? `${eff.setbacks.effective_rear_m} m` : null} />
            <Row label="Side" value={eff.setbacks?.effective_side_m ? `${eff.setbacks.effective_side_m} m` : null} />
            {eff.setbacks?.exception_side_m && (
              <Row label="Side (exception)" value={`${eff.setbacks.exception_side_m} m`} />
            )}
            <Row label="Coverage" value={eff.lot_coverage?.effective_pct ? `${eff.lot_coverage.effective_pct}%` : null} />
            <Row label="Coverage source" value={eff.lot_coverage?.effective_source} />
          </Card>

          <Card label="Lot Dimensions">
            <Row label="Min frontage" value={eff.lot_dimensions?.min_frontage_m ? `${eff.lot_dimensions.min_frontage_m} m` : null} />
            <Row label="Frontage source" value={eff.lot_dimensions?.frontage_source} />
            <Row label="Min area" value={eff.lot_dimensions?.min_area_sqm ? `${eff.lot_dimensions.min_area_sqm} m²` : null} />
            <Row label="Area source" value={eff.lot_dimensions?.area_source} />
            {dev.lot && (
              <>
                <Row label="Est. depth" value={dev.lot.depth_m ? `${dev.lot.depth_m} m` : null} />
                <Row label="Depth source" value={dev.lot.depth_source} />
              </>
            )}
          </Card>

          <Card label="Building Types & Uses">
            {eff.permitted_building_types?.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-[12px] text-stone-400">Building types</p>
                <div className="flex flex-wrap gap-1.5">
                  {eff.permitted_building_types.map((t: string) => (
                    <Badge key={t} variant="success">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
            {eff.permitted_uses?.length > 0 && (
              <div>
                <p className="mb-2 text-[12px] text-stone-400">Permitted uses</p>
                <div className="flex flex-wrap gap-1.5">
                  {eff.permitted_uses.map((u: string) => (
                    <Badge key={u} variant="active">{u}</Badge>
                  ))}
                </div>
              </div>
            )}
            {dev.building_types?.feasible?.length > 0 && (
              <div className="mt-3 border-t border-stone-100 pt-3">
                <p className="mb-2 text-[12px] text-stone-400">Feasible types</p>
                {dev.building_types.feasible.map((f: any) => (
                  <div key={f.type} className="py-1">
                    <span className="text-[13px] font-medium text-stone-700">{f.type}</span>
                    {f.notes?.length > 0 && (
                      <p className="text-[12px] text-stone-400">{f.notes.join("; ")}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ====== OVERLAYS ====== */}
      <Card label="Overlays & Layers" defaultOpen={false}>
        {activeOverlays.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[12px] font-medium text-stone-500">Active</p>
            <div className="flex flex-wrap gap-2">
              {activeOverlays.map((o) => (
                <span
                  key={o.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-[12px] text-stone-700"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {o.label}
                  {o.detail && (
                    <span className="text-stone-400">· {o.detail}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
        {inactiveOverlays.length > 0 && (
          <div>
            <p className="mb-2 text-[12px] font-medium text-stone-500">Not applicable</p>
            <div className="flex flex-wrap gap-2">
              {inactiveOverlays.map((o) => (
                <span
                  key={o.key}
                  className="rounded-full border border-stone-100 bg-stone-50 px-3 py-1 text-[12px] text-stone-300"
                >
                  {o.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ====== DEVELOPMENT POTENTIAL ====== */}
      {dev && !hasDevError && (
        <Card label="Development Potential">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dev.max_gfa && (
              <div className="rounded-lg bg-stone-50 p-4">
                <p className="text-[20px] font-semibold text-stone-900">
                  {Number(dev.max_gfa.sqm).toLocaleString()} m²
                </p>
                <p className="text-[12px] text-stone-400">Max GFA</p>
                <p className="mt-1 text-[11px] text-stone-400">
                  Limited by {dev.max_gfa.limiting_factor}
                </p>
              </div>
            )}
            {dev.coverage && (
              <div className="rounded-lg bg-stone-50 p-4">
                <p className="text-[20px] font-semibold text-stone-900">
                  {dev.coverage.max_footprint_sqm} m²
                </p>
                <p className="text-[12px] text-stone-400">Max footprint</p>
                <p className="mt-1 text-[11px] text-stone-400">
                  {dev.coverage.max_pct}% coverage ({dev.coverage.source})
                </p>
              </div>
            )}
            {dev.floor_plate && (
              <div className="rounded-lg bg-stone-50 p-4">
                <p className="text-[20px] font-semibold text-stone-900">
                  {dev.floor_plate.max_sqm} m²
                </p>
                <p className="text-[12px] text-stone-400">Floor plate</p>
                <p className="mt-1 text-[11px] text-stone-400">
                  Limited by {dev.floor_plate.limiting_factor}
                </p>
              </div>
            )}
          </div>

          {dev.setbacks && (
            <div className="mt-4 rounded-lg border border-stone-100 p-4">
              <p className="mb-2 text-[12px] font-medium text-stone-500">
                Buildable envelope
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[16px] font-semibold text-stone-900">
                    {dev.setbacks.buildable_width_m} m
                  </p>
                  <p className="text-[11px] text-stone-400">Width</p>
                </div>
                <div>
                  <p className="text-[16px] font-semibold text-stone-900">
                    {dev.setbacks.buildable_depth_m} m
                  </p>
                  <p className="text-[11px] text-stone-400">Depth</p>
                </div>
                <div>
                  <p className="text-[16px] font-semibold text-stone-900">
                    {dev.setbacks.buildable_area_sqm} m²
                  </p>
                  <p className="text-[11px] text-stone-400">Buildable area</p>
                </div>
              </div>
            </div>
          )}

          {dev.max_gfa?.all_limits && (
            <div className="mt-4">
              <p className="mb-2 text-[12px] font-medium text-stone-500">
                GFA constraints breakdown
              </p>
              {Object.entries(dev.max_gfa.all_limits).map(([factor, val]: [string, any]) => (
                <div key={factor} className="flex items-center justify-between py-1.5">
                  <span className="text-[13px] text-stone-500">{factor}</span>
                  <span className="font-mono text-[13px] font-medium text-stone-900">
                    {Number(val).toLocaleString()} m²
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ====== PARKING ====== */}
      {(eff.parking || dev.parking_estimate) && (
        <Card label="Parking" defaultOpen={false}>
          <Row label="Parking zone" value={eff.parking?.parking_zone || eff.parking_zone} />

          {dev.parking_estimate && (
            <>
              <Row label="Residential spaces" value={dev.parking_estimate.residential_spaces} />
              <Row label="Note" value={dev.parking_estimate.residential_note} />
              <Row label="Visitor spaces" value={dev.parking_estimate.visitor_spaces} />
              <Row label="Visitor note" value={dev.parking_estimate.visitor_note} />
            </>
          )}

          {eff.parking?.residential_rates && (
            <div className="mt-3 border-t border-stone-100 pt-3">
              <p className="mb-2 text-[12px] font-medium text-stone-500">
                Residential rates
              </p>
              {Object.entries(eff.parking.residential_rates).map(
                ([type, rate]: [string, any]) => (
                  <div key={type} className="flex items-baseline justify-between py-1">
                    <span className="text-[13px] text-stone-600">{type}</span>
                    <span className="text-[12px] text-stone-400">
                      {rate.description || rate.requirement}
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {eff.parking?.visitor_parking && (
            <div className="mt-3 border-t border-stone-100 pt-3">
              <p className="mb-2 text-[12px] font-medium text-stone-500">
                Visitor parking
              </p>
              <Row label="Formula" value={eff.parking.visitor_parking.formula} mono />
            </div>
          )}

          {dev.parking_estimate?.exemption_notes?.length > 0 && (
            <div className="mt-3 border-t border-stone-100 pt-3">
              <p className="mb-2 text-[12px] font-medium text-stone-500">
                Exemptions
              </p>
              <ul className="space-y-1">
                {dev.parking_estimate.exemption_notes.map((n: string, i: number) => (
                  <li key={i} className="text-[12px] leading-relaxed text-stone-400">
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* ====== EXCEPTION DETAILS ====== */}
      {eff.exception && eff.exception.exception_number && (
        <Card label={`Exception #${eff.exception.exception_number}`} defaultOpen={false}>
          {eff.exception.provisions?.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-[12px] font-medium text-stone-500">
                Provisions
              </p>
              <ul className="space-y-1">
                {eff.exception.provisions.map((p: string, i: number) => (
                  <li key={i} className="text-[13px] leading-relaxed text-stone-600">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {eff.exception.numeric_overrides &&
            Object.keys(eff.exception.numeric_overrides).length > 0 && (
              <div className="mt-3 border-t border-stone-100 pt-3">
                <p className="mb-2 text-[12px] font-medium text-stone-500">
                  Numeric overrides
                </p>
                {Object.entries(eff.exception.numeric_overrides).map(
                  ([key, val]: [string, any]) => (
                    <Row key={key} label={key} value={val} />
                  )
                )}
              </div>
            )}
        </Card>
      )}

      {/* ====== OFFICIAL PLAN CONTEXT ====== */}
      {eff.op_context && (
        <Card label="Official Plan Context" defaultOpen={false}>
          {eff.op_context.op_designation && (
            <>
              <Row label="Designation" value={eff.op_context.op_designation.designation} />
              <Row label="Section" value={eff.op_context.op_designation.section} />
              <Row label="Description" value={eff.op_context.op_designation.description} />
            </>
          )}
          {eff.op_context.secondary_plan && (
            <>
              <Row label="Secondary plan" value={eff.op_context.secondary_plan.plan_name} />
              <Row label="Plan number" value={eff.op_context.secondary_plan.plan_number} />
            </>
          )}
          {eff.op_context.mtsa && (
            <>
              <Row label="MTSA station" value={eff.op_context.mtsa.station_name} />
              <Row label="MTSA type" value={eff.op_context.mtsa.mtsa_type} />
            </>
          )}
          {eff.op_context.sasp_policies?.length > 0 && (
            <div className="mt-3 border-t border-stone-100 pt-3">
              <p className="mb-2 text-[12px] font-medium text-stone-500">
                Site & Area Specific Policies
              </p>
              {eff.op_context.sasp_policies.map((sasp: any, i: number) => (
                <div key={i} className="mb-2">
                  <p className="text-[13px] font-medium text-stone-700">
                    SASP #{sasp.sasp_number} — {sasp.title}
                  </p>
                  {sasp.content && (
                    <p className="text-[12px] leading-relaxed text-stone-400">
                      {sasp.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ====== DEVELOPMENT CHARGES ====== */}
      {dev.development_charges && (
        <Card label="Development Charges" defaultOpen={false}>
          {dev.development_charges.estimates?.map((est: any, i: number) => (
            <div key={i} className="flex items-baseline justify-between py-1.5">
              <span className="text-[13px] text-stone-600">
                {est.category}{" "}
                <span className="text-stone-400">
                  ({est.units} × ${Number(est.rate_per_unit).toLocaleString()})
                </span>
              </span>
              <span className="font-mono text-[13px] font-semibold text-stone-900">
                ${Number(est.total).toLocaleString()}
              </span>
            </div>
          ))}
          {dev.development_charges.total_estimated && (
            <div className="mt-2 flex items-baseline justify-between border-t border-stone-200 pt-2">
              <span className="text-[13px] font-medium text-stone-700">
                Total estimated
              </span>
              <span className="font-mono text-[15px] font-bold text-stone-900">
                ${Number(dev.development_charges.total_estimated).toLocaleString()}
              </span>
            </div>
          )}
          {dev.development_charges.note && (
            <p className="mt-3 text-[11px] leading-relaxed text-stone-400">
              {dev.development_charges.note}
            </p>
          )}
        </Card>
      )}

      {/* ====== PLANNING CONTACT ====== */}
      {data.planning_contact && (
        <Card label="Planning Contact" defaultOpen={false}>
          <Row label="District" value={data.planning_contact.DISTRICT} />
          <Row label="Section" value={data.planning_contact.SECTION} />
          <Row label="Manager" value={data.planning_contact.MANAGER} />
          <Row label="Phone" value={data.planning_contact.PHONE} />
          <Row label="Email" value={data.planning_contact.EMAIL} />
        </Card>
      )}

      {/* ====== NOTES ====== */}
      {dev.notes?.length > 0 && (
        <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
          <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
            Notes
          </h3>
          <ul className="space-y-1.5">
            {dev.notes.map((note: string, i: number) => (
              <li key={i} className="text-[13px] leading-relaxed text-stone-600">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ====== RAW JSON ====== */}
      <details className="rounded-lg border border-stone-200 bg-white">
        <summary className="cursor-pointer px-5 py-3 text-[13px] font-medium text-stone-400 hover:text-stone-600">
          Raw JSON response
        </summary>
        <pre className="max-h-96 overflow-auto border-t border-stone-100 px-5 py-4 font-mono text-[11px] leading-relaxed text-stone-500">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
