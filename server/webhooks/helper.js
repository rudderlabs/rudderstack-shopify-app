import Shopify, { DataType } from "@shopify/shopify-api";
import { topicMapping } from "../constants/topic-mapping";

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
 * Updates webhook subscription to specified address
 * @param {*} webhookId 
 * @param {*} webhookUrl 
 * @param {*} shop 
 */
export const updateWebhooks = async (webhookId, webhookUrl, shop, accessToken) => {
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
};
