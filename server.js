const express = require("express");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// OCRエンジンのインポート
const { analyzeReceiptImage } = require("./lib/ocrEngine");

const prisma = new PrismaClient();
const app = express();
app.use(express.json({ limit: "25mb" }));

// Google Generative AI の初期化（ご提示いただいたAPIキーを環境変数経由で安全に読み込みます）
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// API ルーティング
// ==========================================

// 1. 経費一覧取得
app.get("/api/expenses", async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" }
    });
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "経費データの取得に失敗しました" });
  }
});

// 2. 経費新規登録
app.post("/api/expenses", async (req, res) => {
  try {
    const { date, merchant, amount, category, taxRate, invoiceNumber, note, paymentMethod } = req.body;
    const newExpense = await prisma.expense.create({
      data: {
        date: date || new Date().toISOString().split("T")[0],
        merchant: merchant || "不明な店舗",
        amount: Number(amount) || 0,
        category: category || "消耗品費",
        taxRate: Number(taxRate) || 10,
        invoiceNumber: invoiceNumber || null,
        note: note || "",
        status: "confirmed",
        paymentMethod: paymentMethod || "credit_card"
      }
    });
    res.json(newExpense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "経費の登録に失敗しました" });
  }
});

// 3. 経費削除
app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({
      where: { id: Number(id) }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "経費の削除に失敗しました" });
  }
});

// 4. レシートOCR解析エンドポイント
app.post("/api/ocr/analyze", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "画像データが送信されていません" });
    }
    const result = await analyzeReceiptImage(image);
    res.json(result);
  } catch (err) {
    console.error("OCR解析エラー:", err.message);
    res.status(500).json({ error: err.message || "OCR解析に失敗しました" });
  }
});

// 5. Gemini AIチャットエンドポイント
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "メッセージが送信されていません" });
    }

    // 無料枠のデフォルトプロジェクトで最も汎用的に使われる標準モデルを指定
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);
    const response = await result.response;
    const reply = response.text() || "AIからの応答を取得できませんでした。";

    res.json({ reply });
  } catch (err) {
    console.error("Geminiチャットエラー:", err);
    const statusCode = err.status || 500;
    const errorMessage = statusCode === 503 
      ? "AIサーバーが現在混雑しています。少し時間を置いてから再度お試しください。" 
      : (err.message || "メッセージの送信に失敗しました");
    
    res.status(statusCode).json({ error: errorMessage });
  }
});

// ==========================================
// フロントエンドの静的ファイル配信 & SPAフォールバック
// ==========================================
app.use(express.static(path.join(__dirname, "dist")));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error("サーバーエラー詳細:", err);
  res.status(500).json({ error: "サーバーでエラーが発生しました" });
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}/`);
});