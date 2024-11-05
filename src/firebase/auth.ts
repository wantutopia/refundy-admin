import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { auth } from './firebase';
import { ref } from 'vue';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
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

// 현재 로그인된 사용자 상태를 전역으로 관리
export const currentUser = ref<User | null>(null);

// 인증 상태 변경 감지 함수
export const initializeAuthState = () => {
  return onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
  });
}; 