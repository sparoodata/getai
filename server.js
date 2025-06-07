require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { askGroq } = require('./services/groqService');
const { runQuery, connect: connectMongo, close: closeMongo } = require('./services/mongoService');

const app = express();
app.set('trust proxy', 'loopback'); // Safe proxy trust for rate limiter

app.use(cors({ origin: '*' }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Try again later.' }
});
app.use(limiter);

const authenticate = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.MCP_API_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};
app.use(authenticate);

app.post('/prompt', async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const llmResponse = await askGroq(prompt);
    let mongoQuery;

    try {
      mongoQuery = JSON.parse(llmResponse);
    } catch (err) {
      return res.status(400).json({ error: 'Groq did not return valid JSON', raw: llmResponse });
    }

    // Validate & sanitize
    const { collection, operation, query } = mongoQuery;
    if (!['tenants', 'units', 'properties'].includes(collection)) {
      return res.status(400).json({ error: 'Unsupported collection' });
    }

    if (!['find', 'aggregate'].includes(operation)) {
      return res.status(400).json({ error: 'Unsupported operation' });
    }

    // Fix if $lookup used in a find query
    if (operation === 'find' && query?.$lookup) {
      mongoQuery.operation = 'aggregate';
      mongoQuery.query = [query];
    }

    // Fix if aggregate query is not an array
    if (mongoQuery.operation === 'aggregate' && !Array.isArray(query)) {
      mongoQuery.query = [query];
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

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectMongo();
    const server = app.listen(PORT, () => {
      console.log(`MCP Server running on port ${PORT}`);
    });

    process.on('SIGINT', async () => {
      await closeMongo();
      server.close(() => process.exit(0));
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
