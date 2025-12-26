
import React from 'react';
import { BrandLogo, CheckCircleIcon } from './Icons';

interface AuthProps {
  onLoginSuccess: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const handleLogin = () => {
    // Simula um login bem sucedido sem precisar de servidor
    onLoginSuccess({ 
        email: 'arquiteto@estudio.com', 
        displayName: 'Arquiteto Principal', 
        uid: 'local-user' 
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Elementos Decorativos */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
         <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
         <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 text-center border border-slate-200">
        <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <BrandLogo className="w-10 h-10 text-white" />
            </div>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-2">E-Projet</h1>
        <p className="text-slate-500 mb-10">Gestão Profissional para Escritórios de Arquitetura</p>

        <div className="space-y-4">
            <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center px-4 py-4 border border-transparent rounded-xl shadow-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-all transform hover:scale-[1.02] active:scale-95"
            >
                <CheckCircleIcon className="w-6 h-6 mr-2" />
                ACESSAR PAINEL DE GESTÃO
            </button>
            
            <p className="text-xs text-slate-400 px-4">
                Sistema operando em modo offline. Seus dados são salvos localmente neste navegador.
            </p>
        </div>
        
        <div className="mt-10 pt-6 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                &copy; {new Date().getFullYear()} Studio Battelli &bull; Sistema Profissional
            </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
