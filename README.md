# Learning Studio

Aplicación que muestra tests para el estudio, que pueden ser Verdadero/Falso u Opción Múltiple. Los ficheros de preguntas están en formato JSON y se pueden editar fácilmente.

## Aplicación Web

Usa [Next.js](https://nextjs.org) con [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) y TypeScript, y la infrastructura en AWS usando S3, CloudFront y Cognito para autenticación.

La infrastructura contiene tests unitarios con [Jest](https://jestjs.io/), y el frontend también contiene tests end-to-end con [Playwright](https://playwright.dev/).

La aplicación incluye:

- **Autenticación con Google OAuth** para sincronizar progreso entre dispositivos
- **Modo invitado** para uso local sin registro
- **Almacenamiento persistente** del progreso del usuario

Los resultados se almacenan en el `LocalStorage` del navegador (modo invitado) o se sincronizan en la nube (usuarios autenticados).

### Para construir y publicar la aplicación web

```bash
npm run build
```

Esto generará un directorio `out/` con todos los archivos estáticos que puedes subir al bucket S3. Excluye los siguientes archivos y directorios:

```bash
node_modules/
src/
data/
.git/
*.config.* (e.g., next.config.ts, postcss.config.mjs, etc.)
package.json, package-lock.json, tsconfig.json, README.md, etc.
```

## Configuración de variables de entorno (.env)

Las variables de entorno para cada proyecto se esperan en ficheros `.env`. `env.development.local` para desarrollo local, `.env.production` para producción, y `.env.test` para tests, incluidos los end-to-end con Playwright. Se incluye un fichero `.env.example` como referencia.

### Variables básicas de la aplicación

El contenido de los .env debería incluir al menos:

````bash
# Subcarpeta desde donde se sirve la aplicación web
NEXT_PUBLIC_BASE_PATH=/studio

# Nombre del fichero JSON con las áreas de estudio, el punto de partida de las preguntas de test.
NEXT_PUBLIC_AREAS_FILE=areas.json

# Variables de entrorno para AWS Cognito (autenticación)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=
NEXT_PUBLIC_COGNITO_CLIENT_ID=
NEXT_PUBLIC_COGNITO_DOMAIN=
NEXT_PUBLIC_REDIRECT_SIGN_IN=https://domain.com/studio
NEXT_PUBLIC_REDIRECT_SIGN_OUT=https://domain.com/studio
# Opcional: fuerza comportamiento de login (login, select_account)
NEXT_PUBLIC_COGNITO_PROMPT=

# El tracking ID de Google Analytics 4 o el texto 'disabled' para desactivar analytics
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX```
````

### Consideraciones de privacidad

- El tracking respeta la privacidad del usuario
- No se almacena información personal identificable
