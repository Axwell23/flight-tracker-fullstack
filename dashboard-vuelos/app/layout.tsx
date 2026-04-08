import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // 1. Importamos la nueva fuente
import "./globals.css";

// 2. Configuramos la fuente
const outfit = Outfit({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '700'] // Desde muy finita a negrita
});

export const metadata: Metadata = {
  title: "Dashboard de Vuelos",
  description: "Monitor de vuelos en tiempo real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/* 3. Le aplicamos la fuente a todo el body */}
      <body className={`${outfit.className} bg-[#050505] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
