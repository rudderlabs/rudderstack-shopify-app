import {
  getTopicMapping,
  registerWebhooks,
  fetchWebhooks,
  removeWebhooks,
  updateWebhooks,
} from "../webhooks/helper";
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
export const updateRudderWebhooks = async (rudderWebhookUrl, shop) => {
  const currentConfig = await dbUtils.getConfigByShop(shop);
  const { accessToken, webhooks: registeredWebhooks } = currentConfig;
  console.log("REGISTERED WEBHOOKS", registeredWebhooks);
  
  const updatedWebhooks = [];
  await Promise.all(registeredWebhooks.map(async ({ webhookId, topic }) => {
      const webhookUrl = embedTopicInUrl(rudderWebhookUrl, topic);
      const updatedId = await updateWebhooks(webhookId, webhookUrl, shop, accessToken);
      updatedWebhooks.push({ webhookId: updatedId, topic });
      console.log(`Updated webhook - ${webhookId} ${topic}`);
    }));

  const udpatedInfo = {
    shopname: shop,
    config: {
      ...currentConfig,
      rudderWebhookUrl,
      webhooks: updatedWebhooks
    }
  };
  await dbUtils.updateShopInfo(shop, udpatedInfo);
  console.log("Webhooks saved to DB");
};

/**
 * Register webhook subscription for given dataplane url and shop
 * @param {*} dataPlaneUrl
 * @param {*} shop
 */
export const registerRudderWebhooks = async (rudderWebhookUrl, shop) => {
  const currentConfig = await dbUtils.getConfigByShop(shop);
  const topics = getTopicMapping();
  const webhooks = [];
  await Promise.all(Object.entries(topics).map(async ([topicKey, topicValue]) => {
    const finalWebhookUrl = embedTopicInUrl(rudderWebhookUrl, `${topicKey}`).href;
    const webhookId = await registerWebhooks(
      finalWebhookUrl, topicValue, shop, currentConfig.accessToken
    );
    webhooks.push({webhookId, topic: topicKey});
  }));

  console.log("Registered webhook id", webhooks);
  
  // save webhook ids in DB
  const udpatedInfo = {
    shopname: shop,
    config: {
      ...currentConfig,
      rudderWebhookUrl,
      webhooks
    }
  };
  await dbUtils.updateShopInfo(shop, udpatedInfo);
  console.log("Webhooks saved to DB");
};

/**
 * Returns the first found rudder registered webhook for the shop
 * @param {*} shop
 * @returns {Object}
 */
export const fetchRudderWebhookUrl = async (shop) => {
  const config = await dbUtils.getConfigByShop(shop);
  console.log("FROM UTIL FUNCTION ", JSON.stringify(config));
  if (!config || !config.rudderWebhookUrl) {
    return null;
  }
  const { rudderWebhookUrl } = config;
  return rudderWebhookUrl;
};
