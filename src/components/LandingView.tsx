import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Quote, Scale, BookOpen, CheckCircle, AlertTriangle, 
  HelpCircle, ArrowRight, Check, Sparkles, UserCheck, Lock, Fingerprint 
} from 'lucide-react';
import { useI18n } from '../utils/i18n';

interface LandingViewProps {
  onEnterDashboard: () => void;
  userDisplayName?: string;
  institutionId?: string;
  isGuest?: boolean;
}

const INTEGRITY_QUOTES = [
  {
    text: "Real integrity is doing the right thing, knowing that nobody's going to know whether you did it or not.",
    author: "Oprah Winfrey",
    theme: "Personal Integrity"
  },
  {
    text: "Always vote for principle, though you may vote alone, and you may cherish the sweetest reflection that your vote is never lost.",
    author: "John Quincy Adams",
    theme: "Uncompromising Values"
  },
  {
    text: "The supreme quality for leadership is unquestionably integrity. Without it, no real success is possible.",
    author: "Dwight D. Eisenhower",
    theme: "Qualities of Leadership"
  },
  {
    text: "Integrity is choosing your thoughts and actions based on values rather than personal gain.",
    author: "Anonymous",
    theme: "Decision Making"
  },
  {
    text: "Bad officials are elected by good citizens who do not vote. Choose wisely, choose with conscience.",
    author: "George Jean Nathan",
    theme: "Democratic Duty"
  },
  {
    text: "The ballot is stronger than the bullet. It is the silent power that shapes the collective future of our institution.",
    author: "Abraham Lincoln",
    theme: "Collective Future"
  }
];

const REGULATIONS = [
  {
    id: "reg-1",
    title: "Sole Ballot Authority",
    description: "You are permitted to cast exactly one ballot per election. Proxy voting or sharing login credentials violates institutional code.",
    severity: "critical"
  },
  {
    id: "reg-2",
    title: "Absolute Ballot Confidentiality",
    description: "Your choices are cryptographically scrubbed and stored anonymously. You must never coerce, threaten, or pay others to reveal or influence their selection.",
    severity: "critical"
  },
  {
    id: "reg-3",
    title: "No Interference or False Claims",
    description: "Voters must not propagate fake manifestos or malicious hearsay regarding candidates inside the institutional system during the voting trials.",
    severity: "warning"
  },
  {
    id: "reg-4",
    title: "Technical Auditing Consent",
    description: "As a registered voter, you consent to standard integrity security telemetry (browser fingerprint, platform timestamp checks) to secure public ballot trust.",
    severity: "info"
  }
];

