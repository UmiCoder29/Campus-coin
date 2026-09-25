import {
  PrismaClient,
  CategoryType,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Running Production-Safe Seed (No demo data)...\n");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@campuscoin.edu";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const adminHash = await bcrypt.hash(adminPassword, 10);

  // 1. Provision Platform Admin
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.ADMIN,
      name: "Campus Coin Platform Administrator",
    },
    create: {
      email: adminEmail,
      name: "Campus Coin Platform Administrator",
      passwordHash: adminHash,
      role: Role.ADMIN,
      university: "Platform Governance Board",
      studentId: "ADM-PROD-01",
      currency: "USD",
      theme: "SYSTEM",
      budgetAlertThreshold: 80,
    },
  });

  console.log(`✅ Production Admin provisioned: ${admin.email}`);

  // 2. SRS Standard Default Categories (System-Wide, userId: null, isDefault: true)
  const defaultCategories: Array<{
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
  }> = [
    // Income
    { name: "Monthly Allowance", type: CategoryType.INCOME, icon: "Wallet", color: "#10B981" },
    { name: "Part-Time Job", type: CategoryType.INCOME, icon: "Briefcase", color: "#06B6D4" },
    { name: "Scholarship / Aid", type: CategoryType.INCOME, icon: "GraduationCap", color: "#8B5CF6" },
    { name: "Freelance & Gigs", type: CategoryType.INCOME, icon: "Laptop", color: "#F59E0B" },
    { name: "Other Income", type: CategoryType.INCOME, icon: "Coins", color: "#14B8A6" },

    // Expense
    { name: "Food & Dining", type: CategoryType.EXPENSE, icon: "Utensils", color: "#EF4444" },
    { name: "Groceries", type: CategoryType.EXPENSE, icon: "ShoppingBag", color: "#F97316" },
    { name: "Academics & Books", type: CategoryType.EXPENSE, icon: "BookOpen", color: "#6366F1" },
    { name: "Housing & Dorm", type: CategoryType.EXPENSE, icon: "Home", color: "#84CC16" },
    { name: "Transportation", type: CategoryType.EXPENSE, icon: "Bus", color: "#3B82F6" },
    { name: "Entertainment", type: CategoryType.EXPENSE, icon: "Film", color: "#EC4899" },
    { name: "Personal Care", type: CategoryType.EXPENSE, icon: "Heart", color: "#A855F7" },
    { name: "Digital Subscriptions", type: CategoryType.EXPENSE, icon: "Repeat", color: "#64748B" },
    { name: "Miscellaneous", type: CategoryType.EXPENSE, icon: "Tag", color: "#94A3B8" },
  ];

  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: {
        userId: null,
        name: cat.name,
        type: cat.type,
      },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          ...cat,
          isDefault: true,
          userId: null,
        },
      });
    }
  }

  console.log(`✅ ${defaultCategories.length} SRS default categories verified/created.`);

  // 3. Platform System Announcements
  const existingAnnouncements = await prisma.announcement.count();
  if (existingAnnouncements === 0) {
    await prisma.announcement.create({
      data: {
        title: "Welcome to Campus Coin NextGen",
        body: "Your end-to-end student budgeting and financial intelligence platform is live. Set your monthly allowance, configure category thresholds, and track personal expenses.",
        category: "GENERAL",
        isActive: true,
        broadcasted: true,
      },
    });
    console.log("✅ Platform welcome announcement seeded.");
  }

  console.log("\n🚀 Production seed complete. Zero demo transactions or demo students inserted.\n");
}

main()
  .catch((e) => {
    console.error("Production seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
