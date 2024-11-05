<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useTaobaoOrders, updateOrderManualPrice } from '@/firebase/firestore';
import { formatDate } from '@/utils/dateFormatter';
import { Timestamp } from 'firebase/firestore';

const selectedUserId = ref<string | null>(null);
const { 
  orders, 
  loading, 
  error, 
  allUserIds,
  subscribeToOrders, 
  subscribeToUserIds, 
  cleanup 
} = useTaobaoOrders(selectedUserId);

watch(selectedUserId, () => {
  cleanup();
  subscribeToOrders();
});

onMounted(() => {
  subscribeToOrders();
  subscribeToUserIds();
});

onUnmounted(() => {
  cleanup();
});

const generateTaobaoUrl = (itemId: string, skuId?: string) => {
  const baseUrl = `https://item.taobao.com/item.htm?id=${itemId}`;
  return skuId ? `${baseUrl}&skuId=${skuId}` : baseUrl;
};

const sortedOrders = computed(() => {
  return orders.value.map(doc => ({
    ...doc,
    orders: [...doc.orders].sort((a, b) => {
      const dateA = a.orderDate?.toDate().getTime() || 0;
      const dateB = b.orderDate?.toDate().getTime() || 0;
      return dateB - dateA; // 내림차순 정렬
    })
  }));
});

// 수동 가격 입력을 위한 상태 관리
const manualPrices = ref<{ [key: string]: string }>({});
const updateStatus = ref<{ [key: string]: 'idle' | 'loading' | 'success' | 'error' }>({});

// 수동 가격 업데이트 핸들러
const handleManualPriceUpdate = async (order: any, userId: string) => {
  const priceValue = manualPrices.value[order.orderId];
  if (!priceValue) return;

  const numericPrice = parseFloat(priceValue);
  if (isNaN(numericPrice)) return;

  updateStatus.value[order.orderId] = 'loading';
  
  try {
    await updateOrderManualPrice(
      userId,
      order.orderId,
      numericPrice
    );
    updateStatus.value[order.orderId] = 'success';
    setTimeout(() => {
      updateStatus.value[order.orderId] = 'idle';
    }, 2000);
  } catch (error) {
    updateStatus.value[order.orderId] = 'error';
    console.error('Failed to update manual price:', error);
  }
};

// 날짜 포맷팅 함수
const formatManualPriceDate = (timestamp: Timestamp | undefined) => {
  if (!timestamp) return '-';
  return formatDate(timestamp.toDate());
};
</script>

<template>
  <div class="p-4">
    <!-- 사용자 선택 필터 -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">사용자 필터</label>
      <select
        v-model="selectedUserId"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option :value="null">전체 보기</option>
        <option v-for="userId in allUserIds" :key="userId" :value="userId">
          {{ userId }}
        </option>
      </select>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ error }}
    </div>

    <!-- 주문 테이블 -->
    <div v-if="!loading && !error" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[100px] break-words">주문 ID</th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">상품명</th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[80px] break-words">SKU ID</th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[150px]">옵션</th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수동 가격</th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 ���제금액</th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">배송비</th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">단가</th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수량</th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주문일</th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수동 가격 입력일</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <template v-for="doc in sortedOrders" :key="doc.userId">
            <tr v-for="order in doc.orders" :key="order.orderId">
              <td class="px-3 py-4 text-sm text-gray-500 max-w-[100px]">
                <div class="line-clamp-2 break-words">{{ order.orderId }}</div>
              </td>
              <td class="px-3 py-4 w-[150px] group">
                <div class="flex items-center">
                  <img 
                    :src="order.imageUrl" 
                    :alt="order.productName" 
                    class="h-10 w-10 flex-shrink-0 rounded-full"
                  >
                  <div class="ml-4 min-w-0">
                    <div class="text-sm font-medium">
                      <a
                        :href="generateTaobaoUrl(order.itemId, order.skuId)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-indigo-600 hover:text-indigo-900 overflow-hidden hover:overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 block"
                        :title="order.productName"
                      >
                        {{ order.productName }}
                      </a>
                    </div>
                    <div class="text-sm text-gray-500 truncate">{{ order.seller }}</div>
                  </div>
                </div>
              </td>
              <td class="px-3 py-4 text-sm text-gray-500 max-w-[80px]">
                <div class="line-clamp-2 break-words">{{ order.skuId || '-' }}</div>
              </td>
              <td class="px-3 py-4 text-sm text-gray-500 max-w-[150px]">
                <div v-if="order.specs && order.specs.length > 0" class="space-y-1">
                  <div v-for="(spec, index) in order.specs" :key="index" class="text-xs break-words">
                    <span class="font-medium">{{ spec.name }}:</span> {{ spec.value }}
                  </div>
                </div>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-3 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center space-x-2">
                  <input
                    type="number"
                    v-model="manualPrices[order.orderId]"
                    placeholder="가격 입력"
                    class="w-24 px-2 py-1 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    @click="handleManualPriceUpdate(order, doc.userId)"
                    :disabled="updateStatus[order.orderId] === 'loading'"
                    class="px-3 py-1 text-xs rounded-md"
                    :class="{
                      'bg-indigo-600 text-white hover:bg-indigo-700': updateStatus[order.orderId] !== 'loading',
                      'bg-gray-400 cursor-not-allowed': updateStatus[order.orderId] === 'loading'
                    }"
                  >
                    <span v-if="updateStatus[order.orderId] === 'loading'">저장중...</span>
                    <span v-else-if="updateStatus[order.orderId] === 'success'">완료!</span>
                    <span v-else-if="updateStatus[order.orderId] === 'error'">오류</span>
                    <span v-else>저장</span>
                  </button>
                </div>
                <div v-if="order.manualPrice" class="mt-1 text-sm text-gray-600">
                  현재: ¥{{ order.manualPrice.toLocaleString() }}
                </div>
              </td>
              <td class="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ¥{{ order.totalOrderPrice.toLocaleString() }}
              </td>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                ¥{{ order.shippingFee.toLocaleString() }}
              </td>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                ¥{{ order.price.toLocaleString() }}
              </td>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ order.quantity.toLocaleString() }}개
              </td>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(order.orderDate?.toDate()) }}
              </td>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatManualPriceDate(order.manualPriceUpdatedAt) }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template> 