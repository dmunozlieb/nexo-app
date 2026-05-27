# Pantalla Home + Navbar — Especificacion de producto

Documento de producto para la IA de diseno (Figma). Define **que se muestra, donde, en que orden y con que datos** en la pantalla `/home` y en la navegacion global. No define estilos concretos (colores, tipografias, gradientes) — eso es trabajo de Figma. Tampoco define backend — eso vive en `CHATS_ARCHITECTURE.md`, `SIGNALS_ARCHITECTURE.md`, `ROLES_ARCHITECTURE.md`.

> Punto de entrada para la IA de diseno. Lee este doc primero. Para contexto general del producto: `PROJECT_CONTEXT.md`, `DESIGN_SYSTEM.md`. Para conocer la estetica ya tomada (dark, cosmica, mascota Nexo, paleta violeta/cyan/magenta), `DESIGN_SYSTEM.md` es la referencia.

---

## 0. Proposito y scope

Home es la **primera pantalla real** despues de auth/onboarding. Es el espacio que define la diferencia de Nexo frente a otras redes sociales: en vez de un feed plano, el usuario aterriza en un sistema orbital con sus comunidades como planetas.

### Acciones primaria y secundaria

- **Primaria**: tocar un planeta para entrar en una Orbita.
- **Secundaria**: ojear actividad reciente (que ha pasado en mis Orbitas).
- Crear Senal o Orbita **NO** es accion primaria de Home — vive en la nav (boton central de BottomNav movil, sidebar desktop).

### Que cubre V1

1. **Sistema orbital** (`GalaxyOrbitMap`) como pieza central.
2. **Actividad reciente** como bloque secundario.
3. **Navbar** ajustado: TopBar desktop (ya existe), Sidebar desktop (ya existe), BottomNav movil (ya existe) con pequenos retoques.
4. **Estados** loading, empty, error, offline.

### Que queda fuera de V1

- Quick actions duplicados en el body de Home (la nav los cubre).
- Eventos proximos como bloque dedicado (entran en actividad reciente como item type cuando la feature exista).
- Bandeja de chats embebida en Home (vive en su tab `/chat`).
- Help threads activos como bloque propio.
- Stats personales / gamificacion.
- Mensaje del dia / mascota variable contextual.
- Recomendaciones de Orbitas no-tuyas (viven en `/discover`).
- TopBar movil en Home (el mapa ya tiene su header — evita doble header).

---

## 1. Identidad y principios

- **Dark mode primario**. Fondo casi negro con capa de "via lactea" suave ya implementada en `GalaxyOrbitMap`.
- **Sentence case en todo el copy** (no UPPERCASE en eyebrows, stat labels, ni section titles). Esta decision se tomo en la sesion 2026-05-25 y debe mantenerse.
- **Mascota Nexo** presente como acento, no como protagonista. En Home aparece en el TopBar desktop como icono del saludo; en movil no aparece en pantalla Home directamente.
- **Sin ruido**: Home debe sentirse calmado, no abarrotado. El sistema orbital es lo que llama la atencion; el resto vive en segundo plano.
- **Espacio para respirar**. En movil, prohibido scroll vertical de bloques apilados. En desktop, columna derecha contenida (max ~320-360 px).

---

## 2. Layout — Desktop (ancho >= 980 px)

### 2.1 Arquitectura general

Tres zonas verticales:

```
[ AppTopBar              68 px alto, full width ]
[ AppSidebar ][        Stage Home (mapa + columna derecha)        ]
                                                                  
```

- **AppTopBar** (top, full width). Ya existe.
- **AppSidebar** (left, ancho ~240-280 px). Ya existe.
- **Stage Home** ocupa el resto del viewport. Internamente se divide en:
  - **Mapa orbital** (centro, flex 1, prioridad de ancho).
  - **Columna de actividad reciente** (derecha, ancho fijo 320-360 px, opcional ocultar bajo cierto breakpoint intermedio si el ancho total es < ~1200 px).

### 2.2 AppTopBar (desktop)

Contenido por orden de izquierda a derecha:

