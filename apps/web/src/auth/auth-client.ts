import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { API_BASE } from "../lib/backend";

export const authClient = createAuthClient({
  baseURL: API_BASE,
  plugins: [twoFactorClient()],
});

export const signIn: typeof authClient.signIn = authClient.signIn;
export const signUp: typeof authClient.signUp = authClient.signUp;
export const signOut: typeof authClient.signOut = authClient.signOut;
export const useSession: typeof authClient.useSession = authClient.useSession;
export const twoFactor = authClient.twoFactor;
