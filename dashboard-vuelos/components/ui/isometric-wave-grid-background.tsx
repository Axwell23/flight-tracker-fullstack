"use client";

import React, { useRef, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IsoLevelWarpProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  speed?: number;
  density?: number;
  children?: ReactNode;
}

const IsoLevelWarp = ({
  className,
  color = "14, 165, 233", // RGB for Tailwind sky-500
  speed = 1,
  density = 40,
  children,
  ...props
}: IsoLevelWarpProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = container.offsetWidth;
    let height = container.offsetHeight;
    let animationFrameId: number;

    const gridGap = density;
    const rows = Math.ceil(height / gridGap) + 5; 
    const cols = Math.ceil(width / gridGap) + 5;
    
    // Mouse Interaction
    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
    
    let time = 0;

    const resize = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    const smoothMix = (a: number, b: number, t: number) => {
      return a + (b - a) * t;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      mouse.x = smoothMix(mouse.x, mouse.targetX, 0.1);
      mouse.y = smoothMix(mouse.y, mouse.targetY, 0.1);

      time += 0.01 * speed;

      ctx.beginPath();
      
      for (let y = 0; y <= rows; y++) {
        let isFirst = true;

        for (let x = 0; x <= cols; x++) {
          const baseX = (x * gridGap) - (gridGap * 2);
          const baseY = (y * gridGap) - (gridGap * 2);

          // 1. Ambient Wave (The "Breathing")
          const wave = Math.sin(x * 0.2 + time) * Math.cos(y * 0.2 + time) * 15;
          
          // 2. Mouse Repulsion
          const dx = baseX - mouse.x;
          const dy = baseY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 300;
          
          const force = Math.max(0, (maxDist - dist) / maxDist);
          const interactionY = -(force * force) * 80;

          const finalX = baseX;
          const finalY = baseY + wave + interactionY;

          if (isFirst) {
            ctx.moveTo(finalX, finalY);
            isFirst = false;
          } else {
            ctx.lineTo(finalX, finalY);
          }
        }
      }

      ctx.strokeStyle = `rgba(${color}, 0.5)`;
      ctx.lineWidth = 1;

      // Un par de estilos adicionales para darle un aire más tecnológico y menos monótono
      // ya que a veces una sola línea recta queda simple. Hacemos que brille un poco:
      ctx.shadowBlur = 4;
      ctx.shadowColor = `rgba(${color}, 0.8)`;
      
      ctx.stroke();
      
      // Reseteamos sombras para que no afecten futuros clears
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    
    // Escuchamos los eventos globales en WINDOW, de este modo la cuadrícula reacciona
    // al puntero incluso si está escondida detrás del contenido de tu página z-10
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, speed, density]);

  return (
    <div className={cn("relative min-h-screen w-full bg-[#050505]", className)} {...props}>
      <div 
        ref={containerRef}
        className="absolute top-0 left-0 w-full h-[120vh] z-0 overflow-hidden pointer-events-none"
        style={{
            // Aplicamos el difuminado que ya te gustaba para que se una al fondo sólido
            maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
        }}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] opacity-80 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};

export default IsoLevelWarp;
