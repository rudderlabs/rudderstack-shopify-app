import React from "react";
import initRudderSdk from "./initScriptTag";
// import initRudderSdk from "./initShopifyScriptTag";
// import createScriptTag from "./initShopifyScriptTag";

function WritekeyForm() {
  return (
    <div className="wrapper">
      <form>
        <fieldset>
          <label>
            <p>DataPlane URL:</p>
            <input name="name" placeholder="https://rudderxxxxx.dataplane.rudderstack.com" id="dp"/>
          </label>
        </fieldset>
        <fieldset>
          <label>
            <p>Write Key:</p>
            <input name="name" placeholder="1jrMnVy8KZrUIzDJz2EcvhHxT4Q" id="wk"/>
          </label>
        </fieldset>
        {/* <button type="submit">Submit</button> */}
        <button type="submit" onSubmit={initRudderSdk()}>Submit</button>
      </form>
    </div>
  );
}
export default WritekeyForm;
