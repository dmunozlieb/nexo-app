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

## 0.5 Esencial para la IA de diseno (si solo lees una cosa)

**No tienes acceso al repo ni a las pantallas existentes.** Todo lo que necesitas para diseñar Home esta inlined en este doc. No abras links a otros archivos `.md` — no los puedes leer. Diseña todo lo que se describe; cuando algo se llama "ya existe" en el doc, asumelo como una spec a respetar visualmente (descripcion abajo), no como excusa para saltartelo.

### TL;DR (6 cosas que no puedes fallar)

1. **Atmosfera cosmica continua**: fondo casi negro con nebulosas blureadas y estrellas titilantes, sin cortes entre regiones de la pantalla. Topbar/sidebar/bottomnav son **capas glass por encima** del fondo, no fondos nuevos opacos.
2. **El mapa orbital es el protagonista** (anatomia visual completa en §2.4.1). Diseña el chrome alrededor (header, stats, panel detalle, columna de actividad).
3. **Sin TopBar movil en Home**. El mapa lleva su propio header. En desktop si hay TopBar (alto 68 px) + Sidebar (ancho 286 px).
4. **Mobile = una sola vista sin scroll vertical**: mapa + strip horizontal de actividad + BottomNav. Ya.
5. **Sentence case en todo el copy**. Cero UPPERCASE.
6. **Pinta los estados** (loading, empty sin Orbitas, empty sin actividad, error, offline), no solo el happy path.

### Paleta dark mode (la unica que importa para V1)

| Token | Hex | Uso |
|---|---|---|
| background | `#070B1A` | Fondo base de la app. |
| surface | `#0D1230` | Cards solidas (cuando no son glass). |
| elevated | `#182044` | Inputs, hover/active states. |
| border | `#303A66` | Bordes neutros. |
| primary (violeta) | `#7B5CFF` | Acciones principales, dot activo. |
| secondary (cyan) | `#18D7FF` | Links, eyebrows, borders seleccion. |
| accent (magenta) | `#FF4FD8` | Accents puntuales (badges, glow especifico). |
| success | `#22E6B9` | Online dot, confirmaciones. |
| warning | `#FF7AA8` | Avisos suaves. |
| error | `#FF5C8A` | Errores y alerts. |
| text | `#F6F7FB` | Texto primario. |
| textMuted | `#B9C1D9` | Texto secundario. |
| textFaint | `#8490B4` | Texto terciario, helpers. |

### Tipografia, spacing, radius

- **Familia**: Inter (weights 400/500/600/700/800).
- **Escala texto**: 11 / 13 / 15 / 17 / 20 / 24 / 28 px.
- **Spacing**: 4 / 8 / 12 / 16 / 24 / 32 / 48.
- **Radius**: 4 / 6 / 8 / 12 / pill (999). Glass cards grandes usan 24.

### Atmosfera cosmica del fondo (spec completa, pintar tal cual)

El fondo es **una sola capa continua** que ocupa todo el viewport (full bleed) por DEBAJO del topbar/sidebar/bottomnav. No se reinicia en cada region.

Composicion (de fondo a primer plano):

1. **Gradiente vertical base** (top → bottom): `#070622` → `#090A1F` → `#050611`. Casi negro con tinte ligeramente violeta.
2. **Nebulosas radiales blureadas** (3 manchas grandes, blur ~64 px, sin bordes definidos):
   - Violeta `rgba(123,92,255,0.12)`: circulo ~540 px, posicion top-left (top: -220, left: -170).
   - Cyan `rgba(24,215,255,0.07)`: circulo ~560 px, posicion right-bottom (right: -180, bottom: -100).
   - Magenta `rgba(255,79,216,0.07)`: circulo ~480 px, posicion bottom-center (bottom: -180, left: ~33%).
3. **Dos circulos de orbita decorativos** (border 1 px, sin fill):
   - Grande: ~930 px diametro, border `rgba(255,255,255,0.035)`, posicion left: 12%, top: 6%.
   - Pequeño: ~620 px diametro, border `rgba(123,92,255,0.045)`, posicion left: -8%, bottom: -18%.
4. **~16 estrellas blancas** distribuidas, 1-2 px, con halo (shadow blur 6, color blanco opacidad 0.8). Opacidad base entre 0.35 y 0.72 segun la estrella; en una version animada, parpadean entre 0.18 y 1.0 con duraciones distintas (1.6-2.2 s por estrella). Respeta `prefers-reduced-motion` → estaticas.

> **Importante**: este fondo se ve por debajo del sidebar y del topbar a traves del BlurView. Cuando diseñes los mockups, asegurate de que la nebulosa/estrellas se perciban (suavemente) atravesando el cristal del sidebar/topbar.

### Glass cards (componentes con BlurView)

