"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import ExceptionDetail from "./ExceptionDetail";
import { ReferenceProvider, RefLink } from "./ReferencePanel";
import UseAnalysisPanel from "./UseAnalysisPanel";

const MapPanel = dynamic(() => import("./MapPanel"), { ssr: false });

interface Props {
  data: Record<string, any>;
}

/* ================================================================== */
/*  PRIMITIVES                                                         */
/* ================================================================== */

function SectionHeading({
  id,
  title,
  count,
  icon,
}: {
  id: string;
  title: string;
  count?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-28 pt-2">
      <div className="flex items-center gap-2.5 pb-3">
        {icon && <span className="text-stone-400">{icon}</span>}
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

function Card({
  label,
  children,
  defaultOpen = true,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      className={`rounded-xl border border-stone-200 bg-white shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
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

function StatCard({
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

function Row({
  label,
  value,
  mono,
  sub,
}: {
  label: string;
  value: any;
  mono?: boolean;
  sub?: string;
}) {
  if (value === null || value === undefined || value === "" || value === "not specified")
    return null;
  const display = typeof value === "object" ? JSON.stringify(value) : String(value);
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-stone-50 py-2.5 last:border-0">
      <span className="shrink-0 text-[13px] text-stone-400">{label}</span>
      <div className="text-right">
        <span
          className={`text-[13px] font-medium text-stone-900 ${mono ? "font-mono" : ""}`}
        >
          {display}
        </span>
        {sub && <p className="text-[11px] text-stone-400">{sub}</p>}
      </div>
    </div>
  );
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
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

function Tag({
  children,
  active,
  icon,
  onClick,
}: {
  children: React.ReactNode;
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
      {icon && <span>{icon}</span>}
      {children}
      {clickable && <span className="ml-0.5 text-[10px] text-indigo-400">→</span>}
    </span>
  );
}

/* ================================================================== */
/*  SETBACK DIAGRAM                                                    */
/* ================================================================== */

function SetbackDiagram({
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
      {/* Lot outline */}
      <rect
        x={lotX}
        y={lotY}
        width={lotW}
        height={lotH}
        fill="#fafaf9"
        stroke="#d6d3d1"
        strokeWidth="1.5"
        strokeDasharray="6 3"
        rx="3"
      />

      {/* Buildable area */}
      <rect
        x={bx}
        y={by}
        width={Math.max(bw, 0)}
        height={Math.max(bh, 0)}
        fill="#ecfdf5"
        stroke="#6ee7b7"
        strokeWidth="1.5"
        rx="3"
      />

      {/* Front setback dimension */}
      <text
        x={lotX + lotW / 2}
        y={lotY + fPx / 2 + 4}
        textAnchor="middle"
        fontSize="10"
        fill="#78716c"
        fontFamily="monospace"
      >
        {front}m
      </text>

      {/* Rear setback dimension */}
      <text
        x={lotX + lotW / 2}
        y={by + bh + rPx / 2 + 4}
        textAnchor="middle"
        fontSize="10"
        fill="#78716c"
        fontFamily="monospace"
      >
        {rear}m
      </text>

      {/* Side setback labels */}
      <text
        x={lotX + sPx / 2}
        y={lotY + lotH / 2}
        textAnchor="middle"
        fontSize="9"
        fill="#78716c"
        fontFamily="monospace"
        transform={`rotate(-90, ${lotX + sPx / 2}, ${lotY + lotH / 2})`}
      >
        {side}m
      </text>
      <text
        x={lotX + lotW - sPx / 2}
        y={lotY + lotH / 2}
        textAnchor="middle"
        fontSize="9"
        fill="#78716c"
        fontFamily="monospace"
        transform={`rotate(90, ${lotX + lotW - sPx / 2}, ${lotY + lotH / 2})`}
      >
        {side}m
      </text>

      {/* Buildable area label */}
      {buildableArea && (
        <>
          <text
            x={bx + bw / 2}
            y={by + bh / 2 - 6}
            textAnchor="middle"
            fontSize="14"
            fill="#059669"
            fontWeight="600"
          >
            {buildableArea} m²
          </text>
          {buildableWidth && buildableDepth && (
            <text
              x={bx + bw / 2}
              y={by + bh / 2 + 12}
              textAnchor="middle"
              fontSize="9"
              fill="#6ee7b7"
              fontFamily="monospace"
            >
              {buildableWidth}m × {buildableDepth}m
            </text>
          )}
        </>
      )}

      {/* Edge labels */}
      <text
        x={lotX + lotW / 2}
        y={lotY - 8}
        textAnchor="middle"
        fontSize="9"
        fill="#a8a29e"
        fontWeight="500"
      >
        FRONT
      </text>
      <text
        x={lotX + lotW / 2}
        y={lotY + lotH + 18}
        textAnchor="middle"
        fontSize="9"
        fill="#a8a29e"
        fontWeight="500"
      >
        REAR
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  SECTION NAVIGATOR                                                  */
/* ================================================================== */

const NAV_ITEMS = [
  { id: "zone", label: "Zone" },
  { id: "map", label: "Map" },
  { id: "site-plan", label: "Site Plan" },
  { id: "standards", label: "Standards" },
  { id: "build", label: "What Can I Build" },
  { id: "uses", label: "Uses" },
  { id: "parking", label: "Parking" },
  { id: "bicycle-parking", label: "Bicycle Parking" },
  { id: "loading", label: "Loading" },
  { id: "amenity", label: "Amenity Space" },
  { id: "angular-plane", label: "Angular Plane" },
  { id: "shadow", label: "Shadow" },
  { id: "inclusionary-zoning", label: "Inclusionary Zoning" },
  { id: "coa", label: "CoA Precedents" },
  { id: "overlays", label: "Overlays" },
  { id: "hazards", label: "Hazards" },
  { id: "heritage", label: "Heritage" },
  { id: "overlay-rules", label: "District Rules" },
  { id: "stepback", label: "Stepback" },
  { id: "op-context", label: "Official Plan" },
  { id: "exception", label: "Exception" },
  { id: "charges", label: "Charges" },
  { id: "contact", label: "Contact" },
  { id: "confidence", label: "Confidence" },
];

function SectionNav() {
  const [active, setActive] = useState("zone");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    for (const item of NAV_ITEMS) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <nav className="sticky top-0 z-20 -mx-1 mb-4 overflow-x-auto rounded-xl border border-stone-200 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="flex min-w-max gap-0.5 px-2 py-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all ${
              active === item.id
                ? "bg-stone-900 text-white shadow-sm"
                : "text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ================================================================== */
/*  ICONS                                                              */
/* ================================================================== */

const Icons = {
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  layers: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25 2.25 12l4.179-2.25m11.142 0l4.179 2.25L12 22.5l-9.75-5.25 4.179-2.25" />
    </svg>
  ),
  car: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21" />
    </svg>
  ),
  map: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  ),
  doc: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
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
  warning: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  check: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  tree: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l-7 8h4l-3 5h4l-2.5 5H12m0-18l7 8h-4l3 5h-4l2.5 5H12m0 0V3" />
    </svg>
  ),
  landmark: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
    </svg>
  ),
  shield: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  bike: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 18a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM18.75 18a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM12 5.25l-3 9h6l-3-9zM5.25 14.25h13.5" />
    </svg>
  ),
  truck: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75M15 12V3.75m0 0H3.375c-.621 0-1.125.504-1.125 1.125V12m12.75-8.25h3.375c.621 0 1.125.504 1.125 1.125V12" />
    </svg>
  ),
  sparkle: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),
  angle: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 20.25V3.75m0 16.5h16.5M3.75 20.25l16.5-16.5" />
    </svg>
  ),
  sun: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  gavel: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
    </svg>
  ),
  home: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
};

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function ZoningReport({ data }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [analyzeUse, setAnalyzeUse] = useState<string | null>(null);

  /* -------- data extraction -------- */
  const eff = data.effective_standards || {};
  const dev = data.development_potential || {};
  const layers = data.layers || {};
  const coords = data.coordinates || {};

  const hasEffError = eff.error;
  const hasDevError = dev.error;

  /* -------- zone info -------- */
  const zoneLabel = eff.zone_label || {};
  const zoneCode = eff.zone_code || zoneLabel.zone_code || "";
  const zoneString = eff.zone_string || "";
  const exceptionNum = zoneLabel.exception_number || eff.exception?.exception_number;

  /* -------- multi-zone detection -------- */
  const zoningArea = layers.zoning_area;
  const isMultiZone = Array.isArray(zoningArea) && zoningArea.length > 1;
  const primaryZone = isMultiZone ? zoningArea[0] : zoningArea;

  /* -------- by-law info -------- */
  const bylawChapter = primaryZone?.ZBL_CHAPT;
  const bylawSection = primaryZone?.ZBL_SECTN;
  const holdingProvision = primaryZone?.ZN_HOLDING === "Y";

  /* -------- overlay definitions -------- */
  const overlayDefs = [
    {
      key: "height_overlay",
      label: "Height Overlay",
      icon: "📏",
      detail: layers.height_overlay
        ? `HT ${layers.height_overlay.HT_LABEL}m${layers.height_overlay.HT_STORIES ? `, ${layers.height_overlay.HT_STORIES} st` : ""}`
        : undefined,
    },
    {
      key: "lot_coverage_overlay",
      label: "Lot Coverage",
      icon: "📐",
      detail: layers.lot_coverage_overlay
        ? `${layers.lot_coverage_overlay.PRCNT_CVER}%`
        : undefined,
    },
    {
      key: "building_setback_overlay",
      label: "Building Setback",
      icon: "↔️",
      detail: layers.building_setback_overlay?.SETBACK
        ? `${layers.building_setback_overlay.SETBACK}m`
        : undefined,
    },
    {
      key: "parking_zone_overlay",
      label: "Parking Zone",
      icon: "🅿️",
      detail: layers.parking_zone_overlay?.ZN_PARKZONE
        ? `Zone ${layers.parking_zone_overlay.ZN_PARKZONE}`
        : undefined,
    },
    {
      key: "policy_area_overlay",
      label: "Policy Area",
      icon: "📋",
      detail:
        layers.policy_area_overlay?.POLICY_ARE ||
        layers.policy_area_overlay?.POLICY_ID,
    },
    {
      key: "policy_road_overlay",
      label: "Policy Road",
      icon: "🛣️",
      detail: layers.policy_road_overlay?.ROAD_NAME,
    },
    {
      key: "rooming_house_overlay",
      label: "Rooming House",
      icon: "🏠",
      detail: (() => {
        const rh = layers.rooming_house_overlay;
        if (!rh) return undefined;
        if (Array.isArray(rh))
          return rh.map((r: any) => r.RMG_STRING || `Area ${r.RMH_AREA}`).join(", ");
        return rh.RMG_STRING || `Area ${rh.RMH_AREA}`;
      })(),
    },
    {
      key: "priority_retail_street_overlay",
      label: "Priority Retail Street",
      icon: "🏪",
    },
    {
      key: "queen_st_w_eat_community_overlay",
      label: "Queen St W EAT Community",
      icon: "🍽️",
    },
    {
      key: "heritage_register",
      label: "Heritage Register",
      icon: "🏛️",
      detail: layers.heritage_register?.STATUS,
    },
    {
      key: "heritage_conservation_district",
      label: "Heritage Conservation District",
      icon: "🏘️",
      detail: layers.heritage_conservation_district?.HCD_NAME,
    },
    {
      key: "secondary_plan",
      label: "Secondary Plan",
      icon: "📑",
      detail: layers.secondary_plan?.SECONDARY_PLAN_NAME,
    },
    {
      key: "major_transit_station_area",
      label: "Major Transit Station Area",
      icon: "🚉",
      detail: layers.major_transit_station_area?.StationNam,
    },
    {
      key: "ravine_protection",
      label: "Ravine & Natural Feature",
      icon: "🌿",
    },
    {
      key: "environmentally_significant_area",
      label: "Environmentally Significant Area",
      icon: "🌳",
      detail: layers.environmentally_significant_area?.ESA_NAME,
    },
    { key: "natural_heritage_system", label: "Natural Heritage System", icon: "🦉" },
    {
      key: "site_area_specific_policy",
      label: "Site & Area Specific Policy",
      icon: "📌",
      detail: (() => {
        const s = layers.site_area_specific_policy;
        if (!s) return undefined;
        if (Array.isArray(s) && s.length > 0)
          return `${s.length} ${s.length === 1 ? "policy" : "policies"}`;
        return undefined;
      })(),
    },
    {
      key: "archaeological_potential",
      label: "Archaeological Potential",
      icon: "🏺",
    },
  ];

  const isOverlayActive = (key: string) => {
    const v = layers[key];
    if (v === null || v === undefined) return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  };
  const activeOverlays = overlayDefs.filter((o) => isOverlayActive(o.key));
  const inactiveOverlays = overlayDefs.filter((o) => !isOverlayActive(o.key));

  /* -------- constraints -------- */
  const constraints = dev.constraints?.items || [];
  const severityColor: Record<string, "danger" | "warning" | "default" | "info"> = {
    high: "danger",
    medium: "warning",
    low: "default",
    info: "info",
  };
  const severityIcon: Record<string, string> = {
    high: "🔴",
    medium: "🟡",
    low: "🔵",
    info: "🚇",
  };

  /* -------- op context -------- */
  const opContext = eff.op_context;
  const opDesignation = opContext?.op_designation;
  const saspPolicies = opContext?.sasp_policies || [];

  return (
    <ReferenceProvider>
    <div ref={reportRef} className="mt-8 space-y-5">
      {/* ============================================================ */}
      {/*  SECTION NAV                                                  */}
      {/* ============================================================ */}
      <SectionNav />

      {/* ============================================================ */}
      {/*  ZONE IDENTITY HEADER                                         */}
      {/* ============================================================ */}
      <div id="zone" className="scroll-mt-28">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: address & coords */}
            <div>
              <h2 className="text-[22px] font-bold tracking-tight text-stone-900">
                {data.address}
              </h2>
              <p className="mt-1.5 font-mono text-[12px] text-stone-400">
                {coords.latitude?.toFixed(6)}°N,{" "}
                {Math.abs(coords.longitude)?.toFixed(6)}°W
              </p>
              {(bylawChapter || bylawSection) && (
                <p className="mt-1 text-[12px] text-stone-400">
                  By-law 569-2013 · Chapter {bylawChapter} ·{" "}
                  <RefLink type="bylaw-section" id={bylawSection || bylawChapter} label={`s. ${bylawSection}`}>
                    s.{bylawSection}
                  </RefLink>
                </p>
              )}
            </div>

            {/* Right: zone badges */}
            <div className="flex flex-wrap items-center gap-2">
              {zoneCode && (
                <RefLink type="zone-info" id={zoneCode} label={zoneCode}>
                  <span className="rounded-lg bg-stone-900 px-3 py-1.5 text-[13px] font-bold tracking-wide text-white">
                    {zoneCode}
                  </span>
                </RefLink>
              )}
              {zoneString && (
                <span className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 font-mono text-[12px] text-stone-600">
                  {zoneString}
                </span>
              )}
              {exceptionNum && (
                <RefLink type="exception" id={String(exceptionNum)} zone_code={zoneCode} label={`Exception #${exceptionNum}`}>
                  <Badge variant="warning">Exception #{exceptionNum}</Badge>
                </RefLink>
              )}
              {holdingProvision && <Badge variant="danger">Holding (H)</Badge>}
            </div>
          </div>

          {/* Multi-zone warning */}
          {isMultiZone && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-[13px] font-semibold text-amber-800">
                ⚠ Multi-Zone Lot Detected
              </p>
              <div className="mt-2 space-y-1">
                {zoningArea.map((z: any, i: number) => (
                  <p key={i} className="text-[12px] text-amber-700">
                    <span className="font-medium">Zone #{i + 1}:</span>{" "}
                    <span className="font-mono">{z.ZN_ZONE}</span>{" "}
                    <span className="text-amber-600">({z.ZN_STRING})</span>
                    {z.EXCPTN_NO && z.EXCPTN_NO > 0 && (
                      <RefLink type="exception" id={String(z.EXCPTN_NO)} zone_code={z.ZN_ZONE} label={`Exception #${z.EXCPTN_NO}`} className="text-amber-500">
                        {" "}
                        · Exception #{z.EXCPTN_NO}
                      </RefLink>
                    )}
                  </p>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-amber-600">
                Report shows primary zone standards. Secondary zone rules may
                apply to portions of the lot.
              </p>
            </div>
          )}

          {/* Holding provision warning */}
          {eff.holding_warning && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-[13px] font-semibold text-red-800">
                {eff.holding_warning}
              </p>
            </div>
          )}

          {/* PMTSA advisory banner */}
          {dev.constraints?.pmtsa_advisory && (
            <div className="mt-4 rounded-xl border-2 border-sky-300 bg-gradient-to-r from-sky-50 to-indigo-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375a1.125 1.125 0 011.125-1.125h3.026a1.125 1.125 0 01.95.524l.574.957c.189.316.528.524.95.524H21" />
                  </svg>
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[14px] font-bold text-sky-900">
                      Protected Major Transit Station Area
                    </span>
                    <Badge variant="info">
                      {dev.constraints.pmtsa_advisory.station_name} Station
                    </Badge>
                  </div>
                  <p className="text-[12px] leading-relaxed text-sky-800">
                    {dev.constraints.pmtsa_advisory.summary}
                  </p>
                  {dev.constraints.pmtsa_advisory.policy_notes?.length > 0 && (
                    <div className="mt-3 rounded-lg bg-white/60 p-3">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-600">
                        Provincial Policy Requirements
                      </p>
                      <ul className="space-y-1">
                        {dev.constraints.pmtsa_advisory.policy_notes.map((n: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-sky-700">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-400" />
                            <span>{n}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {dev.constraints.pmtsa_advisory.sasp_blank && (
                    <p className="mt-2 text-[11px] font-medium text-amber-600">
                      ⚠{" "}
                      <RefLink type="sasp" id={String(dev.constraints.pmtsa_advisory.sasp_no)} label={`SASP #${dev.constraints.pmtsa_advisory.sasp_no}`}>
                        SASP #{dev.constraints.pmtsa_advisory.sasp_no}
                      </RefLink>
                      {" "}is not yet finalized — planning framework pending adoption
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Secondary zones (resolved data) */}
          {eff.secondary_zones?.length > 0 && (
            <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
                Secondary Zones on This Lot
              </p>
              <div className="space-y-1">
                {eff.secondary_zones.map((sz: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-[12px]">
                    <span className="rounded bg-stone-200 px-1.5 py-0.5 font-mono text-[11px] font-medium text-stone-700">
                      {sz.zone}
                    </span>
                    <span className="text-stone-500">{sz.zone_string}</span>
                    {sz.exception_number && Number(sz.exception_number) > 0 && (
                      <RefLink type="exception" id={String(sz.exception_number)} zone_code={sz.zone} label={`Exception #${sz.exception_number}`}>
                        <Badge variant="warning">Exc #{sz.exception_number}</Badge>
                      </RefLink>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  ERROR BANNERS                                                */}
      {/* ============================================================ */}
      {hasEffError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-700">
          <span className="font-semibold">Standards Error:</span> {eff.error}
        </div>
      )}
      {hasDevError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-700">
          <span className="font-semibold">Development Potential Error:</span>{" "}
          {dev.error}
        </div>
      )}

      {/* ============================================================ */}
      {/*  KEY METRICS                                                  */}
      {/* ============================================================ */}
      {!hasEffError && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {eff.height?.effective_m != null && (
            <StatCard
              value={eff.height.effective_m}
              unit="m"
              label="Max Height"
              sub={eff.height.effective_source}
            />
          )}
          {(eff.height?.effective_storeys ?? dev.height?.max_storeys) != null && (
            <StatCard
              value={
                eff.height?.effective_storeys ?? dev.height?.max_storeys
              }
              label="Max Storeys"
              sub={
                eff.height?.storeys_unlimited ? "unlimited by zone" : undefined
              }
            />
          )}
          {eff.fsi?.effective_total != null && (
            <StatCard
              value={eff.fsi.effective_total}
              label="Max FSI"
              sub={eff.fsi.effective_source}
            />
          )}
          {eff.lot_coverage?.effective_pct != null && (
            <StatCard
              value={eff.lot_coverage.effective_pct}
              unit="%"
              label="Lot Coverage"
              sub={eff.lot_coverage.effective_source}
            />
          )}
          {dev.max_gfa?.sqm != null && (
            <StatCard
              value={Number(dev.max_gfa.sqm).toLocaleString()}
              unit="m²"
              label="Max GFA"
              sub={`by ${dev.max_gfa.limiting_factor}`}
              accent
            />
          )}
          {(eff.parking_zone || eff.parking?.parking_zone) && (
            <StatCard
              value={eff.parking_zone || eff.parking?.parking_zone}
              label="Parking Zone"
            />
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/*  CONSTRAINTS                                                  */}
      {/* ============================================================ */}
      {constraints.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3">
            <span className="text-stone-400">{Icons.warning}</span>
            <h3 className="text-[15px] font-semibold tracking-tight text-stone-900">
              Development Constraints
            </h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              {constraints.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {constraints.map((c: any, i: number) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg border p-3.5 ${
                  c.severity === "high"
                    ? "border-red-200 bg-red-50"
                    : c.severity === "medium"
                      ? "border-amber-200 bg-amber-50"
                      : c.severity === "info"
                        ? "border-sky-200 bg-sky-50"
                        : "border-stone-200 bg-stone-50"
                }`}
              >
                <span className="mt-0.5 text-[14px]">
                  {severityIcon[c.severity] || "⚪"}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-stone-800">
                      {c.layer}
                    </p>
                    <Badge variant={severityColor[c.severity] || "default"}>
                      {c.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-stone-500">
                    {c.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  GIS LAYER MAP                                                */}
      {/* ============================================================ */}
      {coords.latitude && coords.longitude && (
        <>
          <SectionHeading id="map" title="GIS Layer Map" icon={Icons.map} />
          <MapPanel latitude={coords.latitude} longitude={coords.longitude} />
        </>
      )}

      {/* ============================================================ */}
      {/*  SITE PLAN CONTROL                                            */}
      {/* ============================================================ */}
      {dev.site_plan_control && (
        <div
          id="site-plan"
          className={`scroll-mt-28 rounded-xl border p-5 shadow-sm ${
            dev.site_plan_control.required
              ? dev.site_plan_control.confidence === "high"
                ? "border-red-200 bg-red-50/60"
                : "border-amber-200 bg-amber-50/60"
              : "border-emerald-200 bg-emerald-50/60"
          }`}
        >
          <div className="flex items-center gap-2.5 pb-3">
            <span className="text-[18px]">
              {dev.site_plan_control.required ? "📋" : "✅"}
            </span>
            <h3 className="text-[15px] font-semibold tracking-tight text-stone-900">
              Site Plan Control
            </h3>
            <Badge
              variant={
                dev.site_plan_control.required
                  ? dev.site_plan_control.confidence === "high"
                    ? "danger"
                    : "warning"
                  : "success"
              }
            >
              {dev.site_plan_control.required ? "Required" : "Likely Exempt"}
            </Badge>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
              {dev.site_plan_control.confidence} confidence
            </span>
          </div>

          <p className="text-[13px] leading-relaxed text-stone-600">
            {dev.site_plan_control.summary}
          </p>

          {/* Triggers */}
          {dev.site_plan_control.triggers?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
                Triggers ({dev.site_plan_control.trigger_count})
              </p>
              <div className="space-y-2">
                {dev.site_plan_control.triggers.map((t: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-white/80 px-3 py-2.5"
                  >
                    <span className="mt-0.5 text-[12px]">
                      {t.severity === "definite" ? "🔴" : "🟡"}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-stone-700">
                          {t.category.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {t.rule}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500">
                        {t.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exemptions */}
          {dev.site_plan_control.exemptions?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
                Potential Exemptions ({dev.site_plan_control.exemption_count})
              </p>
              <div className="space-y-2">
                {dev.site_plan_control.exemptions.map((e: any, i: number) => (
                  <div
                    key={i}
                    className={`rounded-lg border px-3 py-2.5 ${
                      e.overridden
                        ? "border-stone-200 bg-stone-100 opacity-60"
                        : "border-emerald-100 bg-white/80"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[12px]">
                        {e.overridden ? "❌" : "✅"}
                      </span>
                      <span className="text-[12px] font-semibold text-stone-700">
                        {e.category.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </span>
                      {e.overridden && (
                        <Badge variant="danger">Overridden</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500">
                      {e.reason}
                    </p>
                    {e.overridden && e.override_reason && (
                      <p className="mt-1 text-[11px] italic text-red-500">
                        {e.override_reason}
                      </p>
                    )}
                    {!e.overridden && e.conditions?.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {e.conditions.map((cond: string, ci: number) => (
                          <li
                            key={ci}
                            className="text-[11px] text-stone-400"
                          >
                            • {cond}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-3">
            <p className="text-[12px] font-semibold text-sky-700">
              Recommendation
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-sky-600">
              {dev.site_plan_control.recommendation}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  ZONING STANDARDS                                             */}
      {/* ============================================================ */}
      {!hasEffError && (
        <>
          <SectionHeading
            id="standards"
            title="Zoning Standards"
            icon={Icons.ruler}
          />

          <div className="grid gap-4 md:grid-cols-2">
            {/* Height & Density */}
            <Card label="Height & Density">
              <Row
                label="Effective height"
                value={
                  eff.height?.effective_m
                    ? `${eff.height.effective_m} m`
                    : null
                }
              />
              <Row
                label="Max storeys"
                value={
                  eff.height?.effective_storeys != null
                    ? eff.height.effective_storeys
                    : eff.height?.storeys_unlimited
                      ? "Unlimited"
                      : null
                }
              />
              <Row label="Height source" value={eff.height?.effective_source} />
              <Row
                label="Base default"
                value={
                  eff.height?.base_default_m
                    ? `${eff.height.base_default_m} m`
                    : null
                }
                sub={eff.height?.source_base}
              />
              <Row
                label="Overlay height"
                value={
                  eff.height?.overlay_m ? `${eff.height.overlay_m} m` : null
                }
              />
              <Row
                label="Overlay storeys"
                value={eff.height?.overlay_storeys}
              />
              <div className="my-2 border-t border-stone-100" />
              <Row label="FSI" value={eff.fsi?.effective_total} />
              <Row label="FSI source" value={eff.fsi?.effective_source} />
              {eff.fsi?.is_compound && (
                <>
                  <Row
                    label="Commercial FSI"
                    value={eff.fsi.fsi_commercial_max}
                  />
                  <Row
                    label="Residential FSI"
                    value={eff.fsi.fsi_residential_max}
                  />
                  <Row label="Compound note" value={eff.fsi.compound_note} />
                </>
              )}
            </Card>

            {/* Setbacks */}
            <Card label="Setbacks">
              <Row
                label="Front"
                value={
                  eff.setbacks?.effective_front_m
                    ? `${eff.setbacks.effective_front_m} m`
                    : null
                }
              />
              <Row
                label="Rear"
                value={
                  eff.setbacks?.effective_rear_m
                    ? `${eff.setbacks.effective_rear_m} m`
                    : null
                }
              />
              <Row
                label="Side"
                value={
                  eff.setbacks?.effective_side_m
                    ? `${eff.setbacks.effective_side_m} m`
                    : null
                }
              />
              {eff.setbacks?.exception_side_m && (
                <Row
                  label="Side (exception)"
                  value={`${eff.setbacks.exception_side_m} m`}
                />
              )}
              {eff.setbacks?.overlay_m && (
                <Row
                  label="Overlay setback"
                  value={`${eff.setbacks.overlay_m} m${eff.setbacks.overlay_type ? ` (${eff.setbacks.overlay_type})` : ""}`}
                  sub="Additional overlay requirement"
                />
              )}
              {eff.setbacks?.standard_set && (
                <div className="mt-3 border-t border-stone-100 pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="info">{eff.setbacks.standard_set}</Badge>
                    {eff.setbacks.standard_set_name && (
                      <span className="text-[12px] font-medium text-stone-600">
                        {eff.setbacks.standard_set_name}
                      </span>
                    )}
                  </div>
                  {eff.setbacks.ss_rules?.notes?.length > 0 && (
                    <ul className="space-y-1">
                      {eff.setbacks.ss_rules.notes.map((note: string, i: number) => (
                        <li key={i} className="text-[11px] leading-relaxed text-stone-500">
                          • {note}
                        </li>
                      ))}
                    </ul>
                  )}
                  {eff.setbacks.effective_front_note && (
                    <p className="mt-1 text-[11px] text-stone-400">
                      Front: {eff.setbacks.effective_front_note}
                    </p>
                  )}
                  {eff.setbacks.effective_side_note && (
                    <p className="mt-1 text-[11px] text-stone-400">
                      Side: {eff.setbacks.effective_side_note}
                    </p>
                  )}
                </div>
              )}
              {eff.setbacks?.base_side_tiers?.length > 0 && (
                <div className="mt-3 border-t border-stone-100 pt-3">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    Side Setback Tiers
                  </p>
                  <div className="space-y-1">
                    {eff.setbacks.base_side_tiers.map(
                      (tier: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-baseline justify-between text-[12px]"
                        >
                          <span className="text-stone-400">
                            Frontage {tier.frontage_from_m}m
                            {tier.frontage_to_m
                              ? `–${tier.frontage_to_m}m`
                              : "+"}
                          </span>
                          <span className="font-mono font-medium text-stone-700">
                            {tier.setback_m}m
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Lot Dimensions */}
            <Card label="Lot Dimensions">
              <Row
                label="Min frontage"
                value={
                  eff.lot_dimensions?.min_frontage_m
                    ? `${eff.lot_dimensions.min_frontage_m} m`
                    : null
                }
                sub={eff.lot_dimensions?.frontage_source}
              />
              <Row
                label="Min lot area"
                value={
                  eff.lot_dimensions?.min_area_sqm
                    ? `${eff.lot_dimensions.min_area_sqm} m²`
                    : null
                }
                sub={eff.lot_dimensions?.area_source}
              />
              <Row
                label="Max units"
                value={zoneLabel.max_units || primaryZone?.UNITS}
              />
              <Row
                label="Density"
                value={
                  primaryZone?.DENSITY && primaryZone.DENSITY > 0
                    ? primaryZone.DENSITY
                    : null
                }
              />
              {dev.lot && (
                <>
                  <div className="my-2 border-t border-stone-100" />
                  <Row
                    label="Est. lot area"
                    value={
                      dev.lot.area_sqm ? `${dev.lot.area_sqm} m²` : null
                    }
                    sub={dev.lot.area_source}
                  />
                  <Row
                    label="Est. frontage"
                    value={
                      dev.lot.frontage_m ? `${dev.lot.frontage_m} m` : null
                    }
                    sub={dev.lot.frontage_source}
                  />
                  <Row
                    label="Est. depth"
                    value={dev.lot.depth_m ? `${dev.lot.depth_m} m` : null}
                    sub={dev.lot.depth_source}
                  />
                </>
              )}
            </Card>

            {/* Lot Coverage */}
            <Card label="Lot Coverage">
              <Row
                label="Effective coverage"
                value={
                  eff.lot_coverage?.effective_pct
                    ? `${eff.lot_coverage.effective_pct}%`
                    : "Not determined"
                }
              />
              <Row label="Source" value={eff.lot_coverage?.effective_source} />
              <Row
                label="Overlay %"
                value={
                  eff.lot_coverage?.overlay_pct
                    ? `${eff.lot_coverage.overlay_pct}%`
                    : null
                }
              />
              <Row
                label="Uses overlay map"
                value={eff.lot_coverage?.uses_overlay_map ? "Yes" : null}
              />
              <Row
                label="No limit if no overlay"
                value={
                  eff.lot_coverage?.no_limit_if_no_overlay ? "Yes" : null
                }
              />
            </Card>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  WHAT CAN I BUILD                                             */}
      {/* ============================================================ */}
      {dev && !hasDevError && (
        <>
          <SectionHeading
            id="build"
            title="What Can I Build"
            icon={Icons.building}
          />

          {/* Building Envelope + Setback Diagram */}
          <div className="grid gap-4 md:grid-cols-5">
            {/* Setback diagram */}
            {dev.setbacks && (
              <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm md:col-span-2">
                <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                  Building Envelope
                </p>
                <SetbackDiagram
                  front={dev.setbacks.front_m}
                  rear={dev.setbacks.rear_m}
                  side={dev.setbacks.side_m}
                  buildableWidth={dev.setbacks.buildable_width_m}
                  buildableDepth={dev.setbacks.buildable_depth_m}
                  buildableArea={dev.setbacks.buildable_area_sqm}
                />
              </div>
            )}

            {/* Development metrics */}
            <div
              className={`grid gap-3 ${dev.setbacks ? "md:col-span-3" : "md:col-span-5"} grid-cols-2 content-start`}
            >
              {dev.max_gfa && (
                <div className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[28px] font-bold tracking-tight text-emerald-900">
                    {Number(dev.max_gfa.sqm).toLocaleString()} m²
                  </p>
                  <p className="text-[12px] font-medium text-emerald-600">
                    Maximum GFA
                  </p>
                  <p className="mt-0.5 text-[11px] text-emerald-500">
                    Limited by {dev.max_gfa.limiting_factor}
                  </p>
                </div>
              )}
              {dev.height && (
                <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <p className="text-[20px] font-bold text-stone-900">
                    {dev.height.max_m} m
                  </p>
                  <p className="text-[12px] text-stone-500">Max Height</p>
                  {dev.height.max_storeys && (
                    <p className="text-[11px] text-stone-400">
                      ~{dev.height.max_storeys} storeys est.
                    </p>
                  )}
                </div>
              )}
              {dev.coverage && (
                <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <p className="text-[20px] font-bold text-stone-900">
                    {dev.coverage.max_footprint_sqm} m²
                  </p>
                  <p className="text-[12px] text-stone-500">Max Footprint</p>
                  <p className="text-[11px] text-stone-400">
                    {dev.coverage.max_pct}% coverage
                  </p>
                </div>
              )}
              {dev.floor_plate && (
                <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <p className="text-[20px] font-bold text-stone-900">
                    {dev.floor_plate.max_sqm} m²
                  </p>
                  <p className="text-[12px] text-stone-500">Floor Plate</p>
                  <p className="text-[11px] text-stone-400">
                    by {dev.floor_plate.limiting_factor}
                  </p>
                </div>
              )}
              {dev.setbacks && (
                <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <p className="text-[20px] font-bold text-stone-900">
                    {dev.setbacks.buildable_area_sqm} m²
                  </p>
                  <p className="text-[12px] text-stone-500">Buildable Area</p>
                  <p className="text-[11px] text-stone-400">
                    {dev.setbacks.buildable_width_m}m ×{" "}
                    {dev.setbacks.buildable_depth_m}m
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* GFA constraints breakdown */}
          {dev.max_gfa?.all_limits && (
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                GFA Constraints Breakdown
              </p>
              <div className="space-y-3">
                {Object.entries(dev.max_gfa.all_limits).map(
                  ([factor, val]: [string, any]) => {
                    const maxVal = Math.max(
                      ...Object.values(dev.max_gfa.all_limits).map(Number)
                    );
                    const pct = maxVal > 0 ? (Number(val) / maxVal) * 100 : 0;
                    const isControlling =
                      factor === dev.max_gfa.limiting_factor;
                    return (
                      <div key={factor}>
                        <div className="flex items-baseline justify-between">
                          <span
                            className={`text-[13px] ${isControlling ? "font-semibold text-stone-900" : "text-stone-500"}`}
                          >
                            {factor}{" "}
                            {isControlling && (
                              <span className="text-emerald-600">
                                ◀ controls
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-[13px] font-semibold text-stone-900">
                            {Number(val).toLocaleString()} m²
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className={`h-full rounded-full transition-all ${isControlling ? "bg-emerald-500" : "bg-stone-300"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* Building types with checkmarks */}
          {dev.building_types && (
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                Building Types
              </p>
              <div className="flex flex-wrap gap-2">
                {(dev.building_types.permitted || []).map((t: string) => (
                  <Tag key={t} active icon="✓" onClick={() => setAnalyzeUse(t)}>
                    {t}
                  </Tag>
                ))}
              </div>
              {dev.building_types.feasible?.length > 0 &&
                dev.building_types.feasible.some(
                  (f: any) => f.notes?.length > 0
                ) && (
                  <div className="mt-4 border-t border-stone-100 pt-3">
                    <p className="mb-2 text-[12px] font-medium text-stone-500">
                      Feasibility Notes
                    </p>
                    {dev.building_types.feasible
                      .filter((f: any) => f.notes?.length > 0)
                      .map((f: any) => (
                        <div key={f.type} className="py-1">
                          <span className="text-[13px] font-medium text-stone-700">
                            {f.type}
                          </span>
                          <p className="text-[12px] text-stone-400">
                            {f.notes.join("; ")}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  PERMITTED USES                                               */}
      {/* ============================================================ */}
      {(eff.permitted_building_types?.length > 0 ||
        eff.permitted_uses?.length > 0) && (
        <>
          <SectionHeading
            id="uses"
            title="Permitted Uses & Building Types"
            icon={Icons.doc}
          />

          <div className="grid gap-4 md:grid-cols-2">
            {/* Building Types */}
            {eff.permitted_building_types?.length > 0 && (
              <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                  Permitted Building Types
                </p>
                <div className="space-y-2">
                  {eff.permitted_building_types.map((t: string) => (
                    <div
                      key={t}
                      className="flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-indigo-50"
                      role="button"
                      tabIndex={0}
                      onClick={() => setAnalyzeUse(t)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setAnalyzeUse(t); }}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        {Icons.check}
                      </span>
                      <span className="text-[13px] font-medium text-stone-700">
                        {t}
                      </span>
                      <span className="ml-auto text-[10px] text-indigo-400">Analyze →</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Permitted Uses — use expanded_uses if available, fall back to flat list */}
            {(eff.expanded_uses || eff.permitted_uses?.length > 0) && (
              <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                  Permitted Uses
                </p>

                {eff.expanded_uses ? (
                  <div className="space-y-4">
                    {eff.expanded_uses.commercial?.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-[12px] font-medium text-stone-500">
                          Commercial ({eff.expanded_uses.commercial.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {eff.expanded_uses.commercial.map((u: string) => (
                            <Tag key={u} active>{u}</Tag>
                          ))}
                        </div>
                      </div>
                    )}
                    {eff.expanded_uses.residential?.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-[12px] font-medium text-stone-500">
                          Residential ({eff.expanded_uses.residential.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {eff.expanded_uses.residential.map((u: string) => (
                            <Tag key={u} active>{u}</Tag>
                          ))}
                        </div>
                      </div>
                    )}
                    {eff.expanded_uses.institutional?.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-[12px] font-medium text-stone-500">
                          Institutional ({eff.expanded_uses.institutional.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {eff.expanded_uses.institutional.map((u: string) => (
                            <Tag key={u} active>{u}</Tag>
                          ))}
                        </div>
                      </div>
                    )}
                    {eff.expanded_uses.open_space?.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-[12px] font-medium text-stone-500">
                          Open Space ({eff.expanded_uses.open_space.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {eff.expanded_uses.open_space.map((u: string) => (
                            <Tag key={u} active>{u}</Tag>
                          ))}
                        </div>
                      </div>
                    )}
                    {eff.expanded_uses.conditional_commercial?.length > 0 && (
                      <div className="border-t border-stone-100 pt-3">
                        <p className="mb-1.5 text-[12px] font-medium text-amber-600">
                          Conditional Commercial ({eff.expanded_uses.conditional_commercial.length})
                        </p>
                        <div className="space-y-1.5">
                          {eff.expanded_uses.conditional_commercial.map((d: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 cursor-pointer transition-colors hover:bg-amber-100 hover:ring-1 hover:ring-indigo-300"
                              role="button"
                              tabIndex={0}
                              onClick={() => setAnalyzeUse(d.use || d)}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setAnalyzeUse(d.use || d); }}
                            >
                              <div>
                                <span className="text-[12px] font-medium text-stone-700">{d.use || d}</span>
                                {d.conditions && (
                                  <p className="text-[11px] text-amber-600">{d.conditions}</p>
                                )}
                              </div>
                              <span className="shrink-0 ml-2 text-[10px] text-indigo-400">Analyze →</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {eff.expanded_uses.conditional_residential?.length > 0 && (
                      <div className="border-t border-stone-100 pt-3">
                        <p className="mb-1.5 text-[12px] font-medium text-amber-600">
                          Conditional Residential ({eff.expanded_uses.conditional_residential.length})
                        </p>
                        <div className="space-y-1.5">
                          {eff.expanded_uses.conditional_residential.map((d: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 cursor-pointer transition-colors hover:bg-amber-100 hover:ring-1 hover:ring-indigo-300"
                              role="button"
                              tabIndex={0}
                              onClick={() => setAnalyzeUse(d.use || d)}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setAnalyzeUse(d.use || d); }}
                            >
                              <div>
                                <span className="text-[12px] font-medium text-stone-700">{d.use || d}</span>
                                {d.conditions && (
                                  <p className="text-[11px] text-amber-600">{d.conditions}</p>
                                )}
                              </div>
                              <span className="shrink-0 ml-2 text-[10px] text-indigo-400">Analyze →</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {eff.permitted_uses.map((u: string) => (
                      <Tag key={u} active>{u}</Tag>
                    ))}
                  </div>
                )}

                {/* Conditional uses (flat list fallback) */}
                {!eff.expanded_uses && eff.conditional_uses?.length > 0 && (
                  <div className="mt-4 border-t border-stone-100 pt-3">
                    <p className="mb-2 text-[12px] font-medium text-stone-500">
                      Conditional Uses
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {eff.conditional_uses.map((u: string) => (
                        <Tag key={u}>{u}</Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  PARKING                                                      */}
      {/* ============================================================ */}
      {(eff.parking || dev.parking_estimate) && (
        <>
          <SectionHeading
            id="parking"
            title="Parking Requirements"
            icon={Icons.car}
          />

          <div className="grid gap-4 md:grid-cols-2">
            {/* Parking Rates */}
            {eff.parking?.residential_rates && (
              <Card label="Residential Parking Rates" defaultOpen>
                <Row
                  label="Parking zone"
                  value={eff.parking?.parking_zone}
                />
                <div className="mt-2 space-y-1.5">
                  {Object.entries(eff.parking.residential_rates).map(
                    ([type, rate]: [string, any]) => (
                      <div
                        key={type}
                        className="flex items-baseline justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2"
                      >
                        <span className="text-[12px] font-medium text-stone-700">
                          {type}
                        </span>
                        <span className="text-right text-[12px] text-stone-500">
                          {rate.description || rate.requirement}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </Card>
            )}

            {/* Parking Estimates */}
            {dev.parking_estimate && (
              <Card label="Parking Estimate" defaultOpen>
                <Row
                  label="Est. units"
                  value={dev.parking_estimate.estimated_units}
                />
                <Row
                  label="Residential spaces"
                  value={dev.parking_estimate.residential_spaces}
                  sub={dev.parking_estimate.residential_note}
                />
                <Row
                  label="Visitor spaces"
                  value={dev.parking_estimate.visitor_spaces}
                  sub={dev.parking_estimate.visitor_note}
                />
              </Card>
            )}
          </div>

          {/* Parking Zone Note (when zone not determined) */}
          {eff.parking_zone_note && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-700">
              ⚠ {eff.parking_zone_note}
            </div>
          )}

          {/* Visitor Parking Formula */}
          {eff.parking?.visitor_parking && (
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                Visitor Parking Formula
              </p>
              <p className="font-mono text-[14px] font-medium text-stone-700">
                {eff.parking.visitor_parking.formula}
              </p>
              <p className="mt-1 text-[11px] text-stone-400">
                Rate type: {eff.parking.visitor_parking.rate_type} · Parking
                Zone {eff.parking.visitor_parking.parking_zone}
              </p>
            </div>
          )}

          {/* Parking Exemptions */}
          {(eff.parking?.exemptions ||
            dev.parking_estimate?.exemption_notes?.length > 0) && (
            <Card label="Parking Exemptions" defaultOpen={false}>
              {/* Structured exemptions from effective_standards */}
              {eff.parking?.exemptions &&
                Object.entries(eff.parking.exemptions).map(
                  ([key, exemption]: [string, any]) => (
                    <div key={key} className="mb-4 last:mb-0">
                      <p className="text-[13px] font-semibold text-stone-700">
                        <RefLink type="bylaw-section" id={exemption.section} label={`s. ${exemption.section}`}>
                          s. {exemption.section}
                        </RefLink>: {exemption.title}
                      </p>
                      {exemption.description && (
                        <p className="mt-1 text-[12px] leading-relaxed text-stone-500">
                          {exemption.description}
                        </p>
                      )}
                      {exemption.rules?.map((rule: any, i: number) => (
                        <div key={i} className="ml-3 mt-1.5">
                          <p className="text-[12px] text-stone-500">
                            <span className="font-medium text-stone-600">
                              {rule.rule.replace(/_/g, " ")}:
                            </span>{" "}
                            {rule.description}
                          </p>
                        </div>
                      ))}
                      {exemption.note && (
                        <p className="mt-1.5 text-[11px] italic text-stone-400">
                          {exemption.note}
                        </p>
                      )}
                    </div>
                  )
                )}

              {/* Fallback: summary exemption notes */}
              {!eff.parking?.exemptions &&
                dev.parking_estimate?.exemption_notes?.length > 0 && (
                  <ul className="space-y-2">
                    {dev.parking_estimate.exemption_notes.map(
                      (n: string, i: number) => (
                        <li
                          key={i}
                          className="text-[12px] leading-relaxed text-stone-500"
                        >
                          • {n}
                        </li>
                      )
                    )}
                  </ul>
                )}
            </Card>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  BICYCLE PARKING                                              */}
      {/* ============================================================ */}
      {dev.bicycle_parking?.applies && (
        <>
          <SectionHeading
            id="bicycle-parking"
            title="Bicycle Parking"
            icon={Icons.bike}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Bicycle Parking Requirements" defaultOpen>
              <Row
                label="Bicycle zone"
                value={`Zone ${dev.bicycle_parking.bicycle_zone}`}
              />
              <Row
                label="Est. dwelling units"
                value={dev.bicycle_parking.estimated_units}
              />
              <Row
                label="Long-term spaces"
                value={dev.bicycle_parking.long_term}
                sub={`${dev.bicycle_parking.rate_long_per_unit} per unit`}
              />
              <Row
                label="Short-term spaces"
                value={dev.bicycle_parking.short_term}
                sub={`${dev.bicycle_parking.rate_short_per_unit} per unit`}
              />
              <Row
                label="Total bicycle spaces"
                value={dev.bicycle_parking.total}
              />
              {dev.bicycle_parking.shower_change_sets > 0 && (
                <Row
                  label="Shower/change facilities"
                  value={`${dev.bicycle_parking.shower_change_sets} set(s) per gender`}
                />
              )}
              {dev.bicycle_parking.bylaw_ref && (
                <Row
                  label="By-law reference"
                  value={
                    <RefLink
                      type="bylaw-section"
                      id={dev.bicycle_parking.bylaw_ref}
                      label={`s. ${dev.bicycle_parking.bylaw_ref}`}
                    >
                      s. {dev.bicycle_parking.bylaw_ref}
                    </RefLink>
                  }
                />
              )}
            </Card>
          </div>

          {dev.bicycle_parking.exception_override && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-700">
              ⚠ Exception override: {dev.bicycle_parking.exception_override}
            </div>
          )}

          {dev.bicycle_parking.note && (
            <p className="text-[11px] italic text-stone-400">
              {dev.bicycle_parking.note}
            </p>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  LOADING SPACE                                                */}
      {/* ============================================================ */}
      {dev.loading_space && (
        <>
          <SectionHeading
            id="loading"
            title="Loading Space"
            icon={Icons.truck}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Loading Requirements" defaultOpen>
              <Row
                label="Est. dwelling units"
                value={dev.loading_space.estimated_units}
              />
              <Row
                label="Required"
                value={dev.loading_space.applies ? "Yes" : "No"}
              />
              {dev.loading_space.required_spaces?.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {dev.loading_space.required_spaces.map(
                    (space: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-baseline justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2"
                      >
                        <span className="text-[12px] font-medium text-stone-700">
                          {space.count}× Type &ldquo;{space.type}&rdquo;
                        </span>
                        <span className="text-right text-[12px] text-stone-500">
                          {space.length_m}m × {space.width_m}m
                          {space.clearance_m
                            ? `, ${space.clearance_m}m clearance`
                            : ""}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
              {dev.loading_space.bylaw_ref && (
                <Row
                  label="By-law reference"
                  value={
                    <RefLink
                      type="bylaw-section"
                      id={dev.loading_space.bylaw_ref}
                      label={`s. ${dev.loading_space.bylaw_ref}`}
                    >
                      s. {dev.loading_space.bylaw_ref}
                    </RefLink>
                  }
                />
              )}
            </Card>
          </div>

          {dev.loading_space.exception_override && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-700">
              ⚠ Exception override: {dev.loading_space.exception_override}
            </div>
          )}

          {dev.loading_space.note && (
            <p className="text-[11px] italic text-stone-400">
              {dev.loading_space.note}
            </p>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  AMENITY SPACE                                                */}
      {/* ============================================================ */}
      {dev.amenity_space?.applies && (
        <>
          <SectionHeading
            id="amenity"
            title="Amenity Space"
            icon={Icons.sparkle}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Amenity Space Requirements" defaultOpen>
              <Row
                label="Est. dwelling units"
                value={dev.amenity_space.estimated_units}
              />
              <Row
                label="Threshold"
                value={`≥ ${dev.amenity_space.threshold_units} units`}
              />
              <Row
                label="Total required"
                value={`${dev.amenity_space.total_required_sqm} m²`}
              />
              <Row
                label="Indoor required"
                value={`${dev.amenity_space.indoor_required_sqm} m²`}
              />
              <Row
                label="Outdoor required"
                value={`${dev.amenity_space.outdoor_required_sqm} m²`}
                sub={`Min ${dev.amenity_space.outdoor_min_sqm} m²`}
              />
              <Row
                label="Green roof allowance"
                value={`Up to ${dev.amenity_space.green_roof_max_sqm} m² (${dev.amenity_space.green_roof_max_pct}%)`}
              />
              {dev.amenity_space.bylaw_ref && (
                <Row
                  label="By-law reference"
                  value={
                    <RefLink
                      type="bylaw-section"
                      id={dev.amenity_space.bylaw_ref}
                      label={`s. ${dev.amenity_space.bylaw_ref}`}
                    >
                      s. {dev.amenity_space.bylaw_ref}
                    </RefLink>
                  }
                />
              )}
            </Card>
          </div>

          {dev.amenity_space.exception_override && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-700">
              ⚠ Exception override: {dev.amenity_space.exception_override}
            </div>
          )}

          {dev.amenity_space.note && (
            <p className="text-[11px] italic text-stone-400">
              {dev.amenity_space.note}
            </p>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  ANGULAR PLANE                                                */}
      {/* ============================================================ */}
      {dev.angular_plane?.applies && (
        <>
          <SectionHeading
            id="angular-plane"
            title="Angular Plane"
            icon={Icons.angle}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Angular Plane Analysis" defaultOpen>
              <Row
                label="Angle"
                value={`${dev.angular_plane.angle_degrees}°`}
              />
              {dev.angular_plane.zone_section && (
                <Row
                  label="By-law section"
                  value={
                    <RefLink
                      type="bylaw-section"
                      id={dev.angular_plane.zone_section}
                      label={`s. ${dev.angular_plane.zone_section}`}
                    >
                      s. {dev.angular_plane.zone_section}
                    </RefLink>
                  }
                />
              )}
              {dev.angular_plane.constrains_envelope != null && (
                <Row
                  label="Constrains envelope"
                  value={dev.angular_plane.constrains_envelope ? "Yes" : "No"}
                />
              )}
              {dev.angular_plane.binding_constraint && (
                <Row
                  label="Binding constraint"
                  value={dev.angular_plane.binding_constraint}
                />
              )}
            </Card>

            {dev.angular_plane.height_limits && (
              <Card label="Height Limits from Angular Plane" defaultOpen>
                {Object.entries(dev.angular_plane.height_limits).map(
                  ([location, limit]: [string, any]) => (
                    <Row
                      key={location}
                      label={location.replace(/_/g, " ")}
                      value={
                        typeof limit === "number"
                          ? `${limit}m`
                          : limit != null
                          ? String(limit)
                          : "N/A"
                      }
                    />
                  )
                )}
              </Card>
            )}
          </div>

          {dev.angular_plane.rules?.length > 0 && (
            <Card label="Angular Plane Rules" defaultOpen={false}>
              {dev.angular_plane.rules.map((rule: any, i: number) => (
                <div key={i} className="mb-3 last:mb-0">
                  <p className="text-[12px] font-medium text-stone-700">
                    {rule.type?.replace(/_/g, " ")}
                    {rule.lot_class ? ` (${rule.lot_class} lot)` : ""}
                  </p>
                  {rule.start_height_m != null && (
                    <p className="text-[12px] text-stone-500">
                      Starts at {rule.start_height_m}m
                      {rule.height_at_rear_setback_m
                        ? `, max ${rule.height_at_rear_setback_m}m at rear setback`
                        : ""}
                      {rule.height_at_front_setback_m
                        ? `, max ${rule.height_at_front_setback_m}m at front setback`
                        : ""}
                    </p>
                  )}
                  {rule.note && (
                    <p className="mt-1 text-[11px] italic text-stone-400">
                      {rule.note}
                    </p>
                  )}
                </div>
              ))}
            </Card>
          )}

          {dev.angular_plane.rear_assumed && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-700">
              ⚠ Assumed lot abuts residential/open-space zone (conservative default). Provide adjacency data for a precise analysis.
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  SHADOW ANALYSIS                                              */}
      {/* ============================================================ */}
      {dev.shadow_analysis?.nearest_park_name && (
        <>
          <SectionHeading
            id="shadow"
            title="Shadow Analysis"
            icon={Icons.sun}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Nearest Park Shadow Impact" defaultOpen>
              <Row
                label="Nearest park"
                value={dev.shadow_analysis.nearest_park_name}
              />
              <Row
                label="Distance"
                value={
                  dev.shadow_analysis.nearest_park_distance_m != null
                    ? `${dev.shadow_analysis.nearest_park_distance_m}m`
                    : "—"
                }
              />
              {dev.shadow_analysis.nearest_park_class && (
                <Row
                  label="Park class"
                  value={dev.shadow_analysis.nearest_park_class}
                />
              )}
              {dev.shadow_analysis.shadow_equinox_m != null && (
                <Row
                  label="Shadow (Sep 21 noon)"
                  value={`${dev.shadow_analysis.shadow_equinox_m}m`}
                  sub={
                    dev.shadow_analysis.shadow_reaches_park_equinox
                      ? "⚠ Reaches park"
                      : "Does not reach park"
                  }
                />
              )}
              {dev.shadow_analysis.shadow_equinox_918am_m != null && (
                <Row
                  label="Shadow (Sep 21 9:18AM)"
                  value={`${dev.shadow_analysis.shadow_equinox_918am_m}m`}
                />
              )}
              {dev.shadow_analysis.shadow_winter_solstice_m != null && (
                <Row
                  label="Shadow (winter solstice noon)"
                  value={`${dev.shadow_analysis.shadow_winter_solstice_m}m`}
                  sub={
                    dev.shadow_analysis.shadow_reaches_park_winter
                      ? "⚠ Reaches park"
                      : "Does not reach park"
                  }
                />
              )}
              {dev.shadow_analysis.constraint_severity && (
                <Row
                  label="Constraint severity"
                  value={
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        dev.shadow_analysis.constraint_severity === "high"
                          ? "bg-red-100 text-red-700"
                          : dev.shadow_analysis.constraint_severity === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {dev.shadow_analysis.constraint_severity}
                    </span>
                  }
                />
              )}
            </Card>
          </div>

          {dev.shadow_analysis.summary_text && (
            <p className="text-[11px] italic text-stone-400">
              {dev.shadow_analysis.summary_text}
            </p>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  INCLUSIONARY ZONING                                          */}
      {/* ============================================================ */}
      {dev.inclusionary_zoning?.applies && (
        <>
          <SectionHeading
            id="inclusionary-zoning"
            title="Inclusionary Zoning"
            icon={Icons.home}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Inclusionary Zoning Requirements" defaultOpen>
              <Row label="IZ area" value={dev.inclusionary_zoning.iz_area} />
              <Row label="Tenure" value={dev.inclusionary_zoning.tenure} />
              <Row
                label="Base rate"
                value={`${dev.inclusionary_zoning.base_rate_pct}%`}
              />
              {dev.inclusionary_zoning.phase_increase_pct > 0 && (
                <Row
                  label="Phasing increase"
                  value={`+${dev.inclusionary_zoning.phase_increase_pct}%`}
                />
              )}
              <Row
                label="Effective rate"
                value={`${dev.inclusionary_zoning.effective_rate_pct}%`}
              />
              {dev.inclusionary_zoning.exempt ? (
                <Row
                  label="Status"
                  value={
                    <span className="text-green-600 font-medium">Exempt</span>
                  }
                  sub={dev.inclusionary_zoning.exempt_reason}
                />
              ) : (
                <>
                  {dev.inclusionary_zoning.required_affordable_gfa_sqm !=
                    null && (
                    <Row
                      label="Required affordable GFA"
                      value={`${dev.inclusionary_zoning.required_affordable_gfa_sqm.toLocaleString()} m²`}
                    />
                  )}
                  {dev.inclusionary_zoning.required_affordable_units !=
                    null && (
                    <Row
                      label="Est. affordable units"
                      value={dev.inclusionary_zoning.required_affordable_units}
                    />
                  )}
                </>
              )}
              {dev.inclusionary_zoning.affordability_period_years && (
                <Row
                  label="Affordability period"
                  value={`${dev.inclusionary_zoning.affordability_period_years} years`}
                />
              )}
            </Card>
          </div>

          {dev.inclusionary_zoning.phasing_note && (
            <p className="text-[11px] italic text-stone-400">
              {dev.inclusionary_zoning.phasing_note}
            </p>
          )}

          {dev.inclusionary_zoning.parking_note && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[12px] text-emerald-700">
              {dev.inclusionary_zoning.parking_note}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  COA PRECEDENTS                                               */}
      {/* ============================================================ */}
      {dev.coa_precedents?.total_matches > 0 && (
        <>
          <SectionHeading
            id="coa"
            title="Committee of Adjustment Precedents"
            icon={Icons.gavel}
            count={dev.coa_precedents.total_matches}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Application Statistics" defaultOpen>
              <Row
                label="Total applications"
                value={dev.coa_precedents.total_matches}
              />
              <Row
                label="Approval rate"
                value={`${dev.coa_precedents.approval_rate}%`}
              />
              {dev.coa_precedents.same_zone_count > 0 && (
                <>
                  <Row
                    label="Same zone applications"
                    value={dev.coa_precedents.same_zone_count}
                  />
                  {dev.coa_precedents.same_zone_approval_rate != null && (
                    <Row
                      label="Same zone approval rate"
                      value={`${dev.coa_precedents.same_zone_approval_rate}%`}
                    />
                  )}
                </>
              )}
              {dev.coa_precedents.common_sub_types?.length > 0 && (
                <Row
                  label="Common sub-types"
                  value={dev.coa_precedents.common_sub_types
                    .map((s: [string, number]) => `${s[0]} (${s[1]})`)
                    .join(", ")}
                />
              )}
              {dev.coa_precedents.common_work_types?.length > 0 && (
                <Row
                  label="Common work types"
                  value={dev.coa_precedents.common_work_types
                    .map((s: [string, number]) => `${s[0]} (${s[1]})`)
                    .join(", ")}
                />
              )}
            </Card>
          </div>

          {dev.coa_precedents.samples?.length > 0 && (
            <Card label="Recent Applications" defaultOpen={false}>
              <div className="space-y-3">
                {dev.coa_precedents.samples.map((s: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-lg border border-stone-100 bg-stone-50 p-3"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[12px] font-medium text-stone-700">
                        {s.address}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          s.decision?.toLowerCase().startsWith("approv")
                            ? "bg-green-100 text-green-700"
                            : s.decision?.toLowerCase().startsWith("refus")
                            ? "bg-red-100 text-red-700"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {s.decision}
                      </span>
                    </div>
                    {s.reference && (
                      <p className="text-[11px] text-stone-400">
                        Ref: {s.reference}
                        {s.hearing_date ? ` · ${s.hearing_date}` : ""}
                      </p>
                    )}
                    {s.sub_type && (
                      <p className="text-[11px] text-stone-500">
                        {s.sub_type}
                        {s.work_type ? ` — ${s.work_type}` : ""}
                      </p>
                    )}
                    {s.description && (
                      <p className="mt-1 text-[11px] leading-relaxed text-stone-400">
                        {s.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {dev.coa_precedents.summary_text && (
            <p className="text-[11px] italic text-stone-400">
              {dev.coa_precedents.summary_text}
            </p>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  OVERLAYS                                                     */}
      {/* ============================================================ */}
      <SectionHeading
        id="overlays"
        title="Overlays & Layers"
        icon={Icons.layers}
        count={activeOverlays.length}
      />

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        {activeOverlays.length > 0 && (
          <div className="mb-5">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-emerald-600">
              Active ({activeOverlays.length})
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {activeOverlays.map((o) => (
                <div
                  key={o.key}
                  className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3"
                >
                  <span className="mt-0.5 text-[16px]">{o.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-stone-700">
                      {o.label}
                    </p>
                    {o.detail && (
                      <p className="font-mono text-[12px] text-emerald-600">
                        {o.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {inactiveOverlays.length > 0 && (
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
              Not Applicable ({inactiveOverlays.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {inactiveOverlays.map((o) => (
                <span
                  key={o.key}
                  className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-1.5 text-[12px] text-stone-300"
                >
                  {o.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  NATURAL HAZARDS (Tier 3)                                     */}
      {/* ============================================================ */}
      {eff.natural_hazards?.has_hazards && (
        <>
          <SectionHeading
            id="hazards"
            title="Natural Hazard Constraints"
            icon={Icons.tree}
            count={eff.natural_hazards.hazard_count}
          />

          {/* Summary banner */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-[13px] font-medium leading-relaxed text-red-700">
              {eff.natural_hazards.summary}
            </p>
            {eff.natural_hazards.combined_setback_m && (
              <p className="mt-2 text-[12px] text-red-600">
                Combined maximum setback: <span className="font-bold">{eff.natural_hazards.combined_setback_m}m</span>
              </p>
            )}
          </div>

          {/* Hazard cards */}
          <div className="grid gap-4 md:grid-cols-1">
            {eff.natural_hazards.hazards.map((h: any, i: number) => {
              const sevColor = h.severity === "high"
                ? "border-red-200 bg-red-50/30"
                : h.severity === "medium"
                ? "border-amber-200 bg-amber-50/30"
                : "border-stone-200 bg-stone-50/30";
              const sevBadge = h.severity === "high" ? "danger" : h.severity === "medium" ? "warning" : "default";
              return (
                <div key={i} className={`rounded-xl border p-5 shadow-sm ${sevColor}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={sevBadge as any}>{h.severity?.toUpperCase()}</Badge>
                    <span className="text-[14px] font-semibold text-stone-800">{h.label}</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 mb-3">
                    <div className="rounded-lg border border-stone-200 bg-white p-3">
                      <p className="text-[22px] font-bold text-stone-900">{h.setback_m}m</p>
                      <p className="text-[12px] text-stone-500">setback {h.setback_label}</p>
                    </div>
                    {h.tree_protection_m && (
                      <div className="rounded-lg border border-stone-200 bg-white p-3">
                        <p className="text-[22px] font-bold text-stone-900">{h.tree_protection_m}m</p>
                        <p className="text-[12px] text-stone-500">tree protection zone</p>
                      </div>
                    )}
                    {h.reduced_setback_m && (
                      <div className="rounded-lg border border-stone-200 bg-white p-3">
                        <p className="text-[22px] font-bold text-amber-600">{h.reduced_setback_m}m</p>
                        <p className="text-[12px] text-stone-500">reduced setback (urban area)</p>
                      </div>
                    )}
                  </div>

                  {/* Rules */}
                  {h.rules?.length > 0 && (
                    <Card label="Rules & Restrictions" defaultOpen={false}>
                      <ul className="space-y-1.5">
                        {h.rules.map((r: string, ri: number) => (
                          <li key={ri} className="flex items-start gap-2 text-[12px] leading-relaxed text-stone-600">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                      {h.restrictions?.length > 0 && (
                        <div className="mt-3 border-t border-stone-100 pt-3">
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-red-500">
                            Restrictions
                          </p>
                          <ul className="space-y-1.5">
                            {h.restrictions.map((r: string, ri: number) => (
                              <li key={ri} className="flex items-start gap-2 text-[12px] leading-relaxed text-red-600">
                                <span className="mt-0.5 text-red-400">✕</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              );
            })}
          </div>

          {/* Permits & Studies required */}
          {(eff.natural_hazards.permits_required?.length > 0 ||
            eff.natural_hazards.studies_required?.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {eff.natural_hazards.permits_required?.length > 0 && (
                <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-red-500">
                    Permits Required
                  </p>
                  <ul className="space-y-2">
                    {eff.natural_hazards.permits_required.map((p: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-stone-600">
                        <span className="mt-0.5 text-red-500">📋</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {eff.natural_hazards.studies_required?.length > 0 && (
                <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-amber-500">
                    Studies Required
                  </p>
                  <ul className="space-y-2">
                    {eff.natural_hazards.studies_required.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-stone-600">
                        <span className="mt-0.5 text-amber-500">📄</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  HERITAGE IMPACT (Tier 3)                                     */}
      {/* ============================================================ */}
      {eff.heritage_impact?.has_heritage && (
        <>
          <SectionHeading
            id="heritage"
            title="Heritage Constraints"
            icon={Icons.landmark}
            count={eff.heritage_impact.item_count}
          />

          {/* Combined impact banner */}
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <p className="text-[13px] font-medium leading-relaxed text-violet-700">
              {eff.heritage_impact.combined_impact}
            </p>
          </div>

          {/* Heritage items */}
          <div className="grid gap-4 md:grid-cols-1">
            {eff.heritage_impact.items.map((item: any, i: number) => (
              <div key={i} className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm">
                {item.type === "heritage_register" && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={item.protection_level === "designated" ? "danger" : "warning"}>
                        {item.protection_level === "designated" ? "DESIGNATED" : "LISTED"}
                      </Badge>
                      <span className="text-[14px] font-semibold text-stone-800">
                        Heritage Register
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-stone-600 mb-3">
                      {item.level_description}
                    </p>
                    <p className="text-[12px] leading-relaxed text-stone-500">
                      {item.impact}
                    </p>
                    {item.description && (
                      <div className="mt-3 rounded-lg bg-stone-50 p-3">
                        <p className="text-[12px] text-stone-500">{item.description}</p>
                      </div>
                    )}
                    {item.construction_date && (
                      <p className="mt-2 text-[11px] text-stone-400">
                        Construction date: {item.construction_date}
                      </p>
                    )}
                  </>
                )}

                {item.type === "heritage_conservation_district" && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="info">HCD</Badge>
                      <span className="text-[14px] font-semibold text-stone-800">
                        {item.hcd_name}
                      </span>
                      {item.bylaw && item.plan_url ? (
                        <a
                          href={item.plan_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-violet-500 underline decoration-dotted underline-offset-2 hover:text-violet-700"
                        >
                          By-law {item.bylaw} ↗
                        </a>
                      ) : item.bylaw ? (
                        <span className="text-[11px] text-stone-400">By-law {item.bylaw}</span>
                      ) : null}
                    </div>
                    <p className="mb-2 text-[11px] font-medium text-violet-500">
                      {item.status_note}
                    </p>

                    {item.character_statement && (
                      <p className="mb-3 text-[12px] italic leading-relaxed text-stone-500">
                        &ldquo;{item.character_statement}&rdquo;
                      </p>
                    )}

                    <p className="text-[12px] leading-relaxed text-stone-500 mb-3">
                      {item.impact}
                    </p>

                    {/* Key metrics */}
                    <div className="grid gap-3 sm:grid-cols-3 mb-3">
                      {item.max_storeys_guideline && (
                        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                          <p className="text-[18px] font-bold text-stone-900">{item.max_storeys_guideline}</p>
                          <p className="text-[12px] text-stone-500">max storeys (guideline)</p>
                          {item.max_storeys_note && (
                            <p className="text-[10px] text-stone-400 mt-0.5">{item.max_storeys_note}</p>
                          )}
                        </div>
                      )}
                      {item.streetwall_height_m && (
                        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                          <p className="text-[18px] font-bold text-stone-900">{item.streetwall_height_m}m</p>
                          <p className="text-[12px] text-stone-500">street wall height</p>
                        </div>
                      )}
                    </div>

                    {/* Materials */}
                    {(item.permitted_materials?.length > 0 || item.prohibited_materials?.length > 0) && (
                      <div className="grid gap-3 sm:grid-cols-2 mb-3">
                        {item.permitted_materials?.length > 0 && (
                          <div>
                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-500">Permitted Materials</p>
                            <div className="flex flex-wrap gap-1.5">
                              {item.permitted_materials.map((m: string) => (
                                <span key={m} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-100">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {item.prohibited_materials?.length > 0 && (
                          <div>
                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-red-500">Prohibited Materials</p>
                            <div className="flex flex-wrap gap-1.5">
                              {item.prohibited_materials.map((m: string) => (
                                <span key={m} className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 border border-red-100">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Design Guidelines */}
                    {item.design_guidelines?.length > 0 && (
                      <Card label="Design Guidelines" defaultOpen={false}>
                        <ul className="space-y-1.5">
                          {item.design_guidelines.map((g: string, gi: number) => (
                            <li key={gi} className="flex items-start gap-2 text-[12px] leading-relaxed text-stone-600">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {item.plan_url && (
                      <a
                        href={item.plan_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-[11px] text-violet-600 underline hover:text-violet-800"
                      >
                        View HCD Plan document ↗
                      </a>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Heritage Permits & Studies */}
          {(eff.heritage_impact.permits_required?.length > 0 ||
            eff.heritage_impact.studies_required?.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {eff.heritage_impact.permits_required?.length > 0 && (
                <div className="rounded-xl border border-violet-100 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-violet-500">
                    Heritage Permits Required
                  </p>
                  <ul className="space-y-2">
                    {eff.heritage_impact.permits_required.map((p: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-stone-600">
                        <span className="mt-0.5 text-violet-500">📋</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {eff.heritage_impact.studies_required?.length > 0 && (
                <div className="rounded-xl border border-violet-100 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-violet-500">
                    Studies Required
                  </p>
                  <ul className="space-y-2">
                    {eff.heritage_impact.studies_required.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-stone-600">
                        <span className="mt-0.5 text-violet-500">📄</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  OVERLAY DISTRICT RULES (Chapter 600)                         */}
      {/* ============================================================ */}
      {eff.overlay_rules && Object.values(eff.overlay_rules).some((r: any) => r?.applies) && (
        <>
          <SectionHeading
            id="overlay-rules"
            title="Overlay District Rules"
            icon={Icons.layers}
          />

          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(eff.overlay_rules).map(([key, rule]: [string, any]) => {
              if (!rule?.applies) return null;
              return (
                <div
                  key={key}
                  className="rounded-xl border border-sky-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    {rule.chapter ? (
                      <RefLink type="bylaw-section" id={rule.chapter.replace(/^Ch\.?\s*/i, "")} label={rule.chapter}>
                        <Badge variant="info">{rule.chapter}</Badge>
                      </RefLink>
                    ) : (
                      <Badge variant="info">Ch. 600</Badge>
                    )}
                    <span className="text-[13px] font-semibold text-stone-800">
                      {rule.name || key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  </div>
                  {/* Building Setback overlay */}
                  {key === "building_setback" && (
                    <div className="space-y-1.5">
                      {rule.tower_separation_m && (
                        <Row label="Tower separation" value={`${rule.tower_separation_m} m`} sub={`Above ${rule.tower_height_threshold_m || "?"} m`} />
                      )}
                      {rule.min_setback_above_m && (
                        <Row label="Min setback above podium" value={`${rule.min_setback_above_m} m`} />
                      )}
                    </div>
                  )}
                  {/* Priority Retail overlay */}
                  {key === "priority_retail" && (
                    <div className="space-y-1.5">
                      {rule.min_retail_frontage_pct && (
                        <Row label="Min retail frontage" value={`${rule.min_retail_frontage_pct}%`} />
                      )}
                      {rule.min_window_pct && (
                        <Row label="Min ground floor windows" value={`${rule.min_window_pct}%`} />
                      )}
                      {rule.min_floor_to_ceiling_m && (
                        <Row label="Min floor-to-ceiling" value={`${rule.min_floor_to_ceiling_m} m`} />
                      )}
                    </div>
                  )}
                  {/* Inclusionary Zoning overlay */}
                  {key === "inclusionary_zoning" && (
                    <div className="space-y-1.5">
                      {rule.affordable_pct && (
                        <Row label="Affordable housing req." value={`${rule.affordable_pct}%`} />
                      )}
                      {rule.threshold_units && (
                        <Row label="Threshold" value={`${rule.threshold_units} units`} />
                      )}
                    </div>
                  )}
                  {/* Queen St W Community overlay */}
                  {key === "queen_st_w_community" && (
                    <div className="space-y-1.5">
                      {rule.max_eating_establishment_area_sqm && (
                        <Row label="Max eating establishment" value={`${rule.max_eating_establishment_area_sqm} m²`} />
                      )}
                      {rule.entertainment_prohibited && (
                        <p className="text-[12px] text-red-600 font-medium">Entertainment prohibited</p>
                      )}
                    </div>
                  )}
                  {/* Generic fallback for unknown overlay rule types */}
                  {!["building_setback", "priority_retail", "inclusionary_zoning", "queen_st_w_community"].includes(key) && (
                    <div className="space-y-1.5">
                      {Object.entries(rule).filter(([k]) => k !== "applies" && k !== "name" && k !== "chapter").map(([k, v]: [string, any]) => (
                        <Row key={k} label={k.replace(/_/g, " ")} value={String(v)} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  STEPBACK / TOWER PLATE RULES                                 */}
      {/* ============================================================ */}
      {eff.stepback_rules && (
        <>
          <SectionHeading
            id="stepback"
            title="Stepback & Tower Rules"
            icon={Icons.building}
          />

          <div className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-violet-400">
              From Exception Text
            </p>
            <div className="space-y-3">
              {eff.stepback_rules.stepbacks?.length > 0 && (
                <div>
                  <p className="mb-2 text-[12px] font-medium text-stone-600">
                    Required Stepbacks
                  </p>
                  <div className="space-y-2">
                    {eff.stepback_rules.stepbacks.map((sb: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-violet-50 px-3 py-2">
                        <span className="text-[18px] font-bold text-violet-600">
                          {sb.depth_m}m
                        </span>
                        <div>
                          <p className="text-[12px] font-medium text-stone-700">
                            Stepback depth
                          </p>
                          <p className="text-[11px] text-stone-400">
                            Above {sb.above_height_m} m height
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {eff.stepback_rules.podium_transition_height_m && (
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-[18px] font-bold text-stone-900">
                      {eff.stepback_rules.podium_transition_height_m} m
                    </p>
                    <p className="text-[12px] text-stone-500">Podium Transition Height</p>
                  </div>
                )}
                {eff.stepback_rules.podium_max_height_m && (
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-[18px] font-bold text-stone-900">
                      {eff.stepback_rules.podium_max_height_m} m
                    </p>
                    <p className="text-[12px] text-stone-500">Max Podium Height</p>
                  </div>
                )}
                {eff.stepback_rules.tower_floorplate_max_sqm && (
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-[18px] font-bold text-stone-900">
                      {eff.stepback_rules.tower_floorplate_max_sqm} m²
                    </p>
                    <p className="text-[12px] text-stone-500">Max Tower Floor Plate</p>
                  </div>
                )}
                {eff.stepback_rules.tower_separation_m && (
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-[18px] font-bold text-stone-900">
                      {eff.stepback_rules.tower_separation_m} m
                    </p>
                    <p className="text-[12px] text-stone-500">Min Tower Separation</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  OFFICIAL PLAN CONTEXT                                        */}
      {/* ============================================================ */}
      {opContext && (
        <>
          <SectionHeading
            id="op-context"
            title="Official Plan Context"
            icon={Icons.map}
          />

          {/* OP Designation */}
          {opDesignation && (
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div>
                <RefLink type="op-designation" id={zoneCode || ""} label={opDesignation.designation}>
                  <Badge variant="info">
                    {opDesignation.section
                      ? `OP s.${opDesignation.section}`
                      : "Official Plan"}
                  </Badge>
                </RefLink>
                <h4 className="mt-2 text-[17px] font-bold text-stone-900">
                  {opDesignation.designation}
                </h4>
                {opDesignation.description && (
                  <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
                    {opDesignation.description}
                  </p>
                )}
              </div>

              {/* Policy highlights */}
              {opDesignation.policy_highlights?.length > 0 && (
                <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-4">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-sky-600">
                    Key Policies
                  </p>
                  <ul className="space-y-1.5">
                    {opDesignation.policy_highlights.map(
                      (h: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-[12px] leading-relaxed text-sky-700"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-400" />
                          <span>{h}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Secondary Plan & MTSA */}
          {(opContext.secondary_plan || opContext.mtsa) && (
            <div className="grid gap-4 md:grid-cols-2">
              {opContext.secondary_plan && (
                <Card label="Secondary Plan">
                  <Row
                    label="Plan name"
                    value={opContext.secondary_plan.plan_name}
                  />
                  <Row
                    label="Plan number"
                    value={opContext.secondary_plan.plan_number}
                  />
                </Card>
              )}
              {opContext.mtsa && (
                <Card label="Major Transit Station Area">
                  <Row
                    label="Station"
                    value={opContext.mtsa.station_name}
                  />
                  <Row label="Type" value={opContext.mtsa.mtsa_type} />
                </Card>
              )}
            </div>
          )}

          {/* SASP Policies */}
          {saspPolicies.length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                Site & Area Specific Policies
                <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
                  {saspPolicies.length}
                </span>
              </p>
              <div className="space-y-3">
                {saspPolicies.map((sasp: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-lg border border-amber-100 bg-amber-50/50 p-4"
                  >
                    <p className="text-[13px] font-semibold text-stone-800">
                      <RefLink type="sasp" id={String(sasp.sasp_number)} label={`SASP #${sasp.sasp_number}${sasp.title ? ` — ${sasp.title}` : ""}`}>
                        SASP #{sasp.sasp_number}
                      </RefLink>
                    </p>
                    {sasp.title && (
                      <p className="mt-0.5 text-[12px] font-medium text-stone-600">
                        {sasp.title}
                      </p>
                    )}
                    {sasp.content && (
                      <p className="mt-2 text-[12px] leading-relaxed text-stone-500">
                        {sasp.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  EXCEPTION DETAILS                                            */}
      {/* ============================================================ */}
      {eff.exception && eff.exception.exception_number && (
        <>
          <SectionHeading
            id="exception"
            title={`Exception #${eff.exception.exception_number}`}
            icon={Icons.doc}
          />

          <ExceptionDetail exception={eff.exception} exceptionDiff={eff.exception_diff} />

          {/* Prevailing By-law Interpretation (Tier 3) */}
          {eff.exception.interpreted_prevailing?.length > 0 && (
            <div className="mt-4">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                Prevailing By-law Interpretation
              </p>
              <div className="space-y-4">
                {eff.exception.interpreted_prevailing.map((entry: any, idx: number) => {
                  const interp = entry.interpretation || {};

                  if (interp.status === "none_apply") {
                    return (
                      <div key={idx} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                        <p className="text-[13px] font-medium text-stone-500">
                          {entry.letter && <span className="mr-1 text-stone-400">({entry.letter})</span>}
                          No prevailing by-law provisions override 569-2013 for this property.
                        </p>
                      </div>
                    );
                  }

                  const bylawLabel = entry.prevailing_bylaw
                    ? `By-law ${entry.prevailing_bylaw.number}${entry.prevailing_bylaw.municipality ? ` (${entry.prevailing_bylaw.municipality})` : ""}`
                    : interp.bylaw_id || "Unknown";

                  return (
                    <div key={idx} className="rounded-xl border border-sky-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        {entry.letter && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
                            {entry.letter}
                          </span>
                        )}
                        <span className="text-[14px] font-semibold text-stone-800">{bylawLabel}</span>
                        {interp.fully_interpreted ? (
                          <Badge variant="success">Fully Interpreted</Badge>
                        ) : interp.interpretations?.some((i: any) => i.interpreted) ? (
                          <Badge variant="warning">Partially Interpreted</Badge>
                        ) : (
                          <Badge variant="default">Not Indexed</Badge>
                        )}
                      </div>

                      {interp.summary && (
                        <p className="mb-3 text-[12px] leading-relaxed text-stone-500">
                          {interp.summary}
                        </p>
                      )}

                      {/* Section interpretations */}
                      {interp.interpretations?.length > 0 && (
                        <Card label={`Section Interpretations (${interp.section_count})`} defaultOpen={false}>
                          <div className="space-y-3">
                            {interp.interpretations.map((si: any, si_idx: number) => (
                              <div key={si_idx} className={`rounded-lg p-3 ${si.interpreted ? "bg-sky-50 border border-sky-100" : "bg-stone-50 border border-stone-100"}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  {si.section_ref ? (
                                    <RefLink type="bylaw-section" id={si.section_ref} label={`s. ${si.section_ref}`}>
                                      <span className="text-[12px] font-medium text-sky-700 underline decoration-dotted cursor-pointer hover:text-sky-900 transition-colors">
                                        {si.section_ref}
                                      </span>
                                    </RefLink>
                                  ) : (
                                    <span className="text-[12px] font-medium text-stone-700">
                                      Section {si_idx + 1}
                                    </span>
                                  )}
                                  {si.interpreted && si.category && (
                                    <Badge variant="info">{si.category}</Badge>
                                  )}
                                </div>
                                {si.interpreted && si.summary && (
                                  <p className="text-[12px] leading-relaxed text-sky-700">{si.summary}</p>
                                )}
                                {si.interpreted && si.typical_provisions && (
                                  <p className="mt-1 text-[11px] text-stone-400">
                                    Typical: {si.typical_provisions}
                                  </p>
                                )}
                                {!si.interpreted && si.note && (
                                  <p className="text-[12px] text-stone-400">{si.note}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* Merged standards */}
                      {interp.merged_standards && Object.keys(interp.merged_standards).length > 0 && (
                        <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                            Interpreted Standards
                          </p>
                          <div className="space-y-1">
                            {Object.entries(interp.merged_standards).map(([key, val]: [string, any]) => (
                              <Row key={key} label={key.replace(/_/g, " ")} value={String(val)} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  DEVELOPMENT CHARGES                                          */}
      {/* ============================================================ */}
      {dev.development_charges && (
        <>
          <SectionHeading
            id="charges"
            title="Development Charges"
            icon={Icons.dollar}
          />

          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            {dev.development_charges.estimates?.length > 0 && (
              <div className="space-y-2">
                {dev.development_charges.estimates.map(
                  (est: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-baseline justify-between rounded-lg bg-stone-50 px-4 py-3"
                    >
                      <div>
                        <span className="text-[13px] font-medium text-stone-700">
                          {est.category}
                        </span>
                        <p className="text-[11px] text-stone-400">
                          {est.units} unit{est.units !== 1 ? "s" : ""} × $
                          {Number(est.rate_per_unit).toLocaleString()}/unit
                        </p>
                      </div>
                      <span className="font-mono text-[15px] font-bold text-stone-900">
                        ${Number(est.total).toLocaleString()}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}

            {dev.development_charges.total_estimated && (
              <div className="mt-3 flex items-baseline justify-between border-t border-stone-200 pt-3">
                <span className="text-[14px] font-semibold text-stone-700">
                  Total Estimated
                </span>
                <span className="font-mono text-[22px] font-bold text-stone-900">
                  ${Number(dev.development_charges.total_estimated).toLocaleString()}
                </span>
              </div>
            )}

            {dev.development_charges.note && (
              <p className="mt-3 rounded-lg bg-stone-50 p-3 text-[11px] leading-relaxed text-stone-400">
                {dev.development_charges.note}
              </p>
            )}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  PLANNING CONTACT                                             */}
      {/* ============================================================ */}
      {data.planning_contact && (
        <>
          <SectionHeading
            id="contact"
            title="Planning Contact"
            icon={Icons.phone}
          />

          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-[11px] uppercase tracking-wide text-stone-400">
              Administrative — not regulatory
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-stone-50 p-4">
                <p className="text-[15px] font-semibold text-stone-900">
                  {data.planning_contact.MANAGER}
                </p>
                <p className="mt-1 text-[12px] text-stone-500">
                  {data.planning_contact.SECTION} ·{" "}
                  {data.planning_contact.DISTRICT}
                </p>
              </div>
              <div className="space-y-2 rounded-lg bg-stone-50 p-4">
                {data.planning_contact.PHONE && (
                  <p className="text-[13px] text-stone-600">
                    📞{" "}
                    <a
                      href={`tel:${data.planning_contact.PHONE}`}
                      className="underline hover:text-stone-900"
                    >
                      {data.planning_contact.PHONE}
                    </a>
                  </p>
                )}
                {data.planning_contact.EMAIL && (
                  <p className="text-[13px] text-stone-600">
                    ✉️{" "}
                    <a
                      href={`mailto:${data.planning_contact.EMAIL}`}
                      className="underline hover:text-stone-900"
                    >
                      {data.planning_contact.EMAIL}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  NOTES                                                        */}
      {/* ============================================================ */}
      {dev.notes?.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
            Notes
          </p>
          <ul className="space-y-2">
            {dev.notes.map((note: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[13px] leading-relaxed text-stone-600"
              >
                <span className="mt-0.5 text-amber-500">⚠</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ============================================================ */}
      {/*  CONFIDENCE SCORING (Tier 3)                                  */}
      {/* ============================================================ */}
      {dev.confidence && (
        <>
          <SectionHeading
            id="confidence"
            title="Report Confidence"
            icon={Icons.shield}
          />

          {/* Overall score + methodology toggle */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full border-4 ${
                dev.confidence.overall_confidence === "high"
                  ? "border-emerald-400 text-emerald-600"
                  : dev.confidence.overall_confidence === "medium"
                  ? "border-amber-400 text-amber-600"
                  : dev.confidence.overall_confidence === "low"
                  ? "border-red-400 text-red-600"
                  : "border-stone-300 text-stone-500"
              }`}>
                <span className="text-[20px] font-bold">
                  {dev.confidence.overall_score}
                </span>
              </div>
              <div>
                <p className="text-[16px] font-bold text-stone-900">
                  {dev.confidence.overall_confidence?.toUpperCase()} Confidence
                </p>
                <p className="text-[12px] text-stone-500">
                  {dev.confidence.high_confidence_count}/{dev.confidence.section_count} sections high-confidence
                  {dev.confidence.low_confidence_count > 0 && (
                    <span className="text-red-500">
                      {" "}· {dev.confidence.low_confidence_count} low-confidence
                    </span>
                  )}
                </p>
              </div>
            </div>

            <p className="mb-4 text-[12px] leading-relaxed text-stone-500">
              {dev.confidence.summary}
            </p>

            {/* How This Score Works — collapsible methodology */}
            {dev.confidence.methodology && (
              <details className="mb-4 rounded-lg border border-stone-100 bg-stone-50">
                <summary className="cursor-pointer px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500 hover:text-stone-700">
                  How This Score Works
                </summary>
                <div className="px-4 pb-3 pt-1">
                  <p className="text-[11px] leading-relaxed text-stone-500 mb-3">
                    {dev.confidence.methodology.description}
                  </p>
                  <div className="space-y-2 mb-3">
                    {dev.confidence.methodology.dimensions?.map((d: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-stone-400" />
                        <div>
                          <span className="text-[11px] font-semibold text-stone-700">
                            {d.name} ({d.weight})
                          </span>
                          <span className="text-[11px] text-stone-500"> — {d.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Threshold table */}
                  <div className="rounded border border-stone-200 overflow-hidden">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-stone-100">
                          <th className="px-2 py-1 text-left font-semibold text-stone-600">Level</th>
                          <th className="px-2 py-1 text-left font-semibold text-stone-600">Score</th>
                          <th className="px-2 py-1 text-left font-semibold text-stone-600">Meaning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dev.confidence.methodology.thresholds?.map((t: any) => (
                          <tr key={t.level} className="border-t border-stone-100">
                            <td className="px-2 py-1">
                              <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                t.level === "high" ? "bg-emerald-100 text-emerald-700"
                                  : t.level === "medium" ? "bg-amber-100 text-amber-700"
                                  : t.level === "low" ? "bg-red-100 text-red-700"
                                  : "bg-stone-200 text-stone-600"
                              }`}>{t.level}</span>
                            </td>
                            <td className="px-2 py-1 text-stone-600">{t.min_score}+</td>
                            <td className="px-2 py-1 text-stone-500">{t.meaning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-[10px] italic text-stone-400">
                    {dev.confidence.methodology.disclaimer}
                  </p>
                </div>
              </details>
            )}

            {/* Per-section expandable cards */}
            <div className="space-y-2">
              {dev.confidence.sections?.map((s: any) => {
                const barColor = s.confidence === "high"
                  ? "bg-emerald-500"
                  : s.confidence === "medium"
                  ? "bg-amber-500"
                  : s.confidence === "low"
                  ? "bg-red-500"
                  : "bg-stone-400";
                const badgeColor = s.confidence === "high"
                  ? "bg-emerald-100 text-emerald-700"
                  : s.confidence === "medium"
                  ? "bg-amber-100 text-amber-700"
                  : s.confidence === "low"
                  ? "bg-red-100 text-red-700"
                  : "bg-stone-200 text-stone-600";
                return (
                  <details key={s.section} className="group rounded-lg border border-stone-100 bg-white">
                    {/* Collapsed: section name + bar + badge */}
                    <summary className="cursor-pointer px-3 py-2.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-medium text-stone-700">{s.label}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${badgeColor}`}>
                              {s.confidence}
                            </span>
                            <span className="text-[11px] font-medium text-stone-500">
                              {s.score}/100
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${s.score}%` }}
                          />
                        </div>
                      </div>
                      <svg className="h-4 w-4 shrink-0 text-stone-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </summary>

                    {/* Expanded: dimensions, rationale, sources, verification */}
                    <div className="border-t border-stone-100 px-3 pb-3 pt-2.5 space-y-3">
                      {/* 3 sub-dimension mini-bars */}
                      {s.dimensions && (
                        <div className="grid grid-cols-3 gap-2">
                          {(["completeness", "authority", "certainty"] as const).map((dim) => {
                            const d = s.dimensions[dim];
                            if (!d) return null;
                            const dimBarColor = d.score >= 85 ? "bg-emerald-400"
                              : d.score >= 60 ? "bg-amber-400"
                              : d.score >= 35 ? "bg-red-400"
                              : "bg-stone-300";
                            return (
                              <div key={dim}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[10px] text-stone-500">{d.label}</span>
                                  <span className="text-[10px] font-medium text-stone-600">{d.score}</span>
                                </div>
                                <div className="h-1 w-full overflow-hidden rounded-full bg-stone-100">
                                  <div className={`h-full rounded-full ${dimBarColor}`} style={{ width: `${d.score}%` }} />
                                </div>
                                <p className="text-[9px] text-stone-400 mt-0.5">{d.weight}% weight</p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Rationale */}
                      {s.rationale && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-1">Rationale</p>
                          <p className="text-[11px] leading-relaxed text-stone-600">{s.rationale}</p>
                        </div>
                      )}

                      {/* Data sources */}
                      {s.sources?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-1">Data Sources</p>
                          <ul className="space-y-0.5">
                            {s.sources.map((src: any, si: number) => (
                              <li key={si} className="flex items-start gap-1.5 text-[11px]">
                                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                                <span className="text-stone-600">
                                  {src.url ? (
                                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline decoration-blue-300 hover:text-blue-700">
                                      {src.name}
                                    </a>
                                  ) : src.name}
                                  <span className="text-stone-400"> · {src.type}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Verification steps */}
                      {s.verification_steps?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-1">Verification Steps</p>
                          <ul className="space-y-1">
                            {s.verification_steps.map((v: any, vi: number) => {
                              const urgencyStyle = v.urgency === "must"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : v.urgency === "should"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-stone-50 text-stone-600 border-stone-200";
                              const urgencyIcon = v.urgency === "must" ? "🔴"
                                : v.urgency === "should" ? "🟡" : "🔵";
                              return (
                                <li key={vi} className={`rounded border px-2 py-1.5 text-[11px] leading-relaxed ${urgencyStyle}`}>
                                  <span className="mr-1">{urgencyIcon}</span>
                                  {v.text}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {/* Gaps for this section */}
                      {s.gaps?.length > 0 && (
                        <div className="space-y-0.5">
                          {s.gaps.map((g: string, gi: number) => (
                            <p key={gi} className="text-[10px] text-amber-500">⚠ {g}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>

            {/* ── Due Diligence Checklist ────────────────────────────── */}
            {dev.confidence.due_diligence?.length > 0 && (
              <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-bold text-stone-800">
                    Due Diligence Checklist
                  </p>
                  <div className="flex items-center gap-2 text-[10px]">
                    {dev.confidence.must_verify_count > 0 && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">
                        {dev.confidence.must_verify_count} must verify
                      </span>
                    )}
                    {dev.confidence.should_verify_count > 0 && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-700">
                        {dev.confidence.should_verify_count} should verify
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 mb-3">
                  Complete these steps to validate the data in this report. Items are sorted by urgency.
                </p>
                <ul className="space-y-1.5">
                  {dev.confidence.due_diligence.map((d: any, di: number) => {
                    const urgencyBg = d.urgency === "must"
                      ? "border-red-200 bg-red-50"
                      : d.urgency === "should"
                      ? "border-amber-200 bg-amber-50"
                      : "border-stone-200 bg-white";
                    const urgencyIcon = d.urgency === "must" ? "🔴"
                      : d.urgency === "should" ? "🟡" : "🔵";
                    return (
                      <li key={di} className={`flex items-start gap-2 rounded border px-3 py-2 ${urgencyBg}`}>
                        <span className="mt-0.5 shrink-0">{urgencyIcon}</span>
                        <div className="min-w-0">
                          <p className="text-[11px] leading-relaxed text-stone-700">{d.text}</p>
                          <p className="text-[9px] font-medium uppercase tracking-wide text-stone-400 mt-0.5">
                            {d.section}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  DISCLAIMER                                                   */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          Disclaimer
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-stone-400">
          This analysis is for planning purposes only. Actual development rights
          depend on site-specific reviews, Committee of Adjustment decisions, and
          City approval. Consult a licensed planner for professional advice. Data
          sourced from the City of Toronto Open Data Portal (By-law 569-2013).
        </p>
      </div>

      {/* ============================================================ */}
      {/*  RAW JSON                                                     */}
      {/* ============================================================ */}
      <details className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-5 py-3.5 text-[13px] font-medium text-stone-400 hover:text-stone-600">
          View raw JSON response
        </summary>
        <pre className="max-h-96 overflow-auto border-t border-stone-100 px-5 py-4 font-mono text-[11px] leading-relaxed text-stone-500">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>

    {/* Use Eligibility Analysis Panel */}
    <UseAnalysisPanel
      useName={analyzeUse}
      reportData={analyzeUse ? data : null}
      onClose={() => setAnalyzeUse(null)}
    />

    </ReferenceProvider>
  );
}