1. **NexoMascot** size 48, animado sutil.
2. **Saludo dinamico por hora** + **nombre del usuario** ("Buenos dias, Luna").
3. (flex space) 
4. **Boton search** → navega a `/discover`.
5. **Boton bell** con dot indicador si hay notificaciones no leidas.
6. **Avatar del usuario** → navega a `/profile`.

Datos necesarios:
- `profile.display_name`
- `profile.avatar_url`
- Conteo de notificaciones no leidas (V1: dot binario, sin numero).

### 2.3 AppSidebar (desktop)

Contenido por orden vertical:

1. **Logo Nexo** + nombre.
2. **Nav primaria** (filas con icono + label):
   - Home (activa cuando estamos en `/home`)
   - Explorar (`/discover`)
   - Crear (`/create`)
   - Chats (`/chat`) — **badge de unread total** cuando haya mensajes sin leer.
3. **Separador**.
4. **"Tus Orbitas"** — lista ligera de las Orbitas a las que pertenece el usuario, con:
   - Avatar pequeno de la Orbita.
   - Nombre.
   - Dot verde si hay miembros online (heuristica actual).
   - Click → navega al detalle de la Orbita.
5. (flex space)
6. **Footer clickeable**: avatar + display_name + handle + icono settings. Click → `/profile`.

El item "Perfil" sigue **filtrado del sidebar** (redundante con el avatar del TopBar y el footer del sidebar — decision tomada en sesion 2026-05-25, mantener).

Datos necesarios:
- Lista de Orbitas del usuario con `member_count`, `online_count`, avatar.
- Conteo total de mensajes no leidos del usuario (suma cross-chats).
- `profile.{display_name, username, avatar_url}`.

### 2.4 Stage Home — Mapa orbital

Ocupa el centro del Stage, flex 1. Internamente:

- **Header del stage**:
  - Eyebrow corto: "Tu galaxia".
  - Subtitulo conversacional: "Esto es lo que orbita a tu alrededor. Toca un planeta y aterriza." (copy ya definido).
  - **Stats** a la derecha: `Orbitas {N} · Online {M}`. Sentence case.
- **Body**: `GalaxyOrbitMap` con planetas de las Orbitas del usuario primero, recomendaciones despues.
- Al **clickear un planeta**: se abre un **panel lateral derecho** sobre la columna de actividad (push o overlay) con el detalle de la Orbita — nombre, avatar, descripcion corta, miembros, online, acciones primarias (entrar, abrir chat).

Datos necesarios:
- `useUserCommunities()` — Orbitas del usuario con metadata.
- `useRecommendedCommunities()` — Orbitas sugeridas por intereses.

### 2.5 Columna de actividad reciente (desktop)

Lado derecho del stage, ancho 320-360 px. Contiene:

- **Header**: "Actividad reciente" en sentence case, sin uppercase.
- **Lista vertical** de 5-8 items mixtos. Cada item es una row compacta con:
  - Icono o avatar pequeno del actor o de la Orbita.
  - Una linea de texto plano describiendo el evento.
  - Timestamp relativo ("hace 5 min", "hace 2 h").
  - Click → navega al contexto (post, chat, perfil).

Tipos de item para V1 (mezclados, ordenados por `created_at` desc):

1. **Eco recibido**: "Kai dejo un Eco {inspire|relate|curious|support} en tu Senal" → navega al post.
2. **Comentario en tu Senal**: "Iris comento en tu Senal" → navega al post.
3. **Mencion**: "Luna te menciono en {Orbita}" → navega al post o comentario.
4. **Nueva Senal en tus Orbitas** (solo si trending o de alguien que sigues): "Hay 3 Senales nuevas en Yoaki Gordo" → navega a la Orbita. **Agrupado por Orbita**.
5. **Cambio de rol**: "Eres ahora mod en Code Galaxy" → navega a la Orbita.

**Eventos** y **respuestas aceptadas en help threads** entraran cuando la feature exista (V1 de Senales). Por ahora no aparecen.

- **Empty state**: mascota pequena + copy "Aun no hay nada por aqui. Tocaa un planeta y empieza a orbitar.".
- **Loading**: 5 skeleton rows.
- **Error**: texto compacto + boton "Reintentar".

