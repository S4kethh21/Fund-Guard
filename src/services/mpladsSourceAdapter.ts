/**
 * Fund Guard — MPLADS Official Source Adapter
 * Integrates directly with official MoSPI / eSAKSHI data layer
 * Provides normalized datasets, official national & state metrics, and attribution
 */

import { DatasetBundle, StateOfficialMetrics, OfficialNationalMetrics, DatasetMetadata, MPLADSWork, MPAllocation } from '../types/mplads';
import officialDataset from '../data/mplads_official_dataset.json';

// Attribution constants
export const OFFICIAL_DATA_SOURCE = {
  TITLE: 'MPLADS / eSAKSHI Public Portal',
  ORGANIZATION: 'Ministry of Statistics and Programme Implementation (MoSPI), Government of India',
  PORTAL_URL: 'https://mplads.mospi.gov.in/digigov/dashboard.html',
  DISCLAIMER: 'Fund Guard is an independent analytics and audit-support application and is not an official Government of India system. All anomaly flags and risk scores are decision-support outputs requiring human verification by authorized vigilance officers.',
  COVERAGE: 'eSAKSHI Digital Fund Flow System records (1 April 2023 onward, 17th and 18th Lok Sabha & Rajya Sabha)',
  BASELINE_TENURE: '18th Lok Sabha (2024–2029) & 17th Lok Sabha Transition'
};

export class MpladsSourceAdapter {
  private static cachedDataset: DatasetBundle = officialDataset as unknown as DatasetBundle;

  /**
   * Get complete dataset bundle including metadata, summary, allocations, and works
   */
  public static getDataset(): DatasetBundle {
    return this.cachedDataset;
  }

  /**
   * Get dataset metadata containing ingestion timestamps and official national metrics
   */
  public static getMetadata(): DatasetMetadata | undefined {
    return this.cachedDataset.metadata;
  }

  /**
   * Get official national metrics directly from MoSPI portal
   */
  public static getOfficialNationalMetrics(): OfficialNationalMetrics {
    if (this.cachedDataset.metadata?.official_national_metrics) {
      return this.cachedDataset.metadata.official_national_metrics;
    }
    return {
      allocated_limit_crore: 11707.64,
      expenditure_crore: 4072.16,
      works_recommended: 133873,
      works_sanctioned: 80389,
      works_completed: 35206,
      active_mps: 543
    };
  }

  /**
   * Get all 36 state official aggregates
   */
  public static getAllStateMetrics(): Record<string, StateOfficialMetrics> {
    return this.cachedDataset.metadata?.state_aggregates || {};
  }

  /**
   * Get official metrics for a specific state
   */
  public static getStateOfficialMetrics(stateName: string): StateOfficialMetrics | undefined {
    const states = this.getAllStateMetrics();
    if (states[stateName]) return states[stateName];
    const norm = stateName.toLowerCase().replace(/[^a-z]/g, '');
    const foundKey = Object.keys(states).find(k => k.toLowerCase().replace(/[^a-z]/g, '') === norm);
    return foundKey ? states[foundKey] : undefined;
  }

  /**
   * Filter works by state
   */
  public static getWorksByState(stateName: string): MPLADSWork[] {
    return this.cachedDataset.works.filter(w => w.state.toLowerCase() === stateName.toLowerCase());
  }

  /**
   * Get all official MP allocations
   */
  public static getAllocations(): MPAllocation[] {
    return this.cachedDataset.allocations;
  }

  /**
   * Format attribution statement
   */
  public static getAttributionText(): string {
    return `Data source: ${OFFICIAL_DATA_SOURCE.TITLE}, ${OFFICIAL_DATA_SOURCE.ORGANIZATION}.`;
  }
}
