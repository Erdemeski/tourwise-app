// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "tourism-website-2a634.firebaseapp.com",
    projectId: "tourism-website-2a634",
    storageBucket: "tourism-website-2a634.appspot.com",
    messagingSenderId: "383976084297",
    appId: "1:383976084297:web:c042fada67f992996c0098"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);