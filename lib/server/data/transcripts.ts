import "server-only";

import { fileTypeFromBuffer } from "file-type";
import type { TranscriptMessage } from "@/types/transcript";
import { processTranscript } from "@/lib/server/ai";
import { saveDocsInBatches, getDocs } from "@/lib/server/data/data";

export type SpeakerSide = "a" | "b";

export type SpeakerReplacementEntry = {
  placeholder: string;
  name: string;
  side: SpeakerSide;
};

export type SpeakerReplacementMap = SpeakerReplacementEntry[];

export type ProcessTranscriptResult =
  | { success: false; error: string }
  | {
    success: true;
    messages: TranscriptMessage[];
    sides: { a: string[]; b: string[] };
    eventId?: string;
    round?: number;
  };

export type CleanTranscriptResult = {
  messages: TranscriptMessage[];
  sides: { a: string[]; b: string[] };
  eventId?: string;
  round?: number;
};

type TranscriptKind = "pdf" | "docx" | "rtf" | "text";

type DeterminedFileKind = {
  kind: TranscriptKind;
  extension: string;
  mime: string;
};

type TranscriptFile = {
  arrayBuffer: () => Promise<ArrayBuffer>;
  size: number;
  type?: string;
  name?: string;
};

export type TranscriptUploadData = {
  transcriptFile?: unknown;
  speakerMap?: unknown;
  userId?: string;
  eventId?: string;
  round?: number;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const TEXT_MIME_WHITELIST = new Set<string>([
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
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const PLAIN_TEXT_EXTENSIONS = new Set<string>([
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getExtension(filename = "") {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return filename.slice(dotIndex).toLowerCase();
}

function isFileLike(file: unknown): file is TranscriptFile {
  if (!file || typeof file !== "object") {
    return false;
  }
  const candidate = file as TranscriptFile;
  return (
    typeof candidate.arrayBuffer === "function" &&
    typeof candidate.size === "number" &&
    candidate.size >= 0
  );
}

function parseSpeakerMap(rawValue: unknown): SpeakerReplacementMap {
  let entries: unknown;

  if (Array.isArray(rawValue)) {
    entries = rawValue;
  } else if (typeof rawValue === "string" && rawValue.trim()) {
    try {
      const parsed = JSON.parse(rawValue);
      entries = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Failed to parse speaker map", error);
      return [];
    }
  } else {
    return [];
  }

  const map: SpeakerReplacementMap = [];
  for (const entry of entries as Array<Record<string, unknown>>) {
    if (!entry || typeof entry !== "object") continue;
    const placeholder = (
      (entry.placeholder ?? entry.label ?? entry.original ?? "") as string
    )
      .toString()
      .trim();
    const name = ((entry.name ?? entry.value ?? entry.replacement ?? "") as string)
      .toString()
      .trim();
    if (!placeholder || !name) {
      continue;
    }
    const rawSide = (entry.side ?? entry.assignment ?? entry.sideId ?? entry.role ?? "")
      .toString()
      .trim()
      .toLowerCase();
    const side: SpeakerSide = rawSide === "b" ? "b" : "a";
    map.push({ placeholder, name, side });
  }

  return map;
}

function ensurePlainTextSafe(buffer: Buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Invalid file buffer");
  }
  if (buffer.includes(0)) {
    throw new Error("Transcript appears to contain binary data and cannot be processed as text");
  }
}

async function ensureDocxSafe(buffer: Buffer) {
  const { default: JSZip } = await import("jszip");
  let archive;
  try {
    archive = await JSZip.loadAsync(buffer, { createFolders: false });
  } catch (error) {
    throw new Error("Invalid DOCX archive");
  }
  if (!archive.files["word/document.xml"]) {
    throw new Error("DOCX document is missing its main content");
  }
  if (archive.files["word/vbaProject.bin"]) {
    throw new Error("DOCX files containing macros are not allowed");
  }
}

function ensurePdfSafe(buffer: Buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Invalid file buffer");
  }
  const header = buffer.subarray(0, Math.min(buffer.length, 4)).toString("utf8");
  if (!header.startsWith("%PDF")) {
    throw new Error("File does not look like a valid PDF document");
  }
  const suspiciousMarkers = [/\/JavaScript\b/i, /\/JS\b/i, /\/Launch\b/i, /\/OpenAction\b/i];
  const sampleWindow = buffer.subarray(0, Math.min(buffer.length, 200000)).toString("latin1");
  if (suspiciousMarkers.some((regex) => regex.test(sampleWindow))) {
    throw new Error("PDF contains potentially unsafe embedded actions");
  }
}

function convertRtfToText(raw: string) {
  if (!raw) return "";
  let text = raw;
  text = text.replace(/\\par[d]?/g, "\n");
  text = text.replace(/\\line/g, "\n");
  text = text.replace(/\\tab/g, "\t");
  text = text.replace(/\\u(-?\d+)\??/g, (_, codePoint: string) => {
    const value = Number.parseInt(codePoint, 10);
    if (Number.isNaN(value)) return "";
    try {
      return String.fromCodePoint(value < 0 ? value + 65536 : value);
    } catch (error) {
      return "";
    }
  });
  text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex: string) => {
    const value = Number.parseInt(hex, 16);
    if (Number.isNaN(value)) return "";
    return String.fromCharCode(value);
  });
  text = text.replace(/\\[^\\\s]+ ?/g, "");
  text = text.replace(/[{}]/g, "");
  return text.replace(/\r\n?/g, "\n");
}

function normalizeLineEndings(text: string) {
  return text.replace(/\r\n?/g, "\n");
}

function ensureAllowedSignature(detectedMime?: string) {
  if (detectedMime && !TEXT_MIME_WHITELIST.has(detectedMime)) {
    throw new Error("File signature indicates a disallowed file type");
  }
}

async function extractPdf(buffer: Buffer) {
  const module = await import("afpp" /* webpackChunkName: "afpp" */);
  const pdf2string = module.pdf2string ?? module.default?.pdf2string;
  if (typeof pdf2string !== "function") {
    throw new Error("Failed to load PDF parser");
  }
  const pages = await pdf2string(buffer, { concurrency: 2 });
  const text = Array.isArray(pages) ? pages.join("\n\n") : String(pages ?? "");
  return normalizeLineEndings(text);
}

async function extractDocx(buffer: Buffer) {
  const module = await import("mammoth" /* webpackChunkName: "mammoth" */);
  const mammoth = module.default || module;
  const { value } = await mammoth.extractRawText({ buffer });
  return normalizeLineEndings(value || "");
}

async function extractTextContent(buffer: Buffer, kind: TranscriptKind) {
  if (kind === "pdf") {
    return extractPdf(buffer);
  }
  if (kind === "docx") {
    return extractDocx(buffer);
  }
  if (kind === "rtf") {
    const raw = buffer.toString("utf8");
    return normalizeLineEndings(convertRtfToText(raw));
  }
  const text = buffer.toString("utf8");
  return normalizeLineEndings(text);
}

async function determineFileKind(
  buffer: Buffer,
  fileName: string | undefined,
  fileMime: string | undefined,
): Promise<DeterminedFileKind> {
  const extension = getExtension(fileName);
  const normalizedMime = (fileMime || "").toLowerCase();
  const detected = await fileTypeFromBuffer(buffer);
  const detectedMime = detected?.mime?.toLowerCase();

  ensureAllowedSignature(detectedMime);

  if (detectedMime === "application/pdf" || normalizedMime === "application/pdf" || extension === ".pdf") {
    return { kind: "pdf", extension: ".pdf", mime: "application/pdf" };
  }

  if (
    extension === ".docx" ||
    normalizedMime.includes("officedocument.wordprocessingml.document") ||
    detectedMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return {
      kind: "docx",
      extension: ".docx",
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }

  if (detectedMime === "application/zip" && extension === ".docx") {
    return {
      kind: "docx",
      extension: ".docx",
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }

  if (extension === ".rtf" || normalizedMime === "application/rtf" || normalizedMime === "text/rtf") {
    return { kind: "rtf", extension: ".rtf", mime: "application/rtf" };
  }

  if (detectedMime === "text/rtf") {
    return { kind: "rtf", extension: extension || ".rtf", mime: "application/rtf" };
  }

  if (
    PLAIN_TEXT_EXTENSIONS.has(extension) ||
    TEXT_MIME_WHITELIST.has(normalizedMime) ||
    (!extension && detectedMime === "text/plain")
  ) {
    if (detectedMime && detectedMime !== "text/plain" && !TEXT_MIME_WHITELIST.has(detectedMime)) {
      throw new Error("File signature does not match a supported text format");
    }
    const resolvedExtension = extension || ".txt";
    const resolvedMime = normalizedMime || detectedMime || "text/plain";
    return { kind: "text", extension: resolvedExtension, mime: resolvedMime };
  }

  throw new Error("Unsupported or unrecognized transcript format");
}

export async function processTranscriptUpload(
  uploadData: TranscriptUploadData | null | undefined,
): Promise<ProcessTranscriptResult> {
  const transcriptFile = uploadData?.transcriptFile;
  if (!isFileLike(transcriptFile) || typeof transcriptFile === "string") {
    return { success: false, error: "No transcript file received" };
  }

  if (transcriptFile.size === 0) {
    return { success: false, error: "Selected file is empty" };
  }

  if (transcriptFile.size > MAX_FILE_SIZE) {
    return { success: false, error: "Transcript must be 5MB or smaller" };
  }

  const arrayBuffer = await transcriptFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let kind: DeterminedFileKind;
  try {
    kind = await determineFileKind(buffer, transcriptFile.name || "transcript", transcriptFile.type);
  } catch (error) {
    return { success: false, error: (error as Error).message || "Unsupported transcript format" };
  }

  try {
    if (kind.kind === "pdf") {
      ensurePdfSafe(buffer);
    } else if (kind.kind === "docx") {
      await ensureDocxSafe(buffer);
    } else {
      ensurePlainTextSafe(buffer);
    }
  } catch (error) {
    return { success: false, error: (error as Error).message || "Transcript failed safety checks" };
  }

  const speakerMap = parseSpeakerMap(uploadData?.speakerMap);

  try {
    const extractedText = await extractTextContent(buffer, kind.kind);
    if (!extractedText.trim()) {
      throw new Error("Transcript file does not contain readable text");
    }
    const cleanedResult = await cleanTranscript(extractedText, speakerMap, {
      userId: uploadData?.userId,
      eventId: typeof uploadData?.eventId === "string" ? uploadData.eventId : undefined,
      round:
        typeof uploadData?.round === "number" && Number.isFinite(uploadData.round)
          ? uploadData.round
          : undefined,
    });
    return {
      success: true,
      messages: cleanedResult.messages,
      sides: cleanedResult.sides,
      eventId: cleanedResult.eventId,
      round: cleanedResult.round,
    };
  } catch (error) {
    console.error("Transcript processing failed", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to process transcript",
    };
  }
}

type CleanTranscriptOptions = {
  userId?: string;
  eventId?: string;
  round?: number;
};

function normalizeSpeakerReplacementMap(
  map: SpeakerReplacementMap = [],
): SpeakerReplacementMap {
  if (!Array.isArray(map)) {
    return [];
  }

  const normalized: SpeakerReplacementMap = [];
  for (const entry of map) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const placeholder = entry.placeholder?.toString().trim();
    const name = entry.name?.toString().trim();
    const side: SpeakerSide = entry.side === "b" ? "b" : "a";
    if (placeholder && name) {
      normalized.push({ placeholder, name, side });
    }
  }
  return normalized;
}

function formatProcessedMessages(
  source: unknown,
  speakerMap: SpeakerReplacementMap,
): TranscriptMessage[] {
  if (!Array.isArray(source)) {
    return [];
  }

  const messages: TranscriptMessage[] = [];
  for (const entry of source) {
    const content =
      typeof entry === "string"
        ? entry
        : entry && typeof (entry as { content?: unknown }).content === "string"
          ? ((entry as { content: string }).content ?? "")
          : "";
    if (!content.trim()) continue;
    const user = entry && typeof (entry as { user?: unknown }).user === "string"
      ? ((entry as { user: string }).user ?? "")
      : "";
    messages.push({ user, content });
  }

  return messages;
}

export async function cleanTranscript(
  transcript: string,
  speakerMap: SpeakerReplacementMap = [],
  options: CleanTranscriptOptions = {},
): Promise<CleanTranscriptResult> {
  const emptyResult: CleanTranscriptResult = {
    messages: [],
    sides: { a: [], b: [] },
    eventId: options.eventId,
    round: options.round,
  };

  if (!transcript) return emptyResult;

  const normalizedMap = normalizeSpeakerReplacementMap(speakerMap);
  const userId = options.userId || "system";

  try {
    const CHUNK_SIZE = 10_000;
    const rawMessages = transcript
      .split(/\n\s*\n+/)
      .map((msg) => msg.trim())
      .filter((msg) => msg.length > 0);
    const chunkStrings: string[] = [];
    let currentRawMessages: string[] = [];
    let currentLen = 0;
    for (const rawMsg of rawMessages) {
      const sepLen = currentRawMessages.length > 0 ? 2 : 0; // "\n\n" between blocks
      currentRawMessages.push(rawMsg);
      currentLen += sepLen + rawMsg.length;
      if (currentLen > CHUNK_SIZE) {
        chunkStrings.push(currentRawMessages.join("\n\n"));
        currentRawMessages = [];
        currentLen = 0;
      }
    }
    if (currentRawMessages.length > 0) {
      chunkStrings.push(currentRawMessages.join("\n\n"));
    }
    const processedChunks = await Promise.all(
      chunkStrings.map((chunk) =>
        processTranscript({
          rawTranscript: chunk,
          speakerMap: normalizedMap.map((e) => ({ [e.placeholder]: e.name })),
          userId,
        }).catch((err) => {
          console.error("processTranscript failed for a chunk", err);
          return [] as unknown[];
        }),
      ),
    );
    const processedCombined = processedChunks.flat();
    const messages = formatProcessedMessages(processedCombined, normalizedMap);
    const sides = { a: [] as string[], b: [] as string[] };
    for (const entry of normalizedMap) {
      if (entry.side === "b") {
        if (!sides.b.includes(entry.name)) sides.b.push(entry.name);
      } else {
        if (!sides.a.includes(entry.name)) sides.a.push(entry.name);
      }
    }
    return { messages, sides, eventId: options.eventId, round: options.round };
  } catch (error) {
    console.error("AI transcript processing failed", error);
    return emptyResult;
  }
}

export async function saveTranscriptMessages(params: {
  messages: TranscriptMessage[];
  eventId: string;
  round: number;
  negId: string;
  caseId?: string | null;
  sides?: { a: string[]; b: string[] };
  uploadedBy?: string;
  source?: string | null;
  uploadedAt?: number;
}) {
  const {
    messages = [],
    eventId = "",
    round,
    negId,
    caseId = null,
    sides = { a: [], b: [] },
    uploadedBy = "",
    source = null,
    uploadedAt = Date.now(),
  } = params || ({} as any);

  if (!eventId || !Number.isFinite(Number(round)) || !Array.isArray(messages) || messages.length === 0) {
    throw new Error("Invalid transcript save payload");
  }

  const baseTime = Number.isFinite(uploadedAt) ? Number(uploadedAt) : Date.now();



  const docs = messages
    .filter((m) => m && typeof m.content === "string" && m.content.trim())
    .map((m, idx) => ({
      eventId,
      round: Number(round),
      caseId: caseId || undefined,
      speaker: (m.user || "").trim() || `Speaker ${idx + 1}`,
      content: (m.content || "").trim(),
      time: baseTime + idx,
      sides,
      source: source || undefined,
      uploadedBy,
      negId,
    }));

  if (!docs.length) return;

  await saveDocsInBatches(docs, "transcripts");
  return { source: source || null, count: docs.length, time: baseTime };
}

export async function getTranscriptMessages(filter: { eventId?: string; round?: number; negId?: string }) {
  const { eventId, round, negId } = filter || ({} as any);

  let where: any;
  if (typeof negId === "string" && negId) {
    where = [{ field: "negId", value: negId }];
  } else if (eventId && Number.isFinite(Number(round))) {
    where = [
      { field: "eventId", value: eventId },
      { field: "round", value: Number(round) },
    ];
  } else {
    return [];
  }

  const rows = await getDocs(
    "transcripts",
    where,
    ["eventId", "round", "caseId", "speaker", "content", "time", "sides", "source", "negId"],
    null
  );

  const msgs = rows
    .map((r: any) => ({
      userId: r.speaker,
      content: r.content,
      timestamp: r.time?.toMillis ? r.time.toMillis() : r.time,
      sides: r.sides,
    }))
    .filter((m: any) => m.content);

  msgs.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
  return msgs;
}

