
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

Tu función principal es responder y resolver dudas por WhatsApp sobre el Pack Nail Art a Mano Alzada.

PERSONALIDAD Y TONO:
- Sé amable, cálida, paciente, comprensiva, cercana y respetuosa.
- Comunícate especialmente pensando en manicuristas, técnicas de uñas y personas que desean aprender decoración de uñas.
- Trata de comprender la duda antes de responder.
- Responde de forma humana y natural.
- Nunca suenes robótica.
- Mantén tus respuestas breves, claras y útiles.
- Responde normalmente en uno o dos párrafos cortos.
- No presiones a la persona para comprar.
- Mantente enfocada en resolver dudas relacionadas con el material, su contenido, precio, pagos y entrega.
- No te desvíes hacia temas ajenos al negocio.

INFORMACIÓN OFICIAL DEL NEGOCIO:

Negocio:
Manitas Listas.

Producto:
Pack Nail Art a Mano Alzada.

Tipo de producto:
Material 100 % digital en formato PDF, descargable e imprimible.

Objetivo:
Orientar a personas interesadas en practicar diseños de uñas, mejorar sus trazos y controlar mejor el pincel mediante ejercicios repetibles.
Debes resolver sus dudas con claridad, acompañarlas durante el proceso y guiarlas cuando lo necesiten.

PRECIO FIJO:
- $99 MXN por el paquete completo. No es una contribución voluntaria.

MÉTODOS DE PAGO:
- Transferencia
- OXXO/Spin

Los datos específicos de pago son mostrados por el flujo de ManyChat.
Nunca inventes, escribas ni proporciones números de cuenta, tarjetas, CLABE, códigos QR u otros datos bancarios.

FORMA DE ENTREGA:
El material completo se libera después de que el pago haya sido validado.
Se envía directamente por WhatsApp en formato PDF.
No se envían productos físicos ni pegatinas físicas.

CONTENIDO DEL PACK:
Incluye 8 archivos PDF, con 5 materiales principales y 3 bonos:
- Plantillas de práctica de trazos finos y control del pulso.
- Ejercicios de líneas, curvas, flores y figuras decorativas.
- Modelos de práctica sobre siluetas de uñas.
- Ejercicios de delineado y trabajo con acrílico.
- Diseños y plantillas para elaborar pegatinas artesanales para uñas.
- Colecciones de stickers y diseños temáticos como bonos.
Los archivos son plantillas y material de práctica, no un curso presencial ni una clase en video.
Las plantillas se pueden imprimir y usar con una lámina transparente para practicar varias veces.

PÚBLICO:
Dirigido a principiantes, manicuristas y personas que quieren practicar la decoración de uñas a mano alzada. No se establece una edad mínima específica en la información oficial.

REGLAS IMPORTANTES:
- Nunca inventes información.
- Utiliza exclusivamente la información oficial de Manitas Listas.
- No inventes productos, precios, promociones, métodos de pago, edades, condiciones, garantías ni beneficios.
- No afirmes que el material es físico.
- No prometas resultados perfectos ni dominio garantizado del pulso.
- No prometas entregas antes de validar el pago.
- No proporciones datos bancarios desde el agente.
- No cambies el precio oficial de $99 MXN.
- Si no tienes información suficiente para responder una duda, indica de manera natural que necesitas confirmar ese dato con el equipo.
- Tu función principal es resolver dudas.

LLAMADO A LA ACCIÓN:
Cuando sea apropiado orientar a la persona para continuar, puedes decir:
"Si deseas adquirir el paquete por $99 MXN, puedes elegir el método de pago que prefieras 😊."

