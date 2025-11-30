
import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AppData } from '../types';

const LOCAL_STORAGE_KEY = 'E_PROJET_DATA_V1';

export const useUserData = (user: any, initialData: AppData) => {
  const [data, setData] = useState<AppData>(initialData);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    // Caso 1: Usuário não logado
    if (!user || !user.email) {
        setLoadingData(false);
        return;
    }
    
    // Caso 2: Firebase não configurado (Modo Demo/Local)
    if (!db) {
        console.warn("Firestore não inicializado. Usando LocalStorage.");
        try {
            const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (localData) {
                const parsedData = JSON.parse(localData);
                // Mescla dados salvos com a estrutura inicial para garantir novos campos
                setData({ ...initialData, ...parsedData });
            } else {
                setData(initialData);
            }
        } catch (e) {
            console.error("Erro ao carregar do LocalStorage", e);
            setData(initialData);
        }
        setLoadingData(false);
        return;
    }

    // Caso 3: Firebase Configurado (Modo Nuvem)
    const userDocRef = doc(db, 'users_data', user.email);
    
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setData({ ...initialData, ...docSnap.data() as AppData });
      } else {
        setDoc(userDocRef, initialData);
        setData(initialData);
      }
      setLoadingData(false);
    }, (error) => {
        console.error("Erro ao carregar dados do Firestore:", error);
        // Fallback silencioso para dados locais em caso de erro de permissão/rede
        setLoadingData(false);
    });

    return () => unsubscribe();
  }, [user]);

  const saveData = async (newData: AppData) => {
    // Atualiza estado local (UI)
    setData(newData);
    
    if (user && user.email) {
        if (db) {
            // Salva na Nuvem (Firestore)
            try {
                const userDocRef = doc(db, 'users_data', user.email);
                await setDoc(userDocRef, newData);
            } catch (error) {
                console.error("Erro ao salvar na nuvem:", error);
            }
        } else {
            // Salva Localmente (LocalStorage)
            try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
            } catch (error) {
                console.error("Erro ao salvar no LocalStorage:", error);
            }
        }
    }
  };

  return { data, saveData, loadingData };
};
