import { prisma } from "@/lib/prisma";

export type ActivityAction =
  | "VIEW"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "EXPORT"
  | "IMPORT"
  | "EMAIL";

export type ActivityEntityType =
  | "TRANSACTION"
  | "REPORT"
  | "INSIGHT"
  | "BUDGET"
  | "SAVING_TIP";

export interface LogActivityParams {
  userId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId?: string | null;
  title: string;
  details?: Record<string, any>;
}

/**
 * Persists an auditable user activity record in ActivityLog.
 */
export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        title: params.title,
        details: params.details || {},
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
}

/**
 * Marks a transaction as viewed, updates lastViewedAt timestamp, and records an activity entry.
 */
export async function recordTransactionView(userId: string, transactionId: string) {
  try {
    const tx = await prisma.transaction.updateMany({
      where: { id: transactionId, userId, deletedAt: null },
      data: { lastViewedAt: new Date() },
    });

    return tx;
  } catch (error) {
    console.error("Failed to record transaction view:", error);
    return null;
  }
}

/**
 * Returns recent activity stream for a user.
 */
export async function getRecentActivities(userId: string, limit = 10) {
  try {
    return await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Failed to fetch recent activities:", error);
    return [];
  }
}

/**
 * Returns recently viewed or edited transactions across sessions.
 */
export async function getRecentTransactions(userId: string, limit = 6) {
  try {
    return await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: [
        { lastViewedAt: "desc" },
        { updatedAt: "desc" },
      ],
      take: limit,
    });
  } catch (error) {
    console.error("Failed to fetch recent transactions:", error);
    return [];
  }
}
