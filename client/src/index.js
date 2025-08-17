// client/src/index.js

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { NotificationProvider } from './components/Notification'; // Import NotificationProvider

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {/* Wrap your entire App with the NotificationProvider */}
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </React.StrictMode>
);
