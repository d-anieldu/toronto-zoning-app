"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SourceCard {
  source_name: string;
  stage: number;
  fields_returned: string[];
  status: "live" | "cached" | "fallback" | "failed";
  fallback_used: boolean;
  latency_ms: number;
  values_preview: Record<string, string>;
}

export interface PipelineState {
  status: "idle" | "running" | "complete" | "error";
  cards: SourceCard[];
  currentStage: number;
  runningText: string;
  result: Record<string, unknown> | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = [
  "Site ingest",
  "Zoning screen",
  "Demographic enrichment",
  "Pro forma",
  "Deck generation",
];

const SOURCE_BADGES: Record<string, { text: string; bg: string; color: string }> = {
  "Geocode + Ward":              { text: "TZ", bg: "#E1F5EE", color: "#0F6E56" },
  "torontozoning.com API":       { text: "TZ", bg: "#E1F5EE", color: "#0F6E56" },
  "DA Spatial Join":             { text: "SC", bg: "#E6F1FB", color: "#0C447C" },
  "Ward Demographics (Census 2021)": { text: "SC", bg: "#E6F1FB", color: "#0C447C" },
  "CMHC Rental Market":          { text: "CM", bg: "#FAEEDA", color: "#633806" },
  "Walk Score API":              { text: "WS", bg: "#E1F5EE", color: "#085041" },
  "Toronto Open Data: Permits":  { text: "TO", bg: "#EEEDFE", color: "#3C3489" },
  "Toronto Open Data: Schools":  { text: "TO", bg: "#EEEDFE", color: "#3C3489" },
  "Development Charges":         { text: "DC", bg: "#FAECE7", color: "#712B13" },
  "Quarterly Assets":            { text: "CB", bg: "#F1EFE8", color: "#444441" },
  "Pro Forma Engine":            { text: "PF", bg: "#EAF3DE", color: "#3B6D11" },
};

const RUNNING_LABELS: Record<string, string> = {
  "Geocode + Ward":              "Geocoding address and resolving ward boundary...",
  "torontozoning.com API":       "Fetching torontozoning.com — zoning, envelope, feasibility...",
  "DA Spatial Join":             "Fetching Statistics Canada — dissemination area spatial join...",
  "Ward Demographics (Census 2021)": "Fetching Statistics Canada — income, tenure, household data...",
  "CMHC Rental Market":          "Fetching CMHC — rental market data and vacancy rates...",
  "Walk Score API":              "Fetching Walk Score — walkability, transit, bike scores...",
  "Toronto Open Data: Permits":  "Fetching Toronto Open Data — building permits + multiplex activity...",
  "Toronto Open Data: Schools":  "Fetching Toronto Open Data — school proximity + family demand...",
  "Development Charges":         "Computing development charges and exemption eligibility...",
  "Quarterly Assets":            "Parsing RLB construction cost report and CBRE cap rates...",
  "Pro Forma Engine":            "Running pro forma — unit mix, rents, feasibility score...",
};

function getSourceBadge(name: string) {
  return (
    SOURCE_BADGES[name] ||
    { text: name.slice(0, 2).toUpperCase(), bg: "#F1EFE8", color: "#444441" }
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SourceCard["status"] }) {
  const styles = {
    live:     "bg-[#EAF3DE] text-[#3B6D11]",
    cached:   "bg-[#E6F1FB] text-[#0C447C]",
    fallback: "bg-[#FAEEDA] text-[#854F0B]",
    failed:   "bg-[#FCEBEB] text-[#A32D2D]",
  };
  return (
    <span className={`rounded px-[7px] py-[2px] text-[10px] font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Resolved source card ─────────────────────────────────────────────────────

function ResolvedCard({ card, index }: { card: SourceCard; index: number }) {
  const badge = getSourceBadge(card.source_name);
  const fields = Object.entries(card.values_preview).slice(0, 4);
  const latencyLabel = card.latency_ms === 0 ? "cached" : `${card.latency_ms}ms`;

  return (
    <div
      className="mb-[10px] rounded-[10px] border-[0.5px] border-[#E2E8F0] bg-white p-[12px_14px]"
      style={{
        animation: `slideIn 0.3s ease both`,
        animationDelay: `${index * 30}ms`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] text-[9px] font-bold"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.text}
          </span>
          <span className="text-[12px] font-medium text-[#0F172A]">{card.source_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#94A3B8]">{latencyLabel}</span>
          <StatusBadge status={card.status} />
        </div>
      </div>

      {/* Field grid */}
      {fields.length > 0 && (
        <div className="mt-[10px] border-t border-[#E2E8F0] pt-[10px] grid grid-cols-2 gap-x-4 gap-y-[4px]">
          {fields.map(([key, val]) => (
            <div key={key} className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] text-[#64748B] truncate">{key}</span>
              <span className="text-[11px] font-medium text-[#0F172A] whitespace-nowrap">{val}</span>
            </div>
          ))}
        </div>
      )}

      {card.status === "failed" && (
        <p className="mt-2 text-[11px] text-[#A32D2D]">Error — fallback used</p>
      )}
    </div>
  );
}

// ─── Running card ─────────────────────────────────────────────────────────────

function RunningCard({ text }: { text: string }) {
  return (
    <div className="rounded-[10px] border-[0.5px] border-[#5DCAA5] bg-[#F0FDF9] p-[12px_14px] flex items-center gap-[10px]">
      <span className="inline-block h-[14px] w-[14px] shrink-0 rounded-full border-[1.5px] border-[#5DCAA5] border-t-transparent animate-spin" />
      <span className="text-[12px] text-[#0F6E56]">{text}</span>
    </div>
  );
}

// ─── Stage row ────────────────────────────────────────────────────────────────

type StageStatus = "pending" | "running" | "complete";

function StageRow({
  label,
  status,
}: {
  label: string;
  status: StageStatus;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-[10px] ${
        status === "running" ? "bg-[#F0FDF9]" : ""
      }`}
    >
      {/* Circle indicator */}
      {status === "complete" ? (
        <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-[#0D9488]">
          <Check className="h-[10px] w-[10px] text-white" strokeWidth={2.5} />
        </span>
      ) : status === "running" ? (
        <span className="inline-block h-[20px] w-[20px] shrink-0 rounded-full border-[1.5px] border-[#0D9488] border-t-transparent animate-spin" />
      ) : (
        <span className="h-[20px] w-[20px] shrink-0 rounded-full border-[1.5px] border-[#CBD5E1] bg-white" />
      )}

      {/* Label */}
      <span
        className={`text-[13px] ${
          status === "running"
            ? "font-medium text-[#0F172A]"
            : status === "complete"
            ? "text-[#64748B]"
            : "text-[#94A3B8]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Mobile progress bar ──────────────────────────────────────────────────────

function MobileProgressBar({
  currentStage,
  total,
}: {
  currentStage: number;
  total: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 pb-3">
      <div className="flex items-center gap-3">
        {Array.from({ length: total }).map((_, i) => {
          const s = i + 1;
          const st: StageStatus =
            s < currentStage ? "complete" : s === currentStage ? "running" : "pending";
          return st === "complete" ? (
            <span
              key={i}
              className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#0D9488]"
            >
              <Check className="h-[9px] w-[9px] text-white" strokeWidth={2.5} />
            </span>
          ) : st === "running" ? (
            <span
              key={i}
              className="inline-block h-[18px] w-[18px] rounded-full border-[1.5px] border-[#0D9488] border-t-transparent animate-spin"
            />
          ) : (
            <span
              key={i}
              className="h-[18px] w-[18px] rounded-full border-[1.5px] border-[#CBD5E1] bg-white"
            />
          );
        })}
      </div>
      <p className="text-[12px] text-[#0F172A] font-medium">
        {STAGES[currentStage - 1] ?? "Complete"}
      </p>
    </div>
  );
}

// ─── Main PipelineTab export ───────────────────────────────────────────────────

export default function PipelineTab({ state }: { state: PipelineState }) {
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll feed to bottom as cards arrive
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [state.cards.length, state.runningText]);

  const getStageStatus = (stageIndex: number): StageStatus => {
    const s = stageIndex + 1;
    if (state.currentStage > s) return "complete";
    if (state.currentStage === s && state.status === "running") return "running";
    if (state.status === "complete") return "complete";
    return "pending";
  };

  if (state.status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-[#94A3B8]">
        <p className="text-[14px]">Enter an address on the Input tab to start the pipeline.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[500px]">
      {/* ── Stage sidebar (desktop) ── */}
      <aside className="hidden sm:flex flex-col w-[220px] shrink-0 border-r border-[#E2E8F0] bg-white pt-4">
        {STAGES.map((label, i) => (
          <StageRow key={label} label={label} status={getStageStatus(i)} />
        ))}
      </aside>

      {/* ── Mobile progress ── */}
      <div className="sm:hidden w-full absolute top-0 left-0 right-0 border-b border-[#E2E8F0] bg-white">
        <MobileProgressBar currentStage={state.currentStage} total={STAGES.length} />
      </div>

      {/* ── Data source feed ── */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:mt-0 mt-[72px]"
      >
        {/* Section label */}
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.07em] text-[#94A3B8]">
          Data Sources Resolved
        </p>

        {/* Resolved cards */}
        {state.cards.map((card, i) => (
          <ResolvedCard key={`${card.source_name}-${i}`} card={card} index={i} />
        ))}

        {/* Running card */}
        {state.status === "running" && state.runningText && (
          <RunningCard text={state.runningText} />
        )}

        {/* Complete state */}
        {state.status === "complete" && (
          <div className="mt-4 flex items-center gap-2 text-[13px] text-[#0D9488] font-medium">
            <Check className="h-4 w-4" />
            Pipeline complete — switching to Results…
          </div>
        )}

        {/* Error state */}
        {state.status === "error" && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
            Pipeline error. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CSS keyframes (injected as a style tag via a small component) ─────────────

export function PipelineStyles() {
  return (
    <style>{`
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  );
}
