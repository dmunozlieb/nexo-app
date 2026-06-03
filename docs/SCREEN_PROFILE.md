# Pantalla Profile — Especificacion de producto

Documento de producto para la IA de diseno (Claude Design / Figma). Define **que se muestra, donde, en que orden y con que datos** en la pantalla `/profile` (perfil propio, perfil ajeno y perfil contextual dentro de una Orbita). **No define el diseno grafico** (composicion exacta, jerarquia visual, gradientes, spacing fino) — eso es trabajo de Claude Design. Tampoco define backend en detalle — eso vive en `ARCHITECTURE.md`, `ROLES_ARCHITECTURE.md`.

> Punto de entrada para la IA de diseno. Espejo de `SCREEN_HOME.md` y `SCREEN_ONBOARDING.md`. Para contexto general: `PROJECT_CONTEXT.md`, `DESIGN_SYSTEM.md`.

---

## 0. Proposito y scope

Profile es la pantalla de identidad de una persona dentro de Nexo. Responde a tres preguntas: **quien es**, **donde orbita** (sus comunidades) y **que ha publicado**. Es la parada natural tras tocar un avatar en cualquier parte de la app.

La misma pantalla sirve **tres modos** con la misma estructura; solo cambian acciones y tabs visibles:

- **Propio** — mi perfil (`profileId` ausente o = usuario actual).
- **Ajeno** — perfil de otra persona (`profileId` de otro usuario).
- **Contextual** — perfil visto dentro de una Orbita (`communityId` presente). Muestra el rol y los posts de esa Orbita, y una **presentacion propia de esa comunidad**.

### Que cubre esta version

1. **Cabecera de identidad** (banner, avatar, nombre, handle, bio, badges, stats, intereses, acciones).
2. **Tabs de contenido**: Publicaciones / Orbitas / Info.
3. **Estados** loading, empty, error por bloque.
4. **Bio por Orbita** en modo contextual (presentacion distinta por comunidad).

### Que queda fuera de esta version

- Listas navegables de seguidores/seguidos (los stats se muestran; tocarlos a una lista es V2).
- Galeria de media propia como tab dedicada.
- Logros / gamificacion / reputacion.
- Edicion inline desde el perfil (la edicion vive en `/settings/edit-profile`; la bio por Orbita es la unica excepcion editable desde aqui).
- Verificacion / badges de cuenta especiales.

---

## 0.5 Esencial para la IA de diseno (si solo lees una cosa)

**No tienes acceso al repo ni a las pantallas existentes.** Todo lo que necesitas esta inlined aqui. No abras links a otros `.md`. Cuando algo se llama "ya existe", asumelo como spec a respetar visualmente, no como excusa para saltartelo.

### TL;DR

1. **Atmosfera cosmica continua** (misma de Home, descrita abajo): fondo casi negro con nebulosas blureadas y estrellas titilantes, sin cortes. Topbar/sidebar/bottomnav son glass cards por encima.
2. **La cabecera de identidad es el ancla**; el contenido (posts, orbitas, info) se organiza debajo. El **layout es tuyo**: una o dos columnas en desktop, la composicion de la cabecera, donde caen las tabs o si las sustituyes por otra navegacion — libre. Unica regla dura: mobile respira en una columna y se conserva *que* informacion aparece (no *como*).
3. **Tres modos** (propio / ajeno / contextual) — pinta los tres, no solo el propio.
4. **Sentence case en todo el copy**. Cero UPPERCASE.
5. **Pinta los estados** (loading, empty por tab, error), no solo el happy path.
6. **Libertad maxima de diseno.** Esto es un brief de *contenido y datos*, no una maqueta. Tienes libertad total para reinventar jerarquia, composicion, color, motion y personalidad de la pantalla. No te ates a como se ve hoy. Las unicas dos anclas no negociables: (a) la **atmosfera cosmica/alien dark** y (b) que el diseno se apoye **solo en datos que existen de verdad** (ver §0.6) — nada de inventar metricas o secciones que la app no puede llenar.

### 0.6 Solo datos reales (regla dura)

