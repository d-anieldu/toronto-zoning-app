/**
 * Editable field whitelist — single source of truth.
 *
 * Only fields listed here show edit controls in report edit mode.
 * From 429+ rendered fields, these 57 are meaningful for professional overrides.
 */

export interface EditableFieldConfig {
  label: string;
  tab: string;
  type: "number" | "text" | "boolean";
}

export const EDITABLE_FIELDS: Record<string, EditableFieldConfig> = {
  // ── Summary Tab (18) ──────────────────────────────────────────────
  "effective_standards.zone_code":                                { label: "Zone Code",              tab: "summary", type: "text" },
  "effective_standards.height.effective_m":                       { label: "Height Limit (m)",       tab: "summary", type: "number" },
  "effective_standards.height.effective_storeys":                 { label: "Height Limit (storeys)", tab: "summary", type: "number" },
  "effective_standards.fsi.effective_total":                      { label: "FSI",                    tab: "summary", type: "number" },
  "effective_standards.lot_coverage.effective_pct":               { label: "Lot Coverage %",         tab: "summary", type: "number" },
  "effective_standards.setbacks.effective_front_m":               { label: "Front Setback (m)",      tab: "summary", type: "number" },
  "effective_standards.setbacks.effective_rear_m":                { label: "Rear Setback (m)",       tab: "summary", type: "number" },
  "effective_standards.setbacks.effective_side_m":                { label: "Side Setback (m)",       tab: "summary", type: "number" },
  "development_potential.lot.area_sqm":                          { label: "Parcel Size (m²)",      tab: "summary", type: "number" },
  "development_potential.lot.frontage_m":                        { label: "Lot Frontage (m)",       tab: "summary", type: "number" },
  "development_potential.lot.depth_m":                           { label: "Lot Depth (m)",          tab: "summary", type: "number" },
  "development_potential.max_gfa.sqm":                           { label: "Max GFA (m²)",           tab: "summary", type: "number" },
  "development_potential.coverage.max_footprint_sqm":            { label: "Max Footprint (m²)",     tab: "summary", type: "number" },
  "development_potential.setbacks.buildable_area_sqm":           { label: "Buildable Area (m²)",    tab: "summary", type: "number" },
  "development_potential.setbacks.buildable_width_m":            { label: "Buildable Width (m)",    tab: "summary", type: "number" },
  "development_potential.setbacks.buildable_depth_m":            { label: "Buildable Depth (m)",    tab: "summary", type: "number" },
  "effective_standards.parking.parking_zone":                    { label: "Parking Zone",           tab: "summary", type: "text" },
  "development_potential.parking_estimate.residential_spaces":   { label: "Est. Parking Spaces",    tab: "summary", type: "number" },

  // ── Building Envelope Tab (16) ────────────────────────────────────
  "effective_standards.height.base_default_m":                   { label: "Base Default Height (m)",       tab: "envelope", type: "number" },
  "effective_standards.height.overlay_m":                        { label: "Overlay Height (m)",            tab: "envelope", type: "number" },
  "effective_standards.fsi.commercial_max":                      { label: "Commercial FSI Max",            tab: "envelope", type: "number" },
  "effective_standards.fsi.residential_max":                     { label: "Residential FSI Max",           tab: "envelope", type: "number" },
  "effective_standards.lot_coverage.overlay_pct":                { label: "Overlay Coverage %",            tab: "envelope", type: "number" },
  "effective_standards.lot_dimensions.min_frontage_m":           { label: "Min Lot Frontage (m)",          tab: "envelope", type: "number" },
  "effective_standards.lot_dimensions.min_area_sqm":             { label: "Min Lot Area (m²)",             tab: "envelope", type: "number" },
  "effective_standards.zone_label.max_units":                    { label: "Max Dwelling Units",            tab: "envelope", type: "number" },
  "development_potential.angular_plane.angle_degrees":           { label: "Angular Plane Angle (°)",       tab: "envelope", type: "number" },
  "development_potential.shadow_analysis.nearest_park_distance_m": { label: "Distance to Nearest Park (m)", tab: "envelope", type: "number" },
  "development_potential.separation_distances.tower_separation.min_distance_m": { label: "Min Tower Separation (m)", tab: "envelope", type: "number" },
  "effective_standards.stepback_rules.podium_max_height_m":      { label: "Max Podium Height (m)",         tab: "envelope", type: "number" },
  "effective_standards.stepback_rules.tower_floorplate_max_sqm": { label: "Max Tower Floorplate (m²)",     tab: "envelope", type: "number" },
  "effective_standards.stepback_rules.tower_separation_m":       { label: "Tower Separation (m)",          tab: "envelope", type: "number" },
  "development_potential.floor_plate.max_sqm":                   { label: "Max Floor Plate (m²)",          tab: "envelope", type: "number" },
  "development_potential.height.max_m":                          { label: "Dev Potential Max Height (m)",   tab: "envelope", type: "number" },

  // ── Uses & Parking Tab (13) ───────────────────────────────────────
  "development_potential.parking_estimate.estimated_units":      { label: "Estimated Dwelling Units",      tab: "uses_parking", type: "number" },
  "development_potential.parking_estimate.visitor_spaces":       { label: "Visitor Parking Spaces",        tab: "uses_parking", type: "number" },
  "development_potential.parking_maximum.max_spaces_permitted":  { label: "Max Parking Spaces",            tab: "uses_parking", type: "number" },
  "development_potential.bicycle_parking.long_term":             { label: "Long-term Bicycle Spaces",      tab: "uses_parking", type: "number" },
  "development_potential.bicycle_parking.short_term":            { label: "Short-term Bicycle Spaces",     tab: "uses_parking", type: "number" },
  "development_potential.amenity_space.total_required_sqm":      { label: "Total Amenity Space (m²)",      tab: "uses_parking", type: "number" },
  "development_potential.amenity_space.indoor_required_sqm":     { label: "Indoor Amenity (m²)",           tab: "uses_parking", type: "number" },
  "development_potential.amenity_space.outdoor_required_sqm":    { label: "Outdoor Amenity (m²)",          tab: "uses_parking", type: "number" },
  "development_potential.inclusionary_zoning.effective_rate_pct": { label: "IZ Effective Rate %",           tab: "uses_parking", type: "number" },
  "development_potential.inclusionary_zoning.required_affordable_gfa_sqm": { label: "Required Affordable GFA (m²)", tab: "uses_parking", type: "number" },
  "development_potential.inclusionary_zoning.required_affordable_units": { label: "Est. Affordable Units",   tab: "uses_parking", type: "number" },
  "development_potential.loading_space.required_spaces":         { label: "Loading Spaces",                tab: "uses_parking", type: "number" },
  "effective_standards.parking.visitor_parking.formula":         { label: "Visitor Parking Formula",       tab: "uses_parking", type: "text" },

  // ── Constraints & Context Tab (10) ────────────────────────────────
  "layers.height_overlay.HT_LABEL":                             { label: "Height Overlay Value",          tab: "constraints_context", type: "text" },
  "layers.lot_coverage_overlay.PRCNT_CVER":                     { label: "Coverage Overlay Value",        tab: "constraints_context", type: "text" },
  "layers.building_setback_overlay.SETBACK":                    { label: "Setback Overlay Value",         tab: "constraints_context", type: "text" },
  "effective_standards.heritage_impact.combined_impact":         { label: "Heritage Impact Level",         tab: "constraints_context", type: "text" },
  "effective_standards.natural_hazards.combined_setback_m":      { label: "Hazard Combined Setback (m)",   tab: "constraints_context", type: "number" },
  "development_potential.coa_precedents.approval_rate":          { label: "CoA Approval Rate %",           tab: "constraints_context", type: "number" },
  "development_potential.development_charges.total_estimated":   { label: "Total Dev Charges ($)",         tab: "constraints_context", type: "number" },
  "effective_standards.op_context.op_designation.designation":   { label: "OP Designation",                tab: "constraints_context", type: "text" },
  "effective_standards.exception.exception_number":              { label: "Exception Number",              tab: "constraints_context", type: "text" },
  "development_potential.rental_replacement.potentially_applies": { label: "Rental Replacement Applies",   tab: "constraints_context", type: "boolean" },
};

export function isEditable(fieldPath: string): boolean {
  return fieldPath in EDITABLE_FIELDS;
}

export function getFieldConfig(fieldPath: string): EditableFieldConfig | undefined {
  return EDITABLE_FIELDS[fieldPath];
}

export function getFieldsForTab(tab: string): [string, EditableFieldConfig][] {
  return Object.entries(EDITABLE_FIELDS).filter(([, cfg]) => cfg.tab === tab);
}
