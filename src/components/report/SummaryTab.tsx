"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * SummaryTab — The dashboard landing view.
 *
 * Shows a quick-scan card grid of key metrics, constraint flags,
 * and at-a-glance property info. Every piece of data is already
 * in the /lookup response — zero backend changes needed.
 */

import { Badge, severityColor, severityIcon } from "./primitives";
import DevChargesCalculator from "../DevChargesCalculator";
import ZoningStatisticsTable from "./ZoningStatisticsTable";

/* ── Zone look-up: code → plain-English label + inferred current use ── */
const ZONE_META: Record<string, { label: string; use: string; category: string; color: string }> = {
  RD:  { label: "Residential Detached",          use: "Single detached dwelling",                  category: "Residential",  color: "stone"  },
  RS:  { label: "Residential Semi-Detached",      use: "Semi-detached dwellings",                   category: "Residential",  color: "stone"  },
  RB:  { label: "Residential — Small Lot",        use: "Small residential lots / bachelor housing", category: "Residential",  color: "stone"  },
  RM:  { label: "Residential Multiple",           use: "Low-rise multiple dwellings",               category: "Residential",  color: "blue"   },
  RA:  { label: "Residential Apartment",          use: "Mid- to high-rise apartments",              category: "Residential",  color: "blue"   },
  RT:  { label: "Residential Townhouse",          use: "Townhouse and row dwellings",               category: "Residential",  color: "blue"   },
  CR:  { label: "Commercial Residential",         use: "Mixed-use: street-level retail + housing",  category: "Mixed-Use",    color: "violet" },
  CL:  { label: "Commercial Local",               use: "Local neighbourhood commercial",            category: "Commercial",   color: "violet" },
  CS:  { label: "Commercial Shopfront",           use: "Main-street retail / shopfront commercial", category: "Commercial",   color: "violet" },
  CH:  { label: "Commercial Highway",             use: "Highway-oriented commercial / big-box",     category: "Commercial",   color: "amber"  },
  CG:  { label: "Commercial General",             use: "General commercial uses",                   category: "Commercial",   color: "amber"  },
  MC:  { label: "Mixed Commercial",               use: "Mixed commercial / employment",             category: "Mixed-Use",    color: "amber"  },
  MH:  { label: "Mixed-Use — Heavy",              use: "Intensive mixed-use / commercial",          category: "Mixed-Use",    color: "amber"  },
  E:   { label: "Employment",                     use: "Employment / light industrial",             category: "Employment",   color: "orange" },
  EL:  { label: "Employment Light",               use: "Light industrial / employment",             category: "Employment",   color: "orange" },
  EH:  { label: "Employment Heavy",               use: "Heavy industrial uses",                     category: "Employment",   color: "red"    },
  EO:  { label: "Employment Office",              use: "Office-focused employment",                 category: "Employment",   color: "orange" },
  I:   { label: "Institutional",                  use: "Schools, hospitals, civic uses",            category: "Institutional",color: "sky"    },
  O:   { label: "Open Space",                     use: "Parkland / recreational open space",        category: "Open Space",   color: "emerald"},
  ON:  { label: "Open Space Natural",             use: "Natural areas / ravine / conservation",     category: "Open Space",   color: "green"  },
  OR:  { label: "Open Space Recreation",          use: "Active recreation facilities",              category: "Open Space",   color: "emerald"},
  UT:  { label: "Utility & Transportation",       use: "Infrastructure, utilities, transit yards",  category: "Utility",      color: "stone"  },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  Residential:   { bg: "bg-stone-100",   text: "text-stone-700",  ring: "ring-stone-200"  },
  "Mixed-Use":   { bg: "bg-violet-100",  text: "text-violet-700", ring: "ring-violet-200" },
  Commercial:    { bg: "bg-amber-100",   text: "text-amber-700",  ring: "ring-amber-200"  },
  Employment:    { bg: "bg-orange-100",  text: "text-orange-700", ring: "ring-orange-200" },
  Institutional: { bg: "bg-sky-100",     text: "text-sky-700",    ring: "ring-sky-200"    },
  "Open Space":  { bg: "bg-emerald-100", text: "text-emerald-700",ring: "ring-emerald-200"},
  Utility:       { bg: "bg-stone-100",   text: "text-stone-600",  ring: "ring-stone-200"  },
};

