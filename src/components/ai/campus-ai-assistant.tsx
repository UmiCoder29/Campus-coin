"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { X, ArrowUp, Zap, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const STARTER_PROMPTS = [
  { text: "How does budget pacing work?", tag: "Budgets" },
  { text: "3 dorm meal prep ideas on a tight budget", tag: "Life" },
  { text: "Balance a part-time job with exams", tag: "Advice" },
  { text: "What's the daily spend velocity?", tag: "Features" },
];

/* ═══════════════════════════════════════════════════════════════════
   Campus AI Assistant — Editorial Redesign
   ═══════════════════════════════════════════════════════════════════ */
export function CampusAiAssistant() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Student";
  const firstName = userName.split(" ")[0];

  const [isOpen, setIsOpen] = useState(false);
  const [isTabHovered, setIsTabHovered] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content: `Hey ${firstName} — I'm here whenever you need a hand. Ask about any feature, get budgeting tips, or just chat.`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /* ── GSAP Open ──────────────────────────────────────────────── */
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (panelRef.current && backdropRef.current) {
      gsap.fromTo(
        panelRef.current,
        { x: "105%", scale: 0.92, opacity: 0, transformOrigin: "right center" },
        { x: "0%", scale: 1, opacity: 1, duration: 0.38, ease: "power3.out" }
      );
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, []);

  /* ── GSAP Close ─────────────────────────────────────────────── */
  const handleClose = useCallback(() => {
    if (panelRef.current && backdropRef.current) {
      gsap.to(panelRef.current, {
        x: "105%", scale: 0.92, opacity: 0,
        duration: 0.26, ease: "power2.in",
        onComplete: () => setIsOpen(false),
      });
      gsap.to(backdropRef.current, {
        opacity: 0, duration: 0.22, ease: "power2.in",
      });
    } else {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  /* ── Chat API ───────────────────────────────────────────────── */
  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputValue).trim();
    if (!message || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        let errMessage = `Server error ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) errMessage = errData.error;
        } catch {
          // ignore
        }
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Something went wrong — ${errMessage}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const assistantMessageId = `assistant-${Date.now()}`;

        setMessages((prev) => [
          ...prev,
          { id: assistantMessageId, role: "assistant", content: "", timestamp: new Date() },
        ]);
        setIsLoading(false);

        let accumulatedText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;
          const snapshot = accumulatedText;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, content: snapshot } : m
            )
          );
        }
      } else {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply || "",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Connection error: ${err?.message || "Failed to reach the server"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  /* auto-expand textarea */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          TRIGGER TAB — right-edge, vertically centred
         ═══════════════════════════════════════════════════════════ */}
      {!isOpen && (
        <div
          ref={tabRef}
          onMouseEnter={() => { setIsTabHovered(true); handleOpen(); }}
          onMouseLeave={() => setIsTabHovered(false)}
          onClick={handleOpen}
          role="button"
          tabIndex={0}
          aria-label="Open Campus AI Guide"
          title="Campus AI Guide"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 cursor-pointer group"
        >
          {/* Pill-shaped vertical tab */}
          <div
            className={`
              relative flex flex-col items-center justify-center gap-2
              w-9 sm:w-10 py-5 sm:py-6
              rounded-l-2xl
              border-y border-l
              transition-all duration-300 ease-out
              ${isTabHovered
                ? "bg-[#1C1F2E] dark:bg-[#1C1F2E] border-[#2D3347] shadow-[0_0_28px_rgba(99,102,241,0.12)]"
                : "bg-white/90 dark:bg-[#13161F]/90 border-[#E5E0D8] dark:border-[#1E2230] shadow-md"
              }
              backdrop-blur-xl
            `}
          >
            {/* Accent line — top edge */}
            <div className={`
              absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-b-full transition-all duration-300
              ${isTabHovered ? "w-5 bg-indigo-400" : "w-3 bg-[#C8BFB0] dark:bg-[#333A4D]"}
            `} />

            {/* Icon */}
            <div className={`
              w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300
              ${isTabHovered
                ? "bg-indigo-500/20 text-indigo-300 scale-110"
                : "bg-transparent text-[#8A8478] dark:text-[#5A6175]"
              }
            `}>
              <Zap className="h-3.5 w-3.5" />
            </div>

            {/* Vertical lettering */}
            <span className={`
              text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 select-none
              ${isTabHovered ? "text-indigo-300" : "text-[#A09A8E] dark:text-[#4A5267]"}
            `}
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              AI
            </span>

            {/* Status dot */}
            <span className={`
              w-1.5 h-1.5 rounded-full transition-all duration-500
              ${isTabHovered ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" : "bg-[#C4BDB0] dark:bg-[#3D4455]"}
            `} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PANEL — slide-out card
         ═══════════════════════════════════════════════════════════ */}
      <div className={`fixed inset-0 z-50 pointer-events-none ${isOpen ? "visible" : "invisible"}`}>
        {/* Backdrop */}
        <div
          ref={backdropRef}
          onClick={handleClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        />

        {/* Card */}
        <div
          ref={panelRef}
          className="
            absolute right-3 sm:right-5 top-1/2 -translate-y-1/2
            w-[calc(100vw-1.5rem)] sm:w-[400px]
            h-[calc(100vh-2.5rem)] max-h-[680px]
            rounded-[28px]
            bg-[#FEFDFB] dark:bg-[#12141E]
            border border-[#E8E3DA] dark:border-[#1E2134]
            shadow-[0_24px_80px_-12px_rgba(0,0,0,0.15)]
            dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.5)]
            flex flex-col overflow-hidden pointer-events-auto z-10
          "
        >
          {/* ── HEADER ─────────────────────────────────────────── */}
          <div className="relative shrink-0 px-5 pt-5 pb-4">
            {/* Decorative top-left corner mark */}
            <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-indigo-400/30 dark:border-indigo-500/20 rounded-tl-lg pointer-events-none" />

            <div className="flex items-start justify-between">
              <div className="pl-3">
                {/* Overline */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.4)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">
                    Online
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-extrabold font-heading text-[#1A1D2B] dark:text-white leading-tight">
                  Campus Guide
                </h3>
                <p className="text-[11px] text-[#8A8478] dark:text-[#5A6175] mt-0.5 font-medium">
                  Your financial companion
                </p>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={handleClose}
                className="
                  w-8 h-8 rounded-xl flex items-center justify-center
                  bg-[#F0ECE5] dark:bg-[#1A1D2B]
                  text-[#8A8478] dark:text-[#5A6175]
                  hover:text-[#1A1D2B] dark:hover:text-white
                  hover:bg-[#E5DFD5] dark:hover:bg-[#252839]
                  transition-colors cursor-pointer
                "
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Separator — thin gradient line */}
            <div className="mt-4 h-px bg-gradient-to-r from-transparent via-[#DDD6C8] dark:via-[#252839] to-transparent" />
          </div>

          {/* ── MESSAGES ───────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3 scrollbar-hide">
            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Role label — only for first assistant message */}
                {msg.role === "assistant" && idx === 0 && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#B5AFA3] dark:text-[#3D4456] mb-1 ml-1">
                    Campus Guide
                  </span>
                )}

                <div
                  className={`
                    rounded-2xl px-4 py-3 leading-relaxed text-[13px]
                    ${msg.role === "user"
                      ? `
                        bg-[#1A1D2B] dark:bg-indigo-600
                        text-white
                        rounded-br-md max-w-[82%]
                        font-medium
                        shadow-sm
                      `
                      : `
                        bg-[#F5F2EC] dark:bg-[#1A1D2B]
                        text-[#3A3D4A] dark:text-[#C8CDDB]
                        rounded-bl-md max-w-[90%]
                        border border-[#EAE5DC] dark:border-[#222539]
                      `
                    }
                  `}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                <span className="text-[10px] text-[#B5AFA3] dark:text-[#3D4456] mt-1 px-1 tabular-nums">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex flex-col items-start">
                <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-[#F5F2EC] dark:bg-[#1A1D2B] border border-[#EAE5DC] dark:border-[#222539] flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-[5px] h-[5px] rounded-full bg-indigo-400 dark:bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-[5px] h-[5px] rounded-full bg-indigo-400 dark:bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-[5px] h-[5px] rounded-full bg-indigo-400 dark:bg-indigo-500 animate-bounce" />
                  </span>
                </div>
              </div>
            )}

            {/* ── Starter Prompts — editorial tile grid ────────── */}
            {messages.length === 1 && (
              <div className="pt-3 pb-1">
                {/* Section label */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-[#E8E3DA] dark:bg-[#1E2134]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#B5AFA3] dark:text-[#3D4456] shrink-0">
                    Try asking
                  </span>
                  <div className="h-px flex-1 bg-[#E8E3DA] dark:bg-[#1E2134]" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {STARTER_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt.text)}
                      className="
                        group/tile text-left p-3 rounded-xl
                        bg-white dark:bg-[#161929]
                        border border-[#ECE7DE] dark:border-[#1E2134]
                        hover:border-indigo-300 dark:hover:border-indigo-500/40
                        hover:shadow-[0_2px_12px_rgba(99,102,241,0.08)]
                        dark:hover:shadow-[0_2px_12px_rgba(99,102,241,0.12)]
                        transition-all duration-200 cursor-pointer
                      "
                    >
                      {/* Tag */}
                      <span className="
                        inline-block text-[9px] font-bold uppercase tracking-[0.12em] mb-1.5
                        text-indigo-500 dark:text-indigo-400
                      ">
                        {prompt.tag}
                      </span>
                      {/* Question text */}
                      <p className="text-[11.5px] font-medium leading-snug text-[#3A3D4A] dark:text-[#9BA2B4] group-hover/tile:text-[#1A1D2B] dark:group-hover/tile:text-white transition-colors">
                        {prompt.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── INPUT AREA ─────────────────────────────────────── */}
          <div className="shrink-0 px-4 pb-4 pt-2">
            {/* Separator */}
            <div className="mb-3 h-px bg-gradient-to-r from-transparent via-[#DDD6C8] dark:via-[#252839] to-transparent" />

            <form onSubmit={handleFormSubmit}>
              <div className="
                flex items-end gap-2 p-1.5
                bg-[#F5F2EC] dark:bg-[#161929]
                rounded-2xl
                border border-[#E8E3DA] dark:border-[#1E2134]
                focus-within:border-indigo-300 dark:focus-within:border-indigo-500/50
                focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]
                dark:focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]
                transition-all duration-200
              ">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleTextareaChange}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Ask anything…"
                  disabled={isLoading}
                  rows={1}
                  className="
                    flex-1 resize-none bg-transparent
                    px-3 py-2
                    text-[13px] text-[#1A1D2B] dark:text-white
                    placeholder-[#B5AFA3] dark:placeholder-[#3D4456]
                    focus:outline-none
                    disabled:opacity-50
                    max-h-[120px]
                  "
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="
                    w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                    bg-[#1A1D2B] dark:bg-indigo-600
                    text-white
                    hover:bg-[#2A2D3B] dark:hover:bg-indigo-500
                    active:scale-90
                    transition-all duration-150 cursor-pointer
                    disabled:opacity-30 disabled:pointer-events-none
                    mb-0.5
                  "
                  title="Send"
                >
                  <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </div>

              {/* Footer metadata */}
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[10px] text-[#C4BDB0] dark:text-[#2D3145] font-medium">
                  ↵ enter to send
                </span>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-2.5 w-2.5 text-[#C4BDB0] dark:text-[#2D3145]" />
                  <span className="text-[10px] text-[#C4BDB0] dark:text-[#2D3145] font-medium">
                    Powered by Gemini
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default CampusAiAssistant;
