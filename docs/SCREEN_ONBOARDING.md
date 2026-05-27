# Pantalla Onboarding — Especificacion de producto

Documento de producto para la IA de diseno (Figma). Define **que se muestra, donde, en que orden y con que datos** en la pantalla `/onboarding`. No define backend (eso vive en `ARCHITECTURE.md` y en `auth-service.ts`). Define lo suficiente para que Figma Make pueda generar el diseno sin contexto previo del proyecto.

> Punto de entrada para la IA de diseno. Lee este doc primero. Para contexto general del producto: `PROJECT_CONTEXT.md`. Para la estetica ya tomada (dark, cosmica, mascota Nexo, paleta violeta/cyan/magenta), `DESIGN_SYSTEM.md` es la referencia. Para el destino tras onboarding ver `SCREEN_HOME.md`.

---

## 0. Proposito y scope

Onboarding es la **transicion entre auth y Home**. El usuario acaba de registrarse o iniciar sesion por primera vez. Aun no tiene perfil completo. Esta pantalla recoge los **3 datos minimos** para activar la experiencia social y darle al usuario una primera sensacion de que esta entrando a un universo distinto.

### Acciones primaria y secundaria

- **Primaria**: avanzar al siguiente paso (`Siguiente`) hasta completar los 3 pasos y aterrizar en Home (`Aterrizar en Nexo`).
- **Secundaria**: retroceder al paso anterior (flecha izquierda). El paso 1 no tiene retroceso (ya esta autenticado, no se puede salir).
- **Terciaria**: saltar la foto de avatar (`Saltar por ahora`). Es opcional. El resto de campos no son saltables.

### Que cubre V1

1. **Wizard de 3 pasos** dentro de una tarjeta unica con fondo cosmico animado.
2. **Paso 1 — Identidad**: avatar (opcional) + nombre visible (obligatorio).
3. **Paso 2 — Perfil**: username con prefijo `@` (obligatorio) + bio (opcional, max 160 chars).
4. **Paso 3 — Intereses**: grid de 6 categorias, minimo 1 seleccionada.
5. **Indicador de progreso** (puntos + texto "Paso N de 3 · {label}").
6. **Estados** loading inicial, error de subida de avatar, error de validacion, deshabilitado del CTA.

### Que queda fuera de V1

- Eleccion de tema/skin (light/dark) — la app es dark por defecto, no se pregunta.
- Sugerencias de Orbitas a unirse durante onboarding (vive en `/discover` post-onboarding).
- Verificacion de email dentro del wizard (la verificacion vive en el flujo de auth).
- Sincronizacion de contactos / invitar amigos.
- Permisos del sistema (notificaciones, camara) — no se piden en onboarding; se piden contextualmente cuando aplica.
- Tour guiado de la app (la mascota es suficiente como tono de bienvenida).
- Mas de 6 categorias de intereses en V1. Cuando haya mas, se rediseña el grid (no scrolleable horizontal todavia).

---

## 1. Identidad y principios

- **Dark mode primario**. Fondo casi negro (gradiente `#03050F` → `#070B1F` → `#0B0E2A` → `#070B1F` → `#03050F` de top-left a bottom-right) con **estrellas tipo parpadeo** (~36 estrellas distribuidas, opacidad animada entre 0.35 y 1.0, tamaños 1-2 px, halo violeta `#B18CFF` con shadow blur 8).
- **Tarjeta central con BlurView** (intensity 50, dark tint) sobre el fondo cosmico. Color de la tarjeta: `rgba(9,12,28,0.78)`. Borde sutil 1 px color `#303A66`. Border radius `12 px`. Shadow `0 18px 24px rgba(0,0,0,0.5)`.
- **Sentence case en todo el copy**. No UPPERCASE en eyebrows, labels ni titulos. Decision tomada y mantenida en toda la app.
- **Mascota Nexo como acento emocional** en la esquina superior izquierda de la tarjeta, tamaño 64 px, animada (parpadeo sutil) salvo si `prefers-reduced-motion`.
- **Una sola tarjeta visible a la vez**. Los pasos se intercambian con **fade** (opacity 1→0 en 120 ms, opacity 0→1 en 180 ms) dentro de la misma tarjeta. No carousel horizontal, no slide-in.
- **Tonalidad violeta + cyan**. El violeta `#7B5CFF` (primary) marca acciones, el cyan `#18D7FF` (secondary) marca eyebrows, prefijo `@` y bordes seleccionados. El gradiente del anillo del avatar es `primary → secondary`.
- **Vignette superior e inferior** sobre el gradiente (rgba(3,5,15,0.7) → 0 arriba, 0 → 0.78 abajo) para dar profundidad y centrar la vista en la tarjeta.

