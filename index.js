
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

Tu función principal es responder y resolver dudas por WhatsApp sobre el Pack de Lectoescritura.

PERSONALIDAD Y TONO:
- Sé amable, cálida, paciente, comprensiva, cercana y respetuosa.
- Comunícate pensando en madres, padres, docentes y personas que acompañan la lectoescritura inicial.
- Comprende la duda antes de responder y mantén respuestas humanas, breves y claras.
- Responde normalmente en uno o dos párrafos cortos.
- No presiones a la persona para comprar ni te desvíes a otros productos.

INFORMACIÓN OFICIAL DEL NEGOCIO:
Negocio: Manitas Listas.
Producto: Pack de Lectoescritura.
Tipo de producto: Material 100 % digital en PDF, descargable e imprimible.
Objetivo: acompañar el reconocimiento de letras y sonidos, las sílabas, la formación de palabras, la escritura y la lectura inicial mediante actividades prácticas.

PRECIO FIJO:
- $89 MXN por el paquete completo. No es contribución voluntaria.

MÉTODOS DE PAGO:
- Transferencia.
- OXXO/Spin.
Los datos específicos de pago son mostrados por ManyChat. Nunca inventes datos bancarios.

FORMA DE ENTREGA:
El material se envía digitalmente por WhatsApp después de confirmar el pago.
No hay envío físico ni se promete entrega inmediata.

CONTENIDO DEL PACK:
- Familias silábicas interactivas de todas las consonantes, incluyendo CH y LL, sin RR como familia independiente.
- Personajes para colorear, recortar y doblar, por ejemplo mono (MA ME MI MO MU), pato (PA PE PI PO PU), sapo (SA SE SI SO SU) y tigre (TA TE TI TO TU).
- Detective de sílabas.
- Construyo palabras de dos sílabas.
- Escribe la sílaba que falta.
- Fichas para identificar y colorear la sílaba inicial.
- Silabario.
REGALOS INCLUIDOS SIN COSTO EXTRA:
- UNO silábico.
- Dominó silábico.

PÚBLICO:
Familias, docentes y pequeños en proceso de lectoescritura inicial. No inventes edades o grados exactos ni garantices resultados.

REGLAS IMPORTANTES:
- Responde la pregunta real y no inventes información.
- No inventes páginas, archivos, promociones, garantías, enlaces ni datos bancarios.
- No afirmes que un pago fue confirmado ni que ya entregaste archivos.
- No cambies el precio oficial de $89 MXN.
- Si preguntan por Lectoescritura, uñas u otro producto, indica amablemente que atiendes dudas del Pack de Lectoescritura y ofrece consultar al equipo.
- Si no tienes información suficiente, indica que necesitas confirmar con el equipo.
- Tu función principal es resolver dudas, no presionar para comprar.

LLAMADO A LA ACCIÓN:
Cuando sea apropiado orientar a la persona para continuar, puedes decir:
"Si deseas adquirir el Pack de Lectoescritura por $89 MXN, puedes elegir tu método de pago 😊."
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
    "Si deseas adquirir el paquete por $89 MXN, puedes elegir el método de pago que prefieras 😊.",
    "Si te interesa el paquete completo por $89 MXN, puedes elegir cómo prefieres pagar 💛.",
    "Cuando gustes adquirir el paquete por $89 MXN, puedes seleccionar tu método de pago 😊.",
  ];

  return elegirAleatoria(cierres);
}