export default function LandingView({ onEnterDashboard, userDisplayName, institutionId, isGuest }: LandingViewProps) {
  const { t } = useI18n();
  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState(0);
  const [acknowledgedRules, setAcknowledgedRules] = useState<Record<string, boolean>>({});
  const [showQuoteTip, setShowQuoteTip] = useState(true);

  // Auto-switch quotes every 6 seconds with automatic timer reset on manual click
  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedQuoteIndex(prev => (prev + 1) % INTEGRITY_QUOTES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [selectedQuoteIndex]);

  const toggleRule = (id: string) => {
    setAcknowledgedRules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const allRulesAcknowledged = REGULATIONS.every(reg => acknowledgedRules[reg.id]);

  const nextQuote = () => {
    setSelectedQuoteIndex(prev => (prev + 1) % INTEGRITY_QUOTES.length);
  };

  const prevQuote = () => {
    setSelectedQuoteIndex(prev => (prev - 1 + INTEGRITY_QUOTES.length) % INTEGRITY_QUOTES.length);
  };

  return (
    <div className="relative p-6 md:p-8 animate-fade-in">
      {/* 🗳️ Ambient Background Voters Image - Spans entire page */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <img 
          src="/src/assets/images/voters_background_1779264283932.png" 
          alt="Modern Voters Background" 
          className="w-full h-full object-cover filter saturate-[0.8] brightness-[0.95]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/10 via-slate-100/60 to-slate-100" />
      </div>

      <div className="relative z-10 space-y-12 py-4 text-left max-w-5xl mx-auto">
        
        {/* 🌟 Welcome Hero Shield Banner */}
        <div className="bg-gradient-to-br from-indigo-900/95 via-indigo-950/98 to-slate-950/98 rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-indigo-800/40 relative overflow-hidden backdrop-blur-sm">
          {/* Blend image into the hero card */}
          <div className="absolute inset-0 z-0 opacity-[0.18] pointer-events-none mix-blend-overlay">
            <img 
              src="/src/assets/images/voters_background_1779264283932.png" 
              alt="Voters Overlay" 
              className="w-full h-full object-cover filter brightness-75 contrast-125 saturate-100"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-200 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 shadow-inner">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Official Voter Guide
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
              Inspiration & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-emerald-200">{t('regulationsTitle')}</span>
            </h2>
            <p className="text-slate-300 font-medium text-sm md:text-base max-w-2xl leading-relaxed">
              {t('welcomeUser', { name: userDisplayName || 'Voter' })} {t('institutionCheckpoint', { institution: institutionId || 'your institution' })}
            </p>
          </div>

          <div className="flex gap-4 self-stretch md:self-auto shrink-0 bg-white/5 backdrop-blur-md p-5 rounded-3xl border border-white/10 flex-col sm:flex-row md:flex-col justify-center">
            <div className="text-center px-4 py-1">
              <span className="block text-[9px] uppercase font-black tracking-widest text-indigo-300">Auditor Status</span>
              {isGuest ? (
                <span className="text-sm font-black text-amber-400 flex items-center justify-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Guest Viewer
                </span>
              ) : (
                <span className="text-sm font-black text-emerald-400 flex items-center justify-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Verified
                </span>
              )}
            </div>
            <div className="text-center px-4 py-1 border-t md:border-t md:border-l-0 sm:border-t-0 sm:border-l border-white/10 mt-2 md:mt-2 sm:mt-0 pt-2 md:pt-2 sm:pt-0 sm:pl-4 md:pl-0">
              <span className="block text-[9px] uppercase font-black tracking-widest text-indigo-300">Identity Guard</span>
              <span className="text-xs font-black text-slate-300 block mt-1">
                {isGuest ? 'Read-only Access' : 'ZKP Encrypted'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 🗽 LEFT COLUMN: Inspirational Quotes of Integrity (Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Quote className="w-4 h-4 text-indigo-600" />
              Integrity & Purpose
            </h3>
            <span className="text-[10px] bg-slate-150 text-slate-500 font-bold px-2 py-0.5 rounded-lg border border-slate-200">
              Insight {selectedQuoteIndex + 1}/{INTEGRITY_QUOTES.length}
            </span>
          </div>

          {/* Majestic Quote Terminal Card */}
          <div className="neu-flat-dark text-white rounded-[3.5rem] p-8 md:p-10 flex flex-col justify-between min-h-[390px] relative overflow-hidden">
            {/* Design accents */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl" />

            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 bg-indigo-950/70 border border-indigo-900/60 px-3 py-1.5 rounded-xl">
                  {INTEGRITY_QUOTES[selectedQuoteIndex].theme}
                </span>
                <Quote className="w-10 h-10 text-indigo-500/40 shrink-0" />
              </div>

              <div className="min-h-[140px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={selectedQuoteIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-lg md:text-xl font-black leading-relaxed tracking-tight text-slate-100 font-display"
                  >
                    "{INTEGRITY_QUOTES[selectedQuoteIndex].text}"
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 flex justify-between items-center relative z-10">
              <div>
                <span className="block text-[9px] uppercase font-black text-indigo-400 tracking-wider mb-0.5">Author / Voice</span>
                <span className="font-display font-black text-base text-white">{INTEGRITY_QUOTES[selectedQuoteIndex].author}</span>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={prevQuote}
                  className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-850 active:bg-slate-950 transition-all flex items-center justify-center font-black text-slate-300 border border-slate-800 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05)]"
                  aria-label="Previous quote"
                >
                  &larr;
                </button>
                <button 
                  onClick={nextQuote}
                  className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-850 active:bg-slate-950 transition-all flex items-center justify-center font-black text-slate-300 border border-slate-800 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05)]"
                  aria-label="Next quote"
                >
                  &rarr;
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100 shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] flex gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-900 leading-relaxed font-bold">
              <b>Did you know?</b> Institutional elections are highly critical test trials of community representation. Voting with integrity ensures resources and schedules serve real collective needs.
            </p>
          </div>
        </div>

        {/* 📜 RIGHT COLUMN: Regulations & Verification Checklist (Span 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              voter code of conduct & regulations
            </h3>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
              Check off rules to acknowledge
            </span>
          </div>

          <div className="neu-flat rounded-[3rem] p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <h4 className="text-xl font-display font-black text-slate-800 tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Voter Code of Ethics
              </h4>
              <p className="text-xs text-slate-500 font-bold leading-normal">
                Please carefully read and check off each foundational regulation below. You must understand and acknowledge all four clauses to unlock ballot access.
              </p>
            </div>

            {/* Checklist items */}
            <div className="space-y-4">
              {REGULATIONS.map((reg) => {
                const isChecked = acknowledgedRules[reg.id] || false;
                
                return (
                  <div 
                    key={reg.id} 
                    onClick={() => toggleRule(reg.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all flex items-start gap-4 ${
                      isChecked 
                        ? 'bg-emerald-500/10 border-2 border-emerald-500 shadow-[inset_2px_2px_5px_rgba(16,185,129,0.1)]' 
                        : 'bg-slate-100 border-2 border-slate-200/40 shadow-[4px_4px_8px_#cbd5e1,-4px_-4px_8px_#ffffff]'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors border ${
                        isChecked 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'bg-white border-slate-300 text-transparent shadow-inner'
                      }`}>
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-display font-black text-slate-800 text-sm">{reg.title}</h5>
                        {reg.severity === 'critical' && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                            Strict Enforce
                          </span>
                        )}
                        {reg.severity === 'warning' && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            Conduct Rule
                          </span>
                        )}
                        {reg.severity === 'info' && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            Audit Scope
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-bold">
                        {reg.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Verification & proceed action container */}
            <div className="pt-6 border-t border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 self-stretch md:self-auto text-left">
                <div className={`p-2.5 rounded-xl border ${allRulesAcknowledged ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-150 border-slate-250 text-slate-400'}`}>
                  {allRulesAcknowledged ? <UserCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-black text-slate-400">Lock Status</span>
                  <span className={`text-xs font-black block ${allRulesAcknowledged ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {allRulesAcknowledged 
                      ? 'Integrity Verified' 
                      : `${t('regulationsTitle')} (${Object.values(acknowledgedRules).filter(Boolean).length}/4)`
                    }
                  </span>
                </div>
              </div>

              <button 
                onClick={onEnterDashboard}
                disabled={!allRulesAcknowledged}
                className={`w-full md:w-auto px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 text-sm transition-all text-center shrink-0 ${
                  allRulesAcknowledged 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.02] active:scale-95 shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff]' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-inner'
                }`}
              >
                {t('enterDashboard')} <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>

  </div>
  );
}