Datos necesarios:
- RPC futura `list_home_activity(user_id, limit, cursor?)` que agrega: ecos en tus posts, comentarios en tus posts, menciones, posts nuevos en tus Orbitas (agrupados), cambios de rol del audit log donde el user es target. Esta RPC **no existe todavia** — para V1 puede ser un union client-side de queries existentes, pero el doc deja claro que el ideal es server-side.

---

## 3. Layout — Mobile (ancho < 980 px)

### 3.1 Arquitectura general

Tres zonas verticales:

```
[ Stage Home (mapa)                                                ]
[ Actividad reciente strip horizontal                              ]
[ AppBottomNav                       64-72 px alto, full width     ]
```

- **NO** hay TopBar movil en Home (el mapa orbital tiene su propio header con stats — evita doble header).
- **NO** hay scroll vertical de bloques apilados — una sola vista que cabe en pantalla.

### 3.2 Stage Home — Mapa orbital (mobile)

- Ocupa la mayor parte vertical disponible.
- Header comprimido del mapa: "Tu galaxia" + stats (`{N} Orbitas · {M} online`) en una sola linea, sin wrapper alto.
- `GalaxyOrbitMap` body adaptado al ancho movil (planetas redistribuidos en 6 posiciones balanceadas, ya implementado).
- **Tap en planeta** → abre **BottomSheet** con detalle de la Orbita (no panel lateral). El BottomSheet ya existe y se reutiliza.

### 3.3 Strip de actividad reciente (mobile)

- Va **entre el mapa y el BottomNav**, alto fijo aprox. 96-112 px.
- **Header de una linea**: "Actividad reciente" + flecha "Ver mas" → navega a una pantalla dedicada `/activity` (a definir en V2, en V1 la flecha puede llevar al feed de notificaciones).
- **Cards horizontales scrolleables** (snap opcional). Cada card es muy compacta:
  - Avatar pequeno (Orbita o usuario).
  - 1-2 lineas de texto **truncadas**.
  - Timestamp relativo en esquina.
- Tap en card → navega al contexto.
- Si hay **0 items**: strip se colapsa o muestra una sola card "tip" con la mascota ("Aun nada por aqui").

Decision V1: 4-6 cards visibles en scroll inicial. Misma logica de tipos que el desktop.

### 3.4 AppBottomNav (mobile)

Items por orden de izquierda a derecha:

1. **Home** (activo en `/home`).
2. **Explorar** (`/discover`).
3. **Crear** (centro, destacado visualmente — accion primaria de creacion).
4. **Chats** (`/chat`) — **badge de unread total** (numero hasta 99, "99+" si pasa).
5. **Perfil** (`/profile`).

Cambios V1 respecto a hoy:
- Anadir badge de unread en el icono de Chats si `total_unread > 0`.
- Anadir indicador visual del item activo (ya existe, mantenerlo).

Datos necesarios:
- `total_unread` cross-chats (suma de `unread_count` de `listConversations`).

### 3.5 TopBar movil (fuera de Home)

Aunque **NO aparece en Home**, conviene definir el patron para las demas pantallas movil para que el diseno sea coherente:

- En rutas profundas (chat detail, post detail, perfil ajeno, etc.) aparece un **header movil minimo** con:
  - Boton back.
  - Titulo de la ruta.
  - 0-2 acciones contextuales a la derecha.

Esto es responsabilidad de cada pantalla, no de Home. **Mencion aqui solo para que el diseno de la nav sea coherente cross-pantallas.**

---

## 4. Indicador de ruta profunda

Cuando el usuario navega desde Home a una Orbita o pantalla profunda:

- **Desktop**: el item "Home" del Sidebar pierde el highlight; aparece highlight en la seccion correspondiente (si la hay). Si la ruta es profunda y no encaja en el sidebar (ej. detalle de post), no se ilumina nada — el TopBar puede mostrar un breadcrumb minimo opcional.
- **Mobile**: el BottomNav refleja el tab raiz activo (Home, Chats, Perfil, etc.). Las rutas profundas mantienen el highlight del tab raiz desde el que se llego.

V1: breadcrumb opcional, no obligatorio. Si simplifica el diseno, omitir.

---

## 5. Estados de la pantalla

### 5.1 Loading (primer render sin cache)