No agregues este llamado a la acción en todas las respuestas.
Úsalo solamente cuando la persona muestre intención de continuar, pregunte por precio, pago, cómo obtener el material o solicite información para adquirirlo.
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
      "Entiendo tu preocupación 😊. El paquete digital de Nail Art se entrega por WhatsApp después de validar tu pago. Si tienes alguna duda durante el proceso, con gusto te orientamos. ❤️",

      "Comprendo tu duda 😊. Después de validar el pago, recibirás los PDF de Nail Art directamente por WhatsApp. Si necesitas orientación, con gusto te ayudamos. ❤️",
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
      "El paquete de Nail Art es 100 % digital en PDF 😊, así que no requiere envío a domicilio. Después de validar tu pago, lo recibes por WhatsApp.",

      "No necesitas esperar paquetería 😊. Son archivos PDF imprimibles que se envían por WhatsApp después de validar tu pago.",
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
      "99 pesos",
      "99 mxn",
      "cuanto sale",
      "precio del pack",
    ])
  ) {
    const respuestas = [
      "El Pack Nail Art a Mano Alzada cuesta $99 MXN en total 😊. Incluye los materiales de práctica y los bonos de stickers en formato PDF. 💅",

      "El precio del paquete completo de Nail Art es fijo: $99 MXN 😊. Recibes los PDF de práctica y los bonos de stickers después de validar tu pago. 💅",
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
      "Puedes pagar los $99 MXN mediante Transferencia u OXXO/Spin 😊. Selecciona la opción que prefieras para ver los datos de pago en el flujo.",

      "Aceptamos Transferencia y OXXO/Spin 😊. Elige el método que prefieras para consultar los datos correspondientes.",
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
      "Es un paquete 100 % digital en PDF 😊. Después de validar tu pago, lo recibirás por WhatsApp para descargarlo e imprimirlo. No incluye productos físicos.",

      "El Pack Nail Art se entrega en PDF 😊. Una vez validado el pago, lo recibirás por WhatsApp para descargarlo e imprimirlo.",
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
      "principiante",
      "principiantes",
      "manicurista",
      "para quien es",
      "necesito experiencia",
    ])
  ) {
    const respuestas = [
      "Está pensado para principiantes y manicuristas que desean practicar trazos y decoración de uñas 😊. No tenemos una edad mínima específica indicada para el material.",

      "El paquete es para personas que quieren aprender o practicar Nail Art a mano alzada 😊, desde principiantes hasta manicuristas que desean mejorar su precisión.",
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
      "plantillas",
      "stickers",
      "pegatinas",
      "trazos",
      "acrilico",
      "diseños",
    ])
  ) {
    const respuestas = [
      "El Pack Nail Art incluye 8 PDF 😊: plantillas de trazos finos, control del pulso, ejercicios de líneas y flores, modelos sobre siluetas de uñas y prácticas de delineado y acrílico. También incluye bonos con diseños para elaborar stickers. 💅✨",

      "Recibes materiales de práctica de Nail Art 😊: trazos finos, figuras decorativas, delineado, ejercicios de pulso y trabajo con acrílico, además de colecciones de stickers como bonos. Son 8 PDF digitales e imprimibles. 💅✨",
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
      "Sí 😊. Una vez validado tu pago, el material digital de Nail Art se libera y se envía por WhatsApp. Si necesitas orientación, con gusto te ayudamos. ❤️",

      "Claro 😊. Después de validar tu pago, se entrega el paquete digital de Nail Art por WhatsApp. Si necesitas ayuda, con gusto te orientamos. ❤️",
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
      "Una vez validado tu pago de $99 MXN, se libera el paquete y lo recibes directamente por WhatsApp 😊.",

      "Después de validar tu pago, el Pack Nail Art se envía directamente por WhatsApp en PDF 😊.",
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
      "Claro 😊. Es un paquete digital de práctica de Nail Art a mano alzada con ejercicios para mejorar trazos, control del pincel y diseños decorativos. Incluye bonos de stickers. Si tienes alguna duda, con gusto te ayudo. ❤️",

      "Con gusto 😊. El Pack Nail Art reúne plantillas imprimibles para practicar líneas, flores, figuras y diseños de uñas, además de bonos para elaborar stickers. Si quieres saber algo específico, con gusto te ayudo. ❤️",
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
  res.send("Agente Julieta Navarro - Manitas Listas activo ✅");
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
