import React from "react";
import ReactDOM from "react-dom";

import WebRTCTestPage from "./WebRTCTestPage";

const pageStyle: React.CSSProperties = {
  width: "100vw",
  height: "100vh"
};

ReactDOM.render(
  <div style={pageStyle}>
    <WebRTCTestPage />
  </div>,
  document.getElementById("root")
);
