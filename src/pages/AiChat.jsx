import { useEffect, useMemo, useRef, useState } from "react";

import Swal from "sweetalert2";

import { ai } from "../api/services";
import { errorMessage } from "../api/client";

function AiMessageContent({ text }) {
  if (!text) {
    return null;
  }

  const lines = String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const renderInlineBold = (value) => {
    const parts = value.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-slate-800">
            {part.slice(2, -2)}
          </strong>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="space-y-2.5">
      {lines.map((line, index) => {
        const headingMatch = line.match(/^#{1,6}\s+(.*)$/);

        if (headingMatch) {
          return (
            <p key={index} className="pt-1 text-sm font-bold text-slate-800">
              {renderInlineBold(headingMatch[1])}
            </p>
          );
        }

        const bulletMatch = line.match(/^[-*•]\s+(.*)$/);

        if (bulletMatch) {
          const content = bulletMatch[1];

          const metricMatch = content.match(/^\*\*(.+?):\*\*\s*(.+)$/);

          if (metricMatch) {
            const label = metricMatch[1];

            const value = metricMatch[2];

            return (
              <div
                key={index}
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-3.5
                  py-2.5
                "
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-purple-500" />

                  <span className="text-sm text-slate-600">{label}</span>
                </div>

                <span
                  className="
                    shrink-0
                    rounded-lg
                    bg-white
                    px-2.5
                    py-1
                    text-sm
                    font-bold
                    text-slate-800
                    shadow-sm
                  "
                >
                  {renderInlineBold(value)}
                </span>
              </div>
            );
          }

          return (
            <div key={index} className="flex items-start gap-2.5">
              <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />

              <p className="text-sm leading-6 text-slate-600">
                {renderInlineBold(content)}
              </p>
            </div>
          );
        }

        const numberedMatch = line.match(/^\d+[.)]\s+(.*)$/);

        if (numberedMatch) {
          return (
            <div key={index} className="flex items-start gap-2.5">
              <span
                className="
                  mt-0.5
                  flex
                  h-5
                  w-5
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-purple-100
                  text-[10px]
                  font-bold
                  text-purple-700
                "
              >
                {index + 1}
              </span>

              <p className="text-sm leading-6 text-slate-600">
                {renderInlineBold(numberedMatch[1])}
              </p>
            </div>
          );
        }

        const plainMetric = line.match(/^\*\*(.+?):\*\*\s*(.+)$/);

        if (plainMetric) {
          return (
            <div
              key={index}
              className="
                flex
                items-center
                justify-between
                gap-4
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-3.5
                py-2.5
              "
            >
              <span className="text-sm text-slate-600">{plainMetric[1]}</span>

              <span className="rounded-lg bg-white px-2.5 py-1 text-sm font-bold text-slate-800 shadow-sm">
                {plainMetric[2]}
              </span>
            </div>
          );
        }

        return (
          <p
            key={index}
            className={`
              text-sm
              leading-6
              ${index === 0 ? "font-medium text-slate-700" : "text-slate-600"}
            `}
          >
            {renderInlineBold(line)}
          </p>
        );
      })}
    </div>
  );
}

