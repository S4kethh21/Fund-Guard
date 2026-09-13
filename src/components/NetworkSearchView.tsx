import React, { useState, useMemo, useEffect } from 'react';
import { MPLADSWork } from '../types/mplads';
import { formatRupees, getRiskBadgeClasses } from '../utils/formatters';
import { 
  Search, 
  Building2, 
  User, 
  Network, 
  ShieldAlert, 
  GitFork, 
  ArrowLeft 
} from 'lucide-react';

interface NetworkSearchViewProps {
  works: MPLADSWork[];
  onSelectWork: (work: MPLADSWork) => void;
  presetSearch?: string;
  onBackToOverview?: () => void;
}

export const NetworkSearchView: React.FC<NetworkSearchViewProps> = ({
  works,
  onSelectWork,
  presetSearch,
  onBackToOverview
}) => {
  const [searchTerm, setSearchTerm] = useState(presetSearch || 'District Collectorate');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    if (presetSearch) {
      setSearchTerm(presetSearch);
      setSelectedStateFilter(null);
    }
  }, [presetSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStateFilter]);

  // Compute contractor footprints across all works
  const contractorNetworkMap = useMemo(() => {
    const map = new Map<string, {
      name: string;
      states: Set<string>;
      works: MPLADSWork[];
      totalAmount: number;
      highRiskCount: number;
    }>();

    works.forEach(w => {
      if (!map.has(w.contractor_name)) {
        map.set(w.contractor_name, {
          name: w.contractor_name,
          states: new Set<string>(),
          works: [],
          totalAmount: 0,
          highRiskCount: 0
        });
      }
      const entry = map.get(w.contractor_name)!;
      entry.states.add(w.state);
      entry.works.push(w);
      entry.totalAmount += w.sanctioned_amount;
      if (w.risk_score > 0.30) {
        entry.highRiskCount += 1;
      }
    });

    return map;
  }, [works]);

  // Compute MP profiles across all works
  const mpProfileMap = useMemo(() => {
    const map = new Map<string, {
      mp_name_constituency: string;
      state: string;
      works: MPLADSWork[];
      totalAmount: number;
      highRiskCount: number;
    }>();

    works.forEach(w => {
      if (!map.has(w.mp_name_constituency)) {
        map.set(w.mp_name_constituency, {
          mp_name_constituency: w.mp_name_constituency,
          state: w.state,
          works: [],
          totalAmount: 0,
          highRiskCount: 0
        });
      }
      const entry = map.get(w.mp_name_constituency)!;
      entry.works.push(w);
      entry.totalAmount += w.sanctioned_amount;
      if (w.risk_score > 0.30) {
        entry.highRiskCount += 1;
      }
    });

    return map;
  }, [works]);

  // Filter matching works based on search term and optional state node filter
  const matchedData = useMemo(() => {
    if (!searchTerm.trim()) {
      return { works: [], isContractor: false, isMP: false, contractorMeta: null, mpMeta: null };
    }

    const term = searchTerm.trim().toLowerCase();

    // Check if matching a contractor
    let matchedContractorKey: string | null = null;
    for (const [key] of contractorNetworkMap) {
      if (key.toLowerCase().includes(term)) {
        matchedContractorKey = key;
        break;
      }
    }

    // Check if matching an MP
    let matchedMPKey: string | null = null;
    for (const [key] of mpProfileMap) {
      if (key.toLowerCase().includes(term)) {
        matchedMPKey = key;
        break;
      }
    }

    let matchingWorks = works.filter(w => 
      w.contractor_name.toLowerCase().includes(term) ||
      w.mp_name_constituency.toLowerCase().includes(term) ||
      w.state.toLowerCase().includes(term)
    );

    if (selectedStateFilter) {
      matchingWorks = matchingWorks.filter(w => w.state === selectedStateFilter);
    }

    const contractorMeta = matchedContractorKey ? contractorNetworkMap.get(matchedContractorKey) : null;
    const mpMeta = matchedMPKey ? mpProfileMap.get(matchedMPKey) : null;

    return {
      works: matchingWorks,
      isContractor: !!contractorMeta,
      isMP: !!mpMeta,
      contractorMeta,
      mpMeta
    };
  }, [searchTerm, works, contractorNetworkMap, mpProfileMap, selectedStateFilter]);

  // Derived concentration calculations
  const concentrationMetrics = useMemo(() => {
    if (!matchedData.contractorMeta) return null;
    const meta = matchedData.contractorMeta;
    const totalW = meta.works.length;
    const totalAmt = meta.totalAmount;
    const avgVal = totalW > 0 ? totalAmt / totalW : 0;
    const statesCount = meta.states.size;
    
    // State concentration: percentage of projects in top state
    const stateCounts: Record<string, number> = {};
    meta.works.forEach(w => {
      stateCounts[w.state] = (stateCounts[w.state] || 0) + 1;
    });
    const maxInOneState = Math.max(...Object.values(stateCounts));
    const topStateConcentration = totalW > 0 ? Math.round((maxInOneState / totalW) * 100) : 0;

    return {
      avgVal,
      topStateConcentration,
      statesCount,
      stateCounts
    };
  }, [matchedData.contractorMeta]);

  return (
    <div className="space-y-6">
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
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span className="text-[11px] font-mono text-[var(--text-muted)] font-bold uppercase tracking-wider">
              ENTITY SURVEILLANCE &amp; CARTEL MATRIX
            </span>
          </div>
        </div>
      )}

      {/* Search Bar Banner */}
      <div className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] shadow-sm space-y-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase tracking-wider bg-[var(--surface-raised)] text-[var(--text-secondary)] px-2 py-0.5 rounded font-bold border border-[var(--border)] flex items-center">
              <Network className="w-3.5 h-3.5 mr-1 text-blue-600 dark:text-blue-400" />
              Contractor Cartelization &amp; MP Relationship Surveillance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1 tracking-tight">
            Entity Surveillance &amp; Cross-State Footprint Intelligence
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-3xl leading-relaxed">
            Examines procurement concentrations, multi-state agency footprints, and single-contractor dominance patterns to uncover collusive bidding structures.
          </p>
        </div>

        {/* Input field */}
        <div className="relative">
          <Search className="w-5 h-5 text-[var(--text-muted)] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedStateFilter(null);
            }}
            placeholder="Search by Implementing Agency / Authority (e.g. District Collectorate, Zilla Parishad) or MP Name / Constituency..."
            className="w-full pl-11 pr-10 py-2.5 text-sm border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-inner bg-[var(--input-bg)] hover:bg-[var(--surface)] transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStateFilter(null);
              }}
              className="absolute right-3.5 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-xs cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Entity Profiles */}
        <div className="flex items-center space-x-2 flex-wrap gap-1.5 text-xs text-[var(--text-secondary)] pt-1">
          <span className="font-mono text-[10px] uppercase font-bold text-[var(--text-muted)]">QUICK ENTITY PROFILES:</span>
          <button
            onClick={() => {
              setSearchTerm('District Collectorate, Kannur');
              setSelectedStateFilter(null);
            }}
            className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
              searchTerm.includes('Kannur')
                ? 'bg-blue-700 text-white font-bold shadow-xs'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Collectorate Kannur</span>
          </button>
          <button
            onClick={() => {
              setSearchTerm('District Authority, Hooghly');
              setSelectedStateFilter(null);
            }}
            className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
              searchTerm.includes('Hooghly')
                ? 'bg-indigo-700 text-white font-bold shadow-xs'
                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>District Authority Hooghly</span>
          </button>
          <button
            onClick={() => {
              setSearchTerm('Anurag Singh Thakur');
              setSelectedStateFilter(null);
            }}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              searchTerm.includes('Anurag')
                ? 'bg-slate-800 dark:bg-slate-700 text-white font-bold shadow-xs'
                : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>MP: Anurag Singh Thakur</span>
          </button>
          <button
            onClick={() => {
              setSearchTerm('Shri Kumbakudi Sudhakaran');
              setSelectedStateFilter(null);
            }}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              searchTerm.includes('Sudhakaran')
                ? 'bg-slate-800 dark:bg-slate-700 text-white font-bold shadow-xs'
                : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <User className="w-3.5 h-3.5 text-slate-500 dark:text-[#748094]" />
            <span>MP: K. Sudhakaran</span>
          </button>
        </div>
      </div>

      {/* Network Anomaly Warning Alert Box & Concentration Metrics */}
      {matchedData.contractorMeta && concentrationMetrics && (
        <div className="space-y-4">
          {matchedData.contractorMeta.states.size >= 3 ? (
            <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-600 p-5 rounded-r-lg shadow-sm border border-red-200/80 dark:border-red-900/40">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg mt-0.5 flex-shrink-0 border border-red-200 dark:border-red-800/60">
                  <ShieldAlert className="w-6 h-6 text-red-700 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-red-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      NETWORK RISK: HIGH
                    </span>
                    <span className="text-xs font-mono text-red-800 dark:text-red-300 font-semibold bg-red-100/70 dark:bg-red-900/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-800/60">
                      RULE REF: CROSS-STATE CARTEL INDICATOR #NET-402
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-red-950 dark:text-red-200 mt-1">
                    Multi-State Cartelization Alert: {matchedData.contractorMeta.name}
                  </h3>
                  <p className="text-xs text-red-900 dark:text-red-300/90 mt-1 leading-relaxed">
                    <strong>Audit Rationale:</strong> <em>Repeated contractor presence across <span className="font-bold underline">{matchedData.contractorMeta.states.size} different states</span> with concentrated project awards and recurring single-bid nominations.</em> Under standard decentralized MPLADS guidelines, works must be executed by local district agencies. Recurring interstate presence represents an elevated systemic audit concern requiring relationship verification.
                  </p>
                  
                  {/* Footprint Badges */}
                  <div className="mt-3 flex items-center space-x-2 flex-wrap gap-1.5 pt-2 border-t border-red-200/60 dark:border-red-900/50">
                    <span className="text-xs text-red-800 dark:text-red-300 font-bold uppercase text-[10px]">Territory Footprint:</span>
                    {Array.from(matchedData.contractorMeta.states).map(st => (
                      <button
                        key={st}
                        onClick={() => setSelectedStateFilter(selectedStateFilter === st ? null : st)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all border cursor-pointer ${
                          selectedStateFilter === st
                            ? 'bg-red-700 text-white border-red-800 font-bold shadow-xs ring-2 ring-red-300 dark:ring-red-900'
                            : 'bg-[var(--surface)] border-red-300 dark:border-red-800/60 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40'
                        }`}
                      >
                        📍 {st} ({concentrationMetrics.stateCounts[st] || 0} works)
                      </button>
                    ))}
                    {selectedStateFilter && (
                      <button
                        onClick={() => setSelectedStateFilter(null)}
                        className="text-xs text-red-700 dark:text-red-400 font-bold underline ml-2 hover:text-red-900 dark:hover:text-red-300 cursor-pointer"
                      >
                        Clear State Filter ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-600 p-5 rounded-r-lg border border-blue-200/80 dark:border-blue-900/40">
              <div className="flex items-center space-x-3">
                <Building2 className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200">
                    Contractor Profile: {matchedData.contractorMeta.name}
                  </h3>
                  <p className="text-xs text-blue-800 dark:text-blue-300/90 mt-0.5">
                    Operates in {matchedData.contractorMeta.states.size} state(s) across {matchedData.contractorMeta.works.length} local projects.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CONTRACTOR CONCENTRATION METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[var(--surface)] p-3.5 rounded-lg border border-[var(--border)] shadow-2xs border-t-3 border-t-slate-700 dark:border-t-slate-400">
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Works Awarded</p>
              <p className="text-xl font-bold font-mono text-[var(--text-primary)] mt-0.5">{matchedData.contractorMeta.works.length}</p>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">Total contracts</span>
            </div>

            <div className="bg-[var(--surface)] p-3.5 rounded-lg border border-[var(--border)] shadow-2xs border-t-3 border-t-blue-600">
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">States Touched</p>
              <p className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-0.5">{matchedData.contractorMeta.states.size}</p>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">Distinct territories</span>
            </div>

            <div className="bg-[var(--surface)] p-3.5 rounded-lg border border-[var(--border)] shadow-2xs border-t-3 border-t-indigo-600">
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Total Funds</p>
              <p className="text-xl font-bold font-mono text-[var(--text-primary)] mt-0.5">{formatRupees(matchedData.contractorMeta.totalAmount)}</p>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">Sanctioned volume</span>
            </div>

            <div className="bg-[var(--surface)] p-3.5 rounded-lg border border-red-200 dark:border-red-900/40 shadow-2xs border-t-3 border-t-red-600 bg-gradient-to-br from-[var(--surface)] to-red-50/30 dark:from-[var(--surface)] dark:to-red-950/20">
              <p className="text-[10px] text-red-700 dark:text-red-400 uppercase font-bold tracking-wider">High-Risk Works</p>
              <p className="text-xl font-bold font-mono text-red-600 dark:text-red-400 mt-0.5">{matchedData.contractorMeta.highRiskCount}</p>
              <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold mt-0.5 block">Flagged for inspection</span>
            </div>

            <div className="bg-[var(--surface)] p-3.5 rounded-lg border border-[var(--border)] shadow-2xs border-t-3 border-t-slate-700 dark:border-t-slate-400">
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Avg Project Value</p>
              <p className="text-xl font-bold font-mono text-[var(--text-primary)] mt-0.5">{formatRupees(concentrationMetrics.avgVal)}</p>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">Per sanction</span>
            </div>

            <div className="bg-[var(--surface)] p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/40 shadow-2xs border-t-3 border-t-amber-500 bg-gradient-to-br from-[var(--surface)] to-amber-50/30 dark:from-[var(--surface)] dark:to-amber-950/20">
              <p className="text-[10px] text-amber-800 dark:text-amber-400 uppercase font-bold tracking-wider">State Concentration</p>
              <p className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5">{concentrationMetrics.topStateConcentration}%</p>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">In primary state</span>
            </div>
          </div>

          {/* VISUAL CONTRACTOR NETWORK TREE */}
          <div className="bg-[var(--surface)] p-5 rounded-lg border border-[var(--border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GitFork className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Network Relationship Tree: Contractor → States → Projects
                </h4>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                Click any state node to filter records below
              </span>
            </div>

            {/* Tree Root */}
            <div className="flex flex-col items-center">
              <div className="p-3.5 bg-[#0A192F] dark:bg-[#070D18] text-white rounded-lg text-center shadow-md border border-slate-700 dark:border-[#263244] max-w-md w-full">
                <span className="text-[10px] uppercase font-mono text-blue-300 dark:text-blue-400 block font-bold tracking-wider">
                  CONTRACTOR ROOT NODE
                </span>
                <span className="font-bold text-sm text-amber-300 dark:text-amber-400 block mt-0.5">{matchedData.contractorMeta.name}</span>
                <div className="text-[11px] text-slate-300 dark:text-[#A8B2C1] mt-1 font-mono">
                  {matchedData.contractorMeta.works.length} Works • {matchedData.contractorMeta.states.size} States • {formatRupees(matchedData.contractorMeta.totalAmount)}
                </div>
              </div>

              {/* Connecting Tree Lines */}
              <div className="w-0.5 h-6 bg-slate-300 dark:bg-[#263244]"></div>

              {/* State Branches Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
                {Array.from(matchedData.contractorMeta.states).map(st => {
                  const worksInState = matchedData.contractorMeta!.works.filter(w => w.state === st);
                  const isSelected = selectedStateFilter === st;

                  return (
                    <div 
                      key={st}
                      onClick={() => setSelectedStateFilter(isSelected ? null : st)}
                      className={`p-3 rounded-lg border cursor-pointer text-left transition-all ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 ring-2 ring-blue-400 dark:ring-blue-800 shadow-xs'
                          : 'bg-[var(--surface-raised)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-primary)] truncate" title={st}>
                          {st}
                        </span>
                        <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-1.5 py-0.2 rounded font-bold">
                          {worksInState.length} w
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-1">
                        High Risk: <strong className="text-red-600 dark:text-red-400">{worksInState.filter(w => w.risk_score > 0.30).length}</strong>
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5 truncate">
                        {formatRupees(worksInState.reduce((s, w) => s + w.sanctioned_amount, 0))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Table of All Associated Works */}
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-[var(--surface-raised)] border-b border-[var(--border)] flex flex-wrap justify-between items-center text-xs gap-2">
          <div className="font-bold text-[var(--text-primary)] flex items-center space-x-2">
            <span>Matching Associated Works</span>
            <span className="text-[var(--text-muted)] font-mono text-[11px]">
              ({matchedData.works.length} records found)
            </span>
            {selectedStateFilter && (
              <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-mono font-bold text-[11px] flex items-center space-x-1">
                <span>State: {selectedStateFilter}</span>
                <button onClick={() => setSelectedStateFilter(null)} className="ml-1 hover:text-red-700 dark:hover:text-red-400 cursor-pointer">✕</button>
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            SCOPE: ALL-INDIA AUDIT ARCHIVE
          </span>
        </div>

        {matchedData.works.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)] text-xs">
            <Building2 className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
            <p className="font-bold text-[var(--text-primary)]">No projects found for "{searchTerm}"</p>
            <p className="mt-1">Try clicking one of the suggestion chips above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-xs">
              <thead className="bg-[var(--surface-raised)] text-[#344054] dark:text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 text-left">Work ID</th>
                  <th className="px-4 py-3 text-left">Risk Score</th>
                  <th className="px-4 py-3 text-left">State</th>
                  <th className="px-4 py-3 text-left">MP &amp; Constituency</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Sanctioned ₹</th>
                  <th className="px-4 py-3 text-left">Tender Type</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
                {matchedData.works.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((work) => {
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
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)] whitespace-nowrap">
                        {work.state}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="font-semibold text-[var(--text-primary)] truncate" title={work.mp_name_constituency}>
                          {work.mp_name_constituency}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[180px] truncate text-[var(--text-secondary)] font-medium" title={work.category}>
                        {work.category}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[var(--text-primary)] whitespace-nowrap">
                        {formatRupees(work.sanctioned_amount)}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[150px] truncate" title={work.tender_type}>
                        <span className="bg-[var(--surface-raised)] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--text-secondary)] font-mono text-[11px]">
                          {work.tender_type}
                        </span>
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

        {matchedData.works.length > pageSize && (
          <div className="px-4 py-3 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-2 bg-[var(--surface-elevated)]">
            <div className="text-xs text-[var(--text-secondary)]">
              Showing <span className="font-semibold text-[var(--text-primary)]">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-semibold text-[var(--text-primary)]">{Math.min(currentPage * pageSize, matchedData.works.length)}</span> of <span className="font-semibold text-[var(--text-primary)]">{matchedData.works.length}</span> records
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
                Page {currentPage} of {Math.ceil(matchedData.works.length / pageSize)}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(matchedData.works.length / pageSize), p + 1))}
                disabled={currentPage >= Math.ceil(matchedData.works.length / pageSize)}
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
