from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from ..database import get_db
from ..models import Reserva, Sala, Usuario
from ..security import get_usuario_autenticado, requer_papel

router = APIRouter()

class ReservaCreate(BaseModel):
    atividade: str = Field(min_length=1, max_length=200)
    data_reserva: str
    horario_inicio: str
    horario_fim: str
    sala_id: int

def para_minutos(horario: str):
    h, m = map(int, horario.split(":"))
    return h * 60 + m

def ha_conflito(reservas, inicio_novo, fim_novo):
    for r in reservas:
        inicio_existente = para_minutos(r.horario_inicio.strftime("%H:%M"))
        fim_existente = para_minutos(r.horario_fim.strftime("%H:%M"))
        if inicio_novo < fim_existente and fim_novo > inicio_existente:
            return True
    return False

@router.get("/")
def listar_reservas(db: Session = Depends(get_db), usuario: Usuario = Depends(get_usuario_autenticado)):
    return db.query(Reserva).all()

@router.post("/")
def criar_reserva(payload: ReservaCreate, db: Session = Depends(get_db), usuario: Usuario = Depends(get_usuario_autenticado)):
    data = payload.data_reserva
    inicio = para_minutos(payload.horario_inicio)
    fim = para_minutos(payload.horario_fim)

    if inicio >= fim:
        raise HTTPException(status_code=422, detail="Hora final precisa ser maior que a inicial.")

    sala = db.query(Sala).filter(Sala.id == payload.sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala não encontrada.")

    reservas = db.query(Reserva).filter(
        Reserva.sala_id == payload.sala_id,
        Reserva.data_reserva == data,
        Reserva.status == "confirmada"
    ).all()

    if ha_conflito(reservas, inicio, fim):
        raise HTTPException(status_code=409, detail="Já existe reserva para essa sala neste intervalo.")

    nova = Reserva(
        atividade=payload.atividade.strip(),
        data_reserva=data,
        horario_inicio=payload.horario_inicio,
        horario_fim=payload.horario_fim,
        sala_id=payload.sala_id,
        usuario_id=usuario.id,
        status="pendente"
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova

@router.patch("/{reserva_id}/confirmar")
def confirmar_reserva(reserva_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(requer_papel("coordenacao", "admin"))):
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada.")

    reserva.status = "confirmada"
    db.commit()
    return {"msg": "Reserva confirmada"}

@router.patch("/{reserva_id}/recusar")
def recusar_reserva(reserva_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(requer_papel("coordenacao", "admin"))):
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada.")

    reserva.status = "recusada"
    reserva.motivo_recusa = "Recusada pela coordenação"
    db.commit()
    return {"msg": "Reserva recusada"}