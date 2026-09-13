/**
 * Fund Guard — Audit Data Service
 * Decoupled Data Access Layer, Record Validation & Dynamic Aggregations
 */

import { MPLADSWork, MPAllocation, SystemSummary } from '../types/mplads';
import { RISK_THRESHOLDS, getRiskLevel } from './riskEngine';

export interface StateAggregation {
  state: string;
  totalWorks: number;
  totalAmount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  flaggedRate: number;
  avgUtilization: number;
  prohibitedCount: number;
  noTenderCount: number;
}

export interface ContractorProfile {
  contractorName: string;
  totalWorks: number;
  totalAmount: number;
  statesCovered: string[];
  highRiskCount: number;
  riskScoreAvg: number;
  categories: string[];
}

export interface ValidationResult {
  isValid: boolean;
  validCount: number;
  invalidCount: number;
  errors: string[];
}

/**
 * Validate raw MPLADS work records for required schema and fields
 */
export function validateWorkRecords(records: unknown[]): ValidationResult {
  const errors: string[] = [];
  let validCount = 0;
  let invalidCount = 0;

  if (!Array.isArray(records)) {
    return {
      isValid: false,
      validCount: 0,
      invalidCount: 0,
      errors: ['Input dataset is not an array of records.']
    };
  }

  records.forEach((rec, idx) => {
    if (!rec || typeof rec !== 'object') {
      invalidCount++;
      errors.push(`Record #${idx} is null or not an object.`);
      return;
    }

    const r = rec as Partial<MPLADSWork>;
    if (!r.work_id || typeof r.work_id !== 'string') {
      invalidCount++;
      errors.push(`Record #${idx} is missing valid 'work_id'.`);
      return;
    }

    if (!r.state || typeof r.state !== 'string') {
      invalidCount++;
      errors.push(`Record #${idx} (${r.work_id}) is missing 'state'.`);
      return;
    }

    if (typeof r.sanctioned_amount !== 'number' || isNaN(r.sanctioned_amount) || r.sanctioned_amount < 0) {
      invalidCount++;
      errors.push(`Record #${idx} (${r.work_id}) has invalid 'sanctioned_amount'.`);
      return;
    }

    validCount++;
  });

  return {
    isValid: invalidCount === 0,
    validCount,
    invalidCount,
    errors: errors.slice(0, 10), // Truncate to top 10 for performance
  };
}

/**
 * Compute dynamic system summary metrics directly from works array
 * Ensures national totals are NEVER statically hardcoded
 */
export function computeSystemSummary(works: MPLADSWork[], allocations: MPAllocation[] = []): SystemSummary {
  let totalSanctioned = 0;
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;
  let prohibitedCount = 0;
  let noTenderCount = 0;
  let lowUtilCount = 0;
  let mlOutlierCount = 0;

  works.forEach(w => {
    totalSanctioned += w.sanctioned_amount;

    const level = getRiskLevel(w.risk_score);
    if (level === 'critical' || level === 'high') {
      highRiskCount++;
    } else if (level === 'medium') {
      mediumRiskCount++;
    } else {
      lowRiskCount++;
    }

    if (w.rule_prohibited_category) prohibitedCount++;
    if (w.rule_no_tender_high_cost) noTenderCount++;
    if (w.rule_low_utilization) lowUtilCount++;
    if (w.ml_anomaly_score >= 0.65) mlOutlierCount++;
  });

  // Calculate unique MPs from allocations or works
  const uniqueMps = allocations.length > 0
    ? allocations.length
    : new Set(works.map(w => w.mp_name_constituency)).size;

  return {
    total_mps: uniqueMps,
    total_works: works.length,
    total_sanctioned_amount: totalSanctioned,
    high_risk_works_count: highRiskCount,
    medium_risk_works_count: mediumRiskCount,
    low_risk_works_count: lowRiskCount,
    flagged_prohibited_count: prohibitedCount,
    flagged_no_tender_count: noTenderCount,
    flagged_low_util_count: lowUtilCount,
    flagged_ml_outlier_count: mlOutlierCount,
  };
}

/**
 * Aggregate works by State for map, bar charts, and state drill-down
 */
export function aggregateWorksByState(works: MPLADSWork[]): Record<string, StateAggregation> {
  const stateMap: Record<string, StateAggregation> = {};

  works.forEach(w => {
    const st = w.state;
    if (!stateMap[st]) {
      stateMap[st] = {
        state: st,
        totalWorks: 0,
        totalAmount: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0,
        flaggedRate: 0,
        avgUtilization: 0,
        prohibitedCount: 0,
        noTenderCount: 0,
      };
    }

    const item = stateMap[st];
    item.totalWorks++;
    item.totalAmount += w.sanctioned_amount;
    item.avgUtilization += w.utilization_pct;

    const level = getRiskLevel(w.risk_score);
    if (level === 'critical' || level === 'high') {
      item.highRiskCount++;
    } else if (level === 'medium') {
      item.mediumRiskCount++;
    } else {
      item.lowRiskCount++;
    }

    if (w.rule_prohibited_category) item.prohibitedCount++;
    if (w.rule_no_tender_high_cost) item.noTenderCount++;
  });

  // Finalize averages and percentages
  Object.values(stateMap).forEach(item => {
    item.flaggedRate = item.totalWorks > 0 ? (item.highRiskCount / item.totalWorks) * 100 : 0;
    item.avgUtilization = item.totalWorks > 0 ? item.avgUtilization / item.totalWorks : 0;
  });

  return stateMap;
}

/**
 * Aggregate works by Contractor for network analysis & cartel detection
 */
export function aggregateWorksByContractor(works: MPLADSWork[]): Record<string, ContractorProfile> {
  const contractorMap: Record<string, ContractorProfile> = {};

  works.forEach(w => {
    const cName = w.contractor_name;
    if (!cName) return;

    if (!contractorMap[cName]) {
      contractorMap[cName] = {
        contractorName: cName,
        totalWorks: 0,
        totalAmount: 0,
        statesCovered: [],
        highRiskCount: 0,
        riskScoreAvg: 0,
        categories: [],
      };
    }

    const c = contractorMap[cName];
    c.totalWorks++;
    c.totalAmount += w.sanctioned_amount;
    c.riskScoreAvg += w.risk_score;

    if (!c.statesCovered.includes(w.state)) {
      c.statesCovered.push(w.state);
    }
    if (!c.categories.includes(w.category)) {
      c.categories.push(w.category);
    }

    if (w.risk_score >= RISK_THRESHOLDS.HIGH) {
      c.highRiskCount++;
    }
  });

  Object.values(contractorMap).forEach(c => {
    c.riskScoreAvg = c.totalWorks > 0 ? c.riskScoreAvg / c.totalWorks : 0;
  });

  return contractorMap;
}
