"use client";

import { AlertTriangle, FileText, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { uploadTranscriptSource } from "@/lib/client/storage";
import { saveTranscript } from "@/actions/transcripts";
import { showInfoToast, showSuccessToast, showErrorToast } from "@/components/toast";

import type { TranscriptMessage } from "@/types/transcript";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".docx",
  ".txt",
  ".text",
  ".md",
  ".markdown",
  ".rtf",
  ".csv",
  ".srt",
  ".vtt",
]);
const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "text/csv",
  "text/vtt",
  "text/srt",
  "application/json",
  "application/pdf",
  "application/rtf",
  "text/rtf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const UNSUPPORTED_TYPE_MESSAGE =
  "Unsupported file type. Please upload a PDF, DOCX, TXT, Markdown, or RTF file.";

interface TranscriptUploadProps {
  onClose: () => void;
  onDone?: (result: { messages: TranscriptMessage[]; sides: { a: string[]; b: string[] }; eventId?: string; round?: number }) => void;
  eventId?: string;
  round?: number;
  negId?: string;
  aSideName?: string;
  bSideName?: string;
  closeOnStart?: boolean;
}

interface SpeakerMapping {
  id: string;
  placeholder: string;
  name: string;
  side: "a" | "b";
}

interface UploadResponse {
  success: boolean;
  messages?: TranscriptMessage[];
  sides?: { a: string[]; b: string[] };
  eventId?: string;
  round?: number;
  rawTranscript?: string;
  error?: string;
}

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return fileName.slice(dotIndex).toLowerCase();
}

function bytesToMegabytes(size: number) {
  return (size / 1024 / 1024).toFixed(2);
}

function createSpeakerMapping(): SpeakerMapping {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `mapping-${Math.random().toString(36).slice(2)}`;
  return {
    id: randomId,
    placeholder: "",
    name: "",
    side: "a",
  };
}

