import { Expense, ExpenseSummaryData, ChatMessage, OcrExtractedData } from "../types";

export async function fetchExpenses(params?: { category?: string; month?: string; search?: string }): Promise<{ expenses: Expense[]; summary: ExpenseSummaryData }> {
  const query = new URLSearchParams();
  if (params?.category) query.append("category", params.category);
  if (params?.month) query.append("month", params.month);
  if (params?.search) query.append("search", params.search);

  const res = await fetch(`/api/expenses?${query.toString()}`);
  if (!res.ok) throw new Error("経費データの取得に失敗しました");
  return res.json();
}

export async function createExpense(data: Partial<Expense>): Promise<Expense> {
  const res = await fetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("経費の保存に失敗しました");
  return res.json();
}

export async function updateExpense(id: number, data: Partial<Expense>): Promise<Expense> {
  const res = await fetch(`/api/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("経費の更新に失敗しました");
  return res.json();
}

export async function deleteExpense(id: number): Promise<void> {
  const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("経費の削除に失敗しました");
}

export async function analyzeReceipt(payload: { rawText?: string; samplePreset?: Partial<Expense>; imageBase64?: string }): Promise<{ success: boolean; data: OcrExtractedData }> {
  // ★ サーバー側（server.js）が受け取れるように { image: ... } の形にマッピングする
  const requestBody = payload.imageBase64 
    ? { image: payload.imageBase64 } 
    : payload;

  const res = await fetch("/api/ocr/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });
  if (!res.ok) throw new Error("レシート解析に失敗しました");
  return res.json();
}

export async function fetchChatHistory(): Promise<ChatMessage[]> {
  const res = await fetch("/api/chat");
  if (!res.ok) throw new Error("チャット履歴の取得に失敗しました");
  return res.json();
}

export async function sendChatMessage(message: string): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error("メッセージの送信に失敗しました");
  return res.json();
}

export async function clearChatHistory(): Promise<void> {
  const res = await fetch("/api/chat", { method: "DELETE" });
  if (!res.ok) throw new Error("チャット履歴の消去に失敗しました");
}