"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Shared UI primitives and helpers used across all report tabs.
 * Extracted from the original ZoningReport monolith for reuse.
 */

import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import FlagButton from "../FlagButton";

/* ================================================================== */
/*  FLAG CONTEXT — lets tabs provide address/tabName/reportId once     */
/* ================================================================== */

interface FlagContextValue {
  address: string;
  tabName: string;
  reportId?: string;
}

const FlagCtx = createContext<FlagContextValue | null>(null);

export function FlagProvider({ address, tabName, reportId, children }: FlagContextValue & { children: ReactNode }) {
  return <FlagCtx.Provider value={{ address, tabName, reportId }}>{children}</FlagCtx.Provider>;
}

/* ================================================================== */
/*  PRIMITIVES                                                         */
/* ================================================================== */

export function SectionHeading({
  id,
  title,
  count,
  icon,
}: {
  id?: string;
  title: string;
  count?: number;
  icon?: ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-28 pt-2">
      <div className="flex items-center gap-2.5 pb-3">
        {icon && <span className="text-stone-400" aria-hidden="true">{icon}</span>}
        <h3 className="text-[15px] font-semibold tracking-tight text-stone-900">
          {title}
        </h3>
        {count != null && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
            {count}
          </span>
        )}
      </div>
    </div>
  );
}

