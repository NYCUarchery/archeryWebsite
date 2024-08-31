"use client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import store from "../store/store.ts";
import { ThemeProvider } from "@mui/material";
import { scoringTheme } from "../style/themes.ts";
import React from "react";

const queryClient = new QueryClient();

export default function RootTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={scoringTheme}>
          <Provider store={store}>{children}</Provider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      </QueryClientProvider>
    </React.StrictMode>
  );
}
