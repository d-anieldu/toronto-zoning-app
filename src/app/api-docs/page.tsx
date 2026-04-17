import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Terminal,
  Layers,
  Search,
  MapPin,
  Building2,
  FileText,
  MessageSquare,
  Car,
} from "lucide-react";
import UserNav from "@/components/UserNav";
import { CopyButton } from "./CopyButton";

export const metadata = {
  title: "API Documentation — Toronto Zoning",
  description:
    "Use the Toronto Zoning API to look up zoning data, development potential, and GIS layers for any Toronto address.",
};

/* ── helpers ─────────────────────────────────────────── */

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-50 text-emerald-700 border-emerald-200",
    POST: "bg-sky-50 text-sky-700 border-sky-200",
  };
  return (
    <span
      className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${colors[method] ?? "bg-stone-50 text-stone-600 border-stone-200"}`}
    >
      {method}
    </span>
  );
}

function CodeBlock({ children, id }: { children: string; id: string }) {
  return (
    <div className="group relative">
      <pre className="overflow-x-auto rounded-xl border border-[var(--border)] bg-stone-950 p-5 text-[13px] leading-relaxed text-stone-300">
        <code>{children}</code>
      </pre>
      <CopyButton text={children} />
    </div>
  );
}

function ParamRow({
  name,
  type,
  required,
  desc,
}: {
  name: string;
  type: string;
  required?: boolean;
  desc: string;
}) {
  return (
    <tr className="border-b border-[var(--border)] last:border-0">
      <td className="py-2.5 pr-4 align-top">
        <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[12px] text-[var(--text-primary)]">
          {name}
        </code>
        {required && (
          <span className="ml-1.5 text-[10px] font-semibold text-red-500">
            required
          </span>
        )}
      </td>
      <td className="py-2.5 pr-4 align-top font-mono text-[12px] text-[var(--text-muted)]">
        {type}
      </td>
      <td className="py-2.5 text-[13px] text-[var(--text-secondary)]">
        {desc}
      </td>
    </tr>
  );
}

/* ── page ────────────────────────────────────────────── */

const BASE = "https://api.torontozoning.com";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-heading text-[15px] font-semibold tracking-tight text-[var(--text-primary)]"
          >
            Toronto Zoning
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="rounded-full bg-[var(--text-primary)] px-4 py-1.5 text-[13px] font-medium text-white hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pt-32 pb-20">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>

        {/* Title */}
        <div className="mt-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1">
            <Terminal className="h-3.5 w-3.5 text-sky-600" />
            <span className="text-[12px] font-medium text-sky-700">
              REST API
            </span>
          </div>
          <h1 className="font-heading mt-4 text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-[var(--text-primary)]">
            API Documentation
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-[var(--text-secondary)]">
            Access Toronto zoning data programmatically. Look up any address and
            get back effective standards, development potential, GIS layers, and
            more — the same data that powers the web app.
          </p>
        </div>

        {/* Base URL */}
        <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Base URL
          </p>
          <div className="mt-2 flex items-center gap-3">
            <code className="rounded-lg bg-stone-950 px-4 py-2 font-mono text-[14px] text-emerald-400">
              {BASE}
            </code>
          </div>
          <p className="mt-3 text-[13px] text-[var(--text-muted)]">
            All endpoints accept and return JSON. No authentication is required
            for public endpoints.
          </p>
        </div>

        {/* Quick start */}
        <section className="mt-16">
          <h2 className="font-heading text-[22px] font-bold tracking-tight text-[var(--text-primary)]">
            Quick Start
          </h2>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            Look up zoning data for any Toronto address with a single API call:
          </p>
          <div className="mt-4">
            <CodeBlock id="quickstart">{`curl -X POST ${BASE}/lookup \\
  -H "Content-Type: application/json" \\
  -d '{"address": "226 Viewmount Ave"}'`}</CodeBlock>
          </div>
        </section>

        {/* ──────────── ENDPOINTS ──────────── */}
        <div className="mt-16 space-y-20">
          {/* /lookup */}
          <section id="lookup">
            <div className="flex items-center gap-3">
              <MethodBadge method="POST" />
              <h3 className="font-heading text-[18px] font-bold text-[var(--text-primary)]">
                /lookup
              </h3>
            </div>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              The primary endpoint. Returns a complete zoning profile for a
              Toronto address including effective standards, development
              potential, GIS layers, and constraints.
            </p>

            <h4 className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Request Body
            </h4>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <tbody>
                  <ParamRow name="address" type="string" required desc="Toronto street address (e.g. &quot;226 Viewmount Ave&quot;)" />
                  <ParamRow name="include_parcel" type="boolean" desc="Include property boundary geometry. Default: true" />
                  <ParamRow name="include_nearby" type="boolean" desc="Include nearby development activity. Default: false" />
                  <ParamRow name="include_policy" type="boolean" desc="Include policy conformity analysis. Default: false" />
                  <ParamRow name="lot_area_sqm" type="number" desc="Override lot area (useful for assembly scenarios)" />
                  <ParamRow name="lot_frontage_m" type="number" desc="Override lot frontage" />
                  <ParamRow name="lot_depth_m" type="number" desc="Override lot depth" />
                  <ParamRow name="proposed_use" type="string" desc="Proposed use to analyze (e.g. &quot;restaurant&quot;, &quot;dwelling unit&quot;)" />
                </tbody>
              </table>
            </div>

            <h4 className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Response
            </h4>
            <div className="mt-3">
              <CodeBlock id="lookup-response">{`{
  "address": "226 Viewmount Ave",
  "coordinates": { "latitude": 43.65633, "longitude": -79.43123 },
  "effective_standards": {
    "zone_code": "RD",
    "zone_string": "RD (f12.0; a325) (x123)",
    "height": { "effective_m": 10, "effective_storeys": 3, "effective_source": "base_zone" },
    "fsi": { "effective_total": 0.6, "effective_source": "base_zone" },
    "lot_coverage": { "effective_pct": 35, "effective_source": "base_zone" },
    "setbacks": { "effective_front_m": 6.0, "effective_rear_m": 7.5, "effective_side_m": 1.2 },
    "exception": { "exception_number": 123 },
    "heritage_impact": { "has_heritage": false },
    "natural_hazards": { "has_hazards": false }
  },
  "development_potential": {
    "lot": { "area_sqm": 325, "frontage_m": 12.0, "depth_m": 27.1 },
    "max_gfa": { "sqm": 195, "limiting_factor": "lot_coverage" },
    "height": { "max_m": 10, "max_storeys": 3 },
    "setbacks": { "buildable_area_sqm": 195 },
    "confidence": { "overall_score": 85, "overall_confidence": "high", "grade": "A" }
  },
  "layers": {
    "zoning_area": [ ... ],
    "heritage_register": [ ... ],
    "major_transit_station_area": [ ... ]
  },
  "policy_conformity": { ... },
  "zoning_statistics_table": { ... }
}`}</CodeBlock>
            </div>
          </section>

          {/* /suggest */}
          <section id="suggest">
            <div className="flex items-center gap-3">
              <MethodBadge method="POST" />
              <h3 className="font-heading text-[18px] font-bold text-[var(--text-primary)]">
                /suggest
              </h3>
            </div>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Address autocomplete. Returns matching Toronto addresses for
              typeahead search.
            </p>

            <h4 className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Request Body
            </h4>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <tbody>
                  <ParamRow name="text" type="string" required desc="Partial address text (minimum 3 characters)" />
                  <ParamRow name="max_suggestions" type="number" desc="Maximum results to return. Default: 8" />
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <CodeBlock id="suggest-example">{`curl -X POST ${BASE}/suggest \\
  -H "Content-Type: application/json" \\
  -d '{"text": "226 view"}'

// Response
{
  "suggestions": [
    "226 Viewmount Ave",
    "226 View North Rd",
    ...
  ]
}`}</CodeBlock>
            </div>
          </section>

          {/* /lookup/batch */}
          <section id="batch">
            <div className="flex items-center gap-3">
              <MethodBadge method="POST" />
              <h3 className="font-heading text-[18px] font-bold text-[var(--text-primary)]">
                /lookup/batch
              </h3>
            </div>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Look up multiple addresses in a single request (up to 50).
            </p>

            <h4 className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Request Body
            </h4>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <tbody>
                  <ParamRow name="addresses" type="string[]" required desc="Array of Toronto addresses (max 50)" />
                  <ParamRow name="include_parcel" type="boolean" desc="Include property boundaries. Default: true" />
                  <ParamRow name="include_nearby" type="boolean" desc="Include nearby activity. Default: false" />
                  <ParamRow name="max_concurrency" type="number" desc="Max parallel lookups. Default: 10" />
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <CodeBlock id="batch-example">{`curl -X POST ${BASE}/lookup/batch \\
  -H "Content-Type: application/json" \\
  -d '{
    "addresses": [
      "226 Viewmount Ave",
      "100 Queen St W",
      "1 Yonge St"
    ]
  }'

