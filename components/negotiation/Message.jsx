import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Volume1, VolumeOff } from "lucide-react";

export default function Message({
  msg,
  acase,
  isOwnMessage,
  shouldSpeak,
  onSpeak,
  autoReadDisabled = false,
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const autoSpokenRef = useRef(false);

  const speakMessage = () => {
    if (!onSpeak || !msg.content) return;
    setIsSpeaking(true);
    onSpeak(msg.content, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  useEffect(() => {
    if (
      autoSpokenRef.current ||
      autoReadDisabled ||
      !shouldSpeak ||
      !msg.content ||
      isOwnMessage ||
      !onSpeak
    ) {
      return;
    }

    autoSpokenRef.current = true;
    onSpeak(msg.content, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  }, [autoReadDisabled, isOwnMessage, msg.content, onSpeak, shouldSpeak]);

  return (!msg.content && !msg.waiting) ? <></> : (
    <div
      className={`flex items-end gap-4 w-full mb-4 ${msg.role
        ? (msg.role === "ai" || msg.role === "assistant")
          ? "flex-row"
          : "flex-row-reverse"
        : isOwnMessage
          ? "flex-row-reverse"
          : "flex-row"
        }`}
    >
      <div className="!w-10 !h-10 shrink-0 rounded-full border-2 border-soft-gray flex items-center justify-center">
        {
          //TODO: Add player avatar here
        }
        {(msg.role === "ai" || msg.role === "assistant") && (
          <Image src="/ai-stars-purple.png" width={24} height={24} alt="Ai" />
        )}
      </div>
      <div className={`flex items-center ${msg.role
        ? (msg.role === "ai" || msg.role === "assistant")
          ? "flex-row"
          : "flex-row-reverse"
        : isOwnMessage
          ? "flex-row-reverse"
          : "flex-row"
        } max-w-[70%] gap-2`}>


        <div
          className={`inline-block p-2 rounded-md border-2 shadow-sm border-soft-gray ${msg.role
            ? (msg.role === "ai" || msg.role === "assistant")
              ? "rounded-bl-none"
              : "rounded-br-none"
            : isOwnMessage
              ? "rounded-br-none"
              : "rounded-bl-none"
            } ${msg.indecent ? "bg-red-400 text-white" : "bg-white text-darker-gray"}`}
        >
          <div className="whitespace-pre-wrap">
            {msg.waiting ? (
              <Image
                alt="typing-indicator"
                src="/wdots.gif"
                width="60"
                height="19"
              />
            ) : (
              msg.content
            )}
          </div>
        </div>
        {!msg.waiting && msg.content && onSpeak && (
          <button
            onClick={speakMessage}
            className={`flex items-center justify-center flex-shrink-0 ${msg.role
              ? (msg.role === "ai" || msg.role === "assistant")
                ? ""
                : "-scale-x-100"
              : isOwnMessage
                ? "-scale-x-100"
                : ""
              }`}
            aria-label="Read message"
          >
            {isSpeaking ? (
              <VolumeOff className="w-6 h-6 text-gray-500" />
            ) : (
              <Volume1 className="w-6 h-6 text-gray-500" />
            )}
          </button>
        )}
      </div>

      {msg.indecent && msg.flags?.length && (
        <div className="text-red-600 text-xs">
          <p>Opponent cannot respond; flagged for {msg.flags[0]}</p>
        </div>
      )}
    </div>
  );
}
