# Troubleshooting — errores recurrentes y como salir de ellos

Registro de errores reales que han pasado en el proyecto y la forma de resolverlos. Si te topas con uno nuevo y lo resuelves, anadelo aqui con el mismo formato: **sintoma → causa → solucion → prevencion**.

---

## Bundling / Metro

### 1. `Unable to resolve module ...` aunque la dep esta instalada

**Sintoma** (en consola del browser):

```
Refused to execute script from 'http://localhost:8081/node_modules/expo-router/entry.bundle?...'
because its MIME type ('application/json') is not executable.
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

Si abres la URL del bundle directamente, ves un JSON con:

```
"type": "UnableToResolveError",
"message": "Unable to resolve module @<package> from <file>: ... could not be found within the project or in these directories: node_modules"
"cause.message": "Module does not exist in the Haste module map or in these directories: ..."
```

Y al verificar con `ls node_modules/<package>`, **el paquete existe y esta sano**.

**Causa**: el **Haste map de Metro** esta cacheado de antes de que el paquete existiera. Metro guarda esa cache en `%TEMP%`, **fuera del proyecto**, asi que ni `--clear` ni borrar `.expo` ni `node_modules/.cache` la limpian. Pasa tipicamente cuando se hace `npm install <algo>` con Metro corriendo.

Agravante en este proyecto: el repo vive en `C:\Users\<user>\OneDrive\...`. OneDrive interfiere con los watchers de Metro en Windows — los archivos tardan en sincronizar y el haste map no se refresca solo.

**Solucion** (PowerShell, en orden):

```powershell
# 1. Para Metro (Ctrl+C en la terminal donde corre)

# 2. Limpieza completa de caches
Remove-Item -Recurse -Force .expo, node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:TEMP\metro-cache" -ErrorAction SilentlyContinue
Get-ChildItem "$env:TEMP" -Filter "haste-map-*" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# 3. Arrancar con --clear
npx expo start --web --clear
```

Si despues de esto sigue, opcion nuclear:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
npx expo start --web --clear
```

**Prevencion**:

- Para Metro **antes** de instalar deps. No hagas `npm install` mientras `expo start` esta corriendo.
- A largo plazo: considera mover el proyecto fuera de OneDrive (p. ej. `C:\dev\orbital-app`). Es una fuente recurrente de problemas con watchers y permisos en Windows.

**Incidente real**: 2026-05-26. Codex instalo `expo-font` + `@expo-google-fonts/inter` mientras Metro corria. Solo se resolvio borrando `%TEMP%\metro-cache` y los `haste-map-*` del temp.

---

## Patron para futuras entradas

```markdown
### N. <Titulo breve del error>

**Sintoma**: que se ve (mensaje exacto si es posible).

**Causa**: por que ocurre.

**Solucion**: pasos concretos en orden.

**Prevencion**: como evitar que vuelva a pasar.

**Incidente real**: fecha + contexto breve.
```
