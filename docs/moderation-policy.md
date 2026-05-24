# Politica de moderacion

Nexo permite contenido generado por usuarios. La version inicial incluye reporte, bloqueo, ocultacion y cola de revision para moderadores.

## Motivos de reporte

- Acoso.
- Spam.
- Contenido sexual.
- Odio o violencia.
- Suplantacion.
- Informacion privada.
- Otro.

## Normas base

- Respeta a otras personas y evita ataques personales.
- No publiques informacion privada propia o ajena.
- No suplantes identidades.
- No compartas spam, enlaces maliciosos o estafas.
- Usa avisos de contenido cuando una Orbita lo requiera.
- Sigue las normas especificas de cada Orbita.

## Flujo de reporte

1. Una persona reporta post, comentario, mensaje, perfil o comunidad.
2. El reporte queda en estado `open`.
3. Moderadores correspondientes pueden revisar la cola.
4. Pueden ocultar contenido, advertir a usuarios o resolver/rechazar el reporte.
5. Las acciones sensibles dependen de RLS y no del cliente.

## Bloqueos

Bloquear reduce visibilidad basica entre cuentas y se aplica en politicas RLS para perfiles y contenido. En produccion conviene ampliar esto con busquedas, recomendaciones y notificaciones.

## Escalada

Casos graves deben escalarse a soporte: amenazas creibles, explotacion, doxxing, menores, autolesion o actividad ilegal. En produccion, estas acciones deben apoyarse en Edge Functions, auditoria y procesos internos.
