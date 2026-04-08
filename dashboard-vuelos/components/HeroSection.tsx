import React from 'react';

export default function HeroSection() {
  return (
    <section className="w-full max-w-6xl mx-auto my-12 group">
      <div className="relative border border-zinc-800 hover:border-zinc-700 transition-colors duration-500 rounded-3xl bg-zinc-900/40 backdrop-blur-xl p-10 md:p-14 overflow-hidden shadow-2xl">
        
        {/* Glow de fondo asimétrico */}
        <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500/10 via-transparent to-purple-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Columna Izquierda: Texto fluido y Botón Cyan */}
          <div className="flex flex-col items-start text-left">
            <span className="text-cyan-400 font-semibold tracking-wider uppercase text-sm mb-4">
              Flowbite Insights
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Dominá el mercado de <span className="text-transparent bg-clip-text bg-gradient-to-r to-cyan-400 from-purple-500">Vuelos a Japón</span>
            </h2>
            <p className="text-lg text-zinc-400 mb-8 max-w-lg leading-relaxed">
              Analizamos miles de fluctuaciones en el mercado de vuelos a nivel global. Configurá tus alertas y anticipáte a las caídas de presupuestos en tiempo real con nuestra tecnología asíncrona.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                type="button" 
                className="text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 focus:ring-4 focus:outline-none focus:ring-cyan-800 font-medium rounded-lg text-base px-6 py-3.5 text-center shadow-lg shadow-cyan-500/30 transition-all duration-300"
              >
                Comenzar Monitoreo
              </button>
              <button 
                type="button" 
                className="text-white bg-zinc-800/80 hover:bg-zinc-700 focus:ring-4 focus:outline-none focus:ring-zinc-600 border border-zinc-700 font-medium rounded-lg text-base px-6 py-3.5 text-center transition-all duration-300"
              >
                Ver Analíticas
              </button>
            </div>
          </div>

          {/* Columna Derecha: Imagen Circular con estilo de cristal */}
          <div className="flex justify-center md:justify-end items-center">
            {/* Anillo exterior decorativo que respira  */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full p-2.5 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 backdrop-blur-md border border-zinc-700/50 flex items-center justify-center overflow-hidden group-hover:border-cyan-500/40 transition-colors duration-500 shadow-2xl shadow-cyan-900/20">
              
              {/* Círculo interno oscuro que sirve de placeholder para la futura imagen */}
              <div className="w-full h-full rounded-full bg-zinc-800/80 flex items-center justify-center overflow-hidden relative">
                
                {/* Texto a reemplazar por una <img /> */}
                <span className="text-zinc-500 font-medium text-sm text-center px-4">
                  Reservado para <br/> Imagen Decorativa
                </span>
                
                {/* 
                  Ejemplo de cómo pondrías la imagen:
                  <img src="/imagen-vuelo.jpg" alt="Vuelo Hero" className="w-full h-full object-cover" /> 
                */}
              </div>

              {/* Destellos de luz rotando abstractos detrás del círculo (efecto visual extra) */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/20 blur-2xl rounded-full mix-blend-screen pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 blur-2xl rounded-full mix-blend-screen pointer-events-none"></div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
