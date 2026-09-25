import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // 1. API Protection (reject without valid session)
    if (path.startsWith("/api/") && !path.startsWith("/api/auth")) {
      if (path.startsWith("/api/admin")) {
        if (!token) {
          return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }
        if (token.role !== "ADMIN") {
          return NextResponse.json({ success: false, error: "Forbidden: Administrator role required" }, { status: 403 });
        }
      } else {
        if (!token) {
          return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }
      }
    }

    if (path.startsWith("/admin") && path !== "/admin/login") {
      if (!token) {
        return NextResponse.redirect(new URL(`/admin/login?callbackUrl=${encodeURIComponent(path)}`, req.url));
      }
      if (token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard?error=UnauthorizedAdminAccess", req.url));
      }
    }

    // 2. Student Dashboard & Feature Routes Protection
    const isStudentRoute =
      path.startsWith("/dashboard") ||
      path.startsWith("/transactions") ||
      path.startsWith("/categories") ||
      path.startsWith("/budgets") ||
      path.startsWith("/reports") ||
      path.startsWith("/saving-tips") ||
      path.startsWith("/notifications") ||
      path.startsWith("/settings");

    if (isStudentRoute && !token) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.url));
    }

    // 3. Authenticated User Redirections away from Auth pages
    if (token) {
      if (path === "/login" || path === "/register") {
        const dest = token.role === "ADMIN" ? "/admin" : "/dashboard";
        return NextResponse.redirect(new URL(dest, req.url));
      }
      if (path === "/admin/login") {
        if (token.role === "ADMIN") {
          return NextResponse.redirect(new URL("/admin", req.url));
        } else {
          return NextResponse.redirect(new URL("/dashboard?error=UnauthorizedAdminAccess", req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Allow public pages
        if (
          path === "/" ||
          path === "/login" ||
          path === "/register" ||
          path === "/forgot-password" ||
          path === "/reset-password" ||
          path === "/admin/login" ||
          path.startsWith("/api/auth") ||
          path.startsWith("/_next") ||
          path.includes("favicon.ico") ||
          path.startsWith("/api/") ||
          path.startsWith("/admin")
        ) {
          return true;
        }

        // Protected routes require valid token
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "dev-secret-key-campus-coin-32-chars-min-needed-here-12345",
  }
);

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/transactions",
    "/transactions/:path*",
    "/categories",
    "/categories/:path*",
    "/budgets",
    "/budgets/:path*",
    "/reports",
    "/reports/:path*",
    "/saving-tips",
    "/saving-tips/:path*",
    "/notifications",
    "/notifications/:path*",
    "/settings",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
