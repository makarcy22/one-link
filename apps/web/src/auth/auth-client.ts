import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  plugins: [twoFactorClient()],
});

export const { signIn, signUp, signOut } = authClient;
export const useSession: typeof authClient.useSession = authClient.useSession;
export const twoFactor = authClient.twoFactor;
