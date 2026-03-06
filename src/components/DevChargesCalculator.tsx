"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * DevChargesCalculator — Interactive development charges estimator.
 *
 * Users enter a proposed unit mix and get a City DC + Education DC + GO Transit DC
 * breakdown via the /api/dev-charges proxy.
 */

import { useState } from "react";

interface DevChargesCalculatorProps {
  /** Pre-fill address context (shown as badge, not functional) */
  address?: string;
}

interface DcResult {
  city_dc: { items: any[]; subtotal: number };
  education_dc: { subtotal: number; rate_per_unit: number; residential_units: number };
  go_transit_dc: { subtotal: number; rate_per_unit: number; residential_units: number };
  exemptions_applied: any[];
  total_estimated: number;
  note: string;
}

function $(n: number) {
  return "$" + n.toLocaleString();
}

export default function DevChargesCalculator({ address }: DevChargesCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DcResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [unitsSingleSemi, setUnitsSingleSemi] = useState(0);
  const [unitsLowrise, setUnitsLowrise] = useState(0);
  const [unitsBachelor, setUnitsBachelor] = useState(0);
  const [units2Plus, setUnits2Plus] = useState(0);
  const [nrGfa, setNrGfa] = useState(0);
  const [secondarySuite, setSecondarySuite] = useState(false);
  const [rental, setRental] = useState(false);

  async function calculate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dev-charges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          units_single_semi: unitsSingleSemi,
          units_lowrise: unitsLowrise,
          units_bachelor: unitsBachelor,
          units_2plus: units2Plus,
          non_residential_gfa_sqm: nrGfa,
          includes_secondary_suite: secondarySuite,
          is_purpose_built_rental: rental,
        }),
      });
      if (!res.ok) throw new Error("Calculation failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Failed to calculate development charges. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const totalUnits = unitsSingleSemi + unitsLowrise + unitsBachelor + units2Plus;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-[13px] font-medium text-stone-700 shadow-sm hover:border-stone-300 hover:bg-stone-50 transition-colors w-full"
      >
        <span className="text-[18px]">🧮</span>
        <div className="text-left">
          <p className="font-semibold">Development Charges Calculator</p>
          <p className="text-[11px] text-stone-400">Estimate City DC, Education DC &amp; GO Transit DC for your unit mix</p>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[16px]">🧮</span>
          <p className="text-[14px] font-semibold text-stone-800">Development Charges Calculator</p>
        </div>
        <button onClick={() => setOpen(false)} className="text-[13px] text-stone-400 hover:text-stone-600">
          ✕
        </button>
      </div>

      <div className="p-5 space-y-5">
        {address && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">
              📍 {address}
            </span>
          </div>
        )}

        {/* Input grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberInput label="Single / Semi-Detached Units" value={unitsSingleSemi} onChange={setUnitsSingleSemi} />
          <NumberInput label="Low-Rise Multiples (Town/Row)" value={unitsLowrise} onChange={setUnitsLowrise} />
          <NumberInput label="Apartment — Bachelor / 1 BR" value={unitsBachelor} onChange={setUnitsBachelor} />
          <NumberInput label="Apartment — 2+ BR" value={units2Plus} onChange={setUnits2Plus} />
          <NumberInput label="Non-Residential GFA (m²)" value={nrGfa} onChange={setNrGfa} decimal />
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={secondarySuite}
              onChange={(e) => setSecondarySuite(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 accent-stone-900"
            />
            <span className="text-[13px] text-stone-700">Includes first additional residential unit (exempt from DC)</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={rental}
              onChange={(e) => setRental(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 accent-stone-900"
            />
            <span className="text-[13px] text-stone-700">Purpose-built rental (discount applies)</span>
          </label>
        </div>

        {/* Calculate button */}
        <button
          onClick={calculate}
          disabled={loading || (totalUnits === 0 && nrGfa === 0)}
          className="w-full rounded-xl bg-stone-900 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-40 transition-colors"
        >
          {loading ? "Calculating…" : `Calculate for ${totalUnits} unit${totalUnits !== 1 ? "s" : ""}${nrGfa > 0 ? ` + ${nrGfa}m² NR` : ""}`}
        </button>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-[12px] text-red-600">{error}</p>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 border-t border-stone-100 pt-4">
            {/* Grand total */}
            <div className="rounded-xl bg-stone-900 p-4 text-center">
              <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
                Estimated Total Development Charges
              </p>
              <p className="mt-1 text-[28px] font-bold text-white">{$(result.total_estimated)}</p>
            </div>

            {/* Breakdown */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">City DC</p>
                <p className="text-[18px] font-bold text-stone-800">{$(result.city_dc.subtotal)}</p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Education DC</p>
                <p className="text-[18px] font-bold text-stone-800">{$(result.education_dc.subtotal)}</p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">GO Transit DC</p>
                <p className="text-[18px] font-bold text-stone-800">{$(result.go_transit_dc.subtotal)}</p>
              </div>
            </div>

            {/* City DC line items */}
            {result.city_dc.items.length > 0 && (
              <div className="rounded-xl border border-stone-200 bg-white p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-stone-400 mb-3">
                  City DC Breakdown
                </p>
                <div className="space-y-2">
                  {result.city_dc.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[12px]">
                      <span className="text-stone-600">
                        {item.category}
                        <span className="ml-1 text-stone-400">
                          × {item.units || item.gfa_sqm?.toFixed(0) || 0}
                          {item.rate_per_unit ? ` @ ${$(item.rate_per_unit)}/unit` : ""}
                          {item.rate_per_sqm ? ` @ $${item.rate_per_sqm}/m²` : ""}
                        </span>
                      </span>
                      <span className="font-mono font-semibold text-stone-800">{$(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exemptions */}
            {result.exemptions_applied?.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[12px] font-semibold text-emerald-700 mb-2">Exemptions / Discounts Applied</p>
                {result.exemptions_applied.map((ex: any, i: number) => (
                  <div key={i} className="text-[12px] text-emerald-600">
                    ✅ {ex.label} {ex.impact && <span className="font-mono font-bold">{ex.impact}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Note */}
            <p className="text-[11px] text-stone-400 leading-relaxed">{result.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Number input helper ── */
function NumberInput({
  label,
  value,
  onChange,
  decimal = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  decimal?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-stone-500">{label}</label>
      <input
        type="number"
        min={0}
        step={decimal ? 0.01 : 1}
        value={value || ""}
        onChange={(e) => onChange(decimal ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
        placeholder="0"
        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-[13px] font-mono focus:border-stone-400 focus:outline-none"
      />
    </div>
  );
}
