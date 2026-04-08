from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    telegram_chat_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    pais: Mapped[str] = mapped_column(String(80), nullable=False)
    ubicacion_actual: Mapped[str] = mapped_column(String(120), nullable=False)
    alertas_activas: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relaciones: desde un usuario podés acceder a sus alertas y países
    # directamente con usuario.alertas o usuario.paises_interes.
    alertas: Mapped[list["AlertaPrecio"]] = relationship(
        back_populates="usuario", cascade="all, delete-orphan"
    )
    paises_interes: Mapped[list["PaisInteres"]] = relationship(
        back_populates="usuario", cascade="all, delete-orphan"
    )


class HistorialVuelo(Base):
    __tablename__ = "historial_vuelos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    origen: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    destino: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    aerolinea: Mapped[str] = mapped_column(String(120), nullable=False)
    escalas: Mapped[str] = mapped_column(String(120), nullable=False)
    precio_usd: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    fecha_captura: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )


class AlertaPrecio(Base):
    __tablename__ = "alertas_precio"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"), nullable=False, index=True
    )
    origen: Mapped[str] = mapped_column(String(120), nullable=False)
    destino: Mapped[str] = mapped_column(String(120), nullable=False)
    precio_umbral_usd: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    porcentaje_bajada: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    activa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ultima_notificacion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ultimo_precio_visto: Mapped[float | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relación inversa: desde una alerta llegás al usuario dueño.
    usuario: Mapped["Usuario"] = relationship(back_populates="alertas")

    __table_args__ = (
        Index(
            'idx_alertas_origen_destino_activa',
            func.lower(origen),
            func.lower(destino),
            postgresql_where=(activa == True)
        ),
    )


class PaisInteres(Base):
    __tablename__ = "paises_interes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"), nullable=False, index=True
    )
    codigo_pais: Mapped[str] = mapped_column(String(2), nullable=False)
    nombre_pais: Mapped[str] = mapped_column(String(80), nullable=False)
    presupuesto_max_usd: Mapped[float | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    fecha_agregado: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    usuario: Mapped["Usuario"] = relationship(back_populates="paises_interes")
