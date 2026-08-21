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

  // Biri girdiğinde veya odaya katıldığında: Çift hafif tık (Bağlantı hissi)
  const triggerJoinHaptic = () => {
    if (isVibrationSupported) {
      try {
        navigator.vibrate([30, 50, 40]);
      } catch (e) {}
    }
  };

  // Biri çıktığında: Tek tok/düşük tık (Ayrılma hissi)
  const triggerLeaveHaptic = () => {
    if (isVibrationSupported) {
      try {
        navigator.vibrate([60]);
      } catch (e) {}
    }
  };

  // Yeni oda oluşturulduğunda: Hızlı üçlü tık (Yenilenme hissi)
  const triggerRoomCreateHaptic = () => {
    if (isVibrationSupported) {
      try {
        navigator.vibrate([20, 30, 20, 30, 40]);
      } catch (e) {}
    }
  };

  return {
    triggerNotchHaptic,
    triggerBellHaptic,
    triggerJoinHaptic,
    triggerLeaveHaptic,
    triggerRoomCreateHaptic
  };
}