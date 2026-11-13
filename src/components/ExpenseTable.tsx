import { useState, useMemo } from "react";
import { Search, Filter, Trash2, Edit, Download, Calendar, Tag, CreditCard, CheckCircle, Clock, X } from "lucide-react";
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
  
  // CSVエクスポート用のモーダル表示状態と設定
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvScope, setCsvScope] = useState<"current" | "month" | "year" | "all">("current");
  const [selectedCsvMonth, setSelectedCsvMonth] = useState<string>("");
  const [selectedCsvYear, setSelectedCsvYear] = useState<string>("");
  const [csvSortOrder, setCsvSortOrder] = useState<"asc" | "desc">("asc"); // asc: 古い順, desc: 新しい順

  // 利用可能な月リスト（YYYY-MM）の自動生成
  const months = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.date) set.add(e.date.substring(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [expenses]);

  // 利用可能な年リスト（YYYY）の自動生成
  const years = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.date && e.date.length >= 4) set.add(e.date.substring(0, 4));
    });
    return Array.from(set).sort().reverse();
  }, [expenses]);

  // CSVエクスポート実行処理
  const handleExecuteExportCSV = () => {
    let targetExpenses = [...expenses];
    let fileSuffix = "全期間";

    if (csvScope === "current") {
      targetExpenses = [...expenses];
      fileSuffix = selectedMonth === "all" ? "一覧" : `${selectedMonth}`;
    } else if (csvScope === "month") {
      if (!selectedCsvMonth) {
        alert("出力する月を選択してください");
        return;
      }
      targetExpenses = expenses.filter((e) => e.date.startsWith(selectedCsvMonth));
      fileSuffix = selectedCsvMonth;
    } else if (csvScope === "year") {
      if (!selectedCsvYear) {
        alert("出力する年を選択してください");
        return;
      }
      targetExpenses = expenses.filter((e) => e.date.startsWith(selectedCsvYear));
      fileSuffix = `${selectedCsvYear}年`;
    } else if (csvScope === "all") {
      targetExpenses = [...expenses];
      fileSuffix = "全期間フル";
    }

    if (targetExpenses.length === 0) {
      alert("選択された条件に該当するデータがありません");
      return;
    }

    // 日付でソート（asc: 古い順 / desc: 新しい順）
    targetExpenses.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return csvSortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    const header = ["ID", "日付", "店名・支払先", "金額", "勘定科目", "税率", "インボイス番号", "支払方法", "備考"];
    const rows = targetExpenses.map((e) => [
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
    a.download = `経費一覧_${fileSuffix}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setIsCsvModalOpen(false);
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
            onClick={() => {
              if (months.length > 0 && !selectedCsvMonth) setSelectedCsvMonth(months[0]);
              if (years.length > 0 && !selectedCsvYear) setSelectedCsvYear(years[0]);
              setIsCsvModalOpen(true);
            }}
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

      {/* CSV出力オプション設定モーダル */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-600" />
                CSV出力オプション
              </h3>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* 出力範囲の選択 */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">出力する範囲</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="csvScope"
                      checked={csvScope === "current"}
                      onChange={() => setCsvScope("current")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">現在の表示・選択中フィルターに準拠する</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="csvScope"
                      checked={csvScope === "month"}
                      onChange={() => setCsvScope("month")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">月を指定して出力 (月別)</span>
                  </label>
                  {csvScope === "month" && (
                    <div className="ml-6">
                      <select
                        value={selectedCsvMonth}
                        onChange={(e) => setSelectedCsvMonth(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {months.map((m) => (
                          <option key={m} value={m}>{m}分</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="csvScope"
                      checked={csvScope === "year"}
                      onChange={() => setCsvScope("year")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">年を指定して出力 (年別)</span>
                  </label>
                  {csvScope === "year" && (
                    <div className="ml-6">
                      <select
                        value={selectedCsvYear}
                        onChange={(e) => setSelectedCsvYear(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {years.map((y) => (
                          <option key={y} value={y}>{y}年</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="csvScope"
                      checked={csvScope === "all"}
                      onChange={() => setCsvScope("all")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">全期間のデータをすべて出力 (フル)</span>
                  </label>
                </div>
              </div>

              {/* ソート順の選択 */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block font-semibold text-slate-700 mb-1.5">日付の並び順 (ソート)</label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="csvSortOrder"
                      checked={csvSortOrder === "asc"}
                      onChange={() => setCsvSortOrder("asc")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 text-xs">古い順 (昇順: 1日→末日)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="csvSortOrder"
                      checked={csvSortOrder === "desc"}
                      onChange={() => setCsvSortOrder("desc")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 text-xs">新しい順 (降順)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* モーダル下部ボタン */}
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                キャンセル
              </button>
              <button
                onClick={handleExecuteExportCSV}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSVをダウンロード</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}