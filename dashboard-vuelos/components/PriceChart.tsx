"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';

export default function PriceChart({ vuelos }: { vuelos: any[] }) {
  // Preparamos los datos: los ordenamos del más viejo al más nuevo para el gráfico
  const data = vuelos
    .map((v) => ({
      fecha: new Date(v.fecha_captura).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
      precio: v.precio_usd,
    }))
    .reverse();

  // Calculamos si el precio subió o bajó respecto a la última vez
  const precioActual = data[data.length - 1]?.precio || 0;
  const precioAnterior = data[data.length - 2]?.precio || precioActual;
  const tendenciaBaja = precioActual <= precioAnterior;

  return (
    <div className="w-full bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 relative overflow-hidden group shadow-2xl">
      {/* Brillo de fondo sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-cyan-500/10 blur-[50px] pointer-events-none"></div>

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-zinc-400 text-sm tracking-widest uppercase mb-1">Tendencia EZE → TYO</h3>
          <div className="flex items-end gap-3">
            <h2 className="text-4xl font-light text-white">USD {precioActual}</h2>
            {tendenciaBaja ? (
              <span className="flex items-center text-emerald-400 text-sm font-medium mb-1">
                <TrendingDown className="w-4 h-4 mr-1" /> Bajó
              </span>
            ) : (
              <span className="flex items-center text-rose-400 text-sm font-medium mb-1">
                <TrendingUp className="w-4 h-4 mr-1" /> Subió
              </span>
            )}
          </div>
        </div>
      </div>

      {/* El Gráfico */}
      <div className="h-[200px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <defs>
              {/* Filtro para el resplandor de neón del gráfico */}
              <filter id="neonGlow" height="300%" width="300%" x="-75%" y="-75%">
                <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <YAxis domain={['dataMin - 100', 'dataMax + 100']} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
              itemStyle={{ color: '#06b6d4' }}
              formatter={(value) => [`USD ${value}`, 'Precio']}
              labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
            />
            <Line 
              type="monotone" 
              dataKey="precio" 
              stroke="#06b6d4" /* Color Cyan 500 */
              strokeWidth={3}
              dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#000' }}
              activeDot={{ r: 6, fill: '#fff', stroke: '#06b6d4', strokeWidth: 2 }}
              style={{ filter: 'url(#neonGlow)' }} /* Aplicamos el resplandor */
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}