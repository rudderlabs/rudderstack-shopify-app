const dotenv = require("dotenv");
const { default: Shopify, ApiVersion } = require("@shopify/shopify-api");
const API_KEY = process.env.SHOPIFY_API_KEY;
const API_SECRET_KEY = process.env.SHOPIFY_API_SECRET;
// const API_VERSION = ApiVersion.October20;

const initRudderSdk = async () => {
  const writeKey = document.getElementById("writeKey").value;
  console.log("WriteKey:",writeKey);
  console.log("DataPlaneUrl:",dataPlaneUrl);
  let code = "",
    shop = "";
  if (!writeKey) {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  if (!params.has("code") || !params.has("shop")) {
    return;
  }
  code = params.get("code");
  shop = params.get("shop");
  await getAccessToken(shop, API_KEY, API_SECRET_KEY, code);
};

const getAccessToken = async (shop, apiKey, secretKey, code) => {
  const url = `https://${shop}/admin/oauth/access_token`;
  const data = {
    client_id: apiKey,
    client_secret: secretKey,
    code: code,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      createScriptTag(data.access_token, shop);
    });
};

const createScriptTag = async (accessToken, shop) => {
  const url = `https://${shop}/admin/api/2021-10/script_tags.json`;
  const body = {
    script_tag: {
      event: "onload",
      src: "./dummy.js",
    },
  };
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
    .then((data) => console.log(data));
};

// class EventRepository {
//   constructor(options) {
//     this.shop = options.shop || "";
//     this.apiVersion = options.apiVersion || "";
//     this.shopifyAccessToken = options.accessToken || "";
//   }

//   processPostRequest(url, body) {
//     var xhttp = new XMLHttpRequest();
//     xhttp.onreadystatechange = function () {
//       if (this.readyState == 4 && this.status == 200) {
//         this.setOptions(this.responseText);
//       }
//     };
//     xhttp.open("POST", url, true);
//     xhttp.setRequestHeader("Content-type", "application/json");
//     if (this.shopifyAccessToken) {
//       xhttp.setRequestHeader("X-Shopify-Access-Token", this.shopifyAccessToken);
//     }
//     xhttp.send(body);
//   }
// }

export default initRudderSdk;
