<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { initializeAuthState, currentUser } from '@/firebase/auth';
import GoogleLogin from '@/components/GoogleLogin.vue';
import TaobaoOrdersTable from '@/components/TaobaoOrdersTable.vue';

let unsubscribe: (() => void) | null = null;

onMounted(() => {
  unsubscribe = initializeAuthState();
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <div class="container mx-auto px-4 py-8">
      <!-- 로그인하지 않은 경우 -->
      <div v-if="!currentUser" class="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 class="text-2xl font-bold text-gray-900 mb-8">
          타오바오 주문 관리 시스템
        </h1>
        <GoogleLogin />
      </div>

      <!-- 로그인한 경우 -->
      <div v-else class="space-y-6">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">
            타오바오 주문 관리 시스템
          </h1>
          <GoogleLogin />
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <TaobaoOrdersTable />
        </div>
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
