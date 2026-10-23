// The token vault lives in @one-link/shared so the API and the worker use exactly the same code.
// SOCIAL_TOKEN_KEY must be 32 random bytes, base64. See docs/deployment.md for how to generate it.
export { encryptToken, decryptToken } from "@one-link/shared/node";
