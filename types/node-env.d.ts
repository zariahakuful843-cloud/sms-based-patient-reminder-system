// Minimal typings to allow using `process.env` in client-safe TS files.
// Next.js provides the actual runtime `process` in the server environment.

declare const process: {
  env: Record<string, string | undefined>;
};

