'use client';

import { Activity, Clock, Plane, TrendingDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { GlowCard } from "@/components/ui/spotlight-card";

export default function DashboardStats({ 
  totalVuelos, 
  rutasActivas, 
  precioPromedio 
}: { 
  totalVuelos: number, 
  rutasActivas: number, 
  precioPromedio: number 
}) {
  const [segundos, setSegundos] = useState(0);
  const triggerTick = useRef(0);

  useEffect(() => {
    setSegundos(0);
    triggerTick.current += 1;

    const interval = setInterval(() => {
      setSegundos(s => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [totalVuelos]);

  return (
    // 1. EL WRAPPER CORREGIDO: flex, centrado, con max-width y mx-auto
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row justify-center items-stretch gap-6 px-4">
      
      {/* CARD 1: Total Analizado */}
      <GlowCard 
        customSize 
        glowColor="blue" 
        className="flex-1 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4 overflow-hidden group"
      >
        <div className="flex flex-col items-center gap-2 text-zinc-400">
          <Plane className="w-5 h-5 text-sky-400 mb-1" />
          <span className="text-xs font-semibold uppercase tracking-[0.15em]">Total Analizado</span>
        </div>
        <div>
          <span className="text-4xl font-bold text-white tracking-tight leading-none">
            {totalVuelos} vuelos
          </span>
        </div>
        <div className="text-sky-400 text-sm font-medium flex items-center gap-2 mt-auto">
          <Activity className="w-4 h-4" /> En {rutasActivas} rutas activas
        </div>
      </GlowCard>

      {/* CARD 2: Resumen del Mercado */}
      <GlowCard 
        customSize 
        glowColor="green" 
        className="flex-1 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4 overflow-hidden group"
      >
        <div className="flex flex-col items-center gap-2 text-zinc-400">
          <TrendingDown className="w-5 h-5 text-emerald-500 mb-1" />
          <span className="text-xs font-semibold uppercase tracking-[0.15em]">Resumen del Mercado</span>
        </div>
        <div>
          <span className="text-4xl font-bold text-white tracking-tight leading-none">
            ${precioPromedio} USD
          </span>
        </div>
        <div className="text-emerald-500 text-sm font-medium mt-auto">
          Precio promedio global online
        </div>
      </GlowCard>

      {/* CARD 3: Motor Asíncrono (Fijate el "relative" en la clase principal) */}
      <GlowCard 
        customSize 
        glowColor="green" 
        className="relative flex-1 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4 overflow-hidden group"
      >
        {/* EL PUNTO VERDE CORREGIDO: ahora vive anclado a la esquina de esta tarjeta */}
        <span className="absolute top-6 right-6 flex h-3 w-3 z-20">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>

        <div className="flex flex-col items-center gap-2 text-zinc-400 mb-1">
          <Clock className="w-5 h-5 text-zinc-300 mb-1" />
          <span className="text-xs font-semibold uppercase tracking-[0.15em]">Estado del Sistema</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-white leading-tight">Motor Asíncrono Funcional</span>
          <span className="text-zinc-400 text-xs font-medium block mt-1">Activo y Escuchando</span>
        </div>
        
        <div 
           key={triggerTick.current} 
           className="text-zinc-500 text-sm font-medium mt-auto animate-in fade-in duration-700"
        >
          Actualizado hace <span className="text-emerald-500 font-bold font-mono">{segundos}</span> seg.
        </div>
      </GlowCard>

    </div>
  );
}
