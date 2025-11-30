
import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { BrandLogo, DatabaseIcon } from './Icons';

interface AuthProps {
  onLoginSuccess: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!auth) {
        setError('O Firebase não está configurado.');
        return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (db) {
          const licenseRef = doc(db, 'licenses', user.email!);
          try {
            const licenseSnap = await getDoc(licenseRef);
            if (licenseSnap.exists() && licenseSnap.data().active === true) {
                onLoginSuccess(user);
            } else {
                await auth.signOut();
                setError('Licença não encontrada ou inativa para este e-mail.');
            }
          } catch (err) {
              // Se a coleção licenses não existir (primeiro uso), permitir entrada para teste do dev
              console.warn("Erro ao verificar licença (pode ser permissão ou coleção inexistente). Permitindo acesso provisório.", err);
              onLoginSuccess(user);
          }
      } else {
          onLoginSuccess(user); 
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/api-key-not-valid') {
          setError('Erro de configuração do Firebase. Verifique suas chaves de API.');
      } else {
          setError('Erro ao fazer login com Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
      // Cria um usuário fictício para uso local
      onLoginSuccess({ 
          email: 'demo@local.com', 
          displayName: 'Usuário Demo', 
          uid: 'demo-local-123' 
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
         <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
         <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 text-center">
        <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <BrandLogo className="w-10 h-10 text-white" />
            </div>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-2">E-Projet</h1>
        <p className="text-slate-500 mb-8">Faça login para acessar seu painel.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 text-left">
            {error}
          </div>
        )}

        {auth ? (
            <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-lg shadow-sm bg-white transition-all text-slate-700 font-medium hover:bg-slate-50 mb-3"
            >
            {loading ? (
                <span className="w-5 h-5 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin mr-2"></span>
            ) : (
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3" />
            )}
            {loading ? 'Verificando...' : 'Entrar com Google'}
            </button>
        ) : (
            <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200 text-left">
                <strong>Configuração Pendente:</strong><br/>
                O Firebase não está configurado corretamente. Você pode usar o modo demonstração para testar o sistema localmente.
            </div>
        )}

        <button
            onClick={handleDemoLogin}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors"
        >
            <DatabaseIcon className="w-5 h-5 mr-2" />
            Entrar em Modo Demonstração
        </button>
        
        <p className="mt-6 text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Studio Battello. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Auth;
