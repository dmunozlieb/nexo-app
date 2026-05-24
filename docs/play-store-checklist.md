# Checklist Play Store

## Configuracion Android

- Nombre app: Nexo.
- Slug Expo: `nexo`.
- Package: `com.nexo.social`.
- Build production: Android App Bundle con EAS.
- Permisos minimos: no se declaran permisos extra en config.
- Target SDK: gestionado por Expo SDK 56 con Android SDK 36.
- Adaptive icon y splash generados en `assets/logo`.

## Requisitos de tienda

- Politica de privacidad publica y enlazada en Play Console.
- Terminos de uso.
- Email o formulario de soporte.
- Formulario Data Safety completado.
- Cuenta de prueba para revision si hay login.
- Explicacion de UGC, reportes, bloqueo y moderacion.
- Capturas reales de la app, no mockups con contenido enganoso.
- Clasificacion de contenido.
- Declaracion de publicidad si aplica.

## UGC y seguridad

- Reportar contenido dentro de la app.
- Bloquear usuarios.
- Moderadores pueden ocultar contenido y resolver reportes.
- Normas comunitarias visibles en docs y recomendadas por Orbita.
- Procedimiento para eliminar cuenta documentado.
- Moderacion humana definida antes de apertura publica.

## Antes de produccion

- Configurar dominio, privacidad y soporte.
- Revisar `npm audit` y dependencias nativas.
- Ejecutar pruebas en Android fisico de gama baja/media.
- Verificar accesibilidad: contraste, labels, foco, tamanos tactiles.
- Confirmar que Supabase RLS esta activo en todas las tablas.
- Crear backups y retencion de logs.