// Response
{
  "results": [ ... ],
  "total": 3,
  "success_count": 3,
  "error_count": 0,
  "total_ms": 2340
}`}</CodeBlock>
            </div>
          </section>

          {/* /analyze-use */}
          <section id="analyze-use">
            <div className="flex items-center gap-3">
              <MethodBadge method="POST" />
              <h3 className="font-heading text-[18px] font-bold text-[var(--text-primary)]">
                /analyze-use
              </h3>
            </div>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Check if a specific use is permitted in a zone. Returns conditions,
              parking requirements, and by-law references.
            </p>

            <h4 className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Request Body
            </h4>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <tbody>
                  <ParamRow name="use" type="string" required desc='The use to analyze (e.g. "restaurant", "dwelling unit", "retail store")' />
                  <ParamRow name="report" type="object" required desc="Full zoning report object (from /lookup response)" />
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <CodeBlock id="analyze-use-example">{`// First, get a zoning report
const report = await fetch("${BASE}/lookup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ address: "100 Queen St W" })
}).then(r => r.json());

// Then check use eligibility
const analysis = await fetch("${BASE}/analyze-use", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    use: "restaurant",
    report: report
  })
}).then(r => r.json());`}</CodeBlock>
            </div>
          </section>

          {/* /analyze-use/list */}
          <section id="analyze-use-list">
            <div className="flex items-center gap-3">
              <MethodBadge method="POST" />
              <h3 className="font-heading text-[18px] font-bold text-[var(--text-primary)]">
                /analyze-use/list
              </h3>
            </div>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              List all available uses that can be analyzed for a given zone family.
            </p>

            <div className="mt-4">
              <CodeBlock id="use-list-example">{`curl -X POST ${BASE}/analyze-use/list \\
  -H "Content-Type: application/json" \\
  -d '{"zone_family": "CR"}'

