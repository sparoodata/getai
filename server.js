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
    const mongoQuery = JSON.parse(llmResponse);

    const result = await runQuery(mongoQuery);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Unexpected error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MCP server running on port ${PORT}`));
