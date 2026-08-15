// src/composables/useTelegraphNotifications.js
export function useTelegraphNotifications() {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  const requestPermission = async () => {
    if (!isSupported) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const showBellNotification = async (statusLabel) => {
    if (!isSupported || Notification.permission !== 'granted') return;

    const title = '🔔 Telegraph Bell!';
    const options = {
      body: statusLabel ? `Telegraph says: ${statusLabel}` : 'Partner rang the bell!',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      tag: 'telegraph-bell', // Eski bildirimin üzerine yazar, bildirim kirliliği yapmaz
      renotify: true
    };

    // 1. Service Worker aktifse onun üzerinden göster (mobilde PWA uyumu için şarttır)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, options);
        return;
      } catch (err) {
        // Fallback to standard Notification
      }
    }

    // 2. Standart Web Bildirimi (Masaüstü)
    new Notification(title, options);
  };

  return {
    isSupported,
    requestPermission,
    showBellNotification
  };
}