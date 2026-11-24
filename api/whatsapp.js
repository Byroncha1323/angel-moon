/**
 * ANGEL MOON — Webhook Oficial de WhatsApp Cloud API + Simulador Web
 * Archivo: api/whatsapp.js (Serverless Function en Vercel, cero dependencias externas)
 *
 * Funcionalidades:
 * - GET  /api/whatsapp : Verificación del Webhook ante Meta for Developers y estado del servicio
 * - POST /api/whatsapp :
 *     1) mode: "simulate" -> Procesa el flujo paso a paso desde el chatbot de la página web
 *     2) object: "whatsapp_business_account" -> Recibe mensajes reales de WhatsApp, responde
 *        automáticamente paso a paso y notifica a la encargada (50670973956) al completar.
 */

const SERVICE_MENU = {
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

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hora por sesión
const memorySessions = new Map();

function loadSession(sessionId) {
  const entry = memorySessions.get(sessionId);
  if (!entry) return null;
  if (Date.now() - entry.updatedAt > SESSION_TTL_MS) {
    memorySessions.delete(sessionId);
    return null;
  }
  return entry;
}

function saveSession(sessionId, sessionData) {
  memorySessions.set(sessionId, {
    ...sessionData,
    updatedAt: Date.now(),
  });
}

function buildNumberedMenuText(customerName) {
  return (
    `¡Excelente, *${customerName}*! Ya registramos tus datos de contacto. 💖\n\n` +
    `*Paso 4 de 5:* Responde únicamente con el *NÚMERO (del 1 al 9)* de la prenda o categoría que te interesa:\n\n` +
    `*1.* Blusas Satinadas y Casuales (₡12.500 – ₡14.900)\n` +
    `*2.* Tops y Bodys Modernos (₡8.900 – ₡11.900)\n` +
    `*3.* Vestidos Midi y de Ocasión (₡16.500 – ₡21.900)\n` +
    `*4.* Conjuntos Coordinados 2 Piezas (₡18.900 – ₡24.500)\n` +
    `*5.* Pantalones Palazzo y Tiro Alto (₡17.500 – ₡19.900)\n` +
    `*6.* Jeans y Faldas Modernas (₡13.900 – ₡21.500)\n` +
    `*7.* Blazers y Suéteres de Temporada (₡14.500 – ₡22.900)\n` +
    `*8.* Bolsos y Carteras (₡10.500 – ₡12.900)\n` +
    `*9.* Accesorios Femeninos Rose Gold (Desde ₡2.500)`
  );
}

/**
 * Procesa el mensaje entrante según el paso actual de la clienta en ANGEL MOON
 */
export function processConversationStep(sessionId, incomingText, existingSession = null) {
  const cleanText = (incomingText || "").trim();
  const lower = cleanText.toLowerCase();

  let session = existingSession || loadSession(sessionId);

  const isResetKeyword =
    !session ||
    lower === "hola" ||
    lower === "holaaa" ||
    lower === "inicio" ||
    lower === "menu" ||
    lower === "menú" ||
    lower === "reiniciar" ||
    lower === "nuevo" ||
    lower === "empezar";

  // Inicio o reinicio de conversación
  if (isResetKeyword || session.step === "COMPLETED") {
    const newSession = {
      step: "ASK_NAME",
      name: "",
      phone: "",
      email: "",
      serviceNumber: "",
      serviceName: "",
      details: "",
      updatedAt: Date.now(),
    };
    saveSession(sessionId, newSession);

    const reply =
      `¡Holaaa! 👋 Bienvenida a *ANGEL MOON* _(Fashion · Style · More)_. Gracias por escribirnos. Estamos felices de ayudarte.\n\n` +
      `📍 *Entregas personales:* San José, Parque Central (Sábados desde las 12:00 m.d.) y envíos a todo el país.\n` +
      `💎 *Apartados:* Con el 50% del valor | *Pagos:* SINPE Móvil y Efectivo.\n\n` +
      `Para registrar tu pedido o apartado paso a paso, por favor escríbenos primero tu *nombre completo* _(Paso 1 de 5)_:`;

    return { reply, session: newSession };
  }

  // Paso 1: Recibir Nombre -> Pedir Teléfono
  if (session.step === "ASK_NAME") {
    if (cleanText.length < 2) {
      return {
        reply: "Por favor indícanos tu *nombre completo* para continuar con tu atención:",
        session,
      };
    }

    session.name = cleanText;
    session.step = "ASK_PHONE";
    saveSession(sessionId, session);

    const reply =
      `¡Muchas gracias, *${session.name}*! 💖\n\n` +
      `*Paso 2 de 5:* Por favor indícanos tu *número de teléfono* de contacto (por ejemplo: 8888-8888):`;

    return { reply, session };
  }

  // Paso 2: Recibir Teléfono -> Pedir Correo
  if (session.step === "ASK_PHONE") {
    const digitsOnly = cleanText.replace(/\D/g, "");
    if (digitsOnly.length < 7) {
      return {
        reply: "Por favor ingresa un *número de teléfono válido* (ej. 8888-8888):",
        session,
      };
    }

    session.phone = cleanText;
    session.step = "ASK_EMAIL";
    saveSession(sessionId, session);

    const reply =
      `Perfecto, teléfono registrado (${session.phone}). 📱\n\n` +
      `*Paso 3 de 5:* Ahora escríbenos tu *correo electrónico* (ej. maria@correo.com):`;

    return { reply, session };
  }

  // Paso 3: Recibir Correo -> Mostrar Menú Numérico (1 al 9)
  if (session.step === "ASK_EMAIL") {
    if (!cleanText.includes("@") || !cleanText.includes(".")) {
      return {
        reply: "Por favor escribe un *correo electrónico válido* que incluya '@' (ej. clienta@correo.com):",
        session,
      };
    }

    session.email = cleanText;
    session.step = "ASK_SERVICE";
    saveSession(sessionId, session);

    const reply = buildNumberedMenuText(session.name);
    return { reply, session };
  }

  // Paso 4: Recibir Opción del Menú por Número (1 al 9) -> Pedir Talla y Detalles
  if (session.step === "ASK_SERVICE") {
    const numMatch = cleanText.match(/^[1-9]$/);
    const chosenNumber = numMatch ? numMatch[0] : null;

    if (!chosenNumber || !SERVICE_MENU[chosenNumber]) {
      return {
        reply:
          `Por favor responde únicamente con un *número del 1 al 9* según la prenda que buscas:\n\n` +
          buildNumberedMenuText(session.name),
        session,
      };
    }

    session.serviceNumber = chosenNumber;
    session.serviceName = SERVICE_MENU[chosenNumber];
    session.step = "ASK_DETAILS";
    saveSession(sessionId, session);

    const reply =
      `Has elegido la categoría:\n✅ *${session.serviceName}*\n\n` +
      `*Paso 5 de 5 (Último paso):* Escríbenos la *talla deseada, color, cantidad* y si deseas *apartado con el 50%* o entrega en Parque Central San José / envío:`;

    return { reply, session };
  }

  // Paso 5: Recibir Detalles -> Confirmar Pedido / Apartado Completo
  if (session.step === "ASK_DETAILS") {
    session.details = cleanText;
    session.step = "COMPLETED";
    saveSession(sessionId, session);

    const reply =
      `🎉 *¡Solicitud Registrada con Éxito en ANGEL MOON!*\n\n` +
      `📋 *Ficha de la Clienta y Pedido:*\n` +
      `• *Clienta:* ${session.name}\n` +
      `• *Teléfono:* ${session.phone}\n` +
      `• *Correo:* ${session.email}\n` +
      `• *Prenda / Categoría:* ${session.serviceName}\n` +
      `• *Talla y Detalles:* ${session.details}\n\n` +
      `💎 *Apartados:* Puedes apartar abonando el *50%* y cancelar el resto en la fecha acordada.\n` +
      `💳 *Métodos de pago:* SINPE Móvil y Efectivo.\n` +
      `📍 *Entregas:* Sábados a partir del mediodía en el Parque Central de San José o por envío.\n` +
      `📸 _Si tienes la fotografía de la prenda que te gustó, ya puedes adjuntarla en este chat y nuestra encargada te confirmará disponibilidad._\n\n` +
      `¡Gracias por escribirnos! _(Escribe *HOLA* o *MENU* si deseas hacer otra consulta)._`;

    return { reply, session };
  }

  return {
    reply: "Escribe *HOLA* para iniciar tu consulta o pedido en ANGEL MOON.",
    session,
  };
}

/**
 * Envía un mensaje de texto usando la API Oficial de WhatsApp Cloud (Meta Graph API)
 */
async function sendWhatsAppCloudMessage(phoneNumberId, to, bodyText) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token || !phoneNumberId) {
    console.error("Falta configurar WHATSAPP_ACCESS_TOKEN o phoneNumberId.");
    return false;
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: bodyText },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Error enviando mensaje a WhatsApp Cloud API:", response.status, errText);
    return false;
  }
  return true;
}

