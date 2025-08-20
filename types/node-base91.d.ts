declare module "node-base91" {
  interface Base91 {
    encode(data: Buffer | Uint8Array | string): string;
    decode(data: string): Buffer;
  }

  const base91: Base91;
  export default base91;

  export function encode(result: void): string | PromiseLike<string> {
    throw new Error("Function not implemented.");
  }

  export function decode(encoded: string): any {
    throw new Error("Function not implemented.");
  }
}
