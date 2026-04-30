import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import App from "./App";
import "antd/dist/reset.css";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#466a85",
            colorInfo: "#466a85",
            colorSuccess: "#00a260",
            colorError: "#b23a48",
            borderRadius: 14,
            fontFamily: "'Bahnschrift', 'Trebuchet MS', 'Segoe UI', sans-serif",
            colorBgLayout: "#eef4f8",
            colorBgContainer: "rgba(255, 255, 255, 0.96)",
            colorText: "#1f2734",
            colorTextSecondary: "#6c7280",
            colorBorder: "rgba(21, 35, 50, 0.12)",
            boxShadowSecondary: "0 22px 48px rgba(31, 39, 52, 0.12)"
          },
          components: {
            Card: {
              headerBg: "transparent"
            },
            Menu: {
              itemSelectedBg: "rgba(70, 106, 133, 0.12)",
              itemSelectedColor: "#315068"
            },
            Table: {
              headerBg: "#f7fafc",
              headerColor: "#6c7280",
              rowHoverBg: "rgba(70, 106, 133, 0.05)"
            },
            Tag: {
              borderRadiusSM: 999
            }
          }
        }}
      >
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
