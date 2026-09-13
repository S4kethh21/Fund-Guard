import React from 'react';
import { 
  Sparkles, 
  X, 
  RotateCcw, 
  MapPin, 
  Users, 
  TrendingDown, 
  Ban, 
  BrainCircuit, 
  BarChart3
} from 'lucide-react';

export type DemoScenario = 
  | 'overview' 
  | 'high-risk-state' 
  | 'contractor-cartel' 
  | 'low-utilization' 
  | 'prohibited-category' 
  | 'ml-anomaly';

interface DemoModeBarProps {
  isOpen: boolean;
  onClose: () => void;
  activeScenario: DemoScenario;
  onSelectScenario: (scenario: DemoScenario) => void;
  onResetDemo: () => void;
}

export const DemoModeBar: React.FC<DemoModeBarProps> = ({
  isOpen,
  onClose,
  activeScenario,
  onSelectScenario,
  onResetDemo
}) => {
  if (!isOpen) return null;

  const scenarios: { id: DemoScenario; title: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
    {
      id: 'overview',
      title: '1. National Overview',
      desc: 'All-India baseline metrics across 543 MPs and 36 States & UTs',
      icon: BarChart3
    },
    {
      id: 'high-risk-state',
      title: '2. High-Risk State Drilldown',
      desc: 'Drilldown into Uttar Pradesh (High-risk works & expenditure variance)',
      icon: MapPin
    },
    {
      id: 'contractor-cartel',
      title: '3. Agency Network Investigation',
      desc: 'District Collectorate: Multi-work workload & cross-district relationship mapping',
      icon: Users
    },
    {
      id: 'low-utilization',
      title: '4. Low Fund Utilization',
      desc: 'Stalled works with idle parked funds (<40% fund utilization)',
      icon: TrendingDown
    },
    {
      id: 'prohibited-category',
      title: '5. Prohibited Category Violation',
      desc: 'Clause 5.1 Negative List breaches in commercial/private assets',
      icon: Ban
    },
    {
      id: 'ml-anomaly',
      title: '6. Statistical ML Anomaly',
      desc: 'Isolation Forest multivariate cost & agency density outlier (>0.65)',
      icon: BrainCircuit
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          title="Close scenario navigator"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start space-x-3 pr-8">
          <div className="p-2.5 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-blue-700 dark:text-blue-400 tracking-wide uppercase">
                AUDIT SCENARIO NAVIGATOR
              </h2>
              <span className="text-[10px] bg-[var(--surface-raised)] text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-[var(--border)] font-mono">
                Official eSAKSHI Pipeline
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Select an audit scenario to test rule evaluation and machine learning signals on active MPLADS works:
            </p>
          </div>
        </div>

        {/* Scenario Selection Grid */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isSelected = activeScenario === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => {
                  onSelectScenario(sc.id);
                  onClose();
                }}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-[var(--text-primary)] ring-1 ring-amber-400/50 shadow-2xs'
                    : 'bg-[var(--surface-raised)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-md ${
                    isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-[var(--surface)] text-amber-600 dark:text-amber-400 border border-[var(--border)] group-hover:bg-[var(--surface-hover)]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-blue-700 dark:group-hover:text-amber-300 transition-colors">
                      {sc.title}
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {sc.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center pl-2">
                  <span className={`text-xs px-2.5 py-1 rounded font-semibold transition-all ${
                    isSelected 
                      ? 'bg-amber-500 text-slate-950 font-bold' 
                      : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5'
                  }`}>
                    {isSelected ? 'Active' : 'Run →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
          <button
            onClick={() => {
              onResetDemo();
              onClose();
            }}
            className="px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)] rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Restore original default application state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Reset to Default Overview</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1D68F2] hover:bg-[#1557D6] text-white rounded-md text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
