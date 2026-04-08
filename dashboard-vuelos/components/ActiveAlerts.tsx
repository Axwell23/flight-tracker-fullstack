'use client';

import { useState, useEffect } from 'react';
import { Plane, Trash2, Loader2, BellRing, BellOff } from 'lucide-react';
import { GlowCard } from '@/components/ui/spotlight-card';

export default function ActiveAlerts({ apiKey }: { apiKey: string }) {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlertas = async () => {
    try {
      const res = await fetch('http://localhost:8000/alertas', {
        headers: { 'X-Api-Key': apiKey }
      });
      if (res.ok) {
        const data = await res.json();
        setAlertas(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
  }, [apiKey]);

  const handleDelete = async (id: number) => {
    const prevAlertas = [...alertas];
    // Optimistic UI update: saco la alerta inmediatamente
    setAlertas(prev => prev.filter(a => a.id !== id));
    setLoadingIds(prev => new Set(prev).add(id));

    try {
      const res = await fetch(`http://localhost:8000/alertas/${id}`, {
        method: 'DELETE',
        headers: { 'X-Api-Key': apiKey }
      });
      if (!res.ok) {
        throw new Error('Error al eliminar');
      }
    } catch (err) {
      setAlertas(prevAlertas); // Rollback en caso de error
      console.error(err);
    } finally {
      setLoadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-12 flex justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mb-12">
      <div className="flex items-center gap-3 mb-6 px-1">
        <BellRing className="w-5 h-5 text-emerald-400" />
        <h2 className="text-xl font-semibold text-white tracking-wide">Tus alertas vigentes</h2>
      </div>

      {alertas.length === 0 ? (
        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-zinc-900/80 rounded-full flex items-center justify-center border border-zinc-800 mb-4 shadow-inner">
            <BellOff className="w-6 h-6 text-zinc-500" />
          </div>
          <h3 className="text-zinc-300 font-medium text-lg">No tenés alertas activas todavía</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alertas.map(alerta => (
            <GlowCard 
              key={alerta.id}
              customSize 
              glowColor="green"
              className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-5 gap-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white font-mono">{alerta.origen}</span>
                  <Plane className="w-4 h-4 text-zinc-500" />
                  <span className="font-bold text-lg text-white font-mono">{alerta.destino}</span>
                </div>
                <button
                  onClick={() => handleDelete(alerta.id)}
                  disabled={loadingIds.has(alerta.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                  title="Eliminar"
                >
                  {loadingIds.has(alerta.id) ? (
                    <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center">
                <span className="text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1 rounded-md text-sm border border-emerald-500/20">
                  Precio Objetivo: ${alerta.precio_umbral_usd}
                </span>
              </div>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  );
}
