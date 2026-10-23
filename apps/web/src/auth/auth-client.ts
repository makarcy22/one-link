import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { useSyncExternalStore } from "react";
import { MOCK } from "../lib/api";

const real = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  plugins: [twoFactorClient()],
});

// ---- Preview mode: a pretend signed-in person, no server needed ----
type DemoUser = { user: { id: string; email: string; name: string; emailVerified: boolean; image?: string | null } } | null;
let demo: DemoUser = { user: { id: "demo", email: "amira@example.com", name: "Amira", emailVerified: true } };
const listeners = new Set<() => void>();
const setDemo = (v: DemoUser) => {
  demo = v;
  listeners.forEach((l) => l());
};
function useDemoSession() {
  const data = useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => demo
  );
  return { data, isPending: false };
}
const ok = async () => ({ data: null, error: null });
const demoClient = {
  signIn: {
    email: async (a: { email: string }) => {
      setDemo({ user: { id: "demo", email: a.email || "amira@example.com", name: "Amira", emailVerified: true } });
      return { data: {}, error: null };
    },
    social: ok,
  },
  signUp: {
    email: async (a: { email: string; name?: string }) => {
      setDemo({ user: { id: "demo", email: a.email, name: a.name ?? "Friend", emailVerified: true } });
      return { data: { token: "demo" }, error: null };
    },
  },
  updateUser: async (a: { name?: string; image?: string | null }) => {
    if (demo) setDemo({ user: { ...demo.user, ...(a.name !== undefined ? { name: a.name } : {}), ...(a.image !== undefined ? { image: a.image } : {}) } });
    return { data: { status: true }, error: null };
  },
  signOut: async () => (setDemo(null), { data: null, error: null }),
  requestPasswordReset: ok,
  sendVerificationEmail: ok,
  twoFactor: {
    enable: async () => ({ data: { method: "totp", totpURI: "otpauth://totp/OneLink:demo?secret=DEMO", backupCodes: ["demo-0001", "demo-0002"] }, error: null }),
    verifyTotp: ok,
    disable: ok,
  },
};

export const authClient = (MOCK ? (demoClient as unknown as typeof real) : real);
export const signIn: typeof real.signIn = MOCK ? (demoClient.signIn as never) : real.signIn;
export const signUp: typeof real.signUp = MOCK ? (demoClient.signUp as never) : real.signUp;
export const signOut: typeof real.signOut = MOCK ? (demoClient.signOut as never) : real.signOut;
export const useSession: typeof real.useSession = MOCK ? (useDemoSession as never) : real.useSession;
export const twoFactor = MOCK ? (demoClient.twoFactor as unknown as typeof real.twoFactor) : real.twoFactor;
