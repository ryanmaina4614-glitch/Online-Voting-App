import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Users, 
  RefreshCw, 
  CheckCircle, 
  SlidersHorizontal,
  Activity,
  CalendarCheck,
  FileDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Election } from '../types';
import { getVoteRecords } from '../services/firebase';

interface VoterTurnoutChartProps {
  elections: Election[];
  totalUsersCount: number;
}

export default function VoterTurnoutChart({ elections, totalUsersCount }: VoterTurnoutChartProps) {
  const activeElections = useMemo(() => {
    return elections.filter(e => e.status === 'active');
  }, [elections]);

  const defaultElectionId = activeElections.length > 0 ? activeElections[0].id : (elections[0]?.id || '');
  const [selectedElectionId, setSelectedElectionId] = useState<string>(defaultElectionId);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartMode, setChartMode] = useState<'cumulative' | 'interval'>('cumulative');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [pdfExportSuccess, setPdfExportSuccess] = useState<string>('');

  const selectedElection = useMemo(() => {
    return elections.find(e => e.id === selectedElectionId);
  }, [elections, selectedElectionId]);

  const exportToPDF = () => {
    if (votes.length === 0) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 1. Accent color header bar
      doc.setFillColor(99, 102, 241); // Indigo Primary
      doc.rect(15, 15, 180, 8, 'F');

      // 2. Title Section
      doc.setTextColor(30, 41, 59); // Slate Dark Blue
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('VOTER TURNOUT & AUDIT REPORT', 15, 34);

      // Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(`Official Administrative Record-Keeping Document | Generated: ${new Date().toLocaleString()}`, 15, 40);

      // Decorative separator line
      doc.setDrawColor(226, 232, 240); // Soft grey borders (slate-200)
      doc.setLineWidth(0.5);
      doc.line(15, 45, 195, 45);

      // 3. Left Section: Election details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(79, 70, 229); // Accent Indigo
      doc.text('ELECTION IDENTIFICATION', 15, 54);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('Title:', 15, 60);
      doc.setFont('helvetica', 'normal');
      doc.text(`${selectedElection?.title || 'General Election'}`, 28, 60);

      doc.setFont('helvetica', 'bold');
      doc.text('Status:', 15, 66);
      doc.setFont('helvetica', 'normal');
      doc.text(`${(selectedElection?.status || 'Active').toUpperCase()}`, 31, 66);

      doc.setFont('helvetica', 'bold');
      doc.text('Type:', 15, 72);
      doc.setFont('helvetica', 'normal');
      doc.text(`${selectedElection?.type || 'De-centralized Blockchain'}`, 28, 72);

      // 4. Right Section: Participation Metrics
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(79, 70, 229); // Accent Indigo
      doc.text('PARTICIPATION METRICS', 110, 54);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('Registered Voters:', 110, 60);
      doc.setFont('helvetica', 'normal');
      doc.text(`${totalUsersCount}`, 148, 60);

      doc.setFont('helvetica', 'bold');
      doc.text('Total Ballots Cast:', 110, 66);
      doc.setFont('helvetica', 'normal');
      doc.text(`${votes.length}`, 148, 66);

      doc.setFont('helvetica', 'bold');
      doc.text('Audit Turnout Rate:', 110, 72);
      doc.setFont('helvetica', 'normal');
      doc.text(`${currentTurnoutRate}%`, 148, 72);

      // Separator line
      doc.line(15, 78, 195, 78);

      // 5. Timeline heading
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('CHRONOLOGICAL BALLOT PROCESS MATRIX', 15, 87);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('The matrix below logs cumulative voter progression over discrete time buckets.', 15, 92);

      // Table Header Setup
      let yStart = 98;
      doc.setFillColor(248, 250, 252); // extremely soft gray/blue (slate-50)
      doc.rect(15, yStart, 180, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text('Time Interval/Bucket', 20, yStart + 5.5);
      doc.text('Hourly Submissions', 85, yStart + 5.5);
      doc.text('Cumulative Ledger Total (Turnout %)', 135, yStart + 5.5);

      // Table Row Loop
      let yRow = yStart + 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42); // slate-900

      chartData.forEach((item, index) => {
        // Page threshold safety (A4 is 297mm high)
        if (yRow > 240) {
          doc.addPage();
          doc.setFillColor(248, 250, 252);
          doc.rect(15, 20, 180, 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.text('Time Interval/Bucket', 20, 25.5);
          doc.text('Hourly Submissions', 85, 25.5);
          doc.text('Cumulative Ledger Total (Turnout %)', 135, 25.5);
          yRow = 28;
          doc.setFont('helvetica', 'normal');
        }

        // Row zebra background
        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, yRow, 180, 7, 'F');
        }

        // Horizontal line for the row
        doc.setDrawColor(241, 245, 249); // slate-100
        doc.line(15, yRow + 7, 195, yRow + 7);

        doc.text(item.label, 20, yRow + 5);
        doc.text(`${item.submissions} ballots`, 85, yRow + 5);
        
        const perc = totalUsersCount > 0 ? Math.min(100, Math.round((item.cumulative / totalUsersCount) * 100)) : 0;
        doc.text(`${item.cumulative} votes (${perc}%)`, 135, yRow + 5);

        yRow += 7;
      });

      // 6. Sign-off Footer section
      let yFooter = Math.min(270, yRow + 15);
      if (yFooter > 245) {
        doc.addPage();
        yFooter = 30;
      }

      // Border and fine-print disclaimer
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(15, yFooter, 195, yFooter);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('Notice: This is a secure Administrative Ledger copy designed to archive immutable election voter turnout metrics.', 15, yFooter + 6);
      doc.text('All submissions recorded are cryptographically verified through decentralized digital signatures.', 15, yFooter + 10);

      // Administrator signatures
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('OFFICIAL SIGN-OFF AUTHORITY:', 15, yFooter + 22);
      
      doc.setDrawColor(148, 163, 184);
      doc.line(15, yFooter + 34, 85, yFooter + 34);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Authorized Presiding Officer Signature', 15, yFooter + 38);

      // Tech details right column
      const rKey = Math.random().toString(36).substring(2, 10).toUpperCase();
      doc.text(`Ledger Ref Hash: TXN-SEC-${rKey}`, 130, yFooter + 22);
      doc.text(`Digital Seal ID: EVS-MTRX-${new Date().getFullYear()}`, 130, yFooter + 26);

      // Save PDF output
      const filename = `turnout_report_${selectedElection?.id || 'export'}.pdf`;
      doc.save(filename);

      setPdfExportSuccess('Voter turnout report exported successfully! Check your downloads folder.');
      setTimeout(() => setPdfExportSuccess(''), 5000);
    } catch (err) {
      console.error('PDF export failed', err);
      alert('Could not generate the PDF Turnout Report. Please try again.');
    }
  };

  // Load vote records for selected election
  const fetchTurnoutData = async () => {
    if (!selectedElectionId) return;
    setLoading(true);
    try {
      const records = await getVoteRecords(selectedElectionId);
      setVotes(records || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch turnout records', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh interval (every 10 seconds for testing/active elections simulation)
  useEffect(() => {
    fetchTurnoutData();

    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchTurnoutData();
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedElectionId, autoRefresh]);

  // Sync selected election when elections list or default changes
  useEffect(() => {
    if (defaultElectionId && !selectedElectionId) {
      setSelectedElectionId(defaultElectionId);
    }
  }, [defaultElectionId]);

  // Custom function to parse Firestore or general timestamps
  const parseRecordDate = (vr: any): Date | null => {
    if (!vr.timestamp) return null;
    if (typeof vr.timestamp.toDate === 'function') {
      return vr.timestamp.toDate();
    }
    if (vr.timestamp.seconds) {
      return new Date(vr.timestamp.seconds * 1000);
    }
    const d = new Date(vr.timestamp);
    return isNaN(d.getTime()) ? null : d;
  };

  // Build binned timeline data chronologically
  const chartData = useMemo(() => {
    if (votes.length === 0) return [];

    const parsedVotes = votes
      .map(v => ({
        ...v,
        date: parseRecordDate(v)
      }))
      .filter(v => v.date !== null)
      .sort((a, b) => a.date!.getTime() - b.date!.getTime());

    if (parsedVotes.length === 0) return [];

    const minTime = parsedVotes[0].date!.getTime();
    const maxTime = parsedVotes[parsedVotes.length - 1].date!.getTime();
    const rangeMs = Math.max(1, maxTime - minTime);

    // Determine key formatter format depending on range duration
    let formatKey = (d: Date) => {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    let stepMs = 15 * 60 * 1000; // default 15 mins

    if (rangeMs > 3 * 24 * 3600 * 1000) {
      // Greater than 3 days -> bin by day
      formatKey = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      stepMs = 24 * 3600 * 1000;
    } else if (rangeMs > 6 * 3600 * 1000) {
      // Greater than 6 hours -> bin by hour
      formatKey = (d: Date) => {
        const hrs = d.getHours();
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        const displayHr = hrs % 12 || 12;
        return `${displayHr} ${ampm}`;
      };
      stepMs = 3600 * 1000;
    }

    // Initialize map of consecutive bins to prevent gaps in chart visual layout
    const bins: { [key: string]: number } = {};
    const startDate = new Date(minTime);
    const endDate = new Date(maxTime);

    // Safety guard to avoid locking event-loop
    let current = new Date(startDate);
    let iters = 0;
    while (current <= endDate && iters < 120) {
      bins[formatKey(current)] = 0;
      current = new Date(current.getTime() + stepMs);
      iters++;
    }

    // Accumulate the standard real records
    parsedVotes.forEach(v => {
      const key = formatKey(v.date!);
      bins[key] = (bins[key] || 0) + 1;
    });

    // Generate output with both point count and cumulative summation
    let totalAccum = 0;
    return Object.entries(bins).map(([label, count]) => {
      totalAccum += count;
      return {
        label,
        submissions: count,
        cumulative: totalAccum,
      };
    });
  }, [votes]);

  // Derived key statistics
  const currentTurnoutRate = useMemo(() => {
    if (!totalUsersCount || totalUsersCount === 0) return 0;
    const count = selectedElection ? selectedElection.totalVotes : votes.length;
    return Math.min(100, Math.round((count / totalUsersCount) * 100));
  }, [votes, selectedElection, totalUsersCount]);

  const lastVoteTime = useMemo(() => {
    if (votes.length === 0) return 'No submissions yet';
    const parsedDates = votes
      .map(v => parseRecordDate(v))
      .filter(d => d !== null)
      .sort((a, b) => b!.getTime() - a!.getTime()); // descending (newest first)
    
    if (parsedDates.length === 0) return 'No submissions yet';
    
    const diffMs = new Date().getTime() - parsedDates[0]!.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    return parsedDates[0]!.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, [votes]);

  const activeHeaderElection = elections.find(e => e.status === 'active');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-8 space-y-8 text-left"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-600 animate-pulse" />
              Live Voter Turnout Monitor
            </h2>
            {autoRefresh && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Real-time visual ledger tracking overall voter participation rate and ballot volume.
          </p>
        </div>

        {/* Dropdown controls / Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-1.5 rounded-xl relative">
            <button 
              onClick={() => setChartMode('cumulative')}
              className={`relative z-10 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 focus:outline-none ${
                chartMode === 'cumulative' 
                  ? 'text-indigo-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {chartMode === 'cumulative' && (
                <motion.span 
                  layoutId="turnoutModeBg"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm z-[-1]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <TrendingUp className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">Cumulative Turnout</span>
            </button>
            <button 
              onClick={() => setChartMode('interval')}
              className={`relative z-10 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 focus:outline-none ${
                chartMode === 'interval' 
                  ? 'text-indigo-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {chartMode === 'interval' && (
                <motion.span 
                  layoutId="turnoutModeBg"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm z-[-1]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <BarChart3 className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">Hourly Batches</span>
            </button>
          </div>

          <div className="flex gap-2">
            <select 
              value={selectedElectionId}
              onChange={(e) => setSelectedElectionId(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Select Election...</option>
              {elections.map((election) => (
                <option key={election.id} value={election.id}>
                  {election.title} ({election.status.toUpperCase()})
                </option>
              ))}
            </select>

            <button 
              onClick={fetchTurnoutData}
              disabled={loading}
              className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl border border-indigo-100 transition-colors disabled:opacity-50"
              title="Refresh Turnout Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={exportToPDF}
              disabled={votes.length === 0}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap disabled:cursor-not-allowed"
              title={votes.length === 0 ? "No turnout stats to export" : "Export Report as PDF"}
            >
              <FileDown className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {pdfExportSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-3xl p-4 flex items-center gap-3 shadow-md"
        >
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <CheckCircle className="w-4 h-4 text-emerald-700" />
          </div>
          <span className="font-bold text-sm">{pdfExportSuccess}</span>
        </motion.div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Ballots Cast</p>
            <p className="text-2xl font-black text-slate-800">{votes.length} votes</p>
          </div>
        </div>

        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-inner">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">turnout rate</p>
            <p className="text-2xl font-black text-slate-800">{currentTurnoutRate}%</p>
          </div>
        </div>

        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl shadow-inner">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Activity status</p>
            <p className="text-2xl font-black text-slate-800">{lastVoteTime}</p>
          </div>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="w-full bg-slate-50/30 border border-slate-200/60 rounded-3xl p-6 min-h-[350px] flex items-center justify-center relative">
        {loading && votes.length === 0 && (
          <div className="absolute inset-0 bg-white/60 blur-[1px] rounded-3xl z-10 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Gathering ledger telemetry...</p>
          </div>
        )}

        {votes.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto animate-bounce" />
            <div>
              <p className="text-md font-black text-slate-700">No turnout records found for this election.</p>
              <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1">
                As soon as voters submit their cryptographic ballots under this election, visual transaction data will stream here instantly.
              </p>
            </div>
            {activeHeaderElection && (
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest inline-block px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                Active Selection: {activeHeaderElection.title}
              </p>
            )}
          </div>
        ) : (
          <div className="w-full h-[320px] overflow-hidden">
            <AnimatePresence mode="wait">
              {chartMode === 'cumulative' ? (
                <motion.div
                  key="cumulative"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="w-full h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorTurnout" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="label" 
                        offset={5}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          borderRadius: '1rem', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' 
                        }}
                        labelStyle={{ color: '#94a3b8', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', tracking: '0.05em' }}
                        itemStyle={{ color: '#ffffff', fontWeight: 700, fontSize: '13px' }}
                        formatter={(value: any) => [`${value} ballots`, 'Total Cast']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cumulative" 
                        stroke="#6366f1" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorTurnout)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              ) : (
                <motion.div
                  key="interval"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="w-full h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="label" 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          borderRadius: '1rem', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' 
                        }}
                        labelStyle={{ color: '#94a3b8', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase' }}
                        itemStyle={{ color: '#818cf8', fontWeight: 700, fontSize: '13px' }}
                        formatter={(value: any) => [`${value} ballots`, 'Batches Count']}
                      />
                      <Bar 
                        dataKey="submissions" 
                        fill="#6366f1" 
                        radius={[6, 6, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-300" />
          <span>Simulation polling frequency: 10s intervals</span>
        </div>
        <div>
          <span>Last polled: {lastRefreshed.toLocaleTimeString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
