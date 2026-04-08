"use client";

import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { Clock, TrendingDown, TrendingUp } from 'lucide-react';

export default function MiniRouteCard({ ruta, historial }: { ruta: string, historial: any[] }) {
  // Ordenamos el historial del más viejo al más nuevo para el gráfico
  const data = [...historial].sort((a, b) => new Date(a.fecha_captura).getTime() - new Date(b.fecha_captura).getTime());
  
  const actual = data[data.length - 1];
  const anterior = data.length > 1 ? data[data.length - 2] : actual;
  const tendenciaBaja = actual.precio_usd <= anterior.precio_usd;

  // Calculamos la diferencia
  const diferencia = Math.abs(actual.precio_usd - anterior.precio_usd);

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 hover:border-white/20 transition-all flex flex-col justify-between h-72 shadow-xl group/card">
      {/* Cabecera de la Tarjeta */}
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-white font-semibold text-base">{ruta}</h3>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1a1f] border border-[#2d2d31] rounded-full">
            {tendenciaBaja ? <TrendingDown className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingUp className="w-3.5 h-3.5 text-rose-500" />}
            <span className={`text-xs font-medium ${tendenciaBaja ? 'text-emerald-500' : 'text-rose-500'}`}>
              ${diferencia}
            </span>
          </div>
        </div>
        <p className="text-zinc-500 text-xs mb-4">
          Fluctuación desde último registro
        </p>
      </div>

      {/* Mini Gráfico Flat (Sparkline Area) */}
      <div className="h-28 w-full mb-2 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${ruta.replace(/\W/g, '')}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={1}/>
                <stop offset="100%" stopColor="#e879f9" stopOpacity={1}/>
              </linearGradient>
              <linearGradient id={`fill-${ruta.replace(/\W/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e879f9" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin - 50', 'dataMax + 50']} hide />
            <Area 
              type="monotone" 
              dataKey="precio_usd" 
              stroke={`url(#grad-${ruta.replace(/\W/g, '')})`}
              fill={`url(#fill-${ruta.replace(/\W/g, '')})`}
              strokeWidth={3}
              activeDot={{ r: 4, fill: '#fff', stroke: '#e879f9', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer de la Tarjeta */}
      <div className="pt-4 border-t border-zinc-800 flex justify-between items-center mt-auto">
        <div className="flex items-center text-zinc-500 text-xs">
          <Clock className="w-3 h-3 mr-1.5" />
          Actualizado el {new Date(actual.fecha_captura).toLocaleDateString('es-AR')}
        </div>
        <div className="text-2xl font-light text-white">
          <span className="text-sm text-zinc-500 mr-1">USD</span>
          {actual.precio_usd}
        </div>
      </div>
    </div>
  );
}