---

## 2. Layout general

### 2.1 Estructura

```
[ Backdrop cosmico (gradiente + estrellas + vignettes) — full screen ]
                  [ Tarjeta de onboarding centrada ]
```

La tarjeta esta **siempre centrada vertical y horizontalmente** en el viewport, ancla unica de la pantalla. **No hay TopBar, ni Sidebar, ni BottomNav durante onboarding** — es una pantalla "modal" cubriendo todo.

### 2.2 Tarjeta — dimensiones

- **Ancho**: 100% del viewport hasta un **maximo de 540 px**. Padding lateral del viewport: 12 px.
- **Padding interior**: 26 px en todos los lados.
- **Gap interno vertical entre bloques**: 18 px.
- **Border radius**: 12 px.
- **Border**: 1 px solid `#303A66`.
- **Background**: `rgba(9,12,28,0.78)` con backdrop blur intensidad 50.

### 2.3 Tarjeta — composicion vertical (de arriba a abajo)

1. **Header row** (mascota + eyebrow + titulo). Altura aprox. 64 px.
2. **Progress indicator** (3 dots + texto). Altura aprox. 22 px.
3. **Subtitulo** (1-2 lineas). Altura aprox. 22-44 px.
4. **Step body** — area que cambia segun el paso. `minHeight: 280 px`.
5. **Footer** — boton back (opcional desde paso 2) + CTA principal. Altura 52 px.

Total aprox. tarjeta: ~460-520 px segun paso.

### 2.4 Header row

- **NexoMascot 64x64 px** a la izquierda. Mascota alien con cabeza grande, antenas con bolas luminosas, ojos grandes redondos sobre fondo violeta. Anima sutil de parpadeo si no hay reduce-motion.
- **Columna derecha** (flex: 1) con dos lineas:
  - **Eyebrow** (chip-line, no chip): icono ✨ `Sparkles` size 13 px color `#18D7FF` + texto en `#18D7FF`, tamaño 11 px, weight 700, letter-spacing 0.2. Variantes por paso: `Primer salto` / `Tu firma` / `Casi listo`.
  - **Titulo H1**: tamaño 24 px, weight 900, lineHeight 28, color `#F6F7FB`. Variantes por paso: `Crea tu identidad` / `Elige tu @username` / `Que te mueve?`.
- Gap horizontal entre mascota y columna: 14 px.

### 2.5 Progress indicator

- **Fila de 3 dots** horizontales con gap 6 px.
  - Dot activo: **ancho 28 px**, alto 8 px, border radius 4 px, color `#7B5CFF`.
  - Dots completados (anteriores al activo): **ancho 8 px**, alto 8 px, color `#7B5CFF`.
  - Dots pendientes (posteriores al activo): **ancho 8 px**, alto 8 px, color `#303A66`.
- **Debajo**, texto pequeño: `Paso {N} de 3 · {Label}`. Tamaño 11 px, weight 700, color `#8490B4`. Labels: `Identidad`, `Perfil`, `Intereses`.

### 2.6 Subtitulo

- Tamaño 15 px, lineHeight 22, color `#B9C1D9`. Una o dos lineas, weight normal.
- Texto cambia por paso (ver §5).

### 2.7 Step body

Area que cambia por paso. Definida en §3. Tiene una altura minima de 280 px para que el footer no se mueva entre pasos.

### 2.8 Footer

- Fila horizontal, gap 10 px, padding-top 4 px.
- **Boton back** (cuadrado, 52x52 px, border radius 8 px, borde 1 px `#303A66`, fondo `rgba(255,255,255,0.04)`, icono flecha-izquierda `ArrowLeft` 18 px color `#F6F7FB`). **Solo aparece a partir del paso 2.** En el paso 1 no existe (la fila tiene solo el CTA).
- **CTA principal** (flex: 1, alto 52 px, border radius pill `999`, color de fondo `#7B5CFF`, texto blanco, weight bold). Variantes:
  - Paso 1 y 2: texto `Siguiente` + icono `ArrowRight` 18 px blanco a la derecha del texto.
  - Paso 3: texto `Aterrizar en Nexo`, **sin icono**.
