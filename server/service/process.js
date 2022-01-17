import {
  getTopicMapping,
  registerWebhooks,
  fetchWebhooks,
  removeWebhooks,
  updateWebhooks,
} from "../webhooks/helper";
import appContext from "../state/app-state";
import { dbUtils } from "../dbUtils/helpers";

const embedRudderSignatureInUrl = (url) => {
  let formattedUrl = url;
  // if (!(url.startsWith('http://') || url.startsWith('https://'))) {
  //   formattedUrl = `https://${url}`;
  // }
  const signedUrl = new URL(formattedUrl);
  signedUrl.searchParams.set("signature", "rudderstack");
  return signedUrl;
};

const embedShopSignatureInUrl = (url, shop) => {
  const enrichedUrl = new URL(url);
  enrichedUrl.searchParams.set("shop", shop);
  return enrichedUrl;
};

const embedTopicInUrl = (url, topic) => {
  const enrichedUrl = new URL(url);
  enrichedUrl.searchParams.set("topic", topic);
  return enrichedUrl;
};

const validateRudderWebhookByShop = (webhook, shop) => {
  const url = new URL(webhook.address);
  const rudderClient = url.searchParams.get("signature");
  const shopSignature = url.searchParams.get("shop");
  if (rudderClient == "rudderstack" && shopSignature == shop) {
    return true;
  }
  return false;
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

const filterRudderWebhooksByIdAndTopic = (webhooks, shop) => {
  let webhookItems = [];
  webhooks.forEach((webhook) => {
    const url = new URL(webhook.address);
    const rudderClient = url.searchParams.get("signature");
    const shopSignature = url.searchParams.get("shop");
    const topic = url.searchParams.get("topic");
    if (rudderClient == "rudderstack" && shopSignature == shop) {
      webhookItems.push({ id: webhook.id, topic });
    }
  });
  return webhookItems;
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
  webhookUrl = embedRudderSignatureInUrl(dataPlaneUrl);
  webhookUrl = embedShopSignatureInUrl(webhookUrl, shop);
  const registeredWebhooks = await fetchWebhooks(shop);
  console.log("REGISTERED WEBHOOKS", registeredWebhooks);
  const rudderWebhookItems = filterRudderWebhooksByIdAndTopic(
    registeredWebhooks,
    shop
  );
  rudderWebhookItems.forEach((rudderWebhookItem) => {
    try {
      webhookUrl = embedTopicInUrl(webhookUrl, rudderWebhookItem.topic);
      updateWebhooks(rudderWebhookItem.id, webhookUrl, shop);
    } catch (error) {
      console.log(
        `Failed to process webhook update, for webhook ${rudderWebhookItem} Error: ${error}`
      );
    }
  });
};

/**
 * Register webhook subscription for given dataplane url and shop
 * @param {*} dataPlaneUrl
 * @param {*} shop
 */
export const registerRudderWebhooks = async (dataPlaneUrl, shop) => {
  let webhookUrl;
  webhookUrl = embedRudderSignatureInUrl(dataPlaneUrl);
  webhookUrl = embedShopSignatureInUrl(webhookUrl, shop);
  const topics = getTopicMapping();
  
  const webhook_ids = [];
  // fetch accessToken from DB
  const dbClient = appContext.getDbClient();
  const rows = await dbUtils.getConfigByShop(dbClient, shop);
  const { config } = rows[0];
  
  await Promise.all(Object.entries(topics).map(async ([topicKey, topicValue]) => {
    const finalWebhookUrl = embedTopicInUrl(webhookUrl, `${topicKey}`).href;
    const webhookId = await registerWebhooks(finalWebhookUrl, topicValue, shop, config.accessToken);
    webhook_ids.push(webhookId);
  }));

  console.log("Registered webhook ids", webhook_ids);
  // save webhook ids in DB
  await dbUtils.upsertIntoTable(dbClient, shop, config.accessToken, webhook_ids);
  console.log("Webhooj ID's saved to DB", webhook_ids);
};

/**
 * Returns the first found rudder registered webhook for the shop
 * @param {*} shop
 * @returns {Object}
 */
export const fetchRudderWebhook = async (shop) => {
  let rudderWebhook = {};
  const registeredWebhooks = await fetchWebhooks(shop);
  console.log("All Registered webhooks", registeredWebhooks);
  registeredWebhooks.some((webhook) => {
    if (validateRudderWebhookByShop(webhook, shop)) {
      rudderWebhook = webhook;
      return true;
    }
    return false;
  });
  return rudderWebhook;
};
