import { prisma } from "@/lib/prisma";
import { getMonthBounds } from "@/lib/budget-service";
import { TipCategory, TipDifficulty } from "@prisma/client";

export interface EvaluatedTipCandidate {
  ruleType: string;
  targetCategory?: string;
  title: string;
  content: string;
  category: TipCategory;
  impactScore: number;
  estimatedSavings: number;
  difficulty: TipDifficulty;
  tags: string[];
}

/**
 * Maps category name strings to TipCategory Prisma enum
 */
export function mapCategoryToTipCategory(name: string): TipCategory {
  const lower = name.toLowerCase();
  if (lower.includes("food") || lower.includes("dining") || lower.includes("grocer") || lower.includes("meal")) {
    return TipCategory.FOOD_DINING;
  }
  if (lower.includes("book") || lower.includes("academ") || lower.includes("tuit") || lower.includes("course") || lower.includes("stationery")) {
    return TipCategory.TEXTBOOKS_ACADEMICS;
  }
  if (lower.includes("hostel") || lower.includes("rent") || lower.includes("hous") || lower.includes("dorm") || lower.includes("utilit")) {
    return TipCategory.HOUSING_LIVING;
  }
  if (lower.includes("entertain") || lower.includes("movie") || lower.includes("game") || lower.includes("subscript")) {
    return TipCategory.ENTERTAINMENT;
  }
  if (lower.includes("transp") || lower.includes("bus") || lower.includes("train") || lower.includes("fuel") || lower.includes("uber")) {
    return TipCategory.CAMPUS_HACKS;
  }
  return TipCategory.STUDENT_DISCOUNTS;
}

/**
 * FULLY RULE-BASED SAVING TIPS ENGINE (NO AI INVOLVEMENT)
 * Evaluates real transaction history against 5 deterministic financial rules:
 * 1. SURGE_VS_AVERAGE: Category spend > 20% above 2-month baseline
 * 2. BUDGET_PACE_EXCEEDED: Daily spend velocity projected to exceed category budget
 * 3. SUBSCRIPTION_AUDIT: High recurring subscription overhead
 * 4. UNBUDGETED_SPIKE: Significant spend on category with no budget limit set
 * 5. DISCRETIONARY_SAVINGS: Dining + Entertainment > 35% of total spend
 */
