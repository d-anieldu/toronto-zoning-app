"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Check, ExternalLink, Pencil, X, Check as CheckIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SourceCard {
  source_name: string;
  stage: number;
  fields_returned: string[];
  status: "live" | "cached" | "fallback" | "failed";
  fallback_used: boolean;
  latency_ms: number;
  values_preview: Record<string, string>;
  fetch_method: string;
  source_url: string;
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
  "Geocode & Ward",
  "Zoning lookup",
  "Data enrichment",
  "Derived analytics",
  "Assembly & tier",
];

const SOURCE_BADGES: Record<string, { text: string; bg: string; color: string }> = {
  "Geocode + Ward":              { text: "TZ", bg: "#E1F5EE", color: "#0F6E56" },
  "torontozoning.com API":       { text: "TZ", bg: "#E1F5EE", color: "#0F6E56" },
  "Hard Reject Gate":            { text: "HR", bg: "#FAECE7", color: "#712B13" },
  "DA Spatial Join":             { text: "SC", bg: "#E6F1FB", color: "#0C447C" },
  "Ward Demographics (Census 2021)": { text: "SC", bg: "#E6F1FB", color: "#0C447C" },
  "CMHC Rental Market":          { text: "CM", bg: "#FAEEDA", color: "#633806" },
  "Walk Score API":              { text: "WS", bg: "#E1F5EE", color: "#085041" },
  "Toronto Open Data: Permits":  { text: "TO", bg: "#EEEDFE", color: "#3C3489" },
  "Toronto Open Data: Schools":  { text: "TO", bg: "#EEEDFE", color: "#3C3489" },
  "Quarterly Assets":            { text: "CB", bg: "#F1EFE8", color: "#444441" },
  "Development Charges":         { text: "DC", bg: "#FAECE7", color: "#712B13" },
  "Unit Mix Model":              { text: "UM", bg: "#EAF3DE", color: "#3B6D11" },
  "Parking Assessment":          { text: "PA", bg: "#F1EFE8", color: "#444441" },
  "Rent Underwriting":           { text: "RU", bg: "#FAEEDA", color: "#633806" },
  "Review Flags":                { text: "RF", bg: "#FAECE7", color: "#712B13" },
  "Upside Signals":              { text: "US", bg: "#EAF3DE", color: "#3B6D11" },
  "Risk Assessment":             { text: "RA", bg: "#FAECE7", color: "#712B13" },
  "Financial Metrics":           { text: "FM", bg: "#E6F1FB", color: "#0C447C" },
  "Pipeline Tier Classification": { text: "TC", bg: "#EEEDFE", color: "#3C3489" },
  "Result Assembly":             { text: "OK", bg: "#EAF3DE", color: "#3B6D11" },
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

// ─── Editable value cell ──────────────────────────────────────────────────────

function EditableValue({
  fieldKey,
  value,
  onSave,
}: {
  fieldKey: string;
  value: string;
  onSave: (key: string, newValue: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    if (draft !== value) {
      onSave(fieldKey, draft);
    }
    setEditing(false);
  }, [draft, value, fieldKey, onSave]);

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          className="w-[100px] rounded border border-[#0D9488] bg-white px-1.5 py-0.5 text-[11px] font-medium text-[#0F172A] outline-none"
        />
        <button onClick={commit} className="text-[#0D9488] hover:text-[#0F6E56]">
          <CheckIcon className="h-3 w-3" strokeWidth={2.5} />
        </button>
        <button onClick={cancel} className="text-[#94A3B8] hover:text-[#64748B]">
          <X className="h-3 w-3" strokeWidth={2} />
        </button>
      </span>
    );
  }

  return (
    <span className="group inline-flex items-center gap-1">
      <span className="text-[11px] font-medium text-[#0F172A] whitespace-nowrap">{value}</span>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#94A3B8] hover:text-[#0D9488]"
        title="Edit value"
      >
        <Pencil className="h-[10px] w-[10px]" strokeWidth={2} />
      </button>
    </span>
  );
}

// ─── Resolved source card ─────────────────────────────────────────────────────

