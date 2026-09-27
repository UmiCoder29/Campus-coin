import {
  PrismaClient,
  CategoryType,
  TransactionType,
  PaymentMethod,
  TipCategory,
  TipDifficulty,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadEnvConfig } from "@next/env";
import crypto from "crypto";

if (!process.env.DATABASE_URL) {
  delete process.env.DATABASE_URL;
  loadEnvConfig(process.cwd());
}

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

// ────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(crypto.randomInt(8, 22), crypto.randomInt(0, 60), 0, 0);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[crypto.randomInt(0, arr.length)];
}

// ────────────────────────────────────────────────────
// Main Seed
// ────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding Campus Coin database...\n");

  // ── 1. Passwords ──────────────────────────────────
  const studentHash = await bcrypt.hash("Student@123", 10);
  const adminHash = await bcrypt.hash("Admin@123", 10);

  // ── 2. Demo Student ───────────────────────────────
  const student = await prisma.user.upsert({
    where: { email: "student@campuscoin.edu" },
    update: {},
    create: {
      email: "student@campuscoin.edu",
      name: "Demo Student",
      passwordHash: studentHash,
      role: Role.STUDENT,
      academicYear: "Year 2",
      monthlyAllowance: 1200,
      savingsGoal: 5000,
      university: "Apex Tech Campus",
      studentId: "STU-88219",
      currency: "USD",
      theme: "SYSTEM",
      budgetAlertThreshold: 80,
    },
  });

  // ── 3. Demo Admin ─────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@campuscoin.edu" },
    update: {},
    create: {
      email: "admin@campuscoin.edu",
      name: "Campus Coin Admin",
      passwordHash: adminHash,
      role: Role.ADMIN,
      university: "TechWiz Governance Board",
      studentId: "ADM-001",
      currency: "USD",
      theme: "DARK",
      budgetAlertThreshold: 80,
    },
  });

  console.log(`✅ Users created:`);
  console.log(`   Student → ${student.email}  (password: Student@123)`);
  console.log(`   Admin   → ${admin.email}  (password: Admin@123)\n`);

  // ── 4. SRS Default Categories (system-wide) ──────
  // Income categories from SRS
  const incomeCategories = [
    { name: "Allowance", icon: "Wallet", color: "#10B981" },
    { name: "Part-time Job", icon: "Briefcase", color: "#059669" },
    { name: "Scholarship", icon: "GraduationCap", color: "#6366F1" },
    { name: "Gift", icon: "Gift", color: "#EC4899" },
    { name: "Other Income", icon: "PlusCircle", color: "#8B5CF6" },
  ];

  // Expense categories from SRS
  const expenseCategories = [
    { name: "Food", icon: "Utensils", color: "#EF4444" },
    { name: "Transport", icon: "Bus", color: "#F59E0B" },
    { name: "Hostel/Rent", icon: "Home", color: "#10B981" },
    { name: "Academics", icon: "BookOpen", color: "#3B82F6" },
    { name: "Subscriptions", icon: "CreditCard", color: "#8B5CF6" },
    { name: "Entertainment", icon: "Music", color: "#EC4899" },
    { name: "Miscellaneous", icon: "Tag", color: "#6B7280" },
  ];

  const allDefaults = [
    ...incomeCategories.map((c) => ({ ...c, type: CategoryType.INCOME })),
    ...expenseCategories.map((c) => ({ ...c, type: CategoryType.EXPENSE })),
  ];

  const categoryMap: Record<string, string> = {};

  for (const cat of allDefaults) {
    // Upsert-style: find existing or create
    let existing = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type, userId: null },
    });
    if (!existing) {
      existing = await prisma.category.create({
        data: {
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
          isDefault: true,
          userId: null,
        },
      });
    }
    categoryMap[cat.name] = existing.id;
  }

  console.log(`✅ ${allDefaults.length} SRS default categories seeded\n`);

  // ── 5. Demo Transactions (last ~60 days) ──────────
  const txData: {
    categoryName: string;
    type: TransactionType;
    description: string;
    amount: number;
    daysAgoVal: number;
    method: PaymentMethod;
    merchant?: string;
  }[] = [
    // ─── INCOME ───
    { categoryName: "Allowance", type: TransactionType.INCOME, description: "Monthly allowance from parents", amount: 1200, daysAgoVal: 58, method: PaymentMethod.BANK_TRANSFER },
    { categoryName: "Allowance", type: TransactionType.INCOME, description: "Monthly allowance – July", amount: 1200, daysAgoVal: 28, method: PaymentMethod.BANK_TRANSFER },
    { categoryName: "Part-time Job", type: TransactionType.INCOME, description: "Campus bookstore shift – 2 weeks", amount: 320, daysAgoVal: 50, method: PaymentMethod.BANK_TRANSFER, merchant: "Apex Campus Bookstore" },
    { categoryName: "Part-time Job", type: TransactionType.INCOME, description: "Weekend tutoring sessions", amount: 180, daysAgoVal: 22, method: PaymentMethod.DIGITAL_WALLET, merchant: "Self-employed" },
    { categoryName: "Scholarship", type: TransactionType.INCOME, description: "Merit scholarship disbursement Q2", amount: 750, daysAgoVal: 45, method: PaymentMethod.BANK_TRANSFER, merchant: "University Finance" },
    { categoryName: "Gift", type: TransactionType.INCOME, description: "Birthday cash gift from grandparents", amount: 100, daysAgoVal: 35, method: PaymentMethod.CASH },

    // ─── EXPENSES ───
    // Food
    { categoryName: "Food", type: TransactionType.EXPENSE, description: "Campus cafeteria – weekly meals", amount: 42.5, daysAgoVal: 55, method: PaymentMethod.CAMPUS_CARD, merchant: "Campus Cafeteria" },
    { categoryName: "Food", type: TransactionType.EXPENSE, description: "Grocery run – snacks & essentials", amount: 38.75, daysAgoVal: 48, method: PaymentMethod.DEBIT_CARD, merchant: "SaveMart" },
    { categoryName: "Food", type: TransactionType.EXPENSE, description: "Pizza night with study group", amount: 15.0, daysAgoVal: 40, method: PaymentMethod.DIGITAL_WALLET, merchant: "Domino's" },
    { categoryName: "Food", type: TransactionType.EXPENSE, description: "Weekly cafeteria meals", amount: 45.0, daysAgoVal: 34, method: PaymentMethod.CAMPUS_CARD, merchant: "Campus Cafeteria" },
    { categoryName: "Food", type: TransactionType.EXPENSE, description: "Coffee & study snacks", amount: 12.5, daysAgoVal: 20, method: PaymentMethod.DIGITAL_WALLET, merchant: "Starbucks" },
    { categoryName: "Food", type: TransactionType.EXPENSE, description: "Grocery haul – meal prep", amount: 55.0, daysAgoVal: 14, method: PaymentMethod.DEBIT_CARD, merchant: "Walmart" },
    { categoryName: "Food", type: TransactionType.EXPENSE, description: "Late night ramen delivery", amount: 8.99, daysAgoVal: 7, method: PaymentMethod.DIGITAL_WALLET, merchant: "UberEats" },
    { categoryName: "Food", type: TransactionType.EXPENSE, description: "Campus café lunch", amount: 11.5, daysAgoVal: 3, method: PaymentMethod.CAMPUS_CARD, merchant: "Campus Café" },

    // Transport
    { categoryName: "Transport", type: TransactionType.EXPENSE, description: "Monthly bus pass", amount: 45.0, daysAgoVal: 56, method: PaymentMethod.DEBIT_CARD, merchant: "Metro Transit" },
    { categoryName: "Transport", type: TransactionType.EXPENSE, description: "Uber to airport – holiday break", amount: 28.5, daysAgoVal: 42, method: PaymentMethod.DIGITAL_WALLET, merchant: "Uber" },
    { categoryName: "Transport", type: TransactionType.EXPENSE, description: "Monthly bus pass – renewal", amount: 45.0, daysAgoVal: 26, method: PaymentMethod.DEBIT_CARD, merchant: "Metro Transit" },
    { categoryName: "Transport", type: TransactionType.EXPENSE, description: "Lyft to study group meetup", amount: 12.0, daysAgoVal: 10, method: PaymentMethod.DIGITAL_WALLET, merchant: "Lyft" },

    // Hostel/Rent
    { categoryName: "Hostel/Rent", type: TransactionType.EXPENSE, description: "Hostel rent – June", amount: 350.0, daysAgoVal: 57, method: PaymentMethod.BANK_TRANSFER, merchant: "University Housing" },
    { categoryName: "Hostel/Rent", type: TransactionType.EXPENSE, description: "Hostel rent – July", amount: 350.0, daysAgoVal: 27, method: PaymentMethod.BANK_TRANSFER, merchant: "University Housing" },

    // Academics
    { categoryName: "Academics", type: TransactionType.EXPENSE, description: "Data Structures textbook", amount: 65.0, daysAgoVal: 53, method: PaymentMethod.DEBIT_CARD, merchant: "Amazon" },
    { categoryName: "Academics", type: TransactionType.EXPENSE, description: "Lab equipment – physics kit", amount: 32.0, daysAgoVal: 38, method: PaymentMethod.DEBIT_CARD, merchant: "Campus Bookstore" },
    { categoryName: "Academics", type: TransactionType.EXPENSE, description: "Printing & binding for assignment", amount: 8.5, daysAgoVal: 15, method: PaymentMethod.CASH, merchant: "Campus Print Shop" },

    // Subscriptions
    { categoryName: "Subscriptions", type: TransactionType.EXPENSE, description: "Spotify Premium – student plan", amount: 5.99, daysAgoVal: 54, method: PaymentMethod.DEBIT_CARD, merchant: "Spotify" },
    { categoryName: "Subscriptions", type: TransactionType.EXPENSE, description: "Netflix – shared account", amount: 6.49, daysAgoVal: 54, method: PaymentMethod.DEBIT_CARD, merchant: "Netflix" },
    { categoryName: "Subscriptions", type: TransactionType.EXPENSE, description: "Spotify Premium – renewal", amount: 5.99, daysAgoVal: 24, method: PaymentMethod.DEBIT_CARD, merchant: "Spotify" },
    { categoryName: "Subscriptions", type: TransactionType.EXPENSE, description: "Netflix – renewal", amount: 6.49, daysAgoVal: 24, method: PaymentMethod.DEBIT_CARD, merchant: "Netflix" },
    { categoryName: "Subscriptions", type: TransactionType.EXPENSE, description: "GitHub Copilot student", amount: 10.0, daysAgoVal: 30, method: PaymentMethod.CREDIT_CARD, merchant: "GitHub" },

    // Entertainment
    { categoryName: "Entertainment", type: TransactionType.EXPENSE, description: "Movie night – campus screening", amount: 8.0, daysAgoVal: 44, method: PaymentMethod.CASH, merchant: "Campus Theater" },
    { categoryName: "Entertainment", type: TransactionType.EXPENSE, description: "Gaming – Steam summer sale", amount: 24.99, daysAgoVal: 36, method: PaymentMethod.DEBIT_CARD, merchant: "Steam" },
    { categoryName: "Entertainment", type: TransactionType.EXPENSE, description: "Concert tickets – college fest", amount: 35.0, daysAgoVal: 18, method: PaymentMethod.DIGITAL_WALLET, merchant: "BookMyShow" },

    // Miscellaneous
    { categoryName: "Miscellaneous", type: TransactionType.EXPENSE, description: "Laundry service", amount: 15.0, daysAgoVal: 49, method: PaymentMethod.CASH, merchant: "Campus Laundromat" },
    { categoryName: "Miscellaneous", type: TransactionType.EXPENSE, description: "Phone screen protector", amount: 12.0, daysAgoVal: 32, method: PaymentMethod.DIGITAL_WALLET, merchant: "Amazon" },
    { categoryName: "Miscellaneous", type: TransactionType.EXPENSE, description: "Haircut", amount: 18.0, daysAgoVal: 11, method: PaymentMethod.CASH, merchant: "Campus Barber" },
    { categoryName: "Miscellaneous", type: TransactionType.EXPENSE, description: "Stationery supplies", amount: 9.5, daysAgoVal: 5, method: PaymentMethod.DEBIT_CARD, merchant: "Staples" },
  ];

  let txCount = 0;
  for (const tx of txData) {
    const catId = categoryMap[tx.categoryName];
    if (!catId) {
      console.warn(`⚠️  Category "${tx.categoryName}" not found – skipping transaction: ${tx.description}`);
      continue;
    }
    await prisma.transaction.create({
      data: {
        userId: student.id,
        categoryId: catId,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        date: daysAgo(tx.daysAgoVal),
        paymentMethod: tx.method,
        merchant: tx.merchant ?? null,
      },
    });
    txCount++;
  }

  console.log(`✅ ${txCount} demo transactions created (spanning ~2 months)\n`);

  // ── 6. Saving Tips ────────────────────────────────
  const tips = [
    {
      title: "Campus Library Course Reserve Hack",
      content:
        "Check your university library's 2-hour Course Reserve before purchasing textbook access codes. Foundation courses retain physical and digital reserve copies.",
      category: TipCategory.TEXTBOOKS_ACADEMICS,
      estimatedSavings: 120,
      difficulty: TipDifficulty.EASY,
      isFeatured: true,
      upvotes: 42,
    },
    {
      title: "Student Transit Pass Benefit",
      content:
        "Activate your university transportation card for unlimited regional bus and subway access rather than paying single rides.",
      category: TipCategory.CAMPUS_HACKS,
      estimatedSavings: 45,
      difficulty: TipDifficulty.EASY,
      isFeatured: true,
      upvotes: 68,
    },
    {
      title: "Batch Dorm Cooking & Freezer Prep",
      content:
        "Prepare 4-portion curry, pasta bakes, or rice bowls every Sunday evening. Drastically cuts weeknight campus takeaway splurges.",
      category: TipCategory.FOOD_DINING,
      estimatedSavings: 60,
      difficulty: TipDifficulty.MODERATE,
      isFeatured: false,
      upvotes: 95,
    },
    {
      title: "Student Discount Aggregator",
      content:
        "Use UNiDAYS or Student Beans to unlock verified student discounts on tech, fashion, food, and software. Always check before purchasing online.",
      category: TipCategory.STUDENT_DISCOUNTS,
      estimatedSavings: 80,
      difficulty: TipDifficulty.EASY,
      isFeatured: true,
      upvotes: 112,
    },
    {
      title: "Shared Streaming & Software Bundles",
      content:
        "Split Netflix, Spotify Family, and cloud storage plans with 3-4 trusted friends. Average savings: 60-70% per person per month.",
      category: TipCategory.ENTERTAINMENT,
      estimatedSavings: 35,
      difficulty: TipDifficulty.EASY,
      isFeatured: false,
      upvotes: 77,
    },
  ];

  for (const tip of tips) {
    const existing = await prisma.savingTip.findFirst({ where: { title: tip.title } });
    if (!existing) {
      await prisma.savingTip.create({
        data: {
          title: tip.title,
          content: tip.content,
          category: tip.category,
          estimatedSavings: tip.estimatedSavings,
          difficulty: tip.difficulty,
          isFeatured: tip.isFeatured,
          upvotes: tip.upvotes,
        },
      });
    }
  }

  console.log(`✅ ${tips.length} saving tips seeded\n`);

  // ── 7. Demo Budgets (August & September 2026) ─────
  const demoBudgets = [
    { categoryName: "Food", amount: 150, month: "2026-09" },
    { categoryName: "Entertainment", amount: 40, month: "2026-09" },
    { categoryName: "Subscriptions", amount: 10, month: "2026-09" },
    { categoryName: "Transport", amount: 30, month: "2026-09" },
    { categoryName: "Academics", amount: 50, month: "2026-09" },
    // August budgets for previous month rollover testing
    { categoryName: "Food", amount: 200, month: "2026-08" },
    { categoryName: "Entertainment", amount: 50, month: "2026-08" },
    { categoryName: "Subscriptions", amount: 25, month: "2026-08" },
    { categoryName: "Transport", amount: 80, month: "2026-08" },
    { categoryName: "Hostel/Rent", amount: 350, month: "2026-08" },
  ];

  for (const b of demoBudgets) {
    const catId = categoryMap[b.categoryName];
    if (!catId) continue;
    const parts = b.month.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const startDate = new Date(Date.UTC(y, m, 1));
    const endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));

    await prisma.budget.upsert({
      where: {
        userId_categoryId_month: {
          userId: student.id,
          categoryId: catId,
          month: b.month,
        },
      },
      update: {
        amount: b.amount,
      },
      create: {
        userId: student.id,
        categoryId: catId,
        amount: b.amount,
        period: "MONTHLY",
        startDate,
        endDate,
        month: b.month,
        alertThreshold: 80,
      },
    });
  }
  console.log(`✅ Demo budgets seeded for August & September 2026\n`);

  // ── 8. Welcome Notification ───────────────────────
  await prisma.notification.upsert({
    where: { id: "seed-welcome-notif" },
    update: {},
    create: {
      id: "seed-welcome-notif",
      userId: student.id,
      type: "SYSTEM",
      title: "Welcome to Campus Coin! 🎓",
      message: "Start by adding your first transaction or setting up a monthly budget. Tap the + button to get started.",
      linkUrl: "/dashboard",
      isRead: false,
    },
  });

  console.log(`✅ Welcome notification created\n`);
  console.log("─".repeat(50));
  console.log("🎉 Seeding complete!");
  console.log("─".repeat(50));
  console.log("\n📋 Test Credentials:");
  console.log("   Student: student@campuscoin.edu / Student@123");
  console.log("   Admin:   admin@campuscoin.edu   / Admin@123\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
