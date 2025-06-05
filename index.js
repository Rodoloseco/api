// index.js
const express = require("express");
const axios = require("axios");
// Importa la clase principal OpenAI para la versión 4.x de la librería
const OpenAI = require("openai");

const app = express();
app.use(express.json()); // Middleware para parsear cuerpos de solicitud JSON

// Inicializa la instancia de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Obtiene el token de Z-API de las variables de entorno
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;

// --- Nueva ruta de salud (Health Check) para Render ---
// Esta ruta responderá a solicitudes GET en la raíz de tu URL
app.get("/", (req, res) => {
  res.status(200).send("Bot de WhatsApp activo y funcionando!");
});

// Ruta principal del webhook para recibir mensajes de Z-API
app.post("/webhook", async (req, res) => {
  // Logea el cuerpo completo de la solicitud para depuración
  console.log("Webhook recibido. Contenido de req.body:", req.body);

  try {
    // Intenta acceder a las propiedades 'message' y 'text'/'sender'
    // Si req.body.message es undefined, aquí se generará el error 'Cannot read properties of undefined'
    const msg = req.body.message.text;
    const sender = req.body.message.sender;

    // Llama a la API de OpenAI para obtener una respuesta del chat
    // Usando el método correcto para la versión 4.x: openai.chat.completions.create
    const respuesta = await openai.chat.completions.create({
      model: "gpt-4", // Asegúrate de que este modelo esté disponible para tu cuenta
      messages: [{ role: "user", content: msg }]
    });

    // Accede al contenido del mensaje de la IA
    const textoIA = respuesta.choices[0].message.content; // Acceso correcto para v4

    // Envía la respuesta de la IA de vuelta a WhatsApp a través de Z-API
    await axios.post(`https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/send-text`, {
      phone: sender,
      message: textoIA
    }, {
      headers: { Authorization: `Bearer ${ZAPI_TOKEN}` }
    });

    // Envía una respuesta 200 OK a Z-API para indicar que el webhook fue recibido
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