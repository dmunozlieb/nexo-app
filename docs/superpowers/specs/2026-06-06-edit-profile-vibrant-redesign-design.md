# Edit/Profile — Rediseño Visual Vibrante (Design Spec)

- **Fecha:** 2026-06-06
- **Rama:** `redesign/edit-profile`
- **Alcance:** Solo look & feel (visual + micro-animaciones) de `EditProfileScreen.tsx` y `ProfileScreen.tsx`. La funcionalidad y la estructura ya están hechas y aprobadas; no se cambian datos, validación ni navegación.

## 1. Motivación

Las pantallas funcionan pero se sienten "sosas/serias": demasiado texto gris (`textMuted`/`textFaint`), tarjetas oscuras casi idénticas, iconos de enlaces monocromos y sin movimiento. El público objetivo es 16–30 con estética cósmica; queremos algo **vivo, juvenil y con detalle**, manteceniendo la arquitectura existente.

## 2. Decisiones (brainstorming con mockups en vivo)

| Tema | Decisión |
|------|----------|
| Dirección de arte | **B — gradientes vibrantes (Gen-Z)**: degradados multicolor como superficie, color de marca, badges tipo sticker |
| Iconos de enlaces | **Glifos de marca reales + color de marca**, vía `react-native-svg` (ya es dependencia) |
| Animaciones | **1** entrada en cascada · **2** banner con degradado vivo · **3** aro del avatar girando · **4** enlaces con pop al hover/pulsar · **6** estrellas titilando de fondo |
| Contraste | Subir texto de gris a blanco (`text`) en bio, labels y metadatos |
| Reduce motion | Todas las animaciones respetan `useReducedMotion()` (ya existe en el repo) |

No incluido: animación 5 (count-up de stats), porque las stats aún son placeholders ("pronto").

## 3. Sistema visual compartido (base de ambas pantallas)

### 3.1 `BrandIcon` (nuevo)
`src/features/profile/components/BrandIcon.tsx`. Renderiza el logo de marca de una plataforma con `react-native-svg`.
- Entrada: `platform: LinkPlatform`, `size`, `color?` (override).
- Mapa interno `platform -> { path(s) SVG, brandColor }` para: youtube, instagram, twitch, twitter (x), tiktok, github, linkedin, facebook, spotify. `generic` → un glifo de enlace (puede seguir usando lucide `Link`).
- Los path SVG provienen de marcas conocidas (estilo simple-icons); se incrustan como datos estáticos (sin descargas externas). Instagram usa un degradado (`<LinearGradient>` de react-native-svg) como relleno.
- Nota legal/uso: los logos se usan solo como indicador del destino del enlace del propio usuario; no como respaldo oficial.

### 3.2 `AnimatedGradient` (nuevo)
`src/components/ui/AnimatedGradient.tsx`. Degradado multicolor que se desplaza lentamente.
- Implementación: `expo-linear-gradient` envuelto en `Animated`, animando `start`/`end` o la posición vía un `Animated.loop` (~6s, lineal). En web el desplazamiento es suave; en native se anima el ángulo/colores de forma equivalente.
- Props: `colors?` (default paleta de marca violeta→magenta→cyan), `style`, `dim?`.
- **Reduce motion:** si `useReducedMotion()` es true, renderiza un degradado estático (sin loop).

### 3.3 `useStaggerIn` (nuevo)
`src/hooks/useStaggerIn.ts`. Devuelve estilos animados para entrada en cascada (fade + translateY).
- API: `useStaggerIn(index: number)` → `{ opacity, transform }` (Animated) que cada sección aplica; el `index` define el retardo escalonado (~60ms por paso).
- **Reduce motion:** devuelve estilos estáticos (opacity 1, sin transform) y no lanza animación.

### 3.4 Contraste
Sustituir `textMuted`/`textFaint` por `text` (blanco) en: bio del perfil, dominios de enlaces, labels de sección del edit, y metadatos donde hoy se pierden. Mantener `textFaint` solo para texto genuinamente secundario (p. ej. "pronto").

## 4. ProfileScreen

