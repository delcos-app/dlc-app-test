// servicios/exportar.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Lector de Excel y CSV (se carga solo al usarlo)
async function cargarLectorExcel() {
  if (window.XLSX) return window.XLSX;
  await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.integrity = 'sha384-vtjasyidUo0kW94K5MXDXntzOJpQgBKXmE7e2Ga4LG0skTTLeBi97eFAXsqewJjw'; s.crossOrigin = 'anonymous'; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  return window.XLSX;
}