// Response
{
  "uses": ["amusement arcade", "art gallery", "artist studio", "bar", ...]
}`}</CodeBlock>
            </div>
          </section>

          {/* /reference */}
          <section id="reference">
            <div className="flex items-center gap-3">
              <MethodBadge method="POST" />
              <h3 className="font-heading text-[18px] font-bold text-[var(--text-primary)]">
                /reference
              </h3>
            </div>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Fetch by-law text, exception details, SASP policies, or zone
              information.
            </p>

            <h4 className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Request Body
            </h4>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <tbody>
                  <ParamRow name="type" type="string" required desc='"bylaw-section", "exception", "sasp", "op-designation", or "zone-info"' />
                  <ParamRow name="id" type="string" required desc="Section ID, exception number, or policy reference" />
                  <ParamRow name="zone_code" type="string" desc="Zone code for context (optional)" />
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <CodeBlock id="reference-example">{`curl -X POST ${BASE}/reference \\
  -H "Content-Type: application/json" \\
  -d '{"type": "exception", "id": "123"}'

// Response
{
  "found": true,
  "title": "Exception 123",
  "text": "Despite regulation 10.20.40.10(1), the maximum ...",
  "data": { ... }
}`}</CodeBlock>
            </div>
          </section>

          {/* /map/metadata */}
          <section id="map-metadata">
            <div className="flex items-center gap-3">
              <MethodBadge method="GET" />
              <h3 className="font-heading text-[18px] font-bold text-[var(--text-primary)]">
                /map/metadata
              </h3>
            </div>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              List all available GIS layers with styling information. Useful for
              building map UIs.
            </p>

            <div className="mt-4">
              <CodeBlock id="map-metadata-example">{`curl ${BASE}/map/metadata

