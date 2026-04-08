'use client';

import { useState } from 'react';
import MiniRouteCard from './MiniRouteCard';
import { Search, X } from 'lucide-react';

export default function RouteSearchFilter({ historialPorRuta }: { historialPorRuta: Record<string, any[]> }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Las claves son del tipo "EZE ✈ TYO", por lo que al hacer lowercase matchea fácil EZE, TYO, etc.
  const filteredRutas = Object.entries(historialPorRuta).filter(([ruta]) => 
    ruta.toLowerCase().includes(searchTerm.toLowerCase().replace('-', ' '))
  );

  return (
    <div className="w-full max-w-6xl mb-12">
      <div className="flex justify-between items-center mb-6 px-1 flex-col sm:flex-row gap-4">
        <h2 className="text-xl font-semibold text-white tracking-wide">Mercado en vivo</h2>
        
        {/* Barra de Filtro */}
        <div className="relative w-full sm:w-72 group">
          <input 
            type="text" 
            placeholder="Buscar ruta (ej: EZE)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-4 py-2.5 pl-11 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 text-white text-sm transition-all"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-sky-400" />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-800 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(historialPorRuta).length === 0 ? (
          <div className="col-span-full h-64 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-2xl flex items-center justify-center shadow-2xl">
            <span className="text-zinc-500 uppercase tracking-widest text-sm text-center px-4 font-medium">
              Esperando datos... ¿Está prendida la API?
            </span>
          </div>
        ) : filteredRutas.length === 0 ? (
          <div className="col-span-full h-40 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-2xl flex flex-col items-center justify-center gap-2 shadow-2xl">
             <span className="text-zinc-400 font-medium">No se encontraron vuelos para "{searchTerm}"</span>
             <button onClick={() => setSearchTerm('')} className="text-sm text-sky-400 hover:text-sky-300 underline underline-offset-4">Limpiar búsqueda</button>
          </div>
        ) : (
          filteredRutas.map(([ruta, historial]) => (
            <MiniRouteCard key={ruta} ruta={ruta} historial={historial} />
          ))
        )}
      </div>
    </div>
  );
}
