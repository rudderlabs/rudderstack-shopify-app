const createQuery = `
  CREATE TABLE IF NOT EXISTS store_configs (
    storename varchar(45) NOT NULL PRIMARY KEY,
    config JSON
  )
  `;

const createTableIfNotExists = async dbClient => {
  if (!dbClient) {
    throw new Error("DB client not found");
  }
  await dbClient.query(createQuery);
  console.log("Table init");
}

const insertIntoTable = async (dbClient, shop, accessToken) => {
  const initialConfig = {
    accessToken,
    webhookIds: []
  }
  const insertQuery = `
    INSERT INTO store_configs("storename", "config")
    VALUES('${shop}', '${JSON.stringify(initialConfig)}')
  `;
  console.log("Insert Query", insertQuery);
  
  await dbClient.query(insertQuery);
  console.log('Shop info Insert success');
};

export const dbUtils = {
  createTableIfNotExists,
  insertIntoTable
};