Disena **solo sobre datos que la app ya puede mostrar**. No construyas UI cuyo unico proposito sea lucir un dato que hoy no existe: si lo pintas, queda vacio en produccion. Esto es deuda disfrazada de belleza, no libertad.

**Datos reales (apoyate en estos sin miedo):**

- Avatar, nombre (`display_name`), handle (`@username`), bio global.
- Banner (`banner_url`).
- Publicaciones del usuario (globales y, en contextual, las de esa Orbita).
- Orbitas a las que pertenece (tarjeta por comunidad: nombre, avatar, descripcion, miembros, online, categoria).
- Conteo de **Orbitas** y de **Publicaciones** (derivados de esas listas — son reales).
- Rol en la Orbita y fecha de union (modo contextual).
- Fecha de alta en Nexo (`created_at`).
- Acciones reales: seguir/dejar de seguir, mensaje (chat directo), bloquear, reportar, editar perfil.

**NO existen todavia — NO disenes apoyandote en ellos:**

- **Conteo de seguidores / siguiendo** → no hay servicio. No pongas las cifras como heroe de la cabecera. Si quieres una fila de stats, construyela alrededor de Orbitas + Publicaciones (que si son reales); seguidores/siguiendo entran en V2.
- **Lista de intereses del perfil** → no hay lectura. No disenes una seccion de chips de intereses poblada. (En perfil propio si cabe un CTA suave "Anade tus intereses".)
- **Bio por Orbita** (presentacion distinta por comunidad) → no persiste. En contextual usa la bio global + rol + posts de esa Orbita; no disenes un editor de bio por-Orbita como pieza central.
- **Estado real de follow** ya resuelto visualmente (boton Seguir/Siguiendo); no necesita dato extra.

> Estos cuatro llegaran en una segunda tanda. Si el diseno los necesitase, registralo como **propuesta V2**, no como elemento del frame principal.

### Paleta dark mode (la unica que importa)

| Token | Hex | Uso |
|---|---|---|
| background | `#070B1A` | Fondo base de la app. |
| surface | `#0D1230` | Cards solidas. |
| elevated | `#182044` | Inputs, hover/active. |
| border | `#303A66` | Bordes neutros. |
| primary (violeta) | `#7B5CFF` | Acciones principales, dot activo. |
| secondary (cyan) | `#18D7FF` | Links, eyebrows, borders seleccion. |
| accent (magenta) | `#FF4FD8` | Accents puntuales. |
| featured (ambar) | `#FFC24D` | Destacados/eventos. |
| aurora (verde) | `#4DF0B0` | Presencia / "online ahora". |
| success | `#22E6B9` | Online dot, confirmaciones. |
| warning | `#FF7AA8` | Avisos suaves. |
| error | `#FF5C8A` | Errores, accion destructiva (bloquear). |
| text | `#F6F7FB` | Texto primario. |
| textMuted | `#B9C1D9` | Texto secundario. |
| textFaint | `#8490B4` | Texto terciario, helpers. |

> **Libertad cromatica en esta pantalla.** Esta paleta es una **referencia**, no una camisa de fuerza. En Profile tienes libertad para proponer acentos, degradados y combinaciones de color propias (por ejemplo, una identidad cromatica derivada del avatar/banner del usuario, o un acento distinto por modo). Las unicas condiciones: (1) mantener el caracter **dark/cosmico/alien** de la app, (2) garantizar **contraste y legibilidad** (WCAG AA) del texto sobre el fondo, y (3) no romper la **continuidad** con el fondo cosmico continuo (los acentos van sobre esa atmosfera, no la sustituyen por un fondo opaco nuevo). Si te apartas de la paleta base, hazlo de forma coherente en toda la pantalla.

### Tipografia, spacing, radius

- **Familia**: Inter (weights 400/500/600/700/800/900).
- **Escala texto**: 11 / 13 / 15 / 17 / 20 / 24 / 28 px.
- **Spacing**: 4 / 8 / 12 / 16 / 24 / 32 / 48.
- **Radius**: 4 / 6 / 8 / 12 / pill (999). Cards grandes glass usan 24.
- **Ancho maximo de contenido**: 860 px, centrado (la pantalla es de una columna).

