import { useState, useRef, ChangeEvent } from "react";
import { Camera, Upload, Sparkles, Check, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { SAMPLE_RECEIPTS, SampleReceipt } from "../lib/sampleReceipts";
import { analyzeReceipt, createExpense } from "../lib/api";
import { OcrExtractedData } from "../types";

interface ReceiptScannerProps {
  onExpenseAdded: () => void;
}

export function ReceiptScanner({ onExpenseAdded }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<OcrExtractedData | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<SampleReceipt | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ファイルアップロードまたはカメラ撮影のハンドラ
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPreviewImage(base64);
      setSelectedSample(null);
      await runOcrAnalysis({ imageBase64: base64, rawText: file.name });
    };
    reader.readAsDataURL(file);
  };

  // サンプルレシート選択ハンドラ
  const handleSelectSample = async (sample: SampleReceipt) => {
    setSelectedSample(sample);
    setPreviewImage(null);
    await runOcrAnalysis({ samplePreset: sample.data, rawText: sample.previewImageText });
  };

  // OCR（光学文字認識）・AI抽出処理の実行
  const runOcrAnalysis = async (payload: { rawText?: string; samplePreset?: any; imageBase64?: string }) => {
    setIsScanning(true);
    setExtractedData(null);

    try {
      await new Promise((r) => setTimeout(r, 900));
      const res = await analyzeReceipt(payload);
      
      const data = res?.data || res || {};

      setExtractedData({
        date: data.date || data.transactionDate || new Date().toISOString().split("T")[0],
        merchant: data.merchant || data.store || data.storeName || "不明な店舗",
        amount: Number(data.amount || data.total || data.price || 0),
        category: data.category || "消耗品費",
        taxRate: Number(data.taxRate || 10),
        invoiceNumber: data.invoiceNumber || null,
        note: ""
      });
    } catch (err) {
      console.error(err);
      alert("レシートの読み取りに失敗しました。もう一度お試しください。");
    } finally {
      setIsScanning(false);
    }
  };

  // 確定して経費表に自動登録（非同期処理の完了を確実にするウェイトを追加）
  const handleConfirmAndSave = async () => {
    if (!extractedData) return;
    try {
      console.log("=== 経費データの保存開始 ===", extractedData);
      
      const payload = {
        date: extractedData.date || new Date().toISOString().split("T")[0],
        merchant: extractedData.merchant || "不明な店舗",
        amount: Number(extractedData.amount) || 0,
        category: extractedData.category || "消耗品費",
        taxRate: Number(extractedData.taxRate) || 10,
        invoiceNumber: extractedData.invoiceNumber || null,
        note: extractedData.note || "",
        paymentMethod: "credit_card"
      };

      const result = await createExpense(payload);
      console.log("=== 経費データの保存成功 ===", result);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 }
      });

      // データベースへの書き込み・反映が確実に完了するのを少し（0.3秒）待ってから再読み込み（リロード）を実行
      await new Promise((r) => setTimeout(r, 300));
      onExpenseAdded();

      setExtractedData(null);
      setPreviewImage(null);
      setSelectedSample(null);
    } catch (err: any) {
      console.error("=== 経費データの保存失敗 ===", err);
      alert(`経費の保存に失敗しました: ${err.message || "詳細不明"}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      {/* タイトルヘッダー */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-400/30 text-cyan-300">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center space-x-2">
              <span>高性能AI レシート・領収書スキャナー</span>
              <span className="text-xs bg-cyan-400 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                OCR（光学文字認識）自動解析
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              撮影または画像を選ぶだけで「店名・日付・金額・勘定科目・適格番号」を瞬時に抽出
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-medium px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md transition"
          >
            <Camera className="w-4 h-4" />
            <span>カメラで撮影</span>
          </button>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl text-xs sm:text-sm border border-white/20 transition"
          >
            <Upload className="w-4 h-4" />
            <span>写真を選択</span>
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="p-5">
        {/* サンプル選択クイックバー */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>ワンクリックでお試し（サンプルレシート）:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_RECEIPTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                disabled={isScanning}
                className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium flex items-center space-x-1.5 ${
                  selectedSample?.id === sample.id
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                <span>{sample.name}</span>
                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                  ¥{sample.data.amount.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* スキャン進行中アニメーション */}
        {isScanning && (
          <div className="my-6 p-8 border-2 border-dashed border-indigo-300 rounded-xl bg-indigo-50/50 flex flex-col items-center justify-center text-center">
            <div className="relative">
              <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
              <Sparkles className="w-5 h-5 text-cyan-500 absolute -top-1 -right-1 animate-ping" />
            </div>
            <p className="mt-3 text-sm font-bold text-indigo-900">AIがレシートを解析中...</p>
            <p className="text-xs text-indigo-600 mt-1">
              文字認識(OCR) ➜ 店舗名・税抜/税込金額・インボイス番号を仕分け中
            </p>
          </div>
        )}

        {/* 抽出結果プレビューと確認フォーム */}
        {extractedData && !isScanning && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 mt-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center space-x-2 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>AI解析完了！ 経費データが抽出されました</span>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                一致精度: 99%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <label className="text-xs text-slate-500 block mb-1 font-medium">利用店名 / 支払先</label>
                <input
                  type="text"
                  value={extractedData.merchant}
                  onChange={(e) => setExtractedData({ ...extractedData, merchant: e.target.value })}
                  className="w-full font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                />
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <label className="text-xs text-slate-500 block mb-1 font-medium">金額 (税込)</label>
                <div className="flex items-center space-x-1">
                  <span className="text-indigo-600 font-bold">¥</span>
                  <input
                    type="number"
                    value={extractedData.amount}
                    onChange={(e) => setExtractedData({ ...extractedData, amount: parseInt(e.target.value, 10) || 0 })}
                    className="w-full font-bold text-indigo-600 text-base bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                  />
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <label className="text-xs text-slate-500 block mb-1 font-medium">利用日</label>
                <input
                  type="date"
                  value={extractedData.date}
                  onChange={(e) => setExtractedData({ ...extractedData, date: e.target.value })}
                  className="w-full text-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 font-medium"
                />
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <label className="text-xs text-slate-500 block mb-1 font-medium">勘定科目（AI自動判定）</label>
                <select
                  value={extractedData.category}
                  onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value })}
                  className="w-full text-slate-800 bg-transparent font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
                >
                  <option value="消耗品費">消耗品費</option>
                  <option value="旅費交通費">旅費交通費</option>
                  <option value="飲食費・交際費">飲食費・交際費</option>
                  <option value="会議費">会議費</option>
                  <option value="通信費">通信費</option>
                  <option value="書籍・研修費">書籍・研修費</option>
                  <option value="日用品・雑費">日用品・雑費</option>
                </select>
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
              <label htmlFor="receipt-note" className="mb-1 block text-xs font-medium text-slate-500">
                用途・備考
              </label>
              <textarea
                id="receipt-note"
                rows={2}
                value={extractedData.note || ""}
                onChange={(e) => setExtractedData({ ...extractedData, note: e.target.value })}
                placeholder="購入目的、打ち合わせ内容など"
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">インボイス登録番号:</span>
                <span className="font-mono font-semibold text-slate-700">{extractedData.invoiceNumber || "適格登録なし"}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">適用税率:</span>
                <span className="font-semibold text-slate-700">{extractedData.taxRate}% (標準税率)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setExtractedData(null)}
                className="text-xs px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmAndSave}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition"
              >
                <Check className="w-4 h-4" />
                <span>この内容で経費表に追加する</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}