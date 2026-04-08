'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, PlaneLanding, Send, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlowCard } from '@/components/ui/spotlight-card';

export default function AddAlertForm({ apiKey, precioActualMercado }: { apiKey: string, precioActualMercado: number }) {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [precio, setPrecio] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const router = useRouter();

  // Temporary fix for the default image the user requested
  const imageUrl = "https://cn-geo1.uber.com/image-proc/crop/resizecrop/udam/format=auto/width=1344/height=896/srcb64=aHR0cHM6Ly90Yi1zdGF0aWMudWJlci5jb20vcHJvZC91ZGFtLWFzc2V0cy9hM2NmODU2NC1lMmE2LTQxOGMtYjliMC02NWRkMjg1YzEwMGIuanBn";
  const city = "Monitoreo Global";

  useEffect(() => {
    if (status.type) {
      const timer = setTimeout(() => {
        setStatus({ type: null, message: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const precioIngresado = parseFloat(precio) || 0;
  const esPrecioMenor = precioIngresado > 0 && precioIngresado < precioActualMercado;
  const diferenciaPorcentual = precioIngresado > 0 && precioActualMercado > 0 
    ? (((precioActualMercado - precioIngresado) / precioActualMercado) * 100).toFixed(1)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origen || !destino || !precio) return;
    setIsLoading(true);
    setStatus({ type: null, message: '' });
    
    try {
      const payload = {
        usuario_id: 1, 
        origen: origen.trim().toUpperCase(),
        destino: destino.trim().toUpperCase(),
        precio_limite: parseFloat(precio)
      };

      const res = await fetch('http://localhost:8000/alertas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setOrigen('');
        setDestino('');
        setPrecio('');
        setStatus({ type: 'success', message: '✓ Alerta creada. Notificación Telegram activa.' });
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => null);
        setStatus({ type: 'error', message: errorData?.detail?.[0]?.msg || errorData?.detail || 'Error del servidor.' });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Fallo de red al conectar con la API.' });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 100 },
    },
  };

  return (
    <div className="w-full mx-auto my-8">
      <GlowCard customSize glowColor="purple" className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl mx-auto w-full max-w-6xl overflow-hidden group">
        
        {/* Glow ambiental absoluto heredado para preservar la mística de la tarjeta antigua */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Global Notifications Panel (Absolute Floating) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[90%] md:w-max min-w-[300px] transition-all duration-300">
          {status.type === 'success' && (
            <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm py-3 px-6 rounded-full flex items-center justify-center gap-3 animate-in slide-in-from-top-4 fade-in shadow-xl backdrop-blur-md">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-center">{status.message}</span>
            </div>
          )}
          {status.type === 'error' && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-sm py-3 px-6 rounded-full flex items-center justify-center gap-3 animate-in slide-in-from-top-4 fade-in shadow-xl backdrop-blur-md">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-center">{status.message}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8 items-stretch relative z-10 p-0 sm:p-2">
          {/* Lado Izquierdo: Formulario */}
          <motion.div 
            className="p-6 sm:p-10 flex flex-col justify-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="mb-4">
              <span className="text-sm font-semibold text-zinc-400 bg-white/5 py-1.5 px-3 rounded-full border border-white/10 uppercase tracking-widest flex items-center w-max shadow-inner">
                <MapPin className="inline-block h-4 w-4 mr-2 text-emerald-400" />
                {city}
              </span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-5xl font-bold text-white mb-8 tracking-tighter leading-tight drop-shadow-md">
              Rastreá tu próximo destino.
            </motion.h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Entradas de Ruta con línea punteada - THE UBER LAYOUT IMPLMENTATION */}
              <motion.div variants={itemVariants} className="relative bg-black/40 border border-white/5 p-4 rounded-xl shadow-inner">
                <div className="absolute left-6 top-10 bottom-10 w-px bg-white/20 border-l border-dashed blur-[0.5px]"></div>
                
                {/* Origen */}
                <div className="relative flex items-center mb-3">
                  <div className="z-10 bg-black p-1.5 rounded-full border border-white/10 shadow-sm">
                     <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <input
                    type="text"
                    placeholder="Origen (ej. EZE)"
                    value={origen}
                    onChange={(e) => setOrigen(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-transparent text-white font-semibold uppercase placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 rounded-lg transition-all"
                    disabled={isLoading}
                    maxLength={3}
                    required
                  />
                  <div className="absolute right-2 p-1 text-zinc-500 pointer-events-none">
                     <Send className="h-5 w-5" />
                  </div>
                </div>
                
                <hr className="border-white/5 mx-12" />

                {/* Destino */}
                <div className="relative flex items-center mt-3">
                   <div className="z-10 bg-black p-1.5 rounded-full border border-white/10 shadow-sm">
                     <PlaneLanding className="h-4 w-4 text-white" />
                   </div>
                  <input
                    type="text"
                    placeholder="Destino (ej. MAD)"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    className="w-full pl-4 py-3 bg-transparent text-white font-semibold uppercase placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 rounded-lg transition-all"
                    disabled={isLoading}
                    maxLength={3}
                    required
                  />
                </div>
              </motion.div>

              {/* Botones y Precio - Sustituyen al date and time pickers de Uber */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="flex items-center bg-black/40 border border-white/5 rounded-xl px-4 py-1 relative ring-0 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all shadow-inner">
                  <DollarSign className="h-5 w-5 text-zinc-500 absolute left-4" />
                  <input
                    type="number"
                    placeholder="Presupuesto"
                    min="1"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full pl-8 py-3 bg-transparent text-white font-bold outline-none placeholder:text-zinc-600 placeholder:font-normal"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="flex">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full h-full min-h-[52px] rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg active:scale-95 ${
                      isLoading 
                        ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-not-allowed' 
                        : 'bg-white text-black hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                    }`}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /> Creando...</>
                    ) : (
                      <>🔥 Activar Alerta</>
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Panel de Matemáticas en Línea */}
              {(precioIngresado > 0 && precioActualMercado > 0) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="w-full mt-4"
                >
                  <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col justify-center shadow-inner relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2 z-10">
                      <p className="text-zinc-400 text-sm font-medium">Mercado real:</p>
                      <span className="font-bold text-white/90">${precioActualMercado} USD</span>
                    </div>
                    
                    <div className="flex items-center justify-between z-10 w-full mt-1 pt-3 border-t border-white/5">
                        <span className="text-zinc-400 text-xs text-balance w-2/3">Aviso configurado para cuando el precio llegue al umbral de ${precioIngresado}.</span>
                        {esPrecioMenor ? (
                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg py-1 px-3 flex items-center justify-center flex-shrink-0">
                            <span className="text-emerald-400 text-sm font-black font-mono tracking-tighter">-{diferenciaPorcentual}%</span>
                          </div>
                        ) : (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg py-1 px-3 flex items-center justify-center flex-shrink-0">
                            <span className="text-red-400 text-[10px] font-bold tracking-tight uppercase">Sobrecosto</span>
                          </div>
                        )}
                    </div>

                    {/* Efecto de barra de progreso figurativa */}
                    <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/5 z-0">
                        {esPrecioMenor && (
                          <div 
                            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out" 
                            style={{ width: `${Math.min((precioIngresado/precioActualMercado)*100, 100)}%` }} 
                          />
                        )}
                    </div>
                  </div>
                </motion.div>
              )}
            </form>
          </motion.div>

          {/* Lado Derecho: La Imagen del Snippet (Uber Taxi Hero) */}
          <motion.div 
            className="hidden lg:block w-full h-full min-h-[500px] p-2 pr-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-2xl border border-white/5 group">
              <img
                src={imageUrl}
                alt="Escena del viaje"
                className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
              />
              {/* Overlay oscuro para darle tono dramático y pegarlo con el fondo */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-transparent opacity-80" />
              <div className="absolute inset-0 bg-black/10 transition-opacity duration-300 group-hover:opacity-0" />
            </div>
          </motion.div>

        </div>
      </GlowCard>
    </div>
  );
}