export function Card({
  label,
  children,
  defaultOpen = true,
  className = "",
  ...rest
}: {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  [key: string]: any;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Sync with external defaultOpen changes (e.g., expand/collapse all)
  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);
  return (
    <section
      className={`rounded-xl border border-stone-200 bg-white shadow-sm ${className}`}
      {...rest}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
        aria-expanded={open}
        aria-label={`${open ? "Collapse" : "Expand"} ${label}`}
      >
        <h4 className="text-[13px] font-semibold uppercase tracking-wide text-stone-400">
          {label}
        </h4>
        <svg
          className={`h-4 w-4 text-stone-300 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="border-t border-stone-100 px-5 py-4">{children}</div>
      </div>
    </section>
  );
}

export function StatCard({
  value,
  unit,
  label,
  sub,
  accent,
}: {
  value: string | number;
  unit?: string;
  label: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3.5 ${
        accent
          ? "border-stone-800 bg-stone-900 text-white"
          : "border-stone-200 bg-white shadow-sm"
      }`}
    >
      <p
        className={`text-[24px] font-bold tracking-tight leading-tight ${
          accent ? "text-white" : "text-stone-900"
        }`}
      >
        {value}
        {unit && (
          <span
            className={`ml-0.5 text-[13px] font-normal ${
              accent ? "text-stone-400" : "text-stone-400"
            }`}
          >
            {unit}
          </span>
        )}
      </p>
      <p
        className={`mt-1 text-[12px] font-medium ${
          accent ? "text-stone-400" : "text-stone-500"
        }`}
      >
        {label}
      </p>
      {sub && (
        <p
          className={`mt-0.5 text-[11px] ${
            accent ? "text-stone-500" : "text-stone-400"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

export function Row({
  label,
  value,
  mono,
  sub,
  flagAddress,
  flagFieldPath,
  flagTabName,
  reportId,
}: {
  label: string;
  value: any;
  mono?: boolean;
  sub?: string;
  flagAddress?: string;
  flagFieldPath?: string;
  flagTabName?: string;
  reportId?: string;
}) {
  const ctx = useContext(FlagCtx);
  if (value === null || value === undefined || value === "" || value === "not specified")
    return null;
  const display = typeof value === "object" && !("props" in value) ? JSON.stringify(value) : value;
  const displayStr = typeof display === "string" ? display : String(display);

  // Resolve flag props: explicit props > context > nothing
  const fAddr = flagAddress || ctx?.address;
  const fTab = flagTabName || ctx?.tabName;
  const fReport = reportId || ctx?.reportId;
  const fPath = flagFieldPath || (ctx ? label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") : undefined);

  return (
    <div className="group flex items-baseline justify-between gap-4 border-b border-stone-50 py-2.5 last:border-0">
      <span className="shrink-0 text-[13px] text-stone-400">{label}</span>
      <div className="flex items-center gap-1 text-right">
        <span
          className={`text-[13px] font-medium text-stone-900 ${mono ? "font-mono" : ""}`}
        >
          {display}
        </span>
        {fAddr && fPath && (
          <FlagButton
            address={fAddr}
            fieldPath={fPath}
            fieldLabel={label}
            currentValue={displayStr}
            tabName={fTab || ""}
            reportId={fReport}
          />
        )}
        {sub && <p className="text-[11px] text-stone-400">{sub}</p>}
      </div>
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "active" | "warning" | "danger" | "success" | "info";
}) {
  const styles = {
    default: "border-stone-200 bg-stone-50 text-stone-600",
    active: "border-stone-300 bg-stone-100 text-stone-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-sky-200 bg-sky-50 text-sky-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

export function Tag({
  children,
  active,
  icon,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  icon?: string;
  onClick?: () => void;
}) {
  const clickable = !!onClick;
  return (
    <span
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); } : undefined}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-stone-200 bg-stone-50 text-stone-600"
      }${clickable ? " cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-indigo-300" : ""}`}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
      {clickable && <span className="ml-0.5 text-[10px] text-indigo-400">→</span>}
    </span>
  );
}

/* ================================================================== */
/*  SETBACK DIAGRAM                                                    */
/* ================================================================== */

export function SetbackDiagram({
  front,
  rear,
  side,
  buildableWidth,
  buildableDepth,
  buildableArea,
}: {
  front: number;
  rear: number;
  side: number;
  buildableWidth?: number;
  buildableDepth?: number;
  buildableArea?: number;
}) {
  const W = 220;
  const H = 280;
  const pad = 30;

  const lotX = pad;
  const lotY = pad;
  const lotW = W - 2 * pad;
  const lotH = H - 2 * pad;

  const totalV = front + rear + (buildableDepth || 10);
  const totalH = side * 2 + (buildableWidth || 5);
  const fPx = Math.max(14, (front / totalV) * lotH);
  const rPx = Math.max(14, (rear / totalV) * lotH);
  const sPx = Math.max(14, (side / totalH) * lotW);

  const bx = lotX + sPx;
  const by = lotY + fPx;
  const bw = lotW - 2 * sPx;
  const bh = lotH - fPx - rPx;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[240px]">
      <rect x={lotX} y={lotY} width={lotW} height={lotH} fill="#fafaf9" stroke="#d6d3d1" strokeWidth="1.5" strokeDasharray="6 3" rx="3" />
      <rect x={bx} y={by} width={Math.max(bw, 0)} height={Math.max(bh, 0)} fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="1.5" rx="3" />
      <text x={lotX + lotW / 2} y={lotY + fPx / 2 + 4} textAnchor="middle" fontSize="10" fill="#78716c" fontFamily="monospace">{front}m</text>
      <text x={lotX + lotW / 2} y={by + bh + rPx / 2 + 4} textAnchor="middle" fontSize="10" fill="#78716c" fontFamily="monospace">{rear}m</text>
      <text x={lotX + sPx / 2} y={lotY + lotH / 2} textAnchor="middle" fontSize="9" fill="#78716c" fontFamily="monospace" transform={`rotate(-90, ${lotX + sPx / 2}, ${lotY + lotH / 2})`}>{side}m</text>
      <text x={lotX + lotW - sPx / 2} y={lotY + lotH / 2} textAnchor="middle" fontSize="9" fill="#78716c" fontFamily="monospace" transform={`rotate(90, ${lotX + lotW - sPx / 2}, ${lotY + lotH / 2})`}>{side}m</text>
      {buildableArea && (
        <>
          <text x={bx + bw / 2} y={by + bh / 2 - 6} textAnchor="middle" fontSize="14" fill="#059669" fontWeight="600">{buildableArea} m²</text>
          {buildableWidth && buildableDepth && (
            <text x={bx + bw / 2} y={by + bh / 2 + 12} textAnchor="middle" fontSize="9" fill="#6ee7b7" fontFamily="monospace">{buildableWidth}m × {buildableDepth}m</text>
          )}
        </>
      )}
      <text x={lotX + lotW / 2} y={lotY - 8} textAnchor="middle" fontSize="9" fill="#a8a29e" fontWeight="500">FRONT</text>
      <text x={lotX + lotW / 2} y={lotY + lotH + 18} textAnchor="middle" fontSize="9" fill="#a8a29e" fontWeight="500">REAR</text>
    </svg>
  );
}

/* ================================================================== */
/*  ICONS (shared across tabs)                                         */
/* ================================================================== */

export const Icons = {
  height: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 18m0 0L12 13.5m4.5 4.5V9" />
    </svg>
  ),
  building: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
  ruler: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  ),
  car: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375a1.125 1.125 0 011.125-1.125h3.026a1.125 1.125 0 01.95.524l.574.957c.189.316.528.524.95.524H21" />
    </svg>
  ),
  doc: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  layers: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25-9.75 5.25-9.75-5.25 4.179-2.25" />
    </svg>
  ),
  tree: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-6m0 0V9m0 6h6m-6 0H6" />
    </svg>
  ),
  angle: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m-15 0v15h15" />
    </svg>
  ),
  sun: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  home: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  gavel: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
    </svg>
  ),
  map: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0 0l3-3m-3 3l-3-3m12 6.75V7.5a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 7.5v11.25" />
    </svg>
  ),
  check: (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  dollar: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  phone: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  ),
  shield: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  sparkle: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  ),
  bike: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  ),
  truck: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375a1.125 1.125 0 011.125-1.125h3.5" />
    </svg>
  ),
  landmark: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
    </svg>
  ),
};

/* ================================================================== */
/*  HELPER: severity styling                                           */
/* ================================================================== */

export const severityColor: Record<string, "danger" | "warning" | "default" | "info"> = {
  high: "danger",
  medium: "warning",
  low: "default",
  info: "info",
};

export const severityIcon: Record<string, string> = {
  high: "🔴",
  medium: "🟡",
  low: "🔵",
  info: "🚇",
};
