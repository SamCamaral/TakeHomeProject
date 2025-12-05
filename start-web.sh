#!/bin/bash
set -e

echo "=== Iniciando web dyno ==="
echo "Working directory: $(pwd)"
echo "PATH: $PATH"

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
        echo "Added to PATH: $path"
    fi
done

cd voice-assistant-frontend || {
    echo "ERROR: No se pudo cambiar al directorio voice-assistant-frontend"
    exit 1
}

echo "Current directory: $(pwd)"

# Verificar si Next.js está construido
if [ ! -d ".next" ]; then
    echo "ERROR: Next.js no está construido. Verificando estructura..."
    ls -la
    echo "El build puede haber fallado. Verifica los logs del build."
    exit 1
fi

# Verificar node
if command -v node >/dev/null 2>&1; then
    echo "Node encontrado: $(which node)"
    echo "Node version: $(node --version)"
else
    echo "ERROR: node no encontrado en PATH"
    echo "Buscando node en el sistema..."
    find /app -name "node" -type f 2>/dev/null | head -5 || echo "No se encontró node"
fi

# Verificar npm
if command -v npm >/dev/null 2>&1; then
    echo "npm encontrado: $(which npm)"
    echo "npm version: $(npm --version)"
fi

# Intentar ejecutar Next.js directamente con node
if [ -f "node_modules/.bin/next" ] && command -v node >/dev/null 2>&1; then
    echo "Ejecutando Next.js con node directamente..."
    exec node node_modules/.bin/next start -p ${PORT:-3000}
fi

# Intentar usar npm
if command -v npm >/dev/null 2>&1; then
    echo "Ejecutando con npm..."
    exec npm run start
fi

# Si llegamos aquí, algo está mal
echo "ERROR: No se pudo encontrar node ni npm."
echo "Verifica los buildpacks en Heroku Dashboard:"
echo "1. Settings > Buildpacks"
echo "2. 'heroku/nodejs' debe estar ANTES de 'heroku/python'"
echo "3. Reinicia los dynos después de cambiar los buildpacks"
exit 1

