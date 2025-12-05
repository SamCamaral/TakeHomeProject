# ✅ Checklist de Despliegue en Heroku

## Archivos Creados/Verificados

- [x] `package.json` en la raíz - Detecta Node.js buildpack
- [x] `runtime.txt` en la raíz - Especifica Python 3.11.9
- [x] `.buildpacks` en la raíz - Define orden: Node.js primero, luego Python
- [x] `app.json` en la raíz - Configuración de la aplicación
- [x] `Procfile` - Configura web y worker dynos
- [x] `requirements.txt` - Ya existía, dependencias Python
- [x] `HEROKU-DEPLOY.md` - Guía completa de despliegue

## Pasos para Desplegar

### 1. Verificar Archivos
```bash
# Desde el directorio raíz (avatars/tavus/)
ls -la package.json runtime.txt .buildpacks app.json Procfile
```

Todos estos archivos deben estar presentes.

### 2. Configurar Buildpacks
```bash
heroku buildpacks
```

Debe mostrar:
```
1. heroku/nodejs
2. heroku/python
```

Si no, configúralos:
```bash
heroku buildpacks:clear
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python
```

### 3. Variables de Entorno Requeridas

Configura estas variables en Heroku (Settings > Config Vars o vía CLI):

- [ ] `LIVEKIT_URL` - URL de tu servidor LiveKit (wss://...)
- [ ] `LIVEKIT_API_KEY` - API key de LiveKit
- [ ] `LIVEKIT_API_SECRET` - API secret de LiveKit
- [ ] `OPENAI_API_KEY` - API key de OpenAI
- [ ] `ELEVEN_API_KEY` o `ELEVENLABS_API_KEY` - API key de ElevenLabs
- [ ] `ASSEMBLYAI_API_KEY` - API key de AssemblyAI
- [ ] `TAVUS_API_KEY` - API key de Tavus
- [ ] `TAVUS_REPLICA_ID` - ID de replica de Tavus (default: r9d30b0e55ac)

### 4. Desplegar
```bash
git add .
git commit -m "Configurar para Heroku"
git push heroku main
```

### 5. Escalar Dynos
```bash
heroku ps:scale web=1 worker=1
```

### 6. Verificar Estado
```bash
heroku ps
```

Debe mostrar ambos dynos activos:
```
web.1: up
worker.1: up
```

### 7. Ver Logs
```bash
# Todos los logs
heroku logs --tail

# Solo web
heroku logs --tail --dyno web

# Solo worker
heroku logs --tail --dyno worker
```

## ✅ Verificación Final

- [ ] Build exitoso sin errores
- [ ] Web dyno activo y respondiendo
- [ ] Worker dyno activo y conectado a LiveKit
- [ ] Variables de entorno configuradas
- [ ] Frontend accesible en la URL de Heroku
- [ ] Worker puede conectarse cuando hay una sesión

## 🔍 Solución de Problemas Rápida

### Error: "No default language could be detected"
- ✅ Ya resuelto con `package.json` y `requirements.txt` en la raíz
- Si persiste, verifica que los archivos estén en la raíz

### Worker no inicia
```bash
heroku ps:scale worker=1
heroku logs --tail --dyno worker
```

### Frontend no funciona
```bash
heroku logs --tail --dyno web
```

### Avatar no funciona
- Verifica `TAVUS_API_KEY` y `TAVUS_REPLICA_ID`
- Verifica que worker esté activo
- Revisa logs del worker para errores de conexión

## 💡 Notas Importantes

1. **NO necesitas consola local** - El worker se ejecuta automáticamente en Heroku
2. **Ambos dynos deben estar activos** - Web y Worker
3. **El build es automático** - Heroku construye el frontend durante el despliegue
4. **Variables de entorno** - Configúralas una vez, persisten entre despliegues

