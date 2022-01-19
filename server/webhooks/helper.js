import Shopify, { DataType } from "@shopify/shopify-api";
import { topicMapping } from "../constants/topic-mapping";
import { dbUtils } from "../dbUtils/helpers";
import appContext from "../state/app-state";

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
  try {
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
  } catch (error) {
    console.log(
      `Failed to register webhook - ${webhookUrl}, topic - ${topic} shop - ${shop}: Error ${error}`
    );
  }
};
/**
 * Updates webhook subscription to specified address
 * @param {*} webhookId 
 * @param {*} webhookUrl 
 * @param {*} shop 
 */
export const updateWebhooks = async (webhookId, webhookUrl, shop, accessToken) => {
  try {
    console.log("[updateWebhooks] AppContext", appContext);
    
    // const rows = await dbUtils.getDataByShop(dbClient, shop);
    // console.log("fetched from DB", rows);

    // const shopContext = appContext.state.get(shop);
    // const client = shopContext.client;
    const client = new Shopify.Clients.Rest(shop, accessToken);

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
    return response.body.webhook.id;
  } catch (error) {
    console.log(
      `Failed to update webhook - ${webhookUrl}, shop - ${shop}: Error ${error}`
    );
  }
};

/**
 * Returns the list of all webhook subscription objects
 * @returns {Array}
 */
export const fetchWebhooks = async (shop) => {
  let webhooks;
  try {
    console.log("[fetchWebhooks] AppContext", appContext);
    const shopContext = appContext.state.get(shop);
    const client = shopContext.client;
    const response = await client.get({
      path: "webhooks",
      type: DataType.JSON,
    });

    webhooks = response.body.webhooks;
  } catch (error) {
    console.log(`Failed to fetch webhooks: Error ${error}`);
  }
  if (webhooks && webhooks.length > 0) {
    return webhooks;
  }
  return webhooks;
};

/**
 * Removes the webhook subscription objects for the provided ids
 * @param {*} webhookIds
 */
export const removeWebhooks = async (webhookId, shop) => {
  console.log("[removeWebhooks] AppContext", appContext);
  const shopContext = appContext.state.get(shop);
  const client = shopContext.client;
  try {
    const response = await client.delete({
      path: `webhooks/${webhookId}`,
      type: DataType.JSON,
    });
  } catch (error) {
    console.log(`Failed to remove webhooks: Error ${error.messsage}`);
  }
};
