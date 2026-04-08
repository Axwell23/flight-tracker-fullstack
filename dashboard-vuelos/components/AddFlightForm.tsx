'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddFlightFormProps {
  apiKey: string;
}

export default function AddFlightForm({ apiKey }: AddFlightFormProps) {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/alertas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({
          chat_id: 12345, // ID falso como fue solicitado
          origen: origen.toUpperCase(),
          destino: destino.toUpperCase(),
          precio_limite: Number(presupuesto),
        }),
      });

      if (res.ok) {
        // Al tener éxito: limpiamos formulario de orígen, destino y prespuesto
        setOrigen('');
        setDestino('');
        setPresupuesto('');
        
        // Recargamos los datos server-side con el nuevo router de Next.js
        router.refresh();
      } else {
        console.error('Error al crear la alerta');
      }
    } catch (error) {
      console.error('Error de red creando alerta:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto mb-8">
      <div className="relative border border-zinc-800 hover:border-zinc-700 transition-colors duration-500 rounded-2xl bg-zinc-900/40 backdrop-blur-md p-6 overflow-hidden group">
        
        {/* Glow dinámico cyan/purple detrás del form al hacer hover global */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-5 flex items-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-wide uppercase text-sm">
              + Agregar Nueva Alerta
            </span>
          </h3>
          
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/4">
              <label htmlFor="origen" className="block mb-2 text-xs font-medium text-zinc-400 uppercase tracking-widest">
                Origen (IATA)
              </label>
              <input
                type="text"
                id="origen"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                maxLength={3}
                className="bg-zinc-900/50 border border-zinc-700 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-3 transition-colors placeholder-zinc-600 uppercase"
                placeholder="EZE"
                required
              />
            </div>

            <div className="w-full md:w-1/4">
              <label htmlFor="destino" className="block mb-2 text-xs font-medium text-zinc-400 uppercase tracking-widest">
                Destino (IATA)
              </label>
              <input
                type="text"
                id="destino"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                maxLength={3}
                className="bg-zinc-900/50 border border-zinc-700 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-3 transition-colors placeholder-zinc-600 uppercase"
                placeholder="NRT"
                required
              />
            </div>

            <div className="w-full md:w-1/4">
              <label htmlFor="presupuesto" className="block mb-2 text-xs font-medium text-zinc-400 uppercase tracking-widest">
                Presupuesto (USD)
              </label>
              <input
                type="number"
                id="presupuesto"
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value)}
                min="1"
                className="bg-zinc-900/50 border border-zinc-700 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-3 transition-colors placeholder-zinc-600"
                placeholder="1500"
                required
              />
            </div>

            <div className="w-full md:w-1/4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 focus:ring-4 focus:outline-none focus:ring-cyan-800 disabled:opacity-50 text-white font-medium rounded-lg text-sm px-5 py-3 text-center transition-all duration-300 shadow-lg shadow-purple-500/20 border border-purple-500/30"
              >
                {loading ? 'Creando...' : 'Crear Alerta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
