import React, { useState, useEffect } from "react";
import {
  Page,
  Form,
  FormLayout,
  TextField,
  Button,
  Frame,
  Loading,
  Toast,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge-utils";
import { updateWebHooks, registerWebHooks, fetchRudderWebhook, formatInputs } from "./utils";

function Index() {
  const app = useAppBridge();
  //const aFetch = authenticatedFetch(app);
  const [currentDataplaneURL, setCurrentDataPlaneUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfigPresent, setIsConfigPresent] = useState(false);
  const [currentWriteKey, setCurrentWriteKey] = useState("");
  const [notificationActive, setNotificationActive] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const showNotification = (message) => {
    setNotificationActive(true);
    setNotificationMessage(message);
  };

  useEffect(() => {
    const asyncFetch = async () => {
      const token = await getSessionToken(app);
      await fetchRudderWebhook(
        token,
        (storedDPUrl, savedWriteKey) => {
          setCurrentDataPlaneUrl(storedDPUrl);
          setCurrentWriteKey(savedWriteKey);
          setIsConfigPresent(true);
          console.log("[onSuccess] isConfigPresent ", isConfigPresent);
        },
        (errMessage) => {
          showNotification(errMessage);
          console.log("[onError] isConfigPresent ", isConfigPresent);
        }
      );
      console.log("isConfigPresent ", isConfigPresent);
      setIsLoading(false);
    };
    asyncFetch();
  }, []);

  const handleSubmit = async () => {
    // const submittedDataPlaneUrl = event.target[0].value;
    setIsSubmitting(false);
    console.log("[dataplaneURL]", currentDataplaneURL);

    const [formattedUrl, formattedWriteKey] = formatInputs(currentDataplaneURL, currentWriteKey);
    const rudderSourceWebhook = `${formattedUrl}/v1/webhook?writeKey=${currentWriteKey}`;
    
    console.log("formatted url from Form: ", formattedUrl);
    console.log("rudder source webhook: ", rudderSourceWebhook);

    const onSuccess = (message) => {
      setCurrentDataPlaneUrl(formattedUrl);
      setCurrentWriteKey(formattedWriteKey);
      setIsConfigPresent(true);
      console.log(message);
      showNotification(message);
      setIsSubmitting(false);
    };

    const onError = (errMessage) => {
      console.log(errMessage);
      showNotification(errMessage);
      setIsSubmitting(false);
    };

    // TODO: should session token be stored in state on app component mount?
    // token seems to be rotated every 60 seconds.
    const token = await getSessionToken(app);
    console.log("token fetched", token);
    if (isConfigPresent) {
      updateWebHooks(rudderSourceWebhook, token, onSuccess, onError);
    } else {
      registerWebHooks(rudderSourceWebhook, token, onSuccess, onError);
    }
  };

  if (isLoading) {
    return (
      <Frame>
        <Loading />
      </Frame>
    );
  }
  console.log("[down] isConfigPresent ", isConfigPresent);

  return (
    <Page>
      <Form onSubmit={handleSubmit}>
        <FormLayout>
          <TextField
            value={currentDataplaneURL}
            onChange={(value) => setCurrentDataPlaneUrl(value)}
            label="Rudderstack Data Plane URL"
            type="text"
            placeholder="Data Plane URL"
            helpText={
              <span>
                The Dataplane URL to which Shopify Events will be forwarded
              </span>
            }
          />
          <TextField
            value={currentWriteKey}
            onChange={(value) => setCurrentWriteKey(value)}
            label="Source WriteKey"
            type="text"
            placeholder="writekey"
            helpText={
              <span>
                WriteKey for the Source created on RudderStack Dashboard
              </span>
            }
          />
          <Button
            disabled={
              isLoading ||
              isSubmitting ||
              currentDataplaneURL === "" ||
              currentWriteKey === ""
            }
            submit
          >
            {isConfigPresent ? "Update" : "Submit"}
          </Button>
        </FormLayout>
      </Form>
      <Frame>
        {notificationActive && (
          <Toast
            content={notificationMessage}
            onDismiss={() => setNotificationActive(false)}
          />
        )}
      </Frame>
    </Page>
  );
}

export default Index;
