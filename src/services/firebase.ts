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
import { Election, ElectionStatus, Candidate, AppUser, UserRole } from '../types';

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
      db = getFirestore(app);
      auth = getAuth(app);
      storage = getStorage(app);
    } catch (error) {
      console.warn('Firebase config missing or invalid. Check if set_up_firebase was successful.');
    }
  }
  return { db, auth, storage };
}

// Authentication Wrappers
export async function loginWithGoogle() {
  const { auth } = await getFirebase();
  if (!auth) throw new Error('Firebase Auth not initialized');
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function logout() {
  const { auth } = await getFirebase();
  if (auth) return signOut(auth);
}

// User Profile Functions
export async function getUserProfile(uid: string): Promise<Partial<AppUser> | null> {
  const { db } = await getFirebase();
  if (!db) return null;
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as Partial<AppUser>;
    }
    return null;
  } catch (error) {
    console.error('Failed to get user profile', error);
    return null;
  }
}

export async function setUserProfile(uid: string, profile: Partial<AppUser>) {
  const { db } = await getFirebase();
  if (!db) throw new Error('Database not initialized');
  try {
    await setDoc(doc(db, 'users', uid), profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

export async function registerWithEmail(userData: any) {
  const { auth } = await getFirebase();
  if (!auth) throw new Error('Auth not initialized');
  
  const { email, password, displayName, age, gender, classGroup } = userData;
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  await updateProfile(user, { displayName });
  
  const isAdmin = email === 'ryanmaina4614@gmail.com';
  
  await setUserProfile(user.uid, {
    email,
    displayName,
    role: isAdmin ? UserRole.ADMIN : UserRole.VOTER,
    votedElections: [],
    age: parseInt(age),
    gender,
    classGroup
  });
  
  return user;
}

export async function loginWithEmail(email: string, password: string) {
  const { auth } = await getFirebase();
  if (!auth) throw new Error('Auth not initialized');
  return signInWithEmailAndPassword(auth, email, password);
}

// Database Functions
export async function getElections(): Promise<Election[]> {
  const { db } = await getFirebase();
  if (!db) return [];
  const electionsCol = collection(db, 'elections');
  try {
    const snapshot = await getDocs(electionsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Election));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'elections');
    return [];
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
    status: ElectionStatus.UPCOMING,
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

export async function castVote(electionId: string, candidateId: string) {
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
        timestamp: serverTimestamp()
      });

      // 6. Create the anonymous vote doc (for audit/analytics)
      transaction.set(anonVoteRef, {
        electionId,
        candidateId,
        timestamp: serverTimestamp()
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `vote-transaction/${electionId}`);
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
