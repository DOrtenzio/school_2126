#!/usr/bin/env bash
set -euo pipefail

# Usage: ./dev-run.sh <project-dir> [--deep-clean]
# Env:   HTTP_PORT=5004  HTTPS_PORT=7004
# Notes: --trust del certificato è supportato SOLO su Windows/macOS.
#        Su Linux il certificato verrà creato ma non "trusted" a livello OS (browser mostrerà warning).

# ---------- args ----------
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <project-dir> [--deep-clean]"
  exit 1
fi

PROJECT_DIR="$1"
DEEP_CLEAN="false"
if [[ "${2:-}" == "--deep-clean" ]]; then
  DEEP_CLEAN="true"
fi

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "Errore: directory progetto non trovata: $PROJECT_DIR"
  exit 2
fi

HTTP_PORT="${HTTP_PORT:-5004}"
HTTPS_PORT="${HTTPS_PORT:-7004}"

# ---------- info ----------
echo "==> Progetto: $PROJECT_DIR"
echo "==> Porte: http=$HTTP_PORT  https=$HTTPS_PORT"

# ---------- optional deep clean ----------
if [[ "$DEEP_CLEAN" == "true" ]]; then
  echo "==> Deep clean: bin/ obj/ + cache NuGet"
  rm -rf "$PROJECT_DIR/bin" "$PROJECT_DIR/obj" "$PROJECT_DIR/.vs" || true
  dotnet nuget locals all --clear
fi

# ---------- dev certs ----------
echo "==> Pulizia certificati developer"
dotnet dev-certs https --clean || true

OS_NAME="$(uname -s || echo unknown)"
echo "==> Generazione certificato developer"
# Genera sempre il cert
dotnet dev-certs https

# Prova il trust solo su Windows/macOS
case "$OS_NAME" in
  Darwin)
    echo "==> Trust certificato (macOS)"
    dotnet dev-certs https --trust || true
    ;;
  MINGW*|MSYS*|CYGWIN*|Windows_NT)
    echo "==> Trust certificato (Windows)"
    dotnet dev-certs https --trust || true
    ;;
  *)
    echo "==> Avviso: su $OS_NAME il trust automatico non è supportato; il browser potrebbe mostrare un warning."
    ;;
esac

# ---------- restore & build ----------
echo "==> Restore pacchetti"
dotnet restore "$PROJECT_DIR"

echo "==> Build (Release)"
dotnet build "$PROJECT_DIR" -c Release

# ---------- run ----------
echo "==> Run senza launch profile (bind esplicito HTTP/HTTPS)"
export ASPNETCORE_URLS="https://localhost:${HTTPS_PORT};http://localhost:${HTTP_PORT}"
dotnet run --project "$PROJECT_DIR" --no-launch-profile
