# Roadmap de Nexo

Este roadmap prioriza trabajo incremental. No implica redisenar todo: cada fase debe preservar lo que ya funciona.

## Fase 1 - Estabilizar MVP

Objetivo: que los flujos principales sean fiables en mobile y web.

- Revisar responsive mobile de home, explorar, crear Orbita, detalle de Orbita, chat y perfil.
- Ejecutar `npm run typecheck`, `npm run lint`, `npm test` y export web.
- Pulir estados loading/error/empty.
- Confirmar modo demo tras cambios.
- Revisar navegacion profunda y back behavior.
- Corregir copy sin acentos o inconsistencias si se decide normalizar idioma.

## Fase 2 - Sistema orbital

Objetivo: convertir home en la diferencia real de Nexo.

- Mejorar legibilidad de planetas en pantallas pequenas.
- Afinar panel/bottom sheet de detalle.
- Reducir solapamientos y ruido visual.
- Anadir senales utiles: nuevos posts, chat activo, eventos, misiones.
- Optimizar animaciones y respetar reduced motion.
- Preparar tests o smoke checks visuales si se automatiza web.

## Fase 3 - Mobile-first UX

Objetivo: que Nexo se sienta nativo y comodo en movil.

- Extender bottom sheets a filtros de explorar, acciones de post y acciones de perfil.
- Revisar formularios con teclado abierto.
- Mejorar hit targets y separacion del bottom nav.
- Crear patrones de header movil para rutas profundas.
- Mejorar chat composer y scroll.

## Fase 4 - Perfiles e identidad

Objetivo: que cada usuario tenga identidad social clara.

- Renderizar banner real de perfil.
- Permitir subir/cambiar banner en `EditProfileScreen`.
- Mostrar intereses, Orbitas, stats y actividad.
- Mostrar estado real de follow/unfollow.
- Pantalla de bloqueos y preferencias de privacidad.
- Perfiles por Orbita mas ricos: rol, aportes, reputacion comunitaria.

## Fase 5 - Chats

Objetivo: completar conversacion en tiempo real.

Avance 2026-05-25: el esquema "chats v2" esta listo (multiples canales por orbita, roles dentro del chat, pinned, audit log, reactions, slow mode, mute, last_read_at) y la UI desde cero esta entregada. Falta polish y reactivos.

- [x] Multiples canales por Orbita.
- [x] Herramientas de moderacion en chat (transfer admin, promote co-admin, kick, ban, pin, audit log).
- [x] Slow mode anti-spam.
- [x] Ban con `role = 'banned'` que bloquea envio.
- [x] `last_read_at` por miembro.
- [ ] `last_message` real en `listConversations`.
- [ ] Unread counts derivados de `last_read_at`.
- [ ] Read receipts visibles.
- [ ] Typing indicators (Realtime Presence).
- [ ] Adjuntos/media (subir imagenes desde composer).
- [ ] UI de reactions (picker + counts en bubble).
- [ ] @mentions con notificacion.
- [ ] Realtime de pinned + reactions (ahora solo messages).
- [ ] `ChatSettingsScreen` (editar config + audit log + borrar chat).
- [ ] Aplicar `banner_url` del chat como fondo del MessageList.
- [ ] Mejor soporte para conversaciones directas.
- [ ] App-level: limite 5 chats activos por usuario por orbita.
- [ ] Long-press para acciones en mobile (ahora hover web).

## Fase 6 - Moderacion y seguridad

Objetivo: comunidades sanas y administrables.

- Detalle de reporte con preview del contenido.
- Filtros por estado, target y Orbita.
- Acciones: warning, ocultar, borrar, mute, kick, ban.
- Historial/auditoria de acciones.
- UI para roles y permisos.
- Tests de RLS y RPC.
- Rate limiting en Edge Functions para acciones sensibles.

## Fase 7 - Presencia online real

Objetivo: reemplazar conteos aproximados por presencia autentica.

- Definir estrategia: Realtime Presence, heartbeat a `last_seen_at` o mixto.
- Actualizar `last_seen_at` con frecuencia razonable.
- Mostrar online/ausente/offline.
- Respetar privacidad del usuario.
- Usar presencia en chats, Orbitas y sidebar.

## Fase 8 - Onboarding y descubrimiento

Objetivo: que el usuario llegue rapido a comunidades relevantes.

Avance 2026-05-25: onboarding rediseñado como wizard de 3 pasos con backdrop cosmico, mascota, emojis en intereses, copy conversacional. Falta la parte de descubrimiento posterior.

- [x] Wizard multi-step con progress.
- [x] Seleccion de intereses con emojis.
- [x] Saltar foto / quitar foto.
- [x] Validacion incremental por paso.
- [x] Trigger auto-create profile al hacer login con Google (migracion 005).
- [ ] Recomendar Orbitas por intereses al terminar.
- [ ] Sugerir primeras acciones.
- [ ] Username availability check live (con debounce y respeto de RLS).
- [ ] Medir puntos de abandono.

## Fase 9 - Deploy web y publicacion

Objetivo: preparar Nexo para usuarios reales.

- `npx expo export --platform web`.
- QA de `dist`.
- Configurar hosting web.
- Configurar EAS project real.
- Push notifications con FCM/APNs.
- Politica de privacidad, terminos, soporte y Data Safety.
- Revisar `eas.json`, package ids y metadata.

## No prioridades por ahora

- Redisenar toda la app.
- Cambiar de stack.
- Meter un sistema de estilos nuevo sin necesidad.
- Reemplazar Supabase.
- Crear landing marketing antes de cerrar experiencia principal.
