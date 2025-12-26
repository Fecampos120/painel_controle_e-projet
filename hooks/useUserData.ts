
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
        if (localData) {
            const parsedData = JSON.parse(localData);
            // Mescla dados iniciais com os salvos para garantir que novos campos do sistema apareçam
            setData({ ...initialData, ...parsedData });
        } else {
            setData(initialData);
        }
    } catch (e) {
        console.error("Erro ao carregar dados locais", e);
        setData(initialData);
    } finally {
        setLoadingData(false);
    }
  }, []);

  const saveData = async (newData: AppData) => {
    setData(newData);
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
        console.error("Erro ao salvar no LocalStorage:", error);
        alert("O armazenamento do navegador está cheio ou desabilitado. Seus dados podem não ser salvos.");
    }
  };

  return { data, saveData, loadingData };
};
