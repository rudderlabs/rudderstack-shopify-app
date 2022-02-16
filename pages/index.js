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
  Banner
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
  const [showBanner, setShowBanner] = useState(true);
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
          // console.log("[onSuccess] isConfigPresent ", isConfigPresent);
        },
        (errMessage) => {
          showNotification(errMessage);
          // console.log("[onError] isConfigPresent ", isConfigPresent);
        }
      );
      // console.log("isConfigPresent ", isConfigPresent);
      setIsLoading(false);
    };
    asyncFetch();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    showNotification("Processing. Please wait.");
    // console.log("[dataplaneURL]", currentDataplaneURL);

    const [formattedUrl, formattedWriteKey] = formatInputs(
      currentDataplaneURL,
      currentWriteKey
    );
    const rudderSourceWebhook = `${formattedUrl}/v1/webhook?writeKey=${currentWriteKey}`;

    // console.log("formatted url from Form: ", formattedUrl);
    // console.log("rudder source webhook: ", rudderSourceWebhook);

    const onSuccess = (message) => {
      performUpdates(formattedUrl, formattedWriteKey);
      setIsConfigPresent(true);
      // console.log(message);
      showNotification(message);
      setIsSubmitting(false);
    };

    const onError = (errMessage) => {
      console.log(errMessage);
      showNotification(errMessage);
      setIsSubmitting(false);
    };

    const token = await getSessionToken(app);
    // console.log("token fetched", token);
    if (isConfigPresent) {
      await updateWebHooks(rudderSourceWebhook, token, onSuccess, onError);
    } else {
      await registerWebHooks(rudderSourceWebhook, token, onSuccess, onError);
    }
    // console.log("check ", isSubmitting);
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
      {
        showBanner && 
        (
          <Banner title="Configuration Steps" status="info" onDismiss={() => setShowBanner(false)}>
            <ol>
              <li>Log into your <a href="https://app.rudderstack.com/" target="_blank" rel="noopener noreferrer">RudderStack dashboard</a>. Note the data plane URL.</li>
              <li>Create a new Shopify source. Note the write key present in the source details page. Refer to <a href="https://www.rudderstack.com/docs/get-started/installing-and-setting-up-rudderstack/sending-test-events/#get-the-source-write-key" target="_blank" rel="noopener noreferrer">this</a></li> guide to get the write key.
              <li>Connect the source to an existing or new destination. For more details, refer to our <a href="https://www.rudderstack.com/docs/connections/adding-source-and-destination-rudderstack/" target="_blank" rel="noopener noreferrer">documentation.</a></li>
              <li>Return to your Shopify store and click on the RudderStack app you installed.</li>
              <li>Enter the data plane URL and the source write key you copied above and click on <strong>Submit</strong>. For more details, refer to our <a href="https://www.rudderstack.com/docs/faqs/#2-what-is-a-data-plane-url-where-do-i-get-it" target="_blank" rel="noopener noreferrer">faq</a>page</li>
              <li>You can also update these fields later with a different write key and data plane URL and click on <strong>Update</strong>.</li>
            </ol>
            <p><strong>You are all set!</strong></p>
            <p>For more information on how to create source and destination, visit our <a href="https://www.rudderstack.com/docs/connections/adding-source-and-destination-rudderstack/" target="_blank" rel="noopener noreferrer">documentation</a>
            </p>
          </Banner>
        )
      }
      <br/>
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