#!/bin/bash
set -e

# Buscar npm en ubicaciones comunes
for path in "$HOME/.heroku/node/bin" "/app/.heroku/node/bin" "/usr/local/bin" "/usr/bin"; do
    if [ -f "$path/npm" ]; then
        export PATH="$path:$PATH"
        break
    fi
done

cd voice-assistant-frontend

# Intentar usar npm
if command -v npm >/dev/null 2>&1; then
    npm run start
elif [ -f "node_modules/.bin/next" ] && command -v node >/dev/null 2>&1; then
    node node_modules/.bin/next start -p ${PORT:-3000}
else
    echo "ERROR: npm no encontrado. Verifica los buildpacks en Heroku Dashboard:"
    echo "1. Ve a Settings > Buildpacks"
    echo "2. Asegúrate de que 'heroku/nodejs' esté ANTES de 'heroku/python'"
    echo "3. Reinicia los dynos"
    exit 1
fi

