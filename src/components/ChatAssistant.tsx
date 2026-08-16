"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { usePrefersReducedMotion } from "@/lib/customization";

interface Message {
  id: number | "pending";
  role: "user" | "assistant";
  text: string;
}

const FALLBACK_REPLIES = [
  "Beautiful choice. This tote pairs equally well with a tailored blazer and a relaxed weekend look. Try the Silk finish for evening, or keep Fabric for everyday.",
  "The Gold finish gives this piece a warm, statement feel, while Black keeps it minimal and versatile. Which direction are you leaning?",
  "Emerald Green works as a classic accent colour. Pair it with neutral tones — ivory, camel, or charcoal — to let the bag stand out.",
  "This studio lets you preview any finish instantly. Switch between Fabric, Silk and Metallic and watch the surface react to light.",
];

function pickReply(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("color") || q.includes("colour")) {
    return "You can choose between Emerald Green, Gold, Black and White using the color swatches. Emerald reads as a bold classic, Gold is warm and premium, Black is understated, and White feels fresh and minimal.";
  }
  if (q.includes("material") || q.includes("finish")) {
    return "Three finishes are available: Fabric for a soft, matte everyday feel; Silk for a luxurious sheen with strong reflections; and Metallic for a glossy, polished look. Use the Material buttons to preview each one.";
  }
  if (q.includes("size") || q.includes("dimension") || q.includes("measure")) {
    return "This tote is designed at compact proportions — roughly 28 × 22 × 12 cm — ideal for daily essentials. Rotate and zoom the scene to inspect every angle.";
  }
  return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
}

/**
 * Dependency-free AI assistant for the studio.
 *
 * Accessibility model:
 * - The panel is a proper modal `role="dialog"` with `aria-modal`, a labelled
 *   heading and a lightweight Tab focus trap; Escape closes it.
 * - The message list is a normal (non-live) region so screen readers never get
 *   interrupted for every streamed token.
 * - A single `role="status"` region (polite) announces the response exactly
 *   once when it completes, plus one "responding" announcement at the start.
 * - The composer has a real <label>, Send is a labelled button, and a visible
 *   Stop button is in the tab order only while streaming.
 * - Focus moves into the textarea on open and returns to the launcher on close;
 *   focus is handed from Send to Stop when streaming starts and back to the
 *   composer input when it ends, so it is never dropped on the page.
 *   Reduced-motion users get the reply instantly.
 */