- Estados del CTA:
  - **Disabled**: opacidad 0.5, no clickable. Solo aplica en paso 3 cuando hay 0 intereses seleccionados.
  - **Loading**: spinner blanco circular en lugar del texto + icono, durante el submit final.

---

## 3. Pasos del wizard

### 3.1 Paso 1 — Identidad ("quien")

**Eyebrow**: `Primer salto`
**Titulo**: `Crea tu identidad`
**Subtitulo**: `Elige como te vera la galaxia. Puedes cambiarlo cuando quieras.`
**Label progreso**: `Identidad`

**Contenido (step body), gap vertical 16 px:**

#### 3.1.1 Bloque avatar (centrado, gap interno 10 px)

- **Avatar picker** circular, 140x140 px (clickeable, accesible como boton `Elegir avatar`).
  - **Anillo gradiente** exterior: 140x140 px, border radius 70, padding 3 px, gradiente lineal de `#7B5CFF` (top-left) a `#18D7FF` (bottom-right).
  - **Interior**: 134x134 aprox., border radius 67, fondo `#070B1A` (background).
  - **Contenido del interior**: componente `Avatar` redondo de 120 px. Si **no hay** imagen seleccionada, muestra un placeholder con la inicial del display_name (o "N" si vacio) sobre fondo `#0D1230`. Si **hay** imagen, muestra la imagen recortada en circulo.
  - **Badge camara** en esquina inferior derecha del avatar picker: circulo 34x34 px, fondo `#7B5CFF`, borde 3 px del color del fondo `#070B1A`, icono `Camera` 15 px blanco centrado. Posicionado `right: 6, bottom: 6` respecto al picker.
- **Fila de acciones** debajo del avatar (flex-row, gap 12 px, centered):
  - **Texto helper** (tamaño 13 px, weight 600, color `#8490B4`):
    - Sin avatar: `Toca para elegir una imagen`
    - Subiendo: `Subiendo...`
    - Con avatar: `Toca para cambiar`
  - **Link** (pressable, padding 6/4, link-style con subrayado, tamaño 13 px, weight 700, color `#8490B4`):
    - Sin avatar: texto `Saltar por ahora` sin icono.
    - Con avatar: icono `Trash2` 13 px + texto `Quitar foto`.

#### 3.1.2 Input nombre visible

- Componente `TextInput` (ver `DESIGN_SYSTEM.md`).
- **Label** (encima del input): `Nombre visible`, tamaño 13 px, weight 700, color `#F6F7FB`.
- **Placeholder**: `Como quieres que te llamemos`, color `#8490B4`.
- Input vacio al cargar (o prellenado con el `display_name` actual del perfil si existe).
- **Validacion** al pulsar Siguiente:
  - Si vacio o < 2 chars: mensaje de error rojo `#FF5C8A` debajo del input: `El nombre visible necesita al menos 2 caracteres.`
  - Si > 40 chars: `El nombre visible no puede superar 40 caracteres.` (el input tambien deberia frenar a 40 chars suaves).

**CTA paso 1**: `Siguiente` con flecha derecha. **No hay boton back.**

---

### 3.2 Paso 2 — Perfil ("identidad")

**Eyebrow**: `Tu firma`
**Titulo**: `Elige tu @username`
**Subtitulo**: `Sera tu firma dentro de Nexo. Usa letras, numeros o guion bajo.`
**Label progreso**: `Perfil`

**Contenido (step body), gap vertical 16 px:**

#### 3.2.1 Input username

- Componente `TextInput`.
- **Label**: `Username`.
- **Icono prefijo** dentro del input a la izquierda: texto literal `@`, tamaño 17 px, weight 800, color `#18D7FF`.
- **Placeholder**: `tu_nombre`.
- **AutoCapitalize**: `none`. **Transformacion en vivo**: lowercase y reemplaza espacios por `_` al escribir.
- Prellenado: si el usuario llego con un username pendiente desde el registro, se muestra. Si no, vacio.
- **Validacion** al pulsar Siguiente:
  - < 3 chars: `El username necesita al menos 3 caracteres.`
  - > 24 chars: `El username no puede superar 24 caracteres.`
  - Caracter invalido: `Usa solo letras minusculas, numeros y guion bajo.`
  - (V2: validacion server-side de disponibilidad, no en V1.)

