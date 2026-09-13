/**
 * Fund Guard — Risk Engine Service
 * Institutional Risk Scoring, Statutory Rule Calibration & Explainability Engine
 */

import { MPLADSWork, RiskLevel } from '../types/mplads';

export const RISK_THRESHOLDS = {
  CRITICAL: 0.50,
  HIGH: 0.30,
  MODERATE: 0.15,
} as const;

export interface RiskFactorDetail {
  id: string;
  category: 'STATUTORY_VIOLATION' | 'PROCUREMENT_IRREGULARITY' | 'FUND_STALL' | 'STATISTICAL_OUTLIER' | 'NETWORK_COLLUSION';
  title: string;
  description: string;
  statutoryReference: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  weight: number;
}

export interface RiskEvaluationResult {
  score: number;
  level: RiskLevel;
  primaryReason: string;
  factors: RiskFactorDetail[];
  auditRecommendation: string;
  requiresPhysicalInspection: boolean;
}

// Prohibited keywords under MPLADS Guidelines Clause 5.1
const PROHIBITED_KEYWORDS = [
  'temple', 'mandir', 'masjid', 'mosque', 'church', 'gurudwara', 'religious',
  'memorial', 'statue', 'commercial complex', 'private club', 'private school',
  'party office', 'ashram', 'samadhi'
];

/**
 * Determine risk level from numeric risk score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.CRITICAL) return 'critical';
  if (score >= RISK_THRESHOLDS.HIGH) return 'high';
  if (score >= RISK_THRESHOLDS.MODERATE) return 'medium';
  return 'low';
}

/**
 * Check if work category or description falls under Clause 5.1 prohibited categories
 */
export function isProhibitedCategory(category: string, title?: string): boolean {
  const text = `${category} ${title || ''}`.toLowerCase();
  return PROHIBITED_KEYWORDS.some(kw => text.includes(kw));
}

/**
 * Check if work violates GFR 2017 Rule 149 (No competitive tender on works exceeding ₹25 Lakhs)
 */
export function isNoTenderHighCost(amount: number, tenderType: string): boolean {
  const isDirectOrNomination = ['Nomination', 'Direct Award', 'Single Tender', 'None'].includes(tenderType);
  return amount >= 2500000 && isDirectOrNomination;
}

/**
 * Check if work shows stalled fund utilization (< 40%)
 */
export function isLowUtilization(utilizationPct: number): boolean {
  return utilizationPct < 40;
}

/**
 * Check if ML isolation forest score flags statistical anomaly
 */
export function isMLOutlier(mlScore: number): boolean {
  return mlScore >= 0.65;
}

/**
 * Generate structured explainability factors and audit recommendation for a given MPLADS work
 */
export function evaluateWorkRisk(work: MPLADSWork): RiskEvaluationResult {
  const factors: RiskFactorDetail[] = [];
  const level = getRiskLevel(work.risk_score);

  if (work.rule_prohibited_category || isProhibitedCategory(work.category)) {
    factors.push({
      id: 'prohibited_category',
      category: 'STATUTORY_VIOLATION',
      title: 'Prohibited Work Category',
      description: `Category '${work.category}' flags prohibited scope (religious/commercial/private property).`,
      statutoryReference: 'MPLADS Guidelines Clause 5.1 / GFR 2017 Rule 194',
      severity: 'CRITICAL',
      weight: 0.40,
    });
  }

  if (work.rule_no_tender_high_cost || isNoTenderHighCost(work.sanctioned_amount, work.tender_type)) {
    factors.push({
      id: 'no_tender_high_cost',
      category: 'PROCUREMENT_IRREGULARITY',
      title: 'High-Value Non-Competitive Tender',
      description: `Sanctioned amount (₹${(work.sanctioned_amount / 100000).toFixed(1)}L) awarded via '${work.tender_type}' bypassing mandatory open e-tender.`,
      statutoryReference: 'General Financial Rules (GFR) 2017 Rule 149 / CVC Circular 01/01/2021',
      severity: 'HIGH',
      weight: 0.25,
    });
  }

  if (work.rule_low_utilization || isLowUtilization(work.utilization_pct)) {
    factors.push({
      id: 'low_utilization',
      category: 'FUND_STALL',
      title: 'Sub-Par Fund Utilization',
      description: `Current fund utilization is at ${work.utilization_pct.toFixed(1)}%, indicating stalled execution or parked funds.`,
      statutoryReference: 'MPLADS Scheme Implementation Guidelines Clause 3.12',
      severity: 'MEDIUM',
      weight: 0.15,
    });
  }

  if (work.ml_anomaly_score >= 0.65) {
    factors.push({
      id: 'ml_statistical_anomaly',
      category: 'STATISTICAL_OUTLIER',
      title: 'Multivariate Statistical Anomaly',
      description: `Isolation Forest model identified multivariate cost-agency-contractor divergence (Anomaly Score: ${work.ml_anomaly_score.toFixed(3)}).`,
      statutoryReference: 'AI Surveillance Calibrated Anomaly Detection',
      severity: work.ml_anomaly_score >= 0.80 ? 'CRITICAL' : 'HIGH',
      weight: 0.20,
    });
  }

  const primaryReason = factors.length > 0
    ? factors[0].title
    : work.risk_explanation || 'No statutory anomalies identified';

  let auditRecommendation = 'Routine oversight during scheduled district review.';
  let requiresPhysicalInspection = false;

  if (level === 'critical') {
    auditRecommendation = 'Immediate on-site physical inspection by District Collectorate and submission of measurement book verification.';
    requiresPhysicalInspection = true;
  } else if (level === 'high') {
    auditRecommendation = 'Pre-disbursement audit of procurement records and contractor bill submission.';
    requiresPhysicalInspection = true;
  } else if (level === 'medium') {
    auditRecommendation = 'Request contractor milestone progress logs and expenditure statements.';
  }

  return {
    score: work.risk_score,
    level,
    primaryReason,
    factors,
    auditRecommendation,
    requiresPhysicalInspection,
  };
}
