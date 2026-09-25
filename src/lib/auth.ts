import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Campus Coin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        portal: { label: "Portal", type: "text" }, // "student" | "admin"
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials or account does not exist");
        }

        // Account status check (Disabled accounts blocked at login)
        if (user.status === "DISABLED") {
          throw new Error("This account has been deactivated by an administrator. Please contact campus financial services.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // Strict isolation for Administrator Portal
        if (credentials.portal === "admin") {
          if (user.role !== "ADMIN") {
            throw new Error("Access denied. Administrator privileges required to access the admin portal.");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          academicYear: user.academicYear,
          monthlyAllowance: user.monthlyAllowance ? Number(user.monthlyAllowance) : null,
          savingsGoal: user.savingsGoal ? Number(user.savingsGoal) : null,
          university: user.university,
          studentId: user.studentId,
          currency: user.currency,
          theme: user.theme,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = user.role;
        token.status = (user as any).status;
        token.academicYear = user.academicYear;
        token.monthlyAllowance = user.monthlyAllowance;
        token.savingsGoal = user.savingsGoal;
        token.university = user.university;
        token.studentId = user.studentId;
        token.currency = user.currency;
        token.theme = user.theme;
      }

      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.theme) token.theme = session.theme;
        if (session.currency) token.currency = session.currency;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        (session.user as any).status = token.status as string;
        session.user.academicYear = token.academicYear as string | null;
        session.user.monthlyAllowance = token.monthlyAllowance as number | null;
        session.user.savingsGoal = token.savingsGoal as number | null;
        session.user.university = token.university as string | null;
        session.user.studentId = token.studentId as string | null;
        session.user.currency = (token.currency as string) ?? "USD";
        session.user.theme = (token.theme as string) ?? "SYSTEM";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "campus-coin-default-fallback-secret-2026",
};
