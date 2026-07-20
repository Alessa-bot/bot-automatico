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
Eres Julieta Leal, una asistente humana, amable, profesional, cálida y cercana que responde dudas por WhatsApp sobre el producto digital "Método Grafismo Fonético".

Tu trabajo es responder dudas de forma NATURAL, BREVE y HUMANA, como si fueras una persona real atendiendo con paciencia y cariño.

IMPORTANTE:
- Nunca suenes robótica.
- Nunca respondas exactamente igual cada vez.
- Varía ligeramente las palabras y la estructura.
- Mantén respuestas cálidas, claras y naturales.
- No escribas demasiado.
- Responde máximo en 1 o 2 párrafos cortos.

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
- NO presiones.
- NO inventes información.
- NO menciones correo electrónico como forma de entrega.
- NO digas que el material es físico.
- NO menciones envío a domicilio.
- NO digas que son libros impresos.
- NO prometas resultados mágicos, inmediatos o garantizados.
- NO diagnostiques dislexia, TDAH ni ningún problema de aprendizaje.
- NO menciones ningún nombre para pagos, excepto Alessa Díaz.

INFORMACIÓN REAL:
- El producto se llama "Método Grafismo Fonético".
- Es un material educativo DIGITAL en PDF.
- El material NO es físico.
- NO se entrega a domicilio.
- La entrega se realiza únicamente por WhatsApp.
- El material se entrega después de confirmar el pago.
- La persona debe enviar su comprobante para verificar el pago.
- El cliente puede descargar e imprimir los archivos para uso personal.
- El paquete incluye:
  - Método Grafismo Fonético
  - UNO silábico
  - Dominó silábico
  - Bingo silábico
- El material apoya la práctica de trazos, sonidos, letras, sílabas, lectura inicial y escritura.
- Es un material de apoyo y estimulación.
- Cada pequeño avanza a su propio ritmo.
- El precio del paquete completo es de 99 MXN.
- Es una venta directa.
- Los métodos de pago disponibles son:
  - transferencia bancaria
  - depósito en Oxxo
- La cuenta está registrada a nombre de Alessa Díaz, directora y administradora del proyecto.

OBJETIVO:
Después de resolver la duda de forma amable y humana, dirige suavemente a la persona a comprar el paquete completo por 99 MXN mediante:
- transferencia bancaria
- depósito en Oxxo

