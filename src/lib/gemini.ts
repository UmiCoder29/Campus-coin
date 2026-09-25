import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * GEMINI SERVER-SIDE CLIENT WRAPPER
 * 
 * Rules:
 * 1. Server-side only (never expose GEMINI_API_KEY to the client).
 * 2. Silent & graceful failure: Missing key, quota exhaustion, network drops,
 *    or malformed output NEVER throw 500 errors to user workflows.
 * 3. Minimal data payloads: Only category names, types, and aggregated month numbers
 *    are sent. Never raw transaction rows, merchant PII, or student identities.
 * 4. Multi-model resilience: Tries primary flash model, cascading to fast fallbacks.
 */

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export function isGeminiConfigured(): boolean {
  return Boolean(apiKey && apiKey.length > 5 && !apiKey.startsWith("your-"));
}

const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-2.5-flash-lite",
];

async function generateWithFallback(
  prompt: string,
  temperature = 0.1,
  jsonMode = true
): Promise<{ text: string; modelName: string } | null> {
  if (!genAI || !isGeminiConfigured()) return null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature,
          ...(jsonMode ? { responseMimeType: "application/json" } : {}),
        },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) {
        return { text, modelName };
      }
    } catch (err: any) {
      console.warn(`Gemini model ${modelName} notice:`, err?.message?.slice(0, 120) || "unavailable");
    }
  }
  return null;
}

export interface CategorySummary {
  id: string;
  name: string;
  type: string;
}

export interface BatchCategorizationItem {
  id?: string;
  description: string;
  type: string; // "EXPENSE" | "INCOME"
}

export interface CategorizationResult {
  description: string;
  suggestedCategoryId: string | null;
  suggestedCategoryName: string | null;
  confidence?: number;
}

/**
 * Categorizes a single transaction description against the user's category list.
 * Fails gracefully and returns null if Gemini is unconfigured or errors.
 */
export async function suggestCategoryWithGemini(
  description: string,
  type: "EXPENSE" | "INCOME",
  categories: CategorySummary[]
): Promise<CategorizationResult> {
  const fallback: CategorizationResult = {
    description,
    suggestedCategoryId: null,
    suggestedCategoryName: null,
  };

  if (!description || description.trim().length < 2 || categories.length === 0) {
    return fallback;
  }

  if (!isGeminiConfigured() || !genAI) {
    return fallback;
  }

  try {
    const matchingCategories = categories.filter((c) => c.type === type);
    if (matchingCategories.length === 0) return fallback;

    const categoryNames = matchingCategories.map((c) => c.name);

    const prompt = `You are a financial category classifier for college students.
Match this transaction to the single best category from the provided candidate list.
Transaction Type: ${type}
Description: "${description.trim()}"
Available Categories: ${JSON.stringify(categoryNames)}

Respond with JSON only:
{"category": "<Exact category name from the list, or null if none match>"}
`;

    const res = await generateWithFallback(prompt, 0.1, true);
    if (!res || !res.text) return fallback;

    const parsed = JSON.parse(res.text);
    const chosenName = parsed.category;

    if (chosenName && chosenName !== "null" && chosenName !== "none") {
      const found = matchingCategories.find(
        (c) => c.name.toLowerCase() === String(chosenName).toLowerCase()
      );
      if (found) {
        return {
          description,
          suggestedCategoryId: found.id,
          suggestedCategoryName: found.name,
          confidence: 0.9,
        };
      }
    }

    return fallback;
  } catch (error) {
    console.warn("Gemini categorization unavailable (graceful fallback):", error instanceof Error ? error.message : error);
    return fallback;
  }
}

/**
 * Batch-capable categorization function.
 * Categorizes an array of transaction descriptions against the user's category list.
 * Suitable for multi-row CSV imports or bulk editing.
 */
