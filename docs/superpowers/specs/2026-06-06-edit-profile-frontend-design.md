# Edit Perfil — Frontend (Design Spec)

- **Fecha:** 2026-06-06
- **Rama:** `redesign/edit-profile`
- **Alcance:** UI del editar perfil (`EditProfileScreen.tsx`) + consumo de `accent_color` y `links` en la vista de perfil (`ProfileScreen.tsx`). El backend ya está hecho (ver `2026-06-06-edit-profile-backend-design.md`).

## 1. Contexto

El backend ya expone en `profiles`: `bio` (2000), `accent_color` (#RRGGBB), `links` (jsonb, máx 5, label 1-40, url https), `username_changed_at` (cooldown 90 días por trigger). `profileSchema` (Zod) ya valida todo eso y `ProfileInput` lo refleja. El servicio `updateProfile` ya persiste y mapea el error `USERNAME_COOLDOWN`.

Estado actual del frontend:
- `EditProfileScreen.tsx`: scroll simple con avatar, fondo (`banner_url` → bucket `banners/{id}/background.jpg`), nombre visible, username, bio (maxLength 160). Usa react-hook-form + `profileSchema`.
- `ProfileScreen.tsx`: usa `getProfileAccent(id)` (par determinista por id) para teñir gradientes; bio truncada a 3 líneas sin toggle; los `links` no se consumen en ningún sitio.
- `profile-accent.ts`: `AccentPair = [string, string]`; `ACCENT_PAIRS` (8 pares de marca); `getProfileAccent(seed)`.
- Tokens en `theme/tokens.ts`. Componentes compartidos: `Button`, `TextInput`, `Avatar`, `NebulaBackdrop`, `TagPill`.

## 2. Decisiones de diseño (del brainstorming con mockups)

| Tema | Decisión |
|------|----------|
| Layout del edit screen | **Vista previa en vivo arriba + formulario por secciones** |
| Selector de color de acento | **8 presets cósmicos + opción "personalizado" (hex)** |
| Enlaces en el perfil | **Filas con icono + etiqueta + dominio** |
| Icono de cada enlace | **Por plataforma conocida + genérico (teñido) para el resto** |
| Bio en el perfil | **Colapsada a ~5 líneas + toggle "ver más / ver menos"** |
| Username en cooldown | **Campo bloqueado con aviso de fecha; backend sigue validando** |

## 3. EditProfileScreen — estructura

Scroll vertical:

1. **Vista previa en vivo** (`LivePreviewHeader`): mini-cabecera que refleja en tiempo real `banner_url` (fondo), avatar, nombre visible, `@username` y el color de acento elegido. Se alimenta de `form.watch(...)`.
2. **Apariencia**: cambiar avatar (existente) + cambiar/quitar fondo (existente), reordenados bajo un encabezado de sección.
3. **Identidad**: nombre visible, username (con cooldown), bio larga (multiline, `maxLength={2000}`, crece en altura).
4. **Color de acento** (`AccentPicker`): fila de 8 swatches de degradado (los `ACCENT_PAIRS`) + un swatch "personalizado" que despliega un input hex (`#RRGGBB`). El valor guardado es un único hex (el color primario del par elegido, o el hex custom).
5. **Enlaces** (`LinksEditor`): lista editable de `{label, url}`; botón "Añadir enlace" (deshabilitado al llegar a 5); borrar por fila; validación https/longitud inline.
6. **Guardar cambios** (botón existente).

### Username + cooldown
- Leer `auth.profile.username_changed_at`. Si `username_changed_at` existe y `+90 días > hoy` → el campo username se renderiza **bloqueado** (no editable) con texto de ayuda: "Podrás cambiarlo el {fecha}" (fecha = `username_changed_at + 90 días`, formateada).
- Si no está en cooldown → editable normal.
- El backend sigue siendo la fuente de verdad (el trigger valida igualmente); esto es solo UX preventiva.

## 4. ProfileScreen — consumo

### Color de acento
- Nuevo helper `resolveAccent(profile)` → `AccentPair`:
  - Si `profile.accent_color` coincide (case-insensitive) con el color primario de un `ACCENT_PAIRS` → devuelve ese par.
  - Si `accent_color` es un hex custom → genera el 2º tono programáticamente (desplazamiento de tono/luminosidad) y devuelve `[accent_color, segundoTono]`.
  - Si `accent_color` es null → fallback al actual `getProfileAccent(profile.id)`.
- `ProfileScreen` sustituye la llamada directa a `getProfileAccent` por `resolveAccent(data)`. La función existente `onAccentColor` (luminancia → texto legible) se mantiene para el contraste.

### Enlaces
- Nuevo componente `ProfileLinks` que renderiza la sección "Enlaces" dentro de la card de identidad, **solo si `data.links?.length`**.
- Cada fila: icono (de `linkPresentation`) + etiqueta + dominio; al pulsar abre la url externa con `expo-web-browser` (`openBrowserAsync`) — ya es dependencia del proyecto.
- Util `linkPresentation(url)` → `{ icon, domain }`:
  - Extrae el dominio (sin `www.`).
  - Mapea dominios conocidos (youtube, twitch, twitter/x, instagram, tiktok, github, …) a un icono de `lucide-react-native`; fallback a un icono genérico (`Link`/`Globe`) teñido con el acento.

### Bio larga
- La bio en la card pasa de `numberOfLines={3}` fijo a colapsable: por defecto ~5 líneas; si el texto excede, mostrar toggle **"ver más / ver menos"** que alterna `numberOfLines`. Estado local en el componente de identidad.

## 5. Componentes y archivos

**Nuevos:**
- `src/features/profile/components/LivePreviewHeader.tsx` — preview en el edit screen.
- `src/features/profile/components/AccentPicker.tsx` — presets + custom hex.
- `src/features/profile/components/LinksEditor.tsx` — editor de links.
- `src/features/profile/components/ProfileLinks.tsx` — render de links en el perfil.
- `src/features/profile/utils/resolve-accent.ts` — `resolveAccent(profile)` + helper de 2º tono.
- `src/features/profile/utils/link-presentation.ts` — `linkPresentation(url)`.

**Modificados:**
- `src/features/profile/screens/EditProfileScreen.tsx` — nueva estructura por secciones + preview + AccentPicker + LinksEditor + cooldown username + bio 2000.
- `src/features/profile/screens/ProfileScreen.tsx` — `resolveAccent`, `ProfileLinks`, bio colapsable.

## 6. Errores y validación
- react-hook-form + `profileSchema` (ya valida https, máx 5, label 1-40, bio 2000). Errores por enlace inline en `LinksEditor`.
- AccentPicker custom: validar `#RRGGBB` con `accentColorSchema`; feedback inline.
- Cooldown: campo bloqueado en UI + error del backend ya mapeado a mensaje legible.

## 7. Testing
- Jest unit tests de los utils puros:
  - `resolveAccent`: preset conocido → par exacto; custom → par generado; null → fallback a `getProfileAccent`.
  - `linkPresentation`: dominios conocidos → icono correcto + dominio limpio; desconocido → genérico.
- Gate: `npm run typecheck` + `npm test`. La UI RN no tiene infra de render-test; validación visual en la app (web) tras implementar.

## 8. Criterios de éxito
- En el edit perfil se puede: cambiar avatar y fondo, escribir bio larga (>160), elegir acento (preset o custom), añadir/borrar hasta 5 enlaces https con etiqueta, y editar username salvo en cooldown (bloqueado con fecha).
- La vista previa refleja los cambios en vivo.
- En el perfil: el acento elegido tiñe los gradientes; los enlaces aparecen como filas con icono+dominio y abren la url; la bio larga colapsa con "ver más".
- Perfiles sin `accent_color`/`links` se ven igual que ahora (compatibilidad).
- Modo demo sigue funcionando.
- `typecheck` + `test` en verde.

## 9. Fuera de alcance
- Reordenar enlaces por drag&drop (futuro).
- Favicons reales por enlace (se usa mapeo por plataforma).
- Recorte/encuadre de imagen de avatar/fondo (se mantiene el `pickImage` actual).
- Las mejoras de backend ya aplazadas (pronombres, headline, etc.).
