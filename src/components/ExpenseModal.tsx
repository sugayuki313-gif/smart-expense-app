import { useState, useEffect } from "react";
import { X, Check, DollarSign, Calendar, Tag, CreditCard, FileText } from "lucide-react";
import { Expense } from "../types";
import { CATEGORIES } from "../lib/sampleReceipts";
import { createExpense, updateExpense } from "../lib/api";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingExpense: Expense | null;
}

export function ExpenseModal({ isOpen, onClose, onSaved, editingExpense }: ExpenseModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    merchant: "",
    amount: 0,
    category: "消耗品費",
    taxRate: 10,
    invoiceNumber: "",
    note: "",
    paymentMethod: "credit_card" as Expense["paymentMethod"]
  });

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        date: editingExpense.date,
        merchant: editingExpense.merchant,
        amount: editingExpense.amount,
        category: editingExpense.category,
        taxRate: editingExpense.taxRate,
        invoiceNumber: editingExpense.invoiceNumber || "",
        note: editingExpense.note || "",
        paymentMethod: editingExpense.paymentMethod
      });
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        merchant: "",
        amount: 0,
        category: "消耗品費",
        taxRate: 10,
        invoiceNumber: "",
        note: "",
        paymentMethod: "credit_card"
      });
    }
  }, [editingExpense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.merchant || formData.amount <= 0) {
      alert("店名と1円以上の金額を入力してください");
      return;
    }

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, formData);
      } else {
        await createExpense(formData);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert("経費の保存に失敗しました");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* モーダルヘッダー */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-5 py-4 text-white flex items-center justify-between">
          <h3 className="font-bold text-base">
            {editingExpense ? "経費データの編集" : "経費の手動入力・登録"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* フォーム本体 */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">利用店名 / 支払先 *</label>
            <input
              type="text"
              required
              placeholder="例: スターバックス コーヒー 新宿店"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">金額 (税込) *</label>
              <input
                type="number"
                required
                min={1}
                placeholder="1000"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-indigo-700"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">利用日</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">勘定科目</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {CATEGORIES.filter((c) => c !== "すべて").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">税率</label>
              <select
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value={10}>10% (標準税率)</option>
                <option value={8}>8% (軽減税率)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">インボイス登録番号</label>
              <input
                type="text"
                placeholder="例: T1234567890123"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">支払方法</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="credit_card">クレジットカード</option>
                <option value="cash">現金</option>
                <option value="ic_card">交通系IC</option>
                <option value="electronic_money">電子マネー / QR</option>
                <option value="bank_transfer">銀行振込</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">用途・備考</label>
            <textarea
              rows={2}
              placeholder="会議用、プロジェクト名など"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl shadow-md transition"
            >
              <Check className="w-4 h-4" />
              <span>保存する</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
