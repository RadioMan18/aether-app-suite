import { useCallback } from "react";

export function useNotificationSound() {
  const play = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const frequencies = [880, 1320];

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = freq;
        osc.type = "sine";

        const startTime = now + i * 0.15;
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });
    } catch {
      // ignore audio errors in restricted environments
    }
  }, []);

  return { play };
}
