/* ==========================================================================
   ANGEL MOON — Lógica Principal y Conexión a WhatsApp API (script.js)
   Proyecto Final • Curso: Servicio al Cliente • Año 2026

   ARQUITECTURA Y FUNCIONALIDADES:
   1. Configuración oficial de WhatsApp API (https://wa.me/50670973956)
   2. Persistencia en LocalStorage:
      - Lista de prendas seleccionadas (talla, modalidad de apartado/compra, cantidad)
      - Datos de la clienta ingresados en el Asistente o en el Formulario
   3. Menú hamburguesa adaptable y año actual dinámico
   4. Indicador de horario en vivo ("Abierta ahora" / "Cerrada ahora")
   5. Catálogo interactivo con selectores de talla, modalidad y envío directo
   6. Pestañas (Tabs) de Calidad y Experiencia de Atención
   7. Asistente Virtual Dual (Modo FAQ + Modo Pedido Paso a Paso de 5 niveles)
      conectado a la lista guardada y a WhatsApp Business
   8. Formulario sincronizado con confirmación en pantalla y salto a WhatsApp
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------------------------------------------------------------
     1. CONSTANTES DE WHATSAPP API Y CLAVES DE ALMACENAMIENTO LOCAL
     ------------------------------------------------------------------------ */
  const WHATSAPP_NUMBER = "50670973956";
  const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
  const STORAGE_KEY_LIST = "angel_moon_saved_list_v1";
  const STORAGE_KEY_CUSTOMER = "angel_moon_customer_v1";

  /* ------------------------------------------------------------------------
     2. ESTADO PERSISTENTE (LISTA DE PRENDAS Y DATOS DE LA CLIENTA)
     ------------------------------------------------------------------------ */
  let savedList = loadFromStorage(STORAGE_KEY_LIST, []);
  let customerProfile = loadFromStorage(STORAGE_KEY_CUSTOMER, {
    name: "",
    phone: "",
    email: "",
    category: "",
    details: "",
  });

  /**
   * Lee un valor JSON desde localStorage de forma segura
   */
  function loadFromStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Guarda un valor JSON en localStorage de forma segura
   */
  function saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignorar errores de cuota en navegadores privados restringidos
    }
  }

  /**
   * Formatea un número en colones costarricenses (ej. ₡14,500)
   */
  function formatColones(amount) {
    return "₡" + Number(amount || 0).toLocaleString("es-CR");
  }

  /* ------------------------------------------------------------------------
     3. GENERADOR DE MENSAJES Y CONEXIÓN A LA API DE WHATSAPP
     ------------------------------------------------------------------------ */
  /**
   * Construye el texto estructurado con la lista de prendas guardadas,
   * totales, cálculo del 50% de apartado y datos de la clienta.
   */
  function buildWhatsAppMessage(customContext = "") {
    const lines = [
      "✨ *HOLA ANGEL MOON* ✨",
      "Me gustaría recibir atención sobre la siguiente solicitud desde la página web:",
      "",
    ];

    if (customContext) {
      lines.push(`📌 *Motivo / Consulta:* ${customContext}`);
      lines.push("");
    }

    // Incluir datos de la clienta si ya fueron ingresados en la web o asistente
    if (
      customerProfile.name ||
      customerProfile.phone ||
      customerProfile.email
    ) {
      lines.push("👩 *DATOS DE LA CLIENTA:*");
      if (customerProfile.name) lines.push(`• Nombre: ${customerProfile.name}`);
      if (customerProfile.phone) lines.push(`• Teléfono: ${customerProfile.phone}`);
      if (customerProfile.email) lines.push(`• Correo: ${customerProfile.email}`);
      if (customerProfile.category) {
        lines.push(`• Categoría de interés: ${customerProfile.category}`);
      }
      lines.push("");
    }

    // Incluir la lista de prendas seleccionadas en el catálogo
    if (savedList.length > 0) {
      lines.push("🛍️ *MI LISTA DE PRENDAS SELECCIONADAS:*");
      let total = 0;

      savedList.forEach((item, index) => {
        const subtotal = item.priceNumber * item.qty;
        total += subtotal;
        lines.push(
          `${index + 1}. *${item.name}* (${item.qty} und.) — Talla: *${item.size}* — ${item.modality} — Subtotal: ${formatColones(subtotal)}`
        );
      });

      const deposit50 = Math.round(total * 0.5);
      lines.push("");
      lines.push(`💰 *Total estimado de la lista:* ${formatColones(total)}`);
      lines.push(`💎 *Monto para apartar con el 50%:* ${formatColones(deposit50)}`);
      lines.push("");
    }

    // Incluir detalles adicionales escritos por la clienta
    if (customerProfile.details) {
      lines.push(`📝 *Detalles adicionales:* ${customerProfile.details}`);
      lines.push("");
    }

    lines.push("💳 *Métodos de pago:* SINPE Móvil / Efectivo");
    lines.push(
      "📍 *Entrega:* A coordinar (Parque Central San José sábados desde mediodía o envío)."
    );
    lines.push("¡Muchas gracias!");

    return lines.join("\n");
  }

  /**
   * Abre la API oficial de WhatsApp (https://wa.me/50670973956?text=...)
   * en una nueva pestaña con toda la información guardada en la página.
   */
  function openWhatsAppWithSavedState(customContext = "") {
    syncFormToCustomerProfile();
    const message = buildWhatsAppMessage(customContext);
    const url = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  /* ------------------------------------------------------------------------
     4. AÑO DINÁMICO Y MENÚ HAMBURGUESA RESPONSIVE
     ------------------------------------------------------------------------ */
  const currentYearEl = document.getElementById("currentYear");
  if (currentYearEl) {
    currentYearEl.textContent = String(new Date().getFullYear());
  }

  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mainNav = document.getElementById("mainNav");

  if (hamburgerBtn && mainNav) {
    hamburgerBtn.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      hamburgerBtn.setAttribute("aria-expanded", String(isOpen));
    });

    mainNav.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("click", () => {
        mainNav.classList.remove("open");
        hamburgerBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------------------------------------------------
     5. INDICADOR EN VIVO DEL HORARIO DE ATENCIÓN
     Horario oficial: Lunes (1) a Sábado (6) de 9:00 a.m. a 6:00 p.m.
     ------------------------------------------------------------------------ */
  function updateStoreStatus() {
    const pill = document.getElementById("storeStatusPill");
    const text = document.getElementById("storeStatusText");
    if (!pill || !text) return;

    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const isOpenDay = day >= 1 && day <= 6;
    const isOpenHour = hour >= 9 && hour < 18;

    if (isOpenDay && isOpenHour) {
      pill.classList.remove("is-closed");
      text.textContent = "Abierta ahora • Lun–Sáb 9:00 a.m. – 6:00 p.m.";
    } else {
      pill.classList.add("is-closed");
      text.textContent = "Cerrada ahora • Lun–Sáb 9:00 a.m. – 6:00 p.m.";
    }
  }
  updateStoreStatus();
  setInterval(updateStoreStatus, 60000);

  /* ------------------------------------------------------------------------
     6. CATÁLOGO INTERACTIVO + GESTIÓN DE "MI LISTA DE PRENDAS"
     ------------------------------------------------------------------------ */
  const CATALOG_ITEMS = [
    {
      id: "blusa-aurora",
      category: "blusas",
      categoryLabel: "Blusas y Tops",
      selectValue: "Blusas y Tops (₡12,500 – ₡16,900)",
      name: "Blusa Satinada Aurora",
      priceNumber: 14500,
      sizes: ["S", "M", "L"],
      badge: "Tendencia 2026",
      description:
        "Diseño suave con caída elegante y acabados delicados, ideal para oficina o salidas casuales.",
    },
    {
      id: "top-luna",
      category: "blusas",
      categoryLabel: "Blusas y Tops",
      selectValue: "Blusas y Tops (₡12,500 – ₡16,900)",
      name: "Top Drapeado Rose",
      priceNumber: 12500,
      sizes: ["XS", "S", "M"],
      badge: "Nuevo ingreso",
      description:
        "Corte moderno y cómodo que realza tu estilo personal con telas frescas y versátiles.",
    },
    {
      id: "vestido-brisa",
      category: "vestidos",
      categoryLabel: "Vestidos y Conjuntos",
      selectValue: "Vestidos y Conjuntos (₡18,900 – ₡26,500)",
      name: "Vestido Midi Brisa",
      priceNumber: 21900,
      sizes: ["S", "M", "L"],
      badge: "Más buscado",
      description:
        "Silueta femenina fluida y favorecedora para eventos, tardes especiales o días soleados.",
    },
    {
      id: "conjunto-lunar",
      category: "vestidos",
      categoryLabel: "Vestidos y Conjuntos",
      selectValue: "Vestidos y Conjuntos (₡18,900 – ₡26,500)",
      name: "Conjunto Seda Empolvada",
      priceNumber: 24500,
      sizes: ["S", "M", "L"],
      badge: "Favorito",
      description:
        "Dos piezas coordinadas con acabados de alta calidad para lucir impecable sin esfuerzo.",
    },
    {
      id: "pantalon-palazzo",
      category: "pantalones",
      categoryLabel: "Pantalones y Jeans",
      selectValue: "Pantalones y Jeans (₡17,500 – ₡24,000)",
      name: "Pantalón Palazzo Marfil",
      priceNumber: 19500,
      sizes: ["28", "30", "32", "34"],
      badge: "Comodidad total",
      description:
        "Tiro alto estilizado con tela ligera de excelente caída y movimiento.",
    },
    {
      id: "jeans-sculpt",
      category: "pantalones",
      categoryLabel: "Pantalones y Jeans",
      selectValue: "Pantalones y Jeans (₡17,500 – ₡24,000)",
      name: "Jeans Tiro Alto Clásico",
      priceNumber: 22000,
      sizes: ["26", "28", "30", "32"],
      badge: "Esencial",
      description:
        "Denim cómodo con ajuste anatómico que combina con cualquier blusa o top.",
    },
    {
      id: "set-accesorios",
      category: "accesorios",
      categoryLabel: "Accesorios / Temporada",
      selectValue: "Accesorios y Temporada (₡5,500 – ₡11,900)",
      name: "Set Accesorios Oro Rosa",
      priceNumber: 7900,
      sizes: ["Talla Única"],
      badge: "Complemento",
      description:
        "Aretes y collar delicados en tono oro rosa para elevar cualquier conjunto.",
    },
    {
      id: "bolso-moon",
      category: "accesorios",
      categoryLabel: "Accesorios / Temporada",
      selectValue: "Accesorios y Temporada (₡5,500 – ₡11,900)",
      name: "Cartera Crossbody Perla",
      priceNumber: 11500,
      sizes: ["Talla Única"],
      badge: "Últimas unidades",
      description:
        "Tamaño práctico con correa ajustable y herrajes metálicos en tono cálido.",
    },
  ];

  const catalogGrid = document.getElementById("catalogGrid");
  const filterBtns = document.querySelectorAll(".filter-btn");

  /**
   * Agrega una prenda seleccionada (con talla y modalidad) a la lista persistente
   */
  function addItemToSavedList(item, chosenSize, chosenModality) {
    const existingIndex = savedList.findIndex(
      (entry) =>
        entry.id === item.id &&
        entry.size === chosenSize &&
        entry.modality === chosenModality
    );

    if (existingIndex > -1) {
      savedList[existingIndex].qty += 1;
    } else {
      savedList.push({
        id: item.id,
        name: item.name,
        categoryLabel: item.categoryLabel,
        selectValue: item.selectValue,
        priceNumber: item.priceNumber,
        size: chosenSize,
        modality: chosenModality,
        qty: 1,
      });
    }

    // Si la clienta aún no tenía categoría seleccionada en su perfil, asignamos la de esta prenda
    if (!customerProfile.category) {
      customerProfile.category = item.selectValue;
      saveToStorage(STORAGE_KEY_CUSTOMER, customerProfile);
    }

    saveToStorage(STORAGE_KEY_LIST, savedList);
    renderSavedList();
    populateFormFromSavedState();
  }

  /**
   * Renderiza el panel "Mi Lista de Prendas para Pedir o Apartar" y actualiza contadores
   */
  function renderSavedList() {
    const container = document.getElementById("savedListItems");
    const totalEl = document.getElementById("listTotalAmount");
    const depositEl = document.getElementById("listDepositAmount");
    const navCountEl = document.getElementById("navListCount");
    const floatCountEl = document.getElementById("floatingListCount");
    const floatTextEl = document.getElementById("floatingWaText");

    const totalItemsCount = savedList.reduce((acc, item) => acc + item.qty, 0);
    const totalPrice = savedList.reduce(
      (acc, item) => acc + item.priceNumber * item.qty,
      0
    );
    const deposit50 = Math.round(totalPrice * 0.5);

    if (navCountEl) navCountEl.textContent = String(totalItemsCount);
    if (floatCountEl) floatCountEl.textContent = String(totalItemsCount);
    if (floatTextEl) {
      floatTextEl.textContent =
        totalItemsCount > 0
          ? `Enviar Lista (${totalItemsCount}) a WhatsApp`
          : "Consultar en WhatsApp";
    }
    if (totalEl) totalEl.textContent = formatColones(totalPrice);
    if (depositEl) depositEl.textContent = formatColones(deposit50);

    if (!container) return;

    if (savedList.length === 0) {
      container.innerHTML = `
        <div class="empty-list-msg">
          Aún no has agregado prendas a tu lista. Elige la talla y haz clic en
          <strong>"➕ Agregar a mi lista"</strong> en cualquier prenda del catálogo
          para que quede guardada al pasar a WhatsApp.
        </div>
      `;
      return;
    }

    container.innerHTML = savedList
      .map(
        (item, idx) => `
      <div class="saved-item-row">
        <div class="saved-item-info">
          <strong>${idx + 1}. ${item.name} — Talla: ${item.size}</strong>
          <span>${item.modality} • ${formatColones(item.priceNumber)} c/u • Subtotal: <strong>${formatColones(
          item.priceNumber * item.qty
        )}</strong></span>
        </div>
        <div class="saved-item-controls">
          <button type="button" class="qty-btn" data-action="dec" data-idx="${idx}" aria-label="Disminuir cantidad">−</button>
          <strong>${item.qty}</strong>
          <button type="button" class="qty-btn" data-action="inc" data-idx="${idx}" aria-label="Aumentar cantidad">+</button>
          <button type="button" class="remove-item-btn" data-action="remove" data-idx="${idx}">Quitar</button>
        </div>
      </div>
    `
      )
      .join("");

    // Eventos de + / - / quitar
    container.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-action");
        const index = Number(btn.getAttribute("data-idx"));
        if (Number.isNaN(index) || !savedList[index]) return;

        if (action === "inc") {
          savedList[index].qty += 1;
        } else if (action === "dec") {
          savedList[index].qty -= 1;
          if (savedList[index].qty <= 0) savedList.splice(index, 1);
        } else if (action === "remove") {
          savedList.splice(index, 1);
        }

        saveToStorage(STORAGE_KEY_LIST, savedList);
        renderSavedList();
        populateFormFromSavedState();
      });
    });
  }

  /**
   * Renderiza las tarjetas del catálogo con selector de talla, modalidad y botones
   */
  function renderCatalog(category) {
    if (!catalogGrid) return;
    const items =
      category === "todos"
        ? CATALOG_ITEMS
        : CATALOG_ITEMS.filter((item) => item.category === category);

    catalogGrid.innerHTML = items
      .map((item) => {
        const deposit = Math.round(item.priceNumber * 0.5);
        const sizeOptions = item.sizes
          .map((s) => `<option value="${s}">Talla ${s}</option>`)
          .join("");

        return `
      <article class="product-card" data-product-id="${item.id}">
        <div>
          <div class="product-top">
            <span class="product-category">${item.categoryLabel}</span>
            <span class="product-badge">${item.badge}</span>
          </div>
          <h3 class="product-title">${item.name}</h3>
          <p class="product-desc">${item.description}</p>

          <div class="product-selectors">
            <div class="selector-field">
              <label for="size-${item.id}">Talla deseada</label>
              <select id="size-${item.id}" class="item-size-select">
                ${sizeOptions}
              </select>
            </div>
            <div class="selector-field">
              <label for="mod-${item.id}">Modalidad</label>
              <select id="mod-${item.id}" class="item-mod-select">
                <option value="Apartado con 50%">Apartado 50%</option>
                <option value="Compra de contado">Compra completa</option>
              </select>
            </div>
          </div>
        </div>

        <div class="product-meta">
          <div class="product-price-row">
            <span class="product-price">${formatColones(item.priceNumber)}</span>
            <span class="product-deposit-hint">Apartado 50%: ${formatColones(deposit)}</span>
          </div>
          <div class="product-actions">
            <button
              type="button"
              class="btn btn-accent add-to-list-btn"
              data-id="${item.id}"
            >
              ➕ Agregar a mi lista
            </button>
            <button
              type="button"
              class="btn btn-whatsapp direct-wa-item-btn"
              data-id="${item.id}"
            >
              📲 Pedir en WhatsApp
            </button>
          </div>
        </div>
      </article>
    `;
      })
      .join("");

    // Evento: Agregar a Mi Lista Guardada
    catalogGrid.querySelectorAll(".add-to-list-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const product = CATALOG_ITEMS.find((p) => p.id === id);
        if (!product) return;

        const sizeEl = document.getElementById(`size-${id}`);
        const modEl = document.getElementById(`mod-${id}`);
        const chosenSize = sizeEl ? sizeEl.value : product.sizes[0];
        const chosenMod = modEl ? modEl.value : "Apartado con 50%";

        addItemToSavedList(product, chosenSize, chosenMod);

        const originalText = btn.textContent;
        btn.textContent = "✅ ¡Guardada en tu lista!";
        setTimeout(() => {
          btn.textContent = originalText;
        }, 1600);
      });
    });

    // Evento: Agregar a la lista y abrir WhatsApp directamente
    catalogGrid.querySelectorAll(".direct-wa-item-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const product = CATALOG_ITEMS.find((p) => p.id === id);
        if (!product) return;

        const sizeEl = document.getElementById(`size-${id}`);
        const modEl = document.getElementById(`mod-${id}`);
        const chosenSize = sizeEl ? sizeEl.value : product.sizes[0];
        const chosenMod = modEl ? modEl.value : "Apartado con 50%";

        addItemToSavedList(product, chosenSize, chosenMod);
        openWhatsAppWithSavedState(
          `Quiero consultar/apartar "${product.name}" en talla ${chosenSize} (${chosenMod})`
        );
      });
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.getAttribute("data-category") || "todos";
      renderCatalog(cat);
    });
  });

  renderCatalog("todos");
  renderSavedList();

  // Botones del panel "Mi Lista"
  document
    .getElementById("sendListWhatsappBtn")
    ?.addEventListener("click", () => {
      openWhatsAppWithSavedState("Envío mi lista de prendas seleccionadas en la web");
    });

  document
    .getElementById("completeListInAssistantBtn")
    ?.addEventListener("click", () => {
      document.getElementById("asistente")?.scrollIntoView({
        behavior: "smooth",
      });
      startOrderMode();
    });

  document
    .getElementById("clearSavedListBtn")
    ?.addEventListener("click", () => {
      savedList = [];
      saveToStorage(STORAGE_KEY_LIST, savedList);
      renderSavedList();
      populateFormFromSavedState();
    });

  /* ------------------------------------------------------------------------
     7. PESTAÑAS DE CALIDAD Y EXPERIENCIA DE ATENCIÓN
     ------------------------------------------------------------------------ */
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");
      tabBtns.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      tabPanels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      document.getElementById(`tab-${targetId}`)?.classList.add("active");
    });
  });

  /* ------------------------------------------------------------------------
     8. ASISTENTE VIRTUAL DUAL CONECTADO A LA LISTA Y A WHATSAPP API
     ------------------------------------------------------------------------ */
  const chatMessagesEl = document.getElementById("chatMessages");
  const chatQuickBarEl = document.getElementById("chatQuickBar");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatModeBadge = document.getElementById("chatModeBadge");
  const switchFaqModeBtn = document.getElementById("switchFaqModeBtn");
  const switchOrderModeBtn = document.getElementById("switchOrderModeBtn");
  const resetChatBtn = document.getElementById("resetChatBtn");
  const startOrderFlowBtn = document.getElementById("startOrderFlowBtn");

  const ORDER_CATEGORIES = [
    {
      num: "1",
      label: "Blusas y Tops (₡12,500 – ₡16,900)",
      value: "Blusas y Tops (₡12,500 – ₡16,900)",
    },
    {
      num: "2",
      label: "Vestidos y Conjuntos (₡18,900 – ₡26,500)",
      value: "Vestidos y Conjuntos (₡18,900 – ₡26,500)",
    },
    {
      num: "3",
      label: "Pantalones y Jeans (₡17,500 – ₡24,000)",
      value: "Pantalones y Jeans (₡17,500 – ₡24,000)",
    },
    {
      num: "4",
      label: "Accesorios y Temporada (₡5,500 – ₡11,900)",
      value: "Accesorios y Temporada (₡5,500 – ₡11,900)",
    },
  ];

  const WELCOME_TEXT =
    "¡Holaaa! Bienvenida a ANGEL MOON. Gracias por escribirnos. Estamos felices de ayudarte.\n¿Qué información necesitas?\n• Ver prendas disponibles.\n• Consultar precios y tallas.\n• Información sobre apartados.\n• Información sobre entregas.\n• Pasar mi lista directo a WhatsApp.\n¡Estamos para servirte!";

  const FALLBACK_TEXT =
    "¡Disculpa! No logré comprender tu consulta. ¿Podrías explicarme un poquito más? Si lo prefieres, puedo pasarte directamente con la encargada por WhatsApp (+506 7097-3956) llevando tu lista de prendas guardadas.";

  const FAREWELL_TEXT =
    "¡Gracias por escribirnos! Esperamos que hayas encontrado algo que te guste. Recuerda que estamos aquí para ayudarte cuando quieras renovar tu estilo. ¡Será un gusto tenerte de vuelta!";

  const FAQ_ANSWERS = {
    horario:
      "Nuestro horario de atención es de Lunes a Sábado de 9:00 a.m. a 6:00 p.m. Además, realizamos entregas personales en San José, Parque Central, los sábados a partir del mediodía.\n\nPuedes hacer tu pedido paso a paso aquí mismo o enviarnos tu lista por WhatsApp.",
    precios:
      "Contamos con diferentes prendas y estilos con precios accesibles:\n• Blusas y Tops: ₡12,500 – ₡16,900\n• Vestidos y Conjuntos: ₡18,900 – ₡26,500\n• Pantalones y Jeans: ₡17,500 – ₡24,000\n• Accesorios y Temporada: ₡5,500 – ₡11,900\n\nAgrega tus favoritas en el catálogo y pásalas listas a nuestro WhatsApp.",
    tallas:
      "Las tallas dependen de cada prenda (XS, S, M, L y tallas 26 a 34 en pantalones y jeans). Puedes elegir tu talla en cada tarjeta del catálogo para guardarla en tu lista de WhatsApp.",
    pagos:
      "Aceptamos pagos mediante SINPE Móvil o efectivo. Puedes elegir la opción que te resulte más cómoda al confirmar tu compra o apartado.",
    apartados:
      "¡Sí realizamos apartados! Puedes apartar tu prenda abonando el 50% de su valor y el monto restante debe cancelarse en la fecha acordada. Es importante respetar la fecha de pago establecida para mantener el orden de los apartados.",
    envios:
      "Realizamos entregas personales en San José, en el Parque Central, los sábados a partir del mediodía. ¡También realizamos envíos! Escríbenos tu ubicación por WhatsApp para consultar las opciones y costos.",
    cambios:
      "Para consultar si es posible realizar un cambio o hablar directamente con la encargada, puedes abrir nuestro WhatsApp Business (+506 7097-3956) con el botón de abajo y revisaremos tu caso personalmente.",
  };

  let chatMode = "faq"; // "faq" | "order"
  let orderStep = 0; // 1..5

  function getTime() {
    return new Date().toLocaleTimeString("es-CR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function normalizeText(str) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  /**
   * Agrega una burbuja de mensaje al chat con botones interactivos opcionales
   */
  function appendMessage(sender, text, options = {}) {
    if (!chatMessagesEl) return;
    const row = document.createElement("div");
    row.className = `msg-row ${sender}`;

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.textContent = text;

    // Opciones numeradas de categoría en el Paso 4
    if (options.categoryButtons) {
      const list = document.createElement("div");
      list.className = "chat-option-list";
      ORDER_CATEGORIES.forEach((cat) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chat-option-btn";
        btn.textContent = `${cat.num}. ${cat.label}`;
        btn.addEventListener("click", () => {
          handleUserMessage(cat.num);
        });
        list.appendChild(btn);
      });
      bubble.appendChild(list);
    }

    // Acciones al finalizar ficha o requerir WhatsApp (Copiar + Enviar a WhatsApp)
    if (options.copyFichaText || options.showWhatsAppButton) {
      const actionsRow = document.createElement("div");
      actionsRow.className = "chat-bubble-actions";

      if (options.copyFichaText) {
        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "copy-ficha-btn";
        copyBtn.textContent = "📋 Copiar Ficha";
        copyBtn.addEventListener("click", () => {
          navigator.clipboard?.writeText(options.copyFichaText).then(() => {
            copyBtn.textContent = "✅ ¡Copiada!";
            setTimeout(() => {
              copyBtn.textContent = "📋 Copiar Ficha";
            }, 2200);
          });
        });
        actionsRow.appendChild(copyBtn);
      }

      if (options.showWhatsAppButton) {
        const waBtn = document.createElement("button");
        waBtn.type = "button";
        waBtn.className = "wa-ficha-btn";
        waBtn.textContent =
          options.waButtonLabel || "📲 Enviar Lista y Ficha a WhatsApp";
        waBtn.addEventListener("click", () => {
          openWhatsAppWithSavedState(options.waContext || "");
        });
        actionsRow.appendChild(waBtn);
      }

      bubble.appendChild(actionsRow);
    }

    const timeEl = document.createElement("span");
    timeEl.className = "msg-time";
    timeEl.textContent = `${sender === "bot" ? "ANGEL MOON" : "Tú"} • ${getTime()}`;

    row.appendChild(bubble);
    row.appendChild(timeEl);
    chatMessagesEl.appendChild(row);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }

  function renderQuickChips(chips) {
    if (!chatQuickBarEl) return;
    chatQuickBarEl.innerHTML = "";
    chips.forEach((chip) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quick-chip";
      btn.textContent = chip.label;
      btn.addEventListener("click", chip.onClick);
      chatQuickBarEl.appendChild(btn);
    });
  }

  function setModeUI(mode) {
    chatMode = mode;
    if (chatModeBadge) {
      chatModeBadge.textContent =
        mode === "faq"
          ? "Modo: Preguntas Frecuentes"
          : `Modo: Pedido Paso a Paso (Paso ${orderStep || 1} de 5)`;
    }
    switchFaqModeBtn?.classList.toggle("active", mode === "faq");
    switchOrderModeBtn?.classList.toggle("active", mode === "order");
  }

  function initFaqMode() {
    setModeUI("faq");
    orderStep = 0;
    if (chatMessagesEl) chatMessagesEl.innerHTML = "";
    appendMessage("bot", WELCOME_TEXT, {
      showWhatsAppButton: savedList.length > 0,
      waButtonLabel: `📲 Enviar Mi Lista (${savedList.length}) a WhatsApp`,
      waContext: "Consulta con mi lista de prendas desde el Asistente Virtual",
    });

    renderQuickChips([
      {
        label: "Precios y prendas",
        onClick: () => triggerFaq("precios", "Consultar precios y prendas"),
      },
      {
        label: "Tallas disponibles",
        onClick: () => triggerFaq("tallas", "¿Qué tallas tienen?"),
      },
      {
        label: "Apartados 50%",
        onClick: () => triggerFaq("apartados", "¿Cómo funcionan los apartados?"),
      },
      {
        label: "👗 Pedido Paso a Paso",
        onClick: () => startOrderMode(),
      },
      {
        label: "📲 Pasar a WhatsApp",
        onClick: () =>
          openWhatsAppWithSavedState("Consulta directa desde el Asistente Virtual"),
      },
    ]);
  }

  function triggerFaq(key, userLabel) {
    if (chatMode !== "faq") {
      setModeUI("faq");
    }
    appendMessage("user", userLabel);
    appendMessage("bot", FAQ_ANSWERS[key], {
      showWhatsAppButton: true,
      waButtonLabel: "📲 Continuar en WhatsApp con mi lista",
      waContext: `Consulta sobre: ${userLabel}`,
    });

    renderQuickChips([
      {
        label: "Métodos de pago",
        onClick: () => triggerFaq("pagos", "¿Qué métodos de pago aceptan?"),
      },
      {
        label: "Entregas y envíos",
        onClick: () => triggerFaq("envios", "Información sobre entregas"),
      },
      {
        label: "👗 Pedido Paso a Paso",
        onClick: () => startOrderMode(),
      },
      {
        label: "📲 Enviar a WhatsApp",
        onClick: () => openWhatsAppWithSavedState(userLabel),
      },
    ]);
  }

  /**
   * Inicia el flujo guiado de 5 pasos sincronizado con la lista guardada
   */
  function startOrderMode() {
    setModeUI("order");
    orderStep = 1;
    if (chatModeBadge) {
      chatModeBadge.textContent = "Modo: Pedido Paso a Paso (Paso 1 de 5)";
    }

    const listSummary =
      savedList.length > 0
        ? `\n\n🛍️ Tienes **${savedList.reduce(
            (a, b) => a + b.qty,
            0
          )} prenda(s)** guardadas en tu lista que se incluirán automáticamente al finalizar.`
        : "";

    appendMessage(
      "bot",
      `¡Con mucho gusto te ayudo a preparar tu pedido o apartado para enviarlo listo a WhatsApp! 👗✨${listSummary}\n\nPaso 1 de 5: Por favor escribe tu **nombre completo**.`
    );

    renderQuickChips([
      { label: "Volver a Preguntas Frecuentes", onClick: () => initFaqMode() },
      {
        label: "📲 Ir directo a WhatsApp ahora",
        onClick: () =>
          openWhatsAppWithSavedState("Pedido directo desde el Asistente"),
      },
    ]);
    chatInput?.focus();
  }

  function processOrderStep(raw) {
    const val = raw.trim();

    if (orderStep === 1) {
      if (val.length < 3) {
        appendMessage(
          "bot",
          "Por favor ingresa tu nombre completo (mínimo 3 caracteres)."
        );
        return;
      }
      customerProfile.name = val;
      saveToStorage(STORAGE_KEY_CUSTOMER, customerProfile);
      populateFormFromSavedState();

      orderStep = 2;
      if (chatModeBadge)
        chatModeBadge.textContent = "Modo: Pedido Paso a Paso (Paso 2 de 5)";
      appendMessage(
        "bot",
        `¡Gracias, ${customerProfile.name}! 💖\n\nPaso 2 de 5: Escribe tu **número de teléfono** (al menos 8 dígitos) para coordinar tu entrega o apartado.`
      );
      return;
    }

    if (orderStep === 2) {
      const digits = val.replace(/\D/g, "");
      if (digits.length < 8) {
        appendMessage(
          "bot",
          "El número de teléfono debe tener al menos 8 dígitos. Por favor verifícalo e inténtalo de nuevo."
        );
        return;
      }
      customerProfile.phone = val;
      saveToStorage(STORAGE_KEY_CUSTOMER, customerProfile);
      populateFormFromSavedState();

      orderStep = 3;
      if (chatModeBadge)
        chatModeBadge.textContent = "Modo: Pedido Paso a Paso (Paso 3 de 5)";
      appendMessage(
        "bot",
        "Paso 3 de 5: Ahora ingresa tu **correo electrónico** (ejemplo: maria@correo.com)."
      );
      return;
    }

    if (orderStep === 3) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        appendMessage(
          "bot",
          "Por favor ingresa un correo electrónico válido (ejemplo: maria@correo.com)."
        );
        return;
      }
      customerProfile.email = val;
      saveToStorage(STORAGE_KEY_CUSTOMER, customerProfile);
      populateFormFromSavedState();

      orderStep = 4;
      if (chatModeBadge)
        chatModeBadge.textContent = "Modo: Pedido Paso a Paso (Paso 4 de 5)";
      appendMessage(
        "bot",
        "Paso 4 de 5: Selecciona la **categoría principal de prenda** escribiendo el número (1, 2, 3 o 4) o haciendo clic sobre la opción:",
        { categoryButtons: true }
      );
      return;
    }

    if (orderStep === 4) {
      const found = ORDER_CATEGORIES.find(
        (c) =>
          c.num === val || normalizeText(c.label).includes(normalizeText(val))
      );
      if (!found) {
        appendMessage(
          "bot",
          "Por favor escribe un número válido del 1 al 4 o haz clic en una de las categorías anteriores.",
          { categoryButtons: true }
        );
        return;
      }
      customerProfile.category = found.value;
      saveToStorage(STORAGE_KEY_CUSTOMER, customerProfile);
      populateFormFromSavedState();

      orderStep = 5;
      if (chatModeBadge)
        chatModeBadge.textContent = "Modo: Pedido Paso a Paso (Paso 5 de 5)";
      appendMessage(
        "bot",
        `Elegiste: ${found.label}.\n\nPaso 5 de 5: Indica la **talla deseada, color, cantidad** o detalles de entrega (ejemplo: Talla M, color rosa, apartado 50% para recoger el sábado en Parque Central).`
      );
      return;
    }

    if (orderStep === 5) {
      if (val.length < 3) {
        appendMessage(
          "bot",
          "Por favor detalla la talla, color o preferencia de entrega para completar tu ficha."
        );
        return;
      }
      customerProfile.details = val;
      saveToStorage(STORAGE_KEY_CUSTOMER, customerProfile);
      populateFormFromSavedState();

      orderStep = 0;
      setModeUI("faq");

      const ficha = buildWhatsAppMessage(
        "Pedido / Apartado completado paso a paso en la web"
      );

      appendMessage(
        "bot",
        `¡Excelente, ${customerProfile.name}! 🎉 Hemos guardado toda tu información en la página y generado tu ficha completa con tu lista de prendas.\n\nHaz clic en **"📲 Enviar Lista y Ficha a WhatsApp"** para pasar directo al WhatsApp de ANGEL MOON con todo listo:\n\n${ficha}`,
        {
          copyFichaText: ficha,
          showWhatsAppButton: true,
          waButtonLabel: "📲 Enviar Lista y Ficha a WhatsApp (+506 7097-3956)",
          waContext: "Pedido / Apartado completado paso a paso en la web",
        }
      );

      renderQuickChips([
        {
          label: "📲 Abrir WhatsApp con mi pedido",
          onClick: () =>
            openWhatsAppWithSavedState(
              "Pedido / Apartado completado paso a paso en la web"
            ),
        },
        {
          label: "Ver formulario autocompletado",
          onClick: () =>
            document
              .getElementById("contacto")
              ?.scrollIntoView({ behavior: "smooth" }),
        },
        { label: "Finalizar consulta", onClick: () => handleUserMessage("Gracias") },
      ]);
    }
  }

  function processFaqInput(raw) {
    const q = normalizeText(raw);

    if (/\b(whatsapp|encargada|asesora|pasar a whatsapp)\b/.test(q)) {
      appendMessage(
        "bot",
        "¡Claro que sí! Haz clic en el botón de abajo para pasar a nuestro WhatsApp oficial (+506 7097-3956) llevando automáticamente tu lista de prendas guardadas.",
        {
          showWhatsAppButton: true,
          waButtonLabel: "📲 Abrir WhatsApp con Mi Lista",
          waContext: "Solicitud de atención personalizada con la encargada",
        }
      );
      return;
    }
    if (/\b(gracias|adios|chao|bye|hasta luego|finalizar)\b/.test(q)) {
      appendMessage("bot", FAREWELL_TEXT, {
        showWhatsAppButton: true,
        waButtonLabel: "📲 Enviar mi lista por WhatsApp",
      });
      return;
    }
    if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches)\b/.test(q)) {
      appendMessage("bot", WELCOME_TEXT);
      return;
    }
    if (/(apartad|apartar|50%|abono|fecha)/.test(q)) {
      appendMessage("bot", FAQ_ANSWERS.apartados, {
        showWhatsAppButton: true,
        waContext: "Consulta sobre apartados del 50%",
      });
      return;
    }
    if (/(pago|pagar|sinpe|efectivo|metodo)/.test(q)) {
      appendMessage("bot", FAQ_ANSWERS.pagos, {
        showWhatsAppButton: true,
        waContext: "Consulta sobre pago con SINPE Móvil / Efectivo",
      });
      return;
    }
    if (/(entrega|envio|parque central|san jose|sabado|ubicacion)/.test(q)) {
      appendMessage("bot", FAQ_ANSWERS.envios, {
        showWhatsAppButton: true,
        waContext: "Consulta sobre entregas y envíos",
      });
      return;
    }
    if (/(horario|abierto|abierta|hora|cerrado)/.test(q)) {
      appendMessage("bot", FAQ_ANSWERS.horario);
      return;
    }
    if (/(talla|medida|tamano)/.test(q)) {
      appendMessage("bot", FAQ_ANSWERS.tallas, {
        showWhatsAppButton: true,
        waContext: "Consulta de tallas y medidas",
      });
      return;
    }
    if (/(precio|cuesta|valor|ropa|prenda|disponible|comprar|pedido)/.test(q)) {
      appendMessage("bot", FAQ_ANSWERS.precios, {
        showWhatsAppButton: true,
        waContext: "Consulta de disponibilidad y precios",
      });
      return;
    }
    if (/(cambio|cambiar|persona|hablar)/.test(q)) {
      appendMessage("bot", FAQ_ANSWERS.cambios, {
        showWhatsAppButton: true,
        waContext: "Consulta con la encargada",
      });
      return;
    }

    appendMessage("bot", FALLBACK_TEXT, {
      showWhatsAppButton: true,
      waButtonLabel: "📲 Hablar con la encargada en WhatsApp",
      waContext: raw,
    });
  }

  function handleUserMessage(rawText) {
    const clean = rawText.trim();
    if (!clean) return;
    appendMessage("user", clean);

    if (chatMode === "order" && orderStep > 0) {
      processOrderStep(clean);
    } else {
      processFaqInput(clean);
    }
  }

  chatForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!chatInput) return;
    const text = chatInput.value;
    chatInput.value = "";
    handleUserMessage(text);
  });

  document.querySelectorAll(".faq-quick-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-faq");
      if (key && FAQ_ANSWERS[key]) {
        triggerFaq(key, btn.textContent.trim());
      }
    });
  });

  startOrderFlowBtn?.addEventListener("click", () => startOrderMode());
  switchOrderModeBtn?.addEventListener("click", () => startOrderMode());
  switchFaqModeBtn?.addEventListener("click", () => initFaqMode());
  resetChatBtn?.addEventListener("click", () => initFaqMode());

  /* ------------------------------------------------------------------------
     9. SINCRONIZACIÓN ENTRE FORMULARIO, LOCALSTORAGE Y BOTONES DE WHATSAPP
     ------------------------------------------------------------------------ */
  const reqName = document.getElementById("reqName");
  const reqPhone = document.getElementById("reqPhone");
  const reqEmail = document.getElementById("reqEmail");
  const reqCategory = document.getElementById("reqCategory");
  const reqDetails = document.getElementById("reqDetails");
  const orderRequestForm = document.getElementById("orderRequestForm");
  const orderConfirmation = document.getElementById("orderConfirmation");

  /**
   * Rellena el formulario inferior con lo que está guardado en memoria
   */
  function populateFormFromSavedState() {
    if (reqName && customerProfile.name) reqName.value = customerProfile.name;
    if (reqPhone && customerProfile.phone) reqPhone.value = customerProfile.phone;
    if (reqEmail && customerProfile.email) reqEmail.value = customerProfile.email;
    if (reqCategory && customerProfile.category) {
      reqCategory.value = customerProfile.category;
    }

    if (reqDetails) {
      const listSummary =
        savedList.length > 0
          ? "Prendas en mi lista: " +
            savedList
              .map(
                (i) => `${i.name} (Talla ${i.size}, ${i.qty} und., ${i.modality})`
              )
              .join("; ") +
            ". "
          : "";
      reqDetails.value =
        customerProfile.details || listSummary.trim();
    }
  }

  /**
   * Guarda en localStorage lo que la clienta escriba en el formulario en tiempo real
   */
  function syncFormToCustomerProfile() {
    if (reqName) customerProfile.name = reqName.value.trim();
    if (reqPhone) customerProfile.phone = reqPhone.value.trim();
    if (reqEmail) customerProfile.email = reqEmail.value.trim();
    if (reqCategory) customerProfile.category = reqCategory.value.trim();
    if (reqDetails) customerProfile.details = reqDetails.value.trim();
    saveToStorage(STORAGE_KEY_CUSTOMER, customerProfile);
  }

  [reqName, reqPhone, reqEmail, reqCategory, reqDetails].forEach((field) => {
    field?.addEventListener("input", syncFormToCustomerProfile);
    field?.addEventListener("change", syncFormToCustomerProfile);
  });

  function showConfirmationSummary() {
    syncFormToCustomerProfile();
    if (!orderConfirmation) return;
    orderConfirmation.classList.remove("hidden");
    orderConfirmation.textContent =
      "✅ ¡Información guardada en la página y lista para WhatsApp!\n\n" +
      buildWhatsAppMessage("Solicitud registrada en el formulario web");
  }

  // Enviar formulario y abrir WhatsApp con toda la lista
  orderRequestForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    showConfirmationSummary();
    openWhatsAppWithSavedState("Solicitud registrada desde el formulario web");
  });

  // Guardar solo en pantalla sin abrir pestaña externa
  document
    .getElementById("saveOnlyFormBtn")
    ?.addEventListener("click", () => {
      showConfirmationSummary();
    });

  // Conectar todos los botones globales de WhatsApp en la página y asistente
  [
    "navWhatsappBtn",
    "heroWhatsappBtn",
    "assistantDirectWhatsappBtn",
    "chatHeaderWhatsappBtn",
    "contactCardWhatsappBtn",
    "floatingWhatsappBtn",
  ].forEach((btnId) => {
    document.getElementById(btnId)?.addEventListener("click", () => {
      openWhatsAppWithSavedState(
        "Consulta y lista de prendas desde la página web ANGEL MOON"
      );
    });
  });

  populateFormFromSavedState();
  initFaqMode();
});