function debeAgregarCierre(textoNormalizado) {
  const intencionesComerciales = [
    "precio",
    "costo",
    "cuanto cuesta",
    "cuanto vale",
    "pagar",
    "pago",
    "transferencia",
    "oxxo",
    "spin",
    "deposito",
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
    return cierreComercial();
  }

  if (!debeAgregarCierre(textoNormalizado)) {
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
  // Debe ir antes de CONFIABLE por ser una intención específica.
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
      "El paquete digital de Lectoescritura se entrega por WhatsApp después de confirmar el pago.",

      "Después de confirmar el pago, recibirás los PDF del Pack de Lectoescritura directamente por WhatsApp.",
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
      "El Pack de Lectoescritura es 100 % digital en PDF y no requiere envío a domicilio. Después de confirmar tu pago, lo recibes por WhatsApp.",

      "No necesitas esperar paquetería. Son archivos PDF imprimibles que se envían por WhatsApp después de confirmar el pago.",
    ];

    return {
      intencion: "domicilio",
      respuesta: elegirAleatoria(respuestas),
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
      "89 pesos",
      "89 mxn",
      "cuanto sale",
      "precio del pack",
    ])
  ) {
    const respuestas = [
      "El Pack de Lectoescritura cuesta $89 MXN en total. Incluye las familias silábicas, actividades de lectoescritura, UNO y Dominó silábicos de regalo. 📚",

      "El precio del Pack de Lectoescritura es fijo: $89 MXN. Incluye todas las consonantes, actividades complementarias y dos juegos silábicos de regalo. 📚",
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
      "Puedes pagar los $89 MXN mediante transferencia u OXXO/Spin. Selecciona tu método para ver los datos de pago en el flujo.",

      "Aceptamos transferencia y OXXO/Spin. Elige el método que prefieras para consultar los datos correspondientes.",
    ];

    return {
      intencion: "pago",
      respuesta: agregarCierre(
        elegirAleatoria(respuestas),
        textoNormalizado
      ),
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
      "El Pack de Lectoescritura es 100 % digital en PDF. Después de confirmar tu pago, lo recibes por WhatsApp para descargarlo e imprimirlo.",

      "El Pack de Lectoescritura se entrega en PDF. Una vez confirmado el pago, lo recibirás por WhatsApp para imprimirlo.",
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
      "preescolar",
      "para quien es",
      "primer grado",
    ])
  ) {
    const respuestas = [
      "Está pensado para niños que comienzan a reconocer letras, sílabas y palabras, con apoyo de familias o docentes. No se establece una edad exacta.",

      "Es un apoyo para la lectoescritura inicial, en casa o en el aula, según el avance de cada niño.",
    ];

    return {
      intencion: "edad",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  // ----------------------------------------------------------
  // 7. QUÉ INCLUYE / STICKERS
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
      "detective de silabas",
      "silabario",
      "familias silabicas",
      "consonantes",
      "silabas",
      "actividades",
    ])
  ) {
    const respuestas = [
      "El Pack de Lectoescritura incluye familias silábicas de todas las consonantes, incluyendo CH y LL; Detective de sílabas, Construyo palabras de dos sílabas, Escribe la sílaba que falta, fichas de sílaba inicial y silabario. De regalo UNO y Dominó silábicos. 📚",

      "Recibes familias silábicas interactivas para colorear, recortar y doblar, actividades para identificar y formar sílabas y palabras, y un silabario. Incluye UNO y Dominó silábicos de regalo. 📚",
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
      "Después de confirmar tu pago, el Pack de Lectoescritura se envía por WhatsApp. Si necesitas orientación, con gusto te ayudamos.",

      "El material digital de lectoescritura se entrega por WhatsApp después de confirmar el pago. Con gusto te orientamos si tienes dudas.",
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
      "Una vez confirmado tu pago de $89 MXN, el Pack de Lectoescritura y sus regalos se envían por WhatsApp.",

      "Después de confirmar el pago, recibes el Pack de Lectoescritura y los dos regalos por WhatsApp en PDF.",
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
      "Es un Pack de Lectoescritura digital con familias silábicas de todas las consonantes, actividades para identificar sílabas y formar palabras, silabario, UNO y Dominó silábicos de regalo.",

      "El Pack de Lectoescritura incluye personajes silábicos interactivos, Detective de sílabas, Construyo palabras, Escribe la sílaba que falta, fichas de sílaba inicial y silabario, más dos juegos de regalo.",
    ];

    return {
      intencion: "informes",
      respuesta: agregarCierre(
        elegirAleatoria(respuestas),
        textoNormalizado
      ),
    };
  }

  return null;
}

// ==========================================================
// RUTA DE SALUD
// ==========================================================

app.get("/", (req, res) => {
  res.send("Agente Julieta Navarro - Manitas Listas Lectoescritura activo ✅");
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
    // consulta OpenAI utilizando únicamente la base oficial.
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

    const respuestaFinal = agregarCierre(
      respuestaIA,
      textoNormalizado
    );

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
