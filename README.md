# Asistencia escolar QR — frontend

Aplicación Vue desacoplada de una API Laravel/MySQL. Paneles por rol, administración,
consulta de asistencias, generación visual y lectura de QR.

## Requisitos

Node.js según engines de package.json y npm. API Laravel disponible.

## Desarrollo

1. Ejecutar npm ci.
2. Revisar .env.development (API local /api/v1). Para ajustes personales usar .env.development.local.
3. Ejecutar npm run dev y abrir la URL Local indicada.
4. Ejecutar npm run verify antes de compartir cambios.

## Comandos

- npm run check: componentes Vue e imports con mayúsculas exactas para Linux.
- npm test: pruebas de estados, CSV, paginación y aislamiento del historial.
- npm run verify: comprobación, pruebas y compilación local.
- npm audit: vulnerabilidades conocidas de dependencias.
- npm run build: producción; exige URL HTTPS real terminada en /api/v1.

## Estructura

- src/views: pantallas por rol.
- src/components: componentes compartidos.
- src/services: contrato REST y Axios centralizado.
- src/stores: autenticación y estado de la aplicación.
- src/utils: QR y utilidades.
- tests y scripts: verificación automática.
- docs: configuración, pruebas y pendientes del backend.
- deploy: plantilla Nginx, no configuración definitiva.

## Estado y límites

El historial del alumno usa Laravel; no se muestran registros de ejemplo.
El porcentaje considera solo registros existentes. Sin calendario/ausencias automáticas
no representa un porcentaje de todos los días lectivos.
Nombre, grado y sección del alumno requieren un endpoint de perfil pendiente.
Roles frontend organizan navegación; la autorización real debe estar en Laravel.
Docentes solo deben consultar sus secciones, pendiente de implementación backend.
No se inventan asignaciones ni horarios desde el navegador.
El acceso vencido requiere nuevo login; no se activa renovación hasta acordar contrato.

## Compartir y desplegar

Documentos para el grupo en docs/entrega:

- [Acuerdos backend](docs/entrega/01-Acuerdos-backend.md).
- [Guion de reunión](docs/entrega/02-Guion-reunion.md).
- [Despliegue EC2](docs/entrega/03-Despliegue-frontend-EC2.md).
- [Instalación desde Git](docs/entrega/04-Instalacion-desde-Git.md).

Consultar [EC2](docs/EC2.md), [pruebas](docs/PRUEBAS.md) y
[pendientes backend](docs/PENDIENTES-BACKEND.md).
Subir fuente, package-lock.json, ejemplos de entorno y documentación.
No subir node_modules, dist, dist-production-check, secretos o contraseñas de prueba.
VITE_* es configuración pública incluida en la compilación.
No publicar el build generado por npm run verify: apunta a la API local.
Antes de EC2 faltan dominios definitivos, resolver bloqueantes backend y ensayar HTTPS/Linux.

Esta carpeta todavía no tiene repositorio Git inicializado. Antes de git add,
revisar exclusiones y después git diff --cached para comprobar el contenido.
