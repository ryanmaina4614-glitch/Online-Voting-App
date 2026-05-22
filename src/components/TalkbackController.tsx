import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { AppUser } from '../types';

interface TalkbackControllerProps {
  user?: AppUser | null;
}

export default function TalkbackController({ user }: TalkbackControllerProps) {
  const isEnabled = !!user?.talkbackEnabled;
  const [muted, setMuted] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const lastSpokenRef = useRef<string>('');
  const speechVolume = 0.95;

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Announce state change
  const speak = (text: string, force = false) => {
    if (!synthRef.current || muted || !isEnabled) return;
    if (!force && lastSpokenRef.current === text) return;

    // Stop current speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.volume = speechVolume;
    
    // Choose voice if possible
    const voices = synthRef.current.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      lastSpokenRef.current = '';
    };

    lastSpokenRef.current = text;
    synthRef.current.speak(utterance);
  };

  // Listen to visual transitions and active items
  useEffect(() => {
    if (!isEnabled) return;

    // Welcome message
    speak(`Voice guidance system is active. Welcome, ${user?.displayName || 'Voter'}. Hover or focus elements to hear options.`, true);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Seek target or its closest button/input/card
      const talkbackTarget = target.closest('[data-talkback], button, input, select, textarea, h1, h2, h3, h4, a') as HTMLElement;
      if (!talkbackTarget) return;

      let speechText = '';

      // Get explicitly defined talkback text
      const customText = talkbackTarget.getAttribute('data-talkback');
      if (customText) {
        speechText = customText;
      } else {
        // Build readable context automatically
        const role = talkbackTarget.tagName.toLowerCase();
        const innerText = talkbackTarget.innerText || talkbackTarget.getAttribute('placeholder') || '';
        
        if (role === 'button') {
          speechText = `Button: ${innerText}`;
        } else if (role === 'input') {
          const type = talkbackTarget.getAttribute('type') || 'text';
          const placeholder = talkbackTarget.getAttribute('placeholder') || '';
          const valueStr = (talkbackTarget as HTMLInputElement).value ? `Current text is: ${(talkbackTarget as HTMLInputElement).value}` : 'empty';
          speechText = `Input field for ${placeholder || type}. ${valueStr}`;
        } else if (role === 'select') {
          const label = talkbackTarget.getAttribute('aria-label') || 'Selection dropdown';
          speechText = `${label}. Press to view options.`;
        } else if (['h1', 'h2', 'h3', 'h4'].includes(role)) {
          speechText = `Heading: ${innerText}`;
        } else if (role === 'a') {
          speechText = `Link: ${innerText}`;
        } else {
          speechText = innerText;
        }
      }

      const trimmed = speechText.substring(0, 180).trim();
      if (trimmed) {
        speak(trimmed);
      }
    };

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const innerText = target.innerText || target.getAttribute('placeholder') || '';
      speak(`Focused item: ${innerText}.`, false);
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('focusin', handleFocus);

    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('focusin', handleFocus);
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [isEnabled, user, muted]);

  if (!isEnabled) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-full py-2.5 px-4 shadow-2xl flex-nowrap border-2 border-white/80 transition-all select-none">
      <div className="flex flex-col items-start">
        <span className="text-[10px] font-black tracking-widest uppercase">🎙️ Talkback Companion</span>
        <span className="text-[8px] font-bold text-indigo-200">Voice Assistance Mode Active</span>
      </div>
      
      <button 
        type="button"
        onClick={() => {
          setMuted(!muted);
          if (synthRef.current) {
            synthRef.current.cancel();
          }
        }}
        className="p-1.5 hover:bg-white/20 rounded-full transition-colors outline-none focus:ring-2 focus:ring-white"
        title={muted ? 'Unmute assistance' : 'Mute assistance'}
      >
        {muted ? <VolumeX className="w-4 h-4 text-red-300" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
      </button>
    </div>
  );
}
