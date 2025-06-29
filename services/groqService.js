const axios = require('axios');

async function askGroq(prompt) {
  const systemPrompt = `
You are a MongoDB and Mongoose expert.

These are the collection schemas:

1. **tenants**
- tenantId: string
- fullName: string
- phoneNumber: string
- unitAssigned: ObjectId (ref: Unit)
- leaseStartDate: Date
- leaseEndDate: Date
- monthlyRent: number
- depositAmount: number
- status: string

2. **units**
- unitId: string
- property: ObjectId (ref: Property)
- unitNumber: string
- floor: string
- rentAmount: number
- status: string

3. **properties**
- propertyId: string
- name: string
- address: string
- city: string
- state: string
- totalUnits: number
- rentalIncome: number
- ownerId: ObjectId (ref: User)

User will give natural language instructions. Convert that into this JSON format:
{
  "collection": "collection_name",
  "operation": "find" or "aggregate",
  "query": {},               // Required
  "projection": {},          // Optional (used for selecting specific fields)
  "options": {}              // Optional: sort, limit, etc.
}

Clarification:
- Use "tenants" collection and "monthlyRent" field to calculate total rent across properties.
- "properties" collection has rentalIncome (static number, not per-tenant rent).

Rules:
- If the operation is "aggregate", the "query" field MUST be an array of pipeline stages (e.g., [{ "$group": ... }, { "$sort": ... }]).
- Do NOT return a single object for aggregate "query". Always use an array.
- For "find", "query" can be a normal object.
- Return ONLY a valid JSON object without markdown or text.- Do not explain. Just return the raw JSON that can be parsed with JSON.parse().
- NEVER return invented or hypothetical sample data.
- ALWAYS generate a real MongoDB query in JSON format to fetch actual documents.
- For example-based requests like “show me a sample record”, return:
  {
    "collection": "properties",
    "operation": "find",
    "query": {},
    "options": { "limit": 1 }
  }
- Return only the query JSON. No explanation, no markdown, no comments.
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
