"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  /** layers dict from the backend (data.layers) — used to auto-toggle relevant layers */
  activeSiteLayers?: Record<string, any>;
  /** Zone code string e.g. "RD 3.0 (x123)" */
  zoneCode?: string;
  /** Lot area in m² */
  lotArea?: number;
  /** Lot frontage in m */
  frontage?: number;
  /** Zone label */
  zoneString?: string;
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

/* ── Basemap definitions ──────────────────────────────────────────── */

const BASEMAPS = {
  street: {
    label: "Street",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
  },
} as const;

type BasemapKey = keyof typeof BASEMAPS;

/* ── Human-readable field labels ──────────────────────────────────── */

const FIELD_LABELS: Record<string, string> = {
  ZBL_CHAPT: "By-law Chapter",
  ZBL_SECTN: "By-law Section",
  ZN_ZONE: "Zone",
  ZN_EXCEPTION: "Exception",
  ZN_HOLDING: "Holding Provision",
  ZONE_LABEL: "Zone Label",
  HT_LABEL: "Height (m)",
  HT_STORIES: "Storeys",
  HT_ZONE_NM: "Height Zone Name",
  PRCNT_CVER: "Coverage (%)",
  SETBACK: "Setback (m)",
  ZN_PARKZONE: "Parking Zone",
  POLICY_ARE: "Policy Area",
  POLICY_ID: "Policy ID",
  ROAD_NAME: "Road Name",
  RMG_STRING: "Rooming House Zone",
  RMH_AREA: "Rooming House Area",
  STATUS: "Status",
  HERITAGE_T: "Heritage Type",
  HCD_NAME: "District Name",
  HCD_NUM: "District Number",
  SECONDARY_PLAN_NAME: "Secondary Plan",
  SP_NAME: "Plan Name",
  SP_ID: "Plan ID",
  StationNam: "Station",
  MTSA_TYPE: "MTSA Type",
  ESA_NAME: "ESA Name",
  AREA_NAME: "Area Name",
  AREA_CL_CD: "Area Class",
  RAVINE_NAM: "Ravine Name",
  SASP_ID: "Policy Number",
  SASP: "Policy Number",
  CLASS: "Class",
  DESIGNATIO: "Designation",
  ZONING_DESIGNATION: "Zoning",
  REFERENCE_: "Reference",
  HEARING_DA: "Hearing Date",
  C_OF_A_DES: "Decision",
  DESCRIPTIO: "Description",
  ADDRESS: "Address",
  STREET_NUM: "Street No.",
  STREET_NAM: "Street Name",
  STREET_TYP: "Street Type",
};

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
      className="mr-2 inline-block h-3 w-3 shrink-0 rounded-full border border-white/40 shadow-sm"
      style={{ backgroundColor: color }}
    />
  );
}

/* ── Feature popup content with human-readable labels ──────────────── */