export default function AiChat() {
  const role = localStorage.getItem("role") || "";

  const userName =
    localStorage.getItem("userName") ||
    localStorage.getItem("employeeName") ||
    (role === "ADMIN" ? "Admin" : "User");

  const [open, setOpen] = useState(false);

  const [text, setText] = useState("");

  const [busy, setBusy] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      who: "ai",
      type: "normal",
      text:
        role === "ADMIN"
          ? `Hi ${userName}! I'm your EMS Admin AI assistant. How can I help you today?`
          : `Hi ${userName}! I'm your EMS AI assistant. How can I help you today?`,
    },
  ]);

  const messagesEndRef = useRef(null);

  const textareaRef = useRef(null);

  const assistantTitle = role === "ADMIN" ? "EMS Admin AI" : "EMS AI Assistant";

  const assistantSubtitle =
    role === "ADMIN" ? "Admin Workspace" : "Employee Assistant";

  const quickPrompts = useMemo(() => {
    if (role === "ADMIN") {
      return [
        {
          icon: "bi-speedometer2",
          text: "Today's EMS summary",
        },
        {
          icon: "bi-people",
          text: "Employee overview",
        },
        {
          icon: "bi-calendar2-check",
          text: "Pending leaves",
        },
        {
          icon: "bi-clock-history",
          text: "Attendance summary",
        },
        {
          icon: "bi-cash-stack",
          text: "Payroll summary",
        },
        {
          icon: "bi-calendar-event",
          text: "Upcoming holidays",
        },
      ];
    }

    return [
      {
        icon: "bi-person-check",
        text: "My attendance",
      },
      {
        icon: "bi-clock",
        text: "My working hours",
      },
      {
        icon: "bi-calendar2-week",
        text: "My leaves",
      },
      {
        icon: "bi-wallet2",
        text: "My salary",
      },
      {
        icon: "bi-stars",
        text: "My performance",
      },
      {
        icon: "bi-calendar-event",
        text: "Upcoming holidays",
      },
    ];
  }, [role]);

  useEffect(() => {
    if (!open) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, busy, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [open]);

  const send = async (question) => {
    const q = (question ?? text).trim();

    if (!q || busy) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        who: "me",
        type: "normal",
        text: q,
      },
    ]);

    setText("");

    setBusy(true);

    try {
      const response = await ai.chat(q);

      const data = response?.data;

      let answer = "";

      if (typeof data === "string") {
        answer = data;
      } else {
        answer = data?.response || data?.answer || data?.message || "";
      }

      if (!answer && data) {
        try {
          answer = JSON.stringify(data, null, 2);
        } catch {
          answer = "AI response received.";
        }
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          who: "ai",
          type: "normal",
          text: answer || "I could not generate a response.",
        },
      ]);
    } catch (error) {
      console.error("AI chat error:", error);

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          who: "ai",
          type: "error",
          text:
            errorMessage(error, "Unable to get AI response.") ||
            "Unable to get AI response.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      send();
    }
  };

  const clearChat = async () => {
    if (messages.length <= 1) {
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Clear AI Chat?",
      text: "All current chat messages will be removed.",
      showCancelButton: true,
      confirmButtonText: "Clear Chat",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    setMessages([
      {
        id: crypto.randomUUID(),

        who: "ai",

        type: "normal",

        text:
          role === "ADMIN"
            ? `Hi ${userName}! I'm your EMS Admin AI assistant. How can I help you today?`
            : `Hi ${userName}! I'm your EMS AI assistant. How can I help you today?`,
      },
    ]);

    setText("");
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Open EMS AI Assistant"
          className="
            fixed
            bottom-6
            right-6
            z-[8000]
            flex
            h-14
            w-14
            cursor-pointer
            items-center
            justify-center
            rounded-full
            bg-gradient-to-br
            from-indigo-600
            to-purple-600
            text-white
            shadow-xl
            transition-all
            duration-200
            hover:scale-105
            hover:shadow-2xl
            active:scale-95
          "
        >
          <i className="bi bi-stars text-xl" />

          <span
            className="
              absolute
              -right-0.5
              -top-0.5
              h-3.5
              w-3.5
              rounded-full
              border-2
              border-white
              bg-green-500
            "
          />
        </button>
      )}

      {open && (
        <div
          className="
            fixed
            bottom-5
            right-5
            z-[8000]
            flex
            h-[600px]
            w-[410px]
            max-h-[calc(100vh-2rem)]
            max-w-[calc(100vw-2rem)]
            flex-col
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-2xl
          "
        >
          <div
            className="
              flex
              shrink-0
              items-center
              justify-between
              bg-gradient-to-r
              from-indigo-600
              to-purple-600
              px-4
              py-4
              text-white
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white/15
                "
              >
                <i className="bi bi-stars text-lg" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold">{assistantTitle}</p>

                  {role === "ADMIN" && (
                    <span
                      className="
                        rounded-full
                        bg-white/20
                        px-2
                        py-0.5
                        text-[9px]
                        font-bold
                        tracking-wide
                      "
                    >
                      ADMIN
                    </span>
                  )}
                </div>

                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-indigo-100">
                  <span className="h-2 w-2 rounded-full bg-green-400" />

                  {assistantSubtitle}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                disabled={messages.length <= 1 || busy}
                title="Clear Chat"
                className="
                  flex
                  h-9
                  w-9
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-lg
                  text-white/80
                  transition
                  hover:bg-white/10
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <i className="bi bi-trash3" />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close"
                className="
                  flex
                  h-9
                  w-9
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-lg
                  text-white/80
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
          </div>

          <div
            className="
              flex-1
              space-y-4
              overflow-y-auto
              bg-slate-50
              p-4
            "
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`
                    flex
                    ${message.who === "me" ? "justify-end" : "justify-start"}
                  `}
              >
                <div
                  className={`
                      max-w-[90%]
                      rounded-2xl
                      px-4
                      py-3
                      text-sm
                      leading-6

                      ${
                        message.who === "me"
                          ? `
                            rounded-br-md
                            bg-blue-600
                            text-white
                          `
                          : message.type === "error"
                            ? `
                              rounded-bl-md
                              border
                              border-red-100
                              bg-red-50
                              text-red-700
                            `
                            : `
                              rounded-bl-md
                              border
                              border-slate-200
                              bg-white
                              text-slate-700
                              shadow-sm
                            `
                      }
                    `}
                >
                  {message.who === "ai" && (
                    <div
                      className="
                          mb-2
                          flex
                          items-center
                          gap-1.5
                          text-[11px]
                          font-bold
                          text-purple-600
                        "
                    >
                      <i className="bi bi-stars" />

                      {role === "ADMIN" ? "EMS ADMIN AI" : "EMS AI"}
                    </div>
                  )}

                  {message.who === "ai" ? (
                    <AiMessageContent text={message.text} />
                  ) : (
                    <p className="whitespace-pre-line break-words">
                      {message.text}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div
                  className="
                    rounded-2xl
                    rounded-bl-md
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    shadow-sm
                  "
                >
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-purple-600">
                    <i className="bi bi-stars" />

                    {role === "ADMIN" ? "EMS ADMIN AI" : "EMS AI"}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />

                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />

                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div
              className="
                shrink-0
                border-t
                border-slate-100
                bg-white
                px-3
                py-3
              "
            >
              <div className="mb-2 flex items-center gap-2">
                <i className="bi bi-lightning-charge-fill text-xs text-purple-500" />

                <p className="text-[10px] font-bold tracking-wide text-slate-400">
                  QUICK ACTIONS
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    type="button"
                    key={prompt.text}
                    onClick={() => send(prompt.text)}
                    disabled={busy}
                    className="
                        group
                        flex
                        cursor-pointer
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-3
                        py-2.5
                        text-left
                        text-xs
                        font-medium
                        text-slate-600
                        shadow-sm
                        transition-all
                        hover:border-purple-200
                        hover:bg-purple-50
                        hover:text-purple-700
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                  >
                    <div
                      className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-slate-100
                          text-slate-500
                          transition
                          group-hover:bg-purple-100
                          group-hover:text-purple-600
                        "
                    >
                      <i className={`bi ${prompt.icon}`} />
                    </div>

                    <span className="leading-4">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            className="
              shrink-0
              border-t
              border-slate-200
              bg-white
              p-3
            "
          >
            <div
              className="
                flex
                items-end
                gap-2
                rounded-xl
                border
                border-slate-300
                bg-white
                p-2
                transition
                focus-within:border-blue-500
                focus-within:ring-2
                focus-within:ring-blue-100
              "
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={text}
                disabled={busy}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  role === "ADMIN"
                    ? "Ask about employees, attendance, leaves, payroll..."
                    : "Ask about your attendance, leave, salary..."
                }
                className="
                  max-h-28
                  min-h-[40px]
                  flex-1
                  resize-none
                  bg-transparent
                  px-2
                  py-2
                  text-sm
                  text-slate-700
                  outline-none
                  placeholder:text-slate-400
                  disabled:cursor-not-allowed
                "
              />

              <button
                type="button"
                onClick={() => send()}
                disabled={busy || !text.trim()}
                title="Send Message"
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-lg
                  bg-blue-600
                  text-white
                  shadow-sm
                  transition
                  hover:bg-blue-700
                  active:scale-95
                  disabled:cursor-not-allowed
                  disabled:bg-slate-300
                "
              >
                {busy ? (
                  <i className="bi bi-arrow-repeat animate-spin" />
                ) : (
                  <i className="bi bi-send-fill" />
                )}
              </button>
            </div>

            <p className="mt-2 text-center text-[10px] text-slate-400">
              Press Enter to send
              <span className="mx-1">•</span>
              Shift + Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}
