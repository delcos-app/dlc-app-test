/**
 * Visitas (v2.412.0): «Registrar visita», «Editar visita», «Para la visita» in the account card, the photos, the product
 * presentations and the samples setting. The legacy names abrirVisita, editarVisita, verFotosVisita, subirFotosVisita,
 * presMateriales, presentarSolo, editorMuestras and guardarAvisoRevisita stay as adapters.
 */
export { visitBlock, visitConsultation } from './card-block';
export { editVisit } from './edit';
export { showVisitPhotos, uploadVisitPhotos } from './photos';
export { loadMaterials, presentOnly } from './presentation';
export { openVisit } from './record';
export { editSamples, saveRevisitNotice } from './settings';
