import React from 'react';
import { LayoutDashboard, CheckSquare, Users, BarChart3, Settings, Shield, LogOut, Bell } from 'lucide-react';
import { motion } from 'motion/react';

import { AppUser } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user?: AppUser;
  onLogout?: () => void;
  activeElection?: string;
}

export default function Layout({ children, user, onLogout, activeElection }: LayoutProps) {
  const initials = user?.displayName?.split(' ').map(n => n[0]).join('').substring(0, 2) || '??';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            VoteSecure<span className="text-indigo-600">HQ</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          {activeElection && (
            <div className="hidden md:flex flex-col items-end border-r border-slate-100 pr-6">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Election</span>
              <span className="text-sm font-bold text-slate-700">{activeElection}</span>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-black text-slate-800">{user?.displayName}</span>
              {(user?.classGroup || user?.age) && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {user.classGroup}{user.age ? ` • Age ${user.age}` : ''}
                </span>
              )}
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors">
              {initials}
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="h-12 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-xs font-medium text-slate-400">
        <div>&copy; 2024 VoteSecure Systems • Education License</div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            System Status: <span className="text-emerald-500 font-bold uppercase">Operational</span>
          </span>
          <span className="hidden sm:inline">Server: US-EAST-1</span>
        </div>
      </footer>
    </div>
  );
}