function featurePopupHtml(
  props: Record<string, any>,
  layerKey?: string
): string {
  // If the backend provides pre-rendered popup HTML, use it directly
  if (props._popup_html) {
    return props._popup_html;
  }

  // If the backend provides a _display dict (label → formatted value), render it
  if (props._display && typeof props._display === "object") {
    const display = props._display as Record<string, string>;
    const displayEntries = Object.entries(display).filter(
      ([, v]) => v != null && String(v).trim() !== ""
    );

    if (displayEntries.length === 0)
      return "<p style='font-size:11px;color:#78716c'>No details available</p>";

    const layerLabel = layerKey
      ? FIELD_LABELS[layerKey] ||
        layerKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "";

    const rows = displayEntries
      .map(([label, val]) => {
        let displayVal = String(val);

        // Status badges for known fields
        const lowerLabel = label.toLowerCase();
        if (
          lowerLabel.includes("status") ||
          lowerLabel.includes("holding") ||
          lowerLabel.includes("heritage")
        ) {
          const lower = displayVal.toLowerCase();
          let bg = "#f5f5f4";
          let fg = "#44403c";
          if (lower.includes("listed") || lower.includes("approv") || lower === "no") {
            bg = "#dcfce7";
            fg = "#166534";
          } else if (lower.includes("designated") || lower === "yes" || lower.includes("refus")) {
            bg = "#fee2e2";
            fg = "#991b1b";
          } else if (lower.includes("pending") || lower.includes("deferred")) {
            bg = "#fef3c7";
            fg = "#92400e";
          }
          if (bg !== "#f5f5f4") {
            displayVal = `<span style="display:inline-block;padding:1px 8px;border-radius:9999px;font-size:10px;font-weight:600;background:${bg};color:${fg}">${displayVal}</span>`;
          }
        }

        return `<tr>
          <td style="font-weight:600;padding:3px 10px 3px 0;color:#57534e;font-size:11px;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="font-size:11px;color:#1c1917;padding:3px 0">${displayVal}</td>
        </tr>`;
      })
      .join("");

    const title = layerLabel
      ? `<div style="font-weight:700;font-size:12px;color:#1c1917;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e7e5e4">${layerLabel}</div>`
      : "";

    return `<div style="max-width:340px">${title}<table style="border-collapse:collapse;width:100%">${rows}</table></div>`;
  }

  // Fallback: render raw properties (skip internal _-prefixed keys)
  const entries = Object.entries(props).filter(
    ([k, v]) => !k.startsWith("_") && v != null && String(v).trim() !== ""
  );

  if (entries.length === 0) return "<p style='font-size:11px;color:#78716c'>No details available</p>";

  const rows = entries
    .map(([k, v]) => {
      const label = FIELD_LABELS[k] || k.replace(/_/g, " ");
      let displayVal = String(v);

      // Status badges
      if (
        k === "STATUS" ||
        k === "C_OF_A_DES" ||
        k === "ZN_HOLDING"
      ) {
        const lower = displayVal.toLowerCase();
        let bg = "#f5f5f4";
        let fg = "#44403c";
        if (
          lower.includes("listed") ||
          lower.includes("approv") ||
          lower === "n"
        ) {
          bg = "#dcfce7";
          fg = "#166534";
        } else if (
          lower.includes("designated") ||
          lower === "y" ||
          lower.includes("refus")
        ) {
          bg = "#fee2e2";
          fg = "#991b1b";
        } else if (lower.includes("pending") || lower.includes("deferred")) {
          bg = "#fef3c7";
          fg = "#92400e";
        }
        displayVal = `<span style="display:inline-block;padding:1px 8px;border-radius:9999px;font-size:10px;font-weight:600;background:${bg};color:${fg}">${displayVal}</span>`;
      }

      // Percentage values
      if (k === "PRCNT_CVER" && !displayVal.endsWith("%")) {
        displayVal += "%";
      }

      return `<tr>
        <td style="font-weight:600;padding:3px 10px 3px 0;color:#57534e;font-size:11px;white-space:nowrap;vertical-align:top">${label}</td>
        <td style="font-size:11px;color:#1c1917;padding:3px 0">${displayVal}</td>
      </tr>`;
    })
    .join("");

  // Layer title
  const title = layerKey
    ? `<div style="font-weight:700;font-size:12px;color:#1c1917;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e7e5e4">${
        FIELD_LABELS[layerKey] || layerKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      }</div>`
    : "";

  return `<div style="max-width:340px">${title}<table style="border-collapse:collapse;width:100%">${rows}</table></div>`;
}

/* ================================================================== */
/*  MAIN PANEL                                                         */
/* ================================================================== */

