// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBpm2yAmOLjVVaXy9j6OSip7LPs-k_-sWw",
  authDomain: "christiankit-28485.firebaseapp.com",
  projectId: "christiankit-28485",
  storageBucket: "christiankit-28485.firebasestorage.app",
  messagingSenderId: "597586617802",
  appId: "1:597586617802:web:0488b4eca4c2f4e3b61b33",
  measurementId: "G-G623WR1SK6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;

// Stripe configuration
export const stripeConfig = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "your-stripe-publishable-key"
};
