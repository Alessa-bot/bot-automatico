
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

Tu función principal es responder y resolver dudas por WhatsApp sobre el Kit de Rutinas Infantiles.

PERSONALIDAD Y TONO:
- Sé amable, cálida, paciente, comprensiva, cercana y respetuosa.
- Comunícate pensando en madres, padres, docentes y personas que acompañan las rutinas infantiles.
- Comprende la duda antes de responder.
- Mantén respuestas humanas, breves y claras.
- Responde normalmente en uno o dos párrafos cortos.
- No presiones a la persona para comprar ni te desvíes a otros productos.

INFORMACIÓN OFICIAL DEL NEGOCIO:
Negocio: Manitas Listas.
Producto: Kit de Rutinas Infantiles.
Tipo de producto: Material 100 % digital en PDF, descargable y listo para imprimir.

OBJETIVO:
Fomentar buenos hábitos, autonomía y responsabilidad mediante misiones, puntos y recompensas elegidas por la familia.

PRECIO:
- $89 MXN por el paquete completo.
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

- Cuatro diseños: espacio, autos, princesas y sirenas.
- Tableros personalizables, billetes de puntos, vales de recompensas, alcancías armables y guía para padres.
- Regalos: tableros de Navidad, invierno y vacaciones; 24 actividades en familia; rutinas visuales; diario de gratitud; juegos educativos; libro para colorear y actividades de recortar y pegar.
- Cada familia elige las tareas y recompensas. No se recomienda retirar necesidades básicas como castigo.

PÚBLICO:
Familias, cuidadores y docentes que desean apoyar los hábitos infantiles.
No inventes edades o grados exactos ni garantices resultados.

CÓMO FUNCIONA:
- El adulto elige las misiones y asigna puntos; el pequeño marca las tareas realizadas y puede canjear puntos por recompensas acordadas en familia.
- No garantices cambios de conducta ni resultados en plazos determinados.
- No prometas cantidades exactas de archivos o actividades que no estén confirmadas.

REGLAS IMPORTANTES:
- Responde la pregunta real y no inventes información.
- No inventes páginas, archivos, promociones, garantías, enlaces ni datos bancarios.
- No afirmes que un pago fue confirmado ni que ya entregaste archivos.
- No cambies el precio oficial de $89 MXN.
- Si preguntan por otro producto, indica amablemente que atiendes dudas del Kit de Rutinas Infantiles.
- Si no tienes información suficiente, indica que necesitas confirmar con el equipo.
- Tu función principal es resolver dudas y orientar al cliente.
- Si la persona indica que ya realizó su pago, explica que deberá confirmarse antes de entregar el material.
- No confundas una CLABE interbancaria con un número de tarjeta.

LLAMADO A LA ACCIÓN:
Cuando sea apropiado orientar a la persona para continuar, puedes decir:

"Si deseas adquirir el Kit de Rutinas Infantiles por $89 MXN, puedes elegir tu método de pago 😊."

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
      "Comprendemos tu preocupación 😊. El Kit de Rutinas Infantiles se entrega por WhatsApp después de confirmar el pago.",

      "Después de confirmar el pago, recibirás los PDF del Kit de Rutinas Infantiles directamente por WhatsApp. Con gusto resolvemos tus dudas.",
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
      "El Kit de Rutinas Infantiles es 100 % digital en PDF y no requiere envío a domicilio. Después de confirmar tu pago, lo recibes por WhatsApp.",

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
      "89 pesos",
      "89 mxn",
      "cuanto sale",
      "precio del kit",
    ])
  ) {
    const respuestas = [
      "El Kit de Rutinas Infantiles cuesta solamente $89 MXN. Incluye cuatro diseños de tableros, puntos, recompensas, rutinas visuales y regalos de Navidad, invierno y vacaciones. 🌈",

      "Por $89 MXN recibes el Kit de Rutinas Infantiles completo, con todos sus tableros, rutinas y regalos. 📚",
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
      "Puedes pagar los $89 MXN mediante transferencia u OXXO/Spin. Selecciona tu método para consultar los datos de pago. 😊",

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
      "El Kit de Rutinas Infantiles es 100 % digital en PDF. Después de confirmar tu pago, lo recibes por WhatsApp para descargarlo e imprimirlo.",

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
      "Está pensado para pequeños que están desarrollando hábitos y autonomía, con apoyo de un adulto. Puedes adaptar las tareas a sus capacidades. 😊",

      "Puedes utilizarlo en casa o en el aula, adaptando las misiones a las necesidades de cada pequeño.",
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
      "tableros",
      "rutinas visuales",
      "billetes",
      "recompensas",
      "navidad",
      "invierno",
      "vacaciones",
      "colorear",
      "recortar",
      "actividades",
      "regalos",
      "bonos",
    ])
  ) {
    const respuestas = [
      "El Kit de Rutinas Infantiles incluye:\n\n✅ Cuatro tableros: espacio, autos, princesas y sirenas.\n✅ Billetes, vales, alcancías y guía.\n🎁 Regalos: Navidad, invierno, vacaciones, rutinas visuales, actividades en familia, diario de gratitud, juegos educativos, libro para colorear y recortar y pegar.",

      "Recibes cuatro diseños de misiones, billetes, vales, alcancías y guía. También incluye regalos de Navidad, invierno y vacaciones, rutinas visuales, actividades en familia, diario de gratitud, juegos educativos, libro para colorear y actividades de recorte. 🌈",
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
      "Después de confirmar tu pago, el Kit de Rutinas Infantiles se envía por WhatsApp. Si necesitas orientación, con gusto te ayudamos.",

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
      "Una vez confirmado tu pago de $89 MXN, el Kit de Rutinas Infantiles completo se envía por WhatsApp.",

      "Después de confirmar el pago, recibes todos los tableros, rutinas y regalos por WhatsApp en formato PDF.",
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
      "¡Hola! Qué gusto que quieras ayudar a tu peque a desarrollar buenos hábitos. 🌈\n\nEl Kit de Rutinas Infantiles es un material digital (PDF) listo para imprimir que incluye:\n\n✅ Cuatro tableros: espacio, autos, princesas y sirenas.\n✅ Billetes, vales, alcancías y guía.\n🎁 Regalos: Navidad, invierno, vacaciones, rutinas visuales, actividades en familia, diario de gratitud, juegos educativos, libro para colorear y recortar y pegar.\n\n⚡ Llévatelo hoy por solo $89 MXN.\n\n¿Te gustaría que te envíe los datos de pago?",

      "El Kit de Rutinas Infantiles incluye cuatro tableros de misiones, puntos, recompensas, rutinas visuales y regalos de Navidad, invierno y vacaciones, juegos educativos, libro para colorear y actividades de recorte. Todo por solo $89 MXN. 📚\n\n¿Te gustaría recibir los datos de pago?",
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
    "Agente Julieta Navarro - Manitas Listas - Kit de Rutinas Infantiles activo ✅"
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
