"use client";
import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { showErrorToast } from "@/components/toast";

export default function LoginMessageBanner({ children }) {
  const { user } = useUser();
  const pathname = usePathname();

  // Explicitly derive role based on current path
  const derivedRole = pathname?.startsWith("/instructor")
    ? "instructor"
    : pathname?.startsWith("/negotiator")
      ? "negotiator"
      : (user?.role?.toLowerCase() || "negotiator");

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const prevUid = useRef(null);
    console.log('message.>' , message)
  useEffect(() => {
    if (!user?.uid) return;
    if (prevUid.current === user.uid && message) return;
    prevUid.current = user.uid;

    let mounted = true;

    const fetchMessage = async () => {
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const res = await fetch(
          `${apiBase}/v1/chatbot/login-message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              userId: user.uid,
              role: derivedRole,
            }),
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch AI message");
        }

        const data = await res.json();
        if (mounted) {
          // Sanitize markdown bold markers (e.g., **Important**) from the message
          const sanitizeAsterisks = (txt) => {
            if (!txt) return txt;
            // Replace **bold** with bold, then remove any stray **
            try {
              let t = String(txt).replace(/\*\*(.*?)\*\*/gs, '$1');
              t = t.replace(/\*\*/g, '');
              return t;
            } catch (e) {
              return String(txt).replace(/\*\*/g, '');
            }
          };

          const raw = data?.message || '';
          const sanitized = sanitizeAsterisks(raw).trim();

          // Role-based Guard: If we are on an instructor page but receive a negotiator message
          // (check for keywords), suppress it.
          if (derivedRole === "instructor") {
            if (sanitized.includes("competency averages")) {
              console.warn("[LoginMessageBanner] Suppressing negotiator-style message on instructor page.");
              setMessage("Once you complete a session and receive participant feedback, you’ll see personalized teaching guidance here.");
            } else if (!sanitized) {
              // Placeholder for instructors with no feedback yet
              setMessage("Once you complete a session and receive participant feedback, you’ll see personalized teaching guidance here.");
            } else {
              setMessage(sanitized);
            }
          } else {
            setMessage(sanitized || null);
          }
        }
      } catch (e) {
        console.warn("LoginMessageBanner fetch failed:", e);
        // Do not show toast error to avoid annoying user if it's intermittent
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMessage();

    return () => {
      mounted = false;
    };
  }, [user, derivedRole]);

  if (!user) return null;

  // Expose { message, loading } to caller via render-prop
  if (typeof children === "function") {
    return children({ message, loading });
  }

  // Backwards compatibility: render nothing
  return null;
}