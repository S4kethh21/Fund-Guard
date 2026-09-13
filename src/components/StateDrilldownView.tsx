import React, { useState, useMemo, useEffect } from 'react';
import { MPLADSWork } from '../types/mplads';
import { MpladsSourceAdapter } from '../services/mpladsSourceAdapter';
import { formatRupees, getRiskBadgeClasses } from '../utils/formatters';
import { 
  Search, 
  Filter, 
  MapPin, 
  ArrowUpDown, 
  AlertTriangle, 
  PieChart as PieIcon, 
  Users, 
  ArrowLeft 
} from 'lucide-react';

interface StateDrilldownViewProps {
  works: MPLADSWork[];
  selectedState: string;
  onSelectState: (state: string) => void;
  onSelectWork: (work: MPLADSWork) => void;
  presetFilter?: string;
  onBackToOverview?: () => void;
}

export const StateDrilldownView: React.FC<StateDrilldownViewProps> = ({
  works,
  selectedState,
  onSelectState,
  onSelectWork,
  presetFilter,
  onBackToOverview
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [ruleFilter, setRuleFilter] = useState<string>(presetFilter || 'all');
  const [sortField, setSortField] = useState<'risk_score' | 'sanctioned_amount' | 'utilization_pct'>('risk_score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    if (presetFilter) {
      setRuleFilter(presetFilter);
    }
  }, [presetFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedState, searchQuery, riskFilter, ruleFilter, sortField, sortAsc]);

  // List of all unique states sorted alphabetically
  const statesList = useMemo(() => {
    const s = new Set<string>();
    works.forEach(w => s.add(w.state));
    return Array.from(s).sort();
  }, [works]);

  // Works for the selected state
  const stateWorks = useMemo(() => {
    return works.filter(w => w.state === selectedState);
  }, [works, selectedState]);

  // State-level aggregate metrics & top risky categories/contractors
  const stateMetrics = useMemo(() => {
    const total = stateWorks.length;
    const high = stateWorks.filter(w => w.risk_score > 0.30).length;
    const med = stateWorks.filter(w => w.risk_score >= 0.15 && w.risk_score <= 0.30).length;
    const low = stateWorks.filter(w => w.risk_score < 0.15).length;
    const totalAmount = stateWorks.reduce((sum, w) => sum + w.sanctioned_amount, 0);
    const mps = new Set(stateWorks.map(w => w.mp_name_constituency)).size;

    // Top risky categories in this state
    const catRisks: Record<string, { count: number; highCount: number }> = {};
    stateWorks.forEach(w => {
      if (!catRisks[w.category]) catRisks[w.category] = { count: 0, highCount: 0 };
      catRisks[w.category].count += 1;
      if (w.risk_score > 0.30) catRisks[w.category].highCount += 1;
    });
    const topCategories = Object.entries(catRisks)
      .sort((a, b) => b[1].highCount - a[1].highCount)
      .slice(0, 3);

    // Top contractors in this state
    const contCounts: Record<string, { count: number; totalAmt: number }> = {};
    stateWorks.forEach(w => {
      if (!contCounts[w.contractor_name]) contCounts[w.contractor_name] = { count: 0, totalAmt: 0 };
      contCounts[w.contractor_name].count += 1;
      contCounts[w.contractor_name].totalAmt += w.sanctioned_amount;
    });
    const topContractors = Object.entries(contCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);

    return { total, high, med, low, totalAmount, mps, topCategories, topContractors };
  }, [stateWorks]);

  // Official eSAKSHI State Macro Metrics
  const officialStateMetrics = useMemo(() => {
    return MpladsSourceAdapter.getStateOfficialMetrics(selectedState);
  }, [selectedState]);

  // Filtered and sorted works in this state
  const filteredWorks = useMemo(() => {
    return stateWorks
      .filter(w => {
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            w.work_id.toLowerCase().includes(q) ||
            w.mp_name_constituency.toLowerCase().includes(q) ||
            w.category.toLowerCase().includes(q) ||
            w.contractor_name.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Risk level filter
        if (riskFilter === 'high' && w.risk_score <= 0.30) return false;
        if (riskFilter === 'medium' && (w.risk_score < 0.15 || w.risk_score > 0.30)) return false;
        if (riskFilter === 'low' && w.risk_score >= 0.15) return false;

        // Rule filter
        if (ruleFilter === 'prohibited' && !w.rule_prohibited_category) return false;
        if (ruleFilter === 'no_tender' && !w.rule_no_tender_high_cost) return false;
        if (ruleFilter === 'low_util' && !w.rule_low_utilization) return false;
        if (ruleFilter === 'anomaly' && w.ml_anomaly_score <= 0.65) return false;

        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [stateWorks, searchQuery, riskFilter, ruleFilter, sortField, sortAsc]);

  const handleSortToggle = (field: 'risk_score' | 'sanctioned_amount' | 'utilization_pct') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default highest first
    }
  };

  return (
    <div className="space-y-5">
      {/* Back to Overview Navigation Bar */}
      {onBackToOverview && (
        <div className="flex items-center justify-between text-xs pb-1">
          <button
            onClick={onBackToOverview}
            className="text-[var(--text-secondary)] hover:text-blue-700 dark:hover:text-blue-400 flex items-center space-x-1.5 font-semibold transition-colors group px-2.5 py-1.5 rounded-md bg-[var(--surface)] border border-[var(--border)] shadow-2xs hover:border-blue-300 dark:hover:border-blue-500"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform group-hover:-translate-x-0.5" />
            <span>← Back to National Overview Command Center</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-[11px] font-mono text-[var(--text-muted)] font-bold uppercase tracking-wider">
              REGIONAL VIGILANCE WORKBENCH
            </span>
          </div>
        </div>
      )}

      {/* State Selector & Executive Metrics Banner */}
      <div className="bg-[var(--surface)] p-5 rounded-lg border border-[var(--border)] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex-shrink-0 mt-0.5 shadow-2xs">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-wider bg-[var(--surface-raised)] text-[var(--text-secondary)] px-2 py-0.5 rounded font-bold border border-[var(--border)]">
                  STATE AUDIT PROFILE
                </span>
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {stateMetrics.mps} Parliamentary Seats Monitored
                </span>
              </div>
              <div className="flex items-center space-x-3 mt-1">
                <select
                  value={selectedState}
                  onChange={(e) => onSelectState(e.target.value)}
                  aria-label="Select State or Union Territory"
                  className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] bg-transparent border-b-2 border-blue-600 pb-0.5 focus:outline-none cursor-pointer pr-4 hover:border-blue-700"
                >
                  {statesList.map(st => (
                    <option key={st} value={st} className="bg-[var(--surface)] text-[var(--text-primary)]">{st}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Constituency-level allocation expenditure, tender compliance &amp; contractor distribution for {selectedState}.
              </p>
            </div>
          </div>

          {/* Key State Counters */}
          <div className="grid grid-cols-3 gap-3 text-center sm:text-left flex-shrink-0">
            <div className="bg-[var(--surface-raised)] px-4 py-2.5 rounded-lg border border-[var(--border)] border-t-3 border-t-slate-700 dark:border-t-slate-400">
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Total Works</p>
              <p className="text-xl font-bold text-[var(--text-primary)] font-mono mt-0.5">{stateMetrics.total}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Projects Indexed</p>
            </div>
            <div className="bg-red-50/70 dark:bg-red-950/30 px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-900/40 border-t-3 border-t-red-600">
              <p className="text-[10px] text-red-700 dark:text-red-400 uppercase font-bold tracking-wider">High-Risk Flags</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400 font-mono mt-0.5">{stateMetrics.high}</p>
              <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold mt-0.5">
                {stateMetrics.total > 0 ? ((stateMetrics.high / stateMetrics.total) * 100).toFixed(1) : 0}% Flagged
              </p>
            </div>
            <div className="bg-blue-50/60 dark:bg-blue-950/30 px-4 py-2.5 rounded-lg border border-blue-200 dark:border-blue-900/40 border-t-3 border-t-blue-600">
              <p className="text-[10px] text-blue-800 dark:text-blue-400 uppercase font-bold tracking-wider">Total Sanctions</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-300 font-mono mt-0.5">{formatRupees(stateMetrics.totalAmount)}</p>
              <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5">Statutory Envelope</p>
            </div>
          </div>
        </div>

        {/* State Risk Snapshot Strip: Categories & Contractors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[var(--border)] text-xs">
          <div className="bg-[var(--surface-raised)] p-3 rounded-lg border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-semibold text-[var(--text-primary)] flex items-center flex-shrink-0">
              <PieIcon className="w-4 h-4 text-red-600 mr-1.5" />
              Highest Flagged Categories:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {stateMetrics.topCategories.map(([cat, c]) => (
                <span key={cat} className="bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)] text-[11px] font-medium text-[var(--text-secondary)] truncate max-w-[150px] shadow-2xs" title={cat}>
                  {cat.split('(')[0]}: <strong className="text-red-700 dark:text-red-400">{c.highCount}</strong>
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[var(--surface-raised)] p-3 rounded-lg border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-semibold text-[var(--text-primary)] flex items-center flex-shrink-0">
              <Users className="w-4 h-4 text-blue-600 mr-1.5" />
              Primary Implementing Agencies:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {stateMetrics.topContractors.map(([cont, c]) => (
                <span key={cont} className="bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)] text-[11px] font-medium text-[var(--text-secondary)] truncate max-w-[150px] shadow-2xs" title={cont}>
                  {cont.split(',')[0].slice(0, 18)}: <strong className="text-[var(--text-primary)]">{c.count}w</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Official eSAKSHI Macro Totals Strip */}
        {officialStateMetrics && (
          <div className="bg-blue-50/50 dark:bg-blue-950/25 border border-blue-200/80 dark:border-blue-900/40 rounded-lg px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                OFFICIAL eSAKSHI TOTALS ({selectedState.toUpperCase()})
              </span>
              <span className="text-[var(--text-secondary)] text-[11px]">
                Recommended: <strong className="text-[var(--text-primary)]">{officialStateMetrics.recommended_works.toLocaleString('en-IN')}</strong> &nbsp;|&nbsp; 
                Sanctioned: <strong className="text-[var(--text-primary)]">{officialStateMetrics.sanctioned_works.toLocaleString('en-IN')}</strong> &nbsp;|&nbsp; 
                Completed: <strong className="text-[var(--text-primary)]">{officialStateMetrics.completed_works.toLocaleString('en-IN')}</strong>
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              Allocated Limit: <strong className="font-mono text-[var(--text-primary)]">₹{officialStateMetrics.allocated_crore.toFixed(2)} Cr</strong> &nbsp;|&nbsp; 
              Expenditure: <strong className="font-mono text-blue-900 dark:text-blue-400">₹{officialStateMetrics.expenditure_crore.toFixed(2)} Cr</strong>
            </div>
          </div>
        )}

        {/* Quick select state pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-2.5 border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
          <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)] whitespace-nowrap mr-1">
            QUICK STATES:
          </span>
          {["Uttar Pradesh", "Maharashtra", "West Bengal", "Bihar", "Tamil Nadu", "Gujarat", "Karnataka", "Rajasthan"].map(st => (
            <button
              key={st}
              onClick={() => onSelectState(st)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all text-xs font-semibold cursor-pointer ${
                selectedState === st
                  ? 'bg-blue-700 text-white font-bold shadow-xs ring-2 ring-blue-300 dark:ring-blue-800'
                  : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search in this state by MP name, work ID, category, or contractor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-[var(--input-border)] rounded-md text-xs text-[var(--text-primary)] placeholder-[var(--input-placeholder)] focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-[var(--input-bg)] hover:bg-[var(--surface)] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-bold cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Risk Level Filter Chips */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
          <span className="text-[var(--text-muted)] font-bold uppercase tracking-wider text-[10px] mr-1 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1 text-[var(--text-muted)]" />
            Risk:
          </span>
          <button
            onClick={() => setRiskFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              riskFilter === 'all' 
                ? 'bg-slate-800 dark:bg-slate-700 text-white font-bold shadow-2xs' 
                : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
            }`}
          >
            All ({stateWorks.length})
          </button>
          <button
            onClick={() => setRiskFilter('high')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              riskFilter === 'high' 
                ? 'bg-red-600 text-white font-bold shadow-2xs' 
                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span>High Risk ({stateMetrics.high})</span>
          </button>
          <button
            onClick={() => setRiskFilter('medium')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              riskFilter === 'medium' 
                ? 'bg-amber-600 text-white font-bold shadow-2xs' 
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-900/50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Medium ({stateMetrics.med})</span>
          </button>
          <button
            onClick={() => setRiskFilter('low')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              riskFilter === 'low' 
                ? 'bg-emerald-600 text-white font-bold shadow-2xs' 
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-900/50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Low ({stateMetrics.low})</span>
          </button>
        </div>

        {/* Rule Filter dropdown */}
        <div className="flex items-center space-x-2">
          <select
            value={ruleFilter}
            onChange={(e) => setRuleFilter(e.target.value)}
            aria-label="Filter by Violation Rule"
            className="px-3 py-1.5 border border-[var(--border)] rounded-md text-xs text-[var(--text-primary)] bg-[var(--surface-raised)] focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium cursor-pointer"
          >
            <option value="all" className="bg-[var(--surface)] text-[var(--text-primary)]">All Violation Rules</option>
            <option value="prohibited" className="bg-[var(--surface)] text-[var(--text-primary)]">🚫 Prohibited Category</option>
            <option value="no_tender" className="bg-[var(--surface)] text-[var(--text-primary)]">⚡ No Tender / High Cost</option>
            <option value="low_util" className="bg-[var(--surface)] text-[var(--text-primary)]">📉 Low Utilization (&lt;40%)</option>
            <option value="anomaly" className="bg-[var(--surface)] text-[var(--text-primary)]">🧠 Statistical Anomaly</option>
          </select>

          {(riskFilter !== 'all' || ruleFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setRiskFilter('all');
                setRuleFilter('all');
                setSearchQuery('');
              }}
              className="text-[11px] text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-semibold px-2 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/60 rounded transition-colors whitespace-nowrap cursor-pointer"
            >
              Reset ✕
            </button>
          )}
        </div>
      </div>

      {/* State Works Data Table */}
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-[var(--surface-raised)] border-b border-[var(--border)] flex flex-wrap justify-between items-center text-xs text-[var(--text-secondary)] gap-2">
          <div>
            <span className="font-bold text-[var(--text-primary)]">
              Showing {filteredWorks.length} of {stateWorks.length} works in {selectedState}
            </span>
            <span className="ml-2 text-[var(--text-muted)] font-mono text-[11px]">
              (Sorted by {sortField === 'risk_score' ? 'Risk Score (highest first)' : sortField})
            </span>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Click column headers with ↕ to toggle sort order
          </span>
        </div>

        {filteredWorks.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)] text-xs">
            <AlertTriangle className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
            <p className="font-bold text-[var(--text-primary)]">No works matched current filter criteria</p>
            <p className="mt-1">Try resetting the risk level or clearing the search bar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-xs">
              <thead className="bg-[var(--surface-raised)] text-[#344054] dark:text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 text-left">Work ID</th>
                  <th className="px-4 py-3 text-left cursor-pointer hover:bg-[var(--surface-hover)] transition-colors" onClick={() => handleSortToggle('risk_score')}>
                    <div className="flex items-center space-x-1">
                      <span>Risk Score</span>
                      <ArrowUpDown className="w-3 h-3 text-[var(--text-muted)]" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">MP &amp; Constituency</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left cursor-pointer hover:bg-[var(--surface-hover)] transition-colors" onClick={() => handleSortToggle('sanctioned_amount')}>
                    <div className="flex items-center space-x-1">
                      <span>Sanctioned ₹</span>
                      <ArrowUpDown className="w-3 h-3 text-[var(--text-muted)]" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">Implementing Agency / Authority</th>
                  <th className="px-4 py-3 text-left cursor-pointer hover:bg-[var(--surface-hover)] transition-colors" onClick={() => handleSortToggle('utilization_pct')}>
                    <div className="flex items-center space-x-1">
                      <span>Fund Utilization</span>
                      <ArrowUpDown className="w-3 h-3 text-[var(--text-muted)]" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
                {filteredWorks.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((work) => {
                  const badge = getRiskBadgeClasses(work.risk_score);
                  return (
                    <tr 
                      key={work.work_id} 
                      className="hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
                      onClick={() => onSelectWork(work)}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-[var(--text-primary)] whitespace-nowrap group-hover:text-blue-700 dark:group-hover:text-blue-400">
                        {work.work_id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono border ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dot}`}></span>
                          {work.risk_score.toFixed(3)}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="font-semibold text-[var(--text-primary)] truncate" title={work.mp_name_constituency}>
                          {work.mp_name_constituency}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">{work.state}</div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate" title={work.category}>
                        <div className="flex items-center space-x-1.5">
                          {work.rule_prohibited_category && (
                            <span className="text-[9px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 px-1 rounded flex-shrink-0">
                              PROHIBITED
                            </span>
                          )}
                          <span className="text-[var(--text-secondary)] truncate font-medium">{work.category}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[var(--text-primary)] whitespace-nowrap">
                        {formatRupees(work.sanctioned_amount)}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[180px]">
                        <p className="truncate font-semibold text-[var(--text-primary)]" title={work.contractor_name}>
                          {work.contractor_name}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">{work.agency_type}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-200 dark:bg-[#1E2B3E] rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${
                                work.utilization_pct < 40 ? 'bg-red-500' : work.utilization_pct < 70 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, work.utilization_pct)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[var(--text-primary)] text-[11px] font-bold">
                            {work.utilization_pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
        )}

        {filteredWorks.length > pageSize && (
          <div className="px-4 py-3 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-2 bg-[var(--surface-elevated)]">
            <div className="text-xs text-[var(--text-secondary)]">
              Showing <span className="font-semibold text-[var(--text-primary)]">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-semibold text-[var(--text-primary)]">{Math.min(currentPage * pageSize, filteredWorks.length)}</span> of <span className="font-semibold text-[var(--text-primary)]">{filteredWorks.length}</span> works
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-xs font-mono text-[var(--text-secondary)] px-2">
                Page {currentPage} of {Math.ceil(filteredWorks.length / pageSize)}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredWorks.length / pageSize), p + 1))}
                disabled={currentPage >= Math.ceil(filteredWorks.length / pageSize)}
                className="px-3 py-1 text-xs rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
