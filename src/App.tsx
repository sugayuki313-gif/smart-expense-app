import { useMemo, useRef, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ExpenseModal } from "./components/ExpenseModal";
import { ExpenseSummary } from "./components/ExpenseSummary";
import { ExpenseTable } from "./components/ExpenseTable";
import { GeminiAssistantPanel } from "./components/GeminiAssistantPanel";
import { Header } from "./components/Header";
import { ReceiptScanner } from "./components/ReceiptScanner";
import { YearEndGuideModal } from "./components/YearEndGuideModal";
import { useExpenses } from "./hooks/useExpenses";
import { Expense } from "./types";

export function App() {
  const { expenses: rawExpenses, isLoading, error, reload } = useExpenses();
  // expenses が必ず配列になるよう安全ガードを適用
  const expenses = Array.isArray(rawExpenses) ? rawExpenses : [];

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [promptRequest, setPromptRequest] = useState<{ id: number; text: string } | null>(null);
  const promptId = useRef(0);

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    const matchesCategory = selectedCategory === "all" || expense.category === selectedCategory;
    const matchesMonth = selectedMonth === "all" || expense.date.startsWith(selectedMonth);
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [expense.merchant, expense.note, expense.invoiceNumber]
      .some((value) => value?.toLowerCase().includes(query));
    return matchesCategory && matchesMonth && matchesSearch;
  }), [expenses, selectedCategory, selectedMonth, searchQuery]);

  const openNewExpense = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const openEditor = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const askGemini = (text: string) => {
    promptId.current += 1;
    setPromptRequest({ id: promptId.current, text });
    setIsGeminiOpen(true);
  };

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header
        onOpenNewModal={openNewExpense}
        onOpenGuideModal={() => setIsGuideOpen(true)}
        toggleGemini={() => setIsGeminiOpen((open) => !open)}
        isGeminiOpen={isGeminiOpen}
        totalAmount={totalAmount}
        totalCount={expenses.length}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Expense workspace</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">経費を、かんたん整理。</h2>
            <p className="mt-2 text-sm text-slate-500">レシートの記録から支出の確認まで、ここでまとめて管理できます。</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <span className="text-slate-500">登録済み</span>
            <span className="ml-2 font-bold text-slate-900">{expenses.length}件</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="font-bold text-indigo-700">¥{totalAmount.toLocaleString()}</span>
          </div>
        </section>

        {error && (
          <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</span>
            <button onClick={() => void reload()} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-semibold text-red-700 shadow-sm">
              <RefreshCw className="h-3.5 w-3.5" />再読み込み
            </button>
          </div>
        )}

        <ExpenseSummary expenses={expenses} />
        <ReceiptScanner onExpenseAdded={() => void reload()} />
        <ExpenseTable
          expenses={filteredExpenses}
          onExpenseDeleted={() => void reload()}
          onEditExpense={openEditor}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        {isLoading && (
          <p className="mt-4 text-center text-xs text-slate-400" role="status">データを読み込んでいます...</p>
        )}
      </main>

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSaved={() => void reload()}
        editingExpense={editingExpense}
      />
      <YearEndGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onAskGemini={askGemini}
      />
      <GeminiAssistantPanel
        isOpen={isGeminiOpen}
        onClose={() => setIsGeminiOpen(false)}
        promptRequest={promptRequest}
      />
    </div>
  );
}