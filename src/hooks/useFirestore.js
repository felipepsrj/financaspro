// src/hooks/useFirestore.js
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

const USER_ID = 'meu_usuario'; // fixo por enquanto (sem auth)

export function useFirestore(collectionName, defaultData) {
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, collectionName, USER_ID);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setData(snap.data());
      } else {
        setData(defaultData);
      }
      setLoading(false);
    }, (err) => {
      console.error('Firestore error:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [collectionName]);

  const save = useCallback(async (newData) => {
    const ref = doc(db, collectionName, USER_ID);
    await setDoc(ref, newData, { merge: true });
  }, [collectionName]);

  return { data, loading, save };
}
