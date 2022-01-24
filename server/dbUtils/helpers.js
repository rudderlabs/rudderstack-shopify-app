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