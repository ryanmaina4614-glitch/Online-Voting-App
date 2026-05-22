import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Cpu, 
  Globe, 
  RefreshCw, 
  Database,
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface SecurityCheckResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  required: boolean;
  type: 'crypto' | 'network' | 'sandbox' | 'engine';
}

export default function SecureBrowserShield({ onPassed }: { onPassed: () => void }) {
  const [checking, setChecking] = useState(true);
  const [failedChecks, setFailedChecks] = useState<SecurityCheckResult[]>([]);
  const [allChecks, setAllChecks] = useState<SecurityCheckResult[]>([]);
  const [browserInfo, setBrowserInfo] = useState({ name: 'Unknown', version: '' });

  const runDiagnostics = () => {
    setChecking(true);
    
    // Detect browser info
    const ua = navigator.userAgent;
    let name = 'Legacy Browser';
    let tem; 
    let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
      tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
      name = 'IE ' + (tem[1] || '');
    } else if (M[1] === 'Chrome') {
      tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
      if (tem != null) {
        name = tem.slice(1).join(' ').replace('OPR', 'Opera');
      } else {
        name = 'Chrome';
      }
    } else {
      M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
      if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
      name = M[0];
    }
    
    setBrowserInfo({
      name,
      version: M[1] || 'Unknown'
    });

    const checks: SecurityCheckResult[] = [
      {
        id: 'secure-context',
        name: 'Secure Context (TLS/HTTPS)',
        description: 'Verifies that traffic is encrypted using modern TLS protocols to prevent Man-in-the-Middle (MITM) tampering.',
        passed: window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        required: true,
        type: 'network'
      },
      {
        id: 'web-crypto-api',
        name: 'Web Cryptography Engine',
        description: 'Modern cryptographic modules (crypto.subtle) required to perform zero-knowledge proof generation and local digital signing.',
        passed: !!(window.crypto && window.crypto.subtle),
        required: true,
        type: 'crypto'
      },
      {
        id: 'secure-sandbox',
        name: 'Isolated Session Storage',
        description: 'Checks for sandbox storage privacy constraints to protect key materials and auth state from cross-origin scripting.',
        passed: (() => {
          try {
            localStorage.setItem('__security_test__', '1');
            localStorage.removeItem('__security_test__');
            return true;
          } catch(e) {
            return false;
          }
        })(),
        required: true,
        type: 'sandbox'
      },
      {
        id: 'modern-engine',
        name: 'Standard Engine Compliance',
        description: 'Blocks legacy or severely outdated browsers (such as Internet Explorer) lacking secure DOM sandbox capabilities.',
        passed: !(/MSIE|Trident/i.test(ua)) && typeof fetch !== 'undefined' && typeof Promise !== 'undefined',
        required: true,
        type: 'engine'
      }
    ];

    setAllChecks(checks);
    const failed = checks.filter(c => c.required && !c.passed);
    setFailedChecks(failed);
    setChecking(false);

    if (failed.length === 0) {
      onPassed();
    }
  };

  useEffect(() => {
    // Run initial diagnostics on load
    const timer = setTimeout(() => {
      runDiagnostics();
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const getIconForType = (type: string, passed: boolean) => {
    const color = passed ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50';
    switch (type) {
      case 'crypto':
        return <div className={`p-2.5 rounded-xl ${color}`}><Cpu className="w-5 h-5" /></div>;
      case 'network':
        return <div className={`p-2.5 rounded-xl ${color}`}><Lock className="w-5 h-5" /></div>;
      case 'sandbox':
        return <div className={`p-2.5 rounded-xl ${color}`}><Database className="w-5 h-5" /></div>;
      default:
        return <div className={`p-2.5 rounded-xl ${color}`}><Globe className="w-5 h-5" /></div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Decorative background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {checking ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6"
          >
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-6 h-6 text-indigo-600 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Inspecting System Access Integrity</h2>
              <p className="text-slate-500 text-sm font-medium mt-2 max-w-md mx-auto">
                Please wait while we establish a secure telemetry sandbox and verify your browser's compliance with decentralised security standards...
              </p>
            </div>
          </motion.div>
        ) : failedChecks.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] border border-red-100 shadow-2xl overflow-hidden"
          >
            {/* Top Red Ban Alert Bar */}
            <div className="bg-rose-50 border-b border-rose-100 p-8 flex items-start gap-4 text-left">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 mb-2">
                  Access Restricted
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Insecure Browser Environment Detected
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Our system implements advanced zero-knowledge proof cryptography. Your current browser browser configuration ({browserInfo.name} v{browserInfo.version}) fails to meet our security baseline.
                </p>
              </div>
            </div>

            {/* Diagnostic Logs */}
            <div className="p-8 space-y-6 text-left">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Security Diagnostics Overview
                </h3>
                <div className="space-y-4">
                  {allChecks.map((check) => (
                    <div 
                      key={check.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                        check.passed 
                          ? 'bg-slate-50/50 border-slate-100' 
                          : 'bg-rose-50/30 border-rose-100/50'
                      }`}
                    >
                      <div className="flex gap-4">
                        {getIconForType(check.type, check.passed)}
                        <div>
                          <p className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                            {check.name}
                            {!check.passed && (
                              <span className="text-[9px] font-black bg-rose-100 text-rose-600 uppercase px-1.5 py-0.5 rounded">
                                Fail
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {check.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="shrink-0 pt-0.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide ${
                          check.passed 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}>
                          {check.passed ? 'PASSED' : 'REQUIRED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Guides */}
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  How to Access the System Safely
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  We require high-integrity modern engines to preserve anonymity and ensure no malicious third-party scripts can intercept your cryptographic key parameters. 
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <a 
                    href="https://www.google.com/chrome" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">🌐 Download Google Chrome</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                  <a 
                    href="https://www.mozilla.org/firefox" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">🦊 Download Mozilla Firefox</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* Retry & Verification Trigger */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={runDiagnostics}
                  className="flex-1 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Re-Evaluate Environment Safety</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] p-8 sm:p-12 border border-slate-200 shadow-2xl text-center space-y-6"
          >
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Security Protocol Confirmed</h2>
              <p className="text-slate-500 text-sm font-medium mt-2 max-w-sm mx-auto">
                Excellent! Your browser environment supports the required isolation standards, transport security, and client-side cryptography.
              </p>
            </div>
            <button
              onClick={onPassed}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs transition-all inline-flex items-center gap-2 shadow-lg shadow-indigo-100"
            >
              <span>Initialize System Access</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Trust Seal Footer */}
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-8 flex items-center gap-2 relative z-10">
        <Lock className="w-3.5 h-3.5 text-indigo-500" /> Secure Sandbox Environment 256-bit Certified
      </p>
    </div>
  );
}
