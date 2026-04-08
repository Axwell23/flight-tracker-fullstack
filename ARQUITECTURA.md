# Arquitectura End-to-End

```mermaid
graph TD
  subgraph Frontend
    FE[Next.js 15\nDashboard Vuelos]
  end

  subgraph Backend
    API[FastAPI API\n(Gunicorn/Uvicorn)]
    SCRAPER[Scraper\n(Playwright + Scheduler)]
    BOT[Telegram Bot]
  end

  subgraph Data
    DB[(PostgreSQL\nvuelos_db)]
  end

  subgraph Externo
    TG[Telegram Platform]
  end

  FE -->|HTTPS/REST| API
  API -->|SQLAlchemy| DB
  API -->|Dispara scraping| SCRAPER
  SCRAPER -->|Persistencia| DB
  BOT -->|HTTP API_URL| API
  TG <-->|Mensajes/Updates| BOT

  classDef feStyle fill:#0f172a,stroke:#22d3ee,stroke-width:2px,color:#e2e8f0,rx:10,ry:10;
  classDef apiStyle fill:#0b1020,stroke:#22c55e,stroke-width:2px,color:#e2e8f0,rx:10,ry:10;
  classDef dataStyle fill:#0a0f1c,stroke:#a855f7,stroke-width:2px,color:#e2e8f0,rx:10,ry:10;
  classDef extStyle fill:#111827,stroke:#38bdf8,stroke-width:2px,color:#e2e8f0,rx:10,ry:10;

  class FE feStyle;
  class API,SCRAPER,BOT apiStyle;
  class DB dataStyle;
  class TG extStyle;
```
