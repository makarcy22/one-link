/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_MOCK_API?: string;
  /** Optional: a direct link to the Android APK (for example a GitHub Releases file). */
  readonly VITE_APK_URL?: string;
}