/**
 * GET /api/whatsapp
 * - Verifica el Webhook ante Meta for Developers (hub.mode, hub.verify_token, hub.challenge)
 * - Si se visita desde el navegador, muestra el estado activo del webhook de ANGEL MOON
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "angel_moon_2026";

  if (mode === "subscribe") {
    if (token === expectedVerifyToken) {
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response("Token de verificación inválido", { status: 403 });
  }

  return Response.json({
    ok: true,
    service: "ANGEL MOON - WhatsApp Cloud API Webhook",
    whatsappNumber: "+506 7097-3956",
    verifyTokenDefault: "angel_moon_2026",
    steps: [
      "1. Nombre completo de la clienta",
      "2. Teléfono",
      "3. Correo electrónico",
      "4. Menú numérico de prendas (1 al 9)",
      "5. Talla, color, apartado 50% y confirmación con encargada",
    ],
    configured: {
      hasAccessToken: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
      hasPhoneNumberId: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
      hasCustomVerifyToken: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
    },
  });
}

/**
 * POST /api/whatsapp
 * - Recibe eventos en vivo de Meta WhatsApp Cloud API y responde automáticamente
 * - También soporta `mode: "simulate"` desde el chatbot de la página web
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Modo simulador / asistente interactivo desde la página web
    if (body && body.mode === "simulate") {
      const sessionId = body.sessionId || "web-guest";
      const text = body.text || "hola";
      const clientSession = body.session || null;

      const result = processConversationStep(sessionId, text, clientSession);

      return Response.json({
        ok: true,
        reply: result.reply,
        session: result.session,
      });
    }

    // 2. Evento oficial de Meta WhatsApp Cloud API
    if (body && body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];
      const phoneNumberId = value?.metadata?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (message && message.from) {
        const from = message.from;
        const incomingText =
          message.text?.body ||
          message.interactive?.button_reply?.title ||
          message.interactive?.list_reply?.title ||
          "hola";

        const result = processConversationStep(from, incomingText);

        await sendWhatsAppCloudMessage(phoneNumberId, from, result.reply);

        // Si la clienta completó los 5 pasos, notifica el resumen a la encargada (50670973956)
        const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER || "50670973956";
        if (result.session?.step === "COMPLETED" && ownerNumber) {
          const ownerSummary =
            `🔔 *Nuevo Pedido / Apartado por WhatsApp - ANGEL MOON*\n` +
            `• *Clienta:* ${result.session.name}\n` +
            `• *WhatsApp/Tel:* ${result.session.phone} (${from})\n` +
            `• *Correo:* ${result.session.email}\n` +
            `• *Categoría:* ${result.session.serviceName}\n` +
            `• *Talla y Detalles:* ${result.session.details}`;
          await sendWhatsAppCloudMessage(phoneNumberId, ownerNumber, ownerSummary);
        }
      }

      return Response.json({ status: "EVENT_RECEIVED" }, { status: 200 });
    }

    return Response.json({ ok: true, message: "Evento recibido" }, { status: 200 });
  } catch (error) {
    console.error("Error procesando webhook de WhatsApp:", error);
    return Response.json(
      { ok: false, error: "Error procesando la solicitud del webhook" },
      { status: 500 }
    );
  }
}
