// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDajhxwyZPFraNYPETWyqnUaagu-9CR1uk",
  authDomain: "parkcam-55b53.firebaseapp.com",
  databaseURL: "https://parkcam-55b53-default-rtdb.firebaseio.com",
  projectId: "parkcam-55b53",
  storageBucket: "parkcam-55b53.firebasestorage.app",
  messagingSenderId: "891812600736",
  appId: "1:891812600736:web:787dbbf83c8197a39662c5",
  measurementId: "G-3JP9C5ZPD3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Initialize Firestore and export it
const firestore_DB = getFirestore(app);  // <-- Added initialization
export { firestore_DB };