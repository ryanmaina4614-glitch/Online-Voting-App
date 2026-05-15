import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Shield, Lock, LogIn, UserPlus, Mail, Key, User, Calendar, BookOpen, Users } from 'lucide-react';

interface AuthViewProps {
  onGoogleLogin: () => void;
  onEmailLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (data: any) => Promise<void>;
  loading?: boolean;
}

export default function AuthView({ onGoogleLogin, onEmailLogin, onRegister, loading }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [classGroup, setClassGroup] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (mode === 'login') {
        await onEmailLogin(email, password);
      } else {
        if (!displayName || !age || !gender || !classGroup) {
          setError('Please fill in all fields');
          return;
        }
        await onRegister({
          email,
          password,
          displayName,
          age,
          gender,
          classGroup
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-slate-100 p-8 md:p-10 flex flex-col items-center"
      >
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-6 transform -rotate-3">
          <CheckSquare className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Join VoteSecure'}
        </h2>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm text-center">
          {mode === 'login' 
            ? 'Access your secure, anonymous voting dashboard.' 
            : 'Register your details to participate in school elections.'}
        </p>

        {error && (
          <div className="w-full mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {mode === 'register' && (
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Full Name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number"
                    placeholder="Age"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all text-sm"
                  />
                </div>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all text-sm appearance-none"
                  >
                    <option value="">Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Class / Group (e.g. Grade 11A)"
                  required
                  value={classGroup}
                  onChange={(e) => setClassGroup(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
            />
          </div>

          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />
            )}
            {mode === 'login' ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        <div className="relative w-full my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-xs font-black uppercase tracking-widest text-slate-400">
            <span className="px-4 bg-white">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={onGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 py-4 px-6 rounded-2xl font-bold text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95 disabled:opacity-50"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Google Account
        </button>

        <p className="mt-8 text-sm font-bold text-slate-500">
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="text-indigo-600 hover:underline"
          >
            {mode === 'login' ? 'Register Now' : 'Sign In'}
          </button>
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4 w-full border-t border-slate-50 pt-8 opacity-60">
          <div className="flex flex-col items-center gap-1">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Encrypted</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Lock className="w-4 h-4 text-blue-600" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Anonymous</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
