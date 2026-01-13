"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EdgeTTS } from "edge-tts-universal/browser";
import { getLipsyncManager } from "@/lib/lipsyncManager";

const VOICE_PRESETS = {
  female: "en-US-JennyNeural",
  male: "en-US-GuyNeural",
  "de-female": "de-DE-KatjaNeural",
  "de-male": "de-DE-ConradNeural",
  "es-female": "es-ES-ElviraNeural",
  "es-male": "es-ES-AlvaroNeural",
  "fr-female": "fr-FR-DeniseNeural",
  "fr-male": "fr-FR-HenriNeural",
};

const AUDIO_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

const getVoiceId = (voice, language) => {
  const lang = (language || "").toLowerCase();
  const langMap = {
    de: { female: "de-female", male: "de-male" },
    es: { female: "es-female", male: "es-male" },
    fr: { female: "fr-female", male: "fr-male" },
    en: { female: "female", male: "male" },
  };
  const matched = Object.keys(langMap).find((key) => lang.startsWith(key));
  if (matched) {
    const presetKey = langMap[matched][voice] || langMap[matched].female;
    if (VOICE_PRESETS[presetKey]) return VOICE_PRESETS[presetKey];
  }
  if (!voice) return VOICE_PRESETS.female;
  if (VOICE_PRESETS[voice]) return VOICE_PRESETS[voice];
  return voice;
};

