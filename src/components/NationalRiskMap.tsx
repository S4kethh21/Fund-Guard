import React, { useState, useMemo, useRef } from 'react';
import { MPLADSWork } from '../types/mplads';
import { formatRupees } from '../utils/formatters';
import { INDIA_MAP_FEATURES } from '../data/indiaMapData';
import { Plus, Minus, Crosshair, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NationalRiskMapProps {
  works: MPLADSWork[];
  onSelectState: (state: string) => void;
  selectedState?: string;
}

interface StateRiskData {
  state: string;
  totalWorks: number;
  highRiskWorks: number;
  sanctionedAmount: number;
  flaggedRate: number;
  tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  color: string;
}

export const NationalRiskMap: React.FC<NationalRiskMapProps> = ({
  works,
  onSelectState,
  selectedState: externalSelectedState
}) => {
  const [internalSelectedState, setInternalSelectedState] = useState<string>('Uttar Pradesh');
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  const activeStateName = hoveredState || externalSelectedState || internalSelectedState;

  // 1. Calculate state-level risk metrics directly from existing application works
  const stateDataMap = useMemo(() => {
    const map: Record<string, { total: number; high: number; amount: number }> = {};
    
    works.forEach(w => {
      const st = w.state;
      if (!map[st]) {
        map[st] = { total: 0, high: 0, amount: 0 };
      }
      map[st].total += 1;
      map[st].amount += w.sanctioned_amount;
      if (w.risk_score > 0.30) {
        map[st].high += 1;
      }
    });

    const lookup: Record<string, StateRiskData> = {};

    Object.keys(map).forEach(st => {
      const { total, high, amount } = map[st];
      const flaggedRate = total > 0 ? (high / total) * 100 : 0;
      
      let tier: StateRiskData['tier'] = 'LOW';
      let color = '#10B981'; // Green for LOW

      if (high >= 25 || flaggedRate >= 14.0) {
        tier = 'CRITICAL';
        color = '#DC2626'; // Red
      } else if (high >= 12 || flaggedRate >= 10.0) {
        tier = 'HIGH';
        color = '#EA580C'; // Orange-Red
      } else if (high >= 4 || flaggedRate >= 7.0) {
        tier = 'MEDIUM';
        color = '#F59E0B'; // Amber
      } else {
        tier = 'LOW';
        color = '#10B981'; // Emerald Green
      }

      lookup[st] = {
        state: st,
        totalWorks: total,
        highRiskWorks: high,
        sanctionedAmount: amount,
        flaggedRate,
        tier,
        color
      };
    });

    return lookup;
  }, [works]);

  // Active state data for the inspection card / tooltip
  const activeStats = stateDataMap[activeStateName] || {
    state: activeStateName,
    totalWorks: 0,
    highRiskWorks: 0,
    sanctionedAmount: 0,
    flaggedRate: 0,
    tier: 'LOW',
    color: '#10B981'
  };

  const handleStateClick = (stateName: string) => {
    setInternalSelectedState(stateName);
    onSelectState(stateName);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 1.0));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  // Find the hovered/selected feature to render an elevated overlay path
  const activeFeature = useMemo(() => {
    return INDIA_MAP_FEATURES.find(f => f.state === activeStateName);
  }, [activeStateName]);

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 flex flex-col justify-between relative shadow-xs transition-colors duration-180">
      {/* SECTION 10: MAP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--border-subtle)] gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              National State Risk Heatmap
            </h4>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            State-level concentration of flagged works and audit risk indicators.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-center">
          <span className="text-[10px] font-mono bg-[var(--surface-raised)] text-[var(--text-secondary)] px-2 py-0.5 rounded border border-[var(--border)] font-bold">
            36 STATES &amp; UTs
          </span>
        </div>
      </div>

      {/* SECTION 9: MAP LEGEND (Placed cleanly above the map canvas) */}
      <div className="pt-2 pb-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] text-[11px]">
        <div className="flex items-center space-x-1.5 text-[var(--text-secondary)] font-medium">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
            RISK LEVEL:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[var(--text-secondary)]">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-2xs"></span>
            <span>LOW (&lt;8%)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-2xs"></span>
            <span>MEDIUM (8–12%)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] shadow-2xs"></span>
            <span>HIGH (12–16%)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] shadow-2xs"></span>
            <span>CRITICAL (&gt;16%)</span>
          </span>
        </div>
      </div>

      {/* SVG GEOGRAPHIC INDIA MAP CONTAINER */}
      <div 
        ref={mapContainerRef}
        className="relative w-full h-[440px] sm:h-[480px] flex items-center justify-center overflow-hidden py-2 bg-gradient-to-b from-[var(--bg-primary)] to-[var(--surface)] rounded-lg border border-[var(--border)] my-2 transition-colors duration-180"
      >
        {/* Geographic Projection SVG */}
        <svg 
          viewBox="0 0 600 680" 
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-h-[460px] select-none transition-transform duration-300 ease-out"
          style={{ 
            transform: `scale(${zoomLevel})`,
            transformOrigin: '50% 50%'
          }}
        >
          {/* Subtle Background Watermark / Graticule Lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDark ? '#1E293B' : '#E2E8F0'} strokeWidth="0.5" strokeOpacity="0.5" />
            </pattern>
            <filter id="hoverGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity={isDark ? "0.6" : "0.28"} floodColor={isDark ? "#000000" : "#0F172A"} />
            </filter>
            <filter id="selectGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity={isDark ? "0.7" : "0.35"} floodColor="#1D68F2" />
            </filter>
          </defs>
          <rect width="600" height="680" fill="url(#grid)" opacity="0.6" />

          {/* Base Layer: All 37 Geographic State/UT Polygons */}
          <g className="transition-opacity duration-300">
            {INDIA_MAP_FEATURES.map((feature) => {
              const stateData = stateDataMap[feature.state];
              const fillColor = stateData ? stateData.color : (isDark ? '#263244' : '#CBD5E1');
              const isSelected = activeStateName === feature.state;

              return (
                <path
                  key={feature.id}
                  d={feature.path}
                  fill={fillColor}
                  stroke={isDark ? '#080D16' : '#FFFFFF'}
                  strokeWidth={isDark ? "0.95" : "0.85"}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="cursor-pointer transition-colors duration-150"
                  style={{
                    opacity: hoveredState && hoveredState !== feature.state ? 0.85 : 1
                  }}
                  onClick={() => handleStateClick(feature.state)}
                  onMouseEnter={() => setHoveredState(feature.state)}
                  onMouseLeave={() => setHoveredState(null)}
                >
                  <title>{`${feature.state} — ${stateData?.highRiskWorks || 0} High-Risk Works (${stateData?.flaggedRate.toFixed(1) || 0}%)`}</title>
                </path>
              );
            })}
          </g>

          {/* Overlay Layer: Render Active/Hovered State on Top for Crisp Highlight Stroke */}
          {activeFeature && (
            <path
              d={activeFeature.path}
              fill={stateDataMap[activeFeature.state]?.color || '#DC2626'}
              stroke={isDark ? '#FFFFFF' : '#0F172A'}
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              filter="url(#hoverGlow)"
              className="pointer-events-none transition-all duration-150"
            />
          )}
        </svg>

        {/* SECTION 6: FLOATING STATE AUDIT INSPECTION CARD */}
        {activeStats && (
          <div 
            className="absolute top-3 right-3 bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] rounded-xl p-3.5 shadow-lg text-xs w-56 z-10 transition-all duration-200 pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5 mb-2">
              <h5 className="font-extrabold text-[var(--text-primary)] tracking-tight text-xs uppercase truncate max-w-[130px]" title={activeStats.state}>
                {activeStats.state}
              </h5>
              <span 
                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase"
                style={{
                  backgroundColor: `${activeStats.color}20`,
                  color: activeStats.color,
                  border: `1px solid ${activeStats.color}40`
                }}
              >
                {activeStats.tier}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-[var(--text-secondary)]">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] font-medium">Total Works</span>
                <span className="font-bold text-[var(--text-primary)] font-mono">{activeStats.totalWorks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] font-medium">High-Risk Works</span>
                <span className="font-extrabold text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-950/40 px-1 rounded border border-red-100 dark:border-red-900/50">
                  {activeStats.highRiskWorks}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] font-medium">Flagged Rate</span>
                <span className="font-bold text-[var(--text-primary)] font-mono">{activeStats.flaggedRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] font-medium">Sanctioned Value</span>
                <span className="font-bold text-[var(--text-primary)] font-mono">
                  {activeStats.sanctionedAmount > 0 ? formatRupees(activeStats.sanctionedAmount) : '₹0'}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleStateClick(activeStats.state)}
              className="mt-2.5 w-full py-1.5 px-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-[#1D68F2] dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 rounded-md text-[10px] font-bold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
            >
              <span>Launch State Drill-Down</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* SECTION 11: PROFESSIONAL MAP CONTROLS ([ + ] [ − ] [ ⌖ ]) */}
        <div className="absolute bottom-3 left-3 flex flex-col space-y-1.5 z-10">
          <button
            onClick={handleZoomIn}
            className="w-7 h-7 bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] rounded-md text-xs font-bold flex items-center justify-center shadow-xs transition-colors cursor-pointer active:scale-95"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-7 h-7 bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] rounded-md text-xs font-bold flex items-center justify-center shadow-xs transition-colors cursor-pointer active:scale-95"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="w-7 h-7 bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] rounded-md text-xs font-bold flex items-center justify-center shadow-xs transition-colors cursor-pointer active:scale-95"
            title="Reset View (Center)"
            aria-label="Reset View"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Selected State Mini Tag on Bottom Right */}
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--surface)]/90 backdrop-blur-xs px-2 py-0.5 rounded border border-[var(--border)] pointer-events-none">
          Active: <span className="font-bold text-[var(--text-primary)]">{activeStateName}</span>
        </div>
      </div>
    </div>
  );
};
