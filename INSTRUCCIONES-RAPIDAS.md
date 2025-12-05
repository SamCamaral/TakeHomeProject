# 🚀 Instrucciones Rápidas para Desplegar en Heroku

## ✅ Problema Resuelto

El error **"No default language could be detected"** está resuelto. Se crearon los archivos necesarios para que Heroku detecte correctamente Node.js y Python.

## 📁 Archivos Creados

Se agregaron estos archivos en la raíz del proyecto:

- ✅ `package.json` - Detecta Node.js buildpack
- ✅ `runtime.txt` - Especifica Python 3.11.9
- ✅ `.buildpacks` - Define el orden de buildpacks
- ✅ `app.json` - Configuración de Heroku
- ✅ `Procfile` - Ya existía, verificado

## 🎯 Pasos Rápidos para Desplegar

### 1. Desde el directorio raíz (`avatars/tavus/`), ejecuta:

```bash
# Inicializar git si no está inicializado
git init
git add .
git commit -m "Configurar para Heroku"

# Crear app en Heroku
heroku create tu-app-name

# Configurar buildpacks (en este orden)
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python

# Configurar variables de entorno
heroku config:set LIVEKIT_URL=wss://tu-servidor.livekit.cloud
heroku config:set LIVEKIT_API_KEY=tu-api-key
heroku config:set LIVEKIT_API_SECRET=tu-api-secret
heroku config:set OPENAI_API_KEY=tu-openai-key
heroku config:set ELEVEN_API_KEY=tu-elevenlabs-key
heroku config:set ASSEMBLYAI_API_KEY=tu-assemblyai-key
heroku config:set TAVUS_API_KEY=tu-tavus-key
heroku config:set TAVUS_REPLICA_ID=r9d30b0e55ac

# Desplegar
git push heroku main

# Escalar dynos (IMPORTANTE: ambos deben estar activos)
heroku ps:scale web=1 worker=1

# Verificar estado
heroku ps
```

### 2. Ver logs para verificar que todo funciona:

```bash
# Todos los logs
heroku logs --tail

# Solo worker (para verificar el avatar)
heroku logs --tail --dyno worker
```

## ✅ Verificación

Después del despliegue, verifica:

1. **Build exitoso** - Sin errores durante el despliegue
2. **Dynos activos** - Ejecuta `heroku ps`, ambos deben estar "up"
3. **Frontend accesible** - Abre la URL de tu app en el navegador
4. **Worker corriendo** - Revisa logs del worker, debe conectarse a LiveKit

## 🔑 Puntos Clave

✅ **El worker se ejecuta automáticamente** - NO necesitas consola local
✅ **Ambos dynos deben estar activos** - Web y Worker
✅ **El build es automático** - Heroku construye todo durante el despliegue
✅ **Variables de entorno** - Configúralas una vez, persisten

## 📚 Documentación Completa

- `HEROKU-DEPLOY.md` - Guía completa y detallada
- `DEPLOY-CHECKLIST.md` - Checklist paso a paso

## 🆘 Problemas Comunes

### Si el build falla:
```bash
heroku buildpacks
# Debe mostrar Node.js primero, luego Python
```

### Si el worker no inicia:
```bash
heroku ps:scale worker=1
heroku logs --tail --dyno worker
```

### Si el frontend no carga:
```bash
heroku logs --tail --dyno web
```

## 💰 Recordatorio

Heroku cobra por dyno hora. Con 1 web + 1 worker = 2 dynos simultáneos. Considera el plan **Eco** para desarrollo.

