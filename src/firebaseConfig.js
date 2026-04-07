import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDA3-LpPH6ek87o3jnIA5zizynUATPwHwA",
  authDomain: "ococa-enganchado.firebaseapp.com",
  projectId: "ococa-enganchado",
  storageBucket: "ococa-enganchado.firebasestorage.app",
  messagingSenderId: "542736443853",
  appId: "1:542736443853:web:bec03441f4bd178ce0bc84",
  measurementId: "G-F77J0FRCLF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
