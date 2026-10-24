# delcos

Entorno de **pruebas** de **delcos**, la plataforma de gestión comercial para empresas que trabajan con profesionales: cartera de cuentas,
visitas, agenda y rutas, pedidos, facturación, comisiones y analítica, en el ordenador y en el móvil.

- Se publica en **https://apptest.delcos.cloud**, con su propia base de datos.
- Cada versión nueva se publica aquí primero; cuando está validada pasa a producción (repositorio `dlc-app-v2`, https://app.delcos.cloud).

## Qué hay en este repositorio

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La página de la aplicación y todo su estilo (capas: librerías, estilo antiguo, arreglos y sistema de componentes). |
| `app.js` | El código de la aplicación (pantallas, ventanas, datos y reglas de cada módulo). |
| `config.js` | A qué base de datos se conecta según la dirección (pruebas o producción). |
| `sw.js`, `manifest.webmanifest` | Aplicación instalable en el móvil y uso sin conexión. |
| `jspdf.umd.min.js`, `qrcode.js` | Librerías para los PDF (facturas) y los códigos QR. |
| `empezar.html` | Lleva al alta de empresas en www.delcos.app. |
| `manual/` | El manual de uso (capítulos, fotos y vídeos). |
| Iconos y logotipo | `favicon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-180.png`, `logo-app.png`. |

Aplicación web sin compilación: los archivos se publican tal cual. Datos y acceso con Supabase.

© Delcoslab S.L.