#### 3.2.2 Input bio (multilinea)

Encapsulado en un bloque con un `gap 4 px` y el contador alineado a la derecha debajo.

- Componente `TextInput` modo `multiline`.
- **Label**: `Bio (opcional)`.
- **Placeholder**: `Cuenta que te mueve por aqui.`
- **Altura minima**: 96 px. `textAlignVertical: top`.
- **maxLength**: 160 caracteres (el input frena la entrada al limite).
- **Contador** debajo del input, alineado a la derecha:
  - Texto `{n}/160`, tamaño 11 px, weight 700.
  - Color por defecto: `#8490B4`.
  - Si `n > 136` (85% del limite, "near limit"): color `#FF7AA8` (warning).
  - El contador siempre esta visible, incluso a 0 (`0/160`).
- **Validacion**: bio es opcional (puede estar vacia). Si > 160 chars (no deberia ocurrir por el maxLength): `La bio no puede superar 160 caracteres.`

**Footer paso 2**: boton back (icono flecha izquierda) + CTA `Siguiente` con flecha derecha.

---

### 3.3 Paso 3 — Intereses ("orbita")

**Eyebrow**: `Casi listo`
**Titulo**: `Que te mueve?`
**Subtitulo**: `Elige al menos una categoria para encontrar comunidades afines.`
**Label progreso**: `Intereses`

**Contenido (step body), gap vertical 16 px:**

#### 3.3.1 Grid de intereses

- Grid de **6 cards** (V1 fijo, listado fallback hardcoded).
- **Layout**: `flex-row`, `flex-wrap`, `gap 10 px`, `justify-content: space-between`. Cada card ocupa **~31.5% del ancho disponible** → **3 columnas, 2 filas** en mobile-portrait y en desktop estrecho. En desktop balanced sigue siendo 3 columnas (la tarjeta no se ensancha).
- Cada card:
  - Ancho ~31.5%, alto minimo 96-100 px.
  - Padding 10 px horizontal, 12 px vertical.
  - Border radius 12 px, border 1 px.
  - Centered (icon + label apilados verticalmente, gap 6 px).
  - **Emoji** grande en la parte superior (fontSize 30 px).
  - **Label** debajo, tamaño 13 px, weight 800, centrado.
- **Estado no seleccionado**:
  - Border `#303A66`.
  - Background `#0D1230` (surface).
  - Label color `#F6F7FB`.
  - Sin shadow.
- **Estado seleccionado**:
  - Border `#18D7FF` (secondary).
  - Background `rgba(123,92,255,0.16)`.
  - Label color `#FFFFFF`.
  - Shadow `0 0 16px #7B5CFF` (glow violeta, opacity 0.3).
  - Animacion sutil de scale: `1.04` cuando se selecciona (spring tension 220, friction 14). Si `prefers-reduced-motion`, sin scale.
- **Toggle**: tap para seleccionar/deseleccionar. No hay limite superior de seleccion.

**Lista V1 de intereses** (fijos, en este orden):

| # | Emoji | Label | Slug |
|---|---|---|---|
| 1 | 🎨 | Arte | art |
| 2 | 🎮 | Gaming | game |
| 3 | 📚 | Lectura | book |
| 4 | 🎵 | Musica | music |
| 5 | 💻 | Tecnologia | code |
| 6 | 🎬 | Cine | film |

> Nota: Si el backend devuelve mas categorias en el futuro, el grid debe poder crecer a varias filas sin romper la tarjeta. Para V1 el listado es fijo a 6.

#### 3.3.2 Fila inferior de info

Bajo el grid, flex-row, justify-content space-between, align-items center, gap 10 px, flex-wrap:

- **Contador** a la izquierda (tamaño 13 px, weight 700, color `#8490B4`):
  - 0 seleccionadas: `Aun no has elegido nada`.
  - 1 seleccionada: `1 seleccionada`.
  - N > 1: `{N} seleccionadas`.
- **Error** a la derecha (solo si se intento avanzar con 0 selecciones): texto color `#FF5C8A`, tamaño 13 px, alineado derecha. Mensaje: `Elige al menos un interes.`

