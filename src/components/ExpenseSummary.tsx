import { PieChart, TrendingUp, ShieldCheck, DollarSign } from "lucide-react";
import { Expense } from "../types";

interface ExpenseSummaryProps {
  expenses: Expense[];
}

export function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCount = expenses.length;

  // カテゴリ別集計
  const categoryTotals: Record<string, number> = {};
  let invoiceCount = 0;

  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    if (e.invoiceNumber && e.invoiceNumber.startsWith("T")) {
      invoiceCount++;
    }
  });

  const invoiceRate = totalCount > 0 ? Math.round((invoiceCount / totalCount) * 100) : 0;
  const categoriesSorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* 合計経費カード */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-5 text-white shadow-sm border border-blue-800/40">
        <div className="flex items-center justify-between text-blue-200 text-xs mb-2">
          <span className="font-semibold uppercase tracking-wider">合計経費総額</span>
          <DollarSign className="w-4 h-4 text-cyan-300" />
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
          ¥{totalAmount.toLocaleString()}
        </div>
        <div className="text-xs text-blue-300 flex items-center space-x-2">
          <span>登録件数: {totalCount}件</span>
          <span>•</span>
          <span>平均: ¥{totalCount > 0 ? Math.round(totalAmount / totalCount).toLocaleString() : 0}/件</span>
        </div>
      </div>

      {/* インボイス対応状況カード */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
          <span className="font-semibold uppercase tracking-wider">インボイス適格率</span>
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline space-x-2 mb-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">{invoiceRate}%</span>
          <span className="text-xs text-slate-500">({invoiceCount}/{totalCount}件)</span>
        </div>
        {/* 進捗バー */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${invoiceRate}%` }}
          />
        </div>
      </div>

      {/* 勘定科目トップ内訳カード */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
          <span className="font-semibold uppercase tracking-wider">主な支出内訳</span>
          <PieChart className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="space-y-1.5 mt-1">
          {categoriesSorted.slice(0, 3).map(([cat, amount]) => {
            const pct = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;
            return (
              <div key={cat} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium truncate max-w-[120px]">{cat}</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800">¥{amount.toLocaleString()}</span>
                  <span className="text-slate-400 text-[10px] w-8 text-right">({pct}%)</span>
                </div>
              </div>
            );
          })}
          {categoriesSorted.length === 0 && (
            <div className="text-xs text-slate-400 py-1">データ集計中</div>
          )}
        </div>
      </div>
    </div>
  );
}
