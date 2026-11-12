# FreeDOS · Material didáctico

Presentación estática sobre FreeDOS, con un resumen descargable en PDF.

## Desarrollo local

Abrir `index.html` en un navegador o servir esta carpeta con un servidor estático.

## Despliegue

El flujo `.github/workflows/deploy-pages.yml` verifica el JavaScript y que los archivos esenciales existan. Cada `push` a `main` publica el sitio en GitHub Pages.

La primera vez que se cree el repositorio, en **Settings → Pages** se debe seleccionar **GitHub Actions** como fuente de publicación. El flujo usa las acciones oficiales `configure-pages`, `upload-pages-artifact` y `deploy-pages`.

## Decisión de infraestructura

GitHub Pages + GitHub Actions es la opción elegida: el sitio no tiene servidor, base de datos ni recursos que Terraform o Ansible deban aprovisionar. Se reevaluará IaC solo si el proyecto incorpora infraestructura administrada, un dominio con DNS complejo, servicios de backend o múltiples entornos.

## Seguridad

El sitio no usa dependencias ni recursos externos. Define una CSP restrictiva y una política de `referrer` en `index.html`; GitHub Pages proporciona HTTPS. Las cabeceras HTTP adicionales, como HSTS o `X-Content-Type-Options`, no se pueden administrar desde un repositorio de GitHub Pages estándar. Para esos controles haría falta un proxy/CDN configurable.
