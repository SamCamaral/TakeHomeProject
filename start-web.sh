#!/bin/bash
set -e

# Buscar node/npm en todas las ubicaciones posibles
NODE_PATHS=(
    "$HOME/.heroku/node/bin"
    "/app/.heroku/node/bin"
    "/usr/local/heroku/node/bin"
    "/usr/local/bin"
    "/usr/bin"
    "/bin"
)

for path in "${NODE_PATHS[@]}"; do
    if [ -d "$path" ]; then
        export PATH="$path:$PATH"
    fi
done

cd voice-assistant-frontend

# Verificar si Next.js está construido
if [ ! -d ".next" ]; then
    echo "ERROR: Next.js no está construido. El build puede haber fallado."
    exit 1
fi

# Intentar ejecutar Next.js directamente con node
if [ -f "node_modules/.bin/next" ] && command -v node >/dev/null 2>&1; then
    exec node node_modules/.bin/next start -p ${PORT:-3000}
fi

# Intentar usar npm
if command -v npm >/dev/null 2>&1; then
    exec npm run start
fi

# Si llegamos aquí, algo está mal
echo "ERROR: No se pudo encontrar node ni npm."
echo "Verifica los buildpacks en Heroku Dashboard:"
echo "1. Settings > Buildpacks"
echo "2. 'heroku/nodejs' debe estar ANTES de 'heroku/python'"
exit 1

