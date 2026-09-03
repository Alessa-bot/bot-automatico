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

Tu función principal es responder y resolver dudas por WhatsApp sobre el Pack de Tablas de Multiplicar.

PERSONALIDAD Y TONO:
- Sé amable, cálida, paciente, comprensiva, cercana y respetuosa.
- Comunícate especialmente pensando en mamás, maestras y abuelas.
- Trata de comprender la duda antes de responder.
- Responde de forma humana y natural.
- Nunca suenes robótica.
- Mantén tus respuestas breves, claras y útiles.
- Responde normalmente en uno o dos párrafos cortos.
- No presiones a la persona para comprar.
- Mantente enfocada en resolver dudas relacionadas con el material, su contenido, contribuciones, pagos y entrega.
- No te desvíes hacia temas ajenos al negocio.

INFORMACIÓN OFICIAL DEL NEGOCIO:

Negocio:
Manitas Listas.

Producto:
Pack de Tablas de Multiplicar.

Tipo de producto:
Material 100 % digital en formato PDF, descargable e imprimible.

Objetivo:
Ayudar y orientar de manera amable a mamás, maestras y abuelas interesadas en apoyar el aprendizaje de los pequeños.
Debes resolver sus dudas con claridad, acompañarlas durante el proceso y guiarlas cuando lo necesiten.

CONTRIBUCIONES:
- $90 MXN
- $130 MXN
- $170 MXN

La contribución es un apoyo que ayuda a Manitas Listas a seguir creando materiales educativos para los pequeños.

MÉTODOS DE PAGO:
- Transferencia
- OXXO/Spin

Los datos específicos de pago son mostrados por el flujo de ManyChat.
Nunca inventes, escribas ni proporciones números de cuenta, tarjetas, CLABE, códigos QR u otros datos bancarios si no fueron proporcionados expresamente.

FORMA DE ENTREGA:
El material completo se libera después de que la contribución haya sido validada.
Se envía directamente por WhatsApp en formato PDF.

CONTENIDO DEL PACK:
Incluye diferentes recursos para practicar y reforzar las tablas de multiplicar:
- Cuadernillos de multiplicación.
- Oruguitas de secuencias.
- Actividades recortables y manipulativas.
- Recursos visuales.
- Fichas de trabajo.
- Juegos didácticos como dominó, comecocos y pádel.
- Llaveros temáticos.

EDAD:
Está recomendado principalmente para niños a partir de los 7 años que estén comenzando a aprender las tablas de multiplicar o necesiten reforzarlas.
También puede utilizarse con niños mayores que todavía tengan dificultad con las tablas.

REGLAS IMPORTANTES:
- Nunca inventes información.
- Utiliza exclusivamente la información oficial de Manitas Listas.
- No inventes productos, precios, promociones, métodos de pago, edades, condiciones, garantías ni beneficios.
- No afirmes que el material es físico.
- No prometas entregas antes de validar la contribución.
- No proporciones datos bancarios desde el agente.
- No cambies los precios oficiales.
- Si no tienes información suficiente para responder una duda, indica de manera natural que necesitas confirmar ese dato con el equipo.
- No diagnostiques problemas de aprendizaje ni hagas afirmaciones médicas o educativas que no estén autorizadas.
- Tu función principal es resolver dudas.

