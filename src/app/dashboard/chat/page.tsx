"use client";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Brain, Send, Zap } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "Why is my ROAS low this month?",
  "Which campaign should I scale today?",
  "Which customer segment to target this week?",
  "What Google Ads keywords should I target?",
  "How do I improve my repeat purchase rate?",
  "What's my break-even ROAS?",
  "Why is mobile bounce rate high?",
  "Which city should I target with more ad spend?",
  "What creative should I make next?",
  "Will I hit my August revenue target?",
];

const aiActions = [
  { color: "bg-[#d94040]", text: "Detected ROAS crash on CBO69 (−23%)", time: "2h ago" },
  { color: "bg-[#e89820]", text: "Flagged Embroidery creative fatigue (Freq 2.8)", time: "4h ago" },
  { color: "bg-[#3478d4]", text: "Identified festive demand signal in GSC", time: "6h ago" },
  { color: "bg-[#d94040]", text: "Combo Fabric stockout alert raised", time: "8h ago" },
  { color: "bg-[#17a773]", text: "Generated weekly digest with 5 action items", time: "10h ago" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I have full access to fabonique's Shopify orders, Meta campaigns, GSC keywords, and GA4 sessions — plus I'm watching for anomalies in real time.\n\nAsk me anything: why is ROAS low, which campaign to scale, what customers to target, or what to do this week.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...newMessages, {
        role: "assistant",
        content: "Sorry, I couldn't connect to the AI right now. Please add your ANTHROPIC_API_KEY to .env.local and restart the dev server.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <p className="text-[12px] text-[#686864] mt-0.5">Ask anything · knows all 4 platforms · fabonique</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Chat */}
        <div className="flex flex-col bg-white border border-black/[0.09] rounded-xl overflow-hidden" style={{ height: 520 }}>
          {/* Chat header */}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-black/[0.09] bg-[#f7f7f5]">
            <div className="w-7 h-7 bg-[#17a773] rounded-lg flex items-center justify-center">
              <Brain size={13} className="text-white" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#181816]">Skylitee AI</div>
              <div className="text-[10px] text-[#686864]">Shopify · Meta · GSC · GA4 · Anomaly detection</div>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#17a773]" />
              <span className="text-[10px] text-[#0d6b4f]">Live</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">
            {messages.map((msg, i) => (
              <div key={i} className={`max-w-[86%] ${msg.role === "user" ? "self-end" : "self-start"}`}>
                <div className="text-[10px] text-[#9e9e9a] mb-1 text-right" style={{ textAlign: msg.role === "user" ? "right" : "left" }}>
                  {msg.role === "user" ? "You" : "Skylitee AI"}
                </div>
                <div
                  className={`px-3 py-2.5 text-[11px] leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#17a773] text-white rounded-xl rounded-tr-sm"
                      : "bg-[#f7f7f5] text-[#181816] rounded-xl rounded-tl-sm"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>"),
                  }}
                />
              </div>
            ))}
            {loading && (
              <div className="self-start max-w-[86%]">
                <div className="text-[10px] text-[#9e9e9a] mb-1">Skylitee AI</div>
                <div className="bg-[#f7f7f5] px-3 py-2.5 rounded-xl rounded-tl-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#17a773] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#17a773] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#17a773] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div className="px-3 py-2 border-t border-black/[0.09] bg-[#f7f7f5]">
            <div className="text-[10px] text-[#9e9e9a] mb-1.5">Try asking:</div>
            <div className="flex flex-wrap gap-1.5 overflow-hidden" style={{ maxHeight: 54 }}>
              {suggestions.slice(0, 4).map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="px-2.5 py-1 border border-black/[0.09] rounded-full text-[10px] text-[#686864] bg-white hover:bg-[#e0f5ee] hover:text-[#064d38] hover:border-[#9FE1CB] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-black/[0.09] flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask about campaigns, customers, ROAS, products..."
              className="flex-1 px-2.5 py-2 bg-[#f7f7f5] border border-black/[0.09] rounded-lg text-[11px] text-[#181816] focus:outline-none focus:border-[#17a773] placeholder:text-[#9e9e9a]"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="px-3 py-2 bg-[#17a773] text-white rounded-lg text-[11px] font-semibold disabled:opacity-50 hover:bg-[#0d6b4f] transition-colors flex items-center gap-1.5"
            >
              <Send size={12} /> Send
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div>
          <Card className="mb-2">
            <div className="text-[11px] font-semibold text-[#181816] mb-3">What I can analyse</div>
            {[
              { label: "Campaign & creative", qs: ['"Why is CBO67 outperforming others?"', '"Which ad sets should I pause today?"', '"What creative should I make next?"', '"When is the best time to run my ads?"'] },
              { label: "Customers & retention", qs: ['"Who are my most valuable customers?"', '"How do I win back dormant customers?"', '"Which city has the best ROAS?"', '"How can I improve repeat purchase rate?"'] },
              { label: "Financial & forecasting", qs: ['"Will I hit my August revenue target?"', '"What\'s my break-even ROAS?"', '"How can I improve contribution margin?"', '"Which product has the best unit economics?"'] },
            ].map((section) => (
              <div key={section.label} className="mb-3">
                <div className="text-[11px] font-semibold text-[#9e9e9a] uppercase tracking-wider pb-1 border-b border-black/[0.09] mb-1.5">{section.label}</div>
                <div className="text-[11px] text-[#686864] space-y-0.5">
                  {section.qs.map((q, i) => (
                    <div key={i} className="leading-relaxed cursor-pointer hover:text-[#0d6b4f]" onClick={() => sendMessage(q.replace(/['"]/g, ""))}>{q}</div>
                  ))}
                </div>
              </div>
            ))}
          </Card>

          <Card>
            <div className="text-[11px] font-semibold text-[#181816] mb-3 flex items-center gap-1.5">
              <Zap size={12} className="text-[#17a773]" /> AI actions taken today
            </div>
            <div className="flex flex-col gap-2">
              {aiActions.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.color}`} />
                  <span className="flex-1">{a.text}</span>
                  <span className="text-[10px] text-[#9e9e9a] shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
