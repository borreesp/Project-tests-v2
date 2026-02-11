# Monorepo

Monorepo con pnpm workspaces + Turborepo.

## Estructura

- `apps/web` - Next.js App Router + TypeScript
- `apps/mobile` - Expo + React Native + TypeScript
- `packages/types` - tipos compartidos
- `packages/sdk` - cliente API y auth
- `packages/ui-tokens` - design tokens
- `backend` - estructura base backend

## Levantar entorno local (Windows PowerShell)

### Requisitos
- Node.js 20+
- pnpm 10+
- Python 3.12
- Poetry 1.8+
- Docker Desktop (solo si quieres Postgres en contenedor)

### 1) Instalar dependencias JS del monorepo
```powershell
pnpm install
```

### 2) Backend (FastAPI)
En una terminal:
```powershell
cd backend
poetry install
$env:CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
poetry run uvicorn src.adapters.inbound.http.main:app --host 0.0.0.0 --port 8000 --reload
```

Health check:
```powershell
curl http://localhost:8000/health
```

### 3) Front web (Next.js)
En otra terminal:
```powershell
$env:NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
pnpm --filter @apps/web dev
```

Web queda en `http://localhost:3000`.

### 4) Front mobile (Expo)
En otra terminal:
```powershell
$env:EXPO_PUBLIC_BACKEND_URL="http://localhost:8000"
pnpm --filter @apps/mobile dev
```

Notas mobile:
- Si pruebas en emulador Android, `localhost` suele funcionar.
- Si pruebas en dispositivo fisico, usa tu IP LAN:
  - ejemplo: `http://192.168.1.50:8000`
  - y exporta `EXPO_PUBLIC_BACKEND_URL` con esa IP.

### 5) Postgres con Docker (opcional pero recomendado para migraciones/seed)
Si vas a usar Alembic o seed SQL, levanta Postgres:
```powershell
docker run --name hf-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app -p 5432:5432 -d postgres:16
```

Aplicar migraciones y seed:
```powershell
cd backend
$env:DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/app"
poetry run alembic upgrade head
poetry run python -m src.infrastructure.db.seed
```

Parar y borrar contenedor:
```powershell
docker stop hf-postgres
docker rm hf-postgres
```

### 6) Atajo para web+mobile (sin backend)
Desde la raiz:
```powershell
pnpm dev
```

Esto levanta apps del monorepo por Turbo (`web` y `mobile`), pero el backend se arranca aparte con Poetry.

