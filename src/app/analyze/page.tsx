"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import InputTab from "@/components/analyze/InputTab";
import ResultsTab from "@/components/analyze/ResultsTab";
import type { PipelineState, SourceCard } from "@/components/analyze/PipelineTab";

const PipelineTab = dynamic(() => import("@/components/analyze/PipelineTab"), { ssr: false });

// ─── Stage mapping ────────────────────────────────────────────────────────────

const RUNNING_LABELS: Record<string, string> = {
  "Geocode + Ward":                   "Geocoding address and resolving ward boundary...",
  "torontozoning.com API":            "Fetching torontozoning.com — zoning, envelope, feasibility...",
  "DA Spatial Join":                  "Fetching Statistics Canada — dissemination area spatial join...",
  "Ward Demographics (Census 2021)":  "Fetching Ward Demographics — income, tenure, household data...",
  "CMHC Rental Market":               "Fetching CMHC — rental market data and vacancy rates...",
  "Walk Score API":                   "Fetching Walk Score — walkability, transit, bike scores...",
  "Toronto Open Data: Permits":       "Fetching Toronto Open Data — building permits + multiplex activity...",
  "Toronto Open Data: Schools":       "Fetching Toronto Open Data — school proximity + family demand...",
  "Development Charges":              "Computing development charges and exemption eligibility...",
  "Quarterly Assets":                 "Loading construction cost and cap rate data...",
  "Pro Forma Engine":                 "Running pro forma — unit mix, rents, feasibility score...",
};

type TabId = "input" | "pipeline" | "results";

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({
  active,
  pipelineEnabled,
  resultsEnabled,
  onChange,
}: {
  active: TabId;
  pipelineEnabled: boolean;
  resultsEnabled: boolean;
  onChange: (t: TabId) => void;
}) {
  const tabs: { id: TabId; label: string; enabled: boolean }[] = [
    { id: "input",    label: "Input",    enabled: true },
    { id: "pipeline", label: "Pipeline", enabled: pipelineEnabled },
    { id: "results",  label: "Results",  enabled: resultsEnabled },
  ];

  return (
    <div className="border-b border-[#E2E8F0] bg-white">
      <div className="flex">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={!t.enabled}
            onClick={() => t.enabled && onChange(t.id)}
            className={`px-5 py-[10px] text-[13px] font-medium transition-colors relative ${
              active === t.id
                ? "text-[#0D9488]"
                : t.enabled
                ? "text-[#94A3B8] hover:text-[#64748B]"
                : "text-[#CBD5E1] cursor-not-allowed"
            }`}
          >
            {t.label}
            {active === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0D9488]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyzePage() {
  const [activeTab, setActiveTab] = useState<TabId>("input");
  const [loading, setLoading] = useState(false);
  const [pipeline, setPipeline] = useState<PipelineState>({
    status: "idle",
    cards: [],
    currentStage: 1,
    runningText: "",
    result: null,
  });

  const esRef = useRef<EventSource | null>(null);

  const startPipeline = useCallback((address: string, askingPrice: number) => {
    // Close any existing stream
    esRef.current?.close();

    setLoading(true);
    setPipeline({ status: "running", cards: [], currentStage: 1, runningText: "Starting pipeline...", result: null });
    setActiveTab("pipeline");

    const url = new URL("/api/analyze/stream", window.location.origin);
    url.searchParams.set("address", address);
    if (askingPrice > 0) url.searchParams.set("asking_price", String(askingPrice));

    const es = new EventSource(url.toString());
    esRef.current = es;

    es.addEventListener("source_resolved", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as {
        source_name: string;
        stage: number;
        fields_returned: string[];
        status: string;
        fallback_used: boolean;
        latency_ms: number;
        values_preview: Record<string, string>;
      };

      const card: SourceCard = {
        source_name: data.source_name,
        stage: data.stage,
        fields_returned: data.fields_returned,
        status: data.status as SourceCard["status"],
        fallback_used: data.fallback_used,
        latency_ms: data.latency_ms,
        values_preview: data.values_preview,
      };

      setPipeline((prev) => {
        // Figure out next stage (one ahead of what just resolved)
        const nextStage = Math.min(data.stage + 1, 5);
        const nextText = RUNNING_LABELS[data.source_name] || `Resolving ${data.source_name}...`;

        return {
          ...prev,
          cards: [...prev.cards, card],
          currentStage: nextStage,
          runningText: nextText,
        };
      });
    });

    es.addEventListener("pipeline_complete", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      es.close();
      esRef.current = null;
      setLoading(false);

      setPipeline((prev) => ({
        ...prev,
        status: "complete",
        currentStage: 5,
        runningText: "",
        result: data,
      }));

      // Auto-advance to Results after 800ms
      setTimeout(() => setActiveTab("results"), 800);
    });

    es.addEventListener("pipeline_error", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      console.error("Pipeline error:", data.error);
      es.close();
      esRef.current = null;
      setLoading(false);
      setPipeline((prev) => ({ ...prev, status: "error" }));
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setLoading(false);
      setPipeline((prev) => ({ ...prev, status: "error" }));
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header bar */}
      <header className="border-b border-[#E2E8F0] bg-white px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <a href="/" className="text-[13px] font-semibold text-stone-900">
            torontozoning.com
          </a>
          <nav className="flex items-center gap-5 text-[13px] text-stone-500">
            <a href="/" className="hover:text-stone-900">Zoning lookup</a>
            <span className="font-semibold text-[#0D9488]">Analyze</span>
            <a href="/docs" className="hover:text-stone-900">Docs</a>
          </nav>
        </div>
      </header>

      {/* Tab bar */}
      <div className="mx-auto max-w-5xl">
        <TabBar
          active={activeTab}
          pipelineEnabled={pipeline.status !== "idle"}
          resultsEnabled={pipeline.status === "complete"}
          onChange={setActiveTab}
        />
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl">
        {activeTab === "input" && (
          <InputTab onSubmit={startPipeline} loading={loading} />
        )}

        {activeTab === "pipeline" && (
          <div className="relative overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-[#E2E8F0] bg-white min-h-[500px]">
            <PipelineTab state={pipeline} />
          </div>
        )}

        {activeTab === "results" && pipeline.result && (
          <div className="p-4 sm:p-6">
            <div className="mb-5">
              <h1 className="text-[18px] font-bold text-stone-900">
                {String(pipeline.result.address_full ?? "")}
              </h1>
              <p className="text-[13px] text-stone-500 mt-0.5">
                Pipeline complete · {(pipeline.cards.length)} sources resolved
              </p>
            </div>
            <ResultsTab result={pipeline.result} />
          </div>
        )}

        {activeTab === "results" && !pipeline.result && (
          <div className="flex items-center justify-center py-20 text-stone-400 text-[14px]">
            No results yet. Run a pipeline first.
          </div>
        )}
      </main>
    </div>
  );
}
