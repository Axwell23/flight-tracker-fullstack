
from contextlib import asynccontextmanager

import asyncio
import fastapi
from fastapi import BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session

from app.alertas import evaluar_alertas_para_vuelo
from app.database import Base, engine, get_db, SessionLocal, get_async_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import httpx
import os
from app.models import HistorialVuelo, Usuario, AlertaPrecio, PaisInteres
from app.schemas import (
    VueloCreate, VueloResponse,
    AlertaCreate, AlertaResponse,
    PaisInteresCreate, PaisInteresResponse,
)
from app.auth import verificar_api_key
from app.scheduler import crear_scheduler


# ─── Lifespan ────────────────────────────────────────────────────────────────
# El lifespan es el lugar correcto para el scheduler porque garantiza
# que arranque cuando el servidor levanta y se detenga cuando se apaga.
# Si usáramos otro mecanismo, correríamos el riesgo de que el scheduler
# siga corriendo en segundo plano aunque el servidor ya se haya detenido.

@asynccontextmanager
async def lifespan(app: fastapi.FastAPI):
    # === Arranque ===
    # Iniciamos el scheduler — a partir de acá corre en segundo plano.
    scheduler = crear_scheduler()
    scheduler.start()

    yield  # El servidor está corriendo y atendiendo requests.

    # === Apagado ===
    # Detenemos el scheduler limpiamente cuando uvicorn recibe Ctrl+C.
    # wait=False significa que no espera a que termine una tarea en curso
    # antes de apagarse — evita que el servidor tarde en cerrar.
    scheduler.shutdown(wait=False)


# ─── App ──────────────────────────────────────────────────────────────────────

app = fastapi.FastAPI(
    title="API de vuelos a Japón",
    version="1.0.0",
    lifespan=lifespan,
    dependencies=[fastapi.Depends(verificar_api_key)],
)

# 1. SlowAPI Limiter Setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 2. Agregar este bloque para permitir que Next.js le hable
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Tu frontend
    allow_credentials=False,
    allow_methods=["*"], # Permite POST, GET, PUT, DELETE
    allow_headers=["*"],
)


# ─── Raíz ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "API de vuelos funcionando"}


# ─── Usuarios ────────────────────────────────────────────────────────────────

@app.post("/usuarios/", status_code=fastapi.status.HTTP_201_CREATED)
def crear_usuario(
    nombre: str,
    telegram_chat_id: str,
    pais: str,
    ubicacion_actual: str,
    db: Session = fastapi.Depends(get_db),
):
    existente = db.query(Usuario).filter(
        Usuario.telegram_chat_id == telegram_chat_id
    ).first()
    if existente:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese telegram_chat_id",
        )

    nuevo_usuario = Usuario(
        nombre=nombre,
        telegram_chat_id=telegram_chat_id,
        pais=pais,
        ubicacion_actual=ubicacion_actual,
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


# ─── Vuelos ───────────────────────────────────────────────────────────────────

def disparar_alertas_background(vuelo_id: int) -> None:
    db = SessionLocal()
    try:
        vuelo = db.get(HistorialVuelo, vuelo_id)
        if vuelo is None:
            return
        asyncio.run(evaluar_alertas_para_vuelo(vuelo, db))
    finally:
        db.close()


@app.post("/vuelos/", response_model=VueloResponse, status_code=fastapi.status.HTTP_201_CREATED)
def crear_vuelo(
    vuelo: VueloCreate,
    background_tasks: BackgroundTasks,
    db: Session = fastapi.Depends(get_db),
):
    try:
        nuevo_vuelo = HistorialVuelo(
            origen=vuelo.origen,
            destino=vuelo.destino,
            aerolinea=vuelo.aerolinea,
            escalas=vuelo.escalas,
            precio_usd=vuelo.precio_usd,
        )
        db.add(nuevo_vuelo)
        db.commit()
        db.refresh(nuevo_vuelo)

        background_tasks.add_task(disparar_alertas_background, nuevo_vuelo.id)
        return nuevo_vuelo
    except Exception as e:
        db.rollback()
        raise fastapi.HTTPException(
            status_code=500,
            detail=f"No se pudo guardar el vuelo: {str(e)}",
        )


@app.get("/vuelos/{vuelo_id}", response_model=VueloResponse)
def obtener_vuelo(vuelo_id: int, db: Session = fastapi.Depends(get_db)):
    vuelo = db.get(HistorialVuelo, vuelo_id)
    if vuelo is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró un vuelo con id={vuelo_id}",
        )
    return vuelo


