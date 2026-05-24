# CLAUDE.md - Instrucciones para Claude Code

Claude Code debe tratar este repositorio como una app de producto en marcha, no como un prototipo vacio.

## Contexto inmediato

Nexo es una red social de comunidades llamadas **Orbitas**. La experiencia central es un **sistema orbital** con estetica dark/cosmica/alien. Los usuarios crean comunidades, se unen a ellas, publican posts, reaccionan con **Ecos**, chatean, ven presencia online aproximada, personalizan perfiles y operan con roles de comunidad.

Lee primero:

- `AGENTS.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/FEATURES.md`
- `docs/AI_TASKS.md`

## Regla obligatoria de Expo

Antes de escribir codigo, consulta la documentacion versionada exacta de Expo SDK 56:

https://docs.expo.dev/versions/v56.0.0/

El repo usa `expo@~56.0.3`, `expo-router@~56.2.5`, React Native 0.85, React 19.2.3 y TypeScript estricto. Instala paquetes Expo con `npx expo install` cuando aplique.

## Como trabajar

- Haz cambios pequenos, verificables y compatibles con la arquitectura existente.
- Manten la division por features en `src/features/*`.
- Usa componentes compartidos de `src/components/*` antes de crear UI nueva.
- Usa tokens de `src/theme/tokens.ts`; evita colores hardcodeados salvo efectos cosmicos puntuales ya presentes.
- Pasa por hooks y servicios para datos; no llenes pantallas con consultas Supabase directas.
- Conserva modo demo (`EXPO_PUBLIC_DEMO_MODE=true`) al tocar servicios.
- No expongas secretos.
- No uses assets externos protegidos como oficiales.
- Revisa mobile y desktop, especialmente home, explorar, crear Orbita y detalle de Orbita.

## Validacion recomendada

```bash
npm run typecheck
npm run lint
npm test
npx expo export --platform web
```

Si solo editas documentacion, no hace falta ejecutar build completo, pero si modificas codigo de navegacion, servicios o componentes compartidos, valida antes de cerrar.
