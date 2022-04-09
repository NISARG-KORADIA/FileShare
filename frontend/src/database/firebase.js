import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBfpMz_AQoOJEvLiT2BI9bfIFHbIZsD9pc",
  authDomain: "fileshare-b91d6.firebaseapp.com",
  projectId: "fileshare-b91d6",
  storageBucket: "fileshare-b91d6.appspot.com",
  messagingSenderId: "429426053321",
  appId: "1:429426053321:web:390bd85f3b44048f14bd18"
};

const app = initializeApp(firebaseConfig);

export default app;