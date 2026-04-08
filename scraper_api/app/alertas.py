"""
alertas.py — Motor de detección y envío de alertas de precio.

Responsabilidades:
  1. Dado un vuelo recién scrapeado, buscar todas las alertas activas
     que coincidan con esa ruta (mismo origen y destino).
  2. Para cada alerta, evaluar si el precio actual cumple la condición
     del usuario (por umbral fijo o por porcentaje de bajada).
  3. Si la condición se cumple y no se notificó recientemente,
     enviar un mensaje por Telegram y actualizar el registro en la BD.

Este módulo es llamado desde bot_vuelos.py después de guardar cada vuelo.
También puede ejecutarse de forma independiente para pruebas.
"""

import os
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from telegram import Bot
from telegram.error import TelegramError

from app.models import AlertaPrecio, HistorialVuelo

# ─── Configuración ────────────────────────────────────────────────────────────

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")

if not TELEGRAM_TOKEN:
    raise RuntimeError(
        "La variable de entorno TELEGRAM_TOKEN no está definida. "
        "Revisá tu archivo .env antes de ejecutar el motor de alertas."
    )

# Tiempo mínimo entre notificaciones para la misma alerta.
# Evita que el usuario reciba el mismo mensaje cada vez que corre el scraper
# mientras el precio siga bajo su umbral.
HORAS_ENTRE_NOTIFICACIONES = 24


# ─── Lógica de evaluación ─────────────────────────────────────────────────────

def precio_cumple_condicion(alerta: AlertaPrecio, precio_actual: float) -> bool:
    """
    Determina si el precio actual satisface la condición de una alerta.

    Hay dos tipos de condición que pueden coexistir en la misma alerta:
      - Umbral fijo: "avisame si el precio baja de X USD"
      - Porcentaje: "avisame si el precio baja un Y% respecto al último visto"

    Si el usuario definió ambas, usamos la que se cumpla primero (OR lógico).
    Esto le da más flexibilidad — puede querer saber tanto si el precio es
    atractivo en términos absolutos como si hubo una baja significativa.
    """
    # Condición 1: precio por debajo del umbral fijo
    if precio_actual < float(alerta.precio_umbral_usd):
        return True

    # Condición 2: bajada porcentual respecto al último precio visto
    # Solo evaluamos esto si hay un precio previo registrado Y el usuario
    # configuró un porcentaje de bajada.
    if alerta.porcentaje_bajada and alerta.ultimo_precio_visto:
        precio_anterior = float(alerta.ultimo_precio_visto)
        if precio_anterior > 0:
            bajada_real = ((precio_anterior - precio_actual) / precio_anterior) * 100
            if bajada_real >= float(alerta.porcentaje_bajada):
                return True

    return False


def notificacion_reciente(alerta: AlertaPrecio) -> bool:
    """
    Retorna True si la alerta fue notificada hace menos de HORAS_ENTRE_NOTIFICACIONES.

    Sin este chequeo, el usuario recibiría un mensaje cada vez que el scraper
    corra mientras el precio esté bajo su umbral — potencialmente varias veces
    al día para el mismo vuelo al mismo precio.
    """
    if alerta.ultima_notificacion is None:
        return False

    ahora = datetime.now(timezone.utc)
    tiempo_desde_ultima = ahora - alerta.ultima_notificacion
    return tiempo_desde_ultima < timedelta(hours=HORAS_ENTRE_NOTIFICACIONES)


# ─── Construcción del mensaje ─────────────────────────────────────────────────

def construir_mensaje(alerta: AlertaPrecio, precio_actual: float) -> str:
    """
    Construye el texto del mensaje de Telegram que se envía al usuario.

    El mensaje tiene que ser claro y accionable — el usuario tiene que
    entender de un vistazo qué vuelo bajó, cuánto cuesta, y qué hacer.
    """
    # Calculamos el porcentaje de bajada si hay un precio anterior para comparar.
    info_bajada = ""
    if alerta.ultimo_precio_visto:
        precio_anterior = float(alerta.ultimo_precio_visto)
        if precio_anterior > precio_actual:
            bajada = ((precio_anterior - precio_actual) / precio_anterior) * 100
            info_bajada = f"📉 Bajó un {bajada:.1f}% (antes USD {precio_anterior:,.0f})\n"

    mensaje = (
        f"✈️ *¡Alerta de precio!*\n\n"
        f"🛫 Ruta: *{alerta.origen} → {alerta.destino}*\n"
        f"💰 Precio actual: *USD {precio_actual:,.0f}*\n"
        f"{info_bajada}"
        f"🎯 Tu umbral: USD {float(alerta.precio_umbral_usd):,.0f}\n\n"
        f"Buscá el vuelo ahora antes de que suba el precio 🚀"
    )

    return mensaje


