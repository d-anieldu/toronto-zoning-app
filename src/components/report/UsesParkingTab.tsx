"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * UsesParkingTab — Permitted uses, parking rates & estimates,
 * bicycle parking, loading space, amenity space, inclusionary zoning.
 */

import { Card, Row, Badge, Icons, Tag, SectionHeading, FlagProvider } from "./primitives";
import { RefLink } from "../ReferencePanel";
import EditableField from "./EditableField";
import SectionNoteEditor from "./SectionNoteEditor";
import { getFieldValue } from "@/lib/report-edits";

interface UsesParkingTabProps {
  data: Record<string, any>;
  onAnalyzeUse: (use: string) => void;
  editMode?: boolean;
  userEdits?: Record<string, { value: unknown; note?: string; edited_at: string }>;
  sectionNotes?: Record<string, string>;
  onEditField?: (path: string, value: unknown, note?: string) => void;
  onRevertField?: (path: string) => void;
  onEditNote?: (sectionId: string, note: string) => void;
  reportId?: string;
}

export default function UsesParkingTab({ data, onAnalyzeUse, editMode, userEdits, sectionNotes, onEditField, onRevertField, onEditNote, reportId }: UsesParkingTabProps) {
  const eff = data.effective_standards || {};
  const dev = data.development_potential || {};
  const addr = data.address || "";

  /* ── resolve editable fields through user-edit overlay ── */
  const rv = (p: string) => getFieldValue(data, userEdits, p);
  type FV = ReturnType<typeof rv>;
  const ep = (path: string, field: FV) => ({
    fieldPath: path, value: field.value, isEdited: field.isEdited,
    original: field.original, editNote: field.editNote,
    onEdit: onEditField || (() => {}), onRevert: onRevertField, editMode: !!editMode,
  });
  const ev = (path: string, field: FV, display: string | number | null) => {
    if (!editMode) return display;
    if (display === null && !field.isEdited) return null;
    return (<EditableField {...ep(path, field)}><span>{display ?? "\u2014"}</span></EditableField>);
  };

  const estUnits = rv("development_potential.parking_estimate.estimated_units");
  const visitorSpaces = rv("development_potential.parking_estimate.visitor_spaces");
  const maxSpacesPerm = rv("development_potential.parking_maximum.max_spaces_permitted");
  const longTermBike = rv("development_potential.bicycle_parking.long_term");
  const shortTermBike = rv("development_potential.bicycle_parking.short_term");
  const totalAmenity = rv("development_potential.amenity_space.total_required_sqm");
  const indoorAmenity = rv("development_potential.amenity_space.indoor_required_sqm");
  const outdoorAmenity = rv("development_potential.amenity_space.outdoor_required_sqm");
  const izRate = rv("development_potential.inclusionary_zoning.effective_rate_pct");
  const izGfa = rv("development_potential.inclusionary_zoning.required_affordable_gfa_sqm");
  const izUnits = rv("development_potential.inclusionary_zoning.required_affordable_units");
  const loadingSpaces = rv("development_potential.loading_space.required_spaces");
  const visitorFormula = rv("effective_standards.parking.visitor_parking.formula");

  return (
    <FlagProvider address={addr} tabName="uses_parking" reportId={reportId}>
    <div className="space-y-5">
      {/* ============================================================ */}
      {/*  PERMITTED USES                                               */}
      {/* ============================================================ */}
      {(eff.permitted_uses || eff.expanded_uses) && (
        <>
          <SectionHeading id="uses" title="Permitted Uses" icon={Icons.home} />

          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            {eff.expanded_uses ? (
              <div className="space-y-4">
                {eff.expanded_uses.permitted_residential?.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[12px] font-medium text-emerald-600">
                      Permitted Residential ({eff.expanded_uses.permitted_residential.length})
                    </p>
                    <div className="space-y-1.5">
                      {eff.expanded_uses.permitted_residential.map((d: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 cursor-pointer transition-colors hover:bg-emerald-100 hover:ring-1 hover:ring-indigo-300"
                          role="button"
                          tabIndex={0}
                          onClick={() => onAnalyzeUse(d.use || d)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onAnalyzeUse(d.use || d); }}
                        >
                          <div>
                            <span className="text-[12px] font-medium text-stone-700">{d.use || d}</span>
                            {d.conditions && <p className="text-[11px] text-emerald-600">{d.conditions}</p>}
                          </div>
                          <span className="shrink-0 ml-2 text-[10px] text-indigo-400">Analyze →</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {eff.expanded_uses.permitted_non_residential?.length > 0 && (
                  <div className="border-t border-stone-100 pt-3">
                    <p className="mb-1.5 text-[12px] font-medium text-sky-600">
                      Permitted Non-Residential ({eff.expanded_uses.permitted_non_residential.length})
                    </p>
                    <div className="space-y-1.5">
                      {eff.expanded_uses.permitted_non_residential.map((d: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg bg-sky-50 px-3 py-2 cursor-pointer transition-colors hover:bg-sky-100 hover:ring-1 hover:ring-indigo-300"
                          role="button"
                          tabIndex={0}
                          onClick={() => onAnalyzeUse(d.use || d)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onAnalyzeUse(d.use || d); }}
                        >
                          <div>
                            <span className="text-[12px] font-medium text-stone-700">{d.use || d}</span>
                            {d.conditions && <p className="text-[11px] text-sky-600">{d.conditions}</p>}
                          </div>
                          <span className="shrink-0 ml-2 text-[10px] text-indigo-400">Analyze →</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {eff.expanded_uses.conditional_residential?.length > 0 && (
                  <div className="border-t border-stone-100 pt-3">
                    <p className="mb-1.5 text-[12px] font-medium text-amber-600">
                      Conditional Residential ({eff.expanded_uses.conditional_residential.length})
                    </p>
                    <div className="space-y-1.5">
                      {eff.expanded_uses.conditional_residential.map((d: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 cursor-pointer transition-colors hover:bg-amber-100 hover:ring-1 hover:ring-indigo-300"
                          role="button"
                          tabIndex={0}
                          onClick={() => onAnalyzeUse(d.use || d)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onAnalyzeUse(d.use || d); }}
                        >
                          <div>
                            <span className="text-[12px] font-medium text-stone-700">{d.use || d}</span>
                            {d.conditions && <p className="text-[11px] text-amber-600">{d.conditions}</p>}
                          </div>
                          <span className="shrink-0 ml-2 text-[10px] text-indigo-400">Analyze →</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : eff.permitted_uses ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {eff.permitted_uses.map((u: string) => (
                    <Tag key={u} active>{u}</Tag>
                  ))}
                </div>
                {eff.conditional_uses?.length > 0 && (
                  <div className="border-t border-stone-100 pt-3">
                    <p className="mb-2 text-[12px] font-medium text-stone-500">Conditional Uses</p>
                    <div className="flex flex-wrap gap-2">
                      {eff.conditional_uses.map((u: string) => (
                        <Tag key={u}>{u}</Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  PARKING                                                      */}
      {/* ============================================================ */}
      {(eff.parking || dev.parking_estimate) && (
        <>
          <SectionHeading id="parking" title="Parking Requirements" icon={Icons.car} />

          <div className="grid gap-4 md:grid-cols-2">
            {eff.parking?.residential_rates && (
              <Card label="Residential Parking Rates" defaultOpen>
                <Row label="Parking zone" value={eff.parking?.parking_zone} />
                <div className="mt-2 space-y-1.5">
                  {Object.entries(eff.parking.residential_rates).map(
                    ([type, rate]: [string, any]) => (
                      <div key={type} className="flex items-baseline justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2">
                        <span className="text-[12px] font-medium text-stone-700">{type}</span>
                        <span className="text-right text-[12px] text-stone-500">{rate.description || rate.requirement}</span>
                      </div>
                    )
                  )}
                </div>
              </Card>
            )}

            {dev.parking_estimate && (
              <Card label="Parking Estimate" defaultOpen>
                <Row label="Est. units" value={ev("development_potential.parking_estimate.estimated_units", estUnits, estUnits.value as number | null)} />
                <Row label="Residential spaces" value={dev.parking_estimate.residential_spaces} sub={dev.parking_estimate.residential_note} />
                <Row label="Visitor spaces" value={ev("development_potential.parking_estimate.visitor_spaces", visitorSpaces, visitorSpaces.value as number | null)} sub={dev.parking_estimate.visitor_note} />
              </Card>
            )}
          </div>

          {eff.parking_zone_note && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-700">
              ⚠ {eff.parking_zone_note}
            </div>
          )}

          {eff.parking?.visitor_parking && (
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-stone-400">Visitor Parking Formula</p>
              <EditableField {...ep("effective_standards.parking.visitor_parking.formula", visitorFormula)}>
                <p className="font-mono text-[14px] font-medium text-stone-700">{visitorFormula.value as string}</p>
              </EditableField>
              <p className="mt-1 text-[11px] text-stone-400">
                Rate type: {eff.parking.visitor_parking.rate_type} · Parking Zone {eff.parking.visitor_parking.parking_zone}
              </p>
            </div>
          )}

          {(eff.parking?.exemptions || dev.parking_estimate?.exemption_notes?.length > 0) && (
            <Card label="Parking Exemptions" defaultOpen={false}>
              {eff.parking?.exemptions &&
                Object.entries(eff.parking.exemptions).map(([key, exemption]: [string, any]) => (
                  <div key={key} className="mb-4 last:mb-0">
                    <p className="text-[13px] font-semibold text-stone-700">
                      <RefLink type="bylaw-section" id={exemption.section} label={`s. ${exemption.section}`}>
                        s. {exemption.section}
                      </RefLink>: {exemption.title}
                    </p>
                    {exemption.description && (
                      <p className="mt-1 text-[12px] leading-relaxed text-stone-500">{exemption.description}</p>
                    )}
                    {exemption.rules?.map((rule: any, i: number) => (
                      <div key={i} className="ml-3 mt-1.5">
                        <p className="text-[12px] text-stone-500">
                          <span className="font-medium text-stone-600">{rule.rule.replace(/_/g, " ")}:</span> {rule.description}
                        </p>
                      </div>
                    ))}
                    {exemption.note && (
                      <p className="mt-1.5 text-[11px] italic text-stone-400">{exemption.note}</p>
                    )}
                  </div>
                ))}
              {!eff.parking?.exemptions && dev.parking_estimate?.exemption_notes?.length > 0 && (
                <ul className="space-y-2">
                  {dev.parking_estimate.exemption_notes.map((n: string, i: number) => (
                    <li key={i} className="text-[12px] leading-relaxed text-stone-500">• {n}</li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {/* Parking Maximum */}
          {dev.parking_maximum?.applies && (
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">Parking Maximum</p>
              <div className="grid gap-3 sm:grid-cols-2 mb-3">
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <EditableField {...ep("development_potential.parking_maximum.max_spaces_permitted", maxSpacesPerm)}>
                    <p className="text-[22px] font-bold text-stone-900">{maxSpacesPerm.value as number}</p>
                  </EditableField>
                  <p className="text-[12px] text-stone-500">Max spaces permitted</p>
                </div>
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <p className="text-[22px] font-bold text-stone-900">{dev.parking_maximum.max_rate_per_unit}</p>
                  <p className="text-[12px] text-stone-500">Avg rate per unit</p>
                </div>
              </div>
              {dev.parking_maximum.rates_by_bedroom && (
                <div className="space-y-1.5">
                  {Object.entries(dev.parking_maximum.rates_by_bedroom).map(([bed, rate]: [string, any]) => (
                    <div key={bed} className="flex items-baseline justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2">
                      <span className="text-[12px] font-medium text-stone-700">{bed.replace(/_/g, " ")}</span>
                      <span className="text-right text-[12px] text-stone-500">{rate} spaces/unit</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-4 text-[11px] text-stone-400">
                <span>Parking Zone: {dev.parking_maximum.parking_zone}</span>
                {dev.parking_maximum.near_transit && <Badge variant="info">Near Transit</Badge>}
                {dev.parking_maximum.visitor_max_spaces != null && (
                  <span>Visitor max: {dev.parking_maximum.visitor_max_spaces}</span>
                )}
              </div>
              {dev.parking_maximum.exceeds_maximum && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-700">
                  ⚠ {dev.parking_maximum.note}
                </div>
              )}
              {dev.parking_maximum.bylaw_ref && (
                <p className="mt-2 text-[10px] text-stone-400">{dev.parking_maximum.bylaw_ref}</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  BICYCLE PARKING                                              */}
      {/* ============================================================ */}
      {dev.bicycle_parking?.applies && (
        <>
          <SectionHeading id="bicycle-parking" title="Bicycle Parking" icon={Icons.bike} />

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Bicycle Parking Requirements" defaultOpen>
              <Row label="Bicycle zone" value={`Zone ${dev.bicycle_parking.bicycle_zone}`} />
              <Row label="Est. dwelling units" value={dev.bicycle_parking.estimated_units} />
              <Row label="Long-term spaces" value={ev("development_potential.bicycle_parking.long_term", longTermBike, longTermBike.value as number | null)} sub={`${dev.bicycle_parking.rate_long_per_unit} per unit`} />
              <Row label="Short-term spaces" value={ev("development_potential.bicycle_parking.short_term", shortTermBike, shortTermBike.value as number | null)} sub={`${dev.bicycle_parking.rate_short_per_unit} per unit`} />
              <Row label="Total bicycle spaces" value={dev.bicycle_parking.total} />
              {dev.bicycle_parking.shower_change_sets > 0 && (
                <Row label="Shower/change facilities" value={`${dev.bicycle_parking.shower_change_sets} set(s) per gender`} />
              )}
              {dev.bicycle_parking.bylaw_ref && (
                <Row label="By-law reference" value={
                  <RefLink type="bylaw-section" id={dev.bicycle_parking.bylaw_ref} label={`s. ${dev.bicycle_parking.bylaw_ref}`}>
                    s. {dev.bicycle_parking.bylaw_ref}
                  </RefLink>
                } />
              )}
            </Card>
          </div>

          {dev.bicycle_parking.exception_override && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-700">
              ⚠ Exception override: {dev.bicycle_parking.exception_override}
            </div>
          )}
          {dev.bicycle_parking.note && (
            <p className="text-[11px] italic text-stone-400">{dev.bicycle_parking.note}</p>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  LOADING SPACE                                                */}
      {/* ============================================================ */}
      {dev.loading_space && (
        <>
          <SectionHeading id="loading" title="Loading Space" icon={Icons.truck} />

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Loading Requirements" defaultOpen>
              <Row label="Est. dwelling units" value={dev.loading_space.estimated_units} />
              <Row label="Required" value={dev.loading_space.applies ? "Yes" : "No"} />
              {dev.loading_space.required_spaces?.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {dev.loading_space.required_spaces.map((space: any, i: number) => (
                    <div key={i} className="flex items-baseline justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2">
                      <span className="text-[12px] font-medium text-stone-700">
                        {space.count}× Type &ldquo;{space.type}&rdquo;
                      </span>
                      <span className="text-right text-[12px] text-stone-500">
                        {space.length_m}m × {space.width_m}m
                        {space.clearance_m ? `, ${space.clearance_m}m clearance` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {dev.loading_space.bylaw_ref && (
                <Row label="By-law reference" value={
                  <RefLink type="bylaw-section" id={dev.loading_space.bylaw_ref} label={`s. ${dev.loading_space.bylaw_ref}`}>
                    s. {dev.loading_space.bylaw_ref}
                  </RefLink>
                } />
              )}
            </Card>
          </div>

          {dev.loading_space.exception_override && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-700">
              ⚠ Exception override: {dev.loading_space.exception_override}
            </div>
          )}
          {dev.loading_space.note && (
            <p className="text-[11px] italic text-stone-400">{dev.loading_space.note}</p>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  AMENITY SPACE                                                */}
      {/* ============================================================ */}
      {dev.amenity_space?.applies && (
        <>
          <SectionHeading id="amenity" title="Amenity Space" icon={Icons.sparkle} />

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Amenity Space Requirements" defaultOpen>
              <Row label="Est. dwelling units" value={dev.amenity_space.estimated_units} />
              <Row label="Threshold" value={`≥ ${dev.amenity_space.threshold_units} units`} />
              <Row label="Total required" value={ev("development_potential.amenity_space.total_required_sqm", totalAmenity, totalAmenity.value != null ? `${totalAmenity.value} m²` : null)} />
              <Row label="Indoor required" value={ev("development_potential.amenity_space.indoor_required_sqm", indoorAmenity, indoorAmenity.value != null ? `${indoorAmenity.value} m²` : null)} />
              <Row label="Outdoor required" value={ev("development_potential.amenity_space.outdoor_required_sqm", outdoorAmenity, outdoorAmenity.value != null ? `${outdoorAmenity.value} m²` : null)} sub={`Min ${dev.amenity_space.outdoor_min_sqm} m²`} />
              <Row label="Green roof allowance" value={`Up to ${dev.amenity_space.green_roof_max_sqm} m² (${dev.amenity_space.green_roof_max_pct}%)`} />
              {dev.amenity_space.bylaw_ref && (
                <Row label="By-law reference" value={
                  <RefLink type="bylaw-section" id={dev.amenity_space.bylaw_ref} label={`s. ${dev.amenity_space.bylaw_ref}`}>
                    s. {dev.amenity_space.bylaw_ref}
                  </RefLink>
                } />
              )}
            </Card>
          </div>

          {dev.amenity_space.exception_override && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-700">
              ⚠ Exception override: {dev.amenity_space.exception_override}
            </div>
          )}
          {dev.amenity_space.note && (
            <p className="text-[11px] italic text-stone-400">{dev.amenity_space.note}</p>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  INCLUSIONARY ZONING                                          */}
      {/* ============================================================ */}
      {dev.inclusionary_zoning?.applies && (
        <>
          <SectionHeading id="inclusionary-zoning" title="Inclusionary Zoning" icon={Icons.home} />

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Inclusionary Zoning Requirements" defaultOpen>
              <Row label="IZ area" value={dev.inclusionary_zoning.iz_area} />
              <Row label="Tenure" value={dev.inclusionary_zoning.tenure} />
              <Row label="Base rate" value={`${dev.inclusionary_zoning.base_rate_pct}%`} />
              {dev.inclusionary_zoning.phase_increase_pct > 0 && (
                <Row label="Phasing increase" value={`+${dev.inclusionary_zoning.phase_increase_pct}%`} />
              )}
              <Row label="Effective rate" value={ev("development_potential.inclusionary_zoning.effective_rate_pct", izRate, izRate.value != null ? `${izRate.value}%` : null)} />
              {dev.inclusionary_zoning.exempt ? (
                <Row label="Status" value={<span className="text-green-600 font-medium">Exempt</span>} sub={dev.inclusionary_zoning.exempt_reason} />
              ) : (
                <>
                  {(dev.inclusionary_zoning.required_affordable_gfa_sqm != null || izGfa.isEdited) && (
                    <Row label="Required affordable GFA" value={ev("development_potential.inclusionary_zoning.required_affordable_gfa_sqm", izGfa, izGfa.value != null ? `${(izGfa.value as number).toLocaleString()} m²` : null)} />
                  )}
                  {(dev.inclusionary_zoning.required_affordable_units != null || izUnits.isEdited) && (
                    <Row label="Est. affordable units" value={ev("development_potential.inclusionary_zoning.required_affordable_units", izUnits, izUnits.value as number | null)} />
                  )}
                </>
              )}
              {dev.inclusionary_zoning.affordability_period_years && (
                <Row label="Affordability period" value={`${dev.inclusionary_zoning.affordability_period_years} years`} />
              )}
            </Card>
          </div>

          {dev.inclusionary_zoning.phasing_note && (
            <p className="text-[11px] italic text-stone-400">{dev.inclusionary_zoning.phasing_note}</p>
          )}
          {dev.inclusionary_zoning.parking_note && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[12px] text-emerald-700">
              {dev.inclusionary_zoning.parking_note}
            </div>
          )}
        </>
      )}

      {/* ── Section Note ── */}
      <SectionNoteEditor
        sectionId="uses_parking"
        note={sectionNotes?.uses_parking || ""}
        onNoteChange={onEditNote || (() => {})}
        editMode={!!editMode}
      />
    </div>
    </FlagProvider>
  );
}
