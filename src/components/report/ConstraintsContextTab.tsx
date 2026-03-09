"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * ConstraintsContextTab — Overlays & layers, natural hazards, heritage,
 * overlay district rules, CoA precedents, Official Plan context, exception details,
 * development charges, planning contact, confidence scoring.
 *
 * Essentially the "deep regulatory intelligence" tab.
 */

import { Card, Row, Badge, Icons, SectionHeading } from "./primitives";
import { RefLink } from "../ReferencePanel";
import ExceptionDetail from "../ExceptionDetail";

/* ── Overlay definition helper ────────────────────────────────────── */

function buildOverlayDefs(layers: Record<string, any>) {
  const defs = [
    { key: "height_overlay", label: "Height Overlay", icon: "📏",
      detail: layers.height_overlay ? `HT ${layers.height_overlay.HT_LABEL}m${layers.height_overlay.HT_STORIES ? `, ${layers.height_overlay.HT_STORIES} st` : ""}` : undefined },
    { key: "lot_coverage_overlay", label: "Lot Coverage", icon: "📐",
      detail: layers.lot_coverage_overlay ? `${layers.lot_coverage_overlay.PRCNT_CVER}%` : undefined },
    { key: "building_setback_overlay", label: "Building Setback", icon: "↔️",
      detail: layers.building_setback_overlay?.SETBACK ? `${layers.building_setback_overlay.SETBACK}m` : undefined },
    { key: "parking_zone_overlay", label: "Parking Zone", icon: "🅿️",
      detail: layers.parking_zone_overlay?.ZN_PARKZONE ? `Zone ${layers.parking_zone_overlay.ZN_PARKZONE}` : undefined },
    { key: "policy_area_overlay", label: "Policy Area", icon: "📋",
      detail: layers.policy_area_overlay?.POLICY_ARE || layers.policy_area_overlay?.POLICY_ID },
    { key: "policy_road_overlay", label: "Policy Road", icon: "🛣️",
      detail: layers.policy_road_overlay?.ROAD_NAME },
    { key: "rooming_house_overlay", label: "Rooming House", icon: "🏠",
      detail: (() => { const rh = layers.rooming_house_overlay; if (!rh) return undefined; if (Array.isArray(rh)) return rh.map((r: any) => r.RMG_STRING || `Area ${r.RMH_AREA}`).join(", "); return rh.RMG_STRING || `Area ${rh.RMH_AREA}`; })() },
    { key: "priority_retail_street_overlay", label: "Priority Retail Street", icon: "🏪" },
    { key: "queen_st_w_eat_community_overlay", label: "Queen St W EAT Community", icon: "🍽️" },
    { key: "heritage_register", label: "Heritage Register", icon: "🏛️",
      detail: layers.heritage_register?.STATUS },
    { key: "heritage_conservation_district", label: "Heritage Conservation District", icon: "🏘️",
      detail: layers.heritage_conservation_district?.HCD_NAME },
    { key: "secondary_plan", label: "Secondary Plan", icon: "📑",
      detail: layers.secondary_plan?.SECONDARY_PLAN_NAME },
    { key: "major_transit_station_area", label: "Major Transit Station Area", icon: "🚉",
      detail: layers.major_transit_station_area?.StationNam },
    { key: "ravine_protection", label: "Ravine & Natural Feature", icon: "🌿" },
    { key: "environmentally_significant_area", label: "Environmentally Significant Area", icon: "🌳",
      detail: layers.environmentally_significant_area?.ESA_NAME },
    { key: "natural_heritage_system", label: "Natural Heritage System", icon: "🦉" },
    { key: "site_area_specific_policy", label: "Site & Area Specific Policy", icon: "📌",
      detail: (() => { const s = layers.site_area_specific_policy; if (!s) return undefined; if (Array.isArray(s) && s.length > 0) return `${s.length} ${s.length === 1 ? "policy" : "policies"}`; return undefined; })() },
    { key: "archaeological_potential", label: "Archaeological Potential", icon: "🏺" },
  ];
  const isActive = (key: string) => { const v = layers[key]; if (v === null || v === undefined) return false; if (Array.isArray(v) && v.length === 0) return false; return true; };
  return { active: defs.filter((o) => isActive(o.key)), inactive: defs.filter((o) => !isActive(o.key)) };
}

interface ConstraintsContextTabProps {
  data: Record<string, any>;
}

