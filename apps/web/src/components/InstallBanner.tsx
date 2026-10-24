import { useEffect, useState } from "react";
import { Icon, Logo } from "./ui";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
const KEY = "ol-install-dismissed";
const HIDE_DAYS = 14;
const APK_URL = import.meta.env.VITE_APK_URL;

function inApp(): boolean {
  // Already installed, or running inside the Android app: nothing to ask.
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  if (w.Capacitor?.isNativePlatform?.()) return true;
  if (/;\s*wv\)/.test(navigator.userAgent)) return true;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  return (navigator as unknown as { standalone?: boolean }).standalone === true;
}
function dismissedRecently(): boolean {
  try {
    const t = Number(localStorage.getItem(KEY) ?? 0);
    return t > 0 && Date.now() - t < HIDE_DAYS * 86_400_000;
  } catch { return false; }
}

/** A bar at the very top asking people to install One Link on their phone. */
export default function InstallBanner() {
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(ua);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [hidden, setHidden] = useState(() => inApp() || dismissedRecently());
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as InstallPrompt); };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    try { localStorage.setItem(KEY, String(Date.now())); } catch { /* private mode */ }
    setHidden(true);
  }
  async function install() {
    if (!prompt) { setHelp(true); return; }
    await prompt.prompt();
    const choice = await prompt.userChoice.catch(() => null);
    setPrompt(null);
    if (choice?.outcome === "accepted") setHidden(true);
  }

  // Phones and tablets always see it; on a computer only when the browser can really install the app.
  const mobile = isIos || isAndroid;
  if (hidden || (!mobile && !prompt)) return null;

  return (
    <div className="install-bar" role="region" aria-label="Install One Link">
      <Logo size={34} />
      <div className="install-text">
        <strong>Get the One Link app</strong>
        <span>{help && isIos ? "Tap Share, then “Add to Home Screen”." : help ? "Open the browser menu, then choose “Install app” or “Add to Home screen”." : "Faster to open, full screen, one tap from your home screen."}</span>
      </div>
      <div className="install-actions">
        {isIos ? (
          <button className="btn btn-hero btn-sm" onClick={() => setHelp((v) => !v)}>How to install</button>
        ) : (
          <button className="btn btn-hero btn-sm" onClick={install}>Install</button>
        )}
        {APK_URL && isAndroid && <a className="btn btn-sm install-apk" href={APK_URL} rel="noopener">Download APK</a>}
        <button className="icon-btn install-close" onClick={dismiss} aria-label="Close"><Icon name="x" size={16} /></button>
      </div>
    </div>
  );
}
