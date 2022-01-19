import {
  getTopicMapping,
  registerWebhooks,
  fetchWebhooks,
  removeWebhooks,
  updateWebhooks,
} from "../webhooks/helper";
import appContext from "../state/app-state";
import { dbUtils } from "../dbUtils/helpers";

const embedTopicInUrl = (url, topic) => {
  const enrichedUrl = new URL(url);
  enrichedUrl.searchParams.set("topic", topic);
  return enrichedUrl;
};

/**
 * Returns the rudder webhook subscription ids for shop
 * @param {*} webhooks
 * @param {*} shop
 * @returns {Array}
 */
const filterRudderWebhooksById = (webhooks, shop) => {
  let webhookIds = [];
  webhooks.forEach((webhook) => {
    const url = new URL(webhook.address);
    const rudderClient = url.searchParams.get("signature");
    const shopSignature = url.searchParams.get("shop");
    if (rudderClient == "rudderstack" && shopSignature == shop) {
      webhookIds.push(webhook.id);
    }
  });
  return webhookIds;
};

/**
 * Unregisters all the webhooks subscription created by rudder for shop
 * @param {*} shop
 */
export const unregisterRudderWebhooks = async (shop) => {
  const registeredWebhooks = await fetchWebhooks(shop);
  const rudderWebhookIds = filterRudderWebhooksById(registeredWebhooks, shop);
  rudderWebhookIds.forEach((rudderWebhookId) => {
    removeWebhooks(rudderWebhookId, shop);
  });
};

/**
 * Updates webhook subscriptions for given dataplane url and shop
 * @param {*} shop
 */
export const updateRudderWebhooks = async (dataPlaneUrl, shop) => {
  let webhookUrl;

  const dbConObject = appContext.getDBConnector();
  const config = await dbUtils.getConfigByShop(dbConObject, shop);
  const { accessToken, webhooks: registeredWebhooks } = config;
  console.log("REGISTERED WEBHOOKS", registeredWebhooks);
  
  const updatedWebhooks = [];
  await Promise.all(registeredWebhooks.map(async ({ webhookId, topic }) => {
      webhookUrl = embedTopicInUrl(dataPlaneUrl, topic);
      const updatedId = await updateWebhooks(webhookId, webhookUrl, shop, accessToken);
      updatedWebhooks.push({ webhookId: updatedId, topic });
      console.log(`Updated webhook - ${webhookId} ${topic}`);
    }));

  await dbUtils.upsertIntoTable(dbConObject, shop, accessToken, false, updatedWebhooks, dataPlaneUrl);
  console.log("Webhooks saved to DB");
};

/**
 * Register webhook subscription for given dataplane url and shop
 * @param {*} dataPlaneUrl
 * @param {*} shop
 */
export const registerRudderWebhooks = async (dataPlaneUrl, shop) => {
  const topics = getTopicMapping();
  
  const webhooks = [];
  // fetch accessToken from DB
  const dbConObject = appContext.getDBConnector();
  const config = await dbUtils.getConfigByShop(dbConObject, shop);
  
  await Promise.all(Object.entries(topics).map(async ([topicKey, topicValue]) => {
    const finalWebhookUrl = embedTopicInUrl(dataPlaneUrl, `${topicKey}`).href;
    const webhookId = await registerWebhooks(finalWebhookUrl, topicValue, shop, config.accessToken);
    webhooks.push({webhookId, topic: topicKey});
  }));

  console.log("Registered webhook id", webhooks);
  // save webhook ids in DB
  await dbUtils.upsertIntoTable(dbConObject, shop, config.accessToken, false, webhooks, dataPlaneUrl);
  console.log("Webhooks saved to DB");
};

/**
 * Returns the first found rudder registered webhook for the shop
 * @param {*} shop
 * @returns {Object}
 */
export const fetchRudderWebhookUrl = async (shop) => {
  const dbConObject = appContext.getDBConnector();
  const config = await dbUtils.getConfigByShop(dbConObject, shop);
  console.log("FROM UTIL FUNCTION ", JSON.stringify(config));
  if (!config || !config.dataPlaneUrl) {
    return null;
  }
  const { dataPlaneUrl } = config;
  return dataPlaneUrl;
};
