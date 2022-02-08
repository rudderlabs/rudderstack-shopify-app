import {
  getTopicMapping,
  registerWebhooks,
  fetchWebhooks,
  removeWebhooks,
  updateWebhooks,
  registerScriptTag,
  updateScriptTag
} from "../webhooks/helper";
import { dbUtils } from "../dbUtils/helpers";
import { bugsnagClient, logger } from "@rudder/rudder-service";

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
  logger.info(`REGISTERED WEBHOOKS: ${registeredWebhooks}`);
  
  // const updatedWebhooks = [];
  let failedStatus = false;
  await Promise.all(registeredWebhooks.map(async ({ webhookId, topic }) => {
    try {
      const webhookUrl = embedTopicInUrl(rudderWebhookUrl, topic);
      await updateWebhooks(webhookId, webhookUrl, shop, accessToken);
      // updatedWebhooks.push({ webhookId: updatedId, topic });
      logger.info(`Updated webhook - ${webhookId} ${topic}`);
    } catch (err) {
      logger.error(`error while updating webhooks: ${err}`);
      failedStatus = true;
    }
  }));

  if (failedStatus) {
    bugsnagClient.notify(`webhook update failed for: ${shop}`);
    throw new Error("update webhooks failed");
  }

  const updatedInfo = {
    shopname: shop,
    config: {
      ...currentConfig,
      rudderWebhookUrl,
      // webhooks: updatedWebhooks
    }
  };
  await dbUtils.updateShopInfo(shop, updatedInfo);
  logger.info("Webhooks saved to DB");
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

  let failedStatus = false;
  await Promise.all(Object.entries(topics).map(async ([topicKey, topicValue]) => {
    try {
      const finalWebhookUrl = embedTopicInUrl(rudderWebhookUrl, `${topicKey}`).href;
      const webhookId = await registerWebhooks(
        finalWebhookUrl, topicValue, shop, currentConfig.accessToken
      );
      webhooks.push({webhookId, topic: topicKey});
    } catch (err) {
      logger.error(`error while registering webhooks: ${err}`);
      failedStatus = true;
    }
  }));

  if (failedStatus) {
    logger.error("register webhook failed");
    bugsnagClient.notify(`register webhook failed for : ${shop}`);
    throw new Error("register webhook failed");
  }
  
  logger.info(`Registered webhook id: ${webhooks}`);
  
  // save webhook ids in DB
  const updatedInfo = {
    shopname: shop,
    config: {
      ...currentConfig,
      rudderWebhookUrl,
      webhooks
    }
  };
  await dbUtils.updateShopInfo(shop, updatedInfo);
  logger.info("Webhooks saved to DB");
};

/**
 * calls webhook register endpoint and script tag api endpoint
 * for the given rudder webhook source url
 * @param {*} rudderWebhookUrl 
 * @param {*} shop 
 */
export const registerWebhooksAndScriptTag = async (rudderWebhookUrl, shop) => {
  const currentConfig = await dbUtils.getConfigByShop(shop);
  const topics = getTopicMapping();
  const webhooks = [];

  let webhookRegisterFailed = false;
  await Promise.all(Object.entries(topics).map(async ([topicKey, topicValue]) => {
    try {
      const finalWebhookUrl = embedTopicInUrl(rudderWebhookUrl, `${topicKey}`).href;
      const webhookId = await registerWebhooks(
        finalWebhookUrl, topicValue, shop, currentConfig.accessToken
      );
      webhooks.push({webhookId, topic: topicKey});
    } catch (err) {
      logger.error(`error while registering webhooks: ${err}`);
      webhookRegisterFailed = true;
    }
  }));

  let scriptTagFailed = false;
  let resp;
  try {
    resp = await registerScriptTag(currentConfig.accessToken, rudderWebhookUrl, shop);
  } catch (err) {
    logger.error(`script tag register failure: ${err}`);
    scriptTagFailed = true;
  }
  
  let updatedInfo = {
    shopname: shop,
    config: {}
  };
  if (!webhookRegisterFailed) {
    updatedInfo.config = {
      ...currentConfig,
      rudderWebhookUrl,
      webhooks
    };
  }

  if (!scriptTagFailed) {
    updatedInfo.config.scriptTagId = resp.script_tag.id;
  }

  if (webhookRegisterFailed) {
    logger.error("register webhook failed");
    throw new Error("register webhook failed");
  }

  if (scriptTagFailed) {
    logger.error("script tag register failed");
    bugsnagClient.notify(`script tag api register failed for: ${shop}`);
    throw new Error("script tag register failed");
  }
  
  logger.info(`Registered webhook id: ${webhooks}`);
  logger.info(`Registered script tag: ${resp.script_tag}`);
  
  // save to DB only if both succeeds
  await dbUtils.updateShopInfo(shop, updatedInfo);
  logger.info("Webhooks saved to DB");
};

export const updateWebhooksAndScriptTag = async (rudderWebhookUrl, shop) => {
  const currentConfig = await dbUtils.getConfigByShop(shop);
  const { accessToken, webhooks: registeredWebhooks } = currentConfig;
  logger.info(`REGISTERED WEBHOOKS: ${JSON.stringify(registeredWebhooks)}`);
  
  // const updatedWebhooks = [];
  let updateWebhookFailed = false;
  await Promise.all(registeredWebhooks.map(async ({ webhookId, topic }) => {
    try {
      const webhookUrl = embedTopicInUrl(rudderWebhookUrl, topic);
      await updateWebhooks(webhookId, webhookUrl, shop, accessToken);
      // updatedWebhooks.push({ webhookId: updatedId, topic });
      logger.info(`Updated webhook - ${webhookId} ${topic}`);
    } catch (err) {
      logger.error(`error while updating webhooks: ${err}`)
      updateWebhookFailed = true;
    }
  }));
  
  let updateScriptFailed = false;
  try {
    await updateScriptTag(accessToken, rudderWebhookUrl, shop, currentConfig.scriptTagId);
  } catch (err) {
    updateScriptFailed = true
    logger.error(`script tag update failed: ${err}`);
  }

  if (updateWebhookFailed) {
    bugsnagClient.notify('update webhook call failed');
    throw new Error("update webhooks failed");
  }

  const updatedInfo = {
    shopname: shop,
    config: {
      ...currentConfig,
      rudderWebhookUrl,
      // webhooks: updatedWebhooks
    }
  };
  await dbUtils.updateShopInfo(shop, updatedInfo);
  logger.info("DB Updated for update call");

  if (updateScriptFailed) {
    bugsnagClient.notify('update script tag call failed');
    throw new Error("script tag update failed");
  }
};

/**
 * Returns the first found rudder registered webhook for the shop
 * @param {*} shop
 * @returns {Object}
 */
export const fetchRudderWebhookUrl = async (shop) => {
  const config = await dbUtils.getConfigByShop(shop);
  logger.info(`FROM UTIL FUNCTION: ${JSON.stringify(config)}`);
  if (!config || !config.rudderWebhookUrl) {
    return null;
  }
  const { rudderWebhookUrl } = config;
  return rudderWebhookUrl;
};
