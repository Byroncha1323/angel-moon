/* ==========================================================================
   ANGEL MOON — Lógica Principal y Asistente Conectado a WhatsApp (script.js)
   Formato y flujo idénticos al proyecto Bazar Copi Art, adaptados a ANGEL MOON
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const WHATSAPP_PHONE = "50670973956";
  const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_PHONE}`;
  const STORAGE_ORDER_KEY = "angel_moon_saved_order_v2";

  /**
   * Genera la URL oficial de la API de WhatsApp con el mensaje pre-cargado
   */
  function buildWhatsAppUrl(text) {
    if (!text) return WHATSAPP_BASE_URL;
    return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Guarda en localStorage la última solicitud de la clienta y actualiza el botón flotante
   */
  function saveOrderToPageMemory(orderText) {
    try {
      localStorage.setItem(STORAGE_ORDER_KEY, orderText);
    } catch {
      // Ignorar si el navegador bloquea storage
    }
    const floatLink = document.getElementById("whatsappFloatLink");
    if (floatLink && orderText) {
      floatLink.href = buildWhatsAppUrl(orderText);
    }
  }

  /* 1. Año actual en el footer */
  const yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* 2. Menú móvil */
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* 3. Estado en vivo del horario de atención */
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");

  function updateStoreStatus() {
    if (!statusDot || !statusText) return;

    const now = new Date();
    const day = now.getDay(); // 0 = Domingo, 1..6 = Lunes a Sábado
    const minutes = now.getHours() * 60 + now.getMinutes();

    let isOpen = false;
    let message = "";

    if (day >= 1 && day <= 6) {
      // Lunes a Sábado: 9:00 a.m. (540) a 6:00 p.m. (1080)
      isOpen = minutes >= 540 && minutes < 1080;
      message = isOpen
        ? "Abierta ahora · Lun-Sáb hasta las 6:00 p.m. (Entregas Sáb 12 m.d.)"
        : "Cerrada ahora · Atención Lun-Sáb de 9:00 a.m. a 6:00 p.m.";
    } else {
      isOpen = false;
      message = "Domingo: envíanos tu consulta o apartado por WhatsApp";
    }

    statusDot.classList.toggle("open", isOpen);
    statusDot.classList.toggle("closed", !isOpen);
    statusText.textContent = message;
  }

  updateStoreStatus();
  setInterval(updateStoreStatus, 60000);

  /* 4. Filtro de colección y precios */
  const filterButtons = document.querySelectorAll(".filter-btn");
  const serviceCards = document.querySelectorAll(".service-card");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      filterButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      serviceCards.forEach((card) => {
        const match = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("hidden", !match);
      });
    });
  });

  /* 5. Pestañas de Calidad y Compromiso */
  const qTabs = document.querySelectorAll(".q-tab");
  const qPanels = document.querySelectorAll(".q-panel");

  qTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = `panel-${tab.dataset.qtab}`;

      qTabs.forEach((t) => t.classList.remove("active"));
      qPanels.forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  /* 6. Formulario rápido para preparar pedido y abrir WhatsApp con el texto listo */
  const orderForm = document.getElementById("whatsappOrderForm");
  const formFeedback = document.getElementById("formFeedback");

  if (orderForm) {
    orderForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("customerName").value.trim();
      const service = document.getElementById("serviceType").value;
      const details = document.getElementById("orderDetails").value.trim();

      const formattedMessage =
        `Hola ANGEL MOON ✨, mi nombre es ${name}.\n` +
        `• Prenda de interés: ${service}\n` +
        `• Detalles / Talla: ${details}`;

      saveOrderToPageMemory(formattedMessage);

      let copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(formattedMessage);
          copied = true;
        } catch {
          copied = false;
        }
      }

      if (formFeedback) {
        formFeedback.textContent = copied
          ? "✅ Pedido guardado y copiado. Abriendo WhatsApp con tu solicitud lista..."
          : "Abriendo WhatsApp oficial de ANGEL MOON con tu solicitud...";
      }

      window.open(buildWhatsAppUrl(formattedMessage), "_blank", "noopener,noreferrer");
    });
  }

  /* 7. Chatbot de Preguntas Frecuentes (FAQ) de ANGEL MOON */
  const chatbotMessages = document.getElementById("chatbotMessages");
  const chatbotForm = document.getElementById("chatbotForm");
  const chatbotInput = document.getElementById("chatbotInput");
  const chatbotReset = document.getElementById("chatbotReset");
  const faqChips = document.querySelectorAll(".faq-chip");

  const FAQ_DATA = {
    ropa: {
      question: "¿Qué tipo de ropa venden y cómo sé si está disponible?",
      answer:
        "• <strong>¿Qué tipo de ropa venden?</strong> Contamos con diferentes prendas y estilos femeninos (blusas, tops, vestidos, conjuntos, pantalones, jeans y accesorios) para que encuentres opciones que se adapten a tus gustos y preferencias.<br>" +
        "• <strong>¿Cómo saber si está disponible?</strong> Envíanos una fotografía de la prenda que te interesa por WhatsApp y con gusto verificaremos su disponibilidad inmediata.",
    },
    precios: {
      question: "¿Cuáles son los precios y qué tallas tienen?",
      answer:
        "• <strong>Precios:</strong> Los precios varían según cada prenda (accesorios desde ₡2.500, tops desde ₡8.900, blusas desde ₡12.500 y vestidos/conjuntos desde ₡16.500). Si nos compartes una fotografía, te confirmaremos su precio exacto.<br>" +
        "• <strong>Tallas disponibles:</strong> Las tallas dependen de cada prenda (XS, S, M, L y 26 a 34). Escríbenos cuál te interesa para verificar las medidas y la disponibilidad.",
    },
    apartados: {
      question: "¿Realizan apartados y qué pasa si no cancelo a tiempo?",
      answer:
        "• <strong>¿Realizan apartados?</strong> ¡Sí! Puedes apartar tu prenda abonando el <strong>50% de su valor</strong>. El monto restante debe cancelarse en la fecha acordada.<br>" +
        "• <strong>¿Qué sucede si no cancelo en la fecha acordada?</strong> Para mantener el orden de los apartados, es importante respetar la fecha de pago establecida. De lo contrario, no podremos continuar con el apartado.",
    },
    entregas: {
      question: "¿Dónde realizan entregas personales y hacen envíos?",
      answer:
        "• <strong>Entregas personales:</strong> Realizamos entregas personales en <strong>San José, en el Parque Central, los sábados a partir del mediodía</strong>.<br>" +
        "• <strong>Envíos:</strong> ¡Claro! Escríbenos tu ubicación para consultar las opciones de envío disponibles y sus respectivos costos.",
    },
    pagos: {
      question: "¿Qué métodos de pago aceptan y cómo compro?",
      answer:
        "• <strong>¿Cómo realizar una compra?</strong> ¡Es muy sencillo! Envíanos una fotografía de la prenda que deseas o completa el pedido paso a paso aquí mismo y te ayudaremos con el proceso.<br>" +
        "• <strong>Métodos de pago:</strong> Aceptamos pagos mediante <strong>SINPE Móvil o efectivo</strong>. Puedes elegir la opción que te resulte más cómoda.",
    },
    cambios: {
      question: "¿Puedo cambiar una prenda o hablar con la encargada?",
      answer:
        "• <strong>¿Puedo cambiar una prenda?</strong> Para consultar si es posible realizar un cambio, comunícate directamente con la encargada y revisaremos tu caso.<br>" +
        "• <strong>¿Cómo hablar con una persona?</strong> ¡Por supuesto! Déjanos tu consulta en WhatsApp y la encargada continuará atendiéndote personalmente.",
    },
    canales: {
      question: "¿Cuáles son los canales de comunicación de la tienda?",
      answer:
        "Puedes encontrarnos y comunicarte con <strong>ANGEL MOON</strong> a través de:<br>" +
        "• <strong>WhatsApp Business (+506 7097-3956):</strong> Atención personalizada, consultas, recepción de pedidos, catálogos, pagos y entregas.<br>" +
        "• <strong>Instagram:</strong> Fotografías de prendas, conjuntos, novedades, promociones, historias y reels.<br>" +
        "• <strong>TikTok:</strong> Videos de prendas, combinaciones de outfits y tendencias.<br>" +
        "• <strong>Facebook:</strong> Publicaciones de productos, Marketplace y grupos de ventas.",
    },
  };

  function getDirectContactFollowupHTML(questionContext = "") {
    const waHref = buildWhatsAppUrl(
      questionContext
        ? `Hola ANGEL MOON, tengo una consulta sobre: ${questionContext}`
        : "Hola ANGEL MOON, me gustaría recibir atención personalizada."
    );
    return `
      <div class="chat-direct-followup">
        <p>¿Deseas enviar la fotografía de una prenda o hablar con la encargada?</p>
        <a href="${waHref}" target="_blank" rel="noopener noreferrer" class="chat-wa-link">
          💬 Contactar directamente por WhatsApp
        </a>
      </div>
    `;
  }

  function appendChatMessage(role, htmlContent, includeFollowup = false, questionContext = "") {
    if (!chatbotMessages) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-msg ${role}`;

    const bubbleDiv = document.createElement("div");
    bubbleDiv.className = "chat-bubble";
    bubbleDiv.innerHTML =
      htmlContent + (includeFollowup ? getDirectContactFollowupHTML(questionContext) : "");

    msgDiv.appendChild(bubbleDiv);
    chatbotMessages.appendChild(msgDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  function matchFreeTextQuestion(rawText) {
    const text = rawText.toLowerCase();

    if (
      text.includes("gracias") ||
      text.includes("adios") ||
      text.includes("adiós") ||
      text.includes("chao") ||
      text.includes("hasta luego")
    ) {
      return (
        "¡Gracias por escribirnos! 💖 Esperamos que hayas encontrado algo que te guste. " +
        "Recuerda que estamos aquí para ayudarte cuando quieras renovar tu estilo. ¡Será un gusto tenerte de vuelta!"
      );
    }
    if (
      text.includes("apartado") ||
      text.includes("apartar") ||
      text.includes("50%") ||
      text.includes("abono") ||
      text.includes("fecha") ||
      text.includes("no cancelo")
    ) {
      return FAQ_DATA.apartados.answer;
    }
    if (
      text.includes("entrega") ||
      text.includes("envio") ||
      text.includes("envío") ||
      text.includes("parque central") ||
      text.includes("san jose") ||
      text.includes("san josé") ||
      text.includes("sabado") ||
      text.includes("sábado") ||
      text.includes("mediodia") ||
      text.includes("ubicacion")
    ) {
      return FAQ_DATA.entregas.answer;
    }
    if (
      text.includes("sinpe") ||
      text.includes("pago") ||
      text.includes("pagar") ||
      text.includes("efectivo") ||
      text.includes("comprar") ||
      text.includes("compra")
    ) {
      return FAQ_DATA.pagos.answer;
    }
    if (
      text.includes("precio") ||
      text.includes("costo") ||
      text.includes("cuanto") ||
      text.includes("cuánto") ||
      text.includes("talla") ||
      text.includes("medida")
    ) {
      return FAQ_DATA.precios.answer;
    }
    if (
      text.includes("ropa") ||
      text.includes("prenda") ||
      text.includes("disponible") ||
      text.includes("vestido") ||
      text.includes("blusa") ||
      text.includes("conjunto") ||
      text.includes("pantalon") ||
      text.includes("jean") ||
      text.includes("accesorio")
    ) {
      return FAQ_DATA.ropa.answer;
    }
    if (
      text.includes("cambio") ||
      text.includes("cambiar") ||
      text.includes("encargada") ||
      text.includes("persona") ||
      text.includes("hablar")
    ) {
      return FAQ_DATA.cambios.answer;
    }
    if (
      text.includes("instagram") ||
      text.includes("tiktok") ||
      text.includes("facebook") ||
      text.includes("redes") ||
      text.includes("canal") ||
      text.includes("horario")
    ) {
      return FAQ_DATA.canales.answer;
    }

    // Mensaje oficial del documento cuando el chatbot no comprende una pregunta
    return (
      "¡Disculpa! No logré comprender tu consulta. ¿Podrías explicarme un poquito más? " +
      "Si lo prefieres, puedo comunicarte con la encargada por WhatsApp para brindarte una atención personalizada."
    );
  }

  faqChips.forEach((chip) => {
    if (chip.id === "startStepOrderBtn") return;
    chip.addEventListener("click", () => {
      const key = chip.dataset.faq;
      const item = FAQ_DATA[key];
      if (!item) return;

      stepBotActive = false;
      stepSession = null;

      appendChatMessage("user", item.question, false);
      setTimeout(() => {
        appendChatMessage("bot", item.answer, true, item.question);
      }, 220);
    });
  });

  /* 8. Modo Bot Paso a Paso (Nombre -> Teléfono -> Correo -> Menú 1 al 9 -> Detalles -> Enviar armado a WhatsApp) */
  const startStepOrderBtn = document.getElementById("startStepOrderBtn");
  let stepBotActive = false;
  let stepSession = null;
  const webSessionId = "web-" + Math.random().toString(36).slice(2, 10);

  const STEP_SERVICE_MENU = {
    "1": "1. Blusas Satinadas y Casuales (₡12.500 – ₡14.900)",
    "2": "2. Tops y Bodys Modernos (₡8.900 – ₡11.900)",
    "3": "3. Vestidos Midi y de Ocasión (₡16.500 – ₡21.900)",
    "4": "4. Conjuntos Coordinados 2 Piezas (₡18.900 – ₡24.500)",
    "5": "5. Pantalones Palazzo y Tiro Alto (₡17.500 – ₡19.900)",
    "6": "6. Jeans y Faldas Modernas (₡13.900 – ₡21.500)",
    "7": "7. Blazers y Suéteres de Temporada (₡14.500 – ₡22.900)",
    "8": "8. Bolsos y Carteras (₡10.500 – ₡12.900)",
    "9": "9. Accesorios Femeninos Rose Gold (Desde ₡2.500)",
  };

  function buildWhatsAppOrderText(session) {
    return (
      `Hola ANGEL MOON ✨, quiero realizar el siguiente pedido / apartado:\n` +
      `• Nombre: ${session.name}\n` +
      `• Teléfono: ${session.phone}\n` +
      `• Correo: ${session.email}\n` +
      `• Prenda / Categoría: ${session.serviceName}\n` +
      `• Talla y Detalles: ${session.details}`
    );
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  function renderNumberedMenuButtonsHTML() {
    const buttons = Object.entries(STEP_SERVICE_MENU)
      .map(
        ([num, label]) =>
          `<button type="button" class="chat-num-btn" data-menu-num="${num}">${label}</button>`
      )
      .join("");
    return `<div class="chat-menu-options">${buttons}</div>`;
  }

  function attachStepBotInteractiveListeners(containerEl, completedSession) {
    // Botones del menú numérico (1 al 9)
    containerEl.querySelectorAll(".chat-num-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const num = btn.getAttribute("data-menu-num");
        if (!num) return;
        handleStepBotUserInput(num);
      });
    });

    // Acciones finales cuando el pedido está completo
    if (completedSession) {
      const waText = buildWhatsAppOrderText(completedSession);
      const waUrlWithText = buildWhatsAppUrl(waText);
      const sendWaBtn = containerEl.querySelector(".js-send-order-wa");
      const copyOrderBtn = containerEl.querySelector(".js-copy-order-wa");
      const noticeEl = containerEl.querySelector(".js-copied-notice");

      if (sendWaBtn) {
        sendWaBtn.href = waUrlWithText;
        sendWaBtn.addEventListener("click", async (e) => {
          e.preventDefault();
          await copyTextToClipboard(waText);
          if (noticeEl) {
            noticeEl.textContent =
              "✅ ¡Abriendo WhatsApp de ANGEL MOON con tu pedido ya escrito!";
          }
          window.open(waUrlWithText, "_blank", "noopener,noreferrer");
        });
      }

      if (copyOrderBtn) {
        copyOrderBtn.addEventListener("click", async () => {
          const copied = await copyTextToClipboard(waText);
          if (noticeEl) {
            noticeEl.textContent = copied
              ? "✅ ¡Ficha copiada al portapapeles! Lista para enviar en WhatsApp."
              : "No se pudo copiar automáticamente.";
          }
        });
      }
    }
  }

  function appendStepBotMessage(htmlContent, extraHTML = "", completedSession = null) {
    if (!chatbotMessages) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg bot";

    const bubbleDiv = document.createElement("div");
    bubbleDiv.className = "chat-bubble";
    bubbleDiv.innerHTML = htmlContent + extraHTML;

    msgDiv.appendChild(bubbleDiv);
    chatbotMessages.appendChild(msgDiv);
    attachStepBotInteractiveListeners(bubbleDiv, completedSession);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  async function processLocalOrRemoteStep(userText) {
    const clean = (userText || "").trim();
    const lower = clean.toLowerCase();

    // Sincronizar en segundo plano con /api/whatsapp en Vercel
    fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "simulate",
        sessionId: webSessionId,
        text: clean,
        session: stepSession,
      }),
    }).catch(() => {});

    const isReset =
      !stepSession ||
      lower === "hola" ||
      lower === "inicio" ||
      lower === "menu" ||
      lower === "menú" ||
      lower === "reiniciar";

    if (isReset || stepSession.step === "COMPLETED") {
      stepSession = {
        step: "ASK_NAME",
        name: "",
        phone: "",
        email: "",
        serviceNumber: "",
        serviceName: "",
        details: "",
      };
      if (chatbotInput) {
        chatbotInput.placeholder = "Paso 1: Escribe tu nombre completo...";
      }
      appendStepBotMessage(
        "¡Perfecto! Vamos a preparar tu pedido o apartado paso a paso para <strong>ANGEL MOON</strong>. 👗✨<br><br>" +
          "<strong>Paso 1 de 5:</strong> Por favor escribe tu <strong>nombre completo</strong>:"
      );
      return;
    }

    if (stepSession.step === "ASK_NAME") {
      if (clean.length < 2) {
        appendStepBotMessage("Por favor escribe tu <strong>nombre completo</strong> para continuar:");
        return;
      }
      stepSession.name = clean;
      stepSession.step = "ASK_PHONE";
      if (chatbotInput) {
        chatbotInput.placeholder = "Paso 2: Escribe tu número de teléfono (ej. 8888-8888)...";
      }
      appendStepBotMessage(
        `¡Mucho gusto, <strong>${stepSession.name}</strong>! 💖<br><br>` +
          `<strong>Paso 2 de 5:</strong> Indícanos tu <strong>número de teléfono</strong> de contacto (ej. 8888-8888):`
      );
      return;
    }

    if (stepSession.step === "ASK_PHONE") {
      const digits = clean.replace(/\D/g, "");
      if (digits.length < 7) {
        appendStepBotMessage("Por favor ingresa un <strong>número de teléfono válido</strong> (ej. 8888-8888):");
        return;
      }
      stepSession.phone = clean;
      stepSession.step = "ASK_EMAIL";
      if (chatbotInput) {
        chatbotInput.placeholder = "Paso 3: Escribe tu correo electrónico (ej. maria@correo.com)...";
      }
      appendStepBotMessage(
        `Teléfono registrado (<strong>${stepSession.phone}</strong>). 📱<br><br>` +
          `<strong>Paso 3 de 5:</strong> Ahora escribe tu <strong>correo electrónico</strong>:`
      );
      return;
    }

    if (stepSession.step === "ASK_EMAIL") {
      if (!clean.includes("@") || !clean.includes(".")) {
        appendStepBotMessage("Por favor ingresa un <strong>correo electrónico válido</strong> (ej. clienta@correo.com):");
        return;
      }
      stepSession.email = clean;
      stepSession.step = "ASK_SERVICE";
      if (chatbotInput) {
        chatbotInput.placeholder = "Paso 4: Escribe un número del 1 al 9 o haz clic en una opción...";
      }
      appendStepBotMessage(
        `¡Gracias, <strong>${stepSession.name}</strong>! Ya guardamos tus datos.<br><br>` +
          `<strong>Paso 4 de 5:</strong> Escribe el <strong>número (del 1 al 9)</strong> o haz clic en la categoría de prenda que buscas:`,
        renderNumberedMenuButtonsHTML()
      );
      return;
    }

    if (stepSession.step === "ASK_SERVICE") {
      const match = clean.match(/^[1-9]$/);
      const num = match ? match[0] : null;
      if (!num || !STEP_SERVICE_MENU[num]) {
        appendStepBotMessage(
          "Por favor responde con un <strong>número del 1 al 9</strong> o selecciona una categoría de la lista:",
          renderNumberedMenuButtonsHTML()
        );
        return;
      }
      stepSession.serviceNumber = num;
      stepSession.serviceName = STEP_SERVICE_MENU[num];
      stepSession.step = "ASK_DETAILS";
      if (chatbotInput) {
        chatbotInput.placeholder = "Paso 5: Escribe talla, color, si deseas apartado 50% o entrega...";
      }
      appendStepBotMessage(
        `Has seleccionado:<br>✅ <strong>${stepSession.serviceName}</strong><br><br>` +
          `<strong>Paso 5 de 5:</strong> Escribe la <strong>talla deseada, color, cantidad</strong> y si deseas <strong>apartado con el 50%</strong> o entrega el sábado en Parque Central / envío:`
      );
      return;
    }

    if (stepSession.step === "ASK_DETAILS") {
      stepSession.details = clean;
      stepSession.step = "COMPLETED";
      stepBotActive = false;
      if (chatbotInput) {
        chatbotInput.placeholder = "Escribe tu pregunta aquí (ej. tallas, apartados, SINPE, entregas)...";
      }

      const completedSnapshot = { ...stepSession };
      const waFormatted = buildWhatsAppOrderText(completedSnapshot);
      const waDirectUrl = buildWhatsAppUrl(waFormatted);
      saveOrderToPageMemory(waFormatted);
      await copyTextToClipboard(waFormatted);

      // Rellenar también el formulario de contacto inferior automáticamente
      const nameInput = document.getElementById("customerName");
      const detailsInput = document.getElementById("orderDetails");
      if (nameInput) nameInput.value = completedSnapshot.name;
      if (detailsInput) {
        detailsInput.value = `Tel: ${completedSnapshot.phone} | Correo: ${completedSnapshot.email} | Prenda: ${completedSnapshot.serviceName} | Detalles: ${completedSnapshot.details}`;
      }

      const summaryHTML =
        `🎉 <strong>¡Ficha de Pedido / Apartado Lista para Enviar!</strong><br><br>` +
        `• <strong>Clienta:</strong> ${completedSnapshot.name}<br>` +
        `• <strong>Teléfono:</strong> ${completedSnapshot.phone}<br>` +
        `• <strong>Correo:</strong> ${completedSnapshot.email}<br>` +
        `• <strong>Categoría:</strong> ${completedSnapshot.serviceName}<br>` +
        `• <strong>Talla y Detalles:</strong> ${completedSnapshot.details}<br><br>` +
        `Tu pedido ya quedó guardado y pre-cargado. Haz clic abajo para abrir el WhatsApp de <strong>ANGEL MOON</strong> con toda tu lista ya escrita:`;

      const actionsHTML = `
        <div class="chat-order-summary-actions">
          <a href="${waDirectUrl}" target="_blank" rel="noopener noreferrer" class="chat-wa-link js-send-order-wa">
            📲 Enviar Pedido Armado a WhatsApp Ahora
          </a>
          <button type="button" class="chat-copy-btn js-copy-order-wa">
            📋 Volver a copiar ficha del pedido
          </button>
          <span class="chat-copied-notice js-copied-notice">✅ Ficha guardada y lista para enviar en WhatsApp</span>
        </div>
      `;

      appendStepBotMessage(summaryHTML, actionsHTML, completedSnapshot);
    }
  }

  async function handleStepBotUserInput(text) {
    appendChatMessage("user", text, false);
    await processLocalOrRemoteStep(text);
    if (chatbotInput) chatbotInput.focus();
  }

  if (startStepOrderBtn) {
    startStepOrderBtn.addEventListener("click", async () => {
      stepBotActive = true;
      stepSession = null;
      appendChatMessage("user", "Quiero hacer un pedido o apartado paso a paso", false);
      await processLocalOrRemoteStep("hola");
      if (chatbotInput) chatbotInput.focus();
    });
  }

  if (chatbotForm && chatbotInput) {
    chatbotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userQuestion = chatbotInput.value.trim();
      if (!userQuestion) return;

      chatbotInput.value = "";
      const lower = userQuestion.toLowerCase();

      if (
        stepBotActive ||
        lower === "hola" ||
        lower === "menu" ||
        lower === "menú" ||
        lower === "pedido"
      ) {
        stepBotActive = true;
        await handleStepBotUserInput(userQuestion);
        return;
      }

      appendChatMessage("user", userQuestion, false);
      const answerHTML = matchFreeTextQuestion(userQuestion);
      setTimeout(() => {
        appendChatMessage("bot", answerHTML, true, userQuestion);
      }, 250);
    });
  }

  if (chatbotReset && chatbotMessages) {
    chatbotReset.addEventListener("click", () => {
      stepBotActive = false;
      stepSession = null;
      if (chatbotInput) {
        chatbotInput.placeholder = "Escribe tu pregunta aquí (ej. tallas, apartados, SINPE, entregas)...";
      }
      chatbotMessages.innerHTML = `
        <div class="chat-msg bot">
          <div class="chat-bubble">
            ¡Holaaa! 👋 Bienvenida a <strong>ANGEL MOON</strong>. Gracias por escribirnos. Estamos felices de ayudarte.<br><br>
            Selecciona <strong>"👗 Hacer Pedido o Apartado Paso a Paso"</strong> a la izquierda para registrar tu prenda con menú numérico, o elige una pregunta frecuente.
          </div>
        </div>
      `;
    });
  }
});