export default function ChatAssistant() {
  const reducedMotion = usePrefersReducedMotion();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [live, setLive] = useState("");

  const panelTitleId = useId();
  const panelId = useId();
  const inputId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const stopButtonRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLUListElement>(null);
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef<string | null>(null);
  const idRef = useRef(0);
  const wasOpenRef = useRef(false);
  const sendHadFocusRef = useRef(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    },
    [],
  );

  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  const commitAssistant = useCallback((text: string, announce: string) => {
    const stopHadFocus = document.activeElement === stopButtonRef.current;
    setMessages((prev) => [...prev, { id: nextId(), role: "assistant", text }]);
    setPending(null);
    setStreaming(false);
    setLive((prev) => (prev === announce ? `${prev} ` : announce));
    // The Stop button unmounts when streaming ends; hand focus to the composer
    // input (Send is disabled until the user types, so it cannot take focus).
    if (stopHadFocus) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, []);

  const stop = useCallback(() => {
    const stopHadFocus = document.activeElement === stopButtonRef.current;
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const partial = pendingRef.current ?? "";
    setPending(null);
    setStreaming(false);
    if (partial.trim().length > 0) {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", text: `${partial.trimEnd()} …` },
      ]);
    }
    setLive((prev) =>
      prev === "Response stopped." ? `${prev} ` : "Response stopped.",
    );
    if (stopHadFocus) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, []);

  const send = (text: string) => {
    const reply = pickReply(text);
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text }]);
    setInput("");
    setPending("");
    setStreaming(true);
    setLive("The assistant is responding.");

    // If the user just activated Send with the keyboard, keep focus on the
    // composer's primary action by moving it to the Stop button that replaces
    // Send while streaming.
    if (sendHadFocusRef.current) {
      sendHadFocusRef.current = false;
      window.setTimeout(() => stopButtonRef.current?.focus(), 0);
    }

    if (reducedMotion) {
      window.setTimeout(() => commitAssistant(reply, reply), 350);
      return;
    }

    const tokens = reply.split(/(?=\s+)/);
    let index = 0;
    timerRef.current = window.setInterval(() => {
      index += 1;
      setPending(tokens.slice(0, index).join(""));
      if (index >= tokens.length) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        timerRef.current = null;
        commitAssistant(reply, reply);
      }
    }, 30);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    sendHadFocusRef.current = document.activeElement === sendButtonRef.current;
    send(text);
  };

  const close = useCallback(() => {
    if (streaming) stop();
    setOpen(false);
  }, [streaming, stop]);

  // Move focus into the panel when it opens; return it to the launcher on close.
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      launcherRef.current?.focus();
    }
  }, [open]);

  // Close on Escape and keep Tab focus inside the dialog while it is open.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Keep the latest assistant text in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  const visible: Message[] =
    pending !== null
      ? [...messages, { id: "pending", role: "assistant", text: pending }]
      : messages;

  const panel = (
    <div
      id={panelId}
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={panelTitleId}
      className="fixed inset-x-3 top-16 bottom-3 z-50 flex flex-col overflow-hidden rounded-2xl border border-teal/30 bg-plum-light shadow-2xl md:inset-x-auto md:bottom-4 md:left-4 md:top-auto md:h-[540px] md:w-[400px]"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2
          id={panelTitleId}
          className="text-sm font-semibold uppercase tracking-[0.25em] text-white/85"
        >
          AI Assistant
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label="Close assistant"
          className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <ul
        ref={scrollRef}
        role="region"
        aria-label="Assistant messages"
        aria-busy={streaming}
        className="custom-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {visible.length === 0 && (
          <li>
            <p className="text-sm leading-relaxed text-white/60">
              Ask me about this piece — colours, materials, finishes or styling
              tips.
            </p>
          </li>
        )}
        {visible.map((message) =>
          message.role === "user" ? (
            <li
              key={message.id}
              className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-teal px-3.5 py-2 text-sm text-plum-dark"
            >
              {message.text}
            </li>
          ) : (
            <li
              key={message.id}
              className="mr-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-3.5 py-2 text-sm text-white/90"
            >
              {message.text}
              {message.id === "pending" && (
                <span
                  aria-hidden="true"
                  className="ml-0.5 inline-block h-3.5 w-[3px] animate-pulse rounded-sm bg-teal/80 align-middle"
                />
              )}
            </li>
          ),
        )}
      </ul>

      <form onSubmit={handleSubmit} className="border-t border-white/10 px-4 py-3">
        <label htmlFor={inputId} className="sr-only">
          Message the AI assistant
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id={inputId}
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            enterKeyHint="send"
            placeholder="Ask about finishes, materials, colours…"
            className="max-h-28 min-h-[42px] w-full flex-1 resize-y rounded-xl border border-white/20 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-white/50 focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          />
          {streaming ? (
            <button
              ref={stopButtonRef}
              type="button"
              onClick={stop}
              aria-label="Stop response"
              className="flex h-[42px] shrink-0 items-center gap-2 rounded-xl border border-white/30 px-3.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-[3px] bg-gold"
              />
              Stop
            </button>
          ) : (
            <button
              ref={sendButtonRef}
              type="submit"
              disabled={input.trim().length === 0}
              aria-label="Send message"
              className="flex h-[42px] shrink-0 items-center justify-center rounded-xl bg-teal px-4 text-plum-dark transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-plum disabled:opacity-40"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          )}
        </div>
        <p role="status" className="sr-only">
          {live}
        </p>
      </form>
    </div>
  );

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 rounded-xl border border-white/20 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-teal/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 shrink-0 text-teal"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/75">
          AI Assistant
        </span>
        <span aria-hidden="true" className="ml-auto text-xs text-teal">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && mounted && createPortal(panel, document.body)}
    </>
  );
}
