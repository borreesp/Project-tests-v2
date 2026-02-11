from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.adapters.inbound.http.routers import admin, athlete, auth, coach, public
from src.infrastructure.config.settings import get_settings

settings = get_settings()
app = FastAPI(title=settings.app_name)

if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(public.router)
app.include_router(auth.router)
app.include_router(athlete.router)
app.include_router(coach.router)
app.include_router(admin.router)
