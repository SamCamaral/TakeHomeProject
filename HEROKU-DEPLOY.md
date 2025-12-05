# Guía de Despliegue en Heroku

Esta guía te ayudará a desplegar tu aplicación con Tavus Avatar en Heroku correctamente.

## ✅ Archivos Creados

Se han creado los siguientes archivos en la raíz del proyecto para que Heroku detecte correctamente los buildpacks:

- `package.json` - Para detectar Node.js buildpack
- `runtime.txt` - Para especificar la versión de Python
- `.buildpacks` - Para especificar el orden de los buildpacks
- `app.json` - Configuración de la aplicación
- `Procfile` - Configuración de los dynos (ya existía, actualizado)

## 📋 Pasos para Desplegar

### 1. Verificar que estás en el directorio correcto

Asegúrate de estar en el directorio raíz del proyecto (`avatars/tavus/`):

```bash
# Verifica que veas estos archivos:
ls -la
# Deberías ver: package.json, runtime.txt, .buildpacks, app.json, Procfile, tavus.py
```

### 2. Inicializar Git (si no está inicializado)

```bash
git init
git add .
git commit -m "Preparar para despliegue en Heroku"
```

### 3. Crear la aplicación en Heroku

```bash
heroku create tu-app-name
# O simplemente:
heroku create
```

### 4. Configurar Buildpacks

Los buildpacks ya están especificados en `.buildpacks`, pero puedes verificarlos:

```bash
heroku buildpacks
```

Si necesitas configurarlos manualmente:

```bash
heroku buildpacks:clear
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python
```

**IMPORTANTE**: El orden es importante. Node.js primero, luego Python.

### 5. Configurar Variables de Entorno

Configura todas las variables de entorno necesarias:

```bash
heroku config:set LIVEKIT_URL=wss://tu-servidor.livekit.cloud
heroku config:set LIVEKIT_API_KEY=tu-api-key
heroku config:set LIVEKIT_API_SECRET=tu-api-secret
heroku config:set OPENAI_API_KEY=tu-openai-key
heroku config:set ELEVEN_API_KEY=tu-elevenlabs-key
# O alternativamente:
heroku config:set ELEVENLABS_API_KEY=tu-elevenlabs-key
heroku config:set ASSEMBLYAI_API_KEY=tu-assemblyai-key
heroku config:set TAVUS_API_KEY=tu-tavus-key
heroku config:set TAVUS_REPLICA_ID=r9d30b0e55ac
```

También puedes configurarlas desde el dashboard de Heroku en **Settings > Config Vars**.

### 6. Desplegar la Aplicación

```bash
git push heroku main
```

O si estás usando otra rama:

```bash
git push heroku tu-rama:main
```

### 7. Escalar los Dynos

Después del despliegue, asegúrate de que ambos dynos estén activos:

```bash
# Verificar el estado
heroku ps

# Escalar los dynos (si no están activos)
heroku ps:scale web=1 worker=1
```

**IMPORTANTE**: Ambos dynos (web y worker) deben estar activos para que la aplicación funcione correctamente.

### 8. Verificar los Logs

```bash
# Logs del web dyno
heroku logs --tail --dyno web

# Logs del worker dyno
heroku logs --tail --dyno worker

# Todos los logs
heroku logs --tail
```

## 🔧 Estructura del Proyecto

```
avatars/tavus/
├── package.json          ← NUEVO: Para detectar Node.js
├── runtime.txt           ← NUEVO: Versión de Python
├── .buildpacks           ← NUEVO: Orden de buildpacks
├── app.json              ← NUEVO: Configuración Heroku
├── Procfile              ← Actualizado
├── requirements.txt      ← Dependencias Python
├── tavus.py              ← Agente de Python
└── voice-assistant-frontend/
    ├── package.json      ← Dependencias Node.js
    └── ...
```

## ⚙️ Cómo Funciona

1. **Web Dyno**: Sirve el frontend Next.js en el puerto especificado por Heroku (variable `PORT`)
2. **Worker Dyno**: Ejecuta el agente de Python (`tavus.py`) que se conecta a LiveKit y maneja las interacciones con Tavus

Ambos dynos se ejecutan automáticamente en producción, **NO necesitas tener la consola local prendida**.

## 🐛 Solución de Problemas

### Error: "No default language could be detected"

Este error ya no debería aparecer porque:
- ✅ `package.json` está en la raíz (detecta Node.js)
- ✅ `requirements.txt` está en la raíz (detecta Python)
- ✅ `.buildpacks` especifica el orden correcto

Si aún aparece, verifica que los archivos estén en la raíz:

```bash
ls -la package.json runtime.txt .buildpacks
```

### El worker no inicia

1. Verifica que el worker dyno esté escalado:
   ```bash
   heroku ps:scale worker=1
   ```

2. Revisa los logs:
   ```bash
   heroku logs --tail --dyno worker
   ```

3. Verifica las variables de entorno:
   ```bash
   heroku config
   ```

### El frontend no se conecta al backend

1. Verifica que **ambos** dynos estén corriendo:
   ```bash
   heroku ps
   ```

2. Verifica las variables de entorno de LiveKit:
   ```bash
   heroku config | grep LIVEKIT
   ```

3. Revisa los logs de ambos dynos para ver errores de conexión

### El avatar de Tavus no funciona

1. Verifica que `TAVUS_API_KEY` y `TAVUS_REPLICA_ID` estén configurados:
   ```bash
   heroku config | grep TAVUS
   ```

2. Verifica que el worker esté corriendo:
   ```bash
   heroku ps
   heroku logs --tail --dyno worker
   ```

3. Verifica que el worker pueda conectarse a LiveKit revisando los logs

### Build falla durante el despliegue

1. Verifica que los buildpacks estén en el orden correcto:
   ```bash
   heroku buildpacks
   ```
   Debe mostrar: `1. heroku/nodejs`, `2. heroku/python`

2. Revisa los logs del build:
   ```bash
   heroku logs --tail
   ```

3. Verifica que todas las dependencias estén en `requirements.txt` y `voice-assistant-frontend/package.json`

## 💡 Notas Importantes

- ✅ El worker se ejecuta automáticamente en producción - NO necesitas consola local
- ✅ Ambos dynos deben estar activos simultáneamente
- ✅ El frontend se construye automáticamente durante el build de Heroku
- ✅ Las variables de entorno se configuran una vez y persisten

## 💰 Costos

Heroku cobra por dyno hora. Con 1 web dyno y 1 worker dyno, estarás usando 2 dynos simultáneamente. Considera usar el plan **Eco** si estás en desarrollo para ahorrar costos.

## 🔗 Enlaces Útiles

- [Dashboard de Heroku](https://dashboard.heroku.com/)
- [Documentación de Buildpacks](https://devcenter.heroku.com/articles/buildpacks)
- [Documentación de Dynos](https://devcenter.heroku.com/articles/dynos)

