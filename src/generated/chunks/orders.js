var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value6) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value6 }) : obj[key] = value6;
var __publicField = (obj, key, value6) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value6);

// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var registerMessages = /* @__PURE__ */ pick("registerMessages");
var t = /* @__PURE__ */ pick("t");

// src/app/i18n/es/chunks/orders/orders.ts
var orders = {
  page: {
    newSale: "+ Nueva venta",
    channel: "Canal",
    all: "Todos",
    saleTo: "Venta {customer}",
    saleToCentre: "Venta a centro",
    state: "Estado",
    confirmed: "Confirmados",
    drafts: "Borradores",
    voided: "Anulados",
    search: "Buscar",
    searchPlaceholder: "{professional}, {customer} o nº de pedido",
    tabSales: "Ventas",
    tabPurchases: "Compras",
    tabSuppliers: "Proveedores",
    tabOpportunities: "Oportunidades",
    newPurchase: "+ Nuevo pedido de compra",
    newSupplier: "+ Nuevo proveedor"
  },
  list: {
    operations: "Operativa",
    everything: "Todo",
    toCollect: "Pendiente de cobro",
    toPack: "Paquete por preparar",
    invoiceToSend: "Factura por enviar",
    origin: "Origen",
    web: "Por la web",
    portal: "Portal del centro",
    others: "Comercial, teléfono o correo",
    report: "Reporte",
    reported: "Reportados",
    notReported: "Sin reportar",
    loading: "Cargando pedidos…",
    couldNotLoad: "No se ha podido cargar{error}.",
    completed: "Pedidos completados",
    inDraft: " · {count} en borrador",
    units: "Unidades",
    byWeb: "Por la web",
    withoutVat: " · {amount} sin IVA",
    base: "Base sin IVA",
    vat: "IVA",
    total: "Total con IVA",
    packageReady: "Paquete preparado",
    packageToPrepare: "Paquete por preparar",
    paymentReceived: "Pago recibido",
    paymentPending: "Pago pendiente",
    invoiceSent: "Factura enviada",
    invoiceToSendShort: "Factura por enviar",
    webTag: "Web",
    portalTag: "Portal",
    withReceipt: "Con justificante de pago",
    unattributed: "Sin atribuir",
    none: "No hay pedidos con estos filtros.",
    date: "Fecha",
    customer: "Cliente",
    salesperson: "Comercial",
    products: "Productos",
    unitsShort: "Uds.",
    baseShort: "Base",
    totalShort: "Total",
    state: "Estado",
    notes: "Notas"
  },
  operations: {
    title: "Operativa",
    onDelivery: " (se cobra al entregar)",
    freeDelivery: "Entrega sin cargo: sin factura ni cobro. Las unidades cuentan al profesional de referencia.",
    reported: "Reportado {professional}",
    noEmail: "El cliente no tiene email en su ficha.",
    preparePaymentEmail: "✉️ Preparar email con los datos de pago",
    couldNotSave: "No se ha podido guardar",
    paidToast: "Cobrado",
    paidOnInvoice: " · cobro anotado en la factura",
    done: "Hecho",
    unmarked: "Desmarcado",
    reportedToast: "Reportado",
    notReportedToast: "Ya no se reporta"
  },
  sheet: {
    opening: "Abriendo el pedido…",
    notFound: "No se ha encontrado el pedido.",
    title: "Pedido",
    draftNotice: "Borrador: todavía no cuenta en métricas ni en comisiones.",
    seeCustomer: "Ver ficha {customer}",
    code: "· código {code}",
    salesperson: "Comercial: {name}",
    lines: "Líneas",
    noProduct: "Sin producto",
    units: "{count} uds.",
    base: "Base {amount}",
    discount: " (dto. {percent}%)",
    vat: "IVA {rate}% {amount}",
    noLines: "Sin líneas.",
    note: "Nota",
    deleteDraft: "Eliminar borrador",
    edit: "Editar",
    confirm: "Confirmar pedido",
    editData: "Editar datos",
    editOrder: "Editar pedido",
    void: "Anular pedido",
    deleteText: "El borrador desaparece por completo.",
    deleteTitle: "¿Eliminar el borrador?",
    deleteOk: "Eliminar",
    onlyDrafts: "Solo se pueden eliminar borradores",
    couldNotDelete: "No se ha podido eliminar",
    deleted: "Borrador eliminado",
    paymentNoted: "Se anota el pago como recibido. ",
    confirmText: "Una vez confirmado, el pedido cuenta en métricas y comisiones y ya no se puede editar ni eliminar: solo anular.",
    confirmTitle: "¿Confirmar el pedido?",
    confirmOk: "Confirmar",
    couldNotConfirm: "No se ha podido confirmar: {error}",
    confirmedAndPaid: "Pedido confirmado y cobrado",
    confirmed: "Pedido confirmado",
    voidReason: "Motivo de la anulación (opcional)",
    voidTitle: "¿Anular el pedido?",
    voidOk: "Anular",
    voidInvoiced: "Tiene factura: emite antes una rectificativa de toda la factura y marca «Anular también el pedido»",
    couldNotVoid: "No se ha podido anular: {error}",
    voided: "Pedido anulado"
  },
  payment: {
    title: "Pago",
    byWeb: "Pedido por la web",
    reference: "Referencia del pago",
    see: "Ver",
    couldNotOpen: "No se ha podido abrir el justificante"
  },
  nonFiscal: {
    title: "Editar datos del pedido {number}",
    subtitle: "Solo lo que no es fiscal: las líneas, los importes, el cliente y la fecha no cambian.",
    note: "Nota",
    paymentMethod: "Forma de pago",
    paymentReference: "Referencia del pago",
    referencePlaceholder: "p. ej. número de la transferencia",
    invoiceKeeps: "Este pedido ya tiene factura: la factura emitida conserva la forma de pago con la que se hizo.",
    fillIn: "Rellena «{field}»",
    couldNotSave: "No se ha podido guardar: {error}",
    saved: "Datos del pedido guardados"
  },
  bankTransfer: {
    title: "Pago por transferencia",
    sentOn: "Datos de pago enviados el {date}. El pedido espera en borrador hasta que llegue el pago.",
    notSent: "Datos de pago sin enviar. El pedido espera en borrador hasta que llegue el pago.",
    send: "Enviar los datos de pago",
    sendAgain: "Volver a enviar los datos de pago",
    noEmail: "{customer} no tiene email en su ficha.",
    paidConfirm: "Cobrado · confirmar"
  },
  distributor: {
    title: "Distribuidor",
    fallbackName: "Distribuidor",
    servedBy: "Lo sirve <b>{name}</b>",
    customerCode: " · código del cliente <b>{code}</b>",
    theyInvoice: "lo factura el distribuidor",
    weInvoice: "lo facturamos nosotros",
    prepareMail: "Preparar correo al distribuidor",
    noEmail: "El distribuidor no tiene correo: añádelo en sus datos.",
    mailPreparedOn: "Correo preparado el {date}",
    mailNotPrepared: "Correo sin preparar",
    afterConfirm: "Al confirmarlo podrás preparar el correo al distribuidor.",
    mailOrder: "Pedido {number} de {app}",
    mailCustomer: "Cliente: {name}{code}",
    mailCode: " · código {code}",
    mailAddress: "Dirección: {address}",
    invoicedByThem: "Lo factura el distribuidor.",
    invoicedBy: "Lo factura {app}.",
    mailNote: "Nota: {note}",
    mailSubject: "Pedido {number} · {name}"
  },
  transfer: {
    state: "Estado del transfer",
    download: "Descargar transfer",
    note: "Nota: {note}",
    issueQuestion: "Qué ha pasado (falta de stock, dirección, código del cliente…)",
    issueTitle: "Incidencia en el transfer",
    noPermission: "No tienes permiso para cambiarlo",
    couldNotChange: "No se ha podido cambiar{error}",
    sentOn: "Enviado el {date}",
    changed: "Transfer: {state}",
    pdfFailed: "No se ha podido preparar el PDF: {error}",
    pdfTitle: "Transfer · Pedido {number}",
    pdfDistributor: "Distribuidor",
    pdfCustomer: "Cliente",
    pdfCode: "Código en el distribuidor: {code}",
    pdfTaxId: "NIF: {id}",
    pdfProduct: "Producto",
    pdfReference: "Referencia",
    pdfBarcode: "Código de barras",
    pdfUnits: "Uds.",
    pdfTotal: "Total: {units} unidades"
  },
  equipment: {
    title: "Equipos",
    oneMissing: "Falta dar de alta 1 equipo de este pedido en el parque instalado.",
    missing: "Faltan por dar de alta {count} equipos de este pedido en el parque instalado.",
    registerAll: "Dar de alta los equipos",
    writeSerials: "Escribe el número de serie de cada unidad.",
    serialOf: "Nº de serie de la unidad {unit}",
    serialLabel: "Número de serie de la unidad {unit} de {name}",
    installedOn: "Instalado el",
    place: "Ubicación",
    placePlaceholder: "p. ej. Sala 2",
    register: "Dar de alta",
    noAccount: "El pedido no tiene ficha: da de alta los equipos desde la ficha del centro",
    writeOne: "Escribe al menos un número de serie",
    noPermission: "No puedes dar de alta equipos de esta ficha",
    couldNotSave: "No se ha podido guardar: {error}",
    oneRegistered: "Equipo dado de alta",
    registered: "{count} equipos dados de alta"
  },
  distributors: {
    loading: "Cargando los distribuidores…",
    couldNotRead: "No se han podido leer los distribuidores: {error}",
    hint: "Mayoristas o depósitos que sirven pedidos a vuestros clientes. Al hacer un pedido se elige si lo servís vosotros o uno de ellos; el suyo no descuenta stock de vuestro almacén.",
    new: "+ Nuevo distribuidor",
    noLongerUsed: "Que ya no se usan",
    none: "Todavía no hay distribuidores.",
    notUsed: "No se usa",
    noContact: "Sin correo ni teléfono",
    transfers: "Transfers",
    edit: "Editar",
    stopUsing: "Dejar de usar",
    useAgain: "Volver a usar",
    stopText: "No saldrá al hacer pedidos nuevos. Los pedidos que ya sirvió siguen diciendo que fue él.",
    stopTitle: "¿Dejar de usar {name}?",
    couldNotChange: "No se ha podido cambiar: {error}",
    notUsedNow: "Ya no se usa",
    usedAgain: "Se vuelve a usar",
    newTitle: "Nuevo distribuidor",
    editTitle: "Editar distribuidor",
    subtitle: "Mayorista o depósito que sirve pedidos a vuestros clientes",
    name: "Nombre",
    namePlaceholder: "p. ej. Cofares",
    email: "Correo para pedidos",
    phone: "Teléfono",
    note: "Nota",
    notePlaceholder: "Horario de pedidos, persona de contacto…",
    add: "Añadir",
    writeName: "Escribe el nombre",
    badEmail: "El correo no parece válido",
    couldNotAdd: "No se ha podido añadir: {error}",
    couldNotSave: "No se ha podido guardar: {error}",
    added: "Distribuidor añadido",
    saved: "Guardado"
  },
  transfers: {
    title: "Transfers · {name}",
    subtitle: "Pedidos que sirve este distribuidor (los 200 últimos)",
    loading: "Cargando los transfers…",
    couldNotRead: "No se han podido leer: {error}",
    notSent: "Sin enviar",
    sent: "Enviados",
    accepted: "Aceptados",
    served: "Servidos",
    withIssue: "Con incidencia",
    order: "Pedido",
    units: "{count} uds",
    none: "Todavía no hay pedidos de este distribuidor."
  },
  alerts: {
    title: "Avisos de pedidos",
    subtitle: "Qué avisos quieres ver arriba en Pedidos",
    toCollect: "Pendientes de cobro",
    toPack: "Paquetes por preparar",
    invoicesToSend: "Facturas por enviar",
    paymentToSend: "Datos de pago por enviar",
    mandatoryForRole: "Obligatorio para tu rol",
    byRole: "Obligatorios por rol",
    byRoleHint: "Los marcados no se pueden ocultar ni quitar.",
    role: "Rol",
    mandatoryLabel: "{role}: obligatorio",
    couldNotSaveMandatory: "No se han podido guardar los obligatorios",
    saved: "Avisos guardados"
  }
};

// src/app/i18n/es/chunks/orders/orders-more.ts
var ordersMore = {
  editor: {
    alreadyInvoiced: "Ese pedido ya tiene factura: para cambiarlo, haz una rectificativa",
    voided: "Un pedido anulado no se puede editar",
    editOrder: "Editar pedido",
    editDraft: "Editar borrador",
    newOrder: "Nuevo pedido",
    subtitle: "Escribe los importes con IVA: la base y el IVA se calculan solos.",
    date: "Fecha",
    channel: "Canal",
    toPatient: "Venta {toPatient}",
    toCentre: "Venta a centro (con descuento)",
    origin: "Origen",
    manual: "Comercial, teléfono o correo",
    web: "Pedido por la web",
    portal: "Portal del centro",
    reference: "{Professional} de referencia",
    buyingCentre: "Centro que compra",
    leaveName: "Si no lo encuentras, deja el nombre escrito: el pedido quedará pendiente de atribuir.",
    pickCentre: "Elige su ficha (de tipo centro): las unidades cuentan para el centro y su comercial.",
    report: "Reportar {toProfessional}",
    lines: "Líneas",
    product: "Producto",
    units: "Unidades",
    amountWithVat: "Importe con IVA",
    discount: "% dto.",
    removeLine: "Quitar línea",
    addLine: "+ Añadir línea",
    free: "Entrega sin cargo (muestra)",
    freeHint: "Las unidades cuentan {toProfessional} de referencia y salen del stock, pero no es una venta: 0 €, sin factura, sin cobro y sin comisión.",
    paymentMethod: "Forma de pago",
    generalDiscount: "Descuento general",
    paymentReference: "Referencia del pago",
    paymentReferencePlaceholder: "Código de la transferencia, bizum…",
    sendPaymentDetails: "Enviar los datos de pago",
    transferHelpTitle: "Pago por transferencia",
    transferHelp: "Envía al cliente los datos de pago y el pedido se guarda en borrador. Cuando llegue el pago, lo confirmas desde el pedido.",
    sendPaymentLink: "Enviar enlace de pago",
    cardHelpTitle: "Pago con tarjeta o Bizum",
    cardHelp: "Al cliente le llega por SMS el enlace y elige cómo pagar. El pedido espera en borrador y, cuando paga, se confirma solo y queda cobrado con la forma de pago que haya usado.",
    receipt: "Justificante (foto o PDF)",
    attach: "📎 Adjuntar",
    removeReceipt: "Quitar {name}",
    remove: "quitar",
    service: "Servicio",
    noService: "Sin servicio",
    serviceOption: "{name} · {price} con IVA",
    serviceAmount: "Importe del servicio con IVA (€)",
    serviceVat: "IVA del servicio (%)",
    note: "Nota",
    cancel: "Cancelar",
    saveDraft: "Guardar borrador",
    saveChanges: "Guardar cambios",
    saveAndConfirm: "Guardar y confirmar",
    base: "Base <b>{amount}</b>",
    vat: "IVA {rate}% <b>{amount}</b>",
    total: "Total <b>{amount}</b>",
    unitPrice: "Precio unidad {price} con IVA",
    tenderPrice: "Precio de concurso",
    accountPlaceholder: "Nombre, código, centro o municipio",
    serviceDefault: "Servicio"
  },
  save: {
    addProduct: "Añade al menos un producto",
    fillIn: "Rellena «{field}»",
    cardTitle: "Pago con tarjeta o Bizum",
    cardText: "Se le puede enviar por SMS el enlace de pago: el pedido espera en borrador y, cuando paga, se confirma solo y queda cobrado. Si ya lo habéis cobrado de otra forma, valídalo ya.",
    cancel: "Cancelar",
    confirmNow: "Confirmar ya",
    sendLink: "Enviar enlace de pago",
    freeWithoutAccount: "Sin {professional} de referencia, estas unidades no cuentan a nadie.",
    freeTitle: "Entrega sin cargo",
    saveAnyway: "Guardar igualmente",
    transferTitle: "Pago por transferencia",
    transferText: "Este pedido se puede guardar en borrador hasta que llegue el pago: no cuenta en métricas ni comisiones y aún se puede cambiar. Cuando llegue la transferencia, lo confirmas desde el pedido.",
    saveAsDraft: "Guardar en borrador",
    confirmText: "Una vez confirmado, el pedido cuenta en métricas y comisiones y ya no se puede editar ni eliminar: solo anular.",
    confirmTitle: "¿Confirmar el pedido?",
    confirm: "Confirmar",
    saving: "Guardando…",
    noLongerEditable: "Ese pedido ya no se puede editar",
    couldNotSave: "No se ha podido guardar: {error}",
    noPermission: "sin permiso",
    reportFailed: "El pedido se ha guardado, pero no se ha podido cambiar «Reportar»",
    updated: "Pedido actualizado",
    freeDraft: "Entrega sin cargo guardada en borrador",
    freeConfirmed: "Entrega sin cargo confirmada",
    draftUntilPaid: "Guardado en borrador hasta que llegue el pago",
    draftSaved: "Borrador guardado",
    confirmedAttributed: "Pedido confirmado y atribuido",
    confirmedUnattributed: "Pedido confirmado · pendiente de atribuir",
    noMobile: "Pedido confirmado. Sin móvil {ofPatient} no se puede enviar el enlace de pago: cóbralo como siempre",
    pickForDetails: "Elige {thePatient} para enviarle los datos de pago",
    missingIban: "Falta el IBAN: ponlo en Configuración → Facturación → Datos fiscales antes de enviar los datos de pago",
    pickForLink: "Elige {thePatient} para enviarle el enlace de pago",
    patientWithoutMobile: "{Patient} no tiene móvil: añádelo en su ficha para enviarle el enlace de pago"
  },
  distributor: {
    servedBy: "Lo sirve",
    us: "Nosotros",
    aDistributor: "Un distribuidor",
    distributor: "Distribuidor",
    customerCode: "Código del cliente en el distribuidor",
    ifAny: "Si lo tiene",
    invoicedByDistributor: "Lo factura el distribuidor",
    noInvoiceOfOurs: "· no se emite factura nuestra",
    noneYet: "Todavía no hay distribuidores.",
    askAdmin: " Pide a administración que los añada.",
    addNew: "+ Nuevo distribuidor",
    noStock: "Un pedido que sirve el distribuidor no descuenta stock de vuestro almacén.",
    newTitle: "Nuevo distribuidor",
    newSubtitle: "Mayorista o depósito que sirve pedidos a vuestros clientes",
    name: "Nombre",
    namePlaceholder: "p. ej. Cofares",
    email: "Correo para pedidos",
    phone: "Teléfono",
    cancel: "Cancelar",
    add: "Añadir",
    writeName: "Escribe el nombre",
    couldNotAdd: "No se ha podido añadir: {error}",
    added: "Distribuidor añadido"
  },
  tpv: {
    noMobile: "Falta el móvil {ofPatient}: hace falta un móvil español para enviarle el enlace",
    bankRejected: "El banco no ha aceptado el cobro",
    couldNotSend: "No se ha podido enviar el enlace de pago",
    notPublished: "falta publicar la función «cobro_tpv» en el servidor",
    sent: "Enlace de pago enviado por SMS al {mobile}",
    errors: {
      permiso: "No tienes permiso para enviar cobros",
      estado: "El pedido tiene que estar confirmado",
      pagado: "Este pedido ya está cobrado",
      sinCargo: "Una entrega sin cargo no se cobra",
      importe: "El pedido no tiene importe",
      sesion: "La sesión ha caducado: vuelve a entrar",
      sinConfigurar: "El cobro con tarjeta o Bizum no está configurado (Configuración → Facturación)",
      noEncontrado: "No se encuentra el pedido"
    },
    states: {
      sent: "Enviado",
      paid: "Pagado",
      failed: "No pagado",
      expired: "Caducado",
      sending: "Enviando…"
    },
    when: "{date} a las {time}",
    notSentYet: "Todavía no se ha enviado el enlace de pago.",
    paidWith: "Pagado{method} el {when}{authorisation}{chose}",
    with: " con {method}",
    authorisation: " · autorización {code}",
    chose: " · el pedido se hizo con «{asked}» y el cliente eligió {method}",
    notAuthorised: "El banco no ha autorizado el pago",
    expiredText: "El enlace enviado al {mobile} el {when} ha caducado sin pagar",
    waiting: "Enviado por SMS al {mobile} el {when} · esperando el pago{draft}",
    confirmsAlone: ". Cuando pague, el pedido se confirma solo.",
    title: "Cobro con tarjeta o Bizum",
    openTestPage: "Abrir la página de pago (pruebas)",
    sendAgain: "Volver a enviar",
    sendLink: "Enviar enlace de pago",
    resendText: "El enlace anterior deja de valer y le llega uno nuevo por SMS.",
    resendTitle: "¿Volver a enviar el enlace de pago?",
    send: "Enviar",
    paidConfirmed: "Cobrado · pedido confirmado",
    paid: "Cobrado",
    amountChanged: "El enlace de pago enviado era de {sent} y el pedido es ahora de {now}: envía uno nuevo desde el pedido"
  },
  tpvSettings: {
    intro: "Al confirmar un pedido con forma de pago tarjeta o Bizum, {thePatient} recibe un SMS de vuestro banco con un enlace para pagar con tarjeta o Bizum. Cuando paga, el pedido queda cobrado solo. Funciona con el TPV virtual de Redsys (el de la mayoría de bancos) con PayGold activado: los datos los da el banco.",
    active: "Cobrar con tarjeta o Bizum desde los pedidos",
    merchant: "Número de comercio",
    terminal: "Terminal",
    secret: "Clave secreta del TPV",
    secretSaved: "•••••••• guardada · escribe solo para cambiarla",
    environment: "Entorno",
    test: "Pruebas (sin dinero real)",
    real: "Real",
    noticeAddress: "Dirección de aviso que hay que dar al banco:",
    useTestData: "Usar los datos de pruebas de Redsys",
    try: "Probar",
    save: "Guardar",
    merchantDigits: "El número de comercio son solo cifras (hasta 9)",
    terminalDigits: "El terminal son solo cifras (hasta 3)",
    secretMissing: "Para activarlo falta la clave secreta del TPV",
    noPermission: "Solo quien configura la empresa puede cambiar esto",
    couldNotSave: "No se ha podido guardar",
    saved: "✓ Guardado",
    saving: "Guardando…",
    trying: "Probando…",
    bankAccepts: "✓ El banco acepta los datos.",
    testPage: "Ver la página de pago de prueba (1 €)"
  },
  choosePlan: {
    custom: "Con el plan A medida, los cambios se hacen con delcos",
    changeTitle: "Cambiar la suscripción",
    contractTitle: "Contratar delcos",
    pricesPerUser: "Precios por usuario, IVA no incluido.",
    stripePage: "El pago se hace en la página segura de Stripe.",
    appliedNow: "El cambio se aplica ya y se prorratea en el próximo recibo.",
    plan: "Plan",
    payment: "Pago",
    monthly: "Mensual",
    yearly: "Anual · pagas 10 meses de 12",
    users: "Usuarios",
    usingNow: "Ahora usáis {count}. ",
    minimum: "Mínimo {count}.",
    endOfPeriod: "el final del periodo pagado",
    downgrade: "El cambio se aplicará el <b>{date}</b>, al acabar lo que ya has pagado. Hasta entonces sigues con {plan}",
    youLose: " y después dejarás de tener:",
    perYear: "al año",
    perMonth: "al mes",
    setup: "Puesta en marcha (una vez; incluida con pago anual)",
    vat: "IVA {rate} %",
    firstCharge: "Primer cobro",
    amountFrom: "Importe desde el {date}",
    newAmount: "Nuevo importe",
    cancel: "Cancelar",
    goToPayment: "Ir al pago seguro",
    schedule: "Programar el cambio",
    confirm: "Confirmar el cambio",
    scheduled: "Cambio programado para el {date}",
    done: "Cambio hecho: en unos segundos verás el plan nuevo"
  }
};