- **Desktop**:
  - Mapa orbital: skeleton de planetas (circulos suaves en posiciones aproximadas) + estrellas estaticas.
  - Columna actividad: 5 skeleton rows.
  - Sidebar y TopBar: con datos del usuario (vienen de auth, ya cargados).
- **Mobile**:
  - Mapa orbital: idem skeleton.
  - Strip de actividad: skeleton de 3 cards.

### 5.2 Empty — usuario sin Orbitas todavia

- **Mapa orbital**: muestra solo recomendaciones, sin "tus Orbitas". Eyebrow ajustado a "Empieza tu galaxia" o similar. Mascota mas presente.
- **Actividad reciente**: card unica "Aun no hay actividad. Unete a tu primera Orbita." con CTA a `/discover`.
- **Sidebar "Tus Orbitas"**: vacio con CTA "Explorar Orbitas".

### 5.3 Empty — usuario con Orbitas pero sin actividad

- **Mapa**: normal.
- **Actividad reciente**: empty state suave "Todo en calma. Toca un planeta y empieza a orbitar.".

### 5.4 Error

- **Mapa**: pantalla con mensaje "No hemos podido cargar tu galaxia" + boton reintentar.
- **Actividad**: row de error inline + reintentar.
- TopBar / Sidebar / BottomNav siempre visibles aunque el body falle.

### 5.5 Offline

- Banner sutil en la parte superior del stage: "Estas sin conexion. Mostrando datos cacheados.".
- El mapa renderiza lo ultimo en cache.
- Acciones que requieren red (entrar a una Orbita, abrir chat) muestran feedback "Conectate para continuar" si fallan.

---

## 6. Interacciones clave

| Trigger | Resultado |
|---|---|
| Tap/click en planeta | Desktop: abre panel lateral con detalle. Mobile: abre BottomSheet. |
| Tap en card de actividad | Navega al contexto (post, perfil, Orbita, chat). |
| Tap en bell del TopBar | Navega a `/notifications` (a definir). V1 puede llevar a un dropdown simple o pantalla completa. |
| Tap en search del TopBar | Navega a `/discover` directamente. |
| Tap en avatar del TopBar | Navega a `/profile`. |
| Tap en boton crear (BottomNav center) | Abre flujo de creacion (sheet con opciones: crear Senal / crear Orbita / iniciar chat directo). V1 puede simplemente navegar a `/create`. |
| Long press en card de actividad (mobile) | V2: menu contextual. V1 sin accion. |
| Swipe horizontal en strip de actividad | Scroll del strip. |
| Pull to refresh en Home | V1: refresca datos del mapa y actividad. |

---

## 7. Responsive — breakpoints

| Ancho | Layout |
|---|---|
| < 720 px | Mobile compacto. Mapa ocupa ~70% del alto disponible, strip actividad ~15%, BottomNav ~10-15%. |
| 720 - 979 px | Mobile expandido. Igual que compacto pero con mas aire alrededor del mapa. Sin sidebar todavia. |
| 980 - 1199 px | Desktop estrecho. Sidebar + Mapa, **sin columna de actividad** (se mueve a un drawer o se oculta). Activity accessible via boton en TopBar o se inserta colapsada bajo el mapa. |
| 1200 - 1439 px | Desktop balanced. Sidebar + Mapa + Columna actividad. |
| >= 1440 px | Desktop ancho. Mismo layout, mas aire en margenes. Columna actividad puede ensancharse hasta ~400 px. |

> Decision de diseno (Figma): el breakpoint 980-1199 px es el mas critico — define como se comporta la columna de actividad cuando el ancho es justo. Mi sugerencia: **drawer lateral colapsable**, no inline.

---

## 8. Datos backend que consume Home

Lista para que la IA de diseno entienda qué hay que pintar y qué viene de donde. Los detalles tecnicos viven en los docs de backend.

