const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

if (!uri || !dbName) {
  throw new Error('MONGODB_URI and DB_NAME environment variables are required');
}

let client;

async function connect() {
  if (!client) {
    client = new MongoClient(uri, { useUnifiedTopology: true });
    await client.connect();
  }
  return client;
}

async function getDb() {
  return (await connect()).db(dbName);
}

const runQuery = async ({ collection, operation, query, projection, options }) => {
  if (!collection || !operation || !query) {
    throw new Error('Missing required fields: collection, operation, or query');
  }

  const db = await getDb();
  const col = db.collection(collection);

  if (operation === 'find') {
    const findOptions = {};

    if (projection) {
      if (!('_id' in projection)) projection._id = 0;
      findOptions.projection = projection;
    }

    if (options) Object.assign(findOptions, options);

    return await col.find(query, findOptions).toArray();
  }

  if (operation === 'aggregate') {
    if (!Array.isArray(query)) {
      throw new Error('For aggregate, query must be an array (pipeline)');
    }
    return await col.aggregate(query).toArray();
  }

  throw new Error(`Unsupported operation: ${operation}`);
};

async function close() {
  if (client) {
    await client.close();
    client = null;
  }
}

module.exports = { runQuery, connect, close };
