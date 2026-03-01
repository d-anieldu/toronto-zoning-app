"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  data: Record<string, any>;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined || value === "not specified")
    return null;

  const display =
    typeof value === "object" ? JSON.stringify(value) : String(value);

  return (
    <div className="flex justify-between border-b border-gray-50 py-2 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{display}</span>
    </div>
  );
}

function OverlayBadge({
  label,
  active,
  detail,
}: {
  label: string;
  active: boolean;
  detail?: string;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-gray-100 bg-gray-50 text-gray-400"
      }`}
    >
      <span className="font-medium">{label}</span>
      {active && detail && (
        <span className="ml-1 text-blue-500">&middot; {detail}</span>
      )}
    </div>
  );
}

export default function ZoningReport({ data }: Props) {
  const eff = data.effective_standards || {};
  const dev = data.development_potential || {};
  const layers = data.layers || {};
  const coords = data.coordinates || {};

  const hasError = eff.error || dev.error;

  // Extract overlay status
  const overlays = [
    {
      key: "height_overlay",
      label: "Height",
      detail: layers.height_overlay
        ? `${layers.height_overlay.HT_LABEL}m / ${layers.height_overlay.HT_STORIES} storeys`
        : undefined,
    },
    {
      key: "lot_coverage_overlay",
      label: "Lot Coverage",
      detail: layers.lot_coverage_overlay
        ? `${layers.lot_coverage_overlay.PRCNT_CVER}%`
        : undefined,
    },
    {
      key: "building_setback_overlay",
      label: "Setback",
      detail: layers.building_setback_overlay
        ? `${layers.building_setback_overlay.SETBACK}m`
        : undefined,
    },
    {
      key: "parking_zone_overlay",
      label: "Parking Zone",
      detail: layers.parking_zone_overlay?.ZN_PARKZONE || undefined,
    },
    {
      key: "policy_area_overlay",
      label: "Policy Area",
      detail: layers.policy_area_overlay?.POLICY_ARE || undefined,
    },
    {
      key: "heritage_register",
      label: "Heritage",
      detail: layers.heritage_register?.STATUS || undefined,
    },
    {
      key: "heritage_conservation_district",
      label: "HCD",
      detail: layers.heritage_conservation_district?.HCD_NAME || undefined,
    },
    {
      key: "secondary_plan",
      label: "Secondary Plan",
      detail: layers.secondary_plan?.SECONDARY_PLAN_NAME || undefined,
    },
    {
      key: "major_transit_station_area",
      label: "MTSA",
      detail: layers.major_transit_station_area?.StationNam || undefined,
    },
    {
      key: "ravine_protection",
      label: "Ravine Protection",
      detail: undefined,
    },
    {
      key: "archaeological_potential",
      label: "Archaeological",
      detail: undefined,
    },
    {
      key: "environmentally_significant_area",
      label: "ESA",
      detail: layers.environmentally_significant_area?.ESA_NAME || undefined,
    },
  ];

  // Base zone info
  const baseZone =
    Array.isArray(layers.zoning_area) && layers.zoning_area.length > 0
      ? layers.zoning_area[0]
      : null;

  return (
    <div className="mt-8 space-y-6">
      {/* Address header */}
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-5">
        <h2 className="text-xl font-bold text-gray-900">{data.address}</h2>
        <p className="mt-1 text-sm text-gray-400">
          {coords.latitude?.toFixed(6)}°N, {Math.abs(coords.longitude)?.toFixed(6)}°W
        </p>
        {baseZone && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {baseZone.ZN_ZONE}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
              {baseZone.ZN_STRING}
            </span>
            {baseZone.ZN_EXCPTN === "Y" && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                Exception #{Math.trunc(baseZone.EXCPTN_NO)}
              </span>
            )}
          </div>
        )}
      </div>

      {hasError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {eff.error || dev.error}
        </div>
      )}

      {/* Overlays grid */}
      <Section title="Overlays & Layers">
        <div className="flex flex-wrap gap-2">
          {overlays.map((o) => (
            <OverlayBadge
              key={o.key}
              label={o.label}
              active={!!layers[o.key]}
              detail={o.detail}
            />
          ))}
        </div>
      </Section>

      {/* Effective standards */}
      {eff && !eff.error && (
        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Height & Density">
            <Row label="Max Height" value={eff.height?.effective_m ? `${eff.height.effective_m}m` : null} />
            <Row label="Max Storeys" value={eff.height?.effective_storeys} />
            <Row label="Height Source" value={eff.height?.effective_source} />
            <Row label="Floor Space Index (FSI)" value={eff.fsi?.effective_total} />
            <Row label="FSI Source" value={eff.fsi?.effective_source} />
            <Row label="Lot Coverage" value={eff.lot_coverage?.effective_pct ? `${eff.lot_coverage.effective_pct}%` : null} />
          </Section>

          <Section title="Setbacks">
            <Row label="Front" value={eff.setbacks?.effective_front_m ? `${eff.setbacks.effective_front_m}m` : null} />
            <Row label="Rear" value={eff.setbacks?.effective_rear_m ? `${eff.setbacks.effective_rear_m}m` : null} />
            <Row label="Side" value={eff.setbacks?.effective_side_m ? `${eff.setbacks.effective_side_m}m` : null} />
          </Section>

          <Section title="Lot Dimensions">
            <Row label="Min Frontage" value={eff.lot_dimensions?.min_frontage_m ? `${eff.lot_dimensions.min_frontage_m}m` : null} />
            <Row label="Min Area" value={eff.lot_dimensions?.min_area_sqm ? `${eff.lot_dimensions.min_area_sqm} m²` : null} />
          </Section>

          <Section title="Permitted Uses">
            <div className="flex flex-wrap gap-1.5">
              {eff.permitted_building_types?.map((t: string) => (
                <span
                  key={t}
                  className="rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Development potential */}
      {dev && !dev.error && (
        <Section title="Development Potential">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dev.max_gfa_sqm && (
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Number(dev.max_gfa_sqm).toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-gray-500">Max GFA (m²)</div>
              </div>
            )}
            {dev.max_units && (
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {dev.max_units}
                </div>
                <div className="mt-1 text-xs text-gray-500">Max Units</div>
              </div>
            )}
            {dev.max_storeys && (
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {dev.max_storeys}
                </div>
                <div className="mt-1 text-xs text-gray-500">Max Storeys</div>
              </div>
            )}
            {dev.required_parking_spaces !== undefined && (
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {dev.required_parking_spaces}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Parking Spaces
                </div>
              </div>
            )}
          </div>

          {dev.development_charges && (
            <div className="mt-4 rounded-lg border border-gray-100 p-4">
              <h4 className="text-sm font-medium text-gray-700">
                Estimated Development Charges
              </h4>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {dev.development_charges.city_charge && (
                  <Row label="City" value={`$${Number(dev.development_charges.city_charge).toLocaleString()}`} />
                )}
                {dev.development_charges.education_charge && (
                  <Row label="Education" value={`$${Number(dev.development_charges.education_charge).toLocaleString()}`} />
                )}
                {dev.development_charges.total && (
                  <Row label="Total" value={`$${Number(dev.development_charges.total).toLocaleString()}`} />
                )}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Planning contact */}
      {data.planning_contact && (
        <Section title="Planning Contact">
          <Row label="District" value={data.planning_contact.DISTRICT} />
          <Row label="Section" value={data.planning_contact.SECTION} />
          <Row label="Manager" value={data.planning_contact.MANAGER} />
          <Row label="Phone" value={data.planning_contact.PHONE} />
          <Row label="Email" value={data.planning_contact.EMAIL} />
        </Section>
      )}

      {/* Raw JSON toggle */}
      <details className="rounded-xl border border-gray-200 bg-white">
        <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
          View raw JSON response
        </summary>
        <pre className="max-h-96 overflow-auto border-t border-gray-100 px-5 py-4 text-xs text-gray-600">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