Topbar, Sidebar, BottomNav y el panel lateral de detalle de Orbita son **glass cards** con esta receta:

- **Backdrop blur** equivalente a `backdrop-filter: blur(28-40px)`.
- **Tint dark**: capa de color `rgba(13, 18, 48, 0.55-0.7)` por encima del blur (mas opaca = mas "solida").
- **Gradient overlay sutil**: `linear-gradient(135deg, rgba(255,255,255,0.045), rgba(123,92,255,0.055), rgba(255,255,255,0.02))`.
- **Border**: 1 px `rgba(255,255,255,0.1)`.
- **Border radius**: 24 px en panel lateral, 0 en topbar/sidebar (van pegados al borde del viewport).
- **Shadow** (opcional, solo en piezas flotantes como el panel lateral): `0 18px 28px rgba(0,0,0,0.45)`.

### CTAs primary (botones de accion principal)

- **Pill**: border-radius 999, altura min 48 px, padding horizontal 20.
- **Gradient diagonal**: `linear-gradient(135deg, #8B5CF6, #22D3EE)`.
- **Texto blanco**, Inter SemiBold 15.
- **Shadow violeta**: `shadow-color: #7B5CFF`, opacity 0.34, radius 18, offset (0, 10).
- **Estados**: hover/pressed `opacity 0.82`, disabled `opacity 0.48`, loading muestra spinner blanco en lugar del texto.

### Mascotas (hay dos en el sistema — no las mezcles)

- **`NexoMascot`** (la que usa Home) — alien 3D estilizado: cabeza grande casi circular, dos antenas con bolas luminosas, ojos cyan grandes con highlight blanco, cuerpo violeta con gradient. Aparece en Home en el `AppTopBar` (size 48, izquierda junto al saludo) y en empty states del strip de actividad reciente.
- **`AuthOrbitMascot`** (NO usar en Home) — variante con halo violeta-magenta y dos orbitas elipticas animadas alrededor de la cabeza. Reservada para flujo auth/onboarding. Mencionada solo para que no la dibujes aqui por error.

> Si necesitas referencias visuales de la mascota, el usuario puede adjuntar capturas. Si no, pintala segun la descripcion: alien amigable, paleta violeta con ojos cyan, antenas con esfera al final.

### Anatomia visual de los componentes que viven en Home

| Componente | Spec resumida (detalle completo en §2) |
|---|---|
| `GalaxyOrbitMap` | Lienzo con 5-6 planetas circulares gradient flotando, estrellas estaticas, capa de "via lactea" suave. Anatomia completa en §2.4.1. |
| `AppTopBar` (desktop) | 68 px alto, full width, glass card. Mascot 48 + saludo + (flex) + search + bell + avatar. |
| `AppSidebar` (desktop) | 286 px ancho, full height, glass card. Logo + nav + "Tus Orbitas" + footer perfil. |
| `AppBottomNav` (mobile) | Glass card flotante en bottom, 64-72 px alto. 5 slots: Home / Explorar / Crear (centro destacado) / Chats / Perfil. |
| `BottomSheet` (mobile) | Sheet glass desde abajo al tocar planeta. Misma receta visual del panel lateral desktop pero apilado vertical. |
| `Avatar` | Circulo con imagen o gradient + inicial blanca en bold si no hay imagen. Tamaños comunes: 28/40/48/72/88. |

Tu trabajo es: pintar el **stage** (zona derecha del sidebar en desktop, viewport casi entero en mobile), el **mapa orbital con su chrome** (header, stats), el **panel lateral derecho** desktop al tocar planeta (§2.4.2), la **columna/strip de actividad reciente** (§2.5 / §3.3) y los **estados** (§5). Topbar/Sidebar/BottomNav los pintas tambien (con la spec resumida arriba y la detallada en §2).

> **Recomendado al pasar este doc**: si el usuario puede adjuntar **screenshots de las pantallas de Login y Onboarding ya rediseñadas**, te servira de referencia visual de la atmosfera cosmica y los glass cards. Si no, sigue la spec descrita aqui literal — esta calibrada al codigo.

---

## 1. Identidad y principios

- **Dark mode primario**. Fondo casi negro con la atmosfera cosmica descrita en §0.5 (gradiente vertical oscuro + nebulosas blureadas + estrellas titilantes + dos orbitas decorativas). El fondo es **continuo**: ocupa todo el viewport por debajo de las capas glass del topbar/sidebar/bottomnav.
- **Sentence case en todo el copy** (no UPPERCASE en eyebrows, stat labels, ni section titles). Esta decision se tomo en la sesion 2026-05-25 y debe mantenerse.
- **Mascota `NexoMascot` (descrita en §0.5)** presente como acento, no como protagonista. En Home aparece en el TopBar desktop a tamaño 48 junto al saludo, y en los empty states del strip de actividad. En movil **no aparece en el viewport principal de Home** (el mapa ya manda).
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
  - Eyebrow corto: "Tu galaxia" (Inter SemiBold 11, color secondary cyan, letter-spacing 0.4, sentence case).
  - Titulo/subtitulo conversacional: "Esto es lo que orbita a tu alrededor. Toca un planeta y aterriza." (Inter Medium 15, color textMuted).
  - **Stats** a la derecha: `Orbitas {N} · Online {M}`. Sentence case, Inter SemiBold 13, color textFaint con el numero en color text.
