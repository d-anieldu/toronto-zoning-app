"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * NearbyActivityTab — "Nearby Activity" tab for the zoning report.
 *
 * Sections:
 *   A. Hero Stats (4 metric cards)
 *   B. Interactive Map (Leaflet with colour-coded pins)
 *   C. Same-Zone Precedents Table
 *   D. Similar Lot Comparables Table
 *   E. Variance Trends (CSS stacked bar chart)
 *   F. Recent Activity Feed (filterable, icon rows)
 *   G. Building Permits (collapsible accordion)
 *   H. Development Applications (collapsible accordion)
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronDown, CheckCircle2, XCircle, MinusCircle, Gavel, Clock, HardHat } from "lucide-react";
import { Tag } from "./primitives";
import SectionNoteEditor from "./SectionNoteEditor";

/* ── Types ─────────────────────────────────────────────────────────── */

interface NearbyData {
  overview?: {
    total: number;
    approved: number;
    refused: number;
    withdrawn: number;
    pending: number;
    approval_rate: number | null;
    common_variance_types: { type: string; count: number }[];
    common_sub_types: { type: string; count: number }[];
    by_event_type: Record<string, number>;
  };
  same_zone?: {
    zone_code: string | null;
    count: number;
    approved?: number;
    refused?: number;
    approval_rate: number | null;
    top_variances: { type: string; count: number }[];
    sample_decisions: any[];
    message?: string;
  };
  similar_lots?: {
    count: number;
    approved?: number;
    refused?: number;
    approval_rate: number | null;
    matches: any[];
    method: string;
    note?: string;
  };
  trend?: {
    year: number;
    total: number;
    approved: number;
    refused: number;
    withdrawn: number;
    rate: number | null;
  }[];
  events?: any[];
  building_permits?: {
    total: number;
    permits: {
      permit_num: string;
      permit_type: string;
      structure_type: string;
      work: string;
      address: string;
      postal: string;
      application_date: string;
      issued_date: string;
      completed_date: string;
      status: string;
      description: string;
      current_use: string;
      proposed_use: string;
      est_cost: number | null;
      dwelling_units_created: number;
      dwelling_units_lost: number;
      lat?: number;
      lng?: number;
    }[];
    by_status: Record<string, number>;
    by_work_type: { type: string; count: number }[];
    by_permit_type: { type: string; count: number }[];
    total_est_cost: number | null;
    net_dwelling_units: number;
    summary_text: string;
  };
  dev_applications?: {
    total: number;
    applications: {
      app_number: string;
      app_type_code: string;
      app_type: string;
      address: string;
      postal: string;
      date_submitted: string;
      status: string;
      description: string;
      ward_number: string;
      ward_name: string;
      app_url: string | null;
      reference_file: string | null;
      community_meeting_date: string;
      community_meeting_location: string;
      lat?: number;
      lng?: number;
    }[];
    by_status: Record<string, number>;
    by_type: { type: string; count: number }[];
    summary_text: string;
  };
  radius_m?: number;
}

/* ── Helpers ───────────────────────────────────────────────────────── */

const EVENT_TYPE_LABELS: Record<string, string> = {
  coa_approved: "CoA Approved",
  coa_refused: "CoA Refused",
  coa_withdrawn: "CoA Withdrawn",
  coa_hearing: "CoA Hearing",
  dev_application: "Dev Application",
  building_permit: "Building Permit",
};

const EVENT_TYPE_VARIANT: Record<
  string,
  "success" | "danger" | "warning" | "info" | "default"
> = {
  coa_approved: "success",
  coa_refused: "danger",
  coa_withdrawn: "warning",
  coa_hearing: "info",
  dev_application: "info",
  building_permit: "default",
};

function metricLabel(metric: string): string {
  return metric
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
    });
  } catch {
    return d;
  }
}

function pct(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${v}%`;
}

function formatCost(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

/* ── Decision badge ────────────────────────────────────────────────── */

function DecisionBadge({ eventType }: { eventType: string }) {
  const variant = EVENT_TYPE_VARIANT[eventType];
  const label = (EVENT_TYPE_LABELS[eventType] || eventType).replace("CoA ", "");
  const cls =
    variant === "success"
      ? "bg-emerald-100 text-emerald-800"
      : variant === "danger"
        ? "bg-red-100 text-red-700"
        : variant === "warning"
          ? "bg-amber-100 text-amber-700"
          : variant === "info"
            ? "bg-sky-100 text-sky-700"
            : "bg-stone-100 text-stone-600";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase whitespace-nowrap ${cls}`}
    >
      {label}
    </span>
  );
}

/* ── Mini-Map ──────────────────────────────────────────────────────── */

function spreadPosition(
  index: number,
  total: number,
  centerLat: number,
  centerLon: number,
  radiusKm = 0.04,
): [number, number] {
  const angle = (2 * Math.PI * index) / Math.max(total, 1);
  const dLat = (radiusKm / 111.32) * Math.cos(angle);
  const dLon =
    (radiusKm / (111.32 * Math.cos((centerLat * Math.PI) / 180))) *
    Math.sin(angle);
  return [centerLat + dLat, centerLon + dLon];
}