| Bloque | Hook actual / futuro | Estado |
|---|---|---|
| Mapa orbital — tus Orbitas | `useUserCommunities()` | Existe |
| Mapa orbital — recomendaciones | `useRecommendedCommunities()` | Existe |
| Stats `Orbitas {N} · Online {M}` | derivado de las queries anteriores | Existe |
| TopBar saludo y avatar | `AuthProvider.profile` | Existe |
| Bell unread dot | placeholder (bell con dot fijo hoy) | **PENDIENTE — V1**: necesita `useUnreadNotifications()` |
| Sidebar "Tus Orbitas" | `useUserCommunities()` | Existe |
| BottomNav badge unread en Chats | suma de `listConversations.unread_count` | **PENDIENTE** — depende de chats backlog (§8.6 de `CHATS_ARCHITECTURE.md`) |
| Columna actividad reciente | RPC `list_home_activity(user_id)` | **PENDIENTE — NUEVO**. V1 puede ser union client-side de fuentes existentes. |

Cuando algun bloque dependa de datos aun no implementados, el diseno debe contemplar **placeholder/empty/loading** sin romper la composicion.

---

## 9. Copy V1

Texto principal (sentence case en todos):

| Lugar | Copy |
|---|---|
| TopBar saludo (mananas) | "Buenos dias, {nombre}" |
| TopBar saludo (tardes) | "Buenas tardes, {nombre}" |
| TopBar saludo (noches) | "Buenas noches, {nombre}" |
| TopBar saludo (madrugada) | "Aun explorando, {nombre}" |
| Header mapa eyebrow | "Tu galaxia" |
| Header mapa subtitulo | "Esto es lo que orbita a tu alrededor. Toca un planeta y aterriza." |
| Stats mapa | "{N} Orbitas · {M} online" |
| Actividad header | "Actividad reciente" |
| Actividad empty (con Orbitas) | "Todo en calma. Toca un planeta y empieza a orbitar." |
| Actividad empty (sin Orbitas) | "Aun no hay actividad. Unete a tu primera Orbita." |
| Error mapa | "No hemos podido cargar tu galaxia." |
| Offline banner | "Estas sin conexion. Mostrando datos cacheados." |

Tono general: **conversacional, ligero, ligeramente alien**. Sin tecnicismos. Evita "feed", "timeline", "stream" — usar "galaxia", "Orbita", "Senal", "Eco".

---

## 10. Accesibilidad

- **Hit targets** minimo 44x44 px en mobile, 32x32 px en desktop.
- **Contraste**: cumplir WCAG AA. La paleta dark con texto blanco/grises suaves ya esta validada en `DESIGN_SYSTEM.md`.
- **Reduced motion**: respetar `prefers-reduced-motion`. Las estrellas y animaciones del mapa deben reducirse o pararse. Decision tomada en sesion onboarding, aplicar aqui igual.
- **Lectores de pantalla**: cada planeta del mapa orbital debe tener `accessibilityLabel` con nombre de la Orbita, miembros, online. Las cards de actividad con descripcion completa.
- **Foco visible** en navegacion teclado en desktop. Tab order logico: TopBar → Sidebar → Mapa → Columna actividad.

---

## 11. Decisiones cerradas (no volver a abrir)

- **Sistema orbital es la pieza central de Home**. No se sustituye por feed plano.
- **Sin TopBar movil en Home**. El mapa tiene su propio header.
- **Sin scroll vertical de bloques en mobile**. Una sola vista: mapa + strip + BottomNav.
- **Quick actions duplicados fuera de V1**. La nav resuelve la creacion.
- **Eventos como bloque dedicado fuera de V1**. Entran en actividad reciente cuando exista la feature.
- **"Perfil" filtrado del sidebar desktop**. Se accede por avatar TopBar o footer sidebar.
- **Sentence case en todo el copy**. No UPPERCASE.
- **Mascota Nexo en TopBar desktop, no en body de Home movil**. Evita saturar.
- **Acción primaria: tocar un planeta**. Creación vive en la nav.
- **Dark mode primario**. Light mode es secundario y existe, pero el diseno se concibe para dark.

---

## 12. Reglas de oro para la IA de diseno

