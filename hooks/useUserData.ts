
import { useState, useEffect } from 'react';
import { AppData } from '../types';

const LOCAL_STORAGE_KEY = 'E_PROJET_DATA_V1';

export const useUserData = (user: any, initialData: AppData) => {
  const [data, setData] = useState<AppData>(initialData);
  const [loadingData, setLoadingData] = useState(true);

  // Carrega os dados do LocalStorage ao iniciar
  useEffect(() => {
    try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        // Verifica se existe dado e se não é a string literal "undefined"
        if (localData && localData !== "undefined" && localData !== "null") {
            const parsedData = JSON.parse(localData);
            // Mescla dados iniciais com os salvos para garantir que novos campos do sistema apareçam (migração de schema)
            setData({ ...initialData, ...parsedData });
        } else {
            setData(initialData);
        }
    } catch (e) {
        console.error("Erro ao carregar dados locais:", e);
        // Em caso de erro no JSON, reseta para os dados iniciais para não travar o app
        setData(initialData);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
        setLoadingData(false);
    }
  }, []);

  const saveData = async (newData: AppData) => {
    // Proteção contra salvar dados nulos ou indefinidos
    if (!newData) return;
    
    setData(newData);
    try {
        const dataToSave = JSON.stringify(newData);
        if (dataToSave && dataToSave !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
        }
    } catch (error) {
        console.error("Erro ao salvar no LocalStorage:", error);
        alert("O armazenamento do navegador está cheio ou desabilitado. Seus dados podem não ser salvos.");
    }
  };

  return { data, saveData, loadingData };
};
