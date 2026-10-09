# Guion para la reunión de integración

Objetivo: acordar contratos y pruebas con el equipo backend, sin discutir autoría ni defender conclusiones cuando una versión distinta aporte evidencia.

## Apertura de tres minutos

“Quiero que hoy salgamos con un contrato claro para terminar la integración. El frontend ya tiene las correcciones de compatibilidad con Linux, carga del historial real, limpieza de sesión y pruebas automáticas. Login y consultas principales respondieron correctamente con las cuentas de prueba.

Lo que necesitamos revisar son cuatro puntos. Primero, que el docente solo consulte sus secciones. Segundo, que el administrador pueda asignar un horario y que quede guardado. Tercero, que el alumno pueda consultar su nombre, grado y sección a partir de su sesión. Cuarto, que una ausencia registrada tenga una respuesta que indique claramente que sí se guardó.

Estoy de acuerdo con que el administrador gestione las asignaciones manualmente. No estoy pidiendo que el sistema decida automáticamente qué docente o jornada corresponde. Necesito que la API guarde lo que el administrador selecciona y que Laravel lo valide cuando alguien consulta.

En la copia que revisamos no encontramos completos esos contratos. Eso no significa que no estén en otra rama. Si ya existen, probémoslos y compartamos los endpoints y el commit. Así actualizamos el frontend con datos reales y evitamos trabajar sobre supuestos.

Propongo revisar cada punto con una prueba corta y terminar con responsables y fechas. No necesitamos resolverlo todo en esta reunión, pero sí saber qué existe, qué falta y cómo vamos a comprobarlo antes de EC2.”

## Respuestas a objeciones frecuentes

### Eso ya está hecho

“Perfecto. ¿En qué rama o commit y qué endpoint debemos consumir? Probemos una consulta permitida y otra denegada, o una creación seguida de recarga. Si funciona, cerramos el pendiente y documentamos el contrato.”

Pedir método, URL, cuerpo, respuesta, permisos y versión. Aceptar la evidencia y corregir el informe si corresponde. No insistir en un hallazgo de una copia anterior.

### Eso lo hará el administrador manualmente

“Sí, él decide la asignación. Lo que falta confirmar es cómo la guarda: ¿desde qué formulario y endpoint? Y luego, ¿cómo usa Laravel esa asignación para permitir o negar acceso?”

Si proponen Workbench, preguntar quién tendrá acceso, cómo evitarán errores y cómo mantendrán trazabilidad. Puede ser una operación temporal de soporte, pero no sustituye la función administrativa acordada.

### Ya tenemos roles y permisos

“El rol permite realizar una operación. La asignación determina sobre qué sección puede realizarla. Probemos que un docente con permiso no pueda consultar una sección de otro docente.”

Ejemplo: docente 1 tiene A; intentar B cambiando únicamente el ID con el mismo token.

### Filtra las secciones desde el frontend

“Puedo mostrar las opciones correctas si la API devuelve la asignación. Pero cualquiera puede llamar al endpoint directamente. Necesitamos que Laravel también rechace una sección ajena.”

No presentar ocultar botones como protección de datos.

### El horario ya existe en la base

“Eso cubre el catálogo. Ahora probemos que al crear o editar una sección por la API se guarde horario_id, y que el detalle lo devuelva después de recargar.”

El modelo puede tener el campo y aun así el Request descartarlo por no estar validado.

### Con el rol Alumno ya tienes el perfil

“El rol identifica el tipo de usuario, no su nombre ni grado. ¿Qué respuesta devuelve esos datos para el alumno autenticado, sin consultar listados de otros alumnos?”

Un endpoint existente con otro nombre es suficiente si cumple ese comportamiento.

### El 403 es correcto porque llegó tarde

“Una regla académica puede guardar AUSENTE. El problema es que 403 normalmente expresa una operación no autorizada. Si la fila ya quedó creada, necesito recibir el resultado para actualizar la pantalla. Acordemos el estado HTTP y el recurso, y probemos el reintento.”

Distinguir tardanza dentro de tolerancia de ausencia fuera de tolerancia.

### En Swagger responde 200

“Eso confirma esa petición. Para darlo por terminado necesitamos verificar persistencia, el usuario correcto, permisos y los casos de error. Por ejemplo, una sección ajena no debería responder 200.”

### No hay tiempo para eso antes de entregar

“Podemos subir a Git y hacer pruebas de integración con los pendientes documentados. Pero no declarar producción aprobada si un docente puede acceder a información ajena o no podemos asignar horarios. Priorizamos esos bloqueantes y dejamos mejoras no críticas para después.”

## Demostraciones propuestas

1. Docentes distintos: listado propio y rechazo de sección ajena en detalle, estudiantes, reporte y QR.
2. Sección nueva: seleccionar jornada, guardar, recargar y comprobar horario.
3. Dos alumnos: consultar perfil con cada token y verificar aislamiento.
4. Ausencia: guardar fuera de tolerancia, inspeccionar respuesta y repetir sin duplicación.

Preparar estos datos en desarrollo, no modificar registros de producción ni mostrar tokens en grabaciones o documentos.

## Cierre de la reunión

“Anotemos por cada punto el responsable, la versión y la prueba que lo cierra. Si ya funciona, compartimos la evidencia y actualizamos el frontend. Si falta, acordamos el endpoint y una fecha. Con eso podremos probar en Linux y después preparar EC2 sin cambiar la configuración local.”

Acta mínima: punto, decisión, responsable, rama o commit, endpoint, fecha y resultado de prueba. Mantener abierta cualquier diferencia funcional que no se haya acordado, como salida vespertina, tolerancia o ausencias sin escaneo.
