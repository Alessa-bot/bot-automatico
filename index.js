require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 8080;

const SYSTEM_PROMPT = `
Eres Julieta Leal, una asistente amable, profesional, cálida y cercana que responde por WhatsApp las dudas de madres, padres y docentes sobre el material digital "Método Grafismo Fonético".

Tu trabajo es responder de forma NATURAL, BREVE y HUMANA, como una maestra de preescolar paciente y atenta.

IMPORTANTE:
- Nunca suenes robótica, fría o cortante.
- Nunca respondas exactamente igual cada vez.
- Varía ligeramente las palabras y la estructura.
- Mantén respuestas amables, claras y profesionales.
- No escribas demasiado.
- Responde máximo en 1 o 2 párrafos cortos.
- Habla de manera sencilla y fácil de entender.
- Resuelve primero la duda del cliente y después dirige suavemente al proceso de compra.

REGLAS:
- NO saludes.
- NO uses "Hola".
- NO hagas múltiples preguntas.
- NO hagas preguntas abiertas innecesarias.
- NO digas:
  - "¿Quieres saber más?"
  - "¿Te interesa?"
  - "¿Te gustaría?"
  - "¿Te ayudo en algo más?"
  - "¿Quieres que te cuente?"
- NO seas agresiva vendiendo.
- NO presiones al cliente.
- NO inventes información.
- NO menciones correo electrónico.
- NO digas que el producto es físico.
- NO uses expresiones como:
  - "paquete físico"
  - "envío a domicilio"
  - "te llegará a tu casa"
  - "libros impresos"
- NO prometas resultados mágicos, inmediatos o garantizados.
- NO asegures que el niño aprenderá a escribir en pocos días.
- NO digas que el método es infalible.
- NO des diagnósticos educativos, médicos o psicológicos.
- NO uses términos como dislexia, TDAH o retraso de aprendizaje para describir al niño.
- NO uses respuestas secas como "Opción inválida", "No entiendo" o simplemente "No".
- NO menciones nombres personales relacionados con el pago, excepto Alessa Díaz.

INFORMACIÓN REAL DEL PRODUCTO:
- El producto se llama "Método Grafismo Fonético".
- Es un producto educativo digital.
- Se entrega en archivos digitales en formato PDF.
- NO es un producto físico.
- Los archivos están listos para descargar.
- El cliente puede imprimirlos las veces que lo necesite para uso personal.
- Está dirigido a madres, padres, docentes y personas que acompañan el aprendizaje infantil.
- El material busca apoyar la estimulación del grafismo, la escritura, el reconocimiento de sonidos y el aprendizaje de una forma práctica y divertida.
- Cada pequeño avanza a su propio ritmo.
- El material ayuda a practicar paso a paso y busca evitar la frustración del niño.
- El producto incluye bonus extras con juegos educativos de cartas:
  - UNO silábico
  - Dominó silábico
  - Bingo silábico
- El precio del paquete completo es de 99 pesos mexicanos.
- Es una venta directa, no una donación.
- La entrega se realiza después de confirmar el pago.
- Los métodos de pago disponibles son:
  - Transferencia bancaria
  - Depósito en Oxxo
- Cuando el cliente solicite los datos de pago, explica de manera natural que la cuenta está registrada a nombre de la directora y administradora del proyecto: Alessa Díaz.
- No menciones ningún otro nombre personal para procesar pagos.
- Después de confirmar el pago, el material se entrega digitalmente por WhatsApp.
- No existe envío físico ni costo de paquetería.

DIFICULTADES DE APRENDIZAJE:
Si una madre, padre o docente comenta que un niño tiene dificultades para escribir, confunde letras, no controla bien el lápiz o presenta dificultades de motricidad:
- Responde con empatía.
- Explica que el grafismo fonético puede utilizarse como ejercicio de estimulación y práctica.
- Recuerda que cada pequeño avanza a su propio ritmo.
- No realices diagnósticos.
- Recomienda consultar con su maestra o con un especialista cuando tengan dudas específicas sobre su desarrollo o aprendizaje.

OBJETIVO:
Después de resolver la duda de manera amable y profesional, dirige suavemente a la persona a adquirir el paquete completo por 99 pesos mexicanos.

El cierre debe mencionar que puede realizar el pago mediante:
- Transferencia bancaria
- Depósito en Oxxo

Haz que el cierre se sienta natural, claro y amable, nunca como presión de venta.
`;

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function elegirAleatoria(opciones) {
  return opciones[Math.floor(Math.random() * opciones.length)];
}

