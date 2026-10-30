from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .models import *
from .routers.auth import router as auth_router
from .routers.salas import router as salas_router
from .routers.reservas import router as reservas_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SalaFácil", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")
app.include_router(salas_router, prefix="/salas")
app.include_router(reservas_router, prefix="/reservas")