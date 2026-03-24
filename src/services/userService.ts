import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, Message } from '../types';

enum OperationType {
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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export const userService = {
  // 1. REGISTER
  register: async (userData: User): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password!);
      const firebaseUser = userCredential.user;

      await firebaseUpdateProfile(firebaseUser, { displayName: userData.username });

      const newUser: User = {
        username: userData.username,
        email: userData.email,
        avatar: userData.avatar || '',
        chatHistory: {}
      };

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        ...newUser,
        createdAt: serverTimestamp()
      });

      return newUser;
    } catch (error) {
      if (error instanceof Error && (error as any).code === 'auth/email-already-in-use') {
        throw new Error("User with this email already exists.");
      }
      throw error;
    }
  },

  // 2. LOGIN
  login: async (email: string, pass: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        throw new Error("User profile not found.");
      }

      return userDoc.data() as User;
    } catch (error) {
      if (error instanceof Error && ((error as any).code === 'auth/wrong-password' || (error as any).code === 'auth/user-not-found')) {
        throw new Error("Invalid credentials.");
      }
      throw error;
    }
  },

  // 3. LOGOUT
  logout: async () => {
    await signOut(auth);
  },

  // 4. UPDATE PROFILE
  updateProfile: async (uid: string, updates: Partial<User>): Promise<User> => {
    try {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, updates);
      
      const updatedDoc = await getDoc(userDocRef);
      return updatedDoc.data() as User;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      throw error;
    }
  },

  // 5. CHANGE PASSWORD
  changePassword: async (email: string, oldPass: string, newPass: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated.");

      const credential = EmailAuthProvider.credential(email, oldPass);
      await reauthenticateWithCredential(user, credential);
      await firebaseUpdatePassword(user, newPass);
    } catch (error) {
      throw error;
    }
  },

  // 6. SAVE MESSAGE
  saveMessage: async (uid: string, assistantId: string, message: Message) => {
    try {
      const messageDocRef = doc(db, 'users', uid, 'chats', assistantId, 'messages', message.id);
      await setDoc(messageDocRef, message);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/chats/${assistantId}/messages/${message.id}`);
    }
  },

  // 7. LISTEN TO CHAT HISTORY
  subscribeToMessages: (uid: string, assistantId: string, callback: (messages: Message[]) => void) => {
    const messagesRef = collection(db, 'users', uid, 'chats', assistantId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => doc.data() as Message);
      callback(messages);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}/chats/${assistantId}/messages`);
    });
  }
};
