import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            setProfile(snap.data());
          }
        } catch (err) {
          console.error("Error loading profile:", err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const register = async (email, password, nombre, comunidad, telefono) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: nombre });

    const profileData = {
      nombre,
      comunidad: comunidad || "",
      telefono: telefono || "",
      email,
      creadoEn: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", cred.user.uid), profileData);
    setProfile(profileData);
    return cred.user;
  };

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    try {
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (snap.exists()) {
        setProfile(snap.data());
      }
    } catch (err) {
      console.error("Error loading profile after login:", err);
    }
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    try {
      const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (snap.exists()) setProfile(snap.data());
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  return { user, profile, loading, register, login, logout, refreshProfile };
}
