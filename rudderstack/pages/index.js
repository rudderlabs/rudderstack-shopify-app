import { Heading, Page } from "@shopify/polaris";
import WritekeyForm from "./writekeyform";
import Greet from "./Greet";

const Index = () => (
  <Page>
    <Greet />
    <Heading>Rudderstack🎉</Heading>
    <WritekeyForm />
  </Page>
);

export default Index;
