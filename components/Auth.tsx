
import React from 'react';
import { CheckCircleIcon } from './Icons';

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
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-lg z-10 text-center border border-slate-200 animate-fadeIn">
        {/* Container da Logomarca Oficial */}
        <div className="flex justify-center mb-10">
            <div className="w-full max-w-[320px] transition-transform hover:scale-105 duration-500">
                {/* Aqui deve entrar o caminho da imagem da logo enviada */}
                <img 
                    src="https://raw.githubusercontent.com/fabiomarcal/eprojet-assets/main/logo-gestao-eprojet.png" 
                    alt="Gestão E-Projet" 
                    className="w-full h-auto object-contain"
                    onError={(e) => {
                        // Fallback caso a imagem não carregue
                        e.currentTarget.src = "https://placehold.co/600x300/white/0f172a?text=Gestão+E-Projet";
                    }}
                />
            </div>
        </div>
        
        <div className="space-y-6">
            <div className="space-y-2 mb-8">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Portal de Acesso</h2>
                <div className="h-1 w-12 bg-blue-600 mx-auto rounded-full"></div>
            </div>

            <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center px-6 py-5 border border-transparent rounded-2xl shadow-2xl bg-slate-900 text-white font-black text-xs tracking-[0.2em] hover:bg-blue-600 transition-all transform hover:-translate-y-1 active:scale-95 group"
            >
                <CheckCircleIcon className="w-6 h-6 mr-3 text-blue-400 group-hover:text-white transition-colors" />
                ACESSAR PAINEL DE GESTÃO
            </button>
            
            <div className="pt-4 px-6">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    Sistema de gestão técnica exclusivo para arquitetos e urbanistas.
                </p>
            </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-100">
            <p className="text-[9px] text-slate-300 uppercase font-black tracking-[0.4em]">
                &copy; {new Date().getFullYear()} E-PROJET V2.5
            </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
