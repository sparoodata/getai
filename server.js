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
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min window
  max: 100,                  // limit each IP to 100 requests per window
  message: { error: 'Rate limit exceeded. Try again later.' }
});

app.use(limiter);
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] IP: ${req.ip} accessed ${req.originalUrl}`);
  next();
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
