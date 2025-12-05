# 🔧 Solución al Error en Heroku

## ⚠️ Problema: "An error occurred in the application"

Este error generalmente indica que:
1. **Faltan variables de entorno** (más común)
2. **Los dynos no están activos**
3. **Hay un error en el código al iniciar**

## ✅ Solución Inmediata (3 Pasos)

### Paso 1: Verificar Variables de Entorno

El frontend **NECESITA** estas variables para funcionar. Ve al Dashboard de Heroku:

1. Abre https://dashboard.heroku.com/
2. Selecciona tu aplicación
3. Ve a **Settings** → **Config Vars**
4. Verifica que tengas estas variables configuradas:

**Variables REQUERIDAS para el Frontend:**
```
LIVEKIT_URL=wss://tu-servidor.livekit.cloud
LIVEKIT_API_KEY=tu-api-key-aqui
LIVEKIT_API_SECRET=tu-api-secret-aqui
```

**Variables REQUERIDAS para el Worker:**
```
OPENAI_API_KEY=tu-openai-key
ELEVEN_API_KEY=tu-elevenlabs-key (o ELEVENLABS_API_KEY)
ASSEMBLYAI_API_KEY=tu-assemblyai-key
TAVUS_API_KEY=tu-tavus-key
TAVUS_REPLICA_ID=r9d30b0e55ac
```

### Paso 2: Verificar que los Dynos Estén Activos

1. Ve a la pestaña **Resources** en el Dashboard
2. Verifica que **AMBOS** estén activos:
   - ✅ `web` debe estar **ON**
   - ✅ `worker` debe estar **ON**

Si alguno está OFF, actívalo con el toggle.

### Paso 3: Ver los Logs

1. Ve a la pestaña **Logs** en el Dashboard
2. Busca errores en rojo
3. Los errores más comunes son:

#### Error: "LIVEKIT_URL is not defined"
**Solución:** Agrega la variable `LIVEKIT_URL` en Config Vars

#### Error: "LIVEKIT_API_KEY is not defined"
**Solución:** Agrega la variable `LIVEKIT_API_KEY` en Config Vars

#### Error: "Failed to start server"
**Solución:** Verifica que el puerto esté configurado correctamente (debería funcionar automáticamente)

#### Error: "Module not found" o "Cannot find module"
**Solución:** El build falló. Revisa los logs del build para ver qué dependencia falta.

## 🎯 Diagnóstico Rápido

### ¿La página carga pero muestra error?
- Abre las herramientas de desarrollador (F12)
- Ve a Console
- Busca errores en rojo
- Estos errores te dirán exactamente qué falta

### ¿La página no carga nada?
- Verifica que el dyno `web` esté activo
- Revisa los logs para ver si el servidor inició
- Busca errores como "Port already in use" o "EADDRINUSE"

### ¿Puedes conectar pero el avatar no funciona?
- Verifica que el dyno `worker` esté activo
- Revisa los logs del worker
- Verifica que las variables de Tavus estén configuradas:
  - `TAVUS_API_KEY`
  - `TAVUS_REPLICA_ID`

## 📋 Checklist Completo

Usa este checklist para verificar todo:

- [ ] Todas las variables de entorno están en Config Vars
- [ ] El dyno `web` está activo
- [ ] El dyno `worker` está activo
- [ ] Los logs no muestran errores críticos
- [ ] La URL de la app es accesible

## 🔄 Después de Hacer Cambios

1. Espera 30-60 segundos para que los dynos se reinicien
2. Recarga la página de tu app
3. Si aún hay error, revisa los logs nuevamente

## 📞 Próximos Pasos

1. **Primero:** Verifica las variables de entorno (Paso 1)
2. **Segundo:** Verifica los dynos (Paso 2)
3. **Tercero:** Revisa los logs para el error específico (Paso 3)

Si después de esto aún no funciona, copia el error exacto de los logs y podemos diagnosticarlo más específicamente.

## 💡 Tip: Instalar Heroku CLI (Opcional)

Si instalas el Heroku CLI, puedes ver los logs más fácilmente:

**Windows:**
1. Descarga desde: https://devcenter.heroku.com/articles/heroku-cli
2. Instala el ejecutable
3. Luego puedes usar: `heroku logs --tail --app tu-app-name`

Pero puedes hacer todo desde el Dashboard sin necesidad del CLI.

