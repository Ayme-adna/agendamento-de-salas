import os
import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .database import get_db
from .models import Usuario

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)

def criar_token(usuario: Usuario) -> str:
    payload = {
        "sub": str(usuario.id),
        "email": usuario.email,
        "papel": usuario.papel,
        "exp": datetime.utcnow() + timedelta(hours=8)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_usuario_autenticado(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Token ausente")

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")

    usuario = db.query(Usuario).filter(Usuario.id == int(payload["sub"])).first()
    if not usuario or not usuario.ativo:
        raise HTTPException(status_code=401, detail="Usuário inválido")

    return usuario

def requer_papel(*papel_permitido: str):
    def dependencia(usuario: Usuario = Depends(get_usuario_autenticado)):
        if usuario.papel not in papel_permitido:
            raise HTTPException(status_code=403, detail="Sem permissão")
        return usuario
    return dependencia