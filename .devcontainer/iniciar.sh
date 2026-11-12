#!/usr/bin/env bash
# Roda toda vez que o Codespace liga: sobe a API (porta 8000, interna) e as telas (porta 5173).
# As telas repassam /api para a API, então só a porta 5173 precisa ser aberta no navegador.
cd "$(dirname "$0")/../app-salafacil/salafacil"

export DATABASE_URL="sqlite:///salafacil.db"
export SESSION_SECRET="salafacil-codespaces-demo"

cd backend
setsid nohup .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 > /tmp/salafacil-api.log 2>&1 < /dev/null &

cd ../frontend
VITE_API_URL=/api setsid nohup npx vite --config vite.codespaces.config.ts --host 0.0.0.0 --port 5173 --strictPort \
  > /tmp/salafacil-telas.log 2>&1 < /dev/null &

echo "SalaFácil iniciando: abra a aba PORTS e clique no link da porta 5173."
echo "Logs: /tmp/salafacil-api.log e /tmp/salafacil-telas.log"
