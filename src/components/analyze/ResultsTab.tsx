"use client";

import { Award, AlertTriangle, TrendingUp, Zap, Check } from "lucide-react";

interface Props {
  result: Record<string, unknown>;
}

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-stone-50 py-2.5 last:border-0">
      <span className="shrink-0 text-[13px] text-stone-500">{label}</span>
      <div className="text-right">
        <span className="text-[13px] font-medium text-stone-900">{value}</span>
        {sub && <p className="text-[11px] text-stone-400">{sub}</p>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">{title}</p>
      {children}
    </div>
  );
}

function FlagList({ items, color }: { items: string[]; color: string }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((f, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px]">
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />
          {f}
        </li>
      ))}
    </ul>
  );
}

export default function ResultsTab({ result }: Props) {
  const r = result;

  const tier = String(r.pipeline_tier ?? "Tier 2");
  const tierColors: Record<string, string> = {
    Rejected: "bg-red-100 text-red-800 border-red-200",
    "Tier 3": "bg-amber-100 text-amber-800 border-amber-200",
    "Tier 2": "bg-sky-100 text-sky-800 border-sky-200",
    "Tier 1": "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  const TierIcon = tier === "Tier 1" ? Award : tier === "Rejected" ? AlertTriangle : TrendingUp;
  const confidence = (Number(r.confidence_score ?? 0.5) * 100).toFixed(0);

  const unitMix = (r.unit_mix as Record<string, number>) ?? {};
  const totalUnits = Object.values(unitMix).reduce((a, b) => a + (b || 0), 0);

  const reviewFlags = (r.review_flags as string[]) ?? [];
  const upsideFlags = (r.upside_flags as string[]) ?? [];

  const fmt = (n: unknown, decimals = 0) =>
    typeof n === "number" ? n.toLocaleString("en-CA", { maximumFractionDigits: decimals }) : "—";
  const fmtCad = (n: unknown) =>
    typeof n === "number" ? `$${n.toLocaleString("en-CA", { maximumFractionDigits: 0 })}` : "—";
  const fmtPct = (n: unknown) =>
    typeof n === "number" ? `${(n * 100).toFixed(1)}%` : "—";

  return (
    <div className="space-y-5">
      {/* Tier classification */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Development classification
            </p>
            <p className="mt-2 text-[13px] text-stone-600">
              {tier === "Rejected"
                ? "This property does not meet minimum feasibility criteria."
                : tier === "Tier 1"
                ? "Strong feasibility — straightforward development path."
                : tier === "Tier 2"
                ? "Moderate feasibility — manageable constraints."
                : "Feasible but significant challenges or variances required."}
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${tierColors[tier] ?? tierColors["Tier 2"]}`}>
            <TierIcon className="h-5 w-5 shrink-0" />
            <span className="font-bold">{tier}</span>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[12px] font-medium uppercase tracking-wide text-stone-400">Confidence</span>
            <span className="text-[13px] font-bold text-stone-900">{confidence}%</span>
          </div>
          <div className="h-2 rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Site + zoning */}
      <Section title="Site & Zoning">
        <StatRow label="Zone" value={String(r.zone_code ?? "—")} />
        <StatRow label="Lot area" value={`${fmt(r.lot_area_sqm)} sqm`} sub={`${fmt(r.lot_area_sqft)} sqft`} />
        <StatRow label="Frontage" value={`${fmt(r.lot_frontage_m, 1)} m`} />
        <StatRow label="Max GFA" value={`${fmt(r.max_gfa_sqm)} sqm`} />
        <StatRow label="Max units" value={String(r.max_units ?? "—")} />
        <StatRow
          label="Variance required"
          value={r.requires_variance ? "Yes" : "No"}
        />
      </Section>

      {/* Unit mix */}
      {totalUnits > 0 && (
        <Section title="Recommended unit mix">
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(unitMix).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-center">
                <p className="text-[11px] font-medium uppercase text-stone-400">
                  {k === "1bed" ? "1 Bed" : k === "2bed" ? "2 Bed" : k === "3bed" ? "3 Bed" : "Bach."}
                </p>
                <p className="mt-1 text-[20px] font-bold text-emerald-700">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-stone-500">Total: {totalUnits} units</p>
        </Section>
      )}

      {/* Unit economics */}
      <Section title="Unit Economics">
        <StatRow label="1-bed achievable rent" value={fmtCad(r.achievable_rent_1bed) + "/mo"} />
        <StatRow label="2-bed achievable rent" value={fmtCad(r.achievable_rent_2bed) + "/mo"} />
        <StatRow label="Income rent ceiling (30%)" value={fmtCad(r.income_rent_ceiling_monthly) + "/mo"} />
        <StatRow label="Vacancy rate" value={fmtPct(r.vacancy_rate)} sub={String(r.vacancy_signal ?? "")} />
        {!!r.dc_exemption_flag && (
          <StatRow label="DC exemption savings" value={fmtCad(r.dc_exemption_savings)} />
        )}
      </Section>

      {/* Demographics */}
      <Section title="Neighbourhood">
        <StatRow label="Ward" value={`${r.ward_name ?? "—"} (${r.ward_no ?? "—"})`} />
        <StatRow label="Median household income" value={fmtCad(r.median_HHI)} />
        <StatRow label="Renter tenure" value={fmtPct(r.renter_pct)} />
        <StatRow label="Walk / Transit / Bike" value={`${r.walk_score ?? "—"} / ${r.transit_score ?? "—"} / ${r.bike_score ?? "—"}`} />
        <StatRow label="Nearest school" value={`${r.nearest_school_distance_m ?? "—"}m`} sub={String(r.nearest_school_name ?? "")} />
      </Section>

      {/* Flags */}
      {(reviewFlags.length > 0 || upsideFlags.length > 0) && (
        <div className="grid gap-5 sm:grid-cols-2">
          {reviewFlags.length > 0 && (
            <Section title="Review flags">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px] text-amber-600 font-medium">{reviewFlags.length} item{reviewFlags.length > 1 ? "s" : ""}</span>
              </div>
              <FlagList items={reviewFlags} color="bg-amber-400" />
            </Section>
          )}
          {upsideFlags.length > 0 && (
            <Section title="Upside flags">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[11px] text-emerald-600 font-medium">{upsideFlags.length} item{upsideFlags.length > 1 ? "s" : ""}</span>
              </div>
              <FlagList items={upsideFlags} color="bg-emerald-400" />
            </Section>
          )}
        </div>
      )}

      {/* Risk */}
      <Section title="Risk assessment">
        <StatRow label="Renter tenure risk" value={r.renter_tenure_risk ? "High" : "Low"} />
        <StatRow label="Affordability" value={String(r.affordability_flag ?? "Pass")} />
        <StatRow label="Construction cost" value={`${fmtCad(r.construction_cost_per_sqm)}/sqm`} />
        <StatRow label="Political risk" value={String(r.political_risk_flag ?? "Unknown")} />
        <StatRow label="Permit activity (24mo)" value={String(r.permit_activity_score ?? "—")} sub={r.permit_count_multiplex_24mo ? `${r.permit_count_multiplex_24mo} permits` : undefined} />
      </Section>
    </div>
  );
}
