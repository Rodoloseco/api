// index.js
const express = require("express");
const axios = require("axios");

// Importa la librería de Google Generative AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json()); // Middleware para parsear cuerpos de solicitud JSON (una sola vez)

// Inicializa la instancia de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Elige el modelo que quieres usar (por ejemplo, "gemini-pro" para texto)
const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" }); // Probemos con esta versión específica

// Obtiene el token de Z-API de las variables de entorno
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;

// Ruta de salud (Health Check) para Render
app.get("/", (req, res) => {
  res.status(200).send("Bot de WhatsApp activo y funcionando!");
});

// Ruta principal del webhook para recibir mensajes de Z-API
app.post("/webhook", async (req, res) => {
  // Logea el cuerpo completo de la solicitud para depuración
  console.log("Webhook recibido. Contenido de req.body:", req.body);

  try {
    // Accede al texto del mensaje y al número del remitente
    const msg = req.body.text.message;
    const sender = req.body.phone;

    // Asegúrate de que tanto 'msg' como 'sender' existan
    if (!msg || !sender) {
      console.error("Error: Mensaje o remitente no encontrados en el webhook. req.body:", req.body);
      return res.sendStatus(400); // Bad Request si falta información
    }

    // Llama a la API de Gemini
    const result = await model.generateContent(msg);
    const response = await result.response;
    const textoIA = response.text(); // Extrae el texto de la respuesta de Gemini

    // Envía la respuesta de la IA de vuelta a WhatsApp a través de Z-API
    await axios.post(`https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/send-text`, {
      phone: sender, // El número de teléfono del destinatario
      message: textoIA // El mensaje generado por la IA
    }, {
      headers: { Authorization: `Bearer ${ZAPI_TOKEN}` }
    });

    // Envía una respuesta 200 OK a Z-API
    res.sendStatus(200);

  } catch (error) {
    // Captura y logea cualquier error que ocurra
    console.error("Error en el webhook o al procesar el mensaje con Gemini:", error);
    // Si el error tiene una propiedad 'response.data' (típico de errores de axios), la mostramos
    if (error.response && error.response.data) {
        console.error("Detalles del error de API:", error.response.data);
    }
    res.sendStatus(500);
  }
});

// Define el puerto en el que la aplicación escuchará.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot activo en puerto ${PORT}`));
