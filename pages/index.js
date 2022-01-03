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
    const submittedDataPlaneUrl = dataplaneURL;
    console.log("[dataplaneURL]", dataplaneURL);
    let formattedUrl = submittedDataPlaneUrl;
    if (formattedUrl.startsWith('http')) {
      const toReplace = formattedUrl.startsWith('https') ? 'https://' : 'http://';
      formattedUrl = formattedUrl.replace(toReplace, '');
    }
    console.log("url from Form Submit: ", formattedUrl);
    if (isDataPlaneUrlStored) {
      updateWebHooks(formattedUrl);
    } else {
      registerWebHooks(formattedUrl);
    }
    // TODO: add callbacks for onSuccess and onError
    // to handle failures properly
    setStoredDataPlaneUrl(formattedUrl);
    setDataPlaneUrl("");
  };

  // const handleDataPlaneUrlChange = useCallback(
  //   (value) => setDataPlaneUrl(value),
  //   []
  // );

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

  async function updateWebHooks(url) {
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
  }

  async function registerWebHooks(url) {
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
    //const response = await aFetch("/api/checkouts");
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
