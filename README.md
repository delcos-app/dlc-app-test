# delcos

Entorno de **pruebas** de **delcos**, la plataforma de gestión comercial para empresas que trabajan con profesionales: cartera de cuentas,
visitas, agenda y rutas, pedidos, facturación, comisiones y analítica, en el ordenador y en el móvil.

- Se publica en **https://apptest.delcos.cloud**, con su propia base de datos.
- Cada versión nueva se publica aquí primero; cuando está validada pasa a producción (repositorio `dlc-app-v2`, https://app.delcos.cloud).

## Qué hay en este repositorio

| Archivo | Para qué sirve |
|---|---|
| `src/` | El código fuente: núcleo, servicios, componentes y pantallas, más `legado/` (el código de antes en orden, que se va repartiendo). `src/orden.json` dice en qué orden se junta. |
| `estilos/` | El estilo por capas: librerías, estilo antiguo, sistema de componentes (generado) y arreglos. |
| `herramientas/construir.mjs` | Junta `src/` y `estilos/` en `app.js` e `index.html` (`node herramientas/construir.mjs`; con `--comprobar`, antes de subir). |
| `index.html`, `app.js` | **Generados** por la construcción: es lo que se publica. No se editan a mano. |
| `config.js` | A qué base de datos se conecta según la dirección (pruebas o producción). |
| `sw.js`, `manifest.webmanifest` | Aplicación instalable en el móvil y uso sin conexión. |
| `jspdf.umd.min.js`, `qrcode.js` | Librerías para los PDF (facturas) y los códigos QR. |
| `empezar.html` | Lleva al alta de empresas en www.delcos.app. |
| `manual/` | El manual de uso (capítulos, fotos y vídeos). |
| Iconos y logotipo | `favicon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-180.png`, `logo-app.png`. |

Aplicación web sin dependencias: la construcción solo junta archivos (Node 18 o posterior) y se publica tal cual. Datos y acceso con Supabase.

© Delcoslab S.L.
