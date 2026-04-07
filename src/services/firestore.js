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
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// ── Items ──

export function subscribeItems(callback) {
  const q = query(collection(db, "items"), orderBy("creadoEn", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  }, (error) => {
    console.error("Error subscribing to items:", error);
    callback([]);
  });
}

export async function addItem(item) {
  const docRef = await addDoc(collection(db, "items"), {
    ...item,
    creadoEn: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteItem(itemId) {
  await deleteDoc(doc(db, "items", itemId));
}

export async function updateItem(itemId, data) {
  await updateDoc(doc(db, "items", itemId), data);
}

// ── Alerts ──

export function subscribeAlerts(userId, callback) {
  const q = query(collection(db, "alerts"), where("userId", "==", userId));
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(alerts);
  });
}

export async function saveAlerts(userId, alerts) {
  const q = query(collection(db, "alerts"), where("userId", "==", userId));
  const existing = await getDocs(q);
  const deletePromises = existing.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);

  const addPromises = alerts.map((alert) =>
    addDoc(collection(db, "alerts"), {
      ...alert,
      userId,
      creadoEn: serverTimestamp(),
    })
  );
  await Promise.all(addPromises);
}

// ── Private Chats ──

export function buildChatId(uid1, uid2, itemId) {
  return [uid1, uid2].sort().join('|') + '|' + itemId;
}

export async function getOrCreateChat(buyerId, buyerName, sellerId, sellerName, item) {
  const chatId = buildChatId(buyerId, sellerId, item.id);
  const chatRef = doc(db, "chats", chatId);
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
    collection(db, "chats"),
    where("participants", "array-contains", userId),
    orderBy("lastMessageAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error("Error subscribing to chats:", err);
    callback([]);
  });
}

export function subscribeChatMessages(chatId, callback) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("creadoEn", "asc"),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function sendChatMessage(chatId, autorId, texto) {
  await addDoc(collection(db, "chats", chatId, "messages"), {
    texto,
    autorId,
    creadoEn: serverTimestamp(),
  });
  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: texto.length > 80 ? texto.slice(0, 80) + "..." : texto,
    lastMessageAt: serverTimestamp(),
    lastAutorId: autorId,
  });
}

// ── User profile ──

export async function updateUserProfile(uid, data) {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}
