import { X, CheckCircle, FileText, Calendar, Sparkles } from "lucide-react";

interface YearEndGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskGemini: (prompt: string) => void;
}

const STEPS = [
  {
    step: "STEP 1",
    title: "10月中旬〜: 控除証明書を集める",
    desc: "生命保険・地震保険・iDeCoなどの「保険料控除証明書」が自宅に届きます。なくさないよう保管しましょう。"
  },
  {
    step: "STEP 2",
    title: "11月上旬〜: 申告書の記入・Web入力",
    desc: "会社から配布される「扶養控除等申告書」「保険料控除申告書」「基礎控除・配偶者控除申告書」に記入します。"
  },
  {
    step: "STEP 3",
    title: "11月下旬〜: 書類を会社へ提出",
    desc: "控除証明書の原本を添付して提出します（電子申請の場合は指示に従ってPDF添付等）。"
  },
  {
    step: "STEP 4",
    title: "12月〜1月給与: 還付金の受け取り",
    desc: "計算された過払い税金が給与と一緒に還付金として振り込まれ、源泉徴収票が交付されます。"
  }
];

export function YearEndGuideModal({ isOpen, onClose, onAskGemini }: YearEndGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-300" />
            <h3 className="font-bold text-base sm:text-lg">図解・年末調整のわかりやすいやり方</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs sm:text-sm text-blue-900">
            <p className="font-bold mb-1">💡 年末調整とは？</p>
            毎月の給与から天引きされている概算の所得税を、1年間の実際の所得・控除をもとに正しく再計算する手続きです。多くの場合、払いすぎた税金が戻ってきます（還付）。
          </div>

          {/* ステップ */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-800">手続きの4つのステップ</h4>
            {STEPS.map((s, idx) => (
              <div key={idx} className="flex space-x-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-bold text-xs bg-indigo-600 text-white px-2 py-1 rounded-md h-fit whitespace-nowrap">
                  {s.step}
                </span>
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900">{s.title}</h5>
                  <p className="text-xs text-slate-600 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* よくある質問・Geminiへ相談 */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-bold text-sm text-slate-800 mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>疑問点をGemini AIに詳しく聞く</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onClose();
                  onAskGemini("保険料控除申告書の計算方法と添付書類を詳しく教えて");
                }}
                className="text-left text-xs p-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg transition font-medium text-slate-700"
              >
                👉 保険料控除の計算・上限について
              </button>
              <button
                onClick={() => {
                  onClose();
                  onAskGemini("住宅ローン控除で必要な書類と確定申告との違いを教えて");
                }}
                className="text-left text-xs p-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg transition font-medium text-slate-700"
              >
                👉 住宅ローン控除のやり方
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
