// @ts-check
// componentes/ventana.js · las ventanitas (aviso, confirmación, pregunta, elección, campo), «¿Salir sin guardar?» y el horario de
// consulta están en src/app/components (dialogs.ts y consultation-hours.ts, v2.416.0). Sus nombres se quedan como adaptadores:
// toda la app los usa. Aquí sigue lo que va con la pila de ventanas y con el encaje en el panel de Configuración.



// v2.122.0: la ventana va EN la página, en el sitio del apartado (antes flotaba encima con posición absoluta y su propio desplazamiento).
// Se devuelve a <body> antes de cerrarse, para que los repintados del apartado no se la lleven por delante.


// Pequeña (confirmaciones y citas), normal (fichas y formularios) y amplia (pedidos, compras y facturas)

// Ventanas integradas: en escritorio, dentro de Configuración y de las páginas propias, una ventana ocupa el área de contenido
// (sin fondo oscuro ni ventana flotante); al cerrarla vuelve el apartado. En el móvil las ventanas ya ocupan la pantalla.


 // v2.440.0: DATOS_CAMBIADOS → estado de src/app (plan 6.6), accesible en window

 // v2.440.0: ULT_ACCION → estado de src/app (plan 6.6), accesible en window




// Adaptadores (src/app/components/dialogs.ts y consultation-hours.ts)

// La ventana dentro del panel, el encaje en la página, la pila y «cargando» están en src/app/components/embedded-window (v2.422.0).
// Estos nombres se quedan: Configuración, los parches de las ventanas (legado 058 y 072), Facturación y los puentes los usan.
const ENCAJE_MIN = window.delcos.components.embeddedWindow.EMBED_MIN_WIDTH;
