const axios = require('axios');

async function askGroq(prompt) {
  const systemPrompt = `
You are a MongoDB expert. Convert the user's natural language request into this JSON format:

{
  "collection": "collection_name",
  "operation": "find" or "aggregate",
  "query": {},               // Required
  "projection": {},          // Optional (used for selecting specific fields)
  "options": {}              // Optional: sort, limit, etc.
}

Rules:
- If the user asks for specific fields (like "only name", "just email"), use the "projection" key. Example: { "name": 1 }
- If the request is for a report (e.g. total, average, grouped), use "operation": "aggregate" with a pipeline in "query".
- NEVER explain anything. Return only valid JSON. No markdown. No surrounding text.
- Ensure everything is parseable with JSON.parse()
`;



  const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: 'llama3-8b-8192',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2
  }, {
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const raw = response.data.choices[0].message.content.trim();
  return raw.replace(/```json|```/g, '').trim();
}

module.exports = { askGroq };
