"use client";

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Esta es la magia de Next.js: vuelve a hacer el fetch del servidor sin recargar la web entera
    router.refresh(); 
    
    // Le damos 1 segundo de gracia a la animación para que se vea fluida
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <button 
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="group flex items-center gap-2 px-6 py-2.5 bg-zinc-900/80 backdrop-blur-sm text-zinc-300 rounded-full transition-all duration-500 border border-zinc-700 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw className={`w-4 h-4 transition-transform duration-500 group-hover:text-cyan-400 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
      <span className="text-sm tracking-wide font-medium">
        {isRefreshing ? 'Sincronizando...' : 'Actualizar Datos'}
      </span>
    </button>
  );
}