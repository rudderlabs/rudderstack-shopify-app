// TODO: put db column names in an enum
// add a node-cache layer in front of the DB
// ADD created_at, updated_at timestamp columns
import mongoose from "mongoose";
import StoreConfig from "./models/storeConfig"

const getDataByShop = async (shop) => {
  const storeInfo = await StoreConfig.findOne({ shopname: shop });
  console.log("Store Info ", storeInfo);
  return storeInfo;
};

const shopExists = async (shop) => {
  const shopData = await getDataByShop(shop);
  return !!shopData;
}

const getConfigByShop = async (shop) => {
  const storeInfo = await getDataByShop(shop);
  return storeInfo ? storeInfo.config : null;
};

const insertShopInfo = async (shopData) => {
  await StoreConfig.create({
    ...shopData,
    _id: mongoose.Types.ObjectId()
  });
  console.log("Shop info inserted");
};

const updateShopInfo = async (shop, updateData) => {
  await StoreConfig.findOneAndUpdate(
    { shopname: shop},
    updateData
  );
  console.log('Shop info updated');
}

// if on load is true, we only want to update the accessToken.
// if on load is false, we insert or update the whole data
// const upsertIntoTable = async (shop, accessToken, onLoad, webhookList, dataPlaneUrl) => {
//   const existingData = await StoreConfig.findOne({ shopname: shop });
//   if (!existingData) {
//     // insert whole
//     const insertData = {
//       shopname: shop,
//       config: {
//         accessToken,
//         rudderWebhookUrl,
//         webhooks: webhookList || []
//       }
//     };
//     await StoreConfig.findOneAndUpdate(
//       { shopname: shop },
//       insertData,
//       { upsert: true }
//     );
//     console.log("inserted data in shop")
//     return;
//   }

//   // data exists
//   // if onLoad, only update the accessToken
//   if (onLoad) {
//     const updateData = Object.assign({}, existingData);
//     updateData.config = {
//       ...existingData.config,
//       accessToken
//     }
//     await StoreConfig.findOneAndUpdate({ shop }, updateData);
//     console.log("updated only access token for shop");
//     return;
//   }
  
//   // update all fields
//   await StoreConfig.findOneAndUpdate(
//     { shopname: shop },
//     {
//       shopname: shop,
//       config: {
//         accessToken,
//         dataPlaneUrl,
//         webhooks: webhookList || []
//       }
//     }
//   );

//   console.log('Shop Update all fields success');
// };

const deleteShopInfo = async (shop) => {
  await StoreConfig.findOneAndDelete(
    { shopname: shop }
  );
  console.log(`Config deleted for shop ${shop}`);
};

export const dbUtils = {
  getDataByShop,
  getConfigByShop,
  deleteShopInfo,
  shopExists,
  insertShopInfo,
  updateShopInfo
};