function ResolvedCard({
  card,
  index,
  onEditValue,
}: {
  card: SourceCard;
  index: number;
  onEditValue?: (sourceName: string, fieldKey: string, newValue: string) => void;
}) {
  const badge = getSourceBadge(card.source_name);
  const fields = Object.entries(card.values_preview).slice(0, 6);
  const latencyLabel = card.latency_ms === 0 ? "cached" : `${card.latency_ms}ms`;
  const hasSource = card.fetch_method || card.source_url;

  const handleSave = useCallback(
    (key: string, newValue: string) => {
      onEditValue?.(card.source_name, key, newValue);
    },
    [card.source_name, onEditValue],
  );

  return (
    <div
      className="mb-[10px] rounded-[10px] border-[0.5px] border-[#E2E8F0] bg-white p-[12px_14px]"
      style={{
        animation: `slideIn 0.3s ease both`,
        animationDelay: `${index * 30}ms`,
      }}
    >
      {/* Header row */}
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

      {/* Source origin line */}
      {hasSource && (
        <div className="mt-[6px] flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
          <span className="truncate">{card.fetch_method}</span>
          {card.source_url && (
            <>
              <span className="text-[#CBD5E1]">&middot;</span>
              {card.source_url.startsWith("http") ? (
                <a
                  href={card.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-[#0D9488] hover:underline truncate max-w-[200px]"
                >
                  {card.source_url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                  <ExternalLink className="h-[8px] w-[8px] shrink-0" />
                </a>
              ) : (
                <span className="text-[#64748B] truncate max-w-[200px]">{card.source_url}</span>
              )}
            </>
          )}
        </div>
      )}

      {/* Field grid — editable values */}
      {fields.length > 0 && (
        <div className="mt-[10px] border-t border-[#E2E8F0] pt-[10px] grid grid-cols-2 gap-x-4 gap-y-[6px]">
          {fields.map(([key, val]) => (
            <div key={key} className="flex items-baseline justify-between gap-2 min-w-0">
              <span className="text-[11px] text-[#64748B] truncate shrink-0">{key}</span>
              <EditableValue
                fieldKey={key}
                value={String(val)}
                onSave={handleSave}
              />
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

function StageRow({ label, status }: { label: string; status: StageStatus }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-[10px] ${
        status === "running" ? "bg-[#F0FDF9]" : ""
      }`}
    >
      {status === "complete" ? (
        <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-[#0D9488]">
          <Check className="h-[10px] w-[10px] text-white" strokeWidth={2.5} />
        </span>
      ) : status === "running" ? (
        <span className="inline-block h-[20px] w-[20px] shrink-0 rounded-full border-[1.5px] border-[#0D9488] border-t-transparent animate-spin" />
      ) : (
        <span className="h-[20px] w-[20px] shrink-0 rounded-full border-[1.5px] border-[#CBD5E1] bg-white" />
      )}
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

export default function PipelineTab({
  state,
  onEditValue,
}: {
  state: PipelineState;
  onEditValue?: (sourceName: string, fieldKey: string, newValue: string) => void;
}) {
  const feedRef = useRef<HTMLDivElement>(null);

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
      {/* Stage sidebar (desktop) */}
      <aside className="hidden sm:flex flex-col w-[220px] shrink-0 border-r border-[#E2E8F0] bg-white pt-4">
        {STAGES.map((label, i) => (
          <StageRow key={label} label={label} status={getStageStatus(i)} />
        ))}
      </aside>

      {/* Mobile progress */}
      <div className="sm:hidden w-full absolute top-0 left-0 right-0 border-b border-[#E2E8F0] bg-white">
        <MobileProgressBar currentStage={state.currentStage} total={STAGES.length} />
      </div>

      {/* Data source feed */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:mt-0 mt-[72px]"
      >
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.07em] text-[#94A3B8]">
          Data Sources Resolved
        </p>

        {state.cards.map((card, i) => (
          <ResolvedCard
            key={`${card.source_name}-${i}`}
            card={card}
            index={i}
            onEditValue={onEditValue}
          />
        ))}

        {state.status === "running" && state.runningText && (
          <RunningCard text={state.runningText} />
        )}

        {state.status === "complete" && (
          <div className="mt-4 flex items-center gap-2 text-[13px] text-[#0D9488] font-medium">
            <Check className="h-4 w-4" />
            Pipeline complete — switching to Results…
          </div>
        )}

        {state.status === "error" && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
            Pipeline error. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CSS keyframes ─────────────────────────────────────────────────────────────

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
