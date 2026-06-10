// Minimal typings to allow using `process.env` in server/client TS files.
// Next.js provides the actual runtime `process`.

declare const process: {
  env: Record<string, string | undefined>;
};


