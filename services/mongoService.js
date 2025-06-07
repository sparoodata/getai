const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

const runQuery = async ({ collection, operation, query }) => {
  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection(collection);

    if (operation === 'find') {
      return await col.find(query).toArray();
    } else if (operation === 'aggregate') {
      return await col.aggregate(query).toArray();
    } else {
      throw new Error(`Unsupported operation: ${operation}`);
    }
  } finally {
    await client.close();
  }
};

module.exports = { runQuery };
