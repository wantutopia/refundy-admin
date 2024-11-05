import { getFirestore, collection, onSnapshot, query, where, type DocumentData, Timestamp } from 'firebase/firestore';
import { ref, type Ref } from 'vue';
import { auth } from './firebase';

const db = getFirestore();

export interface TaobaoOrder {
  createdAt: Date;
  currentPrice: number;
  imageUrl: string;
  itemId: string;
  itemUrl: string;
  lastPriceUpdateAt: string;
  orderDate: Timestamp;
  orderId: string;
  price: number;
  priceChange: number;
  priceHistory: Array<{
    price: number;
    priceChange: number;
    propPath: string;
    timestamp: string;
  }>;
  productName: string;
  propPath: string;
  quantity: number;
  seller: string;
  shippingFee: number;
  specs: Array<{
    name: string;
    value: string;
  }>;
  status: string;
  totalOrderPrice: number;
  updatedAt: Date;
}

export interface TaobaoOrdersDoc {
  orders: TaobaoOrder[];
  userId: string;
}

export const useTaobaoOrders = (selectedUserId: Ref<string | null>) => {
  const orders = ref<TaobaoOrdersDoc[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const allUserIds = ref<string[]>([]);

  const unsubscribe = ref<(() => void) | null>(null);
  const userIdsUnsubscribe = ref<(() => void) | null>(null);

  const subscribeToUserIds = () => {
    const ordersRef = collection(db, 'taobaoOrders');
    userIdsUnsubscribe.value = onSnapshot(ordersRef, (snapshot) => {
      allUserIds.value = snapshot.docs.map(doc => doc.id).sort();
    });
  };

  const subscribeToOrders = () => {
    loading.value = true;
    error.value = null;

    try {
      const ordersRef = collection(db, 'taobaoOrders');
      let ordersQuery = query(ordersRef);

      if (selectedUserId.value) {
        ordersQuery = query(ordersRef, where('__name__', '==', selectedUserId.value));
      }

      unsubscribe.value = onSnapshot(
        ordersQuery,
        (snapshot) => {
          orders.value = snapshot.docs.map((doc) => ({
            userId: doc.id,
            orders: doc.data().orders,
          }));
          loading.value = false;
        },
        (err) => {
          console.error('Error fetching orders:', err);
          error.value = '주문 데이터를 가져오는 중 오류가 발생했습니다.';
          loading.value = false;
        }
      );
    } catch (err) {
      console.error('Error setting up orders subscription:', err);
      error.value = '주문 데이터 구독 설정 중 오류가 발생했습니다.';
      loading.value = false;
    }
  };

  const cleanup = () => {
    if (unsubscribe.value) {
      unsubscribe.value();
      unsubscribe.value = null;
    }
    if (userIdsUnsubscribe.value) {
      userIdsUnsubscribe.value();
      userIdsUnsubscribe.value = null;
    }
  };

  return {
    orders,
    loading,
    error,
    allUserIds,
    subscribeToOrders,
    subscribeToUserIds,
    cleanup,
  };
}; 