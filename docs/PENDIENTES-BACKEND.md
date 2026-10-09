# Contrato pendiente antes de producción

El frontend y backend son repositorios separados. Esta revisión no modifica Laravel.

## Bloqueantes

1. **Secciones asignadas a docente:** definir relación docente-sección y aplicar el alcance en listados, detalle, estudiantes, reporte y generar QR. Un docente debe recibir 403/404 al consultar una sección ajena por ID. Actualmente los permisos son globales. Filtrar solo en Vue no protege la información.
2. **Horarios:** permitir al administrador asignar un horario activo al crear/editar sección (horario_id), exponerlo en su recurso y ofrecer catálogo. Matutino 07:00–12:00. Confirmar cierre vespertino: 17:00 o 18:00, inicio 13:00. No asumir ese dato ni tolerancia desde frontend.
3. **Perfil autenticado:** endpoint protegido con ID, nombres, rol y, para alumno, grado/sección. El frontend muestra perfil pendiente en vez de datos inventados.
4. **Asistencia AUSENTE:** actualmente se guarda y después responde 403, sin recurso. Acordar respuesta de operación registrada con estado y recurso; reservar 403 para acceso rechazado. El frontend vuelve a consultar historial en 403/409, pero no corrige la semántica HTTP.

## Seguridad y consistencia

- Aplicar limitación de intentos en login, usuario activo y rol activo.
- Separar permisos de generación QR (docente/admin) y marcado (alumno).
- Renovación: /auth/refresh debe tener un contrato que permita renovación después de expirar access_token. Por ahora frontend pide nuevo login al recibir 401.
- No devolver mensajes internos de Throwable al cliente. Frontend oculta mensajes 5xx, pero la respuesta original sigue siendo visible en la red.
- Registrar errores en logs; resolver colisiones del índice único estudiante/fecha como 409, no 500.
- Revalidar sección/horario activos y que el horario del QR coincide con la asignación vigente al registrar.
- Acordar si el QR expira por horario o solo por fecha. Cualquier alumno con asistencia.mark puede llamar actualmente a generar QR si no existe otro control.
- Las ausencias sin escaneo no se generan automáticamente en la lógica revisada. Los porcentajes del frontend solo cuentan registros, no calendario escolar.
- Definir cambio obligatorio de contraseña temporal y recuperación de contraseña.

## Preparación EC2

HTTPS, CORS exacto, APP_DEBUG=false, PHP compatible con composer.lock, Imagick y extensiones requeridas, MySQL privado con usuario limitado, migraciones ensayadas, permisos de storage/bootstrap/cache y backups restaurables. Conservar claves de aplicación durante despliegues; no regenerar APP_KEY indiscriminadamente.

No aprobar producción hasta probar docente-sección ajena, horarios y ausencia registrada.
