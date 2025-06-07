// server.js
require('dotenv').config();
const express = require('express');
const { askGroq } = require('./services/groqService');
const { runQuery } = require('./services/mongoService');

const app = express();
app.use(express.json());

app.post('/prompt', async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const llmResponse = await askGroq(prompt);

    let mongoQuery;
    try {
      mongoQuery = JSON.parse(llmResponse);
    } catch (err) {
      return res.status(400).json({ error: 'Groq response is not valid JSON', raw: llmResponse });
    }

    const result = await runQuery(mongoQuery);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/debug', async (req, res) => {
  const { prompt } = req.query;
  if (!prompt) return res.status(400).send('Prompt required');
  const llmResponse = await askGroq(prompt);
  res.send(`<pre>${llmResponse}</pre>`);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('MCP Server running');
});
