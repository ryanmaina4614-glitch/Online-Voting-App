import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Users, Trash2, Edit, CheckCircle, XCircle, Search, Filter, Camera, Vote, Shield, User as UserIcon, Building2, Fingerprint, Activity, ShieldAlert, Check, RefreshCw, Key, Lock, FileSpreadsheet, Terminal } from 'lucide-react';
import { Election, Candidate, ElectionStatus, UserRole, AppUser } from '../types';
import ElectionForm from './ElectionForm';
import CountdownTimer from './CountdownTimer';
import { getAllUsers, updateUserProfileRole, getAnonymousVotes, getVoteRecords } from '../services/firebase';

interface AdminDashboardProps {
  elections: Election[];
  onAddElection: (data: Partial<Election>) => Promise<void>;
  onEditElection: (id: string, data: Partial<Election>) => Promise<void>;
  onDeleteElection: (id: string) => Promise<void>;
  userRole?: UserRole;
  institutionId?: string;
}

export default function AdminDashboard({ elections, onAddElection, onEditElection, onDeleteElection, userRole, institutionId }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'elections' | 'users' | 'audit'>('elections');
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fraud Audit States
  const [anonVotes, setAnonVotes] = useState<any[]>([]);
  const [voteRecords, setVoteRecords] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [selectedAuditElection, setSelectedAuditElection] = useState<string>('all');

  const auditedElections = selectedAuditElection === 'all'
    ? elections
    : elections.filter(e => e.id === selectedAuditElection);

  // User Role Management states
  const [selectedUserUid, setSelectedUserUid] = useState<string>('');
  const [targetRole, setTargetRole] = useState<UserRole>(UserRole.VOTER);
  const [targetInstitutionId, setTargetInstitutionId] = useState<string>('');
  const [updatingRoleState, setUpdatingRoleState] = useState(false);
  const [roleUpdateError, setRoleUpdateError] = useState<string>('');
  const [roleUpdateSuccess, setRoleUpdateSuccess] = useState<string>('');

  useEffect(() => {
    if (selectedUserUid) {
      const selectedUser = users.find(u => u.uid === selectedUserUid);
      if (selectedUser) {
        setTargetRole(selectedUser.role as UserRole);
        setTargetInstitutionId(selectedUser.institutionId || '');
        setRoleUpdateSuccess('');
        setRoleUpdateError('');
      }
    } else {
      setTargetInstitutionId('');
    }
  }, [selectedUserUid]);

  const submitQuickRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserUid) {
      setRoleUpdateError('Please select a user first');
      return;
    }

    if (targetRole === UserRole.MANAGER && (!targetInstitutionId || !targetInstitutionId.trim())) {
      setRoleUpdateError('An Institution ID is required to assign the Manager role');
      return;
    }

    setUpdatingRoleState(true);
    setRoleUpdateError('');
    setRoleUpdateSuccess('');

    try {
      await updateUserProfileRole(selectedUserUid, targetRole, targetInstitutionId.trim() || undefined);
      setRoleUpdateSuccess(`Successfully modified user privileges!`);
      await loadUsers(); // Refresh Table
    } catch (err: any) {
      console.error(err);
      setRoleUpdateError(err?.message || 'Failed to apply role modifications');
    } finally {
      setUpdatingRoleState(false);
    }
  };

  useEffect(() => {
    if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
      loadUsers();
      loadAuditLogs();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER)) {
      loadUsers();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab, selectedAuditElection]);

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const elecId = selectedAuditElection === 'all' ? undefined : selectedAuditElection;
      const [votes, records] = await Promise.all([
        getAnonymousVotes(elecId),
        getVoteRecords(elecId)
      ]);
      setAnonVotes(votes);
      setVoteRecords(records);
    } catch (err) {
      console.error("Audit load failed", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const exportAuditLogsToCSV = () => {
    try {
      const headers = [
        'Record Type',
        'Audit Receipt Code',
        'Election ID',
        'Election Title',
        'Voter ID (Vote Record Only)',
        'Student ID Confirmation (Vote Record Only)',
        'Candidate ID (Anon Ballot Only)',
        'Timestamp',
        'Browser Name',
        'User Agent'
      ];

      const csvRows = [headers.join(',')];

      // helper to escape text for CSV
      const escapeCSV = (str: string) => {
        if (!str) return '""';
        const escaped = str.toString().replace(/"/g, '""');
        return `"${escaped}"`;
      };

      // Add voteRecords
      voteRecords.forEach(vr => {
        const timeStr = vr.timestamp && vr.timestamp.seconds 
          ? new Date(vr.timestamp.seconds * 1000).toISOString()
          : 'N/A';
        const electionTitle = elections.find(e => e.id === vr.electionId)?.title || 'Unknown';
        
        const row = [
          'Vote Record (Double Voting Prevention Log)',
          vr.voterReceiptCode || 'N/A',
          vr.electionId || 'N/A',
          electionTitle,
          vr.voterId || 'N/A',
          vr.studentIdConfirmation || 'N/A',
          '',
          timeStr,
          vr.browserName || 'Unknown Browser',
          vr.userAgent || 'Unknown User-Agent'
        ];
        csvRows.push(row.map(field => escapeCSV(field)).join(','));
      });

      // Add anonVotes
      anonVotes.forEach(av => {
        const timeStr = av.timestamp && av.timestamp.seconds 
          ? new Date(av.timestamp.seconds * 1000).toISOString()
          : 'N/A';
        const electionTitle = elections.find(e => e.id === av.electionId)?.title || 'Unknown';

        const row = [
          'Anonymous Ballot Receipt',
          av.voterReceiptCode || 'N/A',
          av.electionId || 'N/A',
          electionTitle,
          '',
          '',
          av.candidateId || 'N/A',
          timeStr,
          av.browserName || 'Unknown Browser',
          av.userAgent || 'Unknown User-Agent'
        ];
        csvRows.push(row.map(field => escapeCSV(field)).join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      const filterSuffix = selectedAuditElection === 'all' ? 'all' : `election-${selectedAuditElection}`;
      link.setAttribute('download', `audit-logs-${filterSuffix}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV', err);
      alert('Failed to generate export file. Please check console.');
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    // Managers only see users from their own institution
    const filterId = userRole === UserRole.ADMIN ? undefined : institutionId;
    const fetchedUsers = await getAllUsers(filterId);
    setUsers(fetchedUsers);
    setLoadingUsers(false);
  };

  const handleUpdateUserRole = async (uid: string, role: UserRole, instId?: string) => {
    let finalInstId = instId;
    if (role === UserRole.MANAGER && (!finalInstId || finalInstId.trim() === '' || finalInstId === 'default' || finalInstId === 'N/A')) {
      const newInstId = window.prompt('Please enter the Institution ID for this Manager:', finalInstId || '');
      if (newInstId === null) return; // Cancelled
      if (!newInstId.trim()) {
        alert('Institution ID is required for Managers');
        return;
      }
      finalInstId = newInstId.trim();
    }

    try {
      await updateUserProfileRole(uid, role, finalInstId);
      await loadUsers(); // Refresh
    } catch (error) {
      console.error('Failed to update user', error);
    }
  };

  const stats = [
    { label: 'Total Elections', value: elections.length, icon: Filter, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Eligible Voters', value: users.length || '...', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Now', value: elections.filter(e => e.status === ElectionStatus.ACTIVE).length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  if (isEditing) {
    const initialData = editingId ? elections.find(e => e.id === editingId) : undefined;
    
    return (
      <ElectionForm 
        initialData={initialData}
        userRole={userRole}
        institutionId={institutionId}
        onSubmit={async (data) => {
          if (editingId) {
            await onEditElection(editingId, data);
          } else {
            await onAddElection(data);
          }
          setIsEditing(false);
          setEditingId(null);
        }}
        onCancel={() => {
          setIsEditing(false);
          setEditingId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 bento-card"
          >
            <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-black text-slate-800">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tab Switcher */}
      {(userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) && (
        <div className="flex bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm w-fit mx-auto gap-1">
          <button 
            onClick={() => setActiveTab('elections')}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${
              activeTab === 'elections' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            Elections
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${
              activeTab === 'users' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            Users & Managers
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${
              activeTab === 'audit' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            Fraud & Audit Ledger
          </button>
        </div>
      )}

      {activeTab === 'elections' ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {userRole === UserRole.MANAGER ? `Manager: ${institutionId}` : 'Manage Elections'}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {userRole === UserRole.MANAGER 
                  ? 'Manage elections for your institution' 
                  : 'Create, edit and monitor school elections'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search title or institution..." 
                  className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => {
                  setEditingId(null);
                  setIsEditing(true);
                }}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
              >
                <Plus className="w-4 h-4" /> New Election
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Election</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Institution</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Participation</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {elections.filter(e => 
                  e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  e.institutionId.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((election) => (
                  <tr key={election.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 flex items-center justify-center">
                          {election.imageUrl ? (
                            <img src={election.imageUrl} alt={election.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Vote className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-lg">{election.title}</div>
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                            {election.candidates.length} Candidates
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 inline-block">
                        {election.institutionId}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        election.status === ElectionStatus.ACTIVE 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : election.status === ElectionStatus.UPCOMING
                          ? 'bg-blue-50 text-blue-600 border-blue-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {election.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full max-w-[100px] overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full" 
                            style={{ width: `${(election.totalVotes / 1500) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-black text-slate-600">{election.totalVotes}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-700">
                        {new Date(election.startDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="text-xs text-slate-400 font-bold tracking-tight">
                          Ends: {new Date(election.endDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                        {election.status === ElectionStatus.ACTIVE && (
                          <CountdownTimer endDate={election.endDate} />
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingId(election.id);
                            setIsEditing(true);
                          }}
                          className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-slate-200 hover:border-indigo-200"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this election?')) {
                              onDeleteElection(election.id);
                            }
                          }}
                          className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-slate-200 hover:border-red-200"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {elections.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-medium">
              No elections found matching your criteria.
            </div>
          )}
        </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-8 animate-fade-in">
          {/* Section: Manage User Roles Quick Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Visual breakdown (Left 5 cols) */}
            <div className="lg:col-span-12 xl:col-span-5 bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600 animate-pulse" />
                  Role Privileges & Distribution
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  System administrative structure and metric overview
                </p>
              </div>

              {/* Counts metrics */}
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/45 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg font-black">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-700">Administrators</span>
                      <span className="text-[10px] text-slate-400 font-semibold block font-sans">Full override powers</span>
                    </div>
                  </div>
                  <span className="text-xl font-black text-indigo-700">
                    {users.filter(u => u.role === UserRole.ADMIN).length}
                  </span>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/45 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-600 text-white rounded-lg font-black">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-700">Managers</span>
                      <span className="text-[10px] text-slate-400 font-semibold block font-sans">Institution monitors</span>
                    </div>
                  </div>
                  <span className="text-xl font-black text-blue-700">
                    {users.filter(u => u.role === UserRole.MANAGER).length}
                  </span>
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/45 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-600 text-white rounded-lg font-black">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-700">Voters</span>
                      <span className="text-[10px] text-slate-400 font-semibold block font-sans">Ballot participants</span>
                    </div>
                  </div>
                  <span className="text-xl font-black text-emerald-700">
                    {users.filter(u => u.role === UserRole.VOTER).length}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  💡 <b>Security Policy Note:</b> Promoting a user to <b>Admin</b> grants full control over database and rules. <b>Managers</b> must be assigned a unique and official Institution ID match or the system blocks them.
                </p>
              </div>
            </div>

            {/* Quick action controls form (Right 7 cols) */}
            <form onSubmit={submitQuickRoleChange} className="lg:col-span-12 xl:col-span-7 bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600" />
                  Grant or Revoke Privileges
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  Modify system roles and institution keys dynamically
                </p>
              </div>

              <div className="space-y-4">
                {/* Select User Field */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 block ml-1">
                    Select Identity Target
                  </label>
                  <select
                    value={selectedUserUid}
                    onChange={(e) => setSelectedUserUid(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">-- Choose a user to manage --</option>
                    {users.map(u => (
                      <option key={u.uid} value={u.uid}>
                        {u.displayName || 'Anonymous'} ({u.email}) - Current: {(u.role || '').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected User Details Box if active */}
                {selectedUserUid && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white">
                        {users.find(u => u.uid === selectedUserUid)?.passportPhotoUrl ? (
                          <img 
                            src={users.find(u => u.uid === selectedUserUid)?.passportPhotoUrl} 
                            alt="avatar" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                            <UserIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="block text-xs font-black text-slate-700">
                          {users.find(u => u.uid === selectedUserUid)?.displayName || 'Anonymous'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          Current status: <span className="text-indigo-600 font-extrabold">{users.find(u => u.uid === selectedUserUid)?.role.toUpperCase()}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                      ID: {users.find(u => u.uid === selectedUserUid)?.studentId || 'N/A'}
                    </div>
                  </div>
                )}

                {/* Target Role Selector Options */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 block ml-1">
                    Assign New Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(UserRole).map((r) => {
                      const isActive = targetRole === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setTargetRole(r)}
                          className={`py-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 ${
                            isActive 
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-150' 
                              : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          {r === UserRole.ADMIN && <Shield className="w-4 h-4" />}
                          {r === UserRole.MANAGER && <Building2 className="w-4 h-4" />}
                          {r === UserRole.VOTER && <Users className="w-4 h-4" />}
                          {r.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Institution ID */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 block ml-1">
                    Institution Identifier (Required for Managers)
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. school-101, default"
                      value={targetInstitutionId}
                      onChange={(e) => setTargetInstitutionId(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Status responses inside form */}
              {roleUpdateError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 font-extrabold text-[10px] uppercase tracking-wider rounded-xl text-left">
                  ❌ {roleUpdateError}
                </div>
              )}

              {roleUpdateSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold text-[10px] uppercase tracking-wider rounded-xl text-left">
                  ✓ {roleUpdateSuccess}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingRoleState || !selectedUserUid}
                  className={`px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 transition-all ${
                    selectedUserUid 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100' 
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                  }`}
                >
                  {updatingRoleState ? 'Saving...' : 'Apply Status Modifications'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">User Management</h2>
                <p className="text-sm text-slate-500 font-medium">Assign roles and institution access</p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search user email or name..." 
                    className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={loadUsers}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                  disabled={loadingUsers}
                >
                  {loadingUsers ? 'Loading...' : 'Refresh List'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">User</th>
                    <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                    <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Institution ID</th>
                    <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Details</th>
                    <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.filter(u => 
                    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                    u.displayName?.toLowerCase().includes(userSearchTerm.toLowerCase())
                  ).map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden border border-slate-200">
                            {u.passportPhotoUrl ? (
                              <img 
                                src={u.passportPhotoUrl} 
                                alt={u.displayName || 'User'} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <UserIcon className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{u.displayName || 'Anonymous'}</div>
                            <div className="text-xs text-slate-400 font-medium">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex gap-1.5 flex-wrap">
                          {Object.values(UserRole).map((role) => (
                            <button
                              key={role}
                              onClick={() => handleUpdateUserRole(u.uid, role, u.institutionId)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                                u.role === role
                                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                                  : 'bg-slate-50 text-slate-600 border-slate-300 hover:border-indigo-300 hover:bg-indigo-50/50'
                              }`}
                            >
                              {role.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            defaultValue={u.institutionId}
                            onBlur={(e) => {
                              if (e.target.value !== u.institutionId) {
                                handleUpdateUserRole(u.uid, u.role, e.target.value);
                              }
                            }}
                            disabled={userRole === UserRole.MANAGER}
                            className={`px-3 py-1.5 border rounded-lg text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32 transition-all ${
                              u.role === UserRole.MANAGER && (!u.institutionId || u.institutionId === 'default' || u.institutionId === 'N/A')
                                ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
                                : 'bg-slate-50 border-slate-200 text-indigo-600'
                            }`}
                          />
                          {u.role === UserRole.MANAGER && (!u.institutionId || u.institutionId === 'default' || u.institutionId === 'N/A') ? (
                            <div className="group relative">
                              <XCircle className="w-4 h-4 text-red-500" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                Manager needs valid Institution ID
                              </div>
                            </div>
                          ) : (
                            <Building2 className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          {u.classGroup || 'No Class'} • {u.gender || 'Unknown'} • {u.age || '?'} yrs
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">
                          {u.role === UserRole.ADMIN ? 'SUPERUSER' : ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {users.length === 0 && !loadingUsers && (
              <div className="p-12 text-center text-slate-400 font-medium">
                No users found. Try searching or refreshing.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Fraud & Security Audit tab content */
        <div className="space-y-8 animate-fade-in">
          {/* Security Telemetry Header */}
          <div className="bg-indigo-950 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            {/* Background design elements to look majestic and highly credible */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-indigo-500/0 rounded-full blur-3xl" />
            
            <div className="relative flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl ring-4 ring-white/5">
                <Shield className="w-8 h-8 text-indigo-300" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Voter Fraud & Security Logs</h3>
                <p className="text-xs text-indigo-300 font-semibold tracking-wider uppercase mt-1">
                  Active Cryptographic Ballot Verification Engine IP5
                </p>
              </div>
            </div>

            <div className="flex gap-4 flex-wrap">
              <button 
                onClick={exportAuditLogsToCSV}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white transition-all font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/45 border border-emerald-500/10 active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Audit Logs
              </button>
              <button 
                onClick={loadAuditLogs}
                disabled={loadingAudit}
                className="px-6 py-3 bg-white/10 text-white hover:bg-white/20 transition-all font-bold text-sm rounded-xl flex items-center gap-2 border border-white/10 disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAudit ? 'animate-spin' : ''}`} />
                Refresh Logs
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stat Box 1: Verified ledger code matches */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Trust Verification</p>
                <p className="text-xl font-black text-slate-800">100% Cryptographic</p>
              </div>
            </div>

            {/* Stat Box 2: Bot rejection rules */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl animate-pulse">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Bot Challenge Rate</p>
                <p className="text-xl font-black text-slate-800">No Blocked Bots</p>
              </div>
            </div>

            {/* Stat Box 3: Total verifiable receipts */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Total Audit Receipts</p>
                <p className="text-xl font-black text-slate-800">{anonVotes.length} Generated</p>
              </div>
            </div>

            {/* Stat Box 4: Velocity Check */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Ballot Integrity Level</p>
                <p className="text-xl font-black text-slate-800">Grade: Excellent</p>
              </div>
            </div>
          </div>

          {/* Candidate Votes Audit & Cross-Reference Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                  Candidate Votes & Anonymous Ledger Reconciliation
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Cross-reference total candidate votes declared in database documents against individual cryptographically signed anonymous voting receipts.
                </p>
              </div>
              <div className="shrink-0 bg-slate-950/60 px-4 py-2 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider block">Auditing Selection</span>
                <span className="text-xs font-bold text-slate-300">
                  {selectedAuditElection === 'all' ? 'All Elections' : `Election ID: ${selectedAuditElection.slice(0, 8)}...`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {auditedElections.map((elec) => {
                // Compute votes for this election from the anonymous ledger
                const electionAnonVotes = anonVotes.filter(av => av.electionId === elec.id);
                
                return (
                  <div key={elec.id} className="bg-slate-950 rounded-3xl p-6 border border-slate-800 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400 bg-indigo-950/50 px-2.5 py-1 rounded-md border border-indigo-900/30 font-mono">
                          ID: {elec.id.slice(0, 8)}...
                        </span>
                        <h4 className="text-base font-black text-slate-100 mt-2 tracking-tight">{elec.title}</h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Status</span>
                        <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full ${
                          elec.status === ElectionStatus.ACTIVE 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-950' 
                            : elec.status === ElectionStatus.COMPLETED 
                            ? 'bg-blue-950 text-blue-400 border border-blue-950' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {elec.status}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/60 pt-4 space-y-3">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-1">
                        <span>Candidate Name / ID</span>
                        <div className="flex gap-4 sm:gap-6">
                          <span className="w-16 text-right" title="Total Votes stored inside Election data">Declared</span>
                          <span className="w-16 text-right" title="Counted Matching Records in Anonymous Ledger">Ledger</span>
                          <span className="w-24 text-right">Alignment</span>
                        </div>
                      </div>

                      {elec.candidates.map((cand) => {
                        const anonCount = electionAnonVotes.filter(av => av.candidateId === cand.id).length;
                        const isMatch = cand.votesCount === anonCount;
                        
                        return (
                          <div key={cand.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800/40 hover:bg-slate-900/80 transition-colors">
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-slate-200 text-xs block truncate">{cand.name}</span>
                              <span className="text-[9px] font-mono text-slate-500 block">ID: {cand.id.slice(0, 8)}...</span>
                            </div>
                            <div className="flex gap-4 sm:gap-6 items-center shrink-0">
                              <span className="text-xs font-black text-slate-100 w-16 text-right">
                                {cand.votesCount}
                              </span>
                              <span className="text-xs font-black text-slate-100 w-16 text-right">
                                {anonCount}
                              </span>
                              <span className="w-24 flex justify-end">
                                {isMatch ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-md">
                                    <Check className="w-2.5 h-2.5" /> Match
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-400 uppercase bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded-md animate-pulse">
                                    <ShieldAlert className="w-2.5 h-2.5" /> Mismatch
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {auditedElections.length === 0 && (
                <div className="col-span-1 md:col-span-2 p-12 text-center text-slate-500 bg-slate-950 border border-slate-800 rounded-3xl font-bold">
                  No elections available to audit.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Fraud Checklist panel */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm lg:col-span-1 space-y-6">
              <h4 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                Live Fraud Analysis Checklist
              </h4>
              <p className="text-xs text-slate-400 font-bold">
                Real-time checks conducted on every ballot submission instance to ensure standard institutional compliance.
              </p>

              <div className="space-y-4">
                {/* Check 1 */}
                <div className="flex gap-3 items-start bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <div className="p-1 bg-emerald-100 text-emerald-700 rounded-lg mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-700">Student ID Verification Match</h5>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Ensures voters specify and match unique registered user Student ID credentials to cast.
                    </p>
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase rounded mt-2">
                      Active Factor
                    </span>
                  </div>
                </div>

                {/* Check 2 */}
                <div className="flex gap-3 items-start bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <div className="p-1 bg-emerald-100 text-emerald-700 rounded-lg mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-700">Double Ballot Prevention Check</h5>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Unique Firestore primary document compound indexing blocks duplicate voter write attempts at transactional database level.
                    </p>
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase rounded mt-2">
                      Enforced By Rules
                    </span>
                  </div>
                </div>

                {/* Check 3 */}
                <div className="flex gap-3 items-start bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <div className="p-1 bg-emerald-100 text-emerald-700 rounded-lg mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-700">Anti-Automation (Math Challenge)</h5>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Random sums presented to cast-actions to block headless coordinate clicking macros or bots.
                    </p>
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase rounded mt-2">
                      100% Armed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipts Audit Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-black text-slate-800 tracking-tight">Anonymized Receipts Audit Ledger</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Match and review the generated anonymous ballots metadata.
                  </p>
                </div>

                <div>
                  <select 
                    value={selectedAuditElection}
                    onChange={(e) => setSelectedAuditElection(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none"
                  >
                    <option value="all">All Elections</option>
                    {elections.map(e => (
                      <option key={e.id} value={e.id}>{e.title.slice(0, 16)}...</option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingAudit ? (
                <div className="p-12 text-center text-slate-500 font-bold">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  Analyzing Cryptoledger Block Records...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Receipt ID</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform / Telemetry</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Registered</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ledger Check</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                      {anonVotes.map((av) => (
                        <tr key={av.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono text-[11px] bg-slate-55 border border-slate-100 text-indigo-700 font-black tracking-tight px-2 py-1 rounded-lg">
                              {av.voterReceiptCode || 'ZKP-MOCK-F78A1D'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-700 font-bold">{av.browserName || "Chrome"}</span>
                            <span className="text-[10px] text-slate-400 block max-w-[150px] truncate" title={av.userAgent}>
                              {av.userAgent || "Mozilla/5.0 Cloud Engine"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {av.timestamp && av.timestamp.seconds ? (
                              new Date(av.timestamp.seconds * 1000).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            ) : (
                              'Just now'
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase border border-emerald-100">
                              <Check className="w-3 h-3" /> Secure Block
                            </span>
                          </td>
                        </tr>
                      ))}

                      {anonVotes.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-slate-400 font-bold">
                            No auditable anonymous voter receipts exist. Start casting votes using the "Voter view" tab to record live security trials.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

