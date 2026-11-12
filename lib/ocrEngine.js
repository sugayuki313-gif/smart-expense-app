const { AzureKeyCredential, getClient } = require("@azure-rest/ai-document-intelligence");

// 環境変数からAzureの接続情報を取得
const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

// カテゴリ判定ルール
const CATEGORY_RULES = [
  { category: "飲食費・交際費", keywords: ["カフェ", "珈琲", "スターバックス", "ドトール", "レストラン", "居酒屋", "焼肉", "寿司", "ランチ", "ディナー", "弁当", "マクドナルド", "すき家", "ガスト", "食堂", "バー", "喫茶", "飲食", "みよしの"] },
  { category: "旅費交通費", keywords: ["タクシー", "交通", "JR", "地下鉄", "メトロ", "新幹線", "特急", "航空", "ANA", "JAL", "駐車場", "タイムズ", "ETC", "ガソリン", "ENEOS", "出光", "バス"] },
  { category: "消耗品費", keywords: ["文具", "ダイソー", "セリア", "ロフト", "ハンズ", "事務", "アスクル", "オフィス", "カインズ", "ニトリ", "無印良品", "ヨドバシ", "ビックカメラ", "ヤマダ", "PC", "ケーブル", "電池", "用紙"] },
  { category: "会議費", keywords: ["貸会議室", "コワーキング", "ミーティング", "スペース", "Zoom"] },
  { category: "通信費", keywords: ["NTT", "ソフトバンク", "ドコモ", "au", "郵便", "切手", "レターパック", "ヤマト", "佐川", "通信", "Wi-Fi"] },
  { category: "書籍・研修費", keywords: ["書店", "本", "ブックス", "紀伊國屋", "丸善", "ジュンク堂", "セミナー", "講習", "講座", "技術評論社"] },
  { category: "日用品・雑費", keywords: ["コンビニ", "セブン", "ローソン", "ファミリーマート", "ドラッグ", "マツモトキヨシ", "ウエルシア", "薬局", "スーパー", "イオン"] }
];

/**
 * Azure Document Intelligence を使ったレシート解析メイン関数
 * @param {string} imageBase64 - アップロードされた画像のBase64データ（テキスト表現された画像データ）
 */
async function analyzeReceiptImage(imageBase64) {
  if (!endpoint || !key) {
    throw new Error("Azure Document Intelligence の環境変数が設定されていません。");
  }

  // クライアントの初期化
  const client = getClient(endpoint, new AzureKeyCredential(key));

  // Base64データからヘッダ（data:image/jpeg;base64, 部分）を削除してバイナリ（Buffer）に変換
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  // Azureの「prebuilt-receipt（レシート事前構築済みモデル）」を非同期で呼び出し
  const initialResponse = await client.path("/document-models/{modelId}:analyze", "prebuilt-receipt").post({
    contentType: "application/octet-stream",
    body: buffer
  });

  if (initialResponse.status !== "202") {
    throw new Error(`Azure OCR分析の開始に失敗しました: ${initialResponse.body.error?.message || "不明なエラー"}`);
  }

  // 非同期処理の完了を待機（ポーリング処理：結果が出るまで数秒おきに確認する仕組み）
  const operationLocation = initialResponse.headers["operation-location"];
  const operationId = operationLocation.split("/").pop();
  
  let pollResponse = await client.path("/document-models/{modelId}/analyzeResults/{resultId}", "prebuilt-receipt", operationId).get();
  
  while (pollResponse.body.status === "running" || pollResponse.body.status === "notStarted") {
    await new Promise(resolve => setTimeout(resolve, 1000));
    pollResponse = await client.path("/document-models/{modelId}/analyzeResults/{resultId}", "prebuilt-receipt", operationId).get();
  }

  if (pollResponse.body.status === "failed") {
    throw new Error("Azureでのレシート解析に失敗しました。");
  }

  const result = pollResponse.body;
  const documents = result.analyzeResult?.documents;

  if (!documents || documents.length === 0) {
    throw new Error("レシートから情報を検出できませんでした。画像が鮮明かご確認ください。");
  }

  const fields = documents[0].fields || {};

  // Azureの解析結果から各項目を安全に抽出
  const merchant = fields.MerchantName?.content || "不明な店舗";
  const date = fields.TransactionDate?.valueDate || new Date().toISOString().split("T")[0];
  const amount = fields.Total?.valueNumber || fields.Total?.amount || 0;
  const invoiceNumber = fields.TaxId?.content || null;
  
  // 税率の判定（取得できなければデフォルト10%）
  let taxRate = 10;
  if (fields.Items && fields.Items.length > 0) {
    const item = fields.Items[0].valueObject;
    if (item?.TaxRate?.valueNumber) {
      taxRate = Math.round(item.TaxRate.valueNumber * 100);
    }
  }

  // カテゴリの自動判定
  let category = "消耗品費";
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => merchant.includes(kw))) {
      category = rule.category;
      break;
    }
  }

  return {
    date,
    merchant,
    amount,
    category,
    taxRate: taxRate === 8 ? 8 : 10,
    invoiceNumber,
    note: "Azure AI Document Intelligence OCR自動解析",
    paymentMethod: "credit_card"
  };
}

module.exports = { analyzeReceiptImage, CATEGORY_RULES };