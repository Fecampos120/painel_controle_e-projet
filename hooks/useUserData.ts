
import { useState, useEffect, useCallback } from 'react';
import { AppData } from '../types';

const LOCAL_STORAGE_KEY = 'E_PROJET_DATA_V1';

// Função de mesclagem profunda para evitar propriedades undefined em objetos complexos
const deepMerge = (target: any, source: any) => {
  const output = { ...target };
  if (source && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      if (source[key] !== undefined && source[key] !== null) {
        if (typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key]) {
          output[key] = deepMerge(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      }
    });
  }
  return output;
};

export const useUserData = (user: any, initialData: AppData) => {
  const [data, setData] = useState<AppData>(initialData);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData && localData !== "undefined" && localData !== "null") {
            const parsedData = JSON.parse(localData);
            
            // Mescla os dados salvos sobre os iniciais, preservando novas estruturas
            const merged = deepMerge(initialData, parsedData);
            
            // Garantia extra para todas as listas principais
            const finalData = {
              ...merged,
              contracts: merged.contracts || [],
              budgets: merged.budgets || [],
              installments: merged.installments || [],
              schedules: merged.schedules || [],
              partners: merged.partners || [],
              checklists: merged.checklists || [],
              expenses: merged.expenses || [],
              notes: merged.notes || [],
              visitLogs: merged.visitLogs || [],
              projectUpdates: merged.projectUpdates || [],
              otherPayments: merged.otherPayments || []
            };

            setData(finalData);
        } else {
            setData(initialData);
        }
    } catch (e) {
        console.error("Erro crítico ao restaurar banco de dados:", e);
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
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(resolvedData));
      } catch (error) {
          console.error("Erro ao persistir dados:", error);
      }
      return resolvedData;
    });
  }, []);

  return { data, saveData, loadingData };
};
