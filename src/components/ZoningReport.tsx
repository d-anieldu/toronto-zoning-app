"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * ZoningReport — Tabbed shell that orchestrates the report layout.
 *
 * Keeps the zone-identity header, error banners, map, and site-plan-control
 * at the top, then delegates to tab components for the rest.
 */

import { useState, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { ReferenceProvider, RefLink } from "./ReferencePanel";
import UseAnalysisPanel from "./UseAnalysisPanel";
import ShareReportButton from "./ShareReportButton";
import ChatAssistant from "./ChatAssistant";

/* ── Tab components ──────────────────────────────────────────────── */
import SummaryTab from "./report/SummaryTab";
import BuildingEnvelopeTab from "./report/BuildingEnvelopeTab";
import UsesParkingTab from "./report/UsesParkingTab";
import ConstraintsContextTab from "./report/ConstraintsContextTab";

/* ── Primitives (shared across shell + tabs) ─────────────────────── */
import { Badge, Icons, SectionHeading } from "./report/primitives";

const MapPanel = dynamic(() => import("./MapPanel"), { ssr: false });

interface Props {
  data: Record<string, any>;
}

/* ================================================================== */
/*  TAB DEFINITIONS                                                    */
/* ================================================================== */

const TABS = [
  { id: "summary", label: "Summary", icon: "⚡" },
  { id: "envelope", label: "Building Envelope", icon: "🏗️" },
  { id: "uses", label: "Uses & Parking", icon: "🏠" },
  { id: "context", label: "Constraints & Context", icon: "📋" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ================================================================== */
/*  FLOATING ACTIONS                                                   */
/* ================================================================== */

function FloatingActions({ onCopy, copied }: { onCopy: () => void; copied: boolean }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={onCopy}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        title={copied ? "Copied!" : "Copy summary"}
      >
        {copied ? (
          <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="h-4 w-4 text-stone-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
        )}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        title="Print report"
      >
        <svg className="h-4 w-4 text-stone-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m0 0a48.032 48.032 0 0110.5 0m-10.5 0V5.625c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v3.284" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-stone-900 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        title="Back to top"
      >
        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function ZoningReport({ data }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [analyzeUse, setAnalyzeUse] = useState<string | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  /* -------- data extraction -------- */
  const eff = useMemo(() => data.effective_standards || {}, [data.effective_standards]);
  const dev = useMemo(() => data.development_potential || {}, [data.development_potential]);
  const layers = data.layers || {};
  const coords = useMemo(() => data.coordinates || {}, [data.coordinates]);

  const hasEffError = eff.error;
  const hasDevError = dev.error;

  /* -------- zone info -------- */
  const zoneLabel = eff.zone_label || {};
  const zoneCode = eff.zone_code || zoneLabel.zone_code || "";
  const zoneString = eff.zone_string || "";
  const exceptionNum = zoneLabel.exception_number || eff.exception?.exception_number;

  /* -------- multi-zone detection -------- */
  const zoningArea = layers.zoning_area;
  const isMultiZone = Array.isArray(zoningArea) && zoningArea.length > 1;
  const primaryZone = isMultiZone ? zoningArea[0] : zoningArea;

  /* -------- by-law info -------- */
  const bylawChapter = primaryZone?.ZBL_CHAPT;
  const bylawSection = primaryZone?.ZBL_SECTN;
  const holdingProvision = primaryZone?.ZN_HOLDING === "Y";

  /* -------- Copy report summary -------- */
  const handleCopyReport = useCallback(() => {
    const lines: string[] = [
      `Zoning Report: ${data.address}`,
      `Zone: ${zoneCode} — ${zoneString}`,
      exceptionNum ? `Exception: #${exceptionNum}` : "",
      "",
      "KEY METRICS:",
    ];
    if (eff.height?.effective_m != null) lines.push(`  Height: ${eff.height.effective_m}m`);
    if (eff.fsi?.effective_total != null) lines.push(`  FSI: ${eff.fsi.effective_total}`);
    if (eff.lot_coverage?.effective_pct != null) lines.push(`  Lot Coverage: ${eff.lot_coverage.effective_pct}%`);
    if (dev.max_gfa?.sqm != null) lines.push(`  Max GFA: ${Number(dev.max_gfa.sqm).toLocaleString()} m²`);
    if (eff.setbacks) {
      lines.push("");
      lines.push("SETBACKS:");
      if (eff.setbacks.effective_front_m != null) lines.push(`  Front: ${eff.setbacks.effective_front_m}m`);
      if (eff.setbacks.effective_rear_m != null) lines.push(`  Rear: ${eff.setbacks.effective_rear_m}m`);
      if (eff.setbacks.effective_side_m != null) lines.push(`  Side: ${eff.setbacks.effective_side_m}m`);
    }
    lines.push("");
    if (coords.latitude != null && coords.longitude != null) {
      lines.push(`Coordinates: ${coords.latitude.toFixed(6)}°N, ${Math.abs(coords.longitude).toFixed(6)}°W`);
    }
    lines.push("Source: Toronto Zoning (By-law 569-2013) — Not legal advice");
    navigator.clipboard.writeText(lines.filter(Boolean).join("\n")).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  }, [data, zoneCode, zoneString, exceptionNum, eff, dev, coords]);

  return (
    <ReferenceProvider>
    <div ref={reportRef} className="mt-8 space-y-5">
      {/* ============================================================ */}
      {/*  ZONE IDENTITY HEADER                                         */}
      {/* ============================================================ */}
      <div id="zone" className="scroll-mt-28">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: address & coords */}
            <div>
              <h2 className="text-[22px] font-bold tracking-tight text-stone-900">
                {data.address}
              </h2>
              <p className="mt-1.5 font-mono text-[12px] text-stone-400">
                {coords.latitude != null && coords.longitude != null
                  ? `${coords.latitude.toFixed(6)}°N, ${Math.abs(coords.longitude).toFixed(6)}°W`
                  : "—"}
              </p>
              {(bylawChapter || bylawSection) && (
                <p className="mt-1 text-[12px] text-stone-400">
                  By-law 569-2013 · Chapter {bylawChapter} ·{" "}
                  <RefLink type="bylaw-section" id={bylawSection || bylawChapter} label={`s. ${bylawSection}`}>
                    s.{bylawSection}
                  </RefLink>
                </p>
              )}
            </div>

            {/* Right: zone badges + actions */}
            <div className="flex flex-wrap items-center gap-2">
              {zoneCode ? (
                <RefLink type="zone-info" id={zoneCode} label={zoneCode}>
                  <span className="rounded-lg bg-stone-900 px-3 py-1.5 text-[13px] font-bold tracking-wide text-white">
                    {zoneCode}
                  </span>
                </RefLink>
              ) : dev.former_bylaw_notice?.applies ? (
                <span className="rounded-lg bg-orange-600 px-3 py-1.5 text-[13px] font-bold tracking-wide text-white">
                  {dev.former_bylaw_notice.bylaw || "Former By-law"}
                </span>
              ) : null}
              {zoneString && (
                <span className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 font-mono text-[12px] text-stone-600">
                  {zoneString}
                </span>
              )}
              {exceptionNum && (
                <RefLink type="exception" id={String(exceptionNum)} zone_code={zoneCode} label={`Exception #${exceptionNum}`}>
                  <Badge variant="warning">Exception #{exceptionNum}</Badge>
                </RefLink>
              )}
              {holdingProvision && <Badge variant="danger">Holding (H)</Badge>}

              {/* Copy & print buttons */}
              <button
                type="button"
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-600 shadow-sm transition-all hover:bg-stone-50 hover:shadow"
              >
                {showCopied ? (
                  <>
                    <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-600 shadow-sm transition-all hover:bg-stone-50 hover:shadow"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m0 0a48.032 48.032 0 0110.5 0m-10.5 0V5.625c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v3.284" />
                </svg>
                Print
              </button>
              <ShareReportButton address={data.address} lookupData={data} />
            </div>
          </div>

          {/* Multi-zone warning */}
          {isMultiZone && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-[13px] font-semibold text-amber-800">⚠ Multi-Zone Lot Detected</p>
              <div className="mt-2 space-y-1">
                {zoningArea.map((z: any, i: number) => (
                  <p key={i} className="text-[12px] text-amber-700">
                    <span className="font-medium">Zone #{i + 1}:</span>{" "}
                    <span className="font-mono">{z.ZN_ZONE}</span>{" "}
                    <span className="text-amber-600">({z.ZN_STRING})</span>
                    {z.EXCPTN_NO && z.EXCPTN_NO > 0 && (
                      <RefLink type="exception" id={String(z.EXCPTN_NO)} zone_code={z.ZN_ZONE} label={`Exception #${z.EXCPTN_NO}`} className="text-amber-500">
                        {" "}· Exception #{z.EXCPTN_NO}
                      </RefLink>
                    )}
                  </p>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-amber-600">
                Report shows primary zone standards. Secondary zone rules may apply to portions of the lot.
              </p>
            </div>
          )}

          {/* Holding provision warning */}
          {eff.holding_warning && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-[13px] font-semibold text-red-800">{eff.holding_warning}</p>
            </div>
          )}

          {/* PMTSA advisory banner */}
          {dev.constraints?.pmtsa_advisory && (
            <div className="mt-4 rounded-xl border-2 border-sky-300 bg-gradient-to-r from-sky-50 to-indigo-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375a1.125 1.125 0 011.125-1.125h3.026a1.125 1.125 0 01.95.524l.574.957c.189.316.528.524.95.524H21" />
                  </svg>
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[14px] font-bold text-sky-900">Protected Major Transit Station Area</span>
                    <Badge variant="info">{dev.constraints.pmtsa_advisory.station_name} Station</Badge>
                  </div>
                  <p className="text-[12px] leading-relaxed text-sky-800">{dev.constraints.pmtsa_advisory.summary}</p>
                  {dev.constraints.pmtsa_advisory.policy_notes?.length > 0 && (
                    <div className="mt-3 rounded-lg bg-white/60 p-3">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-600">Provincial Policy Requirements</p>
                      <ul className="space-y-1">
                        {dev.constraints.pmtsa_advisory.policy_notes.map((n: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-sky-700">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-400" /><span>{n}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {dev.constraints.pmtsa_advisory.sasp_blank && (
                    <p className="mt-2 text-[11px] font-medium text-amber-600">
                      ⚠{" "}
                      <RefLink type="sasp" id={String(dev.constraints.pmtsa_advisory.sasp_no)} label={`SASP #${dev.constraints.pmtsa_advisory.sasp_no}`}>
                        SASP #{dev.constraints.pmtsa_advisory.sasp_no}
                      </RefLink>
                      {" "}is not yet finalized — planning framework pending adoption
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Secondary zones (resolved data) */}
          {eff.secondary_zones?.length > 0 && (
            <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Secondary Zones on This Lot</p>
              <div className="space-y-1">
                {eff.secondary_zones.map((sz: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-[12px]">
                    <span className="rounded bg-stone-200 px-1.5 py-0.5 font-mono text-[11px] font-medium text-stone-700">{sz.zone}</span>
                    <span className="text-stone-500">{sz.zone_string}</span>
                    {sz.exception_number && Number(sz.exception_number) > 0 && (
                      <RefLink type="exception" id={String(sz.exception_number)} zone_code={sz.zone} label={`Exception #${sz.exception_number}`}>
                        <Badge variant="warning">Exc #{sz.exception_number}</Badge>
                      </RefLink>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  FORMER BY-LAW NOTICE                                         */}
      {/* ============================================================ */}
      {dev.former_bylaw_notice?.applies && (
        <div className="rounded-xl border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xl">
              📜
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[15px] font-bold text-orange-900">Former Municipal By-law Property</span>
                <Badge variant="warning">{dev.former_bylaw_notice.bylaw || "Former By-law"}</Badge>
              </div>
              <p className="text-[13px] leading-relaxed text-orange-800">
                {dev.former_bylaw_notice.description || (
                  <>This property is governed by <strong>{dev.former_bylaw_notice.bylaw}</strong>
                  {dev.former_bylaw_notice.municipality && <> ({dev.former_bylaw_notice.municipality})</>},
                  not City-wide Zoning By-law 569-2013.</>
                )}
              </p>
              <div className="mt-3 rounded-lg bg-white/70 p-3 border border-orange-200/50">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-orange-600">What This Means</p>
                <ul className="space-y-1 text-[12px] text-orange-700">
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-400" /><span>Height limits and overlay data shown below are from 569-2013 mapping layers and still apply.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-400" /><span>Zone-specific standards (FSI, setbacks, permitted uses) are not available — consult the former by-law directly.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-400" /><span>Heritage, transit, and environmental constraints are detected and shown normally.</span></li>
                </ul>
              </div>
              {dev.former_bylaw_notice.lookup_url && (
                <a
                  href={dev.former_bylaw_notice.lookup_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-[12px] font-medium text-white shadow-sm hover:bg-orange-700 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  City of Toronto Zoning Map
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  ERROR BANNERS                                                */}
      {/* ============================================================ */}
      {hasEffError && !dev.former_bylaw_notice?.applies && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-700">
          <span className="font-semibold">Standards Error:</span> {eff.error}
        </div>
      )}
      {hasDevError && !dev.former_bylaw_notice?.applies && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-700">
          <span className="font-semibold">Development Potential Error:</span> {dev.error}
        </div>
      )}

      {/* ============================================================ */}
      {/*  GIS LAYER MAP                                                */}
      {/* ============================================================ */}
      {coords.latitude && coords.longitude && (
        <>
          <SectionHeading id="map" title="GIS Layer Map" icon={Icons.map} />
          <MapPanel
            latitude={coords.latitude}
            longitude={coords.longitude}
            activeSiteLayers={layers}
            zoneCode={zoneCode}
            zoneString={zoneString}
            lotArea={dev.lot?.area_sqm}
            frontage={dev.lot?.frontage_m}
          />
        </>
      )}

      {/* ============================================================ */}
      {/*  SITE PLAN CONTROL                                            */}
      {/* ============================================================ */}
      {dev.site_plan_control && (
        <div
          id="site-plan"
          className={`scroll-mt-28 rounded-xl border p-5 shadow-sm ${
            dev.site_plan_control.required
              ? dev.site_plan_control.confidence === "high"
                ? "border-red-200 bg-red-50/60"
                : "border-amber-200 bg-amber-50/60"
              : "border-emerald-200 bg-emerald-50/60"
          }`}
        >
          <div className="flex items-center gap-2.5 pb-3">
            <span className="text-[18px]">{dev.site_plan_control.required ? "📋" : "✅"}</span>
            <h3 className="text-[15px] font-semibold tracking-tight text-stone-900">Site Plan Control</h3>
            <Badge variant={dev.site_plan_control.required ? (dev.site_plan_control.confidence === "high" ? "danger" : "warning") : "success"}>
              {dev.site_plan_control.required ? "Required" : "Likely Exempt"}
            </Badge>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
              {dev.site_plan_control.confidence} confidence
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-stone-600">{dev.site_plan_control.summary}</p>

          {dev.site_plan_control.triggers?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
                Triggers ({dev.site_plan_control.trigger_count})
              </p>
              <div className="space-y-2">
                {dev.site_plan_control.triggers.map((t: any, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-white/80 px-3 py-2.5">
                    <span className="mt-0.5 text-[12px]">{t.severity === "definite" ? "🔴" : "🟡"}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-stone-700">
                          {t.category.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </span>
                        <span className="text-[10px] text-stone-400">{t.rule}</span>
                      </div>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500">{t.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dev.site_plan_control.exemptions?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
                Potential Exemptions ({dev.site_plan_control.exemption_count})
              </p>
              <div className="space-y-2">
                {dev.site_plan_control.exemptions.map((e: any, i: number) => (
                  <div key={i} className={`rounded-lg border px-3 py-2.5 ${e.overridden ? "border-stone-200 bg-stone-100 opacity-60" : "border-emerald-100 bg-white/80"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px]">{e.overridden ? "❌" : "✅"}</span>
                      <span className="text-[12px] font-semibold text-stone-700">
                        {e.category.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </span>
                      {e.overridden && <Badge variant="danger">Overridden</Badge>}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500">{e.reason}</p>
                    {e.overridden && e.override_reason && (
                      <p className="mt-1 text-[11px] italic text-red-500">{e.override_reason}</p>
                    )}
                    {!e.overridden && e.conditions?.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {e.conditions.map((cond: string, ci: number) => (
                          <li key={ci} className="text-[11px] text-stone-400">• {cond}</li>
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

      {/* ============================================================ */}
      {/*  TAB BAR                                                      */}
      {/* ============================================================ */}
      <div className="sticky top-0 z-30 -mx-1 bg-white/80 backdrop-blur-md border-b border-stone-200 print:hidden">
        <nav className="flex gap-1 px-1 pt-1" aria-label="Report tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-[13px] font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-stone-900 shadow-sm border border-b-0 border-stone-200"
                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
              }`}
            >
              <span className="text-[14px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ============================================================ */}
      {/*  TAB CONTENT                                                  */}
      {/* ============================================================ */}
      <div className="min-h-[400px]">
        {activeTab === "summary" && <SummaryTab data={data} />}
        {activeTab === "envelope" && (
          <BuildingEnvelopeTab data={data} onAnalyzeUse={setAnalyzeUse} />
        )}
        {activeTab === "uses" && (
          <UsesParkingTab data={data} onAnalyzeUse={setAnalyzeUse} />
        )}
        {activeTab === "context" && <ConstraintsContextTab data={data} />}
      </div>
    </div>

    {/* Use Eligibility Analysis Panel */}
    <UseAnalysisPanel
      useName={analyzeUse}
      reportData={analyzeUse ? data : null}
      onClose={() => setAnalyzeUse(null)}
    />

    {/* Floating scroll-to-top + quick actions */}
    <FloatingActions onCopy={handleCopyReport} copied={showCopied} />

    {/* AI Chat Assistant */}
    <ChatAssistant address={data.address} />

    </ReferenceProvider>
  );
}
