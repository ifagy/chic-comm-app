// src/composables/useTelegraphNotifications.js
export function useTelegraphNotifications() {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  const requestPermission = async () => {
    if (!isSupported) return false;
    try {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
    return false;
  };

  const showBellNotification = async (statusLabel) => {
    if (!isSupported) return;
    
    try {
      if (Notification.permission !== 'granted') return;

      if (document.visibilityState === 'visible') {
        return;
      }

      const title = '🔔 Telegraph Bell!';
      const options = {
        body: statusLabel ? `Partner signaled: ${statusLabel}` : 'Partner rang the attention bell!',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'telegraph-bell',
        renotify: true
      };

      // Service Worker varsa onunla göster (PWA ve mobil uyumu için)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          registration.showNotification(title, options);
          return;
        }
      }

      // Standart masaüstü fallback
      new Notification(title, options);
    } catch (err) {
      console.warn('Could not show notification:', err);
    }
  };

  return {
    isSupported,
    requestPermission,
    showBellNotification
  };
}