function resolveZoneMeta(zoneCode: string) {
  // Exact match first, then prefix match (e.g. "CR.10" → "CR")
  if (ZONE_META[zoneCode]) return ZONE_META[zoneCode];
  const prefix = zoneCode.match(/^[A-Z]+/)?.[0] || "";
  return ZONE_META[prefix] || null;
}

/** Derives a simple opportunity grade from available data. */
function computeOpportunity(dev: any, eff: any) {
  const constraints = dev.constraints?.items || [];
  const highCount = constraints.filter((c: any) => c.severity === "high").length;
  const holding = !!(dev.holding_detail?.detected);
  const heritage = !!(eff.heritage_impact?.has_heritage);
  const pmtsa = !!(dev.constraints?.pmtsa_advisory);
  const fsiAllowed = eff.fsi?.effective_total;
  // Opportunity score: start at 100, deduct
  let score = 100;
  if (highCount >= 3) score -= 40;
  else if (highCount >= 1) score -= 20;
  if (holding) score -= 30;
  if (heritage) score -= 15;
  if (pmtsa) score += 10; // PMTSA = area prioritized for intensification
  // As-of-right FSI signal
  if (fsiAllowed != null && fsiAllowed >= 3) score += 15;
  else if (fsiAllowed != null && fsiAllowed >= 1.5) score += 5;
  score = Math.max(0, Math.min(100, score));
  if (score >= 70) return { grade: "Strong",   color: "emerald", summary: "Good as-of-right development potential with few constraints." };
  if (score >= 40) return { grade: "Moderate", color: "amber",   summary: "Some constraints to navigate — minor variances or studies may be required." };
  return              { grade: "Limited",  color: "red",     summary: "Significant constraints are present. Pre-consultation with the City is strongly recommended." };
}