@app.get("/vuelos/", response_model=list[VueloResponse])
def listar_vuelos(
    origen: str | None = None,
    destino: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = fastapi.Depends(get_db),
):
    query = db.query(HistorialVuelo)
    if origen:
        query = query.filter(HistorialVuelo.origen.ilike(origen.strip()))
    if destino:
        query = query.filter(HistorialVuelo.destino.ilike(destino.strip()))
    vuelos = (
        query
        .order_by(HistorialVuelo.id.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    return vuelos


# ─── Países de interés ────────────────────────────────────────────────────────

@app.post(
    "/usuarios/{telegram_chat_id}/paises/",
    response_model=PaisInteresResponse,
    status_code=fastapi.status.HTTP_201_CREATED,
)
def agregar_pais(
    telegram_chat_id: str,
    pais: PaisInteresCreate,
    db: Session = fastapi.Depends(get_db),
):
    usuario = db.query(Usuario).filter(
        Usuario.telegram_chat_id == telegram_chat_id
    ).first()
    if usuario is None:
        raise fastapi.HTTPException(status_code=404, detail="Usuario no encontrado")

    nuevo_pais = PaisInteres(
        usuario_id=usuario.id,
        codigo_pais=pais.codigo_pais,
        nombre_pais=pais.nombre_pais,
        presupuesto_max_usd=pais.presupuesto_max_usd,
    )
    db.add(nuevo_pais)
    db.commit()
    db.refresh(nuevo_pais)
    return nuevo_pais


@app.get(
    "/usuarios/{telegram_chat_id}/paises/",
    response_model=list[PaisInteresResponse],
)
def listar_paises(telegram_chat_id: str, db: Session = fastapi.Depends(get_db)):
    usuario = db.query(Usuario).filter(
        Usuario.telegram_chat_id == telegram_chat_id
    ).first()
    if usuario is None:
        raise fastapi.HTTPException(status_code=404, detail="Usuario no encontrado")

    return (
        db.query(PaisInteres)
        .filter(PaisInteres.usuario_id == usuario.id)
        .all()
    )


# ─── Alertas de precio ────────────────────────────────────────────────────────

from pydantic import BaseModel

class AlertaWeb(BaseModel):
    usuario_id: int
    origen: str
    destino: str
    precio_limite: float

@app.post(
    "/alertas",
    response_model=AlertaResponse,
    status_code=fastapi.status.HTTP_201_CREATED,
)
@limiter.limit("10/minute")
async def crear_alerta_directa(
    request: fastapi.Request,
    alerta: AlertaWeb,
    db: AsyncSession = fastapi.Depends(get_async_db),
):
    nueva_alerta = AlertaPrecio(
        usuario_id=alerta.usuario_id,
        origen=alerta.origen.upper(),
        destino=alerta.destino.upper(),
        precio_umbral_usd=alerta.precio_limite,
    )
    db.add(nueva_alerta)
    await db.commit()
    await db.refresh(nueva_alerta)
    
    # Notificar asíncronamente si conocemos el telegram de usuario_id 1
    # Para propósitos del demo usando ID=1
    asyncio.create_task(enviar_notificacion_telegram(
        chat_id="DEMO_CHAT_ID", # En un sistema real lo buscarías del User
        mensaje=f"Alerta creada para la ruta {alerta.origen.upper()}-{alerta.destino.upper()} "
                f"precio objetivo de ${alerta.precio_limite}"
    ))
    return nueva_alerta

@app.get(
    "/alertas",
    response_model=list[AlertaResponse],
)
@limiter.limit("30/minute")
async def listar_alertas_directas(
    request: fastapi.Request,
    origen: str | None = None,
    db: AsyncSession = fastapi.Depends(get_async_db)
):
    filtros = []
    if origen:
        filtros.append(AlertaPrecio.origen.ilike(origen.strip()))
        
    query = select(AlertaPrecio).where(*filtros).order_by(AlertaPrecio.fecha_creacion.desc())
    resultado = await db.execute(query)
    return resultado.scalars().all()

@app.delete(
    "/alertas/{id}",
    status_code=fastapi.status.HTTP_204_NO_CONTENT,
)
async def eliminar_alerta_directa(
    id: int,
    db: AsyncSession = fastapi.Depends(get_async_db)
):
    query = select(AlertaPrecio).where(AlertaPrecio.id == id)
    resultado = await db.execute(query)
    alerta = resultado.scalars().first()
    
    if alerta is None:
        raise fastapi.HTTPException(status_code=404, detail="Alerta no encontrada")
        
    await db.delete(alerta)
    await db.commit()

async def enviar_notificacion_telegram(chat_id: str, mensaje: str):
    token = os.getenv("TELEGRAM_TOKEN")
    if not token or chat_id == "DEMO_CHAT_ID":
        # Simula sin crashear o manda el real si token existe
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": mensaje}
    async with httpx.AsyncClient() as client:
        try:
            await client.post(url, json=payload)
        except Exception:
            # Excepción de red atrapada silenciosamente en backend
            pass

@app.post(
    "/usuarios/{telegram_chat_id}/alertas/",
    response_model=AlertaResponse,
    status_code=fastapi.status.HTTP_201_CREATED,
)
def crear_alerta(
    telegram_chat_id: str,
    alerta: AlertaCreate,
    db: Session = fastapi.Depends(get_db),
):
    usuario = db.query(Usuario).filter(
        Usuario.telegram_chat_id == telegram_chat_id
    ).first()
    if usuario is None:
        raise fastapi.HTTPException(status_code=404, detail="Usuario no encontrado")

    nueva_alerta = AlertaPrecio(
        usuario_id=usuario.id,
        origen=alerta.origen,
        destino=alerta.destino,
        precio_umbral_usd=alerta.precio_umbral_usd,
        porcentaje_bajada=alerta.porcentaje_bajada,
    )
    db.add(nueva_alerta)
    db.commit()
    db.refresh(nueva_alerta)
    return nueva_alerta


@app.get(
    "/usuarios/{telegram_chat_id}/alertas/",
    response_model=list[AlertaResponse],
)
def listar_alertas(telegram_chat_id: str, db: Session = fastapi.Depends(get_db)):
    usuario = db.query(Usuario).filter(
        Usuario.telegram_chat_id == telegram_chat_id
    ).first()
    if usuario is None:
        raise fastapi.HTTPException(status_code=404, detail="Usuario no encontrado")

    return (
        db.query(AlertaPrecio)
        .filter(AlertaPrecio.usuario_id == usuario.id)
        .order_by(AlertaPrecio.fecha_creacion.desc())
        .all()
    )


@app.delete(
    "/usuarios/{telegram_chat_id}/alertas/{alerta_id}",
    status_code=fastapi.status.HTTP_204_NO_CONTENT,
)
def eliminar_alerta(
    telegram_chat_id: str,
    alerta_id: int,
    db: Session = fastapi.Depends(get_db),
):
    usuario = db.query(Usuario).filter(
        Usuario.telegram_chat_id == telegram_chat_id
    ).first()
    if usuario is None:
        raise fastapi.HTTPException(status_code=404, detail="Usuario no encontrado")

    alerta = db.query(AlertaPrecio).filter(
        AlertaPrecio.id == alerta_id,
        AlertaPrecio.usuario_id == usuario.id,
    ).first()
    if alerta is None:
        raise fastapi.HTTPException(status_code=404, detail="Alerta no encontrada")

    db.delete(alerta)
    db.commit()

