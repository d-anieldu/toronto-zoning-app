"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * NearbyActivityTab — "Nearby Activity" tab for the zoning report.
 *
 * Sections:
 *   A. Variance Intelligence Overview (hero stats)
 *   B. Inline Mini-Map (Leaflet with colour-coded pins)
 *   C. Same-Zone Precedents
 *   D. Similar Lot Analysis
 *   E. Recent Activity Feed
 *   F. OLT Appeal Decisions
 *   G. Trend Chart (CSS bar chart)
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { Card, Row, Badge, StatCard, SectionHeading, Tag } from "./primitives";

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

const EVENT_TYPE_BADGE: Record<string, "success" | "danger" | "warning" | "info" | "default"> = {
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
      day: "numeric",
    });
  } catch {
    return d;
  }
}

function pct(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${v}%`;
}

/* ── Mini-Map (dynamic loaded — SSR safe) ──────────────────────────── */

/**
 * Spread events that lack real coordinates in a circle around the
 * property centre so they are visible on the map.
 */
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
    // Dynamic import to avoid SSR issues with Leaflet
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
      // @ts-expect-error — CSS module import
      import("leaflet/dist/leaflet.css"),
    ]).then(([rl, L]) => {
      setMapComponents({ rl, L: L.default || L });
    });
  }, []);

  // Position events: use real coords if available, else spread around centre
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

  // Pre-build icon cache per colour so L.divIcon is not recreated on every render
  const iconsByColor = useMemo(() => {
    if (!mapComponents) return {} as Record<string, any>;
    const { L } = mapComponents;
    const colors = ["#22c55e", "#ef4444", "#f59e0b", "#94a3b8", "#3b82f6", "#8b5cf6"];
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
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-stone-200 bg-stone-50">
        <p className="text-[12px] text-stone-400">Loading map…</p>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Circle, Popup, Marker } =
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
    iconsByColor[color] || L.divIcon({
      className: "",
      html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);cursor:pointer;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200">
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={15}
        style={{ height: "320px", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {/* Search radius circle */}
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
        {/* Property marker */}
        <CircleMarker
          center={[center.lat, center.lon]}
          radius={6}
          pathOptions={{
            color: "#1e293b",
            fillColor: "#1e293b",
            fillOpacity: 1,
            weight: 2,
          }}
        />
        {/* Event pins */}
        {positioned.map((e: any, i: number) => {
          const color = pinColors[e.event_type] || "#94a3b8";
          return (
            <Marker
              key={e._key || e.id || i}
              position={[e._lat, e._lng]}
              icon={markerIcon(color)}
            >
              <Popup>
                <div className="text-[11px] leading-relaxed max-w-[220px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-semibold text-stone-700">
                      {EVENT_TYPE_LABELS[e.event_type] || e.event_type}
                    </span>
                  </div>
                  <p className="font-medium text-stone-800">
                    {e.address || "Unknown"}
                  </p>
                  {e.event_date && (
                    <p className="text-stone-400">{formatDate(e.event_date)}</p>
                  )}
                  {e._description && (
                    <p className="text-stone-500 line-clamp-2 mt-0.5">{e._description}</p>
                  )}
                  {e._status && (
                    <p className="text-stone-500 mt-0.5">Status: {e._status}</p>
                  )}
                  {e._cost && (
                    <p className="text-stone-500 mt-0.5">Est. cost: {e._cost}</p>
                  )}
                  {e.distance_m != null && (
                    <p className="text-stone-400">{e.distance_m}m away</p>
                  )}
                  {e.url && (
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 text-indigo-500 hover:text-indigo-700 font-medium"
                    >
                      View details &nearr;
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-3 py-2 bg-stone-50 border-t border-stone-100">
        <span className="text-[10px] text-stone-400 font-medium">Legend:</span>
        <span className="flex items-center gap-1 text-[10px] text-stone-500">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-stone-800 border border-white" />
          Subject property
        </span>
        {Object.entries(pinColors).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1 text-[10px] text-stone-500">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {EVENT_TYPE_LABELS[type] || type}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Trend Bar Chart (Recharts) ────────────────────────────────────── */

function TrendChart({
  data,
}: {
  data: { year: number; total: number; approved: number; refused: number; rate: number | null }[];
}) {
  if (!data || data.length === 0) {
    return <p className="text-[12px] text-stone-400 italic">Not enough data for trend analysis.</p>;
  }

  const chartData = data.map((d) => ({
    year: String(d.year),
    Approved: d.approved,
    Refused: d.refused,
    Withdrawn: Math.max(0, d.total - d.approved - d.refused),
    rate: d.rate,
  }));

  return (
    <div className="space-y-1">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barSize={18} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: "#78716c" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#78716c" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e7e5e4",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
            formatter={(value, name) => [value, name]}
            labelFormatter={(label) => `${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            iconType="square"
            iconSize={8}
          />
          <Bar dataKey="Approved" stackId="a" fill="#4ade80" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Refused"  stackId="a" fill="#f87171" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Withdrawn" stackId="a" fill="#d6d3d1" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-stone-400 pl-1">
        {chartData.map((d) => d.rate != null && (
          <span key={d.year}><span className="font-medium text-stone-600">{d.year}</span>: {d.rate}% approval</span>
        ))}
      </div>
    </div>
  );
}