export function useEdgeTtsPlayer({
  voice = "female",
  enableLipsync = false,
  onStart,
  onEnd,
  language,
  audioRef: externalAudioRef = null,
} = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const queueRef = useRef([]);
  const playingRef = useRef(false);
  const audioRef = useRef(null);
  const voiceRef = useRef(getVoiceId(voice, language));
  const unlockedRef = useRef(false);
  const lastSpokenRef = useRef({ text: null, voice: null });
  const [lipsyncManager, setLipsyncManager] = useState(null);

  useEffect(() => {
    voiceRef.current = getVoiceId(voice, language);
  }, [voice, language]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const manager = await getLipsyncManager();
      if (isMounted) setLipsyncManager(manager);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const cleanUpAudio = useCallback(() => {
    const targetAudio = externalAudioRef?.current || audioRef.current;
    if (targetAudio) {
      targetAudio.pause();
      targetAudio.src = "";
      if (!externalAudioRef) {
        audioRef.current = null;
      }
    }
  }, [externalAudioRef]);

  const synthesize = useCallback(async (text, voiceOverride) => {
    const chosenVoice = voiceOverride
      ? getVoiceId(voiceOverride, language)
      : voiceRef.current || getVoiceId("female", language);

    let blob = null;

    // Attempt Node-like constructor signature (text, voice, opts) with synthesize()
    try {
      const tts = new EdgeTTS(text, chosenVoice, { format: AUDIO_FORMAT });
      if (typeof tts.synthesize === "function") {
        const result = await tts.synthesize();
        if (result?.audio?.arrayBuffer) {
          const ab = await result.audio.arrayBuffer();
          blob = new Blob([ab], { type: "audio/mpeg" });
        } else if (result?.arrayBuffer) {
          const ab = await result.arrayBuffer();
          blob = new Blob([ab], { type: "audio/mpeg" });
        }
      }
    } catch {
      // fall back to browser-oriented API
    }

    // Fallback to browser-style constructor with speak/synthesize
    if (!blob) {
      const tts2 = new EdgeTTS({ voice: chosenVoice, format: AUDIO_FORMAT });
      if (typeof tts2.speak === "function") {
        const res = await tts2.speak(text);
        if (res instanceof Blob) blob = res;
        else if (res?.audio instanceof Blob) blob = res.audio;
        else if (res?.audio?.arrayBuffer) {
          const ab = await res.audio.arrayBuffer();
          blob = new Blob([ab], { type: "audio/mpeg" });
        } else if (res?.arrayBuffer) {
          const ab = await res.arrayBuffer();
          blob = new Blob([ab], { type: "audio/mpeg" });
        }
      } else if (typeof tts2.synthesize === "function") {
        const res = await tts2.synthesize(text);
        if (res?.audio?.arrayBuffer) {
          const ab = await res.audio.arrayBuffer();
          blob = new Blob([ab], { type: "audio/mpeg" });
        } else if (res?.arrayBuffer) {
          const ab = await res.arrayBuffer();
          blob = new Blob([ab], { type: "audio/mpeg" });
        }
      }
    }

    if (!blob) {
      throw new Error("Unable to synthesize audio with Bing TTS (no speak/synthesize found)");
    }

    return blob;
  }, []);

  const unlockAudio = useCallback(() => {
    if (unlockedRef.current) return;
    const audio = externalAudioRef?.current || audioRef.current || new Audio();
    if (!externalAudioRef) {
      audioRef.current = audio;
    } else if (!externalAudioRef.current) {
      externalAudioRef.current = audio;
    }
    audio.muted = true;
    audio.src =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA="; // tiny silent wav
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      unlockedRef.current = true;
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => unlockAudio();
    window.addEventListener("pointerdown", handler, { passive: true });
    window.addEventListener("touchstart", handler, { passive: true });
    window.addEventListener("click", handler, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("click", handler);
    };
  }, [unlockAudio]);

  const playNext = useCallback(async () => {
    if (playingRef.current) return;
    const next = queueRef.current.shift();
    if (!next || !next.text?.trim()) return;

    playingRef.current = true;
    setIsSpeaking(true);
    if (next.onStart) next.onStart();
    onStart?.();

    try {
      const blob = await synthesize(next.text, next.voice);
      const url = URL.createObjectURL(blob);
      cleanUpAudio();
      const audio = externalAudioRef?.current || audioRef.current || new Audio();
      if (!externalAudioRef) {
        audioRef.current = audio;
      } else if (!externalAudioRef.current) {
        externalAudioRef.current = audio;
      }
      audio._wawaConnected = false; // allow lipsync to reconnect on new source
      audio.src = url;

      if (enableLipsync && lipsyncManager && typeof lipsyncManager.connectAudio === "function") {
        lipsyncManager.connectAudio(audio);
      }

      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
        playingRef.current = false;
        if (next.onEnd) next.onEnd();
        onEnd?.();
        playNext();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
        playingRef.current = false;
        if (next.onEnd) next.onEnd();
        playNext();
      };

      try {
        await audio.play();
      } catch (playErr) {
        // Retry once after unlock gesture
        unlockAudio();
        await audio.play().catch(() => {});
      }
    } catch (err) {
      console.error("Failed to play TTS audio", err);
      setIsSpeaking(false);
      playingRef.current = false;
      if (next?.onEnd) next.onEnd();
      playNext();
    }
  }, [cleanUpAudio, enableLipsync, lipsyncManager, onEnd, onStart, synthesize, unlockAudio]);

  const speak = useCallback(
    (text, options = {}) => {
      if (!text?.trim()) return;
      unlockAudio();
      lastSpokenRef.current = {
        text,
        voice: options.voice || voiceRef.current,
      };
      queueRef.current.push({
        text,
        voice: options.voice,
        onStart: options.onStart,
        onEnd: options.onEnd,
      });
      if (!playingRef.current) {
        playNext();
      }
    },
    [playNext, unlockAudio]
  );

  const replayLast = useCallback(() => {
    const { text, voice: lastVoice } = lastSpokenRef.current || {};
    if (!text) return;
    speak(text, { voice: lastVoice });
  }, [speak]);

  const stop = useCallback(() => {
    queueRef.current = [];
    playingRef.current = false;
    setIsSpeaking(false);
    cleanUpAudio();
  }, [cleanUpAudio]);

  useEffect(() => stop, [stop]);

  const voices = useMemo(() => VOICE_PRESETS, []);

  return {
    speak,
    stop,
    isSpeaking,
    voices,
    currentVoice: voiceRef.current,
    setVoice: (v) => (voiceRef.current = getVoiceId(v)),
    replayLast,
  };
}

export { VOICE_PRESETS };
