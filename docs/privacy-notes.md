# Notas de privacidad

Este documento no sustituye una politica de privacidad legal. Resume decisiones tecnicas para preparar esa politica.

## Datos tratados

- Email y datos de sesion mediante Supabase Auth.
- Perfil publico: username, display name, bio, avatar y banner.
- Intereses elegidos.
- Comunidades, membresias, posts, comentarios, reacciones y guardados.
- Mensajes de conversaciones donde el usuario sea miembro.
- Reportes, bloqueos y notificaciones internas.

## Variables y secretos

La app solo debe incluir:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Nunca incluir service role keys, claves privadas ni tokens de moderacion en el cliente.

## Retencion y eliminacion

Preparar un flujo de eliminacion de cuenta que:

- Elimine o anonimice perfil.
- Preserve reportes necesarios para seguridad si la ley lo permite.
- Borre assets propios de Storage.
- Revise mensajes y contenido publicado segun terminos.

## Seguridad recomendada

- Mantener RLS en todas las tablas.
- Usar Edge Functions para acciones sensibles y rate limiting.
- Registrar acciones de moderacion en una tabla de auditoria antes de produccion.
- Validar archivos por tipo, tamano y contexto.
- Revisar dependencias y CVEs antes de cada release.
