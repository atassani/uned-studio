# UNED Studio

Aplicación que muestra tests de asignaturas de Filosofía de la UNED en formato web.

Se han incluido tests de:

- Lógica I (2025). Verdadero-Falso.
- Introducción al Pensamiento Científico (2025). Opción múltiple.
- Filosofía del Lenguaje (2025). Opción múltiple.

## Aplicación Web

Se trata de una aplicación "vibe coded" que usa [Next.js](https://nextjs.org) con [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

La aplicación incluye:

- **Autenticación con Google OAuth** para sincronizar progreso entre dispositivos
- **Modo anónimo** para uso local sin registro
- **Almacenamiento persistente** del progreso del usuario

Los resultados se almacenan en el `LocalStorage` del navegador (modo anónimo) o se sincronizan en la nube (usuarios autenticados).

Para arrancarla:

```bash
npm run dev
```

Entonces abre en el navegador [http://localhost:3000](http://localhost:3000).

Si editas `app/page.tsx` la pàgina se auto refrescará.

## Publicando la aplicación web

Necesitas Next.js instalado. Primero instala dependencias:

```bash
npm install next react react-dom
```

### Configuración para export estático (Next.js 13+)

Asegúrate de que tu archivo `next.config.js` contiene:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // ...otras opciones de configuración
};
module.exports = nextConfig;
```

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

El archivo `.env` debe contener las siguientes variables:

### Variables básicas de la aplicación

```bash
NEXT_PUBLIC_BASE_PATH=/uned/studio
```

- Cambia el valor según la subcarpeta donde se sirva la app.
- Esta variable se usa tanto en la configuración de Next.js (`next.config.ts`) como en el código de la aplicación para rutas de recursos (por ejemplo, favicon).
- Si despliegas en la raíz, puedes dejarla vacía:

  ```bash
  NEXT_PUBLIC_BASE_PATH=
  ```

### Variables de autenticación (AWS Cognito)

Para la funcionalidad de autenticación con Google OAuth, necesitas configurar AWS Cognito:

```bash
# AWS Cognito configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_OAUTH_DOMAIN=your-cognito-domain.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_REDIRECT_SIGN_IN=http://localhost:3000
NEXT_PUBLIC_REDIRECT_SIGN_OUT=http://localhost:3000

# Disable authentication for development/testing
NEXT_PUBLIC_DISABLE_AUTH=false
```

### Configuración de AWS Cognito

1. **Crear User Pool** en AWS Cognito
2. **Configurar Google como proveedor OAuth**:
   - Añadir Google en "Identity providers"
   - Configurar Google Client ID y Secret
3. **Configurar dominios** para hosted UI
4. **Configurar URLs de callback**:
   - Sign in: `https://tu-dominio.com/`
   - Sign out: `https://tu-dominio.com/`

### Modo de desarrollo sin autenticación

Para desarrollo o testing puedes deshabilitar la autenticación:

```bash
NEXT_PUBLIC_DISABLE_AUTH=true
```

Esto permite usar la aplicación sin configurar AWS Cognito.

## After installing Playwright

Inside that directory, you can run several commands:

- `npx playwright test`
  - Runs the end-to-end tests.
- `npx playwright test --ui`
  - Starts the interactive UI mode.
- `npx playwright test --project=chromium`
  - Runs the tests only on Desktop Chrome.
- `npx playwright test example`
  - Runs the tests in a specific file.
- `npx playwright test --debug`
  - Runs the tests in debug mode.
- `npx playwright codegen`
- `npx playwright codegen http://localhost:3000/es/logica1`
  - Auto generate tests with Codegen.

We suggest that you begin by typing:

`npx playwright test`

And check out the following files:

- `./tests/example.spec.ts` - Example end-to-end test
- `./playwright.config.ts` - Playwright Test configuration

# appearsIn field in IPC questions

## ¿Qué es appearsIn?

En `questions-ipc.json`, cada pregunta puede tener un campo opcional `appearsIn`, que es un array de strings. Este array indica en qué secciones (temas o exámenes) aparece la pregunta.

- El campo `appearsIn` solo existe en `questions-ipc.json`.
- Los valores de `appearsIn` siempre son nombres de sección o examen válidos, extraídos del propio archivo.
- Si la explicación de una pregunta termina con referencias a secciones o exámenes (por ejemplo, "Examen 2024 Febrero 1; Tema 1."), esas referencias se extraen y se colocan en el array `appearsIn`, y se eliminan de la explicación.
- Si no hay referencias, el campo puede estar ausente o ser un array vacío.

## Visualización en la aplicación

Cuando una pregunta tiene el campo `appearsIn`, la aplicación muestra una lista de viñetas (bullet list) debajo de la explicación, indicando en qué secciones o exámenes aparece esa pregunta.

## Validación automática

Existe un test unitario (`tests/unit/appears-in-field.test.ts`) que garantiza que:

- Solo las preguntas de `questions-ipc.json` pueden tener el campo `appearsIn`.
- Todos los valores de `appearsIn` son nombres de sección o examen válidos presentes en el archivo.

Esto asegura la coherencia y mantenibilidad de los datos.
