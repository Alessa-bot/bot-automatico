
require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 8080;

// ==========================================================
// SYSTEM PROMPT
// ==========================================================

const SYSTEM_PROMPT = `
Eres Julieta Navarro, asistente de Manitas Listas.

Tu función principal es responder y resolver dudas por WhatsApp sobre el Mega Pack de Lectoescritura 360.

PERSONALIDAD Y TONO:
- Sé amable, cálida, paciente, comprensiva, cercana y respetuosa.
- Comunícate pensando en madres, padres, docentes y personas que acompañan la lectoescritura inicial.
- Comprende la duda antes de responder.
- Mantén respuestas humanas, breves y claras.
- Responde normalmente en uno o dos párrafos cortos.
- No presiones a la persona para comprar ni te desvíes a otros productos.

INFORMACIÓN OFICIAL DEL NEGOCIO:
Negocio: Manitas Listas.
Producto: Mega Pack de Lectoescritura 360.
Tipo de producto: Material 100 % digital en PDF, descargable y listo para imprimir.

OBJETIVO:
Apoyar a los pequeños en el proceso de aprendizaje de la lectura mediante el reconocimiento de sonidos, sílabas y formación de palabras.

PRECIO:
- $99 MXN por el paquete completo.
- No es contribución voluntaria.
- No inventes descuentos adicionales ni promociones.
- No afirmes que quedan accesos limitados sin información actualizada.

MÉTODOS DE PAGO:
- Transferencia.
- OXXO/Spin.
Los datos específicos de pago son mostrados por ManyChat.
Nunca inventes datos bancarios.

FORMA DE ENTREGA:
El material se envía digitalmente por WhatsApp después de confirmar el pago.
No hay envío físico.

CONTENIDO OFICIAL DEL PACK:

- Método de Grafismo Fonético: El puente visual para los sonidos.
- Silabario Completo: Sílabas simples y trabadas.
- Set de Juegos: Cartas tipo UNO, Bingo y Dominó Silábico.
- Regalo: Cuadernillo de trazos.

PÚBLICO:
Familias, docentes y pequeños en proceso de lectoescritura inicial.
No inventes edades o grados exactos ni garantices resultados.

REGLAS IMPORTANTES:
- Responde la pregunta real y no inventes información.
- No inventes páginas, archivos, promociones, garantías, enlaces ni datos bancarios.
- No afirmes que un pago fue confirmado ni que ya entregaste archivos.
- No cambies el precio oficial de $99 MXN.
- Si preguntan por otro producto, indica amablemente que atiendes dudas del Mega Pack de Lectoescritura 360.
- Si no tienes información suficiente, indica que necesitas confirmar con el equipo.
- Tu función principal es resolver dudas y orientar al cliente.
- Si la persona indica que ya realizó su pago, explica que deberá confirmarse antes de entregar el material.
- No confundas una CLABE interbancaria con un número de tarjeta.

LLAMADO A LA ACCIÓN:
Cuando sea apropiado orientar a la persona para continuar, puedes decir:

"Si deseas adquirir el Mega Pack de Lectoescritura 360 por $99 MXN, puedes elegir tu método de pago 😊."

No agregues este llamado a la acción en todas las respuestas.
`;

// ==========================================================
// UTILIDADES
// ==========================================================

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function elegirAleatoria(opciones) {
  return opciones[Math.floor(Math.random() * opciones.length)];
}

