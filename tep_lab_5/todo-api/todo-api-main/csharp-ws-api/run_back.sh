#!/usr/bin/env bash
set -euo pipefail

# Usage: ./run-project.sh <project-folder>
# Esempio: ./run-project.sh todoapi-v00
#
# Lo script:
#  - verifica la cartella progetto
#  - trova il .csproj
#  - esegue dotnet restore + build
#  - esegue dotnet run usando launchSettings.json (applicationUrl)

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <project-folder>"
  exit 1
fi

PROJECT_DIR="$1"

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "❌ Errore: la cartella progetto '$PROJECT_DIR' non esiste."
  exit 1
fi

# Trova il file .csproj nella cartella (livello 1)
CSPROJ_FILE=$(find "$PROJECT_DIR" -maxdepth 1 -name "*.csproj" | head -n 1)

if [[ -z "$CSPROJ_FILE" ]]; then
  echo "❌ Nessun file .csproj trovato nella cartella '$PROJECT_DIR'"
  exit 1
fi

echo "📁 Progetto: $PROJECT_DIR"
echo "📄 File csproj: $CSPROJ_FILE"
echo "--------------------------------------"

echo "🔄 dotnet restore..."
dotnet restore "$PROJECT_DIR"

echo "🔨 dotnet build..."
dotnet build "$PROJECT_DIR" -c Debug

echo "▶️ Avvio applicazione (usa launchSettings.json / applicationUrl)..."
# NESSUNA variabile ASPNETCORE_URLS, NESSUN --no-launch-profile:
# così .NET usa l'applicationUrl e il profilo definiti in Properties/launchSettings.json
dotnet run --project "$CSPROJ_FILE"

