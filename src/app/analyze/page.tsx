"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import InputTab from "@/components/analyze/InputTab";
import ResultsTab from "@/components/analyze/ResultsTab";
import type { PipelineState, SourceCard } from "@/components/analyze/PipelineTab";
import UserNav from "@/components/UserNav";

const PipelineTab = dynamic(() => import("@/components/analyze/PipelineTab"), {
  ssr: false,
});

// ─── Running labels: show what comes NEXT after each source resolves ──────────

const NEXT_SOURCE_LABELS: Record<string, string> = {
  "Geocode + Ward":
    "Fetching torontozoning.com — zoning, envelope, feasibility...",
  "torontozoning.com API":
    "Fetching Statistics Canada — dissemination area spatial join...",
  "DA Spatial Join":
    "Fetching Ward Demographics — income, tenure, household data...",
  "Ward Demographics (Census 2021)":
    "Fetching CMHC — rental market data and vacancy rates...",
  "CMHC Rental Market":
    "Fetching Walk Score — walkability, transit, bike scores...",
  "Walk Score API":
    "Fetching Toronto Open Data — building permits + school proximity...",
  "Toronto Open Data: Permits":
    "Fetching Toronto Open Data — school proximity + family demand...",
  "Toronto Open Data: Schools":
    "Computing development charges and exemption eligibility...",
  "Development Charges":
    "Loading construction cost and cap rate data...",
  "Quarterly Assets": "Assembling pipeline result...",
};

type TabId = "input" | "pipeline" | "results";

// ─── Dark navy nav bar ────────────────────────────────────────────────────────

function NavBar() {
  return (
    <header className="bg-[#0F172A] px-6 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="flex items-baseline gap-0 text-[15px] font-bold tracking-tight"
        >
          <span className="text-white">toronto</span>
          <span className="text-[#0D9488]">zoning</span>
          <span className="text-white/60">.com</span>
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden sm:flex items-center gap-5 text-[13px]">
            <Link
              href="/dashboard"
              className="text-white/60 hover:text-white transition-colors"
            >
              Zoning lookup
            </Link>
            <span className="text-[#0D9488] font-semibold">Analyze</span>
          </nav>
          <UserNav />
        </div>
      </div>
    </header>
  );
}

// ─── Sub-tab bar (Input / Pipeline / Results) ─────────────────────────────────

function SubTabBar({
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
    { id: "input", label: "Input", enabled: true },
    { id: "pipeline", label: "Pipeline", enabled: pipelineEnabled },
    { id: "results", label: "Results", enabled: resultsEnabled },
  ];

  return (
    <div className="border-b border-[#E2E8F0] bg-white">
      <div className="mx-auto flex max-w-6xl">
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

  // Clean up SSE on unmount
  useEffect(() => {
    return () => {
      esRef.current?.close();
    };
  }, []);

  const startPipeline = useCallback(
    (address: string, askingPrice: number) => {
      // Close any existing stream
      esRef.current?.close();

      setLoading(true);
      setPipeline({
        status: "running",
        cards: [],
        currentStage: 1,
        runningText: "Geocoding address and resolving ward boundary...",
        result: null,
      });
      setActiveTab("pipeline");

      const url = new URL("/api/analyze/stream", window.location.origin);
      url.searchParams.set("address", address);
      if (askingPrice > 0)
        url.searchParams.set("asking_price", String(askingPrice));

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

        setPipeline((prev) => ({
          ...prev,
          cards: [...prev.cards, card],
          currentStage: data.stage,
          runningText:
            NEXT_SOURCE_LABELS[data.source_name] || "Resolving next source...",
        }));
      });

      es.addEventListener("pipeline_complete", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        es.close();
        esRef.current = null;
        setLoading(false);

        setPipeline((prev) => ({
          ...prev,
          status: "complete",
          currentStage: 6, // all 5 done
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
    },
    [],
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <NavBar />

      <SubTabBar
        active={activeTab}
        pipelineEnabled={pipeline.status !== "idle"}
        resultsEnabled={pipeline.status === "complete"}
        onChange={setActiveTab}
      />

      {/* Content area */}
      <div className="flex-1">
        {activeTab === "input" && (
          <div className="mx-auto max-w-6xl">
            <InputTab onSubmit={startPipeline} loading={loading} />
          </div>
        )}

        {activeTab === "pipeline" && (
          <div className="mx-auto max-w-6xl min-h-[600px]">
            <PipelineTab state={pipeline} />
          </div>
        )}

        {activeTab === "results" && pipeline.result && (
          <div className="mx-auto max-w-6xl p-4 sm:p-6">
            <div className="mb-5">
              <h1 className="text-[18px] font-bold text-[#0F172A]">
                {String(pipeline.result.address_full ?? "")}
              </h1>
              <p className="text-[13px] text-[#64748B] mt-0.5">
                Pipeline complete · {pipeline.cards.length} sources resolved
              </p>
            </div>
            <ResultsTab result={pipeline.result} />
          </div>
        )}

        {activeTab === "results" && !pipeline.result && (
          <div className="flex items-center justify-center py-20 text-[#94A3B8] text-[14px]">
            No results yet. Run a pipeline first.
          </div>
        )}
      </div>
    </div>
  );
}
