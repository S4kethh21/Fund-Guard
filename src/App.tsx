import React, { useState, useMemo, lazy, Suspense } from 'react';
import datasetJson from './data/mplads_official_dataset.json';
import { DatasetBundle, MPLADSWork } from './types/mplads';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { DemoScenario } from './components/DemoModeBar';
import { ShieldCheck, Info, FileSpreadsheet, Loader2 } from 'lucide-react';
import { exportToCSV } from './utils/formatters';
import { computeSystemSummary } from './services/auditDataService';
import { OFFICIAL_DATA_SOURCE } from './services/mpladsSourceAdapter';

// Dynamic code-splitting for secondary views & heavy modals
const StateDrilldownView = lazy(() => import('./components/StateDrilldownView').then(m => ({ default: m.StateDrilldownView })));
const AuditWorklistView = lazy(() => import('./components/AuditWorklistView').then(m => ({ default: m.AuditWorklistView })));
const NetworkSearchView = lazy(() => import('./components/NetworkSearchView').then(m => ({ default: m.NetworkSearchView })));
const WorkDetailModal = lazy(() => import('./components/WorkDetailModal').then(m => ({ default: m.WorkDetailModal })));
const AboutModelModal = lazy(() => import('./components/AboutModelModal').then(m => ({ default: m.AboutModelModal })));
const LiveAuditModal = lazy(() => import('./components/LiveAuditModal').then(m => ({ default: m.LiveAuditModal })));
const DemoModeBar = lazy(() => import('./components/DemoModeBar').then(m => ({ default: m.DemoModeBar })));
const AskFraudGuardModal = lazy(() => import('./components/AskFraudGuardModal').then(m => ({ default: m.AskFraudGuardModal })));

const ViewLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-24 space-y-3">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    <span className="text-xs font-mono text-[var(--text-secondary)]">Loading module...</span>
  </div>
);

const initialData = datasetJson as unknown as DatasetBundle;

