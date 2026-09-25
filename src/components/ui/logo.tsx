"use client";

import React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Logo({ className = "", size = "md", href = "/dashboard" }: LogoProps) {
  const heightClasses = {
    sm: "h-7",
    md: "h-9",
    lg: "h-11",
  }[size];

  const content = (
    <div className={`relative inline-flex items-center select-none ${className}`}>
      {/* Light Mode Logo */}
      <img
        src="/Images/lightmode-logo.png"
        alt="Campus Coin"
        className={`${heightClasses} w-auto object-contain block dark:hidden transition-transform duration-200 hover:scale-[1.02]`}
        loading="eager"
      />
      {/* Dark Mode Logo */}
      <img
        src="/Images/Darkmode-logo.png"
        alt="Campus Coin"
        className={`${heightClasses} w-auto object-contain hidden dark:block transition-transform duration-200 hover:scale-[1.02]`}
        loading="eager"
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;
