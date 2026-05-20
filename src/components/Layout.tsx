import React from 'react';
import { LayoutDashboard, CheckSquare, Users, BarChart3, Settings, Shield, LogOut, Bell } from 'lucide-react';
import { motion } from 'motion/react';

import { AppUser } from '../types';

import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user?: AppUser;
  onLogout?: () => void;
  activeElection?: string;
  onRoleChange?: (role: UserRole) => void;
}

export default function Layout({ children, user, onLogout, activeElection, onRoleChange }: LayoutProps) {
  const initials = user?.displayName?.split(' ').map(n => n[0]).join('').substring(0, 2) || '??';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="h-20 bg-slate-100 border-b border-slate-200/60 px-8 flex items-center justify-between shadow-[0_4px_10px_-4px_rgba(203,213,225,0.7)] z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] border border-white">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-display font-black tracking-tight text-slate-800">
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
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-sm font-black text-slate-800">{user?.displayName}</span>
              <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                {user && (user.email === 'ryanmaina4614@gmail.com' || user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) && onRoleChange ? (
                  <select 
                    value={user.role} 
                    onChange={(e) => onRoleChange(e.target.value as UserRole)}
                    className="text-[9px] font-extrabold uppercase text-indigo-600 bg-slate-200 border-0 outline-none rounded-lg px-2 py-0.5 cursor-pointer hover:bg-slate-300 transition-all shadow-[inset_1px_1px_2px_#cbd5e1,inset_-1px_-1px_2px_#ffffff]"
                  >
                    <option value={UserRole.ADMIN}>🔧 Admin</option>
                    <option value={UserRole.MANAGER}>🛡️ Manager</option>
                    <option value={UserRole.VOTER}>👤 Voter</option>
                  </select>
                ) : user?.role ? (
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50/80 border border-indigo-200/50 px-2 py-0.5 rounded-md">
                    {user.role}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-100 shadow-[2px_2px_5px_#cbd5e1,-2px_-2px_5px_#ffffff] border-2 border-white flex items-center justify-center font-black text-slate-600 cursor-pointer overflow-hidden relative shrink-0">
              {user?.passportPhotoUrl ? (
                <img 
                  src={user.passportPhotoUrl} 
                  alt={user?.displayName || 'Avatar'} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="flex items-center justify-center w-9 h-9 text-slate-400 hover:text-red-500 bg-slate-100 shadow-[3px_3px_6px_#cbd5e1,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#cbd5e1,inset_-2px_-2px_4px_#ffffff] rounded-xl transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
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
      <footer className="h-14 bg-slate-100 border-t border-slate-200/50 px-8 flex items-center justify-between text-xs font-bold text-slate-500">
        <div>&copy; 2024 VoteSecure Systems • Education License</div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            System Status: <span className="text-emerald-600 font-extrabold uppercase">Operational</span>
          </span>
          <span className="hidden sm:inline">Server: US-EAST-1</span>
        </div>
      </footer>
    </div>
  );
}
