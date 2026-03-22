"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * SummaryTab — The dashboard landing view.
 *
 * Shows a quick-scan card grid of key metrics, constraint flags,
 * and at-a-glance property info. Every piece of data is already
 * in the /lookup response — zero backend changes needed.
 */

import {
  Ruler, BarChart3, Building2, Maximize2, MapPin, Square, Car,
  Info, AlertTriangle, Train, Landmark, CheckCircle2, XCircle,
  type LucideIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Badge, severityColor, severityIcon, severityDotColor } from "./primitives";
import FlagButton from "../FlagButton";
import DevChargesCalculator from "../DevChargesCalculator";
import ZoningStatisticsTable from "./ZoningStatisticsTable";
import EditableField from "./EditableField";
import SectionNoteEditor from "./SectionNoteEditor";
import { getFieldValue } from "@/lib/report-edits";

const MapPanel = dynamic(() => import("../MapPanel"), { ssr: false });

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
  Residential:   { bg: "bg-stone-100",   text: "text-[var(--text-primary)]",  ring: "ring-[var(--border)]"  },
  "Mixed-Use":   { bg: "bg-violet-100",  text: "text-violet-700", ring: "ring-violet-200" },
  Commercial:    { bg: "bg-amber-100",   text: "text-amber-700",  ring: "ring-amber-200"  },
  Employment:    { bg: "bg-orange-100",  text: "text-orange-700", ring: "ring-orange-200" },
  Institutional: { bg: "bg-sky-100",     text: "text-sky-700",    ring: "ring-sky-200"    },
  "Open Space":  { bg: "bg-emerald-100", text: "text-emerald-700",ring: "ring-emerald-200"},
  Utility:       { bg: "bg-stone-100",   text: "text-[var(--text-secondary)]",  ring: "ring-[var(--border)]"  },
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
function PropertySnapshotCard({ data, editMode, userEdits, onEditField, onRevertField }: {
  data: Record<string, any>;
  editMode?: boolean;
  userEdits?: Record<string, { value: unknown; note?: string; edited_at: string }>;
  onEditField?: (path: string, value: unknown, note?: string) => void;
  onRevertField?: (path: string) => void;
}) {
  const eff  = data.effective_standards || {};
  const dev  = data.development_potential || {};

  const rv = (p: string) => getFieldValue(data, userEdits, p);
  const zoneCodeField  = rv("effective_standards.zone_code");
  const zoneCode       = (zoneCodeField.value as string) || eff.zone_label?.zone_code || "";
  const zoneMeta       = resolveZoneMeta(zoneCode);
  const categoryClr    = zoneMeta ? (CATEGORY_COLORS[zoneMeta.category] || CATEGORY_COLORS.Utility) : CATEGORY_COLORS.Utility;

  const opDesignation   = eff.op_context?.op_designation?.designation;
  const minLotAreaField = rv("effective_standards.lot_dimensions.min_area_sqm");
  const minLotArea      = minLotAreaField.value as number | undefined;
  const parcelAreaField = rv("development_potential.lot.area_sqm");
  const parcelArea      = parcelAreaField.value as number | undefined;
  const frontageField   = rv("development_potential.lot.frontage_m");
  const depthField      = rv("development_potential.lot.depth_m");
  const frontage        = frontageField.value as number | undefined;
  const depth           = depthField.value as number | undefined;
  const maxGfaField     = rv("development_potential.max_gfa.sqm");
  const heightMField    = rv("effective_standards.height.effective_m");
  const heightStField   = rv("effective_standards.height.effective_storeys");
  const maxGFA          = (maxGfaField.value as number | undefined) ?? dev.max_gfa?.sqm;
  const maxHeight       = (heightMField.value as number | undefined) ?? dev.height?.max_m;
  const maxHeightSt     = (heightStField.value as number | undefined) ?? dev.height?.max_storeys;
  const hasHeritage     = eff.heritage_impact?.has_heritage;

  /** Shorthand to build EditableField props for a resolved field. */
  const efp = (path: string, field: ReturnType<typeof getFieldValue>) => ({
    fieldPath: path,
    value: field.value,
    isEdited: field.isEdited,
    original: field.original,
    editNote: field.editNote,
    onEdit: onEditField || (() => {}),
    onRevert: onRevertField,
    editMode: !!editMode,
  });
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
      {/* ── Part A: What it is today ── */}
      <div className="p-5 border-b border-[var(--border)]">
        <p className="mb-3 font-heading text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
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
              <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-[12px] font-medium text-[var(--text-secondary)] ring-1 ring-[var(--border)]">
                Unknown Zone Type
              </span>
            )}
            <EditableField {...efp("effective_standards.zone_code", zoneCodeField)}>
              <p className="font-heading text-[17px] font-bold tracking-tight text-[var(--text-primary)] leading-snug">
                {zoneMeta?.label || zoneCode || "—"}
              </p>
            </EditableField>
            {zoneMeta && (
              <p className="text-[13px] text-[var(--text-secondary)] leading-snug">
                Currently used for: <span className="font-medium text-[var(--text-primary)]">{zoneMeta.use}</span>
              </p>
            )}
            {hasPMTSA && (
              <p className="flex items-center gap-1.5 text-[12px] text-sky-600 font-medium">
                <Train className="h-3.5 w-3.5" aria-hidden="true" /> Within {pmtsaStation} Station transit area — growth prioritized
              </p>
            )}
            {hasHeritage && (
              <p className="flex items-center gap-1.5 text-[12px] text-amber-700 font-medium">
                <Landmark className="h-3.5 w-3.5" aria-hidden="true" /> Heritage designation — additional approvals required
              </p>
            )}
          </div>

          {/* Lot dimensions */}
          <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap gap-x-5 gap-y-3">
            {minLotArea != null && (
              <div>
                <p className="text-[22px] font-bold tracking-tight text-[var(--text-primary)]">{fmt(minLotArea)} m²</p>
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">Min Lot Area</p>
              </div>
            )}
            {parcelArea != null && (
              <div>
                <p className="text-[22px] font-bold tracking-tight text-[var(--text-primary)]">{fmt(parcelArea)} m²</p>
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">Parcel Size</p>
              </div>
            )}
            {(frontage != null || frontageField.isEdited) && (
              <div>
                <EditableField {...efp("development_potential.lot.frontage_m", frontageField)}>
                  <p className="text-[22px] font-bold tracking-tight text-[var(--text-primary)]">{frontage}m</p>
                </EditableField>
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">Frontage</p>
              </div>
            )}
            {(depth != null || depthField.isEdited) && (
              <div>
                <EditableField {...efp("development_potential.lot.depth_m", depthField)}>
                  <p className="text-[22px] font-bold tracking-tight text-[var(--text-primary)]">{depth}m</p>
                </EditableField>
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">Depth</p>
              </div>
            )}
            {opDesignation && (
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug">{opDesignation}</p>
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">OP Designation</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Part B: Development opportunity ── */}
      <div className={`p-5 ${opc.bg} ${opc.border} border-t-0`}>
        <p className="mb-3 font-heading text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
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
          <p className="text-[13px] text-[var(--text-secondary)] flex-1 min-w-0">
            {opportunity.summary}
          </p>
          {/* Key numbers */}
          <div className="flex gap-4 shrink-0 ml-auto">
            {maxGFA != null && (
              <div className="text-right">
                <p className="text-[16px] font-bold text-[var(--text-primary)]">{fmt(maxGFA)} m²</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Max GFA</p>
              </div>
            )}
            {maxHeight != null && (
              <div className="text-right">
                <p className="text-[16px] font-bold text-[var(--text-primary)]">
                  {maxHeight}m{maxHeightSt ? ` / ${maxHeightSt}st` : ""}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Max Height</p>
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
  editMode?: boolean;
  userEdits?: Record<string, { value: unknown; note?: string; edited_at: string }>;
  sectionNotes?: Record<string, string>;
  onEditField?: (path: string, value: unknown, note?: string) => void;
  onRevertField?: (path: string) => void;
  onEditNote?: (sectionId: string, note: string) => void;
  reportId?: string;
}

/* ── helper: format number with commas ── */
function fmt(n: number | undefined | null, decimals = 0) {
  if (n == null) return "—";
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function SummaryTab({ data, editMode, userEdits, sectionNotes, onEditField, onRevertField, onEditNote, reportId }: SummaryTabProps) {
  const eff = data.effective_standards || {};
  const dev = data.development_potential || {};
  const layers = data.layers || {};

  /* ── resolve editable fields through user-edit overlay ── */
  const rv = (p: string) => getFieldValue(data, userEdits, p);
  const heightM = rv("effective_standards.height.effective_m");
  const heightSt = rv("effective_standards.height.effective_storeys");
  const fsiField = rv("effective_standards.fsi.effective_total");
  const lotCovPct = rv("effective_standards.lot_coverage.effective_pct");
  const frontSetback = rv("effective_standards.setbacks.effective_front_m");
  const rearSetback = rv("effective_standards.setbacks.effective_rear_m");
  const sideSetback = rv("effective_standards.setbacks.effective_side_m");
  const minLotAreaField2 = rv("effective_standards.lot_dimensions.min_area_sqm");
  const parcelAreaField2 = rv("development_potential.lot.area_sqm");
  const maxGfaField = rv("development_potential.max_gfa.sqm");
  const maxFootprintField = rv("development_potential.coverage.max_footprint_sqm");
  const buildableAreaField = rv("development_potential.setbacks.buildable_area_sqm");
  const buildableWidthField = rv("development_potential.setbacks.buildable_width_m");
  const buildableDepthField = rv("development_potential.setbacks.buildable_depth_m");
  const parkingZoneField = rv("effective_standards.parking.parking_zone");
  const parkingSpacesField = rv("development_potential.parking_estimate.residential_spaces");

  /** Build EditableField props (minus children) for a resolved field. */
  const ep = (path: string, field: ReturnType<typeof getFieldValue>) => ({
    fieldPath: path,
    value: field.value,
    isEdited: field.isEdited,
    original: field.original,
    editNote: field.editNote,
    onEdit: onEditField || (() => {}),
    onRevert: onRevertField,
    editMode: !!editMode,
  });
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
      {/*  MAP                                                          */}
      {/* ============================================================ */}
      {data.coordinates?.latitude && data.coordinates?.longitude && (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] shadow-sm" style={{ height: "55vh" }}>
          <MapPanel
            latitude={data.coordinates.latitude}
            longitude={data.coordinates.longitude}
            activeSiteLayers={layers}
            zoneCode={eff.zone_code || eff.zone_label?.zone_code || ""}
            zoneString={eff.zone_string || ""}
            lotArea={dev.lot?.area_sqm}
            frontage={dev.lot?.frontage_m}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/*  PROPERTY SNAPSHOT — current state + opportunity              */}
      {/* ============================================================ */}
      <PropertySnapshotCard
        data={data}
        editMode={editMode}
        userEdits={userEdits}
        onEditField={onEditField}
        onRevertField={onRevertField}
      />

      {/* ============================================================ */}
      {/*  KEY METRICS — 6-card grid                                    */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {/* Height */}
        <MetricCard
          Icon={Ruler}
          label="Max Height"
          value={
            heightM.value != null
              ? `${heightM.value}m`
              : dev.height?.max_m != null
                ? `${dev.height.max_m}m`
                : "—"
          }
          sub={
            heightSt.value != null
              ? `${heightSt.value} storeys`
              : dev.height?.max_storeys != null
                ? `${dev.height.max_storeys} storeys`
                : dev.height?.estimated_storeys != null
                  ? `~${dev.height.estimated_storeys} storeys (est.)`
                  : eff.height?.effective_source || dev.height?.source
          }
          accent={isFormerBylaw ? "amber" : undefined}
          editFieldProps={ep("effective_standards.height.effective_m", heightM)}
          editSubProps={heightSt.value != null ? ep("effective_standards.height.effective_storeys", heightSt) : undefined}
          address={data.address}
          fieldPath="effective_standards.height.effective_m"
          reportId={reportId}
        />

        {/* FSI */}
        <MetricCard
          Icon={BarChart3}
          label="Max FSI"
          value={fsiField.value != null ? `${fsiField.value}` : "—"}
          sub={eff.fsi?.effective_source}
          editFieldProps={ep("effective_standards.fsi.effective_total", fsiField)}
          address={data.address}
          fieldPath="effective_standards.fsi.effective_total"
          reportId={reportId}
        />

        {/* GFA */}
        <MetricCard
          Icon={Building2}
          label="Max GFA"
          value={maxGfaField.value != null ? `${fmt(maxGfaField.value as number)} m²` : "—"}
          sub={dev.max_gfa?.limiting_factor ? `by ${dev.max_gfa.limiting_factor}` : undefined}
          accent="emerald"
          editFieldProps={ep("development_potential.max_gfa.sqm", maxGfaField)}
          address={data.address}
          fieldPath="development_potential.max_gfa.sqm"
          reportId={reportId}
        />

        {/* Lot Coverage */}
        <MetricCard
          Icon={Maximize2}
          label="Lot Coverage"
          value={
            lotCovPct.value != null
              ? `${lotCovPct.value}%`
              : dev.lot_coverage?.max_pct != null
                ? `${dev.lot_coverage.max_pct}%`
                : "—"
          }
          sub={
            maxFootprintField.value != null
              ? `${fmt(maxFootprintField.value as number)} m² max footprint`
              : isFormerBylaw && dev.lot_coverage?.max_pct != null
                ? "from coverage overlay"
                : undefined
          }
          accent={isFormerBylaw && dev.lot_coverage?.max_pct != null ? "amber" : undefined}
          editFieldProps={ep("effective_standards.lot_coverage.effective_pct", lotCovPct)}
          editSubProps={maxFootprintField.value != null ? ep("development_potential.coverage.max_footprint_sqm", maxFootprintField) : undefined}
          address={data.address}
          fieldPath="effective_standards.lot_coverage.effective_pct"
          reportId={reportId}
        />

        {/* Min Lot Area */}
        <MetricCard
          Icon={MapPin}
          label="Min Lot Area"
          value={minLotAreaField2.value != null ? `${fmt(minLotAreaField2.value as number)} m²` : "—"}
          sub={eff.lot_dimensions?.area_source}
          editFieldProps={ep("effective_standards.lot_dimensions.min_area_sqm", minLotAreaField2)}
          address={data.address}
          fieldPath="effective_standards.lot_dimensions.min_area_sqm"
          reportId={reportId}
        />

        {/* Parcel Size */}
        <MetricCard
          Icon={Square}
          label="Parcel Size"
          value={parcelAreaField2.value != null ? `${fmt(parcelAreaField2.value as number)} m²` : "—"}
          sub={dev.lot?.area_source}
          editFieldProps={ep("development_potential.lot.area_sqm", parcelAreaField2)}
          address={data.address}
          fieldPath="development_potential.lot.area_sqm"
          reportId={reportId}
        />

        {/* Parking Zone */}
        <MetricCard
          Icon={Car}
          label="Parking Zone"
          value={(parkingZoneField.value as string) || eff.parking_zone || "—"}
          sub={
            parkingSpacesField.value != null
              ? `${parkingSpacesField.value} residential spaces est.`
              : undefined
          }
          editFieldProps={ep("effective_standards.parking.parking_zone", parkingZoneField)}
          editSubProps={parkingSpacesField.value != null ? ep("development_potential.parking_estimate.residential_spaces", parkingSpacesField) : undefined}
          address={data.address}
          fieldPath="effective_standards.parking.parking_zone"
          reportId={reportId}
        />
      </div>

      {/* ============================================================ */}
      {/*  SETBACKS — compact bar                                       */}
      {/* ============================================================ */}
      {eff.setbacks && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <p className="mb-3 font-heading text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Setbacks
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SetbackChip label="Front" value={frontSetback.value as number | undefined} editFieldProps={ep("effective_standards.setbacks.effective_front_m", frontSetback)} address={data.address} fieldPath="effective_standards.setbacks.effective_front_m" reportId={reportId} />
            <SetbackChip label="Rear" value={rearSetback.value as number | undefined} editFieldProps={ep("effective_standards.setbacks.effective_rear_m", rearSetback)} address={data.address} fieldPath="effective_standards.setbacks.effective_rear_m" reportId={reportId} />
            <SetbackChip label="Side" value={sideSetback.value as number | undefined} editFieldProps={ep("effective_standards.setbacks.effective_side_m", sideSetback)} address={data.address} fieldPath="effective_standards.setbacks.effective_side_m" reportId={reportId} />
            {(buildableAreaField.value != null || buildableAreaField.isEdited) && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <EditableField
                  fieldPath="development_potential.setbacks.buildable_area_sqm"
                  value={buildableAreaField.value}
                  isEdited={buildableAreaField.isEdited}
                  original={buildableAreaField.original}
                  editNote={buildableAreaField.editNote}
                  onEdit={onEditField || (() => {})}
                  onRevert={onRevertField}
                  editMode={!!editMode}
                >
                  <p className="text-[18px] font-bold tracking-tight text-emerald-800">
                    {fmt(buildableAreaField.value as number)} m²
                  </p>
                </EditableField>
                <div className="flex items-center gap-1">
                  <p className="text-[11px] text-emerald-600">Buildable Area</p>
                  <FlagButton
                    address={data.address}
                    fieldPath="development_potential.setbacks.buildable_area_sqm"
                    fieldLabel="Buildable Area"
                    currentValue={buildableAreaField.value != null ? `${fmt(buildableAreaField.value as number)} m²` : "—"}
                    tabName="summary"
                    reportId={reportId}
                  />
                </div>
                {(buildableWidthField.value != null && buildableDepthField.value != null) && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-500">
                    <EditableField
                      fieldPath="development_potential.setbacks.buildable_width_m"
                      value={buildableWidthField.value}
                      isEdited={buildableWidthField.isEdited}
                      original={buildableWidthField.original}
                      editNote={buildableWidthField.editNote}
                      onEdit={onEditField || (() => {})}
                      onRevert={onRevertField}
                      editMode={!!editMode}
                    >
                      <span>{buildableWidthField.value as number}m</span>
                    </EditableField>
                    <span>×</span>
                    <EditableField
                      fieldPath="development_potential.setbacks.buildable_depth_m"
                      value={buildableDepthField.value}
                      isEdited={buildableDepthField.isEdited}
                      original={buildableDepthField.original}
                      editNote={buildableDepthField.editNote}
                      onEdit={onEditField || (() => {})}
                      onRevert={onRevertField}
                      editMode={!!editMode}
                    >
                      <span>{buildableDepthField.value as number}m</span>
                    </EditableField>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  ZONING STATISTICS TABLE                                      */}
      {/* ============================================================ */}
      <ZoningStatisticsTable data={data.zoning_statistics_table} address={data.address} reportId={reportId} />

      {/* ============================================================ */}
      {/*  QUICK FLAGS — constraint / overlay / heritage / confidence    */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <p className="mb-4 font-heading text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
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
            address={data.address}
            fieldPath="quick_flags.heritage"
            reportId={reportId}
          />

          {/* Natural Hazards */}
          <FlagItem
            status={eff.natural_hazards?.has_hazards ? "warn" : eff.natural_hazards ? "good" : "neutral"}
            label={
              eff.natural_hazards?.has_hazards
                ? `${eff.natural_hazards.hazard_count} Natural Hazard${eff.natural_hazards.hazard_count > 1 ? "s" : ""}`
                : eff.natural_hazards ? "No Natural Hazard constraints" : "Hazard data not loaded"
            }
            address={data.address}
            fieldPath="quick_flags.natural_hazards"
            reportId={reportId}
          />

          {/* Holding */}
          <FlagItem
            status={holdingProvision ? "bad" : "good"}
            label={holdingProvision ? "Holding (H) provision active" : "No Holding provision"}
            address={data.address}
            fieldPath="quick_flags.holding"
            reportId={reportId}
          />

          {/* Exception */}
          <FlagItem
            status={exceptionNum ? "warn" : "good"}
            label={
              exceptionNum
                ? `Exception #${exceptionNum} modifies standards`
                : "No zoning exception"
            }
            address={data.address}
            fieldPath="quick_flags.exception"
            reportId={reportId}
          />

          {/* Site Plan Control — detailed section */}
          {dev.site_plan_control && (
            <div
              className={`rounded-xl border p-5 shadow-sm ${
                dev.site_plan_control.required
                  ? dev.site_plan_control.confidence === "high"
                    ? "border-red-200 bg-red-50/60"
                    : "border-amber-200 bg-amber-50/60"
                  : "border-emerald-200 bg-emerald-50/60"
              }`}
            >
              <div className="flex items-center gap-2.5 pb-3">
                {dev.site_plan_control.required
                  ? <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                  : <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />}
                <h3 className="font-heading text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">Site Plan Control</h3>
                <Badge variant={dev.site_plan_control.required ? (dev.site_plan_control.confidence === "high" ? "danger" : "warning") : "success"}>
                  {dev.site_plan_control.required ? "Required" : "Likely Exempt"}
                </Badge>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                  {dev.site_plan_control.confidence} confidence
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">{dev.site_plan_control.summary}</p>

              {dev.site_plan_control.triggers?.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Triggers ({dev.site_plan_control.trigger_count})
                  </p>
                  <div className="space-y-2">
                    {dev.site_plan_control.triggers.map((t: any, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-white/80 px-3 py-2.5">
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${t.severity === "definite" ? "bg-red-500" : "bg-amber-500"}`} aria-hidden="true" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                              {t.category.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">{t.rule}</span>
                          </div>
                          <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">{t.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dev.site_plan_control.exemptions?.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Potential Exemptions ({dev.site_plan_control.exemption_count})
                  </p>
                  <div className="space-y-2">
                    {dev.site_plan_control.exemptions.map((e: any, i: number) => (
                      <div key={i} className={`rounded-lg border px-3 py-2.5 ${e.overridden ? "border-[var(--border)] bg-stone-100 opacity-60" : "border-emerald-100 bg-white/80"}`}>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${e.overridden ? "bg-red-500" : "bg-emerald-500"}`} aria-hidden="true" />
                          <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                            {e.category.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </span>
                          {e.overridden && <Badge variant="danger">Overridden</Badge>}
                        </div>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">{e.reason}</p>
                        {e.overridden && e.override_reason && (
                          <p className="mt-1 text-[11px] italic text-red-500">{e.override_reason}</p>
                        )}
                        {!e.overridden && e.conditions?.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5">
                            {e.conditions.map((cond: string, ci: number) => (
                              <li key={ci} className="text-[11px] text-[var(--text-muted)]">• {cond}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-3">
                <p className="text-[12px] font-semibold text-sky-700">Recommendation</p>
                <p className="mt-1 text-[12px] leading-relaxed text-sky-600">{dev.site_plan_control.recommendation}</p>
              </div>
            </div>
          )}

          {/* SASP */}
          {eff.op_context?.sasp_policies?.length > 0 && (
            <FlagItem
              status="warn"
              label={`${eff.op_context.sasp_policies.length} SASP polic${eff.op_context.sasp_policies.length > 1 ? "ies" : "y"} apply`}
              address={data.address}
              fieldPath="quick_flags.sasp"
              reportId={reportId}
            />
          )}

          {/* PMTSA */}
          {dev.constraints?.pmtsa_advisory && (
            <FlagItem
              status="info"
              label={`PMTSA: ${dev.constraints.pmtsa_advisory.station_name} Station`}
              address={data.address}
              fieldPath="quick_flags.pmtsa"
              reportId={reportId}
            />
          )}

          {/* Active overlays */}
          <FlagItem
            status={activeOverlayCount > 0 ? "neutral" : "good"}
            label={`${activeOverlayCount} active overlay${activeOverlayCount !== 1 ? "s" : ""}`}
            address={data.address}
            fieldPath="quick_flags.active_overlays"
            reportId={reportId}
          />

          {/* Inclusionary Zoning */}
          {dev.inclusionary_zoning?.applies && (
            <FlagItem
              status="warn"
              label={`Inclusionary Zoning: ${dev.inclusionary_zoning.effective_rate_pct}% affordable`}
              address={data.address}
              fieldPath="quick_flags.inclusionary_zoning"
              reportId={reportId}
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
              address={data.address}
              fieldPath="quick_flags.op_confidence"
              reportId={reportId}
            />
          )}

          {/* Noise & Vibration */}
          {dev.noise_vibration?.applies && (
            <FlagItem
              status="warn"
              label={`${dev.noise_vibration.source_count} Noise/Vibration source${dev.noise_vibration.source_count !== 1 ? "s" : ""} nearby`}
              address={data.address}
              fieldPath="quick_flags.noise_vibration"
              reportId={reportId}
            />
          )}

          {/* Holding Detail */}
          {dev.holding_detail?.detected && dev.holding_detail.conditions?.length > 0 && (
            <FlagItem
              status="bad"
              label={`Holding (H): ${dev.holding_detail.condition_count || dev.holding_detail.conditions.length} removal condition${(dev.holding_detail.condition_count || dev.holding_detail.conditions.length) !== 1 ? "s" : ""}`}
              address={data.address}
              fieldPath="quick_flags.holding_detail"
              reportId={reportId}
            />
          )}

          {/* Rental Replacement */}
          {dev.rental_replacement?.potentially_applies && (
            <FlagItem
              status="warn"
              label={`Rental Replacement: ${dev.rental_replacement.confidence === "high" ? "likely applies" : "may apply"}`}
              address={data.address}
              fieldPath="quick_flags.rental_replacement"
              reportId={reportId}
            />
          )}

          {/* Parking Maximum */}
          {dev.parking_maximum?.applies && dev.parking_maximum.exceeds_maximum && (
            <FlagItem
              status="warn"
              label={`Parking exceeds maximum: ${dev.parking_maximum.max_spaces_permitted} max permitted`}
              address={data.address}
              fieldPath="quick_flags.parking_maximum"
              reportId={reportId}
            />
          )}

          {/* Shadow Impact */}
          {dev.shadow_analysis?.hours_impacting_park > 0 && (
            <FlagItem
              status="warn"
              label={`Shadow impacts ${dev.shadow_analysis.impacted_parks?.length || 1} park${(dev.shadow_analysis.impacted_parks?.length || 1) !== 1 ? "s" : ""} (${dev.shadow_analysis.hours_impacting_park} hrs)`}
              address={data.address}
              fieldPath="quick_flags.shadow_impact"
              reportId={reportId}
            />
          )}

          {/* Separation Distances */}
          {dev.separation_distances?.applies && (
            <FlagItem
              status="neutral"
              label="Separation distance rules apply"
              address={data.address}
              fieldPath="quick_flags.separation_distances"
              reportId={reportId}
            />
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  DEVELOPMENT CONSTRAINTS — severity-sorted                    */}
      {/* ============================================================ */}
      {constraints.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
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
                          : "border-[var(--border)] bg-stone-50/50"
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 text-[14px] ${severityDotColor[c.severity] || "text-sky-500"}`} aria-hidden="true">
                    {severityIcon[c.severity] || "●"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)]">
                      {c.label || c.layer || c.tag || "Constraint"}
                    </p>
                    {(c.detail || c.impact) && (
                      <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
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
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <p className="mb-3 font-heading text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Committee of Adjustment Precedents
          </p>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[28px] font-bold tracking-tight text-[var(--text-primary)]">
                {dev.coa_precedents.approval_rate}%
              </p>
              <p className="text-[12px] text-[var(--text-secondary)]">Approval Rate</p>
            </div>
            <div className="h-10 w-px bg-[var(--border)]" />
            <div>
              <p className="text-[20px] font-bold tracking-tight text-[var(--text-primary)]">
                {dev.coa_precedents.total_matches}
              </p>
              <p className="text-[12px] text-[var(--text-secondary)]">Applications</p>
            </div>
            {dev.coa_precedents.same_zone_count > 0 && (
              <>
                <div className="h-10 w-px bg-[var(--border)]" />
                <div>
                  <p className="text-[20px] font-bold tracking-tight text-[var(--text-primary)]">
                    {dev.coa_precedents.same_zone_approval_rate ?? dev.coa_precedents.approval_rate}%
                  </p>
                  <p className="text-[12px] text-[var(--text-secondary)]">Same Zone ({dev.coa_precedents.same_zone_count})</p>
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
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full border-4 ${
                confGrade === "D" || confLevel === "low"
                  ? "border-red-400 text-red-600"
                  : confLevel === "high"
                    ? "border-emerald-400 text-emerald-600"
                    : confLevel === "medium"
                      ? "border-amber-400 text-amber-600"
                      : "border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              <span className="text-[18px] font-bold">{confGrade || confScore}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-heading text-[14px] font-bold text-[var(--text-primary)]">
                  {confidence.label || (confLevel ? `${confLevel.toUpperCase()} Confidence` : "Confidence")}
                </p>
                {confidence.section_count != null && (
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {confidence.high_confidence_count}/{confidence.section_count} sections high
                  </span>
                )}
                {confScore != null && confGrade && (
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Score: {confScore}/100
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12px] text-[var(--text-secondary)] line-clamp-2">
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
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex items-baseline justify-between">
            <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Estimated Development Charges
            </p>
            <p className="font-mono text-[22px] font-bold tracking-tight text-[var(--text-primary)]">
              ${fmt(dev.development_charges.total_estimated)}
            </p>
          </div>
          {dev.development_charges.note && (
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">
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
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <p className="mb-2 font-heading text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Planning Contact
          </p>
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">
            {data.planning_contact.MANAGER}
          </p>
          <p className="text-[12px] text-[var(--text-secondary)]">
            {data.planning_contact.SECTION} · {data.planning_contact.DISTRICT}
            {data.planning_contact.PHONE && ` · ${data.planning_contact.PHONE}`}
          </p>
        </div>
      )}

      {/* ── Section Note ── */}
      <SectionNoteEditor
        sectionId="summary"
        note={sectionNotes?.summary || ""}
        onNoteChange={onEditNote || (() => {})}
        editMode={!!editMode}
      />
    </div>
  );
}

/* ================================================================== */
/*  SUB-COMPONENTS                                                     */
/* ================================================================== */

type EditFieldInfo = {
  fieldPath: string;
  value: unknown;
  isEdited: boolean;
  original: unknown;
  editNote?: string;
  onEdit: (path: string, value: unknown, note?: string) => void;
  onRevert?: (path: string) => void;
  editMode: boolean;
};

function MetricCard({
  Icon,
  label,
  value,
  sub,
  accent,
  editFieldProps,
  editSubProps,
  address,
  fieldPath,
  reportId,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: "emerald" | "amber" | "red";
  editFieldProps?: EditFieldInfo;
  editSubProps?: EditFieldInfo;
  address?: string;
  fieldPath?: string;
  reportId?: string;
}) {
  const isEmpty = value === "—" || value === "\u2014";
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
  const borderBg = !isEmpty && accent
    ? accentStyles[accent]
    : "border-[var(--border)] bg-[var(--card)] shadow-sm";
  const textColor = isEmpty
    ? "text-[var(--text-muted)]"
    : accent
      ? accentText[accent]
      : "text-[var(--text-primary)]";

  // Filter out internal source labels that look unprofessional
  const cleanSub = sub && !/^(not specified|not available|not determined)$/i.test(sub) ? sub : undefined;

  const valueEl = (
    <p className={`text-[20px] ${isEmpty ? "font-medium" : "font-bold"} tracking-tight leading-tight ${textColor}`}>
      {value}
    </p>
  );
  const subEl = cleanSub ? (
    <p className="mt-0.5 text-[11px] text-[var(--text-muted)] line-clamp-1">{cleanSub}</p>
  ) : null;

  return (
    <div className={`rounded-xl border px-4 py-3.5 ${borderBg}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
        <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
          {label}
        </span>
        {address && fieldPath && (
          <FlagButton
            address={address}
            fieldPath={fieldPath}
            fieldLabel={label}
            currentValue={value}
            tabName="summary"
            reportId={reportId}
          />
        )}
      </div>
      {editFieldProps ? (
        <EditableField {...editFieldProps}>{valueEl}</EditableField>
      ) : (
        valueEl
      )}
      {editSubProps && subEl ? (
        <EditableField {...editSubProps}>{subEl}</EditableField>
      ) : (
        subEl
      )}
    </div>
  );
}

function SetbackChip({
  label,
  value,
  editFieldProps,
  address,
  fieldPath,
  reportId,
}: {
  label: string;
  value: number | null | undefined;
  editFieldProps?: EditFieldInfo;
  address?: string;
  fieldPath?: string;
  reportId?: string;
}) {
  if (value == null && !editFieldProps?.isEdited) return null;
  const valueEl = (
    <p className="text-[18px] font-bold tracking-tight text-[var(--text-primary)]">
      {value}m
    </p>
  );
  return (
    <div className="rounded-lg border border-[var(--border)] bg-stone-50 px-3 py-2.5">
      {editFieldProps ? (
        <EditableField {...editFieldProps}>{valueEl}</EditableField>
      ) : (
        valueEl
      )}
      <div className="flex items-center gap-1">
        <p className="text-[11px] text-[var(--text-secondary)]">{label}</p>
        {address && fieldPath && (
          <FlagButton
            address={address}
            fieldPath={fieldPath}
            fieldLabel={`${label} Setback`}
            currentValue={value != null ? `${value}m` : "—"}
            tabName="summary"
            reportId={reportId}
          />
        )}
      </div>
    </div>
  );
}

function FlagItem({
  status,
  label,
  address,
  fieldPath,
  reportId,
}: {
  status: "good" | "warn" | "bad" | "neutral" | "info";
  label: string;
  address?: string;
  fieldPath?: string;
  reportId?: string;
}) {
  const statusConfig: Record<string, { Icon: LucideIcon; color: string; bg: string }> = {
    good:    { Icon: CheckCircle2,  color: "text-emerald-500", bg: "" },
    warn:    { Icon: AlertTriangle, color: "text-amber-500",   bg: "" },
    bad:     { Icon: XCircle,       color: "text-red-500",     bg: "bg-red-50/50" },
    neutral: { Icon: Info,          color: "text-[var(--text-muted)]", bg: "" },
    info:    { Icon: Train,         color: "text-sky-500",     bg: "" },
  };
  const cfg = statusConfig[status];
  return (
    <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${cfg.bg}`}>
      <cfg.Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} aria-hidden="true" />
      <span className="flex-1 text-[13px] text-[var(--text-primary)]">{label}</span>
      {address && fieldPath && (
        <FlagButton
          address={address}
          fieldPath={fieldPath}
          fieldLabel={label}
          currentValue={label}
          tabName="summary"
          reportId={reportId}
        />
      )}
    </div>
  );
}
