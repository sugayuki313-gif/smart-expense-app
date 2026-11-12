const express = require("express");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

// OCRエンジンのインポート（※こちらはlib/ocrEngine.jsが存在するため安全です）
const { analyzeReceiptImage } = require("./lib/ocrEngine");

const prisma = new PrismaClient();
const app = express();
app.use(express.json({ limit: "25mb" }));

// 初期サンプルデータの投入（空の場合）
async function seedInitialData() {
  try {
    const count = await prisma.expense.count();
    if (count === 0) {
      const today = new Date();
      const format = (d) => d.toISOString().split("T")[0];
      const d1 = new Date(today.getTime() - 86400000 * 1);
      const d2 = new Date(today.getTime() - 86400000 * 3);
      const d3 = new Date(today.getTime() - 86400000 * 5);

      await prisma.expense.createMany({
        data: [
          {
            date: format(d1),
            merchant: "スターバックス コーヒー 渋谷店",
            amount: 680,
            category: "飲食費・交際費",
            taxRate: 10,
            invoiceNumber: "T1010001000123",
            note: "クライアントとの打ち合わせ・作業カフェ代",
            status: "confirmed",
            paymentMethod: "credit_card"
          },
          {
            date: format(d2),
            merchant: "ヨドバシカメラ 新宿西口本店",
            amount: 8480,
            category: "消耗品費",
            taxRate: 10,
            invoiceNumber: "T2010001000456",
            note: "PC用ワイヤレスキーボードおよびHDMIケーブル",
            status: "confirmed",
            paymentMethod: "credit_card"
          },
          {
            date: format(d3),
            merchant: "東京無線タクシー",
            amount: 3200,
            category: "旅費交通費",
            taxRate: 10,
            invoiceNumber: "T3010001000789",
            note: "顧客オフィスへの緊急訪問移動",
            status: "confirmed",
            paymentMethod: "ic_card"
          }
        ]
      });
      console.log("初期サンプル経費データを投入しました");
    }
  } catch (err) {
    console.error("シードエラー:", err);
  }
}
seedInitialData();

// ==========================================
// API ルーティング（server.js内に直接統合）
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

// 3. レシートOCR解析エンドポイント
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