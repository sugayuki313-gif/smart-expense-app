import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, X, Bot, User, Trash2, HelpCircle, FileText, ChevronRight, Check } from "lucide-react";
import { ChatMessage } from "../types";
import { fetchChatHistory, sendChatMessage, clearChatHistory } from "../lib/api";

interface GeminiAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  promptRequest: { id: number; text: string } | null;
}

const QUICK_PROMPTS = [
  "年末調整の全体の流れとスケジュールは？",
  "生命保険料控除の申告書の書き方と上限額",
  "103万・130万の壁ってどう違うの？",
  "住宅ローン控除2年目の年末調整のやり方",
  "ふるさと納税は年末調整でできる？"
];

export function GeminiAssistantPanel({ isOpen, onClose, promptRequest }: GeminiAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const handledPromptId = useRef<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const loadHistory = async () => {
    try {
      const data = await fetchChatHistory();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    setInputMessage("");
    setIsLoading(true);

    try {
      const res = await sendChatMessage(text);
      setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);
    } catch (err) {
      console.error(err);
      alert("メッセージの送信に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !promptRequest || handledPromptId.current === promptRequest.id) return;
    handledPromptId.current = promptRequest.id;
    void handleSend(promptRequest.text);
  }, [isOpen, promptRequest]);

  const handleClearHistory = async () => {
    if (!window.confirm("チャット履歴を消去しますか？")) return;
    try {
      await clearChatHistory();
      await loadHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full sm:w-[440px] bg-slate-900 text-slate-100 shadow-2xl border-l border-slate-800 flex flex-col transition-all duration-300">
      {/* ヘッダー */}
      <div className="p-4 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-100 flex items-center space-x-1.5">
              <span>Gemini AI 税務・年末調整相談</span>
            </h2>
            <p className="text-[11px] text-cyan-300">専門税務ナレッジ＆控除アドバイザー</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="履歴消去"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center space-x-1.5 mb-1 text-[11px] text-slate-400">
              {msg.role === "user" ? (
                <>
                  <span>あなた</span>
                  <User className="w-3 h-3" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-400 font-semibold">Gemini AI</span>
                </>
              )}
            </div>

            <div
              className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[92%] relative group ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none shadow-sm"
                  : "bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none shadow-md"
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

              {msg.role === "assistant" && (
                <button
                  onClick={() => handleCopy(msg.id, msg.content)}
                  className="mt-2 text-[10px] text-slate-400 hover:text-cyan-300 flex items-center space-x-1 opacity-80 transition"
                >
                  {copiedId === msg.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">コピーしました</span>
                    </>
                  ) : (
                    <span>回答をコピー</span>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-2 text-slate-400 text-xs">
            <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
            <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-700 animate-pulse">
              Geminiが回答を生成中...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* よくある質問クイックボタン */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800/80">
        <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center space-x-1">
          <HelpCircle className="w-3 h-3 text-cyan-400" />
          <span>タップして質問する:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              className="text-[11px] text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 transition flex items-center space-x-1 text-left"
            >
              <ChevronRight className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate max-w-[200px]">{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 入力フォーム */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="年末調整や控除について質問を入力..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white p-2.5 rounded-xl shadow-md transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
