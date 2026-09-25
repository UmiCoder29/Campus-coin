export interface RawCsvRow {
  date?: string;
  amount?: string | number;
  type?: string;
  description?: string;
  category?: string;
  paymentMethod?: string;
  merchant?: string;
  notes?: string;
}

export interface ParsedCsvTransaction {
  id: string; // client temporary id
  date: string;
  amount: number;
  type: "EXPENSE" | "INCOME";
  description: string;
  categoryName?: string;
  categoryId?: string;
  paymentMethod: "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "CAMPUS_CARD" | "DIGITAL_WALLET" | "BANK_TRANSFER";
  merchant?: string;
  notes?: string;
  included: boolean;
  isValid: boolean;
  errors: string[];
  isAiCategorized?: boolean;
}

/**
 * Robust CSV Line Parser handling quotes, commas, and escapes (RFC 4180 compliant)
 */
export function parseCsvText(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = "";
  let insideQuotes = false;

  const text = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === "," || char === ";") {
        currentRow.push(currentVal.trim());
        currentVal = "";
      } else if (char === "\n") {
        currentRow.push(currentVal.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Identifies column indices by fuzzy header name matching
 */
export function detectColumnIndices(headers: string[]): Record<string, number> {
  const norm = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const indices: Record<string, number> = {};

  norm.forEach((header, index) => {
    if (["date", "transactiondate", "txdate", "posteddate"].includes(header)) {
      indices.date = index;
    } else if (["amount", "cost", "price", "val", "debit", "credit"].includes(header)) {
      indices.amount = index;
    } else if (["desc", "description", "details", "narrative", "item", "memo"].includes(header)) {
      indices.description = index;
    } else if (["category", "cat", "classification", "typecategory"].includes(header)) {
      indices.category = index;
    } else if (["type", "trxtype", "transactiontype", "direction"].includes(header)) {
      indices.type = index;
    } else if (["merchant", "payee", "vendor", "store"].includes(header)) {
      indices.merchant = index;
    } else if (["paymentmethod", "method", "account", "source"].includes(header)) {
      indices.paymentMethod = index;
    } else if (["notes", "note", "comment"].includes(header)) {
      indices.notes = index;
    }
  });

  return indices;
}

/**
 * Matches a raw category string to the best available user category
 */
export function findBestCategoryMatch(
  rawName: string,
  categories: Array<{ id: string; name: string }>
): { id: string; name: string } | null {
  if (!rawName) return null;
  const clean = rawName.toLowerCase().trim();

  // 1. Exact match
  const exact = categories.find((c) => c.name.toLowerCase() === clean);
  if (exact) return exact;

  // 2. Starts with / contains match
  const contains = categories.find(
    (c) =>
      clean.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(clean)
  );
  if (contains) return contains;

  // 3. Keyword heuristic match
  const map: Record<string, string[]> = {
    food: ["dining", "groceries", "restaurant", "cafe", "coffee", "meal", "lunch", "snack"],
    transport: ["travel", "bus", "train", "uber", "transit", "subway", "metro", "fuel", "gas"],
    academics: ["books", "tuition", "course", "supplies", "stationery", "school", "exam"],
    housing: ["rent", "dorm", "utilities", "electric", "water", "wifi", "internet"],
    entertainment: ["movie", "game", "party", "concert", "outing", "hobby"],
    shopping: ["clothes", "apparel", "amazon", "electronics", "shoes"],
    health: ["pharmacy", "medicine", "doctor", "gym", "wellness"],
    income: ["allowance", "salary", "stipend", "wages", "scholarship", "freelance"],
  };

  for (const [catKeyword, synonyms] of Object.entries(map)) {
    if (synonyms.some((syn) => clean.includes(syn))) {
      const match = categories.find((c) => c.name.toLowerCase().includes(catKeyword));
      if (match) return match;
    }
  }

  return null;
}
