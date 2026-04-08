"""
telegram_bot.py — Interfaz conversacional del bot de alertas de vuelos.

Responsabilidades:
  1. Registrar nuevos usuarios cuando escriben /start.
  2. Guiar al usuario paso a paso para crear alertas de precio.
  3. Mostrar las alertas activas del usuario.
  4. Eliminar alertas que el usuario ya no necesita.

Este bot corre como un proceso independiente al servidor FastAPI.
Se comunica con la API usando httpx, igual que cualquier cliente externo,
lo que significa que toda la lógica de negocio sigue viviendo en la API.

Para correrlo: python scraper/telegram_bot.py
"""

import asyncio
import logging
import os

import httpx
from dotenv import load_dotenv
from telegram import ReplyKeyboardMarkup, ReplyKeyboardRemove, Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

load_dotenv()

# ─── Configuración ────────────────────────────────────────────────────────────

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
API_URL = os.getenv("API_URL", "http://127.0.0.1:8000")
API_KEY = os.getenv("API_KEY")

if not TELEGRAM_TOKEN:
    raise RuntimeError("TELEGRAM_TOKEN no definido en .env")
if not API_KEY:
    raise RuntimeError("API_KEY no definido en .env")

# Header de autenticación que se manda en cada request a la API.
HEADERS = {"X-Api-Key": API_KEY}

# Configuramos logging para ver en la terminal qué está haciendo el bot.
logging.basicConfig(
    format="%(asctime)s — %(name)s — %(levelname)s — %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# ─── Estados de la conversación ───────────────────────────────────────────────
# ConversationHandler usa estos estados para saber en qué paso de la
# conversación está cada usuario. Cada constante es simplemente un número
# entero — los nombres los elegimos nosotros para que el código sea legible.

ORIGEN, DESTINO, PRECIO_UMBRAL = range(3)


# ─── Helpers de comunicación con la API ──────────────────────────────────────

async def registrar_usuario(chat_id: str, nombre: str) -> bool:
    """
    Registra un usuario nuevo en la API. Retorna True si fue exitoso
    o si el usuario ya existía (ambos casos son válidos al hacer /start).
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_URL}/usuarios/",
            params={
                "nombre": nombre,
                "telegram_chat_id": chat_id,
                "pais": "Argentina",
                "ubicacion_actual": "Buenos Aires",
            },
            headers=HEADERS,
        )
    # 201 = creado exitosamente, 400 = ya existía.
    # Ambos son respuestas válidas cuando el usuario hace /start.
    return response.status_code in (201, 400)


async def obtener_alertas(chat_id: str) -> list[dict]:
    """Obtiene la lista de alertas activas del usuario desde la API."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{API_URL}/usuarios/{chat_id}/alertas/",
            headers=HEADERS,
        )
    if response.status_code == 200:
        return response.json()
    return []


async def crear_alerta(chat_id: str, origen: str, destino: str, precio: float) -> dict | None:
    """Crea una nueva alerta de precio en la API."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_URL}/usuarios/{chat_id}/alertas/",
            json={
                "origen": origen,
                "destino": destino,
                "precio_umbral_usd": precio,
            },
            headers=HEADERS,
        )
    if response.status_code == 201:
        return response.json()
    return None


async def eliminar_alerta(chat_id: str, alerta_id: int) -> bool:
    """Elimina una alerta específica del usuario."""
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{API_URL}/usuarios/{chat_id}/alertas/{alerta_id}",
            headers=HEADERS,
        )
    return response.status_code == 204


# ─── Comandos del bot ─────────────────────────────────────────────────────────

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    /start — Punto de entrada del bot.
    Registra al usuario y explica qué puede hacer el bot.
    """
    user = update.effective_user
    chat_id = str(update.effective_chat.id)
    nombre = user.first_name or "Viajero"

    # Intentamos registrar al usuario. Si ya existe, la API devuelve 400
    # y registrar_usuario() igual retorna True — no hay error visible.
    await registrar_usuario(chat_id, nombre)

    await update.message.reply_text(
        f"¡Hola {nombre}! ✈️\n\n"
        "Soy tu bot de alertas de vuelos. Te aviso cuando el precio "
        "de un vuelo baje de tu presupuesto.\n\n"
        "Estos son mis comandos:\n"
        "• /nueva\\_alerta — Crear una alerta de precio\n"
        "• /mis\\_alertas — Ver tus alertas activas\n"
        "• /borrar\\_alerta — Eliminar una alerta\n"
        "• /ayuda — Mostrar esta ayuda\n\n"
        "¿Empezamos? Escribí /nueva\\_alerta 🚀",
        parse_mode="Markdown",
    )


