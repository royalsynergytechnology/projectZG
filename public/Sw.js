// Service Worker for Push Notifications - ProjectZG
const CACHE_NAME = 'projectzg-v1';

// Install event
self.addEventListener('install', (event) => {

    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {

    event.waitUntil(clients.claim());
});

// Push event - show browser notification
self.addEventListener('push', (event) => {


    let data = {
        title: 'ProjectZG',
        body: 'You have a new notification!',
        icon: '/img/ico/icons8-dev-community-color-96.png',
        badge: '/img/ico/icons8-dev-community-color-48.png',
        tag: 'notification',
        data: { url: '/' }
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            data = { ...data, ...payload };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        data: data.data,
        vibrate: [100, 50, 100],
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click - open app
self.addEventListener('notificationclick', (event) => {

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing window if available
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
