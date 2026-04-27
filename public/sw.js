// ── Service Worker for Web Push Notifications ──────────────────────────────

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

// ── Push received ──────────────────────────────────────────────────────────
self.addEventListener('push', event => {
    let data = { title: 'Уведомление', body: '' };
    try { data = event.data?.json() ?? data; } catch {}

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: data.tag || 'default',
            renotify: true,
            data: { url: data.url || '/' },
        })
    );
});

// ── Notification click ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
    event.notification.close();
    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const client of list) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});
