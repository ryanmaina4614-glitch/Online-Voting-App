import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  increment,
  runTransaction,
  serverTimestamp,
  type Firestore,
  getDocFromServer
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  linkWithPopup,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type Auth,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  type FirebaseStorage 
} from 'firebase/storage';
import { Election, ElectionStatus, Candidate, AppUser, UserRole, Institution, BiometricActivityLog } from '../types';

let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

// Lazy initialization of Firebase services
export async function getFirebase() {
  if (!db || !auth || !storage) {
    try {
      // @ts-ignore - The file might not exist yet during the first run
      const configModule = await import('../../firebase-applet-config.json');
      const firebaseConfig = configModule.default;
      const app = initializeApp(firebaseConfig);
      const dbId = (firebaseConfig as any).firestoreDatabaseId;
      db = dbId ? getFirestore(app, dbId) : getFirestore(app);
      auth = getAuth(app);
      storage = getStorage(app);
    } catch (error) {
      console.warn('Firebase config missing or invalid. Check if set_up_firebase was successful.');
    }
  }
  return { db, auth, storage };
}

// Token caching
let cachedAccessToken: string | null = null;

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

// Helper to identify offline/network errors
export function isOfflineError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const lowerMsg = msg.toLowerCase();
  return (
    lowerMsg.includes('offline') ||
    lowerMsg.includes('client is offline') ||
    lowerMsg.includes('failed to get document') ||
    lowerMsg.includes('network') ||
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('could not reach') ||
    lowerMsg.includes('failed to fetch')
  );
}

// Authentication Wrappers
export async function loginWithGoogle() {
  const { auth } = await getFirebase();
  if (!auth) throw new Error('Firebase Auth not initialized');
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar');
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    cachedAccessToken = credential.accessToken;
  }
  return result;
}

export async function connectGoogleCalendar(): Promise<string> {
  const { auth } = await getFirebase();
  if (!auth) throw new Error('Firebase Auth not initialized');
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar');
  
  let result;
  try {
    if (auth.currentUser) {
      try {
        result = await linkWithPopup(auth.currentUser, provider);
      } catch (e: any) {
        if (e.code === 'auth/credential-already-in-use' || e.code === 'auth/provider-already-linked') {
          result = await signInWithPopup(auth, provider);
        } else {
          result = await signInWithPopup(auth, provider);
        }
      }
    } else {
      result = await signInWithPopup(auth, provider);
    }
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup-closed-by-user')) {
      throw new Error('Google Calendar popup was closed or blocked. If you are in the AI Studio preview iframe, please open the application in a new tab using the button in the top-right corner of the preview area and try again.');
    }
    throw error;
  }
  
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('No access token returned from Google authentication.');
  }
  cachedAccessToken = credential.accessToken;
  return cachedAccessToken;
}

export async function logout() {
  const { auth } = await getFirebase();
  cachedAccessToken = null;
  if (auth) return signOut(auth);
}

// User Profile Functions
export async function getUserProfile(uid: string): Promise<Partial<AppUser> | null> {
  const { db } = await getFirebase();
  
  const getOfflineProfile = (): Partial<AppUser> | null => {
    try {
      const cached = localStorage.getItem(`user_profile_${uid}`);
      if (cached) {
        console.log('Restored user profile from local storage offline cache:', uid);
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to read profile caches', e);
    }
    return null;
  };

  if (!db) return getOfflineProfile();
  
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as Partial<AppUser>;
      try {
        localStorage.setItem(`user_profile_${uid}`, JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to save profile cache to localStorage', e);
      }
      return data;
    }
    return getOfflineProfile();
  } catch (error) {
    console.warn('Failed to get user profile from Firestore, using offline cache if available:', error);
    return getOfflineProfile();
  }
}

function cleanObject(obj: any) {
  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
}

