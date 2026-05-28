import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocFromServer,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with local persistent cache enabled for high-reliability offline support
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection test as required by skill
async function testConnection() {
  try {
    // Attempt absolute fast server ping to check if online. Timeout after 1500ms.
    const pingPromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise<any>((_, reject) => 
      setTimeout(() => reject(new Error("Intranet Network Timeout")), 1500)
    );
    await Promise.race([pingPromise, timeoutPromise]);
    console.log("Firestore: Successfully connected to cloud backend.");
  } catch (error) {
    console.warn("Firestore: Backend servers are unreachable (Intranet/Offline environment detected). Activating offline standalone mode...");
    try {
      await disableNetwork(db);
      console.info("Firestore: Network connectivity disabled. Queries will now serve immediately from local cache & fallbacks.");
    } catch (e) {
      console.error("Firestore: Failed to disable network:", e);
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
