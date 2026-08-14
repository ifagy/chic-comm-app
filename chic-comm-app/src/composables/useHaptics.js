// src/composables/useHaptics.js
export function useHaptics() {
  const isVibrationSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  // Çark çentik geçişinde mikro mekanik tık
  const triggerNotchHaptic = () => {
    if (isVibrationSupported) {
      try {
        navigator.vibrate(12); // 12ms hafif dokunuş
      } catch (e) {
        // Tarayıcı güvenlik kısıtlaması durumunda sessizce geç
      }
    }
  };

  // Zil çalma anında çift kademeli tok titreşim
  const triggerBellHaptic = () => {
    if (isVibrationSupported) {
      try {
        navigator.vibrate([40, 30, 80]); // Titreşim - Bekleme - Uzun Titreşim
      } catch (e) {
        // Sessizce geç
      }
    }
  };

  return {
    triggerNotchHaptic,
    triggerBellHaptic
  };
}