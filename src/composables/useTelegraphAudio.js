// src/composables/useTelegraphAudio.js
export function useTelegraphAudio() {
  let audioCtx = null;

  // Tarayıcıların "ilk kullanıcı etkileşiminde sesi başlat" kuralı için AudioContext'i ayağa kaldır
  const initAudio = () => {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };

  // 1. MEKANİK ÇENTİK TIK SESİ (Mechanical Detent Click)
  const playClickSound = () => {
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    // Frekans aniden 300Hz'den 80Hz'e düşer (tok klik efekti)
    osc.frequency.setValueAtTime(320, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.025);

    gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.025);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
  };

  // 2. PİRİNÇ GEMİ TELGRAF ZİLİ (Brass Ship Bell Ring)
  const playBellSound = () => {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    // Gerçekçi çan sesi için iki uyumlu frekans (armonik titreşim)
    const baseFreqs = [1200, 2400];

    baseFreqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Zil vuruşu ve uzun sönümlenme (decay)
      const volume = idx === 0 ? 0.4 : 0.2;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    });
  };

  return {
    initAudio,
    playClickSound,
    playBellSound
  };
}