<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useTaobaoOrders } from '@/firebase/firestore';

const selectedUserId = ref<string | null>(null);
const { orders, loading, error, allUserIds, subscribeToOrders, subscribeToUserIds, cleanup } = useTaobaoOrders(selectedUserId);

// 환불 가능 여부 체크 함수 수정
const isRefundable = (order: any) => {
  if (!order.manualPrice) return false;
  const refundAmount = order.totalOrderPrice - order.manualPrice;
  return refundAmount >= 10;
};

// 환불 금액 계산 함수 추가
const calculateRefundAmount = (order: any) => {
  return order.manualPrice ? order.totalOrderPrice - order.manualPrice : 0;
};

// 전체 통계
const statistics = computed(() => {
  if (!orders.value) return {
    totalOrders: 0,
    totalAmount: 0,
    averageOrderAmount: 0,
    totalUsers: allUserIds.value?.length || 0,
    refundableOrders: 0,
    refundableRatio: 0,
    totalRefundAmount: 0,
    refundAmountRatio: 0,
  };

  const stats = {
    totalOrders: 0,
    totalAmount: 0,
    averageOrderAmount: 0,
    totalUsers: allUserIds.value?.length || 0,
    refundableOrders: 0,
    refundableRatio: 0,
    totalRefundAmount: 0,
    refundAmountRatio: 0,
  };

  let totalOrderAmount = 0;

  // orders.value의 각 문서에서 orders 배열을 순회
  orders.value.forEach(doc => {
    doc.orders?.forEach(order => {
      stats.totalOrders++;
      stats.totalAmount += order.totalOrderPrice || 0;
      totalOrderAmount += order.totalOrderPrice || 0;

      if (isRefundable(order)) {
        stats.refundableOrders++;
        stats.totalRefundAmount += calculateRefundAmount(order);
      }
    });
  });

  // 비율 계산
  stats.refundableRatio = stats.totalOrders > 0 
    ? (stats.refundableOrders / stats.totalOrders) * 100 
    : 0;
  
  stats.refundAmountRatio = totalOrderAmount > 0 
    ? (stats.totalRefundAmount / totalOrderAmount) * 100 
    : 0;

  stats.averageOrderAmount = stats.totalOrders > 0 
    ? Math.round(stats.totalAmount / stats.totalOrders) 
    : 0;

  return stats;
});

// 유저별 통계
const userStatistics = computed(() => {
  if (!orders.value || !allUserIds.value) return [];

  return allUserIds.value.map(userId => {
    const userStats = {
      userId,
      userDisplayName: '',
      totalOrders: 0,
      refundableOrders: 0,
      refundableRatio: 0,
      totalOrderAmount: 0,
      totalRefundAmount: 0,
      refundAmountRatio: 0,
      averageRefundAmount: 0,
    };

    // 해당 유저의 주문 문서 찾기
    const userDoc = orders.value.find(doc => doc.userId === userId);
    
    // userDisplayName 설정
    userStats.userDisplayName = userDoc?.userDisplayName || '';

    // 해당 유저의 orders 배열 순회
    userDoc?.orders?.forEach(order => {
      userStats.totalOrders++;
      userStats.totalOrderAmount += order.totalOrderPrice || 0;

      if (isRefundable(order)) {
        userStats.refundableOrders++;
        const refundAmount = calculateRefundAmount(order);
        userStats.totalRefundAmount += refundAmount;
      }
    });

    userStats.refundableRatio = userStats.totalOrders > 0 
      ? (userStats.refundableOrders / userStats.totalOrders) * 100 
      : 0;
    
    userStats.refundAmountRatio = userStats.totalOrderAmount > 0 
      ? (userStats.totalRefundAmount / userStats.totalOrderAmount) * 100 
      : 0;

    userStats.averageRefundAmount = userStats.refundableOrders > 0
      ? userStats.totalRefundAmount / userStats.refundableOrders
      : 0;

    return userStats;
  });
});

onMounted(() => {
  subscribeToOrders();
  subscribeToUserIds();
});

onUnmounted(() => {
  cleanup();
});
</script>

<template>
  <div class="p-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
        <p class="mt-2 text-2xl font-bold text-gray-900 min-w-[180px]">
          ¥{{ Math.floor(statistics.totalAmount).toLocaleString() }}
        </p>
      </div>

      <!-- 총 환불 가능 금액 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-gray-500 text-sm font-medium">총 환불 가능 금액</h3>
        <p class="mt-2 text-2xl font-bold text-gray-900 min-w-[180px]">
          ¥{{ Math.floor(statistics.totalRefundAmount).toLocaleString() }}
        </p>
      </div>

      <!-- 환불액 비율 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-gray-500 text-sm font-medium">환불액 비율</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900">
          {{ statistics.refundAmountRatio.toFixed(1) }}%
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

    <!-- 테이블 부분 수정 -->
    <div class="overflow-x-auto">
      <div class="inline-block min-w-full align-middle">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[50px]">유저 ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 주문</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 주문 금액</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환불 가능 주문</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환불 가능 비율</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 환불 가능 금액</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환불액 비율</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">평균 환불액</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="stat in userStatistics" :key="stat.userId">
              <td class="px-6 py-4 whitespace-nowrap w-[50px]">
                <div class="truncate" :title="stat.userId">{{ stat.userId }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">{{ stat.userDisplayName || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ stat.totalOrders.toLocaleString() }}건</td>
              <td class="px-6 py-4 whitespace-nowrap">¥{{ stat.totalOrderAmount.toLocaleString() }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ stat.refundableOrders.toLocaleString() }}건</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ stat.refundableRatio.toFixed(1) }}%</td>
              <td class="px-6 py-4 whitespace-nowrap">¥{{ stat.totalRefundAmount.toLocaleString() }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ stat.refundAmountRatio.toFixed(1) }}%</td>
              <td class="px-6 py-4 whitespace-nowrap">¥{{ stat.averageRefundAmount.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template> 