export async function setUserProfile(uid: string, profile: Partial<AppUser>) {
  // Always cache locally first
  try {
    const cached = localStorage.getItem(`user_profile_${uid}`);
    const existing = cached ? JSON.parse(cached) : {};
    const merged = { ...existing, ...profile };
    localStorage.setItem(`user_profile_${uid}`, JSON.stringify(merged));
  } catch (e) {
    console.warn('Failed to update localStorage profile cache', e);
  }

  const { db } = await getFirebase();
  if (!db) {
    console.warn('Database offline, caching user profile update locally');
    return;
  }
  
  try {
    const cleanedProfile = cleanObject(profile);
    await setDoc(doc(db, 'users', uid), cleanedProfile, { merge: true });
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Failed to sync profile update to server because the client is offline.');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

export async function getManagerCount(institutionId: string): Promise<number> {
  const { db } = await getFirebase();
  if (!db) return 0;
  try {
    const q = query(
      collection(db, 'users'), 
      where('institutionId', '==', institutionId),
      where('role', '==', 'manager')
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch (error) {
    console.error('Failed to get manager count', error);
    return 0;
  }
}

export async function registerWithEmail(userData: any): Promise<AppUser> {
  const { db, auth, storage } = await getFirebase();
  if (!auth) throw new Error('Auth not initialized');
  
  const { email, password, displayName, age, gender, classGroup, institutionId, studentId, passportFile, role } = userData;
  
  if (role === 'manager') {
    const mCount = await getManagerCount(institutionId || 'default');
    if (mCount >= 5) {
      throw new Error('This institution already has the maximum of 5 managers registered. Only voters can register now.');
    }
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  await updateProfile(user, { displayName });
  
  // Now we are logged in, we can upload the passportFile if provided
  let uploadedPhotoUrl = '';
  if (passportFile && storage) {
    try {
      const fileRef = ref(storage, `passports/${user.uid}_${Date.now()}_${passportFile.name}`);
      const snapshot = await uploadBytes(fileRef, passportFile);
      uploadedPhotoUrl = await getDownloadURL(snapshot.ref);
    } catch (uploadError) {
      console.error('Failed to upload user passport photo during registration', uploadError);
      throw new Error('Could not upload your passport photo. Please check your image size or format.');
    }
  }

  const isAdmin = email === 'ryanmaina4614@gmail.com';
  
  if (isAdmin && db) {
    await setDoc(doc(db, 'admins', user.uid), { email, role: 'admin' });
  }
  
  const parsedAge = parseInt(age);
  const userProfile: AppUser = {
    uid: user.uid,
    email: email || '',
    displayName: displayName || '',
    role: isAdmin ? UserRole.ADMIN : (role || UserRole.VOTER),
    institutionId: institutionId || 'default',
    studentId: studentId || 'N/A',
    votedElections: [],
    age: isNaN(parsedAge) ? 0 : parsedAge,
    gender: gender || '',
    classGroup: classGroup || '',
    passportPhotoUrl: uploadedPhotoUrl || userData.passportPhotoUrl || ''
  };
  
  await setUserProfile(user.uid, userProfile);
  
  return userProfile;
}

export async function loginWithEmail(email: string, password: string) {
  const { auth } = await getFirebase();
  if (!auth) throw new Error('Auth not initialized');
  return signInWithEmailAndPassword(auth, email, password);
}

// Database Functions
export async function getElections(institutionId?: string): Promise<Election[]> {
  const getOfflineElections = (): Election[] => {
    try {
      const cached = localStorage.getItem('elections_cache');
      if (cached) {
        let elections = JSON.parse(cached) as Election[];
        if (institutionId) {
          elections = elections.filter(e => e.institutionId === institutionId);
        }
        return elections;
      }
    } catch (e) {
      console.warn('Failed to read cached elections', e);
    }
    return [];
  };

  const { db } = await getFirebase();
  if (!db) return getOfflineElections();
  
  let electionsCol = query(collection(db, 'elections'));
  if (institutionId) {
    electionsCol = query(collection(db, 'elections'), where('institutionId', '==', institutionId));
  }

  try {
    const snapshot = await getDocs(electionsCol);
    const elections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Election));
    
    // Save to global cache in localStorage
    try {
      const existingCached = localStorage.getItem('elections_cache');
      let merged: Election[] = elections;
      if (existingCached && institutionId) {
        const parsedExisting = JSON.parse(existingCached) as Election[];
        const map = new Map(parsedExisting.map(e => [e.id, e]));
        elections.forEach(e => map.set(e.id, e));
        merged = Array.from(map.values());
      }
      localStorage.setItem('elections_cache', JSON.stringify(merged));
    } catch (e) {
      console.warn('Failed to cache elections in localStorage', e);
    }
    
    return elections;
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline, returning cached elections if available.');
      return getOfflineElections();
    }
    try {
      handleFirestoreError(error, OperationType.LIST, 'elections');
    } catch (e) {
      console.warn('Silent fallback to local elections cache due to firestore fetch error:', e);
    }
    return getOfflineElections();
  }
}

export async function createElection(electionData: Partial<Election>) {
  const { db, auth } = await getFirebase();
  if (!db || !auth?.currentUser) throw new Error('Not authenticated');
  
  const electionCol = collection(db, 'elections');
  const newElection = {
    ...electionData,
    creatorId: auth.currentUser.uid,
    createdAt: new Date().toISOString(),
    totalVotes: 0,
    status: electionData.status || ElectionStatus.UPCOMING,
    candidates: electionData.candidates?.map(c => ({ ...c, votesCount: 0 })) || []
  };
  
  try {
    return await addDoc(electionCol, newElection);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'elections');
  }
}

export async function updateElection(id: string, electionData: Partial<Election>) {
  const { db } = await getFirebase();
  if (!db) throw new Error('Database not initialized');
  
  const electionRef = doc(db, 'elections', id);
  try {
    await updateDoc(electionRef, electionData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `elections/${id}`);
  }
}

export async function deleteElection(id: string) {
  const { db } = await getFirebase();
  if (!db) throw new Error('Database not initialized');
  
  const electionRef = doc(db, 'elections', id);
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(electionRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `elections/${id}`);
  }
}

