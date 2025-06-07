const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

const runQuery = async ({ collection, operation, query, projection, options }) => {
  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection(collection);

    if (!collection || !operation || !query) {
      throw new Error('Missing required fields: collection, operation, or query');
    }

    if (operation === 'find') {
      const findOptions = {};
      if (projection) findOptions.projection = projection;
      if (options) Object.assign(findOptions, options);

      return await col.find(query, findOptions).toArray();
    } else if (operation === 'aggregate') {
      if (!Array.isArray(query)) {
        throw new Error('For aggregate, query must be an array (pipeline)');
      }
      return await col.aggregate(query).toArray();
    } else {
      throw new Error(`Unsupported operation: ${operation}`);
    }
  } finally {
    await client.close();
  }
};

module.exports = { runQuery };
