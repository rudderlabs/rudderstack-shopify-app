import Shopify, { DataType } from "@shopify/shopify-api";
import { bugsnagClient, logger } from "@rudder/rudder-service";
import { topicMapping } from "../constants/topic-mapping";
import { dbUtils } from "../dbUtils/helpers";

/**
 * Returns all the topics for subscription
 * @param {*} storeOperations
 * @returns {Array}
 */
export const getTopicList = () => {
  const resultantTopics = [];
  Object.keys(topicMapping).forEach((key) => {
    resultantTopics.push(topicMapping[key]);
  });
  return resultantTopics;
};
/**
 * Returns the topic mapping
 * @returns {Object}
 */
export const getTopicMapping = () => {
  return topicMapping;
};

/**
 * Registers webhook subscriptions to a the specified webhook url
 * @param {*} webhookUrl
 */
export const registerWebhooks = async (webhookUrl, topic, shop, accessToken) => {
  const client = new Shopify.Clients.Rest(shop, accessToken);
  const webhookToSubscribe = {
    topic: `${topic}`,
    address: `${webhookUrl}`,
    format: "json",
  };
  console.log("[registerWebhooks] topic, webhookUrl ", topic, webhookUrl);
  const response = await client.post({
    path: "webhooks",
    data: {
      webhook: webhookToSubscribe,
    },
    type: DataType.JSON,
  });
  console.log("[registerWebhooks] topic, webhookUrl DONE ", topic, webhookUrl);
  console.log("RESPONSE", JSON.stringify(response.body));
  return response.body.webhook.id;
};


/**
 * Call to Script Tag Endpoint loads the shopify tracking code in the store pages
 * @param {*} rudderWebhookUrl 
 * @param {*} shop 
 */
export const registerScriptTag = async (accessToken, rudderWebhookUrl, shop) => {
  const wrappedUrl = new URL(rudderWebhookUrl);
  const writeKey = wrappedUrl.searchParams.get('writeKey');
  const dataPlane = wrappedUrl.hostname;
  const cdnBaseUrl = process.env.SHOPIFY_TRACKER_URL || 'shopify-tracker.dev-rudder.rudderlabs.com';
  const scriptTagUrl = `https:\/\/${cdnBaseUrl}\/load?writeKey=${writeKey}&dataPlaneUrl=${dataPlane}`;

  const client = new Shopify.Clients.Rest(shop, accessToken);
  const response = await client.post({
    path: 'script_tags',
    data: {"script_tag":{"event":"onload","src": scriptTagUrl }},
    type: DataType.JSON,
  });

  console.log("Script tag endpoint called", response.body);
  return response.body;
};

/**
 * update call to script tag api endpoint
 * @param {*} accessToken 
 * @param {*} rudderWebhookUrl 
 * @param {*} shop 
 * @param {*} scriptTagId 
 * @returns 
 */
export const updateScriptTag = async (accessToken, rudderWebhookUrl, shop, scriptTagId) => {
  const wrappedUrl = new URL(rudderWebhookUrl);
  const writeKey = wrappedUrl.searchParams.get('writeKey');
  const dataPlane = wrappedUrl.hostname;
  const cdnBaseUrl = process.env.SHOPIFY_TRACKER_URL || 'shopify-tracker.dev-rudder.rudderlabs.com';
  const scriptTagUrl = `https:\/\/${cdnBaseUrl}\/load?writeKey=${writeKey}&dataPlaneUrl=${dataPlane}`;

  const client = new Shopify.Clients.Rest(shop, accessToken);
  const response = await client.put({
    path: `script_tags/${scriptTagId}`,
    data: {"script_tag":{"event":"onload","src": scriptTagUrl }},
    type: DataType.JSON,
  });

  console.log("Script tag endpoint called", response.body);
  return response.body;
};


/**
 * Updates webhook subscription to specified address
 * @param {*} webhookId 
 * @param {*} webhookUrl 
 * @param {*} shop 
 */
export const updateWebhooks = async (webhookId, webhookUrl, shop, accessToken) => {
  const client = new Shopify.Clients.Rest(shop, accessToken);

  console.log("inside update function");
  const webhookToUpdate = {
    id: webhookId,
    address: webhookUrl,
  };
  const response = await client.put({
    path: `webhooks/${webhookId}`,
    data: {
      webhook: webhookToUpdate,
    },
    type: DataType.JSON,
  });

  console.log("RESPONSE", response);
  return response.body.webhook.id;
};

/**
 * Verify uninstallation callback and then delete from DB
 * @param {*} shop 
 * @returns 
 */
export const verifyAndDelete = async (shop) => {
  try {
    const config = await dbUtils.getConfigByShop(shop);
    if (!config || !config.accessToken) {
      console.log(`[verifyAndDelete] config not found for shop: ${shop}`);
      return;
    }
    const { accessToken } = config;
    let invalidated = false;
    
    const client = new Shopify.Clients.Rest(shop, accessToken);
    try {
      await client.get({ path: "webhooks/count" });
    } catch (err) {
      console.log("[verifyAndDelete] error ", err);
      invalidated = true;
    }

    // check if token is invalidated and set it
    if (invalidated) {
      await dbUtils.deleteShopInfo(shop);
      bugsnagClient.notify("shop deletion alert");
    } else {
      console.log("random uninstall called");
      // shopify random uninstall call. simply ignore
      // AND NOTIFY BUGSNAG
      bugsnagClient.notify("falsy uninstall triggered");
    }
  } catch (error) {
    console.log(`[verifyAndDelete] error: ${error}`);
  }
}
