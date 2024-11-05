<script setup lang="ts">
import { ref } from 'vue';
import { signInWithGoogle, signOut } from '@/firebase/auth';
import type { User } from 'firebase/auth';

const user = ref<User | null>(null);
const error = ref<string>('');

const handleGoogleLogin = async () => {
  try {
    user.value = await signInWithGoogle();
  } catch (err) {
    error.value = '로그인 중 오류가 발생했습니다.';
  }
};

const handleSignOut = async () => {
  try {
    await signOut();
    user.value = null;
  } catch (err) {
    error.value = '로그아웃 중 오류가 발생했습니다.';
  }
};
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div v-if="error" class="text-red-500">
      {{ error }}
    </div>
    
    <div v-if="!user" class="flex justify-center">
      <button
        @click="handleGoogleLogin"
        class="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:shadow-md transition-shadow"
        aria-label="Google로 로그인"
      >
        <!-- <img src="/google-icon.svg" alt="" class="w-5 h-5" /> -->
        Google로 로그인
      </button>
    </div>

    <div v-else class="flex flex-col items-center gap-2">
      <img 
        :src="user.photoURL ?? ''" 
        :alt="user.displayName ?? '사용자'"
        class="w-10 h-10 rounded-full"
      />
      <p class="text-gray-700">{{ user.displayName ?? '사용자' }}</p>
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