- **Body**: `GalaxyOrbitMap` con planetas de las Orbitas del usuario primero, recomendaciones despues. Anatomia visual completa en §2.4.1.
- Al **clickear un planeta**: se abre un **panel lateral derecho** sobre la columna de actividad (overlay, no push) con el detalle de la Orbita. Anatomia visual completa en §2.4.2.

Datos necesarios:
- `useUserCommunities()` — Orbitas del usuario con metadata.
- `useRecommendedCommunities()` — Orbitas sugeridas por intereses.

### 2.4.1 Anatomia visual del `GalaxyOrbitMap`

Lienzo rectangular que ocupa el cuerpo del stage. Es la pieza visual central, asi que dale espacio.

**Distribucion de planetas — desktop (≥720 px)**: 6 planetas en posiciones fijas (porcentajes relativos al canvas, anchor desde el centro del planeta):

| # | Top | Left | Diametro | Label posicion |
|---|---|---|---|---|
| P1 | 22% | 18% | 116 px | derecha |
| P2 | 26% | 72% | 108 px | izquierda |
| P3 | 62% | 46% | **132 px** (mas grande) | abajo |
| P4 | 40% | 44% | 78 px (mas pequeño) | izquierda |
| P5 | 70% | 16% | 92 px | derecha |
| P6 | 66% | 80% | 88 px | izquierda |

**Distribucion compacta — mobile (<720 px)**: 5 planetas redistribuidos, tamaños 50-70 px (canvas mas estrecho).

**Anatomia de cada planeta** (esfera flotante con vida):

1. **Cuerpo del planeta**: circulo con gradient diagonal (uno de 6 presets, rotado por planeta):
   - Preset A: `#7B5CFF → #18D7FF` (violeta a cyan)
   - Preset B: `#18D7FF → #FF4FD8` (cyan a magenta)
   - Preset C: `#FF4FD8 → #B18CFF` (magenta a violeta claro)
   - Preset D: `#22E6B9 → #18D7FF` (mint a cyan)
   - Preset E: `#FF7AA8 → #FF4FD8` (rosa a magenta)
   - Preset F: `#B18CFF → #22E6B9` (violeta claro a mint)
2. **Halo difuso**: shadow exterior del color principal del planeta, radius 20-40 px segun tamaño, opacidad 0.5.
3. **Anillo orbital propio**: elipse fina alrededor del planeta (border 1.5-2 px del color secundario del planeta, opacidad 0.4), rotada un angulo distinto segun la categoria de la Orbita (-18°, 14°, -8°, etc.). Da sensacion de planeta con orbita propia.
4. **Contenido central**: avatar de la Orbita (imagen circular) si tiene; si no, inicial del nombre en Inter Bold tamaño 24-32 (segun tamaño del planeta), color blanco con shadow sutil.
5. **Label flotante**: nombre de la Orbita pegado al lado/abajo segun `Label posicion`. Inter SemiBold 13, color text, con halo violeta sutil detras para legibilidad sobre el fondo cosmico.
6. **Float animado**: el planeta flota arriba-abajo con amplitud ~6 px, periodo 4.8-8 s, fase distinta por planeta para que no se sincronicen. Respeta `prefers-reduced-motion`.

**Signals de actividad** (badges pequeños pegados al planeta, esquina superior-derecha del cuerpo del planeta — solo visibles si la Orbita tiene actividad):

- 📄 `posts nuevos` (icono FileText 12 px) — chip con border cyan.
- 💬 `chat activo` (icono MessageSquare 12 px) — chip con border violeta.
- 📅 `evento hoy` (icono Calendar 12 px) — chip con border magenta.
- 📡 `mision activa` (icono Radio 12 px) — chip con border mint.

Si la Orbita tiene varios signals, se apilan horizontalmente (max 2-3 visibles).

**Fondo del canvas**:
- Capa de "via lactea" suave: gradiente radial muy difuso al centro (violeta `rgba(123,92,255,0.08)` → transparent en 60%).
- ~40 estrellas estaticas (puntos blancos 1-2 px) distribuidas, opacidad 0.3-0.7. Estas son adicionales al starfield global del fondo de la app (mas densidad aqui).
- **NO** dibujes las orbitas grandes (esas viven en el fondo global de la app, §0.5).

