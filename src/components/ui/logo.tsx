"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Logo({ className = "", size = "md", href = "/dashboard" }: LogoProps) {
  const sizeMap = {
    sm: { height: 28, width: 120, className: "h-7" },
    md: { height: 36, width: 150, className: "h-9" },
    lg: { height: 44, width: 180, className: "h-11" },
  }[size];

  const content = (
    <div className={`relative inline-flex items-center select-none ${className}`}>
      {/* Light Mode Logo */}
      <Image
        src="/Images/lightmode-logo.png"
        alt="Campus Coin"
        width={sizeMap.width}
        height={sizeMap.height}
        priority
        className={`${sizeMap.className} w-auto object-contain block dark:hidden transition-transform duration-200 hover:scale-[1.02]`}
      />
      {/* Dark Mode Logo */}
      <Image
        src="/Images/Darkmode-logo.png"
        alt="Campus Coin"
        width={sizeMap.width}
        height={sizeMap.height}
        priority
        className={`${sizeMap.className} w-auto object-contain hidden dark:block transition-transform duration-200 hover:scale-[1.02]`}
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
