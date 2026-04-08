# línea 1
from datetime import datetime

# línea 2 — agregás field_validator acá
from pydantic import BaseModel, ConfigDict, Field, field_validator


class VueloCreate(BaseModel):
    origen: str = Field(..., min_length=1, max_length=120)
    destino: str = Field(..., min_length=1, max_length=120)
    aerolinea: str = Field(..., min_length=1, max_length=120)
    escalas: str = Field(..., min_length=1, max_length=120)
    precio_usd: float = Field(..., gt=0)

    @field_validator("origen", "destino", mode="before")
    @classmethod
    def normalizar_aeropuerto(cls, v: str) -> str:
        return v.strip().upper()


class VueloResponse(BaseModel):
    id: int
    origen: str
    destino: str
    aerolinea: str
    escalas: str
    precio_usd: float
    fecha_captura: datetime

    model_config = ConfigDict(from_attributes=True)

 #Schemas de PaisInteres ──────────────────────────────────────────

class PaisInteresCreate(BaseModel):
    # El bot le pregunta al usuario "¿a qué país querés viajar?"
    # y manda el código ISO de 2 letras (JP, BR, IT) más el nombre legible.
    codigo_pais: str = Field(..., min_length=2, max_length=2)
    nombre_pais: str = Field(..., min_length=1, max_length=80)
    
    # Opcional: "¿cuánto máximo querés gastar para ese destino?"
    # Si el usuario no responde o dice "sin límite", queda en None.
    presupuesto_max_usd: float | None = Field(default=None, gt=0)

    @field_validator("codigo_pais", mode="before")
    @classmethod
    def normalizar_codigo(cls, v: str) -> str:
        # Mismo criterio que con aeropuertos: siempre mayúsculas.
        # "jp", "Jp", "JP" son el mismo país.
        return v.strip().upper()


class PaisInteresResponse(BaseModel):
    id: int
    usuario_id: int
    codigo_pais: str
    nombre_pais: str
    presupuesto_max_usd: float | None
    fecha_agregado: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Schemas de AlertaPrecio ─────────────────────────────────────────

class AlertaCreate(BaseModel):
    # El bot construye estos tres datos a partir de la conversación:
    # "¿desde dónde viajás?" → origen
    # "¿a dónde querés ir?" → destino
    # "¿cuál es tu presupuesto máximo?" → precio_umbral_usd
    origen: str = Field(..., min_length=1, max_length=120)
    destino: str = Field(..., min_length=1, max_length=120)
    precio_umbral_usd: float = Field(..., gt=0)
    
    # Opcional: el usuario puede pedir que se le avise si baja un 20%
    # del precio que estaba cuando creó la alerta, en lugar de un umbral fijo.
    porcentaje_bajada: float | None = Field(default=None, gt=0, le=100)

    @field_validator("origen", "destino", mode="before")
    @classmethod
    def normalizar_ruta(cls, v: str) -> str:
        return v.strip().upper()


class AlertaResponse(BaseModel):
    id: int
    usuario_id: int
    origen: str
    destino: str
    precio_umbral_usd: float
    porcentaje_bajada: float | None
    activa: bool
    ultima_notificacion: datetime | None
    ultimo_precio_visto: float | None
    fecha_creacion: datetime

    model_config = ConfigDict(from_attributes=True)