// src/app/i18n/es/chunks/orders/index.ts
var texts = { orders, ordersMore };

// src/app/screens/orders/texts.ts
registerMessages(texts);

// delcos-shared:src/app/legacy/bridge.ts
var shared2 = globalThis["__delcosModules"]["legacy/bridge"];
var pick2 = (name) => shared2[name];
var accountCardLegacy = /* @__PURE__ */ pick2("accountCardLegacy");
var accountListLegacy = /* @__PURE__ */ pick2("accountListLegacy");
var appLegacy = /* @__PURE__ */ pick2("appLegacy");
var cachedRpc = /* @__PURE__ */ pick2("cachedRpc");
var callRpc = /* @__PURE__ */ pick2("callRpc");
var cardSectionsLegacy = /* @__PURE__ */ pick2("cardSectionsLegacy");
var currentScreen = /* @__PURE__ */ pick2("currentScreen");
var cycleLegacy = /* @__PURE__ */ pick2("cycleLegacy");
var legacyDb = /* @__PURE__ */ pick2("legacyDb");
var notices = /* @__PURE__ */ pick2("notices");
var opportunitiesLegacy = /* @__PURE__ */ pick2("opportunitiesLegacy");
var permissions = /* @__PURE__ */ pick2("permissions");
var purchasesLegacy = /* @__PURE__ */ pick2("purchasesLegacy");
var showCacheNotice = /* @__PURE__ */ pick2("showCacheNotice");
var term = /* @__PURE__ */ pick2("term");

// delcos-shared:src/app/legacy/orders-bridge.ts
var shared3 = globalThis["__delcosModules"]["legacy/orders-bridge"];
var pick3 = (name) => shared3[name];
var orderMailLegacy = /* @__PURE__ */ pick3("orderMailLegacy");
var orderSheetLegacy = /* @__PURE__ */ pick3("orderSheetLegacy");
var ordersLegacy = /* @__PURE__ */ pick3("ordersLegacy");

// delcos-shared:src/app/services/format.ts
var shared4 = globalThis["__delcosModules"]["services/format"];
var pick4 = (name) => shared4[name];
var escapeHtml = /* @__PURE__ */ pick4("escapeHtml");
var formatNumber = /* @__PURE__ */ pick4("formatNumber");

