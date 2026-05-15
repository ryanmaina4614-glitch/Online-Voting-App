import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, Users, Shield, Clock, Plus, FileText, Share2, Zap, Trophy, UserCheck, Settings } from 'lucide-react';
import { Election, Candidate } from '../types';

interface DashboardProps {
  activeElection: Election | null;
  onVoteClick: () => void;
  isAdmin: boolean;
}

export default function Dashboard({ activeElection, onVoteClick, isAdmin }: DashboardProps) {
  if (!activeElection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="p-4 bg-indigo-100 rounded-full mb-6">
          <Zap className="w-12 h-12 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">No Active Elections</h2>
        <p className="text-slate-500 max-w-md">There are currently no elections running. Check back later or contact your administrator.</p>
        {isAdmin && (
          <button className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            <Plus className="w-5 h-5" />
            Create New Election
          </button>
        )}
      </div>
    );
  }

  const turnoutPercentage = Math.round((activeElection.totalVotes / 1248) * 100); // Mocking total potential voters for now

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 lg:gap-6">
      {/* Live Election Results - span 2x2 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:col-span-2 md:row-span-2 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col bento-card"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{activeElection.title}</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Live Results • Real-time Monitoring</p>
          </div>
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> LIVE
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-8 py-4">
          {activeElection.candidates.map((candidate, idx) => {
            const percentage = activeElection.totalVotes > 0 
              ? Math.round((candidate.votesCount / activeElection.totalVotes) * 100) 
              : 0;
            
            const colors = [
              'bg-indigo-600',
              'bg-indigo-400',
              'bg-slate-400',
              'bg-slate-200'
            ];

            return (
              <div key={candidate.id} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-800">{candidate.name}</span>
                    {idx === 0 && activeElection.totalVotes > 0 && (
                      <Trophy className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-500">
                    {percentage}% • {candidate.votesCount} <span className="font-medium">Votes</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden border border-slate-200/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`${colors[idx % colors.length]} h-full rounded-full shadow-inner`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 font-medium">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-9 h-9 rounded-full bg-slate-${200 + i * 100} border-2 border-white shadow-sm flex items-center justify-center`}>
                  <UserCheck className="w-4 h-4 text-slate-500" />
                </div>
              ))}
            </div>
            <span>+{activeElection.totalVotes.toLocaleString()} users have voted</span>
          </div>
          <button 
            onClick={onVoteClick}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            Vote Now
          </button>
        </div>
      </motion.div>

      {/* Participation/Turnout Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex flex-col justify-between bento-card"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Turnout</span>
        </div>
        <div>
          <div className="text-5xl font-black text-slate-800 tracking-tighter">{turnoutPercentage}%</div>
          <p className="text-sm text-slate-500 mt-1 font-semibold">Participation Rate</p>
        </div>
        <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full" 
            style={{ width: `${turnoutPercentage}%` }}
          />
        </div>
      </motion.div>

      {/* Security Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-indigo-900 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between text-white bento-card"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-800/60 text-indigo-200 rounded-2xl border border-indigo-700/50">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-xs font-black text-indigo-400 uppercase tracking-widest leading-none">Security</span>
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight">Verified & Secure</div>
          <p className="text-sm text-indigo-300/80 mt-2 leading-relaxed font-medium">
            Blockchain-backed integrity check passed. Anonymous ID verification active.
          </p>
        </div>
        <div className="flex items-center gap-2.5 text-[10px] font-black bg-indigo-800/40 p-2.5 rounded-xl border border-indigo-700/30">
          <span className="text-emerald-400 uppercase">Shield On</span>
          <span className="text-indigo-400 opacity-30">•</span>
          <span className="text-indigo-200">SHA-256 Protocol</span>
        </div>
      </motion.div>

      {/* Countdown Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex flex-col justify-between bento-card"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100">
            <Clock className="w-6 h-6" />
          </div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Countdown</span>
        </div>
        <div>
          <div className="text-4xl font-black text-slate-800 tabular-nums tracking-tighter">04:12:44</div>
          <p className="text-sm text-slate-500 mt-1 font-semibold">Until polls close</p>
        </div>
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <span className="text-[10px] uppercase font-black text-slate-400">Ends at</span>
          <span className="text-xs font-bold text-slate-700">04:00 PM EST</span>
        </div>
      </motion.div>

      {/* Admin/Quick Actions Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex flex-col justify-between bento-card"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Zap className="w-6 h-6" />
          </div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Quick Actions</span>
        </div>
        <div className="space-y-2.5 flex flex-col justify-center flex-1 py-4">
          <button className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Export PDF Result
          </button>
          <button className="w-full py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            <Share2 className="w-3.5 h-3.5" /> Broadcast Alert
          </button>
          {isAdmin && (
            <button className="w-full py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <Settings className="w-3.5 h-3.5" /> Audit Logs
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
