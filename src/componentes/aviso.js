// @ts-check
// componentes/aviso.js · el aviso de la esquina y los avisos de pantalla están en src/app/components/toast.ts (v2.416.0).
// Estos nombres se quedan: toda la app los usa.

const avisoRevisita = () => Object.assign({ on: true, dias: 7 }, ((PERFIL.preferencias || {}).avisos || {}).revisita || {});

