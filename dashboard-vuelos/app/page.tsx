import PriceChart from '@/components/PriceChart';
import RefreshButton from '@/components/RefreshButton';
import DashboardStats from '@/components/DashboardStats';
import AddAlertForm from '@/components/AddAlertForm';
import ActiveAlerts from '@/components/ActiveAlerts';
import RouteSearchFilter from '@/components/RouteSearchFilter';
import HeroAurora from '@/components/HeroAurora';
import IsoLevelWarp from '@/components/ui/isometric-wave-grid-background';
import { Footer } from '@/components/ui/footer-section';

// 1. Función para traer los datos (Corre en el servidor de Next.js, ¡esquivando CORS!)
async function getVuelos() {
  const apiKey = process.env.API_KEY || '';
  
  try {
    // Le pegamos al puerto 8000 donde está escuchando tu Docker de FastAPI
    const res = await fetch('http://127.0.0.1:8000/vuelos/', {
      headers: {
        'X-Api-Key': apiKey || '',
      },
      cache: 'no-store' // Le decimos a Next.js que no guarde caché, queremos precios en vivo
    });

    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error conectando con la API:", error);
    return [];
  }
}

// 2. Componente Principal (Async Server Component)
export default async function Home() {
  // Hacemos la llamada a la base de datos
  const vuelos = await getVuelos();

  // NUEVA LÓGICA: Agrupamos todo el historial por ruta en arrays
  const historialPorRuta = vuelos.reduce((acc: any, vuelo: any) => {
    const ruta = `${vuelo.origen} ✈ ${vuelo.destino}`;
    if (!acc[ruta]) acc[ruta] = [];
    acc[ruta].push(vuelo);
    return acc;
  }, {});

  // Cálculos para DashboardStats
  const totalVuelos = vuelos.length;
  const totalRutas = new Set(vuelos.map((v: any) => `${v.origen}-${v.destino}`)).size;
  const precioPromedio = vuelos.length > 0 
    ? Math.round(vuelos.reduce((acc: any, v: any) => acc + v.precio_usd, 0) / vuelos.length) 
    : 0;

  return (
    <IsoLevelWarp speed={1} density={40} color="100, 50, 250">
      <main className="min-h-screen relative w-full overflow-x-hidden">
        {/* 1. LA NUEVA HERO SECTION ANIMADA */}
        <HeroAurora />

      {/* Contenedor unificado: desplazo a la derecha (pl-10) para compensar el peso visual del scrollbar */}
      <div className="relative z-20 w-full max-w-5xl mx-auto pl-10 pr-6 py-12 flex flex-col gap-12 -mt-24">
        
        {/* Sección 1: Estadísticas Rápidas */}
        <section className="w-full">
           <DashboardStats 
             totalVuelos={totalVuelos} 
             rutasActivas={totalRutas} 
             precioPromedio={precioPromedio} 
           />
        </section>

        {/* Sección 2: El Formulario (Más ancho e importante) */}
        <section className="w-full">
           <AddAlertForm apiKey={process.env.API_KEY || ''} precioActualMercado={precioPromedio} />
        </section>

        {/* Sección 3: Alertas Vigentes */}
        <section className="w-full">
           <h3 className="text-xl font-outfit font-medium text-white/90 mb-6 flex items-center gap-2">
              Tus alertas vigentes
           </h3>
           <ActiveAlerts apiKey={process.env.API_KEY || ''} />
        </section>

        {/* Sección 4: El Gráfico del Mercado */}
        <section className="w-full mt-8 border-t border-white/10 pt-12">
           { vuelos.length > 0 && <PriceChart vuelos={vuelos} /> }
           <div className="mt-8">
             <RouteSearchFilter historialPorRuta={historialPorRuta} />
           </div>
        </section>

        <Footer />
      </div>
      </main>
    </IsoLevelWarp>
  );
}