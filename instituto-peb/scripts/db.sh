#!/usr/bin/env sh
# Executa um subcomando da CLI do Supabase contra o banco remoto, lendo
# SUPABASE_DB_URL do .env.local. Uso: scripts/db.sh push | types | query "<sql>"
set -eu
cd "$(dirname "$0")/.."
if [ ! -f .env.local ]; then echo "Falta .env.local (copie de .env.example)"; exit 1; fi
DB_URL=$(grep '^SUPABASE_DB_URL=' .env.local | cut -d= -f2-)
if [ -z "$DB_URL" ]; then echo "SUPABASE_DB_URL não definida no .env.local"; exit 1; fi
# gen types precisa de um daemon Docker (roda postgres-meta em contêiner).
# Sem Docker, usa o socket do Podman do usuário: systemctl --user start podman.socket
if [ -z "${DOCKER_HOST:-}" ] && ! docker info >/dev/null 2>&1; then
  PODMAN_SOCK="/run/user/$(id -u)/podman/podman.sock"
  [ -S "$PODMAN_SOCK" ] && export DOCKER_HOST="unix://$PODMAN_SOCK"
fi
case "${1:-}" in
  push)  npx supabase db push --db-url "$DB_URL" --yes ;;
  types) npx supabase gen types typescript --db-url "$DB_URL" --schema public > src/types/database.ts && echo "src/types/database.ts gerado" ;;
  query) shift; npx supabase db query --db-url "$DB_URL" "$@" ;;
  *) echo "uso: scripts/db.sh push | types | query \"<sql>\""; exit 1 ;;
esac
