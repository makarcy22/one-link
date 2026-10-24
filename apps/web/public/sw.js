// Minimal service worker: lets the browser offer "Install app".
// It does not cache anything, so people always get the newest version of One Link.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
