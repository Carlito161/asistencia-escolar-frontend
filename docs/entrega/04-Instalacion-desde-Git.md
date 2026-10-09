# Instalación del frontend desde Git

Destinatario: integrantes del equipo que recibirán el repositorio.

Esta guía permite ejecutar el frontend Vue localmente contra Laravel. Ambos proyectos permanecen separados. Instalar el frontend no instala PHP, MySQL ni las dependencias del backend.

## Requisitos

- Git, Node compatible con package.json (^22.18.0 o >=24.12.0) y npm.
- URL del repositorio y rama o commit de entrega.
- Backend en funcionamiento con base de datos, migraciones y cuentas de desarrollo preparadas por su responsable.

Comprobar:

```bash
git --version
node --version
npm --version
```

## Obtener el proyecto

Sustituir URL_DEL_REPOSITORIO por el enlace real:

```bash
git clone URL_DEL_REPOSITORIO asistencia-frontend
cd asistencia-frontend
npm ci
```

Ejecutar comandos donde esté package.json. npm ci instala las versiones del lockfile y exige coherencia con package.json; reemplaza node_modules existente. Si falla por diferencias del lockfile, coordinar su corrección en el repositorio, no eliminarlo para ocultar el problema. [Referencia npm](https://docs.npmjs.com/cli/v11/commands/npm-ci/)

## Configurar la API local

El repositorio contiene .env.development con:

```dotenv
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

Si la API tiene otra dirección, crear .env.development.local y definir VITE_API_URL. No editar las vistas para cambiar URLs. No guardar secretos en variables VITE_*.

El responsable backend debe permitir http://localhost:5173 en CORS. Si se utiliza 127.0.0.1:5173, incluir también ese origen. Son orígenes distintos. Reiniciar Vite después de cambiar variables.

En otra computadora o teléfono, 127.0.0.1 apunta a ese dispositivo, no al PC del backend. Para pruebas de red se necesita una URL alcanzable y CORS acorde. La cámara fuera de localhost requiere un contexto seguro; preferir un entorno HTTPS de ensayo.

## Iniciar y comprobar

```bash
npm run dev
```

Abrir la dirección Local que indique Vite, normalmente http://localhost:5173. El puerto es fijo y strictPort está activado; si está ocupado, cerrar la instancia previa o acordar el cambio con CORS.

Solicitar las cuentas de prueba por un canal separado. No guardar sus contraseñas en archivos del repositorio. Confirmar Administrador, Docente y Alumno activo asociado a estudiante/sección.

Antes de compartir cambios:

```bash
npm run verify
npm audit
```

verify comprueba imports con mayúsculas exactas, componentes Vue, pruebas unitarias y build con API local. GitHub Actions repite esas verificaciones en Ubuntu después de subir el repositorio. No demuestra una prueba funcional completa de la API.

Consultar docs/PRUEBAS.md para los escenarios manuales y docs/PENDIENTES-BACKEND.md para los bloqueantes conocidos.

## Actualizar sin perder trabajo

Revisar git status antes de cambiar de rama o actualizar. Si hay cambios propios, guardarlos de forma acordada antes de continuar. No usar reset --hard para resolver conflictos sin revisar el trabajo.

Con la copia limpia y la rama correcta:

```bash
git pull --ff-only
npm ci
npm run verify
```

No usar npm update de manera rutinaria para “hacer que funcione”: cambia dependencias y puede introducir incompatibilidades.

## Problemas habituales

- Failed to fetch o error de red: comprobar API, URL y consola/red del navegador. No concluir CORS sin revisar la evidencia.
- 404 de ruta: confirmar /api/v1 y versión del backend que está ejecutándose.
- 401: iniciar sesión otra vez; actualmente no hay renovación automática.
- 403: revisar rol, permisos y regla de negocio. La versión revisada también responde 403 después de guardar AUSENTE.
- Historial sin estudiante: comprobar vínculo del usuario con un estudiante activo.
- QR sin horario: la sección necesita horario activo asignado en backend.
- Build de producción sin URL: configurar .env.production.local con URL HTTPS definitiva, no copiar la local.

## Publicar inicialmente el repositorio

Estos pasos son para quien entrega la carpeta, no para quien la clona. Crear primero un repositorio vacío y revisar que no haya archivos personales o secretos.

```bash
git init
git branch -M main
git status --short
git add .
git diff --cached --stat
git diff --cached
```

Si aparecen dist, dist-production-check, node_modules, contraseñas o archivos .local, detenerse y corregir antes de confirmar. .gitignore no elimina archivos que ya estaban versionados.

Después de revisar:

```bash
git commit -m "Preparar frontend e integración API"
git remote add origin URL_DEL_REPOSITORIO
git push -u origin main
```

Si ya existe repositorio o contenido remoto, no repetir estos pasos ni forzar push; integrar con la rama y política del grupo. Esta guía no incluye credenciales Git ni ejecuta la publicación.

## Producción

Seguir el documento de despliegue EC2. npm run dev y npm run preview no son la configuración de producción. Publicar únicamente un build con la API HTTPS definitiva y los contratos backend aprobados.