1. **El mapa orbital es el protagonista**. Cualquier bloque que compita por atencion al mismo nivel rompe la propuesta. Si dudas entre dos elementos, prioriza el mapa.
2. **No anadas bloques que no esten en el V1**. Tentacion de "anadimos stats personales tambien" → no. Si crees que falta, registralo como propuesta V2 en el doc, no lo metas al diseno.
3. **Sentence case siempre**. No experimentes con UPPERCASE para eyebrows o labels.
4. **Empty states con personalidad**. La mascota debe aparecer cuando hay vacio — es momento de aportar tono.
5. **Mobile: una sola vista**. Si te ves a punto de apilar tres bloques verticales scrolleables, has roto la propuesta — revisa.
6. **Reutiliza componentes existentes** del `DESIGN_SYSTEM.md` antes de inventar nuevos. Los Button, TextInput, BottomSheet, BlurView ya estan resueltos.
7. **Pinta los estados, no solo el happy path**. Loading, empty, error, offline deben tener mockup propio.
8. **Define spacing en multiplos de 4 u 8**. Manten escala coherente con el resto de pantallas.
9. **No tomes decisiones de backend**. Si un bloque pide datos que no existen, marca un placeholder y pregunta antes de inventar el endpoint.
10. **Coordina con el doc de Login** que ya rediseno el usuario. La transicion auth → home debe sentirse continua (transiciones, fondo cosmico que persiste, etc.).

---

## 13. Mapa rapido de archivos relacionados

```
app/(tabs)/index.tsx                                       redirect o screen home
app/(tabs)/_layout.tsx                                     monta AppNavigationFrame
src/features/feed/screens/HomeFeedScreen.tsx               screen actual de home
src/components/community/GalaxyOrbitMap.tsx                mapa orbital (existe)
src/components/navigation/AppTopBar.tsx                    topbar desktop (existe)
src/components/navigation/AppSidebar.tsx                   sidebar desktop (existe)
src/components/navigation/AppBottomNav.tsx                 bottom nav movil (existe)
src/components/navigation/AppNavigationFrame.tsx           orquesta sidebar+topbar+content
src/components/brand/NexoMascot.tsx                        mascota
src/theme/tokens.ts                                        tokens (no inventar nuevos sin justificar)
```

---

## 14. Checklist para Figma

Lo minimo que tiene que entregar la IA de diseno para considerar Home V1 cerrado:

### Frames

1. **Desktop ancho** (>= 1440 px) — happy path con datos.
2. **Desktop balanced** (1200-1439 px) — happy path con datos.
3. **Desktop estrecho** (980-1199 px) — happy path con drawer de actividad.
4. **Mobile compacto** (360-430 px) — happy path con datos.
5. **Mobile expandido** (720-979 px) — happy path con datos.

### Estados (al menos en mobile + desktop balanced)

6. Loading inicial.
7. Empty sin Orbitas.
8. Empty con Orbitas y sin actividad.
9. Error.
10. Offline.

### Interacciones

11. Panel lateral derecho desktop con detalle de Orbita al tocar planeta.
12. BottomSheet mobile con detalle de Orbita al tocar planeta.
13. Card de actividad reciente — variantes por tipo (eco, comentario, mencion, posts agrupados, cambio de rol).
14. Bell con dot vs bell sin dot en TopBar desktop.
15. BottomNav con badge unread vs sin badge.

### Componentes a documentar

16. Card de actividad — estructura, tipos, truncado.
17. Strip horizontal de actividad mobile.
18. Stats line del mapa.
19. Empty state con mascota.

### Copy

20. Confirmar todos los strings del §9.

---

## 15. Que sigue despues

Cuando Home V1 este disenado y validado, propongo seguir por:

1. **Detalle de Orbita** (`CommunityDetailScreen`) — la pantalla a la que se llega tras tocar un planeta. Es la siguiente parada natural del flujo.
2. **Detalle de Senal** (`PostDetailScreen`) — destino de muchas cards de actividad.
3. **Lista y sala de chat** (`ChatListScreen`, `ChatRoomScreen`).
4. **Perfil propio** (`ProfileScreen`).
5. **Crear Senal** (`CreatePostScreen`) — wizard segun tipo (poll, event, help, etc.).
6. **Crear Orbita** (`CommunityCreateScreen`).
7. **Discover** (`DiscoverScreen`).
8. **Settings**.

Cada pantalla tendra su propio doc espejo a este (`SCREEN_COMMUNITY_DETAIL.md`, `SCREEN_POST_DETAIL.md`, etc.). El patron es el mismo: scope, layout, bloques, estados, datos, copy, checklist Figma.
