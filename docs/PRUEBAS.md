# Verificación de entrega

## Automática

- npm ci
- npm run verify (imports con mayúsculas exactas, componentes Vue, pruebas unitarias y build local)
- npm audit
- GitHub Actions repite verificación en Ubuntu. Su build local no es un artefacto de producción.

## Manual en entorno de pruebas

Usar cuentas de desarrollo compartidas por el equipo; no guardar contraseñas en Git.

- Login por Administrador, Docente y Alumno; rechazo de contraseña incorrecta.
- Acceso directo a otro panel, sesión corrupta/rol desconocido, recarga y logout.
- Alumno: historial vacío, varias páginas, consulta fallida/reintento, recarga y cambio de usuario sin datos anteriores.
- QR: presente, tardía, ausencia guardada por backend, duplicado 409, QR inválido, sección distinta y fecha vencida.
- Cámara: permiso denegado, dispositivo sin cámara, cierre del modal y cambio de ruta; imagen cargada.
- CRUD: validaciones 422, permisos 403, catálogos paginados y credenciales temporales.
- Docente: verificar solo secciones asignadas y rechazo por ID de sección ajena. Bloqueado hasta implementar alcance backend.
- Sección nueva: asignar horario, comprobar y generar QR. Bloqueado hasta contrato de horarios.
- Reportes: filtros, más de 100 registros, CSV con tildes, comillas y fórmulas neutralizadas.
- Sin conexión, servidor 500 y token vencido 401.

## Ensayo EC2/Linux

Configurar URL real HTTPS terminada en /api/v1 y ejecutar npm run build.
Probar acceso directo y recarga de /admin, /docente y /estudiante con Nginx.
Verificar CORS/preflight, cámara móvil HTTPS, no publicar dist de desarrollo.
No usar las cuentas/contraseñas de pruebas en producción.

## Evidencia inicial

En esta máquina: login de los tres roles correcto; reporte admin/docente e historial alumno respondieron 200. No se crearon/modificaron registros ni se ejecutaron migraciones. No equivale a prueba funcional completa o aprobación EC2.
Compilación de producción comprobada con URL HTTPS ficticia en dist-production-check:
solo ensayo técnico, no artefacto publicable ni dominio definitivo.
