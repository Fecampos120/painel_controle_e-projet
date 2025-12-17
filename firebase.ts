
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// COLE OS DADOS QUE VOCÊ TIROU DA ENGRENAGEM DO FIREBASE AQUI:
const firebaseConfig = {
  apiKey: "AIzaSy... (sua chave aqui)",
  authDomain: "painel-e-projet.firebaseapp.com",
  projectId: "painel-e-projet",
  storageBucket: "painel-e-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};

let app;
let auth: any = null;
let googleProvider: any = null;
let db: any = null;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
    console.log("✅ Firebase Conectado!");
} catch (error) {
    console.error("❌ Erro ao conectar:", error);
}

export { auth, googleProvider, db };
