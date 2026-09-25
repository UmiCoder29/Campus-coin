import { DefaultSession, DefaultUser } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      academicYear?: string | null;
      monthlyAllowance?: number | null;
      savingsGoal?: number | null;
      university?: string | null;
      studentId?: string | null;
      currency?: string;
      theme?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: string;
    academicYear?: string | null;
    monthlyAllowance?: number | null;
    savingsGoal?: number | null;
    university?: string | null;
    studentId?: string | null;
    currency?: string;
    theme?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    academicYear?: string | null;
    monthlyAllowance?: number | null;
    savingsGoal?: number | null;
    university?: string | null;
    studentId?: string | null;
    currency?: string;
    theme?: string;
  }
}
