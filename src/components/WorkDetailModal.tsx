import React, { useState } from 'react';
import { MPLADSWork, AuditTrailEntry } from '../types/mplads';
import { formatRupees, formatRupeesFull, getRiskBadgeClasses } from '../utils/formatters';
import { 
  X, 
  FileCheck2, 
  ExternalLink, 
  Ban, 
  Zap, 
  TrendingDown, 
  BrainCircuit, 
  Printer, 
  ShieldAlert, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface WorkDetailModalProps {
  work: MPLADSWork | null;
  onClose: () => void;
  onUpdateWorkStatus?: (workId: string, status: MPLADSWork['audit_status'], note?: string) => void;
  onNavigateToState?: (state: string) => void;
  onNavigateToContractor?: (contractor: string) => void;
}

export const WorkDetailModal: React.FC<WorkDetailModalProps> = ({ 
  work, 
  onClose,
  onUpdateWorkStatus,
  onNavigateToState,
  onNavigateToContractor
}) => {
  if (!work) return null;

  // Local state for prototype actions
  const [currentStatus, setCurrentStatus] = useState<string>(
    work.audit_status || 'PENDING INSPECTION'
  );
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);
  const [auditNotes, setAuditNotes] = useState<string[]>(work.audit_notes || []);

  // Dynamically generated realistic audit trail
  const [trail, setTrail] = useState<AuditTrailEntry[]>([
    {
      id: '1',
      timestamp: '13:24:08',
      action: 'ML Anomaly Scan Completed',
      detail: `Isolation Forest model evaluated project cost-to-agency benchmark (Index: ${work.ml_anomaly_score.toFixed(2)})`,
      actor: 'AI Surveillance Pipeline'
    },
    {
      id: '2',
      timestamp: '13:24:11',
      action: 'Rule Engine Evaluated',
      detail: `Verified against Clause 5.1 Negative List & GFR 2017 open tender thresholds (Amount: ${formatRupees(work.sanctioned_amount)})`,
      actor: 'Policy Engine v2.4'
    },
    {
      id: '3',
      timestamp: '13:24:15',
      action: 'Risk Score Calculated',
      detail: `Composite risk score generated: ${work.risk_score.toFixed(3)} based on multi-factor weighted heuristics`,
      actor: 'Risk Synthesizer'
    },
    {
      id: '4',
      timestamp: '13:24:22',
      action: 'Added to Audit Priority Queue',
      detail: 'Ranked in executive inspection roster for District Authorities',
      actor: 'Central Audit Cell'
    },
    {
      id: '5',
      timestamp: '13:24:30',
      action: 'Auditor Opened Dossier',
      detail: 'Investigation session initiated for field dispatch review',
      actor: 'Field Auditor'
    }
  ]);

  const badge = getRiskBadgeClasses(work.risk_score);
  
  // Calculate priority tier
  const priorityTier = work.risk_score >= 0.65 ? 'CRITICAL' : work.risk_score >= 0.30 ? 'HIGH' : work.risk_score >= 0.15 ? 'MEDIUM' : 'LOW';

  // Active statutory rules
  const activeTriggers = [];
  if (work.rule_prohibited_category) {
    activeTriggers.push({
      id: 'prohibited',
      label: 'Prohibited Category',
      clause: 'MPLADS Guidelines Clause 5.1',
      desc: 'Category is listed in statutory negative list (no commercial/religious/private assets).',
      icon: Ban,
      color: 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/50'
    });
  }
  if (work.rule_no_tender_high_cost) {
    activeTriggers.push({
      id: 'no_tender',
      label: 'No-Tender High-Cost (>₹25L)',
      clause: 'GFR 2017 Rule 149/194',
      desc: 'Work value exceeds ₹25 Lakh but was awarded via single nomination without competitive e-tender.',
      icon: Zap,
      color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
    });
  }
  if (work.rule_low_utilization) {
    activeTriggers.push({
      id: 'low_util',
      label: 'Low Utilization (<40%)',
      clause: 'Expenditure Velocity Norm',
      desc: `Fund utilization stalled at ${work.utilization_pct}% despite project being scheduled for completion.`,
      icon: TrendingDown,
      color: 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900/50'
    });
  }
  if (work.ml_anomaly_score > 0.65) {
    activeTriggers.push({
      id: 'ml_anomaly',
      label: 'ML Statistical Anomaly',
      clause: `Isolation Forest Index: ${work.ml_anomaly_score.toFixed(2)}`,
      desc: 'Unsupervised model detected statistical outlier pattern in project cost-to-agency ratio.',
      icon: BrainCircuit,
      color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50'
    });
  }

  // Financial calculations
  const sanctioned = work.sanctioned_amount;
  const utilized = Math.round(sanctioned * (work.utilization_pct / 100));
  const remaining = Math.max(0, sanctioned - utilized);

  // Risk Factor Breakdown (Deterministic proportional calculation)
  const factorBreakdown = [
    { name: 'Prohibited Category', pct: work.rule_prohibited_category ? 35 : 0, color: 'bg-red-600' },
    { name: 'Agency Workload Weight', pct: work.risk_score >= 0.7 ? 24 : work.risk_score >= 0.4 ? 14 : 6, color: 'bg-amber-600' },
    { name: 'Low Fund Utilization', pct: work.rule_low_utilization ? 18 : 5, color: 'bg-yellow-500' },
    { name: 'Tender Irregularity', pct: work.rule_no_tender_high_cost ? 12 : 3, color: 'bg-orange-600' },
    { name: 'ML Statistical Anomaly', pct: Math.round(work.ml_anomaly_score * 10), color: 'bg-indigo-600' }
  ].filter(f => f.pct > 0);

  // Recommended Auditor Action derivation
  let recommendedAction = "Standard document reconciliation";
  let recommendationDetails = "Review completion certificates and routine expenditure vouchers.";
  
  if (work.rule_prohibited_category && work.rule_no_tender_high_cost) {
    recommendedAction = "Immediate Physical Site Verification & Tender Inquiry";
    recommendationDetails = "Deploy field inspection team to verify asset existence and scrutinize single-nomination tender approvals against GFR Rule 149.";
  } else if (work.rule_prohibited_category) {
    recommendedAction = "Policy Compliance Review";
    recommendationDetails = "Examine project sanction order against MPLADS Clause 5.1 negative list for unauthorized public expenditure.";
  } else if (work.rule_no_tender_high_cost) {
    recommendedAction = "Procurement & Tender Audit";
    recommendationDetails = "Inspect executing agency tender committee minutes to examine justification for single-source nomination.";
  } else if (work.rule_low_utilization) {
    recommendedAction = "Financial Utilization Verification";
    recommendationDetails = "Verify bank accounts of executing agency for parked unspent balances and examine reason for stalled physical progress.";
  } else if (work.ml_anomaly_score > 0.65) {
    recommendedAction = "Cost-Benchmark Technical Audit";
    recommendationDetails = "Conduct engineering quantity-estimation audit to verify whether sanctioned rates deviate from standard State PWD schedule of rates.";
  }

  // Handle Auditor Actions
  const handleActionClick = (actionName: string, newStatus: string, detailMsg: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setCurrentStatus(newStatus);
    setActionSuccessMsg(`Status updated: ${newStatus}`);
    
    // Append to audit trail
    setTrail(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        timestamp: timeNow,
        action: actionName,
        detail: detailMsg,
        actor: 'District Magistrate / Auditor'
      }
    ]);

    if (onUpdateWorkStatus) {
      onUpdateWorkStatus(work.work_id, newStatus as MPLADSWork['audit_status']);
    }

    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newNote = `[${timeNow}] ${noteInput.trim()}`;
    setAuditNotes(prev => [...prev, newNote]);
    
    setTrail(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        timestamp: timeNow,
        action: 'Audit Note Appended',
        detail: `"${noteInput.trim()}"`,
        actor: 'Auditor'
      }
    ]);

    setNoteInput('');
    setIsAddingNote(false);
    setActionSuccessMsg('Audit note recorded successfully');
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${work.latitude},${work.longitude}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div 
        className="bg-[var(--surface)] rounded-xl shadow-2xl border border-[var(--border)] max-w-4xl w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[var(--surface-elevated)] text-[var(--text-primary)] px-6 py-4 rounded-t-xl flex justify-between items-start border-b border-[var(--border)] sticky top-0 z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-bold">
                AUDIT DOSSIER • {work.work_id}
              </span>
              <span className="text-[10px] bg-red-600 text-white font-mono px-2 py-0.5 rounded font-bold uppercase shadow-2xs">
                {priorityTier} PRIORITY
              </span>
              <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                STATUS: <strong className="text-amber-700 dark:text-amber-400 font-bold">{currentStatus}</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mt-1.5 leading-snug">
              {work.category}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Constituency: <strong className="text-[var(--text-primary)]">{work.mp_name_constituency}</strong> ({work.state})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-[var(--text-secondary)]">
          {/* Action Success Alert Message */}
          {actionSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-lg text-emerald-800 dark:text-emerald-300 font-semibold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {/* Top Score Banner & Why Flagged Plain English */}
          <div className="rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--surface-raised)] shadow-2xs">
            <div className="p-4 bg-[var(--surface)] border-b border-[var(--border)] flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1.5 rounded-md border text-sm font-bold font-mono flex items-center space-x-2 ${badge.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                  <span>RISK SCORE: {work.risk_score.toFixed(3)}</span>
                  <span className="text-[11px] font-normal uppercase">({badge.label})</span>
                </div>
                <div className="text-xs text-[var(--text-muted)] font-mono">
                  ML Anomaly Index: <strong>{work.ml_anomaly_score.toFixed(2)}</strong>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] rounded-md hover:bg-[var(--surface-hover)] flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span>Print Audit Dossier</span>
                </button>
              </div>
            </div>

            {/* Plain English Section */}
            <div className="p-4 bg-gradient-to-r from-amber-50/90 via-[var(--surface-raised)] to-[var(--surface)] dark:from-amber-950/20 dark:via-[var(--surface-raised)] dark:to-[var(--surface)]">
              <div className="flex items-start space-x-3">
                <div className="p-1.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex-shrink-0 mt-0.5 border border-amber-200 dark:border-amber-900/50">
                  <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Why This Project Was Flagged (Auditor Plain English Explanation)
                  </h4>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mt-1 leading-relaxed">
                    {work.risk_explanation}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    <em>AI-Assisted Audit Summary:</em> This work was prioritized because it combines statutory policy rule breaches with low fund utilization and an unusual statistical outlier pattern compared with similar works in this category.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN INVESTIGATION LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: Project Profile, Financials & Specifications (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Financial Analysis */}
              <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3 flex items-center justify-between">
                  <span>Financial Utilization Analysis</span>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">Statutory MPLADS Quota</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                  <div className="p-2.5 bg-[var(--surface-raised)] rounded-lg border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Total Sanctioned</span>
                    <span className="text-sm font-bold font-mono text-[var(--text-primary)] mt-0.5 block">{formatRupees(sanctioned)}</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/25 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block uppercase font-bold">Disbursed / Utilized</span>
                    <span className="text-sm font-bold font-mono text-emerald-800 dark:text-emerald-300 mt-0.5 block">{formatRupees(utilized)} ({work.utilization_pct}%)</span>
                  </div>
                  <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/25 rounded-lg border border-amber-200 dark:border-amber-900/40">
                    <span className="text-[10px] text-amber-800 dark:text-amber-400 block uppercase font-bold">Unspent Balance</span>
                    <span className="text-sm font-bold font-mono text-amber-800 dark:text-amber-300 mt-0.5 block">{formatRupees(remaining)} ({(100 - work.utilization_pct).toFixed(1)}%)</span>
                  </div>
                </div>

                {/* Horizontal progress visualization */}
                <div className="space-y-1">
                  <div className="w-full bg-amber-200 dark:bg-amber-950 rounded-full h-3 overflow-hidden flex border border-[var(--border)]">
                    <div 
                      className={`h-3 ${work.utilization_pct < 40 ? 'bg-red-500' : 'bg-emerald-600'}`}
                      style={{ width: `${Math.min(100, work.utilization_pct)}%` }}
                      title={`Utilized: ${work.utilization_pct}%`}
                    ></div>
                    <div 
                      className="h-3 bg-amber-400"
                      style={{ width: `${Math.max(0, 100 - work.utilization_pct)}%` }}
                      title={`Remaining: ${(100 - work.utilization_pct).toFixed(1)}%`}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono pt-0.5">
                    <span>0%</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Utilized: {work.utilization_pct}%</span>
                    <span className="text-amber-800 dark:text-amber-400 font-bold">Unspent: {(100 - work.utilization_pct).toFixed(1)}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Project & Procurement Specifications */}
              <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3">
                  Project &amp; Procurement Dossier
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[var(--surface-raised)] p-3.5 rounded-lg border border-[var(--border)]">
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Sanctioned Amount</span>
                    <span className="font-bold font-mono text-[var(--text-primary)] text-sm">
                      {formatRupees(work.sanctioned_amount)}
                    </span>
                    <span className="text-[var(--text-muted)] block text-[10px]">
                      ({formatRupeesFull(work.sanctioned_amount)})
                    </span>
                  </div>

                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Tender Procedure</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {work.tender_type}
                    </span>
                  </div>

                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Implementing Agency / Authority</span>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToContractor?.(work.contractor_name);
                      }}
                      className="text-left font-semibold text-blue-800 dark:text-blue-400 hover:text-blue-950 dark:hover:text-blue-300 hover:underline flex items-center space-x-1 group cursor-pointer"
                      title={`Inspect ${work.contractor_name} in Agency Network`}
                    >
                      <span className="truncate max-w-[200px]">{work.contractor_name}</span>
                      <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400 opacity-75 group-hover:opacity-100 flex-shrink-0" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Executing Agency Type</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {work.agency_type}
                    </span>
                  </div>

                  {work.official_letter_no && (
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Sanction Letter / Order</span>
                      <span className="font-mono text-[var(--text-primary)] text-[11px] truncate block" title={work.official_letter_no}>
                        {work.official_letter_no}
                      </span>
                    </div>
                  )}

                  {work.official_work_stage && (
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">eSAKSHI Work Stage</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                        {work.official_work_stage}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Sanction &amp; Target Dates</span>
                    <span className="text-[var(--text-primary)] font-mono text-[11px]">
                      Sanction: <strong>{work.sanction_date}</strong>
                      <br />
                      Target: <strong>{work.completion_date}</strong>
                    </span>
                  </div>

                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">GPS Geotagging</span>
                    <span className="font-mono text-[var(--text-primary)] text-[11px]">
                      {work.latitude.toFixed(5)}, {work.longitude.toFixed(5)}
                    </span>
                    <a 
                      href={mapUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-blue-700 dark:text-blue-400 hover:underline block text-[10px] font-semibold mt-0.5 cursor-pointer"
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                </div>
              </div>

              {/* Applicable Triggered Risk Flags */}
              <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#F5F7FA] mb-2.5">
                  Specific Triggered Risk Flags ({activeTriggers.length})
                </h4>
                {activeTriggers.length === 0 ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-lg text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>No statutory violation rules triggered. Project complies with standard GFR guidelines.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeTriggers.map((trig) => {
                      const Icon = trig.icon;
                      return (
                        <div key={trig.id} className={`p-3 rounded-lg border ${trig.color}`}>
                          <div className="flex items-start space-x-2.5">
                            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-xs">{trig.label}</div>
                              <div className="text-[10px] font-mono opacity-80 mt-0.5">{trig.clause}</div>
                              <div className="text-xs mt-1 leading-snug">{trig.desc}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Related Entities Flow */}
              <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2.5 flex items-center justify-between">
                  <span>Related Entity Relationship Flow</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">Click any entity to cross-navigate</span>
                </h4>
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-[var(--surface-raised)] p-3 rounded-lg border border-[var(--border)]">
                  <div className="text-center p-2 bg-[var(--surface)] rounded border border-[var(--border)] min-w-[110px]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Member of Parliament</span>
                    <span className="font-bold text-[var(--text-primary)]">{work.mp_name_constituency.split('(')[0]}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] hidden sm:block" />
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToState?.(work.state);
                    }}
                    className="text-center p-2 bg-[var(--surface)] hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-[var(--border)] hover:border-blue-300 dark:hover:border-blue-700 rounded min-w-[110px] transition-all cursor-pointer group"
                    title={`Open State Drill-Down for ${work.state}`}
                  >
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold group-hover:text-blue-700 dark:group-hover:text-blue-400">Constituency ↗</span>
                    <span className="font-bold text-[var(--text-primary)] group-hover:text-blue-900 dark:group-hover:text-blue-300">{work.state}</span>
                  </button>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] hidden sm:block" />
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToContractor?.(work.contractor_name);
                    }}
                    className="text-center p-2 bg-[var(--surface)] hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-[var(--border)] hover:border-blue-300 dark:hover:border-blue-700 rounded min-w-[110px] transition-all cursor-pointer group"
                    title={`Open MP / Agency Network for ${work.contractor_name}`}
                  >
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold group-hover:text-blue-700 dark:group-hover:text-blue-400">Implementing Agency ↗</span>
                    <span className="font-bold text-blue-900 dark:text-blue-400 group-hover:text-blue-950 dark:group-hover:text-blue-300 truncate max-w-[120px] block">{work.contractor_name}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Risk Factor Breakdown, Actions, Audit Trail (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Risk Factor Breakdown */}
              <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3 flex items-center justify-between">
                  <span>Risk Factor Breakdown</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">Score Contribution</span>
                </h4>
                <div className="space-y-2.5">
                  {factorBreakdown.map((factor, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-[var(--text-secondary)]">{factor.name}</span>
                        <span className="font-mono font-bold text-[var(--text-primary)]">{factor.pct}%</span>
                      </div>
                      <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
                        <div className={`h-2 rounded-full ${factor.color}`} style={{ width: `${factor.pct * 2.5}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Auditor Action */}
              <div className="bg-amber-50/70 dark:bg-amber-950/25 border-l-4 border-amber-500 p-4 rounded-r-lg border border-amber-200/80 dark:border-amber-900/40 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 dark:text-amber-300 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Recommended Auditor Action</span>
                </h4>
                <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
                  {recommendedAction}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  {recommendationDetails}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] italic mt-1.5">
                  Advisory note only. AI signals indicate procedural variance or risk, not established criminality.
                </p>
              </div>

              {/* Functional Prototype Auditor Actions */}
              <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-2xs space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Auditor Case Actions
                  </h4>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono bg-[var(--surface-raised)] px-1.5 py-0.5 rounded border border-[var(--border)] font-semibold">
                    {currentStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleActionClick(
                      'Marked for Physical Inspection', 
                      'PHYSICAL INSPECTION RECOMMENDED',
                      'Dispatched on-site engineering team to inspect asset completion & GPS coordinates'
                    )}
                    className="px-2.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold transition-colors shadow-2xs text-center cursor-pointer"
                  >
                    Mark for Physical Inspection
                  </button>

                  <button
                    onClick={() => handleActionClick(
                      'Document Verification Requested',
                      'DOCUMENTS REQUESTED',
                      'Issued notice to executing agency for single-tender sanction files & expenditure bills'
                    )}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-md text-xs font-semibold transition-colors shadow-2xs text-center cursor-pointer"
                  >
                    Request Documents
                  </button>

                  <button
                    onClick={() => handleActionClick(
                      'Case Escalated to CAG Audit',
                      'ESCALATED TO CAG',
                      'Elevated case to Central Comptroller & Auditor General special inquiry cell'
                    )}
                    className="px-2.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md text-xs font-semibold transition-colors shadow-2xs text-center cursor-pointer"
                  >
                    Escalate Case
                  </button>

                  <button
                    onClick={() => setIsAddingNote(!isAddingNote)}
                    className="px-2.5 py-2 bg-[var(--surface-raised)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-md text-xs font-semibold transition-colors text-center cursor-pointer"
                  >
                    Add Field Note
                  </button>
                </div>

                {/* Note input box */}
                {isAddingNote && (
                  <div className="mt-2.5 p-3 bg-[var(--surface-raised)] rounded-lg border border-[var(--border)] space-y-2">
                    <textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Enter observation, inspection order number, or field notes..."
                      className="w-full p-2 border border-[var(--border)] rounded-md text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      rows={2}
                    ></textarea>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setIsAddingNote(false)}
                        className="px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddNote}
                        className="px-3 py-1 text-xs font-semibold bg-blue-700 text-white rounded hover:bg-blue-800 cursor-pointer"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                )}

                {/* Saved Notes list */}
                {auditNotes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Attached Field Notes:</span>
                    {auditNotes.map((note, idx) => (
                      <div key={idx} className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded text-[11px] text-amber-900 dark:text-amber-300 font-mono">
                        {note}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Trail */}
              <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2.5 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>Audit Trail (System Event Log)</span>
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {trail.slice().reverse().map((entry) => (
                    <div key={entry.id} className="p-2 bg-[var(--surface-raised)] rounded border border-[var(--border)] flex items-start space-x-2.5 text-xs">
                      <span className="font-mono text-[var(--text-muted)] text-[10px] font-semibold flex-shrink-0 mt-0.5">
                        {entry.timestamp}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-[var(--text-primary)] flex items-center justify-between">
                          <span>{entry.action}</span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">{entry.actor}</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{entry.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-[var(--border)] flex justify-between items-center">
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              Audit ID: AUD-MPLADS-{work.work_id} • MoSPI Vigilance Protocol
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)] bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] rounded-md transition-colors border border-[var(--border)] cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
