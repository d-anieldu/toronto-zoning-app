"use client";

import { FormEvent, useState } from "react";
import { MapPin, DollarSign, ArrowRight } from "lucide-react";

export default function InputTab({
  onSubmit,
  loading,
}: {
  onSubmit: (address: string, askingPrice: number) => void;
  loading: boolean;
}) {
  const [address, setAddress] = useState("");
  const [askingPrice, setAskingPrice] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const price = parseFloat(askingPrice.replace(/[^0-9.]/g, "")) || 0;
    onSubmit(address.trim(), price);
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
