# Acuerdos de integración del sistema de asistencia

Destinatario: equipo backend  
Remitente: equipo frontend  
Fecha: 8 de octubre de 2026

Necesitamos cerrar cuatro contratos antes del despliegue: secciones asignadas a docentes, asignación de horarios, perfil del alumno y respuesta al registrar ausencia. El administrador seguirá decidiendo y registrando las asignaciones manualmente. Laravel debe guardar esas decisiones, devolverlas por API y validar quién puede acceder a ellas.

## Alcance de la revisión

Se revisó la copia local ubicada en C:/Trabajos de la U/ProyectoAsistenciaQR-master/ProyectoAsistenciaQR-master. No se modificó el backend. Los hallazgos corresponden a ese código, no a una rama o servidor que no se haya compartido. Si existe otra implementación, solicitamos rama o commit, endpoints y una prueba reproducible para actualizar el diagnóstico.

## Secciones asignadas a docentes

En la copia revisada no encontramos una relación docente–sección. SeccionController.index filtra por grado y estado; AsistenciaController.reporte consulta asistencias sin limitar por docente autenticado. Tener el permiso de consultar secciones no equivale a comprobar que una sección le pertenece.

El administrador puede seleccionar manualmente el docente y la sección. Necesitamos que esa relación se persista y que Laravel aplique el alcance a listados, detalles, estudiantes, reportes y generación de QR.

Propuesta de contrato, pendiente de acuerdo:

- Operación administrativa para asignar y retirar docentes de una sección.
- Listado de secciones limitado al docente autenticado; administrador con alcance global.
- Rechazo 403 o 404, según política acordada, cuando el docente solicita un ID ajeno.
- Definir si una sección tiene uno o varios docentes y cómo se trata una asignación inactiva.

Prueba de aceptación: asignar sección A al docente 1 y B al docente 2. Con token del docente 1, verificar que A aparece y B no; solicitar B directamente y comprobar rechazo en todos los endpoints afectados. El filtrado solo en Vue no cumple esta prueba.

Evidencia a revisar: routes/api.php, app/Models/Seccion.php, app/Http/Controllers/SeccionController.php y app/Http/Controllers/AsistenciaController.php.

## Horarios y asignación manual

Existen Horario, Seccion.horario y horario_id. El modelo permite asignarlo, pero StoreSeccionRequest y UpdateSeccionRequest no lo incluyen en sus reglas; los controladores guardan los datos validados. Enviar horario_id desde Vue no garantiza que se guarde. Tampoco encontramos rutas para consultar el catálogo de horarios.

HorarioSeeder define Matutino 07:00–12:00 y Vespertino 13:00–18:00, ambos con 10 minutos de tolerancia. Estos valores son datos iniciales del código, no una confirmación del contenido actual de MySQL. Confirmar con el responsable funcional la salida vespertina y la tolerancia.

Solicitamos un catálogo de horarios activos, aceptar horario_id al crear/editar sección, validar su existencia y estado, y devolver el horario asignado en SeccionResource. No se requiere asignación automática: el administrador escogerá la jornada en un formulario.

Prueba de aceptación: crear una sección con horario, recargar la aplicación, consultar el detalle y generar QR. Editar la jornada y confirmar que el cambio queda persistido. Probar un horario inexistente o inactivo y esperar validación 422.

Evidencia: app/Models/Horario.php, app/Models/Seccion.php, app/Http/Requests/StoreSeccionRequest.php, app/Http/Requests/UpdateSeccionRequest.php, app/Http/Resources/SeccionResource.php y database/seeders/HorarioSeeder.php.

## Perfil del alumno autenticado

User tiene relación con Estudiante y el recurso del estudiante contiene nombres y sección. Sin embargo, el login entrega data.token con tokens y rol; no encontramos un endpoint para obtener el perfil del usuario autenticado.

Proponemos GET /api/v1/auth/me, o un endpoint equivalente acordado, que identifique al usuario a partir del token y devuelva su nombre, rol y, cuando corresponda, estudiante, grado y sección. El nombre de la ruta es una propuesta, no una ruta existente.

El administrador puede registrar esos datos. El endpoint solo permite que el alumno vea sus datos actuales, sin pedirle que conozca un ID interno ni descargar listados globales para localizarse.

Prueba de aceptación: iniciar sesión con dos alumnos y comprobar que cada token devuelve su propio perfil. Cambiar la sección desde administración y verificar que el perfil se actualiza al consultar nuevamente. El rol Alumno por sí solo no identifica nombre o grado.

## Ausencia registrada y respuesta HTTP

ReglaAsistenciaService clasifica como PRESENTE hasta la hora de entrada, TARDIA después de entrada y hasta el límite de tolerancia, y AUSENTE después de ese límite. Con el seeder matutino, 07:00 es PRESENTE, 07:05 es TARDIA y 07:11 es AUSENTE. La hora de salida no interviene en esta regla.

AsistenciaController.registrar guarda el registro, confirma la transacción y, si el estado es AUSENTE, devuelve 403 sin el recurso. El cliente recibe un error aunque se modificó la base. Un segundo intento puede responder 409 porque el registro ya existe.

Solicitamos una respuesta exitosa de creación, por ejemplo 201, con success, message y el recurso en data, incluido estado=AUSENTE. Reservar 403 para una operación no autorizada. Si se acuerda otra semántica, documentarla y devolver explícitamente el resultado persistido.

El frontend recarga el historial en 403/409 para reducir la inconsistencia visual. Esta medida no corrige el contrato HTTP y no debe usarse para declarar resuelto el problema.

No encontramos generación automática de ausencias para alumnos que no escanean. Decidir si eso forma parte del alcance y quién lo ejecutará. Un porcentaje sobre registros existentes no representa todos los días del calendario escolar.

Prueba de aceptación: registrar fuera de tolerancia y comprobar una fila persistida, recurso y estado en la respuesta; repetir y comprobar 409 sin una segunda fila. No ejecutar esta prueba contra datos de producción.

## Acuerdos que deben quedar registrados

Para cada punto, anotar responsable, rama o commit, endpoint, esquema de respuesta, fecha de entrega y prueba de aceptación. Si ya está implementado en otra versión, demostrarlo en esa versión y compartir el contrato. Frontend adaptará formularios y servicios después de confirmar los endpoints.

La aprobación de producción requiere completar estas pruebas, además de HTTPS, CORS, sesión y verificación en Linux. Una respuesta 200 en Swagger no demuestra por sí sola persistencia ni autorización por sección.
