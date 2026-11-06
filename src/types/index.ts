export interface Expense {
  id: number;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  taxRate: number;
  invoiceNumber?: string | null;
  imageUrl?: string | null;
  note?: string | null;
  status: "confirmed" | "pending";
  paymentMethod: "credit_card" | "cash" | "electronic_money" | "ic_card" | "bank_transfer";
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummaryData {
  totalAmount: number;
  totalCount: number;
  categorySummary: Record<string, number>;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  category?: string | null;
  createdAt: string;
}

export interface OcrExtractedData {
  date: string;
  merchant: string;
  amount: number;
  category: string;
  taxRate: number;
  invoiceNumber?: string | null;
  note?: string | null;
  imageUrl?: string | null;
  paymentMethod: Expense["paymentMethod"];
}
