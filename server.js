const express = require("express");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const expensesRouter = require("./routes/expenses");
const chatRouter = require("./routes/chat");

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

// API ルーティング
app.use("/api", expensesRouter);
app.use("/api", chatRouter);

// === フロントエンドの静的ファイル配信設定 ===
app.use(express.static(path.join(__dirname, "dist")));

// SPA用のフォールバック設定（ミドルウェアを活用し、ワイルドカードや正規表現エラーを完全に回避）
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "サーバーでエラーが発生しました" });
});

app.listen(3000, () => {
  console.log("API server running at http://localhost:3000/");
});