**Footer paso 3**: boton back + CTA `Aterrizar en Nexo` (**sin icono**). El CTA esta **disabled** si hay 0 intereses seleccionados; se activa al elegir el primero.

---

## 4. Datos backend que consume Onboarding

| Bloque | Fuente actual | Estado |
|---|---|---|
| Lista de intereses | `listInterests()` → tabla `interests` con fallback hardcoded de 6 categorias | Existe |
| Subida de avatar | `pickImage()` (expo-image-picker) + `uploadBase64Image()` al bucket `avatars` con path `${userId}/avatar.jpg` | Existe |
| Submit de onboarding | `completeOnboarding(userId, { username, displayName, bio, interestIds, avatarUrl })` → upsert en `profiles` + reset/insert en `user_interests` | Existe |
| Display name / username prellenado | `auth.profile.display_name` y `auth.session.user.user_metadata.username` si vienen del registro | Existe |
| Modo demo (`EXPO_PUBLIC_DEMO_MODE=true`) | Mock de `demoListInterests` y `demoCompleteOnboarding` con valores fallback | Existe |

Tras un submit exitoso, la app navega con `router.replace("/home")`. Si el submit falla, se loguea el error y se devuelve al usuario al mismo paso (CTA vuelve a estar habilitado, sin mensaje de error en V1 — V2 añadir toast).

---

## 5. Copy V1 (sentence case)

| Lugar | Copy |
|---|---|
| Paso 1 eyebrow | `Primer salto` |
| Paso 1 titulo | `Crea tu identidad` |
| Paso 1 subtitulo | `Elige como te vera la galaxia. Puedes cambiarlo cuando quieras.` |
| Paso 1 label progreso | `Identidad` |
| Paso 1 label avatar (sin) | `Toca para elegir una imagen` |
| Paso 1 label avatar (subiendo) | `Subiendo...` |
| Paso 1 label avatar (con) | `Toca para cambiar` |
| Paso 1 link sin avatar | `Saltar por ahora` |
| Paso 1 link con avatar | `Quitar foto` |
| Paso 1 input label | `Nombre visible` |
| Paso 1 input placeholder | `Como quieres que te llamemos` |
| Paso 2 eyebrow | `Tu firma` |
| Paso 2 titulo | `Elige tu @username` |
| Paso 2 subtitulo | `Sera tu firma dentro de Nexo. Usa letras, numeros o guion bajo.` |
| Paso 2 label progreso | `Perfil` |
| Paso 2 input username label | `Username` |
| Paso 2 input username placeholder | `tu_nombre` |
| Paso 2 input bio label | `Bio (opcional)` |
| Paso 2 input bio placeholder | `Cuenta que te mueve por aqui.` |
| Paso 3 eyebrow | `Casi listo` |
| Paso 3 titulo | `Que te mueve?` |
| Paso 3 subtitulo | `Elige al menos una categoria para encontrar comunidades afines.` |
| Paso 3 label progreso | `Intereses` |
| Paso 3 contador 0 | `Aun no has elegido nada` |
| Paso 3 contador 1 | `1 seleccionada` |
| Paso 3 contador N | `{N} seleccionadas` |
| Paso 3 error | `Elige al menos un interes.` |
| CTA pasos 1-2 | `Siguiente` |
| CTA paso 3 | `Aterrizar en Nexo` |
| Error nombre visible (vacio/corto) | `El nombre visible necesita al menos 2 caracteres.` |
| Error nombre visible (largo) | `El nombre visible no puede superar 40 caracteres.` |
| Error username (corto) | `El username necesita al menos 3 caracteres.` |
| Error username (largo) | `El username no puede superar 24 caracteres.` |
| Error username (formato) | `Usa solo letras minusculas, numeros y guion bajo.` |
| Error bio (largo) | `La bio no puede superar 160 caracteres.` |
| Error intereses | `Elige al menos un interes.` |
| Texto progreso | `Paso {N} de 3 · {Label}` |
| Contador bio | `{n}/160` |

Tono general: **conversacional, ligero, ligeramente alien**. Evita "registro", "formulario", "campo obligatorio" — usa "Primer salto", "Aterrizar en Nexo", "galaxia", "Orbitas".

---

## 6. Estados de la pantalla

### 6.1 Loading inicial