/* ── PropertySnapshotCard ─────────────────────────────────────────── */
function PropertySnapshotCard({ data }: { data: Record<string, any> }) {
  const eff  = data.effective_standards || {};
  const dev  = data.development_potential || {};

  const zoneCode     = eff.zone_code || eff.zone_label?.zone_code || "";
  const zoneMeta     = resolveZoneMeta(zoneCode);
  const categoryClr  = zoneMeta ? (CATEGORY_COLORS[zoneMeta.category] || CATEGORY_COLORS.Utility) : CATEGORY_COLORS.Utility;

  const opDesignation   = eff.op_context?.op_designation?.designation;
  const lotArea         = dev.lot?.area_sqm;
  const frontage        = dev.lot?.frontage_m;
  const depth           = dev.lot?.depth_m;
  const maxGFA          = dev.max_gfa?.sqm;
  const maxHeight       = eff.height?.effective_m ?? dev.height?.max_m;
  const maxHeightSt     = eff.height?.effective_storeys ?? dev.height?.max_storeys;
  const hasHeritage     = eff.heritage_impact?.has_heritage;
  const hasPMTSA        = !!(dev.constraints?.pmtsa_advisory);
  const pmtsaStation    = dev.constraints?.pmtsa_advisory?.station_name;
  const opportunity     = computeOpportunity(dev, eff);

  const oppColors = {
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   badge: "bg-amber-100 text-amber-800",     dot: "bg-amber-500"   },
    red:     { bg: "bg-red-50",     border: "border-red-200",     badge: "bg-red-100 text-red-800",         dot: "bg-red-500"     },
  };
  const opc = oppColors[opportunity.color as keyof typeof oppColors];

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      {/* ── Part A: What it is today ── */}
      <div className="p-5 border-b border-stone-100">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          Property As-Is
        </p>
        <div className="flex flex-wrap items-start gap-4">
          {/* Zone classification pill */}
          <div className="flex flex-col gap-1.5 min-w-0">
            {zoneMeta ? (
              <span className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ${categoryClr.bg} ${categoryClr.text} ${categoryClr.ring}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                {zoneMeta.category}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-[12px] font-medium text-stone-600 ring-1 ring-stone-200">
                Unknown Zone Type
              </span>
            )}
            <p className="text-[17px] font-bold tracking-tight text-stone-900 leading-snug">
              {zoneMeta?.label || zoneCode || "—"}
            </p>
            {zoneMeta && (
              <p className="text-[13px] text-stone-500 leading-snug">
                Currently used for: <span className="font-medium text-stone-700">{zoneMeta.use}</span>
              </p>
            )}
            {hasPMTSA && (
              <p className="text-[12px] text-sky-600 font-medium">
                📍 Within {pmtsaStation} Station transit area — growth prioritized
              </p>
            )}
            {hasHeritage && (
              <p className="text-[12px] text-amber-700 font-medium">
                🏛 Heritage designation — additional approvals required
              </p>
            )}
          </div>

          {/* Lot dimensions */}
          <div className="ml-auto flex gap-5 shrink-0">
            {lotArea != null && (
              <div>
                <p className="text-[22px] font-bold tracking-tight text-stone-900">{fmt(lotArea)} m²</p>
                <p className="text-[11px] text-stone-400 uppercase tracking-wide">Lot Area</p>
              </div>
            )}
            {frontage != null && (
              <div>
                <p className="text-[22px] font-bold tracking-tight text-stone-900">{frontage}m</p>
                <p className="text-[11px] text-stone-400 uppercase tracking-wide">Frontage</p>
              </div>
            )}
            {depth != null && (
              <div>
                <p className="text-[22px] font-bold tracking-tight text-stone-900">{depth}m</p>
                <p className="text-[11px] text-stone-400 uppercase tracking-wide">Depth</p>
              </div>
            )}
            {opDesignation && (
              <div>
                <p className="text-[13px] font-semibold text-stone-800 leading-snug">{opDesignation}</p>
                <p className="text-[11px] text-stone-400 uppercase tracking-wide">OP Designation</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Part B: Development opportunity ── */}
      <div className={`p-5 ${opc.bg} ${opc.border} border-t-0`}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          Development Opportunity
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {/* Grade badge */}
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${opc.dot}`} />
            <span className={`rounded-full px-3 py-1 text-[13px] font-bold ${opc.badge}`}>
              {opportunity.grade}
            </span>
          </div>
          <p className="text-[13px] text-stone-600 flex-1 min-w-0">
            {opportunity.summary}
          </p>
          {/* Key numbers */}
          <div className="flex gap-4 shrink-0 ml-auto">
            {maxGFA != null && (
              <div className="text-right">
                <p className="text-[16px] font-bold text-stone-900">{fmt(maxGFA)} m²</p>
                <p className="text-[10px] uppercase tracking-wide text-stone-400">Max GFA</p>
              </div>
            )}
            {maxHeight != null && (
              <div className="text-right">
                <p className="text-[16px] font-bold text-stone-900">
                  {maxHeight}m{maxHeightSt ? ` / ${maxHeightSt}st` : ""}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-stone-400">Max Height</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryTabProps {
  data: Record<string, any>;
}

/* ── helper: format number with commas ── */
function fmt(n: number | undefined | null, decimals = 0) {
  if (n == null) return "—";
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function SummaryTab({ data }: SummaryTabProps) {
  const eff = data.effective_standards || {};
  const dev = data.development_potential || {};
  const layers = data.layers || {};
  /* ── zone info ── */
  const zoneLabel = eff.zone_label || {};
  const exceptionNum =
    zoneLabel.exception_number || eff.exception?.exception_number;

  /* ── by-law info ── */
  const zoningArea = layers.zoning_area;
  const primaryZone = Array.isArray(zoningArea) ? zoningArea[0] : zoningArea;
  const holdingProvision = primaryZone?.ZN_HOLDING === "Y";

  /* ── constraints ── */
  const constraints = dev.constraints?.items || [];
  const highConstraints = constraints.filter(
    (c: any) => c.severity === "high"
  );
  const mediumConstraints = constraints.filter(
    (c: any) => c.severity === "medium"
  );

  /* ── overlays ── */
  const overlayKeys = [
    "height_overlay",
    "lot_coverage_overlay",
    "building_setback_overlay",
    "parking_zone_overlay",
    "policy_area_overlay",
    "policy_road_overlay",
    "rooming_house_overlay",
    "priority_retail_street_overlay",
    "queen_st_w_eat_community_overlay",
    "heritage_register",
    "heritage_conservation_district",
    "secondary_plan",
    "major_transit_station_area",
    "ravine_protection",
    "environmentally_significant_area",
    "natural_heritage_system",
    "site_area_specific_policy",
    "archaeological_potential",
    "floodplain",
  ];
  const activeOverlayCount = overlayKeys.filter((k) => {
    const v = layers[k];
    return v != null && !(Array.isArray(v) && v.length === 0);
  }).length;

  /* ── confidence ── */
  const confidence = dev.confidence;
  const confScore = confidence?.overall_score;
  const confLevel = confidence?.overall_confidence;

  /* ── former by-law detection ── */
  const isFormerBylaw = !!dev.former_bylaw_notice?.applies;
  const confGrade = confidence?.grade;

  return (
    <div className="space-y-5">
      {/* ============================================================ */}
      {/*  PROPERTY SNAPSHOT — current state + opportunity              */}
      {/* ============================================================ */}
      <PropertySnapshotCard data={data} />

      {/* ============================================================ */}
      {/*  KEY METRICS — 6-card grid                                    */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Height */}
        <MetricCard
          icon="📏"
          label="Max Height"
          value={
            eff.height?.effective_m != null
              ? `${eff.height.effective_m}m`
              : dev.height?.max_m != null
                ? `${dev.height.max_m}m`
                : "—"
          }
          sub={
            eff.height?.effective_storeys != null
              ? `${eff.height.effective_storeys} storeys`
              : dev.height?.max_storeys != null
                ? `${dev.height.max_storeys} storeys`
                : dev.height?.estimated_storeys != null
                  ? `~${dev.height.estimated_storeys} storeys (est.)`
                  : eff.height?.effective_source || dev.height?.source
          }
          accent={isFormerBylaw ? "amber" : undefined}
        />

        {/* FSI */}
        <MetricCard
          icon="📊"
          label="Max FSI"
          value={eff.fsi?.effective_total != null ? `${eff.fsi.effective_total}` : "—"}
          sub={eff.fsi?.effective_source}
        />

        {/* GFA */}
        <MetricCard
          icon="🏗️"
          label="Max GFA"
          value={dev.max_gfa?.sqm != null ? `${fmt(dev.max_gfa.sqm)} m²` : "—"}
          sub={dev.max_gfa?.limiting_factor ? `by ${dev.max_gfa.limiting_factor}` : undefined}
          accent="emerald"
        />

        {/* Lot Coverage */}
        <MetricCard
          icon="📐"
          label="Lot Coverage"
          value={
            eff.lot_coverage?.effective_pct != null
              ? `${eff.lot_coverage.effective_pct}%`
              : dev.lot_coverage?.max_pct != null
                ? `${dev.lot_coverage.max_pct}%`
                : "—"
          }
          sub={
            dev.coverage?.max_footprint_sqm
              ? `${fmt(dev.coverage.max_footprint_sqm)} m² max footprint`
              : isFormerBylaw && dev.lot_coverage?.max_pct != null
                ? "from coverage overlay"
                : undefined
          }
          accent={isFormerBylaw && dev.lot_coverage?.max_pct != null ? "amber" : undefined}
        />

        {/* Lot Area */}
        <MetricCard
          icon="📍"
          label="Lot Area"
          value={dev.lot?.area_sqm != null ? `${fmt(dev.lot.area_sqm)} m²` : "—"}
          sub={dev.lot?.area_source}
        />

        {/* Parking Zone */}
        <MetricCard
          icon="🅿️"
          label="Parking Zone"
          value={eff.parking?.parking_zone || eff.parking_zone || "—"}
          sub={
            dev.parking_estimate?.residential_spaces != null
              ? `${dev.parking_estimate.residential_spaces} residential spaces est.`
              : undefined
          }
        />
      </div>

      {/* ============================================================ */}
      {/*  SETBACKS — compact bar                                       */}
      {/* ============================================================ */}
      {eff.setbacks && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Setbacks
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SetbackChip label="Front" value={eff.setbacks.effective_front_m} />
            <SetbackChip label="Rear" value={eff.setbacks.effective_rear_m} />
            <SetbackChip label="Side" value={eff.setbacks.effective_side_m} />
            {dev.setbacks?.buildable_area_sqm && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <p className="text-[18px] font-bold tracking-tight text-emerald-800">
                  {fmt(dev.setbacks.buildable_area_sqm)} m²
                </p>
                <p className="text-[11px] text-emerald-600">Buildable Area</p>
                {dev.setbacks.buildable_width_m && dev.setbacks.buildable_depth_m && (
                  <p className="text-[10px] font-mono text-emerald-500">
                    {dev.setbacks.buildable_width_m}m × {dev.setbacks.buildable_depth_m}m
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  ZONING STATISTICS TABLE                                      */}
      {/* ============================================================ */}
      <ZoningStatisticsTable data={data.zoning_statistics_table} />

      {/* ============================================================ */}
      {/*  QUICK FLAGS — constraint / overlay / heritage / confidence    */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          Quick Flags
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {/* Heritage */}
          <FlagItem
            status={eff.heritage_impact?.has_heritage ? "warn" : eff.heritage_impact ? "good" : "neutral"}
            label={
              eff.heritage_impact?.has_heritage
                ? `Heritage: ${eff.heritage_impact.combined_impact}`
                : eff.heritage_impact ? "No Heritage designation" : "Heritage data not loaded"
            }
          />

          {/* Natural Hazards */}
          <FlagItem
            status={eff.natural_hazards?.has_hazards ? "warn" : eff.natural_hazards ? "good" : "neutral"}
            label={
              eff.natural_hazards?.has_hazards
                ? `${eff.natural_hazards.hazard_count} Natural Hazard${eff.natural_hazards.hazard_count > 1 ? "s" : ""}`
                : eff.natural_hazards ? "No Natural Hazard constraints" : "Hazard data not loaded"
            }
          />

          {/* Holding */}
          <FlagItem
            status={holdingProvision ? "bad" : "good"}
            label={holdingProvision ? "Holding (H) provision active" : "No Holding provision"}
          />

          {/* Exception */}
          <FlagItem
            status={exceptionNum ? "warn" : "good"}
            label={
              exceptionNum
                ? `Exception #${exceptionNum} modifies standards`
                : "No zoning exception"
            }
          />

          {/* Site Plan Control */}
          <FlagItem
            status={
              dev.site_plan_control?.required
                ? "warn"
                : dev.site_plan_control?.required === false
                  ? "good"
                  : "neutral"
            }
            label={
              dev.site_plan_control?.required
                ? "Site Plan Control required"
                : dev.site_plan_control?.required === false
                  ? "Site Plan Control not required"
                  : "Site Plan Control — check with City"
            }
          />

          {/* SASP */}
          {eff.op_context?.sasp_policies?.length > 0 && (
            <FlagItem
              status="warn"
              label={`${eff.op_context.sasp_policies.length} SASP polic${eff.op_context.sasp_policies.length > 1 ? "ies" : "y"} apply`}
            />
          )}

          {/* PMTSA */}
          {dev.constraints?.pmtsa_advisory && (
            <FlagItem
              status="info"
              label={`PMTSA: ${dev.constraints.pmtsa_advisory.station_name} Station`}
            />
          )}

          {/* Active overlays */}
          <FlagItem
            status={activeOverlayCount > 0 ? "neutral" : "good"}
            label={`${activeOverlayCount} active overlay${activeOverlayCount !== 1 ? "s" : ""}`}
          />

          {/* Inclusionary Zoning */}
          {dev.inclusionary_zoning?.applies && (
            <FlagItem
              status="warn"
              label={`Inclusionary Zoning: ${dev.inclusionary_zoning.effective_rate_pct}% affordable`}
            />
          )}

          {/* OP Confidence */}
          {eff.op_context?.op_designation?.confidence && (
            <FlagItem
              status={
                eff.op_context.op_designation.confidence === "low" ? "warn"
                  : eff.op_context.op_designation.confidence === "medium" ? "neutral"
                  : "good"
              }
              label={`OP Designation: ${eff.op_context.op_designation.confidence} confidence${eff.op_context.op_designation.caveat ? " ⚠" : ""}`}
            />
          )}

          {/* Noise & Vibration */}
          {dev.noise_vibration?.applies && (
            <FlagItem
              status="warn"
              label={`${dev.noise_vibration.source_count} Noise/Vibration source${dev.noise_vibration.source_count !== 1 ? "s" : ""} nearby`}
            />
          )}

          {/* Holding Detail */}
          {dev.holding_detail?.detected && dev.holding_detail.conditions?.length > 0 && (
            <FlagItem
              status="bad"
              label={`Holding (H): ${dev.holding_detail.condition_count || dev.holding_detail.conditions.length} removal condition${(dev.holding_detail.condition_count || dev.holding_detail.conditions.length) !== 1 ? "s" : ""}`}
            />
          )}

          {/* Rental Replacement */}
          {dev.rental_replacement?.potentially_applies && (
            <FlagItem
              status="warn"
              label={`Rental Replacement: ${dev.rental_replacement.confidence === "high" ? "likely applies" : "may apply"}`}
            />
          )}

          {/* Parking Maximum */}
          {dev.parking_maximum?.applies && dev.parking_maximum.exceeds_maximum && (
            <FlagItem
              status="warn"
              label={`Parking exceeds maximum: ${dev.parking_maximum.max_spaces_permitted} max permitted`}
            />
          )}

          {/* Shadow Impact */}
          {dev.shadow_analysis?.hours_impacting_park > 0 && (
            <FlagItem
              status="warn"
              label={`Shadow impacts ${dev.shadow_analysis.impacted_parks?.length || 1} park${(dev.shadow_analysis.impacted_parks?.length || 1) !== 1 ? "s" : ""} (${dev.shadow_analysis.hours_impacting_park} hrs)`}
            />
          )}

          {/* Separation Distances */}
          {dev.separation_distances?.applies && (
            <FlagItem
              status="neutral"
              label="Separation distance rules apply"
            />
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  DEVELOPMENT CONSTRAINTS — severity-sorted                    */}
      {/* ============================================================ */}
      {constraints.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Development Constraints
            </p>
            <div className="flex items-center gap-2">
              {highConstraints.length > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                  {highConstraints.length} high
                </span>
              )}
              {mediumConstraints.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                  {mediumConstraints.length} medium
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {constraints
              .sort((a: any, b: any) => {
                const order: Record<string, number> = { high: 0, medium: 1, low: 2, info: 3 };
                return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
              })
              .map((c: any, i: number) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    c.severity === "high"
                      ? "border-red-200 bg-red-50/50"
                      : c.severity === "medium"
                        ? "border-amber-200 bg-amber-50/50"
                        : c.severity === "info"
                          ? "border-sky-200 bg-sky-50/50"
                          : "border-stone-200 bg-stone-50/50"
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-[14px]" aria-hidden="true">
                    {severityIcon[c.severity] || "🔵"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-stone-800">
                      {c.label || c.layer || c.tag || "Constraint"}
                    </p>
                    {(c.detail || c.impact) && (
                      <p className="mt-0.5 text-[12px] text-stone-500">
                        {c.detail || c.impact}
                      </p>
                    )}
                  </div>
                  <Badge variant={severityColor[c.severity] || "default"}>
                    {c.severity}
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  COA PRECEDENTS — compact                                     */}
      {/* ============================================================ */}
      {dev.coa_precedents?.total_matches > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Committee of Adjustment Precedents
          </p>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[28px] font-bold tracking-tight text-stone-900">
                {dev.coa_precedents.approval_rate}%
              </p>
              <p className="text-[12px] text-stone-500">Approval Rate</p>
            </div>
            <div className="h-10 w-px bg-stone-200" />
            <div>
              <p className="text-[20px] font-bold tracking-tight text-stone-900">
                {dev.coa_precedents.total_matches}
              </p>
              <p className="text-[12px] text-stone-500">Applications</p>
            </div>
            {dev.coa_precedents.same_zone_count > 0 && (
              <>
                <div className="h-10 w-px bg-stone-200" />
                <div>
                  <p className="text-[20px] font-bold tracking-tight text-stone-900">
                    {dev.coa_precedents.same_zone_approval_rate ?? dev.coa_precedents.approval_rate}%
                  </p>
                  <p className="text-[12px] text-stone-500">Same Zone ({dev.coa_precedents.same_zone_count})</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  CONFIDENCE SCORE — compact                                   */}
      {/* ============================================================ */}
      {confidence && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full border-4 ${
                confGrade === "D" || confLevel === "low"
                  ? "border-red-400 text-red-600"
                  : confLevel === "high"
                    ? "border-emerald-400 text-emerald-600"
                    : confLevel === "medium"
                      ? "border-amber-400 text-amber-600"
                      : "border-stone-300 text-stone-500"
              }`}
            >
              <span className="text-[18px] font-bold">{confGrade || confScore}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-bold text-stone-900">
                  {confidence.label || (confLevel ? `${confLevel.toUpperCase()} Confidence` : "Confidence")}
                </p>
                {confidence.section_count != null && (
                  <span className="text-[11px] text-stone-400">
                    {confidence.high_confidence_count}/{confidence.section_count} sections high
                  </span>
                )}
                {confScore != null && confGrade && (
                  <span className="text-[11px] text-stone-400">
                    Score: {confScore}/100
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12px] text-stone-500 line-clamp-2">
                {confidence.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  DEVELOPMENT CHARGES — compact                                */}
      {/* ============================================================ */}
      {dev.development_charges?.total_estimated && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Estimated Development Charges
            </p>
            <p className="font-mono text-[22px] font-bold tracking-tight text-stone-900">
              ${fmt(dev.development_charges.total_estimated)}
            </p>
          </div>
          {dev.development_charges.note && (
            <p className="mt-2 text-[11px] text-stone-400">
              {dev.development_charges.note}
            </p>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/*  PLANNING CONTACT — compact                                   */}
      {/* ============================================================ */}
      {/* ── Development Charges Calculator ── */}
      <DevChargesCalculator address={data.address} />

      {data.planning_contact && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Planning Contact
          </p>
          <p className="text-[14px] font-semibold text-stone-900">
            {data.planning_contact.MANAGER}
          </p>
          <p className="text-[12px] text-stone-500">
            {data.planning_contact.SECTION} · {data.planning_contact.DISTRICT}
            {data.planning_contact.PHONE && ` · ${data.planning_contact.PHONE}`}
          </p>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  SUB-COMPONENTS                                                     */
/* ================================================================== */

function MetricCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent?: "emerald" | "amber" | "red";
}) {
  const accentStyles = {
    emerald: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
    red: "border-red-200 bg-red-50",
  };
  const accentText = {
    emerald: "text-emerald-900",
    amber: "text-amber-900",
    red: "text-red-900",
  };
  const borderBg = accent
    ? accentStyles[accent]
    : "border-stone-200 bg-white shadow-sm";
  const textColor = accent ? accentText[accent] : "text-stone-900";

  return (
    <div className={`rounded-xl border px-4 py-3.5 ${borderBg}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[14px]" aria-hidden="true">{icon}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-stone-400">
          {label}
        </span>
      </div>
      <p className={`text-[20px] font-bold tracking-tight leading-tight ${textColor}`}>
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[11px] text-stone-400 line-clamp-1">{sub}</p>
      )}
    </div>
  );
}

function SetbackChip({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  if (value == null) return null;
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5">
      <p className="text-[18px] font-bold tracking-tight text-stone-800">
        {value}m
      </p>
      <p className="text-[11px] text-stone-500">{label}</p>
    </div>
  );
}

function FlagItem({
  status,
  label,
}: {
  status: "good" | "warn" | "bad" | "neutral" | "info";
  label: string;
}) {
  const statusConfig = {
    good: { icon: "✅", bg: "" },
    warn: { icon: "⚠️", bg: "" },
    bad: { icon: "🚫", bg: "bg-red-50/50" },
    neutral: { icon: "📋", bg: "" },
    info: { icon: "🚇", bg: "" },
  };
  const cfg = statusConfig[status];
  return (
    <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${cfg.bg}`}>
      <span className="text-[14px] shrink-0" aria-hidden="true">{cfg.icon}</span>
      <span className="text-[13px] text-stone-700">{label}</span>
    </div>
  );
}