**Distincion "tus Orbitas" vs "recomendaciones"**:
- **Tus Orbitas**: primeras posiciones (P1, P2, P3), planetas mas grandes (>= 100 px), gradients saturados, opacidad 1.0, anillo orbital visible.
- **Recomendaciones**: posiciones secundarias (P4, P5, P6), planetas mas pequeños (78-92 px), opacidad 0.85, anillo orbital mas tenue (opacidad 0.25), label con badge pequeño "Sugerido" en cyan al lado.

**Estado interactivo**:
- **Hover/focus en planeta**: scale 1.05, shadow del halo intensifica (opacity 0.8), cursor pointer.
- **Tap/click**: scale rebound + abre panel lateral (desktop) o BottomSheet (mobile).

### 2.4.2 Panel lateral derecho desktop — detalle de Orbita

Aparece al tocar un planeta. **Glass card flotante** alineada al borde derecho del Stage, encima de la columna de actividad reciente (la difumina detras, no la empuja).

**Dimensiones y posicion**:
- Ancho: 340 px fijo.
- Alto: hasta 80% del viewport (max ~720 px), centrado verticalmente.
- Margen: 16 px al borde derecho.
- Border radius: 24 px en las cuatro esquinas.
- Glass card receta de §0.5 (blur + tint dark + gradient overlay + border `rgba(255,255,255,0.1)` + shadow `0 18px 28px rgba(0,0,0,0.45)`).

**Estructura vertical (de arriba a abajo)**:

1. **Banner header** (altura 108 px, ancho total del panel, esquinas superiores con el mismo radius del panel):
   - Imagen del banner de la Orbita si tiene; si no, gradient diagonal en los dos colores del planeta correspondiente (preset A-F de §2.4.1).
   - **Boton cerrar (X)** flotante en esquina superior derecha (28x28 px, circulo `rgba(0,0,0,0.4)`, icono X 14 px blanco). Hit slop generoso.
2. **Avatar de la Orbita** circular **80 px**, posicionado pisando el borde inferior del banner (overlap 40 px, margin-left 20). Border 3 px del color de background `#070B1A` (corte limpio). Si no hay imagen, gradient del planeta + inicial.
3. **Bloque info** (padding 20 horizontal, 14 top, gap 12):
   - **Nombre Orbita**: Inter Bold 20, color text. Sentence case.
   - **Handle**: `@slug` en Inter SemiBold 13, color secondary cyan.
   - **Stats compactas** (fila): `{N} miembros · {M} online`. Inter Medium 13, textMuted. Dot mint 6 px junto al numero de online.
   - **Tags/categoria** (fila chips, max 3 visibles): chip de 24 px alto, padding 10 horizontal, border 1 px del color de la categoria (cyan/violeta/magenta segun), background `rgba(<color>, 0.12)`, texto Inter SemiBold 11.
   - **Descripcion**: 3-4 lineas max, Inter Regular 14, lineHeight 20, textMuted. Truncada con elipsis si excede.
4. **Footer sticky** (border-top 1 px `rgba(255,255,255,0.06)`, padding 16, gap 10):
   - **CTA principal "Entrar a la Orbita"**: receta CTA primary de §0.5 (gradient + pill + sombra violeta). Full width.
   - **CTA secundario "Abrir chat"**: pill ghost, border 1 px `rgba(255,255,255,0.14)`, background `rgba(255,255,255,0.04)`, texto blanco SemiBold. Full width. Icono MessageSquare 16 px a la izquierda.
   - **Link "Ver detalle completo"**: texto centrado Inter Medium 13, color textFaint, padding vertical 6. Subrayado en hover.

**Animacion de apertura**: slide-in horizontal desde la derecha (+24 px) + fade-in 220 ms, easing `cubic-bezier(0.2, 0.8, 0.2, 1)`. Respeta `prefers-reduced-motion` → solo fade.

**Estados**:
- Cierre por: tap fuera, X, tecla ESC.
- Al cerrar: el planeta correspondiente recupera su scale base.
- Backdrop detras: la columna de actividad se difumina ligeramente (filter blur 4 + opacity 0.6) mientras el panel esta abierto.

> En mobile (§3.2) este mismo contenido vive como `BottomSheet` desde abajo: misma receta visual y misma estructura, pero apilada vertical y ocupando 80% del alto. Footer sticky sigue siendo el mismo (CTA primary + secundario + link).

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
10. **Continuidad cosmica**: el fondo descrito en §0.5 debe sentirse el mismo a lo largo de la pantalla. No introduzcas un fondo opaco nuevo en ninguna region — el sidebar, el topbar y el bottomnav son glass cards que dejan respirar la atmosfera.

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
