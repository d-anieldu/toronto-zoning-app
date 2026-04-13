"use client";

import {
  DollarSign,
  Building2,
  HardHat,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Calculator,
  Clock,
  Banknote,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface Props {
  result: Record<string, unknown>;
}

/* ─── helpers ───────────────────────────────────────────────────────────────── */

const fmtCad = (n: unknown) =>
  typeof n === "number" ? `$${n.toLocaleString("en-CA", { maximumFractionDigits: 0 })}` : "—";
const fmtPct = (n: unknown) =>
  typeof n === "number" ? `${(n * 100).toFixed(2)}%` : "—";
const fmt = (n: unknown, d = 0) =>
  typeof n === "number" ? n.toLocaleString("en-CA", { maximumFractionDigits: d }) : "—";

/* ─── sub-components ────────────────────────────────────────────────────────── */

function StatRow({ label, value, sub, indent }: { label: string; value: string; sub?: string; indent?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 border-b border-stone-50 py-2 last:border-0 ${indent ? "pl-4" : ""}`}>
      <span className={`shrink-0 text-[13px] ${indent ? "text-stone-400" : "text-stone-500"}`}>{label}</span>
      <div className="text-right">
        <span className="text-[13px] font-medium text-stone-900">{value}</span>
        {sub && <p className="text-[11px] text-stone-400">{sub}</p>}
      </div>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-stone-200 pt-2.5 mt-1">
      <span className="text-[13px] font-semibold text-stone-700">{label}</span>
      <span className="text-[14px] font-bold text-stone-900">{value}</span>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 px-5 py-3.5 text-left hover:bg-stone-50 transition-colors"
      >
        <Icon className="h-4 w-4 text-stone-400 shrink-0" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400 flex-1">
          {title}
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-stone-300" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-stone-300" />
        )}
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

function SourceTag({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500">
      {text}
    </span>
  );
}

/* ─── main component ────────────────────────────────────────────────────────── */

export default function ProFormaTab({ result }: Props) {
  const pf = (result.proforma_inputs as Record<string, unknown>) ?? {};
  const parcel = (pf.parcel as Record<string, unknown>) ?? {};
  const revenue = (pf.revenue as Record<string, unknown>) ?? {};
  const landCosts = (pf.land_costs as Record<string, unknown>) ?? {};
  const ltt = (landCosts.land_transfer_tax as Record<string, unknown>) ?? {};
  const consulting = (pf.consulting_fees as Record<string, unknown>) ?? {};
  const consultingItems = (consulting.items as Record<string, Record<string, unknown>>) ?? {};
  const devCosts = (pf.development_costs as Record<string, Record<string, unknown>>) ?? {};
  const hard = (pf.construction_hard as Record<string, unknown>) ?? {};
  const opex = (pf.operating_expenses as Record<string, unknown>) ?? {};
  const fees = (pf.fees_contingency as Record<string, unknown>) ?? {};
  const debt = (pf.debt_structure as Record<string, unknown>) ?? {};
  const boc = (pf.boc_prime_rate as Record<string, unknown>) ?? {};
  const admin = (pf.admin as Record<string, unknown>) ?? {};
  const tarion = (pf.tarion as Record<string, unknown>) ?? {};
  const cmhcMli = (pf.cmhc_mli_premium as Record<string, unknown>) ?? {};
  const costEsc = (pf.cost_escalation as Record<string, unknown>) ?? {};
  const bcpi = (costEsc.bcpi as Record<string, unknown>) ?? {};
  const timeline = (pf.timeline as Record<string, unknown>) ?? {};
  const saleBenchmark = (revenue.sale_benchmark as Record<string, unknown>) ?? {};
  const unitMix = (parcel.unit_mix as Record<string, number>) ?? {};

  const totalProjectCost = pf.total_project_cost as number;
  const totalHard = pf.total_hard_costs as number;
  const totalSoft = pf.total_soft_costs as number;

  if (!totalProjectCost) {
    return (
      <div className="flex items-center justify-center py-20 text-[14px] text-stone-400">
        No pro-forma data available. Enter an asking price for full calculations.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── Summary banner ─── */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-3">
          Pro-Forma Summary
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[11px] text-stone-400 uppercase tracking-wide">Total Project Cost</p>
            <p className="text-[20px] font-bold tracking-tight text-stone-900">{fmtCad(totalProjectCost)}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-400 uppercase tracking-wide">Hard Costs</p>
            <p className="text-[20px] font-bold tracking-tight text-stone-900">{fmtCad(totalHard)}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-400 uppercase tracking-wide">Soft Costs</p>
            <p className="text-[20px] font-bold tracking-tight text-stone-900">{fmtCad(totalSoft)}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-400 uppercase tracking-wide">Equity Required</p>
            <p className="text-[20px] font-bold tracking-tight text-emerald-700">{fmtCad(debt.equity_required)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-3 border-t border-stone-100">
          <div>
            <p className="text-[11px] text-stone-400 uppercase tracking-wide">Gross Terminal Value</p>
            <p className="text-[16px] font-bold text-stone-900">{fmtCad(revenue.gross_terminal_value)}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-400 uppercase tracking-wide">NOI</p>
            <p className="text-[16px] font-bold text-stone-900">{fmtCad(revenue.noi)}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-400 uppercase tracking-wide">BoC Prime</p>
            <p className="text-[16px] font-bold text-stone-900">{fmtPct(boc.prime_rate_pct)}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-400 uppercase tracking-wide">All-in Rate</p>
            <p className="text-[16px] font-bold text-stone-900">{fmtPct(pf.construction_all_in_rate)}</p>
          </div>
        </div>
      </div>

      {/* ─── Parcel ─── */}
      <Section title="Parcel Details" icon={Building2}>
        <StatRow label="Total GFA" value={`${fmt(parcel.total_gfa_sqft)} sqft`} />
        <StatRow label="Above-grade GCA" value={`${fmt(parcel.above_grade_gca_sqft)} sqft`} />
        <StatRow label="Below-grade GCA" value={`${fmt(parcel.below_grade_gca_sqft)} sqft`} />
        <StatRow label="Efficiency ratio" value={fmtPct(parcel.efficiency_ratio)} />
        <StatRow label="Net sellable" value={`${fmt(parcel.net_sellable_sqft)} sqft`} />
        <StatRow label="Total units" value={String(parcel.total_units ?? "—")} />
        {Object.entries(unitMix).length > 0 && (
          <div className="mt-2 flex gap-2">
            {Object.entries(unitMix).map(([k, v]) => (
              <span
                key={k}
                className="rounded-md bg-stone-100 px-2.5 py-1 text-[12px] font-medium text-stone-600"
              >
                {k === "1bed" ? "1-Bed" : k === "2bed" ? "2-Bed" : k === "3bed" ? "3-Bed" : "Bach."}: {v}
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* ─── Revenue ─── */}
      <Section title="Revenue & Valuation" icon={TrendingUp}>
        <StatRow label="Gross annual rental income" value={fmtCad(revenue.gross_annual_rental_income)} />
        <StatRow label="NOI" value={fmtCad(revenue.noi)} />
        <StatRow label="Gross terminal value" value={fmtCad(revenue.gross_terminal_value)} />
        <StatRow label="GTV per unit" value={fmtCad(revenue.gross_terminal_value_per_unit)} />
        <StatRow label="GTV per sqft" value={`${fmtCad(revenue.gross_terminal_value_per_sqft)}/sqft`} />
        <StatRow label="Sale fees" value={fmtPct(revenue.sale_fees_pct)} />
        <StatRow label="Market rent growth" value={fmtPct(revenue.market_rent_growth_pct)} />
        {typeof saleBenchmark.adjusted_psf === "number" && (
          <>
            <div className="mt-2 mb-1">
              <SourceTag text={String(saleBenchmark.source ?? "Benchmark")} />
            </div>
            <StatRow label="Benchmark $/PSF" value={fmtCad(saleBenchmark.adjusted_psf)} indent sub={`Zone: ${saleBenchmark.zone_family ?? "—"} · Ward adj: ${fmt(saleBenchmark.ward_adjustment, 2)}x`} />
          </>
        )}
      </Section>

      {/* ─── Land Costs ─── */}
      <Section title="Land Costs (Section B)" icon={Landmark}>
        <StatRow label="Purchase price" value={fmtCad(landCosts.purchase_price)} />
        <StatRow label="Ontario LTT" value={fmtCad(ltt.ontario_ltt)} indent />
        <StatRow label="Toronto Municipal LTT" value={fmtCad(ltt.toronto_municipal_ltt)} indent />
        <StatRow label="Total LTT" value={fmtCad(ltt.total_ltt)} />
        <StatRow label="Land legal fees" value={fmtCad(landCosts.land_legal_fees)} />
        <StatRow label="Property tax (annual)" value={fmtCad(landCosts.property_tax_annual)} />
        <TotalRow label="Total land costs" value={fmtCad(landCosts.total)} />
      </Section>

      {/* ─── Consulting ─── */}
      <Section title="Consulting Fees (Section C1)" icon={FileText} defaultOpen={false}>
        {Object.entries(consultingItems).map(([code, item]) => {
          const amt = item.amount as number;
          if (amt === 0) return null;
          return (
            <StatRow
              key={code}
              label={`${code} · ${String(item.label ?? "")}`}
              value={fmtCad(amt)}
              indent
            />
          );
        })}
        <TotalRow label="Total consulting" value={fmtCad(consulting.total)} />
      </Section>

      {/* ─── Development Costs ─── */}
      <Section title="Development Costs (Section C2)" icon={Calculator}>
        {Object.entries(devCosts).map(([code, item]) => {
          if (typeof item !== "object" || item === null) return null;
          return (
            <StatRow
              key={code}
              label={`${code} · ${String(item.label ?? "")}`}
              value={fmtCad(item.amount as number)}
              indent
            />
          );
        })}
        <TotalRow label="Total dev costs" value={fmtCad(pf.development_costs_total)} />
      </Section>

      {/* ─── Construction Hard Costs ─── */}
      <Section title="Construction Hard Costs (Section D)" icon={HardHat}>
        <StatRow label="Above-grade" value={fmtCad(hard.above_grade_cost)} sub={`${fmt(hard.above_grade_sqft)} sqft`} />
        <StatRow label="Below-grade" value={fmtCad(hard.below_grade_cost)} sub={`${fmt(hard.below_grade_sqft)} sqft`} />
        <StatRow label="Landscaping" value={fmtCad(hard.landscaping)} indent />
        <StatRow label="Site servicing" value={fmtCad(hard.site_servicing)} indent />
        <StatRow label="Builder's risk insurance" value={fmtCad(hard.builders_risk_insurance)} indent />
        <StatRow label="Demolition" value={fmtCad(hard.demolition_cost)} indent />
        <TotalRow label="Total hard costs" value={fmtCad(hard.hard_cost_total)} />
        {typeof costEsc.hard_cost_escalation_pct === "number" && (
          <div className="mt-2">
            <SourceTag text={String(bcpi.source ?? "StatsCan BCPI")} />
            <StatRow label="Cost escalation (BCPI YoY)" value={fmtPct(costEsc.hard_cost_escalation_pct)} indent />
          </div>
        )}
      </Section>

      {/* ─── OpEx ─── */}
      <Section title="Operating Expenses" icon={DollarSign} defaultOpen={false}>
        <StatRow label="Property taxes" value={fmtCad(opex.property_taxes)} indent />
        <StatRow label="Insurance" value={fmtCad(opex.insurance)} indent />
        <StatRow label="CAM" value={fmtCad(opex.cam)} indent />
        <StatRow label="Utilities" value={fmtCad(opex.utilities)} indent />
        <StatRow label="Property management" value={fmtCad(opex.property_management)} indent />
        <StatRow label="Repairs & maintenance" value={fmtCad(opex.repairs_maintenance)} indent />
        <StatRow label="Admin" value={fmtCad(opex.admin)} indent />
        <StatRow label="Reserve funds" value={fmtCad(opex.reserve_funds)} indent />
        <StatRow label="Capital expenses" value={fmtCad(opex.capital_expenses)} indent />
        <TotalRow label="Total OpEx" value={fmtCad(opex.total_opex)} />
      </Section>

      {/* ─── Fees & Contingency ─── */}
      <Section title="Fees & Contingency (Section F)" icon={Calculator} defaultOpen={false}>
        <StatRow label="Acquisition fee" value={fmtCad(fees.acquisition_fee)} indent />
        <StatRow label="Director's fee" value={fmtCad(fees.directors_fee)} indent />
        <StatRow label="Construction mgmt fee" value={fmtCad(fees.construction_management_fee)} indent />
        <StatRow label="Contingency — hard" value={fmtCad(fees.contingency_hard)} indent />
        <StatRow label="Contingency — soft" value={fmtCad(fees.contingency_soft)} indent />
      </Section>

      {/* ─── Debt Structure ─── */}
      <Section title="Debt & Financing (Section G)" icon={Banknote}>
        <div className="mb-1">
          <SourceTag text={String(boc.source ?? "BoC Valet API")} />
          {typeof boc.observation_date === "string" && boc.observation_date && (
            <span className="ml-2 text-[10px] text-stone-400">
              as of {boc.observation_date}
            </span>
          )}
        </div>
        <StatRow label="BoC prime rate" value={fmtPct(boc.prime_rate_pct)} />
        <StatRow label="Construction all-in rate" value={fmtPct(pf.construction_all_in_rate)} />
        <StatRow label="Construction loan" value={fmtCad(debt.construction_loan_amount)} sub={`${fmtPct(debt.construction_ltc_pct)} LTC`} />
        <StatRow label="Spread over prime" value={`${fmt(debt.construction_spread_bps)}bps`} indent />
        <StatRow label="Mezzanine loan" value={fmtCad(debt.mezzanine_loan_amount)} sub={`${fmtPct(debt.mezzanine_rate_pct)} rate`} />
        <StatRow label="Lender legal fees" value={fmtCad(debt.lender_legal_fees)} indent />
        <StatRow label="Broker fee" value={fmtCad(debt.broker_fee)} indent />
        <StatRow label="Appraisal" value={fmtCad(debt.appraisal_fee)} indent />
        <TotalRow label="Equity required" value={fmtCad(debt.equity_required)} />

        {/* CMHC MLI Select */}
        {typeof cmhcMli.premium_amount === "number" && cmhcMli.premium_amount > 0 && (
          <div className="mt-3 pt-2 border-t border-stone-100">
            <SourceTag text="CMHC MLI Select" />
            <StatRow label="LTV band" value={String(cmhcMli.ltv_band ?? "—")} />
            <StatRow label="Premium rate" value={fmtPct(cmhcMli.effective_rate_pct)} indent />
            <StatRow label="Premium amount" value={fmtCad(cmhcMli.premium_amount)} />
          </div>
        )}
      </Section>

      {/* ─── Admin & Tarion ─── */}
      <Section title="Admin & Warranty" icon={ShieldCheck} defaultOpen={false}>
        <StatRow label="Accounting / auditing" value={fmtCad(admin.accounting_auditing)} indent />
        <StatRow label="Legal (general)" value={fmtCad(admin.legal_general)} indent />
        <StatRow label="Property insurance" value={fmtCad(admin.property_insurance)} indent />
        {typeof tarion.total_tarion_fees === "number" && (
          <>
            <div className="mt-2 mb-1">
              <SourceTag text={String(tarion.source ?? "Tarion")} />
            </div>
            <StatRow label="Tarion enrolment" value={fmtCad(tarion.enrolment_total)} sub={`${fmtCad(tarion.enrolment_fee_per_unit)}/unit × ${tarion.total_units}`} indent />
            {typeof tarion.registration_total === "number" && tarion.registration_total > 0 && (
              <StatRow label="Tarion registration" value={fmtCad(tarion.registration_total)} indent />
            )}
            <TotalRow label="Total Tarion" value={fmtCad(tarion.total_tarion_fees)} />
          </>
        )}
      </Section>

      {/* ─── Timeline ─── */}
      <Section title="Timeline" icon={Clock} defaultOpen={false}>
        <StatRow label="Pre-development" value={`${timeline.pre_development_months ?? "—"} months`} />
        <StatRow label="Construction" value={`${timeline.construction_months ?? "—"} months`} />
        <StatRow label="Total project" value={`${timeline.total_project_months ?? "—"} months`} />
      </Section>
    </div>
  );
}
