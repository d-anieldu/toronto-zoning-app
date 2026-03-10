/**
 * Policy Conformity Checklist types.
 *
 * These mirror the backend output shape from core/policy_conformity.py.
 * The backend returns `data.policy_conformity` with this structure.
 */

export type ConformityStatus =
  | "conforms"
  | "requires_assessment"
  | "user_input_needed"
  | "potential_conflict"
  | "not_applicable";

export interface PolicyChecklistItem {
  id: string;
  section: string;
  title: string;
  requirement: string;
  status: ConformityStatus;
  evidence: string;
  data_source: string;
  user_notes: string | null;
}

export interface PolicyConformitySummary {
  total_items: number;
  conforms: number;
  requires_assessment: number;
  user_input_needed: number;
  potential_conflict: number;
  not_applicable: number;
}

export interface PolicyConformityChecklist {
  policy_name: string;
  effective_date?: string;
  designation?: string;
  designation_confidence?: string;
  designation_section?: string;
  summary: PolicyConformitySummary;
  items: PolicyChecklistItem[];
}

export interface SASPChecklist {
  policies_applicable: string[];
  summary: PolicyConformitySummary;
  items: PolicyChecklistItem[];
}

export interface SecondaryPlanChecklist {
  plan_name: string;
  op_section: string;
  summary: PolicyConformitySummary;
  items: PolicyChecklistItem[];
}

export interface PolicyConformityData {
  generated_at: string;
  property_address: string;
  overall_summary: PolicyConformitySummary;
  pps: PolicyConformityChecklist;
  growth_plan: PolicyConformityChecklist;
  official_plan: PolicyConformityChecklist;
  secondary_plan?: SecondaryPlanChecklist;
  sasp?: SASPChecklist;
  error?: string;
}
