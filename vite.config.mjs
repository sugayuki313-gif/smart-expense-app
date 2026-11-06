import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // フロント(Vite dev サーバー)への /api リクエストを Express(:3000) に転送する。
    // これでフロントは相対パス fetch("/api/...") のままバックエンドへ届く。
    proxy: {
      "/api": "http://localhost:3000",
    },
    watch: {
      // 「できた！」の判定時に一時配置されるテストファイルで dev サーバーを反応させない
      ignored: ["**/judge.test.ts"],
    },
  },
  test: {
    // 「できた！」の判定（npm test）用の設定。実行環境（browser-node）は
    // シングルスレッドなので、ワーカーや並列実行を使わず最小リソースで走らせ、
    // 起動中のプレビュー（vite dev サーバー）を妨げないようにする
    fileParallelism: false,
    poolOptions: {
      forks: {
        singleFork: true,
      },
      threads: {
        singleThread: true,
      },
    },
    css: false,
  },
});
