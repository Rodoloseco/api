// index.js
const express = require("express");
const axios = require("axios");
const OpenAI = require("openai"); // Importa la clase principal OpenAI para la versión 4.x de la librería

const app = express();
app.use(express.json()); // Middleware para parsear cuerpos de solicitud JSON

// Inicializa la instancia de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Obtiene el token de Z-API de las variables de entorno
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;

// --- Ruta de salud (Health Check) para Render ---
// Esta ruta responderá a solicitudes GET en la raíz de tu URL
app.get("/", (req, res) => {
  res.status(200).send("Bot de WhatsApp activo y funcionando!");
});

// Ruta principal del webhook para recibir mensajes de Z-API
app.post("/webhook", async (req, res) => {
  // Logea el cuerpo completo de la solicitud para depuración
  // Esto nos ha ayudado a entender la estructura de Z-API
  console.log("Webhook recibido. Contenido de req.body:", req.body);

  try {
    // --- CAMBIOS CRUCIALES AQUÍ ---
    // Según los logs, el texto del mensaje está en req.body.text.message
    const msg = req.body.text.message;

    // Según los logs, el número del remitente está en req.body.phone
    const sender = req.body.phone;
    // --- FIN CAMBIOS ---

    // Asegúrate de que tanto 'msg' como 'sender' existan
    if (!msg || !sender) {
        console.error("Error: Mensaje o remitente no encontrados en el webhook.");
        return res.sendStatus(400); // Bad Request si falta información
    }

    // Llama a la API de OpenAI para obtener una respuesta del chat
    // Usando el método correcto para la versión 4.x: openai.chat.completions.create
    const respuesta = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Asegúrate de que este modelo esté disponible para tu cuenta OpenAI
      messages: [{ role: "user", content: msg }]
    });

    // Accede al contenido del mensaje de la IA
    const textoIA = respuesta.choices[0].message.content; // Acceso correcto para v4

    // Envía la respuesta de la IA de vuelta a WhatsApp a través de Z-API
    await axios.post(`https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/send-text`, {
      phone: sender, // El número de teléfono del destinatario
      message: textoIA // El mensaje generado por la IA
    }, {
      headers: { Authorization: `Bearer ${ZAPI_TOKEN}` }
    });

    // Envía una respuesta 200 OK a Z-API para indicar que el webhook fue recibido y procesado
    res.sendStatus(200);
  } catch (error) {
    // Captura y logea cualquier error que ocurra dentro del try block
    console.error("Error en el webhook o al procesar el mensaje:", error.message);
    // Envía una respuesta 500 Internal Server Error a Z-API
    res.sendStatus(500);
  }
});

// Define el puerto en el que la aplicación escuchará.
// Usa process.env.PORT proporcionado por Render, o 3000 como fallback local.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot activo en puerto ${PORT}`));
