export default function SkeletonCard() {
  return (
    <div className="bg-[#121215] border border-[#262626] rounded-xl p-6 flex flex-col justify-between h-72 animate-pulse">
      {/* Cabecera Skeleton */}
      <div>
        <div className="flex justify-between items-start mb-2">
          {/* Título de la ruta */}
          <div className="h-6 w-24 bg-zinc-800 rounded mb-1"></div>
          {/* Badge tendencia */}
          <div className="h-6 w-16 bg-zinc-800/80 rounded-full"></div>
        </div>
        {/* Texto desc */}
        <div className="h-3 w-40 bg-zinc-800/50 rounded mb-4 mt-2"></div>
      </div>

      {/* Gráfico Area Skeleton */}
      <div className="h-28 w-full mb-2 bg-gradient-to-b from-zinc-800/40 to-transparent rounded-lg border-b border-zinc-800/30"></div>

      {/* Footer Skeleton */}
      <div className="pt-4 border-t border-zinc-800 flex justify-between items-center mt-auto">
        <div className="h-3 w-32 bg-zinc-800/50 rounded flex items-center gap-2"></div>
        <div className="flex items-end gap-1">
          <div className="h-4 w-8 bg-zinc-800 rounded"></div>
          <div className="h-7 w-12 bg-zinc-700/80 rounded"></div>
        </div>
      </div>
    </div>
  );
}