Mientras se cargan los intereses (`listInterests` esta en `isLoading`), la pantalla muestra un `LoadingState` global (no la tarjeta) con un spinner y el texto `Preparando intereses...`. Es breve (RPC simple con fallback inmediato).

### 6.2 Avatar subiendo

- El picker muestra el avatar actual + un overlay leve sobre el badge camara o un spinner pequeño sobre el avatar.
- El texto helper cambia a `Subiendo...`.
- El CTA `Siguiente` sigue activo (la subida no bloquea la navegacion del wizard, pero **si esta en curso al pulsar Siguiente**, no se debe perder la subida — V1: dejar que la subida finalice en background; el `avatarUrl` se aplica via `form.setValue` cuando termina).

### 6.3 Avatar fallback (no se pudo subir)

- Si falla la subida (catch del `uploadBase64Image`), el helper vuelve al estado anterior (sin nuevo avatar) sin mostrar error explicito al usuario en V1 (se loguea solo). V2: toast `No hemos podido subir tu imagen. Intentalo otra vez.`

### 6.4 Validacion de paso

- Cuando el usuario pulsa `Siguiente` y un campo del paso actual falla, **solo se valida ese paso** (no los siguientes). Los errores aparecen inline debajo del input correspondiente, color `#FF5C8A`, tamaño 13 px. El usuario no avanza hasta corregir.

### 6.5 CTA disabled

- Paso 3 con 0 intereses: CTA visualmente atenuado (opacidad 0.5), no clickeable.
- Resto de pasos: el CTA nunca esta disabled (la validacion ocurre al pulsar).

### 6.6 Submit en curso

- Al pulsar `Aterrizar en Nexo` en paso 3, el CTA pasa a estado loading (spinner blanco circular, sin texto).
- Boton back deshabilitado (opacidad 0.5, no clickeable).
- Tras exito: navegacion automatica a `/home` (transicion fade nativa del router).
- Tras fallo: vuelve al estado anterior. V1: sin toast. V2: añadir mensaje.

### 6.7 Reduce motion

Respetar `prefers-reduced-motion`:
- Mascota no anima.
- Estrellas estaticas a opacidad 0.8.
- Fade entre pasos desactivado (cambio instantaneo).
- Scale del card de interes desactivado.

---

## 7. Interacciones clave

| Trigger | Resultado |
|---|---|
| Tap en avatar picker | Abre picker de imagen del sistema. Si elige, sube a Supabase y actualiza preview. |
| Tap en `Saltar por ahora` | Limpia `avatarUrl` en el form (queda `null`). El avatar muestra el placeholder con inicial. |
| Tap en `Quitar foto` | Idem `Saltar por ahora`, copy distinto cuando ya hay imagen. |
| Tap en `Siguiente` (paso 1) | Valida `displayName`. Si OK, fade a paso 2. |
| Tap en `Siguiente` (paso 2) | Valida `username` + `bio`. Si OK, fade a paso 3. |
| Tap en card de interes | Toggle de seleccion (mete/saca de `interestIds`). Animacion scale 1.04 si selecciona. |
| Tap en `Aterrizar en Nexo` (paso 3) | Valida que `interestIds.length >= 1`. Si OK, submit a Supabase y navega a `/home`. |
| Tap en boton back | Fade al paso anterior. No pierde datos del paso actual (el form los conserva). |
| Tab navigation teclado | Orden: avatar → input(s) → cards de interes en orden de lectura → boton back → CTA. |
| Reduce motion activado | Desactiva mascota anim, fade entre pasos, scale de cards, parpadeo de estrellas. |

---

## 8. Responsive — breakpoints

Onboarding es **una tarjeta centrada**. No tiene layouts radicalmente distintos por breakpoint, solo el ancho de la tarjeta cambia.

| Ancho viewport | Comportamiento |
|---|---|
| < 360 px | Tarjeta ocupa ~96% del ancho. Padding interior reducible a 20 px si es necesario para que el grid de 3 columnas siga cabiendo. |
| 360 - 539 px | Tarjeta ocupa 100% - 24 px de padding lateral del viewport. Grid de intereses 3x2. |
| 540 - 979 px | Tarjeta fija en 540 px de ancho, centrada con margenes laterales crecientes. |
| 980 - 1199 px | Idem. Mas espacio lateral oscuro. **No se añade sidebar ni topbar.** |
| >= 1200 px | Idem. La tarjeta nunca crece mas alla de 540 px. |

