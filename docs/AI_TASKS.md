# AI_TASKS - Lista operativa para futuras sesiones

Usa este archivo como backlog practico. Marca o actualiza tareas cuando se completen.

## Antes de tocar codigo

- [ ] Leer `AGENTS.md`.
- [ ] Leer `docs/PROJECT_CONTEXT.md`.
- [ ] Leer `docs/ARCHITECTURE.md`.
- [ ] Leer `docs/DESIGN_SYSTEM.md`.
- [ ] Consultar Expo SDK 56: https://docs.expo.dev/versions/v56.0.0/
- [ ] Revisar `git status --short`.
- [ ] Confirmar si el cambio afecta modo demo.

## Validacion base

- [ ] Ejecutar `npm run typecheck` tras cambios TS/TSX.
- [ ] Ejecutar `npm run lint` tras cambios de codigo.
- [ ] Ejecutar `npm test` si se toca validacion, utils, servicios o logica.
- [ ] Ejecutar `npx expo export --platform web` si se toca navegacion, web o release.
- [ ] Probar mobile y desktop cuando se toca UI.

## Tareas de producto prioritarias

- [ ] Pulir responsive mobile del sistema orbital.
- [ ] Revisar solapamientos y legibilidad en `GalaxyOrbitMap`.
- [ ] Extender bottom sheets a filtros de explorar y acciones contextuales.
- [ ] Mejorar perfil con banner real en vista y edicion.
- [ ] Mostrar intereses y Orbitas en perfiles.
- [ ] Completar `last_message` real en lista de chats Supabase.
- [ ] Anadir unread counts en chats.
- [ ] Mejorar chat composer con teclado y scroll.
- [ ] Convertir `online_count` aproximado en presencia real.
- [ ] Mejorar cola de moderacion con preview del contenido reportado.
- [ ] Crear UI para gestion de roles.
- [ ] Crear UI para gestionar bloqueos.
- [ ] Mejorar onboarding con recomendaciones de Orbitas.
- [ ] Preparar deploy web documentado.

## Tareas tecnicas

- [ ] Revisar que todo servicio nuevo tenga rama demo si afecta flujos principales.
- [ ] Mantener query keys consistentes e invalidaciones despues de mutations.
- [ ] Evitar consultas Supabase directas en componentes compartidos.
- [ ] Revisar RLS antes de confiar en permisos de UI.
- [ ] Actualizar `src/types/database.ts` si cambia schema.
- [ ] Agregar tests a validaciones o utils cuando se cambien reglas.
- [ ] Revisar Storage policies si se agregan nuevos buckets o rutas.
- [ ] Documentar migraciones nuevas en `docs/ARCHITECTURE.md`.

## Tareas de diseno

- [ ] Mantener dark/cosmico/alien como direccion visual.
- [ ] Evitar UI generica tipo dashboard.
- [ ] No saturar con glow/gradientes.
- [ ] Revisar contraste de texto sobre fondos cosmicos.
- [ ] Usar `lucide-react-native` para iconos.
- [ ] Reutilizar `Button`, `TextInput`, `GradientCard`, `BottomSheet`, `Badge`, `Avatar`.
- [ ] Revisar que el bottom nav no tape contenido.
- [ ] Revisar que textos largos no rompan cards o botones.

## Tareas de seguridad

- [ ] No introducir secrets ni service role keys.
- [ ] No guardar claves privadas en `.env.example`.
- [ ] Mantener RLS como autoridad final.
- [ ] Sanitizar texto de usuario.
- [ ] Validar formularios con Zod.
- [ ] No usar imagenes protegidas como assets oficiales.
- [ ] Revisar reportes/bloqueos al tocar perfiles, posts, chats o comunidades.

## Ideas futuras

- [ ] Misiones/eventos como entidad propia dentro de Orbitas.
- [ ] Canales multiples por Orbita.
- [ ] Reputacion comunitaria.
- [ ] Notificaciones push por mencion/respuesta/chat.
- [ ] Busqueda global de posts, Orbitas y usuarios.
- [ ] Moderation audit log.
- [ ] Web SEO/metadata para Orbitas publicas.