### Atmosfera cosmica del fondo (pintar tal cual, es la misma de Home)

Fondo **una sola capa continua** full-bleed por debajo del chrome de navegacion. De fondo a primer plano:

1. **Gradiente vertical base**: `#070622` → `#090A1F` → `#050611` (casi negro, tinte violeta).
2. **Nebulosas radiales blureadas** (blur ~64 px, sin bordes): violeta `rgba(123,92,255,0.12)`, cyan `rgba(24,215,255,0.07)`, magenta `rgba(255,79,216,0.07)`.
3. **~16 estrellas blancas** 1-2 px, halo suave, opacidad base 0.35-0.72; animadas parpadean 0.18-1.0 (1.6-2.2 s, fase distinta). Respeta `prefers-reduced-motion` → estaticas.

### Glass cards, CTAs, Avatar (recetas compartidas)

- **Glass card**: backdrop blur 28-40 px + tint `rgba(13,18,48,0.55-0.7)` + gradient overlay sutil + border 1 px `rgba(255,255,255,0.1)` + radius 24.
- **CTA primary**: pill (radius 999), alto min 48, gradient diagonal `#8B5CF6 → #22D3EE`, texto blanco Inter SemiBold 15, shadow violeta. Hover/pressed opacity 0.82, disabled 0.48, loading muestra spinner.
- **Avatar**: SIEMPRE circular. Imagen o gradient + inicial blanca bold si no hay imagen. Tamaños comunes 28/40/48/72/88.
- **Mascota `NexoMascot`**: alien amigable violeta, ojos cyan, antenas con esfera. Usar solo en empty states.

---

## 1. Identidad y principios

- **Dark mode primario** con la atmosfera cosmica continua de §0.5.
- **Sentence case en todo el copy**. Sin UPPERCASE en eyebrows, labels ni titulos de seccion.
- **Layout libre** (§0.5): puedes usar una o dos columnas en desktop; en mobile, una columna. No hay un ancho impuesto — elige el que mejor sirva a tu composicion.
- **La cabecera ancla, el contenido se organiza debajo**. La identidad va arriba; posts/orbitas/info se reparten en secciones para no apilar bloques infinitos (la forma de esa navegacion es tuya).
- **Sin saturar**: la cabecera no debe convertirse en un panel de control. Banner + identidad + stats + acciones, con aire.

---

## 2. Estructura — Cabecera (fija, arriba de las tabs)

Orden vertical. El "como" (overlap del avatar, glass o no, jerarquia de tamaños) es decision de diseno; el "que" y el orden son fijos.

### 2.1 Banner

- Imagen `banner_url` del perfil si existe.
- **Fallback** si no hay banner: superficie cosmica (gradient diagonal en la paleta violeta/cyan o nebulosa sutil) — nunca un hueco gris plano.
- El avatar se solapa sobre el borde inferior del banner (patron habitual de perfil).

### 2.2 Identidad

- **Avatar** (`avatar_url`, circular, tamaño grande ~78-88).
- **Nombre**: `display_name` (fallback a `username`). Inter Bold/Black, color text.
- **Handle**: `@username`. Inter SemiBold, color textMuted o secondary.
- **Badges** (fila, wrap):
  - "Perfil publico" (informativo).
  - **Rol** — SOLO en modo contextual (owner / admin / mod / helper / member, con su `RoleBadge`: corona dorada owner, escudo cyan, etc.).
  - "Baneado" (tone danger) si `is_banned`.

### 2.3 Bio

- **Propio / ajeno**: bio global del perfil. Truncada en la cabecera (3 lineas), completa en el tab Info.
- **Contextual**: si la persona escribio una **bio para esa Orbita**, va arriba y prominente; la bio global aparece debajo, atenuada (o se relega al tab Info). Si no hay bio de Orbita, se cae a la global sin dejar hueco.

### 2.4 Stats

Fila/bloque de metricas (si decides incluirla — su forma es libre). Cada una: numero (Inter Bold, color text) + label (Inter Medium, textMuted/textFaint), sentence case.

