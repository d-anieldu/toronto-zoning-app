"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Types ─────────────────────────────────────────────────────────── */

interface LayerMeta {
  key: string;
  label: string;
  color: string;
  weight: number;
  fillOpacity: number;
  group: string;
  isPoint: boolean;
  isMulti: boolean;
}

interface MapPanelProps {
  latitude: number;
  longitude: number;
}

/* ── Fix Leaflet default icon (broken by Next.js bundling) ─────────── */

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/* ── Fly-to helper ─────────────────────────────────────────────────── */

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 17, { duration: 1 });
  }, [map, lat, lng]);
  return null;
}

/* ── Colour circle for sidebar labels ──────────────────────────────── */

function Dot({ color }: { color: string }) {
  return (
    <span
      className="mr-2 inline-block h-3 w-3 rounded-full border border-white/40 shadow-sm"
      style={{ backgroundColor: color }}
    />
  );
}

/* ── Feature popup content ─────────────────────────────────────────── */

function featurePopupHtml(props: Record<string, any>): string {
  const rows = Object.entries(props)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="font-weight:600;padding:2px 8px 2px 0;color:#57534e;font-size:11px;white-space:nowrap">${k}</td><td style="font-size:11px;color:#1c1917">${v}</td></tr>`
    )
    .join("");
  return `<table style="border-collapse:collapse">${rows}</table>`;
}

/* ================================================================== */
/*  MAIN PANEL                                                         */
/* ================================================================== */

export default function MapPanel({ latitude, longitude }: MapPanelProps) {
  /* ── State ────────────────────────────────────────────────────────── */
  const [metadata, setMetadata] = useState<LayerMeta[]>([]);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
  const [loadedData, setLoadedData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [parcelData, setParcelData] = useState<any>(null);
  const [parcelVisible, setParcelVisible] = useState(true);
  const geoJsonRefs = useRef<Record<string, any>>({});
  const loadedDataRef = useRef(loadedData);
  loadedDataRef.current = loadedData;

  /* ── Fetch layer metadata on mount ───────────────────────────────── */
  useEffect(() => {
    fetch(`/api/map/metadata`)
      .then((r) => r.json())
      .then((d) => setMetadata(d.layers || []))
      .catch((e) => console.error("Failed to load map metadata:", e));
  }, []);

  /* ── Fetch parcel on mount ───────────────────────────────────────── */
  useEffect(() => {
    fetch(`/api/map/parcel?lon=${longitude}&lat=${latitude}`)
      .then((r) => r.json())
      .then((d) => setParcelData(d))
      .catch((e) => console.error("Failed to load parcel:", e));
  }, [latitude, longitude]);

  /* ── Toggle a layer on/off ───────────────────────────────────────── */
  const toggleLayer = useCallback(
    (key: string) => {
      setActiveLayers((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
          // Fetch on first activation (use ref to avoid stale closure)
          if (!loadedDataRef.current[key]) {
            setLoading((l) => new Set(l).add(key));
            fetch(
              `/api/map/layers/${key}?lon=${longitude}&lat=${latitude}`
            )
              .then((r) => r.json())
              .then((fc) => {
                setLoadedData((prev) => ({ ...prev, [key]: fc }));
                setLoading((l) => {
                  const n = new Set(l);
                  n.delete(key);
                  return n;
                });
              })
              .catch(() => {
                setLoading((l) => {
                  const n = new Set(l);
                  n.delete(key);
                  return n;
                });
              });
          }
        }
        return next;
      });
    },
    [latitude, longitude]
  );

  /* ── Group layers ────────────────────────────────────────────────── */
  const groups: Record<string, LayerMeta[]> = {};
  for (const lm of metadata) {
    if (!groups[lm.group]) groups[lm.group] = [];
    groups[lm.group].push(lm);
  }

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-col lg:flex-row" style={{ minHeight: 520 }}>
        {/* ── Map ────────────────────────────────────────────────── */}
        <div className="relative flex-1" style={{ minHeight: 400 }}>
          <MapContainer
            center={[latitude, longitude]}
            zoom={17}
            scrollWheelZoom={true}
            className="h-full w-full"
            style={{ minHeight: 400, height: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <FlyTo lat={latitude} lng={longitude} />

            {/* Address marker */}
            <Marker position={[latitude, longitude]} icon={defaultIcon}>
              <Popup>
                <span className="text-xs font-semibold">
                  {latitude.toFixed(6)}°N, {Math.abs(longitude).toFixed(6)}°W
                </span>
              </Popup>
            </Marker>

            {/* Parcel boundary */}
            {parcelVisible &&
              parcelData &&
              parcelData.features?.length > 0 && (
                <GeoJSON
                  key="parcel"
                  data={parcelData}
                  style={{
                    color: "#1e293b",
                    weight: 3,
                    fillOpacity: 0.05,
                    dashArray: "6 4",
                  }}
                  onEachFeature={(feature, layer) => {
                    const p = feature.properties || {};
                    const lines = [];
                    if (p.area_sqm)
                      lines.push(
                        `Area: ${Number(p.area_sqm).toFixed(1)} m²`
                      );
                    if (p.frontage_m)
                      lines.push(
                        `Frontage: ${Number(p.frontage_m).toFixed(1)} m`
                      );
                    if (lines.length) {
                      layer.bindPopup(
                        `<div style="font-size:12px"><strong>Property Parcel</strong><br/>${lines.join("<br/>")}</div>`
                      );
                    }
                  }}
                />
              )}

            {/* Active GIS layers */}
            {Array.from(activeLayers).map((key) => {
              const fc = loadedData[key];
              if (!fc || !fc.features?.length) return null;
              const meta = metadata.find((m) => m.key === key);
              const style = {
                color: meta?.color || "#64748b",
                weight: meta?.weight || 2,
                fillOpacity: meta?.fillOpacity || 0.15,
              };
              return (
                <GeoJSON
                  key={key + "-" + fc.features.length}
                  ref={(ref) => {
                    if (ref) geoJsonRefs.current[key] = ref;
                  }}
                  data={fc}
                  style={style}
                  pointToLayer={(feature, latlng) =>
                    L.circleMarker(latlng, {
                      radius: 6,
                      fillColor: style.color,
                      color: "#fff",
                      weight: 1.5,
                      fillOpacity: 0.85,
                    })
                  }
                  onEachFeature={(feature, layer) => {
                    const p = feature.properties || {};
                    if (Object.keys(p).length) {
                      layer.bindPopup(featurePopupHtml(p), {
                        maxWidth: 360,
                        maxHeight: 280,
                      });
                    }
                  }}
                />
              );
            })}
          </MapContainer>

          {/* Loading spinner overlay */}
          {loading.size > 0 && (
            <div className="pointer-events-none absolute right-3 top-3 z-[1000] rounded-lg bg-white/90 px-3 py-1.5 text-[11px] font-medium text-stone-500 shadow-sm backdrop-blur">
              <span className="mr-1.5 inline-block h-3 w-3 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
              Loading layer…
            </div>
          )}
        </div>

        {/* ── Layer sidebar ──────────────────────────────────────── */}
        <div className="w-full overflow-y-auto border-t border-stone-200 bg-stone-50/60 p-4 lg:w-72 lg:border-l lg:border-t-0"
             style={{ maxHeight: 520 }}>
          <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
            GIS Layers
          </h4>

          {/* Parcel toggle */}
          <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-[12px] font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50">
            <input
              type="checkbox"
              checked={parcelVisible}
              onChange={() => setParcelVisible((v) => !v)}
              className="accent-stone-700"
            />
            <Dot color="#1e293b" />
            Property Parcel
          </label>

          {/* Grouped layer toggles */}
          {Object.entries(groups).map(([group, layers]) => (
            <div key={group} className="mb-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                {group}
              </p>
              <div className="space-y-1">
                {layers.map((lm) => {
                  const isActive = activeLayers.has(lm.key);
                  const isLoading = loading.has(lm.key);
                  const featureCount =
                    loadedData[lm.key]?.properties?.feature_count;
                  return (
                    <label
                      key={lm.key}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        isActive
                          ? "border-stone-300 bg-white text-stone-800 shadow-sm"
                          : "border-transparent text-stone-500 hover:bg-white/80 hover:text-stone-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleLayer(lm.key)}
                        className="accent-stone-700"
                      />
                      <Dot color={lm.color} />
                      <span className="flex-1 truncate">{lm.label}</span>
                      {isLoading && (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                      )}
                      {isActive && !isLoading && featureCount != null && (
                        <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500">
                          {featureCount}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {metadata.length === 0 && (
            <p className="text-[12px] text-stone-400">Loading layers…</p>
          )}
        </div>
      </div>
    </div>
  );
}
