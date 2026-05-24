# Sistema de diseno de Nexo

## Identidad visual

Nexo debe sentirse como una red social cosmica, viva y un poco alien. La interfaz no debe parecer una plantilla SaaS fria ni una red social generica.

Palabras guia:

- oscuro
- orbital
- cosmico
- alien
- luminoso
- social
- seguro
- expresivo

La mascota alien (`NexoMascot`) funciona como ancla emocional. Debe aparecer en onboarding, estados vacios o momentos de marca, sin saturar pantallas operativas.

## Paleta actual

Los tokens estan en `src/theme/tokens.ts`.

Modo dark principal:

- `background`: `#090A12`
- `surface`: `#121427`
- `elevated`: `#1B1E35`
- `border`: `#2A2E49`
- `primary`: `#7C5CFF`
- `secondary`: `#00D4FF`
- `accent`: `#FF4FD8`
- `success`: `#37E29F`
- `warning`: `#FFB020`
- `error`: `#FF5C7A`
- `text`: `#F4F7FB`
- `textMuted`: `#A8B0C3`
- `textFaint`: `#747D97`

Modo light existe en tokens, pero dark es la experiencia principal y mas cuidada.

## Tipografia y espaciado

Tokens actuales:

- `title`: 28
- `h1`: 24
- `h2`: 20
- `h3`: 17
- `body`: 15
- `small`: 13
- `tiny`: 11

Spacing:

- `xs`: 4
- `sm`: 8
- `md`: 12
- `lg`: 16
- `xl`: 24
- `2xl`: 32
- `3xl`: 48

Radios:

- `xs`: 4
- `sm`: 6
- `md`: 8
- `lg`: 12
- `pill`: 999

Regla: no escalar fuentes con el ancho de viewport. Ajusta layout, wrapping y densidad antes que inflar o reducir tipografia con formulas.

## Componentes base

Usa antes de crear nuevos:

- `Button`
- `TextInput`
- `Badge`
- `TagPill`
- `SectionTabs`
- `GradientCard`
- `BottomSheet`
- `Avatar`
- `NexoMark`
- `NexoMascot`
- `LoadingState`
- `ErrorState`
- `EmptyState`
- `AlienEmptyState`
- `ScreenContainer`
- `CommunityCard`
- `PostCard`
- `ReportModal`
- `RoleBadge`
- `OnlineUsersBar`
- `GalaxyOrbitMap`

## Estilo visual

Usar:

- Gradientes cosmicos con violeta/cian/magenta/verde.
- Glow sutil para elementos activos.
- Glassmorphism controlado con `expo-blur` donde tenga sentido.
- Bordes finos y contraste suave.
- Particulas/estrellas sutiles en pantallas inmersivas.
- Iconos Lucide en acciones.
- Estados vacios con personalidad alien.
- Tarjetas con informacion clara, no decoracion vacia.

Evitar:

- Interfaces blancas/genericas tipo dashboard corporativo.
- Redisenos completos sin pedido explicito.
- Saturar todo con gradientes.
- Fondos demasiado ruidosos que reduzcan legibilidad.
- Paletas monotono violeta o azul oscuro sin acentos.
- Cards dentro de cards.
- Hero/landing marketing como primera pantalla de app.
- Imagenes stock o protegidas como assets oficiales.
- Copy demasiado serio, frio o institucional.

## Pantallas principales

### Home / sistema orbital

Debe ser la senal mas distintiva de Nexo. `GalaxyOrbitMap` muestra Orbitas como planetas, con actividad, online, posts, chat y acciones. En desktop puede ser mas panoramico; en movil debe priorizar legibilidad y seleccion rapida.

Mantener:

- fondo espacial inmersivo
- planetas/Orbitas con color por categoria
- senales de actividad
- detalle contextual con acciones
- bottom sheet en movil

Pulir:

- solapamientos en pantallas pequenas
- jerarquia de texto
- rendimiento de animaciones
- estados de loading/empty/error

### Explorar

Debe sentirse como radar de comunidades, no como lista simple. Usa hero contextual, filtros, chips de categoria, grid de `CommunityCard` y panel derecho solo en desktop ancho.

Breakpoints actuales:

- dos columnas desde `width >= 1180`
- panel derecho desde `width >= 1240`

### Crear Orbita

Debe transmitir identidad y control. Incluye preview visual de avatar/banner, categoria, descripcion, reglas y visibilidad. Mantener el flujo claro en movil.

### Detalle de Orbita

Debe sentirse como pagina de comunidad:

- banner o gradiente
- avatar levantado
- badges de categoria/miembros/rol
- acciones: unirse/salir, publicar, chat
- barra online
- tabs: posts, chats, miembros, normas, gestion si aplica

### Perfil

Debe evolucionar hacia una identidad mas rica. Ya soporta perfil por comunidad, rol y posts filtrados. Pendiente: banner real, stats, intereses, Orbitas y gestion social mas completa.

### Chat

Debe ser rapido y claro. Actualmente usa lista de conversaciones y sala con composer fijo. Falta pulir ultimo mensaje real, estados de lectura, media y canales.

## Responsive

Reglas actuales:

- `AppNavigationFrame` usa sidebar desde `width >= 980`.
- En movil usa `AppBottomNav` con espacio inferior reservado.
- `GalaxyOrbitMap` cambia a modo compacto con `width <= 768`.
- `ScreenContainer` limita ancho con `maxContentWidth`.
- Discover usa grid/panel derecho segun ancho.

Reglas de trabajo:

- Prioriza mobile si hay conflicto.
- Comprueba que botones y textos no se solapen.
- Los tabs/chips deben wrappear con dignidad.
- El bottom nav no debe tapar formularios o listas.
- Usa `paddingBottom` suficiente en listas con composer/nav fijo.
- Manten touch targets comodos.

## Accesibilidad y UX

- Usa `accessibilityRole`, `accessibilityLabel` y estados cuando corresponda.
- Manten contraste alto en texto.
- Los botones iconicos necesitan label accesible.
- Respeta `useReducedMotion` o reduce animaciones cuando aplique.
- Los errores de formularios deben ser visibles junto al campo.
- Los estados loading/error/empty deben permitir continuar o reintentar.

## Assets

Assets oficiales actuales:

- `assets/logo/nexo-logo.svg`
- `assets/logo/nexo-icon.svg`
- iconos/splash/adaptive icons en `assets/logo/`
- mascota vectorial generada en codigo con `react-native-svg`

No incorporar assets externos protegidos. Para nuevos visuales de marca, preferir SVG propio, generacion controlada o assets con licencia clara.