export async function castVote(
  electionId: string, 
  candidateId: string, 
  studentIdConfirmation?: string, 
  voterReceiptCode?: string, 
  trackingDetails?: any
) {
  const { db, auth } = await getFirebase();
  if (!db || !auth?.currentUser) throw new Error('Not authenticated');

  const voterId = auth.currentUser.uid;
  const recordId = `${voterId}_${electionId}`;
  
  const recordRef = doc(db, 'voteRecords', recordId);
  const electionRef = doc(db, 'elections', electionId);
  const anonVoteRef = doc(collection(db, 'anonymousVotes'));

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Check if user already voted in this transaction
      const recordSnap = await transaction.get(recordRef);
      if (recordSnap.exists()) {
        throw new Error('You have already voted in this election.');
      }

      // 2. Get election data
      const electionSnap = await transaction.get(electionRef);
      if (!electionSnap.exists()) {
        throw new Error('Election not found.');
      }
      const electionData = electionSnap.data() as Election;
      
      // 3. Update candidate count in election doc
      const updatedCandidates = electionData.candidates.map(c => {
        if (c.id === candidateId) {
          return { ...c, votesCount: c.votesCount + 1 };
        }
        return c;
      });

      // 4. Update the election doc
      transaction.update(electionRef, {
        candidates: updatedCandidates,
        totalVotes: increment(1)
      });

      // 5. Create the vote record (to prevent double voting)
      transaction.set(recordRef, {
        voterId,
        electionId,
        timestamp: serverTimestamp(),
        studentIdConfirmation: studentIdConfirmation || 'N/A',
        voterReceiptCode: voterReceiptCode || 'N/A',
        browserName: trackingDetails?.browserName || 'Unknown Browser',
        userAgent: trackingDetails?.userAgent || 'Unknown User-Agent',
      });

      // 6. Create the anonymous vote doc (for audit/analytics)
      transaction.set(anonVoteRef, {
        electionId,
        candidateId,
        timestamp: serverTimestamp(),
        voterReceiptCode: voterReceiptCode || 'N/A',
        browserName: trackingDetails?.browserName || 'Unknown Browser',
        userAgent: trackingDetails?.userAgent || 'Unknown User-Agent',
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `vote-transaction/${electionId}`);
  }
}

