<script setup lang="ts">
import { ref, onMounted } from 'vue';
import GoogleLogin from './components/GoogleLogin.vue';
import TaobaoOrdersTable from './components/TaobaoOrdersTable.vue';
import { initializeAuthListener } from './firebase/auth';
import type { User } from 'firebase/auth';

const currentUser = ref<User | null>(null);

onMounted(() => {
  const unsubscribe = initializeAuthListener((user) => {
    currentUser.value = user;
  });

  return () => unsubscribe();
});
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <GoogleLogin />
      </div>
      
      <div v-if="currentUser" class="bg-white rounded-lg shadow">
        <TaobaoOrdersTable />
      </div>
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
