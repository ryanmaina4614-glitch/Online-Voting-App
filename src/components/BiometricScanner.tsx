import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, Check, X, ShieldAlert, Key, User, Info, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { BiometricProfile, retrieveObfuscatedPassword, enrollBiometrics } from '../utils/biometrics';
import { logBiometricActivity } from '../services/firebase';

interface BiometricScannerProps {
  mode: 'enroll' | 'login';
  enrolledProfiles?: BiometricProfile[];
  onSuccess: (profile?: BiometricProfile, password?: string) => void;
  onCancel: () => void;
  enrollEmail?: string;
  enrollPassword?: string;
  enrollDisplayName?: string;
}

const FINGERS = [
  { id: 'Right Index', name: 'Right Index Finger', icon: '👆' },
  { id: 'Right Thumb', name: 'Right Thumb', icon: '👍' },
  { id: 'Left Index', name: 'Left Index Finger', icon: '👆' },
  { id: 'Left Thumb', name: 'Left Thumb', icon: '👍' }
];

export default function BiometricScanner({
  mode,
  enrolledProfiles = [],
  onSuccess,
  onCancel,
  enrollEmail = '',
  enrollPassword = '',
  enrollDisplayName = ''
}: BiometricScannerProps) {
  // Find profile by email to verify account lock
  const targetEmail = enrollEmail.toLowerCase().trim();
  const linkedProfile = enrolledProfiles.find(p => p.email.toLowerCase().trim() === targetEmail);

  const [selectedFinger, setSelectedFinger] = useState<string>('Right Index');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [progress, setProgress] = useState(0);

  // Initialize or enforce locked profile if we have one
  useEffect(() => {
    if (mode === 'login' && !linkedProfile && targetEmail) {
      setScanState('error');
      setErrorMessage(`No biometric credentials registered on this device matching: ${targetEmail}`);
    }
  }, [mode, linkedProfile, targetEmail]);

  // Synthesize beautiful tech sound feedback using Web Audio API
  const playTechSound = (type: 'beep' | 'success' | 'error' | 'scan') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'beep') {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // high pure synth note
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'scan') {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130.81, ctx.currentTime); // C3 low
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('Audio synthesis failed or blocked', e);
    }
  };

  useEffect(() => {
    let timer: any;
    if (scanState === 'scanning') {
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            const isMatch = mode === 'enroll' || (linkedProfile && linkedProfile.fingerprintType === selectedFinger);
            
            if (isMatch) {
              playTechSound('success');
              setScanState('success');
            } else {
              playTechSound('error');
              setScanState('error');
              const registeredLabel = linkedProfile?.fingerprintType || 'Enrolled finger';
              setErrorMessage(`Access Denied: Fingerprint mismatch! The placed print is NOT associated with this account (registered: ${registeredLabel}, scanned: ${selectedFinger}).`);
              
              logBiometricActivity({
                email: targetEmail || 'unknown@votesecure.com',
                displayName: linkedProfile?.displayName || 'Unknown User',
                status: 'failed',
                errorMessage: `Placed ${selectedFinger} mismatch against registered ${registeredLabel}`
              });
            }
            return 100;
          }
          if (prev % 15 === 0) {
            playTechSound('scan');
          }
          return prev + 5;
        });
      }, 100);
    } else if (scanState !== 'scanning') {
      setProgress(0);
    }
    return () => clearInterval(timer);
  }, [scanState, mode, selectedFinger, linkedProfile, targetEmail]);

  useEffect(() => {
    if (scanState === 'success') {
      const finishTimer = setTimeout(() => {
        if (mode === 'enroll') {
          // Store physical fingerprint pattern
          enrollBiometrics(targetEmail, enrollPassword, enrollDisplayName, selectedFinger);

          // Log successful enrollment with finger metadata
          logBiometricActivity({
            email: targetEmail || 'enroll-unknown@votesecure.com',
            displayName: enrollDisplayName || 'New Enrollee',
            status: 'success',
            errorMessage: `Successfully enrolled biometric profile utilizing ${selectedFinger}`
          });
          onSuccess(undefined, enrollPassword);
        } else if (mode === 'login' && linkedProfile) {
          const pass = retrieveObfuscatedPassword(linkedProfile);
          if (pass) {
            logBiometricActivity({
              email: linkedProfile.email,
              displayName: linkedProfile.displayName,
              status: 'success',
              errorMessage: `Logged in using verified ${selectedFinger}`
            });
            onSuccess(linkedProfile, pass);
          } else {
            logBiometricActivity({
              email: linkedProfile.email,
              displayName: linkedProfile.displayName,
              status: 'failed',
              errorMessage: 'Biometric credentials corrupt'
            });
            setScanState('error');
            setErrorMessage('Biometric credentials are corrupt or expired');
            playTechSound('error');
          }
        }
      }, 1200);
      return () => clearTimeout(finishTimer);
    }
  }, [scanState, mode, linkedProfile, onSuccess, selectedFinger, targetEmail, enrollDisplayName, enrollPassword]);

  const triggerScan = () => {
    if (mode === 'login' && !linkedProfile) {
      setScanState('error');
      setErrorMessage(targetEmail ? `No biometric profiles enrolled match: ${targetEmail}` : 'Please enter your email on the login field first.');
      playTechSound('error');
      return;
    }
    setScanState('scanning');
    setErrorMessage('');
    playTechSound('beep');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="max-w-md w-full bg-slate-100 rounded-[3rem] border border-white shadow-2xl p-8 md:p-10 flex flex-col items-center relative overflow-hidden"
      >
        {/* Floating Controls */}
        <div className="absolute top-6 right-6 flex gap-2">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 bg-slate-200/50 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 rounded-full transition-all border border-slate-300/20"
            title={soundEnabled ? "Mute audio" : "Enable sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            className="p-2.5 bg-slate-200/50 hover:bg-slate-200 text-slate-500 hover:text-red-500 rounded-full transition-all border border-slate-300/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Mode Header */}
        <div className="text-center mb-6">
          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-3 py-1 border border-indigo-100/40 rounded-full inline-block mb-2">
            🔐 Biometric Verification (TouchID)
          </span>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            {mode === 'enroll' ? 'Enroll Your Fingerprint' : 'Biometric Identity Lock'}
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-1 max-w-sm">
            {mode === 'enroll' 
              ? 'Select which finger to enroll, then hold the sensor mock.' 
              : 'Sign in utilizing only the fingerprint linked to this profile.'
            }
          </p>
        </div>

        {/* User context information */}
        {targetEmail && (
          <div className="mb-6 p-4 bg-white border border-slate-200 rounded-2xl w-full text-center shadow-xs">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">
              Account Target
            </span>
            <span className="text-sm font-black text-slate-800 flex items-center justify-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              {mode === 'enroll' ? (enrollDisplayName || 'New User') : (linkedProfile?.displayName || 'Voter Profile')}
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block font-bold">{targetEmail}</span>
            
            {mode === 'login' && linkedProfile && (
              <span className="inline-flex mt-2.5 items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg border border-emerald-100 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Linked pattern: {linkedProfile.fingerprintType}
              </span>
            )}
          </div>
        )}

        {/* Physical Finger Selection Selector Grid */}
        {scanState === 'idle' && (
          <div className="w-full bg-slate-200/40 border border-slate-300/25 p-4 rounded-3xl mb-6 text-left">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block ml-1 mb-2.5">
              {mode === 'enroll' ? 'Choose Fingerprint Pattern to Enroll' : 'Select Finger to Place on Reader'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FINGERS.map((f) => {
                const isSelected = selectedFinger === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setSelectedFinger(f.id);
                      playTechSound('beep');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-black transition-all border text-left flex items-center gap-2 ${
                      isSelected 
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-100' 
                        : 'bg-white text-slate-700 border-slate-200/60 hover:bg-slate-50'
                    }`}
                  >
                    <span>{f.icon}</span>
                    <span className="truncate">{f.id}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Fingerprint Scanner Stage */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
          <AnimatePresence>
            {scanState === 'scanning' && (
              <motion.div
                initial={{ scale: 0.82, opacity: 0 }}
                animate={{ 
                  scale: [0.95, 1.25, 0.95],
                  opacity: [0.25, 0.5, 0.25]
                }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="absolute inset-2 border-4 border-indigo-500/30 rounded-full"
              />
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={triggerScan}
            disabled={scanState === 'scanning' || scanState === 'success'}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center relative border shadow-xl transition-all stroke-current overflow-hidden cursor-pointer group active:scale-95 ${
              scanState === 'scanning' 
                ? 'bg-slate-50 border-indigo-400 shadow-indigo-100' 
                : scanState === 'success'
                ? 'bg-emerald-50 border-emerald-400 shadow-emerald-100'
                : scanState === 'error'
                ? 'bg-rose-50 border-rose-400 shadow-rose-100'
                : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-350 active:shadow-inner'
            }`}
          >
            {/* Horizontal scan line visual */}
            {scanState === 'scanning' && (
              <motion.div 
                animate={{ y: ['-50%', '160%', '-50%'] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-xs z-10 shadow-lg"
              />
            )}

            {scanState === 'success' ? (
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-250">
                  <Check className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mt-1.5 block">Approved</span>
              </motion.div>
            ) : scanState === 'error' ? (
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-250">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-black text-rose-600 uppercase tracking-wider mt-1.5 block">Failed</span>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center text-center gap-1">
                <Fingerprint className={`w-12 h-12 transition-all ${
                  scanState === 'scanning' ? 'text-indigo-600 scale-105 animate-pulse' : 'text-slate-400 group-hover:text-indigo-500'
                }`} />
                <span className="text-[9px] font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest block mt-2">
                  {scanState === 'scanning' ? `${progress}% SCAN` : 'Touch & Hold'}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Scan Feedback Narrative Feed */}
        <div className="w-full text-center">
          <AnimatePresence mode="wait">
            {scanState === 'idle' && (
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-xs text-slate-500 font-extrabold block"
              >
                Place your <span className="text-indigo-600">{selectedFinger}</span> on the scanner above.
              </motion.span>
            )}
            {scanState === 'scanning' && (
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-xs text-indigo-600 font-black flex items-center justify-center gap-2"
              >
                <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping" />
                Scanning ridges... holds pattern securely
              </motion.span>
            )}
            {scanState === 'success' && (
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-xs text-emerald-600 font-extrabold"
              >
                Identity matching template confirmed. Success!
              </motion.span>
            )}
            {scanState === 'error' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="space-y-3 px-2"
              >
                <p className="text-xs text-rose-600 font-extrabold leading-normal">
                  {errorMessage || 'Biometric signature did not pass authentication.'}
                </p>
                
                {linkedProfile ? (
                  <button
                    type="button"
                    onClick={() => {
                      setScanState('idle');
                      setErrorMessage('');
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 transition text-[10px] font-black uppercase text-slate-600 rounded-xl border border-slate-300/30"
                  >
                    Try Another Finger
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 transition text-[10px] font-black uppercase text-white rounded-xl"
                  >
                    Back to Normal Login
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instructions footer note */}
        <div className="mt-8 border-t border-slate-200/50 pt-4 flex items-start gap-1.5 text-slate-400 w-full text-left">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed font-bold">
            <b>Decryption Lockout:</b> A phone-like secure keychain match checks the placed finger pattern. Only the exact finger linked to this UID during enrollment will decrypt your device token.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
