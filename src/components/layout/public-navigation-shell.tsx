"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import FloatingMenu, { MenuItem } from "@/components/ui/liquid-morph-floating-menu";
import {
  useCinematicNavigation,
  CINEMATIC_ROUTES,
} from "@/components/transitions/cinematic-page-transition";

export function PublicNavigationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { cinematicNavigate } = useCinematicNavigation();

  // Connected ONLY between Home (/), Sign In (/login), and Student Registration (/register)
  const isConnectedRoute = useMemo(() => {
    return CINEMATIC_ROUTES.includes(pathname);
  }, [pathname]);

  const navMenuItems: MenuItem[] = useMemo(
    () => [
      {
        label: "Home",
        href: "/",
        active: pathname === "/",
        onClick: () => {
          if (pathname === "/") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            cinematicNavigate("/");
          }
        },
      },
      {
        label: "Sign In",
        href: "/login",
        active: pathname === "/login",
        onClick: () => {
          if (pathname !== "/login") {
            cinematicNavigate("/login");
          }
        },
      },
      {
        label: "Student Registration",
        href: "/register",
        active: pathname === "/register",
        onClick: () => {
          if (pathname !== "/register") {
            cinematicNavigate("/register");
          }
        },
      },
    ],
    [pathname, cinematicNavigate]
  );

  return (
    <>
      {children}
      {isConnectedRoute && <FloatingMenu items={navMenuItems} />}
    </>
  );
}
