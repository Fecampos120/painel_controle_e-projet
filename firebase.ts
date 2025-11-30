
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// SUBSTITUA COM SUAS CHAVES DO CONSOLE DO FIREBASE
// Se ainda não tiver as chaves, o app funcionará em Modo Demo (Local).
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_MESSAGING_ID",
  appId: "SEU_APP_ID"
};

let app;
let auth: any = null;
let googleProvider: any = null;
let db: any = null;

// Validação robusta para evitar crash se as chaves forem inválidas ou placeholders
const isConfigValid = 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "SUA_API_KEY_AQUI" &&
    firebaseConfig.projectId !== "SEU_PROJECT_ID";

if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
    console.log("Firebase inicializado com sucesso.");
  } catch (error) {
    console.error("Erro ao inicializar Firebase (verifique firebase.ts):", error);
    // Garante que fiquem nulos para ativar o fallback
    auth = null;
    db = null;
  }
} else {
  console.warn("Firebase não inicializado: Usando Modo Demo Local.");
}

export { auth, googleProvider, db };