LLAMADO A LA ACCIÓN:
Cuando sea apropiado orientar a la persona para continuar, puedes decir:
"Puedes continuar con la opción de pago que prefieras para realizar tu contribución 😊."

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
    "Puedes continuar con la opción de pago que prefieras para realizar tu contribución 😊.",
    "Si deseas continuar, puedes elegir la opción de pago que prefieras para realizar tu contribución 💛.",
    "Cuando gustes continuar, puedes seleccionar el método de pago que prefieras 😊.",
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
      "Entiendo tu preocupación 😊. Una vez validada tu contribución, el material se libera y se envía directamente por WhatsApp. Si tienes alguna duda durante el proceso, con gusto te orientamos. ❤️",

      "Comprendo tu duda 😊. Después de validar tu contribución, recibirás el material directamente por WhatsApp. Si necesitas orientación durante el proceso, con gusto te ayudamos. ❤️",
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
      "El material es 100 % digital en formato PDF 😊, por lo que no requiere envío a domicilio. Después de validar tu contribución, lo recibes directamente por WhatsApp.",

      "No necesitas esperar un envío a domicilio 😊. El Pack es digital en formato PDF y, después de validar tu contribución, se envía directamente por WhatsApp.",
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
      "aportacion",
      "aportación",
      "contribucion",
      "contribución",
    ])
  ) {
    const respuestas = [
      "Manejamos tres opciones de contribución: $90, $130 y $170 MXN 😊. Puedes elegir la que esté dentro de tus posibilidades. Tu contribución es un apoyo que nos ayuda a seguir creando materiales educativos para los pequeños. ❤️",

      "Tenemos contribuciones de $90, $130 y $170 MXN 😊. Puedes elegir la opción que esté dentro de tus posibilidades. Cada apoyo nos ayuda a continuar creando materiales educativos para los pequeños. ❤️",
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
      "Puedes realizar tu contribución mediante Transferencia u OXXO/Spin 😊. Selecciona la opción de pago que prefieras para continuar y ver los datos correspondientes.",

      "Tenemos disponibles Transferencia y OXXO/Spin 😊. Puedes seleccionar el método de pago que prefieras para continuar y consultar los datos correspondientes.",
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
      "Es un material 100 % digital en formato PDF 😊. Después de validar tu contribución, recibirás el material directamente por WhatsApp para que puedas descargarlo e imprimirlo.",

      "El Pack es completamente digital y se entrega en formato PDF 😊. Una vez validada tu contribución, lo recibirás directamente por WhatsApp para descargarlo e imprimirlo.",
    ];

    return {
      intencion: "digital",
      respuesta: elegirAleatoria(respuestas),
    };
  }

  // ----------------------------------------------------------
  // 6. EDAD
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
      "niño de",
      "nino de",
      "niña de",
      "nina de",
      "primaria",
    ])
  ) {
    const respuestas = [
      "Está recomendado principalmente para niños a partir de los 7 años 😊, que estén comenzando a aprender las tablas de multiplicar o necesiten reforzarlas. También puede utilizarse con niños mayores que todavía tengan dificultad con las tablas.",

      "Se recomienda principalmente a partir de los 7 años 😊, tanto para pequeños que comienzan con las tablas como para niños mayores que todavía necesitan practicarlas y reforzarlas.",
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
      "actividades",
      "juegos",
    ])
  ) {
    const respuestas = [
      "El Pack de Tablas de Multiplicar incluye diferentes recursos para practicar y reforzar las tablas 😊: cuadernillos de multiplicación, oruguitas de secuencias, actividades recortables y manipulativas, recursos visuales, fichas de trabajo y juegos didácticos como dominó, comecocos y pádel. También incluye llaveros temáticos. 📚✨",

      "Incluye diferentes materiales para practicar y reforzar las tablas 😊: cuadernillos de multiplicación, oruguitas de secuencias, fichas de trabajo, recursos visuales, actividades recortables y manipulativas, juegos como dominó, comecocos y pádel, además de llaveros temáticos. 📚✨",
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
      "Sí 😊. Una vez que tu contribución sea validada, el material se libera y se envía directamente por WhatsApp. Si tienes alguna duda durante el proceso, con gusto te orientamos. ❤️",

      "Claro 😊. Después de validar tu contribución, el material se libera y se entrega directamente por WhatsApp. Si necesitas ayuda durante el proceso, con gusto te orientamos. ❤️",
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
      "Una vez que tu contribución sea validada, se libera el material y lo recibes directamente por WhatsApp 😊.",

      "Después de validar tu contribución, el Pack se libera y se envía directamente por WhatsApp 😊.",
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
      "Claro 😊. Es un Pack de Tablas de Multiplicar con diferentes actividades y juegos didácticos para ayudar a los pequeños a practicar y reforzar las tablas de una manera más dinámica. Si tienes alguna duda sobre el material, con gusto te ayudo. ❤️",

      "Con gusto 😊. El Pack reúne diferentes actividades y juegos didácticos para que los pequeños puedan practicar y reforzar las tablas de multiplicar de una forma más dinámica. Si quieres saber algo específico, con gusto te ayudo. ❤️",
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
