export interface SampleReceipt {
  id: string;
  name: string;
  categoryName: string;
  previewImageText: string;
  data: {
    merchant: string;
    amount: number;
    date: string;
    category: string;
    taxRate: number;
    invoiceNumber: string;
    note: string;
    paymentMethod: "credit_card" | "cash" | "electronic_money" | "ic_card" | "bank_transfer";
  };
}

const todayStr = new Date().toISOString().split("T")[0];

export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: "cafe-meeting",
    name: "カフェ打合せレシート",
    categoryName: "飲食費・交際費",
    previewImageText: "☕ スターバックス\n2025/03/12\nドリップコーヒー ×2\nチーズケーキ ×1\n合計: ¥1,480 (税込)\nT1010001000123",
    data: {
      merchant: "スターバックス コーヒー 銀座店",
      amount: 1480,
      date: todayStr,
      category: "飲食費・交際費",
      taxRate: 10,
      invoiceNumber: "T1010001000123",
      note: "Webディレクターとの仕様打合せミーティング",
      paymentMethod: "credit_card"
    }
  },
  {
    id: "taxi-client",
    name: "タクシー移動領収書",
    categoryName: "旅費交通費",
    previewImageText: "🚕 日本交通\n2025/03/10\n乗車区間: 新宿〜六本木\n領収金額: ¥3,800\nT2010001000789",
    data: {
      merchant: "日本交通株式会社",
      amount: 3800,
      date: todayStr,
      category: "旅費交通費",
      taxRate: 10,
      invoiceNumber: "T2010001000789",
      note: "荒天時および機材搬送に伴うクライアント先急行",
      paymentMethod: "ic_card"
    }
  },
  {
    id: "pc-gadget",
    name: "家電量販店（PC周辺機器）",
    categoryName: "消耗品費",
    previewImageText: "💻 ビックカメラ 有楽町店\nUSB-Cハブ 4K対応\n外付けSSD 1TB\n合計: ¥14,280 (税込)\nT3010001000456",
    data: {
      merchant: "ビックカメラ 有楽町店",
      amount: 14280,
      date: todayStr,
      category: "消耗品費",
      taxRate: 10,
      invoiceNumber: "T3010001000456",
      note: "リモート開発用USBハブ及びバックアップ用SSD購入",
      paymentMethod: "credit_card"
    }
  },
  {
    id: "stationery",
    name: "文房具・事務用品",
    categoryName: "消耗品費",
    previewImageText: "✏️ 丸善 丸の内本店\nノート・ゲルインク替芯\nクリアファイル 10冊\n合計: ¥2,150 (税込)\nT4010001000999",
    data: {
      merchant: "丸善 丸の内本店",
      amount: 2150,
      date: todayStr,
      category: "消耗品費",
      taxRate: 10,
      invoiceNumber: "T4010001000999",
      note: "企画ブレスト用ノート及び書類整理用ファイル",
      paymentMethod: "electronic_money"
    }
  },
  {
    id: "coworking",
    name: "コワーキングスペース利用",
    categoryName: "会議費",
    previewImageText: "🏢 WeWork 渋谷スクランブル\nドロップイン利用 1Day\n会議室利用 1時間\n合計: ¥5,500 (税込)\nT5010001000888",
    data: {
      merchant: "WeWork 渋谷スクランブルスクエア",
      amount: 5500,
      date: todayStr,
      category: "会議費",
      taxRate: 10,
      invoiceNumber: "T5010001000888",
      note: "プロジェクトチーム合同オフサイト作業利用",
      paymentMethod: "credit_card"
    }
  }
];

export const CATEGORIES = [
  "すべて",
  "消耗品費",
  "旅費交通費",
  "飲食費・交際費",
  "会議費",
  "通信費",
  "書籍・研修費",
  "日用品・雑費"
];
