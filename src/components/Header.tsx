import { Receipt, Sparkles, BookOpen, PlusCircle, HelpCircle } from "lucide-react";

interface HeaderProps {
  onOpenNewModal: () => void;
  onOpenGuideModal: () => void;
  toggleGemini: () => void;
  isGeminiOpen: boolean;
  totalAmount: number;
  totalCount: number;
}

export function Header({
  onOpenNewModal,
  onOpenGuideModal,
  toggleGemini,
  isGeminiOpen,
  totalAmount,
  totalCount
}: HeaderProps) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* ロゴとアプリ名 */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">スマート経費AI</h1>
              <span className="text-[10px] font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                OCR & Gemini AI
              </span>
            </div>
            <p className="text-xs text-slate-400">レシート撮影自動入力 ＆ 年末調整・税務相談</p>
          </div>
        </div>

        {/* クイック集計表示 */}
        <div className="hidden md:flex items-center space-x-4 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          <div className="text-xs text-slate-400">
            登録経費: <span className="text-white font-semibold">{totalCount}件</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="text-xs text-slate-400">
            合計金額: <span className="text-cyan-400 font-bold">¥{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* アクションボタン群 */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenGuideModal}
            className="flex items-center space-x-1.5 text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 transition"
            title="年末調整のやり方ガイド"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">年末調整ガイド</span>
          </button>

          <button
            onClick={onOpenNewModal}
            className="flex items-center space-x-1.5 text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg shadow-sm font-medium transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">手動入力</span>
          </button>

          <button
            onClick={toggleGemini}
            className={`flex items-center space-x-1.5 text-xs sm:text-sm px-3.5 py-2 rounded-lg font-medium transition shadow-md ${
              isGeminiOpen
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white ring-2 ring-blue-400"
                : "bg-gradient-to-r from-slate-800 to-indigo-950 text-blue-300 border border-blue-500/40 hover:border-blue-400"
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>Gemini AI相談</span>
          </button>
        </div>
      </div>
    </header>
  );
}
