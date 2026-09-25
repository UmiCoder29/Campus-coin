"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { PreloaderCurtain } from "./preloader-curtain";

interface AuthTransitionContextType {
  isTransitioning: boolean;
  preloadedDashboardMetrics: any | null;
  triggerAuthTransition: (targetRoute?: string) => Promise<void>;
  notifyDashboardReady: () => void;
  justTransitioned: boolean;
  clearJustTransitioned: () => void;
}

const AuthTransitionContext = createContext<AuthTransitionContextType>({
  isTransitioning: false,
  preloadedDashboardMetrics: null,
  triggerAuthTransition: async () => {},
  notifyDashboardReady: () => {},
  justTransitioned: false,
  clearJustTransitioned: () => {},
});

export function AuthTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [justTransitioned, setJustTransitioned] = useState(false);
  const [preloadedDashboardMetrics, setPreloadedDashboardMetrics] = useState<any | null>(null);

  const targetRouteRef = useRef<string>("/dashboard");
  const dashboardReadyRef = useRef<boolean>(false);
  const readyResolverRef = useRef<(() => void) | null>(null);

  // Trigger preloader overlay immediately upon successful sign-in
  const triggerAuthTransition = useCallback(
    async (targetRoute = "/dashboard") => {
      targetRouteRef.current = targetRoute;
      dashboardReadyRef.current = false;
      readyResolverRef.current = null;
      setIsTransitioning(true);

      // Pre-warm session & dashboard data during the 3.3s loader progress bar
      (async () => {
        try {
          // Poll /api/auth/session to confirm the session cookie is committed
          for (let i = 0; i < 4; i++) {
            const sRes = await fetch("/api/auth/session");
            if (sRes.ok) {
              const sData = await sRes.json();
              if (sData?.user) break;
            }
            await new Promise((r) => setTimeout(r, 70));
          }

          // Safely pre-load dashboard metrics once the session cookie is active
          if (targetRoute === "/dashboard") {
            const statsRes = await fetch("/api/dashboard/stats");
            if (statsRes.ok) {
              const json = await statsRes.json();
              if (json?.success && json?.data) {
                setPreloadedDashboardMetrics(json.data);
              }
            }
          }
        } catch {
          // silent fallback
        }
      })();
    },
    []
  );

  // Called when curtain expansion begins (at t = 3.65s) so the route mounts under the curtain
  const handleRouteHandoff = useCallback(() => {
    // 1. Soft client-side navigation
    router.push(targetRouteRef.current);

    // 2. Resilient Fallback: If after 1400ms pathname has not transitioned away from /login,
    // execute window navigation to guarantee the dashboard always loads!
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname !== targetRouteRef.current) {
        window.location.href = targetRouteRef.current;
      }
    }, 1400);
  }, [router]);

  // Wait for the target page to mount and paint before dissolving the curtain
  const waitForReady = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (dashboardReadyRef.current) {
        resolve();
        return;
      }

      // Safety timeout: never freeze or hold longer than 2500ms
      const timeout = setTimeout(() => {
        resolve();
      }, 2500);

      readyResolverRef.current = () => {
        clearTimeout(timeout);
        resolve();
      };
    });
  }, []);

  // Signal from dashboard component that live data/metrics have rendered
  const notifyDashboardReady = useCallback(() => {
    dashboardReadyRef.current = true;
    if (readyResolverRef.current) {
      readyResolverRef.current();
      readyResolverRef.current = null;
    }
  }, []);

  // Route-change observer: once pathname updates to target route, signal readiness
  useEffect(() => {
    if (isTransitioning && pathname === targetRouteRef.current) {
      requestAnimationFrame(() => {
        notifyDashboardReady();
      });
    }
  }, [pathname, isTransitioning, notifyDashboardReady]);

  // Called when the cross-fade finishes and the curtain has faded to 0 opacity
  const handleComplete = useCallback(() => {
    setIsTransitioning(false);
    setJustTransitioned(true);
    dashboardReadyRef.current = false;
    readyResolverRef.current = null;
    setPreloadedDashboardMetrics(null);
  }, []);

  const clearJustTransitioned = useCallback(() => {
    setJustTransitioned(false);
  }, []);

  return (
    <AuthTransitionContext.Provider
      value={{
        isTransitioning,
        preloadedDashboardMetrics,
        triggerAuthTransition,
        notifyDashboardReady,
        justTransitioned,
        clearJustTransitioned,
      }}
    >
      {children}
      {isTransitioning && (
        <PreloaderCurtain
          onNavigate={handleRouteHandoff}
          waitForReady={waitForReady}
          onComplete={handleComplete}
        />
      )}
    </AuthTransitionContext.Provider>
  );
}

export function useAuthTransition() {
  return useContext(AuthTransitionContext);
}
