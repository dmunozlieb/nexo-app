# Edit Perfil — Estructura de Back (Design Spec)

- **Fecha:** 2026-06-06
- **Rama:** `redesign/edit-profile`
- **Alcance:** Solo la estructura de backend/datos del editar perfil. La UI/rediseño de la pantalla se trabaja aparte.

## 1. Objetivo

Dar soporte de datos para que cada usuario pueda editar:

- Foto de perfil (avatar) — **ya existe**, sin cambios.
- Fondo de perfil a pantalla completa — **ya existe** como `banner_url`, sin cambios de esquema.
- Bio larga ("gran descripción") — **ampliar** de 160 a 2000 caracteres.
- Nombre visible (`display_name`) — **ya existe**, sin cambios.
- Username con **restricción de cambio: cooldown de 90 días**, aplicado por trigger en BD (infranqueable desde el cliente).
- Color de acento personalizable (`accent_color`) — **nuevo**.
- Enlaces/redes con restricciones de seguridad y mini descripción (`links`) — **nuevo**.

## 2. Estado actual (contexto)

Tabla `public.profiles` (migración `001_init_schema.sql`):

- `username text unique not null` — 3–24 chars, `^[a-z0-9_]+$`. **Sin restricción de cambio.**
- `display_name text` — nullable, 2–40 chars.
- `bio text` — nullable, **máx 160 chars**.
- `avatar_url text`, `banner_url text` — nullables.
- `created_at`, `updated_at`, `is_banned`.

Hechos relevantes:

- La pantalla `EditProfileScreen.tsx` ya usa `banner_url` como **fondo a pantalla completa** del perfil (sube a `banners/{userId}/background.jpg`). No se necesita columna nueva para el fondo.
- Buckets de storage `avatars` y `banners` ya existen (públicos, RLS por carpeta = `userId`).
- RLS `profiles_update_self` ya permite a cada usuario actualizar su propia fila.
- Validación en `src/utils/validation.ts` (`profileSchema`, `usernameSchema`, etc.).
- Servicio en `src/features/profile/services/profile-service.ts` (`updateProfile`).
- Tipo en `src/types/domain.ts` (`Profile`).
- Modo demo en `src/services/demo-service.ts` (`demoUpdateProfile`) — debe seguir funcionando.

## 3. Decisiones tomadas

| Tema | Decisión |
|------|----------|
| Cooldown de username | **90 días**, aplicado por **trigger en BD** |
| Longitud de bio | **2000** caracteres |
| Fondo de perfil | Mantener `banner_url` (sin columna nueva, no rompe código) |
| Color de acento | Incluir **ahora** (`accent_color`) |
| Enlaces/redes | Incluir **ahora** (`links`), con restricciones de seguridad |
| Avatar / display_name | Sin cambios |

## 4. Cambios de esquema (migración `010_profile_edit_v2.sql`)

### 4.1 Bio larga

```sql
alter table public.profiles drop constraint if exists profiles_bio_check;
alter table public.profiles
  add constraint profiles_bio_check
  check (bio is null or char_length(bio) <= 2000);
```

> Nota: en la migración 001 el límite de 160 está embebido en la definición de la columna
> (`bio text check (bio is null or char_length(bio) <= 160)`), por lo que el nombre real del
> constraint lo asigna Postgres automáticamente (p. ej. `profiles_bio_check`). La migración
> debe **descubrir y eliminar** el constraint existente sobre `bio` antes de crear el nuevo.
> Estrategia segura: hacer `drop constraint if exists` por el nombre autogenerado conocido y,
> como respaldo, recrear con un nombre explícito (`profiles_bio_check`).

### 4.2 Nuevas columnas

```sql
alter table public.profiles
  add column if not exists username_changed_at timestamptz,
  add column if not exists accent_color text
    check (accent_color is null or accent_color ~* '^#[0-9a-f]{6}$'),
  add column if not exists links jsonb not null default '[]'::jsonb
    check (
      jsonb_typeof(links) = 'array'
      and jsonb_array_length(links) <= 5
    );
```

- `username_changed_at`: marca de tiempo del último cambio de username. `null` = nunca se ha cambiado.
- `accent_color`: color hex `#RRGGBB` (validación de formato en BD + app).
- `links`: array JSON de objetos `{ label, url }`, máximo 5 elementos. La validación profunda de cada elemento (https-only, longitudes) se hace en la capa de app; la BD solo garantiza que es un array de ≤5.

### 4.3 Trigger: cooldown de username (90 días)

```sql
create or replace function public.enforce_username_cooldown()
returns trigger
language plpgsql
as $$
begin
  -- Solo aplica si el username realmente cambia
  if new.username is distinct from old.username then
    if old.username_changed_at is not null
       and old.username_changed_at > now() - interval '90 days' then
      raise exception 'USERNAME_COOLDOWN'
        using detail = to_char(
          old.username_changed_at + interval '90 days', 'YYYY-MM-DD'
        );
    end if;
    new.username_changed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_username_cooldown on public.profiles;
create trigger enforce_username_cooldown
before update on public.profiles
for each row execute function public.enforce_username_cooldown();
```

