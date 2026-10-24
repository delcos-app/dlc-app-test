Object.assign(ICON_NOM, { 'graduation-cap': '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>' });
ICO_NAV.eventos = 'graduation-cap'; ICO_MOD.eventos = svgIco(ICON_NOM['graduation-cap']);
PLAN_SECCIONES.eventos = ['comercial', 'empresa', 'medida'];
(() => { const g = MENU_GRUPOS.find(x => x.id === 'cartera'); if (g && !g.items.includes('eventos')) g.items.splice(g.items.indexOf('directorio') + 1, 0, 'eventos'); })();
function aplicarPermisosMenuBase7(...a) { try { menuEventos(); } catch (e) {} const r = aplicarPermisosMenuBase6.apply(this, a); try { menuEventos(); } catch (e) {} return r; }
PAGINAS.eventos = { t: 'Eventos', permiso: () => !ES_MEDICO() && puedeModulo('directorio') && planIncluyeSeccion('eventos') };
Object.defineProperty(PAGINAS.eventos, 'd', { get: () => 'Talleres, cursos y congresos con sus asistentes, inscripciones y gastos' });
Object.defineProperty(PAGINAS.eventos, 'tabs', { get: () => [['lista', 'Eventos', () => pintarEventos()]].concat(verTransparencia() ? [['transparencia', 'Informe de gastos', () => pintarTransparencia()]] : []) });



$('dlg').addEventListener('close', () => { if (TAB === 'eventos' && (PAG_TAB.eventos || 'lista') === 'lista' && $('cfgcuerpo')) setTimeout(() => { if (!$('dlg').open) pintarEventos(); }, 300); });


try { menuEventos(); } catch (e) {}



let CIC_DE = '', CIC_FIL = '', CIC_CLF = 'sin', CIC_Q = '';
Object.assign(ICON_NOM, { target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>' });
ICO_NAV.ciclo = 'target'; ICO_MOD.ciclo = svgIco(ICON_NOM.target);
(() => { const g = MENU_GRUPOS.find(x => x.id === 'dia'); if (g && !g.items.includes('ciclo')) g.items.push('ciclo'); })();
function aplicarPermisosMenuBase8(...a) { try { menuCiclo(); } catch (e) {} const r = aplicarPermisosMenuBase7.apply(this, a); try { menuCiclo(); } catch (e) {} return r; }
PAGINAS.ciclo = { permiso: () => !ES_MEDICO() && puedeModulo('agenda') };
Object.defineProperty(PAGINAS.ciclo, 't', { get: () => `Ciclo de ${TT('visita', 'p', '', 'l', 'l')}` });
Object.defineProperty(PAGINAS.ciclo, 'd', { get: () => `${TT('medico', 'p', '', 'l', 'C')} en A, B y C, y las ${TT('visita', 'p', '', 'l', 'l')} que le tocan a cada uno en cada ciclo` });
Object.defineProperty(PAGINAS.ciclo, 'tabs', { get: () => [['ciclo', 'Este ciclo', () => pintarCiclo()]].concat(planIncluyeSeccion('cobertura') ? [['cobertura', 'Por producto', () => pintarCobertura()]] : [], [['clasificar', 'Clasificar', () => pintarClasificar()]]).concat(VE_TODO() ? [['equipo', 'Equipo', () => pintarCicloEquipo()]] : []) });



// A, B o C en cualquier sitio (página «Clasificar» y ficha): pulsar la marcada la quita
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-ccl]'); if (!b || b.disabled) return;
  const [id, k] = b.dataset.ccl.split('|'), grupo = b.closest('.cicsegs'), nueva = b.classList.contains('on') ? null : k;
  grupo.querySelectorAll('button').forEach(x => x.disabled = true);
  const { data: r, error } = await db.rpc('clasificar_cuentas', { p_ids: [id], p_clase: nueva });
  grupo.querySelectorAll('button').forEach(x => { x.disabled = false; });
  if (error || !r || r.ok === false) { toast(r && r.error === 'permiso' ? 'No puedes cambiar la clase de esta ficha' : 'No se ha podido guardar', true); return; }
  grupo.querySelectorAll('button').forEach(x => { const on = x.dataset.ccl === id + '|' + nueva; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
  invalidarCache();
  if (grupo.closest('#fciclo')) cicFicha(id);
}, true);



$('dlg').addEventListener('close', () => { if (TAB === 'ciclo' && $('cfgcuerpo')) setTimeout(() => { if (!$('dlg').open && TAB === 'ciclo') (PAGINAS.ciclo.tabs.find(x => x[0] === (PAG_TAB.ciclo || 'ciclo')) || PAGINAS.ciclo.tabs[0])[2](); }, 300); });
$('ficha').addEventListener('close', () => { if (TAB === 'ciclo' && $('cfgcuerpo')) setTimeout(() => { if (!$('ficha').open && TAB === 'ciclo') (PAGINAS.ciclo.tabs.find(x => x[0] === (PAG_TAB.ciclo || 'ciclo')) || PAGINAS.ciclo.tabs[0])[2](); }, 300); });
try { menuCiclo(); } catch (e) {}
// v2.199.0: la cobertura por producto va en los planes Comercial, Empresa y A medida (decisión de Eric, como en la web)
PLAN_SECCIONES.cobertura = ['comercial', 'empresa', 'medida'];



Object.assign(ICON_NOM, { scissors: '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>' });
ICO_NAV.cirugias = 'scissors'; ICO_MOD.cirugias = svgIco(ICON_NOM.scissors);
(() => { const g = MENU_GRUPOS.find(x => x.id === 'dia'); if (g && !g.items.includes('cirugias')) g.items.push('cirugias'); })();
function aplicarPermisosMenuBase9(...a) { try { menuCirugias(); } catch (e) {} const r = aplicarPermisosMenuBase8.apply(this, a); try { menuCirugias(); } catch (e) {} return r; }
PAGINAS.cirugias = { t: 'Intervenciones', permiso: () => !ES_MEDICO() && puedeModulo('agenda'), tabs: [['lista', 'Intervenciones', () => pintarCirugias()]] };
Object.defineProperty(PAGINAS.cirugias, 'd', { get: () => 'Programación, material usado con lote y número de serie, y reposición en 48 horas' });






$('dlg').addEventListener('close', () => { if (TAB === 'cirugias' && $('cfgcuerpo')) setTimeout(() => { if (!$('dlg').open && TAB === 'cirugias') pintarCirugias(); }, 300); });
try { menuCirugias(); } catch (e) {}