export async function evaluateRuleBasedTips(userId: string, targetMonth?: string | null) {
  const bounds = getMonthBounds(targetMonth);
  const now = new Date();

  // 1. Check user transaction density & prior month presence for Low-Data handling
  const totalUserTxCount = await prisma.transaction.count({
    where: { userId, deletedAt: null },
  });

  const priorMonthDates = [
    getMonthBounds(bounds.previousMonthStr),
    getMonthBounds(getMonthBounds(bounds.previousMonthStr).previousMonthStr),
  ];

  // Count prior months with at least one transaction
  let priorMonthsWithData = 0;
  for (const p of priorMonthDates) {
    const c = await prisma.transaction.count({
      where: {
        userId,
        deletedAt: null,
        type: "EXPENSE",
        date: { gte: p.startDate, lte: p.endDate },
      },
    });
    if (c > 0) priorMonthsWithData++;
  }

  // Low data check: Need at least 4 transactions total across the platform
  if (totalUserTxCount < 4) {
    return {
      isLowData: true,
      message: "Add a few more transactions across your campus routine to unlock personalized savings advice!",
      tips: [],
    };
  }

  // 2. Fetch current month expenses grouped by category
  const currentMonthAgg = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: "EXPENSE",
      deletedAt: null,
      date: { gte: bounds.startDate, lte: bounds.endDate },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  // Calculate current month total expense
  let currentMonthTotalExpense = 0;
  const currentCategoryMap = new Map<string, { spent: number; txCount: number }>();
  for (const item of currentMonthAgg) {
    const amt = item._sum.amount ? Number(item._sum.amount) : 0;
    currentMonthTotalExpense += amt;
    currentCategoryMap.set(item.categoryId, { spent: amt, txCount: item._count.id });
  }

  // 3. Fetch active budgets for current month
  const activeBudgets = await prisma.budget.findMany({
    where: { userId, month: bounds.monthStr },
    include: { category: true },
  });
  const budgetMap = new Map<string, number>();
  for (const b of activeBudgets) {
    budgetMap.set(b.categoryId, Number(b.amount));
  }

  // 4. Fetch all user categories (system default + user-created)
  const categories = await prisma.category.findMany({
    where: {
      OR: [{ isDefault: true }, { userId }],
      type: "EXPENSE",
    },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // 5. Calculate 2-month historical monthly average per category
  const historicalAvgMap = new Map<string, number>();
  if (priorMonthsWithData > 0) {
    const earliestPriorDate = priorMonthDates[priorMonthDates.length - 1].startDate;
    const latestPriorDate = priorMonthDates[0].endDate;

    const priorAgg = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        type: "EXPENSE",
        deletedAt: null,
        date: { gte: earliestPriorDate, lte: latestPriorDate },
      },
      _sum: { amount: true },
    });

    for (const item of priorAgg) {
      const totalPriorSpent = item._sum.amount ? Number(item._sum.amount) : 0;
      const avg = totalPriorSpent / priorMonthsWithData;
      historicalAvgMap.set(item.categoryId, avg);
    }
  }

  // Time calculations for velocity & pacing
  const lastDayOfMonth = bounds.endDate.getUTCDate();
  let dayOfMonth = lastDayOfMonth;
  if (now.getUTCFullYear() === bounds.year && now.getUTCMonth() === bounds.monthIndex) {
    dayOfMonth = Math.max(1, now.getUTCDate());
  } else if (now < bounds.startDate) {
    dayOfMonth = 1;
  }
  const daysRemaining = Math.max(1, lastDayOfMonth - dayOfMonth);
  const monthProgressRatio = dayOfMonth / lastDayOfMonth;

  const candidates: EvaluatedTipCandidate[] = [];

  // =======================================================================
  // RULE 1: Category Surge vs. Historical Monthly Average
  // =======================================================================
  for (const [catId, currentData] of currentCategoryMap.entries()) {
    const cat = categoryMap.get(catId);
    if (!cat) continue;
    const histAvg = historicalAvgMap.get(catId);

    // Requires history and minimum $15 surge
    if (histAvg && histAvg > 10 && currentData.spent > histAvg * 1.2 && (currentData.spent - histAvg) >= 15) {
      const surgePercent = Math.round(((currentData.spent - histAvg) / histAvg) * 100);
      const excess = currentData.spent - histAvg;

      candidates.push({
        ruleType: "SURGE_VS_AVERAGE",
        targetCategory: cat.name,
        title: `${cat.name} Spend is ${surgePercent}% Above Normal`,
        content: `You've spent $${currentData.spent.toFixed(2)} on ${cat.name} this month, surpassing your 2-month average of $${histAvg.toFixed(2)}. Pausing non-essential ${cat.name.toLowerCase()} purchases for the remaining ${daysRemaining} days could save you ~$${excess.toFixed(0)}.`,
        category: mapCategoryToTipCategory(cat.name),
        impactScore: excess,
        estimatedSavings: Number(excess.toFixed(2)),
        difficulty: TipDifficulty.EASY,
        tags: ["Historical Trend", "Surge Alert", cat.name],
      });
    }
  }

  // =======================================================================
  // RULE 2: Budget Pace Exceeded (Velocity Projection)
  // =======================================================================
  for (const [catId, budgetLimit] of budgetMap.entries()) {
    const cat = categoryMap.get(catId);
    if (!cat || budgetLimit <= 0) continue;
    const currentData = currentCategoryMap.get(catId) || { spent: 0, txCount: 0 };

    const dailyVelocity = currentData.spent / dayOfMonth;
    const projectedSpend = dailyVelocity * lastDayOfMonth;

    if (projectedSpend > budgetLimit && (projectedSpend - budgetLimit) >= 10) {
      const overrun = projectedSpend - budgetLimit;
      const remainingBudget = Math.max(0, budgetLimit - currentData.spent);
      const safeDailyCap = remainingBudget / daysRemaining;

      candidates.push({
        ruleType: "BUDGET_PACE_EXCEEDED",
        targetCategory: cat.name,
        title: `Pacing Alert: ${cat.name} on Track to Exceed Budget`,
        content: `At your current velocity of $${dailyVelocity.toFixed(2)}/day, you're projected to spend $${projectedSpend.toFixed(2)} on ${cat.name} ($${overrun.toFixed(0)} over your $${budgetLimit.toFixed(0)} limit). Cap spending to $${safeDailyCap.toFixed(2)}/day for the next ${daysRemaining} days to stay green.`,
        category: mapCategoryToTipCategory(cat.name),
        impactScore: overrun * 1.1, // Priority weighting for hard budget caps
        estimatedSavings: Number(overrun.toFixed(2)),
        difficulty: TipDifficulty.MODERATE,
        tags: ["Budget Limit", "Pacing", cat.name],
      });
    }
  }

  // =======================================================================
  // RULE 3: Recurring Subscriptions Audit
  // =======================================================================
  const subscriptionCategory = categories.find((c) =>
    c.name.toLowerCase().includes("subscript")
  );
  if (subscriptionCategory) {
    const subData = currentCategoryMap.get(subscriptionCategory.id);
    const subSpend = subData ? subData.spent : 0;

    if (subSpend >= 20 || (currentMonthTotalExpense > 0 && (subSpend / currentMonthTotalExpense) > 0.08)) {
      candidates.push({
        ruleType: "SUBSCRIPTION_AUDIT",
        targetCategory: subscriptionCategory.name,
        title: "Audit Active Subscriptions & Recurring Bills",
        content: `You've logged $${subSpend.toFixed(2)} in subscriptions this month. Check for duplicate media plans, split family streaming memberships with roommates, or activate student discount pricing (Spotify Student, Prime Student, GitHub Pack) to save $15–$30/mo.`,
        category: TipCategory.ENTERTAINMENT,
        impactScore: Math.max(25, subSpend * 0.35),
        estimatedSavings: 25.0,
        difficulty: TipDifficulty.EASY,
        tags: ["Subscriptions", "Student Perks", "Recurring"],
      });
    }
  }

  // =======================================================================
  // RULE 4: Unbudgeted Spending Spike
  // =======================================================================
  for (const [catId, currentData] of currentCategoryMap.entries()) {
    const cat = categoryMap.get(catId);
    if (!cat) continue;
    const hasBudget = budgetMap.has(catId);

    // Spend >= $35 in a category without a budget
    if (!hasBudget && currentData.spent >= 35) {
      const estimatedBenefit = currentData.spent * 0.2; // 20% reduction target
      candidates.push({
        ruleType: "UNBUDGETED_SPIKE",
        targetCategory: cat.name,
        title: `Uncapped Spend Detected: ${cat.name}`,
        content: `You've spent $${currentData.spent.toFixed(2)} on ${cat.name} this month with no budget target configured. Establishing a monthly target cap of $${(currentData.spent * 0.85).toFixed(0)} prevents undetected financial leakage.`,
        category: mapCategoryToTipCategory(cat.name),
        impactScore: estimatedBenefit,
        estimatedSavings: Number(estimatedBenefit.toFixed(2)),
        difficulty: TipDifficulty.EASY,
        tags: ["Unbudgeted", "Goal Setting", cat.name],
      });
    }
  }

  // =======================================================================
  // RULE 5: Discretionary Dining & Entertainment Optimization
  // =======================================================================
  let discretionarySpend = 0;
  for (const [catId, currentData] of currentCategoryMap.entries()) {
    const cat = categoryMap.get(catId);
    if (!cat) continue;
    const lower = cat.name.toLowerCase();
    if (lower.includes("food") || lower.includes("dining") || lower.includes("entertain") || lower.includes("misc")) {
      discretionarySpend += currentData.spent;
    }
  }

  if (currentMonthTotalExpense > 50 && (discretionarySpend / currentMonthTotalExpense) > 0.35) {
    const discretionaryPercent = Math.round((discretionarySpend / currentMonthTotalExpense) * 100);
    const potentialSaving = discretionarySpend * 0.15; // 15% optimization

    candidates.push({
      ruleType: "DISCRETIONARY_SAVINGS",
      targetCategory: "Food & Entertainment",
      title: "Campus Dining & Discretionary Optimization",
      content: `Discretionary dining and entertainment comprise ${discretionaryPercent}% ($${discretionarySpend.toFixed(2)}) of your total spending. Swapping just 2 takeout meals each week for dorm meal prep or campus dining hall passes can save ~$${potentialSaving.toFixed(0)} monthly.`,
      category: TipCategory.FOOD_DINING,
      impactScore: potentialSaving,
      estimatedSavings: Number(potentialSaving.toFixed(2)),
      difficulty: TipDifficulty.MODERATE,
      tags: ["Dining Hacks", "Discretionary", "Meal Prep"],
    });
  }

  // 6. Rank candidates by estimated savings impact (descending)
  candidates.sort((a, b) => b.impactScore - a.impactScore);

  // Take top 3 to 5 candidate tips
  const topCandidates = candidates.slice(0, 5);

  // If no candidates triggered by rules, provide high-value standard student tip
  if (topCandidates.length === 0) {
    topCandidates.push({
      ruleType: "CAMPUS_COMMUTE_BENEFIT",
      targetCategory: "Transport",
      title: "Activate University Transit Pass Subsidy",
      content: "Most colleges offer subsidized semester public transit or shuttle passes via student card. Utilizing campus transit over ride-shares saves typical students $35–$60 monthly.",
      category: TipCategory.CAMPUS_HACKS,
      impactScore: 40,
      estimatedSavings: 45.0,
      difficulty: TipDifficulty.EASY,
      tags: ["Transit", "Campus Hacks"],
    });
  }

  // 7. Synchronize with Database:
  // Fetch existing user tips for this month to preserve PINNED and respect DISMISSED
  const existingTips = await prisma.savingTip.findMany({
    where: {
      userId,
      month: bounds.monthStr,
    },
  });

  const existingMap = new Map<string, (typeof existingTips)[0]>();
  for (const t of existingTips) {
    const key = `${t.ruleType || ""}_${t.targetCategory || ""}`;
    existingMap.set(key, t);
  }

  // Persist top candidates into DB
  for (const candidate of topCandidates) {
    const key = `${candidate.ruleType}_${candidate.targetCategory || ""}`;
    const existing = existingMap.get(key);

    if (existing) {
      // If already dismissed, do not reactivate
      if (existing.status === "DISMISSED") {
        continue;
      }
      // Update content and impactScore
      await prisma.savingTip.update({
        where: { id: existing.id },
        data: {
          title: candidate.title,
          content: candidate.content,
          impactScore: candidate.impactScore,
          estimatedSavings: candidate.estimatedSavings,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new ACTIVE tip
      await prisma.savingTip.create({
        data: {
          userId,
          title: candidate.title,
          content: candidate.content,
          category: candidate.category,
          targetCategory: candidate.targetCategory,
          ruleType: candidate.ruleType,
          status: "ACTIVE",
          month: bounds.monthStr,
          impactScore: candidate.impactScore,
          estimatedSavings: candidate.estimatedSavings,
          difficulty: candidate.difficulty,
          tags: candidate.tags,
        },
      });
    }
  }

  // Fetch final user tips ordered: PINNED first, then by impactScore descending
  const finalTips = await prisma.savingTip.findMany({
    where: {
      userId,
      month: bounds.monthStr,
    },
    orderBy: [
      { status: "asc" }, // "ACTIVE" or "PINNED"
      { impactScore: "desc" },
    ],
  });

  return {
    isLowData: false,
    month: bounds.monthStr,
    tips: finalTips,
  };
}

/**
 * Updates a tip's status: ACTIVE, PINNED, or DISMISSED.
 * Scoped strictly to the authenticated userId.
 */
export async function updateTipStatus(userId: string, tipId: string, status: "ACTIVE" | "PINNED" | "DISMISSED") {
  const tip = await prisma.savingTip.findFirst({
    where: { id: tipId, userId },
  });

  if (!tip) {
    throw new Error("Tip not found or unauthorized");
  }

  return await prisma.savingTip.update({
    where: { id: tipId },
    data: { status },
  });
}
