declare module 'whois' {
  export function lookup(
    domain: string,
    callback: (err: Error | null, data: string) => void
  ): void;
  
  export function lookup(
    domain: string,
    options: {
      server?: string;
      port?: number;
      timeout?: number;
    },
    callback: (err: Error | null, data: string) => void
  ): void;
}