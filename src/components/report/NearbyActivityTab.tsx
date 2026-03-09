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
    ]).then(([rl, L]) => {
      setMapComponents({ rl, L: L.default || L });
    });
  }, []);

  if (!mapComponents) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-stone-200 bg-stone-50">
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
    L.divIcon({
      className: "",
      html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200">
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={15}
        style={{ height: "280px", width: "100%" }}
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
        {events
          .filter((e: any) => e.lat && e.lng)
          .map((e: any, i: number) => {
            const color = pinColors[e.event_type] || "#94a3b8";
            return (
              <Marker
                key={e.id || i}
                position={[e.lat, e.lng]}
                icon={markerIcon(color)}
              >
                <Popup>
                  <div className="text-[11px] leading-relaxed max-w-[200px]">
                    <p className="font-semibold text-stone-800">
                      {e.address || "Unknown"}
                    </p>
                    <p className="text-stone-500">
                      {EVENT_TYPE_LABELS[e.event_type] || e.event_type}
                    </p>
                    {e.event_date && (
                      <p className="text-stone-400">{formatDate(e.event_date)}</p>
                    )}
                    {e.distance_m != null && (
                      <p className="text-stone-400">{e.distance_m}m away</p>
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

/* ── Trend Bar Chart (pure CSS) ────────────────────────────────────── */

function TrendChart({
  data,
}: {
  data: { year: number; total: number; approved: number; refused: number; rate: number | null }[];
}) {
  if (!data || data.length === 0) {
    return <p className="text-[12px] text-stone-400 italic">Not enough data for trend analysis.</p>;
  }

  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.year} className="flex items-center gap-3">
          <span className="w-10 text-[12px] font-mono text-stone-500 text-right">
            {d.year}
          </span>
          <div className="flex-1">
            <div className="flex h-6 rounded overflow-hidden bg-stone-100">
              {d.approved > 0 && (
                <div
                  className="bg-emerald-400 transition-all duration-500"
                  style={{ width: `${(d.approved / maxTotal) * 100}%` }}
                  title={`${d.approved} approved`}
                />
              )}
              {d.refused > 0 && (
                <div
                  className="bg-red-400 transition-all duration-500"
                  style={{ width: `${(d.refused / maxTotal) * 100}%` }}
                  title={`${d.refused} refused`}
                />
              )}
            </div>
          </div>
          <span className="w-14 text-[11px] text-stone-500 text-right">
            {d.rate != null ? `${d.rate}%` : "—"}
          </span>
          <span className="w-8 text-[11px] text-stone-400 text-right">
            n={d.total}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-1">
        <span className="w-10" />
        <div className="flex gap-4 text-[10px] text-stone-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-emerald-400" /> Approved
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-red-400" /> Refused
          </span>
        </div>
        <span className="w-14 text-[10px] text-stone-400 text-right">Rate</span>
        <span className="w-8" />
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

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function NearbyActivityTab({ data }: { data: Record<string, any> }) {
  const coords = useMemo(() => data.coordinates || {}, [data.coordinates]);
  const nearby: NearbyData = data.nearby_activity || {};
  const dev = data.development_potential || {};

  const [radius, setRadius] = useState(nearby.radius_m || 500);
  const [liveData, setLiveData] = useState<NearbyData>(nearby);
  const [loading, setLoading] = useState(false);

  // Effective standards for zone info
  const eff = data.effective_standards || {};
  const zoneCode = eff.zone_code || "";

  // Refetch when radius changes (if different from initial)
  const handleRadiusChange = useCallback(
    async (newRadius: number) => {
      setRadius(newRadius);
      if (!coords.longitude || !coords.latitude) return;

      setLoading(true);
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
    [coords, zoneCode, data.parcel],
  );

  const overview = liveData.overview;
  const sameZone = liveData.same_zone;
  const similarLots = liveData.similar_lots;
  const trend = liveData.trend;
  const events = liveData.events || [];

  // OLT decisions from dev potential
  const oltDecisions = dev.olt_decisions || {};
  const oltSamples = oltDecisions.samples || oltDecisions.recent_decisions || [];

  const hasData = (overview?.total ?? 0) > 0;

  /* ── Empty state ─────────────────────────────────────────────────── */
  if (!hasData && events.length === 0) {
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
      {coords.latitude && coords.longitude && events.length > 0 && (
        <div>
          <SectionHeading title="Activity Map" icon="🗺️" count={events.filter((e: any) => e.lat && e.lng).length} />
          <MiniMap
            center={{ lat: coords.latitude, lon: coords.longitude }}
            events={events}
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

      {/* ─── Section G: Trend Chart ────────────────────────────────── */}
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
      </div>
    </div>
  );
}
