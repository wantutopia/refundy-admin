<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { Bar, Pie } from 'vue-chartjs';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { useTaobaoOrders } from '@/firebase/firestore';

const selectedUserId = ref<string | null>(null);
const { orders, loading, error, allUserIds, subscribeToOrders, subscribeToUserIds, cleanup } = useTaobaoOrders(selectedUserId);

// Chart.js 컴포넌트 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// 환불 가능 여부 체크 함수 수정
const isRefundable = (order: any) => {
  if (!order.manualPrice) return false;
  const refundAmount = order.totalOrderPrice - order.manualPrice;
  return refundAmount >= 10;
};

// 1위안 이상 환불 가능 여부 체크 함수 추가
const isRefundableIncludeSmall = (order: any) => {
  if (!order.manualPrice) return false;
  const refundAmount = order.totalOrderPrice - order.manualPrice;
  return refundAmount > 0;
};

// 환불 금액 계산 함 추가
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
      refundableOrdersAll: 0,
      refundableRatioAll: 0,
      totalRefundAmountAll: 0,
      refundAmountRatioAll: 0,
      averageRefundAmountAll: 0,
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

      if (isRefundableIncludeSmall(order)) {
        userStats.refundableOrdersAll++;
        const refundAmount = calculateRefundAmount(order);
        userStats.totalRefundAmountAll += refundAmount;
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

    userStats.refundableRatioAll = userStats.totalOrders > 0 
      ? (userStats.refundableOrdersAll / userStats.totalOrders) * 100 
      : 0;
    
    userStats.refundAmountRatioAll = userStats.totalOrderAmount > 0 
      ? (userStats.totalRefundAmountAll / userStats.totalOrderAmount) * 100 
      : 0;

    userStats.averageRefundAmountAll = userStats.refundableOrdersAll > 0
      ? userStats.totalRefundAmountAll / userStats.refundableOrdersAll
      : 0;

    return userStats;
  });
});

// 차트 데이터 계산
const chartData = computed(() => {
  const labels = userStatistics.value.map(stat => stat.userDisplayName || stat.userId.slice(0, 8));
  
  return {
    // 주문 금액과 환불 금액 비교 차트
    orderAmountChart: {
      labels,
      datasets: [
        {
          label: '총 주문 금액',
          backgroundColor: '#4F46E5',
          data: userStatistics.value.map(stat => stat.totalOrderAmount)
        },
        {
          label: '환불 가능 금액',
          backgroundColor: '#EF4444',
          data: userStatistics.value.map(stat => stat.totalRefundAmount)
        }
      ]
    },
    // 환불 가능 비율 파이 차트
    refundRatioChart: {
      labels: ['환불 가능 주문', '일반 주문'],
      datasets: [{
        backgroundColor: ['#EF4444', '#4F46E5'],
        data: [
          statistics.value.refundableOrders,
          statistics.value.totalOrders - statistics.value.refundableOrders
        ]
      }]
    },
    // 사용자별 환불 비율 차트
    userRefundRatioChart: {
      labels,
      datasets: [{
        label: '환불 가능 비율 (%)',
        backgroundColor: '#10B981',
        data: userStatistics.value.map(stat => parseFloat(stat.refundableRatio.toFixed(1)))
      }]
    },

    // 기간별 환불 가능성 차트
    refundByPeriodChart: {
      labels: refundByPeriodAnalysis.value.map(item => item.period),
      datasets: [{
        label: '환불 가능성 (%)',
        backgroundColor: '#8B5CF6',
        data: refundByPeriodAnalysis.value.map(item => parseFloat(item.ratio.toFixed(1)))
      }]
    },

    // 구매금액별 환불 가능성 차트
    refundByPriceRatioChart: {
      labels: Object.keys(refundByPriceAnalysis.value),
      datasets: [{
        label: '환불 가능성 (%)',
        backgroundColor: '#EC4899',
        data: Object.entries(refundByPriceAnalysis.value).map(([_, stats]) => 
          stats.total > 0 ? Math.floor((stats.refundable / stats.total) * 100) : 0
        )
      }]
    },

    // 구매금액별 평균 환불 금액 차트
    refundByPriceAmountChart: {
      labels: Object.keys(refundByPriceAnalysis.value),
      datasets: [{
        label: '평균 환불 금액 (¥)',
        backgroundColor: '#F59E0B',
        data: Object.entries(refundByPriceAnalysis.value).map(([_, stats]) => 
          stats.refundable > 0 ? Math.floor(stats.refundAmount / stats.refundable) : 0
        )
      }]
    }
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    }
  }
};

onMounted(() => {
  subscribeToOrders();
  subscribeToUserIds();
});

onUnmounted(() => {
  cleanup();
});

