# 🔍 Diagnóstico de Error en Heroku

## Cómo Ver los Logs (sin CLI de Heroku)

Si no tienes el CLI de Heroku instalado, puedes ver los logs desde el Dashboard:

1. Ve a https://dashboard.heroku.com/
2. Selecciona tu aplicación
3. Haz clic en "More" → "View logs" o en la pestaña "Logs"
4. Revisa los errores más recientes

## Problemas Comunes y Soluciones

### 1. ❌ Variables de Entorno Faltantes

El frontend necesita estas variables para funcionar:

**Revisa que estén configuradas en Heroku Dashboard → Settings → Config Vars:**

- ✅ `LIVEKIT_URL` - URL del servidor LiveKit (ej: `wss://tu-proyecto.livekit.cloud`)
- ✅ `LIVEKIT_API_KEY` - API key de LiveKit
- ✅ `LIVEKIT_API_SECRET` - API secret de LiveKit
- ✅ `OPENAI_API_KEY` - API key de OpenAI
- ✅ `ELEVEN_API_KEY` o `ELEVENLABS_API_KEY` - API key de ElevenLabs
- ✅ `ASSEMBLYAI_API_KEY` - API key de AssemblyAI
- ✅ `TAVUS_API_KEY` - API key de Tavus
- ✅ `TAVUS_REPLICA_ID` - ID de replica de Tavus

**Para configurarlas desde el Dashboard:**
1. Ve a tu app en Heroku Dashboard
2. Settings → Config Vars
3. Agrega cada variable con su valor
4. Guarda los cambios (esto reiniciará la app)

### 2. ❌ Error en el Build del Frontend

El frontend puede fallar si:
- No se construyó correctamente durante el despliegue
- Falta alguna dependencia
- Hay un error de TypeScript/Next.js

**Solución:**
Revisa los logs del build en Heroku Dashboard. Busca errores que empiecen con:
- `npm ERR!`
- `error Command failed`
- `Failed to compile`

### 3. ❌ Puerto No Configurado

El frontend debe usar el puerto que Heroku asigna (variable `PORT`).

**Verifica en `voice-assistant-frontend/package.json`:**
```json
"start": "next start -p ${PORT:-3000}"
```

Esto debería estar correcto. Si no, el frontend puede no iniciar.

### 4. ❌ Dyno No Escalado

**Verifica que ambos dynos estén activos:**
1. Ve a Heroku Dashboard → tu app
2. Haz clic en "Resources"
3. Verifica que tanto `web` como `worker` estén activos (toggle ON)

Si alguno está desactivado:
- Activa el toggle para `web`
- Activa el toggle para `worker`

### 5. ❌ Error en la API Route

El endpoint `/api/connection-details` necesita las variables de LiveKit.

**Posibles errores:**
- `LIVEKIT_URL is not defined`
- `LIVEKIT_API_KEY is not defined`
- `LIVEKIT_API_SECRET is not defined`

**Solución:** Configura estas variables en Heroku Config Vars.

## 📋 Checklist de Verificación

Usa este checklist para verificar todo:

- [ ] Variables de entorno configuradas en Heroku
- [ ] Dynos web y worker activos
- [ ] Build completado sin errores
- [ ] Logs muestran que el servidor inició correctamente
- [ ] La URL de la app es accesible

## 🔧 Pasos para Resolver

### Paso 1: Verificar Variables de Entorno

1. Ve a Heroku Dashboard → tu app → Settings → Config Vars
2. Verifica que todas estas variables estén presentes:
   ```
   LIVEKIT_URL
   LIVEKIT_API_KEY
   LIVEKIT_API_SECRET
   OPENAI_API_KEY
   ELEVEN_API_KEY (o ELEVENLABS_API_KEY)
   ASSEMBLYAI_API_KEY
   TAVUS_API_KEY
   TAVUS_REPLICA_ID
   ```

### Paso 2: Verificar Dynos

1. Ve a Resources
2. Asegúrate de que `web` y `worker` estén activos
3. Si no están activos, actívalos

### Paso 3: Revisar Logs

1. Ve a la pestaña "Logs" en el Dashboard
2. Busca errores en rojo
3. Busca mensajes que indiquen qué falló

### Paso 4: Reiniciar la Aplicación

Si todo parece estar bien pero aún hay errores:

1. Ve a Settings
2. Haz clic en "Restart all dynos"
3. Espera a que se reinicien
4. Prueba de nuevo

## 📝 Ejemplo de Error Común

### Error: "LIVEKIT_URL is not defined"

**Causa:** La variable de entorno no está configurada

**Solución:**
1. Ve a Config Vars
2. Agrega `LIVEKIT_URL` con el valor: `wss://tu-proyecto.livekit.cloud`
3. Guarda (la app se reiniciará automáticamente)

## 🆘 Si Nada Funciona

1. **Revisa los logs completos** en el Dashboard
2. **Copia el error específico** que aparece
3. **Verifica la configuración** usando el checklist de arriba
4. **Intenta hacer un redeploy** después de verificar todo

## 💡 Consejo

Si instalas el Heroku CLI, puedes ver los logs más fácilmente:
```bash
# Instalar Heroku CLI
# Windows: https://devcenter.heroku.com/articles/heroku-cli

# Luego:
heroku logs --tail --app tu-app-name
```