> Decision: el ancho maximo de la tarjeta (540 px) es **intencionalmente estrecho** para que la pantalla se sienta intima y no quede vacia en desktop. El espacio negro alrededor es parte del diseño cosmico.

---

## 9. Accesibilidad

- **Hit targets** minimo 44x44 px (avatar picker 140x140, badge camara 34x34 **dentro** del picker = OK porque el tap principal es el picker). Cards de interes ~110x96 px = OK.
- **Contraste**: texto `#F6F7FB` sobre tarjeta `rgba(9,12,28,0.78)` cumple WCAG AA (contraste > 13:1). `#B9C1D9` y `#8490B4` cumplen AA en cuerpo. `#FF5C8A` para errores tiene contraste suficiente.
- **Foco visible**: cada input y boton debe mostrar outline al recibir foco por teclado (web). Outline color `#18D7FF` 2 px, offset 2 px.
- **Lectores de pantalla**:
  - Mascota: `accessibilityRole="image"` con label `Mascota Nexo`.
  - Avatar picker: `accessibilityRole="button"`, label `Elegir avatar`.
  - Saltar/quitar: `accessibilityLabel="Saltar foto por ahora"` / `"Quitar foto"`.
  - Cards de interes: `accessibilityRole="button"`, `accessibilityState={{ selected: true|false }}`, label `Interes {nombre}[ seleccionado]`.
  - Boton back: `accessibilityLabel="Paso anterior"`.
  - CTA: el texto ya describe la accion.
- **Reduced motion**: respetar `prefers-reduced-motion` segun §6.7.
- **Etiquetas de error** asociadas a su input (programaticamente, `aria-describedby` en web).

---

## 10. Decisiones cerradas (no volver a abrir)

- **3 pasos exactos** en V1: identidad, perfil, intereses. No partir mas, no fusionar.
- **Avatar opcional**, todo lo demas obligatorio salvo bio.
- **Username con prefijo `@` cyan** visible dentro del input como adorno, no parte del valor.
- **Bio max 160 chars** con contador siempre visible. No cambiar el limite.
- **6 categorias de interes** fijas en V1, con emojis listados en §3.3.1.
- **Sentence case** en todos los textos. Sin UPPERCASE.
- **Mascota Nexo presente** en la tarjeta. Es la pantalla mas "marca" de la app — la mascota debe sentirse cerca.
- **Una sola tarjeta con fade entre pasos**. No carousel horizontal, no slide-in lateral.
- **Sin TopBar / Sidebar / BottomNav** durante onboarding.
- **Dark mode unico** — onboarding no respeta el toggle de tema (solo dark). La transicion auth → home debe ser una continuidad cosmica.
- **`Aterrizar en Nexo` es la accion final**. No usar `Terminar`, `Listo`, `Empezar`.
- **El gradiente del anillo del avatar** es siempre violeta → cyan, incluso si el tema cambiase. Es marca.
- **Acción primaria = avanzar**. El boton back es secundario visualmente (cuadrado, fondo casi transparente).

---

## 11. Reglas de oro para la IA de diseno

1. **La tarjeta es la unica pieza interactiva**. El fondo cosmico es atmosfera, no debe competir.
2. **No añadas pasos extra**. Si crees que falta algo (email verification, terms acceptance, etc.), registra como propuesta V2 — no lo metas.
3. **Sentence case siempre**. No experimentes con UPPERCASE en eyebrows ni labels.
4. **El violeta `#7B5CFF` marca accion** (CTA, dot activo, badge camara, halo de selección). El cyan `#18D7FF` marca eyebrow, prefijo `@` y borde de card seleccionada. No mezcles roles.
5. **Mascota Nexo solo en el header de la tarjeta**, no en el fondo ni dentro de los step bodies.
6. **Pinta los 3 pasos y los estados** (loading, validacion error, avatar subiendo, CTA disabled). Mockups separados.
7. **Spacing en multiplos de 4 u 8**. La escala existente: 4, 8, 12, 16, 24, 32, 48.
8. **No toques la altura minima del step body** (280 px). Es lo que evita que el footer salte entre pasos.
9. **No inventes campos backend** (no añadas "edad", "ciudad", "genero"...). Si lo crees necesario, registralo como propuesta V2.
10. **Coordina con `SCREEN_HOME.md`**. La transicion al pulsar `Aterrizar en Nexo` debe sentirse continua: el fondo cosmico de onboarding debe poder "morphear" hacia la galaxia de Home (mismo lenguaje visual de estrellas y oscuro casi-negro).
11. **Coordina con login/register**. La misma tarjeta blur + estrellas + mascota se usa en auth (`AuthCosmicScaffold`). Mantén consistencia con esa familia visual; onboarding es la "tercera escena" de un mismo decorado.

