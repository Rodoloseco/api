const express = require("express");
const axios = require("axios");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(express.json());

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

const ZAPI_TOKEN = process.env.ZAPI_TOKEN;

app.post("/webhook", async (req, res) => {
  try {
    const msg = req.body.message.text;
    const sender = req.body.message.sender;

    const respuesta = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: msg }]
    });

    const textoIA = respuesta.data.choices[0].message.content;

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