Haz que el cierre se sienta natural, amable y profesional, nunca como presión de venta.
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
.replace(/^gracias por preguntar\s*[😊🙏❤✨🌿📚💛,\.\!]*\s*/gi, "")
.replace(/^buenos días\s*[😊🙏❤✨🌿📚💛,\.\!]*\s*/gi, "")
.replace(/^buenos dias\s*[😊🙏❤✨🌿📚💛,\.\!]*\s*/gi, "")
.replace(/^buenas tardes\s*[😊🙏❤✨🌿📚💛,\.\!]*\s*/gi, "")
.replace(/^buenas noches\s*[😊🙏❤✨🌿📚💛,\.\!]*\s*/gi, "");
texto = texto
.replace(/¿[^?]*(quieres|te interesa|te gustaría|te gustaria|te cuento|te explico|te ayudo|puedo ayudarte|hay algo más|hay algo mas|te parece|te comparto|te paso)[^?]*\?/gi, "")
.replace(/\s{2,}/g, " ")
.replace(/\n{3,}/g, "\n\n")
.trim();
return texto;
}
function cierrePago() {
const cierres = [
`💌 El paquete completo tiene un precio de 99 MXN. Puedes realizar el pago por transferencia bancaria o depósito en Oxxo ✨
¿Cuál método prefieres?`,
`📚 Puedes adquirir el Método Grafismo Fonético con todos sus bonus por 99 MXN mediante transferencia bancaria o depósito en Oxxo.
¿Qué método prefieres?`,
`💛 El material completo tiene un precio de 99 MXN. Puedes pagar por transferencia o depósito en Oxxo.
¿Cuál opción prefieres?`,
];
return elegirAleatoria(cierres);
}
function agregarCierre(texto) {
const limpio = limpiarRespuesta(texto);
if (!limpio) {
return cierrePago();
}
return `${limpio}
${cierrePago()}`;
}
function respuestaDirecta(textoNormalizado) {
if (
textoNormalizado === "informacion" ||
textoNormalizado.includes("quiero informacion") ||
textoNormalizado.includes("dame informacion") ||
textoNormalizado.includes("me das informacion") ||
textoNormalizado.includes("informes") ||
textoNormalizado.includes("de que se trata")
) {
const respuestasInformacion = [
`El Método Grafismo Fonético es un material educativo digital que apoya la práctica de trazos, sonidos, letras, sílabas, lectura inicial y escritura 📚 Incluye UNO silábico, Dominó silábico y Bingo silábico como bonus.`,
`Es un paquete digital en PDF pensado para acompañar las primeras etapas de lectura y escritura de forma práctica y divertida ✨ También incluye tres juegos silábicos.`,
`El paquete incluye el Método Grafismo Fonético y los bonus UNO, Dominó y Bingo silábico 💛 Se entrega únicamente por WhatsApp después de confirmar el pago.`,
];
return agregarCierre(elegirAleatoria(respuestasInformacion));
}
if (
textoNormalizado.includes("domicilio") ||
textoNormalizado.includes("a mi casa") ||
textoNormalizado.includes("paqueteria") ||
textoNormalizado.includes("fisico") ||
textoNormalizado.includes("impreso") ||
textoNormalizado.includes("libro fisico")
) {
const respuestasFisico = [
`El material no es físico ni se entrega a domicilio 📚 Es un archivo digital en PDF que recibes por WhatsApp después de confirmar el pago.`,
`No se envían libros impresos ni paquetes a casa ✨ Todo el material es digital y se entrega por WhatsApp.`,
`Es un producto completamente digital en PDF 💛 Puedes descargarlo e imprimirlo para uso personal.`,
];
return agregarCierre(elegirAleatoria(respuestasFisico));
}
if (
textoNormalizado.includes("correo") ||
textoNormalizado.includes("email") ||
textoNormalizado.includes("whatsapp") ||
textoNormalizado.includes("whatssap") ||
textoNormalizado.includes("watsap") ||
textoNormalizado.includes("donde entregas") ||
textoNormalizado.includes("donde lo entregas")
) {
const respuestasWhatsApp = [
`La entrega se realiza únicamente por WhatsApp 📚 Después de confirmar el pago, recibes aquí mismo todos los archivos en PDF.`,
`No necesitas correo electrónico ✨ El material se envía directamente por WhatsApp una vez verificado el pago.`,
`Todos los PDF se entregan por WhatsApp después de que envíes tu comprobante y se confirme el pago 💛`,
];
return agregarCierre(elegirAleatoria(respuestasWhatsApp));
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
textoNormalizado.includes("llega")
) {
const respuestasEnvio = [
`Sí, el material se entrega 📚 Después de confirmar el pago, recibes por WhatsApp todos los archivos digitales en formato PDF.`,
`La entrega es digital y se realiza únicamente por WhatsApp ✨ Solo debes enviar tu comprobante para verificar el pago.`,
`Recibirás el Método Grafismo Fonético y sus bonus en PDF por WhatsApp después de confirmar el pago 💛`,
`No hay envío físico ni costo de paquetería. Los archivos se entregan directamente por WhatsApp.`,
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
textoNormalizado.includes("pago")
) {
const respuestasPago = [
`El paquete completo tiene un precio de 99 MXN 📚 Incluye el Método Grafismo Fonético, UNO silábico, Dominó silábico y Bingo silábico.`,
`Todo el material digital cuesta 99 MXN ✨ Incluye el método principal y los tres juegos silábicos extras.`,
`La promoción del paquete completo es de 99 MXN 💛 Se entrega en PDF por WhatsApp después de confirmar el pago.`,
];
return agregarCierre(elegirAleatoria(respuestasPago));
}
if (
textoNormalizado.includes("para que edad") ||
textoNormalizado.includes("que edad") ||
textoNormalizado.includes("edad recomendada") ||
textoNormalizado.includes("cuantos anos") ||
textoNormalizado.includes("preescolar") ||
textoNormalizado.includes("primaria")
) {
const respuestasEdad = [
`Está pensado para pequeños que están comenzando con trazos, sonidos, letras, sílabas, lectura inicial y escritura 📚 Puede adaptarse según el nivel y ritmo de cada niño.`,
`Es ideal para las primeras etapas del aprendizaje ✨ Más que una edad exacta, lo importante es que el pequeño esté comenzando a practicar trazos, letras y sílabas.`,
`Puede utilizarse con niños que están iniciando el reconocimiento de sonidos, letras y escritura 💛 Cada pequeño avanza a su propio ritmo.`,
];
return agregarCierre(elegirAleatoria(respuestasEdad));
}
if (
textoNormalizado.includes("sirve para leer") ||
textoNormalizado.includes("aprender a leer") ||
textoNormalizado.includes("ayuda a leer") ||
textoNormalizado.includes("lectura") ||
textoNormalizado.includes("leer") ||
textoNormalizado.includes("silabas")
) {
const respuestasLectura = [
`Sí, el material apoya la lectura inicial mediante la práctica de sonidos, letras y sílabas 📚 Los juegos extras ayudan a reforzar estos aprendizajes de forma divertida.`,
`Puede utilizarse como apoyo para comenzar a reconocer sonidos, letras y sílabas ✨ El avance depende de la práctica y del ritmo de cada pequeño.`,
`El método ayuda a reforzar habilidades necesarias para la lectura inicial 💛 Es un proceso paso a paso y no promete resultados inmediatos.`,
];
return agregarCierre(elegirAleatoria(respuestasLectura));
}
if (
textoNormalizado.includes("confiable") ||
textoNormalizado.includes("confianza") ||
textoNormalizado.includes("seguro") ||
textoNormalizado.includes("estafa") ||
textoNormalizado.includes("fraude") ||
textoNormalizado.includes("si es real")
) {
const respuestasConfianza = [
`Comprendo que quieras sentir seguridad antes de comprar 💛 El material sí se entrega: después de verificar el pago, recibes todos los PDF directamente por WhatsApp.`,
`Es normal querer confirmar que recibirás tu compra 📚 Una vez enviado el comprobante y confirmado el pago, se realiza la entrega completa por WhatsApp.`,
`Puedes tener tranquilidad de que el material se entrega después de verificar el pago ✨ Recibirás el método y todos sus bonus digitales por WhatsApp.`,
];
return agregarCierre(elegirAleatoria(respuestasConfianza));
}
if (
textoNormalizado.includes("transferencia") ||
textoNormalizado.includes("oxxo") ||
textoNormalizado.includes("deposito") ||
textoNormalizado.includes("datos bancarios") ||
textoNormalizado.includes("numero de cuenta") ||
textoNormalizado.includes("a nombre de quien") ||
textoNormalizado.includes("titular")
) {
const respuestasMetodoPago = [
`Puedes realizar el pago por transferencia bancaria o depósito en Oxxo ✨ La cuenta está registrada a nombre de Alessa Díaz, directora y administradora del proyecto.`,
`Aceptamos transferencia bancaria y depósito en Oxxo 💛 Los datos de pago aparecen a nombre de Alessa Díaz.`,
`El pago puede hacerse mediante transferencia o depósito en Oxxo 📚 La titular de la cuenta es Alessa Díaz, directora y administradora del proyecto.`,
];
return elegirAleatoria(respuestasMetodoPago);
}
if (
textoNormalizado.includes("dificultad") ||
textoNormalizado.includes("problema para escribir") ||
textoNormalizado.includes("no sabe escribir") ||
textoNormalizado.includes("confunde letras") ||
textoNormalizado.includes("motricidad") ||
textoNormalizado.includes("no agarra el lapiz") ||
textoNormalizado.includes("dislexia") ||
textoNormalizado.includes("tdah") ||
textoNormalizado.includes("retraso")
) {
const respuestasDificultades = [
`Comprendo tu preocupación 💛 El grafismo fonético puede utilizarse como ejercicio de estimulación y práctica, pero cada pequeño avanza a su propio ritmo. Para una duda específica, lo recomendable es consultar con su maestra o un especialista.`,
`Cada niño desarrolla sus habilidades a un ritmo diferente 📚 Este material puede ayudarle a practicar de forma gradual y divertida, sin presionarlo. Para valorar una dificultad concreta, es importante apoyarse en su maestra o en un especialista.`,
`El material puede servir como apoyo para practicar trazos, sonidos y escritura paso a paso ✨ No sustituye una valoración profesional.`,
];
return agregarCierre(elegirAleatoria(respuestasDificultades));
}
return null;
}
app.get("/", (req, res) => {
res.send("Bot ventas activo ✅");
});
app.post("/mensaje", async (req, res) => {
try {
const texto = req.body.texto || req.body.mensaje || req.body.message || "";
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
