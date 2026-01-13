/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable */
/* @ts-nocheck */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

"use client";
import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { showErrorToast } from "@/components/toast";
import LoginMessageBanner from "@/components/LoginMessageBanner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function InstructorHeroSection({ user }: { user: any }) {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const userCtx = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  console.log('set Loading from C:\Users\Ahanaf\Desktop\AI_Coach_Feature_for_Learning\discurso-main\components\Instructor> ', loadingPrompt)
  const sanitizeAsterisks = (txt: any) => {
    if (!txt) return txt;
    try {
      let t = String(txt).replace(/\*\*(.*?)\*\*/gs, "$1");
      t = t.replace(/\*\*/g, "");
      return t;
    } catch (e) {
      return String(txt).replace(/\*\*/g, "");
    }
  };

  const makeShortIfNeeded = (txt: any, fallback: string) => {
    if (!txt) return fallback;
    const s = sanitizeAsterisks(String(txt)).trim();
    if (!s) return fallback;
    // Keep if short enough, otherwise fallback to a concise prompt
    if (s.length > 220 || s.split(/\n/).length > 4) return fallback;
    return s;
  };

  const handleSendMessage = async () => {
    if (sending || !input.trim()) return;
    const text = input.trim();

    // Require signed-in user
    const uid = userCtx?.user?.uid;
    if (!uid) {
      showErrorToast("Please sign in to chat with AI");
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: sanitizeAsterisks("Please sign in to chat with AI."),
        },
      ]);
      return;
    }

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);
    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === "development"
          ? "http://localhost:8000"
          : "");

      // Quick reachability check so we can fail early with a helpful message
      const checkUrl = (API_BASE || "") + "/v1/check";
      try {
        const ping = await fetch(checkUrl, {
          method: "GET",
          mode: "cors",
        });
        if (!ping.ok) throw new Error(`API check failed: ${ping.status}`);

        // Try OPTIONS preflight for the chat endpoint (catches CORS preflight failures)
        const pre = await fetch((API_BASE || "") + "/v1/chatbot/chat", {
          method: "OPTIONS",
          mode: "cors",
        });
        if (!pre.ok && pre.status !== 204)
          throw new Error(`Preflight failed: ${pre.status}`);
      } catch (pingErr) {
        const hint = API_BASE ? ` at ${API_BASE}` : "";
        const msg = `Cannot reach backend API${hint}. Please ensure the API is running and accessible.`;
        console.warn(
          "[InstructorHero] API reachability check failed",
          pingErr?.message || pingErr
        );
        showErrorToast(msg);
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: sanitizeAsterisks(msg) },
        ]);
        return;
      }

      const res = await fetch((API_BASE || "") + "/v1/chatbot/chat", {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userCtx?.user?.uid,
          role: userCtx?.user?.role || "instructor",
          message: text,
        }),
      });

      if (!res.ok) {
        let errMsg = `Chat failed (${res.status})`;
        try {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const errBody = await res.json();
            errMsg =
              errBody?.message ||
              errBody?.error ||
              JSON.stringify(errBody) ||
              errMsg;
          } else {
            const textBody = await res.text();
            errMsg = textBody || errMsg;
          }
        } catch (parseErr) {
          console.warn(
            "[InstructorHero] error parsing error body",
            parseErr?.message || parseErr
          );
        }
        console.warn(
          "[InstructorHero] chat non-ok response",
          res.status,
          errMsg
        );
        showErrorToast(errMsg || "Failed to send message");
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: sanitizeAsterisks(errMsg || "Sorry, something went wrong."),
          },
        ]);
        return;
      }

      const data = await res.json();
      const reply =
        data?.reply?.text || " ";
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: sanitizeAsterisks(reply) },
      ]);
    } catch (e) {
      console.error("Chat error", e);
      showErrorToast("Failed to send message");
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: sanitizeAsterisks("Sorry, something went wrong."),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-center md:items-stretch max-w-[650px] flex-shrink-0">
      {/* Avatar + Label */}
      <div className="relative rounded-[16px] overflow-hidden w-full max-w-[280px] md:max-w-none md:w-auto md:flex-shrink-0 h-full">
        <img
          src="/ai-zaac.png"
          alt="AI Zaac"
          className="w-full h-auto object-cover rounded-[16px] md:h-full md:w-auto"
        />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white rounded-[16px] px-3 py-1 flex items-center gap-2 shadow">
          <img src="/ai-stars-purple.png" alt="AI Zaac" className="w-5 h-5" />
          <span className="text-[16px] font-semibold text-[#CB6DE1]">
            AI-zaac
          </span>
        </div>
      </div>

      {/* Text + Button */}
      <div className="flex flex-col justify-center gap-4 w-full md:max-w-[356px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[24px] font-medium text-black">
              Hey {user?.displayName?.split(" ")[0] || ""}
            </span>
            <span role="img" aria-label="wave">
              👋
            </span>
          </div>
          <LoginMessageBanner>
            {({ message, loading }) =>
              loading ? (
                <p className="text-[16px] font-normal text-[#6D7280] leading-relaxed">
                  Generating your welcome message…
                </p>
              ) : message ? (
                <p className="text-[16px] font-normal text-[#6D7280] leading-relaxed whitespace-pre-line">
                  {message}
                </p>
              ) : null
            }
          </LoginMessageBanner>
        </div>

        {/* Chat Button */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="inline-flex items-center justify-center md:justify-start gap-3 px-5 py-2 bg-white border border-[#0973F7] shadow-[0_2px_4px_rgba(9,115,247,0.2)] rounded-[12px] hover:shadow w-full md:w-auto"
        >
          <img
            src="/negotiator-dashboard/chat.png"
            alt="Chat"
            className="w-5 h-5"
          />
          <span className="text-[14px] font-medium text-black">
            Chat with me
          </span>
        </button>
      </div>

      {/* Chat Sheet */}
      <Sheet
        open={isChatOpen}
        onOpenChange={async (open) => {
          setIsChatOpen(open);
          if (open) {
            try {
              setLoadingPrompt(true);
              const res = await fetch(`/v1/chatbot/injected-prompt`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: userCtx?.user?.uid,
                  role: userCtx?.user?.role || "instructor",
                }),
              });
              setLoadingPrompt(false);
              if (!res.ok) throw new Error("Failed to load prompt");
              const data = await res.json();
              const raw = data?.prompt || "Hi, how can I help you today?";
              const initial = makeShortIfNeeded(
                raw,
                "Hi, how can I help you today?"
              );
              setMessages([{ role: "bot", text: initial }]);
            } catch (e) {
              console.warn("Failed to load injected prompt", e?.message || e);
              showErrorToast("Failed to load chat prompt");
              setMessages([
                { role: "bot", text: "Hi, how can I help you today?" },
              ]);
            } finally {
              setLoadingPrompt(false);
            }
          } else {
            setMessages([]);
            setInput("");
            setSending(false);
          }
        }}
      >
        <SheetContent className="w-[400px] sm:w-[540px] max-w-full h-full flex flex-col">
          <SheetHeader>
            <SheetTitle>AI-Zaac</SheetTitle>
            <SheetDescription>
              Ask for coaching, teaching tips, or quick platform help.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-hidden p-4">
            <div className="h-full overflow-y-auto space-y-3 pr-2">
              {loadingPrompt ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded ${m.role === "bot"
                      ? "bg-gray-100 text-gray-900"
                      : "bg-blue-50 text-blue-900 self-end"
                      }`}
                  >
                    <div className="whitespace-pre-line text-sm">
                      {sanitizeAsterisks(m.text)}
                    </div>
                  </div>
                ))
              )}
              {sending && (
                <div className="flex items-center gap-2 p-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">Generating the response...</span>
                </div>
              )}
            </div>

            <div className="border-t p-3 flex gap-2 bg-white sticky bottom-0">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 p-2 rounded border"
                rows={2}
              />
              <button
                disabled={sending || !input.trim()}
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onClick={() => handleSendMessage()}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
