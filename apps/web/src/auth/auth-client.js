import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
    plugins: [twoFactorClient()],
});
export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;
export const useSession = authClient.useSession;
export const twoFactor = authClient.twoFactor;
//# sourceMappingURL=auth-client.js.map