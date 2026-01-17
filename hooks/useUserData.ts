
import { useState, useEffect, useCallback } from 'react';
import { AppData } from '../types';

const LOCAL_STORAGE_KEY = 'E_PROJET_DATA_V1';

export const useUserData = (user: any, initialData: AppData) => {
  const [data, setData] = useState<AppData>(initialData);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData && localData !== "undefined" && localData !== "null") {
            const parsedData = JSON.parse(localData);
            
            // GARANTIA DE INTEGRIDADE: 
            // Mescla o initialData (que tem todos os campos novos vazios) 
            // com o parsedData (que tem os dados antigos salvos).
            const merged = { ...initialData };
            
            Object.keys(initialData).forEach((key) => {
                const k = key as keyof AppData;
                // Se o dado salvo existe, usa ele. Se for nulo/indefinido, mantém o do initialData.
                if (parsedData[k] !== undefined && parsedData[k] !== null) {
                    (merged as any)[k] = parsedData[k];
                }
            });

            setData(merged);
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

  const saveData = useCallback((newDataOrUpdater: AppData | ((prev: AppData) => AppData)) => {
    setData((prev) => {
      const resolvedData = typeof newDataOrUpdater === 'function' 
        ? newDataOrUpdater(prev) 
        : newDataOrUpdater;

      if (!resolvedData) return prev;
      
      try {
          const dataToSave = JSON.stringify(resolvedData);
          localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
      } catch (error) {
          console.error("Erro ao salvar no LocalStorage:", error);
      }
      return resolvedData;
    });
  }, []);

  return { data, saveData, loadingData };
};
