/**
 * uril function to update webhooks on changing data plane url or writeKey
 * @param {*} url 
 * @param {*} token 
 * @param {*} onSuccess 
 * @param {*} onError 
 */
export const updateWebHooks = async (url, token, onSuccess, onError) => {
  try {
    console.log("url from updateWebhooks: ", url);
    const params = new URL(window.location.href).searchParams;
    const response = await fetch(`/update/webhooks?url=${url}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        shop: `${params.get("shop")}`,
      },
      method: "GET",
    });
    onSuccess("Updated webhook");
  } catch (err) {
    onError(`Update webhook Failed. ${err.message}`);
  }
};

/**
 * util function to register webhook for the first time
 * @param {*} url 
 * @param {*} token 
 * @param {*} onSuccess 
 * @param {*} onError 
 */
export const registerWebHooks = async (url, token, onSuccess, onError) => {
  try {
    console.log("url from register webhooks function", url);
    const params = new URL(window.location.href).searchParams;
    const response = await fetch(`/register/webhooks?url=${url}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        shop: `${params.get("shop")}`,
      },
      method: "GET",
    });
    onSuccess("Registered webhook");
  } catch (err) {
    onError(`Register webhook Failed. ${err.message}`);
  }
};

/**
 * util function to parse writeKey and dataplane URL
 * from registered webhook address
 * @param {*} address 
 * @returns 
 */
const parseInfoFromAddress = (address) => {
  const storedDPUrl = new URL(address);
    console.log("storedDPURL", storedDPUrl);
    const savedWriteKey = storedDPUrl.searchParams.get("writeKey");
    const savedDataPlaneUrl = storedDPUrl.origin;
    return [savedDataPlaneUrl, savedWriteKey];
};

/**
 * util function to format inputs from the Form
 * @param {*} url 
 * @param {*} writeKey 
 * @returns 
 */
export const formatInputs = (url, writeKey) => {
  let formattedUrl = url.trim();
  if (!(formattedUrl.startsWith('http://') || formattedUrl.startsWith('https://'))) {
    formattedUrl = `https://${formattedUrl}`;
  }
  if (formattedUrl.endsWith('/')) {
    formattedUrl = formattedUrl.slice(0, formattedUrl.length - 1);
  }
  return [formattedUrl, writeKey.trim()];
}

/**
 * util function to fetch registered rudderSourceWebhook on component mount
 * @param {*} token 
 * @param {*} onConfigPresent 
 * @param {*} onError 
 */
export const fetchRudderWebhook = async (token, onConfigPresent, onError) => {
  try {
    console.log("inside fetch rudderwebhook");
    console.log(`The session token is: ${token}`);
    const params = new URL(window.location.href).searchParams;
    const response = await fetch(`/fetch/dataplane`, {
      headers: {
        Authorization: `Bearer ${token}`,
        shop: `${params.get("shop")}`,
      },
      method: "GET",
    });
    const webhook = await response.json();
    console.log("[fetchRudderWebhook] webhook", webhook);
    if (webhook && webhook.address) {
      // const storedDPUrl = new URL(webhook.address);
      // storedDPUrl.searchParams.delete("shop");
      // storedDPUrl.searchParams.delete("signature");
      // storedDPUrl.searchParams.delete("topic");
      // storedDPUrl.searchParams.delete("writeKey");
      const [storedDPUrl, savedWriteKey] = parseInfoFromAddress(webhook.address);
      console.log("[fetchRudderWebhook] parsedInfo", storedDPUrl, savedWriteKey);
      onConfigPresent(storedDPUrl, savedWriteKey);
    } else {
      console.log("[fetchRudderWebhook] no existing webhook found");
    }
  } catch (err) {
    console.log("[fetchRudderWebhook] ", err);
    onError("Error while fetching Rudder webhooks");
  }
}