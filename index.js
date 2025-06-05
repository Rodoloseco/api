// index.js
const express = require("express");
const axios = require("axios");
// CAMBIO AQUÍ: Importa solo la clase principal OpenAI
const OpenAI = require("openai"); // <-- Asegúrate de que esta línea esté así

const app = express();
app.use(express.json());

// CAMBIO AQUÍ: Instancia de OpenAI (no necesitas "new Configuration" directamente)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const ZAPI_TOKEN = process.env.ZAPI_TOKEN;

app.post("/webhook", async (req, res) => {
  try {
    const msg = req.body.message.text;
    const sender = req.body.message.sender;

    // CAMBIO AQUÍ: La forma de llamar al API de chat puede haber cambiado ligeramente en v4
    // Usa openai.chat.completions.create en lugar de openai.createChatCompletion
    const respuesta = await openai.chat.completions.create({ // <-- CAMBIO DE MÉTODO
      model: "gpt-4",
      messages: [{ role: "user", content: msg }]
    });

    const textoIA = respuesta.choices[0].message.content; // <-- También el acceso a los datos cambia ligeramente

    await axios.post(`https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/send-text`, {
      phone: sender,
      message: textoIA
    }, {
      headers: { Authorization: `Bearer ${ZAPI_TOKEN}` }
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("Error:", error.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot activo en puerto ${PORT}`));