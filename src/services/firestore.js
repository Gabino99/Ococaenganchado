import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  setDoc,
  where,
  serverTimestamp,
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

// ── Alerts ──

export function subscribeAlerts(userId, callback) {
  const q = query(collection(db, "alerts"), where("userId", "==", userId));
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(alerts);
  });
}

export async function saveAlerts(userId, alerts) {
  // Delete existing alerts for this user
  const q = query(collection(db, "alerts"), where("userId", "==", userId));
  const existing = await getDocs(q);
  const deletePromises = existing.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);

  // Add new alerts
  const addPromises = alerts.map((alert) =>
    addDoc(collection(db, "alerts"), {
      ...alert,
      userId,
      creadoEn: serverTimestamp(),
    })
  );
  await Promise.all(addPromises);
}

// ── User profile ──

export async function updateUserProfile(uid, data) {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}
