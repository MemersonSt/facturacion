"use client";

import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

import { muiTheme } from "@/theme/mui-theme";

type AppMuiProviderProps = {
  children: ReactNode;
};

export function AppMuiProvider({ children }: AppMuiProviderProps) {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
    </StyledEngineProvider>
  );
}
