/** Spanish texts of the help popovers («i») of screens and Inicio indicators (legado 017–024, v2.424.0). Lists: one item per line. */
export const legacyAHelp = {
  indicators: {
    citas: 'Citas de hoy que ya están marcadas como visitadas, sobre el total de citas del día. Las descartadas no cuentan.',
    urgentes: '{professionalsMarkedCap} como urgentes que todavía no tienen {noVisit}. Pulsa para verlos en el Directorio.',
    visitasSem: '{visitsRecordedCap} desde el lunes de esta semana.',
    visitasMes: '{visitsRecordedCap} desde el día 1 de este mes.',
    interesados: '{professionalsCap} en estado «{interestState}». El siguiente paso es conseguir {firstPrescription}. Pulsa para verlos.',
    sinContactar: '{professionalsCap} a los que todavía no se ha presentado el producto. Pulsa para verlos.',
    cartera: '{professionalsCap} que puedes ver: tu cartera asignada o, si eres de administración o televenta, toda la base.',
    dups: 'Fichas marcadas como posible duplicado al darlas de alta. Pulsa para revisarlas y unificarlas.',
    filtro: 'Indicador creado con «Guardar filtro» en el Directorio. Cuenta ahora mismo {theProfessionals} que cumplen ese filtro. Pulsa para ver la lista.',
  },
  screens: {
    inicio: {
      title: 'Tu inicio',
      text: 'El resumen de tu día.',
      items: 'Pulsa un indicador para ver la lista de {professionals} que cuenta.\nEl icono ⚙ junto al saludo abre los indicadores: el ojo los muestra u oculta y las flechas cambian el orden.',
    },
    iniAgenda: {
      title: 'Tu agenda de hoy',
      text: 'Citas de hoy ordenadas por hora. En verde, las ya visitadas.',
      items: 'Para añadir citas, ve a Agenda o planifica una ruta.\nPulsa {aProfessional} para abrir su ficha y registrar {theVisit}.',
    },
    iniAcciones: {
      title: 'Próximas acciones',
      text: 'La próxima acción que quedó apuntada en la {lastVisit} de cada {professional}, para los próximos 7 días.',
      items: 'En naranja, las que ya han pasado de fecha.\nMárcalas como hechas o aplázalas desde Seguimiento.',
    },
    iniUrgentes: {
      title: 'Urgentes sin visitar',
      text: '{professionalsMarkedCap} como urgentes que aún no tienen {noVisit}.',
      items: 'El motivo de urgencia se ve en su ficha.\nDesde Rutas puedes planificar una ruta solo con urgentes.',
    },
    iniUltimas: {
      title: '{lastVisitsCap}',
      text: '{theVisitsRecordedCap} más recientes, con su resultado.',
      items: '',
    },
    iniRecom: {
      title: 'Rutas sugeridas',
      text: 'Listas calculadas cada día con tus datos. Al pulsar una, se planifica la ruta del día.',
      items: '«Atienden hoy»: atienden este día de la semana y no se visitan desde hace más de 14 días.\n«{professionalsInterestedCap}»: en estado «{interestState}» y sin {visit} en 20 días.\nSolo entran {professionals} con ubicación: completar direcciones mejora las propuestas.',
    },
    iniPend: {
      title: 'Pendientes de rutas anteriores',
      text: 'Citas que planificaste y quedaron sin visitar.',
      items: 'Desde Agenda puedes moverlas a hoy, cambiarlas de fecha o descartarlas.',
    },
    iniComision: {
      title: 'Tu actividad del mes',
      text: 'Unidades atribuidas a tus {professionals} en el periodo.',
      items: 'El tramo alcanzado se aplica a todas las unidades del periodo, no solo a las que superan el tramo.\nLo que se ve (unidades o importe) lo decide administración.',
    },
    agenda: {
      title: 'Agenda y «Tu día»',
      text: 'Tus citas por día, semana o mes. La vista de día es tu ruta.',
      items: 'Las citas se ordenan como vas a visitarlas. <b>Ordenar por cercanía</b> calcula el recorrido más corto; las citas con hora fija se respetan. Las flechas cambian el orden a mano.\nLa hora con «~» es una estimación según el orden, tu horario, los desplazamientos y el <b>horario de atención</b> de cada {professional}: si llegas antes de que abra, cuenta la espera. Una hora sin «~» es una hora fijada.\nSi una cita queda fuera del horario de atención {ofTheProfessional}, se marca en naranja. <b>Ordenar por cercanía</b> tiene en cuenta esos horarios.\n<b>Empezar jornada</b> activa la barra verde. Registra cada {visit} al terminarla: la cita pasa a <b>Visitada</b>.\nEstados: <b>Planificada</b> y <b>Confirmada</b> (abiertas); <b>Visitada</b>, <b>No estaba</b>, <b>Aplazada</b> y <b>Descartada</b> (cerradas).\n<b>No estaba</b> lo anota en su historial y te propone el próximo día que atiende.\n<b>Aplazar</b> deja la cita como aplazada y crea la nueva, así se ve el cumplimiento real.\nLas citas abiertas de días anteriores aparecen abajo para moverlas a hoy.\nAl <b>terminar la jornada</b>, lo no visitado se puede mover de golpe al próximo día que cada {professional} atiende. Lo mismo con los pendientes de días anteriores.\nLa vista de <b>semana</b> muestra los siete días en cuadrícula: pulsa un día para verlo, {aProfessional} para abrir su ficha o «+» para añadir una cita.',
    },
    rutas: {
      title: 'Rutas',
      text: 'Plantillas para llenar tu agenda.',
      items: '<b>Lista fija</b>: tú eliges {theProfessionals}. <b>Por criterios</b>: se rellena sola con los filtros.\nEl plan respeta los <b>días y horas de atención</b> de cada {professional} (los de su ficha): no te lo propone un día que no atiende ni fuera de su horario. Los que no caben aparecen en «Se quedan fuera» con el motivo.\nDurante la jornada todo se hace desde <b>Agenda → Tu día</b>.\nLa salida y la vuelta son de cada ruta (y del planificador semanal); <b>⚙ Tiempos de {visit}</b> cambia los minutos por {professional} y por parada.\nSolo entran {professionals} con ubicación. Completar la dirección y los días de atención mejora mucho las rutas.',
    },
    directorio: {
      title: 'Directorio',
      text: 'Todos {theProfessionals} que puedes ver.',
      items: 'El buscador de arriba filtra por nombre, centro o municipio.\nEl municipio y la provincia cuentan {allConsultations} {ofTheProfessional}, no solo la principal.\nAdministración y televenta ven los comerciales de cada {professional} y pueden filtrar por comercial.\n«⋮» abre los filtros y las columnas.\n«★ Guardar filtro» convierte los filtros actuales en un indicador de Inicio.\n«Cerca de mí» usa la ubicación del dispositivo.',
    },
    seguimiento: {
      title: 'Seguimiento',
      text: 'Cómo avanza cada {professional}.',
      items: 'Los indicadores de arriba muestran el embudo por estado comercial y la calidad de los datos.\n«Mostrar» filtra por visitados, sin visitar, con próxima acción o atrasados.\n«Hecha» cierra la próxima acción; «Aplazar» le pone otra fecha.',
    },
    ventas: {
      title: 'Ventas',
      text: 'Pedidos y unidades atribuidas.',
      items: 'Los pedidos se guardan como <b>borrador</b> (editable y se puede eliminar; no cuenta en métricas) o se <b>confirman</b> (cuenta en métricas y comisiones; solo se puede anular).\nImportes sin IVA; el IVA de cada producto se suma aparte.\nLa venta a {patient} se atribuye {toTheProfessionalIndicated} y al comercial que lo tenía asignado en ese momento.\nLa venta a centro se atribuye a la ficha del centro, si la tiene; si no, a nadie.\nSi marcas <b>Incluir envío</b>, el importe (con IVA) se suma al total con su propio IVA. No lleva descuento ni cuenta como unidades.\nArriba tienes los totales del periodo (solo pedidos completados: confirmados, cobrados, preparados y facturados) y al final de la tabla, la suma.',
    },
    analitica: {
      title: 'Analítica',
      text: 'Unidades e importes de los pedidos completados.',
      items: 'Elige el <b>periodo</b> y la dimensión: {professional}, comercial, producto, municipio, mes o canal.\nFiltra por un <b>{professional}</b>, un <b>comercial</b> o un <b>producto</b> para ver sus totales y su reparto por producto.\nEl importe es sin IVA y con el descuento de cada línea.\nLos datos no se pueden descargar: se consultan solo dentro de la plataforma.',
    },
    config: {
      title: 'Configuración',
      text: 'Ajustes de tu cuenta y de la plataforma.',
      items: 'Preferencias de salida y llegada: se usan para calcular las rutas.\nAl pulsar «Cómo llegar» o abrir una ruta, eliges en ese momento con qué app navegar (Google Maps, Waze o Apple Maps).\nClasificadores: las opciones que aparecen al registrar {visits} y en las fichas.',
    },
    admin: {
      title: 'Administración',
      text: 'Usuarios, permisos y control.',
      items: 'Permisos por área: <b>Ver</b>, <b>Editar</b> o <b>Completo</b>. Se aplican en la base de datos, no solo en la pantalla.\nLa cartera decide qué {professionals} ve cada comercial.\nLas comisiones se configuran por esquema y se asignan por persona.\nAccesos y auditoría registran entradas y cambios.',
    },
    duplicados: {
      title: 'Duplicados',
      text: 'Fichas que pueden ser la misma persona.',
      items: '<b>Pendientes</b>: marcadas al darlas de alta. <b>Nombres parecidos</b>: coincidencia del 80% o más.\nAl comparar eliges qué ficha queda y qué dato conservar de cada campo.\n{consultationsCap}, {visits}, citas y cartera se juntan en la ficha que queda. No se puede deshacer desde la app.\n«No son duplicados» guarda la pareja como distinta y no vuelve a salir.',
    },
    pacientes: {
      title: '{patientsCap}',
      text: 'Las personas que compran con {aProfessional} de referencia.',
      items: 'Cada {patient} tiene un <b>{professional} que lo trata</b>: se elige al darlo de alta o se asigna solo con su primer pedido.\nPara una persona se pide el DNI o NIE; para una empresa, el CIF. La app comprueba que la letra o el control sean correctos.\nDesde la ficha ves sus pedidos y creas uno nuevo con {theProfessional} ya puesto.',
    },
    productos: {
      title: 'Productos',
      text: 'El catálogo que se usa en pedidos, muestras y analítica.',
      items: 'Escribe el precio sin IVA o con IVA: el otro se calcula con el IVA del producto.\nUn producto inactivo no aparece al crear pedidos, pero se conserva en el histórico.\n<b>⚙ Envío</b> fija el importe del envío que se propone en los pedidos y si se marca por defecto.',
    },
    pruebas: {
      title: 'Entorno de pruebas',
      text: 'Una copia completa de la plataforma con su propia base de datos, para probar sin miedo.',
      items: 'Todo lo que hagas aquí ({visits}, citas, pedidos, cambios en fichas…) se queda aquí: <b>producción no se toca</b>.\nLos <b>datos de partida</b> son una copia de producción. Son fijos: desde la app no se pueden cambiar, así que siempre se puede volver a ellos.\n<b>↺ Volver a los datos de partida</b> deshace todo lo hecho en pruebas y deja los datos exactamente como se copiaron. Úsalo al terminar una tanda de pruebas.\nLos usuarios son los mismos que en producción, con la contraseña común de pruebas.\nPara tener datos más recientes de producción se hace una nueva copia (lo preparo yo); esa copia pasa a ser los nuevos datos de partida.',
    },
  },
};