- La regla vive en BD: aunque el cliente intente saltarla, el `UPDATE` falla.
- El `detail` del error lleva la fecha en la que se podrá volver a cambiar, para que la app la muestre.
- El trigger de `set_updated_at` ya existente sigue funcionando (son triggers independientes `before update`).

## 5. Cambios en la capa de app

### 5.1 Validación — `src/utils/validation.ts`

- `bio` en `profileSchema`: subir de `.max(160, ...)` a `.max(2000, ...)`.
  - **Importante:** `onboardingSchema.bio` también tiene `.max(160)`. Decisión: el onboarding mantiene un límite corto (160) porque es un alta rápida; solo el edit perfil permite 2000. Documentar esta divergencia con un comentario en el código.
- Nuevo `accentColorSchema`: `z.string().regex(/^#[0-9a-fA-F]{6}$/, ...)` opcional/nullable.
- Nuevo `profileLinkSchema`:

```ts
const profileLinkSchema = z.object({
  label: z.string().trim().min(1).max(40, "La etiqueta no puede superar 40 caracteres."),
  url: z
    .string()
    .trim()
    .max(200, "El enlace no puede superar 200 caracteres.")
    .url("Introduce un enlace válido.")
    .refine((u) => u.startsWith("https://"), "Solo se permiten enlaces https seguros."),
});

const linksSchema = z.array(profileLinkSchema).max(5, "Máximo 5 enlaces.");
```

- `profileSchema` incorpora `accentColor` y `links`.
- Exportar tipo `ProfileLink` derivado de `profileLinkSchema`.

### 5.2 Servicio — `src/features/profile/services/profile-service.ts`

- `updateProfile` persiste `accent_color` y `links` además de los campos actuales.
- Sanitizar el `label` de cada link con `sanitizePlainText` (igual que `display_name`/`bio`).
- La URL no se sanitiza como texto, pero se confía en la validación Zod (https-only) previa.
- Mantener la rama `env.demoMode` → `demoUpdateProfile`.
- Manejo del error de cooldown: detectar el mensaje `USERNAME_COOLDOWN` del trigger y traducirlo a un error legible (con la fecha del `detail`) para la UI. Centralizar en `getErrorMessage` o en el propio servicio.

### 5.3 Tipos — `src/types/domain.ts`

```ts
export type ProfileLink = { label: string; url: string };

export type Profile = {
  // ...campos actuales...
  username_changed_at?: string | null;
  accent_color?: string | null;
  links?: ProfileLink[];
};
```

### 5.4 Modo demo — `src/services/demo-service.ts`

- `demoUpdateProfile` refleja `accent_color` y `links` en el perfil demo en memoria.
- No simula el cooldown (el demo no tiene BD); opcionalmente, dejar comentario indicando que el cooldown solo aplica en Supabase real.

## 6. Restricciones de seguridad de enlaces (resumen)

| Regla | Dónde | Valor |
|-------|-------|-------|
| Solo `https://` | Zod (app) | rechaza http y esquemas peligrosos (`javascript:`, `data:`, `file:`…) |
| Nº máximo de enlaces | Zod + check BD | 5 |
| Longitud `label` | Zod | 1–40 chars, sanitizado |
| Longitud `url` | Zod | máx 200 chars, formato URL válido |
| Forma de `links` | check BD | array JSON de ≤5 |

## 7. Validación / criterios de éxito

- `npm run typecheck` pasa (gate principal; lint está roto en este entorno).
- `npm test` pasa.
- Un usuario puede guardar avatar, fondo, bio larga (>160), display name, accent color y hasta 5 links https.
- Cambiar el username una vez funciona y setea `username_changed_at`.
- Un segundo cambio de username dentro de 90 días **falla** con error que indica la fecha de desbloqueo.
- Guardar un link `http://` o con esquema peligroso **falla** en validación.
- Modo demo (`EXPO_PUBLIC_DEMO_MODE=true`) sigue funcionando.

## 8. Mejoras futuras (NO en este alcance — documentadas a propósito)

- **Pronombres** (`pronouns text`): campo corto opcional mostrado junto al nombre.
- **Headline / tagline** (`headline text`, ~80 chars): frase corta bajo el nombre, distinta de la bio.
- **Historial de usernames** (`username_history`): tabla de auditoría para recuperar/auditar usernames previos.
- **Allowlist de dominios / anti-acortadores**: bloquear bit.ly y similares; requiere mantener una lista.
- **Unicidad case-insensitive de username**: índice único sobre `lower(username)` para evitar colisiones por mayúsculas.
- **Renombrar `banner_url` → `background_url`**: claridad semántica (hoy se reutiliza como fondo); aplazado para no romper código existente.

## 9. Archivos afectados

- `supabase/migrations/010_profile_edit_v2.sql` (nuevo)
- `src/utils/validation.ts`
- `src/features/profile/services/profile-service.ts`
- `src/types/domain.ts`
- `src/services/demo-service.ts`
