<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { initializeAuthState, currentUser } from '@/firebase/auth';
import GoogleLogin from '@/components/GoogleLogin.vue';
import TaobaoOrdersTable from '@/components/TaobaoOrdersTable.vue';
import Dashboard from '@/components/Dashboard.vue';

let unsubscribe: (() => void) | null = null;
const currentMenu = ref<'dashboard' | 'orders'>('dashboard');

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

        <!-- 메뉴 네비게이션 -->
        <nav class="bg-white shadow rounded-lg">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-start h-16">
              <div class="flex">
                <button
                  @click="currentMenu = 'dashboard'"
                  :class="[
                    'inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium',
                    currentMenu === 'dashboard'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  ]"
                >
                  대시보드
                </button>
                <button
                  @click="currentMenu = 'orders'"
                  :class="[
                    'ml-8 inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium',
                    currentMenu === 'orders'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  ]"
                >
                  주문 관리
                </button>
              </div>
            </div>
          </div>
        </nav>
        
        <!-- 컨텐츠 영역 -->
        <div class="bg-white rounded-lg shadow p-6">
          <Dashboard v-if="currentMenu === 'dashboard'" />
          <TaobaoOrdersTable v-else />
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
