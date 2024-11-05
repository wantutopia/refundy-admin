import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  getFirestore
} from 'firebase/firestore';

import { auth } from './firebase';
const db = getFirestore();
import { ref } from 'vue';

const googleProvider = new GoogleAuthProvider();

interface UserInfo {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastLoginAt: any; // FieldValue 타입
  updatedAt: any; // FieldValue 타입
  createdAt?: any; // 선택적 속성
  role?: string;
  isActive?: boolean;
}

const saveUserToFirestore = async (user: User) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    const userInfo: UserInfo = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (!userDoc.exists()) {
      userInfo.createdAt = serverTimestamp();
      userInfo.role = 'user';
      userInfo.isActive = true;
    }

    await setDoc(userRef, userInfo, { merge: true });
  } catch (error) {
    console.error('사용자 정보 저장 에러:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await saveUserToFirestore(result.user);
    return result.user;
  } catch (error) {
    console.error('Google 로그인 에러:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('로그아웃 에러:', error);
    throw error;
  }
};

export const currentUser = ref<User | null>(null);

export const initializeAuthState = () => {
  return onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
  });
}; 