// index.js
const express = require("express");
const axios = require("axios");
const OpenAI = require("openai"); // Importa la clase principal OpenAI para la versión 4.x de la librería

const app = express();
app.use(express.json()); // Middleware para parsear cuerpos de solicitud JSON

// Inicializa la instancia de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Usa la variable de entorno para tu API Key de OpenAI
});

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
    // Según tus logs anteriores, la estructura es req.body.text.message y req.body.phone
    const msg = req.body.text.message; 
    const sender = req.body.phone;     

    // Asegúrate de que tanto 'msg' como 'sender' existan
    if (!msg || !sender) {
      console.error("Error: Mensaje o remitente no encontrados en el webhook. req.body:", req.body);
      return res.sendStatus(400); // Bad Request si falta información
    }

    // Llama a la API de OpenAI para obtener una respuesta del chat
    const respuesta = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Este modelo es comúnmente disponible y más económico/gratuito en pruebas iniciales.
                               // Si tienes acceso y quieres un modelo más avanzado, puedes probar "gpt-4" (si tienes cuota).
      messages: [{ role: "user", content: msg }]
    });

    // Accede al contenido del mensaje de la IA
    const textoIA = respuesta.choices[0].message.content;

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
    console.error("Error en el webhook o al procesar el mensaje:", error.message);
    // Es muy importante loguear el error completo para depuración
    if (error.response && error.response.data) {
        console.error("Detalles del error de API:", error.response.data);
    }
    res.sendStatus(500);
  }
});

// Define el puerto en el que la aplicación escuchará.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot activo en puerto ${PORT}`));