- **Datos reales hoy: Orbitas · Publicaciones.** Construye los stats alrededor de estos dos.
- **Seguidores / Siguiendo NO existen aun** (sin servicio de conteo). No los pongas como heroe ni inventes la cifra. Entran en V2; si los dejas previstos en la composicion, que sea de forma que no quede un hueco roto cuando esten vacios.
- Tocar una stat NO navega en esta version (lista de seguidores es V2).

### 2.5 Intereses

- **No hay lectura de intereses todavia**, asi que no disenes una seccion de chips poblada con datos reales.
- En perfil propio si cabe un CTA suave "Anade tus intereses" → `/settings/edit-profile`. En ajeno: se omite, sin placeholder.

### 2.6 Acciones

Cambian por modo:

- **Propio**: `Editar perfil` (→ `/settings/edit-profile`). *(Ajustes NO va aqui — ya vive en sidebar/topbar.)* En **propio + contextual** se anade `Editar mi presentacion aqui` (edita solo la bio de esa Orbita, no la global).
- **Ajeno**: `Seguir` (toggle real Seguir/Siguiendo) · `Mensaje` (abre chat directo) · menu `•••` con acciones secundarias `Bloquear` y `Reportar`.

---

## 3. Estructura — Tabs (bajo la cabecera)

Tabs horizontales (pills seleccionables). El tab activo cambia el contenido inferior; la cabecera permanece.

| Tab | Propio / Ajeno | Contextual (dentro de Orbita) |
|---|---|---|
| **Publicaciones** (default) | todas las publicaciones del usuario | solo posts publicados en esa Orbita |
| **Orbitas** | grid/lista de comunidades del usuario (tarjeta por Orbita) | *(oculta — redundante con el contexto)* |
| **Info** | bio completa + intereses + "se unio en {fecha}" | rol en la Orbita + fecha de union a la Orbita |

### 3.1 Tab Publicaciones

- Lista vertical de tarjetas de post (`PostCard`): riel lateral con el color del tipo; cabecera con avatar, autor, nombre de la Orbita coloreado + tiempo relativo, y badge de tipo (icono propio + color por tipo: debate/ayuda/fanart/encuesta/historia/recomendacion/evento); titulo y cuerpo; pie separado por linea superior con el **boton Eco** (pildora ambar que se alterna, muestra el total de Ecos) a la izquierda y acciones (comentar, guardar, reportar) a la derecha.
- Tap → detalle del post.

### 3.2 Tab Orbitas

- Tarjeta por comunidad (`CommunityCard`): banner, avatar, nombre, descripcion (2 lineas), miembros, online, categoria, senal reciente.
- Tap → detalle de la Orbita.
- Solo visible en propio/ajeno (no en contextual).

### 3.3 Tab Info

- **Bio completa** (sin truncar).
- **Intereses** (chips, version completa).
- **"Se unio {fecha}"** (a Nexo).
- En contextual: **rol** en la Orbita + **fecha de union** a esa Orbita.

---

## 4. Estados de la pantalla

| Bloque | Loading | Empty | Error |
|---|---|---|---|
| **Perfil entero** | spinner "Cargando perfil…" | — | "No pudimos cargar este perfil" + reintentar |
| **Tab Publicaciones** | "Cargando publicaciones…" | "Sin publicaciones — no hay Ecos publicados aqui" (mascota suave) | inline + reintentar |
| **Tab Orbitas** | skeleton de tarjetas | "Aun no orbita ninguna comunidad" (+ CTA "Explorar" si es propio) | inline + reintentar |
| **Tab Info** | n/a (datos ya en cache) | secciones vacias se omiten | n/a |

Cuando un bloque depende de datos aun no implementados (ver §6), el diseno debe contemplar placeholder/empty sin romper la composicion.

---

## 5. Interacciones clave

