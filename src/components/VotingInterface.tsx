import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, CheckCircle2, ChevronLeft, AlertTriangle, Shield, Lock, Fingerprint, AlertCircle, RefreshCw, Copy, Check, Share2, MessageSquare } from 'lucide-react';
import { Election } from '../types';

interface VotingInterfaceProps {
  election: Election;
  onVote: (candidateId: string, studentIdConf: string, voterReceipt: string, tracking: any) => void;
  onBack: () => void;
  isSubmitting: boolean;
  currentUserStudentId?: string;
  currentUserInstitutionId?: string;
}

export default function VotingInterface({ 
  election, 
  onVote, 
  onBack, 
  isSubmitting, 
  currentUserStudentId,
  currentUserInstitutionId
}: VotingInterfaceProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hoveredCandidateId, setHoveredCandidateId] = useState<string | null>(null);
  const [activeCampaignCandidate, setActiveCampaignCandidate] = useState<any | null>(null);
  const [copiedShareText, setCopiedShareText] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  
  // Interactive Fraud Prevention states
  const [studentIdInput, setStudentIdInput] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaNums, setCaptchaNums] = useState({ a: 5, b: 3 });
  const [errorMsg, setErrorMsg] = useState('');
  
  // Simulated Cryptographic Tunnel states
  const [securityTunnelState, setSecurityTunnelState] = useState<'idle' | 'ssl' | 'hash' | 'submit'>('idle');
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [receiptCode, setReceiptCode] = useState('');

  // Generate captcha on mount and modal open
  const generateCaptcha = () => {
    setCaptchaNums({
      a: Math.floor(Math.random() * 9) + 2,
      b: Math.floor(Math.random() * 9) + 2
    });
    setCaptchaInput('');
    setErrorMsg('');
  };

  useEffect(() => {
    generateCaptcha();
    // Create random anonymous receipt code
    const randPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    setReceiptCode(`ZKP-EL-${election.id.slice(0, 4).toUpperCase()}-${randPart}`);
  }, [election.id]);

  const handleOpenConfirm = () => {
    generateCaptcha();
    setStudentIdInput('');
    setSecurityTunnelState('idle');
    setShowConfirm(true);
  };

  const handleCastSecureVote = async () => {
    setErrorMsg('');
    
    // 1. Verify Student ID confirmation
    if (currentUserStudentId && currentUserStudentId !== 'N/A' && currentUserStudentId !== 'default') {
      if (studentIdInput.trim() !== currentUserStudentId) {
        setErrorMsg('The Student ID entered does not match your registered profile ID. Authentication failed.');
        return;
      }
    } else if (!studentIdInput.trim()) {
      setErrorMsg('Please enter your Student ID to sign this digital ballot.');
      return;
    }

    // 2. Verify Bot Challenge (CAPTCHA)
    const expected = captchaNums.a + captchaNums.b;
    if (parseInt(captchaInput) !== expected) {
      setErrorMsg('Bot verification challenge failed. Please calculate the sum again.');
      return;
    }

    // 3. Trigger Secure Simulated Tunnel steps to display premium encryption flow
    setSecurityTunnelState('ssl');
    await new Promise(r => setTimeout(r, 900));
    
    setSecurityTunnelState('hash');
    await new Promise(r => setTimeout(r, 950));
    
    setSecurityTunnelState('submit');
    
    // Gather details for admin dashboard browser list
    const tracking = {
      userAgent: window.navigator.userAgent,
      browserName: getBrowserSimple()
    };

    onVote(
      selectedCandidate!, 
      studentIdInput.trim(), 
      receiptCode, 
      tracking
    );
  };

  const getBrowserSimple = () => {
    const ua = window.navigator.userAgent;
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Web App Engine";
  };

  const copyReceipt = () => {
    navigator.clipboard.writeText(receiptCode);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-bold transition-colors group"
        >
          <div className="p-2 bg-white rounded-xl border border-slate-200 group-hover:border-indigo-200 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </div>
          Back to Dashboard
        </button>
        
        <div className="flex bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-2xl items-center gap-2 text-xs font-black uppercase tracking-wider">
          <Shield className="w-4 h-4" />
          MFA Protected voting instance
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">{election.title}</h2>
          <span className="px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-black text-indigo-600 uppercase">
            Ballot Verified
          </span>
        </div>
        <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
          {election.description}
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {election.candidates.map((candidate) => (
            <motion.div
              key={candidate.id}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedCandidate(candidate.id)}
              onMouseEnter={() => setHoveredCandidateId(candidate.id)}
              onMouseLeave={() => setHoveredCandidateId(null)}
              className={`relative cursor-pointer rounded-[2rem] border-2 p-6 transition-all duration-300 ${
                selectedCandidate === candidate.id 
                  ? 'border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-100' 
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-md mb-4 overflow-hidden">
                  {candidate.photoUrl ? (
                    <img src={candidate.photoUrl} alt={candidate.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-300 text-slate-500">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3">{candidate.name}</h3>
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 w-full group-hover:bg-white transition-colors">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Manifesto</span>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-4 whitespace-pre-wrap">
                    {candidate.bio || "No biography provided."}
                  </p>
                </div>

                {/* Campaign Showcase and Institutional Restriction Logic */}
                <div className="w-full mt-3">
                  {currentUserInstitutionId && election.institutionId && currentUserInstitutionId !== election.institutionId ? (
                    <div className="py-2 bg-red-50 border border-red-250 text-red-700 text-[10px] font-extrabold rounded-xl text-center uppercase tracking-wider flex items-center justify-center gap-1" title="Only viewable by members of this candidate's institution">
                      🔒 Institution Locked ({election.institutionId})
                    </div>
                  ) : (
                    (() => {
                      const hasCampaign = !!(candidate.campaignText || candidate.campaignPicUrl || candidate.campaignAudioUrl || candidate.campaignVideoUrl);
                      if (!hasCampaign) {
                        return (
                          <div className="py-2 text-[10px] font-black uppercase text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100/80 text-center tracking-widest select-none">
                            No campaign materials
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCampaignCandidate(candidate);
                          }}
                          className="w-full py-2 bg-indigo-50 hover:bg-slate-300 dark:hover:bg-slate-800 text-indigo-700 dark:text-emerald-400 text-xs font-black rounded-xl transition-all border border-indigo-200/40 dark:border-emerald-500/20 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                          data-talkback={`View ${candidate.name} multimedia campaign.`}
                        >
                          📣 View Campaign Hub
                        </button>
                      );
                    })()
                  )}
                </div>
              </div>

              {selectedCandidate === candidate.id && (
                <div className="absolute top-4 right-4 text-indigo-600">
                  <CheckCircle2 className="w-6 h-6 fill-indigo-600 text-white" />
                </div>
              )}

              {/* Hover detail tooltip */}
              {hoveredCandidateId === candidate.id && (
                <div className="absolute z-30 bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-80 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-2xl text-left pointer-events-none animate-fade-in transition-all">
                  <div className="flex items-center gap-4 mb-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                      {candidate.photoUrl ? (
                        <img src={candidate.photoUrl} alt={candidate.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm leading-tight text-ellipsis overflow-hidden whitespace-nowrap max-w-[180px]">{candidate.name}</h4>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">Campaign Manifesto Profile</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 font-medium leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {candidate.bio || "No biography details registered."}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-slate-900"></div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <AnimatePresence>
          {selectedCandidate && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full"
            >
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 flex gap-4">
                <div className="shrink-0 p-2 bg-amber-100 text-amber-700 rounded-xl max-h-fit">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900">Fraud Prevention Notice</h4>
                  <p className="text-sm text-amber-800/80 font-medium mt-1">
                    Your ballot signature combines your Student ID validation and a bot barrier. Under encryption, your identity is detached from your candidate selection, producing an anonymous <b>Hash Receipt Code</b> automatically auditable in the system ledger.
                  </p>
                </div>
              </div>

              <button 
                onClick={handleOpenConfirm}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] text-xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Lock className="w-5 h-5" /> Cast Identity-Secured Vote
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Security Verification & Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-8 max-w-lg w-full shadow-2xl border border-slate-100 my-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Ballot Integrity Security</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Multi-Factor Authenticator Challenge</p>
                </div>
              </div>

              {securityTunnelState === 'idle' ? (
                <div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 font-medium text-slate-600 text-sm">
                    You are certifying a final vote in this election for <span className="font-bold text-slate-800">{election.candidates.find(c => c.id === selectedCandidate)?.name}</span>. This is an irreversible ballot action.
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Security Factor 1: Student ID confirmation */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        Verify Student ID
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text"
                          value={studentIdInput}
                          onChange={(e) => setStudentIdInput(e.target.value)}
                          placeholder={currentUserStudentId ? "Verify your registered ID code" : "Enter Student ID"}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5 font-bold">
                        {currentUserStudentId ? "Must match your profile student code (Security Assertion)" : "Verifies your institutional status"}
                      </p>
                    </div>

                    {/* Security Factor 2: Bot CAPTCHA Challenge */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Anti-Bot Velocity Challenge
                        </label>
                        <button 
                          onClick={generateCaptcha}
                          className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                          title="Refresh Code"
                          type="button"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-3 items-center">
                        <div className="px-5 py-2.5 bg-indigo-50 text-indigo-700 font-mono text-lg font-black tracking-widest border border-indigo-100 rounded-xl select-none">
                          {captchaNums.a} + {captchaNums.b} = ?
                        </div>
                        <input
                          type="number"
                          value={captchaInput}
                          onChange={(e) => setCaptchaInput(e.target.value)}
                          placeholder="Sum"
                          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg font-bold text-slate-700"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5 font-bold">
                        Calculates to block coordinate injections and macro voting bots.
                      </p>
                    </div>

                    {/* Receipt Token Preview (Privacy assurance) */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                      <div>
                        <span className="block text-[9px] uppercase font-black text-slate-400">Ledger Audit Receipt:</span>
                        <span className="text-xs font-mono font-bold text-slate-600">{receiptCode}</span>
                      </div>
                      <Fingerprint className="w-5 h-5 text-slate-300" />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2 mb-6">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 py-3.5 border-2 border-slate-200 text-slate-700 bg-slate-50 rounded-2xl font-bold hover:bg-slate-100 transition-colors shadow-sm"
                      disabled={isSubmitting}
                    >
                      Hold Ballot
                    </button>
                    <button 
                      onClick={handleCastSecureVote}
                      disabled={isSubmitting}
                      className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                      Validate & Cast
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                      <Lock className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>

                  <h4 className="text-xl font-black text-slate-800 mb-2">
                    {securityTunnelState === 'ssl' && 'Securing Connection...'}
                    {securityTunnelState === 'hash' && 'Anonymizing Vote Signature...'}
                    {securityTunnelState === 'submit' && 'Registering Verified Audit Trace...'}
                  </h4>
                  
                  <div className="text-sm font-semibold text-slate-500 max-w-sm">
                    {securityTunnelState === 'ssl' && 'Configuring SSL/TLS secure channel to prevent payload eavesdropping.'}
                    {securityTunnelState === 'hash' && 'Encrypting identification keys. detached ballot receipt ID mapping.'}
                    {securityTunnelState === 'submit' && 'Adding verification blocks to the immutable voter ledger.'}
                  </div>

                  <div className="mt-6 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest animate-pulse">
                      Status Key Encrypted
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 select-all">
                      SHA256://{receiptCode.split('-').join('')}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Campaign Multimedia Showcase Hub Modal */}
      <AnimatePresence>
        {activeCampaignCandidate && (() => {
          const now = new Date();
          const campaignStart = election.campaignStartDate ? new Date(election.campaignStartDate) : null;
          const campaignEnd = election.campaignEndDate ? new Date(election.campaignEndDate) : null;
          const isPeriodStarted = !campaignStart || now >= campaignStart;
          const isPeriodEnded = campaignEnd && now > campaignEnd;
          const isCampaignActive = isPeriodStarted && !isPeriodEnded;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-[2.5rem] p-7 md:p-9 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto relative text-left"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-slate-150 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-indigo-50 border-2 border-indigo-400 overflow-hidden shrink-0">
                      {activeCampaignCandidate.photoUrl ? (
                        <img 
                          src={activeCampaignCandidate.photoUrl} 
                          alt={activeCampaignCandidate.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-950 dark:text-white">{activeCampaignCandidate.name}</h3>
                      <p className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-widest mt-0.5">📣 Official Campaign Hub</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveCampaignCandidate(null)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full font-bold text-slate-400 hover:text-slate-600 dark:hover:text-amber-400 transition-colors"
                    title="Close Showcase"
                    data-talkback="Close Campaign Showcase panel."
                  >
                    ✕
                  </button>
                </div>

                {/* Campaign Period Check logic */}
                {!isCampaignActive ? (
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-200 text-center space-y-3">
                    <div className="p-3 bg-white w-fit rounded-full mx-auto shadow-sm text-amber-500">
                      <AlertTriangle className="w-7 h-7 mx-auto" />
                    </div>
                    <h3 className="font-black text-sm text-amber-850 uppercase tracking-widest">Campaign Period Inactive</h3>
                    <p className="text-xs font-semibold leading-relaxed max-w-md mx-auto text-amber-800">
                      The candidate's multimedia campaign materials are locked outside of the authorized campaign duration set by managers.
                    </p>
                    <div className="max-w-xs mx-auto py-2.5 px-4 bg-white/70 border border-amber-100 rounded-2xl text-[10px] font-bold text-amber-900 flex flex-col gap-1 items-stretch">
                      <span className="flex items-center justify-between gap-4">⏳ START: <span>{campaignStart ? campaignStart.toLocaleString() : 'Immediate'}</span></span>
                      <span className="flex items-center justify-between gap-4">⏳ END: <span>{campaignEnd ? campaignEnd.toLocaleString() : 'Continuous'}</span></span>
                    </div>
                    <button 
                      onClick={() => setActiveCampaignCandidate(null)}
                      className="mt-2 px-5 py-2 bg-amber-600 text-white font-extrabold text-xs rounded-xl"
                    >
                      Dismiss Portal
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Manifesto Bio Section copy */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Candidate Manifesto Summary</span>
                      <p className="text-xs text-slate-650 dark:text-slate-300 font-medium leading-relaxed leading-snug whitespace-pre-wrap">
                        {activeCampaignCandidate.bio || 'The candidate has not prepared a general biography statement.'}
                      </p>
                    </div>

                    {/* Extended Tagline Text */}
                    {activeCampaignCandidate.campaignText && (
                      <div className="p-4 bg-indigo-50/70 border-l-4 border-indigo-400 text-sm font-serif italic text-indigo-950 rounded-r-2xl">
                        "{activeCampaignCandidate.campaignText}"
                      </div>
                    )}

                    {/* Poster Picture */}
                    {activeCampaignCandidate.campaignPicUrl && (
                      <div>
                        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">🖼️ Campaign Poster & Graphics</span>
                        <div className="border border-slate-150 rounded-3xl overflow-hidden aspect-video bg-slate-100 relative shadow-sm">
                          <img 
                            src={activeCampaignCandidate.campaignPicUrl} 
                            alt="Campaign Poster" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&auto=format&fit=crop&q=80';
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Audio track play */}
                    {activeCampaignCandidate.campaignAudioUrl && (
                      <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <span className="block text-[10px] font-black text-indigo-700 dark:text-emerald-400 uppercase tracking-widest mb-2.5">🔊 Play Campaign Audio Track</span>
                        <audio 
                          controls 
                          src={activeCampaignCandidate.campaignAudioUrl} 
                          className="w-full outline-none" 
                        />
                      </div>
                    )}

                    {/* Campaign core video presentation */}
                    {activeCampaignCandidate.campaignVideoUrl && (
                      <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <span className="block text-[10px] font-black text-indigo-700 dark:text-emerald-400 uppercase tracking-widest mb-2.5">🎥 Watch Campaign Presentation Video</span>
                        {activeCampaignCandidate.campaignVideoUrl.includes('youtube') || activeCampaignCandidate.campaignVideoUrl.includes('youtu.be') ? (
                          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                            <iframe 
                              src={activeCampaignCandidate.campaignVideoUrl.replace('watch?v=', 'embed/').split('&')[0]} 
                              title="Campaign Presentation Video" 
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <video 
                            controls 
                            src={activeCampaignCandidate.campaignVideoUrl} 
                            className="w-full aspect-video rounded-2xl border border-slate-200 dark:border-slate-800" 
                          />
                        )}
                      </div>
                    )}

                    {/* Premium Campaign Social Share Gateway */}
                    <div className="bg-gradient-to-br from-indigo-50/50 via-indigo-50/20 to-slate-50 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 rounded-3xl p-5 border border-indigo-150/60 dark:border-indigo-500/20 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                          <Share2 className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="block text-[10px] font-black text-indigo-750 dark:text-emerald-400 uppercase tracking-widest leading-3">📢 Share Campaign Hub</span>
                          <span className="block text-[9px] font-bold text-slate-400 mt-0.5">Spread the candidate's message on social platforms & group chats</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Copy details to clipboard */}
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/?electionId=${election.id}&candidateId=${activeCampaignCandidate.id}`;
                            const snippet = `Support ${activeCampaignCandidate.name} for candidate in "${election.title}"!\n\nManifesto: ${activeCampaignCandidate.bio || 'Check out my campaign strategy and manifesto.'}\n\nView Campaign Hub: ${url}`;
                            navigator.clipboard.writeText(snippet);
                            setCopiedShareText(true);
                            setTimeout(() => setCopiedShareText(false), 2000);
                          }}
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                            copiedShareText
                              ? 'bg-emerald-600 dark:bg-emerald-700 text-white shadow-md'
                              : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm'
                          }`}
                        >
                          {copiedShareText ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-250 animate-bounce" />
                              Copied Campaign Details
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-indigo-600 dark:text-emerald-400" />
                              Copy Manifesto Card
                            </>
                          )}
                        </button>

                        {/* Copy raw deep-link url only */}
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/?electionId=${election.id}&candidateId=${activeCampaignCandidate.id}`;
                            navigator.clipboard.writeText(url);
                            setCopiedShareLink(true);
                            setTimeout(() => setCopiedShareLink(false), 2000);
                          }}
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                            copiedShareLink
                              ? 'bg-emerald-600 dark:bg-emerald-700 text-white shadow-md'
                              : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm'
                          }`}
                        >
                          {copiedShareLink ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-250" />
                              Copied Direct Link
                            </>
                          ) : (
                            <>
                              <Share2 className="w-4 h-4 text-indigo-600 dark:text-emerald-400" />
                              Copy Direct Link
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1 justify-center md:justify-start">
                        {/* Twitter / X */}
                        <a
                          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                            `Support ${activeCampaignCandidate.name} in the upcoming "${election.title}" election! Check out the manifesto and direct campaign graphics at: ${window.location.origin}/?electionId=${election.id}&candidateId=${activeCampaignCandidate.id}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-[#1DA1F2] hover:bg-[#1991db] text-white font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all active:scale-[0.98]"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          Post on X
                        </a>

                        {/* WhatsApp */}
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                            `Support ${activeCampaignCandidate.name} for "${election.title}"!\n\nManifesto:\n${activeCampaignCandidate.bio || 'Check out my official campaign.'}\n\nExplore candidate portfolio directly: ${window.location.origin}/?electionId=${election.id}&candidateId=${activeCampaignCandidate.id}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all active:scale-[0.98]"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          WhatsApp It
                        </a>

                        {/* Facebook */}
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                            `${window.location.origin}/?electionId=${election.id}&candidateId=${activeCampaignCandidate.id}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all active:scale-[0.98]"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Facebook Share
                        </a>
                      </div>

                      {/* Explicit Live Deep Link Field for User Selection */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-3 text-left">
                        <div className="overflow-hidden min-w-0 flex-1">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">📋 Generated Official Link</span>
                          <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate select-all select-none">
                            {`${window.location.origin}/?electionId=${election.id}&candidateId=${activeCampaignCandidate.id}`}
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold text-indigo-650 bg-indigo-50/80 px-2 py-1 rounded-md shrink-0 select-none">
                          Active Link
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button 
                        type="button"
                        onClick={() => setActiveCampaignCandidate(null)}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer"
                      >
                        Got It, Done
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
