import { useState, useMemo } from "react";
import { Search, Filter, Trash2, Edit, Download, Calendar, Tag, CreditCard, CheckCircle, Clock } from "lucide-react";
import { Expense } from "../types";
import { CATEGORIES } from "../lib/sampleReceipts";
import { deleteExpense } from "../lib/api";

interface ExpenseTableProps {
  expenses: Expense[];
  onExpenseDeleted: () => void;
  onEditExpense: (expense: Expense) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function ExpenseTable({
  expenses,
  onExpenseDeleted,
  onEditExpense,
  selectedCategory,
  setSelectedCategory,
  selectedMonth,
  setSelectedMonth,
  searchQuery,
  setSearchQuery
}: ExpenseTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 利用可能な月リストの自動生成
  const months = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.date) set.add(e.date.substring(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [expenses]);

  // CSVエクスポート
  const handleExportCSV = () => {
    if (expenses.length === 0) {
      alert("出力するデータがありません");
      return;
    }
    const header = ["ID", "日付", "店名・支払先", "金額", "勘定科目", "税率", "インボイス番号", "支払方法", "備考"];
    const rows = expenses.map((e) => [
      e.id,
      e.date,
      `"${e.merchant.replace(/"/g, '""')}"`,
      e.amount,
      `"${e.category}"`,
      `${e.taxRate}%`,
      `"${e.invoiceNumber || ""}"`,
      `"${e.paymentMethod}"`,
      `"${(e.note || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `経費一覧_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("この経費データを削除してもよろしいですか？")) return;
    setDeletingId(id);
    try {
      await deleteExpense(id);
      onExpenseDeleted();
    } catch (err) {
      console.error(err);
      alert("削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  const totalFilteredAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 検索・フィルタリングバー */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* 検索ボックス */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="店名・備考・インボイス番号で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* カテゴリ選択 */}
          <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700 font-medium cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat === "すべて" ? "all" : cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 月別選択 */}
          {months.length > 0 && (
            <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent focus:outline-none text-slate-700 font-medium cursor-pointer"
              >
                <option value="all">全期間</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* CSVエクスポートボタン */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <div className="text-xs text-slate-500">
            該当: <span className="font-bold text-slate-800">{expenses.length}件</span> /{" "}
            <span className="font-bold text-blue-600">¥{totalFilteredAmount.toLocaleString()}</span>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl border border-slate-300 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>CSV出力</span>
          </button>
        </div>
      </div>

      {/* 経費一覧テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4">日付</th>
              <th className="py-3 px-4">利用店名 / 支払先</th>
              <th className="py-3 px-4">勘定科目</th>
              <th className="py-3 px-4 text-right">金額 (税込)</th>
              <th className="py-3 px-4 hidden md:table-cell">インボイス番号</th>
              <th className="py-3 px-4 hidden lg:table-cell">備考</th>
              <th className="py-3 px-4 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  経費データがありません。上のスキャナーからレシートを読み取ってください。
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                    {expense.date}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{expense.merchant}</div>
                    {expense.note && (
                      <div className="text-[11px] text-slate-400 lg:hidden truncate max-w-xs">{expense.note}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {expense.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                    ¥{expense.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell font-mono text-xs text-slate-500">
                    {expense.invoiceNumber ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                        {expense.invoiceNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell text-slate-500 max-w-xs truncate">
                    {expense.note || "-"}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onEditExpense(expense)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="編集"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