| Trigger | Resultado |
|---|---|
| Tap en tab | Cambia el contenido inferior; cabecera fija. |
| Tap en `Editar perfil` | Navega a `/settings/edit-profile`. |
| Tap en `Editar mi presentacion aqui` (propio+contextual) | Editor de la bio de esa Orbita (modal o inline). |
| Tap en `Seguir` / `Siguiendo` | Toggle de follow; el boton refleja el estado real. |
| Tap en `Mensaje` | Abre/crea chat directo → `/chat/[id]`. |
| Tap en `•••` (ajeno) | Despliega Bloquear / Reportar. |
| Tap en `Bloquear` | Confirma y bloquea (visibilidad segun RLS); vuelve atras. |
| Tap en `Reportar` | Abre `ReportModal` (motivo + detalles). |
| Tap en tarjeta de post | Navega al detalle del post. |
| Tap en tarjeta de Orbita | Navega al detalle de la Orbita. |
| Pull to refresh | Refresca perfil + tab activo. |

---

## 6. Datos backend que consume Profile

| Bloque | Hook / servicio | Estado |
|---|---|---|
| Perfil (nombre, handle, bio, avatar, banner) | `useProfileById` | **Existe** |
| Banner real | campo `banner_url` ya en `profiles` | **Existe** (solo falta pintarlo) |
| Publicaciones (global) | `useProfilePosts` | **Existe** |
| Publicaciones (en Orbita) | `useCommunityProfilePosts` | **Existe** |
| Orbitas del usuario | `useJoinedCommunities` / `listJoinedCommunities` | **Existe** |
| Rol + union (contextual) | `useCommunityMembers` | **Existe** |
| Stat: nº de Orbitas | derivado de la lista de orbitas | **Existe** |
| Stat: nº de publicaciones | derivado de la lista de posts | **Existe** |
| Seguir / dejar de seguir | `useFollowMutation` / `useUnfollowMutation` | **Existe** (escritura) |
| Bloquear | `useBlockProfileMutation` | **Existe** |
| Chat directo | `useDirectConversationMutation` | **Existe** |
| Reportar | `useCreateReportMutation` | **Existe** |
| **Stat: seguidores / siguiendo** | conteo | **PENDIENTE — NUEVO** servicio de counts |
| **Estado de follow (Seguir vs Siguiendo)** | `isFollowing(viewerId, profileId)` | **PENDIENTE — NUEVO** (hoy el follow es "a ciegas") |
| **Intereses del perfil** | `getUserInterests(userId)` | **PENDIENTE — NUEVO** (onboarding solo escribe en `user_interests`) |
| **Bio por Orbita** | columna nueva en `community_members` + `updateMembershipBio` | **PENDIENTE — NUEVO** (requiere migracion + tipo + demo) |

> Orden de trabajo acordado: **diseno y UI sobre los datos que ya existen** (banner, orbitas, publicaciones, tabs, stats de Orbitas/Publicaciones, acciones), y cablear los 4 pendientes en una segunda tanda. **El diseno NO debe apoyarse en los 4 pendientes** (ver §0.6): nada de heroes de seguidores/siguiendo, secciones de intereses pobladas ni editor de bio por-Orbita. Si los quieres prever, que sea como V2, no como pieza del frame principal.

---

## 7. Copy

Sentence case en todos.

| Lugar | Copy |
|---|---|
| Tab 1 | "Publicaciones" |
| Tab 2 | "Orbitas" |
| Tab 3 | "Info" |
| Seccion posts (contextual) | "Posts en esta Orbita" |
| Badge publico | "Perfil publico" |
| Accion propio | "Editar perfil" |
| Accion propio contextual | "Editar mi presentacion aqui" |
| Accion ajeno follow | "Seguir" / "Siguiendo" |
| Accion ajeno mensaje | "Mensaje" |
| Accion ajeno bloquear | "Bloquear" |
| Accion ajeno reportar | "Reportar" |
| Empty posts | "Sin publicaciones. No hay Ecos publicados aqui." |
| Empty orbitas | "Aun no orbita ninguna comunidad." |
| Error perfil | "No pudimos cargar este perfil." |
| CTA intereses (propio sin intereses) | "Anade tus intereses" |

Tono: conversacional, ligero, ligeramente alien. Evita "feed/timeline". Usa "Orbita", "Senal/publicacion", "Eco".

---

## 8. Decisiones cerradas (no volver a abrir)

Estas son de **producto/datos**, no de estilo. El layout, la composicion y el color son libres (§0.5–§0.6).

