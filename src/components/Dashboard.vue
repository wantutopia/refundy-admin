<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useTaobaoOrders } from '@/firebase/firestore';

const selectedUserId = ref<string | null>(null);
const { orders, loading, error, allUserIds, subscribeToOrders, subscribeToUserIds, cleanup } = useTaobaoOrders(selectedUserId);

// 전체 주문 통계
const statistics = computed(() => {
  const stats = {
    totalOrders: 0,
    totalAmount: 0,
    averageOrderAmount: 0,
    totalUsers: allUserIds.value.length,
  };

  orders.value.forEach(doc => {
    doc.orders.forEach(order => {
      stats.totalOrders++;
      stats.totalAmount += order.totalOrderPrice;
    });
  });

  stats.averageOrderAmount = stats.totalOrders > 0 
    ? Math.round(stats.totalAmount / stats.totalOrders) 
    : 0;

  return stats;
});

onMounted(() => {
  subscribeToOrders();
  subscribeToUserIds();
});

onMounted(() => {
  cleanup();
});
</script>

<template>
  <div class="p-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <!-- 총 주문 수 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-gray-500 text-sm font-medium">총 주문 수</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900">
          {{ statistics.totalOrders.toLocaleString() }}
        </p>
      </div>

      <!-- 총 주문 금액 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-gray-500 text-sm font-medium">총 주문 금액</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900">
          ¥{{ statistics.totalAmount.toLocaleString() }}
        </p>
      </div>

      <!-- 평균 주문 금액 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-gray-500 text-sm font-medium">평균 주문 금액</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900">
          ¥{{ statistics.averageOrderAmount.toLocaleString() }}
        </p>
      </div>

      <!-- 총 사용자 수 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-gray-500 text-sm font-medium">총 사용자 수</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900">
          {{ statistics.totalUsers.toLocaleString() }}
        </p>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ error }}
    </div>
  </div>
</template> 