"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * ZoningReport — Tabbed shell that orchestrates the report layout.
 *
 * Keeps the zone-identity header, error banners, map, and site-plan-control
 * at the top, then delegates to tab components for the rest.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Zap, Building2, Home, ClipboardList, MapPin, ScrollText,
  Copy, Check, Printer, ChevronUp, Share2, Loader2,
  Train, Microscope,
} from "lucide-react";
import { toast } from "sonner";
import { ReferenceProvider, RefLink } from "./ReferencePanel";
import UseAnalysisPanel from "./UseAnalysisPanel";
import ShareReportButton from "./ShareReportButton";
import CreateReportButton from "./CreateReportButton";
import GenerateDeckButton from "./report/GenerateDeckButton";
import ChatAssistant from "./ChatAssistant";

/* ── Tab components ──────────────────────────────────────────────── */
import SummaryTab from "./report/SummaryTab";
import BuildingEnvelopeTab from "./report/BuildingEnvelopeTab";
import UsesParkingTab from "./report/UsesParkingTab";
import ConstraintsContextTab from "./report/ConstraintsContextTab";
import NearbyActivityTab from "./report/NearbyActivityTab";
import PolicyConformityTab from "./report/PolicyConformityTab";
import AnalyzeTab from "./report/AnalyzeTab";

/* ── Primitives (shared across shell + tabs) ─────────────────────── */
import { Badge } from "./report/primitives";
import type { UserEdits, SectionNotes } from "@/types/reports";

interface Props {
  data: Record<string, any>;
  editMode?: boolean;
  userEdits?: UserEdits;
  sectionNotes?: SectionNotes;
  onEditField?: (path: string, value: unknown, note?: string) => void;
  onRevertField?: (path: string) => void;
  onEditNote?: (sectionId: string, note: string) => void;
  reportId?: string;
}

/* ================================================================== */
/*  TAB DEFINITIONS                                                    */
/* ================================================================== */

