import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import mongoose from "mongoose";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import bodyParser from "koa-body-parser";
import {
  fetchRudderWebhookUrl,
  registerWebhooksAndScriptTag,
  updateWebhooksAndScriptTag
} from "./service/process";
import { DBConnector } from "./dbUtils/dbConnector";
import { dbUtils } from "./dbUtils/helpers";
import { verifyAndDelete } from "./webhooks/helper";
import { createServiceApp } from "@rudder/rudder-service";
import serviceOptions from "./monitoring/serviceOptions";
import { bugsnagClient, logger } from "@rudder/rudder-service";
import { serviceRoutes } from '@rudder/rudder-service';

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();

let dbConnected = false;
DBConnector.setConfigFromEnv()
  .connect()
  .then(() => {
    dbConnected = true;
    logger.info("Connected to DB successfully");
  })
  .catch((err) => {
    logger.error(`DB connection Failed: ${err}`);
    process.exit(1);
  });

const REQUIRED_SCOPES = [
  "write_products",
  "write_customers",
  "write_draft_orders",
  "read_checkouts",
  "write_checkouts",
  "read_orders",
  "write_orders",
  "read_fulfillments",
  "write_fulfillments",
  "read_script_tags",
  "write_script_tags"
];

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: REQUIRED_SCOPES,
  HOST_NAME: process.env.HOST.replace(/https:\/\/|\/$/g, ""),
  API_VERSION: ApiVersion.October20,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(async () => {
  // const server = new Koa();
  const server = createServiceApp(serviceOptions);
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(bodyParser());
  server.use(serviceRoutes());
  server.use(
    createShopifyAuth({
      accessMode: "offline",
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        const host = ctx.query.host;
        ACTIVE_SHOPIFY_SHOPS[shop] = scope;
        logger.debug(`The token is ${accessToken}`);
        logger.debug("inside Shopify afterAuth");

        bugsnagClient.notify("TEST ALERT");

        try {
          const currentShopInfo = await dbUtils.getDataByShop(shop);
          if (currentShopInfo) {
            // update only access token if shop entry exists
            currentShopInfo.config.accessToken = accessToken;
            await dbUtils.updateShopInfo(shop, currentShopInfo);
          } else {
            // make new entry for shop info
            const newShopInfo = {
              shopname: shop,
              config: {
                accessToken,
              },
            };
            logger.info("inserting shop info");
            await dbUtils.insertShopInfo(newShopInfo);
          }
        } catch (err) {
          // TODO: setup alerts
          logger.error(`error while querying DB: ${err}`);
        }

        const response = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: `/webhooks?shop=${shop}`,
          topic: "APP_UNINSTALLED",
          webhookHandler: async (topic, shop, body) => {
            delete ACTIVE_SHOPIFY_SHOPS[shop];
            logger.info("this should be called on uninstall");
            // verifyAndDelete(shop);
          },
        });

        logger.debug(`RESPONSE: ${JSON.stringify(response)}`);

        if (!response.success) {
          logger.error(
            `Failed to register APP_UNINSTALLED webhook: ${response.result}`
          );
        }

        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}&host=${host}`);
      },
    })
  );

  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  router.post("/webhooks", async (ctx) => {
    try {
      logger.info("inside /webhooks route");
      logger.info(`CTX BODY :${JSON.stringify(ctx.request.body)}`);
      logger.info(`CTX QUERY: ${JSON.stringify(ctx.request.query)}`);
      logger.info(`CTX: ${JSON.stringify(ctx)}`);
      
      const { shop } = ctx.request.query;
      await verifyAndDelete(shop);
      delete ACTIVE_SHOPIFY_SHOPS[shop];
      logger.info(`Webhook processed, returned status code 200`);
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      ctx.body = "OK";
      ctx.status = 200;
      return ctx;
    } catch (error) {
      logger.error(`Call to /webhooks failed: ${error}`);
      ctx.status = 500;
    }
  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  router.get("/register/webhooks", verifyRequest({ 
    returnHeader: true, accessMode: 'offline', }), async (ctx) => {
    const rudderWebhookUrl = ctx.request.query.url
    const shop = ctx.get("shop");

    try {
      await registerWebhooksAndScriptTag(rudderWebhookUrl, shop);
      ctx.body = { success: true };
      ctx.status = 200;
    } catch (err) {
      logger.error(`error in /register/webhooks ${err}`);
      ctx.body = { success: false, error: err.message };
      ctx.status = 500;
    }
    return ctx;
  });

  router.get("/update/webhooks", verifyRequest({ 
    returnHeader: true, accessMode: 'offline', }), async (ctx) => {
    try {
      const rudderWebhookUrl = ctx.request.query.url;
      const shop = ctx.get("shop");
      await updateWebhooksAndScriptTag(rudderWebhookUrl, shop);
      ctx.body = { success: true };
      ctx.status = 200;
    } catch (err) {
      logger.error(`error in /update/webhooks ${err}`);
      ctx.body = { success: false, error: err.message };
      ctx.status = 500;
    }
    return ctx;
  });

  router.get(
    "/fetch/rudder-webhook", verifyRequest({
      accessMode: 'offline',
       returnHeader: true
    }), async (ctx) => {
    try {
      const shop = ctx.get("shop");
      const rudderWebhookUrl = await fetchRudderWebhookUrl(shop);
      logger.debug(`FROM FETCH ROUTE :${rudderWebhookUrl}`);
      ctx.body = {
        rudderWebhookUrl: rudderWebhookUrl,
      };
      ctx.status = 200;
    } catch (error) {
      logger.error(`Failed to fetch dataplane: ${error}`);
      ctx.status = 500;
    }
    return ctx;
  });

  // health endpoint is exposed by rudder-service
  // this route is for kubernetes readiness and liveness probes
  router.get("/ready", (ctx) => {
    let response = "Not ready";
    let status = 400;
    if (dbConnected && mongoose.connection.readyState === 1) {
      response = "OK";
      status = 200;
    }
    ctx.body = response;
    ctx.status = status;
    return ctx;
  });

  // GDPR mandatory route. Deleting shop information here
  router.post("/shop/redact", verifyRequest({
     returnHeader: true, accessMode: 'offline', }), async ctx => {
    const { shop_domain } = ctx.request.body;
    await dbUtils.deleteShopInfo(shop_domain);
    ctx.body = "OK";
    ctx.status = 200;
    return ctx;
  });

  // GDPR mandatory route. RudderStack is not storing any customer releated
  // information.
  router.post("/customers/data_request", verifyRequest({ 
    returnHeader: true, accessMode: 'offline', }), async ctx => {
    ctx.body = "OK";
    ctx.status = 200;
    return ctx;
  });
  
  // GDPR mandatory route. RudderStack is not storing any customer releated
  // information.
  router.post("/customers/redact", verifyRequest({ 
    returnHeader: true, accessMode: 'offline', }), async ctx => {
    ctx.body = "OK";
    ctx.status = 200;
    return ctx;
  });

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", async (ctx) => {
    
    logger.debug("INSIDE THIS ROUTE");
    
    const shop = ctx.query.shop;
    if (!shop) {
      ctx.body = "Shop info is required";
      ctx.status = 400;
      return ctx;
    }

    // This shop hasn't been seen yet, go through OAuth to create a session
    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined || !ctx.query.host) {
      logger.debug("redirecting to auth/shop");
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      logger.debug("going to handleRequest");
      await handleRequest(ctx);
    }
  });

  server.use(router.allowedMethods());
  server.use(router.routes());
  server.listen(port, () => {
    logger.info(`> Ready on http://localhost:${port}`);
  });
});
