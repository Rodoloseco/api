// index.js
const express = require("express");
const axios = require("axios");

// --- CAMBIO AQUÍ: Importa la librería de Google Generative AI ---
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json());

// --- CAMBIO AQUÍ: Inicializa la instancia de Gemini ---
// Accede a tu clave API de Gemini desde las variables de entorno
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Elige el modelo que quieres usar (por ejemplo, "gemini-pro" para texto)
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const ZAPI_TOKEN = process.env.ZAPI_TOKEN;

// Ruta de salud (Health Check)
app.get("/", (req, res) => {
  res.status(200).send("Bot de WhatsApp activo y funcionando!");
});

// Ruta principal del webhook para recibir mensajes de Z-API
app.post("/webhook", async (req, res) => {
  console.log("Webhook recibido. Contenido de req.body:", req.body);

  try {
    const msg = req.body.text.message;
    const sender = req.body.phone;

    if (!msg || !sender) {
      console.error("Error: Mensaje o remitente no encontrados en el webhook.");
      return res.sendStatus(400); // Bad Request si falta información
    }

    // --- CAMBIO CRUCIAL AQUÍ: Llama a la API de Gemini ---
    const result = await model.generateContent(msg);
    const response = await result.response;
    const textoIA = response.text(); // Extrae el texto de la respuesta de Gemini
    // --- FIN CAMBIO ---

    await axios.post(`https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/send-text`, {
      phone: sender,
      message: textoIA
    }, {
      headers: { Authorization: `Bearer ${ZAPI_TOKEN}` }
    });

    res.sendStatus(200);
  } catch (error) {
    // Es muy importante loguear el error completo para depuración
    console.error("Error en el webhook o al procesar el mensaje con Gemini:", error);
    // Puedes diferenciar errores, por ejemplo, si el error tiene una propiedad `response.data` de axios
    if (error.response) {
        console.error("Detalles del error de API:", error.response.data);
    }
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot activo en puerto ${PORT}`));