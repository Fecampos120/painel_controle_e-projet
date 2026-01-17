
import { useState, useEffect, useCallback } from 'react';
import { AppData } from '../types';

const LOCAL_STORAGE_KEY = 'E_PROJET_DATA_V1';

export const useUserData = (user: any, initialData: AppData) => {
  const [data, setData] = useState<AppData>(initialData);
  const [loadingData, setLoadingData] = useState(true);

  // Carrega os dados do LocalStorage ao iniciar
  useEffect(() => {
    try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData && localData !== "undefined" && localData !== "null") {
            const parsedData = JSON.parse(localData);
            // Mescla dados iniciais com os salvos para garantir novos campos (migração de schema)
            setData({ ...initialData, ...parsedData });
        } else {
            setData(initialData);
        }
    } catch (e) {
        console.error("Erro ao carregar dados locais:", e);
        setData(initialData);
    } finally {
        setLoadingData(false);
    }
  }, []);

  // UseCallback para persistência imediata
  const saveData = useCallback((newDataOrUpdater: AppData | ((prev: AppData) => AppData)) => {
    setData((prev) => {
      const resolvedData = typeof newDataOrUpdater === 'function' 
        ? newDataOrUpdater(prev) 
        : newDataOrUpdater;

      if (!resolvedData) return prev;
      
      try {
          const dataToSave = JSON.stringify(resolvedData);
          localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
          console.debug("💾 E-Projet: Dados salvos localmente com sucesso.");
      } catch (error) {
          console.error("❌ E-Projet: Erro ao salvar no LocalStorage:", error);
      }
      return resolvedData;
    });
  }, []);

  return { data, saveData, loadingData };
};
