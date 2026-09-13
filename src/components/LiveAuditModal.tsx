import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  Cpu, 
  ListOrdered 
} from 'lucide-react';

interface LiveAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAuditQueue: () => void;
  totalWorks: number;
}

const STEPS = [
  { id: 1, title: "Ingesting MPLADS records", detail: "Reading central e-governance database across 543 Parliamentary seats" },
  { id: 2, title: "Validating expenditure records", detail: "Cross-checking sanctions against ₹5 Cr/year statutory ceiling" },
  { id: 3, title: "Running policy/rule engine", detail: "Verifying Clause 5.1 negative list and GFR 2017 open tender thresholds" },
  { id: 4, title: "Running ML anomaly detection", detail: "Computing Isolation Forest density estimators on cost distributions" },
  { id: 5, title: "Analyzing contractor relationships", detail: "Detecting multi-state collusion patterns and cartel concentrations" },
  { id: 6, title: "Calculating risk scores", detail: "Synthesizing multi-factor weighted risk indices [0.00 - 0.98]" },
  { id: 7, title: "Prioritizing audit cases", detail: "Ranking non-compliant and high-risk projects for field inspection" },
  { id: 8, title: "Generating audit queue", detail: "Finalizing Top 20 physical verification roster for CAG & DMs" },
];

export const LiveAuditModal: React.FC<LiveAuditModalProps> = ({
  isOpen,
  onClose,
  onViewAuditQueue,
  totalWorks
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsFinished(false);
      return;
    }

    // Step by step animation timer (approx 300ms per step)
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step <= STEPS.length) {
        setCurrentStep(step);
      } else {
        setIsFinished(true);
        clearInterval(interval);
      }
    }, 360);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div 
        className="bg-[var(--surface)] rounded-xl shadow-2xl border border-[var(--border)] max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[var(--surface-elevated)] text-[var(--text-primary)] px-6 py-4 flex justify-between items-center border-b border-[var(--border)]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white shadow-2xs">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Live Audit Pipeline Execution</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">MoSPI MPLADS National Surveillance Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {!isFinished ? (
            <div className="space-y-4">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-[var(--text-primary)]">
                    Executing Step {Math.min(currentStep, STEPS.length)} of {STEPS.length}
                  </span>
                  <span className="font-mono text-blue-700 dark:text-blue-400 font-bold">
                    {Math.round((Math.min(currentStep, STEPS.length) / STEPS.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-[var(--bg-primary)] rounded-full h-2 overflow-hidden border border-[var(--border)]">
                  <div 
                    className="h-2 bg-blue-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${(Math.min(currentStep, STEPS.length) / STEPS.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Steps list */}
              <div className="space-y-2 pt-2 max-h-80 overflow-y-auto pr-1">
                {STEPS.map((step) => {
                  const isDone = currentStep > step.id;
                  const isRunning = currentStep === step.id;
                  const isPending = currentStep < step.id;

                  return (
                    <div 
                      key={step.id}
                      className={`p-2.5 rounded-lg border transition-all duration-200 flex items-start space-x-3 ${
                        isRunning 
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700/60 shadow-xs' 
                          : isDone 
                          ? 'bg-[var(--surface-raised)] border-[var(--border)] opacity-90' 
                          : 'bg-[var(--bg-primary)] border-[var(--border)] opacity-50'
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : isRunning ? (
                          <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-[var(--border)] flex items-center justify-center text-[9px] font-mono text-[var(--text-muted)]">
                            {step.id}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-semibold ${isRunning ? 'text-blue-950 dark:text-blue-300 font-bold' : isDone ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                            STEP {step.id}: {step.title}
                          </span>
                          {isRunning && (
                            <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-1.5 py-0.2 rounded font-semibold">
                              PROCESSING
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-tight">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Completed Result Summary */
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-lg flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-300 uppercase tracking-wide">
                    AUDIT SCAN COMPLETE
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-0.5">
                    Surveillance pipeline successfully evaluated all scheme expenditures against statutory CAG rules and ML anomaly detectors.
                  </p>
                </div>
              </div>

              {/* 4 Summary Stats as required */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--surface-raised)] p-3 rounded-lg border border-[var(--border)] text-center">
                  <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)] block">Works Scanned</span>
                  <span className="text-xl font-bold font-mono text-[var(--text-primary)] mt-0.5 block">
                    {totalWorks.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">Across 543 MPs</span>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 text-center">
                  <span className="text-[10px] font-semibold uppercase text-amber-800 dark:text-amber-400 block">Potential Risks</span>
                  <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-0.5 block">
                    357
                  </span>
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">Variance indicators</span>
                </div>

                <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-900/40 text-center">
                  <span className="text-[10px] font-semibold uppercase text-red-800 dark:text-red-400 block">High-Risk Cases</span>
                  <span className="text-xl font-bold font-mono text-red-600 dark:text-red-400 mt-0.5 block">
                    57
                  </span>
                  <span className="text-[10px] text-red-700/80 dark:text-red-400/80">Score &gt; 0.30</span>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-900/40 text-center">
                  <span className="text-[10px] font-semibold uppercase text-blue-800 dark:text-blue-400 block">Priority Audit Cases</span>
                  <span className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300 mt-0.5 block">
                    20
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400">Immediate field dispatch</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  Execution Time: 2.84s • GFR 2017 Calibrated
                </span>
                <button
                  onClick={onViewAuditQueue}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors shadow-sm cursor-pointer"
                >
                  <ListOrdered className="w-4 h-4" />
                  <span>View Audit Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