- **Cabecera de la tarjeta**: usar `AnimatedGradient` (animación 2) cuando NO hay `banner_url`; con `banner_url` se mantiene la imagen vía `NebulaBackdrop`.
- **Aro del avatar**: gradiente cónico girando/pulsando (animación 3) reemplazando el aro estático actual (`AvatarRing`).
- **Enlaces** (`ProfileLinks`): cada fila con `BrandIcon` real, fondo teñido sutil con `brandColor`, dominio en texto blanco, y **pop** al hover/pulsar (animación 4, vía `hoverTransition`/`pointerStyle` + escala en `Pressable`).
- **Badges tipo sticker**: "Perfil público", rol, baneado → relleno de color suave + borde de acento, en lugar del gris actual.
- **Stats**: números en `text` blanco (sin count-up).
- **Entrada en cascada** (animación 1) al montar la identidad: avatar → nombre/handle → bio → enlaces → stats → acciones, vía `useStaggerIn`.
- **Fondo**: asegurar `CosmicBackground` con estrellas titilando (animación 6) detrás de la tarjeta (reusar el componente existente).
- Bio "ver más/ver menos" se mantiene; toggle en color de acento (ya implementado).

## 5. EditProfileScreen

- **`LivePreviewHeader`**: estrena el tratamiento vibrante completo — `AnimatedGradient` de banner cuando no hay fondo, aro del avatar girando, y (si hubiera enlaces en preview) `BrandIcon`.
- **Cabeceras de sección** (Apariencia / Identidad / Color de acento / Enlaces): con personalidad — texto en gradiente o con barra/acento de color + un icono lucide, en vez del título plano.
- **Inputs**: labels en blanco alto contraste (el foco cyan ya existe en `TextInput`).
- **Editor de enlaces** (`LinksEditor`): cada fila muestra el `BrandIcon` detectado según la URL escrita (preview de marca inmediato).
- **Swatches de acento** (`AccentPicker`): pequeño pop al seleccionar.
- **Entrada en cascada** de las secciones al abrir (`useStaggerIn`).

## 6. Componentes / archivos

**Nuevos:**
- `src/features/profile/components/BrandIcon.tsx`
- `src/components/ui/AnimatedGradient.tsx`
- `src/hooks/useStaggerIn.ts`

**Modificados:**
- `src/features/profile/utils/link-presentation.ts` — añadir `brandColor` por plataforma (o exportar un mapa `platform -> brandColor`).
- `src/features/profile/components/ProfileLinks.tsx` — usar `BrandIcon`, fondo teñido por marca, pop.
- `src/features/profile/components/LivePreviewHeader.tsx` — banner animado + aro girando.
- `src/features/profile/components/AccentPicker.tsx` — pop al seleccionar.
- `src/features/profile/components/LinksEditor.tsx` — preview de `BrandIcon` por fila.
- `src/features/profile/screens/ProfileScreen.tsx` — badges sticker, contraste, entrada en cascada, aro girando, fondo de estrellas.
- `src/features/profile/screens/EditProfileScreen.tsx` — cabeceras con personalidad, entrada en cascada.

## 7. Accesibilidad / rendimiento
- Todas las animaciones de loop (banner, aro, estrellas) y de entrada respetan `useReducedMotion()`.
- Usar `useNativeDriver: true` donde sea posible (opacity/transform). El degradado/colores que no soportan native driver se mantienen baratos (loop largo, pocos nodos).
- No bloquear interacción: las animaciones son decorativas; los `Pressable` siguen respondiendo.

## 8. Testing
- Unit (Jest) de `linkPresentation`/mapa de marcas: cada plataforma conocida → `brandColor` esperado; desconocido → genérico.
- Resto es visual/animación (sin infra de render-test RN). Gate: `npm run typecheck` + `npm test` + `npx expo export --platform web` + revisión visual en la app.

## 9. Criterios de éxito
- Ambas pantallas se sienten vivas: color más allá del acento, iconos de marca reales, micro-animaciones 1/2/3/4/6 visibles, texto en alto contraste.
- Con "reducir movimiento" activado, todo se ve correcto sin animaciones de loop/entrada.
- Sin regresiones funcionales (edición, guardado, cooldown, enlaces, bio, demo).
- `typecheck` + tests + `expo export` web en verde.

## 10. Fuera de alcance
- Cambiar datos/validación/navegación.
- Count-up de stats (animación 5).
- Otras pantallas (home, discover, etc.).
- Favicons reales (seguimos con glifos de marca incrustados).
