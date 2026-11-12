#!/usr/bin/env bash
# Roda uma vez, quando o Codespace é criado.
set -euo pipefail
cd "$(dirname "$0")/.."

echo ">> Extraindo salafacil-unificado-Ajustado.zip em app-salafacil/"
rm -rf app-salafacil
python3 -c "import zipfile; zipfile.ZipFile('salafacil-unificado-Ajustado.zip').extractall('app-salafacil')"
PROJETO=app-salafacil/salafacil
cp .devcontainer/vite.codespaces.config.ts "$PROJETO/frontend/"

echo ">> Backend: dependências e banco SQLite"
cd "$PROJETO/backend"
python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt
.venv/bin/python -m app.criar_banco_sqlite

echo ">> Frontend: dependências"
cd ../frontend
npm ci --no-audit --no-fund

echo ">> Pronto."
