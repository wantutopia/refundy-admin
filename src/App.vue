<script setup lang="ts">
import { onMounted } from 'vue';
import HelloWorld from './components/HelloWorld.vue';
import GoogleLogin from './components/GoogleLogin.vue';
import { initializeAuthListener } from './firebase/auth';

onMounted(() => {
  // 인증 상태 변경 리스너 설정
  const unsubscribe = initializeAuthListener((user) => {
    console.log('Auth state changed:', user);
  });

  // 컴포넌트 언마운트 시 리스너 제거
  return () => unsubscribe();
});
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-center mb-8">
        <a href="https://vite.dev" target="_blank" class="mx-2">
          <img src="/vite.svg" class="h-24 transition-all hover:drop-shadow-lg" alt="Vite logo" />
        </a>
        <a href="https://vuejs.org/" target="_blank" class="mx-2">
          <img src="./assets/vue.svg" class="h-24 transition-all hover:drop-shadow-lg" alt="Vue logo" />
        </a>
      </div>
      
      <div class="mb-8">
        <GoogleLogin />
      </div>
      
      <HelloWorld msg="Vite + Vue" />
    </div>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