function limpiarRespuesta(texto) {
  texto = String(texto || "").trim();

  texto = texto
    .replace(/^¡?\s*hola\s*[😊🙏❤✨🌿📚💛,\.\!]*\s*/gi, "")
    .replace(
      /^gracias por preguntar\s*[😊🙏❤✨🌿📚💛,\.\!]*\s*/gi,
      ""
    )
    .replace(/^buenos días\s*[😊🙏❤✨🌿📚💛,\.\!]*\s*/gi, "")
    .replace(/^buenos dias\s*[😊🙏❤✨🌿📚💛,\.\!]*\s*/gi, "")
    .replace(/^buenas tardes\s*[😊🙏❤✨🌿📚💛,\.\!]*\s*/gi, "")
    .replace(/^buenas noches\s*[😊🙏❤✨🌿📚💛,\.\!]*\s*/gi, "");

  texto = texto
    .replace(
      /¿[^?]*(quieres|te interesa|te gustaría|te gustaria|te cuento|te explico|te ayudo|puedo ayudarte|hay algo más|hay algo mas|te parece|te comparto|te paso)[^?]*\?/gi,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return texto;
}

function cierrePago() {
  const cierres = [
    `💌 El paquete completo tiene un precio de 99 pesos. Puedes realizar el pago por transferencia bancaria o depósito en Oxxo ✨\n¿Cuál método prefieres?`,
    `📚 Puedes adquirir todo el material digital por 99 pesos mediante transferencia bancaria o depósito en Oxxo 💛\n¿Qué método de pago prefieres?`,
    `✨ El acceso al Método Grafismo Fonético y sus bonus tiene un precio de 99 pesos. Puedes pagar por transferencia o depósito en Oxxo.\n¿Cuál opción prefieres?`,
  ];

  return elegirAleatoria(cierres);
}

function agregarCierre(texto) {
  const limpio = limpiarRespuesta(texto);

  if (!limpio) {
    return cierrePago();
  }

  return `${limpio}\n${cierrePago()}`;
}

function respuestaDirecta(textoNormalizado) {
  if (
    textoNormalizado.includes("fisico") ||
    textoNormalizado.includes("impreso") ||
    textoNormalizado.includes("imprimido") ||
    textoNormalizado.includes("domicilio") ||
    textoNormalizado.includes("paqueteria") ||
    textoNormalizado.includes("envio fisico") ||
    textoNormalizado.includes("llega a mi casa")
  ) {
    const respuestasFormato = [
      `El material no es físico 📚 Se entrega en archivos digitales en formato PDF, listos para descargar e imprimir las veces que los necesites para uso personal.`,
      `Es un producto completamente digital ✨ Recibirás los archivos en PDF por WhatsApp después de confirmar el pago. Puedes descargarlos e imprimirlos cuando lo necesites.`,
      `No se envían libros ni paquetes a domicilio. Todo el material se entrega digitalmente en PDF, para que puedas guardarlo e imprimirlo con facilidad 💛`,
    ];

    return agregarCierre(elegirAleatoria(respuestasFormato));
  }

  if (
    textoNormalizado.includes("envio") ||
    textoNormalizado.includes("enviar") ||
    textoNormalizado.includes("entrega") ||
    textoNormalizado.includes("pdf") ||
    textoNormalizado.includes("digital") ||
    textoNormalizado.includes("descargar") ||
    textoNormalizado.includes("recibir") ||
    textoNormalizado.includes("recibo") ||
    textoNormalizado.includes("archivo") ||
    textoNormalizado.includes("entrego") ||
    textoNormalizado.includes("llega") ||
    textoNormalizado.includes("cuando lo mandan") ||
    textoNormalizado.includes("como lo recibo")
  ) {
    const respuestasEnvio = [
      `La entrega es digital 📚 Después de confirmar tu pago, recibes por WhatsApp los archivos en formato PDF listos para descargar e imprimir.`,
      `El material se envía por WhatsApp una vez confirmado el pago ✨ Son archivos digitales en PDF, por lo que no tienes que esperar ningún envío físico.`,
      `Después de recibir y confirmar tu pago, se te comparte todo el material digital por este mismo medio 💛 Podrás descargarlo en tu celular o computadora e imprimirlo cuando lo necesites.`,
      `Recibirás el Método Grafismo Fonético y sus bonus en archivos PDF por WhatsApp. La entrega se realiza después de verificar el pago y no tiene costo de envío.`,
    ];

    return agregarCierre(elegirAleatoria(respuestasEnvio));
  }

  if (
    textoNormalizado.includes("cuanto") ||
    textoNormalizado.includes("cuesta") ||
    textoNormalizado.includes("precio") ||
    textoNormalizado.includes("costo") ||
    textoNormalizado.includes("vale") ||
    textoNormalizado.includes("pagar") ||
    textoNormalizado.includes("pago") ||
    textoNormalizado.includes("promocion") ||
    textoNormalizado.includes("oferta")
  ) {
    const respuestasPago = [
      `El paquete completo tiene un precio de 99 pesos mexicanos 📚 Incluye el Método Grafismo Fonético y los juegos educativos UNO silábico, Dominó silábico y Bingo silábico.`,
      `Todo el material digital tiene un costo de 99 pesos ✨ En el paquete recibes el Método Grafismo Fonético junto con sus bonus de juegos silábicos.`,
      `La promoción del paquete completo es de 99 pesos mexicanos 💛 Incluye el material principal y los bonus de UNO, Dominó y Bingo silábico en formato digital.`,
    ];

    return agregarCierre(elegirAleatoria(respuestasPago));
  }

  if (
    textoNormalizado.includes("incluye") ||
    textoNormalizado.includes("contiene") ||
    textoNormalizado.includes("que trae") ||
    textoNormalizado.includes("bonus") ||
    textoNormalizado.includes("bonos") ||
    textoNormalizado.includes("uno") ||
    textoNormalizado.includes("domino") ||
    textoNormalizado.includes("bingo") ||
    textoNormalizado.includes("juegos")
  ) {
    const respuestasContenido = [
      `El paquete incluye el Método Grafismo Fonético y bonus extras con juegos educativos: UNO silábico, Dominó silábico y Bingo silábico 📚 Todo se entrega en formato digital PDF.`,
      `Recibes el material principal de Grafismo Fonético y tres juegos silábicos para complementar la práctica: UNO, Dominó y Bingo ✨`,
      `Incluye actividades de grafismo fonético y bonus de juegos de cartas silábicos para que el aprendizaje sea más práctico y divertido 💛 Los archivos son digitales y están listos para imprimir.`,
    ];

    return agregarCierre(elegirAleatoria(respuestasContenido));
  }

  if (
    textoNormalizado.includes("transferencia") ||
    textoNormalizado.includes("oxxo") ||
    textoNormalizado.includes("deposito") ||
    textoNormalizado.includes("datos bancarios") ||
    textoNormalizado.includes("numero de cuenta") ||
    textoNormalizado.includes("cuenta bancaria") ||
    textoNormalizado.includes("a nombre de quien") ||
    textoNormalizado.includes("titular")
  ) {
    const respuestasMetodoPago = [
      `Puedes realizar el pago por transferencia bancaria o depósito en Oxxo ✨ La cuenta está registrada a nombre de Alessa Díaz, directora y administradora del proyecto.`,
      `Aceptamos transferencia bancaria y depósito en Oxxo 💛 Los datos de pago aparecen a nombre de Alessa Díaz, quien es la directora y administradora del proyecto.`,
      `El pago puede hacerse mediante transferencia o depósito en Oxxo 📚 La titular de la cuenta es Alessa Díaz, directora y administradora del proyecto.`,
    ];

    return elegirAleatoria(respuestasMetodoPago);
  }

  if (
    textoNormalizado.includes("para que edad") ||
    textoNormalizado.includes("que edad") ||
    textoNormalizado.includes("edad recomendada") ||
    textoNormalizado.includes("cuantos anos") ||
    textoNormalizado.includes("preescolar") ||
    textoNormalizado.includes("primaria") ||
    textoNormalizado.includes("nivel educativo")
  ) {
    const respuestasEdad = [
      `Es un material pensado para acompañar las primeras etapas del aprendizaje de la escritura y los sonidos 📚 Puede adaptarse de acuerdo con el nivel y ritmo de cada pequeño.`,
      `Puede utilizarse con niños que están comenzando a practicar grafismo, letras y sílabas ✨ Lo más importante es adaptar las actividades a su edad y nivel de aprendizaje.`,
      `Está diseñado para apoyar a pequeños que se encuentran desarrollando habilidades de escritura y reconocimiento de sonidos 💛 Cada niño puede avanzar poco a poco y a su propio ritmo.`,
    ];

    return agregarCierre(elegirAleatoria(respuestasEdad));
  }

  if (
    textoNormalizado.includes("dificultad") ||
    textoNormalizado.includes("problema para escribir") ||
    textoNormalizado.includes("no sabe escribir") ||
    textoNormalizado.includes("confunde letras") ||
    textoNormalizado.includes("motricidad") ||
    textoNormalizado.includes("no agarra el lapiz") ||
    textoNormalizado.includes("agarra mal el lapiz") ||
    textoNormalizado.includes("dislexia") ||
    textoNormalizado.includes("tdah") ||
    textoNormalizado.includes("retraso")
  ) {
    const respuestasDificultades = [
      `Comprendo tu preocupación 💛 El grafismo fonético puede utilizarse como un ejercicio de estimulación y práctica, pero cada pequeño avanza a su propio ritmo. Si tienes una duda específica sobre su aprendizaje, lo más recomendable es consultarla con su maestra o con un especialista.`,
      `Cada niño desarrolla sus habilidades a un ritmo diferente 📚 Este material puede ayudarle a practicar de forma gradual y divertida, sin presionarlo. Para valorar una dificultad concreta, es importante apoyarse también en la opinión de su maestra o de un especialista.`,
      `El material puede servir como apoyo para practicar trazos, sonidos y escritura paso a paso ✨ No sustituye una valoración profesional, así que ante una preocupación específica conviene conversar con su maestra o consultar a un especialista.`,
    ];

    return agregarCierre(elegirAleatoria(respuestasDificultades));
  }

  if (
    textoNormalizado.includes("funciona") ||
    textoNormalizado.includes("resultado") ||
    textoNormalizado.includes("cuanto tarda") ||
    textoNormalizado.includes("en cuantos dias") ||
    textoNormalizado.includes("garantizado") ||
    textoNormalizado.includes("aprende rapido") ||
    textoNormalizado.includes("va a aprender")
  ) {
    const respuestasResultados = [
      `El material está diseñado para practicar paso a paso de una manera entretenida y sin generar frustración 📚 Los avances dependen de la constancia, la edad y el ritmo de aprendizaje de cada pequeño.`,
      `No se trata de prometer resultados inmediatos, sino de acompañar al niño con ejercicios prácticos y divertidos ✨ Cada pequeño avanza a su propio ritmo.`,
      `La práctica constante puede ayudar a fortalecer sus habilidades, pero no existe un tiempo igual para todos 💛 Lo ideal es avanzar poco a poco, respetando el proceso de cada niño.`,
    ];

    return agregarCierre(elegirAleatoria(respuestasResultados));
  }

  if (
    textoNormalizado.includes("como imprimir") ||
    textoNormalizado.includes("puedo imprimir") ||
    textoNormalizado.includes("cuantas veces") ||
    textoNormalizado.includes("impresora") ||
    textoNormalizado.includes("imprimir")
  ) {
    const respuestasImpresion = [
      `Sí, puedes imprimir los archivos las veces que los necesites para uso personal 📚 También puedes guardar los PDF en tu celular o computadora.`,
      `Los materiales están listos para descargar e imprimir ✨ Puedes volver a imprimir las actividades cuando el pequeño necesite repetir la práctica.`,
      `Puedes descargar los PDF y seleccionar únicamente las páginas que desees imprimir 💛 Así podrás repetir las actividades de acuerdo con el avance del pequeño.`,
    ];

    return agregarCierre(elegirAleatoria(respuestasImpresion));
  }

  return null;
}

app.get("/", (req, res) => {
  res.send("Bot ventas activo ✅");
});

app.post("/mensaje", async (req, res) => {
  try {
    const texto =
      req.body.texto || req.body.mensaje || req.body.message || "";

    console.log("Texto recibido:", texto);

    if (!texto) {
      return res.json({ respuesta: cierrePago() });
    }

    const textoNormalizado = normalizarTexto(texto);
    const directa = respuestaDirecta(textoNormalizado);

    if (directa) {
      console.log("Respuesta directa:", directa);
      return res.json({ respuesta: directa });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: texto },
      ],
    });

    const respuestaIA = response.output_text || "";
    const respuestaFinal = agregarCierre(respuestaIA);

    console.log("Respuesta enviada:", respuestaFinal);

    return res.json({ respuesta: respuestaFinal });
  } catch (error) {
    console.error("Error en /mensaje:", error);
    return res.json({ respuesta: cierrePago() });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
