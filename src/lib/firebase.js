import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAhu5BiBX6RqSBs7D5x3cyCMIi6dObzNZI",
  authDomain: "financaspro-b1e39.firebaseapp.com",
  projectId: "financaspro-b1e39",
  storageBucket: "financaspro-b1e39.firebasestorage.app",
  messagingSenderId: "82700250989",
  appId: "1:82700250989:web:cdf1153736c936cbdcf464"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);