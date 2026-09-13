import React, { useState, useMemo } from 'react';
import { MPLADSWork } from '../types/mplads';
import { formatRupees, getRiskBadgeClasses, exportToCSV } from '../utils/formatters';
import { 
  Download, 
  Printer, 
  Ban, 
  Zap, 
  TrendingDown, 
  BrainCircuit, 
  Filter, 
  ArrowUpDown, 
  ArrowLeft 
} from 'lucide-react';

interface AuditWorklistViewProps {
  works: MPLADSWork[];
  onSelectWork: (work: MPLADSWork) => void;
  onBackToOverview?: () => void;
}

export const AuditWorklistView: React.FC<AuditWorklistViewProps> = ({
  works,
  onSelectWork,
  onBackToOverview
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<'risk_score' | 'sanctioned_amount' | 'state'>('risk_score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Compute Top 20 highest-risk works across India
  const baseTop20Works = useMemo(() => {
    return [...works]
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 20);
  }, [works]);

  // Filtered Top 20 according to priority chips
  const filteredTopWorks = useMemo(() => {
    let list = [...baseTop20Works];

    if (priorityFilter === 'critical') {
      list = list.filter(w => w.risk_score >= 0.65);
    } else if (priorityFilter === 'high') {
      list = list.filter(w => w.risk_score >= 0.35 && w.risk_score < 0.65);
    } else if (priorityFilter === 'prohibited') {
      list = list.filter(w => w.rule_prohibited_category);
    } else if (priorityFilter === 'low_util') {
      list = list.filter(w => w.rule_low_utilization);
    } else if (priorityFilter === 'no_tender') {
      list = list.filter(w => w.rule_no_tender_high_cost);
    } else if (priorityFilter === 'network') {
      list = list.filter(w => w.ml_anomaly_score >= 0.70 || w.risk_score >= 0.60);
    }

    return list.sort((a, b) => {
      if (sortColumn === 'state') {
        return sortAsc ? a.state.localeCompare(b.state) : b.state.localeCompare(a.state);
      }
      const valA = a[sortColumn];
      const valB = b[sortColumn];
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [baseTop20Works, priorityFilter, sortColumn, sortAsc]);

  // Aggregate statistics for the Top 20 queue
  const queueStats = useMemo(() => {
    const totalAmount = baseTop20Works.reduce((sum, w) => sum + w.sanctioned_amount, 0);
    const avgRisk = baseTop20Works.reduce((sum, w) => sum + w.risk_score, 0) / baseTop20Works.length;
    const prohibitedCount = baseTop20Works.filter(w => w.rule_prohibited_category).length;
    const noTenderCount = baseTop20Works.filter(w => w.rule_no_tender_high_cost).length;
    return { totalAmount, avgRisk, prohibitedCount, noTenderCount };
  }, [baseTop20Works]);

  const handleExportCSV = () => {
    const exportData = baseTop20Works.map((w, idx) => ({
      priority_rank: idx + 1,
      work_id: w.work_id,
      risk_score: w.risk_score,
      priority_level: w.risk_score >= 0.65 ? 'CRITICAL' : w.risk_score >= 0.35 ? 'HIGH' : 'MEDIUM',
      state: w.state,
      mp_and_constituency: w.mp_name_constituency,
      category: w.category,
      sanctioned_amount_inr: w.sanctioned_amount,
      tender_type: w.tender_type,
      contractor_name: w.contractor_name,
      agency_type: w.agency_type,
      utilization_pct: w.utilization_pct,
      rule_prohibited_category: w.rule_prohibited_category ? 'YES' : 'NO',
      rule_no_tender_high_cost: w.rule_no_tender_high_cost ? 'YES' : 'NO',
      rule_low_utilization: w.rule_low_utilization ? 'YES' : 'NO',
      isolation_forest_score: w.ml_anomaly_score,
      why_priority: `${(w.rule_prohibited_category ? 1 : 0) + (w.rule_no_tender_high_cost ? 1 : 0) + (w.rule_low_utilization ? 1 : 0) + (w.ml_anomaly_score > 0.65 ? 1 : 0)} independent risk indicators`,
      auditor_explanation: w.risk_explanation,
      gps_latitude: w.latitude,
      gps_longitude: w.longitude
    }));

    exportToCSV(exportData, `MPLADS_Top20_Audit_Inspection_Queue_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handlePrint = () => {
    window.print();
  };

  const getPriorityReason = (w: MPLADSWork) => {
    const count = (w.rule_prohibited_category ? 1 : 0) + 
                  (w.rule_no_tender_high_cost ? 1 : 0) + 
                  (w.rule_low_utilization ? 1 : 0) + 
                  (w.ml_anomaly_score > 0.65 ? 1 : 0);
    if (count >= 3) return `${count} concurrent risk flags`;
    if (w.rule_prohibited_category) return "Clause 5.1 negative list";
    if (w.rule_no_tender_high_cost) return "High-cost nomination (>₹25L)";
    if (w.rule_low_utilization) return `Stalled funds (${w.utilization_pct}%)`;
    return "Multivariate ML outlier";
  };

  return (
    <div className="space-y-5">
      {/* Back to Overview Navigation Bar */}
      {onBackToOverview && (
        <div className="flex items-center justify-between text-xs pb-1">
          <button
            onClick={onBackToOverview}
            className="text-[var(--text-secondary)] hover:text-blue-700 dark:hover:text-blue-400 flex items-center space-x-1.5 font-semibold transition-colors group px-2.5 py-1.5 rounded-md bg-[var(--surface)] border border-[var(--border)] shadow-2xs hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform group-hover:-translate-x-0.5" />
            <span>← Back to National Overview Command Center</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span className="text-[11px] font-mono text-[var(--text-muted)] font-bold uppercase tracking-wider">
              FIELD AUDIT DISPATCH QUEUE
            </span>
          </div>
        </div>
      )}

      {/* Executive Inspection Header */}
      <div className="bg-[var(--surface)] p-5 rounded-lg border border-[var(--border)] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-red-700 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-2xs">
                CAG &amp; DM Field Audit Dispatch
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-mono bg-[var(--surface-raised)] px-2 py-0.5 rounded border border-[var(--border)]">
                CYCLE: FY 2024-25 Q3 • GFR 2017 &amp; Clause 5.1 Calibrated
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1 tracking-tight">
              Prioritized Physical Audit Worklist (Top 20 Critical Queue)
            </h1>
            <p className="text-xs text-[var(--text-secondary)] max-w-3xl mt-0.5 leading-relaxed">
              Ranked cross-India master inspection queue generated by multi-criteria anomaly scoring and GFR 2017 single-bid classification. District Magistrates &amp; CAG inspection teams should prioritize physical spot checks on these 20 sites.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white rounded-md text-xs font-bold flex items-center space-x-2 transition-all shadow-sm border border-blue-500/30 hover:shadow-md active:scale-98 cursor-pointer"
              title="Download entire queue as official CSV audit worklist"
            >
              <Download className="w-4 h-4 text-cyan-200" />
              <span>Export Audit Schedule (CSV)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Print official audit worklist schedule"
            >
              <Printer className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="hidden sm:inline">Print Schedule</span>
            </button>
          </div>
        </div>

        {/* Queue Overview Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--border)] text-xs">
          <div className="bg-[var(--surface-raised)] p-3 rounded-lg border border-[var(--border)] border-t-3 border-t-blue-600">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider">Funds in Top 20 Queue</span>
            <span className="font-bold font-mono text-[var(--text-primary)] text-lg sm:text-xl mt-0.5 block">
              {formatRupees(queueStats.totalAmount)}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">High Public Fund Exposure</span>
          </div>

          <div className="bg-red-50/70 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-900/40 border-t-3 border-t-red-600">
            <span className="text-red-700 dark:text-red-400 block text-[10px] uppercase font-bold tracking-wider">Average Risk Score</span>
            <span className="font-bold font-mono text-red-600 dark:text-red-400 text-lg sm:text-xl mt-0.5 block">
              {queueStats.avgRisk.toFixed(3)}
            </span>
            <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold mt-0.5 block">Exceeds 0.60 Critical Tier</span>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 border-t-3 border-t-amber-500">
            <span className="text-amber-800 dark:text-amber-400 block text-[10px] uppercase font-bold tracking-wider">Clause 5.1 Negative List</span>
            <span className="font-bold font-mono text-amber-900 dark:text-amber-300 text-lg sm:text-xl mt-0.5 block">
              {queueStats.prohibitedCount} <span className="text-xs font-normal text-[var(--text-secondary)]">works</span>
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-0.5 block">Prohibited Asset Types</span>
          </div>

          <div className="bg-[var(--surface-raised)] p-3 rounded-lg border border-[var(--border)] border-t-3 border-t-slate-700 dark:border-t-slate-400">
            <span className="text-[var(--text-secondary)] block text-[10px] uppercase font-bold tracking-wider">Un-tendered High Cost</span>
            <span className="font-bold font-mono text-[var(--text-primary)] text-lg sm:text-xl mt-0.5 block">
              {queueStats.noTenderCount} <span className="text-xs font-normal text-[var(--text-muted)]">works</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">Single-Bid Nomination</span>
          </div>
        </div>

        {/* PRIORITY QUICK FILTERS */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-3 mt-3 border-t border-[var(--border)] text-xs">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase font-bold mr-1 flex items-center whitespace-nowrap">
            <Filter className="w-3 h-3 mr-1 text-[var(--text-muted)]" />
            FILTER QUEUE:
          </span>
          {[
            { id: 'all', label: `All 20 Priorities (${baseTop20Works.length})` },
            { id: 'critical', label: 'Critical Tier (Score ≥ 0.65)' },
            { id: 'high', label: 'High Tier (Score 0.35 - 0.65)' },
            { id: 'prohibited', label: '🚫 Prohibited Category' },
            { id: 'no_tender', label: '⚡ No-Tender Single Bid' },
            { id: 'low_util', label: '📉 Low Utilization' },
            { id: 'network', label: '🕸️ Multi-District Agency Cluster' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setPriorityFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap font-semibold transition-all cursor-pointer ${
                priorityFilter === f.id
                  ? 'bg-blue-800 text-white font-bold shadow-xs'
                  : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 20 Ranked Table */}
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-[var(--surface-raised)] border-b border-[var(--border)] flex flex-wrap justify-between items-center text-xs gap-2">
          <div className="font-bold text-[var(--text-primary)] flex items-center space-x-2">
            <span>Official Master Inspection Priority Roster</span>
            <span className="text-[var(--text-muted)] font-normal font-mono text-[11px]">
              | Showing {filteredTopWorks.length} of 20 Priority Sites
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)] font-semibold">
            STATUS: PENDING MANDATORY FIELD INSPECTION ORDER
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)] text-xs">
            <thead className="bg-[var(--surface-raised)] text-[#344054] dark:text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3 py-3 text-center w-14">Rank</th>
                <th 
                  className="px-3 py-3 text-left cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                  onClick={() => {
                    if (sortColumn === 'risk_score') setSortAsc(!sortAsc);
                    else { setSortColumn('risk_score'); setSortAsc(false); }
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span>Risk Score</span>
                    <ArrowUpDown className="w-3 h-3 text-[var(--text-muted)]" />
                  </div>
                </th>
                <th className="px-3 py-3 text-left">Priority Tier</th>
                <th className="px-3 py-3 text-left">Audit Anomaly Indicator</th>
                <th className="px-3 py-3 text-left">Work ID</th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                  onClick={() => {
                    if (sortColumn === 'state') setSortAsc(!sortAsc);
                    else { setSortColumn('state'); setSortAsc(false); }
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span>State &amp; Constituency</span>
                    <ArrowUpDown className="w-3 h-3 text-[var(--text-muted)]" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                  onClick={() => {
                    if (sortColumn === 'sanctioned_amount') setSortAsc(!sortAsc);
                    else { setSortColumn('sanctioned_amount'); setSortAsc(false); }
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span>Sanctioned ₹</span>
                    <ArrowUpDown className="w-3 h-3 text-[var(--text-muted)]" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left">Implementing Agency / Authority</th>
                <th className="px-4 py-3 text-left">Violation Flags</th>
                <th className="px-3 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
              {filteredTopWorks.map((work) => {
                const badge = getRiskBadgeClasses(work.risk_score);
                const rankNum = baseTop20Works.findIndex(w => w.work_id === work.work_id) + 1;
                const priorityTier = work.risk_score >= 0.65 ? 'CRITICAL' : work.risk_score >= 0.40 ? 'HIGH' : 'MEDIUM';

                return (
                  <tr 
                    key={work.work_id} 
                    className="hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
                    onClick={() => onSelectWork(work)}
                  >
                    {/* Rank Badge */}
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold font-mono text-xs ${
                        rankNum === 1
                          ? 'bg-red-700 text-white ring-2 ring-red-400 shadow-xs'
                          : rankNum <= 3
                          ? 'bg-red-600 text-white shadow-xs'
                          : rankNum <= 10
                          ? 'bg-slate-800 dark:bg-slate-700 text-white'
                          : 'bg-slate-200 dark:bg-[#1E2B3E] text-slate-700 dark:text-[#A8B2C1]'
                      }`}>
                        #{rankNum}
                      </span>
                    </td>

                    {/* Risk Score */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono border ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dot}`}></span>
                        {work.risk_score.toFixed(3)}
                      </span>
                    </td>

                    {/* Priority Tier Badge */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${
                        priorityTier === 'CRITICAL' 
                          ? 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/60' 
                          : priorityTier === 'HIGH' 
                          ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-900/60' 
                          : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
                      }`}>
                        {priorityTier}
                      </span>
                    </td>

                    {/* Why Priority Column */}
                    <td className="px-3 py-3 text-[11px] font-medium whitespace-nowrap">
                      <span className="bg-[var(--surface-raised)] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--text-primary)]">
                        {getPriorityReason(work)}
                      </span>
                    </td>

                    {/* Work ID */}
                    <td className="px-3 py-3 font-mono font-bold text-[var(--text-primary)] whitespace-nowrap group-hover:text-blue-700 dark:group-hover:text-blue-400">
                      {work.work_id}
                    </td>

                    {/* Constituency & MP */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--text-primary)]">{work.mp_name_constituency}</div>
                      <div className="text-[11px] text-[var(--text-muted)] font-medium">{work.state}</div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 font-mono font-bold text-[var(--text-primary)] whitespace-nowrap">
                      {formatRupees(work.sanctioned_amount)}
                    </td>

                    {/* Contractor */}
                    <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[150px]">
                      <div className="font-semibold text-[var(--text-primary)] truncate" title={work.contractor_name}>
                        {work.contractor_name}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate">{work.agency_type}</div>
                    </td>

                    {/* Active Violation Badges */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {work.rule_prohibited_category && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                            <Ban className="w-3 h-3 mr-1" />
                            Prohibited
                          </span>
                        )}
                        {work.rule_no_tender_high_cost && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                            <Zap className="w-3 h-3 mr-1" />
                            No-Tender
                          </span>
                        )}
                        {work.rule_low_utilization && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/60">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Low Util
                          </span>
                        )}
                        {work.ml_anomaly_score > 0.65 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60">
                            <BrainCircuit className="w-3 h-3 mr-1" />
                            ML Outlier
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectWork(work)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-2xs group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 cursor-pointer"
                      >
                        Inspect Dossier →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
