import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  MPLADSWork, 
  SystemSummary 
} from '../types/mplads';
import { 
  formatRupees 
} from '../utils/formatters';
import { 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  Building, 
  ArrowRight, 
  ChevronRight, 
  Layers, 
  Scale, 
  BarChart3, 
  MapPin, 
  Clock, 
  Play 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { NationalRiskMap } from './NationalRiskMap';

interface OverviewViewProps {
  summary: SystemSummary;
  works: MPLADSWork[];
  onSelectState: (state: string) => void;
  onSelectWork: (work: MPLADSWork) => void;
  onNavigateToQueue: () => void;
  onRunLiveAudit: () => void;
  onOpenDemoMode?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  summary,
  works,
  onSelectState,
  onSelectWork,
  onNavigateToQueue,
  onRunLiveAudit,
  onOpenDemoMode
}) => {
  const { isDark } = useTheme();
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string | null>(null);

  // 1. Calculate flagged works per state (State comparison data for bar chart)
  const stateChartData = useMemo(() => {
    const counts: Record<string, { state: string; flagged: number; total: number; amount: number }> = {};
    
    works.forEach(w => {
      if (!counts[w.state]) {
        counts[w.state] = { state: w.state, flagged: 0, total: 0, amount: 0 };
      }
      counts[w.state].total += 1;
      counts[w.state].amount += w.sanctioned_amount;
      if (w.risk_score > 0.30) {
        counts[w.state].flagged += 1;
      }
    });

    return Object.values(counts)
      .sort((a, b) => b.flagged - a.flagged)
      .slice(0, 10); // Top 10 states for crisp bar chart
  }, [works]);

  // Top 5 highest risk states for the National Risk Command Center
  const topRiskStates = useMemo(() => {
    return stateChartData.slice(0, 5);
  }, [stateChartData]);

  // 2. Breakdown of WHY works are flagged for Donut/Pie Chart calculated dynamically from works
  const whyFlaggedData = useMemo(() => {
    let prohibitedCount = 0;
    let noTenderCount = 0;
    let lowUtilCount = 0;
    let anomalyCount = 0;
    let statutoryCapsCount = 0;

    works.forEach(w => {
      if (w.rule_prohibited_category) prohibitedCount++;
      if (w.rule_no_tender_high_cost) noTenderCount++;
      if (w.rule_low_utilization) lowUtilCount++;
      if (w.ml_anomaly_score >= 0.65) anomalyCount++;
      if (w.category.includes('Trust') || w.risk_explanation.toLowerCase().includes('trust') || w.risk_explanation.toLowerCase().includes('ceiling')) {
        statutoryCapsCount++;
      }
    });

    return [
      {
        id: 'prohibited',
        name: 'Prohibited Scope',
        fullName: 'Prohibited Category (Clause 5.1)',
        value: prohibitedCount,
        color: '#DC2626',
        desc: 'Works in commercial, religious, or private properties'
      },
      {
        id: 'no_tender',
        name: 'No-Tender High-Cost',
        fullName: 'No-Tender High-Cost (>₹25L)',
        value: noTenderCount,
        color: '#EA580C',
        desc: 'High value nomination contracts bypassing e-tender'
      },
      {
        id: 'low_util',
        name: 'Low Fund Utilization',
        fullName: 'Low Fund Utilization (<40%)',
        value: lowUtilCount,
        color: '#F59E0B',
        desc: 'Stalled works with substantial idle fund parking'
      },
      {
        id: 'anomaly',
        name: 'Statistical Anomaly',
        fullName: 'Statistical Anomaly (Isolation Forest)',
        value: anomalyCount,
        color: '#6366F1',
        desc: 'Multivariate ML cost & agency deviation'
      },
      {
        id: 'trust',
        name: 'Statutory Caps',
        fullName: 'Trust / Society Ceiling (Clause 5.2)',
        value: statutoryCapsCount,
        color: '#8B5CF6',
        desc: 'Statutory ₹50L lifetime grant thresholds'
      }
    ];
  }, [works]);

  // 3. Filtered urgent works based on clicked Donut slice (if any)
  const urgentWorks = useMemo(() => {
    let filtered = [...works].sort((a, b) => b.risk_score - a.risk_score);
    
    if (selectedReasonFilter === 'prohibited') {
      filtered = filtered.filter(w => w.rule_prohibited_category);
    } else if (selectedReasonFilter === 'no_tender') {
      filtered = filtered.filter(w => w.rule_no_tender_high_cost);
    } else if (selectedReasonFilter === 'low_util') {
      filtered = filtered.filter(w => w.rule_low_utilization);
    } else if (selectedReasonFilter === 'anomaly') {
      filtered = filtered.filter(w => w.ml_anomaly_score >= 0.65);
    } else if (selectedReasonFilter === 'trust') {
      filtered = filtered.filter(w => w.category.includes('Trust') || w.risk_explanation.toLowerCase().includes('trust') || w.risk_explanation.toLowerCase().includes('ceiling'));
    }

    return filtered.slice(0, 4); // Top 4 for compact auditor action table
  }, [works, selectedReasonFilter]);

  const flaggedPercentage = summary.total_works > 0 ? ((summary.high_risk_works_count / summary.total_works) * 100).toFixed(1) : '0';
  const totalSanctionedInCr = (summary.total_sanctioned_amount / 10000000).toFixed(2);
  const avgPerWorkLakh = summary.total_works > 0 ? (summary.total_sanctioned_amount / summary.total_works / 100000).toFixed(1) : '0';
  const compliantCount = summary.low_risk_works_count;
  const compliantPercentage = summary.total_works > 0 ? ((compliantCount / summary.total_works) * 100).toFixed(1) : '0';
  
  const highRiskFunds = useMemo(() => {
    const total = works
      .filter(w => w.risk_score > 0.30)
      .reduce((sum, w) => sum + w.sanctioned_amount, 0);
    return (total / 10000000).toFixed(2);
  }, [works]);

  const mediumRiskFunds = useMemo(() => {
    const total = works
      .filter(w => w.risk_score >= 0.15 && w.risk_score <= 0.30)
      .reduce((sum, w) => sum + w.sanctioned_amount, 0);
    return (total / 10000000).toFixed(2);
  }, [works]);

  const lowRiskFunds = useMemo(() => {
    const total = works
      .filter(w => w.risk_score < 0.15)
      .reduce((sum, w) => sum + w.sanctioned_amount, 0);
    return (total / 10000000).toFixed(2);
  }, [works]);

  return (
    <div className="space-y-6">
      {/* SECTION 1: HERO COMMAND HEADER */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xs relative overflow-hidden p-5 sm:p-6 transition-colors duration-180">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#1D68F2] dark:text-blue-400 mb-0.5">
              MPLADS • VIGILANCE CELL
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-[24px] font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
              National MPLADS Expenditure Vigilance Command Center
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-3xl leading-relaxed">
              Continuous AI-driven surveillance, statutory compliance validation &amp; contractor cartelization detection across all 543 Parliamentary constituencies.
            </p>
          </div>

          {/* Quick Actions & Live Indicator */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2.5 flex-shrink-0">
            <div className="flex items-center space-x-2 text-xs text-[var(--text-muted)] font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="font-semibold text-[var(--text-primary)]">LAST SCAN</span>
              <span>Today • 13:24 IST</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">142ms latency</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRunLiveAudit}
                className="px-4 py-2 bg-[#1D68F2] hover:bg-[#1557D6] text-white rounded-lg text-xs font-bold flex items-center space-x-2 transition-all shadow-xs active:scale-98 cursor-pointer"
                title="Execute real-time pipeline audit scan simulation across all works"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Live Audit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: 4 EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Works Monitored */}
        <div className="relative overflow-hidden bg-[var(--surface)] p-5 rounded-xl border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)] hover:shadow-md dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:border-[var(--border-strong)] hover:-translate-y-0.5 transition-all duration-180 flex flex-col justify-between group">
          {/* Decorative Abstract Background Layer */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
            <div 
              className="absolute inset-0 transition-opacity duration-200"
              style={{
                background: isDark 
                  ? 'radial-gradient(circle at 90% 12%, rgba(37, 99, 235, 0.12) 0%, transparent 65%)' 
                  : 'radial-gradient(circle at 85% 20%, rgba(59, 130, 246, 0.10), transparent 55%)'
              }}
            />
            <svg 
              className="absolute right-0 top-0 w-44 h-44 text-blue-600 dark:text-blue-400 opacity-[0.08] dark:opacity-[0.10] transition-opacity duration-200" 
              viewBox="0 0 160 160" 
              fill="none"
            >
              <defs>
                <pattern id="kpi-grid-works" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
                  <circle cx="20" cy="20" r="1.5" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="160" height="160" fill="url(#kpi-grid-works)" />
              <line x1="80" y1="160" x2="160" y2="80" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>
          </div>

          {/* Interactive / Semantic Content */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-center">
                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#1D68F2] dark:text-blue-400 flex items-center justify-center shadow-2xs">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mt-3">
                TOTAL WORKS MONITORED
              </p>
              <h3 className="text-3xl font-extrabold text-[var(--text-primary)] mt-0.5 font-mono tracking-tight">
                {summary.total_works.toLocaleString()}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">
                543 MPs • 36 States &amp; UTs
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)]">
                Current monitoring period
              </span>
              <svg className="w-16 h-7 overflow-visible" viewBox="0 0 80 32" fill="none">
                <defs>
                  <linearGradient id="wave1" x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1D68F2" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#1D68F2" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 24 C 15 22, 25 14, 40 16 C 55 18, 65 6, 80 4 L 80 32 L 0 32 Z" fill="url(#wave1)" />
                <path d="M0 24 C 15 22, 25 14, 40 16 C 55 18, 65 6, 80 4" stroke="#1D68F2" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Total Sanctioned Amount */}
        <div className="relative overflow-hidden bg-[var(--surface)] p-5 rounded-xl border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)] hover:shadow-md dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:border-[var(--border-strong)] hover:-translate-y-0.5 transition-all duration-180 flex flex-col justify-between group">
          {/* Decorative Abstract Background Layer */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
            <div 
              className="absolute inset-0 transition-opacity duration-200"
              style={{
                background: isDark 
                  ? 'radial-gradient(circle at 90% 12%, rgba(16, 185, 129, 0.12) 0%, transparent 65%)' 
                  : 'radial-gradient(circle at 85% 20%, rgba(16, 185, 129, 0.10), transparent 55%)'
              }}
            />
            <svg 
              className="absolute right-0 top-0 w-44 h-44 text-emerald-600 dark:text-emerald-400 opacity-[0.08] dark:opacity-[0.10] transition-opacity duration-200" 
              viewBox="0 0 160 160" 
              fill="none"
            >
              <path d="M 0 45 C 50 25, 90 60, 160 30" stroke="currentColor" strokeWidth="1.5" />
              <path d="M 30 75 C 70 55, 110 85, 160 55" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
              <path d="M 50 105 C 90 85, 130 110, 160 85" stroke="currentColor" strokeWidth="1" strokeOpacity="0.8" />
              <circle cx="130" cy="42" r="3" fill="currentColor" />
              <circle cx="85" cy="58" r="2" fill="currentColor" />
            </svg>
          </div>

          {/* Interactive / Semantic Content */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-center">
                <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-transparent flex items-center justify-center shadow-2xs">
                  <Building className="w-4.5 h-4.5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mt-3">
                TOTAL SANCTIONED VALUE
              </p>
              <h3 className="text-3xl font-extrabold text-[var(--text-primary)] mt-0.5 font-mono tracking-tight">
                ₹{totalSanctionedInCr} <span className="text-sm font-semibold text-[var(--text-muted)]">Cr</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">
                ₹{avgPerWorkLakh}L avg per work
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)]">
                Current monitoring period
              </span>
              <svg className="w-16 h-7 overflow-visible" viewBox="0 0 80 32" fill="none">
                <defs>
                  <linearGradient id="wave2" x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#059669" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 22 C 20 24, 30 12, 50 14 C 65 16, 70 4, 80 2 L 80 32 L 0 32 Z" fill="url(#wave2)" />
                <path d="M0 22 C 20 24, 30 12, 50 14 C 65 16, 70 4, 80 2" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3: High-Risk Works Flagged */}
        <div className="relative overflow-hidden bg-[var(--surface)] p-5 rounded-xl border border-red-200/90 dark:border-red-900/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)] hover:shadow-md dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:border-red-300 dark:hover:border-red-800/80 hover:-translate-y-0.5 transition-all duration-180 flex flex-col justify-between group">
          {/* Decorative Abstract Background Layer */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
            <div 
              className="absolute inset-0 transition-opacity duration-200"
              style={{
                background: isDark 
                  ? 'radial-gradient(circle at 90% 12%, rgba(220, 38, 38, 0.12) 0%, transparent 65%)' 
                  : 'radial-gradient(circle at 85% 20%, rgba(220, 38, 38, 0.10), transparent 55%)'
              }}
            />
            <svg 
              className="absolute right-0 top-0 w-44 h-44 text-red-600 dark:text-red-400 opacity-[0.08] dark:opacity-[0.10] transition-opacity duration-200" 
              viewBox="0 0 160 160" 
              fill="none"
            >
              <circle cx="140" cy="25" r="30" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 3" />
              <circle cx="140" cy="25" r="55" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="140" cy="25" r="85" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="140" y1="0" x2="140" y2="120" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7" />
              <line x1="40" y1="25" x2="160" y2="25" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7" />
              <circle cx="140" cy="25" r="3.5" fill="currentColor" />
            </svg>
          </div>

          {/* Interactive / Semantic Content */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-center">
                <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shadow-2xs">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mt-3">
                HIGH-RISK WORKS FLAGGED
              </p>
              <h3 className="text-3xl font-extrabold text-red-600 dark:text-red-400 mt-0.5 font-mono tracking-tight">
                {summary.high_risk_works_count}
              </h3>
              <p className="text-xs text-red-600/90 dark:text-red-400/90 font-medium mt-0.5">
                ₹{highRiskFunds} Cr under review
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-red-100 dark:border-red-900/40 flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50">
                Current monitoring period
              </span>
              <svg className="w-16 h-7 overflow-visible" viewBox="0 0 80 32" fill="none">
                <defs>
                  <linearGradient id="wave3" x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#DC2626" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 26 C 20 26, 35 10, 50 14 C 65 18, 70 4, 80 2 L 80 32 L 0 32 Z" fill="url(#wave3)" />
                <path d="M0 26 C 20 26, 35 10, 50 14 C 65 18, 70 4, 80 2" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4: % Flagged */}
        <div className="relative overflow-hidden bg-[var(--surface)] p-5 rounded-xl border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)] hover:shadow-md dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:border-[var(--border-strong)] hover:-translate-y-0.5 transition-all duration-180 flex flex-col justify-between group">
          {/* Decorative Abstract Background Layer */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
            <div 
              className="absolute inset-0 transition-opacity duration-200"
              style={{
                background: isDark 
                  ? 'radial-gradient(circle at 90% 12%, rgba(139, 92, 246, 0.12) 0%, transparent 65%)' 
                  : 'radial-gradient(circle at 85% 20%, rgba(124, 58, 237, 0.10), transparent 55%)'
              }}
            />
            <svg 
              className="absolute right-0 top-0 w-44 h-44 text-indigo-600 dark:text-indigo-400 opacity-[0.08] dark:opacity-[0.10] transition-opacity duration-200" 
              viewBox="0 0 160 160" 
              fill="none"
            >
              <circle cx="135" cy="28" r="42" stroke="currentColor" strokeWidth="1.4" strokeDasharray="5 3" />
              <circle cx="135" cy="28" r="28" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="135" cy="28" r="14" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
              <path d="M 135 28 L 146 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>

          {/* Interactive / Semantic Content */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-center">
                <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-transparent flex items-center justify-center shadow-2xs">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mt-3">
                OVERALL FLAGGED RATE
              </p>
              <h3 className="text-3xl font-extrabold text-[var(--text-primary)] mt-0.5 font-mono tracking-tight">
                {flaggedPercentage}%
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">
                {compliantPercentage}% Standard ({compliantCount.toLocaleString()})
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50">
                Current monitoring period
              </span>
              <svg className="w-16 h-7 overflow-visible" viewBox="0 0 80 32" fill="none">
                <defs>
                  <linearGradient id="wave4" x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7C3AED" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 6 C 20 8, 35 22, 50 18 C 65 14, 70 24, 80 22 L 80 32 L 0 32 Z" fill="url(#wave4)" />
                <path d="M0 6 C 20 8, 35 22, 50 18 C 65 14, 70 24, 80 22" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: NATIONAL RISK COMMAND CENTER (Full Width, 60/40 Split) */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xs p-5 sm:p-6 space-y-4 transition-colors duration-180">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#1D68F2] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                NATIONAL RISK COMMAND CENTER
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Geographic concentration of audit risk &amp; priority states
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-[var(--surface-elevated)] text-[var(--text-secondary)] px-2.5 py-0.5 rounded border border-[var(--border)] font-semibold">
            36 States &amp; UTs Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* National State Risk Heatmap (60% / 7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <NationalRiskMap 
              works={works}
              onSelectState={onSelectState}
            />
          </div>

          {/* Risk Summary & Priority Ranking (40% / 5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 h-full">
            {/* 3 Risk Tier Cards */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                NATIONAL RISK SUMMARY
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                  <span className="text-[10px] font-mono uppercase font-bold text-red-700 dark:text-red-400 block">
                    HIGH RISK
                  </span>
                  <span className="text-lg font-bold font-mono text-red-600 dark:text-red-400 block mt-0.5">
                    {summary.high_risk_works_count.toLocaleString()} works
                  </span>
                  <span className="text-[10px] text-red-600/90 dark:text-red-400/90 font-medium block mt-0.5">
                    ₹{highRiskFunds} Cr
                  </span>
                </div>

                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-700 dark:text-amber-400 block">
                    MEDIUM RISK
                  </span>
                  <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 block mt-0.5">
                    {summary.medium_risk_works_count.toLocaleString()} works
                  </span>
                  <span className="text-[10px] text-amber-600/90 dark:text-amber-400/90 font-medium block mt-0.5">
                    ₹{mediumRiskFunds} Cr
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                    LOW RISK
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 block mt-0.5">
                    {summary.low_risk_works_count.toLocaleString()} works
                  </span>
                  <span className="text-[10px] text-emerald-700/90 dark:text-emerald-400/90 font-medium block mt-0.5">
                    ₹{lowRiskFunds} Cr
                  </span>
                </div>
              </div>
            </div>

            {/* Top Risk States Ranking */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                  Top Priority States for Field Audit
                </span>
                <button 
                  onClick={() => onSelectState('Uttar Pradesh')}
                  className="text-[11px] text-[#1D68F2] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center space-x-0.5 cursor-pointer"
                >
                  <span>View State Drill-Down</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {topRiskStates.map((st, idx) => {
                  const maxFlagged = topRiskStates[0]?.flagged || 1;
                  const pct = Math.round((st.flagged / maxFlagged) * 100);
                  const stateRate = ((st.flagged / st.total) * 100).toFixed(1);
                  return (
                    <div 
                      key={st.state}
                      onClick={() => onSelectState(st.state)}
                      className="group p-2.5 rounded-lg border border-[var(--border)] hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-[#151F2E] cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold font-mono ${
                            idx === 0 ? 'bg-red-600 text-white' : idx < 3 ? 'bg-amber-600 text-white' : 'bg-slate-700 text-white'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-[var(--text-primary)] group-hover:text-blue-900 dark:group-hover:text-blue-300">
                            {st.state}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="font-bold text-red-600 dark:text-red-400">{st.flagged} high-risk</span>
                          <span className="text-[var(--text-muted)] text-[11px]">({stateRate}%)</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500 group-hover:text-blue-700 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-[#1E2B3E] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${idx === 0 ? 'bg-red-600' : idx < 3 ? 'bg-amber-500' : 'bg-blue-600'}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: RISK ANALYTICS (Full Width, 50/50 Split) */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xs p-5 sm:p-6 space-y-4 transition-colors duration-180">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                RISK ANALYTICS
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                State distribution and root-cause breakdown by GFR 2017 rules and ML scores.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Flagged High-Risk Works by State Bar Chart (50% / 6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-[#F5F7FA]">
                  Flagged High-Risk Works by State
                </h3>
                <button 
                  onClick={onNavigateToQueue}
                  className="text-[11px] text-[#1D68F2] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center space-x-0.5 cursor-pointer"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-[#748094] mb-2">
                Top 10 states by flagged volume
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stateChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 30 }}
                    onClick={(e) => {
                      if (e && e.activePayload && e.activePayload.length > 0) {
                        const state = e.activePayload[0].payload.state;
                        onSelectState(state);
                      }
                    }}
                  >
                    <XAxis 
                      dataKey="state" 
                      angle={-45} 
                      textAnchor="end" 
                      tick={{ fontSize: 10, fill: isDark ? '#A8B2C1' : '#64748B' }} 
                      interval={0}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: isDark ? '#A8B2C1' : '#64748B' }} 
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(239, 68, 68, 0.06)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const rate = ((data.flagged / data.total) * 100).toFixed(1);
                          return (
                            <div className="bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] p-2.5 rounded-lg shadow-lg text-xs">
                              <p className="font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-1 mb-1">
                                {data.state}
                              </p>
                              <p className="text-red-600 dark:text-red-400 font-semibold">
                                High-Risk Works: {data.flagged}
                              </p>
                              <p className="text-[var(--text-secondary)]">
                                Total Monitored: {data.total} ({rate}%)
                              </p>
                              <p className="text-blue-600 dark:text-blue-400 text-[10px] mt-1 font-medium">
                                Click to drill down →
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="flagged" radius={[4, 4, 0, 0]} className="cursor-pointer">
                      {stateChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === 0 ? '#DC2626' : index < 3 ? '#EA580C' : '#F59E0B'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Why Works Are Flagged Donut Chart (50% / 6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-[#F5F7FA]">
                  Why Works Are Flagged
                </h3>
                <button
                  onClick={onNavigateToQueue}
                  className="text-[11px] text-[#1D68F2] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center space-x-0.5 cursor-pointer"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-[#748094] mb-1">
                Breakdown of {summary.high_risk_works_count.toLocaleString()} flagged works
              </p>

              <div className="h-44 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={whyFlaggedData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      onClick={(entry) => {
                        if (entry && entry.id) {
                          setSelectedReasonFilter(entry.id === selectedReasonFilter ? null : entry.id);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {whyFlaggedData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke={selectedReasonFilter === entry.id ? (isDark ? '#F5F7FA' : '#0A192F') : (isDark ? '#111A28' : '#FFFFFF')}
                          strokeWidth={selectedReasonFilter === entry.id ? 2 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const totalFlagged = summary.high_risk_works_count || 1;
                          return (
                            <div className="bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] p-2 rounded-lg shadow-lg text-xs">
                              <p className="font-bold text-[var(--text-primary)]">{data.fullName}</p>
                              <p className="text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                                {data.value} Works ({((data.value / totalFlagged) * 100).toFixed(1)}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Centered Donut Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-[#F5F7FA] leading-none">
                    {summary.high_risk_works_count.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500 dark:text-[#748094] uppercase tracking-tight">
                    Flagged
                  </span>
                </div>
              </div>
            </div>

            {/* 5-Category Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-[#1E293B] text-[11px]">
              {whyFlaggedData.map((item) => {
                const isSelected = selectedReasonFilter === item.id;
                const totalFlagged = summary.high_risk_works_count || 1;
                return (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedReasonFilter(isSelected ? null : item.id)}
                    className={`flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 font-bold' 
                        : 'hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <span 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <span className="text-slate-700 dark:text-[#A8B2C1] truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center space-x-1 font-mono text-[11px] flex-shrink-0 ml-2">
                      <span className="font-bold text-slate-900 dark:text-[#F5F7FA]">{item.value}</span>
                      <span className="text-slate-400 dark:text-[#748094]">
                        ({((item.value / totalFlagged) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: IMMEDIATE AUDITOR ACTION (Full Width 100%) */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xs p-5 sm:p-6 space-y-4 transition-colors duration-180">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                IMMEDIATE AUDITOR ACTION
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Highest-priority projects requiring immediate physical verification or document audit.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToQueue}
            className="text-xs font-bold text-[#1D68F2] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center space-x-1 cursor-pointer bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
          >
            <span>View Full Audit Queue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Full-Width Auditor Action Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-subtle)] text-xs">
            <thead className="bg-[var(--surface-raised)] text-[#344054] dark:text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[11px]">
              <tr className="border-b border-[var(--border)]">
                <th className="py-2.5 px-3 text-left">Risk Score</th>
                <th className="py-2.5 px-3 text-left">Work ID</th>
                <th className="py-2.5 px-3 text-left">State</th>
                <th className="py-2.5 px-3 text-left">Category</th>
                <th className="py-2.5 px-3 text-left">Amount</th>
                <th className="py-2.5 px-3 text-left">Primary Audit Flag / Citation</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
              {urgentWorks.map((work) => {
                return (
                  <tr key={work.work_id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50">
                        {work.risk_score.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[var(--text-primary)] whitespace-nowrap text-[11px]">
                      {work.work_id}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)] whitespace-nowrap text-[11px] font-medium">
                      {work.state}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)] text-[11px] max-w-[200px] truncate" title={work.category}>
                      {work.category}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[var(--text-primary)] whitespace-nowrap text-[11px]">
                      {formatRupees(work.sanctioned_amount)}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/50 font-semibold whitespace-nowrap">
                          {work.rule_prohibited_category 
                            ? 'Prohibited Scope (Cl. 5.1)' 
                            : work.rule_no_tender_high_cost 
                            ? 'No-Tender High-Cost (>₹25L)' 
                            : work.rule_low_utilization 
                            ? 'Low Utilization (<40%)' 
                            : 'Multivariate ML Anomaly'}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[280px]" title={work.risk_explanation}>
                          {work.risk_explanation}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => onSelectWork(work)}
                        className="px-3 py-1 text-xs font-bold text-[#1D68F2] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>Showing 4 highest-risk works prioritized for field audit</span>
          <span className="font-mono text-[var(--text-muted)]">Sorted by Composite Risk Score (Desc)</span>
        </div>
      </div>

      {/* SYSTEM ARCHITECTURE & DATA PIPELINE */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xs p-5 space-y-4 transition-colors duration-180">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#1D68F2] dark:text-blue-400" />
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">
              System Architecture &amp; Data Pipeline
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            How raw central e-governance records flow through the rule engine and unsupervised ML models into prioritized audit queues.
          </p>
        </div>

        {/* Pipeline Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-[#1D68F2] dark:text-blue-400 font-bold block">01 • DATA INGESTION</span>
              <strong className="text-[var(--text-primary)] block mt-1">MPLADS Portal Records</strong>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Central records across 543 Parliamentary constituencies.</p>
            </div>
          </div>

          <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-[#1D68F2] dark:text-blue-400 font-bold block">02 • VALIDATION</span>
              <strong className="text-[var(--text-primary)] block mt-1">Allocation Integrity</strong>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Reconciles statutory ₹5 Cr envelope vs. aggregate sanctions.</p>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/50 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-blue-800 dark:text-blue-300 font-bold block">03 • RULE ENGINE</span>
              <strong className="text-blue-950 dark:text-blue-200 block mt-1">Policy &amp; Tender Rules</strong>
              <p className="text-[11px] text-blue-900 dark:text-blue-300/80 mt-1">MPLADS Clause 5.1 &amp; GFR 2017 single-bid thresholds.</p>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-900/50 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-indigo-800 dark:text-indigo-300 font-bold block">04 • ML DETECTOR</span>
              <strong className="text-indigo-950 dark:text-indigo-200 block mt-1">Isolation Forest</strong>
              <p className="text-[11px] text-indigo-900 dark:text-indigo-300/80 mt-1">Identifies multivariate cost &amp; agency density outliers.</p>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-amber-800 dark:text-amber-300 font-bold block">05 • NETWORK INTELLIGENCE</span>
              <strong className="text-amber-950 dark:text-amber-200 block mt-1">Contractor Cartels</strong>
              <p className="text-[11px] text-amber-900 dark:text-amber-300/80 mt-1">Flags recurring multi-state contractor footprints.</p>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900/50 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">06 • DISPATCH</span>
              <strong className="text-emerald-950 dark:text-emerald-200 block mt-1">Human Field Audit</strong>
              <p className="text-[11px] text-emerald-900 dark:text-emerald-300/80 mt-1">Dispatches District Magistrates to Top 20 sites.</p>
            </div>
          </div>
        </div>
      </div>

      {/* HUMAN-IN-THE-LOOP MANDATORY NOTICE */}
      <div className="p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] text-center text-xs text-[var(--text-secondary)] flex items-center justify-center space-x-2 transition-colors duration-180">
        <Scale className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
        <span>
          <strong className="text-[var(--text-primary)]">Human-in-the-Loop Standard:</strong> Fund Guard is an audit decision-support platform. AI and rule-based indicators identify high-priority cases requiring human field inspection; they do not independently establish fraud.
        </span>
      </div>
    </div>
  );
};
