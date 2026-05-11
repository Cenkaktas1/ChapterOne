import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBaSlsLfSRCKwjU3siTefGZendKm5PFh08",
  authDomain: "chapterone-ddf5a.firebaseapp.com",
  projectId: "chapterone-ddf5a",
  storageBucket: "chapterone-ddf5a.firebasestorage.app",
  messagingSenderId: "387705841055",
  appId: "1:387705841055:web:bd1fd93abed50b0aae89aa"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
