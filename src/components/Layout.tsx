import React from 'react';
import { LayoutDashboard, CheckSquare, Users, BarChart3, Settings, Shield, LogOut, Bell, Sun, Moon, Globe } from 'lucide-react';
import { motion } from 'motion/react';

import { AppUser } from '../types';
import { UserRole } from '../types';
import { useI18n, LANGUAGE_OPTIONS, Language } from '../utils/i18n';
// @ts-ignore
import logoImg from '../assets/images/votesecure_ballot_logo_1779949386444.png';

interface LayoutProps {
  children: React.ReactNode;
  user?: AppUser | null;
  onLogout?: () => void;
  activeElection?: string;
  onRoleChange?: (role: UserRole) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Layout({ children, user, onLogout, activeElection, onRoleChange, theme, onToggleTheme }: LayoutProps) {
  const { language, setLanguage, t } = useI18n();
  const initials = user?.displayName?.split(' ').map(n => n[0]).join('').substring(0, 2) || '??';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="h-20 bg-slate-100 border-b border-slate-200/60 px-8 flex items-center justify-between shadow-[0_4px_10px_-4px_rgba(203,213,225,0.7)] z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] border border-white overflow-hidden p-1">
            <img 
              src={logoImg} 
              alt="VoteSecure Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-display font-black tracking-tight text-slate-800">
            {t('appTitle')}<span className="text-indigo-600">HQ</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          {activeElection && (
            <div className="hidden md:flex flex-col items-end border-r border-slate-100 pr-6">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('activeElection')}</span>
              <span className="text-sm font-bold text-slate-700">{activeElection}</span>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="flex items-center gap-1">
              <Globe className="w-4 h-4 text-indigo-500 animate-[spin_8s_linear_infinite] hidden sm:block" />
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="text-xs font-bold text-slate-700 bg-slate-100 border-0 outline-none rounded-xl px-2.5 py-1.5 cursor-pointer hover:bg-slate-200 transition-all shadow-[3px_3px_6px_#cbd5e1,-3px_-3px_6px_#ffffff]"
                data-talkback="Language selector dropdown, select English, Swahili, Luganda or French."
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.flag} {opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-sm font-black text-slate-800">{user?.displayName}</span>
              <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                {user && (user.email === 'ryanmaina4614@gmail.com' || user.email === 'ryanmaina4613@gmail.com' || user.role === UserRole.ADMIN) && onRoleChange ? (
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
            
            {/* Dark / Light Theme Toggle element */}
            <button 
              type="button"
              onClick={onToggleTheme}
              className="flex items-center justify-center w-9 h-9 text-indigo-600 hover:text-indigo-800 dark:text-amber-400 dark:hover:text-amber-300 bg-slate-100 shadow-[3px_3px_6px_#cbd5e1,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#030712,-3px_-3px_6px_#1f2937] active:shadow-[inset_2px_2px_4px_#cbd5e1,inset_-2px_-2px_4px_#ffffff] rounded-xl transition-all"
              title={theme === 'dark' ? t('themeLight') : t('themeDark')}
              data-talkback={`Theme toggler. Current theme is ${theme}. Press to change theme.`}
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {onLogout && (
              <button 
                onClick={onLogout}
                className="flex items-center justify-center w-9 h-9 text-slate-405 hover:text-red-500 bg-slate-100 shadow-[3px_3px_6px_#cbd5e1,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#030712,-3px_-3px_6px_#1f2937] active:shadow-[inset_2px_2px_4px_#cbd5e1,inset_-2px_-2px_4px_#ffffff] rounded-xl transition-all"
                title={t('logoutButton')}
                data-talkback="Log out button. Press to secure logout of your session."
              >
                <LogOut className="w-4 h-4 text-slate-400" />
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
        <div>&copy; 2024 {t('educationLicense')}</div>
        <div className="flex gap-4">
          <span>{t('tagline')}</span>
        </div>
      </footer>
    </div>
  );
}
