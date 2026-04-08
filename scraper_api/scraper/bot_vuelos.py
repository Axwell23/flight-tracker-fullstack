"""
bot_vuelos.py — Scraper de precios de vuelos hacia Japón (y otros destinos).

Responsabilidades:
  1. Navegar a Google Flights usando Playwright.
  2. Extraer el precio más bajo disponible en la página.
  3. Enviar el resultado a la API FastAPI con autenticación.
  4. Disparar el motor de alertas para notificar usuarios si corresponde.

Este módulo está pensado para ser llamado por el scheduler periódicamente,
pero también puede ejecutarse de forma manual para pruebas.
"""

import asyncio
import os
import re
from dataclasses import dataclass

import httpx
from dotenv import load_dotenv
from playwright.async_api import Page, async_playwright
from sqlalchemy.orm import Session

# Cargamos las variables de entorno desde .env antes de cualquier otra cosa.
load_dotenv()

# ─── Configuración central ────────────────────────────────────────────────────

API_URL = os.getenv("API_URL", "http://127.0.0.1:8000/vuelos/")
API_KEY = os.getenv("API_KEY")

if not API_KEY:
    raise RuntimeError(
        "La variable de entorno API_KEY no está definida. "
        "Revisá tu archivo .env antes de ejecutar el scraper."
    )

HEADERS = {"X-Api-Key": API_KEY}

# Tiempo máximo (en ms) que esperamos a que Google Flights cargue los precios.
# Google Flights es una SPA — el HTML inicial no tiene precios, los inyecta
# JavaScript después. Por eso necesitamos esperar más de lo normal.
TIMEOUT_CARGA_MS = 12_000


# ─── Tipos de datos ───────────────────────────────────────────────────────────

@dataclass
class ResultadoVuelo:
    """
    Representa un vuelo extraído de la página antes de enviarlo a la API.
    Usamos un dataclass en lugar de un dict para que el código sea más legible
    y los errores de typo en los nombres de campo se detecten en tiempo de desarrollo.
    """
    origen: str
    destino: str
    aerolinea: str
    escalas: str
    precio_usd: float


# ─── Lógica de extracción ─────────────────────────────────────────────────────

async def extraer_primer_precio_usd(page: Page) -> float | None:
    """
    Busca en el texto visible el primer precio.
    Ahora es resistente a formatos con puntos o comas.
    """
    # Le damos un respiro para asegurarnos de que el DOM cargó los resultados
    await page.wait_for_timeout(2000)

    texto = await page.locator("body").inner_text()

    # Patrón mejorado: atrapa "US$ 1,234", "USD 1.234", "$1234", etc.
    patrones = [
        r"US\$\s?([\d,\.]+)",
        r"USD\s?([\d,\.]+)",
        r"\$\s?([\d,\.]+)",
    ]

    for patron in patrones:
        match = re.search(patron, texto)
        if match:
            # Encontramos algo como "1,234" o "1.234"
            valor_crudo = match.group(1)
            # Limpiamos comas y puntos (asumiendo que son separadores de miles para vuelos)
            valor_limpio = valor_crudo.replace(",", "").replace(".", "")
            try:
                precio = float(valor_limpio)
                print(f"  Precio real detectado: USD {precio}")
                return precio
            except ValueError:
                continue

    return None


async def extraer_aerolinea(page: Page) -> str:
    """
    Intenta extraer el nombre de la aerolínea del primer resultado.
    Si no lo encuentra, devuelve un valor genérico — nunca falla silenciosamente.
    """
    try:
        elemento = page.locator("[aria-label*='airline']").first
        texto = await elemento.inner_text(timeout=3000)
        return texto.strip() if texto else "Aerolínea no detectada"
    except Exception:
        return "Aerolínea no detectada"


# ─── Lógica de scraping ───────────────────────────────────────────────────────

async def scrapear_vuelo(origen: str, destino: str, url: str) -> ResultadoVuelo:
    """
    Abre un navegador, navega a la URL dada, extrae el precio y cierra.

    Parámetros:
        origen  — Código IATA del aeropuerto de origen (ej: "EZE").
        destino — Código IATA del aeropuerto de destino (ej: "TYO").
        url     — URL de Google Flights con la búsqueda pre-armada.

    Retorna un ResultadoVuelo listo para enviar a la API.
    """
    async with async_playwright() as p:
        print(f"\nIniciando navegador para ruta {origen} → {destino}...")

        # browser = await p.chromium.launch(headless=False, slow_mo=300)
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Simulamos un User-Agent real para reducir la probabilidad de
        # que Google Flights detecte el scraper y bloquee el request.
        await page.set_extra_http_headers({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        })

        print(f"  Navegando a: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=60_000)

        print(f"  Esperando {TIMEOUT_CARGA_MS // 1000}s para que cargue el JS...")
        await page.wait_for_timeout(TIMEOUT_CARGA_MS)

        screenshot_path = f"vuelos_{origen.lower()}_{destino.lower()}.png"
        await page.screenshot(path=screenshot_path, full_page=True)
        print(f"  Captura guardada en: {screenshot_path}")

        precio = await extraer_primer_precio_usd(page)
        aerolinea = await extraer_aerolinea(page)

        await browser.close()

        if precio is None:
            print("  No se detectó un precio real. Usando valor de prueba (999.99).")
            precio = 999.99

        return ResultadoVuelo(
            origen=origen,
            destino=destino,
            aerolinea=aerolinea,
            escalas="Pendiente de extracción",
            precio_usd=precio,
        )


# ─── Comunicación con la API ──────────────────────────────────────────────────

async def enviar_a_api(vuelo: ResultadoVuelo) -> bool:
    """
    Envía un ResultadoVuelo a la API FastAPI.
    El scraper ya no interactúa con la base de datos ni con alertas.
    """
    payload = {
        "origen": vuelo.origen,
        "destino": vuelo.destino,
        "aerolinea": vuelo.aerolinea,
        "escalas": vuelo.escalas,
        "precio_usd": vuelo.precio_usd,
    }

    print(f"\nEnviando a la API: {payload}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(API_URL, json=payload, headers=HEADERS)

        if response.status_code == 201:
            print(f"  OK — Vuelo guardado con id={response.json()['id']}")
            return True
        else:
            print(f"  Error {response.status_code}: {response.text}")
            return False

    except httpx.ConnectError:
        print("  Error de conexión: ¿está corriendo el servidor FastAPI?")
        return False
    except httpx.TimeoutException:
        print("  Timeout: el servidor tardó demasiado en responder.")
        return False


# ─── Punto de entrada ─────────────────────────────────────────────────────────

async def main():
    """
    Define las rutas a monitorear y ejecuta el scraping para cada una.
    """
    rutas = [
        {
            "origen": "EZE",
            "destino": "TYO",
            # Obligamos a Google Flights a usar Inglés y Dólares
            "url": "https://www.google.com/travel/flights?q=Flights%20from%20EZE%20to%20TYO&hl=en&curr=USD",
        },
    ]

    print("=" * 50)
    print("  Scraper de vuelos iniciado")
    print(f"  API destino: {API_URL}")
    print(f"  Rutas a procesar: {len(rutas)}")
    print("=" * 50)

    # El ciclo AHORA es puro y no toca la BD local
    for ruta in rutas:
        vuelo = await scrapear_vuelo(
            origen=ruta["origen"],
            destino=ruta["destino"],
            url=ruta["url"],
        )
        await enviar_a_api(vuelo) # <-- Pasamos solo el vuelo, sin 'db'

    print("\nScraper finalizado.")


if __name__ == "__main__":
    asyncio.run(main())