// src/app/screens/orders/alerts-settings.ts
var ALERTS = [
  ["pago", "orders.alerts.toCollect", "💳"],
  ["paquete", "orders.alerts.toPack", "📦"],
  ["email_factura", "orders.alerts.invoicesToSend", "🧾"],
  ["email_pago", "orders.alerts.paymentToSend", "✉️"]
];
var PORTAL_ROLE_CAPABILITY = "portal_prescriptor";
function ownHtml(mandatory, preferences) {
  return `<div class="lista">${ALERTS.map(([key, label, icon]) => `<label class="item u-cursor-default"><input type="checkbox" data-avp="${key}" ${mandatory.includes(key) || preferences[key] !== false ? "checked" : ""} ${mandatory.includes(key) ? "disabled" : ""}>
        <span class="tx"><b>${icon} ${t(label)}</b>${mandatory.includes(key) ? `<span class="sm">${t("orders.alerts.mandatoryForRole")}</span>` : ""}</span></label>`).join("")}</div>`;
}
function rolesHtml(fixed, roles) {
  return `<h3 style="margin:14px 0 4px">${t("orders.alerts.byRole")}</h3><p class="sm">${t("orders.alerts.byRoleHint")}</p>
      <div class="dgrid-wrap"><table class="tabla avrol"><thead><tr><th>${t("orders.alerts.role")}</th>${ALERTS.map(([, label]) => `<th>${t(label)}</th>`).join("")}</tr></thead>
        <tbody>${roles.map((role) => `<tr><td>${escapeHtml(role)}</td>${ALERTS.map(([key]) => `<td style="text-align:center"><input type="checkbox" data-avr="${escapeHtml(role)}|${key}" ${(fixed[role] ?? []).includes(key) ? "checked" : ""} aria-label="${t("orders.alerts.mandatoryLabel", { role: escapeHtml(role) })}"></td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
async function save(body, admin) {
  const own = {};
  body.querySelectorAll("[data-avp]").forEach((box) => {
    if (!box.disabled) own[box.dataset.avp ?? ""] = box.checked;
  });
  if (!await orderMailLegacy.saveAlertPreferences(own)) return;
  if (admin) {
    const mandatory = {};
    body.querySelectorAll("[data-avr]:checked").forEach((box) => {
      const [role = "", key = ""] = (box.dataset.avr ?? "").split("|");
      (mandatory[role] ?? (mandatory[role] = [])).push(key);
    });
    const { data: result, error } = await legacyDb().rpc("guardar_ajuste", { p_clave: "avisos_pedidos", p_valor: { obligatorios: mandatory } });
    if (error || result?.ok === false) {
      notices.toast(t("orders.alerts.couldNotSaveMandatory"), true);
      return;
    }
  }
  document.getElementById("dlg")?.close();
  notices.toast(t("orders.alerts.saved"));
  ordersLegacy.paintOperations();
}
async function configureAlerts(mandatory) {
  const preferences = orderMailLegacy.alertPreferences(), admin = cardSectionsLegacy.can("administrar");
  const { data: settings } = admin ? await legacyDb().from("ajustes").select("valor").eq("clave", "avisos_pedidos").maybeSingle() : { data: null };
  const fixed = settings?.valor?.obligatorios ?? {}, roles = admin ? orderMailLegacy.roleNames().filter((role) => !cardSectionsLegacy.roleCan(role, PORTAL_ROLE_CAPABILITY)) : [];
  const body = document.getElementById("dbody"), box = document.getElementById("dlg");
  if (!body || !box) return;
  body.innerHTML = `<div class="fh"><div><h2>${t("orders.alerts.title")}</h2><div class="sm">${t("orders.alerts.subtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    ${ownHtml(mandatory, preferences)}
    ${admin ? rolesHtml(fixed, roles) : ""}
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t("common.cancel")}</button><button class="btn" id="avpok">${t("common.save")}</button></div>`;
  box.showModal();
  const ok = document.getElementById("avpok");
  if (ok) ok.onclick = () => {
    void save(body, admin);
  };
}

// delcos-shared:src/app/legacy/customers-bridge.ts
var shared5 = globalThis["__delcosModules"]["legacy/customers-bridge"];
var pick5 = (name) => shared5[name];
var customersLegacy = /* @__PURE__ */ pick5("customersLegacy");

// delcos-shared:src/app/services/date-format.ts
var shared6 = globalThis["__delcosModules"]["services/date-format"];
var pick6 = (name) => shared6[name];
var formatShortDate = /* @__PURE__ */ pick6("formatShortDate");

// delcos-shared:src/app/services/values.ts
var shared7 = globalThis["__delcosModules"]["services/values"];
var pick7 = (name) => shared7[name];
var nonZeroOr = /* @__PURE__ */ pick7("nonZeroOr");
var orFallback = /* @__PURE__ */ pick7("orFallback");
var range = /* @__PURE__ */ pick7("range");
var sum = /* @__PURE__ */ pick7("sum");

// delcos-shared:src/app/screens/orders/model.ts
var shared8 = globalThis["__delcosModules"]["screens/orders/model"];
var pick8 = (name) => shared8[name];
var OPERATIONS = /* @__PURE__ */ pick8("OPERATIONS");
var STATES = /* @__PURE__ */ pick8("STATES");
var TRANSFER_ISSUE = /* @__PURE__ */ pick8("TRANSFER_ISSUE");
var TRANSFER_STATES = /* @__PURE__ */ pick8("TRANSFER_STATES");
var euros = /* @__PURE__ */ pick8("euros");
var isBankTransfer = /* @__PURE__ */ pick8("isBankTransfer");
var lineBreakdown = /* @__PURE__ */ pick8("lineBreakdown");
var operationDone = /* @__PURE__ */ pick8("operationDone");
var orderTotals = /* @__PURE__ */ pick8("orderTotals");
var paymentPill = /* @__PURE__ */ pick8("paymentPill");
var round2 = /* @__PURE__ */ pick8("round2");
var statePill = /* @__PURE__ */ pick8("statePill");
var stepPill = /* @__PURE__ */ pick8("stepPill");
var storedTotals = /* @__PURE__ */ pick8("storedTotals");
var totalsHtml = /* @__PURE__ */ pick8("totalsHtml");
var transferPill = /* @__PURE__ */ pick8("transferPill");

// delcos-shared:src/app/legacy/orders2-bridge.ts
var shared9 = globalThis["__delcosModules"]["legacy/orders2-bridge"];
var pick9 = (name) => shared9[name];
var orderEditorLegacy = /* @__PURE__ */ pick9("orderEditorLegacy");
var subscriptionLegacy = /* @__PURE__ */ pick9("subscriptionLegacy");
var tpvLegacy = /* @__PURE__ */ pick9("tpvLegacy");

// src/app/screens/orders/editor/distributor.ts
async function loadDistributors(force = false) {
  const known = orderEditorLegacy.distributors();
  if (known && !force) return known;
  const { data } = await legacyDb().from("distribuidores").select("id,nombre,email,telefono,activo").order("nombre");
  const list = (data ?? []).filter((item) => item.activo);
  orderEditorLegacy.setDistributors(list);
  return list;
}
var choiceOf = (order) => ({
  on: Boolean(order?.distribuidor_id),
  id: order?.distribuidor_id ?? "",
  codigo: order?.distribuidor_codigo ?? "",
  factura: order?.distribuidor_id ? Boolean(order.factura_distribuidor) : true
});
function distributorFields(choice2) {
  const on2 = choice2.on && Boolean(choice2.id);
  return { distribuidor_id: on2 ? choice2.id : "", distribuidor_codigo: on2 ? choice2.codigo : "", factura_distribuidor: on2 && choice2.factura };
}
function choicesHtml(choice2, list, admin) {
  if (!list.length) return `<p class="sm">${t("ordersMore.distributor.noneYet")}${admin ? "" : t("ordersMore.distributor.askAdmin")}</p>`;
  return `<div class="g2"><div><label for="pdsel">${t("ordersMore.distributor.distributor")}</label><select id="pdsel">${list.map((item) => `<option value="${item.id}" ${item.id === choice2.id ? "selected" : ""}>${escapeHtml(item.nombre)}</option>`).join("")}</select></div>
        <div><label for="pdcod">${t("ordersMore.distributor.customerCode")}</label><input id="pdcod" value="${escapeHtml(choice2.codigo)}" placeholder="${t("ordersMore.distributor.ifAny")}"></div></div>
        <label class="opt"><input type="checkbox" id="pdfac" ${choice2.factura ? "checked" : ""}> ${t("ordersMore.distributor.invoicedByDistributor")} <span class="sm">${t("ordersMore.distributor.noInvoiceOfOurs")}</span></label>`;
}
function distributorHtml(choice2) {
  const list = orderEditorLegacy.distributors() ?? [], admin = cardSectionsLegacy.can("administrar");
  if (choice2.on && !choice2.id && list[0]) choice2.id = list[0].id;
  return `<div class="pdist" id="pdist"><label>${t("ordersMore.distributor.servedBy")}</label>
    <div class="segs" id="pdsirve" role="group" aria-label="${t("ordersMore.distributor.servedBy")}"><button type="button" data-ds="0" class="${choice2.on ? "" : "on"}" aria-pressed="${String(!choice2.on)}">${t("ordersMore.distributor.us")}</button>
      <button type="button" data-ds="1" class="${choice2.on ? "on" : ""}" aria-pressed="${String(choice2.on)}">${t("ordersMore.distributor.aDistributor")}</button></div>
    <div id="pddat" class="${choice2.on ? "" : "hide"}">
      ${choicesHtml(choice2, list, admin)}
      ${admin ? `<button type="button" class="lnk" id="pdnuevo">${t("ordersMore.distributor.addNew")}</button>` : ""}
      <p class="sm">${t("ordersMore.distributor.noStock")}</p></div></div>`;
}
function repaintBlock(choice2) {
  const block = document.getElementById("pdist");
  if (!block) return;
  block.outerHTML = distributorHtml(choice2);
  bindDistributor(choice2);
}
async function addDistributor(choice2) {
  const name = document.getElementById("dsn")?.value.trim() ?? "";
  if (!name) {
    notices.toast(t("ordersMore.distributor.writeName"), true);
    return;
  }
  const optional2 = (id) => {
    const text = document.getElementById(id)?.value.trim() ?? "";
    return text === "" ? null : text;
  };
  const { data, error } = await legacyDb().from("distribuidores").insert({ nombre: name, email: optional2("dse"), telefono: optional2("dst") }).select("id").single();
  if (error || !data) {
    notices.toast(t("ordersMore.distributor.couldNotAdd", { error: error?.message ?? "" }), true);
    return;
  }
  document.getElementById("dlg2")?.close();
  notices.toast(t("ordersMore.distributor.added"));
  await loadDistributors(true);
  choice2.on = true;
  choice2.id = data.id;
  repaintBlock(choice2);
}
function newDistributor(choice2) {
  const body = document.getElementById("dlg2body"), box = document.getElementById("dlg2");
  if (!body || !box) return;
  body.innerHTML = `<div class="fh"><div><h2>${t("ordersMore.distributor.newTitle")}</h2><div class="sm">${t("ordersMore.distributor.newSubtitle")}</div></div>
      <button class="x" data-cerrar2 aria-label="${t("common.close")}">✕</button></div>
    <label for="dsn">${t("ordersMore.distributor.name")}</label><input id="dsn" placeholder="${t("ordersMore.distributor.namePlaceholder")}">
    <div class="g2"><div><label for="dse">${t("ordersMore.distributor.email")}</label><input id="dse" type="email"></div><div><label for="dst">${t("ordersMore.distributor.phone")}</label><input id="dst" inputmode="tel"></div></div>
    <div class="acts u-end"><button type="button" class="btn sec" data-cerrar2>${t("ordersMore.distributor.cancel")}</button><button type="button" class="btn" id="dsok">${t("ordersMore.distributor.add")}</button></div>`;
  box.showModal();
  const ok = document.getElementById("dsok");
  if (ok) ok.onclick = () => {
    void addDistributor(choice2);
  };
}
function bindDistributor(choice2) {
  const block = document.getElementById("pdist");
  if (!block) return;
  const list = orderEditorLegacy.distributors() ?? [], buttons = block.querySelectorAll("[data-ds]");
  buttons.forEach((button) => {
    button.onclick = () => {
      choice2.on = button.dataset.ds === "1";
      if (choice2.on && !choice2.id && list[0]) choice2.id = list[0].id;
      buttons.forEach((other) => {
        other.classList.toggle("on", other === button);
        other.setAttribute("aria-pressed", String(other === button));
      });
      document.getElementById("pddat")?.classList.toggle("hide", !choice2.on);
    };
  });
  const select = document.getElementById("pdsel");
  if (select) select.onchange = () => {
    choice2.id = select.value;
  };
  const code = document.getElementById("pdcod");
  if (code) code.oninput = () => {
    choice2.codigo = code.value;
  };
  const invoice = document.getElementById("pdfac");
  if (invoice) invoice.onchange = () => {
    choice2.factura = invoice.checked;
  };
  const add = document.getElementById("pdnuevo");
  if (add) add.onclick = () => {
    newDistributor(choice2);
  };
}

// src/app/screens/orders/distributors.ts
var SETTINGS_KEY = "distribuidores";
var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var all = [];
var value = (id) => document.getElementById(id)?.value.trim() ?? "";
var secondWindow = () => document.getElementById("dlg2");
var stillShown = () => Boolean(document.getElementById("cfgcuerpo")) && ordersLegacy.settingsSection() === SETTINGS_KEY;
function editorHtml(distributor, isNew) {
  return `<div class="fh"><div><h2>${t(isNew ? "orders.distributors.newTitle" : "orders.distributors.editTitle")}</h2><div class="sm">${t("orders.distributors.subtitle")}</div></div>
      <button class="x" data-cerrar2 aria-label="${t("common.close")}">✕</button></div>
    <label for="dsn">${t("orders.distributors.name")}</label><input id="dsn" placeholder="${t("orders.distributors.namePlaceholder")}" value="${escapeHtml(distributor.nombre ?? "")}">
    <div class="g2"><div><label for="dse">${t("orders.distributors.email")}</label><input id="dse" type="email" value="${escapeHtml(distributor.email ?? "")}"></div>
      <div><label for="dst">${t("orders.distributors.phone")}</label><input id="dst" inputmode="tel" value="${escapeHtml(distributor.telefono ?? "")}"></div></div>
    <label for="dsnota">${t("orders.distributors.note")}</label><input id="dsnota" placeholder="${t("orders.distributors.notePlaceholder")}" value="${escapeHtml(distributor.nota ?? "")}">
    <div class="acts u-end"><button type="button" class="btn sec" data-cerrar2>${t("common.cancel")}</button><button type="button" class="btn" id="dsok">${t(isNew ? "orders.distributors.add" : "common.save")}</button></div>`;
}
function readForm() {
  const name = value("dsn");
  if (!name) {
    notices.toast(t("orders.distributors.writeName"), true);
    return null;
  }
  const email = value("dse") || null;
  if (email && !EMAIL.test(email)) {
    notices.toast(t("orders.distributors.badEmail"), true);
    return null;
  }
  return { nombre: name, email, telefono: value("dst") || null, nota: value("dsnota") || null };
}
async function save2(existing, button) {
  const row = readForm();
  if (!row) return;
  button.disabled = true;
  const { error } = existing ? await legacyDb().from("distribuidores").update(row).eq("id", existing.id) : await legacyDb().from("distribuidores").insert(row);
  if (error) {
    button.disabled = false;
    notices.toast(t(existing ? "orders.distributors.couldNotSave" : "orders.distributors.couldNotAdd", { error: error.message ?? "" }), true);
    return;
  }
  secondWindow()?.close();
  notices.toast(t(existing ? "orders.distributors.saved" : "orders.distributors.added"));
  await loadDistributors(true).catch(() => []);
  if (stillShown()) void paintDistributors();
}
function editDistributor(existing) {
  const body = document.getElementById("dlg2body");
  if (!body) return;
  body.innerHTML = editorHtml(existing ?? {}, !existing);
  secondWindow()?.showModal();
  const ok = document.getElementById("dsok");
  if (ok) ok.onclick = () => {
    void save2(existing, ok);
  };
}
function transfersHtml(data) {
  const summary = data?.resumen ?? {}, rows = data?.pedidos ?? [];
  const counts = [["orders.transfers.notSent", "sin_enviar"], ["orders.transfers.sent", "enviado"], ["orders.transfers.accepted", "aceptado"], ["orders.transfers.served", "servido"], ["orders.transfers.withIssue", "incidencia"]].map(([label, key]) => `<span class="${key === "incidencia" && summary[key] ? "warn" : ""}"><b>${formatNumber(summary[key] ?? 0)}</b> ${t(label)}</span>`).join("");
  const list = rows.length ? `<div class="lista trflista">${rows.map((row) => `<button type="button" class="item" data-trfped="${row.id}">
        <span class="tx"><b>${escapeHtml(orFallback(row.numero, t("orders.transfers.order")))} · ${escapeHtml(orFallback(row.cliente, "—"))}</b><span class="sm">${formatShortDate(String(row.fecha).slice(0, 10))} · ${t("orders.transfers.units", { count: formatNumber(row.unidades) })} · ${euros(row.base)}${row.transfer_nota ? ` · ${escapeHtml(row.transfer_nota)}` : ""}</span></span>
        ${transferPill(row.transfer_estado)}</button>`).join("")}</div>` : `<p class="vacio">${t("orders.transfers.none")}</p>`;
  return `<div class="trfres">${counts}</div>
    ${list}`;
}
async function showTransfers(id) {
  const distributor = all.find((item) => item.id === id), body = document.getElementById("dlg2body");
  if (!body) return;
  body.innerHTML = `<div class="fh"><div><h2>${t("orders.transfers.title", { name: escapeHtml(distributor?.nombre ?? "") })}</h2><div class="sm">${t("orders.transfers.subtitle")}</div></div>
      <button class="x" data-cerrar2 aria-label="${t("common.close")}">✕</button></div><div id="trfcuerpo"></div>`;
  customersLegacy.showLoading(document.getElementById("trfcuerpo"), t("orders.transfers.loading"));
  secondWindow()?.showModal();
  const { data, error } = await legacyDb().rpc("transfers_distribuidor", { p_dist: id });
  const box = document.getElementById("trfcuerpo");
  if (!box) return;
  if (error) {
    box.innerHTML = `<p class="vacio">${t("orders.transfers.couldNotRead", { error: escapeHtml(error.message) })}</p>`;
    return;
  }
  box.innerHTML = transfersHtml(data);
  box.querySelectorAll("[data-trfped]").forEach((button) => {
    button.onclick = () => {
      secondWindow()?.close();
      appLegacy.openOrder(button.dataset.trfped ?? "");
    };
  });
}
var rowHtml = (item) => `<div class="ajfila disfila${item.activo ? "" : " disoff"}" data-disid="${item.id}">
      <div><b>${escapeHtml(item.nombre)}${item.activo ? "" : ` <span class="pill">${t("orders.distributors.notUsed")}</span>`}</b>
        <span class="sm">${[item.email, item.telefono].filter((text) => Boolean(text)).map(escapeHtml).join(" · ") || t("orders.distributors.noContact")}${item.nota ? ` · ${escapeHtml(item.nota)}` : ""}</span></div>
      <div class="ajctl"><button type="button" class="btn sec" data-distrf="${item.id}">${t("orders.distributors.transfers")}</button><button type="button" class="btn sec" data-dised="${item.id}">${t("orders.distributors.edit")}</button>
        <button type="button" class="btn sec" data-disact="${item.id}">${t(item.activo ? "orders.distributors.stopUsing" : "orders.distributors.useAgain")}</button></div></div>`;
function pageHtml() {
  const used = all.filter((item) => item.activo), unused = all.filter((item) => !item.activo);
  const list = all.length ? used.map(rowHtml).join("") + (unused.length ? `<h3 class="dissub">${t("orders.distributors.noLongerUsed")}</h3>${unused.map(rowHtml).join("")}` : "") : `<p class="vacio" id="disvacio">${t("orders.distributors.none")}</p>`;
  return `<div class="card disw">
      <div class="discab"><p class="sm">${t("orders.distributors.hint")}</p>
        <button type="button" class="btn" id="disnuevo">${t("orders.distributors.new")}</button></div>
      ${list}</div>`;
}
async function toggleUse(item, button) {
  if (item.activo && !await notices.confirm(t("orders.distributors.stopText"), { titulo: t("orders.distributors.stopTitle", { name: item.nombre }), ok: t("orders.distributors.stopUsing") })) return;
  button.disabled = true;
  const { error } = await legacyDb().from("distribuidores").update({ activo: !item.activo }).eq("id", item.id);
  if (error) {
    button.disabled = false;
    notices.toast(t("orders.distributors.couldNotChange", { error: error.message ?? "" }), true);
    return;
  }
  notices.toast(t(item.activo ? "orders.distributors.notUsedNow" : "orders.distributors.usedAgain"));
  await loadDistributors(true).catch(() => []);
  void paintDistributors();
}
function bind(box) {
  const add = document.getElementById("disnuevo");
  if (add) add.onclick = () => {
    editDistributor(null);
  };
  const find = (id) => all.find((item) => item.id === id);
  box.querySelectorAll("[data-dised]").forEach((button) => {
    button.onclick = () => {
      editDistributor(find(button.dataset.dised) ?? null);
    };
  });
  box.querySelectorAll("[data-disact]").forEach((button) => {
    button.onclick = () => {
      const item = find(button.dataset.disact);
      if (item) void toggleUse(item, button);
    };
  });
  box.querySelectorAll("[data-distrf]").forEach((button) => {
    button.onclick = () => {
      void showTransfers(button.dataset.distrf ?? "");
    };
  });
}
async function paintDistributors() {
  const loading = document.getElementById("cfgcuerpo");
  if (!loading) return;
  customersLegacy.showLoading(loading, t("orders.distributors.loading"));
  const { data, error } = await legacyDb().from("distribuidores").select("id,nombre,email,telefono,nota,activo").order("nombre");
  const box = document.getElementById("cfgcuerpo");
  if (!box || !stillShown()) return;
  if (error) {
    box.innerHTML = `<div class="card"><p class="sm">${t("orders.distributors.couldNotRead", { error: escapeHtml(error.message) })}</p></div>`;
    return;
  }
  all = data ?? [];
  box.innerHTML = pageHtml();
  bind(box);
}

// delcos-shared:src/app/components/filters/memory.ts
var shared10 = globalThis["__delcosModules"]["components/filters/memory"];
var pick10 = (name) => shared10[name];
var restoreFilters = /* @__PURE__ */ pick10("restoreFilters");

// src/app/screens/orders/list.ts
var PAID = "Cobrado";
var EXTRA_FILTERS = [
  { id: "popf", after: "pestado", html: () => `<div><label for="popf">${t("orders.list.operations")}</label><select id="popf">
      <option value="">${t("orders.list.everything")}</option><option value="pago">${t("orders.list.toCollect")}</option><option value="paquete">${t("orders.list.toPack")}</option><option value="email">${t("orders.list.invoiceToSend")}</option></select></div>` },
  // v2.115.0: the order's origin (web or the rest)
  { id: "porigf", after: "popf", html: () => `<div><label for="porigf">${t("orders.list.origin")}</label><select id="porigf">
      <option value="">${t("orders.page.all")}</option><option value="web">${t("orders.list.web")}</option><option value="portal">${t("orders.list.portal")}</option><option value="otros">${t("orders.list.others")}</option></select></div>` },
  // v2.329.0: reported or not to the professional (internal: only who sees everything)
  { id: "prepf", after: "porigf", onlyTeam: true, html: () => `<div><label for="prepf">${t("orders.list.report")}</label><select id="prepf">
      <option value="">${t("orders.page.all")}</option><option value="si">${t("orders.list.reported")}</option><option value="no">${t("orders.list.notReported")}</option></select></div>` }
];
function addExtraFilters() {
  for (const filter of EXTRA_FILTERS) {
    const previous = document.getElementById(filter.after);
    if (document.getElementById(filter.id) || !previous || filter.onlyTeam && !permissions.seesEverything()) continue;
    previous.closest("div")?.insertAdjacentHTML("afterend", filter.html());
    const select = document.getElementById(filter.id);
    if (select) select.onchange = () => {
      ordersLegacy.setPage(0);
      void paintOrderList();
    };
  }
}
var valueOf = (id) => document.getElementById(id)?.value ?? "";
function params() {
  const range2 = opportunitiesLegacy.periodOf(document.getElementById("pper")), size = accountListLegacy.pageSize(), fields = ordersLegacy.fieldFilters();
  return {
    p_desde: range2.desde,
    p_hasta: range2.hasta,
    p_canal: valueOf("pcanal") || null,
    q: valueOf("pq").trim() || null,
    p_estado: valueOf("pestado") || null,
    p_operativa: valueOf("popf") || null,
    lim: size,
    desplaz: ordersLegacy.page() * size,
    ...valueOf("porigf") ? { p_origen: valueOf("porigf") } : {},
    ...valueOf("prepf") ? { p_reportado: valueOf("prepf") } : {},
    ...Object.keys(fields).length ? { f_campos: fields } : {}
  };
}
function summaryHtml(summary) {
  const amounts2 = permissions.canSeeAmounts(), drafts = summary.borradores ? t("orders.list.inDraft", { count: summary.borradores }) : "";
  const web = summary.web_pedidos !== null && summary.web_pedidos !== void 0 ? `<div class="kpi" id="pkweb"><b>${formatNumber(summary.web_pedidos)}</b><span>${t("orders.list.byWeb")}${amounts2 && summary.web_base !== null && summary.web_base !== void 0 ? t("orders.list.withoutVat", { amount: euros(summary.web_base) }) : ""}</span></div>` : "";
  return `
    <div class="kpi"><b>${formatNumber(summary.pedidos)}</b><span>${t("orders.list.completed")}${drafts}</span></div>
    <div class="kpi"><b>${formatNumber(summary.unidades)}</b><span>${t("orders.list.units")}</span></div>
    ${web}
    ${amounts2 ? `<div class="kpi"><b>${euros(summary.base)}</b><span>${t("orders.list.base")}</span></div>
    <div class="kpi"><b>${euros(summary.iva)}</b><span>${t("orders.list.vat")}</span></div>
    <div class="kpi ok"><b>${euros(summary.total)}</b><span>${t("orders.list.total")}</span></div>` : ""}`;
}
var mark = (done) => done ? "ok" : "no";
function operationIcons(row) {
  if (row.estado !== STATES.confirmed) return "";
  const packed = Boolean(row.paquete_en), packedText = t(packed ? "orders.list.packageReady" : "orders.list.packageToPrepare");
  if (row.sin_cargo) return `<span class="opico" title="${packedText}"><i class="${mark(packed)}">📦</i></span>`;
  const paid = row.pago_estado === PAID, sent = Boolean(row.email_factura_en);
  const title = `${t(paid ? "orders.list.paymentReceived" : "orders.list.paymentPending")} · ${packedText}${row.factura ? ` · ${t(sent ? "orders.list.invoiceSent" : "orders.list.invoiceToSendShort")}` : ""}`;
  return `<span class="opico" title="${title}">
      <i class="${mark(paid)}">💳</i><i class="${mark(packed)}">📦</i>${row.factura ? `<i class="${mark(sent)}">🧾</i>` : ""}</span>`;
}
function originText(row) {
  if (row.origen === "web") return ` · <span class="pweb">${t("orders.list.webTag")}</span>`;
  return row.origen === "portal" ? ` · <span class="pweb">${t("orders.list.portalTag")}</span>` : "";
}
function rowHtml2(row, fields) {
  const amounts2 = permissions.canSeeAmounts(), reference = orFallback(row.factura, row.numero ?? "");
  return `<button class="dr" data-ped="${row.id}" style="${row.estado === STATES.voided ? "opacity:.55" : ""}">
      <span>${formatShortDate(row.fecha)}${reference ? `<span class="sm">${escapeHtml(reference)}</span>` : ""}</span>
      <span><b>${escapeHtml(orFallback(row.contacto, orFallback(row.centro, orFallback(row.cuenta_texto, "—"))))}</b><span class="sm">${ordersLegacy.channelLabel(row, row.total)}${originText(row)}${row.forma_pago ? ` · ${escapeHtml(row.forma_pago)}` : ""}${row.justificante ? ` · <span title="${t("orders.list.withReceipt")}">📎</span>` : ""}</span></span>
      <span class="corta">${row.medico ? escapeHtml(row.medico) : `<span class="vac">${t("orders.list.unattributed")}</span>`}</span>
      <span>${row.comercial ? escapeHtml(row.comercial) : '<span class="vac">—</span>'}</span>
      <span class="sm corta">${escapeHtml(row.productos ?? "")}</span><span class="num">${formatNumber(row.unidades)}</span>
      ${amounts2 ? `<span class="num">${euros(row.base)}</span><span class="num"><b>${euros(row.total)}</b></span>` : ""}
      <span>${stepPill(row)}</span><span>${operationIcons(row)}</span><span class="sm corta pednota" title="${escapeHtml(row.nota ?? "")}">${escapeHtml(row.nota ?? "")}</span>${ordersLegacy.fieldCells(fields, row.clasificadores)}</button>`;
}
function tableHtml(rows, fields) {
  if (!rows.length) return `<div class="vacio">${t("orders.list.none")}</div>`;
  const amounts2 = permissions.canSeeAmounts();
  return `<div class="dgrid-wrap"><div class="dgrid peds2 ${amounts2 ? "" : "sinimp"}">
    <div class="dh"><span>${t("orders.list.date")}</span><span>${t("orders.list.customer")}</span><span>${term("medico", { capital: "C" })}</span><span>${t("orders.list.salesperson")}</span><span>${t("orders.list.products")}</span>
      <span class="num">${t("orders.list.unitsShort")}</span>${amounts2 ? `<span class="num">${t("orders.list.baseShort")}</span><span class="num">${t("orders.list.totalShort")}</span>` : ""}<span>${t("orders.list.state")}</span><span>${t("orders.list.operations")}</span><span>${t("orders.list.notes")}</span>${customersLegacy.fieldHeaders(fields)}</div>
    ${rows.map((row) => rowHtml2(row, fields)).join("")}
  </div></div>`;
}
function paintPages(list, total) {
  if (!document.getElementById("pedpag")) list.insertAdjacentHTML("afterend", '<div id="pedpag"></div>');
  accountListLegacy.paginate({
    element: document.getElementById("pedpag"),
    total,
    page: ordersLegacy.page(),
    onPage: (page) => {
      ordersLegacy.setPage(page);
      void paintOrderList();
      document.getElementById("pedlista")?.scrollIntoView({ block: "start" });
    },
    onSize: () => {
      ordersLegacy.setPage(0);
      void paintOrderList();
    }
  });
}
function paint(list, data) {
  const rows = data.filas ?? [], fields = ordersLegacy.fieldColumns();
  ordersLegacy.setRows(rows);
  const totals = document.getElementById("ptotales");
  if (totals) totals.innerHTML = summaryHtml(data.resumen ?? {});
  list.innerHTML = tableHtml(rows, fields);
  customersLegacy.widenGrid(list.querySelector(".dgrid.peds2"), fields.length);
  paintPages(list, data.total);
  list.querySelectorAll("[data-ped]").forEach((button) => {
    button.onclick = () => {
      appLegacy.openOrder(button.dataset.ped ?? "");
    };
  });
}
async function paintOrderList() {
  if (!document.getElementById("pedlista") || !document.getElementById("pper") || !document.getElementById("pcanal")) return;
  addExtraFilters();
  restoreFilters(document.getElementById("v-ventas"));
  const query = params(), loading = document.getElementById("pedlista");
  if (loading && !loading.querySelector(".dgrid")) customersLegacy.showLoading(loading, t("orders.list.loading"));
  const result = await cachedRpc("pedidos_pagina", query, `pedidos-${JSON.stringify(query)}`);
  const list = document.getElementById("pedlista");
  if (!list || !document.getElementById("pestado")) return;
  if (!result.data) {
    const error = result.error;
    list.innerHTML = `<div class="vacio">${t("orders.list.couldNotLoad", { error: error ? `: ${escapeHtml(error.message)}` : "" })}</div>`;
    return;
  }
  paint(list, result.data);
  if (result.cache) showCacheNotice(list, result.fecha);
}

// delcos-shared:src/app/components/index.ts
var shared11 = globalThis["__delcosModules"]["components/index"];
var pick11 = (name) => shared11[name];
var glueHelp = /* @__PURE__ */ pick11("glueHelp");

// delcos-shared:src/app/screens/purchases/index.ts
var shared12 = globalThis["__delcosModules"]["screens/purchases/index"];
var pick12 = (name) => shared12[name];
var editSupplier = /* @__PURE__ */ pick12("editSupplier");
var paintPurchases = /* @__PURE__ */ pick12("paintPurchases");
var paintSuppliers = /* @__PURE__ */ pick12("paintSuppliers");

// src/app/screens/orders/page.ts
var SEARCH_WAIT_MS = 350;
var SALES = "ventas";
var PURCHASES = "compras";
var SUPPLIERS = "proveedores";
var CALLS = "llamadas";
var searchTimer;
function baseHtml([title, subtitle]) {
  return `
    <div class="saludo"><div><h1>${escapeHtml(title)}</h1><div class="fecha">${escapeHtml(subtitle)}</div></div>
      <div class="acts u-m-0">${customersLegacy.canSell() ? `<button class="btn" id="pednuevo">${t("orders.page.newSale")}</button>` : ""}</div></div>
    <div id="vcuerpo">
      <div class="panel">
        <div class="filtros">
          <div id="pper"></div>
          <div><label for="pcanal">${t("orders.page.channel")}</label><select id="pcanal">
            <option value="">${t("orders.page.all")}</option><option value="paciente">${t("orders.page.saleTo", { customer: term("paciente", { article: "al" }) })}</option>
            <option value="centro">${t("orders.page.saleToCentre")}</option></select></div>
          <div><label for="pestado">${t("orders.page.state")}</label><select id="pestado">
            <option value="">${t("orders.page.all")}</option><option value="Confirmado">${t("orders.page.confirmed")}</option>
            <option value="Borrador">${t("orders.page.drafts")}</option><option value="Anulado">${t("orders.page.voided")}</option></select></div>
          <div><label for="pq">${t("orders.page.search")}</label><input id="pq" type="search" placeholder="${t("orders.page.searchPlaceholder", { professional: term("medico", { capital: "C" }), customer: term("paciente") })}"></div>
        </div>
        <div class="kpis vtot" id="ptotales"></div>
        <div id="pedlista"></div>
      </div>
    </div>`;
}
async function paintBase(section) {
  const view = document.getElementById("v-ventas");
  if (!view) return;
  customersLegacy.clearModules("v-ventas");
  view.innerHTML = baseHtml(ordersLegacy.sectionTitle(section));
  const add = document.getElementById("pednuevo");
  if (add) add.onclick = () => {
    ordersLegacy.newSale();
  };
  const repaint2 = () => {
    void paintOrderList();
  };
  opportunitiesLegacy.mountPeriod(document.getElementById("pper"), { id: "ventas", valor: "mes", alCambiar: repaint2 });
  ["pcanal", "pestado"].forEach((id) => {
    const select = document.getElementById(id);
    if (select) select.onchange = repaint2;
  });
  const search = document.getElementById("pq");
  if (search) search.oninput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(repaint2, SEARCH_WAIT_MS);
  };
  await purchasesLegacy.loadProducts();
  repaint2();
  ordersLegacy.paintUnattributed();
}
var shownSection = (loading) => loading || ordersLegacy.section();
function tabsHtml(loading) {
  const shown = shownSection(loading);
  return `<div class="subnav" id="pedsub">${[[SALES, "orders.page.tabSales"], [PURCHASES, "orders.page.tabPurchases"], [SUPPLIERS, "orders.page.tabSuppliers"]].map(([section = "", key = ""]) => `<button data-pedsec="${section}" aria-pressed="${String(shown === section)}">${t(key)}</button>`).join("\n    ")}</div>`;
}
function paintSections(loading) {
  const view = document.getElementById("v-ventas");
  if (!view) return;
  view.querySelector(".saludo")?.insertAdjacentHTML("afterend", tabsHtml(loading));
  view.querySelectorAll("[data-pedsec]").forEach((button) => {
    button.onclick = () => {
      ordersLegacy.setSection(button.dataset.pedsec ?? SALES);
      ordersLegacy.reload();
    };
  });
  const section = ordersLegacy.section();
  if (section === SALES) return;
  const actions = view.querySelector(".saludo .acts");
  if (actions) actions.innerHTML = purchaseButton(section);
  const purchase = document.getElementById("compnueva");
  if (purchase) purchase.onclick = () => {
    purchasesLegacy.openPurchase(null);
  };
  const supplier = document.getElementById("provnuevo");
  if (supplier) supplier.onclick = () => {
    editSupplier(null);
  };
  void (section === PURCHASES ? paintPurchases() : paintSuppliers());
}
function purchaseButton(section) {
  if (!purchasesLegacy.canBuy()) return "";
  return section === PURCHASES ? `<button class="btn" id="compnueva">${t("orders.page.newPurchase")}</button>` : `<button class="btn" id="provnuevo">${t("orders.page.newSupplier")}</button>`;
}
function addOpportunitiesTab(tabs, current) {
  if (!tabs || !permissions.seesEverything() || !permissions.hasOpportunities() || tabs.querySelector(`[data-pedsec="${CALLS}"]`)) return;
  tabs.insertAdjacentHTML("beforeend", `<button data-pedsec="${CALLS}" aria-pressed="${String(current === CALLS)}">${t("orders.page.tabOpportunities")}</button>`);
  const button = tabs.querySelector(`[data-pedsec="${CALLS}"]`);
  if (button) button.onclick = () => {
    ordersLegacy.setSection(CALLS);
    ordersLegacy.reload();
  };
}
function paintCalls(section) {
  ordersLegacy.setSection(section === CALLS && !permissions.hasOpportunities() ? SALES : section);
  const current = ordersLegacy.section(), tabs = document.getElementById("pedsub");
  addOpportunitiesTab(tabs, current);
  tabs?.querySelectorAll("[data-pedsec]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.pedsec === current));
  });
  if (current === SALES && permissions.seesEverything()) ordersLegacy.paintOperations();
  if (current !== CALLS) return;
  const actions = document.querySelector("#v-ventas .saludo .acts");
  if (actions) actions.innerHTML = `<button class="btn" id="llnueva">${t("orders.page.newSale")}</button>`;
  const add = document.getElementById("llnueva");
  if (add) add.onclick = () => {
    ordersLegacy.newSale();
  };
  opportunitiesLegacy.repaintList();
}
function setHeading(heading, title) {
  const help = heading.querySelector(".ai");
  heading.textContent = title;
  if (!help) return;
  glueHelp(heading, "");
  (heading.querySelector(".ai-pegada") ?? heading).append(help);
}
function paintTitle() {
  const view = document.getElementById("v-ventas"), [title, subtitle] = ordersLegacy.sectionTitle(ordersLegacy.section());
  const heading = view?.querySelector(".saludo h1");
  if (heading) setHeading(heading, title);
  const date = view?.querySelector(".saludo .fecha");
  if (date) date.textContent = subtitle;
  ordersLegacy.markSection();
}
async function loadSales() {
  if (ordersLegacy.section() === CALLS && !permissions.seesEverything()) ordersLegacy.setSection(SALES);
  const section = ordersLegacy.section();
  if (section === CALLS) ordersLegacy.setSection(PURCHASES);
  ordersLegacy.setLoadingSection(section);
  try {
    await paintBase(section);
    paintSections(section);
  } finally {
    ordersLegacy.setLoadingSection(null);
  }
  paintCalls(section);
  paintTitle();
  const body = document.getElementById("vcuerpo");
  if (ordersLegacy.section() === SALES && body && ordersLegacy.canAttribute() && !document.getElementById("cardsinatr")) {
    body.insertAdjacentHTML("afterbegin", '<div class="card hide" id="cardsinatr"></div>');
    ordersLegacy.paintUnattributed();
  }
}

// delcos-shared:src/app/screens/orders/payment-email.ts
var shared13 = globalThis["__delcosModules"]["screens/orders/payment-email"];
var pick13 = (name) => shared13[name];
var askPaymentEmailSent = /* @__PURE__ */ pick13("askPaymentEmailSent");
var mailtoLink = /* @__PURE__ */ pick13("mailtoLink");
var paymentSubject = /* @__PURE__ */ pick13("paymentSubject");
var paymentText = /* @__PURE__ */ pick13("paymentText");
var sendPaymentDetails = /* @__PURE__ */ pick13("sendPaymentDetails");

// src/app/screens/orders/sheet/bank-transfer.ts
var PAID_FLAG_MS = 6e4;
function blockHtml(detail) {
  const order = detail.pedido, sent = order.email_pago_en;
  const status = sent ? t("orders.bankTransfer.sentOn", { date: formatShortDate(String(sent).slice(0, 10)) }) : t("orders.bankTransfer.notSent");
  const send = detail.contacto?.email ? `<button type="button" class="btn sec chico" id="pdtrfmail">${t(sent ? "orders.bankTransfer.sendAgain" : "orders.bankTransfer.send")}</button>` : `<span class="sm">${t("orders.bankTransfer.noEmail", { customer: escapeHtml(term("paciente", { capital: "C" })) })}</span>`;
  return `<div class="blk" id="pdtrfb"><h3>${t("orders.bankTransfer.title")}</h3>
      <p class="sm">${status}</p>
      <div class="acts pdtrfacts">${send}
        <button type="button" class="btn chico" id="pdtrfok">${t("orders.bankTransfer.paidConfirm")}</button></div></div>`;
}
function paintBankTransfer(detail) {
  const dialog2 = document.getElementById("dlg"), confirm2 = document.getElementById("pdvalidar");
  if (!dialog2?.open || document.getElementById("pdtrfb") || !confirm2 || !customersLegacy.canSell()) return;
  const order = detail.pedido;
  if (order.estado !== STATES.draft || !isBankTransfer(order.forma_pago)) return;
  confirm2.closest(".acts")?.insertAdjacentHTML("beforebegin", blockHtml(detail));
  const send = document.getElementById("pdtrfmail");
  if (send) send.onclick = async () => {
    send.disabled = true;
    if (await sendPaymentDetails(order.id)) appLegacy.openOrder(order.id);
    else send.disabled = false;
  };
  const paid = document.getElementById("pdtrfok");
  if (paid) paid.onclick = () => {
    confirm2.dataset.pago = "1";
    confirm2.click();
    setTimeout(() => {
      if (confirm2.isConnected) delete confirm2.dataset.pago;
    }, PAID_FLAG_MS);
  };
}

// src/app/screens/orders/sheet/non-fiscal.ts
var value2 = (id) => document.getElementById(id)?.value.trim() ?? "";
function formHtml(detail) {
  const order = detail.pedido;
  const methods = ordersLegacy.paymentMethods().map((method) => `<option ${order.forma_pago === method.valor ? "selected" : ""}>${escapeHtml(method.valor)}</option>`).join("");
  return `<div class="fh"><div><h2>${t("orders.nonFiscal.title", { number: escapeHtml(order.numero ?? "") })}</h2>
      <div class="sm">${t("orders.nonFiscal.subtitle")}</div></div>
      <button class="x" data-cerrar2 aria-label="${t("common.close")}">✕</button></div>
    <label for="nfnota">${t("orders.nonFiscal.note")}</label><textarea id="nfnota" rows="4">${escapeHtml(order.nota ?? "")}</textarea>
    <div class="g2"><div><label for="nffp">${t("orders.nonFiscal.paymentMethod")}</label><select id="nffp"><option value="">—</option>${methods}</select></div>
      <div><label for="nfref">${t("orders.nonFiscal.paymentReference")}</label><input id="nfref" value="${escapeHtml(order.pago_referencia ?? "")}" placeholder="${t("orders.nonFiscal.referencePlaceholder")}"></div></div>
    ${order.factura_id ? `<p class="sm">${t("orders.nonFiscal.invoiceKeeps")}</p>` : ""}
    <div id="nfcampos">${orderSheetLegacy.fieldsForm(order.clasificadores ?? {})}</div>
    <div class="acts nfacts"><button class="btn sec" data-cerrar2>${t("common.cancel")}</button><button class="btn" id="nfok">${t("common.save")}</button></div>`;
}
async function save3(id, button) {
  const read2 = orderSheetLegacy.readFields(document.getElementById("nfcampos"));
  const missing = read2?.falta[0];
  if (missing) {
    notices.toast(t("orders.nonFiscal.fillIn", { field: missing }), true);
    return;
  }
  button.disabled = true;
  const { error } = await legacyDb().from("pedidos").update({ nota: value2("nfnota") || null, forma_pago: value2("nffp") || null, pago_referencia: value2("nfref") || null }).eq("id", id);
  if (error) {
    button.disabled = false;
    notices.toast(t("orders.nonFiscal.couldNotSave", { error: error.message ?? "" }), true);
    return;
  }
  if (!await orderSheetLegacy.saveFields(read2, id)) {
    button.disabled = false;
    return;
  }
  document.getElementById("dlg2")?.close();
  notices.toast(t("orders.nonFiscal.saved"));
  try {
    appLegacy.forgetCache();
  } catch {
  }
  appLegacy.openOrder(id);
}
function editNonFiscal(detail) {
  const body = document.getElementById("dlg2body"), box = document.getElementById("dlg2");
  if (!body || !box) return;
  body.innerHTML = formHtml(detail);
  box.showModal();
  const ok = document.getElementById("nfok");
  if (ok) ok.onclick = () => {
    void save3(detail.pedido.id, ok);
  };
}

// src/app/screens/orders/sheet/base.ts
var dialog = () => document.getElementById("dlg");
var reloadSales = () => {
  if (currentScreen() === "ventas") ordersLegacy.reload();
};
var failureOf = (error, result) => orFallback(error?.message, result?.error ?? "");
function lineHtml(line) {
  const amounts2 = lineBreakdown(line);
  return `<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--line)">
        <span><b>${escapeHtml(orFallback(line.producto, t("orders.sheet.noProduct")))}</b> · ${t("orders.sheet.units", { count: formatNumber(line.unidades) })}
          <div class="sm">${t("orders.sheet.base", { amount: euros(amounts2.base) })}${Number(line.descuento) ? t("orders.sheet.discount", { percent: formatNumber(line.descuento) }) : ""} · ${t("orders.sheet.vat", { rate: formatNumber(line.iva ?? 0), amount: euros(amounts2.iva) })}</div></span>
        <b style="white-space:nowrap">${euros(amounts2.total)}</b></div>`;
}
function peopleHtml(detail) {
  const contact = detail.contacto, professional = detail.medico, firstLine = (detail.lineas ?? [])[0];
  return `${contact ? `<div class="blk"><h3>${term("paciente", { capital: "C" })}</h3><div><b>${escapeHtml(contact.nombre)}</b></div>
      <div class="sm">${escapeHtml(orFallback(contact.telefono, contact.movil ?? ""))} ${escapeHtml(contact.email ?? "")}</div>
      <div class="acts"><button class="btn sec" data-vpac="${contact.id}">${t("orders.sheet.seeCustomer", { customer: term("paciente", { article: "del" }) })}</button></div></div>` : ""}
    ${professional ? `<div class="blk"><h3>${term("medico", { capital: "C" })}</h3><div><b>${escapeHtml(professional.nombre)}</b> <span class="sm">${t("orders.sheet.code", { code: escapeHtml(professional.codigo) })}</span></div>
      ${firstLine?.comercial ? `<div class="sm">${t("orders.sheet.salesperson", { name: escapeHtml(firstLine.comercial) })}</div>` : ""}</div>` : ""}`;
}
function actionsHtml(detail) {
  const order = detail.pedido, draft = order.estado === STATES.draft, open = !draft && order.estado !== STATES.voided, can = customersLegacy.canSell();
  const editButton = order.factura_id ? `<button class="btn sec" id="pdeditnf">${t("orders.sheet.editData")}</button>` : `<button class="btn sec" id="pdeditar">${t("orders.sheet.editOrder")}</button>`;
  return `<div class="acts u-end">
      ${can && draft ? `<button class="btn sec dang" id="pdborrar">${t("orders.sheet.deleteDraft")}</button>
        <button class="btn sec" id="pdeditar">${t("orders.sheet.edit")}</button>
        <button class="btn" id="pdvalidar">${t("orders.sheet.confirm")}</button>` : ""}
      ${can && open ? editButton : ""}
      ${can && open ? `<button class="btn sec dang" id="pdanular">${t("orders.sheet.void")}</button>` : ""}
      <button class="btn sec" data-cerrar>${t("common.close")}</button></div>`;
}
function sheetHtml(detail) {
  const order = detail.pedido, totals = storedTotals(detail), lines3 = detail.lineas ?? [];
  return `
    <div class="fh pdcab"><div class="pdcabt"><h2>${t("orders.sheet.title")}${order.numero ? ` ${escapeHtml(order.numero)}` : ""}</h2>${statePill(order.estado)}${paymentPill(order)}
      <span class="sm pdmeta">${formatShortDate(order.fecha)} · ${ordersLegacy.channelLabel(order, totals.total)}${order.forma_pago ? ` · ${escapeHtml(order.forma_pago)}` : ""}</span></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    ${order.estado === STATES.draft ? `<div class="cacheaviso u-mt-10">${t("orders.sheet.draftNotice")}</div>` : ""}
    ${peopleHtml(detail)}
    <div class="blk"><h3>${t("orders.sheet.lines")}</h3>
      ${lines3.map(lineHtml).join("") || `<div class="sm">${t("orders.sheet.noLines")}</div>`}
      <div class="totbox">${totalsHtml(totals)}</div></div>
    ${order.nota ? `<div class="blk"><h3>${t("orders.sheet.note")}</h3><div>${escapeHtml(order.nota)}</div></div>` : ""}
    ${actionsHtml(detail)}`;
}
function confirmPayload(detail) {
  const order = detail.pedido, rate = Number(order.envio_iva) || 0;
  return {
    id: order.id,
    estado: STATES.confirmed,
    fecha: order.fecha,
    canal: order.canal,
    contacto_id: order.contacto_id,
    centro_id: order.centro_id,
    cuenta_id: detail.medico ? detail.medico.id : null,
    cuenta_texto: order.cuenta_texto,
    nota: order.nota,
    forma_pago: order.forma_pago,
    pago_referencia: order.pago_referencia ?? "",
    descuento: order.descuento ?? 0,
    descuento_tipo: order.descuento_tipo,
    envio: Boolean(order.envio),
    envio_con_iva: order.envio ? round2(Number(order.envio_base) * (1 + rate / 100)) : 0,
    envio_iva: order.envio_iva,
    servicio_id: order.servicio_id,
    lineas: (detail.lineas ?? []).map((line) => ({ producto_id: line.producto_id, unidades: line.unidades, importe: line.importe, descuento: line.descuento, iva: line.iva }))
  };
}
async function confirmOrder(detail, button) {
  const paid = Boolean(button.dataset.pago);
  if (!await notices.confirm((paid ? t("orders.sheet.paymentNoted") : "") + t("orders.sheet.confirmText"), { titulo: t("orders.sheet.confirmTitle"), ok: t("orders.sheet.confirmOk") })) return;
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc("guardar_pedido", { p: confirmPayload(detail) });
  button.disabled = false;
  if (error || result?.ok === false) {
    notices.toast(t("orders.sheet.couldNotConfirm", { error: failureOf(error, result) }), true);
    return;
  }
  const id = detail.pedido.id;
  if (paid) await legacyDb().rpc("marcar_operativa", { p_pedido: id, p_campo: "pago", p_hecho: true });
  notices.toast(t(paid ? "orders.sheet.confirmedAndPaid" : "orders.sheet.confirmed"));
  appLegacy.openOrder(id);
  reloadSales();
}
async function deleteDraft(id) {
  if (!await notices.confirm(t("orders.sheet.deleteText"), { titulo: t("orders.sheet.deleteTitle"), ok: t("orders.sheet.deleteOk"), peligro: true })) return;
  const { data: result, error } = await legacyDb().rpc("borrar_pedido", { p_id: id });
  if (error || result?.ok === false) {
    notices.toast(t(result?.error === "validado" ? "orders.sheet.onlyDrafts" : "orders.sheet.couldNotDelete"), true);
    return;
  }
  dialog()?.close();
  notices.toast(t("orders.sheet.deleted"));
  reloadSales();
}
async function voidOrder(id) {
  const reason = await orderSheetLegacy.askText(t("orders.sheet.voidReason"), "", { titulo: t("orders.sheet.voidTitle"), ok: t("orders.sheet.voidOk") });
  if (reason === null) return;
  const { data: result, error } = await legacyDb().rpc("anular_pedido", { p_id: id, p_motivo: reason || null });
  if (error || result?.ok === false) {
    notices.toast(result?.error === "facturado" ? t("orders.sheet.voidInvoiced") : t("orders.sheet.couldNotVoid", { error: failureOf(error, result) }), true);
    return;
  }
  dialog()?.close();
  notices.toast(t("orders.sheet.voided"));
  reloadSales();
}
function bind2(body, detail) {
  const id = detail.pedido.id, on2 = (elementId, action) => {
    const button = document.getElementById(elementId);
    if (button) button.onclick = () => {
      action(button);
    };
  };
  const customer = body.querySelector("[data-vpac]");
  if (customer) customer.onclick = () => {
    orderSheetLegacy.openCustomer(customer.dataset.vpac ?? "");
  };
  on2("pdeditar", () => {
    orderSheetLegacy.edit(detail);
  });
  on2("pdeditnf", () => {
    editNonFiscal(detail);
  });
  on2("pdborrar", () => {
    void deleteDraft(id);
  });
  on2("pdvalidar", (button) => {
    void confirmOrder(detail, button);
  });
  on2("pdanular", () => {
    void voidOrder(id);
  });
}
async function paintBase2(id) {
  const body = document.getElementById("dbody");
  customersLegacy.showLoading(body, t("orders.sheet.opening"));
  dialog()?.showModal();
  const { data, error } = await callRpc("pedido_detalle", { p_id: id });
  if (!body) return null;
  if (error || !data?.pedido) {
    body.innerHTML = `<div class="vacio">${escapeHtml(error ? error.message : t("orders.sheet.notFound"))}</div>`;
    return null;
  }
  body.innerHTML = sheetHtml(data);
  bind2(body, data);
  return data;
}

// delcos-shared:src/app/services/dates.ts
var shared14 = globalThis["__delcosModules"]["services/dates"];
var pick14 = (name) => shared14[name];
var todayIso = /* @__PURE__ */ pick14("todayIso");

// src/app/screens/orders/sheet/transfer-pdf.ts
var LEFT = 15;
var RIGHT_COLUMN = 110;
var RIGHT = 195;
var PAGE_END = 270;
var REFERENCE_X = 105;
var BARCODE_X = 140;
var TITLE_SIZE = 16;
var TEXT_SIZE = 10;
var LINE_GREY = 200;
var NAME_WIDTH = 86;
var ADDRESS_WIDTH = 85;
var NOTE_WIDTH = 180;
var TransferWriter = class {
  constructor(doc) {
    this.doc = doc;
    __publicField(this, "y", 18);
  }
  write(text, x, options) {
    this.doc.text(String(text ?? ""), x, this.y, options);
  }
  bold() {
    this.doc.setFont("helvetica", "bold");
  }
  normal() {
    this.doc.setFont("helvetica", "normal");
  }
};
function customerLines(detail) {
  const order = detail.pedido, customer = detail.contacto;
  return [
    orFallback(customer?.nombre, order.cuenta_texto ?? ""),
    order.distribuidor_codigo ? t("orders.transfer.pdfCode", { code: order.distribuidor_codigo }) : "",
    [customer?.direccion, customer?.cp, customer?.municipio].filter(Boolean).join(", "),
    customer?.nif ? t("orders.transfer.pdfTaxId", { id: customer.nif }) : ""
  ].filter(Boolean);
}
function header(writer, detail, distributor) {
  const order = detail.pedido, doc = writer.doc;
  writer.bold();
  doc.setFontSize(TITLE_SIZE);
  writer.write(t("orders.transfer.pdfTitle", { number: order.numero ?? "" }), LEFT);
  writer.y += 7;
  writer.normal();
  doc.setFontSize(TEXT_SIZE);
  writer.write(`${orderSheetLegacy.appName()} · ${formatShortDate(String(order.fecha || todayIso()).slice(0, 10))}`, LEFT);
  writer.y += 10;
  writer.bold();
  writer.write(t("orders.transfer.pdfDistributor"), LEFT);
  writer.write(t("orders.transfer.pdfCustomer"), RIGHT_COLUMN);
  writer.y += 5;
  writer.normal();
  const left = [distributor.nombre, distributor.email, distributor.telefono].filter((item) => Boolean(item)), right = customerLines(detail);
  for (let row = 0; row < Math.max(left.length, right.length); row++) {
    if (left[row]) writer.write(left[row], LEFT);
    const value6 = right[row];
    if (value6) doc.text(doc.splitTextToSize(value6, ADDRESS_WIDTH), RIGHT_COLUMN, writer.y);
    writer.y += 5;
  }
}
function lines(writer, detail, codes) {
  const doc = writer.doc;
  writer.y += 6;
  writer.bold();
  writer.write(t("orders.transfer.pdfProduct"), LEFT);
  writer.write(t("orders.transfer.pdfReference"), REFERENCE_X);
  writer.write(t("orders.transfer.pdfBarcode"), BARCODE_X);
  writer.write(t("orders.transfer.pdfUnits"), RIGHT, { align: "right" });
  doc.setDrawColor(LINE_GREY);
  doc.line(LEFT, writer.y + 2, RIGHT, writer.y + 2);
  writer.y += 8;
  writer.normal();
  for (const line of detail.lineas ?? []) {
    if (writer.y > PAGE_END) {
      doc.addPage();
      writer.y = 20;
    }
    const product = codes.get(line.producto_id ?? "");
    doc.text(doc.splitTextToSize(String(line.producto ?? ""), NAME_WIDTH), LEFT, writer.y);
    writer.write(orFallback(product?.referencia, "—"), REFERENCE_X);
    writer.write(orFallback(product?.codigo_barras, "—"), BARCODE_X);
    writer.write(formatNumber(line.unidades), RIGHT, { align: "right" });
    writer.y += 7;
  }
}
function footer(writer, detail) {
  const order = detail.pedido, doc = writer.doc, units = sum((detail.lineas ?? []).map((line) => Number(line.unidades) || 0));
  doc.line(LEFT, writer.y - 3, RIGHT, writer.y - 3);
  writer.y += 4;
  writer.bold();
  writer.write(t("orders.transfer.pdfTotal", { units: formatNumber(units) }), RIGHT, { align: "right" });
  writer.y += 8;
  writer.normal();
  writer.write(order.factura_distribuidor ? t("orders.distributor.invoicedByThem") : t("orders.distributor.invoicedBy", { app: orderSheetLegacy.appName() }), LEFT);
  writer.y += 6;
  if (order.nota) doc.text(doc.splitTextToSize(t("orders.distributor.mailNote", { note: order.nota }), NOTE_WIDTH), LEFT, writer.y);
}
async function downloadTransfer(detail, distributor) {
  const pdfConstructor = await orderSheetLegacy.loadPdf(), doc = new pdfConstructor({ unit: "mm", format: "a4" });
  const ids = [...new Set((detail.lineas ?? []).map((line) => line.producto_id).filter((id) => Boolean(id)))];
  const { data } = ids.length ? await legacyDb().from("productos").select("id,referencia,codigo_barras").in("id", ids) : { data: [] };
  const writer = new TransferWriter(doc);
  header(writer, detail, distributor);
  lines(writer, detail, new Map((data ?? []).map((product) => [product.id, product])));
  footer(writer, detail);
  doc.save(`transfer_${orFallback(detail.pedido.numero, detail.pedido.id).replace(/[^\w-]+/g, "_")}.pdf`);
}

// src/app/screens/orders/sheet/distributor.ts
var SENT = "Enviado";
async function distributorOf(id) {
  const found = (await loadDistributors()).find((item) => item.id === id) ?? (await loadDistributors(true)).find((item) => item.id === id);
  return found ?? { id, nombre: t("orders.distributor.fallbackName") };
}
function emailOf(detail) {
  const order = detail.pedido, customer = detail.contacto, name = orFallback(customer?.nombre, orFallback(order.cuenta_texto, "")), app = orderSheetLegacy.appName();
  const address = customer?.direccion ? t("orders.distributor.mailAddress", { address: [customer.direccion, customer.cp, customer.municipio].filter(Boolean).join(", ") }) : "";
  const text = [
    t("orders.distributor.mailOrder", { number: order.numero ?? "", app }),
    "",
    t("orders.distributor.mailCustomer", { name, code: order.distribuidor_codigo ? t("orders.distributor.mailCode", { code: order.distribuidor_codigo }) : "" }),
    address,
    "",
    ...(detail.lineas ?? []).map((line) => `- ${line.unidades} × ${orFallback(line.producto, line.nombre ?? "")}`),
    "",
    order.factura_distribuidor ? t("orders.distributor.invoicedByThem") : t("orders.distributor.invoicedBy", { app }),
    order.nota ? `
${t("orders.distributor.mailNote", { note: order.nota })}` : ""
  ].join("\n");
  return { subject: t("orders.distributor.mailSubject", { number: order.numero ?? "", name }), text };
}
function blockHtml2(detail, distributor) {
  const order = detail.pedido, mail = emailOf(detail);
  const who = t("orders.distributor.servedBy", { name: escapeHtml(distributor.nombre) }) + (order.distribuidor_codigo ? t("orders.distributor.customerCode", { code: escapeHtml(order.distribuidor_codigo) }) : "") + ` · ${t(order.factura_distribuidor ? "orders.distributor.theyInvoice" : "orders.distributor.weInvoice")}`;
  const sent = order.transfer_enviado_en ? t("orders.distributor.mailPreparedOn", { date: formatShortDate(String(order.transfer_enviado_en).slice(0, 10)) }) : t("orders.distributor.mailNotPrepared");
  const actions = order.estado === STATES.confirmed ? `<div class="acts u-start u-mt-6">${distributor.email ? `<a class="btn sec" id="pdmaild" href="${mailtoLink(escapeHtml(distributor.email), mail.subject, mail.text)}">${t("orders.distributor.prepareMail")}</a>` : `<span class="sm">${t("orders.distributor.noEmail")}</span>`}
        <span class="sm" id="pdmailest">${sent}</span></div>` : `<p class="sm">${t("orders.distributor.afterConfirm")}</p>`;
  return `<div class="blk" id="pddist"><h3>${t("orders.distributor.title")}</h3>
      <p>${who}</p>
      ${actions}</div>`;
}
var pressOnly = (buttons, chosen) => {
  buttons.forEach((button) => {
    button.classList.toggle("on", button === chosen);
    button.setAttribute("aria-pressed", String(button === chosen));
  });
};
async function noteFor(order, state) {
  if (state !== TRANSFER_ISSUE) return null;
  const note = await orderSheetLegacy.askText(t("orders.transfer.issueQuestion"), order.transfer_nota ?? "", { titulo: t("orders.transfer.issueTitle"), ok: t("common.save") });
  return note ?? void 0;
}
async function saveTransfer(order, state, note) {
  const { data: result, error } = await legacyDb().rpc("estado_transfer", { p_id: order.id, p_estado: state, p_nota: note });
  if (!error && result?.ok) return true;
  notices.toast(result?.error === "permiso" ? t("orders.transfer.noPermission") : t("orders.transfer.couldNotChange", { error: error ? `: ${error.message ?? ""}` : "" }), true);
  return false;
}
async function changeTransfer(order, box, button) {
  const state = button.dataset.trf ?? "", note = await noteFor(order, state);
  if (note === void 0 || !await saveTransfer(order, state, note)) return;
  order.transfer_estado = state;
  if (note !== null) order.transfer_nota = note || null;
  pressOnly(box.querySelectorAll("[data-trf]"), button);
  const noteText = document.getElementById("pdtrfnota");
  if (noteText) noteText.textContent = order.transfer_nota ? t("orders.transfer.note", { note: order.transfer_nota }) : "";
  const mailState = document.getElementById("pdmailest");
  if (!order.transfer_enviado_en && mailState) {
    order.transfer_enviado_en = (/* @__PURE__ */ new Date()).toISOString();
    mailState.textContent = t("orders.transfer.sentOn", { date: formatShortDate(todayIso()) });
  }
  notices.toast(t("orders.transfer.changed", { state: state.toLowerCase() }));
}
function paintTransfer(detail, distributor) {
  const box = document.getElementById("pddist"), order = detail.pedido;
  if (!box || document.getElementById("pdtrf") || !document.getElementById("pdmailest")) return;
  box.insertAdjacentHTML("beforeend", `<div class="pdtrf" id="pdtrf"><span class="sm">${t("orders.transfer.state")}</span>
      <div class="segs" role="group" aria-label="${t("orders.transfer.state")}">${TRANSFER_STATES.map((state) => `<button type="button" data-trf="${state}" class="${order.transfer_estado === state ? "on" : ""}" aria-pressed="${String(order.transfer_estado === state)}">${state}</button>`).join("")}</div>
      <button type="button" class="btn sec" id="pdtrfpdf">${t("orders.transfer.download")}</button>
      <p class="sm" id="pdtrfnota">${order.transfer_nota ? t("orders.transfer.note", { note: escapeHtml(order.transfer_nota) }) : ""}</p></div>`);
  box.querySelectorAll("[data-trf]").forEach((button) => {
    button.onclick = () => {
      void changeTransfer(order, box, button);
    };
  });
  const pdf = document.getElementById("pdtrfpdf");
  if (pdf) pdf.onclick = () => {
    downloadTransfer(detail, distributor).catch((error) => {
      notices.toast(t("orders.transfer.pdfFailed", { error: error.message ?? String(error) }), true);
    });
  };
  document.getElementById("pdmaild")?.addEventListener("click", () => {
    if (order.transfer_estado) return;
    order.transfer_estado = SENT;
    const sent = box.querySelector(`[data-trf="${SENT}"]`);
    if (sent) {
      sent.classList.add("on");
      sent.setAttribute("aria-pressed", "true");
    }
  });
}
async function paintDistributor(detail) {
  const order = detail.pedido, isOpen2 = () => Boolean(document.getElementById("dlg")?.open) && !document.getElementById("pddist");
  if (!isOpen2() || !order.distribuidor_id) return;
  const distributor = await distributorOf(order.distribuidor_id);
  if (!isOpen2()) return;
  if (order.factura_distribuidor) document.getElementById("pvemitir")?.remove();
  const place = document.getElementById("pdpago") ?? document.getElementById("dbody")?.querySelector(".acts:last-of-type");
  if (!place) return;
  place.insertAdjacentHTML("beforebegin", blockHtml2(detail, distributor));
  paintTransfer(detail, distributor);
  document.getElementById("pdmaild")?.addEventListener("click", () => {
    void legacyDb().rpc("marcar_transfer_enviado", { p_id: order.id }).then(({ data }) => {
      const mailState = document.getElementById("pdmailest");
      if (data?.ok && mailState) mailState.textContent = t("orders.distributor.mailPreparedOn", { date: formatShortDate(todayIso()) });
    });
  });
}

// src/app/screens/orders/sheet/equipment.ts
var MAX_SERIALS = 30;
var isOpen = () => Boolean(document.getElementById("dlg")?.open) && !document.getElementById("pdequipos");
var value3 = (id) => document.getElementById(id)?.value ?? "";
function formHtml2(pending) {
  return `<div class="depbox"><span class="sm">${t("orders.equipment.writeSerials")}</span>
        ${pending.map((item, index) => `<div><b>${escapeHtml(item.nombre)}</b> <span class="sm">· ${escapeHtml(item.cuenta ?? "")}</span><div class="cirser">${range(Math.min(item.faltan, MAX_SERIALS)).map((unit) => `<input data-pqs="${index}" maxlength="120" placeholder="${t("orders.equipment.serialOf", { unit: unit + 1 })}" aria-label="${t("orders.equipment.serialLabel", { unit: unit + 1, name: escapeHtml(item.nombre) })}">`).join("")}</div></div>`).join("")}
        <div class="g2"><div><label for="pdeqi">${t("orders.equipment.installedOn")}</label><input id="pdeqi" type="date" value="${todayIso()}"></div><div><label for="pdequ">${t("orders.equipment.place")}</label><input id="pdequ" placeholder="${t("orders.equipment.placePlaceholder")}"></div></div>
        <div class="acts u-end"><button type="button" class="btn" id="pdeqok">${t("orders.equipment.register")}</button></div></div>`;
}
function rowsOf(pending, orderId) {
  const box = document.getElementById("pdeqf"), rows = [];
  pending.forEach((item, index) => box?.querySelectorAll(`[data-pqs="${index}"]`).forEach((input3) => {
    if (!input3.value.trim() || !item.cuenta_id) return;
    rows.push({ cuenta_id: item.cuenta_id, producto_id: item.producto_id, serie: input3.value.trim(), instalado: value3("pdeqi") || todayIso(), ubicacion: value3("pdequ").trim() || null, revision_meses: Number(item.revision_meses) || 0, pedido_id: orderId });
  }));
  return rows;
}
async function register(pending, orderId, button) {
  const rows = rowsOf(pending, orderId);
  if (!rows.length) {
    notices.toast(t(pending.some((item) => !item.cuenta_id) ? "orders.equipment.noAccount" : "orders.equipment.writeOne"), true);
    return;
  }
  button.disabled = true;
  const { error } = await legacyDb().from("equipos").insert(rows);
  button.disabled = false;
  if (error) {
    const message2 = error.message ?? "";
    notices.toast(/row-level|policy/i.test(message2) ? t("orders.equipment.noPermission") : t("orders.equipment.couldNotSave", { error: message2 }), true);
    return;
  }
  notices.toast(rows.length === 1 ? t("orders.equipment.oneRegistered") : t("orders.equipment.registered", { count: rows.length }));
  appLegacy.openOrder(orderId);
}
async function pendingOf(orderId) {
  const { data: order } = await legacyDb().from("pedidos").select("estado").eq("id", orderId).maybeSingle();
  if (order?.estado !== STATES.confirmed) return [];
  const { data } = await legacyDb().rpc("equipos_pendientes_pedido", { p_pedido: orderId });
  return (data ?? []).filter((item) => item.faltan > 0);
}
async function paintEquipment(orderId) {
  if (!isOpen() || !accountCardLegacy.planIncludes("parque")) return;
  const pending = await pendingOf(orderId);
  if (!pending.length || !isOpen()) return;
  const place = document.getElementById("pddist") ?? document.getElementById("pdpago") ?? document.getElementById("dbody")?.querySelector(".acts:last-of-type");
  if (!place) return;
  const count = sum(pending.map((item) => item.faltan));
  place.insertAdjacentHTML("beforebegin", `<div class="blk" id="pdequipos"><h3>${t("orders.equipment.title")}</h3>
      <div class="banda-aviso">${count === 1 ? t("orders.equipment.oneMissing") : t("orders.equipment.missing", { count })} <button type="button" class="btn sec" id="pdeqalta">${t("orders.equipment.registerAll")}</button></div>
      <div id="pdeqf"></div></div>`);
  const open = document.getElementById("pdeqalta");
  if (open) open.onclick = () => {
    const form = document.getElementById("pdeqf");
    if (form) form.innerHTML = formHtml2(pending);
    const ok = document.getElementById("pdeqok");
    if (ok) ok.onclick = () => {
      void register(pending, orderId, ok);
    };
  };
}

// src/app/screens/orders/sheet/operations.ts
var MAIL_QUESTION_DELAY_MS = 800;
var SALES_LEVEL = 2;
function operationHtml(order, key, label, allowed) {
  const done = operationDone(order, key), method = order.forma_pago;
  const how = key === "pago" && method ? ` <span class="sm">· ${escapeHtml(method)}${/reembolso/i.test(method) ? t("orders.operations.onDelivery") : ""}</span>` : "";
  return `<label class="opchk ${done ? "on" : ""}"><input type="checkbox" data-op="${key}" ${done ? "checked" : ""} ${allowed ? "" : "disabled"}>
      <span>${escapeHtml(label)}${how}</span></label>`;
}
function mailHtml(detail) {
  const order = detail.pedido, customer = detail.contacto, total = Number(detail.totales?.total) || 0;
  if (order.sin_cargo) return "";
  if (!customer?.email) return `<span class="sm">${t("orders.operations.noEmail")}</span>`;
  return `<a class="btn sec" id="pdmailpago" data-ped="${order.id}" href="${mailtoLink(escapeHtml(customer.email), paymentSubject(order, total, customer.nombre), paymentText(order, total, customer.nombre))}">${t("orders.operations.preparePaymentEmail")}</a>`;
}
function blockHtml3(detail, allowed) {
  const order = detail.pedido;
  return `<div class="blk" id="pdops" data-nosucio><h3>${t("orders.operations.title")}</h3>
    ${order.sin_cargo ? `<p class="sm">${t("orders.operations.freeDelivery")}</p>` : ""}${OPERATIONS.filter(([key]) => !(order.sin_cargo && key === "pago")).map(([key, label]) => operationHtml(order, key, t(label), allowed)).join("")}
    <label class="opchk ${order.reportar_profesional ? "on" : ""}"><input type="checkbox" data-reporte ${order.reportar_profesional ? "checked" : ""} ${allowed ? "" : "disabled"}>
      <span>${t("orders.operations.reported", { professional: escapeHtml(term("medico", { article: "al" })) })}</span></label>
    <div class="acts" style="margin:6px 0 0">
      ${mailHtml(detail)}
    </div></div>`;
}
async function markOperation(order, box) {
  const { data: result, error } = await legacyDb().rpc("marcar_operativa", { p_pedido: order.id, p_campo: box.dataset.op, p_hecho: box.checked });
  if (error || result?.ok === false) {
    box.checked = !box.checked;
    notices.toast(t("orders.operations.couldNotSave"), true);
    return;
  }
  box.closest(".opchk")?.classList.toggle("on", box.checked);
  const paid = box.dataset.op === "pago";
  notices.toast(box.checked ? paid ? t("orders.operations.paidToast") + (order.factura_id ? t("orders.operations.paidOnInvoice") : "") : t("orders.operations.done") : t("orders.operations.unmarked"));
  if (currentScreen() === "ventas" && ordersLegacy.section() === "ventas") ordersLegacy.paintOperations();
}
async function markReport(id, box) {
  const { data: result, error } = await legacyDb().rpc("marcar_reporte", { p_id: id, p_valor: box.checked });
  if (error || result?.ok === false) {
    box.checked = !box.checked;
    notices.toast(t("orders.operations.couldNotSave"), true);
    return;
  }
  box.closest(".opchk")?.classList.toggle("on", box.checked);
  notices.toast(t(box.checked ? "orders.operations.reportedToast" : "orders.operations.notReportedToast"));
}
function bind3(body, order) {
  body.querySelectorAll("[data-op]").forEach((box) => {
    box.onchange = () => {
      void markOperation(order, box);
    };
  });
  const report = body.querySelector("[data-reporte]");
  if (report) report.onchange = () => {
    void markReport(order.id, report);
  };
  document.getElementById("pdmailpago")?.addEventListener("click", () => {
    setTimeout(() => {
      void askPaymentEmailSent(order.id).then((sent) => {
        if (sent) appLegacy.openOrder(order.id);
      });
    }, MAIL_QUESTION_DELAY_MS);
  });
}
async function paintOperations(detail) {
  const dialog2 = document.getElementById("dlg");
  if (!dialog2?.open || !(permissions.seesEverything() || cardSectionsLegacy.can("administrar"))) return;
  const order = detail.pedido;
  if (order.estado !== STATES.confirmed || document.getElementById("pdops")) return;
  await cycleLegacy.loadSettings();
  const body = document.getElementById("dbody"), actions = body?.querySelector(".acts:last-of-type");
  if (!body || !actions) return;
  actions.insertAdjacentHTML("beforebegin", blockHtml3(detail, permissions.seesEverything() && permissions.salesLevel() >= SALES_LEVEL));
  bind3(body, order);
}

// src/app/screens/orders/tpv/model.ts
var TPV_STATES = { sent: "Enviado", paid: "Pagado", failed: "Fallido", expired: "Caducado", ready: "Preparado" };
var TPV_PILLS = /* @__PURE__ */ new Map([
  [TPV_STATES.sent, ["ordersMore.tpv.states.sent", "p-est"]],
  [TPV_STATES.paid, ["ordersMore.tpv.states.paid", "p-trfok"]],
  [TPV_STATES.failed, ["ordersMore.tpv.states.failed", "p-urg"]],
  [TPV_STATES.expired, ["ordersMore.tpv.states.expired", "p-urg"]],
  [TPV_STATES.ready, ["ordersMore.tpv.states.sending", "p-warn"]]
]);
var ERRORS = /* @__PURE__ */ new Map([
  ["permiso", "ordersMore.tpv.errors.permiso"],
  ["estado", "ordersMore.tpv.errors.estado"],
  ["pagado", "ordersMore.tpv.errors.pagado"],
  ["sin_cargo", "ordersMore.tpv.errors.sinCargo"],
  ["importe", "ordersMore.tpv.errors.importe"],
  ["sesion", "ordersMore.tpv.errors.sesion"],
  ["sin_configurar", "ordersMore.tpv.errors.sinConfigurar"],
  ["no_encontrado", "ordersMore.tpv.errors.noEncontrado"]
]);
var tpvActive = () => tpvLegacy.visible() && Boolean(tpvLegacy.settings().activo) && tpvLegacy.canUseSales();
var isTpvPayment = (method) => /tarjeta|bizum/i.test(method ?? "");
function spanishMobile(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "").replace(/^(0034|34)(?=[67]\d{8}$)/, "");
  return /^[67]\d{8}$/.test(digits) ? digits : "";
}
function tpvErrorText(result) {
  const answer = result ?? {};
  if (answer.error === "movil") return t("ordersMore.tpv.noMobile", { ofPatient: term("paciente", { article: "del" }) });
  if (answer.error === "redsys") return answer.detalle ?? t("ordersMore.tpv.bankRejected");
  const known = ERRORS.get(answer.error ?? "");
  return known ? t(known) : t("ordersMore.tpv.couldNotSend") + (answer.detalle ? `: ${answer.detalle}` : "");
}
async function callTpv(body) {
  const { data, error } = await orderMailLegacy.invoke("cobro_tpv", body);
  let answer = data;
  const failure = error;
  if (!answer && failure) {
    try {
      answer = await failure.context?.json() ?? null;
    } catch {
      answer = null;
    }
  }
  if (!answer && failure) {
    const missing = /Failed to send|not found|404/i.test(failure.message ?? "");
    answer = { ok: false, error: "interno", ...missing ? { detalle: t("ordersMore.tpv.notPublished") } : failure.message ? { detalle: failure.message } : {} };
  }
  return answer ?? { ok: false };
}
async function sendTpvLink(orderId) {
  const result = await callTpv({ accion: "enviar", pedido_id: orderId });
  if (!result.ok) {
    notices.toast(tpvErrorText(result), true);
    return result;
  }
  notices.toast(t("ordersMore.tpv.sent", { mobile: result.movil ?? "" }));
  return result;
}
async function mobileOf(customer) {
  if (!customer?.id) return "";
  const { data } = await legacyDb().from("contactos").select("movil,telefono").eq("id", customer.id).maybeSingle();
  return spanishMobile(orFallback(data?.movil, data?.telefono ?? ""));
}
var canSendTpv = () => cardSectionsLegacy.can("administrar") || permissions.salesLevel() >= 2;

// src/app/screens/orders/tpv/block.ts
var WATCH_MS = 8e3;
var BIZUM = "Bizum";
var SALES_SCREEN = "ventas";
var OPEN_STATES = ["Confirmado", "Borrador"];
var PENDING = "Pendiente";
var DRAFT = "Borrador";
var watchTimer;
var when = (stamp) => stamp ? t("ordersMore.tpv.when", { date: formatShortDate(String(stamp).slice(0, 10)), time: new Date(stamp).toTimeString().slice(0, 5) }) : "";
var methodName = (method) => escapeHtml(method === BIZUM ? method : method.toLowerCase());
function shownState(payment) {
  if (payment?.estado === TPV_STATES.sent && payment.caduca_en && new Date(payment.caduca_en) < /* @__PURE__ */ new Date()) return TPV_STATES.expired;
  return payment?.estado;
}
function paidText(payment) {
  const method = payment.metodo ? t("ordersMore.tpv.with", { method: methodName(payment.metodo) }) : "";
  const authorisation = payment.autorizacion ? t("ordersMore.tpv.authorisation", { code: escapeHtml(payment.autorizacion) }) : "";
  const changed = payment.metodo && payment.forma_pedida && payment.forma_pedida.toLowerCase() !== payment.metodo.toLowerCase();
  const chose = changed ? t("ordersMore.tpv.chose", { asked: escapeHtml(payment.forma_pedida ?? ""), method: methodName(payment.metodo ?? "") }) : "";
  return t("ordersMore.tpv.paidWith", { method, when: when(payment.pagado_en), authorisation, chose });
}
function detailText(payment, state, order) {
  if (!payment) return t("ordersMore.tpv.notSentYet");
  if (state === TPV_STATES.paid) return paidText(payment);
  if (state === TPV_STATES.failed) return escapeHtml(payment.error ?? t("ordersMore.tpv.notAuthorised"));
  const mobile = escapeHtml(payment.movil ?? "");
  if (state === TPV_STATES.expired) return t("ordersMore.tpv.expiredText", { mobile, when: when(payment.creado_en) });
  return t("ordersMore.tpv.waiting", { mobile, when: when(payment.creado_en), draft: order.estado === DRAFT ? t("ordersMore.tpv.confirmsAlone") : "" });
}
function actionsHtml2(payment, canSend, testLink) {
  if (!canSend && !testLink) return "";
  return `<div class="acts">
      ${testLink ? `<a class="btn sec chico" id="tpvabrir" href="${escapeHtml(testLink)}" target="_blank" rel="noopener">${t("ordersMore.tpv.openTestPage")}</a>` : ""}
      ${canSend ? `<button type="button" class="btn ${payment ? "sec " : ""}chico" id="tpvenviar">${t(payment ? "ordersMore.tpv.sendAgain" : "ordersMore.tpv.sendLink")}</button>` : ""}</div>`;
}
function blockHtml4(payment, state, order, canSend) {
  const pill = TPV_PILLS.get(state ?? "");
  const testLink = payment?.entorno === "pruebas" && state === TPV_STATES.sent ? payment.url_pago ?? "" : "";
  return `<div class="tpvped" id="pdtpv">
    <div class="pdpagof"><span class="sm">${t("ordersMore.tpv.title")}</span>${pill ? `<span class="pill ${pill[1]}">${t(pill[0])}</span>` : ""}</div>
    <p class="sm">${detailText(payment, state, order)}</p>
    ${actionsHtml2(payment, canSend, testLink)}</div>`;
}
var stillOpen = () => Boolean(document.getElementById("dlg")?.open) && Boolean(document.getElementById("pdtpv"));
function repaint(id) {
  document.getElementById("pdtpv")?.remove();
  void tpvBlock(id);
}
function watch(id, payment, order) {
  watchTimer = setTimeout(async function look() {
    if (!stillOpen()) return;
    const { data: now } = await legacyDb().from("pagos_tpv").select("estado").eq("id", payment.id).maybeSingle();
    if (!stillOpen()) return;
    if (now?.estado === TPV_STATES.paid) {
      notices.toast(t(order.estado === DRAFT ? "ordersMore.tpv.paidConfirmed" : "ordersMore.tpv.paid"));
      appLegacy.forgetCache();
      appLegacy.openOrder(id);
      if (currentScreen() === SALES_SCREEN) ordersLegacy.reload();
      return;
    }
    if (now && now.estado !== TPV_STATES.sent) {
      repaint(id);
      return;
    }
    watchTimer = setTimeout(look, WATCH_MS);
  }, WATCH_MS);
}
function bindSend(id, payment, state) {
  const button = document.getElementById("tpvenviar");
  if (!button) return;
  button.onclick = async () => {
    if (payment && state === TPV_STATES.sent && !await notices.confirm(t("ordersMore.tpv.resendText"), { titulo: t("ordersMore.tpv.resendTitle"), ok: t("ordersMore.tpv.send") })) return;
    button.disabled = true;
    const result = await sendTpvLink(id);
    button.disabled = false;
    if (result.ok && document.getElementById("pdtpv")) repaint(id);
  };
}
var canSendFor = (order) => OPEN_STATES.includes(order.estado) && orFallback(order.pago_estado, PENDING) === PENDING && !order.sin_cargo && tpvActive() && isTpvPayment(order.forma_pago) && canSendTpv();
async function read(id) {
  const [{ data: payments }, { data: order }] = await Promise.all([
    legacyDb().from("pagos_tpv").select("*").eq("pedido_id", id).neq("estado", "Anulado").order("creado_en", { ascending: false }).limit(1),
    legacyDb().from("pedidos").select("estado,pago_estado,forma_pago,sin_cargo").eq("id", id).maybeSingle()
  ]);
  return { payment: (payments ?? [])[0], order };
}
async function tpvBlock(id) {
  if (!document.getElementById("pdpago") || document.getElementById("pdtpv")) return;
  const { payment, order } = await read(id);
  const box = document.getElementById("pdpago");
  if (!box || document.getElementById("pdtpv") || !order) return;
  const canSend = canSendFor(order);
  if (!payment && !canSend) return;
  const state = shownState(payment);
  box.insertAdjacentHTML("beforeend", blockHtml4(payment, state, order, canSend));
  bindSend(id, payment, state);
  clearTimeout(watchTimer);
  if (payment && state === TPV_STATES.sent) watch(id, payment, order);
}

// src/app/screens/orders/sheet/payment.ts
var KILOBYTE = 1024;
var REVOKE_AFTER_MS = 6e4;
async function openReceipt(id) {
  const { data, error } = await legacyDb().from("pedidos_justificantes").select("nombre,tipo,datos").eq("id", id).single();
  if (error || !data) {
    notices.toast(t("orders.payment.couldNotOpen"), true);
    return;
  }
  const binary = atob(data.datos), bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: data.tipo }));
  const opened = window.open(url, "_blank");
  if (!opened) {
    const link = document.createElement("a");
    link.href = url;
    link.download = data.nombre;
    link.click();
  }
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, REVOKE_AFTER_MS);
}
var receiptRow = (receipt) => `<div class="item"><span class="tx"><b>${escapeHtml(receipt.nombre)}</b><span class="sm">${formatShortDate(String(receipt.creado_en).slice(0, 10))} · ${formatNumber(Math.round(receipt.tamano / KILOBYTE))} KB</span></span>
      <button type="button" class="btn sec chico" data-jver="${receipt.id}">${t("orders.payment.see")}</button></div>`;
function blockHtml5(detail, receipts) {
  const order = detail.pedido;
  return `<div class="blk" id="pdpago"><h3>${t("orders.payment.title")}</h3>
    ${order.origen === "web" ? `<p class="sm"><span class="pill p-est">${t("orders.payment.byWeb")}</span></p>` : ""}
    <div class="pdpagof"><span class="sm">${t("orders.payment.reference")}</span><b>${order.pago_referencia ? escapeHtml(order.pago_referencia) : "—"}</b></div>
    ${receipts.length ? `<div class="lista" id="pdjus">${receipts.map(receiptRow).join("")}</div>` : ""}</div>`;
}
async function paintBlock(detail) {
  const isOpen2 = () => Boolean(document.getElementById("dlg")?.open) && !document.getElementById("pdpago");
  if (!isOpen2()) return;
  const { data: receipts } = await legacyDb().from("pedidos_justificantes").select("id,nombre,tamano,creado_en").eq("pedido_id", detail.pedido.id).order("creado_en");
  if (!isOpen2() || detail.pedido.sin_cargo) return;
  const actions = document.getElementById("dbody")?.querySelector(".acts:last-of-type");
  if (!actions) return;
  (document.getElementById("pdops") ?? actions).insertAdjacentHTML("beforebegin", blockHtml5(detail, receipts ?? []));
  document.getElementById("pdpago")?.querySelectorAll("[data-jver]").forEach((button) => {
    button.onclick = () => {
      void openReceipt(button.dataset.jver ?? "");
    };
  });
}
async function paintPayment(detail) {
  await paintBlock(detail);
  await tpvBlock(detail.pedido.id);
}

// src/app/screens/orders/sheet/index.ts
var STEADY_MAX_MS = 6e3;
var optional = (part) => part.catch(() => void 0);
async function paintOrder(id) {
  const detail = await orderSheetLegacy.whileLoading(async () => {
    const loaded = await paintBase2(id);
    if (!loaded) return null;
    await orderSheetLegacy.invoices(id);
    await paintOperations(loaded);
    await paintPayment(loaded);
    await optional(orderSheetLegacy.customFields(id, document.getElementById("dbody")));
    return loaded;
  });
  if (!detail) return;
  await optional(paintDistributor(detail));
  await optional(paintEquipment(id));
  try {
    paintBankTransfer(detail);
  } catch {
  }
}
var REVEAL_CHECK_MS = 30;
async function revealed(body, maxMs) {
  const start = performance.now();
  while (body?.classList.contains("preparando") && performance.now() - start < maxMs) await new Promise((resolve) => {
    setTimeout(resolve, REVEAL_CHECK_MS);
  });
}
async function showOrder(id) {
  const dialog2 = document.getElementById("dlg");
  dialog2?.classList.add("pdprep");
  try {
    await paintOrder(id);
  } finally {
    const body = document.getElementById("dbody");
    try {
      await orderSheetLegacy.whenSteady(body, STEADY_MAX_MS);
      await revealed(body, STEADY_MAX_MS);
    } catch {
    }
    dialog2?.classList.remove("pdprep");
  }
}

// delcos-shared:src/app/screens/customers/picker.ts
var shared15 = globalThis["__delcosModules"]["screens/customers/picker"];
var pick15 = (name) => shared15[name];
var pickCustomer = /* @__PURE__ */ pick15("pickCustomer");

// src/app/screens/orders/tpv/after-save.ts
var CENT = 5e-3;
var SALES_SCREEN2 = "ventas";
async function sendLinkAndShow(id) {
  await sendTpvLink(id);
  appLegacy.openOrder(id);
  if (currentScreen() === SALES_SCREEN2) ordersLegacy.reload();
}
async function warnIfAmountChanged(id) {
  const [{ data: sent }, { data: detail }] = await Promise.all([
    legacyDb().from("pagos_tpv").select("importe").eq("pedido_id", id).eq("estado", TPV_STATES.sent).order("creado_en", { ascending: false }).limit(1).maybeSingle(),
    callRpc("pedido_detalle", { p_id: id })
  ]);
  const total = detail?.totales ? Number(detail.totales.total) : null;
  if (sent && total !== null && Math.abs(Number(sent.importe) - total) > CENT)
    notices.toast(t("ordersMore.tpv.amountChanged", { sent: euros(Number(sent.importe)), now: euros(total) }), true);
}

// delcos-shared:src/app/core/organisation.ts
var shared16 = globalThis["__delcosModules"]["core/organisation"];
var pick16 = (name) => shared16[name];
var generalVat = /* @__PURE__ */ pick16("generalVat");

// src/app/screens/orders/editor/state.ts
var CHANNELS = { patient: "paciente", centre: "centro" };
var WEB_ORIGINS = ["web", "portal"];
var MANUAL = "manual";
var PERCENT = "porcentaje";
var productOf = (id) => orderEditorLegacy.product(id);
function autoAmount(line) {
  const product = productOf(line.producto_id);
  if (!line.manual && product.precio !== null && product.precio !== void 0) line.importe = round2(product.precio * (Number(line.unidades) || 0));
  if (product.iva !== null && product.iva !== void 0) line.iva = Number(product.iva);
}
var newLine = () => ({ producto_id: orderEditorLegacy.defaultProduct(), unidades: 1, importe: null, descuento: 0, iva: null });
function linesOf(preset) {
  if (!preset?.lineas?.length) return [newLine()];
  return preset.lineas.map((line) => {
    const product = productOf(line.producto_id), price = product.precio;
    const manual = price === null || price === void 0 || round2(price * Number(line.unidades)) !== round2(line.importe);
    return {
      producto_id: line.producto_id ?? null,
      producto: line.producto ?? null,
      unidades: line.unidades ?? null,
      importe: line.importe ?? null,
      descuento: line.descuento ?? 0,
      iva: line.iva !== null && line.iva !== void 0 ? Number(line.iva) : product.iva ?? null,
      manual
    };
  });
}
function accountOf(preset) {
  if (preset?.medico) return preset.medico;
  const first = preset?.lineas?.[0];
  if (first?.cuenta_id) return { id: first.cuenta_id, nombre: first.medico ?? "" };
  const customer = preset?.contacto;
  if (!customer?.cuenta_id) return null;
  const fallback = `${term("medico", { capital: "C" })} ${term("paciente", { article: "del" })}`;
  return { id: customer.cuenta_id, nombre: orFallback(customer.medico, fallback), codigo: customer.medico_codigo ?? "" };
}
var defaultService = () => orderEditorLegacy.services().find((service) => service.por_defecto && service.activo);
function serviceOfOrder(order) {
  const vat = Number(order.envio_iva) || 0, first = orderEditorLegacy.services()[0]?.id ?? "";
  return { servicio_id: orFallback(order.servicio_id, first), envio: true, envio_iva: Number(order.envio_iva), envio_con: round2(Number(order.envio_base) * (1 + vat / 100)) };
}
function serviceFields(order) {
  if (order?.envio) return serviceOfOrder(order);
  const service = defaultService(), fallback = { envio_iva: Number(service?.iva ?? generalVat()), envio_con: nonZeroOr(service?.pvp, 0) };
  return order ? { servicio_id: "", envio: false, ...fallback } : { servicio_id: service?.id ?? "", envio: Boolean(service), ...fallback };
}
var newForm = (preset) => ({
  fecha: todayIso(),
  canal: CHANNELS.patient,
  forma_pago: "",
  descuento: 0,
  descuento_tipo: PERCENT,
  nota: "",
  cuenta_texto: "",
  origen: WEB_ORIGINS.includes(preset?.origen ?? "") ? preset?.origen ?? MANUAL : MANUAL,
  pago_referencia: "",
  sin_cargo: false,
  reportar: false
});
var orderForm = (order) => ({
  fecha: order.fecha,
  canal: order.canal ?? "",
  forma_pago: order.forma_pago ?? "",
  descuento: nonZeroOr(order.descuento, 0),
  descuento_tipo: order.descuento_tipo ?? "",
  nota: order.nota ?? "",
  cuenta_texto: order.cuenta_texto ?? "",
  origen: WEB_ORIGINS.includes(order.origen ?? "") ? order.origen ?? MANUAL : MANUAL,
  pago_referencia: order.pago_referencia ?? "",
  sin_cargo: Boolean(order.sin_cargo),
  reportar: Boolean(order.reportar_profesional)
});
function formOf(order, preset) {
  return { ...order ? orderForm(order) : newForm(preset), ...serviceFields(order) };
}
function editableProblem(order) {
  if (!order) return null;
  if (order.estado === STATES.voided) return order.factura_id ? "invoiced" : "voided";
  return order.estado !== STATES.draft && order.factura_id ? "invoiced" : null;
}
function buildState(preset, distributor) {
  const order = preset?.pedido ?? null, lines3 = linesOf(preset);
  lines3.forEach((line) => {
    if (line.importe === null) autoAmount(line);
    if (line.iva === null) line.iva = productOf(line.producto_id).iva ?? 0;
  });
  return { order, lines: lines3, account: accountOf(preset), customer: preset?.contacto ?? null, form: formOf(order, preset), receipts: [], fieldValues: null, distributor };
}
var input = (id) => document.getElementById(id);
function readForm2(state) {
  if (!input("pfecha")) return;
  const text = (id) => input(id)?.value ?? "", form = state.form;
  Object.assign(form, {
    fecha: text("pfecha"),
    canal: text("pcan"),
    forma_pago: text("ppago"),
    descuento: text("pdto"),
    descuento_tipo: text("pdtot"),
    nota: text("pnota"),
    envio: Boolean(input("penv")?.checked),
    envio_con: Number(text("penvi")) || 0,
    envio_iva: Number(text("penvv")) || 0,
    servicio_id: text("pserv")
  });
  const accountBox = document.getElementById("pselmed");
  if (accountBox) form.cuenta_texto = accountBox.__texto ?? "";
  if (input("porig")) form.origen = text("porig");
  if (input("pref")) form.pago_referencia = text("pref");
  const free = input("psincargo"), report = input("prepprof");
  if (free) form.sin_cargo = free.checked;
  if (report) form.reportar = report.checked;
}

// src/app/screens/orders/editor/lines.ts
var FULL_DISCOUNT = 100;
var input2 = (id) => document.getElementById(id);
var number = (id) => Number(input2(id)?.value) || 0;
function breakdownHtml(line) {
  const parts = lineBreakdown(line), product = productOf(line.producto_id);
  const unit = product.precio !== null && product.precio !== void 0 ? `<span>${t("ordersMore.editor.unitPrice", { price: euros(product.precio * (1 + (Number(product.iva) || 0) / 100)) })}</span>` : "";
  const tender = product.contrato ? `<span class="pill p-est" title="${escapeHtml(product.contrato)}">${t("ordersMore.editor.tenderPrice")}</span>` : "";
  return `<span>${t("ordersMore.editor.base", { amount: euros(parts.base) })}</span><span>${t("ordersMore.editor.vat", { rate: formatNumber(line.iva ?? 0), amount: euros(parts.iva) })}</span><span>${t("ordersMore.editor.total", { amount: euros(parts.total) })}</span>
          ${unit}${tender}`;
}
function paintBreakdown(state) {
  if (input2("psincargo")?.checked) state.lines.forEach((line) => {
    line.descuento = FULL_DISCOUNT;
  });
  const lines3 = document.getElementById("plineas");
  state.lines.forEach((line, index) => {
    const box2 = lines3?.querySelector(`[data-des="${index}"]`);
    if (box2) box2.innerHTML = breakdownHtml(line);
  });
  const shipping = Boolean(input2("penv")?.checked);
  document.getElementById("penvd")?.classList.toggle("hide", !shipping);
  const service = orderEditorLegacy.services().find((item) => item.id === document.getElementById("pserv")?.value);
  const totals = orderTotals(
    state.lines,
    number("pdto"),
    document.getElementById("pdtot")?.value ?? "",
    { on: shipping, con: number("penvi"), iva: number("penvv"), nombre: service?.nombre ?? t("ordersMore.editor.serviceDefault") }
  );
  const box = document.getElementById("ptot");
  if (box) box.innerHTML = totalsHtml(totals);
}
var amountWithVat = (line) => line.importe !== null ? String(round2(line.importe * (1 + (Number(line.iva) || 0) / 100))) : "";
function setField(line, field3, raw) {
  const value6 = raw === "" ? null : Number(raw);
  if (field3 === "importeiva") {
    line.importe = value6 === null ? null : value6 / (1 + (Number(line.iva) || 0) / 100);
    line.manual = true;
    return false;
  }
  if (field3 === "producto_id") {
    line.producto_id = raw;
    line.manual = false;
    line.iva = productOf(raw).iva ?? 0;
    return true;
  }
  if (field3 === "unidades") {
    line.unidades = value6;
    return true;
  }
  if (field3 === "descuento") line.descuento = value6;
  return false;
}
function changeLine(line, field3, target, box) {
  if (!setField(line, field3, target.value)) return;
  autoAmount(line);
  const amount = box.querySelector('[data-f="importeiva"]');
  if (amount) amount.value = amountWithVat(line);
}
function bindLineInputs(state) {
  const lines3 = document.getElementById("plineas");
  if (!lines3) return;
  const onChange = (event) => {
    const target = event.target, box = target.closest("[data-li]"), field3 = target.dataset.f;
    const line = box ? state.lines[Number(box.dataset.li)] : void 0;
    if (!box || !field3 || !line) return;
    changeLine(line, field3, target, box);
    paintBreakdown(state);
  };
  lines3.oninput = onChange;
  lines3.onchange = onChange;
}

// src/app/screens/orders/editor/save.ts
var SALES_SCREEN3 = "ventas";
var CUSTOMERS_SCREEN = "pacientes";
var field = (id) => document.getElementById(id);
var value4 = (id) => field(id)?.value ?? "";
var isFree = () => Boolean(field("psincargo")?.checked);
var isCentre = () => Boolean(document.getElementById("zonapac")?.classList.contains("escentro"));
var isConfirmedOrder = (state) => state.order?.estado === STATES.confirmed;
async function askCardPath(state, plan2, sendLink) {
  if (!await mobileOf(state.customer)) {
    plan2.withoutMobile = true;
    return true;
  }
  const choice2 = await notices.choose(
    t("ordersMore.save.cardTitle"),
    t("ordersMore.save.cardText"),
    [{ k: "no", t: t("ordersMore.save.cancel"), cls: "sec" }, { k: "validar", t: t("ordersMore.save.confirmNow"), cls: "sec" }, { k: "enlace", t: t("ordersMore.save.sendLink") }]
  );
  if (!choice2) return false;
  if (choice2 === "enlace") {
    plan2.status = STATES.draft;
    plan2.options = { ...plan2.options, afterSave: sendLink };
  } else plan2.confirmedNow = true;
  return true;
}
async function askTransfer(plan2) {
  const choice2 = await notices.choose(
    t("ordersMore.save.transferTitle"),
    t("ordersMore.save.transferText"),
    [{ k: "no", t: t("ordersMore.save.cancel"), cls: "sec" }, { k: "validar", t: t("ordersMore.save.confirmNow"), cls: "sec" }, { k: "borrador", t: t("ordersMore.save.saveAsDraft") }]
  );
  if (!choice2) return false;
  if (choice2 === "borrador") plan2.status = STATES.draft;
  else plan2.confirmedNow = true;
  return true;
}
async function accountFromCustomer(state) {
  if (state.account || !state.customer?.id || isCentre()) return;
  const { data } = await legacyDb().from("contactos").select("cuenta_id, cuenta_por_pedido").eq("id", state.customer.id).maybeSingle();
  if (data?.cuenta_id && !data.cuenta_por_pedido) state.account = { id: data.cuenta_id, nombre: state.customer.medico ?? "" };
}
var asksCardPath = (plan2, free, already) => !free && !already && plan2.status === STATES.confirmed && !plan2.options.afterSave && tpvActive() && isTpvPayment(value4("ppago"));
var asksTransfer = (plan2, free, already) => !free && !already && plan2.status === STATES.confirmed && isBankTransfer(value4("ppago"));
var asksConfirmation = (plan2, already) => plan2.status === STATES.confirmed && !plan2.confirmedNow && !already;
var confirmFreeWithoutAccount = () => notices.confirm(t("ordersMore.save.freeWithoutAccount", { professional: term("medico") }), { titulo: t("ordersMore.save.freeTitle"), ok: t("ordersMore.save.saveAnyway") });
var confirmOrder2 = () => notices.confirm(t("ordersMore.save.confirmText"), { titulo: t("ordersMore.save.confirmTitle"), ok: t("ordersMore.save.confirm") });
async function plan(state, status, options, sendLink) {
  const result = { status, options, confirmedNow: false, withoutMobile: false }, free = isFree(), already = isConfirmedOrder(state);
  if (asksCardPath(result, free, already) && !await askCardPath(state, result, sendLink)) return null;
  await accountFromCustomer(state);
  if (free && !state.account && !await confirmFreeWithoutAccount()) return null;
  if (asksTransfer(result, free, already) && !await askTransfer(result)) return null;
  if (asksConfirmation(result, already) && !await confirmOrder2()) return null;
  return result;
}
var nullIfEmpty = (text) => text === "" ? null : text;
function lines2(state) {
  return state.lines.filter((line) => line.producto_id).map((line) => ({ producto_id: line.producto_id, unidades: nonZeroOr(line.unidades, 1), importe: line.importe, descuento: nonZeroOr(line.descuento, 0), iva: line.iva }));
}
function paymentFields() {
  const method = value4("ppago");
  return {
    forma_pago: nullIfEmpty(method),
    pago_referencia: method ? value4("pref").trim() : "",
    descuento: Number(value4("pdto")) || 0,
    descuento_tipo: value4("pdtot"),
    envio: Boolean(field("penv")?.checked),
    envio_con_iva: Number(value4("penvi")) || 0,
    envio_iva: Number(value4("penvv")) || 0,
    servicio_id: nullIfEmpty(value4("pserv"))
  };
}
function payload(state, status) {
  const accountBox = document.getElementById("pselmed");
  return {
    id: state.order?.id ?? null,
    estado: status,
    fecha: value4("pfecha"),
    canal: value4("pcan"),
    cuenta_id: state.account?.id ?? null,
    cuenta_texto: state.account ? "" : (accountBox?.__texto ?? "").trim(),
    contacto_id: state.customer?.id ?? null,
    nota: value4("pnota").trim(),
    origen: value4("porig"),
    ...paymentFields(),
    sin_cargo: isFree(),
    lineas: lines2(state),
    op_id: `p-${Date.now()}`,
    ...distributorFields(state.distributor)
  };
}
function failureText(result, error) {
  if (result?.error === "facturado") return t("ordersMore.editor.alreadyInvoiced");
  if (result?.error === "validado") return t("ordersMore.save.noLongerEditable");
  return t("ordersMore.save.couldNotSave", { error: orFallback(error?.message, t("ordersMore.save.noPermission")) });
}
async function saveReport(state, id) {
  const report = Boolean(field("prepprof")?.checked) && !isCentre();
  if (!report && !state.order?.reportar_profesional) return;
  const { data, error } = await legacyDb().rpc("marcar_reporte", { p_id: id, p_valor: report });
  if (error || data?.ok === false) notices.toast(t("ordersMore.save.reportFailed"), true);
}
function doneText(state, status) {
  if (isConfirmedOrder(state)) return t("ordersMore.save.updated");
  if (isFree()) return t(status === STATES.draft ? "ordersMore.save.freeDraft" : "ordersMore.save.freeConfirmed");
  if (status === STATES.draft) return t(isBankTransfer(value4("ppago")) ? "ordersMore.save.draftUntilPaid" : "ordersMore.save.draftSaved");
  return t(state.account ? "ordersMore.save.confirmedAttributed" : "ordersMore.save.confirmedUnattributed");
}
function afterSave(state, decided) {
  notices.toast(doneText(state, decided.status));
  if (decided.withoutMobile) notices.toast(t("ordersMore.save.noMobile", { ofPatient: term("paciente", { article: "del" }) }));
  if (decided.status === STATES.draft && state.order?.id) void warnIfAmountChanged(state.order.id);
  const screen = currentScreen();
  if (screen === SALES_SCREEN3) ordersLegacy.reload();
  if (screen === CUSTOMERS_SCREEN) orderEditorLegacy.repaintCustomers();
  if (document.getElementById("ficha")?.open && orderEditorLegacy.customerCardOpen()) orderEditorLegacy.openCustomer(orderEditorLegacy.customerCardOpen());
}
async function store(state, status, button) {
  button.disabled = true;
  const text = button.textContent;
  button.textContent = t("ordersMore.save.saving");
  const { data: result, error } = await legacyDb().rpc("guardar_pedido", { p: payload(state, status) });
  button.disabled = false;
  button.textContent = text;
  if (error || result?.ok === false) {
    notices.toast(failureText(result, error), true);
    return null;
  }
  return orFallback(result?.id, state.order?.id ?? "");
}
async function storeExtras(state, id, fields) {
  if (fields && !await orderSheetLegacy.saveFields(fields, id)) return false;
  if (id) await saveReport(state, id);
  return !state.receipts.length || orderEditorLegacy.uploadReceipts(id, state.receipts);
}
async function saveOrder(state, status, button, extra) {
  if (!state.lines.some((line) => line.producto_id)) {
    notices.toast(t("ordersMore.save.addProduct"), true);
    return;
  }
  const fields = orderSheetLegacy.readFields(document.getElementById("dbody"));
  if (fields?.falta.length) {
    notices.toast(t("ordersMore.save.fillIn", { field: fields.falta[0] ?? "" }), true);
    return;
  }
  const decided = await plan(state, status, extra.options ?? {}, extra.sendLink);
  if (!decided) return;
  const id = await store(state, decided.status, button);
  if (id === null || !await storeExtras(state, id, fields)) return;
  document.getElementById("dlg")?.close();
  if (decided.options.afterSave) {
    await decided.options.afterSave(id);
    return;
  }
  afterSave(state, decided);
}

// src/app/screens/orders/editor/view.ts
var isConfirmed = (order) => order?.estado === STATES.confirmed;
var withVat = (line) => line.importe !== null ? String(round2(line.importe * (1 + (Number(line.iva) || 0) / 100))) : "";
function headerHtml(order) {
  const title = order ? t(isConfirmed(order) ? "ordersMore.editor.editOrder" : "ordersMore.editor.editDraft") : t("ordersMore.editor.newOrder");
  return `
      <div class="fh"><div><h2>${title}</h2>
        <div class="sm">${t("ordersMore.editor.subtitle")}</div></div>
        <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>`;
}
function dateChannelOriginHtml(state) {
  const form = state.form;
  return `
      <div class="g2">
        <div><label for="pfecha">${t("ordersMore.editor.date")}</label><input id="pfecha" type="date" value="${escapeHtml(form.fecha)}"></div>
        <div><label for="pcan">${t("ordersMore.editor.channel")}</label><select id="pcan">
          <option value="${CHANNELS.patient}" ${form.canal !== CHANNELS.centre ? "selected" : ""}>${t("ordersMore.editor.toPatient", { toPatient: term("paciente", { article: "al" }) })}</option>
          <option value="${CHANNELS.centre}" ${form.canal === CHANNELS.centre ? "selected" : ""}>${t("ordersMore.editor.toCentre")}</option></select></div>
      </div>
      <div class="g2"><div><label for="porig">${t("ordersMore.editor.origin")}</label><select id="porig">
          <option value="manual">${t("ordersMore.editor.manual")}</option>
          <option value="web" ${form.origen === "web" ? "selected" : ""}>${t("ordersMore.editor.web")}</option>${form.origen === "portal" ? `<option value="portal" selected>${t("ordersMore.editor.portal")}</option>` : ""}</select></div><div></div></div>
      ${distributorHtml(state.distributor)}`;
}
function customerZoneHtml(state) {
  const toProfessional = escapeHtml(term("medico", { article: "al" }));
  return `
      <div id="zonapac" class="${state.form.canal === CHANNELS.centre ? "escentro" : ""}">
        <label class="solopac">${term("paciente", { capital: "C" })}</label><div id="pselpac" class="solopac"></div>
        <label><span class="solopac">${t("ordersMore.editor.reference", { Professional: term("medico", { capital: "C" }) })}</span><span class="solocen">${t("ordersMore.editor.buyingCentre")}</span></label><div id="pselmed"></div>
        <div class="sm u-mt-4"><span class="solopac">${t("ordersMore.editor.leaveName")}</span><span class="solocen">${t("ordersMore.editor.pickCentre")}</span></div>
        <label class="opt solopac prepbox"><input type="checkbox" id="prepprof" ${state.form.reportar ? "checked" : ""}> ${t("ordersMore.editor.report", { toProfessional })}</label>
      </div>`;
}
function lineHtml2(line, index, count) {
  return `<div class="lin" data-li="${index}">
        <div class="lrow">
          <div><label>${t("ordersMore.editor.product")}</label><select data-f="producto_id">${orderEditorLegacy.productOptions(line.producto_id, line.producto)}</select></div>
          <div><label>${t("ordersMore.editor.units")}</label><input data-f="unidades" type="number" min="1" value="${line.unidades ?? ""}"></div>
          <div><label>${t("ordersMore.editor.amountWithVat")}</label><input data-f="importeiva" type="number" step="0.01" min="0" value="${withVat(line)}"></div>
          <div><label>${t("ordersMore.editor.discount")}</label><input data-f="descuento" type="number" step="1" min="0" max="100" value="${line.descuento ?? 0}"></div>
          <div>${count > 1 ? `<button type="button" class="btn sec" data-lx="${index}" aria-label="${t("ordersMore.editor.removeLine")}">✕</button>` : ""}</div>
        </div>
        <div class="ldes" data-des="${index}"></div></div>`;
}
function linesHtml(state) {
  const toProfessional = escapeHtml(term("medico", { article: "al" }));
  return `
      <label>${t("ordersMore.editor.lines")}</label>
      <div id="plineas">${state.lines.map((line, index) => lineHtml2(line, index, state.lines.length)).join("")}</div>
      <div class="acts u-mt-0"><button type="button" class="btn sec" id="plmas">${t("ordersMore.editor.addLine")}</button></div>
      <div class="pscbox"><label class="opt"><input type="checkbox" id="psincargo" ${state.form.sin_cargo ? "checked" : ""}> ${t("ordersMore.editor.free")}</label>
        <span class="sm">${t("ordersMore.editor.freeHint", { toProfessional })}</span></div>`;
}
function methodDiscountHtml(state) {
  const form = state.form, methods = orderEditorLegacy.paymentMethods().map((item) => `<option ${form.forma_pago === item.valor ? "selected" : ""}>${escapeHtml(item.valor)}</option>`).join("");
  return `
      <div class="g2 pscg2">
        <div><label for="ppago">${t("ordersMore.editor.paymentMethod")}</label><select id="ppago"><option value=""></option>
          ${methods}</select></div>
        <div><label for="pdto">${t("ordersMore.editor.generalDiscount")}</label>
          <div style="display:flex;gap:6px"><input id="pdto" type="number" min="0" step="0.01" value="${escapeHtml(String(form.descuento))}">
            <select id="pdtot" style="max-width:110px"><option value="porcentaje">%</option>
              <option value="importe" ${form.descuento_tipo === "importe" ? "selected" : ""}>€</option></select></div></div>
      </div>`;
}
var showsTransfer = (state, method) => isBankTransfer(method) && !isConfirmed(state.order);
var showsCardLink = (state, method) => tpvActive() && isTpvPayment(method) && !isConfirmed(state.order);
var receiptsHtml = (state) => state.receipts.map((receipt, index) => `<span class="jusp">📎 ${escapeHtml(receipt.nombre)} <button type="button" class="lnk" data-jx="${index}" aria-label="${t("ordersMore.editor.removeReceipt", { name: escapeHtml(receipt.nombre) })}">${t("ordersMore.editor.remove")}</button></span>`).join(" ");
function paymentHtml(state) {
  const form = state.form;
  return `
      <div id="ppagox" class="pagofila ${form.forma_pago ? "" : "hide"}">
        <div class="pagoref"><label for="pref">${t("ordersMore.editor.paymentReference")}</label><input id="pref" value="${escapeHtml(form.pago_referencia)}" placeholder="${t("ordersMore.editor.paymentReferencePlaceholder")}"></div>
        <span id="ptrfbox" class="pagoacc ${showsTransfer(state, form.forma_pago) ? "" : "hide"}"><button type="button" class="btn sec" id="ptrfmail">${t("ordersMore.editor.sendPaymentDetails")}</button>
          ${orderEditorLegacy.help(t("ordersMore.editor.transferHelpTitle"), t("ordersMore.editor.transferHelp"))}</span>
        <span id="ptpvbox" class="pagoacc ${showsCardLink(state, form.forma_pago) ? "" : "hide"}"><button type="button" class="btn sec" id="ptpvenv">${t("ordersMore.editor.sendPaymentLink")}</button>
          ${orderEditorLegacy.help(t("ordersMore.editor.cardHelpTitle"), t("ordersMore.editor.cardHelp"))}</span>
        <div><label>${t("ordersMore.editor.receipt")}</label><label class="btn sec u-inline-flex">${t("ordersMore.editor.attach")}<input id="pjus" type="file" accept="image/*,application/pdf" data-fp="1" hidden></label>
          <div class="sm" id="pjusl">${receiptsHtml(state)}</div></div>
      </div>`;
}
function serviceHtml(state) {
  const form = state.form;
  const options = orderEditorLegacy.services().filter((service) => Boolean(service.activo) || service.id === form.servicio_id).map((service) => `<option value="${service.id}" ${form.servicio_id === service.id ? "selected" : ""}>${t("ordersMore.editor.serviceOption", { name: escapeHtml(service.nombre), price: euros(service.pvp ?? 0) })}</option>`).join("");
  return `
      <div class="envbox">
        <label for="pserv" class="u-mt-0">${t("ordersMore.editor.service")}</label>
        <select id="pserv"><option value="">${t("ordersMore.editor.noService")}</option>${options}</select>
        <input type="checkbox" id="penv" class="hide" ${form.envio ? "checked" : ""}>
        <div class="g2 ${form.envio ? "" : "hide"}" id="penvd">
          <div><label for="penvi">${t("ordersMore.editor.serviceAmount")}</label><input id="penvi" type="number" step="0.01" min="0" value="${escapeHtml(String(form.envio_con))}"></div>
          <div><label for="penvv">${t("ordersMore.editor.serviceVat")}</label><input id="penvv" type="number" step="1" min="0" max="21" value="${escapeHtml(String(form.envio_iva))}"></div></div>
      </div>`;
}
function footerHtml(state) {
  const confirmed = isConfirmed(state.order);
  return `
      <div class="totbox" id="ptot"></div>
      <label for="pnota">${t("ordersMore.editor.note")}</label><input id="pnota" value="${escapeHtml(state.form.nota)}">
      <div class="acts u-end">
        <button class="btn sec" data-cerrar>${t("ordersMore.editor.cancel")}</button>
        <button class="btn sec ${confirmed ? "hide" : ""}" id="pborr">${t("ordersMore.editor.saveDraft")}</button>
        <button class="btn" id="pvalid">${t(confirmed ? "ordersMore.editor.saveChanges" : "ordersMore.editor.saveAndConfirm")}</button></div>`;
}
function editorHtml2(state) {
  return headerHtml(state.order) + dateChannelOriginHtml(state) + customerZoneHtml(state) + linesHtml(state) + methodDiscountHtml(state) + paymentHtml(state) + serviceHtml(state) + footerHtml(state);
}

// src/app/screens/orders/editor/index.ts
var FULL_DISCOUNT2 = 100;
var SALES_SCREEN4 = "ventas";
var element = (id) => document.getElementById(id);
var choice = (id) => document.getElementById(id);
var on = (id, handler) => {
  const target = document.getElementById(id);
  if (target) target.onclick = () => {
    handler(target);
  };
};
function save4(state, status, button, options) {
  void saveOrder(state, status, button, { ...options ? { options } : {}, sendLink: sendLinkAndShow });
}
function contractPrices(state) {
  void orderEditorLegacy.loadContractPrices(state.account?.id).then((found) => {
    if (!found) return;
    state.lines.forEach((line) => {
      if (!line.manual) autoAmount(line);
    });
    paint2(state);
  });
}
function mountAccount(state) {
  const box = document.getElementById("pselmed");
  if (!box) return;
  box.__texto = state.account ? "" : state.form.cuenta_texto;
  orderEditorLegacy.pickAccount(box, state.account, (account) => {
    state.account = account;
    contractPrices(state);
  }, t("ordersMore.editor.accountPlaceholder"));
}
function bindPickers(state) {
  const customerBox = document.getElementById("pselpac");
  if (customerBox) pickCustomer(customerBox, { valor: state.customer, alElegir: (chosen) => {
    const customer = chosen;
    state.customer = customer;
    if (customer && !state.account && customer.cuenta_id) {
      state.account = { id: customer.cuenta_id, nombre: customer.medico ?? "", codigo: customer.medico_codigo ?? null };
      mountAccount(state);
      contractPrices(state);
    }
  } });
  mountAccount(state);
}
function bindLines(state) {
  bindLineInputs(state);
  on("plmas", () => {
    const line = newLine();
    state.lines.push(line);
    autoAmount(line);
    paint2(state);
  });
  document.getElementById("plineas")?.querySelectorAll("[data-lx]").forEach((button) => {
    button.onclick = () => {
      state.lines.splice(Number(button.dataset.lx), 1);
      paint2(state);
    };
  });
  const free = element("psincargo");
  if (free) free.onchange = () => {
    readForm2(state);
    state.lines.forEach((line) => {
      line.descuento = state.form.sin_cargo ? FULL_DISCOUNT2 : 0;
    });
    paint2(state);
  };
}
function bindPayment(state) {
  const method = choice("ppago"), channel = choice("pcan");
  if (channel) channel.onchange = () => {
    document.getElementById("zonapac")?.classList.toggle("escentro", channel.value === "centro");
  };
  if (method) method.onchange = () => {
    document.getElementById("ppagox")?.classList.toggle("hide", !method.value);
    document.getElementById("ptrfbox")?.classList.toggle("hide", !showsTransfer(state, method.value));
    document.getElementById("ptpvbox")?.classList.toggle("hide", !showsCardLink(state, method.value));
  };
  const receipt = element("pjus");
  if (receipt) receipt.onchange = async () => {
    const file = receipt.files?.[0];
    receipt.value = "";
    if (!file) return;
    const read2 = await orderEditorLegacy.readReceipt(file);
    if (!read2) return;
    state.receipts.push(read2);
    paint2(state);
  };
  document.getElementById("dbody")?.querySelectorAll("[data-jx]").forEach((button) => {
    button.onclick = () => {
      state.receipts.splice(Number(button.dataset.jx), 1);
      paint2(state);
    };
  });
}
function bindService(state) {
  const repaint2 = () => {
    paintBreakdown(state);
  };
  ["pdto", "pdtot", "penv", "penvi", "penvv"].forEach((id) => {
    const target = element(id);
    if (target) {
      target.oninput = repaint2;
      target.onchange = repaint2;
    }
  });
  const service = choice("pserv");
  if (service) service.onchange = () => {
    const chosen = orderEditorLegacy.services().find((item) => item.id === service.value), shipping = element("penv"), amount = element("penvi"), vat = element("penvv");
    if (shipping) shipping.checked = Boolean(chosen);
    if (chosen && amount && vat) {
      amount.value = String(round2(chosen.pvp ?? 0));
      vat.value = String(chosen.iva ?? generalVat());
    }
    paintBreakdown(state);
  };
}
async function sendDetailsAfterSave(id) {
  await sendPaymentDetails(id);
  appLegacy.openOrder(id);
  if (currentScreen() === SALES_SCREEN4) ordersLegacy.reload();
}
function bindButtons(state) {
  const patient = (article) => term("paciente", { article });
  on("pborr", (button) => {
    save4(state, "Borrador", button);
  });
  on("pvalid", (button) => {
    save4(state, "Confirmado", button);
  });
  on("ptrfmail", (button) => {
    if (!state.customer) {
      notices.toast(t("ordersMore.save.pickForDetails", { thePatient: patient("el") }), true);
      return;
    }
    if (!orderMailLegacy.companyIban()) {
      notices.toast(t("ordersMore.save.missingIban"), true);
      return;
    }
    save4(state, "Borrador", button, { afterSave: sendDetailsAfterSave });
  });
  on("ptpvenv", (button) => {
    void (async () => {
      if (!state.customer) {
        notices.toast(t("ordersMore.save.pickForLink", { thePatient: patient("el") }), true);
        return;
      }
      if (!await mobileOf(state.customer)) {
        notices.toast(t("ordersMore.save.patientWithoutMobile", { Patient: term("paciente", { capital: "C" }) }), true);
        return;
      }
      save4(state, "Borrador", button, { afterSave: sendLinkAndShow });
    })();
  });
}
function mountFields(state) {
  const note = element("pnota");
  if (!note || !orderEditorLegacy.orderFields().some((item) => item.en_ficha)) return;
  const put = () => {
    const body = document.getElementById("dbody");
    if (!body || body.querySelector(".cpersform")) return;
    const values = state.fieldValues ?? {};
    element("pnota")?.insertAdjacentHTML("afterend", orderSheetLegacy.fieldsForm(values));
    const form = body.querySelector(".cpersform");
    const keep = (event) => {
      const input3 = event.target.closest("[data-cpk]");
      if (input3) values[input3.dataset.cpk ?? ""] = input3.value;
    };
    form?.addEventListener("input", keep);
    form?.addEventListener("change", keep);
  };
  if (state.fieldValues) {
    put();
    return;
  }
  if (!state.order?.id) {
    state.fieldValues = {};
    put();
    return;
  }
  void legacyDb().from("pedidos").select("clasificadores").eq("id", state.order.id).maybeSingle().then(({ data }) => {
    state.fieldValues = { ...data?.clasificadores ?? {} };
    put();
  });
}
function paint2(state) {
  readForm2(state);
  const body = document.getElementById("dbody");
  if (!body) return;
  body.innerHTML = editorHtml2(state);
  bindDistributor(state.distributor);
  bindLines(state);
  bindPayment(state);
  bindService(state);
  paintBreakdown(state);
  bindPickers(state);
  bindButtons(state);
  mountFields(state);
}
function accountIdOf(preset) {
  const id = orFallback(preset?.medico?.id, orFallback(preset?.lineas?.[0]?.cuenta_id, preset?.contacto?.cuenta_id ?? ""));
  return id === "" ? null : id;
}
var openState = null;
var openEditorDistributor = () => openState && document.getElementById("pdist") ? distributorFields(openState.distributor) : {};
async function editOrder(preset) {
  if (!navigator.onLine) {
    notices.toast(t("core.offline.orderNeedsNetwork"), true);
    return;
  }
  const order = preset?.pedido ?? null, distributor = choiceOf(order);
  await loadDistributors().catch(() => []);
  await orderEditorLegacy.loadProducts();
  const problem = editableProblem(order);
  if (problem) {
    notices.toast(t(problem === "invoiced" ? "ordersMore.editor.alreadyInvoiced" : "ordersMore.editor.voided"), true);
    return;
  }
  await orderEditorLegacy.loadContractPrices(accountIdOf(preset));
  openState = buildState(preset, distributor);
  paint2(openState);
  document.getElementById("dlg")?.showModal();
}

// delcos-shared:src/app/screens/orders/subscription/payments.ts
var shared17 = globalThis["__delcosModules"]["screens/orders/subscription/payments"];
var pick17 = (name) => shared17[name];
var callPayments = /* @__PURE__ */ pick17("callPayments");
var loadPaymentState = /* @__PURE__ */ pick17("loadPaymentState");
var repaintPlanScreen = /* @__PURE__ */ pick17("repaintPlanScreen");
var waitUntilActive = /* @__PURE__ */ pick17("waitUntilActive");

// src/app/screens/orders/subscription/choose-plan.ts
var MIN_USERS = 3;
var YEARLY_MONTHS = 10;
var VAT_RATE = 21;
var CUSTOM = "medida";
var YEARLY = "anual";
var MONTHLY = "mensual";
var DEFAULT_PLAN = "comercial";
var planOf = (id) => subscriptionLegacy.planOf(id);
function amounts(choice2, subscribed) {
  const plan2 = planOf(choice2.plan), yearly = choice2.pago === YEARLY;
  const base = yearly ? plan2.precio * YEARLY_MONTHS * choice2.usuarios : plan2.precio * choice2.usuarios;
  const setup = !yearly && !subscribed ? subscriptionLegacy.setupFee() : 0;
  return { base, setup, vat: Math.round((base + setup) * VAT_RATE) / 100 };
}
var isDowngrade = (context, choice2) => context.subscribed && subscriptionLegacy.isDowngrade(context.was, choice2);
var endDate = (context) => context.current.periodo_fin ? formatShortDate(String(context.current.periodo_fin)) : t("ordersMore.choosePlan.endOfPeriod");
function downgradeHtml(context, choice2) {
  if (!isDowngrade(context, choice2)) return "";
  const state = { ...subscriptionLegacy.state() ?? {}, extras: context.current.extras };
  const lost = subscriptionLegacy.losses(String(context.current.plan), choice2.plan, state);
  const list = lost.length ? `${t("ordersMore.choosePlan.youLose")}<ul id="pgpierde">${lost.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ".";
  return `<div class="banda-aviso" id="pgbaja">${t("ordersMore.choosePlan.downgrade", { date: escapeHtml(endDate(context)), plan: escapeHtml(planOf(String(context.current.plan)).nombre) })}${list}</div>`;
}
function receiptHtml(context, choice2) {
  const plan2 = planOf(choice2.plan), yearly = choice2.pago === YEARLY, { base, setup, vat } = amounts(choice2, context.subscribed);
  const label = !context.subscribed ? t("ordersMore.choosePlan.firstCharge") : isDowngrade(context, choice2) ? t("ordersMore.choosePlan.amountFrom", { date: escapeHtml(endDate(context)) }) : t("ordersMore.choosePlan.newAmount");
  return `<div class="pgres">
        <div><span>${formatNumber(choice2.usuarios)} × ${euros(yearly ? plan2.precio * YEARLY_MONTHS : plan2.precio)} ${t(yearly ? "ordersMore.choosePlan.perYear" : "ordersMore.choosePlan.perMonth")}</span><b>${euros(base)}</b></div>
        ${setup ? `<div><span>${t("ordersMore.choosePlan.setup")}</span><b>${euros(setup)}</b></div>` : ""}
        <div><span>${t("ordersMore.choosePlan.vat", { rate: VAT_RATE })}</span><b>${euros(vat)}</b></div>
        <div class="pgtot"><span>${label}</span><b>${euros(base + setup + vat)}</b></div></div>`;
}
function headerHtml2(context, choice2) {
  const note = !context.subscribed ? t("ordersMore.choosePlan.stripePage") : isDowngrade(context, choice2) ? "" : t("ordersMore.choosePlan.appliedNow");
  return `<div class="fh"><div><h2>${t(context.subscribed ? "ordersMore.choosePlan.changeTitle" : "ordersMore.choosePlan.contractTitle")}</h2>
        <div class="sm">${t("ordersMore.choosePlan.pricesPerUser")} ${note}</div></div>
        <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>`;
}
function choicesHtml2(context, choice2) {
  const yearly = choice2.pago === YEARLY, minimum = Math.max(MIN_USERS, context.used);
  const plans = subscriptionLegacy.plans().map((key) => `<button type="button" data-pgp="${key}" class="${choice2.plan === key ? "on" : ""}" aria-pressed="${String(choice2.plan === key)}">${escapeHtml(planOf(key).nombre)} · ${euros(planOf(key).precio)}</button>`).join("");
  return `<label>${t("ordersMore.choosePlan.plan")}</label><div class="segs pgplan" role="group">${plans}</div>
      <label class="u-mt-12">${t("ordersMore.choosePlan.payment")}</label><div class="segs" role="group">
        <button type="button" data-pga="${MONTHLY}" class="${yearly ? "" : "on"}" aria-pressed="${String(!yearly)}">${t("ordersMore.choosePlan.monthly")}</button>
        <button type="button" data-pga="${YEARLY}" class="${yearly ? "on" : ""}" aria-pressed="${String(yearly)}">${t("ordersMore.choosePlan.yearly")}</button></div>
      <label for="pgusu" class="u-mt-12">${t("ordersMore.choosePlan.users")}</label><input id="pgusu" type="number" min="${minimum}" value="${choice2.usuarios}" class="numw">
      <span class="sm">${context.used ? t("ordersMore.choosePlan.usingNow", { count: formatNumber(context.used) }) : ""}${t("ordersMore.choosePlan.minimum", { count: minimum })}</span>`;
}
function windowHtml(context, choice2) {
  const okKey = !context.subscribed ? "ordersMore.choosePlan.goToPayment" : isDowngrade(context, choice2) ? "ordersMore.choosePlan.schedule" : "ordersMore.choosePlan.confirm";
  return `${headerHtml2(context, choice2)}
      ${choicesHtml2(context, choice2)}
      ${downgradeHtml(context, choice2)}
      ${receiptHtml(context, choice2)}
      <div class="acts u-end"><button class="btn sec" data-cerrar>${t("ordersMore.choosePlan.cancel")}</button>
        <button class="btn" id="pgok">${t(okKey)}</button></div>`;
}
async function confirm(context, choice2, button) {
  const answer = await callPayments({ accion: context.subscribed ? "cambiar" : "checkout", plan: choice2.plan, pago: choice2.pago, usuarios: choice2.usuarios }, button);
  if (!answer) return;
  if (answer.url) {
    location.href = answer.url;
    return;
  }
  document.getElementById("dlg")?.close();
  if (answer.previsto) {
    notices.toast(t("ordersMore.choosePlan.scheduled", { date: formatShortDate(answer.previsto) }));
    await loadPaymentState();
    repaintPlanScreen();
    return;
  }
  notices.toast(t("ordersMore.choosePlan.done"));
  void waitUntilActive();
}
function paint3(context, choice2) {
  const body = document.getElementById("dbody");
  if (!body) return;
  body.innerHTML = windowHtml(context, choice2);
  const repaint2 = () => {
    paint3(context, choice2);
  };
  body.querySelectorAll("[data-pgp]").forEach((button) => {
    button.onclick = () => {
      choice2.plan = button.dataset.pgp ?? choice2.plan;
      repaint2();
    };
  });
  body.querySelectorAll("[data-pga]").forEach((button) => {
    button.onclick = () => {
      choice2.pago = button.dataset.pga ?? choice2.pago;
      repaint2();
    };
  });
  const users = document.getElementById("pgusu");
  if (users) users.onchange = () => {
    choice2.usuarios = Math.max(MIN_USERS, context.used, Math.floor(Number(users.value) || 0));
    repaint2();
  };
  const ok = document.getElementById("pgok");
  if (ok) ok.onclick = () => {
    void confirm(context, choice2, ok);
  };
}
function choosePlan(initialPlan) {
  const current = subscriptionLegacy.plan(), plans = subscriptionLegacy.plans();
  if (current.plan === CUSTOM) {
    notices.toast(t("ordersMore.choosePlan.custom"));
    return;
  }
  const used = Number(subscriptionLegacy.state()?.usuarios ?? 0) || 0, pago = current.pago === YEARLY ? YEARLY : MONTHLY;
  const plan2 = plans.includes(initialPlan ?? "") ? String(initialPlan) : plans.includes(String(current.plan)) ? String(current.plan) : DEFAULT_PLAN;
  const context = { current, subscribed: Boolean(current.stripe_suscripcion), used, was: { plan: current.plan, pago, usuarios: Number(current.usuarios) || 0 } };
  paint3(context, { plan: plan2, pago, usuarios: Math.max(MIN_USERS, used, Number(current.usuarios) || 0) });
  document.getElementById("dlg")?.showModal();
}

// src/app/screens/orders/tpv/settings.ts
var TEST_DATA = { comercio: "999008881", terminal: "1", clave: "sq7HjrUOBfKmC576ILgskD5srU870gJ7" };
var SAVE_ERRORS = /* @__PURE__ */ new Map([
  ["comercio", "ordersMore.tpvSettings.merchantDigits"],
  ["terminal", "ordersMore.tpvSettings.terminalDigits"],
  ["clave", "ordersMore.tpvSettings.secretMissing"],
  ["permiso", "ordersMore.tpvSettings.noPermission"]
]);
var field2 = (id) => document.getElementById(id);
var value5 = (id) => field2(id)?.value.trim() ?? "";
function pageHtml2(settings) {
  const text = (key) => escapeHtml(String(settings[key] ?? ""));
  return `<div class="card tpvw">
    <p class="sm">${t("ordersMore.tpvSettings.intro", { thePatient: term("paciente", { article: "el" }) })}</p>
    <label class="opt"><input type="checkbox" id="tpvact" ${settings.activo ? "checked" : ""}> ${t("ordersMore.tpvSettings.active")}</label>
    <div class="g2"><div><label for="tpvcom">${t("ordersMore.tpvSettings.merchant")}</label><input id="tpvcom" inputmode="numeric" value="${text("comercio")}"></div>
      <div><label for="tpvter">${t("ordersMore.tpvSettings.terminal")}</label><input id="tpvter" inputmode="numeric" value="${text("terminal")}"></div></div>
    <div class="g2"><div><label for="tpvcla">${t("ordersMore.tpvSettings.secret")}</label><input id="tpvcla" type="password" autocomplete="new-password" placeholder="${settings.hay_clave ? t("ordersMore.tpvSettings.secretSaved") : ""}"></div>
      <div><label for="tpvent">${t("ordersMore.tpvSettings.environment")}</label><select id="tpvent"><option value="pruebas">${t("ordersMore.tpvSettings.test")}</option><option value="real" ${settings.entorno === "real" ? "selected" : ""}>${t("ordersMore.tpvSettings.real")}</option></select></div></div>
    <p class="sm">${t("ordersMore.tpvSettings.noticeAddress")} <b id="tpvurl">${escapeHtml(tpvLegacy.serverUrl())}/functions/v1/cobro_tpv</b></p>
    <div class="acts"><button type="button" class="btn sec" id="tpvdemo">${t("ordersMore.tpvSettings.useTestData")}</button>
      <button type="button" class="btn sec" id="tpvprobar">${t("ordersMore.tpvSettings.try")}</button><button type="button" class="btn" id="tpvok">${t("ordersMore.tpvSettings.save")}</button></div>
    <p class="sm" id="tpvmsg"></p></div>`;
}
function message(text, isError = false) {
  const box = document.getElementById("tpvmsg");
  if (box) box.innerHTML = `<b class="${isError ? "tpverr" : "tpvok"}">${text}</b>`;
}
function saveErrorText(code, error) {
  const known = SAVE_ERRORS.get(code ?? "");
  return known ? t(known) : t("ordersMore.tpvSettings.couldNotSave") + (error ? `: ${escapeHtml(error.message ?? "")}` : "");
}
async function save5() {
  const settings = { activo: Boolean(field2("tpvact")?.checked), entorno: value5("tpvent"), comercio: value5("tpvcom"), terminal: value5("tpvter") };
  const { data: result, error } = await legacyDb().rpc("guardar_cobro_tpv", { p: settings, p_clave: value5("tpvcla") || null });
  if (error || !result?.ok) {
    message(saveErrorText(result?.error, error), true);
    return false;
  }
  tpvLegacy.setSettings({ ...settings, hay_clave: result.hay_clave });
  const secret = field2("tpvcla");
  if (secret) {
    secret.value = "";
    if (result.hay_clave) secret.placeholder = t("ordersMore.tpvSettings.secretSaved");
  }
  message(t("ordersMore.tpvSettings.saved"));
  return true;
}
async function tryIt() {
  if (!await save5()) return;
  const result = await callTpv({ accion: "probar" });
  if (!result.ok) {
    message(escapeHtml(tpvErrorText(result)), true);
    return;
  }
  const box = document.getElementById("tpvmsg");
  if (box) box.innerHTML = `<b class="tpvok">${t("ordersMore.tpvSettings.bankAccepts")}</b> ${result.url ? `<a href="${escapeHtml(result.url)}" target="_blank" rel="noopener">${t("ordersMore.tpvSettings.testPage")}</a>` : ""}`;
}
function useTestData() {
  const set = (id, text) => {
    const input3 = field2(id);
    if (input3) input3.value = text;
  };
  set("tpvcom", TEST_DATA.comercio);
  set("tpvter", TEST_DATA.terminal);
  set("tpvcla", TEST_DATA.clave);
  set("tpvent", "pruebas");
}
function paintTpvSettings() {
  const box = document.getElementById("cfgcuerpo");
  if (!box) return;
  box.innerHTML = pageHtml2(tpvLegacy.settings());
  const on2 = (id, action) => {
    const button = document.getElementById(id);
    if (button) button.onclick = () => {
      action(button);
    };
  };
  on2("tpvdemo", useTestData);
  on2("tpvok", (button) => {
    void tpvLegacy.whileWorking(button, t("ordersMore.tpvSettings.saving"), save5);
  });
  on2("tpvprobar", (button) => {
    void tpvLegacy.whileWorking(button, t("ordersMore.tpvSettings.trying"), tryIt);
  });
}
export {
  choosePlan,
  configureAlerts,
  editOrder,
  loadSales,
  openEditorDistributor,
  paintDistributors,
  paintOrderList,
  paintTpvSettings,
  showOrder
};
