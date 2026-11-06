import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const firebaseConfig = {

 apiKey: "AIzaSyB7ZwiaLLRseJt1bOUTri6i6gCwPvrCAy0",

 authDomain:
 "tutsecretsanta2026.firebaseapp.com",

 projectId:
 "tutsecretsanta2026",

 storageBucket:
 "tutsecretsanta2026.firebasestorage.app",

 messagingSenderId:
 "59943278632",

 appId:
 "1:59943278632:web:6f0b568b7fa0a624c33d1d"

};

const app =
 initializeApp(firebaseConfig);

export const db =
 getFirestore(app);

export const auth =
 getAuth(app);
