"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export interface MenuItem {
  label: string;
  onClick?: () => void;
  href?: string;
  active?: boolean;
}

export interface FloatingMenuProps {
  items?: MenuItem[];
  className?: string;
}

function MenuButton({
  label,
  onClick,
  isOpen,
  index,
  active = false,
}: {
  label: string;
  onClick?: () => void;
  isOpen: boolean;
  index: number;
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const animatingRef = useRef(false);
  const pendingLeaveRef = useRef(false);
  const chars = label.split("");
  const lockDuration = 30 * chars.length + 300;

  const handleEnter = useCallback(() => {
    pendingLeaveRef.current = false;
    if (hovered) return;
    setHovered(true);
    animatingRef.current = true;
    setTimeout(() => {
      animatingRef.current = false;
      if (pendingLeaveRef.current) {
        pendingLeaveRef.current = false;
        setHovered(false);
      }
    }, lockDuration);
  }, [hovered, lockDuration]);

  const handleLeave = useCallback(() => {
    if (animatingRef.current) {
      pendingLeaveRef.current = true;
    } else {
      setHovered(false);
    }
  }, []);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`text-[17px] sm:text-[20px] uppercase leading-none overflow-hidden px-2 whitespace-nowrap cursor-pointer transition-colors flex items-center justify-center gap-2 ${
        active ? "text-[#FFE862] font-black" : "text-[#f7f1ed] hover:text-[#FFE862]/90"
      }`}
      style={{
        fontFamily: "'Bebas Neue', 'Outfit', 'Inter', sans-serif",
        letterSpacing: "0.02em",
        height: "1.2em",
      }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      transition={{
        duration: 0.4,
        delay: isOpen ? 0.35 + 0.08 * index : 0,
        ease,
      }}
    >
      {active && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#FFE862] inline-block shrink-0 animate-pulse" />
      )}
      <div className="flex justify-center items-center">
        {chars.map((char, i) => (
          <span
            key={i}
            className="inline-block overflow-hidden"
            style={{ height: "1.2em" }}
          >
            <span
              className="flex flex-col"
              style={{
                transitionProperty: "transform",
                transitionDuration: hovered ? "800ms" : "0ms",
                transitionDelay: hovered ? `${30 * i}ms` : "0ms",
                transform: hovered ? "translateY(-50%)" : "translateY(0%)",
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <span
                className="block"
                style={{ height: "1.2em", lineHeight: "1.2em" }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
              <span
                className="block"
                style={{ height: "1.2em", lineHeight: "1.2em" }}
                aria-hidden
              >
                {char === " " ? "\u00A0" : char}
              </span>
            </span>
          </span>
        ))}
      </div>
    </motion.button>
  );
}

export function FloatingMenu({ items, className = "" }: FloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const menuItems: MenuItem[] = items ?? [
    { label: "Home" },
    { label: "Works" },
    { label: "Contact" },
  ];

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const targetHeight = isOpen ? Math.max(260, 100 + menuItems.length * 48) : 48;
  const targetWidth = isOpen ? 310 : 150;

  return (
    <div
      className={`fixed bottom-6 sm:bottom-8 inset-x-0 z-[100] flex justify-center items-center pointer-events-none ${className}`}
    >
      <motion.div
        ref={containerRef}
        className="pointer-events-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <motion.div
          className="relative overflow-hidden flex flex-col shadow-2xl shadow-black/20"
          onClick={() => {
            if (!isOpen) setIsOpen(true);
          }}
        style={{
          fontFamily: "'Aeonik TRIAL', 'Inter', sans-serif",
          letterSpacing: "-0.02em",
          cursor: isOpen ? "default" : "pointer",
        }}
        animate={{
          width: targetWidth,
          height: targetHeight,
          borderRadius: isOpen ? 32 : 72,
          scale: 1,
        }}
        whileHover={isOpen ? undefined : { scale: 1.05 }}
        transition={{
          duration: 0.8,
          ease,
          height: { duration: isOpen ? 0.8 : 0.2 },
          scale: { duration: 0.25, ease },
        }}
      >
        {/* Yellow background layer */}
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundColor: isOpen ? "#FFE862" : "#FFE862",
            borderColor: isOpen ? "#FFE862" : "#d1bb3b",
          }}
          transition={{ duration: isOpen ? 0.1 : 0.3, ease }}
          style={{
            borderWidth: 1,
            borderStyle: "solid",
            borderRadius: "inherit",
          }}
        />

        {/* Dark circle expanding from bottom */}
        <motion.div
          className="absolute left-1/2 bg-[#1c1c1e]"
          style={{
            width: "220%",
            height: "220%",
            borderRadius: "50%",
            x: "-50%",
          }}
          animate={{ bottom: isOpen ? "-20%" : "-220%" }}
          transition={{
            duration: 0.8,
            ease,
            delay: isOpen ? 0.1 : 0,
          }}
        />

        {/* Menu items */}
        <div
          className="relative z-10 flex flex-col gap-4 sm:gap-5 items-center justify-center px-4"
          style={{
            pointerEvents: isOpen ? "auto" : "none",
            opacity: isOpen ? 1 : 0,
            flex: isOpen ? 1 : 0,
            overflow: "hidden",
          }}
        >
          {menuItems.map((item, idx) => (
            <MenuButton
              key={item.label}
              label={item.label}
              active={item.active}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else if (item.href) {
                  window.location.href = item.href;
                }
                setIsOpen(false);
              }}
              isOpen={isOpen}
              index={idx}
            />
          ))}
        </div>

        {/* Bottom bar: Menu + hamburger */}
        <motion.div
          className="relative z-10 flex items-center justify-between w-full shrink-0 cursor-pointer select-none"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          animate={{
            paddingLeft: isOpen ? 24 : 20,
            paddingRight: isOpen ? 24 : 20,
            paddingBottom: isOpen ? 20 : 0,
            height: 48,
          }}
          transition={{ duration: 0.8, ease }}
          style={{ alignItems: "center" }}
        >
          <motion.span
            className="text-[14px] md:text-[18px] font-semibold leading-none tracking-wide"
            animate={{ color: isOpen ? "#f7f1ed" : "#242424" }}
            transition={{ duration: 0.3, ease }}
          >
            {isOpen ? "Close" : "Menu"}
          </motion.span>

          <div className="relative w-[24px] h-[24px] flex items-center justify-center">
            <motion.span
              className="absolute block w-[18px] h-[2.5px] rounded-full"
              animate={{
                rotate: isOpen ? 45 : 0,
                y: isOpen ? 0 : -3.5,
                backgroundColor: isOpen ? "#f7f1ed" : "#242424",
              }}
              transition={{ duration: 0.4, ease }}
            />
            <motion.span
              className="absolute block w-[18px] h-[2.5px] rounded-full"
              animate={{
                rotate: isOpen ? -45 : 0,
                y: isOpen ? 0 : 3.5,
                backgroundColor: isOpen ? "#f7f1ed" : "#242424",
              }}
              transition={{ duration: 0.4, ease }}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  </div>
);
}

export default FloatingMenu;
