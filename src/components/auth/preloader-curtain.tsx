"use client";

import React, { useEffect, useRef, useMemo } from "react";
import gsap from "gsap";

interface PreloaderCurtainProps {
  onNavigate: () => void;
  waitForReady: () => Promise<void>;
  onComplete: () => void;
}

const STRIP_COUNT = 12;

export function PreloaderCurtain({ onNavigate, waitForReady, onComplete }: PreloaderCurtainProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const borderRectRef = useRef<SVGRectElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const cornerTicksRef = useRef<(HTMLDivElement | null)[]>([]);
  const glitchStripsRef = useRef<(HTMLDivElement | null)[]>([]);
  const letterContainerRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const taglineRef = useRef<HTMLDivElement>(null);
  const progressSvgRef = useRef<SVGSVGElement>(null);

  // Pre-split characters for "CAMPUS" and "COIN"
  const campusLetters = useMemo(() => "CAMPUS".split(""), []);
  const coinLetters = useMemo(() => "COIN".split(""), []);

  useEffect(() => {
    // Lock scroll during transition
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          document.body.style.overflow = originalOverflow;
          onComplete();
        },
      });

      // ── Initial State Setup ───────────────────────────────────────────
      // Perimeter of 219 x 189 rect = (219 + 189) * 2 = 816
      const perimeter = 816;
      if (borderRectRef.current) {
        gsap.set(borderRectRef.current, {
          strokeDasharray: perimeter,
          strokeDashoffset: perimeter,
        });
      }

      // Initial state of strips
      glitchStripsRef.current.forEach((strip) => {
        if (strip) gsap.set(strip, { opacity: 0, x: 0 });
      });

      // Initial state of fragment letter container and letters
      if (letterContainerRef.current) {
        gsap.set(letterContainerRef.current, { opacity: 0 });
      }
      letterRefs.current.forEach((el) => {
        if (el) gsap.set(el, { opacity: 0, x: 0, y: 0 });
      });

      // Initial state of tagline words
      const tagWords = taglineRef.current?.querySelectorAll(".tag-word");
      if (tagWords) {
        gsap.set(tagWords, { opacity: 0, y: 8 });
      }

      // Initial counter proxy
      const counterProxy = { val: 0 };

      // ── PHASE 1: LOADER PROGRESS (0 to 3.3s) ──────────────────────────
      const loaderDuration = 3.3;

      // 1. Progress Border Stroke
      tl.to(
        borderRectRef.current,
        {
          strokeDashoffset: 0,
          duration: loaderDuration,
          ease: "power2.inOut",
        },
        0
      );

      // 2. Numeric Counter (0 to 100)
      tl.to(
        counterProxy,
        {
          val: 100,
          duration: loaderDuration,
          ease: "power2.inOut",
          onUpdate: () => {
            if (counterRef.current) {
              const rounded = Math.round(counterProxy.val);
              counterRef.current.textContent = `${String(rounded).padStart(2, "0")}%`;
            }
          },
        },
        0
      );

      // 3. Scanline Glitch Reveal for Wordmark "Campus Coin"
      // Strips 0 to 5 (CAMPUS) jitter and flicker in from 0.25s to 1.1s
      glitchStripsRef.current.slice(0, 6).forEach((strip, i) => {
        if (!strip) return;
        const delay = 0.25 + i * 0.04;
        tl.to(
          strip,
          {
            opacity: 1,
            x: () => gsap.utils.random(-8, 8),
            duration: 0.1,
            repeat: 3,
            yoyo: true,
            ease: "steps(2)",
          },
          delay
        );
        tl.to(
          strip,
          {
            x: 0,
            opacity: 1,
            duration: 0.15,
            ease: "power2.out",
          },
          delay + 0.35
        );
      });

      // Strips 6 to 11 (COIN) jitter and flicker in slightly after (0.55s to 1.4s)
      glitchStripsRef.current.slice(6).forEach((strip, i) => {
        if (!strip) return;
        const delay = 0.55 + i * 0.04;
        tl.to(
          strip,
          {
            opacity: 1,
            x: () => gsap.utils.random(-8, 8),
            duration: 0.1,
            repeat: 3,
            yoyo: true,
            ease: "steps(2)",
          },
          delay
        );
        tl.to(
          strip,
          {
            x: 0,
            opacity: 1,
            duration: 0.15,
            ease: "power2.out",
          },
          delay + 0.35
        );
      });

      // 4. Tagline: "SAVE · TRACK · GROW" staggered fade & translate up
      if (tagWords && tagWords.length > 0) {
        tl.to(
          tagWords,
          {
            opacity: 1,
            y: 0,
            stagger: 0.15,
            duration: 0.45,
            ease: "power2.out",
          },
          1.35
        );
      }

      // ── PHASE 2: 100% COMPLETION MARKS (3.3s to 3.6s) ─────────────────
      // Rotate 4 corner tick marks 45 degrees (+ becomes x) over 0.2s
      tl.to(
        cornerTicksRef.current.filter(Boolean),
        {
          rotation: 45,
          transformOrigin: "50% 50%",
          duration: 0.2,
          ease: "power2.out",
        },
        3.3
      );

      // Flash square background to solid white for 0.15s
      tl.to(
        panelRef.current,
        {
          backgroundColor: "#ffffff",
          duration: 0.15,
          ease: "power2.in",
        },
        3.45
      );

      // ── PHASE 3: CURTAIN EXPANSION (3.6s to 4.42s) ────────────────────
      // Switch from glitch strips view to individual letters for clean fragmentation
      tl.call(
        () => {
          glitchStripsRef.current.forEach((st) => {
            if (st) gsap.set(st, { opacity: 0 });
          });
          if (letterContainerRef.current) {
            gsap.set(letterContainerRef.current, { opacity: 1 });
          }
          letterRefs.current.forEach((el) => {
            if (el) gsap.set(el, { opacity: 1, x: 0, y: 0 });
          });
        },
        undefined,
        3.6
      );

      // Fade out progress stroke, ticks, tagline, and counter
      tl.to(
        [
          progressSvgRef.current,
          taglineRef.current,
          counterRef.current,
          ...cornerTicksRef.current,
        ].filter(Boolean),
        {
          opacity: 0,
          duration: 0.15,
          ease: "power2.in",
        },
        3.6
      );

      // 1. Scale panel width to 100vw (0.4s, power3.inOut)
      tl.to(
        panelRef.current,
        {
          width: "100vw",
          borderColor: "#0a0a0a",
          duration: 0.4,
          ease: "power3.inOut",
        },
        3.62
      );

      // 2. Cross-fade panel background color from white to #0a0a0a concurrently
      tl.to(
        panelRef.current,
        {
          backgroundColor: "#0a0a0a",
          duration: 0.45,
          ease: "power3.inOut",
        },
        3.65
      );

      // 3. Fragment "Campus Coin" wordmark: explode letters apart & fade out
      const activeLetters = letterRefs.current.filter(Boolean);
      tl.to(
        activeLetters,
        {
          x: () => gsap.utils.random(-50, 50),
          y: () => gsap.utils.random(-50, 50),
          opacity: 0,
          stagger: 0.02,
          duration: 0.35,
          ease: "power2.in",
        },
        3.65
      );

      // 4. Trigger route change to dashboard right as curtain expansion begins!
      // This allows Next.js and the dashboard to render underneath the expanding curtain.
      tl.call(
        () => {
          onNavigate();
        },
        undefined,
        3.65
      );

      // 5. Scale panel height to 100vh (0.4s, power3.inOut)
      tl.to(
        panelRef.current,
        {
          height: "100vh",
          duration: 0.4,
          ease: "power3.inOut",
        },
        4.02
      );

      // At 4.42s, the panel fully blankets the viewport in solid #0a0a0a.
      // Sync the parent container background to #0a0a0a so NO light gray remains.
      tl.call(
        () => {
          if (containerRef.current) {
            containerRef.current.style.backgroundColor = "#0a0a0a";
          }
        },
        undefined,
        4.42
      );

      // ── PHASE 4: ASYNC DASHBOARD READY CHECK ─────────────────────────
      // Seamlessly hold the solid black curtain until the target route & data are ready!
      tl.addPause(4.45, async () => {
        try {
          await waitForReady();
        } catch (err) {
          console.warn("waitForReady fallback:", err);
        }
        // Advance smoothly past the pause marker
        tl.play(4.451);
      });

      // ── PHASE 5: REVEAL DASHBOARD & STAGGER SECTIONS ──────────────────
      // Fade out the entire black overlay from opacity 1 to 0 over 0.5s
      tl.to(
        containerRef.current,
        {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        4.46
      );

      // Stagger dashboard sections in as the black curtain dissolves
      tl.call(
        () => {
          const sections = document.querySelectorAll(".dashboard-section");
          if (sections.length > 0) {
            gsap.fromTo(
              sections,
              { opacity: 0, y: 15 },
              {
                opacity: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.08,
                ease: "power2.out",
              }
            );
          }
        },
        undefined,
        4.48
      );
    }, containerRef);

    return () => {
      document.body.style.overflow = originalOverflow;
      ctx.revert();
    };
  }, [onNavigate, waitForReady, onComplete, campusLetters, coinLetters]);

  return (
    <div
      ref={containerRef}
      id="preloader-overlay"
      className="fixed inset-0 z-[99999] bg-[#c9c9c9] flex items-center justify-center overflow-hidden select-none pointer-events-auto"
      style={{ isolation: "isolate" }}
    >
      {/* ── Center Expandable Panel (Starts 220x190) ──────────────────── */}
      <div
        ref={panelRef}
        className="relative flex flex-col items-center justify-between p-4 bg-transparent border border-[#0a0a0a] shadow-2xl overflow-hidden"
        style={{
          width: "220px",
          height: "190px",
          boxSizing: "border-box",
        }}
      >
        {/* ── Progress SVG Rect Border ──────────────────────────────── */}
        <svg
          ref={progressSvgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 220 190"
          preserveAspectRatio="none"
        >
          {/* Subtle track outline */}
          <rect
            x="0.5"
            y="0.5"
            width="219"
            height="189"
            fill="none"
            stroke="#0a0a0a"
            strokeOpacity="0.15"
            strokeWidth="1"
          />
          {/* Animated progress stroke */}
          <rect
            ref={borderRectRef}
            x="0.5"
            y="0.5"
            width="219"
            height="189"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>

        {/* ── 4 Small Corner Tick Marks (+) Placed Exactly on Corners ──── */}
        {/* Top-Left */}
        <div
          ref={(el) => {
            cornerTicksRef.current[0] = el;
          }}
          className="absolute -top-1.5 -left-1.5 w-3 h-3 flex items-center justify-center pointer-events-none"
        >
          <svg className="w-2.5 h-2.5 overflow-visible" viewBox="0 0 10 10">
            <line x1="1" y1="5" x2="9" y2="5" stroke="#0a0a0a" strokeWidth="1.2" />
            <line x1="5" y1="1" x2="5" y2="9" stroke="#0a0a0a" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Top-Right */}
        <div
          ref={(el) => {
            cornerTicksRef.current[1] = el;
          }}
          className="absolute -top-1.5 -right-1.5 w-3 h-3 flex items-center justify-center pointer-events-none"
        >
          <svg className="w-2.5 h-2.5 overflow-visible" viewBox="0 0 10 10">
            <line x1="1" y1="5" x2="9" y2="5" stroke="#0a0a0a" strokeWidth="1.2" />
            <line x1="5" y1="1" x2="5" y2="9" stroke="#0a0a0a" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Bottom-Left */}
        <div
          ref={(el) => {
            cornerTicksRef.current[2] = el;
          }}
          className="absolute -bottom-1.5 -left-1.5 w-3 h-3 flex items-center justify-center pointer-events-none"
        >
          <svg className="w-2.5 h-2.5 overflow-visible" viewBox="0 0 10 10">
            <line x1="1" y1="5" x2="9" y2="5" stroke="#0a0a0a" strokeWidth="1.2" />
            <line x1="5" y1="1" x2="5" y2="9" stroke="#0a0a0a" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Bottom-Right */}
        <div
          ref={(el) => {
            cornerTicksRef.current[3] = el;
          }}
          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 flex items-center justify-center pointer-events-none"
        >
          <svg className="w-2.5 h-2.5 overflow-visible" viewBox="0 0 10 10">
            <line x1="1" y1="5" x2="9" y2="5" stroke="#0a0a0a" strokeWidth="1.2" />
            <line x1="5" y1="1" x2="5" y2="9" stroke="#0a0a0a" strokeWidth="1.2" />
          </svg>
        </div>

        {/* ── Wordmark Container: "Campus Coin" (Strictly typography only) ── */}
        <div className="relative w-full flex-1 flex flex-col items-center justify-center mt-1">
          {/* Scanline Glitch Strips Layer */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {Array.from({ length: STRIP_COUNT }).map((_, index) => {
              const topPct = (index / STRIP_COUNT) * 100;
              const bottomPct = 100 - ((index + 1) / STRIP_COUNT) * 100;
              return (
                <div
                  key={index}
                  ref={(el) => {
                    glitchStripsRef.current[index] = el;
                  }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{
                    clipPath: `inset(${topPct}% 0% ${bottomPct}% 0%)`,
                    WebkitClipPath: `inset(${topPct}% 0% ${bottomPct}% 0%)`,
                  }}
                >
                  <div className="font-mono font-black uppercase text-[#0a0a0a] text-center leading-[0.85] tracking-[-0.04em]">
                    <div className="text-[26px]">CAMPUS</div>
                    <div className="text-[26px]">COIN</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Letter Fragmentation Layer (for Transition Disintegration) */}
          <div
            ref={letterContainerRef}
            className="absolute inset-0 flex flex-col items-center justify-center font-mono font-black uppercase text-[#0a0a0a] text-center leading-[0.85] tracking-[-0.04em] pointer-events-none"
            style={{ opacity: 0 }}
          >
            <div className="text-[26px] flex items-center justify-center">
              {campusLetters.map((char, i) => (
                <span
                  key={`campus-${i}`}
                  ref={(el) => {
                    letterRefs.current[i] = el;
                  }}
                  className="inline-block transform-gpu"
                >
                  {char}
                </span>
              ))}
            </div>
            <div className="text-[26px] flex items-center justify-center">
              {coinLetters.map((char, i) => (
                <span
                  key={`coin-${i}`}
                  ref={(el) => {
                    letterRefs.current[campusLetters.length + i] = el;
                  }}
                  className="inline-block transform-gpu"
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sub-Wordmark Tagline ("SAVE · TRACK · GROW") ──────────── */}
        <div
          ref={taglineRef}
          className="flex items-center justify-center gap-1.5 text-[8.5px] font-mono font-bold tracking-[0.24em] uppercase text-[#1a1a1a] mb-1"
        >
          <span className="tag-word">SAVE</span>
          <span className="tag-word opacity-40">·</span>
          <span className="tag-word">TRACK</span>
          <span className="tag-word opacity-40">·</span>
          <span className="tag-word">GROW</span>
        </div>

        {/* ── Numeric Counter (0 to 100%) ────────────────────────────── */}
        <div
          ref={counterRef}
          className="font-mono text-[11px] font-bold tracking-[0.2em] text-[#0a0a0a] mb-0.5"
        >
          00%
        </div>
      </div>
    </div>
  );
}