async def ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/ayuda — Muestra los comandos disponibles."""
    await update.message.reply_text(
        "Comandos disponibles:\n\n"
        "• /nueva\\_alerta — Crear una alerta de precio\n"
        "• /mis\\_alertas — Ver tus alertas activas\n"
        "• /borrar\\_alerta — Eliminar una alerta\n"
        "• /start — Volver al inicio",
        parse_mode="Markdown",
    )


async def mis_alertas(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    /mis_alertas — Muestra todas las alertas activas del usuario.
    Si no tiene ninguna, lo invita a crear una.
    """
    chat_id = str(update.effective_chat.id)
    alertas = await obtener_alertas(chat_id)

    if not alertas:
        await update.message.reply_text(
            "No tenés alertas activas todavía.\n"
            "Escribí /nueva\\_alerta para crear una 🔔",
            parse_mode="Markdown",
        )
        return

    texto = "Tus alertas activas:\n\n"
    for alerta in alertas:
        estado = "✅ Activa" if alerta["activa"] else "⏸ Pausada"
        ultimo_precio = (
            f"USD {alerta['ultimo_precio_visto']:,.0f}"
            if alerta["ultimo_precio_visto"]
            else "Sin datos aún"
        )
        texto += (
            f"🔔 *Alerta #{alerta['id']}*\n"
            f"   Ruta: {alerta['origen']} → {alerta['destino']}\n"
            f"   Umbral: USD {alerta['precio_umbral_usd']:,.0f}\n"
            f"   Último precio visto: {ultimo_precio}\n"
            f"   Estado: {estado}\n\n"
        )

    texto += "Para eliminar una, escribí /borrar\\_alerta"
    await update.message.reply_text(texto, parse_mode="Markdown")


# ─── Conversación: nueva alerta ───────────────────────────────────────────────
# ConversationHandler permite tener una conversación de múltiples pasos
# donde cada respuesta del usuario avanza al siguiente estado.
# Funciona como una máquina de estados: ORIGEN → DESTINO → PRECIO_UMBRAL → fin.

async def nueva_alerta_inicio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    Paso 0: el usuario escribió /nueva_alerta.
    Le preguntamos el origen y pasamos al estado ORIGEN.
    """
    # Sugerimos aeropuertos comunes como botones de teclado para facilitar
    # la entrada. El usuario puede ignorarlos y escribir el que quiera.
    teclado = [["EZE", "AEP"], ["GRU", "SCL"]]
    reply_markup = ReplyKeyboardMarkup(teclado, one_time_keyboard=True)

    await update.message.reply_text(
        "Vamos a crear una nueva alerta ✈️\n\n"
        "¿Desde qué aeropuerto salís? Escribí el código IATA "
        "(por ejemplo: EZE para Ezeiza, AEP para Aeroparque)",
        reply_markup=reply_markup,
    )
    return ORIGEN


async def recibir_origen(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    Paso 1: guardamos el origen y preguntamos el destino.
    context.user_data es un diccionario que persiste durante la conversación
    y nos permite recordar lo que el usuario respondió en pasos anteriores.
    """
    context.user_data["origen"] = update.message.text.strip().upper()

    teclado = [["TYO", "OSA", "NRT"], ["HND", "KIX"]]
    reply_markup = ReplyKeyboardMarkup(teclado, one_time_keyboard=True)

    await update.message.reply_text(
        f"Origen: *{context.user_data['origen']}* ✓\n\n"
        "¿A qué aeropuerto querés llegar? "
        "(TYO = Tokio, OSA = Osaka, NRT = Narita, HND = Haneda, KIX = Kansai)",
        reply_markup=reply_markup,
        parse_mode="Markdown",
    )
    return DESTINO