export default function ConstraintsContextTab({ data }: ConstraintsContextTabProps) {
  const eff = data.effective_standards || {};
  const dev = data.development_potential || {};
  const layers = data.layers || {};

  const { active: activeOverlays, inactive: inactiveOverlays } = buildOverlayDefs(layers);

  const opContext = eff.op_context;
  const opDesignation = opContext?.op_designation;
  const saspPolicies = opContext?.sasp_policies || [];
  const zoneCode = eff.zone_code || eff.zone_label?.zone_code || "";

  return (
    <div className="space-y-5">
      {/* ============================================================ */}
      {/*  OVERLAYS & LAYERS                                            */}
      {/* ============================================================ */}
      <SectionHeading id="overlays" title="Overlays & Layers" icon={Icons.layers} count={activeOverlays.length} />

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        {activeOverlays.length > 0 && (
          <div className="mb-5">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-emerald-600">
              Active ({activeOverlays.length})
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {activeOverlays.map((o) => (
                <div key={o.key} className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                  <span className="mt-0.5 text-[16px]" aria-hidden="true">{o.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-stone-700">{o.label}</p>
                    {o.detail && <p className="font-mono text-[12px] text-emerald-600">{o.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {inactiveOverlays.length > 0 && (
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
              Not Applicable ({inactiveOverlays.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {inactiveOverlays.map((o) => (
                <span key={o.key} className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-1.5 text-[12px] text-stone-300">
                  {o.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  NATURAL HAZARDS                                              */}
      {/* ============================================================ */}
      {eff.natural_hazards?.has_hazards && (
        <>
          <SectionHeading id="hazards" title="Natural Hazard Constraints" icon={Icons.tree} count={eff.natural_hazards.hazard_count} />

          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-[13px] font-medium leading-relaxed text-red-700">{eff.natural_hazards.summary}</p>
            {eff.natural_hazards.combined_setback_m && (
              <p className="mt-2 text-[12px] text-red-600">
                Combined maximum setback: <span className="font-bold">{eff.natural_hazards.combined_setback_m}m</span>
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-1">
            {(eff.natural_hazards.hazards ?? []).map((h: any, i: number) => {
              const sevColor = h.severity === "high" ? "border-red-200 bg-red-50/30" : h.severity === "medium" ? "border-amber-200 bg-amber-50/30" : "border-stone-200 bg-stone-50/30";
              const sevBadge = h.severity === "high" ? "danger" : h.severity === "medium" ? "warning" : "default";
              return (
                <div key={i} className={`rounded-xl border p-5 shadow-sm ${sevColor}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={sevBadge as any}>{h.severity?.toUpperCase()}</Badge>
                    <span className="text-[14px] font-semibold text-stone-800">{h.label}</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 mb-3">
                    <div className="rounded-lg border border-stone-200 bg-white p-3">
                      <p className="text-[22px] font-bold text-stone-900">{h.setback_m}m</p>
                      <p className="text-[12px] text-stone-500">setback {h.setback_label}</p>
                    </div>
                    {h.tree_protection_m && (
                      <div className="rounded-lg border border-stone-200 bg-white p-3">
                        <p className="text-[22px] font-bold text-stone-900">{h.tree_protection_m}m</p>
                        <p className="text-[12px] text-stone-500">tree protection zone</p>
                      </div>
                    )}
                    {h.reduced_setback_m && (
                      <div className="rounded-lg border border-stone-200 bg-white p-3">
                        <p className="text-[22px] font-bold text-amber-600">{h.reduced_setback_m}m</p>
                        <p className="text-[12px] text-stone-500">reduced setback (urban area)</p>
                      </div>
                    )}
                  </div>
                  {h.rules?.length > 0 && (
                    <Card label="Rules & Restrictions" defaultOpen={false}>
                      <ul className="space-y-1.5">
                        {h.rules.map((r: string, ri: number) => (
                          <li key={ri} className="flex items-start gap-2 text-[12px] leading-relaxed text-stone-600">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                      {h.restrictions?.length > 0 && (
                        <div className="mt-3 border-t border-stone-100 pt-3">
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-red-500">Restrictions</p>
                          <ul className="space-y-1.5">
                            {h.restrictions.map((r: string, ri: number) => (
                              <li key={ri} className="flex items-start gap-2 text-[12px] leading-relaxed text-red-600">
                                <span className="mt-0.5 text-red-400">✕</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              );
            })}
          </div>

          {(eff.natural_hazards.permits_required?.length > 0 || eff.natural_hazards.studies_required?.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {eff.natural_hazards.permits_required?.length > 0 && (
                <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-red-500">Permits Required</p>
                  <ul className="space-y-2">
                    {eff.natural_hazards.permits_required.map((p: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-stone-600">
                        <span className="mt-0.5 text-red-500" aria-hidden="true">📋</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {eff.natural_hazards.studies_required?.length > 0 && (
                <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-amber-500">Studies Required</p>
                  <ul className="space-y-2">
                    {eff.natural_hazards.studies_required.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-stone-600">
                        <span className="mt-0.5 text-amber-500" aria-hidden="true">📄</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  HERITAGE CONSTRAINTS                                         */}
      {/* ============================================================ */}
      {eff.heritage_impact?.has_heritage && (
        <>
          <SectionHeading id="heritage" title="Heritage Constraints" icon={Icons.landmark} count={eff.heritage_impact.item_count} />

          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <p className="text-[13px] font-medium leading-relaxed text-violet-700">{eff.heritage_impact.combined_impact}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-1">
            {(eff.heritage_impact.items ?? []).map((item: any, i: number) => (
              <div key={i} className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm">
                {item.type === "heritage_register" && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={item.protection_level === "designated" ? "danger" : "warning"}>
                        {item.protection_level === "designated" ? "DESIGNATED" : "LISTED"}
                      </Badge>
                      <span className="text-[14px] font-semibold text-stone-800">Heritage Register</span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-stone-600 mb-3">{item.level_description}</p>
                    <p className="text-[12px] leading-relaxed text-stone-500">{item.impact}</p>
                    {item.description && (
                      <div className="mt-3 rounded-lg bg-stone-50 p-3">
                        <p className="text-[12px] text-stone-500">{item.description}</p>
                      </div>
                    )}
                    {item.construction_date && (
                      <p className="mt-2 text-[11px] text-stone-400">Construction date: {item.construction_date}</p>
                    )}
                  </>
                )}
                {item.type === "heritage_conservation_district" && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="info">HCD</Badge>
                      <span className="text-[14px] font-semibold text-stone-800">{item.hcd_name}</span>
                      {item.bylaw && item.plan_url ? (
                        <a href={item.plan_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-violet-500 underline decoration-dotted underline-offset-2 hover:text-violet-700">
                          By-law {item.bylaw} ↗
                        </a>
                      ) : item.bylaw ? (
                        <span className="text-[11px] text-stone-400">By-law {item.bylaw}</span>
                      ) : null}
                    </div>
                    <p className="mb-2 text-[11px] font-medium text-violet-500">{item.status_note}</p>
                    {item.character_statement && (
                      <p className="mb-3 text-[12px] italic leading-relaxed text-stone-500">&ldquo;{item.character_statement}&rdquo;</p>
                    )}
                    <p className="text-[12px] leading-relaxed text-stone-500 mb-3">{item.impact}</p>
                    <div className="grid gap-3 sm:grid-cols-3 mb-3">
                      {item.max_storeys_guideline && (
                        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                          <p className="text-[18px] font-bold text-stone-900">{item.max_storeys_guideline}</p>
                          <p className="text-[12px] text-stone-500">max storeys (guideline)</p>
                          {item.max_storeys_note && <p className="text-[10px] text-stone-400 mt-0.5">{item.max_storeys_note}</p>}
                        </div>
                      )}
                      {item.streetwall_height_m && (
                        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                          <p className="text-[18px] font-bold text-stone-900">{item.streetwall_height_m}m</p>
                          <p className="text-[12px] text-stone-500">street wall height</p>
                        </div>
                      )}
                    </div>
                    {(item.permitted_materials?.length > 0 || item.prohibited_materials?.length > 0) && (
                      <div className="grid gap-3 sm:grid-cols-2 mb-3">
                        {item.permitted_materials?.length > 0 && (
                          <div>
                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-500">Permitted Materials</p>
                            <div className="flex flex-wrap gap-1.5">
                              {item.permitted_materials.map((m: string) => (
                                <span key={m} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-100">{m}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {item.prohibited_materials?.length > 0 && (
                          <div>
                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-red-500">Prohibited Materials</p>
                            <div className="flex flex-wrap gap-1.5">
                              {item.prohibited_materials.map((m: string) => (
                                <span key={m} className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 border border-red-100">{m}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {item.design_guidelines?.length > 0 && (
                      <Card label="Design Guidelines" defaultOpen={false}>
                        <ul className="space-y-1.5">
                          {item.design_guidelines.map((g: string, gi: number) => (
                            <li key={gi} className="flex items-start gap-2 text-[12px] leading-relaxed text-stone-600">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}
                    {item.plan_url && (
                      <a href={item.plan_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[11px] text-violet-600 underline hover:text-violet-800">
                        View HCD Plan document ↗
                      </a>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {(eff.heritage_impact.permits_required?.length > 0 || eff.heritage_impact.studies_required?.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {eff.heritage_impact.permits_required?.length > 0 && (
                <div className="rounded-xl border border-violet-100 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-violet-500">Heritage Permits Required</p>
                  <ul className="space-y-2">
                    {eff.heritage_impact.permits_required.map((p: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-stone-600">
                        <span className="mt-0.5 text-violet-500" aria-hidden="true">📋</span><span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {eff.heritage_impact.studies_required?.length > 0 && (
                <div className="rounded-xl border border-violet-100 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-violet-500">Studies Required</p>
                  <ul className="space-y-2">
                    {eff.heritage_impact.studies_required.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-stone-600">
                        <span className="mt-0.5 text-violet-500" aria-hidden="true">📄</span><span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  OVERLAY DISTRICT RULES                                       */}
      {/* ============================================================ */}
      {eff.overlay_rules && Object.values(eff.overlay_rules).some((r: any) => r?.applies) && (
        <>
          <SectionHeading id="overlay-rules" title="Overlay District Rules" icon={Icons.layers} />

          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(eff.overlay_rules).map(([key, rule]: [string, any]) => {
              if (!rule?.applies) return null;
              return (
                <div key={key} className="rounded-xl border border-sky-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    {rule.chapter ? (
                      <RefLink type="bylaw-section" id={rule.chapter.replace(/^Ch\.?\s*/i, "")} label={rule.chapter}>
                        <Badge variant="info">{rule.chapter}</Badge>
                      </RefLink>
                    ) : (
                      <Badge variant="info">Ch. 600</Badge>
                    )}
                    <span className="text-[13px] font-semibold text-stone-800">
                      {rule.name || key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  </div>
                  {key === "building_setback" && (
                    <div className="space-y-1.5">
                      {rule.tower_separation_m && <Row label="Tower separation" value={`${rule.tower_separation_m} m`} sub={`Above ${rule.tower_height_threshold_m || "?"} m`} />}
                      {rule.min_setback_above_m && <Row label="Min setback above podium" value={`${rule.min_setback_above_m} m`} />}
                    </div>
                  )}
                  {key === "priority_retail" && (
                    <div className="space-y-1.5">
                      {rule.min_retail_frontage_pct && <Row label="Min retail frontage" value={`${rule.min_retail_frontage_pct}%`} />}
                      {rule.min_window_pct && <Row label="Min ground floor windows" value={`${rule.min_window_pct}%`} />}
                      {rule.min_floor_to_ceiling_m && <Row label="Min floor-to-ceiling" value={`${rule.min_floor_to_ceiling_m} m`} />}
                    </div>
                  )}
                  {key === "inclusionary_zoning" && (
                    <div className="space-y-1.5">
                      {rule.affordable_pct && <Row label="Affordable housing req." value={`${rule.affordable_pct}%`} />}
                      {rule.threshold_units && <Row label="Threshold" value={`${rule.threshold_units} units`} />}
                    </div>
                  )}
                  {key === "queen_st_w_community" && (
                    <div className="space-y-1.5">
                      {rule.max_eating_establishment_area_sqm && <Row label="Max eating establishment" value={`${rule.max_eating_establishment_area_sqm} m²`} />}
                      {rule.entertainment_prohibited && <p className="text-[12px] text-red-600 font-medium">Entertainment prohibited</p>}
                    </div>
                  )}
                  {!["building_setback", "priority_retail", "inclusionary_zoning", "queen_st_w_community"].includes(key) && (
                    <div className="space-y-1.5">
                      {Object.entries(rule).filter(([k]) => k !== "applies" && k !== "name" && k !== "chapter").map(([k, v]: [string, any]) => (
                        <Row key={k} label={k.replace(/_/g, " ")} value={typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  COA PRECEDENTS                                               */}
      {/* ============================================================ */}
      {dev.coa_precedents?.total_matches > 0 && (
        <>
          <SectionHeading id="coa" title="Committee of Adjustment Precedents" icon={Icons.gavel} count={dev.coa_precedents.total_matches} />

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Application Statistics" defaultOpen>
              <Row label="Total applications" value={dev.coa_precedents.total_matches} />
              <Row label="Approval rate" value={`${dev.coa_precedents.approval_rate}%`} />
              {dev.coa_precedents.same_zone_count > 0 && (
                <>
                  <Row label="Same zone applications" value={dev.coa_precedents.same_zone_count} />
                  {dev.coa_precedents.same_zone_approval_rate != null && (
                    <Row label="Same zone approval rate" value={`${dev.coa_precedents.same_zone_approval_rate}%`} />
                  )}
                </>
              )}
              {dev.coa_precedents.common_sub_types?.length > 0 && (
                <Row label="Common sub-types" value={dev.coa_precedents.common_sub_types.map((s: [string, number]) => `${s[0]} (${s[1]})`).join(", ")} />
              )}
              {dev.coa_precedents.common_work_types?.length > 0 && (
                <Row label="Common work types" value={dev.coa_precedents.common_work_types.map((s: [string, number]) => `${s[0]} (${s[1]})`).join(", ")} />
              )}
            </Card>
          </div>

          {dev.coa_precedents.samples?.length > 0 && (
            <Card label="Recent Applications" defaultOpen={false}>
              <div className="space-y-3">
                {dev.coa_precedents.samples.map((s: any, i: number) => (
                  <div key={i} className="rounded-lg border border-stone-100 bg-stone-50 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[12px] font-medium text-stone-700">{s.address}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        s.decision?.toLowerCase().startsWith("approv") ? "bg-green-100 text-green-700"
                          : s.decision?.toLowerCase().startsWith("refus") ? "bg-red-100 text-red-700"
                          : "bg-stone-100 text-stone-600"
                      }`}>{s.decision}</span>
                    </div>
                    {s.reference && <p className="text-[11px] text-stone-400">Ref: {s.reference}{s.hearing_date ? ` · ${s.hearing_date}` : ""}</p>}
                    {s.sub_type && <p className="text-[11px] text-stone-500">{s.sub_type}{s.work_type ? ` — ${s.work_type}` : ""}</p>}
                    {s.description && <p className="mt-1 text-[11px] leading-relaxed text-stone-400">{s.description}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}
          {dev.coa_precedents.summary_text && (
            <p className="text-[11px] italic text-stone-400">{dev.coa_precedents.summary_text}</p>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  OFFICIAL PLAN CONTEXT                                        */}
      {/* ============================================================ */}
      {opContext && (
        <>
          <SectionHeading id="op-context" title="Official Plan Context" icon={Icons.map} />

          {opDesignation && (
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div>
                <RefLink type="op-designation" id={zoneCode || ""} label={opDesignation.designation}>
                  <Badge variant="info">{opDesignation.section ? `OP s.${opDesignation.section}` : "Official Plan"}</Badge>
                </RefLink>
                <h4 className="mt-2 text-[17px] font-bold text-stone-900">{opDesignation.designation}</h4>
                {opDesignation.description && (
                  <p className="mt-2 text-[13px] leading-relaxed text-stone-500">{opDesignation.description}</p>
                )}
              </div>
              {opDesignation.policy_highlights?.length > 0 && (
                <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-4">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-sky-600">Key Policies</p>
                  <ul className="space-y-1.5">
                    {opDesignation.policy_highlights.map((h: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-sky-700">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-400" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {(opContext.secondary_plan || opContext.mtsa) && (
            <div className="grid gap-4 md:grid-cols-2">
              {opContext.secondary_plan && (
                <Card label="Secondary Plan">
                  <Row label="Plan name" value={opContext.secondary_plan.plan_name} />
                  <Row label="Plan number" value={opContext.secondary_plan.plan_number} />
                </Card>
              )}
              {opContext.mtsa && (
                <Card label="Major Transit Station Area">
                  <Row label="Station" value={opContext.mtsa.station_name} />
                  <Row label="Type" value={opContext.mtsa.mtsa_type} />
                </Card>
              )}
            </div>
          )}

          {saspPolicies.length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                Site & Area Specific Policies
                <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">{saspPolicies.length}</span>
              </p>
              <div className="space-y-3">
                {saspPolicies.map((sasp: any, i: number) => (
                  <div key={i} className="rounded-lg border border-amber-100 bg-amber-50/50 p-4">
                    <p className="text-[13px] font-semibold text-stone-800">
                      <RefLink type="sasp" id={String(sasp.sasp_number)} label={`SASP #${sasp.sasp_number}`}>
                        SASP #{sasp.sasp_number}
                      </RefLink>
                    </p>
                    {sasp.title && <p className="mt-0.5 text-[12px] font-medium text-stone-600">{sasp.title}</p>}
                    {sasp.content && <p className="mt-2 text-[12px] leading-relaxed text-stone-500">{sasp.content}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  EXCEPTION DETAILS                                            */}
      {/* ============================================================ */}
      {eff.exception && eff.exception.exception_number && (
        <>
          <SectionHeading id="exception" title={`Exception #${eff.exception.exception_number}`} icon={Icons.doc} />
          <ExceptionDetail exception={eff.exception} exceptionDiff={eff.exception_diff} />

          {eff.exception.interpreted_prevailing?.length > 0 && (
            <div className="mt-4">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                Prevailing By-law Interpretation
              </p>
              <div className="space-y-4">
                {eff.exception.interpreted_prevailing.map((entry: any, idx: number) => {
                  const interp = entry.interpretation || {};
                  if (interp.status === "none_apply") {
                    return (
                      <div key={idx} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                        <p className="text-[13px] font-medium text-stone-500">
                          {entry.letter && <span className="mr-1 text-stone-400">({entry.letter})</span>}
                          No prevailing by-law provisions override 569-2013 for this property.
                        </p>
                      </div>
                    );
                  }
                  const bylawLabel = entry.prevailing_bylaw
                    ? `By-law ${entry.prevailing_bylaw.number}${entry.prevailing_bylaw.municipality ? ` (${entry.prevailing_bylaw.municipality})` : ""}`
                    : interp.bylaw_id || "Unknown";
                  return (
                    <div key={idx} className="rounded-xl border border-sky-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        {entry.letter && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">{entry.letter}</span>
                        )}
                        <span className="text-[14px] font-semibold text-stone-800">{bylawLabel}</span>
                        {interp.fully_interpreted ? (
                          <Badge variant="success">Fully Interpreted</Badge>
                        ) : interp.interpretations?.some((i: any) => i.interpreted) ? (
                          <Badge variant="warning">Partially Interpreted</Badge>
                        ) : (
                          <Badge variant="default">Not Indexed</Badge>
                        )}
                      </div>
                      {interp.summary && <p className="mb-3 text-[12px] leading-relaxed text-stone-500">{interp.summary}</p>}
                      {interp.interpretations?.length > 0 && (
                        <Card label={`Section Interpretations (${interp.section_count})`} defaultOpen={false}>
                          <div className="space-y-3">
                            {interp.interpretations.map((si: any, si_idx: number) => (
                              <div key={si_idx} className={`rounded-lg p-3 ${si.interpreted ? "bg-sky-50 border border-sky-100" : "bg-stone-50 border border-stone-100"}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  {si.section_ref ? (
                                    <RefLink type="bylaw-section" id={si.section_ref} label={`s. ${si.section_ref}`}>
                                      <span className="text-[12px] font-medium text-sky-700 underline decoration-dotted cursor-pointer hover:text-sky-900 transition-colors">{si.section_ref}</span>
                                    </RefLink>
                                  ) : (
                                    <span className="text-[12px] font-medium text-stone-700">Section {si_idx + 1}</span>
                                  )}
                                  {si.interpreted && si.category && <Badge variant="info">{si.category}</Badge>}
                                </div>
                                {si.interpreted && si.summary && <p className="text-[12px] leading-relaxed text-sky-700">{si.summary}</p>}
                                {si.interpreted && si.typical_provisions && <p className="mt-1 text-[11px] text-stone-400">Typical: {si.typical_provisions}</p>}
                                {!si.interpreted && si.note && <p className="text-[12px] text-stone-400">{si.note}</p>}
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}
                      {interp.merged_standards && Object.keys(interp.merged_standards).length > 0 && (
                        <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Interpreted Standards</p>
                          <div className="space-y-1">
                            {Object.entries(interp.merged_standards).map(([key, val]: [string, any]) => (
                              <Row key={key} label={key.replace(/_/g, " ")} value={String(val)} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  DEVELOPMENT CHARGES                                          */}
      {/* ============================================================ */}
      {dev.development_charges && (
        <>
          <SectionHeading id="charges" title="Development Charges" icon={Icons.dollar} />

          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            {dev.development_charges.estimates?.length > 0 && (
              <div className="space-y-2">
                {dev.development_charges.estimates.map((est: any, i: number) => (
                  <div key={i} className="flex items-baseline justify-between rounded-lg bg-stone-50 px-4 py-3">
                    <div>
                      <span className="text-[13px] font-medium text-stone-700">{est.category}</span>
                      <p className="text-[11px] text-stone-400">{est.units} unit{est.units !== 1 ? "s" : ""} × ${Number(est.rate_per_unit).toLocaleString()}/unit</p>
                    </div>
                    <span className="font-mono text-[15px] font-bold text-stone-900">${Number(est.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            {dev.development_charges.total_estimated && (
              <div className="mt-3 flex items-baseline justify-between border-t border-stone-200 pt-3">
                <span className="text-[14px] font-semibold text-stone-700">Total Estimated</span>
                <span className="font-mono text-[22px] font-bold text-stone-900">${Number(dev.development_charges.total_estimated).toLocaleString()}</span>
              </div>
            )}
            {dev.development_charges.note && (
              <p className="mt-3 rounded-lg bg-stone-50 p-3 text-[11px] leading-relaxed text-stone-400">{dev.development_charges.note}</p>
            )}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  PLANNING CONTACT                                             */}
      {/* ============================================================ */}
      {data.planning_contact && (
        <>
          <SectionHeading id="contact" title="Planning Contact" icon={Icons.phone} />

          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-[11px] uppercase tracking-wide text-stone-400">Administrative — not regulatory</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-stone-50 p-4">
                <p className="text-[15px] font-semibold text-stone-900">{data.planning_contact.MANAGER}</p>
                <p className="mt-1 text-[12px] text-stone-500">{data.planning_contact.SECTION} · {data.planning_contact.DISTRICT}</p>
              </div>
              <div className="space-y-2 rounded-lg bg-stone-50 p-4">
                {data.planning_contact.PHONE && (
                  <p className="text-[13px] text-stone-600">📞 <a href={`tel:${data.planning_contact.PHONE}`} className="underline hover:text-stone-900">{data.planning_contact.PHONE}</a></p>
                )}
                {data.planning_contact.EMAIL && (
                  <p className="text-[13px] text-stone-600">✉️ <a href={`mailto:${data.planning_contact.EMAIL}`} className="underline hover:text-stone-900">{data.planning_contact.EMAIL}</a></p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  REPORT CONFIDENCE                                            */}
      {/* ============================================================ */}
      {dev.confidence && (
        <>
          <SectionHeading id="confidence" title="Report Confidence" icon={Icons.shield} />

          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full border-4 ${
                dev.confidence.overall_confidence === "high" ? "border-emerald-400 text-emerald-600"
                  : dev.confidence.overall_confidence === "medium" ? "border-amber-400 text-amber-600"
                  : dev.confidence.overall_confidence === "low" ? "border-red-400 text-red-600"
                  : "border-stone-300 text-stone-500"
              }`}>
                <span className="text-[20px] font-bold">{dev.confidence.overall_score}</span>
              </div>
              <div>
                <p className="text-[16px] font-bold text-stone-900">{dev.confidence.overall_confidence?.toUpperCase()} Confidence</p>
                <p className="text-[12px] text-stone-500">
                  {dev.confidence.high_confidence_count}/{dev.confidence.section_count} sections high-confidence
                  {dev.confidence.low_confidence_count > 0 && (
                    <span className="text-red-500"> · {dev.confidence.low_confidence_count} low-confidence</span>
                  )}
                </p>
              </div>
            </div>

            <p className="mb-4 text-[12px] leading-relaxed text-stone-500">{dev.confidence.summary}</p>

            {dev.confidence.methodology && (
              <details className="mb-4 rounded-lg border border-stone-100 bg-stone-50">
                <summary className="cursor-pointer px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500 hover:text-stone-700">
                  How This Score Works
                </summary>
                <div className="px-4 pb-3 pt-1">
                  <p className="text-[11px] leading-relaxed text-stone-500 mb-3">{dev.confidence.methodology.description}</p>
                  <div className="space-y-2 mb-3">
                    {dev.confidence.methodology.dimensions?.map((d: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-stone-400" />
                        <div>
                          <span className="text-[11px] font-semibold text-stone-700">{d.name} ({d.weight})</span>
                          <span className="text-[11px] text-stone-500"> — {d.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded border border-stone-200 overflow-hidden">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-stone-100">
                          <th className="px-2 py-1 text-left font-semibold text-stone-600">Level</th>
                          <th className="px-2 py-1 text-left font-semibold text-stone-600">Score</th>
                          <th className="px-2 py-1 text-left font-semibold text-stone-600">Meaning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dev.confidence.methodology.thresholds?.map((t: any) => (
                          <tr key={t.level} className="border-t border-stone-100">
                            <td className="px-2 py-1">
                              <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                t.level === "high" ? "bg-emerald-100 text-emerald-700"
                                  : t.level === "medium" ? "bg-amber-100 text-amber-700"
                                  : t.level === "low" ? "bg-red-100 text-red-700"
                                  : "bg-stone-200 text-stone-600"
                              }`}>{t.level}</span>
                            </td>
                            <td className="px-2 py-1 text-stone-600">{t.min_score}+</td>
                            <td className="px-2 py-1 text-stone-500">{t.meaning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-[10px] italic text-stone-400">{dev.confidence.methodology.disclaimer}</p>
                </div>
              </details>
            )}

            <div className="space-y-2">
              {dev.confidence.sections?.map((s: any) => {
                const barColor = s.confidence === "high" ? "bg-emerald-500" : s.confidence === "medium" ? "bg-amber-500" : s.confidence === "low" ? "bg-red-500" : "bg-stone-400";
                const badgeColor = s.confidence === "high" ? "bg-emerald-100 text-emerald-700" : s.confidence === "medium" ? "bg-amber-100 text-amber-700" : s.confidence === "low" ? "bg-red-100 text-red-700" : "bg-stone-200 text-stone-600";
                return (
                  <details key={s.section} className="group rounded-lg border border-stone-100 bg-white">
                    <summary className="cursor-pointer px-3 py-2.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-medium text-stone-700">{s.label}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${badgeColor}`}>{s.confidence}</span>
                            <span className="text-[11px] font-medium text-stone-500">{s.score}/100</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${s.score}%` }} />
                        </div>
                      </div>
                      <svg className="h-4 w-4 shrink-0 text-stone-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </summary>
                    <div className="border-t border-stone-100 px-3 pb-3 pt-2.5 space-y-3">
                      {s.dimensions && (
                        <div className="grid grid-cols-3 gap-2">
                          {(["completeness", "authority", "certainty"] as const).map((dim) => {
                            const d = s.dimensions[dim];
                            if (!d) return null;
                            const dimBarColor = d.score >= 85 ? "bg-emerald-400" : d.score >= 60 ? "bg-amber-400" : d.score >= 35 ? "bg-red-400" : "bg-stone-300";
                            return (
                              <div key={dim}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[10px] text-stone-500">{d.label}</span>
                                  <span className="text-[10px] font-medium text-stone-600">{d.score}</span>
                                </div>
                                <div className="h-1 w-full overflow-hidden rounded-full bg-stone-100">
                                  <div className={`h-full rounded-full ${dimBarColor}`} style={{ width: `${d.score}%` }} />
                                </div>
                                <p className="text-[9px] text-stone-400 mt-0.5">{d.weight}% weight</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {s.rationale && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-1">Rationale</p>
                          <p className="text-[11px] leading-relaxed text-stone-600">{s.rationale}</p>
                        </div>
                      )}
                      {s.sources?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-1">Data Sources</p>
                          <ul className="space-y-0.5">
                            {s.sources.map((src: any, si: number) => (
                              <li key={si} className="flex items-start gap-1.5 text-[11px]">
                                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                                <span className="text-stone-600">
                                  {src.url ? (
                                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline decoration-blue-300 hover:text-blue-700">{src.name}</a>
                                  ) : src.name}
                                  <span className="text-stone-400"> · {src.type}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {s.verification_steps?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-1">Verification Steps</p>
                          <ul className="space-y-1">
                            {s.verification_steps.map((v: any, vi: number) => {
                              const urgencyStyle = v.urgency === "must" ? "bg-red-100 text-red-700 border-red-200" : v.urgency === "should" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-stone-50 text-stone-600 border-stone-200";
                              const urgencyIcon = v.urgency === "must" ? "🔴" : v.urgency === "should" ? "🟡" : "🔵";
                              return (
                                <li key={vi} className={`rounded border px-2 py-1.5 text-[11px] leading-relaxed ${urgencyStyle}`}>
                                  <span className="mr-1" aria-hidden="true">{urgencyIcon}</span>{v.text}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      {s.gaps?.length > 0 && (
                        <div className="space-y-0.5">
                          {s.gaps.map((g: string, gi: number) => (
                            <p key={gi} className="text-[10px] text-amber-500"><span aria-hidden="true">⚠</span> {g}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>

            {dev.confidence.due_diligence?.length > 0 && (
              <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-bold text-stone-800">Due Diligence Checklist</p>
                  <div className="flex items-center gap-2 text-[10px]">
                    {dev.confidence.must_verify_count > 0 && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">{dev.confidence.must_verify_count} must verify</span>
                    )}
                    {dev.confidence.should_verify_count > 0 && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-700">{dev.confidence.should_verify_count} should verify</span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 mb-3">Complete these steps to validate the data in this report. Items are sorted by urgency.</p>
                <ul className="space-y-1.5">
                  {dev.confidence.due_diligence.map((d: any, di: number) => {
                    const urgencyBg = d.urgency === "must" ? "border-red-200 bg-red-50" : d.urgency === "should" ? "border-amber-200 bg-amber-50" : "border-stone-200 bg-white";
                    const urgencyIcon = d.urgency === "must" ? "🔴" : d.urgency === "should" ? "🟡" : "🔵";
                    return (
                      <li key={di} className={`flex items-start gap-2 rounded border px-3 py-2 ${urgencyBg}`}>
                        <span className="mt-0.5 shrink-0" aria-hidden="true">{urgencyIcon}</span>
                        <div className="min-w-0">
                          <p className="text-[11px] leading-relaxed text-stone-700">{d.text}</p>
                          <p className="text-[9px] font-medium uppercase tracking-wide text-stone-400 mt-0.5">{d.section}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  OLT / OMB DECISIONS                                          */}
      {/* ============================================================ */}
      {dev.olt_decisions && dev.olt_decisions.total_found > 0 && (() => {
        const olt = dev.olt_decisions;
        const outcomeBadge = (outcome: string) => {
          const map: Record<string, { bg: string; text: string }> = {
            allowed: { bg: "bg-emerald-100", text: "text-emerald-700" },
            allowed_in_part: { bg: "bg-lime-100", text: "text-lime-700" },
            dismissed: { bg: "bg-red-100", text: "text-red-700" },
            settled: { bg: "bg-blue-100", text: "text-blue-700" },
            withdrawn: { bg: "bg-stone-100", text: "text-stone-500" },
          };
          const s = map[outcome] || { bg: "bg-stone-100", text: "text-stone-500" };
          return `${s.bg} ${s.text}`;
        };
        return (
          <>
            <SectionHeading
              id="olt-decisions"
              title="OLT / OMB Decisions"
              icon={Icons.gavel}
              count={olt.total_found}
            />

            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
              {/* Summary */}
              <p className="text-[13px] leading-relaxed text-stone-600">{olt.summary_text}</p>

              {/* Stats row */}
              {(olt.approval_rate !== null && olt.approval_rate !== undefined) && (
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Appeal Success Rate</p>
                    <p className={`text-[18px] font-bold ${olt.approval_rate >= 50 ? "text-emerald-600" : "text-red-600"}`}>
                      {olt.approval_rate}%
                    </p>
                  </div>
                  {olt.outcomes && Object.entries(olt.outcomes).map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                        {k.replace(/_/g, " ")}
                      </p>
                      <p className="text-[18px] font-bold text-stone-800">{v as number}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent decisions list */}
              {olt.recent_decisions?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-stone-400">
                    Recent Decisions ({olt.recent_decisions.length})
                  </p>
                  {olt.recent_decisions.map((d: any, i: number) => (
                    <div key={i} className="rounded-lg border border-stone-100 bg-stone-50/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-stone-700">
                              {d.file_number}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${outcomeBadge(d.outcome)}`}>
                              {d.outcome?.replace(/_/g, " ")}
                            </span>
                            {d.decision_type && (
                              <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500">
                                {d.decision_type.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          {d.title && (
                            <p className="mt-1 text-[12px] leading-snug text-stone-600 line-clamp-2">
                              {d.title}
                            </p>
                          )}
                          {d.addresses?.length > 0 && (
                            <p className="mt-0.5 text-[11px] text-stone-400">
                              <span aria-hidden="true">📍</span> {d.addresses.slice(0, 3).join(", ")}
                              {d.addresses.length > 3 && ` +${d.addresses.length - 3} more`}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          {d.date && (
                            <p className="text-[11px] text-stone-400">{d.date}</p>
                          )}
                          {d.url && (
                            <a
                              href={d.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 inline-block text-[11px] font-medium text-blue-600 hover:underline"
                            >
                              CanLII →
                            </a>
                          )}
                        </div>
                      </div>
                      {d.summary && (
                        <p className="mt-2 text-[11px] leading-relaxed text-stone-500 line-clamp-3">
                          {d.summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* ============================================================ */}
      {/*  NOTES & DISCLAIMER                                           */}
      {/* ============================================================ */}
      {dev.notes?.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">Notes</p>
          <ul className="space-y-2">
            {dev.notes.map((note: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-stone-600">
                <span className="mt-0.5 text-amber-500" aria-hidden="true">⚠</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Disclaimer</p>
        <p className="mt-2 text-[12px] leading-relaxed text-stone-400">
          This analysis is for planning purposes only. Actual development rights depend on site-specific reviews, Committee of Adjustment decisions, and City approval. Consult a licensed planner for professional advice. Data sourced from the City of Toronto Open Data Portal (By-law 569-2013).
        </p>
      </div>

      {/* RAW JSON */}
      <details className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-5 py-3.5 text-[13px] font-medium text-stone-400 hover:text-stone-600">
          View raw JSON response
        </summary>
        <pre className="max-h-96 overflow-auto border-t border-stone-100 px-5 py-4 font-mono text-[11px] leading-relaxed text-stone-500">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
