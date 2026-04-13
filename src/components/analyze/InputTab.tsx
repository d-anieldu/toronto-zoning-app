"use client";

import { FormEvent, useState } from "react";
import { MapPin, DollarSign, ArrowRight, ChevronDown, ChevronRight, Settings2 } from "lucide-react";

export interface PipelineInputs {
  address: string;
  askingPrice: number;
  propertyType: string;
  bedroomsExisting: number;
  bathroomsExisting: number;
  constructionCostOverride: number;
  exitCapRateOverride: number;
  preferredUnits: number;
  timelineMonths: number;
}

export default function InputTab({
  onSubmit,
  loading,
}: {
  onSubmit: (address: string, askingPrice: number, extras?: Partial<PipelineInputs>) => void;
  loading: boolean;
}) {
  const [address, setAddress] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced fields
  const [propertyType, setPropertyType] = useState("");
  const [bedroomsExisting, setBedroomsExisting] = useState("");
  const [bathroomsExisting, setBathroomsExisting] = useState("");
  const [constructionCostOverride, setConstructionCostOverride] = useState("");
  const [exitCapRateOverride, setExitCapRateOverride] = useState("");
  const [preferredUnits, setPreferredUnits] = useState("");
  const [timelineMonths, setTimelineMonths] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const price = parseFloat(askingPrice.replace(/[^0-9.]/g, "")) || 0;
    const extras: Partial<PipelineInputs> = {};
    if (propertyType) extras.propertyType = propertyType;
    if (bedroomsExisting) extras.bedroomsExisting = parseInt(bedroomsExisting) || 0;
    if (bathroomsExisting) extras.bathroomsExisting = parseInt(bathroomsExisting) || 0;
    if (constructionCostOverride) extras.constructionCostOverride = parseFloat(constructionCostOverride.replace(/[^0-9.]/g, "")) || 0;
    if (exitCapRateOverride) extras.exitCapRateOverride = parseFloat(exitCapRateOverride) || 0;
    if (preferredUnits) extras.preferredUnits = parseInt(preferredUnits) || 0;
    if (timelineMonths) extras.timelineMonths = parseInt(timelineMonths) || 0;
    onSubmit(address.trim(), price, Object.keys(extras).length > 0 ? extras : undefined);
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-lg">
        <h2 className="text-[22px] font-bold tracking-tight text-[#0F172A] mb-2">
          Multiplex Development Analysis
        </h2>
        <p className="text-[14px] text-[#64748B] mb-8">
          Enter a Toronto address to run the full development pipeline — zoning
          screen, demographic enrichment, pro forma, and feasibility score.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Address */}
          <div>
            <label className="block text-[12px] font-medium text-[#64748B] mb-1.5 uppercase tracking-wide">
              Property address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 312 Runnymede Rd"
                required
                className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-4 text-[14px] placeholder-[#CBD5E1] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488]"
              />
            </div>
          </div>

          {/* Asking price (optional) */}
          <div>
            <label className="block text-[12px] font-medium text-[#64748B] mb-1.5 uppercase tracking-wide">
              Asking price{" "}
              <span className="normal-case font-normal text-[#94A3B8]">(optional)</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                placeholder="e.g. 1,200,000"
                className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-4 text-[14px] placeholder-[#CBD5E1] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488]"
              />
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#64748B] hover:text-[#0D9488] transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Advanced options
            {showAdvanced ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>

          {showAdvanced && (
            <div className="space-y-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">

              {/* Property type */}
              <div>
                <label className="block text-[11px] font-medium text-[#94A3B8] mb-1 uppercase tracking-wide">
                  Property type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full rounded-md border border-[#E2E8F0] bg-white py-2 px-3 text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40"
                >
                  <option value="">Auto-detect</option>
                  <option value="Detached">Detached</option>
                  <option value="Semi-Detached">Semi-Detached</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Duplex">Duplex</option>
                  <option value="Triplex">Triplex</option>
                  <option value="Vacant Land">Vacant Land</option>
                </select>
              </div>

              {/* Bedrooms / Bathrooms row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#94A3B8] mb-1 uppercase tracking-wide">
                    Existing bedrooms
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={bedroomsExisting}
                    onChange={(e) => setBedroomsExisting(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-md border border-[#E2E8F0] bg-white py-2 px-3 text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#94A3B8] mb-1 uppercase tracking-wide">
                    Existing bathrooms
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={bathroomsExisting}
                    onChange={(e) => setBathroomsExisting(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-md border border-[#E2E8F0] bg-white py-2 px-3 text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40"
                  />
                </div>
              </div>

              {/* Preferred units / Timeline row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#94A3B8] mb-1 uppercase tracking-wide">
                    Preferred unit count
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="12"
                    value={preferredUnits}
                    onChange={(e) => setPreferredUnits(e.target.value)}
                    placeholder="Auto"
                    className="w-full rounded-md border border-[#E2E8F0] bg-white py-2 px-3 text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#94A3B8] mb-1 uppercase tracking-wide">
                    Timeline (months)
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="60"
                    value={timelineMonths}
                    onChange={(e) => setTimelineMonths(e.target.value)}
                    placeholder="24"
                    className="w-full rounded-md border border-[#E2E8F0] bg-white py-2 px-3 text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40"
                  />
                </div>
              </div>

              {/* Construction cost / Cap rate row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#94A3B8] mb-1 uppercase tracking-wide">
                    Construction $/sqft
                  </label>
                  <input
                    type="text"
                    value={constructionCostOverride}
                    onChange={(e) => setConstructionCostOverride(e.target.value)}
                    placeholder="240 (default)"
                    className="w-full rounded-md border border-[#E2E8F0] bg-white py-2 px-3 text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#94A3B8] mb-1 uppercase tracking-wide">
                    Exit cap rate (%)
                  </label>
                  <input
                    type="text"
                    value={exitCapRateOverride}
                    onChange={(e) => setExitCapRateOverride(e.target.value)}
                    placeholder="4.0 (default)"
                    className="w-full rounded-md border border-[#E2E8F0] bg-white py-2 px-3 text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0D9488] py-3 text-[14px] font-semibold text-white transition hover:bg-[#0B8276] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Starting pipeline…
              </>
            ) : (
              <>
                Run analysis
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
