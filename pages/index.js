import React, { useState, useEffect } from "react";
import {
  Page,
  Form,
  FormLayout,
  TextField,
  Button,
  Frame,
  Loading,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge-utils";

function Index() {
  const app = useAppBridge();
  //const aFetch = authenticatedFetch(app);
  const [dataplaneURL, setDataPlaneUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDataPlaneUrlStored, setIsDataPlaneStored] = useState(false);
  const [storedDataplaneUrl, setStoredDataPlaneUrl] = useState(
    "<rudderstack-dataplane-url>/v1/webhook?writeKey=<write-key>"
  );

  useEffect(() => {
    const asyncFetch = async () => {
      await fetchRudderWebhook();
    };
    asyncFetch();
  }, []);

  const handleSubmit = () => {
    // const submittedDataPlaneUrl = event.target[0].value;
    console.log("[dataplaneURL]", dataplaneURL);
    let formattedUrl = dataplaneURL;
    
    if (formattedUrl === "") {
      console.log("empty url");
      return;
    }

    if (formattedUrl.startsWith('http')) {
      const toReplace = formattedUrl.startsWith('https') ? 'https://' : 'http://';
      formattedUrl = formattedUrl.replace(toReplace, '');
    }
    console.log("url from Form Submit: ", formattedUrl);
    
    // TODO: show proper notification on success or error
    const onSuccess = (message) => {
      setStoredDataPlaneUrl(formattedUrl);
      setDataPlaneUrl("");
      console.log(message);
    };

    const onError = (errMessage) => {
      console.log(errMessage);
    };

    if (isDataPlaneUrlStored) {
      updateWebHooks(formattedUrl, onSuccess, onError);
    } else {
      registerWebHooks(formattedUrl, onSuccess, onError);
    }
  };

  async function fetchRudderWebhook() {
    console.log("inside fetch rudderwebhook");
    const token = await getSessionToken(app);
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
    if (webhook && webhook.address) {
      const storedDPUrl = new URL(webhook.address);
      storedDPUrl.searchParams.delete("shop");
      storedDPUrl.searchParams.delete("signature");
      storedDPUrl.searchParams.delete("topic");
      setStoredDataPlaneUrl(storedDPUrl.href);
      setIsDataPlaneStored(true);
    }
    setIsLoaded(true);
  }

  async function updateWebHooks(url, onSuccess, onError) {
    try {
      console.log("url from updateWebhooks: ", url);
      const token = await getSessionToken(app);
      const params = new URL(window.location.href).searchParams;
      const response = await fetch(`/update/webhooks?url=${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          shop: `${params.get("shop")}`,
        },
        method: "GET",
      });
      //const response = await aFetch("/api/checkouts");
      onSuccess("updated webhook successfully");
    } catch (err) {
        onError("update webhook failed", err.message);
    }
  }

  async function registerWebHooks(url, onSuccess, onError) {
    try {
      console.log("url from register webhooks function", url);
      const token = await getSessionToken(app);
      const params = new URL(window.location.href).searchParams;
      const response = await fetch(`/register/webhooks?url=${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          shop: `${params.get("shop")}`,
        },
        method: "GET",
      });
      onSuccess("registered webhook successfully");
      //const response = await aFetch("/api/checkouts");
    } catch (err) {
        onError("resgister webhook failed.", err.message);
    }
  }

  if (!isLoaded) {
    return (
      <div style={{ height: "100px" }}>
        <Frame>
          <Loading />
        </Frame>
      </div>
    );
  }
  return (
    <Page>
      <Form onSubmit={handleSubmit}>
        <FormLayout>
          <TextField
            value={dataplaneURL}
            onChange={(value) => setDataPlaneUrl(value)}
            label="Rudderstack Data Plane URL"
            type="text"
            placeholder={storedDataplaneUrl}
            helpText={
              <span>
                The Dataplane URL to which Shopify Events will be forwarded
              </span>
            }
          />
          <Button submit>{isDataPlaneUrlStored ? "Update" : "Submit"}</Button>
        </FormLayout>
      </Form>
    </Page>
  );
}

export default Index;
