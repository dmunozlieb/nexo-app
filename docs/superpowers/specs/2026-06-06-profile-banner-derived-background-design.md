# Perfil — Banner real + Fondo derivado (Design Spec)

- **Fecha:** 2026-06-06
- **Rama:** `redesign/edit-profile`
- **Alcance:** Reconcebir el sistema de imágenes del perfil: convertir `banner_url` en un **banner/portada real** (hero sobre el avatar) y **derivar el fondo de pantalla** de esa misma imagen (difuminado). Afecta a `ProfileScreen`, `LivePreviewHeader`, `EditProfileScreen`. **Sin cambios de backend.**

## 1. Problema

Hoy `banner_url` se usa como **fondo a pantalla completa** del perfil (`NebulaBackdrop`), y **no existe un banner/portada** (la tira de imagen llamativa sobre el avatar, tipo X/Discord). Además, una imagen pensada como fondo se ve bien en móvil/tablet (vertical) pero **mal en desktop** (apaisado): recorte/estiramiento.

## 2. Decisiones (brainstorming con mockups)

| Tema | Decisión |
|------|----------|
| Modelo de imagen | **1 imagen** (`banner_url`) = banner/portada. El fondo se **deriva** (difuminado) de ella. Sin columna nueva |
| Estilo de portada | **Hero inmersivo**: banner alto a sangre + avatar (con aro girando) y nombre **centrados encima**, con fundido hacia la card |
| Fondo en desktop/móvil | **Glow superior**: banner muy difuminado y escalado en la franja superior, con máscara que lo disuelve hacia el cósmico oscuro. El blur oculta el recorte → válido en todos los anchos |
| Sin banner | Hero usa `AnimatedGradient` de acento; fondo usa `CosmicBackground` (como hoy) |
| Backend | **Sin cambios.** `banner_url` se reinterpreta; lo existente pasa a ser el banner |

## 3. Estado actual (contexto)

- `ProfileScreen.tsx` → `ProfileShell` pinta `NebulaBackdrop source={banner_url}` como fondo completo, o `CosmicBackground` si no hay. La card de identidad (`Identity`) tiene el avatar arriba-izquierda (`AvatarRing` con aro girando), nombre/handle, badges, `CollapsibleBio`, `ProfileLinks`, stats, acciones.
- `LivePreviewHeader.tsx` → banner como imagen/`AnimatedGradient` + avatar solapado abajo-izquierda.
- `EditProfileScreen.tsx` → sección "Apariencia" con botón de fondo que hace `pickImage({ aspect: [9, 16] })` y sube a `banners/{userId}/background.jpg` → `banner_url`.
- Backend: `profiles.banner_url` (sin cambios), bucket `banners`.

## 4. ProfileScreen

### 4.1 Hero (`ProfileHero`, nuevo)
- Banner a sangre en la parte superior de la card de identidad, altura ~140 (ajustable), `banner_url` con `contentFit="cover"`.
- Degradado de fundido (de transparente al color de la card) en la parte inferior del banner para legibilidad.
- **Avatar + nombre + @handle centrados** sobre/solapando el banner. El avatar mantiene el aro de gradiente girando (reutiliza la lógica de `AvatarRing`, respeta reduced-motion).
- Sin `banner_url` → el banner se rellena con `AnimatedGradient` de acento (no se rompe).
- Debajo del hero, el resto de la card (badges, bio, enlaces, stats, acciones) se mantiene.

### 4.2 Fondo derivado (`DerivedBackdrop`, nuevo)
- Reemplaza a `NebulaBackdrop` en `ProfileShell` cuando hay `banner_url`.
- Pinta `banner_url` **muy difuminado y escalado** en la franja superior, con una **máscara/gradiente** que lo disuelve hacia abajo hacia el fondo cósmico oscuro.
- Las estrellas (`CosmicBackground`) se mantienen por detrás/debajo.
- Sin `banner_url` → solo `CosmicBackground` (comportamiento actual).
- Blur: en web `filter: blur()` (estilo web-only); en native, `expo-blur` `BlurView` sobre la imagen (fallback: imagen escalada con baja opacidad si `BlurView` no rinde). El plan concretará la técnica por plataforma.

## 5. EditProfileScreen + LivePreviewHeader

- Sección "Apariencia": el control de imagen pasa de "Fondo del perfil" a **"Banner / Portada"**. Copy: "La imagen de portada de tu perfil; el fondo se genera de ella." `pickImage` cambia de `aspect: [9, 16]` a **apaisado** (`aspect: [3, 1]`). Sigue subiendo a `banner_url` (mismo path/bucket).
- `LivePreviewHeader` adopta el **hero inmersivo** (reutilizando `ProfileHero` en versión compacta) + `DerivedBackdrop` de fondo de la propia preview, para reflejar el resultado real al editar.

## 6. Componentes / archivos

**Nuevos:**
- `src/features/profile/components/DerivedBackdrop.tsx`
- `src/features/profile/components/ProfileHero.tsx`

**Modificados:**
- `src/features/profile/screens/ProfileScreen.tsx` — `ProfileShell` usa `DerivedBackdrop`; la card de identidad usa `ProfileHero` (sustituye avatar top-left + banner-as-bg).
- `src/features/profile/components/LivePreviewHeader.tsx` — hero inmersivo + derived backdrop.
- `src/features/profile/screens/EditProfileScreen.tsx` — sección renombrada Banner/Portada, aspecto apaisado, copy.

## 7. Casos borde / rendimiento / accesibilidad
- Sin banner: perfil → cósmico; hero/preview → gradiente de acento. Compatibilidad total con perfiles actuales.
- `useReducedMotion`: el blur del fondo es estático; el aro del avatar y el `AnimatedGradient` ya respetan reduce-motion.
- Rendimiento: una sola imagen difuminada + máscara; sin animaciones costosas nuevas.
- Legibilidad: fundido del banner + dim del fondo garantizan contraste del texto (mantener `onAccentColor`/texto blanco).

## 8. Testing
- La lógica nueva es esencialmente visual (sin infra de render-test RN). Gate: `npm run typecheck` + `npm test` (sin regresiones) + `npx expo export --platform web` + revisión visual en móvil y desktop.

## 9. Criterios de éxito
- El perfil muestra un **banner/portada llamativo** (hero) sobre el avatar.
- El **fondo** se deriva del banner (glow superior difuminado) y **se ve bien tanto en móvil como en desktop**.
- Editar perfil sube el banner con aspecto apaisado y la preview refleja el resultado.
- Perfiles sin banner siguen viéndose como hoy (cósmico).
- `typecheck` + tests + `expo export` web en verde.

## 10. Fuera de alcance
- Segunda imagen de fondo independiente (se descartó a favor del fondo derivado).
- Cambios de backend / migraciones (no se necesitan).
- Recorte/encuadre manual del banner dentro de la app (se usa el `pickImage` con aspecto fijo).
- Otras pantallas.