// Response
{
  "layers": [
    {
      "key": "zoning_area",
      "label": "Zoning Areas",
      "color": "#3b82f6",
      "weight": 2,
      "fillOpacity": 0.15,
      "group": "Zoning"
    },
    ...
  ]
}`}</CodeBlock>
            </div>
          </section>

          {/* /map/layers/{key} */}
          <section id="map-layers">
            <div className="flex items-center gap-3">
              <MethodBadge method="GET" />
              <h3 className="font-heading text-[18px] font-bold text-[var(--text-primary)]">
                {"/map/layers/{layer_key}"}
              </h3>
            </div>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Get GeoJSON features for a specific GIS layer within a radius of a
              coordinate.
            </p>

            <h4 className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Query Parameters
            </h4>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <tbody>
                  <ParamRow name="lon" type="number" required desc="Longitude" />
                  <ParamRow name="lat" type="number" required desc="Latitude" />
                  <ParamRow name="radius" type="number" desc="Radius in degrees. Default: 0.005" />
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <CodeBlock id="map-layers-example">{`curl "${BASE}/map/layers/zoning_area?lon=-79.431&lat=43.656&radius=0.005"

// Response: GeoJSON FeatureCollection
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Polygon", "coordinates": [...] },
      "properties": {
        "ZONE_CODE": "RD",
        "ZONE_LABEL": "Residential Detached",
        ...
      }
    }
  ]
}`}</CodeBlock>
            </div>
          </section>

          {/* /nearby-activity */}
          <section id="nearby-activity">
            <div className="flex items-center gap-3">
              <MethodBadge method="GET" />
              <h3 className="font-heading text-[18px] font-bold text-[var(--text-primary)]">
                /nearby-activity
              </h3>
            </div>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Nearby development activity — building permits, Committee of
              Adjustment applications, and rezoning applications.
            </p>

            <h4 className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Query Parameters
            </h4>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <tbody>
                  <ParamRow name="lon" type="number" required desc="Longitude" />
                  <ParamRow name="lat" type="number" required desc="Latitude" />
                  <ParamRow name="radius" type="number" desc="Radius in metres. Default: 500" />
                  <ParamRow name="limit" type="number" desc="Max events to return. Default: 50" />
                  <ParamRow name="event_type" type="string" desc='Filter by type: "permit", "coa", "rezoning"' />
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <CodeBlock id="nearby-example">{`curl "${BASE}/nearby-activity?lon=-79.431&lat=43.656&radius=500"

