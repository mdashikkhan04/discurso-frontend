declare module "afpp" {
  export function pdf2string(
    buffer: ArrayBuffer | Uint8Array | Buffer,
    options?: { concurrency?: number },
  ): Promise<string | string[]>;
  const _default: {
    pdf2string?: typeof pdf2string;
  };
  export default _default;
}