---

## 12. Mapa rapido de archivos relacionados

```
app/onboarding.tsx                                              ruta expo-router
src/features/auth/screens/OnboardingScreen.tsx                  screen completa (wizard + steps + backdrop)
src/features/auth/services/auth-service.ts                      listInterests, completeOnboarding, FALLBACK_INTERESTS
src/utils/validation.ts                                         onboardingSchema (zod)
src/components/brand/NexoMascot.tsx                             mascota
src/components/ui/Avatar.tsx                                    avatar redondo con fallback inicial
src/components/ui/Button.tsx                                    boton primary (CTA Siguiente / Aterrizar en Nexo)
src/components/ui/TextInput.tsx                                 input estandar con label, icon, error
src/components/ui/LoadingState.tsx                              loading global mientras carga intereses
src/components/layout/ScreenContainer.tsx                       contenedor con scroll opcional
src/services/storage-service.ts                                 pickImage, uploadBase64Image (bucket avatars)
src/theme/tokens.ts                                             paleta dark, spacing, radius, typography
```

---

## 13. Checklist para Figma

Lo minimo que tiene que entregar la IA de diseno para considerar Onboarding V1 cerrado:

### Frames

1. **Mobile compacto** (375 px) — paso 1 happy path con avatar vacio.
2. **Mobile compacto** (375 px) — paso 1 happy path con avatar elegido.
3. **Mobile compacto** (375 px) — paso 2 happy path con username y bio escritos (contador `87/160`).
4. **Mobile compacto** (375 px) — paso 3 happy path con 3 cards seleccionadas (Arte, Gaming, Tecnologia).
5. **Mobile compacto** (375 px) — paso 3 con 0 selecciones y CTA disabled.
6. **Desktop balanced** (1280 px) — paso 1, 2 y 3 (mismo trio happy path, tarjeta centrada).
7. **Tablet** (768 px) — paso 3 (validar que el grid 3x2 cabe sin recortes).

### Estados

8. Loading inicial (`Preparando intereses...`).
9. Avatar subiendo (helper `Subiendo...`).
10. Validacion error paso 1 (input vacio).
11. Validacion error paso 2 (username con caracter invalido).
12. CTA en estado loading (submit en curso).

### Detalles / micro-componentes

13. Progress indicator — 3 variantes (paso 1, 2, 3) mostrando dots activos/completados/pendientes.
14. Card de interes — 4 variantes: idle, hover (web), pressed, selected.
15. Avatar picker — 3 variantes: sin imagen (placeholder con inicial), con imagen, subiendo.
16. Input con prefijo `@` en cyan.
17. Bio textarea con contador en estado normal y near-limit (color warning).
18. CTA — variantes: idle, hover, pressed, disabled, loading.
19. Boton back cuadrado — idle, hover, pressed.

### Backdrop

20. Especificacion del gradiente (5 stops, diagonal) + distribucion aprox. de las 36 estrellas + dos vignettes (top, bottom).

### Copy

21. Confirmar todos los strings del §5.

### Reduced motion

22. Variante estatica del fondo cosmico (estrellas sin parpadeo) para mostrar como se ve la pantalla con reduce-motion activo.

---

## 14. Que sigue despues

Onboarding desemboca en **Home** (`SCREEN_HOME.md`). La transicion debe sentirse como un aterrizaje: cuando el usuario pulsa `Aterrizar en Nexo`:

1. El CTA muestra spinner ~400-800 ms (submit real).
2. Cross-fade del fondo (las estrellas se mantienen, la tarjeta se desvanece).
3. Aparece `GalaxyOrbitMap` con planetas en Home — idealmente con una animacion de entrada de los planetas (V2 si complejo, V1 puede ser un fade simple).

Los siguientes documentos en orden de prioridad son los mismos que en `SCREEN_HOME.md §15`: detalle de Orbita, detalle de Senal, chat, perfil, etc.
