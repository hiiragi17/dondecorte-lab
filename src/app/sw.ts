/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import type { PushPayload } from "@/lib/types/push";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

const DEFAULT_NOTIFICATION_TITLE = "DonDecorte Lab";
const DEFAULT_NOTIFICATION_URL = "/";
const NOTIFICATION_ICON = "/icon-192.png";
const NOTIFICATION_BADGE = "/icon-192.png";

self.addEventListener("push", (event) => {
  // 受信ペイロードは信頼できないため全フィールドを optional 扱いにする。
  let payload: Partial<PushPayload> = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title ?? DEFAULT_NOTIFICATION_TITLE;
  const url = payload.url ?? DEFAULT_NOTIFICATION_URL;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body ?? "",
      tag: payload.tag,
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_BADGE,
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data as { url?: string } | undefined;
  const url = data?.url ?? "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
          try {
            await client.navigate(url);
          } catch {
            // navigate 非対応 / クロスオリジン時はフォーカスのみ
          }
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
