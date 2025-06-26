import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// The '!' at the end tells TypeScript "this expression will not be null".
const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
