# ⚠️ IMPORTANTE: Ubicación de los Archivos

Los archivos de configuración de Heroku que acabo de crear están en `voice-assistant-frontend/`, pero **DEBEN estar en el directorio padre** (`avatars/tavus/`) que contiene tanto `voice-assistant-frontend` como `tavus.py`.

## Pasos Inmediatos

### 1. Mover los Archivos

Mueve estos archivos desde `voice-assistant-frontend/` al directorio padre (`avatars/tavus/`):

```bash
# Desde el directorio voice-assistant-frontend/
mv Procfile ..
mv requirements.txt ..
mv runtime.txt ..
mv app.json ..
mv .buildpacks ..
mv README-HEROKU.md ..
```

O manualmente:
- `Procfile` → `../Procfile`
- `requirements.txt` → `../requirements.txt`
- `runtime.txt` → `../runtime.txt`
- `app.json` → `../app.json`
- `.buildpacks` → `../.buildpacks`
- `README-HEROKU.md` → `../README-HEROKU.md`

### 2. Verificar la Estructura

Tu estructura debería verse así:

```
avatars/tavus/
├── Procfile          ← AQUÍ
├── requirements.txt  ← AQUÍ
├── runtime.txt       ← AQUÍ
├── app.json          ← AQUÍ
├── .buildpacks       ← AQUÍ
├── tavus.py          ← AQUÍ
├── voice-assistant-frontend/
│   ├── package.json
│   ├── app/
│   └── ...
└── README-HEROKU.md  ← AQUÍ
```

### 3. Desplegar desde el Directorio Correcto

**IMPORTANTE**: Debes hacer el deploy desde `avatars/tavus/`, NO desde `voice-assistant-frontend/`:

```bash
cd avatars/tavus
git init  # Si no está inicializado
git add .
git commit -m "Preparar para Heroku"
heroku create tu-app-name
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python
heroku config:set LIVEKIT_URL=wss://tu-servidor.livekit.cloud
heroku config:set LIVEKIT_API_KEY=tu-api-key
heroku config:set LIVEKIT_API_SECRET=tu-api-secret
heroku config:set OPENAI_API_KEY=tu-openai-key
heroku config:set ELEVENLABS_API_KEY=tu-elevenlabs-key
heroku config:set ASSEMBLYAI_API_KEY=tu-assemblyai-key
heroku config:set TAVUS_API_KEY=tu-tavus-key
heroku config:set TAVUS_REPLICA_ID=r9d30b0e55ac
heroku ps:scale web=1 worker=1
git push heroku main
```

## ¿Por qué?

El `Procfile` necesita acceder a:
- `voice-assistant-frontend/` para el web dyno
- `tavus.py` para el worker dyno

Por eso debe estar en el directorio que contiene ambos.