export function App() {
  const [data, setData] = useState<DatasetBundle>(initialData);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedState, setSelectedState] = useState<string>('Uttar Pradesh');
  const [selectedWork, setSelectedWork] = useState<MPLADSWork | null>(null);

  // Dynamic system summary decoupled from static JSON
  const systemSummary = useMemo(() => {
    return computeSystemSummary(data.works, data.allocations);
  }, [data.works, data.allocations]);
  
  // Modals & Panels
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isLiveAuditOpen, setIsLiveAuditOpen] = useState<boolean>(false);
  const [isAskAssistantOpen, setIsAskAssistantOpen] = useState<boolean>(false);
  const [isDemoModeOpen, setIsDemoModeOpen] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<DemoScenario>('overview');

  // Interactive filters
  const [statePresetFilter, setStatePresetFilter] = useState<string>('all');
  const [contractorPresetSearch, setContractorPresetSearch] = useState<string>('District Collectorate');

  // Handle State Navigation from any component
  const handleSelectState = (state: string) => {
    setSelectedState(state);
    setActiveTab('state-drilldown');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Work Dossier Selection
  const handleSelectWork = (work: MPLADSWork) => {
    setSelectedWork(work);
  };

  // Update Work Status & Notes from Dossier Actions
  const handleUpdateWorkStatus = (workId: string, status: MPLADSWork['audit_status'], note?: string) => {
    setData(prev => {
      const updatedWorks = prev.works.map(w => {
        if (w.work_id === workId) {
          const notes = w.audit_notes || [];
          return {
            ...w,
            audit_status: status,
            audit_notes: note ? [...notes, note] : notes
          };
        }
        return w;
      });
      return {
        ...prev,
        works: updatedWorks
      };
    });

    if (selectedWork && selectedWork.work_id === workId) {
      setSelectedWork(prev => prev ? { ...prev, audit_status: status } : null);
    }
  };

  // Quick Search Trigger
  const handleQuickSearch = () => {
    setActiveTab('network-search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Direct Contractor Navigation
  const handleNavigateToContractor = (contractorName: string) => {
    setContractorPresetSearch(contractorName);
    setActiveTab('network-search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Download Master Dataset
  const handleDownloadFullDataset = () => {
    exportToCSV(data.works, 'mplads_works_full_scored_export.csv');
  };

  // DEMO MODE SCENARIOS (Section 4)
  const handleSelectScenario = (scenario: DemoScenario) => {
    setActiveScenario(scenario);

    switch (scenario) {
      case 'overview':
        setActiveTab('overview');
        setStatePresetFilter('all');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      case 'high-risk-state':
        setSelectedState('Uttar Pradesh');
        setStatePresetFilter('all');
        setActiveTab('state-drilldown');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      case 'contractor-cartel':
        setContractorPresetSearch('District Collectorate');
        setActiveTab('network-search');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      case 'low-utilization':
        setSelectedState('Uttar Pradesh');
        setStatePresetFilter('low_util');
        setActiveTab('state-drilldown');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      case 'prohibited-category':
        setSelectedState('Uttar Pradesh');
        setStatePresetFilter('prohibited');
        setActiveTab('state-drilldown');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      case 'ml-anomaly':
        setSelectedState('Uttar Pradesh');
        setStatePresetFilter('anomaly');
        setActiveTab('state-drilldown');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      default:
        break;
    }
  };

  const handleResetDemo = () => {
    setActiveScenario('overview');
    setActiveTab('overview');
    setSelectedState('Uttar Pradesh');
    setStatePresetFilter('all');
    setContractorPresetSearch('District Collectorate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-180">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalWorks={systemSummary.total_works}
        highRiskCount={systemSummary.high_risk_works_count}
        onOpenAbout={() => setIsAboutOpen(true)}
        onQuickSearch={handleQuickSearch}
        onToggleDemoMode={() => setIsDemoModeOpen(!isDemoModeOpen)}
        isDemoModeOpen={isDemoModeOpen}
        onOpenAskAssistant={() => setIsAskAssistantOpen(true)}
        activeScenario={activeScenario}
      />

      {/* Global SIH Demonstration Mode Modal Dialog */}
      <Suspense fallback={null}>
        {isDemoModeOpen && (
          <DemoModeBar
            isOpen={isDemoModeOpen}
            onClose={() => setIsDemoModeOpen(false)}
            activeScenario={activeScenario}
            onSelectScenario={handleSelectScenario}
            onResetDemo={handleResetDemo}
          />
        )}
      </Suspense>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'overview' && (
          <OverviewView
            summary={systemSummary}
            works={data.works}
            onSelectState={handleSelectState}
            onSelectWork={handleSelectWork}
            onNavigateToQueue={() => setActiveTab('audit-worklist')}
            onRunLiveAudit={() => setIsLiveAuditOpen(true)}
            onOpenDemoMode={() => setIsDemoModeOpen(true)}
          />
        )}

        <Suspense fallback={<ViewLoadingFallback />}>
          {activeTab === 'state-drilldown' && (
            <StateDrilldownView
              works={data.works}
              selectedState={selectedState}
              onSelectState={setSelectedState}
              onSelectWork={handleSelectWork}
              presetFilter={statePresetFilter}
              onBackToOverview={() => setActiveTab('overview')}
            />
          )}

          {activeTab === 'audit-worklist' && (
            <AuditWorklistView
              works={data.works}
              onSelectWork={handleSelectWork}
              onBackToOverview={() => setActiveTab('overview')}
            />
          )}

          {activeTab === 'network-search' && (
            <NetworkSearchView
              works={data.works}
              onSelectWork={handleSelectWork}
              presetSearch={contractorPresetSearch}
              onBackToOverview={() => setActiveTab('overview')}
            />
          )}
        </Suspense>
      </main>

      {/* Modals with Suspense */}
      <Suspense fallback={null}>
        {isLiveAuditOpen && (
          <LiveAuditModal
            isOpen={isLiveAuditOpen}
            onClose={() => setIsLiveAuditOpen(false)}
            onViewAuditQueue={() => {
              setIsLiveAuditOpen(false);
              setActiveTab('audit-worklist');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            totalWorks={systemSummary.total_works}
          />
        )}

        {isAskAssistantOpen && (
          <AskFraudGuardModal
            isOpen={isAskAssistantOpen}
            onClose={() => setIsAskAssistantOpen(false)}
            summary={systemSummary}
            works={data.works}
            onNavigateToState={(st) => handleSelectState(st)}
            onNavigateToContractor={(cont) => handleNavigateToContractor(cont)}
          />
        )}

        {selectedWork && (
          <WorkDetailModal
            work={selectedWork}
            onClose={() => setSelectedWork(null)}
            onUpdateWorkStatus={handleUpdateWorkStatus}
            onNavigateToState={(st) => handleSelectState(st)}
            onNavigateToContractor={(cont) => handleNavigateToContractor(cont)}
          />
        )}

        {isAboutOpen && (
          <AboutModelModal
            isOpen={isAboutOpen}
            onClose={() => setIsAboutOpen(false)}
          />
        )}
      </Suspense>

      {/* Official Institutional Footer */}
      <footer className="bg-[var(--surface)] text-[var(--text-secondary)] text-xs border-t border-[var(--border)] py-6 mt-10 no-print transition-colors duration-200">
        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-start sm:items-center space-x-3 text-[var(--text-secondary)]">
              <div className="p-1.5 rounded bg-[var(--surface-raised)] text-blue-600 dark:text-blue-400 border border-[var(--border)] flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] max-w-3xl leading-relaxed">
                <span className="font-bold text-[var(--text-primary)]">Fund Guard</span> is an independent audit-support platform. Rule-based and ML indicators identify cases requiring further human verification; they do not independently establish fraud.
              </p>
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0 self-start lg:self-center">
              <button
                onClick={handleDownloadFullDataset}
                className="px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-lg border border-[var(--border)] flex items-center space-x-1.5 transition-colors text-xs cursor-pointer shadow-2xs"
                title="Download Scored Works CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Download Master CSV</span>
              </button>
              <button
                onClick={() => setIsAboutOpen(true)}
                className="px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-lg border border-[var(--border)] flex items-center space-x-1.5 transition-colors text-xs cursor-pointer shadow-2xs"
              >
                <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Methodology</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row justify-between items-center text-[11px] text-[var(--text-muted)] gap-2">
            <div>
              <span>Data source: <a href={OFFICIAL_DATA_SOURCE.PORTAL_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium">{OFFICIAL_DATA_SOURCE.TITLE}, MoSPI ↗</a> • Digital fund flow records from 1 April 2023 onward</span>
            </div>
            <div className="flex items-center space-x-3 text-[var(--text-muted)]">
              <span className="bg-[var(--surface-raised)] px-2 py-0.5 rounded border border-[var(--border)] text-[10px] text-[var(--text-secondary)] font-medium">
                Fund Guard v1.0 • Institutional Audit Intelligence
              </span>
              <span>•</span>
              <span>GFR 2017 Rules 149/194</span>
              <span>•</span>
              <span>MPLADS Clause 5.1 Calibrated</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
