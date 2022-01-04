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
    //const response = await aFetch("/api/checkouts");
    onSuccess("Updated webhook");
  } catch (err) {
    onError(`Update webhook Failed. ${err.message}`);
  }
};

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
    //const response = await aFetch("/api/checkouts");
  } catch (err) {
    onError(`Register webhook Failed. ${err.message}`);
  }
};

export const fetchRudderWebhook = async (token, onSuccess, onError) => {
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
      const storedDPUrl = new URL(webhook.address);
      storedDPUrl.searchParams.delete("shop");
      storedDPUrl.searchParams.delete("signature");
      storedDPUrl.searchParams.delete("topic");
      onSuccess(storedDPUrl);
    }
  } catch (err) {
    onError(err.message);
  }
}