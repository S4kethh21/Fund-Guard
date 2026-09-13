import { 
  ShieldAlert, 
  BarChart3, 
  MapPin, 
  ListOrdered, 
  Search, 
  Info, 
  MessageSquare, 
  Sun, 
  Moon 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalWorks: number;
  highRiskCount: number;
  onOpenAbout: () => void;
  onQuickSearch: () => void;
  onToggleDemoMode: () => void;
  isDemoModeOpen: boolean;
  onOpenAskAssistant: () => void;
  activeScenario?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalWorks,
  highRiskCount,
  onOpenAbout,
  onQuickSearch,
  onToggleDemoMode,
  isDemoModeOpen,
  onOpenAskAssistant,
  activeScenario
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)] text-[var(--text-primary)] shadow-xs border-b border-[var(--border)] transition-colors duration-180">
      {/* Official Top Government Strip */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[11px] text-[var(--text-secondary)] transition-colors duration-180">
        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-8 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5 font-medium tracking-wide">
              {/* National Emblem Color Accent */}
              <span className="w-2 h-2 rounded-full bg-amber-500 ring-1 ring-amber-300/40"></span>
              <span className="text-[var(--text-primary)] font-semibold">भारत सरकार | Government of India</span>
              <span className="text-[var(--text-muted)] mx-1">|</span>
              <span className="text-[var(--text-secondary)] hidden sm:inline">Ministry of Statistics &amp; Programme Implementation (MoSPI)</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Pill: MPLADS Expenditure Intelligence Cell */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>MPLADS Expenditure Intelligence Cell</span>
            </div>

            {/* About Model Link */}
            <button
              onClick={onOpenAbout}
              className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="View Model Methodology, CAG Calibrations &amp; GFR Rules"
            >
              <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>About Model</span>
            </button>

            {/* Theme Toggle (Top bar quick control) */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Dark Mode active — Click for Light Mode" : "Light Mode active — Click for Dark Mode"}
              className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center space-x-1.5 transition-colors cursor-pointer px-2 py-0.5 rounded bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              {isDark ? <Moon className="w-3 h-3 text-blue-400" /> : <Sun className="w-3 h-3 text-amber-500" />}
              <span className="hidden sm:inline font-mono font-bold text-[10px]">{isDark ? 'DARK' : 'LIGHT'}</span>
            </button>

            {/* System Status Indicator */}
            <div 
              className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-[10px] cursor-help"
              title="Continuous rule &amp; ML surveillance active"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <div className="flex flex-col text-left leading-tight">
                <span className="font-bold tracking-wider text-[9px] font-mono">SYSTEM OPERATIONAL</span>
                <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-mono -mt-0.5">CONTINUOUS SURVEILLANCE ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Command Navbar */}
      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & System Identity */}
          <div 
            onClick={() => setActiveTab('overview')}
            className="flex items-center space-x-3 cursor-pointer select-none group"
            title="Return to National Overview Command Center"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md border border-blue-400/40 flex-shrink-0 group-hover:from-blue-500 group-hover:to-blue-700 transition-all">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-[var(--text-primary)] flex items-center group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                  Fund Guard
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-700">
                  AUDIT INTELLIGENCE
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] tracking-wide font-medium">
                MPLADS Expenditure &amp; Anomaly Intelligence System
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'overview'
                  ? 'bg-[#1D68F2] text-white shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('state-drilldown')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'state-drilldown'
                  ? 'bg-[#1D68F2] text-white shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>State Drill-Down</span>
            </button>

            <button
              onClick={() => setActiveTab('audit-worklist')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 relative ${
                activeTab === 'audit-worklist'
                  ? 'bg-[#1D68F2] text-white shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Top 20 Audit Queue</span>
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono shadow-xs">
                20
              </span>
            </button>

            <button
              onClick={() => setActiveTab('network-search')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'network-search'
                  ? 'bg-[#1D68F2] text-white shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>MP / Agency Network</span>
            </button>
          </nav>

          {/* Right Action Tools: Monitoring Pool, Search, Demo Mode, Ask AI */}
          <div className="flex items-center space-x-3">
            {/* Monitoring Pool Status Indicator */}
            <div className="hidden xl:flex flex-col text-right pr-2">
              <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">
                Monitoring Pool
              </span>
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {totalWorks.toLocaleString()} Works • <span className="text-red-600 dark:text-red-400 font-bold">{highRiskCount} Flagged</span>
              </span>
            </div>

            {/* Quick Search Button */}
            <button
              onClick={onQuickSearch}
              className="p-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg border border-[var(--border)] transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
              title="Search Implementing Agency / MP Network"
              aria-label="Quick Search"
            >
              <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>

            {/* Theme Toggle Button (Main action bar) */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Dark Mode active — Click for Light Mode" : "Light Mode active — Click for Dark Mode"}
              className="p-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-amber-600 dark:text-blue-300 rounded-lg border border-[var(--border)] transition-all duration-180 shadow-2xs flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isDark ? (
                <Moon className="w-4 h-4 text-blue-400 transition-transform duration-200 hover:-rotate-12" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 transition-transform duration-200 hover:rotate-45" />
              )}
            </button>

            {/* Ask Fund Guard AI button */}
            <button
              onClick={onOpenAskAssistant}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-[#163560] dark:hover:bg-[#1C4278] text-blue-700 dark:text-blue-200 rounded-lg border border-blue-200 dark:border-blue-400/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Open AI-Assisted Audit Assistant"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden lg:inline">Ask Fund Guard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center overflow-x-auto bg-[var(--bg-secondary)] border-t border-[var(--border)] px-2 py-1.5 space-x-1 transition-colors duration-180">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded text-xs whitespace-nowrap font-medium ${
            activeTab === 'overview' ? 'bg-[#1D68F2] text-white font-bold shadow-2xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('state-drilldown')}
          className={`px-3 py-1.5 rounded text-xs whitespace-nowrap font-medium ${
            activeTab === 'state-drilldown' ? 'bg-[#1D68F2] text-white font-bold shadow-2xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          State Drill-Down
        </button>
        <button
          onClick={() => setActiveTab('audit-worklist')}
          className={`px-3 py-1.5 rounded text-xs whitespace-nowrap font-medium ${
            activeTab === 'audit-worklist' ? 'bg-[#1D68F2] text-white font-bold shadow-2xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Top 20 Audit Queue
        </button>
        <button
          onClick={() => setActiveTab('network-search')}
          className={`px-3 py-1.5 rounded text-xs whitespace-nowrap font-medium ${
            activeTab === 'network-search' ? 'bg-[#1D68F2] text-white font-bold shadow-2xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          MP / Agency Network
        </button>
        {/* Mobile Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="px-2.5 py-1.5 rounded text-xs whitespace-nowrap font-medium bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] flex items-center space-x-1 ml-auto"
        >
          {isDark ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
          <span>{isDark ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </header>
  );
};
