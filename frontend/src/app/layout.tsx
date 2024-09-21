"use client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import store from "../store/store.ts";
import { ThemeProvider } from "@mui/material";
import { scoringTheme } from "../styles/themes.ts";
import React from "react";
import "@/styles/App.scss";

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>NYCU Archery System</title>
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={{ margin: 0 }}>
        <React.StrictMode>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={scoringTheme}>
              <Provider store={store}>{children}</Provider>
            </ThemeProvider>
            <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
          </QueryClientProvider>
        </React.StrictMode>
      </body>
    </html>
  );
}
