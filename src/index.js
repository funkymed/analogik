import React from "react";
import ReactDOM from "react-dom/client";
import AppAudio from "./AppAudio";

// eslint-disable-next-line no-unused-vars
import DisableDevtool from "disable-devtool";

DisableDevtool({
  disableMenu: true,
  interval: 300,
  clearLog: true,
  url: "https://pouet.net",
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <>
    <AppAudio />
  </>,
);
