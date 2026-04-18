import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
  limit,
  startAfter,
  increment,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// ── Items (paginados) ──

export function subscribeItems(callback) {
  const q = query(collection(db, 'items'), orderBy('creadoEn', 'desc'), limit(20));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    callback({ items, lastDoc });
  }, (error) => {
    console.error('Error subscribing to items:', error);
    callback({ items: [], lastDoc: null });
  });
}

export async function loadMoreItems(lastDoc) {
  if (!lastDoc) return { items: [], lastDoc: null };
  const q = query(
    collection(db, 'items'),
    orderBy('creadoEn', 'desc'),
    startAfter(lastDoc),
    limit(20)
  );
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  return { items, lastDoc: newLastDoc };
}

export async function addItem(item) {
  const docRef = await addDoc(collection(db, 'items'), {
    ...item,
    creadoEn: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteItem(itemId) {
  await deleteDoc(doc(db, 'items', itemId));
}

export async function updateItem(itemId, data) {
  await updateDoc(doc(db, 'items', itemId), data);
}

// ── Alerts ──

export function subscribeAlerts(userId, callback) {
  const q = query(collection(db, 'alerts'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(alerts);
  });
}

export async function saveAlerts(userId, alerts) {
  const q = query(collection(db, 'alerts'), where('userId', '==', userId));
  const existing = await getDocs(q);
  const deletePromises = existing.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);

  const addPromises = alerts.map((alert) =>
    addDoc(collection(db, 'alerts'), {
      ...alert,
      userId,
      creadoEn: serverTimestamp(),
    })
  );
  await Promise.all(addPromises);
}

// ── Alertas inteligentes: matching al publicar ──

export async function checkAlertsForNewItem(itemId, item) {
  try {
    const q = query(collection(db, 'alerts'), where('activo', '==', true));
    const snapshot = await getDocs(q);

    const notifPromises = [];

    snapshot.forEach((d) => {
      const alert = d.data();

      // No notificar al propio autor
      if (alert.userId === item.autorId) return;

      // Match por categoría (array vacío = cualquier categoría)
      const catMatch =
        !alert.categorias?.length ||
        alert.categorias.includes(item.categoria);

      // Match por tipo (array vacío = cualquier tipo)
      const tipoMatch =
        !alert.tipos?.length ||
        alert.tipos.includes(item.tipo);

      // Match por texto (keywords > 3 chars)
      let textMatch = true;
      if (alert.texto?.trim()) {
        const words = alert.texto
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3);
        if (words.length > 0) {
          const haystack = `${item.titulo || ''} ${item.descripcion || ''}`.toLowerCase();
          textMatch = words.some((w) => haystack.includes(w));
        }
      }

      if (catMatch && tipoMatch && textMatch) {
        notifPromises.push(
          addDoc(collection(db, 'notifications'), {
            userId: alert.userId,
            itemId,
            itemTitulo: item.titulo || '',
            itemCategoria: item.categoria || '',
            itemTipo: item.tipo || '',
            alertTexto: alert.texto || '',
            leido: false,
            creadoEn: serverTimestamp(),
          })
        );
      }
    });

    await Promise.all(notifPromises);
  } catch (err) {
    console.error('Error checking alerts:', err);
  }
}

// ── Notificaciones in-app ──

export function subscribeNotifications(userId, callback) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('creadoEn', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('Error subscribing to notifications:', err);
    callback([]);
  });
}

export async function markNotificationRead(notifId) {
  await updateDoc(doc(db, 'notifications', notifId), { leido: true });
}

export async function markAllNotificationsRead(userId) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('leido', '==', false)
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { leido: true })));
}

// ── Reportar artículos (Flagging) ──

export async function flagItem(itemId, userId, reason) {
  const flagId = `${userId}_${itemId}`;
  await setDoc(doc(db, 'flags', flagId), {
    itemId,
    userId,
    reason,
    creadoEn: serverTimestamp(),
  });
  await updateDoc(doc(db, 'items', itemId), {
    flagCount: increment(1),
  });
}

// ── Admin ──

export function subscribeAdminFlaggedItems(callback) {
  const q = query(
    collection(db, 'items'),
    where('flagCount', '>', 0),
    orderBy('flagCount', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('Admin flagged items error:', err);
    callback([]);
  });
}

export async function adminClearFlags(itemId) {
  await updateDoc(doc(db, 'items', itemId), { flagCount: 0 });
}

export async function getAdminStats() {
  const [itemsSnap, usersSnap] = await Promise.all([
    getDocs(collection(db, 'items')),
    getDocs(collection(db, 'users')),
  ]);
  return {
    totalItems: itemsSnap.size,
    totalUsers: usersSnap.size,
  };
}

// ── Private Chats ──

export function buildChatId(uid1, uid2, itemId) {
  return [uid1, uid2].sort().join('|') + '|' + itemId;
}

export async function getOrCreateChat(buyerId, buyerName, sellerId, sellerName, item) {
  const chatId = buildChatId(buyerId, sellerId, item.id);
  const chatRef = doc(db, 'chats', chatId);
  const snap = await getDoc(chatRef);
  if (!snap.exists()) {
    await setDoc(chatRef, {
      participants: [buyerId, sellerId],
      names: { [buyerId]: buyerName, [sellerId]: sellerName },
      itemId: item.id,
      itemTitulo: item.titulo,
      itemFoto: item.fotos?.[0] || null,
      lastMessage: null,
      lastMessageAt: serverTimestamp(),
      lastAutorId: null,
    });
  }
  return chatId;
}

export function subscribeUserChats(userId, callback) {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('Error subscribing to chats:', err);
    callback([]);
  });
}

export function subscribeChatMessages(chatId, callback) {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('creadoEn', 'asc'),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function sendChatMessage(chatId, autorId, texto) {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    texto,
    autorId,
    creadoEn: serverTimestamp(),
  });
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: texto.length > 80 ? texto.slice(0, 80) + '...' : texto,
    lastMessageAt: serverTimestamp(),
    lastAutorId: autorId,
  });
}

// ── Reviews ──

export function subscribeSellerReviews(sellerId, callback) {
  const q = query(
    collection(db, 'reviews'),
    where('sellerId', '==', sellerId),
    orderBy('creadoEn', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('Error loading reviews:', err);
    callback([]);
  });
}

export async function submitReview(sellerId, buyerId, buyerName, rating, comment, item) {
  const reviewId = `${buyerId}_${sellerId}`;
  await setDoc(doc(db, 'reviews', reviewId), {
    sellerId,
    buyerId,
    buyerName,
    rating,
    comment: comment?.trim() || '',
    itemId: item?.id || null,
    itemTitulo: item?.titulo || null,
    creadoEn: serverTimestamp(),
  });
}

export async function getSellerProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ── User profile ──

export async function updateUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}
