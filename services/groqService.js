const askGroq = async (prompt) => {
  const systemPrompt = `
You are a MongoDB expert.
Convert this user prompt into valid JSON:
{
  "collection": "collection_name",
  "operation": "find" or "aggregate",
  "query": {...}
}
Only return the JSON object.
`;

  const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: 'llama3-8b-8192',  // ✅ use supported model
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

  const raw = response.data.choices[0].message.content.trim();

  // ✅ Sanitize output in case it wraps in Markdown/code blocks
  const cleaned = raw.replace(/```json|```/g, '').trim();

  // 🔥 Log or return as-is instead of parsing directly
  return cleaned;
};
