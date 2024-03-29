import React from "react";
import ReactDOM from "react-dom/client";
import reportWebVitals from "./reportWebVitals";
import AppAudio from "./AppAudio";
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
  </>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
