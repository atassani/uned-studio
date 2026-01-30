import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { loginWithGoogle, loginAsGuest } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Iniciar sesión</h1>
      <button className="bg-blue-600 text-white px-4 py-2 rounded mb-4" onClick={loginWithGoogle}>
        Iniciar sesión con Google
      </button>
      <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded" onClick={loginAsGuest}>
        Entrar como invitado
      </button>
    </div>
  );
}
