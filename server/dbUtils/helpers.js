// TODO: put db column names in an enum
// add a node-cache layer in front of the DB
import mongoose from "mongoose";
import StoreConfig from "./models/storeConfig";
// import { logger, //bugsnagClient } from "@rudder/rudder-service";

const getDataByShop = async (shop) => {
  console.log("Inside shop getData function");
  const storeInfo = await StoreConfig.findOne({ shopname: shop });
  console.log(`Store Info: ${storeInfo}`);
  return storeInfo;
};

const shopExists = async (shop) => {
  const shopData = await getDataByShop(shop);
  return !!shopData;
}

const getConfigByShop = async (shop) => {
  if (!shop) {
    return null;
  }
  const storeInfo = await getDataByShop(shop);
  return storeInfo ? storeInfo.config : null;
};

const insertShopInfo = async (shopData) => {
  console.log("Inside shop insert function");
  await StoreConfig.create({
    ...shopData,
    _id: mongoose.Types.ObjectId()
  });
  console.log("Shop info inserted");
};

const updateShopInfo = async (shop, updateData) => {
  console.log("Inside shop update function");
  await StoreConfig.findOneAndUpdate(
    { shopname: shop},
    updateData
  );
  console.log('Shop info updated');
}

const deleteShopInfo = async (shop) => {
  console.log("Inside shop delete function");
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