// Response
{
  "center": { "lon": -79.431, "lat": 43.656 },
  "radius_m": 500,
  "total": 12,
  "by_type": { "permit": 8, "coa": 3, "rezoning": 1 },
  "events": [ ... ]
}`}</CodeBlock>
            </div>
          </section>

          {/* /dev-charges/calculate */}
          <section id="dev-charges">
            <div className="flex items-center gap-3">
              <MethodBadge method="POST" />
              <h3 className="font-heading text-[18px] font-bold text-[var(--text-primary)]">
                /dev-charges/calculate
              </h3>
            </div>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Estimate development charges for a proposed project based on unit
              counts and building type.
            </p>

            <h4 className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Request Body
            </h4>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <tbody>
                  <ParamRow name="units_bachelor" type="number" desc="Number of bachelor units" />
                  <ParamRow name="units_2plus" type="number" desc="Number of 2+ bedroom units" />
                  <ParamRow name="units_lowrise" type="number" desc="Number of low-rise units" />
                  <ParamRow name="units_single_semi" type="number" desc="Number of single/semi units" />
                  <ParamRow name="non_residential_gfa_sqm" type="number" desc="Non-residential GFA in m²" />
                  <ParamRow name="is_purpose_built_rental" type="boolean" desc="Is this purpose-built rental? (affects exemptions)" />
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <CodeBlock id="dev-charges-example">{`curl -X POST ${BASE}/dev-charges/calculate \\
  -H "Content-Type: application/json" \\
  -d '{
    "units_2plus": 6,
    "is_purpose_built_rental": false
  }'

// Response
{
  "city_dc": { "items": [...], "subtotal": 142800 },
  "education_dc": { "items": [...], "subtotal": 18600 },
  "go_transit_dc": { ... },
  "exemptions_applied": [],
  "total_estimated": 168420
}`}</CodeBlock>
            </div>
          </section>

          {/* /chat */}
          <section id="chat">
            <div className="flex items-center gap-3">
              <MethodBadge method="POST" />
              <h3 className="font-heading text-[18px] font-bold text-[var(--text-primary)]">
                /chat
              </h3>
            </div>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              AI-powered zoning assistant. Ask natural language questions about
              Toronto zoning, optionally scoped to a specific address.
            </p>

            <h4 className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Request Body
            </h4>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <tbody>
                  <ParamRow name="question" type="string" required desc="Your zoning question in natural language" />
                  <ParamRow name="address" type="string" desc="Optional address for property-specific context" />
                  <ParamRow name="conversation_id" type="string" desc="For multi-turn conversations" />
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <CodeBlock id="chat-example">{`curl -X POST ${BASE}/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "Can I build a laneway suite at this address?",
    "address": "226 Viewmount Ave"
  }'

// Response
{
  "answer": "Based on the zoning for 226 Viewmount Ave (RD zone) ...",
  "sources": ["Chapter 150.8", "Exception 123"],
  "property_context": { ... },
  "status": "ok"
}`}</CodeBlock>
            </div>
          </section>
        </div>

        {/* Rate limits & notes */}
        <section className="mt-20 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="font-heading text-[15px] font-semibold text-amber-900">
            Usage Notes
          </h3>
          <ul className="mt-3 space-y-2 text-[13px] text-amber-800">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              The API is free during the beta period. Rate limits may be introduced in the future.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              Responses are cached for up to 1 hour. Identical requests will return cached results.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              Data is sourced from the City of Toronto Open Data Portal. This is not legal advice.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              Batch requests are limited to 50 addresses per call.
            </li>
          </ul>
        </section>

        {/* CTA */}
        <div className="mt-16 rounded-2xl bg-[var(--text-primary)] px-8 py-12 text-center shadow-xl">
          <h2 className="font-heading text-[22px] font-bold text-white">
            Ready to integrate?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-stone-400">
            Start making API calls now — no signup or API key required during beta.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--card)] px-6 py-3 text-[14px] font-semibold text-[var(--text-primary)] transition-all hover:bg-stone-50"
            >
              Try the web app
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
          <p className="text-[12px] text-[var(--text-muted)]">
            Data sourced from the City of Toronto Open Data Portal. Not legal
            advice.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-[var(--text-muted)]">
              By-law 569-2013
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