# ─── Motor principal ──────────────────────────────────────────────────────────

async def evaluar_alertas_para_vuelo(vuelo: HistorialVuelo, db: Session) -> None:
    """
    Punto de entrada principal del motor. Recibe un vuelo recién guardado
    y evalúa todas las alertas activas que coincidan con esa ruta.

    El flujo para cada alerta es:
      1. ¿La alerta está activa?
      2. ¿El precio actual cumple la condición?
      3. ¿No notificamos recientemente?
      → Si todo es True: notificar y actualizar el registro.
      → Si alguno es False: actualizar solo el último precio visto y seguir.
    """
    precio_actual = float(vuelo.precio_usd)

    # Buscamos todas las alertas activas para esta ruta específica.
    # ilike hace la comparación case-insensitive, por las dudas de que
    # el código guardado tenga una capitalización diferente.
    alertas = (
        db.query(AlertaPrecio)
        .filter(
            AlertaPrecio.activa == True,
            AlertaPrecio.origen.ilike(vuelo.origen),
            AlertaPrecio.destino.ilike(vuelo.destino),
        )
        .all()
    )

    if not alertas:
        print(f"  Sin alertas activas para {vuelo.origen} → {vuelo.destino}.")
        return

    print(f"  Evaluando {len(alertas)} alerta(s) para {vuelo.origen} → {vuelo.destino}...")

    # Creamos el bot de Telegram una sola vez y lo reutilizamos para todas
    # las alertas de esta ruta — evita abrir y cerrar conexiones innecesarias.
    bot = Bot(token=TELEGRAM_TOKEN)

    for alerta in alertas:
        print(f"    Alerta id={alerta.id} | umbral=USD {alerta.precio_umbral_usd} | "
              f"precio actual=USD {precio_actual}")

        cumple = precio_cumple_condicion(alerta, precio_actual)
        reciente = notificacion_reciente(alerta)

        if cumple and not reciente:
            # La condición se cumple y pasó suficiente tiempo desde la última
            # notificación — le avisamos al usuario.
            mensaje = construir_mensaje(alerta, precio_actual)

            try:
                await bot.send_message(
                    # El chat_id identifica unívocamente la conversación con
                    # el usuario en Telegram. Lo obtenemos del usuario dueño
                    # de la alerta a través de la relación SQLAlchemy.
                    chat_id=alerta.usuario.telegram_chat_id,
                    text=mensaje,
                    # parse_mode="Markdown" permite usar *negrita* y otros
                    # formatos en el mensaje.
                    parse_mode="Markdown",
                )
                print(f"    ✓ Notificación enviada al chat {alerta.usuario.telegram_chat_id}")

                # Actualizamos la alerta con el timestamp de esta notificación
                # y el precio que la disparó, para el próximo ciclo de evaluación.
                alerta.ultima_notificacion = datetime.now(timezone.utc)
                alerta.ultimo_precio_visto = precio_actual
                db.commit()

            except TelegramError as e:
                # Si Telegram falla (token inválido, usuario bloqueó el bot, etc.)
                # logueamos el error pero no interrumpimos el procesamiento de
                # las demás alertas — un error en una no debe afectar las otras.
                print(f"    ✗ Error de Telegram para alerta id={alerta.id}: {e}")

        elif cumple and reciente:
            print(f"    ↷ Condición cumplida pero notificación reciente — omitiendo.")
            # Aunque no notificamos, sí actualizamos el precio visto para
            # tener siempre el valor más reciente como referencia.
            alerta.ultimo_precio_visto = precio_actual
            db.commit()

        else:
            print(f"    — Precio USD {precio_actual} no cumple condición para alerta id={alerta.id}.")
            # Igual actualizamos el precio visto — es útil para calcular
            # el porcentaje de bajada en el futuro.
            alerta.ultimo_precio_visto = precio_actual
            db.commit()
