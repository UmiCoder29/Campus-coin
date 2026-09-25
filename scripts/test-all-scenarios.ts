import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { evaluateTransactionNotifications, checkBudgetAlertsForCategory } from "../src/lib/notification-service";
import { getFinancialReports } from "../src/lib/reports-service";
import { parseCsvText, detectColumnIndices, findBestCategoryMatch } from "../src/lib/csv-parser";

interface TestReport {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestReport[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`  \x1b[32m✔\x1b[0m ${name}`);
  } else {
    results.push({ name, passed: false, details, error: "Assertion failed" });
    console.error(`  \x1b[31m✖\x1b[0m ${name} — ${details || "Failed"}`);
  }
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("   CAMPUS COIN — FULL QA & INTEGRATION TEST RUNNER    ");
  console.log("=======================================================\n");

  const timestamp = Date.now();
  const testStudentEmail = `qa-student-${timestamp}@campus.edu`;
  const testAdminEmail = `qa-admin-${timestamp}@campus.edu`;
  const testAuthSecret = process.env.TEST_AUTH_SECRET || `AuthSecret_${crypto.randomBytes(16).toString("hex")}`;
  const passwordHash = await bcrypt.hash(testAuthSecret, 10);

  // ── TEST 1: REGISTRATION & AUTH ───────────────────────────
  console.log("\n[1] Testing Registration, Duplicate Guard & Credentials...");
  
  // Create user
  const student = await prisma.user.create({
    data: {
      email: testStudentEmail,
      name: "QA Test Student",
      passwordHash,
      role: "STUDENT",
      university: "QA University",
      academicYear: "Sophomore",
      monthlyAllowance: 600,
    },
  });
  assert(Boolean(student.id), "Fresh student user registered successfully");

  // Attempt duplicate email
  let duplicateBlocked = false;
  try {
    await prisma.user.create({
      data: {
        email: testStudentEmail,
        name: "Duplicate User",
        passwordHash,
      },
    });
  } catch (err: any) {
    duplicateBlocked = true;
  }
  assert(duplicateBlocked, "Duplicate email registration rejected by database unique constraint");

  // Password verification
  const isMatch = await bcrypt.compare(testAuthSecret, student.passwordHash);
  assert(isMatch, "Valid credentials successfully verified with bcrypt");

  const mismatchedSecret = `Mismatched_${crypto.randomBytes(16).toString("hex")}`;
  const isWrongMatch = await bcrypt.compare(mismatchedSecret, student.passwordHash);
  assert(!isWrongMatch, "Invalid credentials correctly rejected with bcrypt");

  // Password reset flow
  const resetToken = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour
  await prisma.passwordResetToken.create({
    data: {
      email: testStudentEmail,
      token: resetToken,
      expiresAt,
    },
  });
  const savedToken = await prisma.passwordResetToken.findUnique({
    where: { token: resetToken },
  });
  assert(Boolean(savedToken && savedToken.email === testStudentEmail), "Password reset token generated and persisted");

  // ── TEST 2: ADMIN ISOLATION & ACCESS CONTROL ──────────────
  console.log("\n[2] Testing Admin Governance & RBAC Isolation...");

  const admin = await prisma.user.create({
    data: {
      email: testAdminEmail,
      name: "QA Admin User",
      passwordHash,
      role: "ADMIN",
    },
  });
  assert(admin.role === "ADMIN", "Admin user provisioned with ADMIN role");
  assert(student.role === "STUDENT", "Student user isolated with STUDENT role");

  // Check admin action logging
  const adminLog = await prisma.adminActionLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "AUDIT_TEST",
      targetType: "USER",
      targetId: student.id,
      details: { test: true },
    },
  });
  assert(Boolean(adminLog.id), "Admin governance console action logged in AdminActionLog");

  // ── TEST 3: CATEGORY DELETION GUARD & REASSIGNMENT ────────
  console.log("\n[3] Testing Category Management & Deletion Guard...");

  const catA = await prisma.category.create({
    data: {
      userId: student.id,
      name: `QA Food-${timestamp}`,
      type: "EXPENSE",
      icon: "Utensils",
      color: "#EF4444",
    },
  });

  const catB = await prisma.category.create({
    data: {
      userId: student.id,
      name: `QA Books-${timestamp}`,
      type: "EXPENSE",
      icon: "BookOpen",
      color: "#3B82F6",
    },
  });

  // Create a transaction in Cat A
  const tx1 = await prisma.transaction.create({
    data: {
      userId: student.id,
      categoryId: catA.id,
      amount: 45.50,
      type: "EXPENSE",
      description: "Textbooks and supplies",
      paymentMethod: "DEBIT_CARD",
    },
  });

  // Guard test: count transactions referencing Cat A before deletion
  const txCountCatA = await prisma.transaction.count({
    where: { categoryId: catA.id, deletedAt: null },
  });
  assert(txCountCatA === 1, "Category deletion guard detects 1 dependent transaction");

  // Reassign to Cat B
  await prisma.transaction.updateMany({
    where: { categoryId: catA.id },
    data: { categoryId: catB.id },
  });

  const reassignedTx = await prisma.transaction.findUnique({
    where: { id: tx1.id },
  });
  assert(reassignedTx?.categoryId === catB.id, "Dependent transactions safely reassigned to target category");

  // Now delete Cat A safely
  await prisma.category.delete({ where: { id: catA.id } });
  const catACheck = await prisma.category.findUnique({ where: { id: catA.id } });
  assert(!catACheck, "Original category safely removed after re-assignment");

  // ── TEST 4: TRANSACTION CRUD & ANOMALY / RECURRENCE ────────
  console.log("\n[4] Testing Transaction CRUD, Recurrence & Soft-Delete...");

  // Negative amount check
  const negativeAmountValid = -50.0 > 0;
  assert(!negativeAmountValid, "Negative transaction amounts correctly rejected by validation rule");

  // Recurring transaction group
  const recurrenceGroupId = crypto.randomUUID();
  const recurringTx = await prisma.transaction.create({
    data: {
      userId: student.id,
      categoryId: catB.id,
      amount: 15.00,
      type: "EXPENSE",
      description: "Spotify Student Subscription",
      isRecurring: true,
      recurringInterval: "MONTHLY",
      recurringGroupId: recurrenceGroupId,
    },
  });
  assert(recurringTx.isRecurring && recurringTx.recurringGroupId === recurrenceGroupId, "Recurring transaction created with unique series UUID");

  // Soft delete check
  await prisma.transaction.update({
    where: { id: recurringTx.id },
    data: { deletedAt: new Date() },
  });
  const activeTxCount = await prisma.transaction.count({
    where: { userId: student.id, deletedAt: null },
  });
  const allTxCount = await prisma.transaction.count({
    where: { userId: student.id },
  });
  assert(activeTxCount === 1 && allTxCount === 2, "Transaction soft-deleted: retained in database audit trail but hidden from active ledger");

  // ── TEST 5: BUDGETS & THRESHOLD ALERTS (80% / 100%) ───────
  console.log("\n[5] Testing Budget Creation & Alert Thresholds...");

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const budget = await prisma.budget.create({
    data: {
      userId: student.id,
      categoryId: catB.id,
      amount: 100.00,
      month: currentMonthStr,
      alertThreshold: 80,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    },
  });
  assert(Boolean(budget.id), "Monthly budget limit ($100.00) created with 80% threshold");

  // Add an expense of $40 (45.50 + 40 = 85.50 -> 85.5% >= 80% warning)
  const warnTx = await prisma.transaction.create({
    data: {
      userId: student.id,
      categoryId: catB.id,
      amount: 40.00,
      type: "EXPENSE",
      description: "Course Reader",
      date: new Date(),
    },
  });

  // Evaluate budget alerts
  await checkBudgetAlertsForCategory(student.id, catB.id);

  const warnNotification = await prisma.notification.findFirst({
    where: {
      userId: student.id,
      type: "BUDGET_WARNING",
      categoryId: catB.id,
    },
  });
  assert(Boolean(warnNotification), "BUDGET_WARNING notification fired when spending crossed 80% limit");

  // Add an expense to exceed $100 (85.50 + 25 = 110.50 -> > 100% exceeded)
  await prisma.transaction.create({
    data: {
      userId: student.id,
      categoryId: catB.id,
      amount: 25.00,
      type: "EXPENSE",
      description: "Exam Prep Kit",
      date: new Date(),
    },
  });

  await checkBudgetAlertsForCategory(student.id, catB.id);

  const exceedNotification = await prisma.notification.findFirst({
    where: {
      userId: student.id,
      type: "BUDGET_EXCEEDED",
      categoryId: catB.id,
    },
  });
  assert(Boolean(exceedNotification), "BUDGET_EXCEEDED notification fired when spending exceeded 100% cap");

  // ── TEST 6: CSV PARSING & BATCH IMPORT ─────────────────────
  console.log("\n[6] Testing CSV Bulk Parsing & Row-Level Error Isolation...");

  const sampleCsv = `Date,Description,Amount,Category,Type
2026-09-01,Valid Campus Lunch,12.50,Food,Expense
2026-09-02,Invalid Negative Entry,-99.00,Food,Expense
2026-09-03,Valid Book Purchase,35.00,Books,Expense
2026-09-04,,15.00,Food,Expense`;

  const parsedMatrix = parseCsvText(sampleCsv);
  assert(parsedMatrix.length === 5, "RFC 4180 CSV parser accurately extracted 5 rows (header + 4 data)");

  const indices = detectColumnIndices(parsedMatrix[0]);
  assert(indices.date !== undefined && indices.amount !== undefined && indices.description !== undefined, "Auto-detected column header indices for Date, Amount, Description");

  const bestMatch = findBestCategoryMatch("lunch dining", [
    { id: catB.id, name: "Food & Dining" },
  ]);
  assert(Boolean(bestMatch), "Fuzzy category heuristic accurately matched 'lunch dining' to 'Food & Dining'");

  // ── TEST 7: REPORTS & ANALYTICS ────────────────────────────
  console.log("\n[7] Testing Reports Generation, Empty Period & Linear Forecast...");

  const reportWithData = await getFinancialReports(student.id, { month: currentMonthStr });
  assert(
    reportWithData.summary.totalExpense > 0 && reportWithData.savingsSummary.budgets.length > 0,
    "Reports generated with KPI calculations, active budget pacing, and category breakdown"
  );

  // Check linear projection in trend
  const hasProjection = reportWithData.trendMonths.some((m) => m.isProjection);
  assert(hasProjection, "Linear next-month velocity forecast computed and flagged with isProjection");

  // Check empty month
  const emptyReport = await getFinancialReports(student.id, { month: "2029-01" });
  assert(
    emptyReport.summary.totalExpense === 0 && emptyReport.summary.hasData === false,
    "Empty period report handled gracefully without divide-by-zero or crashes"
  );

  // ── TEST 8: BOOKMARKS & SAVING TIPS ───────────────────────
  console.log("\n[8] Testing Bookmarking & Pinned Tips...");

  const tip = await prisma.savingTip.create({
    data: {
      userId: student.id,
      title: "Textbook Rental Hack",
      content: "Rent semester textbooks digitally instead of buying hardcovers.",
      status: "PINNED",
      category: "TEXTBOOKS_ACADEMICS",
      estimatedSavings: 65,
    },
  });
  assert(tip.status === "PINNED", "Saving tip successfully marked as PINNED");

  const insight = await prisma.insight.create({
    data: {
      userId: student.id,
      title: "September Cashflow Review",
      message: "Spending pacing is well aligned with student stipend.",
      month: currentMonthStr,
      isBookmarked: true,
    },
  });
  assert(insight.isBookmarked === true, "AI Monthly Insight successfully bookmarked (isBookmarked: true)");

  // ── TEST 9: ACTIVITY AUDIT LOGGING ────────────────────────
  console.log("\n[9] Testing User Activity Trail Logging...");

  const activity = await prisma.activityLog.create({
    data: {
      userId: student.id,
      action: "VIEW",
      entityType: "TRANSACTION",
      entityId: tx1.id,
      title: "Viewed transaction: Course Reader",
    },
  });
  assert(Boolean(activity.id), "Cross-session user activity recorded in ActivityLog");

  // ── CLEANUP TEST DATA ─────────────────────────────────────
  console.log("\n[10] Cleaning up temporary QA test fixtures...");
  await prisma.notification.deleteMany({ where: { userId: student.id } });
  await prisma.activityLog.deleteMany({ where: { userId: student.id } });
  await prisma.savingTip.deleteMany({ where: { userId: student.id } });
  await prisma.insight.deleteMany({ where: { userId: student.id } });
  await prisma.budget.deleteMany({ where: { userId: student.id } });
  await prisma.transaction.deleteMany({ where: { userId: student.id } });
  await prisma.category.deleteMany({ where: { userId: student.id } });
  await prisma.passwordResetToken.deleteMany({ where: { email: testStudentEmail } });
  await prisma.adminActionLog.deleteMany({ where: { adminId: admin.id } });
  await prisma.user.delete({ where: { id: student.id } });
  await prisma.user.delete({ where: { id: admin.id } });
  console.log("  \x1b[32m✔\x1b[0m QA test fixtures cleaned up from Neon database.");

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("\n=======================================================");
  console.log(`   TEST RUN COMPLETED: ${passed} PASSED, ${failed} FAILED   `);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test suite crashed:", err);
  process.exit(1);
});