function MiniMap({
  center,
  events,
  radiusM,
}: {
  center: { lat: number; lon: number };
  events: any[];
  radiusM: number;
}) {
  const [mapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
      // @ts-expect-error CSS module
      import("leaflet/dist/leaflet.css"),
    ]).then(([rl, L]) => {
      setMapComponents({ rl, L: L.default || L });
    });
  }, []);

  const positioned = useMemo(() => {
    const needSpread = events.filter((e) => !e.lat || !e.lng);
    return events.map((e) => {
      if (e.lat && e.lng) return { ...e, _lat: e.lat, _lng: e.lng };
      const si = needSpread.indexOf(e);
      const [sLat, sLon] = spreadPosition(
        si,
        needSpread.length,
        center.lat,
        center.lon,
      );
      return { ...e, _lat: sLat, _lng: sLon };
    });
  }, [events, center]);

  const iconsByColor = useMemo(() => {
    if (!mapComponents) return {} as Record<string, any>;
    const { L } = mapComponents;
    const colors = [
      "#22c55e",
      "#ef4444",
      "#f59e0b",
      "#94a3b8",
      "#3b82f6",
      "#8b5cf6",
    ];
    const cache: Record<string, any> = {};
    for (const color of colors) {
      cache[color] = L.divIcon({
        className: "",
        html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);cursor:pointer;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
    }
    return cache;
  }, [mapComponents]);

  if (!mapComponents) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-xl border border-stone-200 bg-stone-50">
        <p className="text-[12px] text-stone-400">Loading map…</p>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, ZoomControl } =
    mapComponents.rl;
  const L = mapComponents.L;

  const pinColors: Record<string, string> = {
    coa_approved: "#22c55e",
    coa_refused: "#ef4444",
    coa_withdrawn: "#f59e0b",
    coa_hearing: "#94a3b8",
    dev_application: "#3b82f6",
    building_permit: "#8b5cf6",
  };

  const markerIcon = (color: string) =>
    iconsByColor[color] ||
    L.divIcon({
      className: "",
      html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

  const legendItems = [
    { label: "Approved", color: "#22c55e" },
    { label: "Refused", color: "#ef4444" },
    { label: "Dev Apps", color: "#3b82f6" },
    { label: "Permits", color: "#8b5cf6" },
  ];

  return (
    <div className="relative h-[500px] rounded-xl overflow-hidden border border-stone-200 shadow-sm">
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={15}
        maxZoom={22}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxNativeZoom={20}
          maxZoom={22}
        />
        <Circle
          center={[center.lat, center.lon]}
          radius={radiusM}
          pathOptions={{
            color: "#6366f1",
            fillColor: "#6366f1",
            fillOpacity: 0.06,
            weight: 1.5,
            dashArray: "5 5",
          }}
        />
        <CircleMarker
          center={[center.lat, center.lon]}
          radius={7}
          pathOptions={{
            color: "#1e293b",
            fillColor: "#1e293b",
            fillOpacity: 1,
            weight: 2,
          }}
        />
        {positioned.map((e: any, i: number) => {
          const color = pinColors[e.event_type] || "#94a3b8";
          return (
            <Marker
              key={e._key || e.id || i}
              position={[e._lat, e._lng]}
              icon={markerIcon(color)}
            >
              <Popup>
                <div className="text-[11px] leading-relaxed max-w-[200px]">
                  <p className="font-semibold text-stone-800">
                    {EVENT_TYPE_LABELS[e.event_type] || e.event_type}
                  </p>
                  <p className="font-medium mt-0.5">{e.address || "Unknown"}</p>
                  {e.event_date && (
                    <p className="text-stone-400">{formatDate(e.event_date)}</p>
                  )}
                  {e._description && (
                    <p className="text-stone-500 line-clamp-2 mt-0.5">
                      {e._description}
                    </p>
                  )}
                  {e.distance_m != null && (
                    <p className="text-stone-400">{e.distance_m}m away</p>
                  )}
                  {e.url && (
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-500 mt-1 inline-block"
                    >
                      View details ↗
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {/* Glass legend overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-[400] flex items-center justify-center gap-4 px-4 py-2 rounded-lg bg-white/70 backdrop-blur-sm text-[11px] font-semibold text-stone-500 uppercase tracking-tight">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-stone-800 shrink-0" />
          <span>Subject</span>
        </div>
        {legendItems.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── CSS Trend Chart ───────────────────────────────────────────────── */

function TrendChart({
  data,
}: {
  data: {
    year: number;
    total: number;
    approved: number;
    refused: number;
    rate: number | null;
  }[];
}) {
  if (!data || data.length === 0) {
    return (
      <p className="text-[12px] text-stone-400 italic">
        Not enough data for trend analysis.
      </p>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.approved + d.refused), 1);
  const MAX_H = 120;

  return (
    <div>
      <div
        className="flex items-end justify-between gap-3 px-2 mb-3"
        style={{ height: MAX_H + 28 }}
      >
        {data.map((d) => {
          const approvedH = Math.max(
            Math.round((d.approved / maxTotal) * MAX_H),
            d.approved > 0 ? 4 : 0,
          );
          const refusedH = Math.max(
            Math.round((d.refused / maxTotal) * MAX_H),
            d.refused > 0 ? 4 : 0,
          );
          return (
            <div key={d.year} className="flex flex-col items-center flex-1">
              <div className="w-full flex flex-col-reverse gap-px">
                <div
                  className="w-full bg-emerald-500 rounded-t-sm"
                  style={{ height: approvedH }}
                  title={`Approved: ${d.approved}`}
                />
                {refusedH > 0 && (
                  <div
                    className="w-full bg-red-400"
                    style={{ height: refusedH }}
                    title={`Refused: ${d.refused}`}
                  />
                )}
              </div>
              <span className="text-[11px] text-stone-400 mt-2">{d.year}</span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-stone-400 px-2 mb-4">
        {data.map(
          (d) =>
            d.rate != null && (
              <span key={d.year}>
                <span className="font-semibold text-stone-600">{d.year}</span>:{" "}
                {d.rate}% approval
              </span>
            ),
        )}
      </div>
      <div className="flex justify-center gap-6 pt-3 border-t border-stone-100">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block" />
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-tighter">
            Approved
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-400 rounded-sm inline-block" />
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-tighter">
            Refused
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Activity Feed ─────────────────────────────────────────────────── */

const ICON_CIRCLE_CLASS: Record<string, string> = {
  coa_approved: "bg-emerald-100 text-emerald-600",
  coa_refused: "bg-red-100 text-red-600",
  coa_withdrawn: "bg-amber-100 text-amber-600",
  coa_hearing: "bg-stone-100 text-stone-500",
  dev_application: "bg-sky-100 text-sky-600",
  building_permit: "bg-violet-100 text-violet-600",
};

const ICON_MAP: Record<string, React.ReactNode> = {
  coa_approved: <CheckCircle2 size={16} />,
  coa_refused: <XCircle size={16} />,
  coa_withdrawn: <MinusCircle size={16} />,
  coa_hearing: <Gavel size={16} />,
  dev_application: <Clock size={16} />,
  building_permit: <HardHat size={16} />,
};

function ActivityFeed({ events }: { events: any[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [showCount, setShowCount] = useState(10);

  const types = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of events) {
      const t = e.event_type || "unknown";
      counts[t] = (counts[t] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [events]);

  const filtered = useMemo(
    () =>
      !filter
        ? events
        : events.filter((e: any) => e.event_type === filter),
    [events, filter],
  );
  const visible = filtered.slice(0, showCount);

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1 text-[11px] font-bold rounded-full transition-colors ${
            !filter
              ? "bg-stone-900 text-white shadow-sm"
              : "border border-stone-200 text-stone-500 hover:bg-stone-100"
          }`}
        >
          All
        </button>
        {types.map(([type, count]) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 text-[11px] font-medium rounded-full transition-colors ${
              filter === type
                ? "bg-stone-900 text-white"
                : "border border-stone-200 text-stone-500 hover:bg-stone-100"
            }`}
          >
            {EVENT_TYPE_LABELS[type] || type} ({count})
          </button>
        ))}
      </div>

      {/* Event rows */}
      <div className="space-y-1">
        {visible.map((e: any, i: number) => {
          const desc = e.raw_data?.DESCRIPTION
            ? ` — ${e.raw_data.DESCRIPTION.slice(0, 70)}${
                e.raw_data.DESCRIPTION.length > 70 ? "…" : ""
              }`
            : "";
          return (
            <div
              key={e.id || i}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    ICON_CIRCLE_CLASS[e.event_type] ||
                    "bg-stone-100 text-stone-500"
                  }`}
                >
                  {ICON_MAP[e.event_type] ?? <Clock size={16} />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[13px] font-bold text-stone-900 leading-tight truncate">
                    {e.address || e.title || "Unknown location"}
                    {desc}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-stone-400 uppercase tracking-tighter">
                      {formatDate(e.event_date)}
                    </span>
                    {e.distance_m != null && (
                      <span className="text-[11px] text-stone-400">
                        {e.distance_m}m
                      </span>
                    )}
                    {(e.source_id || e.raw_data?.REFERENCE_FILE) && (
                      <span className="text-[11px] text-stone-400">
                        Ref: {e.source_id || e.raw_data.REFERENCE_FILE}
                      </span>
                    )}
                    {e.url && (
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-indigo-500 hover:text-indigo-700 font-medium"
                      >
                        View on AIC ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="shrink-0 ml-3">
                <DecisionBadge eventType={e.event_type} />
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > showCount && (
        <button
          type="button"
          onClick={() => setShowCount((c) => c + 10)}
          className="w-full rounded-lg border border-stone-200 py-2 text-[12px] font-medium text-stone-500 hover:bg-stone-50 transition-colors"
        >
          Show more ({filtered.length - showCount} remaining)
        </button>
      )}
      {visible.length === 0 && (
        <p className="py-4 text-center text-[12px] text-stone-400 italic">
          No events found matching this filter.
        </p>
      )}
    </div>
  );
}

/* ── Radius Selector ───────────────────────────────────────────────── */

function RadiusSelector({
  value,
  onChange,
  loading,
}: {
  value: number;
  onChange: (r: number) => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-stone-400 mr-1">Radius:</span>
      {[250, 500, 1000].map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          disabled={loading}
          className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
            value === r
              ? "bg-stone-900 text-white"
              : "bg-stone-100 text-stone-500 hover:bg-stone-200"
          } ${loading ? "opacity-50 cursor-wait" : ""}`}
        >
          {r >= 1000 ? `${r / 1000}km` : `${r}m`}
        </button>
      ))}
    </div>
  );
}

/* ── Building Permits content ──────────────────────────────────────── */

const PERMIT_STATUS_COLOR: Record<string, string> = {
  "Permit Issued": "bg-emerald-100 text-emerald-700",
  Inspection: "bg-blue-100 text-blue-700",
  Closed: "bg-stone-100 text-stone-500",
  Cancelled: "bg-red-100 text-red-600",
  "Revision Issued": "bg-amber-100 text-amber-700",
};

function BuildingPermitsContent({
  permits,
}: {
  permits: NonNullable<NearbyData["building_permits"]>;
}) {
  const [workFilter, setWorkFilter] = useState<string | null>(null);
  const [showCount, setShowCount] = useState(5);

  const filtered = useMemo(
    () =>
      !workFilter
        ? permits.permits
        : permits.permits.filter((p) => p.work === workFilter),
    [permits.permits, workFilter],
  );
  const visible = filtered.slice(0, showCount);

  return (
    <div className="pt-5 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[20px] font-bold text-stone-900">{permits.total}</p>
          <p className="text-[11px] text-stone-400">permits</p>
        </div>
        <div>
          <p className="text-[20px] font-bold text-violet-600">
            {formatCost(permits.total_est_cost)}
          </p>
          <p className="text-[11px] text-stone-400">est. construction</p>
        </div>
        <div>
          <p
            className={`text-[20px] font-bold ${
              permits.net_dwelling_units >= 0
                ? "text-emerald-600"
                : "text-red-600"
            }`}
          >
            {permits.net_dwelling_units > 0 ? "+" : ""}
            {permits.net_dwelling_units}
          </p>
          <p className="text-[11px] text-stone-400">net dwelling units</p>
        </div>
      </div>

      {Object.keys(permits.by_status).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(permits.by_status)
            .sort(([, a], [, b]) => b - a)
            .map(([status, count]) => (
              <span
                key={status}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  PERMIT_STATUS_COLOR[status] || "bg-stone-100 text-stone-500"
                }`}
              >
                {status} ({count})
              </span>
            ))}
        </div>
      )}

      {permits.by_work_type.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Tag active={!workFilter} onClick={() => setWorkFilter(null)}>
            All ({permits.total})
          </Tag>
          {permits.by_work_type.slice(0, 6).map((wt) => (
            <Tag
              key={wt.type}
              active={workFilter === wt.type}
              onClick={() => setWorkFilter(wt.type)}
            >
              {wt.type} ({wt.count})
            </Tag>
          ))}
        </div>
      )}

      <div className="divide-y divide-stone-100">
        {visible.map((p) => (
          <div key={p.permit_num} className="py-3 first:pt-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      PERMIT_STATUS_COLOR[p.status] ||
                      "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {p.status || "Unknown"}
                  </span>
                  {p.est_cost != null && (
                    <span className="text-[11px] font-medium text-violet-600">
                      {formatCost(p.est_cost)}
                    </span>
                  )}
                  {(p.dwelling_units_created > 0 ||
                    p.dwelling_units_lost > 0) && (
                    <span className="text-[10px] text-stone-400">
                      {p.dwelling_units_created > 0 &&
                        `+${p.dwelling_units_created}`}
                      {p.dwelling_units_lost > 0 && ` −${p.dwelling_units_lost}`}{" "}
                      units
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] font-semibold text-stone-900 truncate">
                  {p.address}
                </p>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  {p.work || p.permit_type}
                  {p.structure_type && ` · ${p.structure_type}`}
                </p>
                {p.description && (
                  <p className="mt-0.5 text-[11px] text-stone-400 line-clamp-2">
                    {p.description}
                  </p>
                )}
                <p className="mt-0.5 text-[10px] text-stone-400">
                  Permit #{p.permit_num}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-stone-400">
                {formatDate(p.issued_date || p.application_date)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length > showCount && (
        <button
          type="button"
          onClick={() => setShowCount((c) => c + 10)}
          className="w-full rounded-lg border border-stone-200 py-2 text-[12px] font-medium text-stone-500 hover:bg-stone-50 transition-colors"
        >
          Show more ({filtered.length - showCount} remaining)
        </button>
      )}
      {visible.length === 0 && (
        <p className="py-4 text-center text-[12px] text-stone-400 italic">
          No permits match this filter.
        </p>
      )}
    </div>
  );
}

/* ── Dev Applications content ─────────────────────────────────────── */

const APP_STATUS_COLOR: Record<string, string> = {
  "Under Review": "bg-blue-100 text-blue-700",
  Closed: "bg-stone-100 text-stone-500",
  Approved: "bg-emerald-100 text-emerald-700",
  "OMB Approved": "bg-emerald-100 text-emerald-700",
  Refused: "bg-red-100 text-red-600",
  Complete: "bg-emerald-100 text-emerald-700",
};

const APP_TYPE_COLOR: Record<string, string> = {
  Rezoning: "bg-violet-100 text-violet-700",
  "Site Plan Approval": "bg-sky-100 text-sky-700",
  "Official Plan Amendment": "bg-amber-100 text-amber-700",
  "Plan of Subdivision": "bg-teal-100 text-teal-700",
  "Plan of Condominium": "bg-indigo-100 text-indigo-700",
};

function DevApplicationsContent({
  devApps,
}: {
  devApps: NonNullable<NearbyData["dev_applications"]>;
}) {
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showCount, setShowCount] = useState(5);

  const filtered = useMemo(
    () =>
      !typeFilter
        ? devApps.applications
        : devApps.applications.filter((a) => a.app_type === typeFilter),
    [devApps.applications, typeFilter],
  );
  const visible = filtered.slice(0, showCount);

  return (
    <div className="pt-5 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[20px] font-bold text-stone-900">{devApps.total}</p>
          <p className="text-[11px] text-stone-400">applications</p>
        </div>
        <div>
          <p className="text-[20px] font-bold text-blue-600">
            {devApps.by_status["Under Review"] || 0}
          </p>
          <p className="text-[11px] text-stone-400">under review</p>
        </div>
        <div>
          <p className="text-[20px] font-bold text-stone-900">
            {devApps.by_type.length}
          </p>
          <p className="text-[11px] text-stone-400">app types</p>
        </div>
      </div>

      {Object.keys(devApps.by_status).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(devApps.by_status)
            .sort(([, a], [, b]) => b - a)
            .map(([status, count]) => (
              <span
                key={status}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  APP_STATUS_COLOR[status] || "bg-stone-100 text-stone-500"
                }`}
              >
                {status} ({count})
              </span>
            ))}
        </div>
      )}

      {devApps.by_type.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Tag active={!typeFilter} onClick={() => setTypeFilter(null)}>
            All ({devApps.total})
          </Tag>
          {devApps.by_type.map((t) => (
            <Tag
              key={t.type}
              active={typeFilter === t.type}
              onClick={() => setTypeFilter(t.type)}
            >
              {t.type} ({t.count})
            </Tag>
          ))}
        </div>
      )}

      <div className="divide-y divide-stone-100">
        {visible.map((a) => (
          <div key={a.app_number} className="py-3 first:pt-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      APP_TYPE_COLOR[a.app_type] || "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {a.app_type}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      APP_STATUS_COLOR[a.status] || "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <p className="mt-1 text-[13px] font-semibold text-stone-900 truncate">
                  {a.address}
                </p>
                {a.description && (
                  <p className="mt-0.5 text-[11px] text-stone-400 line-clamp-2">
                    {a.description}
                  </p>
                )}
                <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                  {a.app_number && (
                    <span className="text-[10px] text-stone-400">
                      App: {a.app_number}
                    </span>
                  )}
                  {a.ward_name && (
                    <span className="text-[10px] text-stone-400">
                      · Ward {a.ward_number}: {a.ward_name}
                    </span>
                  )}
                </div>
                {a.community_meeting_date && (
                  <p className="mt-0.5 text-[10px] text-amber-600">
                    Community meeting: {formatDate(a.community_meeting_date)}
                    {a.community_meeting_location &&
                      ` at ${a.community_meeting_location}`}
                  </p>
                )}
                {a.app_url && (
                  <a
                    href={a.app_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-block text-[10px] text-indigo-500 hover:underline"
                  >
                    View on Application Info Centre →
                  </a>
                )}
              </div>
              <span className="shrink-0 text-[11px] text-stone-400">
                {formatDate(a.date_submitted)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length > showCount && (
        <button
          type="button"
          onClick={() => setShowCount((c) => c + 10)}
          className="w-full rounded-lg border border-stone-200 py-2 text-[12px] font-medium text-stone-500 hover:bg-stone-50 transition-colors"
        >
          Show more ({filtered.length - showCount} remaining)
        </button>
      )}
      {visible.length === 0 && (
        <p className="py-4 text-center text-[12px] text-stone-400 italic">
          No applications match this filter.
        </p>
      )}
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function NearbyActivityTab({
  data,
  editMode,
  sectionNotes,
  onEditNote,
}: {
  data: Record<string, any>;
  editMode?: boolean;
  sectionNotes?: Record<string, string>;
  onEditNote?: (sectionId: string, note: string) => void;
}) {
  const coords = useMemo(() => data.coordinates || {}, [data.coordinates]);
  const nearby: NearbyData = data.nearby_activity || {};
  const dev = data.development_potential || {};
  const eff = data.effective_standards || {};
  const zoneCode = eff.zone_code || "";

  const [radius, setRadius] = useState(nearby.radius_m || 500);
  const [liveData, setLiveData] = useState<NearbyData>(nearby);
  const [loading, setLoading] = useState(!data.nearby_activity);
  const [loadingMessage, setLoadingMessage] = useState(
    () =>
      `Searching ${nearby.radius_m || 500}m around ${data.address || "this location"}…`,
  );

  const [permitsOpen, setPermitsOpen] = useState(false);
  const [devAppsOpen, setDevAppsOpen] = useState(false);

  const handleRadiusChange = useCallback(
    async (newRadius: number) => {
      setRadius(newRadius);
      if (!coords.longitude || !coords.latitude) return;
      setLoading(true);
      setLoadingMessage(
        `Searching ${newRadius}m around ${data.address || "this location"}…`,
      );
      try {
        const params = new URLSearchParams({
          lon: String(coords.longitude),
          lat: String(coords.latitude),
          radius: String(newRadius),
        });
        if (zoneCode) params.set("zone_code", zoneCode);
        if (data.parcel?.frontage_m)
          params.set("lot_frontage_m", String(data.parcel.frontage_m));
        if (data.parcel?.area_sqm)
          params.set("lot_area_sqm", String(data.parcel.area_sqm));
        if (data.address) params.set("address", data.address);
        const res = await fetch(`/api/nearby-activity/stats?${params}`);
        if (res.ok) setLiveData(await res.json());
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    },
    [coords, zoneCode, data.parcel, data.address],
  );

  useEffect(() => {
    if (data.nearby_activity) return;
    if (!coords.longitude || !coords.latitude) return;
    handleRadiusChange(radius);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords.latitude, coords.longitude]);

  const overview = liveData.overview;
  const sameZone = liveData.same_zone;
  const similarLots = liveData.similar_lots;
  const trend = liveData.trend;
  const events = useMemo(() => liveData.events || [], [liveData.events]);
  const permits = liveData.building_permits;
  const permitList = useMemo(() => permits?.permits || [], [permits]);
  const devApps = liveData.dev_applications;
  const devAppList = useMemo(
    () => devApps?.applications || [],
    [devApps],
  );

  const MAP_EVENT_LIMIT = 50;
  const { mapEvents, mapEventTotal } = useMemo(() => {
    const merged: any[] = [];
    for (const e of events)
      merged.push({ ...e, _key: `evt-${e.id || merged.length}` });
    for (const p of permitList) {
      merged.push({
        _key: `bp-${p.permit_num}`,
        event_type: "building_permit",
        address: p.address,
        event_date: p.issued_date || p.application_date,
        _description: p.description || `${p.work} — ${p.structure_type}`,
        _status: p.status,
        _cost: formatCost(p.est_cost),
        lat: p.lat,
        lng: p.lng,
      });
    }
    for (const a of devAppList) {
      merged.push({
        _key: `da-${a.app_number}`,
        event_type: "dev_application",
        address: a.address,
        event_date: a.date_submitted,
        _description: a.description || a.app_type,
        _status: a.status,
        url: a.app_url || undefined,
        lat: a.lat,
        lng: a.lng,
      });
    }
    const total = merged.length;
    if (total > MAP_EVENT_LIMIT) {
      merged.sort((a, b) =>
        String(b.event_date || "").localeCompare(String(a.event_date || "")),
      );
      merged.splice(MAP_EVENT_LIMIT);
    }
    return { mapEvents: merged, mapEventTotal: total };
  }, [events, permitList, devAppList]);

  const oltDecisions = dev.olt_decisions || {};
  const oltSamples =
    oltDecisions.samples || oltDecisions.recent_decisions || [];

  const hasData = (overview?.total ?? 0) > 0;
  const hasPermits = (permits?.total ?? 0) > 0;
  const hasDevApps = (devApps?.total ?? 0) > 0;

  /* ── Loading skeleton ──────────────────────────────────────────── */
  if (
    loading &&
    !hasData &&
    events.length === 0 &&
    !hasPermits &&
    !hasDevApps
  ) {
    return (
      <div className="space-y-6 py-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <h2 className="text-[22px] font-extrabold text-stone-900 tracking-tight">
            Nearby Activity
          </h2>
        </div>
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
          <p className="text-[12px] font-medium text-indigo-700">
            {loadingMessage}
          </p>
          <p className="mt-0.5 text-[11px] text-indigo-400">
            Querying Committee of Adjustment records, building permits, and
            development applications…
          </p>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-stone-200 bg-stone-100 h-20"
              />
            ))}
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-100 h-[500px]" />
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-stone-200 bg-stone-100 h-32"
            />
          ))}
        </div>
      </div>
    );
  }

  /* ── Empty state ───────────────────────────────────────────────── */
  if (!hasData && events.length === 0 && !hasPermits && !hasDevApps) {
    return (
      <div className="space-y-6 py-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <h2 className="text-[22px] font-extrabold text-stone-900 tracking-tight">
            Nearby Activity
          </h2>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-8 text-center">
          <p className="text-[14px] font-medium text-stone-600">
            No nearby activity data available
          </p>
          <p className="mt-1 text-[12px] text-stone-400">
            Committee of Adjustment decisions and other development activity
            will appear here once data is ingested for this area.
          </p>
        </div>
      </div>
    );
  }

  /* ── Main render ───────────────────────────────────────────────── */
  return (
    <div className="space-y-6 py-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <h2 className="text-[22px] font-extrabold text-stone-900 tracking-tight">
          Nearby Activity
        </h2>
        <RadiusSelector
          value={radius}
          onChange={handleRadiusChange}
          loading={loading}
        />
      </div>

      {loading && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
          <p className="animate-pulse text-[11px] font-medium text-indigo-600">
            Updating data for {radius}m radius…
          </p>
        </div>
      )}

      {/* ─── A. Hero Stats ──────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold block mb-1">
            CoA Applications
          </span>
          <div className="text-[22px] font-bold text-stone-900">
            {overview?.total ?? "—"}
          </div>
          <span className="text-[10px] text-stone-400 leading-tight">
            within {radius}m
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold block mb-1">
            Approval Rate
          </span>
          <div className="text-[22px] font-bold text-emerald-600">
            {pct(overview?.approval_rate ?? null)}
          </div>
          <span className="text-[10px] text-stone-400 leading-tight">
            {overview
              ? `${overview.approved} of ${overview.approved + overview.refused} decided`
              : "minor variance success"}
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold block mb-1">
            Top Variance
          </span>
          <div className="text-[22px] font-bold text-stone-900 truncate">
            {overview?.common_variance_types?.[0]
              ? metricLabel(overview.common_variance_types[0].type).split(
                  " ",
                )[0]
              : "—"}
          </div>
          <span className="text-[10px] text-stone-400 leading-tight">
            {overview?.common_variance_types?.[0]
              ? `${overview.common_variance_types[0].count} cases`
              : "most common type"}
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold block mb-1">
            Active Permits
          </span>
          <div className="text-[22px] font-bold text-stone-900">
            {permits?.total ?? "—"}
          </div>
          <span className="text-[10px] text-stone-400 leading-tight">
            building permits nearby
          </span>
        </div>
      </section>

      {/* ─── B. Interactive Map ─────────────────────────────────── */}
      {coords.latitude && coords.longitude && mapEvents.length > 0 && (
        <section>
          {mapEventTotal > MAP_EVENT_LIMIT && (
            <p className="mb-2 text-[10px] text-stone-400">
              Showing {MAP_EVENT_LIMIT} most recent of {mapEventTotal} total
              events
            </p>
          )}
          <MiniMap
            center={{ lat: coords.latitude, lon: coords.longitude }}
            events={mapEvents}
            radiusM={radius}
          />
        </section>
      )}

      {/* ─── C. Same-Zone Precedents Table ──────────────────────── */}
      {sameZone && sameZone.count > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold">
              Same-Zone Precedents ({sameZone.zone_code || "—"})
            </span>
            <span className="text-[11px] text-stone-400">
              {sameZone.count} decisions · {pct(sameZone.approval_rate)}{" "}
              approval
            </span>
          </div>

          {sameZone.top_variances.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {sameZone.top_variances.slice(0, 6).map((v) => (
                <span
                  key={v.type}
                  className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[11px] font-medium"
                >
                  {metricLabel(v.type)} ({v.count})
                </span>
              ))}
            </div>
          )}

          {sameZone.sample_decisions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase text-stone-400 font-bold border-b border-stone-100">
                    <th className="pb-3 px-2">Address</th>
                    <th className="pb-3 px-2">Distance</th>
                    <th className="pb-3 px-2">Variance</th>
                    <th className="pb-3 px-2">Decision</th>
                    <th className="pb-3 px-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {sameZone.sample_decisions.map((d: any, i: number) => {
                    const varianceText =
                      d.raw_data?.VARIANCE_REQUESTED ||
                      (d.raw_data?.METRIC_TYPE
                        ? metricLabel(d.raw_data.METRIC_TYPE)
                        : "—");
                    return (
                      <tr
                        key={d.id || i}
                        className="hover:bg-stone-50 transition-colors"
                      >
                        <td className="py-3 px-2 font-medium">
                          {d.url ? (
                            <a
                              href={d.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              {d.address || "Unknown"}
                            </a>
                          ) : (
                            d.address || "Unknown"
                          )}
                        </td>
                        <td className="py-3 px-2 text-stone-400">
                          {d.distance_m != null ? `${d.distance_m}m` : "—"}
                        </td>
                        <td className="py-3 px-2 text-stone-600">
                          {varianceText}
                        </td>
                        <td className="py-3 px-2">
                          <DecisionBadge eventType={d.event_type} />
                        </td>
                        <td className="py-3 px-2 text-stone-400">
                          {formatDate(d.event_date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {sameZone.message && (
            <p className="mt-3 text-[11px] text-stone-400 italic">
              {sameZone.message}
            </p>
          )}
        </section>
      )}

      {/* ─── D. Similar Lot Comparables Table ───────────────────── */}
      {similarLots && similarLots.count > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold">
              Similar Lot Comparables
            </span>
            <span className="text-[11px] text-stone-400">
              {similarLots.count} matches · {pct(similarLots.approval_rate)}{" "}
              approval
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase text-stone-400 font-bold border-b border-stone-100">
                  <th className="pb-3 px-2">Address</th>
                  <th className="pb-3 px-2">Zone</th>
                  <th className="pb-3 px-2">Decision</th>
                  <th className="pb-3 px-2">Date</th>
                  <th className="pb-3 px-2">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {similarLots.matches.slice(0, 8).map((m: any, i: number) => (
                  <tr
                    key={m.id || i}
                    className="hover:bg-stone-50 transition-colors"
                  >
                    <td className="py-3 px-2 font-medium">
                      {m.url ? (
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          {m.address || "Unknown"}
                        </a>
                      ) : (
                        m.address || "Unknown"
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {m.raw_data?.ZONING_DESIGNATION && (
                        <span className="px-1.5 py-0.5 rounded bg-stone-800 text-white text-[10px] font-medium">
                          {m.raw_data.ZONING_DESIGNATION}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <DecisionBadge eventType={m.event_type} />
                    </td>
                    <td className="py-3 px-2 text-stone-400">
                      {formatDate(m.event_date)}
                    </td>
                    <td className="py-3 px-2 text-stone-400">
                      {m.distance_m != null ? `${m.distance_m}m` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {similarLots.note && (
            <p className="mt-3 text-[11px] text-stone-400 italic">
              {similarLots.note}
            </p>
          )}
        </section>
      )}

      {/* ─── E. Variance Trends Chart ───────────────────────────── */}
      {trend && trend.length > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold mb-6 block">
            Variance Trends — {trend.length} Year
            {trend.length !== 1 ? "s" : ""}
          </span>
          <TrendChart data={trend} />
        </section>
      )}

      {/* ─── F. Recent Activity Feed ────────────────────────────── */}
      {events.length > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold mb-5 block">
            Recent Activity
          </span>
          <ActivityFeed events={events} />
        </section>
      )}

      {/* ─── OLT Appeal Decisions ───────────────────────────────── */}
      {oltSamples.length > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold">
              OLT Appeal Decisions
            </span>
            {oltDecisions.appeal_success_rate != null && (
              <span className="text-[11px] text-stone-400">
                {oltDecisions.total || oltSamples.length} decisions ·{" "}
                {pct(oltDecisions.appeal_success_rate)} appeal success
              </span>
            )}
          </div>
          <div className="divide-y divide-stone-100">
            {oltSamples.slice(0, 5).map((d: any, i: number) => (
              <div key={i} className="py-3 first:pt-0">
                <p className="text-[13px] font-semibold text-stone-900">
                  {d.title || d.case_name || "OLT Decision"}
                </p>
                <p className="mt-0.5 text-[11px] text-stone-400">
                  {d.date || d.decision_date || ""}
                  {d.outcome && ` · ${d.outcome}`}
                </p>
                {d.url && (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 text-[11px] text-indigo-500 hover:underline"
                  >
                    View on CanLII →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── G. Building Permits (accordion) ───────────────────── */}
      {hasPermits && (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setPermitsOpen((o) => !o)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
          >
            <span className="text-sm font-bold text-stone-900">
              Building Permits ({permits!.total})
            </span>
            <ChevronDown
              className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                permitsOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {permitsOpen && (
            <div className="px-6 pb-6 border-t border-stone-100">
              <BuildingPermitsContent permits={permits!} />
            </div>
          )}
        </div>
      )}

      {/* ─── H. Dev Applications (accordion) ───────────────────── */}
      {hasDevApps && (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setDevAppsOpen((o) => !o)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
          >
            <span className="text-sm font-bold text-stone-900">
              Development Applications ({devApps!.total})
            </span>
            <ChevronDown
              className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                devAppsOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {devAppsOpen && (
            <div className="px-6 pb-6 border-t border-stone-100">
              <DevApplicationsContent devApps={devApps!} />
            </div>
          )}
        </div>
      )}

      {/* ─── Edit note ──────────────────────────────────────────── */}
      {editMode && (
        <SectionNoteEditor
          sectionId="nearby_activity"
          note={sectionNotes?.nearby_activity ?? ""}
          onNoteChange={onEditNote!}
          editMode={!!editMode}
        />
      )}

      {/* ─── Disclaimer ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
        <p className="text-[10px] text-stone-400 leading-relaxed">
          <strong>Disclaimer:</strong> Variance intelligence is based on
          historical Committee of Adjustment decisions and other publicly
          available data from Toronto Open Data. Approval rates and trends are
          statistical summaries, not predictions. Always consult a planning
          professional before making decisions based on this data.
        </p>
        <p className="mt-1.5 text-[10px] text-stone-400 flex flex-wrap gap-x-3">
          Data sources:{" "}
          <a
            href="https://open.toronto.ca/dataset/committee-of-adjustment-decisions/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline"
          >
            CoA Decisions ↗
          </a>
          <a
            href="https://open.toronto.ca/dataset/building-permits-active-permits/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline"
          >
            Building Permits ↗
          </a>
          <a
            href="https://open.toronto.ca/dataset/development-applications/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline"
          >
            Development Applications ↗
          </a>
        </p>
      </div>
    </div>
  );
}
