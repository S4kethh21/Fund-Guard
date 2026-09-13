export interface MPAllocation {
  sr_no?: number;
  state: string;
  mp_and_constituency?: string;
  mp_name?: string;
  constituency?: string;
  allocated_amount: number;
  tenure?: string;
}

export interface MPLADSWork {
  work_id: string;
  mp_name_constituency: string;
  mp_name?: string;
  constituency?: string;
  state: string;
  category: string;
  sanctioned_amount: number;
  agency_type: string;
  contractor_name: string;
  tender_type: string;
  sanction_date: string;
  completion_date: string;
  utilization_pct: number;
  latitude: number;
  longitude: number;
  risk_score: number;
  risk_explanation: string;
  rule_prohibited_category: boolean;
  rule_no_tender_high_cost: boolean;
  rule_low_utilization: boolean;
  ml_anomaly_score: number;
  true_anomaly_type?: string;
  // Audit workflow state
  audit_status?: 'PENDING INSPECTION' | 'PHYSICAL INSPECTION RECOMMENDED' | 'DOCUMENTS REQUESTED' | 'ESCALATED TO CAG' | 'COMPLIANT VERIFIED';
  audit_notes?: string[];
  // Official eSAKSHI source metadata
  official_detail_id?: number;
  official_activity_name?: string;
  official_work_category?: string;
  official_work_stage?: string;
  official_letter_no?: string;
  official_ida_raw?: string;
  official_description?: string;
  official_tenure?: string;
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
  actor: string;
}

export interface SystemSummary {
  total_mps: number;
  total_works: number;
  total_sanctioned_amount: number;
  high_risk_works_count: number;
  medium_risk_works_count: number;
  low_risk_works_count: number;
  flagged_prohibited_count: number;
  flagged_no_tender_count: number;
  flagged_low_util_count: number;
  flagged_ml_outlier_count: number;
}

export interface StateOfficialMetrics {
  state_id: number;
  state_name: string;
  recommended_works: number;
  sanctioned_works: number;
  completed_works: number;
  allocated_crore: number;
  expenditure_crore: number;
  allocated_str: string;
  expenditure_str: string;
  utilization_rate: number;
}

export interface OfficialNationalMetrics {
  allocated_limit_crore: number;
  expenditure_crore: number;
  works_recommended: number;
  works_sanctioned: number;
  works_completed: number;
  active_mps: number;
}

export interface DatasetMetadata {
  source: string;
  source_url: string;
  disclaimer: string;
  coverage: string;
  ingested_at: string;
  official_national_metrics: OfficialNationalMetrics;
  state_aggregates: Record<string, StateOfficialMetrics>;
}

export interface DatasetBundle {
  metadata?: DatasetMetadata;
  generated_at?: string;
  summary: SystemSummary;
  allocations: MPAllocation[];
  works: MPLADSWork[];
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
