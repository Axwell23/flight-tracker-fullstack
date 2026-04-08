import SkeletonCard from '@/components/SkeletonCard';

export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col items-center p-10 bg-[url('/vuelo%20fondo.jpg')] bg-cover bg-center bg-fixed bg-black/80 bg-blend-overlay">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 mt-[35vh]">
        {/* Renderizamos 3 SkeletonCards como placeholder ideal mientras el servidor hace el fetch a FastAPI */}
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );
}
