"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./theme-provider";
import { AuthTransitionProvider } from "./auth/auth-transition-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AuthTransitionProvider>{children}</AuthTransitionProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