/* ── Activity Feed ─────────────────────────────────────────────────── */

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

  const filtered = useMemo(() => {
    if (!filter) return events;
    return events.filter((e) => e.event_type === filter);
  }, [events, filter]);

  const visible = filtered.slice(0, showCount);

  return (
    <div className="space-y-3">
      {/* Filter toggles */}
      <div className="flex flex-wrap gap-1.5">
        <Tag active={!filter} onClick={() => setFilter(null)}>
          All ({events.length})
        </Tag>
        {types.map(([type, count]) => (
          <Tag key={type} active={filter === type} onClick={() => setFilter(type)}>
            {EVENT_TYPE_LABELS[type] || type} ({count})
          </Tag>
        ))}
      </div>

      {/* Event list */}
      <div className="divide-y divide-stone-100">
        {visible.map((e: any, i: number) => (
          <div key={e.id || i} className="py-2.5 first:pt-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={EVENT_TYPE_BADGE[e.event_type] || "default"}>
                    {EVENT_TYPE_LABELS[e.event_type] || e.event_type}
                  </Badge>
                  {e.distance_m != null && (
                    <span className="text-[11px] text-stone-400">{e.distance_m}m</span>
                  )}
                </div>
                <p className="mt-1 text-[12px] font-medium text-stone-700 truncate">
                  {e.address || e.title || "Unknown location"}
                </p>
                {e.raw_data?.DESCRIPTION && (
                  <p className="mt-0.5 text-[11px] text-stone-400 line-clamp-2">
                    {e.raw_data.DESCRIPTION}
                  </p>
                )}
                <div className="mt-0.5 flex items-center gap-2">
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
                      className="inline-flex items-center gap-0.5 text-[11px] font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
                    >
                      View on AIC <span aria-hidden="true">&nearr;</span>
                    </a>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-[11px] text-stone-400">
                {formatDate(e.event_date)}
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
        <p className="text-[12px] text-stone-400 italic py-4 text-center">
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
  const options = [250, 500, 1000];
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-stone-400 mr-1">Radius:</span>
      {options.map((r) => (
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

/* ── Building Permits Section ──────────────────────────────────────── */

const STATUS_COLOR: Record<string, string> = {
  "Permit Issued": "bg-emerald-100 text-emerald-700",
  "Inspection": "bg-blue-100 text-blue-700",
  "Closed": "bg-stone-100 text-stone-500",
  "Cancelled": "bg-red-100 text-red-600",
  "Revision Issued": "bg-amber-100 text-amber-700",
};

function formatCost(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function BuildingPermitsSection({
  permits,
  permitList,
}: {
  permits: NonNullable<NearbyData["building_permits"]>;
  permitList: NonNullable<NearbyData["building_permits"]>["permits"];
}) {
  const [showCount, setShowCount] = useState(5);
  const [workFilter, setWorkFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!workFilter) return permitList;
    return permitList.filter((p) => p.work === workFilter);
  }, [permitList, workFilter]);

  const visible = filtered.slice(0, showCount);

  return (
    <Card label="Building Permits">
      <div className="space-y-4">
        {/* Hero stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-[20px] font-bold text-stone-900">{permits.total}</p>
            <p className="text-[11px] text-stone-400">permits found</p>
          </div>
          <div>
            <p className="text-[20px] font-bold text-violet-600">
              {formatCost(permits.total_est_cost)}
            </p>
            <p className="text-[11px] text-stone-400">est. construction</p>
          </div>
          <div>
            <p className="text-[20px] font-bold text-stone-900">
              {permits.net_dwelling_units > 0 ? "+" : ""}
              {permits.net_dwelling_units}
            </p>
            <p className="text-[11px] text-stone-400">net dwelling units</p>
          </div>
          <div>
            <p className="text-[20px] font-bold text-stone-900">
              {Object.keys(permits.by_status).length}
            </p>
            <p className="text-[11px] text-stone-400">status categories</p>
          </div>
        </div>

        {/* Status breakdown */}
        {Object.keys(permits.by_status).length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-stone-400 mb-1.5">Permit Status</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(permits.by_status)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => (
                  <span
                    key={status}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      STATUS_COLOR[status] || "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {status} ({count})
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Work type filters */}
        {permits.by_work_type.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-stone-400 mb-1.5">Work Types</p>
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
          </div>
        )}

        {/* Permit list */}
        <div className="divide-y divide-stone-100">
          {visible.map((p) => (
            <div key={p.permit_num} className="py-2.5 first:pt-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        STATUS_COLOR[p.status] || "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {p.status || "Unknown"}
                    </span>
                    {p.est_cost != null && (
                      <span className="text-[11px] font-medium text-violet-600">
                        {formatCost(p.est_cost)}
                      </span>
                    )}
                    {(p.dwelling_units_created > 0 || p.dwelling_units_lost > 0) && (
                      <span className="text-[10px] text-stone-400">
                        {p.dwelling_units_created > 0 && `+${p.dwelling_units_created}`}
                        {p.dwelling_units_lost > 0 && ` -${p.dwelling_units_lost}`} units
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] font-medium text-stone-700 truncate">
                    {p.address || "Unknown location"}
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
                  {p.current_use && p.proposed_use && p.current_use !== p.proposed_use && (
                    <p className="mt-0.5 text-[10px] text-stone-400">
                      {p.current_use} → {p.proposed_use}
                    </p>
                  )}
                  <p className="mt-0.5 text-[10px] text-stone-400">
                    Permit: {p.permit_num}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[11px] text-stone-400">
                    {p.issued_date ? formatDate(p.issued_date) : formatDate(p.application_date)}
                  </span>
                </div>
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
          <p className="text-[12px] text-stone-400 italic py-4 text-center">
            No permits found matching this filter.
          </p>
        )}
      </div>
    </Card>
  );
}

/* ── Dev Applications Section ──────────────────────────────────────── */

const APP_STATUS_COLOR: Record<string, string> = {
  "Under Review": "bg-blue-100 text-blue-700",
  "Closed": "bg-stone-100 text-stone-500",
  "Approved": "bg-emerald-100 text-emerald-700",
  "OMB Approved": "bg-emerald-100 text-emerald-700",
  "Refused": "bg-red-100 text-red-600",
  "Complete": "bg-emerald-100 text-emerald-700",
};

const APP_TYPE_COLOR: Record<string, string> = {
  Rezoning: "bg-violet-100 text-violet-700",
  "Site Plan Approval": "bg-sky-100 text-sky-700",
  "Official Plan Amendment": "bg-amber-100 text-amber-700",
  "Plan of Subdivision": "bg-teal-100 text-teal-700",
  "Plan of Condominium": "bg-indigo-100 text-indigo-700",
};

function DevApplicationsSection({
  devApps,
  appList,
}: {
  devApps: NonNullable<NearbyData["dev_applications"]>;
  appList: NonNullable<NearbyData["dev_applications"]>["applications"];
}) {
  const [showCount, setShowCount] = useState(5);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!typeFilter) return appList;
    return appList.filter((a) => a.app_type === typeFilter);
  }, [appList, typeFilter]);

  const visible = filtered.slice(0, showCount);

  return (
    <Card label="Development Applications">
      <div className="space-y-4">
        {/* Hero stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-[20px] font-bold text-stone-900">{devApps.total}</p>
            <p className="text-[11px] text-stone-400">applications</p>
          </div>
          <div>
            <p className="text-[20px] font-bold text-stone-900">
              {devApps.by_type.length}
            </p>
            <p className="text-[11px] text-stone-400">application types</p>
          </div>
          <div>
            <p className="text-[20px] font-bold text-stone-900">
              {Object.keys(devApps.by_status).length}
            </p>
            <p className="text-[11px] text-stone-400">status categories</p>
          </div>
          <div>
            <p className="text-[20px] font-bold text-stone-900">
              {devApps.by_status["Under Review"] || 0}
            </p>
            <p className="text-[11px] text-stone-400">under review</p>
          </div>
        </div>

        {/* Type breakdown */}
        {devApps.by_type.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-stone-400 mb-1.5">Application Types</p>
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
          </div>
        )}

        {/* Status breakdown */}
        {Object.keys(devApps.by_status).length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-stone-400 mb-1.5">Status</p>
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
          </div>
        )}

        {/* Application list */}
        <div className="divide-y divide-stone-100">
          {visible.map((a) => (
            <div key={a.app_number} className="py-2.5 first:pt-0">
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
                  <p className="mt-1 text-[12px] font-medium text-stone-700 truncate">
                    {a.address || "Unknown location"}
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
                      {a.community_meeting_location && ` at ${a.community_meeting_location}`}
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
                <div className="shrink-0 text-right">
                  <span className="text-[11px] text-stone-400">
                    {formatDate(a.date_submitted)}
                  </span>
                </div>
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
          <p className="text-[12px] text-stone-400 italic py-4 text-center">
            No applications found matching this filter.
          </p>
        )}
      </div>
    </Card>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function NearbyActivityTab({ data }: { data: Record<string, any> }) {
  const coords = useMemo(() => data.coordinates || {}, [data.coordinates]);
  const nearby: NearbyData = data.nearby_activity || {};
  const dev = data.development_potential || {};

  const [radius, setRadius] = useState(nearby.radius_m || 500);
  const [liveData, setLiveData] = useState<NearbyData>(nearby);
  // Start loading immediately if nearby_activity was not included in the initial lookup response
  const [loading, setLoading] = useState(!data.nearby_activity);
  const [loadingMessage, setLoadingMessage] = useState(() =>
    `Searching ${nearby.radius_m || 500}m around ${data.address || "this location"}…`
  );

  // Effective standards for zone info
  const eff = data.effective_standards || {};
  const zoneCode = eff.zone_code || "";

  // Refetch when radius changes (if different from initial)
  const handleRadiusChange = useCallback(
    async (newRadius: number) => {
      setRadius(newRadius);
      if (!coords.longitude || !coords.latitude) return;

      setLoading(true);
      setLoadingMessage(`Searching ${newRadius}m around ${data.address || "this location"}…`);
      try {
        const params = new URLSearchParams({
          lon: String(coords.longitude),
          lat: String(coords.latitude),
          radius: String(newRadius),
        });
        if (zoneCode) params.set("zone_code", zoneCode);
        if (data.parcel?.frontage_m) params.set("lot_frontage_m", String(data.parcel.frontage_m));
        if (data.parcel?.area_sqm) params.set("lot_area_sqm", String(data.parcel.area_sqm));
        if (data.address) params.set("address", data.address);

        const res = await fetch(`/api/nearby-activity/stats?${params}`);
        if (res.ok) {
          const json = await res.json();
          setLiveData(json);
        }
      } catch (err) {
        console.error("Failed to fetch nearby activity stats:", err);
      } finally {
        setLoading(false);
      }
    },
    [coords, zoneCode, data.parcel, data.address],
  );

  // On mount: if nearby data wasn't included in the lookup response, fetch it now
  useEffect(() => {
    if (data.nearby_activity) return; // already loaded server-side
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
  const devAppList = useMemo(() => devApps?.applications || [], [devApps]);

  // Merge all event sources into a single array for MiniMap
  // Cap at 50 markers (sorted by recency) to keep the DOM lean in dense areas
  const MAP_EVENT_LIMIT = 50;
  const { mapEvents, mapEventTotal } = useMemo(() => {
    const merged: any[] = [];
    // CoA events
    for (const e of events) {
      merged.push({ ...e, _key: `evt-${e.id || merged.length}` });
    }
    // Building permits → map-compatible shape
    for (const p of permitList) {
      merged.push({
        _key: `bp-${p.permit_num}`,
        event_type: "building_permit",
        address: p.address,
        event_date: p.issued_date || p.application_date,
        _description: p.description || `${p.work} — ${p.structure_type}`,
        _status: p.status,
        _cost:
          p.est_cost != null
            ? p.est_cost >= 1_000_000
              ? `$${(p.est_cost / 1_000_000).toFixed(1)}M`
              : p.est_cost >= 1_000
                ? `$${(p.est_cost / 1_000).toFixed(0)}K`
                : `$${p.est_cost}`
            : undefined,
      });
    }
    // Dev applications → map-compatible shape
    for (const a of devAppList) {
      merged.push({
        _key: `da-${a.app_number}`,
        event_type: "dev_application",
        address: a.address,
        event_date: a.date_submitted,
        _description: a.description || a.app_type,
        _status: a.status,
        url: a.app_url || undefined,
      });
    }
    const total = merged.length;
    if (total > MAP_EVENT_LIMIT) {
      // Keep the most recent events for the map
      merged.sort((a, b) =>
        String(b.event_date || "").localeCompare(String(a.event_date || ""))
      );
      merged.splice(MAP_EVENT_LIMIT);
    }
    return { mapEvents: merged, mapEventTotal: total };
  }, [events, permitList, devAppList]);

  // OLT decisions from dev potential
  const oltDecisions = dev.olt_decisions || {};
  const oltSamples = oltDecisions.samples || oltDecisions.recent_decisions || [];

  const hasData = (overview?.total ?? 0) > 0;
  const hasPermits = (permits?.total ?? 0) > 0;
  const hasDevApps = (devApps?.total ?? 0) > 0;

  /* ── Skeleton loading state (shown while initial fetch is in progress) ── */
  if (loading && !hasData && events.length === 0 && !hasPermits && !hasDevApps) {
    return (
      <div className="space-y-6 py-6">
        <SectionHeading title="Nearby Activity" icon="📍" />
        {/* Informative loading status */}
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
          <p className="text-[12px] font-medium text-indigo-700">{loadingMessage}</p>
          <p className="mt-0.5 text-[11px] text-indigo-400">
            Querying Committee of Adjustment records, building permits, and development applications…
          </p>
        </div>
        <div className="animate-pulse space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-stone-100 bg-stone-100 h-20" />
            ))}
          </div>
          {/* Map placeholder */}
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 rounded-full bg-stone-100" />
            <div className="rounded-xl border border-stone-100 bg-stone-100 h-[320px]" />
          </div>
          {/* CoA / precedents section */}
          <div className="rounded-xl border border-stone-100 bg-white p-4 space-y-3">
            <div className="h-3.5 w-44 rounded-full bg-stone-100" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-stone-100" />
            ))}
          </div>
          {/* Building Permits section */}
          <div className="rounded-xl border border-stone-100 bg-white p-4 space-y-3">
            <div className="h-3.5 w-36 rounded-full bg-stone-100" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-stone-100" />
            ))}
          </div>
          {/* Dev Applications section */}
          <div className="rounded-xl border border-stone-100 bg-white p-4 space-y-3">
            <div className="h-3.5 w-52 rounded-full bg-stone-100" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-stone-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Empty state ─────────────────────────────────────────────────── */
  if (!hasData && events.length === 0 && !hasPermits && !hasDevApps) {
    return (
      <div className="space-y-6 py-6">
        <SectionHeading title="Nearby Activity" icon="📍" />
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-8 text-center">
          <p className="text-[14px] font-medium text-stone-500">
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

  return (
    <div className="space-y-6 py-6">
      {/* ─── Section A: Hero Stats ─────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between">
          <SectionHeading title="Variance Intelligence" icon="📍" />
          <RadiusSelector value={radius} onChange={handleRadiusChange} loading={loading} />
        </div>

        {loading && (
          <div className="mb-3 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
            <p className="text-[11px] text-indigo-600 animate-pulse">Updating data for {radius}m radius…</p>
          </div>
        )}

        {overview && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              value={overview.total}
              label="Applications"
              sub={`within ${radius}m`}
            />
            <StatCard
              value={pct(overview.approval_rate)}
              label="Approval Rate"
              sub={`${overview.approved} of ${overview.approved + overview.refused} decided`}
              accent
            />
            <StatCard
              value={overview.approved}
              label="Approved"
              sub={overview.refused > 0 ? `vs ${overview.refused} refused` : undefined}
            />
            <StatCard
              value={overview.pending + overview.withdrawn}
              label="Pending / Withdrawn"
              sub={`${overview.pending} pending, ${overview.withdrawn} withdrawn`}
            />
          </div>
        )}

        {/* Common variance types */}
        {overview && overview.common_variance_types.length > 0 && (
          <div className="mt-3">
            <p className="text-[11px] font-medium text-stone-400 mb-1.5">Common Variance Types</p>
            <div className="flex flex-wrap gap-1.5">
              {overview.common_variance_types.slice(0, 8).map((vt) => (
                <Tag key={vt.type}>
                  {metricLabel(vt.type)} ({vt.count})
                </Tag>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Section B: Mini-Map ───────────────────────────────────── */}
      {coords.latitude && coords.longitude && mapEvents.length > 0 && (
        <div>
          <SectionHeading title="Activity Map" icon="🗺️" count={mapEvents.length} />
          {mapEventTotal > MAP_EVENT_LIMIT && (
            <p className="mb-2 text-[10px] text-stone-400">
              Showing {MAP_EVENT_LIMIT} most recent of {mapEventTotal} total events
            </p>
          )}
          <MiniMap
            center={{ lat: coords.latitude, lon: coords.longitude }}
            events={mapEvents}
            radiusM={radius}
          />
        </div>
      )}

      {/* ─── Section C: Same-Zone Precedents ───────────────────────── */}
      {sameZone && sameZone.count > 0 && (
        <Card label={`Same Zone Precedents — ${sameZone.zone_code || "Unknown"}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[20px] font-bold text-stone-900">{sameZone.count}</p>
                <p className="text-[11px] text-stone-400">in same zone</p>
              </div>
              <div>
                <p className="text-[20px] font-bold text-emerald-600">{pct(sameZone.approval_rate)}</p>
                <p className="text-[11px] text-stone-400">approval rate</p>
              </div>
              <div>
                <p className="text-[20px] font-bold text-stone-900">{sameZone.approved || 0}</p>
                <p className="text-[11px] text-stone-400">approved</p>
              </div>
            </div>

            {/* Top variances approved in this zone */}
            {sameZone.top_variances.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-stone-400 mb-1.5">
                  Most Common Variances in Zone
                </p>
                <div className="space-y-1">
                  {sameZone.top_variances.slice(0, 5).map((v) => (
                    <div
                      key={v.type}
                      className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-1.5"
                    >
                      <span className="text-[12px] text-stone-600">
                        {metricLabel(v.type)}
                      </span>
                      <span className="text-[12px] font-mono text-stone-500">
                        {v.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample decisions */}
            {sameZone.sample_decisions.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-stone-400 mb-1.5">
                  Recent Decisions
                </p>
                <div className="divide-y divide-stone-100">
                  {sameZone.sample_decisions.map((d: any, i: number) => (
                    <div key={d.id || i} className="py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-stone-700">
                          {d.address || "Unknown"}
                        </span>
                        <Badge variant={EVENT_TYPE_BADGE[d.event_type] || "default"}>
                          {EVENT_TYPE_LABELS[d.event_type] || d.event_type}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-stone-400">
                        {formatDate(d.event_date)}
                        {d.distance_m != null && ` · ${d.distance_m}m away`}
                        {(d.source_id || d.raw_data?.REFERENCE_FILE) && ` · Ref: ${d.source_id || d.raw_data.REFERENCE_FILE}`}
                        {d.url && (
                          <>
                            {" · "}
                            <a
                              href={d.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
                            >
                              View on AIC &nearr;
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ─── Section D: Similar Lots ───────────────────────────────── */}
      {similarLots && similarLots.count > 0 && (
        <Card label="Similar Lot Analysis">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[20px] font-bold text-stone-900">{similarLots.count}</p>
                <p className="text-[11px] text-stone-400">similar lots found</p>
              </div>
              <div>
                <p className="text-[20px] font-bold text-emerald-600">{pct(similarLots.approval_rate)}</p>
                <p className="text-[11px] text-stone-400">approval rate</p>
              </div>
              <div>
                <p className="text-[12px] text-stone-500 mt-1">
                  Method: {similarLots.method?.replace(/_/g, " ") || "zone proximity"}
                </p>
              </div>
            </div>

            {similarLots.note && (
              <p className="text-[11px] text-stone-400 italic">{similarLots.note}</p>
            )}

            {/* Top matches */}
            {similarLots.matches.length > 0 && (
              <div className="divide-y divide-stone-100">
                {similarLots.matches.slice(0, 5).map((m: any, i: number) => (
                  <div key={m.id || i} className="py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-stone-700">
                        {m.address || "Unknown"}
                      </span>
                      <Badge variant={EVENT_TYPE_BADGE[m.event_type] || "default"}>
                        {EVENT_TYPE_LABELS[m.event_type] || m.event_type}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[11px] text-stone-400">
                      {formatDate(m.event_date)}
                      {m.distance_m != null && ` · ${m.distance_m}m away`}
                      {m.raw_data?.ZONING_DESIGNATION && ` · Zone: ${m.raw_data.ZONING_DESIGNATION}`}
                      {m.url && (
                        <>
                          {" · "}
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
                          >
                            View on AIC &nearr;
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ─── Section E: Activity Feed ──────────────────────────────── */}
      {events.length > 0 && (
        <div>
          <SectionHeading title="Recent Activity Feed" icon="📋" count={events.length} />
          <ActivityFeed events={events} />
        </div>
      )}

      {/* ─── Section F: OLT Decisions ──────────────────────────────── */}
      {oltSamples.length > 0 && (
        <Card label="OLT Appeal Decisions">
          <div className="space-y-3">
            {oltDecisions.appeal_success_rate != null && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[20px] font-bold text-stone-900">
                    {oltDecisions.total || oltSamples.length}
                  </p>
                  <p className="text-[11px] text-stone-400">OLT decisions found</p>
                </div>
                <div>
                  <p className="text-[20px] font-bold text-amber-600">
                    {pct(oltDecisions.appeal_success_rate)}
                  </p>
                  <p className="text-[11px] text-stone-400">appeal success rate</p>
                </div>
              </div>
            )}

            <div className="divide-y divide-stone-100">
              {oltSamples.slice(0, 5).map((d: any, i: number) => (
                <div key={i} className="py-2">
                  <p className="text-[12px] font-medium text-stone-700">
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
          </div>
        </Card>
      )}

      {/* ─── Section G: Building Permits ────────────────────────── */}
      {hasPermits && (
        <BuildingPermitsSection permits={permits!} permitList={permitList} />
      )}

      {/* ─── Section H: Dev Applications ───────────────────────── */}
      {hasDevApps && (
        <DevApplicationsSection devApps={devApps!} appList={devAppList} />
      )}

      {/* ─── Section I: Trend Chart ────────────────────────────────── */}
      {trend && trend.length > 0 && (
        <Card label="Approval Trend (Year over Year)">
          <TrendChart data={trend} />
        </Card>
      )}

      {/* ─── Disclaimer ───────────────────────────────────────────── */}
      <div className="rounded-lg border border-stone-100 bg-stone-50 px-4 py-3">
        <p className="text-[10px] text-stone-400 leading-relaxed">
          <strong>Disclaimer:</strong> Variance intelligence is based on historical Committee of
          Adjustment decisions and other publicly available data from Toronto Open Data. Approval
          rates and trends are statistical summaries, not predictions. Always consult a planning
          professional before making decisions based on this data.
        </p>
        <p className="mt-1.5 text-[10px] text-stone-400">
          Data sources:{" "}
          <a
            href="https://open.toronto.ca/dataset/committee-of-adjustment-decisions/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline"
          >
            CoA Decisions ↗
          </a>
          {" · "}
          <a
            href="https://open.toronto.ca/dataset/building-permits-active-permits/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline"
          >
            Building Permits ↗
          </a>
          {" · "}
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
