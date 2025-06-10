// index.js
const express = require("express");
const axios = require("axios");
const { OpenAI } = require("openai");

const app = express();
app.use(express.json());

// Instancia de OpenAI con tu API Key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Variables de entorno
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID;

// Ruta para verificar que el bot está activo
app.get("/", (req, res) => {
  res.status(200).send("🤖 Bot WhatsApp + ChatGPT listo y funcionando!");
});

// Webhook que recibe mensajes desde Z-API
app.post("/webhook", async (req, res) => {
  console.log("📩 Webhook recibido:", req.body);

  try {
    const msg = req.body.text?.message;
    const sender = req.body.phone;

    if (!msg || !sender) {
      console.error("⚠️ Faltan datos en el mensaje recibido.");
      return res.sendStatus(400);
    }

    // Solicitud a ChatGPT
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Podés cambiar a gpt-4 si querés
      messages: [{ role: "user", content: msg }]
    });

    const textoIA = completion.choices[0].message.content;

    // Respuesta al número de WhatsApp
    await axios.post(`https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/send-text`, {
      phone: sender,
      message: textoIA
    }, {
      headers: { Authorization: `Bearer ${ZAPI_TOKEN}` }
    });

    res.sendStatus(200);

  } catch (error) {
    console.error("❌ Error procesando mensaje:", error);
    if (error.response?.data) {
      console.error("Detalles del error:", error.response.data);
    }
    res.sendStatus(500);
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot activo en puerto ${PORT}`));
