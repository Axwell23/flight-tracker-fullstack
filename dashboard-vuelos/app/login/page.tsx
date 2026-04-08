'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@portfolio.com' && password === 'admin123') {
      setError(false);
      router.push('/');
    } else {
      setError(true);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#050505] to-[#050505] relative overflow-hidden">
      
      {/* Luz superior decorativa */}
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-purple-500/50 via-cyan-400/50 to-transparent"></div>
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">Dashboard</span> de Vuelos
            </h1>
          </Link>
          <p className="text-zinc-400 text-sm tracking-widest uppercase">
            Acceso Autorizado
          </p>
        </div>

        {/* Tarjeta Glassmorphism (Basado en Flowbite pero adaptado a tu estilo) */}
        <div className="relative border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur-xl p-8 overflow-hidden shadow-2xl">
          {/* Brillo sutil interno */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-50 blur-xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-semibold text-white mb-6">Iniciar Sesión</h2>
            
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-zinc-300">
                  Tu correo electrónico
                </label>
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-900/50 border border-zinc-700 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-3 transition-colors placeholder-zinc-500" 
                  placeholder="nombre@empresa.com" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-zinc-300">
                  Contraseña
                </label>
                <input 
                  type="password" 
                  name="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="bg-zinc-900/50 border border-zinc-700 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-3 transition-colors placeholder-zinc-500" 
                  required 
                />
                {error && (
                  <p className="text-red-500/90 text-sm mt-2 font-medium">
                    Credenciales incorrectas
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input 
                      id="remember" 
                      aria-describedby="remember" 
                      type="checkbox" 
                      className="w-4 h-4 bg-zinc-900 border-zinc-700 rounded text-emerald-600 focus:ring-emerald-500 focus:ring-2" 
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="remember" className="text-zinc-400">Recordarme</label>
                  </div>
                </div>
                <a href="#" className="text-sm font-medium text-emerald-500 hover:text-emerald-400 hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              
              <button 
                type="submit" 
                className="w-full text-white bg-gradient-to-r from-emerald-600 to-sky-500 hover:from-emerald-500 hover:to-sky-400 focus:ring-4 focus:outline-none focus:ring-emerald-500/50 font-medium rounded-lg text-sm px-5 py-3 text-center transition-all duration-300 shadow-lg shadow-emerald-500/20"
              >
                Ingresar al Dashboard
              </button>
              
              <p className="text-sm font-light text-zinc-400 text-center">
                ¿No tenés cuenta aún? <a href="#" className="font-medium text-sky-400 hover:underline">Solicitar acceso</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
