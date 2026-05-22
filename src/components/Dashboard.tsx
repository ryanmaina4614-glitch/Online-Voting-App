import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, Users, Shield, Clock, Plus, FileText, Share2, Zap, 
  Trophy, UserCheck, Settings, Vote, Check, ShieldCheck, 
  Calendar, ChevronRight, Fingerprint, RefreshCw, Star, Info, 
  BookOpen, CircleDot, Award, FileSpreadsheet, Download, Heart 
} from 'lucide-react';
import { Election, Candidate, ElectionStatus, AppUser, UserRole } from '../types';
import { addElectionToCalendar, checkElectionInCalendar, removeElectionFromCalendar } from '../services/calendar';

interface DashboardProps {
  elections: Election[];
  onVoteClick: (election: Election) => void;
  user: AppUser | null;
  isAdmin: boolean;
}

export default function Dashboard({ elections, onVoteClick, user, isAdmin }: DashboardProps) {
  // If no elections exist, show empty state
  if (!elections || elections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="p-6 bg-indigo-50 text-indigo-600 rounded-3xl mb-6 shadow-md shadow-indigo-100/50 animate-pulse">
          <Zap className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2 font-sans tracking-tight">No Active Ballot Records</h2>
        <p className="text-slate-500 max-w-md font-medium">There are currently no institutional elections registered. Contact your school administrator to configure ballots.</p>
      </div>
    );
  }

  // State to track currently selected election details on the dashboard
  const userInstitution = user?.institutionId || 'default';
  
  // Filter elections for the dashboard (voter sees their own institution's, admins/managers see matching)
  const availableElections = user?.role === UserRole.ADMIN 
    ? elections 
    : elections.filter(e => e.institutionId === userInstitution);

  const [viewedElectionId, setViewedElectionId] = useState<string>(() => {
    // Default to the first ACTIVE election, or the first available one
    const active = availableElections.find(e => e.status === ElectionStatus.ACTIVE);
    return active?.id || availableElections[0]?.id || '';
  });

  const viewedElection = availableElections.find(e => e.id === viewedElectionId) || availableElections[0];

  // Selected candidate manifesto modal detail for campaign/upcoming stage
  const [selectedCampaignCandidate, setSelectedCampaignCandidate] = useState<Candidate | null>(null);
  const [hoveredCandidateId, setHoveredCandidateId] = useState<string | null>(null);

  // Google Calendar Integration states
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [calendarEventId, setCalendarEventId] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarSuccess, setCalendarSuccess] = useState<boolean>(false);

  // Synchronize calendar status when election selection changes
  useEffect(() => {
    let active = true;
    const checkCalendar = async () => {
      if (!viewedElection) return;
      try {
        const eventId = await checkElectionInCalendar(viewedElection);
        if (active) {
          setCalendarEventId(eventId);
          setCalendarError(null);
        }
      } catch (err) {
        console.warn('Silent calendar check failed/unauthenticated:', err);
        if (active) {
          setCalendarEventId(null);
        }
      }
    };

    setCalendarEventId(null);
    setCalendarSuccess(false);
    checkCalendar();

    return () => {
      active = false;
    };
  }, [viewedElectionId]);

  const handleSyncToCalendar = async () => {
    if (!viewedElection) return;
    setIsSyncingCalendar(true);
    setCalendarError(null);
    setCalendarSuccess(false);
    try {
      const result = await addElectionToCalendar(viewedElection, window.location.origin);
      setCalendarEventId(result.id);
      setCalendarSuccess(true);
      setTimeout(() => setCalendarSuccess(false), 5000);
    } catch (err: any) {
      console.error('Failed to sync to calendar:', err);
      setCalendarError(err.message || 'Failed to authorize or add event to Google Calendar.');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleRemoveFromCalendar = async () => {
    if (!calendarEventId) return;
    const confirmed = window.confirm('Are you sure you want to remove this election event from your Google Calendar?');
    if (!confirmed) return;

    setIsSyncingCalendar(true);
    setCalendarError(null);
    try {
      await removeElectionFromCalendar(calendarEventId);
      setCalendarEventId(null);
    } catch (err: any) {
      console.error('Failed to remove from calendar:', err);
      setCalendarError(err.message || 'Failed to remove calendar event.');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // States for election card hover details (tooltip/popover)
  const [hoveredElection, setHoveredElection] = useState<Election | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ top: number; left: number } | null>(null);

  const handleCardMouseEnter = (e: React.MouseEvent<HTMLDivElement>, election: Election) => {
    if (window.innerWidth < 1024) return; // Desktop only popover
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredElection(election);
    setHoverCoords({
      top: rect.top,
      left: rect.left + rect.width + 12
    });
  };

  const handleCardMouseLeave = () => {
    setHoveredElection(null);
    setHoverCoords(null);
  };

  const handleParentScroll = () => {
    setHoveredElection(null);
    setHoverCoords(null);
  };

  // States for countdown timer
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [timerLabel, setTimerLabel] = useState<string>('Until polls close');
  const [hasConcluded, setHasConcluded] = useState<boolean>(false);

  // Effect to handle dynamic timing depending on election state
  useEffect(() => {
    if (!viewedElection) return;

    const updateTime = () => {
      const now = new Date();
      const start = new Date(viewedElection.startDate);
      const end = new Date(viewedElection.endDate);

      if (now < start) {
        // Upcoming election - count down to start
        const diff = +start - +now;
        setTimerLabel('Until voting begins');
        setHasConcluded(false);
        setTimeLeft(formatDiff(diff));
      } else if (now >= start && now <= end) {
        // Active election - count down to end
        const diff = +end - +now;
        setTimerLabel('Until polls close');
        setHasConcluded(false);
        setTimeLeft(formatDiff(diff));
      } else {
        // Concluded election
        setTimerLabel('Poll closed');
        setHasConcluded(true);
        setTimeLeft('00:00:00');
      }
    };

    const formatDiff = (diff: number) => {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const daysStr = days > 0 ? `${days}d ` : '';
      return `${daysStr}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [viewedElection]);

  // Handle printing results report
  const handlePrintReport = () => {
    if (!viewedElection) return;
    
    // Create an elegant print viewport
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to export results.");
      return;
    }

    const candidatesHtml = viewedElection.candidates
      .map((c, idx) => {
        const pct = viewedElection.totalVotes > 0 ? Math.round((c.votesCount / viewedElection.totalVotes) * 100) : 0;
        return `
          <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e1e8ed; border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
              <span>${idx + 1}. ${c.name}</span>
              <span>${pct}% (${c.votesCount} votes)</span>
            </div>
            <div style="background-color: #f5f8fa; border-radius: 6px; height: 12px; margin-top: 8px; overflow: hidden;">
              <div style="background-color: #4f46e5; height: 100%; width: ${pct}%;"></div>
            </div>
            <p style="font-size: 12px; color: #657786; margin-top: 6px; font-style: italic;">${c.bio || 'No statement provided.'}</p>
          </div>
        `;
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${viewedElection.title} - Auditor Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1c1e21; padding: 40px; }
            .header { border-b: 2px solid #e1e8ed; padding-bottom: 20px; margin-bottom: 30px; }
            .badge { display: inline-block; padding: 4px 10px; background-color: #e0e7ff; color: #4f46e5; border-radius: 8px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .winner { background-color: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 16px; margin-bottom: 30px; }
            .winner-title { font-weight: 800; color: #065f46; font-size: 18px; display: flex; align-items: center; margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">SECURE AUDIT RECORD</span>
            <h1 style="font-size: 28px; font-weight: 800; margin: 10px 0 4px 0;">${viewedElection.title}</h1>
            <p style="color: #657786; margin-top: 0;">Institution Key: <b>${viewedElection.institutionId}</b> &bull; Total Turnout: <b>${viewedElection.totalVotes} votes</b></p>
          </div>
          
          <div class="winner">
            <p class="winner-title">&starf; CERTIFIED RESULTS LEDGER</p>
            <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; font-weight: 600;">Status: Concluded &bull; Cryptographically Sealed</p>
          </div>

          <h2 style="font-size: 20px; font-weight: 700; border-bottom: 1px solid #f0f3f6; padding-bottom: 8px; margin-bottom: 16px;">Candidate Breakdown</h2>
          ${candidatesHtml}

          <div style="margin-top: 60px; font-size: 11px; color: #aab8c2; text-align: center; border-top: 1px dashed #e1e8ed; padding-top: 20px;">
            &copy; VoteSecure Systems Ledger Integration SHA-256. Printed ${new Date().toLocaleString()}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Turnout mock stats (percentage of potential student base)
  const potentialVotersCount = 1250;
  const turnoutPercentage = viewedElection 
    ? Math.min(100, Math.round((viewedElection.totalVotes / potentialVotersCount) * 100))
    : 0;

  // Has the current voter already voted in the currently viewed election?
  const hasVotedThisElection = user?.votedElections?.includes(viewedElection?.id);

  // Sorting elections to show active on top, then upcoming, then completed
  const sortedElections = [...availableElections].sort((a, b) => {
    const statusWeight = {
      [ElectionStatus.ACTIVE]: 1,
      [ElectionStatus.UPCOMING]: 2,
      [ElectionStatus.COMPLETED]: 3
    };
    return (statusWeight[a.status] || 9) - (statusWeight[b.status] || 9);
  });

  return (
    <div className="space-y-8 pb-16 animate-fade-in text-left">
      
      {/* 🚀 Visual Welcome Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-[2.5rem] p-8 md:p-10 shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-200 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border border-indigo-500/20 shadow-inner">
              <Star className="w-3.5 h-3.5 fill-current" />
              Institutional Hub
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none flex items-center gap-3">
              {user?.passportPhotoUrl && (
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-indigo-400 shadow-md transform -rotate-2 shrink-0">
                  <img 
                    src={user.passportPhotoUrl} 
                    alt={user.displayName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <span>Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-indigo-100">{user?.displayName}</span></span>
            </h2>
            <p className="text-slate-300 font-medium text-sm md:text-base max-w-xl">
              Cast and audit your digital ballots on school matters securely. Secured via Zero-Knowledge Verification.
            </p>
          </div>

          <div className="flex gap-4 self-stretch md:self-auto shrink-0 bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10">
            <div className="text-center px-4 border-r border-white/10">
              <span className="block text-[10px] uppercase font-black tracking-widest text-indigo-300">My Institution</span>
              <span className="text-lg font-black text-white">{user?.institutionId || 'N/A'}</span>
            </div>
            <div className="text-center px-4">
              <span className="block text-[10px] uppercase font-black tracking-widest text-indigo-300">Ballots Cast</span>
              <span className="text-lg font-black text-emerald-400 flex items-center justify-center gap-1">
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                {user?.votedElections?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔮 Interactive Cockpit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 🗳️ LEFT COLUMN: Available Ballot Cards List (Span 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Available Ballots</h3>
            <span className="px-2.5 py-0.5 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500">
              {sortedElections.length} Total
            </span>
          </div>

          <div 
            className="space-y-3 max-h-[70vh] overflow-y-auto pr-1"
            onScroll={handleParentScroll}
          >
            {sortedElections.map((election) => {
              const isSelected = election.id === viewedElectionId;
              const isVoted = user?.votedElections?.includes(election.id);
              
              return (
                <motion.div
                  key={election.id}
                  whileHover={{ 
                    scale: 1.025, 
                    y: -3,
                    boxShadow: isSelected 
                      ? "0 20px 25px -5px rgba(99, 102, 241, 0.15), 0 8px 10px -6px rgba(99, 102, 241, 0.15)"
                      : "0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.08)",
                    backgroundColor: isSelected ? "#ffffff" : "#f8fafc"
                  }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  onClick={() => setViewedElectionId(election.id)}
                  onMouseEnter={(e) => handleCardMouseEnter(e, election)}
                  onMouseLeave={handleCardMouseLeave}
                  className={`p-4 rounded-2xl border cursor-pointer border-slate-200 transition-shadow ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-sm'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Status / Already Voted badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        {election.status === ElectionStatus.ACTIVE && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            <CircleDot className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                            Live Poll
                          </span>
                        )}
                        {election.status === ElectionStatus.UPCOMING && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            Upcoming
                          </span>
                        )}
                        {election.status === ElectionStatus.COMPLETED && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Concluded
                          </span>
                        )}

                        {isVoted && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            <Check className="w-2.5 h-2.5 text-indigo-700 stroke-[3]" />
                            Voted
                          </span>
                        )}
                      </div>

                      <h4 className="font-sans font-bold text-slate-800 text-sm truncate leading-snug">
                        {election.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 font-semibold truncate">
                        {election.candidates.length} candidates &bull; {election.totalVotes} cast
                      </p>
                    </div>

                    <div className={`p-1.5 rounded-xl border ${isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200/50">
            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-1 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-indigo-600" /> Secure Storage Guard
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              Your registered voting rights map exclusively to {userInstitution} ballot indexes. Credentials are cryptographic signatures.
            </p>
          </div>
        </div>

        {/* 🗳️ RIGHT COLUMN: Active Ballot Room (Span 8) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm relative min-h-[60vh] flex flex-col justify-between">
          
          <div>
            {/* Header / Meta */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                    {viewedElection.institutionId} ballot
                  </span>
                  
                  {viewedElection.status === ElectionStatus.ACTIVE && (
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Live Voting Room
                    </span>
                  )}
                  {viewedElection.status === ElectionStatus.UPCOMING && (
                    <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-wider">
                      Upcoming Election
                    </span>
                  )}
                  {viewedElection.status === ElectionStatus.COMPLETED && (
                    <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      Concluded Results Sealed
                    </span>
                  )}
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight mt-1">
                  {viewedElection.title}
                </h2>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mt-1">
                  {viewedElection.description}
                </p>

                {/* 📅 Google Calendar Action */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {calendarEventId ? (
                    <button
                      onClick={handleRemoveFromCalendar}
                      disabled={isSyncingCalendar}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-rose-50 hover:text-rose-600 group border border-emerald-100 hover:border-rose-200 rounded-xl text-xs font-black text-emerald-600 transition-all flex items-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
                      title="Click to remove from Google Calendar"
                    >
                      <Check className="w-3.5 h-3.5 group-hover:hidden text-emerald-500" />
                      <span className="group-hover:hidden">Added to Google Calendar</span>
                      <span className="hidden group-hover:inline">Remove from Google Calendar</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSyncToCalendar}
                      disabled={isSyncingCalendar}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-[0.98] shadow-sm shadow-indigo-100 disabled:opacity-50"
                    >
                      {isSyncingCalendar ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5" />
                      )}
                      Sync to Google Calendar
                    </button>
                  )}

                  {calendarSuccess && (
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 animate-fade-in">
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Event synced successfully!
                    </span>
                  )}
                  {calendarError && (
                    <span className="text-xs font-bold text-rose-500 flex items-center gap-1 animate-fade-in max-w-xs truncate" title={calendarError}>
                      ⚠️ {calendarError}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="w-full md:w-auto shrink-0 bg-slate-50 border border-slate-100 p-4 rounded-3xl flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${viewedElection.status === ElectionStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-black text-slate-400 leading-none tracking-wider">{timerLabel}</span>
                  <span className="text-lg font-black text-slate-700 font-mono tracking-tight leading-none mt-1.5 block">{timeLeft}</span>
                </div>
              </div>
            </div>

            {/* Content Section based on status */}
            <div className="py-8">
              
              {/* STATUS 1: COMPLETED POLL */}
              {viewedElection.status === ElectionStatus.COMPLETED && (
                <div className="space-y-8">
                  {/* Final Winner Showcase */}
                  {viewedElection.totalVotes > 0 && (() => {
                    const sortedCandidates = [...viewedElection.candidates].sort((a,b) => b.votesCount - a.votesCount);
                    const winner = sortedCandidates[0];
                    const winnerPercent = Math.round((winner.votesCount / viewedElection.totalVotes) * 100);
                    
                    return (
                      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-200 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center">
                        <div className="p-4 bg-emerald-500/10 text-emerald-700 rounded-2xl relative">
                          <Trophy className="w-10 h-10 stroke-[2.5]" />
                          <div className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-amber-950 font-black">
                            1
                          </div>
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-1">
                          <h4 className="text-xs font-black uppercase text-emerald-800 tracking-widest">Certified Winner Spotlight</h4>
                          <p className="text-xl font-black text-slate-800">{winner.name}</p>
                          <p className="text-xs text-emerald-700 font-bold">
                            Elected Representative &bull; {winnerPercent}% support ({winner.votesCount} Total Votes)
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Graph results breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Results Tallied Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewedElection.candidates.map((candidate, idx) => {
                        const pct = viewedElection.totalVotes > 0 
                          ? Math.round((candidate.votesCount / viewedElection.totalVotes) * 100)
                          : 0;
                        return (
                          <div 
                            key={candidate.id} 
                            onMouseEnter={() => setHoveredCandidateId(candidate.id)}
                            onMouseLeave={() => setHoveredCandidateId(null)}
                            className="relative p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 cursor-help transition-all hover:bg-slate-100/50"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-700 text-sm">{candidate.name}</span>
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                {pct}% ({candidate.votesCount} votes)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                            </div>

                            {/* Hover detail tooltip */}
                            {hoveredCandidateId === candidate.id && (
                              <div className="absolute z-30 bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-80 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-2xl text-left pointer-events-none animate-fade-in transition-all">
                                <div className="flex items-center gap-4 mb-3 pb-3 border-b border-slate-800">
                                  <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                                    {candidate.photoUrl ? (
                                      <img src={candidate.photoUrl} alt={candidate.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-550 font-bold text-xs">
                                        {candidate.name.split(' ').map(n=>n[0]).join('')}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h5 className="font-extrabold text-white text-sm leading-tight text-ellipsis overflow-hidden whitespace-nowrap max-w-[180px]">{candidate.name}</h5>
                                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">Campaign Manifesto Profile</p>
                                  </div>
                                </div>
                                <div className="text-xs text-slate-350 font-medium leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                                  {candidate.bio || "No biography details registered."}
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-slate-900"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STATUS 2: UPCOMING POLL */}
              {viewedElection.status === ElectionStatus.UPCOMING && (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex gap-4 text-blue-800">
                    <Info className="w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">Campaign Trial Phase Active</h4>
                      <p className="text-xs text-blue-700 font-medium leading-relaxed mt-1">
                        Voter identity authentication triggers on start date. Right now, learn candidate manifestos and plan your vote.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Meet the Candidates</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {viewedElection.candidates.map((candidate) => (
                        <div 
                          key={candidate.id}
                          onClick={() => setSelectedCampaignCandidate(candidate)}
                          onMouseEnter={() => setHoveredCandidateId(candidate.id)}
                          onMouseLeave={() => setHoveredCandidateId(null)}
                          className="relative bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl p-4 text-center cursor-pointer transition-colors group"
                        >
                          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform border border-indigo-100 shadow-inner overflow-hidden">
                            {candidate.photoUrl ? (
                              <img src={candidate.photoUrl} alt={candidate.name} className="w-full h-full object-cover" />
                            ) : (
                              candidate.name.split(' ').map(n=>n[0]).join('')
                            )}
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm">{candidate.name}</h4>
                          <span className="text-[10px] text-indigo-600 font-bold block mt-1 hover:underline">
                            Read Manifesto &rarr;
                          </span>

                          {/* Hover detail tooltip */}
                          {hoveredCandidateId === candidate.id && (
                            <div className="absolute z-30 bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-80 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-2xl text-left pointer-events-none animate-fade-in transition-all">
                              <div className="flex items-center gap-4 mb-3 pb-3 border-b border-slate-800">
                                <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                                  {candidate.photoUrl ? (
                                    <img src={candidate.photoUrl} alt={candidate.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-550 font-bold text-xs">
                                      {candidate.name.split(' ').map(n=>n[0]).join('')}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h5 className="font-extrabold text-white text-sm leading-tight text-ellipsis overflow-hidden whitespace-nowrap max-w-[180px]">{candidate.name}</h5>
                                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">Campaign Manifesto Profile</p>
                                </div>
                              </div>
                              <div className="text-xs text-slate-300 font-medium leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                                {candidate.bio || "No biography details registered."}
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-slate-900"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STATUS 3: ACTIVE LIVE POLL */}
              {viewedElection.status === ElectionStatus.ACTIVE && (
                <div className="space-y-6">
                  {/* Ballot casts status warning */}
                  {hasVotedThisElection ? (
                    <div className="p-6 bg-indigo-50/50 border border-indigo-200 rounded-3xl flex gap-4 items-start">
                      <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                        <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <div>
                        <h4 className="font-black text-indigo-900 text-lg">Your ballot is safely recorded.</h4>
                        <p className="text-xs font-medium text-indigo-800/80 leading-relaxed mt-1">
                          Our student voting engine blocks duplicate cast submissions via compound database constraints. Your Zero-Knowledge confirmation code ledger secures your audit path.
                        </p>
                        
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-indigo-100 text-[10px] font-black uppercase rounded-lg text-indigo-700">
                            <Fingerprint className="w-3.5 h-3.5" />
                            Security Protocol SHA-256
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-200 text-[10px] font-black uppercase rounded-lg text-emerald-800">
                            <Check className="w-3.5 h-3.5" />
                            Confirmed Legitimate
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex gap-4 items-start">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
                        <Vote className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">You are eligible to vote in this ballot</h4>
                        <p className="text-xs text-slate-400 font-semibold mt-1">
                          This is an authentic institutional ballot for registered school students of <b>{userInstitution}</b>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Real-time bar progress preview of candidate status */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Poll Status Overview (Real-time tracking)</h3>
                    <div className="space-y-4">
                      {viewedElection.candidates.map((candidate, idx) => {
                        const count = candidate.votesCount;
                        const pct = viewedElection.totalVotes > 0 ? Math.round((count / viewedElection.totalVotes) * 100) : 0;
                        const colors = ['bg-indigo-600', 'bg-violet-500', 'bg-slate-400'];
                        
                        return (
                          <div key={candidate.id} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700">{candidate.name}</span>
                              <span className="font-mono text-slate-500 font-bold">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/40">
                              <div className={`h-full ${colors[idx % colors.length]}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Action Footer Drawer */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Left elements: Participation metrics */}
            <div className="flex items-center gap-4 self-stretch sm:self-auto">
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                {/* SVG Radial loader for Turnout Percentage */}
                <svg className="absolute w-12 h-12 transform -rotate-90">
                  <circle cx="24" cy="24" r="18" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                  <circle cx="24" cy="24" r="18" fill="transparent" stroke="#4f46e5" strokeWidth="4" 
                          strokeDasharray={2 * Math.PI * 18}
                          strokeDashoffset={2 * Math.PI * 18 * (1 - turnoutPercentage / 100)} />
                </svg>
                <span className="text-[10px] font-black text-slate-700">{turnoutPercentage}%</span>
              </div>
              <div className="text-left">
                <span className="block text-[9px] uppercase font-black text-slate-400">Total Turnout Index</span>
                <span className="text-xs font-bold text-slate-600 block leading-tight">
                  {viewedElection.totalVotes} in this room
                </span>
              </div>
            </div>

            {/* Right Button triggers */}
            <div className="flex gap-3 w-full sm:w-auto">
              {viewedElection.status === ElectionStatus.COMPLETED ? (
                <button 
                  onClick={handlePrintReport}
                  className="flex-1 sm:flex-none px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-md shadow-slate-100 text-sm"
                >
                  <Download className="w-4 h-4" /> Export Sealed Report
                </button>
              ) : viewedElection.status === ElectionStatus.ACTIVE ? (
                hasVotedThisElection ? (
                  <div className="px-6 py-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-indigo-700 stroke-[3.5]" />
                    Verified Vote Sealed
                  </div>
                ) : (
                  <button 
                    onClick={() => onVoteClick(viewedElection)}
                    className="flex-1 sm:flex-none px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm text-center"
                  >
                    <Vote className="w-4 h-4" /> Vote in this Election
                  </button>
                )
              ) : (
                <div className="px-6 py-3 bg-slate-100 border border-slate-200 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest text-center flex-1 sm:flex-none">
                  Campaign trial phase only
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* 📜 Candidate campaign manifesto details modal overlay for upcoming states */}
      <AnimatePresence>
        {selectedCampaignCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[3rem] p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative text-left"
            >
              <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-5">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center text-xl font-black text-white shadow-inner overflow-hidden shrink-0">
                  {selectedCampaignCandidate.photoUrl ? (
                    <img src={selectedCampaignCandidate.photoUrl} alt={selectedCampaignCandidate.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedCampaignCandidate.name.split(' ').map(n=>n[0]).join('')
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{selectedCampaignCandidate.name}</h3>
                  <p className="text-xs uppercase font-black text-indigo-600 tracking-wider">Candidate Campaign Profile</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    Candidate Campaign Statement / Biography
                  </span>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-650 text-sm font-medium leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {selectedCampaignCandidate.bio || "This candidate hasn't registered a biography yet."}
                  </div>
                </div>

                {/* Slogan */}
                {selectedCampaignCandidate.campaignText && (
                  <div className="p-3 bg-indigo-50/75 border-l-4 border-indigo-400 text-xs font-serif italic text-indigo-950 rounded-r-xl">
                    "{selectedCampaignCandidate.campaignText}"
                  </div>
                )}

                {/* Poster */}
                {selectedCampaignCandidate.campaignPicUrl && (
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">🖼️ Campaign Poster</span>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden aspect-video bg-slate-50">
                      <img 
                        src={selectedCampaignCandidate.campaignPicUrl} 
                        alt="Campaign Poster" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                )}

                {/* Audio */}
                {selectedCampaignCandidate.campaignAudioUrl && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="block text-[9px] font-black text-indigo-700 uppercase tracking-widest mb-1.5">🔊 Audio Pitch</span>
                    <audio 
                      controls 
                      src={selectedCampaignCandidate.campaignAudioUrl} 
                      className="w-full h-8 outline-none" 
                    />
                  </div>
                )}

                {/* Video */}
                {selectedCampaignCandidate.campaignVideoUrl && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="block text-[9px] font-black text-indigo-700 uppercase tracking-widest mb-1.5">🎥 Campaign Video</span>
                    {selectedCampaignCandidate.campaignVideoUrl.includes('youtube') || selectedCampaignCandidate.campaignVideoUrl.includes('youtu.be') ? (
                      <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm">
                        <iframe 
                          src={selectedCampaignCandidate.campaignVideoUrl.replace('watch?v=', 'embed/').split('&')[0]} 
                          title="Campaign Video" 
                          className="w-full h-full border-0"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <video 
                        controls 
                        src={selectedCampaignCandidate.campaignVideoUrl} 
                        className="w-full aspect-video rounded-xl" 
                      />
                    )}
                  </div>
                )}

                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-700" />
                  <span className="text-[10px] font-bold text-indigo-900">
                    Learn, inspect, and audit candidate manifestos before polls open.
                  </span>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setSelectedCampaignCandidate(null)}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Dismiss Campaign Card
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔮 Fixed Hover Popover / Tooltip */}
      <AnimatePresence>
        {hoveredElection && hoverCoords && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -10 }}
            transition={{ duration: 0.15 }}
            style={{ 
              position: 'fixed', 
              top: hoverCoords.top, 
              left: hoverCoords.left,
              zIndex: 9999
            }}
            className="hidden lg:block w-80 bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl rounded-2xl p-5 pointer-events-none"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/40">
                  {hoveredElection.institutionId}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                  hoveredElection.status === ElectionStatus.ACTIVE 
                    ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-900/40' 
                    : hoveredElection.status === ElectionStatus.UPCOMING 
                    ? 'text-blue-400 bg-blue-950/50 border border-blue-900/40' 
                    : 'text-slate-400 bg-slate-950/50 border border-slate-800'
                }`}>
                  {hoveredElection.status === ElectionStatus.ACTIVE 
                    ? 'Live Poll' 
                    : hoveredElection.status === ElectionStatus.UPCOMING 
                    ? 'Upcoming' 
                    : 'Concluded'}
                </span>
              </div>

              <div>
                <h4 className="font-sans font-bold text-white text-sm leading-snug">
                  {hoveredElection.title}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {new Date(hoveredElection.startDate).toLocaleDateString()} - {new Date(hoveredElection.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                  Ballot Overview
                </span>
                <p className="text-xs text-slate-300 font-medium leading-relaxed line-clamp-4">
                  {hoveredElection.description}
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-3 space-y-2">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-500" /> Candidates ({hoveredElection.candidates.length})
                  </span>
                  <span>Turnout ({hoveredElection.totalVotes})</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {hoveredElection.candidates.slice(0, 3).map((candidate) => (
                    <span 
                      key={candidate.id} 
                      className="inline-flex items-center gap-1.5 text-[10px] font-extrabold bg-slate-800/70 border border-slate-700/40 px-2 py-0.5 rounded-lg text-slate-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {candidate.name}
                    </span>
                  ))}
                  {hoveredElection.candidates.length > 3 && (
                    <span className="inline-flex items-center text-[10px] font-bold bg-slate-800/40 border border-slate-700/40 px-2.5 py-0.5 rounded-lg text-slate-400">
                      +{hoveredElection.candidates.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
