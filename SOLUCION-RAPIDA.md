# ⚡ Solución Rápida al Error de Heroku

## 🔴 Error Más Común: Variables de Entorno Faltantes

El error más probable es que faltan variables de entorno. El frontend necesita estas para funcionar:

### ✅ Pasos para Solucionar:

1. **Ve al Dashboard de Heroku:**
   - Abre https://dashboard.heroku.com/
   - Selecciona tu aplicación

2. **Configura las Variables de Entorno:**
   - Ve a **Settings** → **Config Vars** (o **Reveal Config Vars**)
   - Agrega estas variables (si no están):

   ```
   LIVEKIT_URL=wss://tu-servidor.livekit.cloud
   LIVEKIT_API_KEY=tu-api-key
   LIVEKIT_API_SECRET=tu-api-secret
   OPENAI_API_KEY=tu-openai-key
   ELEVEN_API_KEY=tu-elevenlabs-key
   ASSEMBLYAI_API_KEY=tu-assemblyai-key
   TAVUS_API_KEY=tu-tavus-key
   TAVUS_REPLICA_ID=r9d30b0e55ac
   ```

3. **Verifica los Dynos:**
   - Ve a la pestaña **Resources**
   - Asegúrate de que **web** y **worker** estén activos (toggle ON)
   - Si no están activos, actívalos

4. **Reinicia la Aplicación:**
   - Ve a **Settings** → **Restart all dynos**
   - O simplemente espera (se reiniciará automáticamente al cambiar Config Vars)

## 📋 Verificación Rápida

### Opción 1: Ver Logs en el Dashboard
1. Ve a **More** → **View logs** (o pestaña **Logs**)
2. Busca errores en rojo
3. Los errores más comunes:
   - `LIVEKIT_URL is not defined`
   - `LIVEKIT_API_KEY is not defined`
   - `Failed to start server`
   - `Port already in use`

### Opción 2: Verificar que la App Esté Corriendo
1. Ve a **Resources**
2. Debe mostrar:
   ```
   web.1   up   (esto significa que está corriendo)
   worker.1 up  (esto significa que está corriendo)
   ```

## 🎯 Solución Paso a Paso

### Si ves "LIVEKIT_URL is not defined":
1. Ve a Config Vars
2. Agrega `LIVEKIT_URL` con valor: `wss://tu-servidor.livekit.cloud`
3. Guarda

### Si ves "Cannot connect to database" o errores de conexión:
- El worker necesita las mismas variables de entorno
- Asegúrate de configurarlas todas en Config Vars

### Si la página carga pero muestra error:
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña Console
3. Busca errores en rojo
4. Estos errores te dirán qué variable falta

## 🔧 Configuración Mínima Requerida

Para que la app funcione, necesitas al menos:

**Para el Frontend (Web Dyno):**
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

**Para el Worker (Worker Dyno):**
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `OPENAI_API_KEY`
- `ELEVEN_API_KEY` o `ELEVENLABS_API_KEY`
- `ASSEMBLYAI_API_KEY`
- `TAVUS_API_KEY`
- `TAVUS_REPLICA_ID`

## 🚀 Después de Configurar

1. Espera 30-60 segundos para que los dynos se reinicien
2. Recarga la página de tu app
3. Debería funcionar ahora

## 📞 Si Aún No Funciona

1. **Copia el error exacto** de los logs
2. **Verifica que todas las variables estén configuradas**
3. **Revisa** el archivo `DIAGNOSTICO-ERROR.md` para más detalles

