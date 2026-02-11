from fastapi import FastAPI

from src.adapters.inbound.http.routers import admin, athlete, auth, coach, public

app = FastAPI(title="Backend API")

app.include_router(public.router)
app.include_router(auth.router)
app.include_router(athlete.router)
app.include_router(coach.router)
app.include_router(admin.router)
