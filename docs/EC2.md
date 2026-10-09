# Desarrollo local y entrega a EC2

## Desarrollo

Desde esta carpeta: `npm ci` y `npm run dev`.
Abrir la dirección Local indicada por Vite (habitualmente http://localhost:5173). `.env.development` apunta a
http://127.0.0.1:8000/api/v1. Mantener Laravel y MySQL encendidos.
Para cambiar la API solo en tu máquina, usar `.env.development.local` y reiniciar Vite.
No editar las vistas para cambiar direcciones: usar `src/services/api.js` y servicios por módulo.

## Producción

1. Copiar `.env.production.example` a `.env.production.local`.
2. Reemplazar `VITE_API_URL` con la URL HTTPS real de la API, incluyendo `/api/v1`.
3. Ejecutar `npm ci` y `npm run build`.
4. Entregar `dist/` al responsable de EC2. Esta carpeta no se sube a Git.

El build de producción rechaza una URL faltante, HTTP, local o de ejemplo.
Las variables VITE_* son públicas y se incorporan al compilar. No contienen claves,
contraseñas ni JWT_SECRET. Si la URL cambia, volver a compilar.
Para comprobar una compilación LOCAL: `npm run build -- --mode development`.
No publicar esa compilación en EC2: contiene la URL local.

## Configuración del servidor (responsable EC2/backend)

Servir dist con Nginx y HTTPS. Para Vue Router en modo history, usar
`try_files $uri $uri/ /index.html;` en la ubicación de la SPA.
Evitar cachear index.html indefinidamente; los assets con hash pueden tener caché larga.
La API también debe usar HTTPS. Laravel debe permitir el origen exacto del frontend
en CORS, métodos de la API y los encabezados Content-Type, Accept y Authorization.
El navegador, no EC2, consume la API: su URL debe ser accesible a los usuarios.
La cámara requiere HTTPS en el dominio público. npm run dev no es un servidor de producción.

## Contrato actual de sesión

Login: POST /auth/login; respuesta data.token con access_token, refresh_token y role
(Administrador, Docente o Alumno). Axios agrega Authorization: Bearer automáticamente.
Logout: POST /auth/logout y limpieza local, incluso si el servidor no responde.
Un 401 en rutas protegidas limpia la sesión y vuelve al login. El login inválido
muestra su error sin disparar esa redirección.
No hay renovación automática: el backend actual protege /auth/refresh con el access token;
coordinar un contrato de renovación antes de activarla.
Los controles de rol de Vue solo ordenan la navegación; Laravel sigue validando permisos.
La sesión actual se guarda en asistencia_qr_auth_v1 con accessToken, refreshToken,
role, expiresIn y email. Pinia la recupera antes de instalar el router.
Las sesiones antiguas con claves access_token/auth_role no se reutilizan; iniciar sesión otra vez.

## Backend actualizado

La nueva copia incluye GET /api/v1/asistencias/historial y GET /api/v1/asistencias/reporte.
Un error "The route ... could not be found" indica que el servidor no tiene registrada
esa ruta; comprobar la carpeta desde la que se lanzó Laravel y su caché de rutas.
Reporte requiere asistencia.report; historial requiere asistencia.view y estudiante activo
vinculado al usuario. role se lee en response.data.token.role, no en response.role.

## Verificación antes de entregar

Comprobar login y panel por rol, recarga de ruta interna, consultas con token,
rechazo de acceso a otro panel, sesión vencida y cierre de sesión.
Ejecutar `npm run verify` y seguir [PRUEBAS.md](PRUEBAS.md).
Los pendientes de contrato y autorización están en [PENDIENTES-BACKEND.md](PENDIENTES-BACKEND.md).
Esta preparación no implica aprobación de producción: faltan dominios, alcance de docentes,
horarios y pruebas completas en EC2/Linux.
