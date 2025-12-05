# 🔍 Cómo Ver los Logs del Web Dyno para Diagnosticar H10

## 🚨 Error Actual: H10 - App Crashed

El web dyno está crasheando. Necesitamos ver **por qué** está crasheando.

## 📋 Pasos para Ver los Logs del Web Dyno

### Opción 1: Desde Heroku Dashboard (Más Fácil)

1. **Abre:** https://dashboard.heroku.com/
2. **Selecciona** tu aplicación
3. **Haz clic** en la pestaña **"Logs"** (o "More" → "View logs")
4. **Busca líneas** que mencionen:
   - `heroku[web.1]:`
   - `Error`
   - `Failed`
   - Cualquier línea en **rojo**

5. **Copia** las últimas 30-50 líneas que mencionen el web dyno

### Opción 2: Filtrar Solo el Web Dyno

En los logs, busca específicamente líneas que empiecen con:
```
heroku[web.1]:
```

Esas son las líneas del web dyno que está crasheando.

## 🔍 Qué Buscar en los Logs

Busca errores como:

```
❌ Error: Cannot find module
❌ Error: ENOENT: no such file or directory
❌ Error: EADDRINUSE
❌ Error: Failed to start server
❌ Error: Module not found: '.next'
❌ Error: Cannot read property
❌ FATAL ERROR
❌ Process exited with code 1
```

## 📋 Información que Necesito

**Por favor, comparte:**

1. **Las últimas 30-50 líneas de los logs** que mencionen `web.1` o `Error`
2. **Especialmente las líneas** que aparecen justo antes de:
   ```
   heroku[web.1]: State changed from starting to crashed
   ```

## 🎯 Lo Más Importante

El error H10 significa que el servidor **intentó iniciar pero crasheó**. 

Los logs te dirán **exactamente por qué** crasheó. Esa información es clave para solucionarlo.

## 💡 Tip

Los logs de Heroku muestran:
- **Errores en rojo** o con prefijos como `Error:` o `Failed:`
- **Líneas del web dyno** con `heroku[web.1]:`

Busca específicamente esas líneas y compártelas.

