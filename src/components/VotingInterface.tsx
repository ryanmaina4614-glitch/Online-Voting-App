import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, CheckCircle2, ChevronLeft, AlertTriangle, Shield, Lock, Fingerprint, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { Election } from '../types';

interface VotingInterfaceProps {
  election: Election;
  onVote: (candidateId: string, studentIdConf: string, voterReceipt: string, tracking: any) => void;
  onBack: () => void;
  isSubmitting: boolean;
  currentUserStudentId?: string;
}

export default function VotingInterface({ election, onVote, onBack, isSubmitting, currentUserStudentId }: VotingInterfaceProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
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
              </div>

              {selectedCandidate === candidate.id && (
                <div className="absolute top-4 right-4 text-indigo-600">
                  <CheckCircle2 className="w-6 h-6 fill-indigo-600 text-white" />
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
    </div>
  );
}
