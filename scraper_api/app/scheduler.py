"""
scheduler.py — Scheduler de tareas periódicas para el sistema de alertas.

Responsabilidad única:
  Ejecutar el scraper automáticamente cada cierto intervalo de tiempo,
  sin necesidad de intervención manual.

Enfoque de subproceso:
  En lugar de llamar al scraper directamente dentro del event loop de FastAPI
  (lo que causa NotImplementedError en Windows con Playwright), lanzamos
  bot_vuelos.py como un proceso Python completamente separado.

  Esto resuelve el problema porque el subproceso tiene su propio event loop,
  su propia instancia de Playwright, y no interfiere con uvicorn en absoluto.
  Es también la arquitectura más robusta: si el scraper falla o se cuelga,
  no afecta al servidor ni al scheduler — simplemente ese ciclo falla y el
  siguiente corre normalmente en el próximo intervalo.
"""

import logging
import os
import subprocess
import sys

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

# ─── Configuración del intervalo ──────────────────────────────────────────────
# Leemos el intervalo desde el entorno para poder ajustarlo sin tocar código.
# El valor por defecto es 6 horas — suficiente para capturar variaciones
# de precio a lo largo del día sin hacer demasiadas consultas a Google.
#
# Durante desarrollo podés poner SCRAPER_INTERVALO_HORAS=0.1 en tu .env
# para que corra cada 6 minutos y ver el ciclo completo rápido.
INTERVALO_HORAS = float(os.getenv("SCRAPER_INTERVALO_HORAS", "6"))


# ─── Tarea programada ────────────────────────────────────────────────────────

async def tarea_scraping():
    """
    Función que el scheduler llama automáticamente en cada ciclo.

    Lanza bot_vuelos.py como un subproceso Python independiente en lugar de
    llamarlo directamente como una coroutine. Esto es necesario en Windows
    porque Playwright necesita su propio event loop para lanzar el navegador
    Chromium, y no puede hacerlo desde adentro del event loop de uvicorn.

    La clave está en dos detalles técnicos:
      1. sys.executable garantiza que usamos el Python del venv activo,
         no algún Python del sistema que no tenga las dependencias instaladas.
      2. PYTHONPATH="." le dice al subproceso que busque módulos desde la
         raíz del proyecto, igual que cuando corremos el scraper manualmente
         con $env:PYTHONPATH="."; python scraper/bot_vuelos.py
    """
    logger.info("Scheduler: iniciando ciclo de scraping como subproceso...")

    try:
        resultado = subprocess.run(
            [sys.executable, "scraper/bot_vuelos.py"],
            # os.environ copia todas las variables de entorno actuales
            # (incluyendo API_KEY, TELEGRAM_TOKEN, etc.) al subproceso.
            # El ** desempaqueta el dict y PYTHONPATH="." lo sobreescribe
            # o agrega si no existía — así el subproceso encuentra app/.
            env={**os.environ, "PYTHONPATH": "."},
            # capture_output=True captura stdout y stderr del subproceso
            # para que podamos loguearlos si algo sale mal.
            capture_output=True,
            text=True,
            # timeout de 5 minutos: si el scraper tarda más que eso,
            # lo matamos para no bloquear el próximo ciclo.
            timeout=300,
        )

        if resultado.returncode == 0:
            logger.info("Scheduler: ciclo de scraping completado exitosamente.")
            # Logueamos el output del scraper para tener visibilidad de
            # qué precios encontró y qué alertas evaluó.
            if resultado.stdout:
                logger.info(f"Scraper output:\n{resultado.stdout}")
        else:
            logger.error(
                f"Scheduler: el scraper terminó con error (código {resultado.returncode}):\n"
                f"{resultado.stderr}"
            )

    except subprocess.TimeoutExpired:
        logger.error("Scheduler: el scraper tardó más de 5 minutos — ciclo cancelado.")
    except Exception as e:
        # Capturamos cualquier excepción para que un error no mate al scheduler.
        # Si falla una ejecución, simplemente esperamos al próximo intervalo.
        logger.error(f"Scheduler: excepción inesperada durante el ciclo: {e}")


# ─── Creación y configuración del scheduler ──────────────────────────────────

def crear_scheduler() -> AsyncIOScheduler:
    """
    Crea y configura el scheduler con la tarea de scraping.

    Usamos AsyncIOScheduler porque toda la aplicación es async (FastAPI,
    httpx). Este scheduler corre dentro del mismo event loop de asyncio
    sin crear threads adicionales.

    IntervalTrigger define cuándo se ejecuta la tarea:
      - hours=INTERVALO_HORAS: cada N horas
      - jitter=300: agrega hasta 5 minutos de variación aleatoria.
        Útil cuando hay múltiples instancias del servidor para que no
        todas hagan scraping exactamente al mismo segundo.
    """
    scheduler = AsyncIOScheduler()

    scheduler.add_job(
        tarea_scraping,
        trigger=IntervalTrigger(
            hours=INTERVALO_HORAS,
            jitter=300,
        ),
        id="scraping_periodico",
        name="Scraping periódico de precios de vuelos",
        # misfire_grace_time: si el servidor estuvo caído y se perdió
        # una ejecución, la ejecuta igual si pasaron menos de 15 minutos.
        misfire_grace_time=900,
        replace_existing=True,
    )

    logger.info(
        f"Scheduler configurado: scraping cada {INTERVALO_HORAS} horas."
    )

    return scheduler