export default function MapPanel({
  latitude,
  longitude,
  activeSiteLayers,
  zoneCode,
  lotArea,
  frontage,
  zoneString,
}: MapPanelProps) {
  /* ── State ────────────────────────────────────────────────────────── */
  const [metadata, setMetadata] = useState<LayerMeta[]>([]);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
  const [loadedData, setLoadedData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [parcelData, setParcelData] = useState<any>(null);
  const [parcelVisible, setParcelVisible] = useState(true);
  const [basemap, setBasemap] = useState<BasemapKey>("street");
  const [layerFilter, setLayerFilter] = useState("");
  const [autoLoaded, setAutoLoaded] = useState(false);
  const geoJsonRefs = useRef<Record<string, any>>({});
  const loadedDataRef = useRef(loadedData);
  useEffect(() => {
    loadedDataRef.current = loadedData;
  }, [loadedData]);

  /* ── Determine which layers are relevant for this property ────────── */
  const relevantLayerKeys = useMemo(() => {
    if (!activeSiteLayers) return new Set<string>();
    const keys = new Set<string>();
    for (const [key, val] of Object.entries(activeSiteLayers)) {
      if (val === null || val === undefined) continue;
      if (Array.isArray(val) && val.length === 0) continue;
      keys.add(key);
    }
    // Always include zoning_area as relevant
    keys.add("zoning_area");
    return keys;
  }, [activeSiteLayers]);

  /* ── Fetch a layer's GeoJSON ─────────────────────────────────────── */
  const fetchLayer = useCallback(
    (key: string) => {
      if (loadedDataRef.current[key]) return; // already loaded
      setLoading((l) => new Set(l).add(key));
      fetch(`/api/map/layers/${key}?lon=${longitude}&lat=${latitude}`)
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
    },
    [latitude, longitude]
  );

  /* ── Fetch layer metadata on mount ───────────────────────────────── */
  useEffect(() => {
    fetch(`/api/map/metadata`)
      .then((r) => r.json())
      .then((d) => setMetadata(d.layers || []))
      .catch((e) => console.error("Failed to load map metadata:", e));
  }, []);

  /* ── Auto-load relevant layers once metadata arrives ─────────────── */
  const pendingAutoLoad = useMemo(() => {
    if (autoLoaded || metadata.length === 0 || relevantLayerKeys.size === 0)
      return null;
    const validKeys = new Set(
      metadata.map((m) => m.key).filter((k) => relevantLayerKeys.has(k))
    );
    return validKeys.size > 0 ? validKeys : null;
  }, [metadata, relevantLayerKeys, autoLoaded]);

  useEffect(() => {
    if (!pendingAutoLoad) return;
    // Use a microtask to avoid synchronous setState warnings
    const id = requestAnimationFrame(() => {
      setActiveLayers(pendingAutoLoad);
      pendingAutoLoad.forEach((key) => fetchLayer(key));
      setAutoLoaded(true);
    });
    return () => cancelAnimationFrame(id);
  }, [pendingAutoLoad, fetchLayer]);

  /* ── Fetch nearby parcels on mount (with retry for cold-start) ──── */
  useEffect(() => {
    let cancelled = false;
    const fetchParcels = async (attempt = 1) => {
      try {
        const r = await fetch(`/api/map/parcels?lon=${longitude}&lat=${latitude}&radius=0.002`);
        if (!r.ok) throw new Error(`Parcels fetch ${r.status}`);
        const d = await r.json();
        if (!cancelled) setParcelData(d);
      } catch (e) {
        if (attempt < 3 && !cancelled) {
          // Retry with exponential backoff (backend may be loading the ~50 MB GeoDataFrame)
          setTimeout(() => fetchParcels(attempt + 1), 3000 * attempt);
        } else {
          console.error("Failed to load parcels:", e);
        }
      }
    };
    fetchParcels();
    return () => { cancelled = true; };
  }, [latitude, longitude]);

  /* ── Derived: subject parcel edges for dimension labels ──────────── */
  const subjectEdges = useMemo(() => {
    if (!parcelData?.features) return [];
    const subject = parcelData.features.find(
      (f: any) => f.properties?.is_subject
    );
    return subject?.properties?.edges || [];
  }, [parcelData]);

  /* ── Toggle a layer on/off ───────────────────────────────────────── */
  const toggleLayer = useCallback(
    (key: string) => {
      setActiveLayers((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
          fetchLayer(key);
        }
        return next;
      });
    },
    [fetchLayer]
  );

  /* ── Group layers + filter ───────────────────────────────────────── */
  const filteredMeta = useMemo(() => {
    if (!layerFilter.trim()) return metadata;
    const q = layerFilter.toLowerCase();
    return metadata.filter((lm) => lm.label.toLowerCase().includes(q));
  }, [metadata, layerFilter]);

  const groups: Record<string, LayerMeta[]> = {};
  for (const lm of filteredMeta) {
    if (!groups[lm.group]) groups[lm.group] = [];
    groups[lm.group].push(lm);
  }

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-col lg:flex-row min-h-[360px] lg:min-h-[520px]">
        {/* ── Map ────────────────────────────────────────────────── */}
        <div className="relative flex-1 min-h-[280px] lg:min-h-[400px]">
          <MapContainer
            center={[latitude, longitude]}
            zoom={17}
            maxZoom={22}
            scrollWheelZoom={true}
            className="h-full w-full"
            style={{ height: "100%" }}
          >
            <TileLayer
              key={basemap}
              attribution={BASEMAPS[basemap].attribution}
              url={BASEMAPS[basemap].url}
              maxNativeZoom={basemap === "satellite" ? 19 : 20}
              maxZoom={22}
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

            {/* Parcel boundaries (subject + neighbours) */}
            {parcelVisible &&
              parcelData &&
              parcelData.features?.length > 0 && (
                <GeoJSON
                  key={"parcels-" + basemap + "-" + parcelData.features.length}
                  data={parcelData}
                  style={(feature: any) => {
                    const isSub = feature?.properties?.is_subject;
                    return {
                      color: isSub
                        ? basemap === "satellite" ? "#facc15" : "#1e293b"
                        : basemap === "satellite" ? "#94a3b8" : "#a8a29e",
                      weight: isSub ? 3 : 1.5,
                      fillOpacity: isSub ? 0.08 : 0.02,
                      dashArray: isSub ? "6 4" : "4 3",
                    };
                  }}
                  onEachFeature={(feature, layer) => {
                    const p = feature.properties || {};
                    const lines = [];
                    if (p.is_subject) lines.push("<strong>Subject Property</strong>");
                    if (p.area_sqm)
                      lines.push(
                        `Area: ${Number(p.area_sqm).toFixed(1)} m²`
                      );
                    if (p.frontage_m)
                      lines.push(
                        `Frontage: ${Number(p.frontage_m).toFixed(1)} m`
                      );
                    if (p.depth_m)
                      lines.push(
                        `Depth: ${Number(p.depth_m).toFixed(1)} m`
                      );
                    if (lines.length) {
                      layer.bindPopup(
                        `<div style="font-size:12px">${lines.join("<br/>")}</div>`
                      );
                    }
                  }}
                />
              )}

            {/* Dimension labels on subject parcel edges */}
            {parcelVisible &&
              subjectEdges.length > 0 &&
              subjectEdges.map((edge: any, i: number) => (
                <Marker
                  key={`dim-${i}`}
                  position={[edge.midpoint[0], edge.midpoint[1]]}
                  icon={L.divIcon({
                    className: "",
                    html: `<span style="background:rgba(255,255,255,0.92);padding:1px 4px;border-radius:3px;font-size:10px;font-weight:600;color:#1e293b;white-space:nowrap;border:1px solid #cbd5e1;pointer-events:none">${edge.length_m.toFixed(1)}m</span>`,
                    iconSize: [0, 0],
                    iconAnchor: [0, 0],
                  })}
                  interactive={false}
                />
              ))}

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
                  key={key + "-" + fc.features.length + "-" + basemap}
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
                      layer.bindPopup(featurePopupHtml(p, key), {
                        maxWidth: 360,
                        maxHeight: 300,
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

          {/* Basemap toggle button — bottom-left of map */}
          <div className="absolute bottom-3 left-3 z-[1000]">
            <button
              onClick={() =>
                setBasemap((b) => (b === "street" ? "satellite" : "street"))
              }
              className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-600 shadow-md transition-colors hover:bg-stone-50"
              title="Switch basemap"
            >
              {basemap === "street" ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  Satellite
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                  Street
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Layer sidebar ──────────────────────────────────────── */}
        <div
          className="w-full overflow-y-auto border-t border-stone-200 bg-stone-50/60 lg:w-80 lg:border-l lg:border-t-0"
          style={{ maxHeight: 520 }}
        >
          {/* Property context header */}
          {(zoneCode || zoneString) && (
            <div className="border-b border-stone-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                This Property
              </p>
              {(zoneCode || zoneString) && (
                <p className="mt-1 text-[13px] font-bold text-stone-800">
                  {zoneString || zoneCode}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                {lotArea != null && lotArea !== -1 && (
                  <span className="text-[11px] text-stone-500">
                    <span className="font-medium text-stone-600">
                      {lotArea.toLocaleString(undefined, {
                        maximumFractionDigits: 1,
                      })}{" "}
                      m²
                    </span>{" "}
                    lot
                  </span>
                )}
                {frontage != null && frontage !== -1 && (
                  <span className="text-[11px] text-stone-500">
                    <span className="font-medium text-stone-600">
                      {frontage.toFixed(1)} m
                    </span>{" "}
                    frontage
                  </span>
                )}
              </div>
              {relevantLayerKeys.size > 1 && (
                <p className="mt-1.5 text-[10px] text-emerald-600">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 align-middle" />
                  {relevantLayerKeys.size} active overlay{relevantLayerKeys.size !== 1 ? "s" : ""} auto-loaded
                </p>
              )}
            </div>
          )}

          <div className="p-4">
            {/* Search / filter */}
            <div className="relative mb-3">
              <svg
                className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                value={layerFilter}
                onChange={(e) => setLayerFilter(e.target.value)}
                placeholder="Filter layers…"
                className="w-full rounded-lg border border-stone-200 bg-white py-1.5 pl-8 pr-3 text-[12px] text-stone-700 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300"
              />
              {layerFilter && (
                <button
                  onClick={() => setLayerFilter("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Parcel toggle */}
            <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-[12px] font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50">
              <input
                type="checkbox"
                checked={parcelVisible}
                onChange={() => setParcelVisible((v) => !v)}
                className="accent-stone-700"
              />
              <Dot color="#1e293b" />
              Property Parcels
            </label>

            {/* Grouped layer toggles */}
            {Object.entries(groups).map(([group, groupLayers]) => (
              <div key={group} className="mb-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  {group}
                </p>
                <div className="space-y-1">
                  {groupLayers.map((lm) => {
                    const isActive = activeLayers.has(lm.key);
                    const isLoading = loading.has(lm.key);
                    const isRelevant = relevantLayerKeys.has(lm.key);
                    const featureCount =
                      loadedData[lm.key]?.properties?.feature_count;
                    return (
                      <label
                        key={lm.key}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                          isActive
                            ? isRelevant
                              ? "border-emerald-200 bg-emerald-50/70 text-stone-800 shadow-sm"
                              : "border-stone-300 bg-white text-stone-800 shadow-sm"
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
                        {isRelevant && !isActive && (
                          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" title="Active for this property" />
                        )}
                        {isRelevant && isActive && (
                          <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                            Active
                          </span>
                        )}
                        {isLoading && (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                        )}
                        {isActive && !isLoading && !isRelevant && featureCount != null && (
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

            {layerFilter && filteredMeta.length === 0 && metadata.length > 0 && (
              <p className="text-[12px] text-stone-400">
                No layers match &ldquo;{layerFilter}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