export async function getAnonymousVotes(electionId?: string): Promise<any[]> {
  const { db } = await getFirebase();
  if (!db) return [];
  try {
    let votesCol = query(collection(db, 'anonymousVotes'));
    if (electionId) {
      votesCol = query(collection(db, 'anonymousVotes'), where('electionId', '==', electionId));
    }
    const snapshot = await getDocs(votesCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Failed to get anonymous votes', error);
    return [];
  }
}

export async function getVoteRecords(electionId?: string): Promise<any[]> {
  const { db } = await getFirebase();
  if (!db) return [];
  try {
    let recordsCol = query(collection(db, 'voteRecords'));
    if (electionId) {
      recordsCol = query(collection(db, 'voteRecords'), where('electionId', '==', electionId));
    }
    const snapshot = await getDocs(recordsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Failed to get vote records', error);
    return [];
  }
}

export async function getAllUsers(institutionId?: string): Promise<AppUser[]> {
  const { db } = await getFirebase();
  if (!db) return [];
  try {
    let usersQuery = query(collection(db, 'users'));
    if (institutionId) {
      usersQuery = query(collection(db, 'users'), where('institutionId', '==', institutionId));
    }
    const snapshot = await getDocs(usersQuery);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
}

export async function getInstitutions(): Promise<Institution[]> {
  const { db, auth } = await getFirebase();
  if (!db) return [];
  try {
    const currentUser = auth?.currentUser;
    if (currentUser) {
      try {
        const cached = localStorage.getItem(`user_profile_${currentUser.uid}`);
        if (cached) {
          const profile = JSON.parse(cached);
          if (profile?.role === 'manager' && profile?.institutionId) {
            const instDoc = await getDoc(doc(db, 'institutions', profile.institutionId));
            if (instDoc.exists()) {
              return [{ id: instDoc.id, ...instDoc.data() } as Institution];
            }
            return [];
          }
        }
      } catch (err) {
        console.warn('Silent manager profile fetch warning in getInstitutions:', err);
      }
    }

    const snapshot = await getDocs(collection(db, 'institutions'));
    let institutions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Institution));
    
    // Seed default institutions if database is empty
    if (institutions.length === 0) {
      const defaults: Institution[] = [
        { id: 'SCH-78214', name: 'Greenfield High School', location: 'Nairobi' },
        { id: 'SCH-45928', name: 'Sunshine Academy', location: 'Mombasa' },
        { id: 'SCH-96137', name: 'Riverside Secondary', location: 'Kisumu' },
        { id: 'SCH-31459', name: 'Bright Future School', location: 'Eldoret' },
        { id: 'SCH-62783', name: 'Heritage College', location: 'Nyeri' },
        { id: 'default', name: 'System Default Institution', location: 'Virtual' }
      ];
      
      for (const inst of defaults) {
        try {
          await setDoc(doc(db, 'institutions', inst.id), {
            name: inst.name,
            location: inst.location,
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn('Failed to seed institution ' + inst.id, err);
        }
      }
      institutions = defaults;
    }
    
    return institutions;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, 'institutions');
    } catch (e) {
      console.warn('Silent fallback for institutions list:', e);
    }
    return [
      { id: 'SCH-78214', name: 'Greenfield High School', location: 'Nairobi' },
      { id: 'SCH-45928', name: 'Sunshine Academy', location: 'Mombasa' },
      { id: 'SCH-96137', name: 'Riverside Secondary', location: 'Kisumu' },
      { id: 'SCH-31459', name: 'Bright Future School', location: 'Eldoret' },
      { id: 'SCH-62783', name: 'Heritage College', location: 'Nyeri' },
      { id: 'default', name: 'System Default Institution', location: 'Virtual' }
    ];
  }
}

export async function createInstitution(id: string, name: string, location: string, imageUrl?: string): Promise<void> {
  const { db } = await getFirebase();
  if (!db) throw new Error('Database not initialized');
  try {
    await setDoc(doc(db, 'institutions', id), {
      name,
      location,
      imageUrl: imageUrl || '',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `institutions/${id}`);
  }
}

export async function deleteInstitution(id: string): Promise<void> {
  const { db } = await getFirebase();
  if (!db) throw new Error('Database not initialized');
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'institutions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `institutions/${id}`);
  }
}

export async function updateUserProfileRole(uid: string, role: UserRole, institutionId?: string) {
  const { db } = await getFirebase();
  if (!db) throw new Error('Database not initialized');
  const userRef = doc(db, 'users', uid);
  const adminRef = doc(db, 'admins', uid);
  
  try {
    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const currentUserData = userSnap.data() as AppUser;

      const updateData: any = { role };
      if (institutionId !== undefined) {
        updateData.institutionId = institutionId;
      }
      
      // Update User Profile
      transaction.update(userRef, updateData);

      // Manage Global Admin Status
      const isNewRoleAdmin = role === UserRole.ADMIN;
      const wasOldRoleAdmin = (currentUserData.role as string) === 'admin';

      if (isNewRoleAdmin) {
        transaction.set(adminRef, { 
          email: currentUserData.email, 
          role: 'admin',
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else if (wasOldRoleAdmin) {
        // Only remove if they were an admin and are being demoted
        // Note: Super-admin check should be handled by rules to prevent self-deletion
        transaction.delete(adminRef);
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `user-management/${uid}`);
  }
}

export async function uploadCandidatePhoto(file: File): Promise<string> {
  const { auth, storage } = await getFirebase();
  if (!auth?.currentUser || !storage) throw new Error('Not authenticated or storage not ready');

  const fileRef = ref(storage, `candidates/${Date.now()}_${file.name}`);
  try {
    const snapshot = await uploadBytes(fileRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Upload failed', error);
    throw new Error('Failed to upload candidate photo');
  }
}

export async function uploadCampaignFile(file: File): Promise<string> {
  const { auth, storage } = await getFirebase();
  if (!auth?.currentUser || !storage) throw new Error('Not authenticated or storage not ready');

  const fileRef = ref(storage, `campaign_docs/${Date.now()}_${file.name}`);
  try {
    const snapshot = await uploadBytes(fileRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Campaign file upload failed', error);
    throw new Error('Failed to upload campaign document/multimedia file');
  }
}

export async function uploadPassportPhoto(file: File): Promise<string> {
  const { auth, storage } = await getFirebase();
  if (!auth?.currentUser || !storage) throw new Error('Not authenticated or storage not ready');

  const fileRef = ref(storage, `passports/${auth.currentUser.uid}_${Date.now()}_${file.name}`);
  try {
    const snapshot = await uploadBytes(fileRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Upload failed', error);
    throw new Error('Failed to upload passport photo');
  }
}

// Security Rule Check (Mandatory Connection Test)
export async function testConnection() {
  const { db } = await getFirebase();
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Error Handler helper as per integration guidelines
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export async function logBiometricActivity(logData: Partial<BiometricActivityLog>): Promise<void> {
  const { db } = await getFirebase();
  if (!db) {
    console.warn('Logging offline. Database not initialized.');
    return;
  }
  try {
    await addDoc(collection(db, 'biometricLogs'), {
      email: logData.email || 'unknown@votesecure.com',
      displayName: logData.displayName || 'Unknown User',
      status: logData.status || 'failed',
      errorMessage: logData.errorMessage || '',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to write biometric activity log', error);
  }
}

export async function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const { auth } = await getFirebase();
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
