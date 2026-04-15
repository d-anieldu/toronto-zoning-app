"use client";

import { useState, useCallback } from "react";
import { Presentation, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface DeckTabProps {
  result: Record<string, unknown>;
}

export default function DeckTab({ result }: DeckTabProps) {
  const [generating, setGenerating] = useState(false);

  const address = String(result.address_full ?? result.address ?? "");
  const askingPrice = Number(result.asking_price ?? 0);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    const toastId = toast.loading(
      "Generating investor deck — this may take 15–30 seconds…"
    );

    try {
      const res = await fetch("/api/generate-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          asking_price: askingPrice,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || err.error || `Error ${res.status}`);
      }

      const blob = await res.blob();
      const slug = address
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deck-${slug}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Investor deck downloaded", { id: toastId });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate deck",
        { id: toastId }
      );
    } finally {
      setGenerating(false);
    }
  }, [address, askingPrice]);

  const tier = String(result.pipeline_tier ?? result.feasibility_tier ?? "—");
  const score = Number(result.feasibility_score ?? 0);
  const units = String(result.max_units ?? result.total_units_proposed ?? "—");
  const zone = String(result.zone_code ?? "—");
  const strategy = String(result.dev_strategy ?? "Multiplex");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-[#0F172A]">
              Investor Deck
            </h2>
            <p className="mt-1 text-[13px] text-[#64748B]">
              Generate a 22-slide PPTX presentation from the pipeline data for{" "}
              <span className="font-medium text-[#1E293B]">{address}</span>.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0D9488] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0F766E] disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {generating ? "Generating…" : "Download PPTX"}
          </button>
        </div>
      </div>

      {/* Slide preview grid */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8] mb-4">
          Deck Contents — 22 Slides
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className="group relative rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 transition-colors hover:border-[#0D9488]/40 hover:bg-[#F0FDFA]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-[#0F172A] text-[9px] font-bold text-white">
                  {slide.num}
                </span>
                <span className="text-[11px] font-semibold text-[#0F172A] truncate">
                  {slide.title}
                </span>
              </div>
              <p className="text-[10px] leading-[14px] text-[#64748B]">
                {slide.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Data summary */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8] mb-4">
          Data Snapshot — From Pipeline
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Tier", value: tier },
            { label: "Score", value: `${score} / 100` },
            { label: "Max Units", value: units },
            { label: "Zone", value: zone },
            { label: "Strategy", value: strategy },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                {item.label}
              </p>
              <p className="mt-0.5 text-[15px] font-bold text-[#0F172A]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const SLIDES = [
  { num: "1", title: "Cover", desc: "Address, zone, tier badge, map placeholder" },
  { num: "2", title: "Investment Thesis", desc: "IRR, MOIC, yield on cost, narrative" },
  { num: "3", title: "Market Context", desc: "Vacancy rate, rent growth, policy" },
  { num: "4", title: "Site Snapshot", desc: "Lot area, GFA, units, feasibility" },
  { num: "5", title: "Zoning & Policy", desc: "Bylaw permits, constraint flags" },
  { num: "6", title: "Dev Strategy", desc: "Unit mix chart, revenue table" },
  { num: "7", title: "Neighbourhood", desc: "Demographics, liveability scores" },
  { num: "8", title: "Rental Market", desc: "CMHC vs achievable rent, vacancy" },
  { num: "9", title: "Pro-Forma Summary", desc: "Cost breakdown, returns, NOI" },
  { num: "10", title: "IRR Sensitivity", desc: "5×5 rent vs cost grid" },
  { num: "11", title: "Capital Stack", desc: "Senior/mezz/equity, waterfall" },
  { num: "12", title: "Risk Register", desc: "8-row risk matrix + mitigation" },
  { num: "13", title: "ML Score", desc: "Alpha score, SHAP drivers" },
  { num: "14", title: "Next Steps", desc: "Immediate / 30-day / due diligence" },
  { num: "A0", title: "Appendix Divider", desc: "Section break" },
  { num: "A1", title: "Assumptions", desc: "17-row model inputs audit" },
  { num: "A2", title: "Cashflow Curve", desc: "20-month S-curve" },
  { num: "A3", title: "Exit Scenarios", desc: "Bear / base / bull" },
  { num: "A4", title: "DC Breakdown", desc: "Unit-level development charges" },
  { num: "A5", title: "Permit Timeline", desc: "As-of-right vs variance path" },
  { num: "A6", title: "Comparable Sites", desc: "Ward comps table" },
  { num: "A7", title: "Data Sources", desc: "Pipeline audit trail" },
  { num: "A8", title: "Disclaimer", desc: "Legal + deal team" },
];
