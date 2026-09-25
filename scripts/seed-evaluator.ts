import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { checkBudgetAlertsForCategory } from "../src/lib/notification-service";

async function provisionEvaluator() {
  console.log("Creating Evaluator Student Account...");

  const passwordHash = await bcrypt.hash("Student@Evaluator123", 10);
  const studentEmail = "student.evaluator@campuscoin.edu";

  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {
      passwordHash,
      role: "STUDENT",
      status: "ACTIVE",
    },
    create: {
      email: studentEmail,
      name: "Evaluator Student",
      passwordHash,
      role: "STUDENT",
      status: "ACTIVE",
      university: "Apex University",
      studentId: "EVAL-2026",
      academicYear: "Sophomore",
      monthlyAllowance: 1200,
      savingsGoal: 5000,
      currency: "USD",
      theme: "SYSTEM",
      budgetAlertThreshold: 80,
    },
  });

  console.log(`Evaluator student ready: ${student.email}`);

  // Fetch categories
  const categories = await prisma.category.findMany({
    where: { userId: null },
  });

  const foodCat = categories.find((c) => c.name === "Food & Dining" || c.name === "Food");
  const transportCat = categories.find((c) => c.name === "Transportation" || c.name === "Transport");
  const booksCat = categories.find((c) => c.name === "Academics & Books" || c.name === "Academics");
  const allowanceCat = categories.find((c) => c.name === "Monthly Allowance" || c.name === "Allowance");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Clean previous evaluator transactions/budgets/notifications if any
  await prisma.notification.deleteMany({ where: { userId: student.id } });
  await prisma.budget.deleteMany({ where: { userId: student.id } });
  await prisma.transaction.deleteMany({ where: { userId: student.id } });

  // 1. Initial Income: Monthly Allowance
  if (allowanceCat) {
    await prisma.transaction.create({
      data: {
        userId: student.id,
        categoryId: allowanceCat.id,
        amount: 1200.00,
        type: "INCOME",
        description: "Monthly Family Stipend",
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        paymentMethod: "BANK_TRANSFER",
      },
    });
  }

  // 2. Budget for Food: $350 (threshold: 80%)
  if (foodCat) {
    await prisma.budget.create({
      data: {
        userId: student.id,
        categoryId: foodCat.id,
        amount: 350.00,
        month: currentMonth,
        alertThreshold: 80,
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      },
    });

    // Add Food expense that reaches 85% ($298) -> triggers 80% warning
    await prisma.transaction.create({
      data: {
        userId: student.id,
        categoryId: foodCat.id,
        amount: 298.50,
        type: "EXPENSE",
        description: "Campus Dining Hall Meal Plan",
        merchant: "Campus Commons",
        date: new Date(now.getFullYear(), now.getMonth(), 3),
        paymentMethod: "CAMPUS_CARD",
      },
    });

    await checkBudgetAlertsForCategory(student.id, foodCat.id);
  }

  // 3. Books expense
  if (booksCat) {
    await prisma.transaction.create({
      data: {
        userId: student.id,
        categoryId: booksCat.id,
        amount: 85.00,
        type: "EXPENSE",
        description: "Semester CS Lab Manual",
        merchant: "University Bookstore",
        date: new Date(now.getFullYear(), now.getMonth(), 5),
        paymentMethod: "DEBIT_CARD",
      },
    });
  }

  // 4. Transport expense
  if (transportCat) {
    await prisma.transaction.create({
      data: {
        userId: student.id,
        categoryId: transportCat.id,
        amount: 45.00,
        type: "EXPENSE",
        description: "Monthly Transit Pass",
        merchant: "Metro Transit",
        date: new Date(now.getFullYear(), now.getMonth(), 2),
        paymentMethod: "DIGITAL_WALLET",
      },
    });
  }

  console.log("Evaluator Student test data successfully provisioned.");
}

provisionEvaluator()
  .catch((e) => {
    console.error("Provisioning error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
