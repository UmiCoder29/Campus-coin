"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./theme-provider";
import { AuthTransitionProvider } from "./auth/auth-transition-context";
import { CinematicPageTransitionProvider } from "./transitions/cinematic-page-transition";
import { PublicNavigationShell } from "./layout/public-navigation-shell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CinematicPageTransitionProvider>
          <AuthTransitionProvider>
            <PublicNavigationShell>{children}</PublicNavigationShell>
          </AuthTransitionProvider>
        </CinematicPageTransitionProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
