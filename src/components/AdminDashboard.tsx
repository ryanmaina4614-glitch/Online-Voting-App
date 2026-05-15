import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Users, Trash2, Edit, CheckCircle, XCircle, Search, Filter, Camera } from 'lucide-react';
import { Election, Candidate, ElectionStatus } from '../types';
import ElectionForm from './ElectionForm';

interface AdminDashboardProps {
  elections: Election[];
  onAddElection: (data: Partial<Election>) => Promise<void>;
  onEditElection: (id: string, data: Partial<Election>) => Promise<void>;
}

export default function AdminDashboard({ elections, onAddElection, onEditElection }: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const stats = [
    { label: 'Total Elections', value: elections.length, icon: Filter, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Voters', value: '1,248', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Now', value: elections.filter(e => e.status === ElectionStatus.ACTIVE).length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  if (isEditing) {
    const initialData = editingId ? elections.find(e => e.id === editingId) : undefined;
    
    return (
      <ElectionForm 
        initialData={initialData}
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

      {/* Elections Management */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manage Elections</h2>
            <p className="text-sm text-slate-500 font-medium">Create, edit and monitor school elections</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search elections..." 
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
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Participation</th>
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {elections.map((election) => (
                <tr key={election.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-800 text-lg">{election.title}</div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                      {election.candidates.length} Candidates
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
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-slate-600">
                      {new Date(election.startDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-400 font-medium tracking-tight">
                      Ends: {new Date(election.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingId(election.id);
                          setIsEditing(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
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
    </div>
  );
}
