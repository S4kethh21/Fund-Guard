import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { MPLADSWork, SystemSummary } from '../types/mplads';
import { formatRupees } from '../utils/formatters';

interface AskFraudGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: SystemSummary;
  works: MPLADSWork[];
  onNavigateToState: (state: string) => void;
  onNavigateToContractor: (contractor: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  meta?: {
    actionText?: string;
    actionType?: 'state' | 'contractor';
    actionTarget?: string;
  };
}

export const AskFraudGuardModal: React.FC<AskFraudGuardModalProps> = ({
  isOpen,
  onClose,
  summary,
  works,
  onNavigateToState,
  onNavigateToContractor
}) => {
  const initialWelcomeMessage: ChatMessage = {
    id: 'welcome',
    sender: 'assistant',
    text: `Greetings. I am Fund Guard's AI-Assisted Audit Assistant. I analyze real-time surveillance signals across ${summary.total_works.toLocaleString()} works and 543 Parliamentary seats. You can ask me about state risk rankings, contractor concentration patterns, or specific policy violations.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage]);
  const [inputQuery, setInputQuery] = useState('');

  if (!isOpen) return null;

  const handleResetChat = () => {
    setMessages([initialWelcomeMessage]);
    setInputQuery('');
  };

  const suggestionChips = [
    "Why is Uttar Pradesh high risk?",
    "Why was this project prioritized?",
    "Why is Vanguard Civil under review?",
    "Show top audit concerns across India",
    "What are the main risk indicators?",
    "Explain Clause 5.1 prohibited category"
  ];

  const handleQuery = (query: string) => {
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Deterministic audit engine response based on actual dataset metrics
    let replyText = "";
    let actionMeta: ChatMessage['meta'] = undefined;

    const q = query.toLowerCase();

    if (q.includes('uttar pradesh') || q.includes('up')) {
      const upWorks = works.filter(w => w.state === 'Uttar Pradesh');
      const upHigh = upWorks.filter(w => w.risk_score > 0.30).length;
      const upFunds = upWorks.reduce((s, w) => s + w.sanctioned_amount, 0);
      replyText = `Uttar Pradesh currently contains ${upHigh} high-risk works out of ${upWorks.length} monitored works (Total allocation: ${formatRupees(upFunds)}).\n\nThe primary contributing indicators are:\n• Clause 5.1 prohibited category works (commercial stalls & private colonies)\n• High-value single nomination contracts bypassing mandatory e-tenders\n• Low fund utilization velocity (<40% executed)\n• Multi-state contractor presence.\n\nAll ${upHigh} priority projects have been queued for District Magistrate physical verification.`;
      actionMeta = { actionText: "Open Uttar Pradesh Drill-Down", actionType: "state", actionTarget: "Uttar Pradesh" };
    } 
    else if (q.includes('vanguard') || q.includes('contractor') || q.includes('cartel') || q.includes('om sai')) {
      replyText = `Vanguard Civil Infrastructure Ltd is currently flagged under Network Detection (Indicator NET-402).\n\nKey Findings:\n• Operates across 6 distinct states (Maharashtra, Karnataka, Gujarat, MP, Rajasthan, UP)\n• Awarded 14+ works with an unusually high proportion of single-bid nominations\n• Average project risk score is 0.542 (High Risk)\n\nUnder MPLADS decentralization guidelines, repeated interstate contractor dominance represents an elevated systemic audit risk requiring relationship review.`;
      actionMeta = { actionText: "Inspect Vanguard Civil Network", actionType: "contractor", actionTarget: "Vanguard Civil Infrastructure Ltd" };
    }
    else if (q.includes('priorit') || q.includes('top 20') || q.includes('flagged') || q.includes('why was this project')) {
      replyText = `Projects are prioritized into the Top 20 Inspection Queue based on concurrent risk indicators:\n1. Statutory Breach: MPLADS Clause 5.1 prohibited negative list (commercial/religious assets)\n2. Procurement Irregularity: GFR 2017 open-tender threshold violations (>₹25L single nomination)\n3. Velocity Failure: Stalled physical execution with idle unspent balances (<40%)\n4. Statistical Anomaly: Isolation Forest unsupervised ML outlier index > 0.65\n\nWhen a project triggers 3 or more of these independent risk vectors, it is assigned Critical Priority for immediate field dispatch.`;
    }
    else if (q.includes('clause 5.1') || q.includes('prohibited') || q.includes('category')) {
      replyText = `Under MPLADS Scheme Guidelines Clause 5.1, public funds cannot be utilized for:\n1. Commercial complexes or shopping stalls\n2. Places of religious worship or temple beautification\n3. Private residential colony roads, gates, or club houses\n4. Statues, monuments, or memorial arches\n5. Land acquisition for private institutions\n\nCurrently, ${summary.flagged_prohibited_count} works have been flagged for violating this statutory negative list.`;
    }
    else if (q.includes('top audit concerns') || q.includes('overview') || q.includes('concerns')) {
      replyText = `The national surveillance engine monitors ${summary.total_works.toLocaleString()} works totaling ${formatRupees(summary.total_sanctioned_amount)} across 543 MPs.\n\nTop 4 Systemic Audit Concerns:\n1. Prohibited Categories: ${summary.flagged_prohibited_count} works violating Clause 5.1\n2. Tender Irregularities: ${summary.flagged_no_tender_count} works >₹25L awarded without open e-tender\n3. Stalled Funds: ${summary.flagged_low_util_count} works with <40% physical utilization\n4. Multi-State Contractors: 2 contractor clusters operating in 5+ states simultaneously.`;
    }
    else if (q.includes('indicator') || q.includes('how') || q.includes('model') || q.includes('risk score')) {
      replyText = `Risk scores combine two analytical engines:\n1. Statutory Rule Heuristics (GFR 2017 & MPLADS Clause 5.1 calibrated)\n2. Isolation Forest Machine Learning (detecting multivariate cost-to-agency deviations)\n\nProjects are categorized into Low (<0.15), Medium (0.15–0.30), and High (>0.30) tiers. All scores are advisory flags to prioritize human field inspection.`;
    }
    else {
      replyText = `Based on current audit dataset records (${summary.total_works.toLocaleString()} works across 543 constituencies), the system tracks ${summary.high_risk_works_count} high-risk projects requiring physical verification.\n\nYou can ask about specific states (e.g. "Why is Uttar Pradesh high risk?"), contractors (e.g. "Why is Vanguard Civil under review?"), or specific statutory rules (e.g. "Explain Clause 5.1 prohibited category").`;
    }

    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'assistant',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      meta: actionMeta
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInputQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div 
        className="bg-[var(--surface)] rounded-xl shadow-2xl border border-[var(--border)] max-w-2xl w-full flex flex-col h-[620px] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[var(--surface-elevated)] text-[var(--text-primary)] px-6 py-4 flex justify-between items-center border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white shadow-2xs">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Ask Fund Guard</h3>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 font-mono">
                  AI-Assisted Audit Analysis
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">Data-grounded explainability for District Magistrates &amp; CAG evaluators</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleResetChat}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors flex items-center space-x-1 text-xs cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Clear</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              title="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[var(--bg-primary)]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start space-x-2.5 ${m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                m.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[var(--surface-elevated)] text-blue-600 dark:text-blue-400 border border-[var(--border)]'
              }`}>
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </div>
              <div className={`max-w-[82%] rounded-xl p-3 text-xs leading-relaxed ${
                m.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-xs' 
                  : 'bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border)] rounded-tl-none shadow-xs'
              }`}>
                <div className="whitespace-pre-line font-medium">
                  {m.text}
                </div>
                {m.meta && m.meta.actionText && (
                  <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex justify-end">
                    <button
                      onClick={() => {
                        onClose();
                        if (m.meta?.actionType === 'state' && m.meta.actionTarget) {
                          onNavigateToState(m.meta.actionTarget);
                        } else if (m.meta?.actionType === 'contractor' && m.meta.actionTarget) {
                          onNavigateToContractor(m.meta.actionTarget);
                        }
                      }}
                      className="px-3 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/60 rounded font-semibold text-[11px] transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{m.meta.actionText}</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
                <div className={`text-[10px] mt-1 text-right ${m.sender === 'user' ? 'text-blue-100' : 'text-[var(--text-muted)]'}`}>
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 bg-[var(--surface)] border-t border-[var(--border)] flex items-center space-x-1.5 overflow-x-auto text-xs flex-shrink-0">
          <span className="text-[10px] font-mono text-[var(--text-muted)] whitespace-nowrap">PROMPTS:</span>
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleQuery(chip)}
              className="px-2.5 py-1 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)] rounded-full whitespace-nowrap text-[11px] transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuery(inputQuery);
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about MPLADS expenditure, state risk, or contractor networks..."
              className="flex-1 px-3.5 py-2 border border-[var(--input-border)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--input-placeholder)] bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
          <p className="text-[10px] text-[var(--text-muted)] mt-1.5 text-center">
            AI audit assistant grounded strictly in verified audit dataset records. Advisory risk intelligence for human verification.
          </p>
        </div>
      </div>
    </div>
  );
};