export default function TranscriptUpload({
  onClose,
  onDone,
  eventId,
  round,
  negId,
  aSideName = "A",
  bSideName = "B",
  closeOnStart = false,
}: TranscriptUploadProps) {
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const { user } = useUser();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [speakerMappings, setSpeakerMappings] = useState<SpeakerMapping[]>([
    createSpeakerMapping(),
  ]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [cleanedMessages, setCleanedMessages] = useState<TranscriptMessage[]>([]);
  const [eventIdInput, setEventIdInput] = useState(eventId ?? (onDone ? "" : "some-event"));
  const [roundInput, setRoundInput] = useState(
    typeof round === "number" && Number.isFinite(round) ? String(round) : (onDone ? "" : "1"),
  );
  const [negIdInput, setNegIdInput] = useState(negId ?? Date.now().toString());

  const shouldCollectEventId = !eventId;
  const shouldCollectRound = !(typeof round === "number" && Number.isFinite(round));
  const shouldCollectNegId = !negId;

  const sanitizedSpeakerMap = useMemo(() => {
    return speakerMappings
      .filter((entry) => entry.placeholder.trim() && entry.name.trim())
      .map((entry) => ({
        placeholder: entry.placeholder.trim(),
        name: entry.name.trim(),
        side: entry.side === "b" ? "b" : "a",
      }));
  }, [speakerMappings]);

  const cleanedTranscriptText = useMemo(() => {
    return cleanedMessages.map((message) => `${message.user}: ${message.content}`).join("\n\n");
  }, [cleanedMessages]);


  const resetSelection = useCallback(() => {
    setSelectedFile(null);
    setCleanedMessages([]);
    setStatusMessage(null);
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const extension = getFileExtension(file.name);
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError("File size must not exceed 50MB.");
        event.target.value = "";
        return;
      }

      const forbiddenByExtension =
        extension &&
        !ALLOWED_EXTENSIONS.has(extension) &&
        (!file.type || !ALLOWED_MIME_TYPES.has(file.type));
      const forbiddenByMime = file.type && !ALLOWED_MIME_TYPES.has(file.type) && !extension;

      if (forbiddenByExtension || forbiddenByMime) {
        setError(UNSUPPORTED_TYPE_MESSAGE);
        event.target.value = "";
        return;
      }

      setError(null);
      setSelectedFile(file);
      setCleanedMessages([]);
      setStatusMessage(null);
    },
    [],
  );

  const updateMapping = useCallback((id: string, field: "placeholder" | "name" | "side", value: string) => {
    setSpeakerMappings((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
            ...entry,
            [field]:
              field === "side"
                ? (value === "b" ? "b" : "a")
                : value,
          }
          : entry,
      ),
    );
  }, []);

  const removeMapping = useCallback((id: string) => {
    setSpeakerMappings((prev) => {
      if (prev.length === 1) {
        return prev.map((entry) =>
          entry.id === id
            ? {
              ...entry,
              placeholder: "",
              name: "",
              side: "a",
            }
            : entry,
        );
      }
      return prev.filter((entry) => entry.id !== id);
    });
  }, []);

  const addMapping = useCallback(() => {
    setSpeakerMappings((prev) => [...prev, createSpeakerMapping()]);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    const resolvedEventId =
      typeof eventId === "string" ? eventId.trim() : eventIdInput.trim();
    if (!resolvedEventId) {
      setError("Please provide an event ID before uploading.");
      return;
    }

    const resolvedRound =
      typeof round === "number" && Number.isFinite(round)
        ? round
        : Number.parseInt(roundInput.trim(), 10);
    if (!Number.isInteger(resolvedRound)) {
      setError("Please provide a valid round number before uploading.");
      return;
    }

    const resolvedNegId = typeof negId === "string" ? negId.trim() : negIdInput.trim();
    if (onDone && !resolvedNegId) {
      setError("Please provide a negotiation ID before uploading.");
      return;
    }

    if (closeOnStart) {
      try { showInfoToast("Uploading transcript… You can continue here."); } catch {}
      try { resetSelection(); onClose(); } catch {}
    }

    if (isMountedRef.current) {
      setUploading(true);
      setError(null);
      setStatusMessage("Processing transcript…");
      setCleanedMessages([]);
    }
    let toastShown = false;


    try {
      const form = new FormData();
      form.append("transcriptFile", selectedFile);
      if (sanitizedSpeakerMap.length) {
        form.append("speakerMap", JSON.stringify(sanitizedSpeakerMap));
      }
      form.append("eventId", resolvedEventId);
      form.append("round", String(resolvedRound));

      const res = await fetch("/api/data/transcripts", {
        method: "POST",
        body: form,
      });
      const result = (await res.json()) as UploadResponse;
      if (!res.ok || !result?.success) {
        throw new Error(result?.error || "Failed to process transcript.");
      }

      const cleaned = Array.isArray(result.messages) ? result.messages : [];
      if (isMountedRef.current) setCleanedMessages(cleaned);
      if (onDone) {
        const userId = user?.uid;
        let uploadedSourcePath: string | null = null;
        if (userId) {
          try {
            const uploaded = await uploadTranscriptSource(selectedFile, userId, Date.now(), {
              eventId: resolvedEventId,
              round: resolvedRound,
              negId: resolvedNegId,
            });
            uploadedSourcePath = uploaded?.storagePath || null;
          } catch (storageError) {
            console.error("Transcript storage failed", storageError);
            if (isMountedRef.current) setError("Transcript processed but storing the original file failed.");
          }
        }

        const savePayload = {
          messages: cleaned,
          sides: result.sides || { a: [], b: [] },
          eventId: result.eventId,
          round: result.round,
          negId: resolvedNegId,
          source: uploadedSourcePath,
        } as any;
        try {
          await saveTranscript(savePayload);
          try { showSuccessToast("Transcript uploaded and processed."); toastShown = true; } catch {}
        } catch (persistErr) {
          console.error("Transcript persistence failed", persistErr);
          const msg = (persistErr as any)?.message || "Failed to save processed transcript.";
          if (isMountedRef.current) setError("Failed to save processed transcript.");
          try {
            if (typeof msg === "string" && msg.toLowerCase().includes("already exists")) {
              showErrorToast("A transcript for this match already exists.");
            } else {
              showErrorToast("Failed to save processed transcript.");
            }
            toastShown = true;
          } catch {}
          throw new Error("Failed to save processed transcript");
        }
        onDone({
          messages: cleaned,
          sides: result.sides || { a: [], b: [] },
          eventId: result.eventId,
          round: result.round,
        });
        if (!closeOnStart) onClose();
        return;
      }

      const userId = user?.uid;
      if (userId) {
        try {
          await uploadTranscriptSource(selectedFile, userId, Date.now(), {
            eventId: (resolvedEventId),
            round: (resolvedRound),
            negId: (resolvedNegId),
          });
        } catch (storageError) {
          console.error("Transcript storage failed", storageError);
          if (isMountedRef.current) setError("Transcript processed but storing the original file failed.");
        }
      }
      if (isMountedRef.current) setStatusMessage("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process transcript.";
      if (isMountedRef.current) {
        setError(message);
        setStatusMessage(null);
      }
      try { if (!toastShown) { showErrorToast(message); toastShown = true; } } catch {}
    } finally {
      if (isMountedRef.current) setUploading(false);
    }
  }, [
    eventId,
    eventIdInput,
    onDone,
    round,
    roundInput,
    sanitizedSpeakerMap,
    selectedFile,
    user?.uid,
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[95vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upload transcript</h2>
              <p className="text-sm text-gray-500">
                Supported formats: PDF, DOCX, TXT, Markdown, RTF (max 50MB)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetSelection();
              onClose();
            }}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close uploader"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-4">
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {(shouldCollectEventId || shouldCollectRound) && (!cleanedMessages?.length) && (
            <div className="grid gap-4 md:grid-cols-2">
              {shouldCollectEventId && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Event ID</label>
                  <input
                    type="text"
                    value={eventIdInput}
                    onChange={(event) => setEventIdInput(event.target.value)}
                    placeholder="Enter event identifier"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    disabled={uploading}
                  />
                </div>
              )}
              {shouldCollectRound && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Round</label>
                  <input
                    type="number"
                    value={roundInput}
                    onChange={(event) => setRoundInput(event.target.value)}
                    placeholder="Enter round number"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    disabled={uploading}
                    inputMode="numeric"
                    min={0}
                  />
                </div>
              )}
              {shouldCollectNegId && (!cleanedMessages?.length) && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Negotiation ID</label>
                  <input
                    type="text"
                    value={negIdInput}
                    onChange={(event) => setNegIdInput(event.target.value)}
                    placeholder="Enter negotiation identifier"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    disabled={uploading}
                  />
                </div>
              )}
            </div>
          )}

          <div>
            {!selectedFile && (!cleanedMessages?.length) && (
              <>
                <label className="block text-sm font-medium text-gray-700">Transcript file</label>
                <div className="mt-2 mb-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center transition hover:border-blue-400">
                  <input
                    id="transcript-upload"
                    type="file"
                    accept=".pdf,.docx,.txt,.text,.md,.markdown,.rtf,.csv,.vtt,.srt"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  <label
                    htmlFor="transcript-upload"
                    className="flex cursor-pointer flex-col items-center gap-3 text-gray-600"
                  >
                    <Upload size={32} className="text-blue-500" />
                    <span className="text-sm font-medium">Click to choose a transcript file</span>
                    <span className="text-xs text-gray-400">You can drag and drop</span>
                  </label>
                </div>
              </>
            )}

            {selectedFile && (!cleanedMessages?.length) && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-2 text-sm text-gray-700 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.type || "Unknown type").replace(/application\//, "")}
                      {" • "}
                      {bytesToMegabytes(selectedFile.size)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetSelection}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    disabled={uploading}
                  >
                    <X size={14} />
                    Remove file
                  </button>
                </div>
              </div>
            )}
          </div>

          {(!cleanedMessages?.length) && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Speaker map (optional)</label>
                <button
                  type="button"
                  onClick={addMapping}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
                  disabled={uploading}
                >
                  <Plus size={14} />
                  Add to mapping
                </button>
              </div>

              <p className="mb-2 text-xs text-gray-500">
                Provide the labels found in the transcript (for example, “Speaker 1” or “Interviewer”) and the names you want to replace them with. Leave fields blank if you do not need them.
              </p>

              <div className="space-y-3">
                {speakerMappings.map((entry) => (
                  <div key={entry.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 md:flex-row md:items-start">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                        Transcript label
                      </label>
                      <input
                        type="text"
                        value={entry.placeholder}
                        onChange={(event) => updateMapping(entry.id, "placeholder", event.target.value)}
                        placeholder="e.g. Speaker 1"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        disabled={uploading}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                        Replace with
                      </label>
                      <input
                        type="text"
                        value={entry.name}
                        onChange={(event) => updateMapping(entry.id, "name", event.target.value)}
                        placeholder="e.g. John Smith"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        disabled={uploading}
                      />
                    </div>
                    <div className="md:w-32">
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                        Assign side
                      </label>
                      <select
                        value={entry.side}
                        onChange={(event) => updateMapping(entry.id, "side", event.target.value)}
                        className="w-full rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        disabled={uploading}
                      >
                        <option value="a">{aSideName}</option>
                        <option value="b">{bSideName}</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-end md:w-24">
                      <button
                        type="button"
                        onClick={() => removeMapping(entry.id)}
                        className="inline-flex items-center justify-end gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        disabled={uploading}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {statusMessage}
            </div>
          )}

          {cleanedMessages.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Reformatted transcript:</h3>
                </div>
              </div>
              <textarea
                readOnly
                value={cleanedTranscriptText}
                className="h-72 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 shadow-inner focus:outline-none"
              />
            </div>
          )}
        </div>

        {!cleanedMessages?.length && (
          <div className="flex items-center justify-end border-t border-gray-100 bg-gray-50 p-4">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload transcript
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}