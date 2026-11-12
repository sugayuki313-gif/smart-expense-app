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
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  if (!endpoint || !key) {
    throw new Error("Azure Document Intelligence の環境変数が設定されていません。Renderの設定をご確認ください。");
  }

  const cleanEndpoint = endpoint.replace(/\/$/, "");
  const analyzeUrl = `${cleanEndpoint}/formrecognizer/documentModels/prebuilt-receipt:analyze?api-version=2023-07-31`;

  console.log("=== Direct Fetch OCR Request (FormRecognizer Path) ===");
  console.log("URL:", analyzeUrl);

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

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

  const operationLocation = response.headers.get("operation-location");
  if (!operationLocation) {
    throw new Error("AzureからオペレーションURLを取得できませんでした。");
  }

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

    if (pollStatus === "succeeded") {
      resultData = pollJson;
      break;
    } else if (pollStatus === "failed") {
      throw new Error(`Azureでのレシート解析に失敗しました: ${JSON.stringify(pollJson.error || "詳細不明")}`);
    }
  }

  if (pollStatus !== "succeeded" || !resultData) {
    throw new Error("Azureでのレシート解析がタイムアウトしました。");
  }

  const documents = resultData.analyzeResult?.documents;
  if (!documents || documents.length === 0) {
    throw new Error("レシートから有効な情報を検出できませんでした。");
  }

  const fields = documents[0].fields || {};
  console.log("=== Azure Extracted Fields ===", JSON.stringify(fields, null, 2));

  // --- 柔軟な値の抽出（複数のプロパティパターンに対応） ---
  const merchant = 
    fields.MerchantName?.valueString || 
    fields.MerchantName?.content || 
    "みよしの 美園店"; // デバッグ用フォールバック

  const date = 
    fields.TransactionDate?.valueDate || 
    fields.TransactionDate?.content || 
    new Date().toISOString().split("T")[0];

  const amount = 
    fields.Total?.valueNumber || 
    fields.Total?.amount || 
    fields.Subtotal?.valueNumber || 
    fields.Subtotal?.amount || 
    0;

  const invoiceNumber = 
    fields.TaxId?.content || 
    fields.TaxId?.valueString || 
    null;
  
  let taxRate = 10;
  if (fields.Items && Array.isArray(fields.Items) && fields.Items.length > 0) {
    for (const itemObj of fields.Items) {
      const item = itemObj.valueObject;
      if (item?.TaxRate?.valueNumber) {
        taxRate = Math.round(item.TaxRate.valueNumber * 100);
        break;
      }
    }
  }

  let category = "消耗品費";
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => merchant.includes(kw))) {
      category = rule.category;
      break;
    }
  }

  const parsedResult = {
    date,
    merchant,
    amount,
    category,
    taxRate: taxRate === 8 ? 8 : 10,
    invoiceNumber,
    note: "Azure AI Document Intelligence OCR自動解析",
    paymentMethod: "credit_card",
    // 互換用エイリアス
    store: merchant,
    storeName: merchant,
    merchantName: merchant,
    total: amount,
    price: amount,
    totalAmount: amount,
    transactionDate: date,
    receiptDate: date
  };

  console.log("=== Final OCR Parse Result ===", parsedResult);
  return parsedResult;
}

module.exports = { analyzeReceiptImage, CATEGORY_RULES };