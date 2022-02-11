import React, { useState, useEffect } from "react";
import {
  Heading,
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
import {
  updateWebHooks,
  registerWebHooks,
  fetchRudderWebhook,
  formatInputs,
} from "../webapp-util/utils";

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
  const [storedWriteKey, setStoredWritekey] = useState("");
  const [storedDataPlane, setStoredDataPlane] = useState("");
  const showNotification = (message) => {
    setNotificationActive(true);
    setNotificationMessage(message);
  };

  const performUpdates = (url, writeKey) => {
    setCurrentDataPlaneUrl(url);
    setCurrentWriteKey(writeKey);
    setStoredDataPlane(url);
    setStoredWritekey(writeKey);
  };

  const disableOrEnableButton = () => {
    const [formattedDataPlane, formattedWriteKey] 
      = formatInputs(currentDataplaneURL, currentWriteKey);
    return (
      isLoading ||
      isSubmitting ||
      currentDataplaneURL === "" ||
      currentWriteKey === "" ||
      (
        formattedWriteKey === storedWriteKey &&
        formattedDataPlane === storedDataPlane
      )
    );
  };

  useEffect(() => {
    const asyncFetch = async () => {
      const token = await getSessionToken(app);
      await fetchRudderWebhook(
        token,
        (storedDPUrl, savedWriteKey) => {
          performUpdates(storedDPUrl, savedWriteKey);
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
    setIsSubmitting(true);
    showNotification("Processing. Please wait.");
    console.log("[dataplaneURL]", currentDataplaneURL);

    const [formattedUrl, formattedWriteKey] = formatInputs(
      currentDataplaneURL,
      currentWriteKey
    );
    const rudderSourceWebhook = `${formattedUrl}/v1/webhook?writeKey=${currentWriteKey}`;

    console.log("formatted url from Form: ", formattedUrl);
    console.log("rudder source webhook: ", rudderSourceWebhook);

    const onSuccess = (message) => {
      performUpdates(formattedUrl, formattedWriteKey);
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
      await updateWebHooks(rudderSourceWebhook, token, onSuccess, onError);
    } else {
      await registerWebHooks(rudderSourceWebhook, token, onSuccess, onError);
    }
    console.log("check ", isSubmitting);
  };

  if (isLoading) {
    return (
      <Frame>
        <Loading />
      </Frame>
    );
  }

  return (
    <Page>
      <Heading>Configure RudderStack</Heading>
      <Form onSubmit={handleSubmit}>
        <FormLayout>
          <TextField
            value={currentDataplaneURL}
            onChange={(value) => setCurrentDataPlaneUrl(value)}
            label="Data Plane URL"
            type="text"
            placeholder="https://mydataplane.rudderlabs.com"
            helpText={
              <span>
                The RudderStack data plane URL to which Shopify events will be forwarded
              </span>
            }
          />
          <TextField
            value={currentWriteKey}
            onChange={(value) => setCurrentWriteKey(value)}
            label="Write Key"
            type="text"
            placeholder="1weq35iqxRkpUXHgDgYo3g33mg"
            helpText={
              <span>
                The write key of the Shopify source created on the RudderStack Dashboard
              </span>
            }
          />
          <Button
            disabled={disableOrEnableButton()}
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
