// @ts-check
// v2.236.0 · Modelo de página «Lista»: la barra está en src/app/components/list-bar (v2.421.0). Aquí, en su sitio del orden de
// carga, se observan Cuentas y Clientes y se ponen sus escuchas.
window.delcos.components.listBar.startScreens();

const normalizar = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
