const axios = require('axios');

const askGroq = async (prompt) => {
  const systemPrompt = `
You are a MongoDB expert.
Convert the following user prompt into a JSON object containing:
{
  "collection": "collection_name",
  "operation": "find" or "aggregate",
  "query": the actual MongoDB query (for aggregate, it's a pipeline array)
}
Ensure it's directly executable in Node.js MongoDB driver.
`;

  const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: 'mixtral-8x7b-32768',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.choices[0].message.content.trim();
};

module.exports = { askGroq };
