# Guía de Despliegue en Heroku

Esta guía te ayudará a desplegar tu aplicación con Tavus Avatar en Heroku.

## Estructura del Proyecto

El proyecto debe desplegarse desde el directorio que contiene tanto `voice-assistant-frontend` como `tavus.py`. Es decir, desde el directorio `avatars/tavus/`.

## Pasos para Desplegar

### 1. Preparar el Repositorio

Asegúrate de que todos los archivos necesarios estén en el repositorio:
- `Procfile` (en la raíz del proyecto)
- `requirements.txt` (en la raíz del proyecto)
- `runtime.txt` (en la raíz del proyecto)
- `app.json` (opcional, para configuración)
- `.buildpacks` (opcional, para especificar buildpacks)

### 2. Crear la Aplicación en Heroku

```bash
# Desde el directorio raíz del proyecto (avatars/tavus/)
heroku create tu-app-name
```

### 3. Configurar Buildpacks

Heroku necesita dos buildpacks: uno para Node.js y otro para Python. Configúralos en este orden:

```bash
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python
```

O usa el archivo `.buildpacks` que ya está creado.

### 4. Configurar Variables de Entorno

Configura todas las variables de entorno necesarias en Heroku:

```bash
heroku config:set LIVEKIT_URL=wss://tu-servidor.livekit.cloud
heroku config:set LIVEKIT_API_KEY=tu-api-key
heroku config:set LIVEKIT_API_SECRET=tu-api-secret
heroku config:set OPENAI_API_KEY=tu-openai-key
heroku config:set ELEVENLABS_API_KEY=tu-elevenlabs-key
heroku config:set ASSEMBLYAI_API_KEY=tu-assemblyai-key
heroku config:set TAVUS_API_KEY=tu-tavus-key
heroku config:set TAVUS_REPLICA_ID=r9d30b0e55ac
```

También puedes configurarlas desde el dashboard de Heroku en Settings > Config Vars.

### 5. Escalar los Dynos

Asegúrate de que tanto el web dyno como el worker dyno estén activos:

```bash
# Verificar el estado
heroku ps

# Escalar los dynos (si no están activos)
heroku ps:scale web=1 worker=1
```

### 6. Desplegar

```bash
git add .
git commit -m "Preparar para despliegue en Heroku"
git push heroku main
```

O si usas otra rama:

```bash
git push heroku tu-rama:main
```

### 7. Verificar los Logs

```bash
# Logs del web dyno
heroku logs --tail --dyno web

# Logs del worker dyno
heroku logs --tail --dyno worker

# Todos los logs
heroku logs --tail
```

## Solución de Problemas

### Error: "No default language could be detected"

Este error ocurre cuando Heroku no puede detectar el buildpack. Solución:

```bash
heroku buildpacks:clear
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python
```

### El worker no inicia

Verifica que el worker dyno esté escalado:

```bash
heroku ps:scale worker=1
```

Y revisa los logs:

```bash
heroku logs --tail --dyno worker
```

### El frontend no se conecta al backend

Asegúrate de que:
1. El worker dyno esté corriendo
2. Las variables de entorno de LiveKit estén correctamente configuradas
3. El worker pueda conectarse a LiveKit

### El avatar de Tavus no funciona

Verifica:
1. Que `TAVUS_API_KEY` y `TAVUS_REPLICA_ID` estén configurados
2. Que el worker esté corriendo y conectado a LiveKit
3. Los logs del worker para ver errores de conexión

## Notas Importantes

- El **web dyno** sirve el frontend Next.js
- El **worker dyno** ejecuta el agente de Python con Tavus
- Ambos deben estar corriendo simultáneamente
- El worker se conecta automáticamente a LiveKit cuando hay una sesión activa
- No necesitas tener la consola local prendida - todo funciona en producción

## Costos

Heroku cobra por dyno hora. Con 1 web dyno y 1 worker dyno, estarás usando 2 dynos simultáneamente. Considera usar el plan Eco si estás en desarrollo.

