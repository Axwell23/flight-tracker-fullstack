# ✈️ Flight Tracker | Full-Stack Monitoring System

Este proyecto nació de la necesidad de automatizar la búsqueda de pasajes sin depender de sitios externos que inflan precios. No es solo un script de scraping; es un ecosistema completo que integra una interfaz moderna, un motor asíncrono y notificaciones push directas al celular.

## 🛠️ Tech Stack

* **Frontend**: Next.js 15 (App Router) y Tailwind CSS v4 para una UI oscura con estética Glassmorphism.
* **Backend**: FastAPI (Python) manejando la lógica de forma totalmente asíncrona.
* **Scraper**: Playwright ejecutándose en subprocesos aislados para evitar bloqueos en el event loop.
* **Base de Datos**: PostgreSQL gestionado con SQLAlchemy y migraciones versionadas via Alembic.
* **Notificaciones**: Integración con la API de Telegram para alertas en tiempo real.

## 🏗️ Arquitectura del Sistema

El proyecto está organizado en un mono-repo para facilitar el despliegue y la consistencia de tipos:

* `/dashboard-vuelos`: La interfaz de usuario donde se gestionan las alertas y se ven las analíticas.
* `/scraper_api`: El motor que orquesta el scraping, la persistencia y los envíos a Telegram.

### Diagrama de Flujo
```mermaid
graph LR
    A[Next.js UI] --> B[FastAPI]
    B --> C[(PostgreSQL)]
    B --> D[Playwright Scraper]
    D --> E[Telegram Bot]
