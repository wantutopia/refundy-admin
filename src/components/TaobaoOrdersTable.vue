<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useTaobaoOrders, type TaobaoOrdersDoc } from '@/firebase/firestore';
import { formatDate } from '@/utils/dateFormatter';

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

const handleUserSelect = (userId: string | null) => {
  selectedUserId.value = userId;
};

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
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주문 ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">상품명</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">옵션</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">단가</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수량</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">배송비</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 결제금액</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주문일</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <template v-for="doc in orders" :key="doc.userId">
            <tr v-for="order in doc.orders" :key="order.orderId">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ order.orderId }}</td>
              <td class="px-6 py-4 w-[150px] group">
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
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ order.skuId || '-' }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                <div v-if="order.specs && order.specs.length > 0" class="space-y-1">
                  <div v-for="(spec, index) in order.specs" :key="index" class="text-xs">
                    <span class="font-medium">{{ spec.name }}:</span> {{ spec.value }}
                  </div>
                </div>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ¥{{ order.price.toLocaleString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ order.quantity.toLocaleString() }}개
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ¥{{ order.shippingFee.toLocaleString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ¥{{ order.totalOrderPrice.toLocaleString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="{
                    'bg-green-100 text-green-800': order.status === '배송완료',
                    'bg-yellow-100 text-yellow-800': order.status === '배송중',
                    'bg-red-100 text-red-800': order.status === '신청 중'
                  }">
                  {{ order.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(order.orderDate?.toDate()) }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template> 