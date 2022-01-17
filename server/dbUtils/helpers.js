// TODO: put db column names in an enum
// add a node-cache layer in front of the DB
// ADD created_at, updated_at timestamp columns

const createTableIfNotExists = async dbClient => {
  if (!dbClient) {
    throw new Error("DB client not found");
  }
  const createQuery = `
  CREATE TABLE IF NOT EXISTS store_configs (
    shopname varchar(45) NOT NULL PRIMARY KEY,
    config JSON
  )
  `;
  await dbClient.query(createQuery);
  console.log("Table init");
}

const getConfigByShop = async (dbClient, shop) => {
  if (!dbClient) {
    throw new Error("DB client not found");
  }
  const searchQuery = `
    SELECT "config" from store_configs
    WHERE "shopname"='${shop}'
  `;
  const { rows } = await dbClient.query(searchQuery);
  console.log('Fetch success');
  return rows;
};

const upsertIntoTable = async (dbClient, shop, accessToken, webhookIdList, dataPlaneUrl) => {
  if (!dbClient) {
    throw new Error("DB client not found");
  }
  // check if shop config is already present in DB
  const rows = await getConfigByShop(dbClient, shop);
  
  let query;
  const configToSave = {
    accessToken,
    dataPlaneUrl,
    webhook_ids: webhookIdList || [],
  }

  if (rows.length !== 0) {
    query = `
      UPDATE store_configs
      SET "config"='${JSON.stringify(configToSave)}'
      WHERE "shopname"='${shop}'
    `;
    console.log("Update Query", query);
  } else {
    query = `
      INSERT INTO store_configs("shopname", "config")
      VALUES('${shop}', '${JSON.stringify(configToSave)}')
    `; 
    console.log("Insert Query", query);
  }
  
  await dbClient.query(query);
  console.log('Shop info Insert/Update success');
};

export const dbUtils = {
  createTableIfNotExists,
  upsertIntoTable,
  getConfigByShop
};