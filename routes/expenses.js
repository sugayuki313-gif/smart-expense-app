const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { analyzeReceiptImage } = require("../lib/ocrEngine");

const prisma = new PrismaClient();
const router = express.Router();

// 経費一覧取得
router.get("/expenses", async (req, res) => {
  const { category, month, search } = req.query;
  const where = {};

  if (category && category !== "all") {
    where.category = category;
  }
  if (month && month !== "all") {
    where.date = {
      startsWith: month
    };
  }
  if (search) {
    where.OR = [
      { merchant: { contains: search, mode: "insensitive" } },
      { note: { contains: search, mode: "insensitive" } },
      { invoiceNumber: { contains: search, mode: "insensitive" } }
    ];
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" }
  });

  // カテゴリ集計・サマリー計算
  const allExpenses = await prisma.expense.findMany();
  const totalAmount = allExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalCount = allExpenses.length;

  const categorySummary = {};
  allExpenses.forEach(exp => {
    categorySummary[exp.category] = (categorySummary[exp.category] || 0) + exp.amount;
  });

  res.json({
    expenses,
    summary: {
      totalAmount,
      totalCount,
      categorySummary
    }
  });
});

// 経費新規作成
router.post("/expenses", async (req, res) => {
  const { date, merchant, amount, category, taxRate, invoiceNumber, imageUrl, note, status, paymentMethod } = req.body;
  
  const newExpense = await prisma.expense.create({
    data: {
      date: date || new Date().toISOString().split("T")[0],
      merchant: merchant || "取引先",
      amount: parseInt(amount, 10) || 0,
      category: category || "消耗品費",
      taxRate: parseInt(taxRate, 10) || 10,
      invoiceNumber: invoiceNumber || null,
      imageUrl: imageUrl || null,
      note: note || null,
      status: status || "confirmed",
      paymentMethod: paymentMethod || "credit_card"
    }
  });

  res.status(201).json(newExpense);
});

// 経費更新
router.put("/expenses/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { date, merchant, amount, category, taxRate, invoiceNumber, imageUrl, note, status, paymentMethod } = req.body;

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      date,
      merchant,
      amount: parseInt(amount, 10),
      category,
      taxRate: parseInt(taxRate, 10),
      invoiceNumber,
      imageUrl,
      note,
      status,
      paymentMethod
    }
  });

  res.json(updated);
});

// 経費削除
router.delete("/expenses/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await prisma.expense.delete({ where: { id } });
  res.json({ success: true, message: "削除しました" });
});

// OCR・レシート解析エンドポイント
router.post("/ocr/analyze", async (req, res) => {
  try {
    const { samplePreset, imageBase64 } = req.body;

    // サンプルプリセット（テスト用ボタン）が指定されている場合はそれを優先
    if (samplePreset) {
      return res.json({
        success: true,
        data: samplePreset,
        confidence: 0.99,
        extractedFields: samplePreset
      });
    }

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "画像データ（imageBase64）が送信されていません" });
    }

    // Azure Document Intelligence を使った実際のOCR解析を実行
    const parsedData = await analyzeReceiptImage(imageBase64);
    if (imageBase64) {
      parsedData.imageUrl = imageBase64;
    }

    res.json({
      success: true,
      data: parsedData,
      confidence: 0.96,
      extractedFields: {
        merchant: parsedData.merchant,
        date: parsedData.date,
        amount: parsedData.amount,
        taxRate: parsedData.taxRate,
        category: parsedData.category,
        invoiceNumber: parsedData.invoiceNumber
      }
    });
  } catch (err) {
    console.error("OCR解析エラー:", err);
    res.status(500).json({ success: false, error: err.message || "OCRサーバー内部でエラーが発生しました" });
  }
});

module.exports = router;