const TABS = [
  { id: "summary",    label: "Summary",               Icon: Zap },
  { id: "envelope",   label: "Building Envelope",      Icon: Building2 },
  { id: "uses",       label: "Uses & Parking",         Icon: Home },
  { id: "context",    label: "Constraints & Context",  Icon: ClipboardList },
  { id: "nearby",     label: "Nearby Activity",        Icon: MapPin },
  { id: "conformity", label: "Policy Conformity",      Icon: ScrollText },
  { id: "analyze",    label: "Analysis",               Icon: Microscope },
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
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        title={copied ? "Copied!" : "Copy summary"}
      >
        {copied
          ? <Check className="h-4 w-4 text-emerald-500" />
          : <Copy className="h-4 w-4 text-[var(--text-secondary)]" />}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        title="Print report"
      >
        <Printer className="h-4 w-4 text-[var(--text-secondary)]" />
      </button>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-stone-900 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        title="Back to top"
      >
        <ChevronUp className="h-4 w-4 text-white" />
      </button>
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function ZoningReport({
  data,
  editMode = false,
  userEdits,
  sectionNotes,
  onEditField,
  onRevertField,
  onEditNote,
  reportId,
}: Props) {
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

  /* -------- preload nearby activity data on mount -------- */
  const [nearbyPreload, setNearbyPreload] = useState<Record<string, any> | null>(
    data.nearby_activity || null,
  );

  useEffect(() => {
    if (data.nearby_activity || !coords.latitude || !coords.longitude) return;
    let cancelled = false;
    const params = new URLSearchParams({
      lon: String(coords.longitude),
      lat: String(coords.latitude),
      radius: "500",
    });
    const zc = eff.zone_code || "";
    if (zc) params.set("zone_code", zc);
    if (data.address) params.set("address", data.address);

    fetch(`/api/nearby-activity/stats?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (!cancelled && json) setNearbyPreload(json); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [data.nearby_activity, coords.latitude, coords.longitude, eff.zone_code, data.address]);

  /* -------- policy conformity score for tab badge -------- */
  const conformityScore = useMemo(() => {
    const pc = data.policy_conformity;
    if (!pc?.overall_summary) return null;
    const { conforms, total_items } = pc.overall_summary;
    if (!total_items || total_items === 0) return null;
    return Math.round((conforms / total_items) * 100);
  }, [data.policy_conformity]);

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
      toast.success("Report summary copied to clipboard");
    });
  }, [data, zoneCode, zoneString, exceptionNum, eff, dev, coords]);

  return (
    <ReferenceProvider>
    <div ref={reportRef} className="mt-8 space-y-5">
      {/* ============================================================ */}
      {/*  ZONE IDENTITY HEADER                                         */}
      {/* ============================================================ */}
      <div id="zone" className="scroll-mt-28">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: address & coords */}
            <div>
              <h2 className="font-heading text-[22px] font-bold tracking-tight text-[var(--text-primary)]">
                {data.address}
              </h2>
              <p className="mt-1.5 font-mono text-[12px] text-[var(--text-muted)]">
                {coords.latitude != null && coords.longitude != null
                  ? `${coords.latitude.toFixed(6)}°N, ${Math.abs(coords.longitude).toFixed(6)}°W`
                  : "—"}
              </p>
              {(bylawChapter || bylawSection) && (
                <p className="mt-1 text-[12px] text-[var(--text-muted)]">
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
                  <span className="rounded-lg bg-[var(--text-primary)] px-3 py-1.5 text-[13px] font-bold tracking-wide text-white">
                    {zoneCode}
                  </span>
                </RefLink>
              ) : dev.former_bylaw_notice?.applies ? (
                <span className="rounded-lg bg-orange-600 px-3 py-1.5 text-[13px] font-bold tracking-wide text-white">
                  {dev.former_bylaw_notice.bylaw || "Former By-law"}
                </span>
              ) : null}
              {zoneString && (
                <span className="rounded-lg border border-[var(--border)] bg-stone-50 px-3 py-1.5 font-mono text-[12px] text-[var(--text-secondary)]">
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
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] shadow-sm transition-all hover:bg-stone-50 hover:shadow"
              >
                {showCopied
                  ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied!</>
                  : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] shadow-sm transition-all hover:bg-stone-50 hover:shadow"
              >
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
              <ShareReportButton address={data.address} lookupData={data} />
              <GenerateDeckButton address={data.address} />
              {!editMode && <CreateReportButton address={data.address} lookupData={data} />}
            </div>
          </div>

          {/* Multi-zone warning */}
          {isMultiZone && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-[13px] font-semibold text-amber-800"><span aria-hidden="true">⚠</span> Multi-Zone Lot Detected</p>
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
                  <Train className="h-5 w-5" />
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
                      <span aria-hidden="true">⚠</span>{" "}
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
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-stone-50 p-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Secondary Zones on This Lot</p>
              <div className="space-y-1">
                {eff.secondary_zones.map((sz: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-[12px]">
                    <span className="rounded bg-stone-200 px-1.5 py-0.5 font-mono text-[11px] font-medium text-[var(--text-primary)]">{sz.zone}</span>
                    <span className="text-[var(--text-secondary)]">{sz.zone_string}</span>
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
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <ScrollText className="h-5 w-5" />
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
                  <Share2 className="h-3.5 w-3.5" />
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
      {/*  SIDEBAR + CONTENT LAYOUT                                     */}
      {/* ============================================================ */}
      <div className="flex gap-6 lg:flex-row flex-col">
        {/* ── Sidebar ── */}
        <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:w-[240px] lg:self-start print:hidden">
          <nav className="rounded-xl bg-stone-100/50 border border-stone-200/50 p-3 space-y-0.5" aria-label="Report tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                  activeTab === tab.id
                    ? "bg-white text-emerald-700 shadow-sm font-semibold"
                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-200/50"
                }`}
              >
                <tab.Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{tab.label}</span>
                {tab.id === "conformity" && conformityScore !== null && (
                  <span className="ml-auto rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    {conformityScore}%
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <div className="min-w-0 flex-1 space-y-5">
          {/* Tab content */}
          <div className="min-h-[400px]">
            {activeTab === "summary" && (
              <SummaryTab data={data} editMode={editMode} userEdits={userEdits} sectionNotes={sectionNotes} onEditField={onEditField} onRevertField={onRevertField} onEditNote={onEditNote} reportId={reportId} />
            )}
            {activeTab === "envelope" && (
              <BuildingEnvelopeTab data={data} onAnalyzeUse={setAnalyzeUse} editMode={editMode} userEdits={userEdits} sectionNotes={sectionNotes} onEditField={onEditField} onRevertField={onRevertField} onEditNote={onEditNote} reportId={reportId} />
            )}
            {activeTab === "uses" && (
              <UsesParkingTab data={data} onAnalyzeUse={setAnalyzeUse} editMode={editMode} userEdits={userEdits} sectionNotes={sectionNotes} onEditField={onEditField} onRevertField={onRevertField} onEditNote={onEditNote} reportId={reportId} />
            )}
            {activeTab === "context" && (
              <ConstraintsContextTab data={data} editMode={editMode} userEdits={userEdits} sectionNotes={sectionNotes} onEditField={onEditField} onRevertField={onRevertField} onEditNote={onEditNote} reportId={reportId} />
            )}
            {activeTab === "nearby" && (
              <NearbyActivityTab data={nearbyPreload ? { ...data, nearby_activity: nearbyPreload } : data} editMode={editMode} sectionNotes={sectionNotes} onEditNote={onEditNote} />
            )}
            {activeTab === "conformity" && (
              <PolicyConformityTab data={data} editMode={editMode} sectionNotes={sectionNotes} onEditNote={onEditNote} />
            )}
            {activeTab === "analyze" && (
              <AnalyzeTab data={data} editMode={editMode} userEdits={userEdits} sectionNotes={sectionNotes} onEditNote={onEditNote} reportId={reportId} />
            )}
          </div>
        </div>
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
