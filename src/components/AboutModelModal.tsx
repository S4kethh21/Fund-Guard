import React from 'react';
import { X, ShieldCheck, Scale, Cpu, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface AboutModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModelModal: React.FC<AboutModelModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div 
        className="bg-[var(--surface)] rounded-xl shadow-2xl border border-[var(--border)] max-w-2xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[var(--surface-elevated)] text-[var(--text-primary)] px-6 py-4 flex justify-between items-center border-b border-[var(--border)]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-600 text-white rounded shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">About Fund Guard Model &amp; Methodology</h3>
              <p className="text-xs text-[var(--text-secondary)]">Auditing Calibration, Regulatory Norms &amp; Machine Learning Architecture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-[var(--text-secondary)] max-h-[80vh] overflow-y-auto">
          {/* Official Disclosure Statement */}
          <div className="p-4 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-lg text-slate-900 dark:text-[#F5F7FA]">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-blue-700 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-950 dark:text-blue-300 block uppercase tracking-wider text-[11px] mb-1">
                  Official Model Disclosure Notice
                </span>
                <p className="italic font-medium leading-relaxed text-blue-900 dark:text-blue-200 text-[13px]">
                  "Risk scores combine rule-based statutory checks (calibrated against CAG audit findings) and an Isolation Forest anomaly detection model to prioritize works for physical verification and administrative review."
                </p>
              </div>
            </div>
          </div>

          {/* Calibrated Audit Stance */}
          <div className="border border-[var(--border)] rounded-lg p-3.5 bg-[var(--surface-raised)]">
            <h4 className="font-bold text-[var(--text-primary)] flex items-center space-x-2 text-xs uppercase tracking-wider mb-1.5">
              <Scale className="w-4 h-4 text-[var(--text-muted)]" />
              <span>Calibrated Legal &amp; Audit Terminology</span>
            </h4>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              This system does not declare "confirmed fraud." In compliance with Indian administrative jurisprudence, all alerts represent <strong>risk indicators</strong>, <strong>statutory non-compliance flags</strong>, or <strong>statistical expenditure deviations</strong> intended to guide physical field inspections by District Authorities and CAG teams.
            </p>
          </div>

          {/* Component 1: Heuristic Statutory Rules */}
          <div>
            <h4 className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span>1. Statutory Heuristic Rules (CAG Audit Calibrated)</span>
            </h4>
            <ul className="space-y-2 pl-2">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--text-primary)]">MPLADS Guidelines Clause 5.1 (Negative List):</strong>
                  <p className="text-[var(--text-secondary)]">Strictly prohibits funding of commercial complexes, private properties, religious buildings, commemorative statues, or land acquisitions.</p>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--text-primary)]">GFR 2017 Rules 149 &amp; 194 (Tender Bypassing):</strong>
                  <p className="text-[var(--text-secondary)]">Mandates competitive e-procurement for works exceeding ₹25 Lakh. Direct nomination or urgency clauses on high-value works trigger automatic investigation flags.</p>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--text-primary)]">Expenditure Velocity &amp; Idle Parking:</strong>
                  <p className="text-[var(--text-secondary)]">Detects projects where substantial funds are drawn but physical utilization remains below 40% after scheduled completion duration.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Component 2: Isolation Forest Machine Learning */}
          <div>
            <h4 className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
              <span>2. Isolation Forest Anomaly Detection (Unsupervised ML)</span>
            </h4>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Trained on high-dimensional parameter vectors including sanctioned amounts normalized by category, execution velocity, contractor concentration indices, and agency-specific cost distributions. The isolation score isolates anomalous data points located in low-density subspaces that escape simple univariate thresholding.
            </p>
          </div>

          {/* Component 3: Data Provenance */}
          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Data Source: 543 Lok Sabha MP Allocation Records (MoSPI)</span>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors cursor-pointer"
            >
              Acknowledge &amp; Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
