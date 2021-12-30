import React, { useCallback, useState, useEffect } from "react";
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
  const [dataplaneURl, setDataPlaneUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [dataPlaneUrlStored, setDataPlaneStored] = useState(false);
  const [storedDataplaneUrl, setStoredDataPlaneUrl] = useState(
    "rudderstack-dataplane-url"
  );

  useEffect(() => {
    const asyncFetch = async () => {
      await fetchRudderWebhook();
    };
    asyncFetch();
  }, []);

  const handleSubmit = (event) => {
    const submittedDataPlaneUrl = event.target[0].value;
    console.log(dataPlaneUrlStored);
    if (dataPlaneUrlStored) {
      updateWebHooks(submittedDataPlaneUrl);
    } else {
      registerWebHooks(submittedDataPlaneUrl);
    }
  };

  const handleDataPlaneUrlChange = useCallback(
    (value) => setDataPlaneUrl(value),
    []
  );

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
      setDataPlaneStored(true);
    }
    setIsLoaded(true);
  }

  async function updateWebHooks(url) {
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
            value={dataplaneURl}
            onChange={handleDataPlaneUrlChange}
            label="Rudderstack Data Plane URL"
            type="text"
            placeholder={storedDataplaneUrl}
            helpText={
              <span>
                The Dataplane URL to which Shopify Events will be forwarded
              </span>
            }
          />
          <Button submit>{dataPlaneUrlStored ? "Update" : "Submit"}</Button>
        </FormLayout>
      </Form>
    </Page>
  );
}

export default Index;
