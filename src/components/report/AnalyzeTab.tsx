"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * AnalyzeTab — Multiplex development pipeline analysis
 * 
 * Displays tier classification, unit mix, risk/review/upside flags,
 * market signals, and financial indicators from enrich_site.py pipeline.
 */

import { AlertTriangle, TrendingUp, Award, Zap, Percent, DollarSign, Home, Users } from "lucide-react";
import { Card, Row, Badge, SectionHeading } from "./primitives";

interface Props {
  data: Record<string, any>;
  editMode?: boolean;
  userEdits?: Record<string, any>;
  sectionNotes?: Record<string, any>;
  onEditNote?: (sectionId: string, note: string) => void;
  reportId?: string;
}

export default function AnalyzeTab({
  data,
  editMode,
  userEdits,
  sectionNotes,
  onEditNote,
  reportId,
}: Props) {
  // Extract pipeline fields from data
  const tier = data.pipeline_tier || "Tier 2";
  const confidenceScore = data.confidence_score || 0.5;
  const rejectReasons = Array.isArray(data.reject_reasons) ? data.reject_reasons : [];
  const reviewFlags = Array.isArray(data.review_flags) ? data.review_flags : [];
  const upsideFlags = Array.isArray(data.upside_flags) ? data.upside_flags : [];

  // Unit economics
  const unitMix = data.unit_mix || { bachelor: 0, "1bed": 0, "2bed": 0, "3bed": 0 };
  const totalUnits = Object.values(unitMix).reduce((a: number, b: any) => a + (b || 0), 0);
  const avgRent1bed = data.achievable_rent_1bed || 0;
  const avgRent2bed = data.achievable_rent_2bed || 0;
  const incomeRentCeiling = data.income_rent_ceiling_monthly || 0;

  // Risk indicators
  const renterTenureRisk = data.renter_tenure_risk || false;
  const affordabilityFlag = data.affordability_flag || "Pass";
  const constructionCostCeiling = data.construction_cost_ceiling_flag || false;
  const politicalRisk = data.political_risk_flag || "Unknown";

  // Market signals
  const vacancyRate = data.vacancy_rate || 0.02;
  const permitActivity = data.permit_activity_score || "Low";
  const schoolDistance = data.nearest_school_distance_m || 999;
  const schoolDemand = data.school_family_demand_signal || false;
  const dcExempt = data.dc_exemption_flag || false;

  // Financial
  const dcSavings = data.dc_exemption_savings || 0;
  const constructionCost = data.construction_cost_per_sqm || 2583;

  const tierColors: Record<string, string> = {
    Rejected: "bg-red-100 text-red-800 border-red-200",
    "Tier 3": "bg-amber-100 text-amber-800 border-amber-200",
    "Tier 2": "bg-sky-100 text-sky-800 border-sky-200",
    "Tier 1": "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  const tierBgClass = tierColors[tier] || tierColors["Tier 2"];
  const tierIcon = tier === "Tier 1" ? Award : tier === "Rejected" ? AlertTriangle : TrendingUp;
  const TierIcon = tierIcon;

  return (
    <div className="space-y-5">
      {/* ════════════════════════════════════════════════════════ */}
      {/* PIPELINE TIER CLASSIFICATION                             */}
      {/* ════════════════════════════════════════════════════════ */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <SectionHeading>Development Classification</SectionHeading>
            <p className="mt-2 text-[13px] text-stone-600">
              {tier === "Rejected"
                ? "This property does not meet minimum feasibility criteria."
                : tier === "Tier 1"
                  ? "Strong feasibility with straightforward development path."
                  : tier === "Tier 2"
                    ? "Moderate feasibility with manageable constraints."
                    : "Feasible but with significant challenges or variances required."}
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${tierBgClass}`}>
            <TierIcon className="h-5 w-5 shrink-0" />
            <span className="font-bold">{tier}</span>
          </div>
        </div>

        {/* Confidence score */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-stone-500 uppercase tracking-wide">Confidence</span>
            <span className="text-[14px] font-bold text-stone-900">{Math.round(confidenceScore * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-200"
              style={{ width: `${confidenceScore * 100}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Reject reasons */}
        {rejectReasons.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-[11px] font-semibold uppercase text-red-700">Reject Reasons</p>
            <ul className="mt-2 space-y-1">
              {rejectReasons.map((reason: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-red-700">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* ════════════════════════════════════════════════════════ */}
      {/* UNIT MIX RECOMMENDATION                                  */}
      {/* ════════════════════════════════════════════════════════ */}
      {totalUnits > 0 && (
        <Card>
          <SectionHeading>Unit Mix Recommendation</SectionHeading>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {Object.entries(unitMix).map(([bedType, count]) => {
              const labels: Record<string, string> = {
                bachelor: "Bachelor",
                "1bed": "1 Bed",
                "2bed": "2 Bed",
                "3bed": "3 Bed",
              };
              return (
                <div key={bedType} className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-center">
                  <p className="text-[11px] font-medium text-stone-500 uppercase">{labels[bedType]}</p>
                  <p className="mt-2 text-[20px] font-bold text-emerald-700">{count}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[12px] text-stone-600">
            <strong>Total Units:</strong> {totalUnits}
          </p>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* FLAGS & SIGNALS                                          */}
      {/* ════════════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Review Flags */}
        {reviewFlags.length > 0 && (
          <Card>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <SectionHeading>Review Flags</SectionHeading>
            </div>
            <ul className="mt-3 space-y-2">
              {reviewFlags.map((flag: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-stone-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Upside Flags */}
        {upsideFlags.length > 0 && (
          <Card>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <SectionHeading>Upside Flags</SectionHeading>
            </div>
            <ul className="mt-3 space-y-2">
              {upsideFlags.map((flag: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-stone-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* UNIT ECONOMICS                                           */}
      {/* ════════════════════════════════════════════════════════ */}
      <Card>
        <SectionHeading>Unit Economics</SectionHeading>
        <div className="mt-4 space-y-3">
          <Row
            label="Achievable Rent — 1 Bed"
            value={`$${avgRent1bed.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo`}
            variant={avgRent1bed > incomeRentCeiling * 1.1 ? "warning" : "default"}
          />
          <Row
            label="Achievable Rent — 2 Bed"
            value={`$${avgRent2bed.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo`}
          />
          <Row
            label="Income Rent Ceiling (30% rule)"
            value={`$${incomeRentCeiling.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo`}
          />
          {dcExempt && (
            <Row
              label="Development Charges Exemption"
              badge={<Badge variant="success">Exempt</Badge>}
              value={`Saves $${dcSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
          )}
        </div>
      </Card>

      {/* ════════════════════════════════════════════════════════ */}
      {/* MARKET SIGNALS                                           */}
      {/* ════════════════════════════════════════════════════════ */}
      <Card>
        <SectionHeading>Market Signals</SectionHeading>
        <div className="mt-4 space-y-3">
          <Row
            label="Rental Vacancy Rate"
            value={`${(vacancyRate * 100).toFixed(1)}%`}
            detail={vacancyRate < 0.015 ? "Tight market" : vacancyRate <= 0.035 ? "Balanced" : "Soft market"}
            variant={vacancyRate > 0.035 ? "warning" : vacancyRate < 0.015 ? "success" : "default"}
          />
          <Row
            label="Permit Activity (24mo)"
            value={permitActivity}
            detail={data.permit_count_multiplex_24mo ? `${data.permit_count_multiplex_24mo} permits` : ""}
            variant={permitActivity === "High" ? "warning" : "default"}
          />
          <Row
            label="Nearest School"
            value={`${schoolDistance}m`}
            detail={schoolDemand ? "Strong family demand signal" : ""}
            variant={schoolDistance < 400 ? "success" : "default"}
          />
        </div>
      </Card>

      {/* ════════════════════════════════════════════════════════ */}
      {/* RISK ASSESSMENT                                          */}
      {/* ════════════════════════════════════════════════════════ */}
      <Card>
        <SectionHeading>Risk Assessment</SectionHeading>
        <div className="mt-4 space-y-3">
          <Row
            label="Renter Tenure Risk"
            badge={
              renterTenureRisk ? (
                <Badge variant="danger">High</Badge>
              ) : (
                <Badge variant="success">Low</Badge>
              )
            }
            detail={renterTenureRisk ? "High renter % + low mover rate" : ""}
          />
          <Row
            label="Affordability"
            badge={
              affordabilityFlag === "Fail" ? (
                <Badge variant="danger">Fail</Badge>
              ) : affordabilityFlag === "Caution" ? (
                <Badge variant="warning">Caution</Badge>
              ) : (
                <Badge variant="success">Pass</Badge>
              )
            }
            detail={affordabilityFlag === "Fail" ? "Rent exceeds 30% rule ceiling" : ""}
          />
          <Row
            label="Construction Cost"
            value={`$${constructionCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}/sqm`}
            variant={constructionCostCeiling ? "warning" : "default"}
            detail={constructionCostCeiling ? "Above $3,000/sqm" : ""}
          />
          <Row
            label="Political Risk"
            value={politicalRisk}
            variant={politicalRisk === "High" ? "warning" : "default"}
          />
        </div>
      </Card>
    </div>
  );
}
