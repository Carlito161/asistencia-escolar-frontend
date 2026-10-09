# Despliegue del frontend en EC2 Linux

Destinatario: responsable de infraestructura y equipos frontend/backend.

El frontend se publica como archivos estáticos generados por Vite y servidos con Nginx. Laravel se despliega por separado. El navegador del usuario consume la API: no basta con que ambas instancias EC2 se comuniquen entre sí.

Esta guía presupone publicación en la raíz del dominio. Dominios, distribución Linux y certificados siguen pendientes. Los valores en MAYÚSCULAS son marcadores y deben sustituirse antes de ejecutar comandos o habilitar la configuración.

## Datos que deben confirmarse

- Dominio público del frontend y URL HTTPS de la API terminada en /api/v1.
- Distribución Linux y mecanismo de instalación de Nginx y certificados.
- Responsable de DNS, TLS, Security Groups, despliegues y rollback.
- Ubicación de archivos estáticos y usuario con permisos de publicación.
- Resolución de los bloqueantes de autorización por docente y horarios.

La base MySQL no se conecta desde Vue y sus credenciales no pertenecen al frontend.

## Compilación

Instalar Node compatible con package.json: ^22.18.0 o >=24.12.0. Mantener package-lock.json y usar npm ci. Se puede compilar en CI o en una máquina de construcción Linux; Node no necesita permanecer como servicio de producción para servir dist.

Desde la raíz del repositorio:

```bash
npm ci
npm run verify
cp .env.production.example .env.production.local
```

Editar .env.production.local con la URL definitiva:

```dotenv
VITE_API_URL=https://API_DOMAIN/api/v1
```

Después:

```bash
npm run build
```

El build rechaza URL faltante, HTTP, localhost, el dominio de ejemplo del proyecto o una ruta que no termine en /api/v1. Esta validación no comprueba que el dominio exista ni que el servidor responda.

VITE_* se incorpora a la compilación y es público. No guardar contraseñas, claves AWS, JWT_SECRET o credenciales MySQL. Al cambiar la URL se debe recompilar. No publicar dist generado por npm run verify, que usa configuración local, ni dist-production-check, que contiene una URL ficticia de ensayo. [Referencia Vite](https://vite.dev/guide/env-and-mode)

## Preparación de red

Configurar DNS hacia la instancia, dirección estable o balanceador elegido y un certificado TLS válido. Permitir 443 para HTTPS; 80 puede utilizarse para redirección y validación del certificado según el mecanismo elegido. Restringir SSH a las IP administrativas o utilizar el acceso administrado elegido.

No abrir 5173 ni 8000 para servir producción. El frontend no requiere acceso público a MySQL. Restringir el puerto de base de datos al backend autorizado. Revisar Security Groups y las reglas de red efectivamente aplicadas. [Referencia AWS](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html)

## Publicación de archivos

Guardar cada build en una carpeta de versión, por ejemplo /var/www/asistencia/releases/RELEASE_ID/dist. Configurar /var/www/asistencia/current como enlace a la versión aprobada y usar /var/www/asistencia/current/dist como raíz de Nginx.

El usuario web necesita lectura, no permisos de escritura globales. No usar chmod 777. Conservar la versión anterior para rollback. Antes de cambiar un enlace, comprobar que current es el enlace previsto y no una carpeta con datos.

La publicación solo requiere el contenido compilado. No exponer .env, código de Laravel, .git o node_modules mediante la raíz web.

## Configuración Nginx

Adaptar deploy/nginx.conf.example o esta plantilla. Los certificados deben existir antes de validar la configuración HTTPS.

```nginx
server {
    listen 80;
    server_name FRONT_DOMAIN;
    return 301 https://FRONT_DOMAIN$request_uri;
}

server {
    listen 443 ssl;
    server_name FRONT_DOMAIN;
    root /var/www/asistencia/current/dist;
    index index.html;

    ssl_certificate /PATH/TO/fullchain.pem;
    ssl_certificate_key /PATH/TO/privkey.pem;

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    location = /index.html {
        add_header Cache-Control "no-cache";
        add_header X-Content-Type-Options nosniff always;
        add_header Referrer-Policy strict-origin-when-cross-origin always;
    }
    location /assets/ {
        try_files $uri =404;
        expires 1y;
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

El fallback a index.html permite recargar /admin, /docente o /estudiante. Los assets inexistentes deben devolver 404, no HTML. La plantilla asume instalación con systemd; adaptar los comandos si la distribución utiliza otro gestor. [Referencia Vue Router](https://router.vuejs.org/guide/essentials/history-mode.html)

```bash
sudo nginx -t
sudo systemctl reload nginx
```

No recargar si nginx -t falla. Verificar caché de index.html y assets. Conservar assets antiguos durante despliegues si se necesita que pestañas abiertas puedan seguir descargando chunks de la versión anterior.

## Coordinación con Laravel

El backend debe responder por HTTPS y permitir el origen exacto del frontend en CORS. Acordar métodos y encabezados, incluidos Authorization, Content-Type y Accept; comprobar preflight OPTIONS. La autenticación actual usa Bearer, no cookies, y no requiere credentials en el navegador.

No utilizar localhost como URL de producción: apuntaría al equipo del usuario. CORS no sustituye la autenticación ni la restricción docente-sección.

## Pruebas antes de aprobar

Verificar acceso HTTPS, recarga de rutas internas, login por rol, consultas reales, autorización por sección, logout y token vencido. Probar cámara en móvil con HTTPS y permisos concedidos/denegados. Revisar que la red del navegador no solicite localhost ni recursos HTTP.

Ensayar historial, filtros, QR y ausencia registrada. Un build correcto no demuestra que esos flujos funcionen con la API desplegada. Registrar versión del frontend y backend usadas en las pruebas.

## Rollback

Conservar el artefacto previo y su URL de API. Si la nueva versión falla, restaurar el enlace a esa versión, validar Nginx si cambió su configuración y repetir las pruebas de acceso. Un rollback frontend puede requerir una API compatible con el contrato anterior.

No aprobar producción mientras falten dominios/TLS, asignaciones de docentes, horarios o las pruebas descritas en los documentos de integración.