function limpiarRespuesta(texto) {
  return String(texto || "")
    .trim()
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

function contieneAlguna(texto, palabras) {
  return palabras.some((palabra) =>
    texto.includes(normalizarTexto(palabra))
  );
}

// ==========================================================
// CIERRE COMERCIAL
// ==========================================================

function cierreComercial() {
  const cierres = [
    "Si deseas adquirir el paquete por $99 MXN, puedes elegir el método de pago que prefieras 😊.",
    "Si te interesa el paquete completo por $99 MXN, puedes elegir cómo prefieres pagar 💛.",
    "Cuando gustes adquirir el paquete por $99 MXN, puedes seleccionar tu método de pago 😊.",
  ];

  return elegirAleatoria(cierres);
}

function debeAgregarCierre(textoNormalizado) {
  const intencionesComerciales = [
    "precio",
    "costo",
    "cuanto cuesta",
    "cuanto vale",
    "quiero comprar",
    "quiero el material",
    "quiero adquirir",
    "me interesa",
    "informes",
    "informacion",
    "como lo obtengo",
    "como lo compro",
  ];

  return contieneAlguna(
    textoNormalizado,
    intencionesComerciales
  );
}

function agregarCierre(texto, textoNormalizado) {
  const limpio = limpiarRespuesta(texto);

  if (!limpio) {
    return "¿Podrías contarme un poco más sobre tu duda? Con gusto te ayudo.";
  }

  if (!debeAgregarCierre(textoNormalizado)) {
    return limpio;
  }

  if (
    contieneAlguna(normalizarTexto(limpio), [
      "metodo de pago",
      "prefieres pagar",
      "datos de pago",
      "como pagar",
    ])
  ) {
    return limpio;
  }

  return `${limpio}\n\n${cierreComercial()}`;
}

// ==========================================================
// RESPUESTAS DIRECTAS
// ==========================================================

function respuestaDirecta(textoNormalizado) {

  // ----------------------------------------------------------
  // 1. ESTAFA
  // ----------------------------------------------------------

  if (
    contieneAlguna(textoNormalizado, [
      "estafa",
      "fraude",
      "engaño",
      "engano",
      "no me estafen",
      "es real",
      "miedo a pagar",
    ])
  ) {
    const respuestas = [
      "Comprendemos tu preocupación 😊. El Mega Pack de Lectoescritura 360 se entrega por WhatsApp después de confirmar el pago.",

      "Después de confirmar el pago, recibirás los PDF del Mega Pack de Lectoescritura 360 directamente por WhatsApp. Con gusto resolvemos tus dudas.",
    ];

    return {
      intencion: "estafa",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  // ----------------------------------------------------------
  // 2. DOMICILIO
  // ----------------------------------------------------------

  if (
    contieneAlguna(textoNormalizado, [
      "domicilio",
      "a domicilio",
      "me llega a casa",
      "envio a casa",
      "envío a casa",
      "paqueteria",
      "paquetería",
      "direccion",
      "dirección",
    ])
  ) {
    const respuestas = [
      "El Mega Pack de Lectoescritura 360 es 100 % digital en PDF y no requiere envío a domicilio. Después de confirmar tu pago, lo recibes por WhatsApp.",

      "No necesitas esperar paquetería. Son archivos PDF imprimibles que se envían por WhatsApp después de confirmar el pago.",
    ];

    return {
      intencion: "domicilio",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  // ----------------------------------------------------------
  // PAGO REALIZADO
  // ----------------------------------------------------------

  if (
    contieneAlguna(textoNormalizado, [
      "ya pague",
      "ya hice el pago",
      "ya realice el pago",
      "ya deposite",
      "ya transferi",
      "ya hice la transferencia",
      "ya envie mi comprobante",
      "ya mande mi comprobante",
    ])
  ) {
    return {
      intencion: "pago_realizado",
      respuesta:
        "¡Muchas gracias! 😊 Una vez confirmado tu pago, recibirás el material completo por WhatsApp.",
    };
  }

  // ----------------------------------------------------------
  // PROBLEMAS DE PAGO
  // ----------------------------------------------------------

  if (
    contieneAlguna(textoNormalizado, [
      "no puedo pagar",
      "no me deja pagar",
      "no puedo transferir",
      "no me deja transferir",
      "no acepta la cuenta",
      "no acepta la tarjeta",
      "no acepta la clabe",
      "cuenta invalida",
      "tarjeta invalida",
      "error de transferencia",
      "error al pagar",
      "no me aparece el banco",
    ])
  ) {
    return {
      intencion: "problema_pago",
      respuesta:
        "Con gusto te ayudo 😊. ¿Podrías indicarme qué error te aparece al intentar realizar el pago? También contamos con la opción de pago por OXXO/Spin.",
    };
  }

  // ----------------------------------------------------------
  // CLABE INTERBANCARIA
  // ----------------------------------------------------------

  if (
    contieneAlguna(textoNormalizado, [
      "clabe",
      "18 digitos",
      "clave interbancaria",
    ])
  ) {
    return {
      intencion: "clabe",
      respuesta:
        "La CLABE interbancaria consta de 18 dígitos. Si tu aplicación bancaria te solicita el tipo de cuenta, selecciona la opción CLABE cuando corresponda a los datos de pago que recibiste.",
    };
  }

  // ----------------------------------------------------------
  // 3. PRECIO
  // ----------------------------------------------------------

  if (
    contieneAlguna(textoNormalizado, [
      "precio",
      "costo",
      "cuanto cuesta",
      "cuánto cuesta",
      "cuanto vale",
      "cuánto vale",
      "99 pesos",
      "99 mxn",
      "cuanto sale",
      "precio del pack",
    ])
  ) {
    const respuestas = [
      "El Mega Pack de Lectoescritura 360 cuesta solamente $99 MXN. Incluye Grafismo Fonético, silabario completo, UNO, Bingo, Dominó Silábico y un cuadernillo de trazos de regalo. 📚",

      "Por $99 MXN recibes el Mega Pack de Lectoescritura 360 completo, con todos sus materiales, juegos y el cuadernillo de trazos de regalo. 📚",
    ];

    return {
      intencion: "precio",
      respuesta: agregarCierre(
        elegirAleatoria(respuestas),
        textoNormalizado
      ),
    };
  }

  // ----------------------------------------------------------
  // 4. PAGO
  // ----------------------------------------------------------

  if (
    contieneAlguna(textoNormalizado, [
      "pago",
      "pagar",
      "como pago",
      "cómo pago",
      "transferencia",
      "oxxo",
      "spin",
      "deposito",
      "depósito",
      "metodo de pago",
      "método de pago",
      "forma de pago",
    ])
  ) {
    const respuestas = [
      "Puedes pagar los $99 MXN mediante transferencia u OXXO/Spin. Selecciona tu método para consultar los datos de pago. 😊",

      "Aceptamos transferencia y OXXO/Spin. Elige el método que prefieras para consultar los datos correspondientes.",
    ];

    return {
      intencion: "pago",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  // ----------------------------------------------------------
  // 5. DIGITAL / FORMATO / RECEPCIÓN
  // ----------------------------------------------------------

  if (
    contieneAlguna(textoNormalizado, [
      "digital",
      "pdf",
      "fisico",
      "físico",
      "imprimible",
      "archivo",
      "formato",
      "como lo recibo",
      "cómo lo recibo",
      "por whatsapp",
      "whatsapp",
    ])
  ) {
    const respuestas = [
      "El Mega Pack de Lectoescritura 360 es 100 % digital en PDF. Después de confirmar tu pago, lo recibes por WhatsApp para descargarlo e imprimirlo.",

      "Todo el material se entrega en formato PDF, listo para imprimir. Una vez confirmado el pago, lo recibirás por WhatsApp.",
    ];

    return {
      intencion: "digital",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  // ----------------------------------------------------------
  // 6. PÚBLICO / EXPERIENCIA
  // ----------------------------------------------------------

  if (
    contieneAlguna(textoNormalizado, [
      "edad",
      "edades",
      "años",
      "anos",
      "para que edad",
      "para qué edad",
      "que edad",
      "qué edad",
      "preescolar",
      "primaria",
      "para quien es",
      "primer grado",
    ])
  ) {
    const respuestas = [
      "Está pensado para pequeños que comienzan a reconocer sonidos, sílabas y palabras, con apoyo de familias o docentes. Depende del nivel de aprendizaje de cada niño. 😊",

      "Es un material de apoyo para la lectoescritura inicial que puedes utilizar tanto en casa como en el aula, según el avance de cada pequeño.",
    ];

    return {
      intencion: "edad",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  // ----------------------------------------------------------
  // 7. QUÉ INCLUYE
  // ----------------------------------------------------------

  if (
    contieneAlguna(textoNormalizado, [
      "incluye",
      "que incluye",
      "qué incluye",
      "que trae",
      "qué trae",
      "contenido",
      "que contiene",
      "qué contiene",
      "grafismo fonetico",
      "silabas trabadas",
      "silabas simples",
      "cuadernillo de trazos",
      "bingo",
      "domino",
      "silabario",
      "silabas",
      "actividades",
      "regalos",
      "bonos",
    ])
  ) {
    const respuestas = [
      "El Mega Pack de Lectoescritura 360 incluye:\n\n✅ Método de Grafismo Fonético: El puente visual para los sonidos.\n✅ Silabario Completo: Sílabas simples y trabadas.\n✅ Set de Juegos: Cartas tipo UNO, Bingo y Dominó Silábico.\n🎁 Regalo: Cuadernillo de trazos.",

      "Recibes el Método de Grafismo Fonético, un silabario completo de sílabas simples y trabadas, cartas tipo UNO, Bingo y Dominó Silábico, además de un cuadernillo de trazos de regalo. 📚",
    ];

    return {
      intencion: "incluye",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  // ----------------------------------------------------------
  // 8. CONFIABLE
  // ----------------------------------------------------------

  if (
    contieneAlguna(textoNormalizado, [
      "confiable",
      "confianza",
      "seguro",
      "segura",
      "si entregan",
      "sí entregan",
      "si recibo",
      "sí recibo",
      "recibire",
      "recibiré",
      "me van a entregar",
    ])
  ) {
    const respuestas = [
      "Después de confirmar tu pago, el Mega Pack de Lectoescritura 360 se envía por WhatsApp. Si necesitas orientación, con gusto te ayudamos.",

      "El material digital se entrega por WhatsApp después de confirmar el pago. Con gusto te orientamos si tienes dudas. 😊",
    ];

    return {
      intencion: "confiable",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  // ----------------------------------------------------------
  // 9. ENTREGA
  // ----------------------------------------------------------

  if (
    contieneAlguna(textoNormalizado, [
      "entrega",
      "entregan",
      "cuando entregan",
      "cuándo entregan",
      "cuando llega",
      "cuándo llega",
      "cuanto tarda",
      "cuánto tarda",
      "cuando recibo",
      "cuándo recibo",
    ])
  ) {
    const respuestas = [
      "Una vez confirmado tu pago de $99 MXN, el Mega Pack de Lectoescritura 360 completo se envía por WhatsApp.",

      "Después de confirmar el pago, recibes todos los materiales, juegos y el cuadernillo de trazos de regalo por WhatsApp en formato PDF.",
    ];

    return {
      intencion: "entrega",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  // ----------------------------------------------------------
  // 10. INFORMES
  // ----------------------------------------------------------

  if (
    contieneAlguna(textoNormalizado, [
      "informes",
      "informacion",
      "información",
      "quiero informacion",
      "quiero información",
      "me interesa",
      "quiero saber mas",
      "quiero saber más",
      "de que se trata",
      "de qué se trata",
    ])
  ) {
    const respuestas = [
      "¡Hola! Qué gusto que quieras apoyar a tu peque con su lectura. 🍎📚\n\nEl Mega Pack de Lectoescritura 360 es un material digital (PDF) listo para imprimir que incluye:\n\n✅ Método de Grafismo Fonético: El puente visual para los sonidos.\n✅ Silabario Completo: Sílabas simples y trabadas.\n✅ Set de Juegos: Cartas tipo UNO, Bingo y Dominó Silábico.\n🎁 Regalo: Cuadernillo de trazos.\n\n⚡ Llévatelo hoy por solo $99 MXN.\n\n¿Te gustaría que te envíe los datos de pago?",

      "El Mega Pack de Lectoescritura 360 incluye Grafismo Fonético, silabario de sílabas simples y trabadas, UNO, Bingo y Dominó Silábico, más un cuadernillo de trazos de regalo. Todo por solo $99 MXN. 📚\n\n¿Te gustaría recibir los datos de pago?",
    ];

    return {
      intencion: "informes",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  return null;
}

// ==========================================================
// RUTA DE SALUD
// ==========================================================

app.get("/", (req, res) => {
  res.send(
    "Agente Julieta Navarro - Manitas Listas Grafismo Fonético activo ✅"
  );
});

// ==========================================================
// MENSAJES DE MANYCHAT
// ==========================================================

app.post("/mensaje", async (req, res) => {
  try {
    const texto =
      req.body.texto ||
      req.body.mensaje ||
      req.body.message ||
      "";

    console.log(
      "Mensaje recibido:",
      texto ? "[contenido recibido]" : "[vacío]"
    );

    if (!texto) {
      return res.json({
        respuesta:
          "No pude identificar el mensaje. Por favor, escríbelo nuevamente.",
      });
    }

    const textoNormalizado = normalizarTexto(texto);

    // Primero busca una respuesta oficial directa.
    const directa = respuestaDirecta(textoNormalizado);

    if (directa) {
      console.log(
        "Intención detectada:",
        directa.intencion
      );

      console.log(
        "Respuesta generada mediante base de conocimiento"
      );

      return res.json({
        respuesta: directa.respuesta,
      });
    }

    // Si no coincide con una intención directa,
    // consulta OpenAI utilizando la base oficial.

    console.log(
      "Intención detectada: consulta abierta"
    );

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      input: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: texto,
        },
      ],
    });

    const respuestaIA =
      response.output_text || "";

    const respuestaFinal =
      limpiarRespuesta(respuestaIA) ||
      "¿Podrías contarme un poco más sobre tu duda? Con gusto te ayudo.";

    console.log(
      "Respuesta generada mediante OpenAI"
    );

    return res.json({
      respuesta: respuestaFinal,
    });

  } catch (error) {
    console.error(
      "Error en /mensaje:",
      error.message
    );

    return res.status(200).json({
      respuesta:
        "En este momento no pude procesar tu mensaje. Por favor, inténtalo nuevamente en unos minutos.",
    });
  }
});

// ==========================================================
// SERVIDOR
// ==========================================================

app.listen(PORT, () => {
  console.log(
    `Servidor de Julieta Navarro activo en puerto ${PORT}`
  );
});
