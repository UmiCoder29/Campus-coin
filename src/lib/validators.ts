import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid campus email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  academicYear: z.string().min(1, "Academic year is required"), // Freshman, Sophomore, Junior, Senior, Graduate
  monthlyAllowance: z.coerce.number().min(0, "Monthly allowance must be a positive number or 0"),
  savingsGoal: z.coerce.number().min(0, "Savings goal must be a positive number or 0"),
  university: z.string().optional(),
  studentId: z.string().optional(),
  currency: z.string().default("USD"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "New password must be at least 6 characters"),
});

export const transactionSchema = z.object({
  amount: z.coerce
    .number({ message: "Amount must be a valid number" })
    .positive("Amount must be greater than zero")
    .refine(
      (val) => {
        const parts = val.toString().split(".");
        return parts.length === 1 || parts[1].length <= 2;
      },
      { message: "Amount can have at most 2 decimal places" }
    ),
  type: z.enum(["EXPENSE", "INCOME"], { message: "Transaction type is required" }),
  categoryId: z.string().min(1, "Category is required"),
  description: z
    .string()
    .max(255, "Description cannot exceed 255 characters")
    .optional()
    .default(""),
  date: z.coerce
    .date({ message: "Please enter a valid date" })
    .default(() => new Date())
    .refine(
      (val) => {
        // Disallow dates more than 1 year in the future
        const maxFuture = new Date();
        maxFuture.setFullYear(maxFuture.getFullYear() + 1);
        return val <= maxFuture;
      },
      { message: "Date cannot be in the far future (more than 1 year ahead)" }
    ),
  paymentMethod: z
    .enum(["CASH", "DEBIT_CARD", "CREDIT_CARD", "CAMPUS_CARD", "DIGITAL_WALLET", "BANK_TRANSFER"])
    .default("CASH"),
  merchant: z.string().max(100, "Merchant cannot exceed 100 characters").optional().nullable(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional().nullable(),
  receiptUrl: z.string().url("Invalid receipt URL").optional().nullable().or(z.literal("")),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(["MONTHLY", "WEEKLY", "BIWEEKLY", "SEMESTER", "YEARLY"]).default("MONTHLY").optional(),
  recurringEndDate: z.coerce
    .date()
    .optional()
    .nullable(),
  recurringScope: z.enum(["THIS_ONLY", "THIS_AND_FUTURE"]).optional(),
  tags: z.array(z.string()).default([]),
  isAiCategorized: z.boolean().default(false),
  aiSuggestedCategory: z.string().optional().nullable(),
});

export const categorySchema = z.object({
  name: z
    .string({ message: "Category name is required" })
    .trim()
    .min(1, "Category name is required")
    .max(50, "Category name cannot exceed 50 characters"),
  type: z.enum(["EXPENSE", "INCOME"], { message: "Category type is required" }),
  icon: z.string().default("Tag"),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid color hex format")
    .default("#6366F1"),
});

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() || "_form";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export const budgetSchema = z.object({
  categoryId: z.string().nullable().optional(),
  amount: z.coerce.number().positive("Budget amount must be positive"),
  period: z.enum(["WEEKLY", "MONTHLY", "SEMESTER"]).default("MONTHLY"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  alertThreshold: z.coerce.number().min(1).max(100).default(80),
  rolloverUnused: z.boolean().default(false),
});
