/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AuthView from './components/AuthView';
import VotingInterface from './components/VotingInterface';
import AdminDashboard from './components/AdminDashboard';
import { UserRole, Election, ElectionStatus, AppUser } from './types';
import { 
  getFirebase, 
  loginWithGoogle, 
  logout, 
  getElections, 
  castVote, 
  createElection,
  updateElection,
  getUserProfile,
  setUserProfile,
  registerWithEmail,
  loginWithEmail
} from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [view, setView] = useState<'dashboard' | 'voting' | 'admin' | 'auth'>('auth');
  const [loading, setLoading] = useState(true);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  // Initial Data Fetch & Auth state
  useEffect(() => {
    const initApp = async () => {
      const { auth } = await getFirebase();
      if (!auth) {
        setLoading(false);
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const profile = await getUserProfile(firebaseUser.uid);
          
          const isAdmin = firebaseUser.email === 'ryanmaina4614@gmail.com'; 
          
          const userData: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: profile?.displayName || firebaseUser.displayName || 'Voter',
            role: profile?.role || (isAdmin ? UserRole.ADMIN : UserRole.VOTER),
            votedElections: profile?.votedElections || [],
            age: profile?.age,
            gender: profile?.gender,
            classGroup: profile?.classGroup
          };

          // If profile doesn't exist, create it (mainly for first-time Google login)
          if (!profile) {
            await setUserProfile(userData.uid, userData);
          }

          setUser(userData);
          await refreshData();
          setView('dashboard');
        } else {
          setUser(null);
          setView('auth');
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    let unsubscribe: any;
    initApp().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const refreshData = async () => {
    const data = await getElections();
    setElections(data);
    
    // Seed data if empty (for demo purposes)
    if (data.length === 0) {
      console.log("Seeding initial data...");
      try {
        await createElection({
          title: 'Student Council Election 2024',
          description: 'Vote for your representative in the school council. Your vote is anonymous and secure.',
          status: ElectionStatus.ACTIVE,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          candidates: [
            { id: 'c1', name: 'Marcus Thorne', bio: 'Unity and progress.', votesCount: 0 },
            { id: 'c2', name: 'Elena Rodriguez', bio: 'Community first.', votesCount: 0 },
            { id: 'c3', name: 'Sarah Jenkins', bio: 'Transparency.', votesCount: 0 }
          ]
        });
        const freshData = await getElections();
        setElections(freshData);
      } catch (e) {
        console.error("Failed to seed data", e);
      }
    }
  };

  const activeElection = elections.find(e => e.status === ElectionStatus.ACTIVE) || elections[0];

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Login failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await loginWithEmail(email, pass);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const handleRegister = async (data: any) => {
    setLoading(true);
    try {
      await registerWithEmail(data);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setView('auth');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleCastVote = async (candidateId: string) => {
    if (!activeElection) return;
    setIsSubmittingVote(true);
    try {
      await castVote(activeElection.id, candidateId);
      await refreshData();
      if (user) {
        setUser({
          ...user,
          votedElections: [...user.votedElections, activeElection.id]
        });
      }
      setView('dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : "Vote failed");
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleAddElection = async (data: Partial<Election>) => {
    await createElection(data);
    await refreshData();
  };

  const handleEditElection = async (id: string, data: Partial<Election>) => {
    await updateElection(id, data);
    await refreshData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (view === 'auth') {
    return (
      <AuthView 
        onGoogleLogin={handleGoogleLogin} 
        onEmailLogin={handleEmailLogin}
        onRegister={handleRegister}
        loading={loading} 
      />
    );
  }

  return (
    <Layout 
      user={user || undefined} 
      onLogout={handleLogout}
      activeElection={activeElection?.title}
    >
      <div className="mb-8 flex items-center justify-between">
        {user?.role === UserRole.ADMIN && (
          <div className="flex bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm w-fit">
            <button 
              onClick={() => setView('dashboard')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                view === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'
              }`}
            >
              Voter View
            </button>
            <button 
              onClick={() => setView('admin')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                view === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'
              }`}
            >
              Admin Controls
            </button>
          </div>
        )}
      </div>

      {view === 'dashboard' ? (
        <Dashboard 
          activeElection={activeElection || null} 
          onVoteClick={() => setView('voting')}
          isAdmin={user?.role === UserRole.ADMIN}
        />
      ) : view === 'admin' ? (
        <AdminDashboard 
          elections={elections} 
          onAddElection={handleAddElection}
          onEditElection={handleEditElection}
        />
      ) : (
        activeElection && (
          <VotingInterface 
            election={activeElection}
            onBack={() => setView('dashboard')}
            onVote={handleCastVote}
            isSubmitting={isSubmittingVote}
          />
        )
      )}
    </Layout>
  );
}


