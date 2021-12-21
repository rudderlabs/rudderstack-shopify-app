import { Heading, Page } from "@shopify/polaris";
import WritekeyForm from "./writekeyform";
import Greet from "./Greet";
import initRudderSdk from "./initScriptTag";

const Index = () => (
  <Page>
    <Greet />
    <Heading>Rudderstack🎉</Heading>
    <WritekeyForm />
  </Page>
);

export default Index;