async def recibir_destino(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    Paso 2: guardamos el destino y preguntamos el precio umbral.
    Removemos el teclado personalizado para que el usuario escriba libremente.
    """
    context.user_data["destino"] = update.message.text.strip().upper()

    await update.message.reply_text(
        f"Destino: *{context.user_data['destino']}* ✓\n\n"
        "¿Cuál es tu presupuesto máximo en USD? "
        "Te aviso cuando el precio baje de ese número.\n"
        "(Escribí solo el número, por ejemplo: 800)",
        reply_markup=ReplyKeyboardRemove(),
        parse_mode="Markdown",
    )
    return PRECIO_UMBRAL


async def recibir_precio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    Paso 3 (final): recibimos el precio, creamos la alerta en la API,
    y terminamos la conversación.
    """
    texto = update.message.text.strip().replace(",", ".")

    # Validamos que el precio sea un número válido antes de enviarlo a la API.
    try:
        precio = float(texto)
        if precio <= 0:
            raise ValueError("El precio debe ser mayor a cero.")
    except ValueError:
        await update.message.reply_text(
            "Ese no parece un precio válido. "
            "Escribí solo el número, por ejemplo: 800"
        )
        # Retornamos el mismo estado para darle otra oportunidad
        # sin reiniciar toda la conversación desde el principio.
        return PRECIO_UMBRAL

    chat_id = str(update.effective_chat.id)
    origen = context.user_data["origen"]
    destino = context.user_data["destino"]

    alerta = await crear_alerta(chat_id, origen, destino, precio)

    if alerta:
        await update.message.reply_text(
            f"✅ *¡Alerta creada!*\n\n"
            f"Ruta: *{origen} → {destino}*\n"
            f"Te aviso cuando baje de *USD {precio:,.0f}*\n\n"
            f"El scraper revisa los precios periódicamente y te "
            f"mando un mensaje en cuanto encuentre algo 🔔",
            parse_mode="Markdown",
        )
    else:
        await update.message.reply_text(
            "Hubo un problema al crear la alerta. "
            "Intentá de nuevo con /nueva\\_alerta",
            parse_mode="Markdown",
        )

    # Limpiamos los datos temporales de la conversación.
    context.user_data.clear()
    return ConversationHandler.END


async def cancelar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancela la conversación en cualquier paso si el usuario escribe /cancelar."""
    context.user_data.clear()
    await update.message.reply_text(
        "Operación cancelada. Escribí /ayuda para ver los comandos disponibles.",
        reply_markup=ReplyKeyboardRemove(),
    )
    return ConversationHandler.END


# ─── Conversación: borrar alerta ─────────────────────────────────────────────

async def borrar_alerta_inicio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    /borrar_alerta — Muestra las alertas del usuario y le pide el ID a borrar.
    """
    chat_id = str(update.effective_chat.id)
    alertas = await obtener_alertas(chat_id)

    if not alertas:
        await update.message.reply_text(
            "No tenés alertas activas para borrar.\n"
            "Escribí /nueva\\_alerta para crear una.",
            parse_mode="Markdown",
        )
        return

    texto = "Tus alertas:\n\n"
    for alerta in alertas:
        texto += (
            f"• ID *{alerta['id']}* — "
            f"{alerta['origen']} → {alerta['destino']} "
            f"(umbral: USD {alerta['precio_umbral_usd']:,.0f})\n"
        )

    texto += "\nEscribí el ID de la alerta que querés borrar:"
    await update.message.reply_text(texto, parse_mode="Markdown")
    # Guardamos en context que estamos esperando un ID de alerta a borrar.
    context.user_data["esperando_id_borrar"] = True


async def recibir_id_borrar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Recibe el ID de la alerta a borrar y la elimina."""
    if not context.user_data.get("esperando_id_borrar"):
        return

    try:
        alerta_id = int(update.message.text.strip())
    except ValueError:
        await update.message.reply_text("Escribí solo el número del ID de la alerta.")
        return

    chat_id = str(update.effective_chat.id)
    exito = await eliminar_alerta(chat_id, alerta_id)

    if exito:
        await update.message.reply_text(f"✅ Alerta #{alerta_id} eliminada correctamente.")
    else:
        await update.message.reply_text(
            f"No encontré la alerta #{alerta_id}. "
            "Verificá el ID con /mis\\_alertas",
            parse_mode="Markdown",
        )

    context.user_data.clear()


# ─── Arranque del bot ─────────────────────────────────────────────────────────

def main() -> None:
    """
    Configura y arranca el bot de Telegram.

    Application.run_polling() mantiene el bot corriendo indefinidamente,
    consultando a Telegram cada pocos segundos si llegaron mensajes nuevos.
    Es el modo más simple para desarrollo — en producción se usa webhook.
    """
    app = Application.builder().token(TELEGRAM_TOKEN).build()

    # ConversationHandler maneja el flujo de múltiples pasos para crear alertas.
    # entry_points: cómo empieza la conversación.
    # states: qué función maneja cada estado.
    # fallbacks: qué pasa si el usuario escribe /cancelar en cualquier momento.
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("nueva_alerta", nueva_alerta_inicio)],
        states={
            ORIGEN: [MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_origen)],
            DESTINO: [MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_destino)],
            PRECIO_UMBRAL: [MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_precio)],
        },
        fallbacks=[CommandHandler("cancelar", cancelar)],
    )

    # Registramos todos los handlers — cada uno escucha un comando específico.
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("ayuda", ayuda))
    app.add_handler(CommandHandler("mis_alertas", mis_alertas))
    app.add_handler(CommandHandler("borrar_alerta", borrar_alerta_inicio))
    app.add_handler(conv_handler)

    # Handler genérico para recibir el ID cuando el usuario quiere borrar una alerta.
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_id_borrar))

    print("Bot de vuelos iniciado. Esperando mensajes...")
    print("Presioná Ctrl+C para detenerlo.")

    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
