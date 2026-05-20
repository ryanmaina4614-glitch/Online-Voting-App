/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AuthView from './components/AuthView';
import VotingInterface from './components/VotingInterface';
import AdminDashboard from './components/AdminDashboard';
import LandingView from './components/LandingView';
import { UserRole, Election, ElectionStatus, AppUser } from './types';
import { getCorrectedStatus } from './utils';
import { 
  getFirebase, 
  loginWithGoogle, 
  logout, 
  getElections, 
  castVote, 
  createElection,
  updateElection,
  deleteElection,
  getUserProfile,
  setUserProfile,
  registerWithEmail,
  loginWithEmail,
  uploadPassportPhoto
} from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [view, setView] = useState<
    'landing' | 
    'voter-dashboard' | 
    'manager-dashboard' | 
    'admin-dashboard' | 
    'guest-dashboard' | 
    'voting' | 
    'auth' | 
    'complete-profile'
  >('auth');
  const [loading, setLoading] = useState(true);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [lastVoteReceipt, setLastVoteReceipt] = useState<string | null>(null);
  const [showReceiptBanner, setShowReceiptBanner] = useState(false);
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const isRegisteringRef = React.useRef(false);

  // Initial Data Fetch & Auth state
  useEffect(() => {
    const initApp = async () => {
      const { auth } = await getFirebase();
      if (!auth) {
        setLoading(false);
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (isRegisteringRef.current) {
          return;
        }
        if (firebaseUser) {
          const profile = await getUserProfile(firebaseUser.uid);
          
          const isAdmin = firebaseUser.email === 'ryanmaina4614@gmail.com'; 
          
          const userData: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: profile?.displayName || firebaseUser.displayName || 'Voter',
            role: profile?.role || (isAdmin ? UserRole.ADMIN : UserRole.VOTER),
            institutionId: profile?.institutionId || '',
            studentId: profile?.studentId || '',
            votedElections: profile?.votedElections || [],
            age: profile?.age || 0,
            gender: profile?.gender || '',
            classGroup: profile?.classGroup || '',
            passportPhotoUrl: profile?.passportPhotoUrl || ''
          };

          // Check if profile is complete (except for global admins who are pre-configured)
          const isProfileComplete = isAdmin || (
            userData.displayName && 
            userData.institutionId && 
            userData.studentId && 
            userData.age > 0 && 
            userData.gender && 
            userData.classGroup &&
            userData.passportPhotoUrl
          );

          if (!profile && isAdmin) {
            // Auto-create profile for admin
            await setUserProfile(userData.uid, userData);
            const { db } = await import('./services/firebase').then(m => m.getFirebase());
            if (db) {
              const { doc, setDoc } = await import('firebase/firestore');
              await setDoc(doc(db, 'admins', userData.uid), { email: userData.email, role: 'admin' });
            }
          }

          setUser(userData);
          
          if (isProfileComplete) {
            await refreshData(userData);
            setView('landing');
          } else {
            setView('complete-profile' as any);
          }
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

  // Periodic status auto-update check every 10 seconds
  useEffect(() => {
    if (elections.length === 0) return;

    const interval = setInterval(async () => {
      let changed = false;
      const updatedElections = await Promise.all(
        elections.map(async (election) => {
          const correctStatus = getCorrectedStatus(election.startDate, election.endDate);
          if (election.status !== correctStatus) {
            changed = true;
            console.log(`Auto status update for "${election.title}": ${election.status} -> ${correctStatus}`);
            if (user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER) {
              try {
                await updateElection(election.id, { status: correctStatus });
              } catch (err) {
                console.error('Failed auto status update to Firestore', err);
              }
            }
            return { ...election, status: correctStatus };
          }
          return election;
        })
      );

      if (changed) {
        setElections(updatedElections);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [elections, user]);

  const refreshData = async (userProfile?: AppUser) => {
    const currentUser = userProfile || user;
    // Only filter for non-global admins. Admins see all. Managers see their own.
    const filterId = currentUser?.role === UserRole.ADMIN ? undefined : currentUser?.institutionId;
    const data = await getElections(filterId);
    
    // Sync statuses for admins and managers
    if (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER) {
      const syncPromises = data.map(async (election) => {
        const correctStatus = getCorrectedStatus(election.startDate, election.endDate);
        if (election.status !== correctStatus) {
          console.log(`Syncing status for election "${election.title}": ${election.status} -> ${correctStatus}`);
          await updateElection(election.id, { status: correctStatus });
          return { ...election, status: correctStatus };
        }
        return election;
      });
      
      const syncedData = await Promise.all(syncPromises);
      setElections(syncedData);
    } else {
      const voterCorrectedData = data.map(election => {
        const correctStatus = getCorrectedStatus(election.startDate, election.endDate);
        if (election.status !== correctStatus) {
          return { ...election, status: correctStatus };
        }
        return election;
      });
      setElections(voterCorrectedData);
    }
    
    // Seed data if empty (for demo purposes)
    const currentData = currentUser?.role === UserRole.ADMIN ? data : data;
    if (data.length === 0 && currentUser?.role === UserRole.ADMIN) {
      console.log("Seeding initial data...");
      try {
        await createElection({
          title: 'Student Council Election 2024',
          description: 'Vote for your representative in the school council. Your vote is anonymous and secure.',
          institutionId: currentUser?.institutionId || 'default',
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

  const activeElection = elections.find(e => e.id === selectedElectionId) || 
                         elections.find(e => e.status === ElectionStatus.ACTIVE) || 
                         elections[0];

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
    isRegisteringRef.current = true;
    try {
      const registeredUser = await registerWithEmail(data);
      setUser(registeredUser);
      await refreshData(registeredUser);
      setView('landing');
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      isRegisteringRef.current = false;
    }
  };

  const handleUpdateProfile = async (data: any) => {
    if (!user) return;
    setLoading(true);
    try {
      let photoUrl = user.passportPhotoUrl || '';
      if (data.passportFile) {
        try {
          photoUrl = await uploadPassportPhoto(data.passportFile);
        } catch (uploadErr) {
          console.error('Passport photo upload failed:', uploadErr);
          throw new Error('Failed to upload your passport photo. Please check your network or image size.');
        }
      }

      const updatedUser = { 
        ...user, 
        ...data, 
        passportPhotoUrl: photoUrl 
      };
      delete updatedUser.passportFile; // Remove file reference before saving to firestore

      await setUserProfile(user.uid, updatedUser);
      setUser(updatedUser);
      // Re-check profile completeness and refresh
      const isProfileComplete = (
        updatedUser.displayName && 
        updatedUser.institutionId && 
        updatedUser.studentId && 
        updatedUser.age > 0 && 
        updatedUser.gender && 
        updatedUser.classGroup &&
        updatedUser.passportPhotoUrl
      );
      if (isProfileComplete) {
        await refreshData(updatedUser);
        setView('landing');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!user) return;
    try {
      await setUserProfile(user.uid, { role: newRole });
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      await refreshData(updatedUser);
      if (view !== 'landing' && view !== 'voting' && view !== ('complete-profile' as any) && view !== 'auth') {
        navigateToUserDashboard(updatedUser);
      }
    } catch (err) {
      console.error('Failed to change role', err);
    }
  };

  const handleDemoLogin = async (role: 'manager' | 'voter') => {
    setLoading(true);
    const email = role === 'manager' ? 'demo-manager@votesecure.com' : 'demo-voter@votesecure.com';
    const password = role === 'manager' ? 'Manager123!' : 'Voter123!';
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      console.log('Demo account not found, auto-registering standard account...');
      try {
        const demoData = role === 'manager' ? {
          email,
          password,
          role: 'manager',
          displayName: 'Dean Clara Windcrest',
          studentId: 'MGR-2024-77',
          age: '32',
          gender: 'female',
          classGroup: 'Faculty Administration',
          institutionId: 'default',
          passportPhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'
        } : {
          email,
          password,
          role: 'voter',
          displayName: 'Alex Rivera',
          studentId: 'STU-2024-098',
          age: '21',
          gender: 'male',
          classGroup: 'Computer Science - Year 3',
          institutionId: 'default',
          passportPhotoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'
        };
        const registeredUser = await registerWithEmail(demoData);
        setUser(registeredUser);
        await refreshData(registeredUser);
        setView('landing');
      } catch (regError) {
        console.error('Failed to register demo user:', regError);
        alert('Failed to launch fast-track lab portal. Please try standard sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToUserDashboard = (currentUser: AppUser | null) => {
    if (!currentUser) {
      setView('auth');
      return;
    }
    switch (currentUser.role) {
      case UserRole.ADMIN:
        setView('admin-dashboard');
        break;
      case UserRole.MANAGER:
        setView('manager-dashboard');
        break;
      case UserRole.VOTER:
        setView('voter-dashboard');
        break;
      case UserRole.GUEST:
        setView('guest-dashboard');
        break;
      default:
        setView('voter-dashboard');
    }
  };

  const handleContinueAsGuest = () => {
    const guestUser: AppUser = {
      uid: 'guest-user',
      email: '',
      displayName: 'Guest Viewer',
      role: UserRole.GUEST,
      institutionId: 'Public Domain',
      studentId: 'GUEST-000',
      votedElections: [],
      age: 0,
      classGroup: 'Guest Spectator',
      gender: '',
      passportPhotoUrl: ''
    };
    setUser(guestUser);
    setView('landing');
  };

  const handleLogout = async () => {
    try {
      if (user?.role !== UserRole.GUEST) {
        await logout();
      }
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setUser(null);
      setView('auth');
    }
  };

  const handleCastVote = async (
    candidateId: string, 
    studentIdConf: string, 
    voterReceipt: string, 
    tracking: any
  ) => {
    if (!activeElection) return;
    setIsSubmittingVote(true);
    try {
      await castVote(activeElection.id, candidateId, studentIdConf, voterReceipt, tracking);
      await refreshData();
      if (user) {
        setUser({
          ...user,
          votedElections: [...user.votedElections, activeElection.id]
        });
      }
      setLastVoteReceipt(voterReceipt);
      setShowReceiptBanner(true);
      setView('voter-dashboard');
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

  const handleDeleteElection = async (id: string) => {
    await deleteElection(id);
    await refreshData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (view === 'auth' || (view as any) === 'complete-profile') {
    return (
      <AuthView 
        onGoogleLogin={handleGoogleLogin} 
        onEmailLogin={handleEmailLogin}
        onRegister={handleRegister}
        onUpdateProfile={handleUpdateProfile}
        onDemoLogin={handleDemoLogin}
        onContinueAsGuest={handleContinueAsGuest}
        initialData={user || undefined}
        viewMode={view === 'auth' ? 'auth' : 'complete-profile'}
        loading={loading} 
      />
    );
  }

  return (
    <Layout 
      user={user || undefined} 
      onLogout={handleLogout}
      activeElection={activeElection?.title}
      onRoleChange={handleRoleChange}
    >
      {view !== 'voting' && user?.role !== UserRole.GUEST && (
        <div className="mb-8 flex items-center justify-between">
          <div className="flex bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm w-fit gap-1 flex-wrap">
            <button 
              onClick={() => setView('landing')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                view === 'landing' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              📖 Regulations & Guide
            </button>
            <button 
              onClick={() => setView('voter-dashboard')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                view === 'voter-dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              🗳️ Ballot Center
            </button>
            {(user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER) && (
              <button 
                onClick={() => {
                  if (user?.role === UserRole.ADMIN) {
                    setView('admin-dashboard');
                  } else {
                    setView('manager-dashboard');
                  }
                }}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  view === 'admin-dashboard' || view === 'manager-dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                ⚙️ Admin Controls
              </button>
            )}
          </div>
        </div>
      )}

      {view === 'landing' ? (
        <LandingView 
          onEnterDashboard={() => {
            if (user?.role === UserRole.GUEST) {
              setUser(null);
              setView('auth');
            } else {
              navigateToUserDashboard(user);
            }
          }}
          userDisplayName={user?.displayName}
          institutionId={user?.institutionId}
          isGuest={user?.role === UserRole.GUEST}
        />
      ) : view === 'voter-dashboard' ? (
        <Dashboard 
          elections={elections}
          user={user}
          onVoteClick={(election) => {
            setSelectedElectionId(election.id);
            setView('voting');
          }}
          isAdmin={false}
        />
      ) : view === 'manager-dashboard' ? (
        <AdminDashboard 
          elections={elections} 
          onAddElection={handleAddElection}
          onEditElection={handleEditElection}
          onDeleteElection={handleDeleteElection}
          userRole={user?.role}
          institutionId={user?.institutionId}
        />
      ) : view === 'admin-dashboard' ? (
        <AdminDashboard 
          elections={elections} 
          onAddElection={handleAddElection}
          onEditElection={handleEditElection}
          onDeleteElection={handleDeleteElection}
          userRole={user?.role}
          institutionId={user?.institutionId}
        />
      ) : view === 'guest-dashboard' ? (
        <Dashboard 
          elections={elections}
          user={user}
          onVoteClick={(election) => {
            alert('Guests cannot vote. Please sign in or register.');
          }}
          isAdmin={false}
        />
      ) : (
        activeElection && (
          <VotingInterface 
            election={activeElection}
            onBack={() => {
              if (user?.role === UserRole.GUEST) {
                setView('guest-dashboard');
              } else {
                setView('voter-dashboard');
              }
            }}
            onVote={handleCastVote}
            isSubmitting={isSubmittingVote}
            currentUserStudentId={user?.studentId}
          />
        )
      )}

      {showReceiptBanner && lastVoteReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center"
          >
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2 font-sans">Ballot Cast Successfully!</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">
              Your identity has been verified and your anonymous vote has been securely recorded on the ledger.
            </p>
            
            <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl mb-6">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Your Zero-Knowledge Receipt ID
              </span>
              <span className="font-mono text-xs inline-block font-black text-slate-700 bg-white px-3 py-1.5 border border-slate-100 rounded-xl max-w-full overflow-x-auto select-all">
                {lastVoteReceipt}
              </span>
              <p className="text-[10px] text-slate-400 font-bold mt-2">
                Use this unique token to verify your ballot count in the audit ledger.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(lastVoteReceipt);
                  alert('Receipt ID copied!');
                }}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-200 transition-colors"
              >
                Copy Receipt
              </button>
              <button
                onClick={() => setShowReceiptBanner(false)}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl text-xs hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
              >
                Close Portal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}


