# Nexo

Nexo es una base MVP avanzada para una app social de comunidades. Las comunidades son **Orbitas**, las publicaciones tienen energia propia y las reacciones son **Ecos** con significado.

## Decisiones tecnicas

- **Expo SDK 56 estable**: plantilla oficial con `expo@~56.0.3`, `react-native@0.85.3`, `react@19.2.3`, Node 24 local y Android SDK 36 gestionado por Expo. Esto queda por encima del requisito actual de Google Play de target API 35 para apps nuevas/actualizadas desde el 31 de agosto de 2025.
- **Expo Router**: navegacion file-based con rutas protegidas y onboarding obligatorio.
- **Supabase**: Auth, PostgreSQL, Realtime, Storage, RLS y una Edge Function opcional para acciones de moderacion.
- **TanStack Query**: cache, paginacion, invalidacion y estado de servidor.
- **Zustand**: estado local minimo, por ahora tema claro/oscuro.
- **React Hook Form + Zod**: formularios con validacion compartida y limites de seguridad.
- **Sistema de estilos propio con tokens**: alternativa equivalente a NativeWind para evitar riesgo de compatibilidad en un SDK recien publicado y mantener tokens centralizados, responsive y reutilizables.

## Requisitos

- Node >= 22.13.0.
- npm >= 10.
- Expo CLI via `npx expo`.
- Supabase CLI si quieres correr backend local.
- EAS CLI para builds y submit.

## Configuracion

1. Crea `.env` desde `.env.example`.
2. Define:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

3. En Supabase, aplica las migraciones y seed.
4. Activa Email/Password en Auth. Google OAuth esta preparado en servicio, pero requiere configurar proveedor y redirect URLs.

### Modo demo sin Docker

Si no puedes usar Docker/WSL, activa:

```bash
EXPO_PUBLIC_DEMO_MODE=true
EXPO_PUBLIC_SUPABASE_URL=https://example.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=demo-anon-key
```

Con este modo puedes iniciar sesion y recorrer pantallas con datos locales en memoria. Supabase real queda intacto para cloud o local Docker.

## Comandos

```bash
npm install
npx expo start
npx supabase start
npx supabase db reset
npm run typecheck
npm test
eas build --platform android --profile production
eas submit --platform android
```

## Estructura

- `app/`: rutas Expo Router.
- `src/components/`: UI reutilizable y layout.
- `src/features/`: auth, feed, communities, posts, comments, chat, profile, search, moderation, settings.
- `src/lib/`: Supabase y Query Client.
- `src/theme/`: tokens y tema.
- `supabase/`: migraciones, RLS, seed y Edge Function opcional.
- `docs/`: arquitectura, privacidad, moderacion y Play Store.
- `tests/`: validaciones y utilidades.

## Supabase local

Las credenciales demo del seed son:

- `luna@nexo.local` / `Password123!`
- `kai@nexo.local` / `Password123!`
- `iris@nexo.local` / `Password123!`

El seed crea intereses, perfiles, Orbitas, miembros, posts, comentarios, reacciones, salas y mensajes.

## QA manual minimo

- Registro con email/password.
- Login y sesion persistente.
- Onboarding: username, intereses y avatar opcional.
- Descubrir Orbitas y unirse.
- Crear publicacion con energia y Orbita destino.
- Reaccionar con Ecos.
- Guardar publicacion.
- Comentar y responder comentario.
- Abrir sala de chat y enviar mensaje realtime.
- Reportar post, comentario, mensaje, perfil o comunidad.
- Bloquear usuario desde perfil.
- Revisar cola de moderacion como mod/owner.
- Editar perfil.
- Cambiar tema.
- Logout.

## Notas de produccion

- No se deben exponer claves privadas. La app solo usa `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- RLS es obligatorio: el cliente no decide permisos sensibles.
- Falta conectar politica de privacidad, terminos, soporte y formulario Data Safety antes de publicar.
- Para push notifications reales, crear proyecto EAS, configurar FCM/APNs y canales de Expo Notifications.
- Para rate limiting fuerte, mover acciones sensibles a Edge Functions con comprobacion de usuario y limites por IP/usuario.
- `npm audit` muestra avisos moderados transitivos en tooling de Expo por `uuid` via `@expo/config-plugins`; no ejecutes `npm audit fix --force` porque propone degradar Expo de forma incompatible.
