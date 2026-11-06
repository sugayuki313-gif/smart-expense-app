const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { generateGeminiResponse } = require("../lib/geminiKnowledge");

const prisma = new PrismaClient();
const router = express.Router();

// チャット履歴取得
router.get("/chat", async (req, res) => {
  const messages = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "asc" },
    take: 50
  });

  // 初回起動時用のウェルカムメッセージ
  if (messages.length === 0) {
    const welcome = await prisma.chatMessage.create({
      data: {
        role: "assistant",
        content: `こんにちは！✨ Gemini 年末調整・税務AIアシスタントです。

年末調整の書類の書き方や控除の手続き、確定申告や経費の仕分けなど、気になることは何でも気軽に質問してくださいね。

左側のエリアで領収書・レシートを撮影すると、AIが店名・日付・金額・カテゴリ・インボイス番号を自動抽出して経費表に登録します！`,
        category: "greeting"
      }
    });
    return res.json([welcome]);
  }

  res.json(messages);
});

// メッセージ送信 & Gemini風応答生成
router.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "メッセージを入力してください" });
  }

  // 1. ユーザーメッセージ保存
  const userMsg = await prisma.chatMessage.create({
    data: {
      role: "user",
      content: message
    }
  });

  // 2. Gemini AI応答の生成
  const aiResult = generateGeminiResponse(message);

  // 3. AIメッセージ保存
  const assistantMsg = await prisma.chatMessage.create({
    data: {
      role: "assistant",
      content: aiResult.content,
      category: aiResult.category
    }
  });

  res.json({
    userMessage: userMsg,
    assistantMessage: assistantMsg
  });
});

// チャット履歴クリア
router.delete("/chat", async (req, res) => {
  await prisma.chatMessage.deleteMany();
  res.json({ success: true, message: "チャット履歴をリセットしました" });
});

module.exports = router;
