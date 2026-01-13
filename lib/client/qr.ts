"use client";

import QRCode from "qrcode";

export interface QROptions {
  readonly width?: number;
  readonly margin?: number;
  readonly color?: {
    readonly dark?: string;
    readonly light?: string;
  };
}

export async function toDataURL(text: string, options?: QROptions): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: options?.width ?? 256,
    margin: options?.margin ?? 2,
    color: options?.color,
  } as any);
}

export async function downloadPNG(text: string, filename = "qr.png", options?: QROptions): Promise<void> {
  const dataUrl = await toDataURL(text, options);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
}

