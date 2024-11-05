<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { signInWithGoogle, signOut, currentUser, initializeAuthState } from '@/firebase/auth';

const error = ref<string>('');
let unsubscribe: (() => void) | null = null;

const handleGoogleLogin = async () => {
  try {
    await signInWithGoogle();
  } catch (err) {
    error.value = '로그인 중 오류가 발생했습니다.';
  }
};

const handleSignOut = async () => {
  try {
    await signOut();
  } catch (err) {
    error.value = '로그아웃 중 오류가 발생했습니다.';
  }
};

// 컴포넌트가 마운트될 때 인증 상태 리스너 설정
onMounted(() => {
  unsubscribe = initializeAuthState();
});

// 컴포넌트가 언마운트될 때 리스너 해제
onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div v-if="error" class="text-red-500">
      {{ error }}
    </div>
    
    <div v-if="!currentUser" class="flex justify-center">
      <button
        @click="handleGoogleLogin"
        class="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:shadow-md transition-shadow"
        aria-label="Google로 로그인"
      >
        Google로 로그인
      </button>
    </div>

    <div v-else class="flex flex-col items-center gap-2">
      <img 
        :src="currentUser.photoURL ?? ''" 
        :alt="currentUser.displayName ?? '사용자'"
        class="w-10 h-10 rounded-full"
      />
      <p class="text-gray-700">{{ currentUser.displayName ?? '사용자' }}</p>
      <button
        @click="handleSignOut"
        class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        aria-label="로그아웃"
      >
        로그아웃
      </button>
    </div>
  </div>
</template> 