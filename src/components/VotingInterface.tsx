import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, CheckCircle2, ChevronLeft, Info, AlertTriangle } from 'lucide-react';
import { Election, Candidate } from '../types';

interface VotingInterfaceProps {
  election: Election;
  onVote: (candidateId: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function VotingInterface({ election, onVote, onBack, isSubmitting }: VotingInterfaceProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleVoteSubmit = () => {
    if (selectedCandidate) {
      onVote(selectedCandidate);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group"
        >
          <div className="p-2 bg-white rounded-xl border border-slate-200 group-hover:border-indigo-200 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </div>
          Back to Dashboard
        </button>
        
        <div className="flex flex-col items-end">
          <span className="text-xs font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Time Remaining</span>
          <span className="text-lg font-black text-orange-600 tabular-nums">04:12:44</span>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm mb-8">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-4">{election.title}</h2>
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
                  <h4 className="font-bold text-amber-900">Important Security Notice</h4>
                  <p className="text-sm text-amber-800/80 font-medium mt-1">
                    Your vote is anonymous and final. Once submitted, it cannot be changed or retraced to your identity. 
                    Ensure your selection is correct before proceeding.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowConfirm(true)}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] text-xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                Cast Secure Vote
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <h3 className="text-3xl font-black text-slate-800 mb-2">Final Confirmation</h3>
              <p className="text-slate-500 font-medium mb-8">
                Are you sure you want to vote for <span className="text-slate-800 font-bold">{election.candidates.find(c => c.id === selectedCandidate)?.name}</span>?
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-4 border-2 border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleVoteSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Vote'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
