const CACHE_NAME = "picu-nuh-booking-v3";
const BASE = "/picu-nuh-booking-app/";

const SHELL = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.webmanifest",
  BASE + "icons/icon-192.png",
  BASE + "icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith(BASE)
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        return cached || fetch(request).then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copy));
          return response;
        });
      })
    );
  }
});


/* =====================================================
   FIREBASE CLOUD MESSAGING
===================================================== */

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyC-j08I700s-ITpy8ei0fDEZCM-i0wyLnw",
  authDomain: "picu-book.firebaseapp.com",
  projectId: "picu-book",
  storageBucket: "picu-book.firebasestorage.app",
  messagingSenderId: "99258359831",
  appId: "1:99258359831:web:3817b4b060e5db95967c52"
});

const messaging = firebase.messaging();


/* =====================================================
   เมื่อได้รับ Push ขณะ PWA อยู่ Background / ปิดอยู่
===================================================== */

messaging.onBackgroundMessage(payload => {

  const title =
    payload.notification?.title ||
    "PICU NUH";

  const options = {
    body:
      payload.notification?.body ||
      "มีคำขอย้ายผู้ป่วยเข้า PICU ใหม่",

    icon:
      BASE + "icons/icon-192.png",

    badge:
      BASE + "icons/icon-192.png",

    tag: "picu-transfer-request",

    data: {
      url: BASE
    }
  };

  return self.registration.showNotification(
    title,
    options
  );
});


/* =====================================================
   กด Notification → เปิด PICU NUH Booking
===================================================== */

self.addEventListener(
  "notificationclick",
  event => {

    event.notification.close();

    const targetUrl =
      self.location.origin + BASE;

    event.waitUntil(
      clients.matchAll({
        type: "window",
        includeUncontrolled: true
      }).then(windowClients => {

        for (const client of windowClients) {

          if (
            client.url.startsWith(targetUrl) &&
            "focus" in client
          ) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  }
);
