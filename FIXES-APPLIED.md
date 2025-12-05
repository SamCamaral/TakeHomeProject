# Correcciones Aplicadas para Heroku

## Problemas Resueltos

### 1. ✅ Versión de Python Actualizada
- **Antes**: `python-3.11.9` (versión específica)
- **Ahora**: `python-3.11` (versión mayor - recibe actualizaciones automáticas)
- **Archivo**: `runtime.txt`

### 2. ✅ Requirements.txt Corregido
- **Problema**: `livekit-plugins` no existe como paquete en PyPI
- **Solución**: Eliminado `livekit-plugins`. Los plugins vienen incluidos en `livekit-agents` o se instalan automáticamente.

## Archivos Modificados

1. **runtime.txt**
   - Actualizado a `python-3.11` para usar la última versión parche disponible

2. **requirements.txt**
   - Eliminado: `livekit-plugins` (no existe)
   - Mantenido: `livekit-agents` (incluye los plugins)
   - Mantenido: `python-dotenv`, `aiohttp`

## Próximos Pasos

Si después de estos cambios aún hay problemas con los plugins, puedes intentar:

1. Verificar si los plugins específicos se necesitan por separado:
   - Los plugins de LiveKit (tavus, silero, elevenlabs) pueden estar incluidos en `livekit-agents`
   - Si no, pueden necesitar instalación adicional

2. Revisar los logs de Heroku después del despliegue:
   ```bash
   heroku logs --tail
   ```

3. Si hay errores de importación de plugins, consultar la documentación de LiveKit para la instalación correcta.

## Comandos para Desplegar

```bash
# Agregar cambios
git add runtime.txt requirements.txt

# Commit
git commit -m "Corregir versión de Python y requirements.txt"

# Desplegar
git push heroku main
```

