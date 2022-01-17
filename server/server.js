import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import appContext from "./state/app-state";
import {
  registerRudderWebhooks,
  updateRudderWebhooks,
  fetchRudderWebhook,
} from "./service/process";
import { DBConnector } from "./dbUtils/dbConncetor";
import { dbUtils } from "./dbUtils/helpers";

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();
const dbClient = DBConnector.setConfigAndConnect().getClient();

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

////////// create table in db if already not present
dbUtils.createTableIfNotExists(dbClient)
  .then(() => console.log("success"))
  .catch(console.log);

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      accessMode: "offline",
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        const host = ctx.query.host;
        ACTIVE_SHOPIFY_SHOPS[shop] = scope;
        console.log(`The token is ${accessToken}`);
        console.log(`app state id ${appContext.id}`);
        appContext.state.set(shop, {
          scope,
          accessToken,
          client: new Shopify.Clients.Rest(shop, accessToken),
        });
        ///// persist shop related information in DB
        await dbUtils.insertIntoTable(dbClient, shop, accessToken);

        const response = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: `/webhooks?shop=${shop}`,
          topic: "APP_UNINSTALLED",
          webhookHandler: async (topic, shop, body) =>
            delete ACTIVE_SHOPIFY_SHOPS[shop],
        });

        if (!response.success) {
          console.log(
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
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  router.get("/register/webhooks", async (ctx) => {
    verifyRequest({ returnHeader: true });
    try {
      const dataplaneUrl = ctx.request.query.url;
      const shop = ctx.get("shop");
      await registerRudderWebhooks(dataplaneUrl, shop);
      ctx.res.statusCode = 200;
    } catch (error) {
      console.log(`Failed to process webhook registry: ${error}`);
      ctx.res.statusCode = 500;
    }
    return ctx;
  });

  router.get("/update/webhooks", async (ctx) => {
    verifyRequest({ returnHeader: true });
    try {
      const dataplaneUrl = ctx.request.query.url;
      const shop = ctx.get("shop");
      updateRudderWebhooks(dataplaneUrl, shop);
      ctx.res.statusCode = 200;
    } catch (error) {
      console.log(`Failed to process webhook updates: ${error}`);
      ctx.res.statusCode = 500;
    }
    return ctx;
  });

  router.get("/fetch/dataplane", async (ctx) => {
    verifyRequest({ returnHeader: true });
    try {
      const shop = ctx.get("shop");
      const webhook = await fetchRudderWebhook(shop);
      ctx.body = webhook;
      ctx.res.statusCode = 200;
    } catch (error) {
      console.log(`Failed to process webhook updates: ${error}`);
      ctx.res.statusCode = 500;
    }
    return ctx;
  });

  router.get('/health', ctx => {
    ctx.response.body = "OK";
    ctx.status = 200;
    return ctx;
  })

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", async (ctx) => {
    const shop = ctx.query.shop;

    // This shop hasn't been seen yet, go through OAuth to create a session
    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });

  server.use(router.allowedMethods());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});