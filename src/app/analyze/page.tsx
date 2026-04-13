"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import InputTab from "@/components/analyze/InputTab";
import type { PipelineInputs } from "@/components/analyze/InputTab";
import ResultsTab from "@/components/analyze/ResultsTab";
import ProFormaTab from "@/components/analyze/ProFormaTab";
import type { PipelineState, SourceCard } from "@/components/analyze/PipelineTab";
import UserNav from "@/components/UserNav";

const PipelineTab = dynamic(() => import("@/components/analyze/PipelineTab"), {
  ssr: false,
});

// ─── Running labels: show what comes NEXT after each source resolves ──────────

const NEXT_SOURCE_LABELS: Record<string, string> = {
  // Stage 1
  "Geocode + Ward":
    "Fetching torontozoning.com — zoning, envelope, feasibility...",
  // Stage 2
  "torontozoning.com API":
    "Checking hard reject criteria — lot size, zone, feasibility...",
  "Hard Reject Gate":
    "Fetching Statistics Canada — dissemination area spatial join...",
  // Stage 3
  "DA Spatial Join":
    "Fetching Ward Demographics — income, tenure, household data...",
  "Ward Demographics (Census 2021)":
    "Fetching CMHC — rental market data and vacancy rates...",
  "CMHC Rental Market":
    "Fetching Walk Score — walkability, transit, bike scores...",
  "Walk Score API":
    "Fetching Toronto Open Data — building permits...",
  "Toronto Open Data: Permits":
    "Fetching Toronto Open Data — school proximity + family demand...",
  "Toronto Open Data: Schools":
    "Loading construction cost and cap rate data...",
  "Quarterly Assets":
    "Computing development charges and exemption eligibility...",
  "Development Charges":
    "Deriving optimal unit mix from demographic signals...",
  // Stage 4
  "Unit Mix Model":
    "Assessing parking requirements and costs...",
  "Parking Assessment":
    "Underwriting achievable rents and transit premium...",
  "Rent Underwriting":
    "Computing review flags — entitlement and market risks...",
  "Review Flags":
    "Identifying upside signals — cost savings and demand...",
  "Upside Signals":
    "Evaluating risk factors — tenure, affordability, political...",
  "Risk Assessment":
    "Computing financial metrics — land value, buildable cost...",
  "Financial Metrics":
    "Classifying pipeline tier and assembling result...",
  // Stage 5
  "Pipeline Tier Classification":
    "Computing land transfer tax and cost split...",
  "Land Transfer Tax":
    "Splitting construction costs — above/below grade...",
  "Construction Cost Split":
    "Fetching Bank of Canada prime rate...",
  "Bank of Canada Prime Rate":
    "Fetching StatsCan Building Cost Price Index...",
  "StatsCan Building Cost Index":
    "Computing CMHC MLI Select insurance premium...",
  "CMHC MLI Select Premium":
    "Computing Tarion warranty fees...",
  "Tarion Warranty Fees":
    "Computing sale price benchmarks...",
  "Sale Price Benchmarks":
    "Loading pro-forma industry defaults...",
  "Pro-Forma Defaults":
    "Assembling final pipeline result...",
  "Result Assembly": "Pipeline complete.",
};

type TabId = "input" | "pipeline" | "results" | "proforma";

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

// ─── Sub-tab bar (Input / Pipeline / Results / Pro-Forma) ─────────────────────

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
    { id: "proforma", label: "Pro-Forma", enabled: resultsEnabled },
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
    (address: string, askingPrice: number, extras?: Partial<PipelineInputs>) => {
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
      if (extras?.propertyType)
        url.searchParams.set("property_type", extras.propertyType);
      if (extras?.bedroomsExisting)
        url.searchParams.set("bedrooms", String(extras.bedroomsExisting));
      if (extras?.bathroomsExisting)
        url.searchParams.set("bathrooms", String(extras.bathroomsExisting));
      if (extras?.constructionCostOverride)
        url.searchParams.set("construction_cost", String(extras.constructionCostOverride));
      if (extras?.exitCapRateOverride)
        url.searchParams.set("exit_cap_rate", String(extras.exitCapRateOverride));
      if (extras?.preferredUnits)
        url.searchParams.set("preferred_units", String(extras.preferredUnits));
      if (extras?.timelineMonths)
        url.searchParams.set("timeline_months", String(extras.timelineMonths));

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
          fetch_method: string;
          source_url: string;
        };

        const card: SourceCard = {
          source_name: data.source_name,
          stage: data.stage,
          fields_returned: data.fields_returned,
          status: data.status as SourceCard["status"],
          fallback_used: data.fallback_used,
          latency_ms: data.latency_ms,
          values_preview: data.values_preview,
          fetch_method: data.fetch_method || "",
          source_url: data.source_url || "",
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

  // Handle user edits to data source values — update both card preview and result
  const handleEditValue = useCallback(
    (sourceName: string, fieldKey: string, newValue: string) => {
      setPipeline((prev) => ({
        ...prev,
        // Update the card's values_preview
        cards: prev.cards.map((c) =>
          c.source_name === sourceName
            ? { ...c, values_preview: { ...c.values_preview, [fieldKey]: newValue } }
            : c,
        ),
        // Also update the result if it exists (for the Results tab)
        result: prev.result ? { ...prev.result, [fieldKey]: newValue } : prev.result,
      }));
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
            <PipelineTab state={pipeline} onEditValue={handleEditValue} />
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

        {activeTab === "proforma" && pipeline.result && (
          <div className="mx-auto max-w-6xl p-4 sm:p-6">
            <div className="mb-5">
              <h1 className="text-[18px] font-bold text-[#0F172A]">
                Pro-Forma · {String(pipeline.result.address_full ?? "")}
              </h1>
              <p className="text-[13px] text-[#64748B] mt-0.5">
                Auto-populated from pipeline data + Toronto industry benchmarks
              </p>
            </div>
            <ProFormaTab result={pipeline.result} />
          </div>
        )}

        {activeTab === "proforma" && !pipeline.result && (
          <div className="flex items-center justify-center py-20 text-[#94A3B8] text-[14px]">
            No results yet. Run a pipeline first.
          </div>
        )}
      </div>
    </div>
  );
}
