<p align="center">
  <a href="https://rudderstack.com/">
    <img src="https://user-images.githubusercontent.com/59817155/121357083-1c571300-c94f-11eb-8cc7-ce6df13855c9.png">
  </a>
</p>

<p align="center"><b>The Customer Data Platform for Developers</b></p>

<p align="center">
  <b>
    <a href="https://rudderstack.com">Website</a>
    ·
    <a href="">Documentation</a>
    ·
    <a href="https://rudderstack.com/join-rudderstack-slack-community">Community Slack</a>
  </b>
</p>

---

# RudderStack app on Shopify

This application lets you connect your Shopify store with RudderStack. Use it to track event-level data from Shopify and send it to your preferred tooling platforms via RudderStack.

## Overview

With this application, you can track near real-time events both via the Shopify store (client-side) or webhooks (server-side) to capture various customer touchpoints related to your users' activities in Shopify. Then, route this data to your preferred RudderStack destination to get granular insights into your customers' journey, power your sales and marketing workflows, and inform your overall decision-making.

## Features
The Rudderstack Shopify app utilizes webhook subscription to subscribe to server side events as well as uses a smart tracking script to capture client side events from the store. This way, 100% accurate data about your store events is collected at Rudderstack


## Getting started
### Pre-requisites
1. shopify-cli installed in local <br>
2. Login to shopify account using `shopify login` <br>

To run the app locally, following are the steps:<br>
1. npm install <br>
2. Add .env with the `DB` credentials, `SHOPIFY_API_SECRET`, `SHOPIFY_API_KEY`, `BUGSNAG_KEY` and set `MODE=local`
3. shopify app serve<br>

## Contribute

We would love to see you contribute to RudderStack Shopify app. Get more information on how to contribute [**here**](CONTRIBUTING.md).

## License

The RudderStack Shopify app is released under the [**MIT License**](https://opensource.org/licenses/MIT).
