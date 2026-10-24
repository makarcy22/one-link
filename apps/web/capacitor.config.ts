import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.onelink.app",
  appName: "One Link",
  webDir: "dist",
  server: {
    // The app opens your live website, so every Netlify deploy updates the app too.
    url: "https://one-link-studio.netlify.app",
    androidScheme: "https",
  },
};

export default config;