export async function suggestCategoriesBatchWithGemini(
  items: BatchCategorizationItem[],
  categories: CategorySummary[]
): Promise<CategorizationResult[]> {
  const fallbackList: CategorizationResult[] = items.map((item) => ({
    description: item.description,
    suggestedCategoryId: null,
    suggestedCategoryName: null,
  }));

  if (items.length === 0 || categories.length === 0 || !isGeminiConfigured() || !genAI) {
    return fallbackList;
  }

  // If single item, reuse single method
  if (items.length === 1) {
    const single = await suggestCategoryWithGemini(
      items[0].description,
      items[0].type as "EXPENSE" | "INCOME",
      categories
    );
    return [single];
  }

  try {
    const expenseCats = categories.filter((c) => c.type === "EXPENSE").map((c) => c.name);
    const incomeCats = categories.filter((c) => c.type === "INCOME").map((c) => c.name);

    const simplifiedItems = items.map((it, idx) => ({
      index: idx,
      description: it.description,
      type: it.type,
    }));

    const prompt = `You are a financial category classifier for college student transactions.
For each transaction, pick the single best category matching its type.
Expense categories: ${JSON.stringify(expenseCats)}
Income categories: ${JSON.stringify(incomeCats)}

Transactions to categorize:
${JSON.stringify(simplifiedItems)}

Return a JSON array of objects:
[{"index": 0, "category": "<Exact category name or null>"}]
`;

    const res = await generateWithFallback(prompt, 0.1, true);
    if (!res || !res.text) return fallbackList;

    const parsedArray = JSON.parse(res.text);
    if (!Array.isArray(parsedArray)) return fallbackList;

    const results: CategorizationResult[] = [...fallbackList];
    for (const r of parsedArray) {
      const idx = r.index;
      const catName = r.category;
      if (idx !== undefined && idx >= 0 && idx < results.length && catName) {
        const itemType = items[idx].type;
        const matched = categories.find(
          (c) => c.type === itemType && c.name.toLowerCase() === String(catName).toLowerCase()
        );
        if (matched) {
          results[idx] = {
            description: items[idx].description,
            suggestedCategoryId: matched.id,
            suggestedCategoryName: matched.name,
            confidence: 0.85,
          };
        }
      }
    }

    return results;
  } catch (error) {
    console.warn("Gemini batch categorization unavailable (graceful fallback):", error instanceof Error ? error.message : error);
    return fallbackList;
  }
}

/**
 * Aggregated Monthly Financial Summary for Gemini Narrative Generation
 */
export interface MonthlyInsightInput {
  monthStr: string; // YYYY-MM
  monthName: string;
  year: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
    twoMonthAvg: number | null;
    percentChangeVsAvg: number | null;
  }>;
  budgetStatus: Array<{
    categoryName: string;
    limit: number;
    spent: number;
    percentage: number;
    isOver: boolean;
  }>;
  allowanceGoalDiff?: number;
}

export interface GeneratedInsightResult {
  title: string;
  summaryText: string; // 2-4 sentences
  tipText: string;     // 1 concrete, actionable recommendation
  month: string;
  generatedAt: Date;
  model: string;
}

/**
 * Gathers compact monthly financial statistics and prompts Gemini for a concise,
 * 2-4 sentence narrative plus 1 concrete actionable recommendation.
 * Returns null if Gemini is unconfigured or encounters an error.
 */
export async function generateMonthlyInsightWithGemini(
  input: MonthlyInsightInput
): Promise<GeneratedInsightResult | null> {
  if (!isGeminiConfigured() || !genAI) {
    return null;
  }

  try {
    const prompt = `You are Campus Coin's AI Financial Mentor for university students.
Analyze this compact monthly student spending summary for ${input.monthName} ${input.year}:

- Total Income: $${input.totalIncome.toFixed(2)}
- Total Expenses: $${input.totalExpense.toFixed(2)}
- Net Cashflow: $${input.netSavings.toFixed(2)} (${input.savingsRate}% savings rate)
- Top Categories: ${JSON.stringify(input.topCategories)}
- Category Budgets: ${JSON.stringify(input.budgetStatus)}

Write an encouraging, objective financial check-in for the student:
1. "title": A short, punchy headline (e.g., "Strong Dining Discipline" or "Mid-Semester Pacing Alert").
2. "summaryText": Exactly 2 to 4 sentences highlighting the most notable pattern(s) in their spending (e.g. surge in textbooks, under-budget dining, or tight net balance).
3. "tipText": Exactly ONE concrete, highly specific actionable suggestion tailored for college life (e.g., library reserve textbooks, dorm meal prep, campus bus card).

Return strictly JSON:
{
  "title": "string",
  "summaryText": "string",
  "tipText": "string"
}
`;

    const res = await generateWithFallback(prompt, 0.3, true);
    if (!res || !res.text) return null;

    const parsed = JSON.parse(res.text);
    if (!parsed.title || !parsed.summaryText || !parsed.tipText) {
      return null;
    }

    return {
      title: parsed.title.trim(),
      summaryText: parsed.summaryText.trim(),
      tipText: parsed.tipText.trim(),
      month: input.monthStr,
      generatedAt: new Date(),
      model: res.modelName,
    };
  } catch (error) {
    console.warn("Gemini monthly insight generation unavailable (graceful fallback):", error instanceof Error ? error.message : error);
    return null;
  }
}
