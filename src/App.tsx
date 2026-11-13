import { useMemo, useRef, useState } from "react";
import { AlertCircle, RefreshCw, Calendar } from "lucide-react";
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
  // expenses が必ず配列になるよう安全ガードを適用（モック・サンプルデータは一切含めません）
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

  // 登録されているデータから「年月 (YYYY-MM)」のリストを自動抽出して重複を除外・降順ソート
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    expenses.forEach((expense) => {
      if (expense.date && expense.date.length >= 7) {
        monthsSet.add(expense.date.substring(0, 7)); // "YYYY-MM"
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [expenses]);

  // 月別にフィルタリングされたデータ（サマリー表示用など）
  const monthFilteredExpenses = useMemo(() => {
    if (selectedMonth === "all") return expenses;
    return expenses.filter((expense) => expense.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  // すべての条件（カテゴリ・月・検索クエリ）でフィルタリングされたテーブル用データ
  const filteredExpenses = useMemo(() => {
    return monthFilteredExpenses.filter((expense) => {
      const matchesCategory = selectedCategory === "all" || expense.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || [expense.merchant, expense.note, expense.invoiceNumber]
        .some((value) => value?.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [monthFilteredExpenses, selectedCategory, searchQuery]);

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

  // 選択中の月の合計金額（「すべて」選択時は全件の合計）
  const totalAmount = monthFilteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // "2026-11" のような文字列を "2026年11月" に変換するヘルパー
  const formatMonthLabel = (yearMonth: string) => {
    const [year, month] = yearMonth.split("-");
    return `${year}年${parseInt(month, 10)}月`;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header
        onOpenNewModal={openNewExpense}
        onOpenGuideModal={() => setIsGuideOpen(true)}
        toggleGemini={() => setIsGeminiOpen((open) => !open)}
        isGeminiOpen={isGeminiOpen}
        totalAmount={totalAmount}
        totalCount={monthFilteredExpenses.length}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Expense workspace</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">経費を、かんたん整理。</h2>
            <p className="mt-2 text-sm text-slate-500">レシートの記録から支出の確認まで、ここでまとめて管理できます。</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <span className="text-slate-500">{selectedMonth === "all" ? "総登録" : formatMonthLabel(selectedMonth)}</span>
            <span className="ml-2 font-bold text-slate-900">{monthFilteredExpenses.length}件</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="font-bold text-indigo-700">¥{totalAmount.toLocaleString()}</span>
          </div>
        </section>

        {/* 📅 月別アーカイブ・リンク切替タブ */}
        {availableMonths.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 mr-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>月別アーカイブ:</span>
            </div>
            <button
              onClick={() => setSelectedMonth("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedMonth === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              全期間 (すベて)
            </button>
            {availableMonths.map((ym) => {
              const count = expenses.filter((e) => e.date.startsWith(ym)).length;
              return (
                <button
                  key={ym}
                  onClick={() => setSelectedMonth(ym)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    selectedMonth === ym
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{formatMonthLabel(ym)}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedMonth === ym ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                    {count}件
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</span>
            <button onClick={() => void reload()} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-semibold text-red-700 shadow-sm">
              <RefreshCw className="h-3.5 w-3.5" />再読み込み
            </button>
          </div>
        )}

        <ExpenseSummary expenses={monthFilteredExpenses} />
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