- **Ajustes fuera del perfil** (vive en sidebar/topbar). En propio solo `Editar perfil`.
- **Acciones destructivas/secundarias (Bloquear, Reportar) colapsadas** en perfil ajeno (en un `•••` o equivalente).
- **El contenido se reparte por secciones/tabs**; el contenido de Orbitas no aparece en modo contextual (es redundante). La *forma* de esa navegacion es libre.
- **Stats reales hoy = Orbitas + Publicaciones**; seguidores/siguiendo e intereses son V2 (§0.6) y no anclan el diseno.
- **Stats no navegan** a listas en esta version.
- **Sentence case** en todo el copy.
- **Dark mode primario** con atmosfera cosmica continua.

---

## 9. Reglas de oro para la IA de diseno

1. **Esto es estructura, no diseno cerrado**. Tienes libertad para resolver la jerarquia visual y el **color** (ver nota de libertad cromatica en §0.5) de cabecera, stats y tabs. Respeta el orden y el contenido de §2-§3.
2. **No anadas bloques fuera de scope** (§0). Si crees que falta algo, registralo como propuesta V2, no lo metas.
3. **Pinta los tres modos** (propio / ajeno / contextual) — no solo el propio.
4. **Pinta los estados** (loading, empty por tab, error), no solo el happy path.
5. **Continuidad cosmica**: el fondo de §0.5 es el mismo que en Home. No introduzcas un fondo opaco nuevo.
6. **Sentence case siempre**.
7. **Reutiliza componentes** del sistema (Button, Avatar, Badge, tabs tipo pill, tarjetas de post y de Orbita) antes de inventar.
8. **Spacing en multiplos de 4 u 8**.
9. **No tomes decisiones de backend ni te apoyes en datos pendientes** (§0.6): no disenes la pantalla alrededor de seguidores/siguiendo, intereses o bio por-Orbita. Son V2.
10. **Avatares siempre circulares**.

---

## 10. Mapa rapido de archivos relacionados

```
app/(tabs)/profile.tsx / app/profile/[id].tsx              rutas de perfil
src/features/profile/screens/ProfileScreen.tsx             screen actual
src/features/profile/screens/EditProfileScreen.tsx         editor de perfil global
src/features/profile/hooks/useProfile.ts                   hooks de perfil
src/features/profile/services/profile-service.ts           servicios (follow/block/posts)
src/components/content/PostCard.tsx                         tarjeta de post
src/components/content/CommunityCard.tsx                    tarjeta de Orbita
src/components/community/RoleBadge.tsx                      badge de rol
src/components/ui/SectionTabs.tsx                           tabs tipo pill (reutilizar)
src/components/ui/TagPill.tsx                               chip (intereses)
src/components/ui/CosmicBackground.tsx                      fondo cosmico
src/theme/tokens.ts                                         tokens
```

---

## 11. Checklist para Claude Design

### Frames (happy path con datos)

1. **Perfil propio — desktop**.
2. **Perfil propio — mobile**.
3. **Perfil ajeno — desktop** (con acciones Seguir/Mensaje/•••).
4. **Perfil ajeno — mobile**.
5. **Perfil contextual** (dentro de una Orbita, con rol + bio de Orbita) — mobile o desktop.

### Tabs

6. Tab Publicaciones con contenido.
7. Tab Orbitas con grid de comunidades.
8. Tab Info.

### Estados

9. Loading inicial del perfil.
10. Empty de Publicaciones.
11. Empty de Orbitas.
12. Error de perfil.

### Componentes a documentar

13. Cabecera de identidad (banner + avatar + nombre/handle + badges).
14. Fila de stats.
15. Chips de intereses.
16. Barra de tabs (estado activo/inactivo).
17. Menu `•••` de acciones secundarias (ajeno).

### Copy

18. Confirmar todos los strings del §7.

---

## 12. Que sigue despues

Cuando Profile este disenado y validado:

1. **Editar perfil** (`EditProfileScreen`) — banner + intereses editables, espejo de esta estructura.
2. **Settings** — panel de cuenta/privacidad/notificaciones.
3. Cablear los 4 servicios pendientes de §6 (seguidores/siguiendo, isFollowing, getUserInterests, bio por Orbita).
