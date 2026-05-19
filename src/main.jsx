import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          fontSize: "13px",
          borderRadius: "10px",
          background: "#1a1523",
          color: "#ffffff",
          boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
        },
      }}
    />
  </React.StrictMode>
);
