"use client";

import { motion } from "framer-motion";
import React from "react";
import { AuroraBackground } from "@/components/aurora-background";
import { Button } from "@/components/ui/neon-button";

export default function HeroAurora() {
    return (
        // La Aurora envuelve esta sección inicial
        <AuroraBackground className="h-[60vh] w-full relative bg-transparent dark:bg-transparent">
            <motion.div
                initial={{ opacity: 0.0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.3,
                    duration: 0.8,
                    ease: "easeInOut",
                }}
                className="relative z-10 flex flex-col gap-4 items-center justify-center px-4 text-center"
            >
                <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-2 block">
                    Estado del Sistema: Activo
                </span>

                <div className="text-4xl md:text-7xl font-bold text-white tracking-tight">
                    Dashboard de <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Vuelos</span>
                </div>

                <div className="font-extralight text-base md:text-2xl text-zinc-300 py-4 max-w-2xl">
                    Motor de búsqueda asíncrono. Análisis de mercado en tiempo real y alertas automáticas de caídas de precio.
                </div>

                {/* Un botón sutil para hacer scroll hacia los datos */}
                <Button
                    neon={true}
                    onClick={() => window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' })}
                    className="mt-4"
                >
                    Ver Analíticas 👇
                </Button>
            </motion.div>
        </AuroraBackground>
    );
}