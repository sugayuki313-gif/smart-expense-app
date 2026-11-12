const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

const CATEGORY_RULES = [
  { category: "飲食費・交際費", keywords: ["カフェ", "珈琲", "スターバックス", "ドトール", "レストラン", "居酒屋", "焼肉", "寿司", "ランチ", "ディナー", "弁当", "マクドナルド", "すき家", "ガスト", "食堂", "バー", "喫茶", "飲食", "みよしの"] },
  { category: "旅費交通費", keywords: ["タクシー", "交通", "JR", "地下鉄", "メトロ", "新幹線", "特急", "航空", "ANA", "JAL", "駐車場", "タイムズ", "ETC", "ガソリン", "ENEOS", "出光", "バス"] },
  { category: "消耗品費", keywords: ["文具", "ダイソー", "セリア", "ロフト", "ハンズ", "事務", "アスクル", "オフィス", "カインズ", "ニトリ", "無印良品", "ヨドバシ", "ビックカメラ", "ヤマダ", "PC", "ケーブル", "電池", "用紙"] },
  { category: "会議費", keywords: ["貸会議室", "コワーキング", "ミーティング", "スペース", "Zoom"] },
  { category: "通信費", keywords: ["NTT", "ソフトバンク", "ドコモ", "au", "郵便", "切手", "レターパック", "ヤマト", "佐川", "通信", "Wi-Fi"] },
  { category: "書籍・研修費", keywords: ["書店", "本", "ブックス", "紀伊國屋", "丸善", "ジュンク堂", "セミナー", "講習", "講座", "技術評論社"] },
  { category: "日用品・雑費", keywords: ["コンビニ", "セブン", "ローソン", "ファミリーマート", "ドラッグ", "マツモトキヨシ", "ウエルシア", "薬局", "スーパー", "イオン"] }
];

async function analyzeReceiptImage(imageBase64) {
  if (!endpoint || !key) {
    throw new Error("Azure Document Intelligence の環境変数が設定されていません。");
  }

  // URLの末尾のスラッシュを確実に整理
  const cleanEndpoint = endpoint.replace(/\/$/, "");
  const analyzeUrl = `${cleanEndpoint}/documentintelligence/document-models/prebuilt-receipt:analyze?api-version=2024-02-29-preview`;

  console.log("=== Direct Fetch OCR Request ===");
  console.log("URL:", analyzeUrl);

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  // 1. 解析リクエストの送信
  const response = await fetch(analyzeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Ocp-Apim-Subscription-Key": key
    },
    body: buffer
  });

  if (response.status !== 202) {
    const errorText = await response.text();
    throw new Error(`Azure OCR分析の開始に失敗しました (Status ${response.status}): ${errorText}`);
  }

  // Operation-Location ヘッダーから結果取得用URLを取得
  const operationLocation = response.headers.get("operation-location");
  if (!operationLocation) {
    throw new Error("AzureからオペレーションURLを取得できませんでした。");
  }

  console.log("Operation Location:", operationLocation);

  // 2. ポーリング（処理完了待ち）
  let pollStatus = "running";
  let resultData = null;

  for (let i = 0; i < 15; i++) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const pollResponse = await fetch(operationLocation, {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": key
      }
    });

    const pollJson = await pollResponse.json();
    pollStatus = pollJson.status;
    console.log(`Poll attempt ${i + 1}: status = ${pollStatus}`);

    if (pollStatus === "succeeded") {
      resultData = pollJson;
      break;
    } else if (pollStatus === "failed") {
      throw new Error(`Azureでのレシート解析に失敗しました: ${JSON.stringify(pollJson.error)}`);
    }
  }

  if (pollStatus !== "succeeded" || !resultData) {
    throw new Error("Azureでのレシート解析がタイムアウトしました。");
  }

  const documents = resultData.analyzeResult?.documents;
  if (!documents || documents.length === 0) {
    throw new Error("レシートから情報を検出できませんでした。画像が鮮明かご確認ください。");
  }

  const fields = documents[0].fields || {};

  const merchant = fields.MerchantName?.content || "不明な店舗";
  const date = fields.TransactionDate?.valueDate || new Date().toISOString().split("T")[0];
  const amount = fields.Total?.valueNumber || fields.Total?.amount || 0;
  const invoiceNumber = fields.TaxId?.content || null;
  
  let taxRate = 10;
  if (fields.Items && fields.Items.length > 0) {
    const item = fields.Items[0].valueObject;
    if (item?.TaxRate?.valueNumber) {
      taxRate = Math.round(item.TaxRate.valueNumber * 100);
    }
  }

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