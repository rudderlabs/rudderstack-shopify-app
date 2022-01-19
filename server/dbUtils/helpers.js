// TODO: put db column names in an enum
// add a node-cache layer in front of the DB
// ADD created_at, updated_at timestamp columns
import StoreConfig from "./models/storeConfig"

const getDataByShop = async (dbConObject, shop) => {
  if (!dbConObject) {
    throw new Error("DB Connector not found");
  }
  const storeInfo = await StoreConfig.findOne({ shopname: shop });
  console.log("Store Info ", storeInfo);
  return storeInfo;
};

const getConfigByShop = async (dbConObject, shop) => {
  const storeInfo = await getDataByShop(dbConObject, shop);
  return storeInfo ? storeInfo.config : null;
};

// if on load is true, we only want to udpate the accessToken.
// if on load is false, we insert or update the whole data
const upsertIntoTable = async (dbConObject, shop, accessToken, onLoad, webhookList, dataPlaneUrl) => {
  if (!dbConObject) {
    throw new Error("DB Connector not found");
  }

  const existingData = await StoreConfig.findOne({ shopname: shop });
  if (!existingData) {
    // insert whole
    const insertData = {
      shopname: shop,
      config: {
        dataPlaneUrl,
        accessToken,
        webhooks: webhookList || []
      }
    };
    await StoreConfig.findOneAndUpdate(
      { shopname: shop },
      insertData,
      { upsert: true }
    );
    console.log("inserted data in shop")
    return;
  }

  // data exists
  // if onLoad, only update the accessToken
  if (onLoad) {
    const updateData = Object.assign({}, existingData);
    updateData.config = {
      ...existingData.config,
      accessToken
    }
    await StoreConfig.findOneAndUpdate({ shop }, updateData);
    console.log("updated only access token for shop");
    return;
  }
  
  // update all fields
  await StoreConfig.findOneAndUpdate(
    { shopname: shop },
    {
      shopname: shop,
      config: {
        accessToken,
        dataPlaneUrl,
        webhooks: webhookList || []
      }
    }
  );

  console.log('Shop Update all fields success');
};

const deleteShopInfo = async (dbConObject, shop) => {
  if (!dbConObject) {
    throw new Error("DB Connector not found");
  }
  await StoreConfig.findOneAndDelete(
    { shopname: shop }
  );
  console.log(`Config deleted for shop ${shop}`);
};

export const dbUtils = {
  upsertIntoTable,
  getDataByShop,
  getConfigByShop,
  getDataByShop,
  deleteShopInfo
};