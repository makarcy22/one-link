import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Must run before any module that reads process.env.
// Import this file first in the entry point.
dotenv.config({
  path: path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "..",
    ".env"
  ),
});