// 기간별 환불 가능성 분석
const refundByPeriodAnalysis = computed(() => {
  const periods = {
    '1주': { total: 0, refundable: 0 },
    '2주': { total: 0, refundable: 0 },
    '3주': { total: 0, refundable: 0 },
    '4주': { total: 0, refundable: 0 },
    '4주+': { total: 0, refundable: 0 }
  };

  const now = new Date();
  
  orders.value?.forEach(doc => {
    doc.orders?.forEach(order => {
      const orderDate = new Date(order.orderDate);
      const weeksDiff = Math.floor((now.getTime() - orderDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      let period;
      if (weeksDiff <= 1) period = '1주';
      else if (weeksDiff <= 2) period = '2주';
      else if (weeksDiff <= 3) period = '3주';
      else if (weeksDiff <= 4) period = '4주';
      else period = '4주+';

      periods[period].total++;
      if (isRefundable(order)) {
        periods[period].refundable++;
      }
    });
  });

  return Object.entries(periods).map(([period, stats]) => ({
    period,
    ratio: stats.total > 0 ? (stats.refundable / stats.total) * 100 : 0
  }));
});

// 구매금액별 환불 분석
const refundByPriceAnalysis = computed(() => {
  const priceRanges = {
    '~¥100': { total: 0, refundable: 0, refundAmount: 0 },
    '¥100~500': { total: 0, refundable: 0, refundAmount: 0 },
    '¥500~1000': { total: 0, refundable: 0, refundAmount: 0 },
    '¥1000~': { total: 0, refundable: 0, refundAmount: 0 }
  };

  orders.value?.forEach(doc => {
    doc.orders?.forEach(order => {
      const price = order.totalOrderPrice;
      let range;
      if (price <= 100) range = '~¥100';
      else if (price <= 500) range = '¥100~500';
      else if (price <= 1000) range = '¥500~1000';
      else range = '¥1000~';

      priceRanges[range].total++;
      if (isRefundable(order)) {
        priceRanges[range].refundable++;
        priceRanges[range].refundAmount += calculateRefundAmount(order);
      }
    });
  });

  return priceRanges;
});
</script>

<template>
  <div class="p-4">
    <!-- 통계 카드들 -->
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
        <h3 class="text-gray-500 text-sm font-medium">총 문 금액</h3>
        <p class="mt-2 text-2xl font-bold text-gray-900 min-w-[180px]">
          ¥{{ Math.floor(statistics.totalAmount).toLocaleString() }}
        </p>
      </div>

      <!-- 총 환불 가능 금액 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-gray-500 text-sm font-medium">총 환불 가능 금액(≥¥10)</h3>
        <p class="mt-2 text-2xl font-bold text-gray-900 min-w-[180px]">
          ¥{{ Math.floor(statistics.totalRefundAmount).toLocaleString() }}
        </p>
      </div>

      <!-- 환불액 비율 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-gray-500 text-sm font-medium">환불액 비율(≥¥10)</h3>
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

    <!-- 테이블 -->
    <div class="overflow-x-auto mb-8">
      <div class="inline-block min-w-full align-middle">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase max-w-[100px]">유저 ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 주문</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 주문 금액</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환불 가능 주문(≥¥10)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환불 가능 비율(≥¥10)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 환불 가능 금액(≥¥10)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환불액 비율(≥¥10)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">평균 환불액(≥¥10)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환불 가능 주문(전체)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환불 가능 비율(전체)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 환불 가능 금액(전체)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환불액 비율(전체)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">평균 환불액(전체)</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="stat in userStatistics" :key="stat.userId">
              <td class="px-6 py-4 whitespace-nowrap max-w-[100px]">
                <div class="truncate max-w-[100px]" :title="stat.userId">{{ stat.userId }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">{{ stat.userDisplayName || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ stat.totalOrders.toLocaleString() }}건</td>
              <td class="px-6 py-4 whitespace-nowrap">¥{{ stat.totalOrderAmount.toLocaleString() }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ stat.refundableOrders.toLocaleString() }}건</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ stat.refundableRatio.toFixed(1) }}%</td>
              <td class="px-6 py-4 whitespace-nowrap">¥{{ stat.totalRefundAmount.toLocaleString() }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ stat.refundAmountRatio.toFixed(1) }}%</td>
              <td class="px-6 py-4 whitespace-nowrap">¥{{ stat.averageRefundAmount.toFixed(2) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ stat.refundableOrdersAll.toLocaleString() }}건</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ stat.refundableRatioAll.toFixed(1) }}%</td>
              <td class="px-6 py-4 whitespace-nowrap">¥{{ stat.totalRefundAmountAll.toLocaleString() }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ stat.refundAmountRatioAll.toFixed(1) }}%</td>
              <td class="px-6 py-4 whitespace-nowrap">¥{{ stat.averageRefundAmountAll.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 차트 섹션 수정 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- 주문 금액과 환불 금액 비교 차트 -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-gray-500 text-sm font-medium mb-2">��용자별 주문/환불 금액금액(≥¥10)</h3>
        <div class="h-[300px]">
          <Bar
            :data="chartData.orderAmountChart"
            :options="chartOptions"
          />
        </div>
      </div>

      <!-- 전체 환불 가능 비율 파이 차트 -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-gray-500 text-sm font-medium mb-2">전체 환불 가능 비율금액(≥¥10)</h3>
        <div class="h-[300px]">
          <Pie
            :data="chartData.refundRatioChart"
            :options="pieOptions"
          />
        </div>
      </div>

      <!-- 사용자별 환불 비율 차트 -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-gray-500 text-sm font-medium mb-2">사용자별 환불 비율금액(≥¥10)</h3>
        <div class="h-[300px]">
          <Bar
            :data="chartData.userRefundRatioChart"
            :options="chartOptions"
          />
        </div>
      </div>
    </div>

    <!-- 새로운 차트 섹션 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
      <!-- 기간별 환불 가능성 차트 -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-gray-500 text-sm font-medium mb-2">기간별 환불 가능성</h3>
        <div class="h-[300px]">
          <Bar
            :data="chartData.refundByPeriodChart"
            :options="chartOptions"
          />
        </div>
      </div>

      <!-- 구매금액별 환불 가능성 차트 -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-gray-500 text-sm font-medium mb-2">구매금액별 환불 가능성</h3>
        <div class="h-[300px]">
          <Bar
            :data="chartData.refundByPriceRatioChart"
            :options="chartOptions"
          />
        </div>
      </div>

      <!-- 구매금액별 평균 환불 금액 차트 -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-gray-500 text-sm font-medium mb-2">구매금액별 평균 환불 금액</h3>
        <div class="h-[300px]">
          <Bar
            :data="chartData.refundByPriceAmountChart"
            :options="chartOptions"
          />
        </div>
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