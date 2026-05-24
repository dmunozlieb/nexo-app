# AGENTS.md - Guia para agentes de programacion

Este repositorio contiene **Nexo**, una app social de comunidades llamadas **Orbitas**. Esta guia esta pensada para Codex, ChatGPT, Claude Code y cualquier otra IA que tenga que continuar el desarrollo sin perder contexto.

## Primero: Expo SDK 56

Antes de escribir codigo, consulta la documentacion versionada exacta:

https://docs.expo.dev/versions/v56.0.0/

El proyecto usa Expo SDK 56 (`expo@~56.0.3`), Expo Router 56, React Native 0.85, React 19.2.3 y TypeScript estricto. Para dependencias Expo usa preferentemente `npx expo install`, no versiones al azar.

## Documentos clave

- `docs/PROJECT_CONTEXT.md`: contexto principal del producto, estado actual y reglas.
- `docs/ARCHITECTURE.md`: stack, estructura, navegacion, backend y patrones.
- `docs/DESIGN_SYSTEM.md`: identidad visual dark/cosmica/alien y reglas responsive.
- `docs/FEATURES.md`: funcionalidades actuales y preparadas.
- `docs/ROADMAP.md`: prioridades y pendientes.
- `docs/AI_TASKS.md`: checklist operativo para futuras sesiones.

## Reglas de trabajo

- No redisenes toda la app desde cero salvo que el usuario lo pida explicitamente.
- Haz cambios incrementales y localizados.
- Respeta la estetica Nexo: dark, cosmica, alien, con glow controlado y UI viva.
- Prioriza UX movil cuando haya duda.
- No rompas flujos existentes de auth, onboarding, Orbitas, posts, chats o moderacion.
- Manten la arquitectura por features: pantalla -> hook -> servicio -> Supabase/demo.
- No metas secretos ni claves privadas. Solo se permiten variables `EXPO_PUBLIC_*` publicas.
- No uses imagenes protegidas como assets oficiales. Usa assets propios, SVG internos o generacion con licencia clara.
- Revisa TypeScript, lint, tests y responsive si el cambio toca codigo.
- Respeta el arbol git sucio: no reviertas cambios ajenos.

## Comandos utiles

```bash
npm install
npm run start
npm run web
npm run android
npm run ios
npm run typecheck
npm run lint
npm test
npx expo export --platform web
npx supabase start
npx supabase db reset
eas build --platform android --profile production
```

No existe actualmente script `npm run build`; para web usa Expo export y para builds nativas usa EAS.

## Estado rapido

Funciona una base MVP avanzada: login, registro, onboarding, sistema orbital en home, explorar, crear Orbitas, detalle de Orbita, roles, posts, Ecos/reacciones, comentarios, chats Realtime, perfiles, reportes, bloqueos, moderacion, ajustes, modo demo y Supabase con RLS.

Lo mas delicado: responsive movil, pulido del mapa orbital, perfiles, chat avanzado, presencia online real, moderacion completa y deploy web.
