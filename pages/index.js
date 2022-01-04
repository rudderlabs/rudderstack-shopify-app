import React, { useState, useEffect } from "react";
import {
  Page,
  Form,
  FormLayout,
  TextField,
  Button,
  Frame,
  Loading,
  Toast
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge-utils";
import { updateWebHooks, registerWebHooks, fetchRudderWebhook } from "./utils";

function Index() {
  const app = useAppBridge();
  //const aFetch = authenticatedFetch(app);
  const [dataplaneURL, setDataPlaneUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDataPlaneUrlStored, setIsDataPlaneStored] = useState(false);
  const [storedDataplaneUrl, setStoredDataPlaneUrl] = useState(
    "<rudderstack-dataplane-url>/v1/webhook?writeKey=<write-key>"
  );
  const [notificationActive, setNotificationActive] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const showNotification = (message) => {
    setNotificationActive(true);
    setNotificationMessage(message);
  };

  useEffect(() => {
    const asyncFetch = async () => {
      const token = await getSessionToken(app);
      await fetchRudderWebhook(token, (storedDPUrl) => {
        setStoredDataPlaneUrl(storedDPUrl.href);
        setIsDataPlaneStored(true);
      }, (errMessage) => {
        showNotification(errMessage);
      });
      setIsLoaded(true);
    };
    asyncFetch();
  }, []);

  const handleSubmit = async () => {
    // const submittedDataPlaneUrl = event.target[0].value;
    console.log("[dataplaneURL]", dataplaneURL);
    let formattedUrl = dataplaneURL;

    if (formattedUrl.startsWith('http')) {
      const toReplace = formattedUrl.startsWith('https') ? 'https://' : 'http://';
      formattedUrl = formattedUrl.replace(toReplace, '');
    }
    console.log("url from Form Submit: ", formattedUrl);
    
    const onSuccess = (message) => {
      setStoredDataPlaneUrl(formattedUrl);
      setDataPlaneUrl("");
      console.log(message);
      showNotification(message);
    };

    const onError = (errMessage) => {
      console.log(errMessage);
      showNotification(errMessage);
    };


    // TODO: should session token be stored in state on app component mount?
    const token = await getSessionToken(app);
    console.log("token fetched", token);
    if (isDataPlaneUrlStored) {
      updateWebHooks(formattedUrl, token, onSuccess, onError);
    } else {
      registerWebHooks(formattedUrl, token, onSuccess, onError);
    }
  };

  // async function fetchRudderWebhook() {
  //   console.log("inside fetch rudderwebhook");
  //   const token = await getSessionToken(app);
  //   console.log(`The session token is: ${token}`);
  //   const params = new URL(window.location.href).searchParams;
  //   const response = await fetch(`/fetch/dataplane`, {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //       shop: `${params.get("shop")}`,
  //     },
  //     method: "GET",
  //   });
  //   const webhook = await response.json();
  //   if (webhook && webhook.address) {
  //     const storedDPUrl = new URL(webhook.address);
  //     storedDPUrl.searchParams.delete("shop");
  //     storedDPUrl.searchParams.delete("signature");
  //     storedDPUrl.searchParams.delete("topic");
  //     setStoredDataPlaneUrl(storedDPUrl.href);
  //     setIsDataPlaneStored(true);
  //   }
  //   setIsLoaded(true);
  // }

  if (!isLoaded) {
    return (
      <Frame>
        <Loading />
      </Frame>
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
          <Button 
            disabled={dataplaneURL === ""}
            submit
          >{isDataPlaneUrlStored ? "Update" : "Submit"}</Button>
        </FormLayout>
      </Form>
      <Frame>
        {
          notificationActive
          && 
          <Toast content={notificationMessage} onDismiss={() => setNotificationActive(false)} />
        }
      </Frame>
    </Page>
  );
}

export default Index;
