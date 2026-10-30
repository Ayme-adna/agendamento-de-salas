from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from ..database import get_db
from ..models import Usuario
from ..security import criar_token, get_usuario_autenticado

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
    email: str
    senha: str

class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    cargo: str
    papel: str

    class Config:
        orm_mode = True

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == payload.email).first()
    if not usuario or not pwd_context.verify(payload.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

    return {
        "access_token": criar_token(usuario),
        "usuario": usuario
    }

@router.get("/me")
def me(usuario: Usuario = Depends(get_usuario_autenticado)):
    return usuario