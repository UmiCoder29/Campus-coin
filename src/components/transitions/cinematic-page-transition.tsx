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
import gsap from "gsap";

interface CinematicTransitionContextType {
  isTransitioning: boolean;
  targetPath: string | null;
  cinematicNavigate: (href: string) => void;
}

const CinematicTransitionContext = createContext<CinematicTransitionContextType>({
  isTransitioning: false,
  targetPath: null,
  cinematicNavigate: () => {},
});

export function useCinematicNavigation() {
  return useContext(CinematicTransitionContext);
}

// Routes that participate in the cinematic transition & floating menu
export const CINEMATIC_ROUTES = ["/", "/login", "/register"];

function getPageTitle(path: string): string {
  if (path === "/") return "CAMPUS COIN";
  if (path === "/login") return "SIGN IN";
  if (path === "/register") return "STUDENT REGISTRATION";
  return "CAMPUS COIN";
}

function getPageSubtitle(path: string): string {
  if (path === "/") return "SMART CAMPUS FINANCE";
  if (path === "/login") return "STUDENT ACCESS PORTAL";
  if (path === "/register") return "CREATE STUDENT LEDGER";
  return "SMART CAMPUS FINANCE";
}

/**
 * High-End Cinematic Page Transition Curtain
 * Uses GSAP timeline with SVG liquid bezier curve wipe & elegant typography reveal.
 */
function CinematicCurtain({
  targetPath,
  onMidpoint,
  onComplete,
}: {
  targetPath: string;
  onMidpoint: () => void;
  onComplete: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const title = getPageTitle(targetPath);
  const subtitle = getPageSubtitle(targetPath);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          document.body.style.overflow = originalOverflow;
          onComplete();
        },
      });

      // SVG path definition:
      // Initial: flat bar below screen
      // Mid curve: bulging curve sweeping up from bottom to top
      // Full: covering screen completely
      // Exit curve: bulging curve sweeping up off screen
      const startPath = "M 0 100 Q 50 100 100 100 L 100 100 Q 50 100 0 100 Z";
      const midCurveIn = "M 0 100 Q 50 20 100 100 L 100 0 Q 50 0 0 0 Z";
      const fullScreen = "M 0 100 Q 50 100 100 100 L 100 0 Q 50 0 0 0 Z";
      const midCurveOut = "M 0 0 Q 50 -30 100 0 L 100 0 Q 50 0 0 0 Z";

      // Set initial
      if (pathRef.current) {
        gsap.set(pathRef.current, { attr: { d: startPath } });
      }
      if (textRef.current) {
        gsap.set(textRef.current, { opacity: 0, y: 18, scale: 0.95 });
      }
      if (lineRef.current) {
        gsap.set(lineRef.current, { scaleX: 0, transformOrigin: "left center" });
      }

      // ── Step 1: Liquid Wipe In (0.3s)
      if (pathRef.current) {
        tl.to(
          pathRef.current,
          {
            attr: { d: midCurveIn },
            duration: 0.22,
            ease: "power2.in",
          },
          0
        );
        tl.to(
          pathRef.current,
          {
            attr: { d: fullScreen },
            duration: 0.16,
            ease: "power2.out",
          },
          0.22
        );
      }

      // ── Step 2: Cinematic Route Title Reveal
      if (textRef.current) {
        tl.to(
          textRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.2,
            ease: "power3.out",
          },
          0.2
        );
      }
      if (lineRef.current) {
        tl.to(
          lineRef.current,
          {
            scaleX: 1,
            duration: 0.25,
            ease: "power2.inOut",
          },
          0.22
        );
      }

      // ── Step 3: Midpoint Route Handoff
      tl.call(
        () => {
          onMidpoint();
        },
        undefined,
        0.36
      );

      // Brief cinematic hold (0.15s)
      tl.to({}, { duration: 0.16 });

      // ── Step 4: Fade Out Text
      if (textRef.current) {
        tl.to(
          textRef.current,
          {
            opacity: 0,
            y: -12,
            duration: 0.15,
            ease: "power2.in",
          },
          0.52
        );
      }

      // ── Step 5: Liquid Wipe Out
      if (pathRef.current) {
        tl.to(
          pathRef.current,
          {
            attr: { d: midCurveOut },
            duration: 0.28,
            ease: "power3.inOut",
          },
          0.54
        );
      }
    }, containerRef);

    return () => {
      document.body.style.overflow = originalOverflow;
      ctx.revert();
    };
  }, [onMidpoint, onComplete, targetPath]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] pointer-events-auto select-none overflow-hidden"
      style={{ isolation: "isolate" }}
    >
      {/* SVG Liquid Curve Layer */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="cinematicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B0E17" />
            <stop offset="50%" stopColor="#121624" />
            <stop offset="100%" stopColor="#07090F" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          fill="url(#cinematicGrad)"
          d="M 0 100 Q 50 100 100 100 L 100 100 Q 50 100 0 100 Z"
        />
      </svg>

      {/* Cinematic Center Text Reveal */}
      <div
        ref={textRef}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6"
      >
        {/* Subtle pill tag */}
        <div className="flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-mono tracking-widest text-[#FF722B] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF722B] animate-pulse" />
          <span>{subtitle}</span>
        </div>

        {/* Big Bold Headline */}
        <h2
          className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-wider text-center"
          style={{ fontFamily: "'Bebas Neue', 'Outfit', sans-serif", letterSpacing: "0.04em" }}
        >
          {title}
        </h2>

        {/* Golden/Orange Hairline Accent */}
        <div className="w-24 sm:w-36 h-[2px] bg-white/10 mt-3 relative overflow-hidden rounded-full">
          <div
            ref={lineRef}
            className="w-full h-full bg-gradient-to-r from-[#FF722B] via-[#FFE862] to-[#FF722B]"
          />
        </div>
      </div>
    </div>
  );
}

export function CinematicPageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const targetPathRef = useRef<string | null>(null);

  const cinematicNavigate = useCallback(
    (href: string) => {
      // If already on the same page or transition already running, ignore
      if (href === pathname || isTransitioning) {
        return;
      }

      // Check if both current route and destination are in CINEMATIC_ROUTES
      const isFromCinematic = CINEMATIC_ROUTES.includes(pathname);
      const isToCinematic = CINEMATIC_ROUTES.includes(href);

      // If both are cinematic routes, trigger the smooth GSAP curtain transition
      if (isFromCinematic && isToCinematic) {
        targetPathRef.current = href;
        setTargetPath(href);
        setIsTransitioning(true);
      } else {
        // Standard navigation
        router.push(href);
      }
    },
    [pathname, isTransitioning, router]
  );

  const handleMidpoint = useCallback(() => {
    if (targetPathRef.current) {
      router.push(targetPathRef.current);
    }
  }, [router]);

  const handleComplete = useCallback(() => {
    setIsTransitioning(false);
    setTargetPath(null);
    targetPathRef.current = null;
  }, []);

  return (
    <CinematicTransitionContext.Provider
      value={{
        isTransitioning,
        targetPath,
        cinematicNavigate,
      }}
    >
      {children}
      {isTransitioning && targetPath && (
        <CinematicCurtain
          targetPath={targetPath}
          onMidpoint={handleMidpoint}
          onComplete={handleComplete}
        />
      )}
    </CinematicTransitionContext.Provider>
  );
}
