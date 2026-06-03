# Nexo - Contexto principal del proyecto

Estado observado: 2026-05-25. Para los cambios concretos de la ultima sesion lee `docs/SESSION_2026-05-25.md`.

Este es el documento principal para que una IA de programacion entienda rapidamente que es Nexo, que ya existe y como continuar sin romper la direccion del producto.

## Resumen del producto

**Nexo** es una red social de comunidades llamadas **Orbitas**. Cada Orbita agrupa personas alrededor de intereses, normas y conversaciones propias. La app busca que entrar en comunidades se sienta como navegar una galaxia viva, no como usar otra lista generica de grupos.

El problema que resuelve: ayuda a personas con intereses compartidos a encontrar comunidades con identidad clara, participar con publicaciones y chats, y mantener espacios sanos mediante roles, reportes y moderacion.

La experiencia deseada es social, inmersiva y ligeramente alien: dark, cosmica, con energia visual, glow y una mascota que da personalidad sin convertir la interfaz en caricatura. Debe sentirse moderna, segura y expresiva.

La diferencia frente a una red social generica esta en:

- Comunidades como Orbitas, no grupos anonimos.
- Home como sistema orbital visual, no feed plano.
- Ecos como reacciones con intencion.
- Identidad alien/cosmica propia.
- Roles comunitarios visibles.
- Perfiles contextualizados por comunidad.
- Chats ligados a Orbitas y conversaciones directas.

## Conceptos clave

- **Orbitas**: comunidades. Tienen nombre, categoria, descripcion, reglas, visibilidad, avatar, banner, miembros, posts y chat general.
- **Ecos**: la reaccion a un post. Es una **unica interaccion** (un boton "Eco" que se alterna). El cliente solo escribe `inspire` y, desde la migracion `009`, el schema `post_reactions` solo admite ese valor (los tipos `relate`/`curious`/`support` se eliminaron).
- **Mascota alien**: identidad visual de Nexo, implementada como `NexoMascot`.
- **Sistema orbital**: pantalla principal/home, implementada con `GalaxyOrbitMap`. Muestra comunidades como planetas con senales de actividad.
- **Roles de comunidad**: `owner`, `admin`, `mod`, `helper`, `member`.
- **Perfiles por comunidad**: un perfil puede abrirse con `communityId` para mostrar rol, union y posts dentro de esa Orbita.
- **Chats**: conversaciones comunitarias y directas. Los mensajes usan Realtime en Supabase y modo demo local.
- **Usuarios online**: existe conteo aproximado visual (`online_count` derivado). La base de datos tiene `profiles.last_seen_at` preparado para presencia real.

## Estado actual

Nexo es un MVP avanzado construido con Expo SDK 56 y Supabase. No es solo una maqueta: tiene servicios, hooks, validaciones, RLS, modo demo, tests de validacion y pantallas funcionales.

Funciona o esta implementado:

- Login, registro, recuperar contrasena y logout.
- Onboarding con username, nombre visible, bio, avatar e intereses.
- Home como sistema orbital.
- Explorar Orbitas con busqueda, filtros y tarjetas.
- Sidebar desktop y bottom nav movil.
- Crear Orbita con categoria, reglas, visibilidad, avatar y banner.
- Detalle de Orbita con posts, chats, miembros, normas y gestion.
- Roles visibles y helpers de permisos.
- Crear posts, ver detalle, comentar, reaccionar con Ecos, guardar y reportar.
- Chat de comunidad y chat directo con subscripcion Realtime.
- Perfil propio y perfiles ajenos, incluyendo contexto por comunidad.
- Editar perfil basico.
- Seguir, bloquear, reportar.
- Cola de moderacion basica.
- Ajustes de cuenta, privacidad, notificaciones preparadas y tema claro/oscuro.
- Modo demo sin Docker/Supabase local.

Esta a medias o necesita pulido:

- Responsive movil en pantallas densas.
- Sistema orbital: ya es visualmente fuerte, pero requiere iteracion fina en legibilidad, rendimiento y estados.
- Bottom sheet: existe y se usa en mapa orbital/reportes; falta extender/pulir para mas flujos moviles.
- Perfil: falta banner real en vista/edicion y mas profundidad social.
- Chat: faltan last message real en Supabase, read receipts, canales multiples, media y mejor UX.
- Presencia online: hoy es aproximada; falta Realtime Presence o actualizaciones de `last_seen_at`.
- Moderacion: base funcional, pendiente permisos/UX mas completos.
- Reportes y bloqueos: existen, pero faltan pantallas de gestion y feedback robusto.
- Deploy web: hay export/dist previo, pero falta proceso final documentado y revisado.

## Stack tecnico

- Expo SDK 56.
- Expo Router con rutas por archivo.
- React Native 0.85 y React 19.
- TypeScript estricto.
- Supabase: Auth, PostgreSQL, RLS, Realtime, Storage y Edge Functions opcionales.
- TanStack Query para server state.
- Zustand para estado local de UI.
- React Hook Form + Zod para formularios y validacion.
- `expo-image`, `expo-blur`, `expo-linear-gradient`, `expo-image-picker`, `expo-notifications`.
- `lucide-react-native` para iconos.
- Jest + `jest-expo` para tests.
- EAS para builds nativas.

## Reglas de desarrollo para IAs

- Lee la documentacion versionada de Expo SDK 56 antes de escribir codigo: https://docs.expo.dev/versions/v56.0.0/
- No redisenes todo desde cero sin pedirlo.
- Manten cambios incrementales y reversibles.
- No rompas funcionalidad existente.
- Conserva modo demo al tocar datos.
- No metas secretos, service role keys ni claves privadas.
- No uses imagenes protegidas como assets oficiales.
- Manten la estetica Nexo.
- Prioriza UX movil cuando haya dudas.
- Revisa responsive en mobile y desktop.
- Revisa TypeScript/build/lint/tests cuando haya cambios de codigo.
- Si tocas permisos sensibles, recuerda que la autoridad final debe estar en Supabase RLS, RPC o Edge Functions, no solo en UI.

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
eas submit --platform android
```

No existe actualmente `npm run build`. Para web usa `npx expo export --platform web`; para nativo usa EAS.

## Modo demo

Para probar sin Supabase real:

```bash
EXPO_PUBLIC_DEMO_MODE=true
EXPO_PUBLIC_SUPABASE_URL=https://example.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=demo-anon-key
```

Credenciales demo:

- `luna@nexo.local` / `Password123!`
- `kai@nexo.local` / `Password123!`
- `iris@nexo.local` / `Password123!`

## Decisiones visuales ya tomadas

- Dark mode como experiencia principal.
- Paleta base: fondo casi negro, violeta, cian, magenta y verde exito.
- Componentes con radios contenidos, bordes sutiles, glow y gradientes.
- Mascota alien como senal emocional del producto.
- Home orbital como primera pantalla real tras auth/onboarding.
- Navegacion desktop con sidebar y movil con bottom nav.
- Tarjetas de comunidad con banner, avatar levantado, actividad y presencia.
- Evitar landing page; la app debe abrir en la experiencia usable.

## Documentos relacionados

- `docs/ARCHITECTURE.md`: arquitectura tecnica detallada.
- `docs/DESIGN_SYSTEM.md`: estilo visual y responsive.
- `docs/FEATURES.md`: inventario funcional.
- `docs/ROADMAP.md`: prioridades.
- `docs/AI_TASKS.md`: checklist para sesiones futuras.
- `docs/moderation-policy.md`: politica de moderacion.
- `docs/privacy-notes.md`: notas de privacidad.
- `docs/play-store-checklist.md`: checklist Play Store.
