import { getFirestore, collection, onSnapshot, query, where, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ref, type Ref } from 'vue';

const db = getFirestore();
const auth = getAuth();

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
  skuId: string;
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
  manualPrice?: number;
  manualPriceUpdatedAt?: Timestamp;
  manualPriceUpdateUid?: string;
}

export interface TaobaoOrdersDoc {
  orders: TaobaoOrder[];
  userId: string;
  userDisplayName?: string;
}

export const useTaobaoOrders = (selectedUserId: Ref<string | null>) => {
  const orders = ref<TaobaoOrdersDoc[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const allUserIds = ref<string[]>([]);

  const unsubscribe = ref<(() => void) | null>(null);
  const userIdsUnsubscribe = ref<(() => void) | null>(null);

  const fetchUserDisplayName = async (uid: string): Promise<string> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? userDoc.data().displayName || '' : '';
    } catch (err) {
      console.error(`Error fetching user displayName for ${uid}:`, err);
      return '';
    }
  };

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
        async (snapshot) => {
          const ordersWithDisplayNames = await Promise.all(
            snapshot.docs.map(async (doc) => ({
              userId: doc.id,
              orders: doc.data().orders,
              userDisplayName: await fetchUserDisplayName(doc.id),
            }))
          );
          
          orders.value = ordersWithDisplayNames;
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

export const updateOrderManualPrice = async (
  userId: string,
  orderId: string,
  manualPrice: number,
) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    const docRef = doc(db, 'taobaoOrders', userId);
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }

    const data = docSnap.data();
    const orders = data.orders || [];
    
    const now = Timestamp.now();
    
    const updatedOrders = orders.map((order: TaobaoOrder) => {
      if (order.orderId === orderId) {
        return {
          ...order,
          manualPrice,
          manualPriceUpdatedAt: now,
          manualPriceUpdateUid: currentUser.uid
        };
      }
      return order;
    });

    await updateDoc(docRef, {
      orders: updatedOrders
    });

    return true;
  } catch (error) {
    console.error('Error updating manual price:', error);
    throw error;
  }
}; 