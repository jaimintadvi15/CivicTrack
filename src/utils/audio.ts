/**
 * Utility for playing realistic celebratory clapping sound using Web Audio API.
 * 100% offline, zero latency, and works on all modern browsers without external audio assets.
 */
export const playClappingSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const duration = 2.8; // seconds
    const now = ctx.currentTime;

    // Master gain node for overall volume & smooth envelope
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.75, now + 0.12); // Fast warm fade-in
    masterGain.gain.setValueAtTime(0.75, now + duration - 0.4);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Smooth fade-out
    masterGain.connect(ctx.destination);

    // Shared noise buffer for clap impacts & ambient cheer
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * 1.0;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // 1. Dense randomized hand-clapping impacts (~150 individual clap impulses)
    const numClaps = 150;
    for (let i = 0; i < numClaps; i++) {
      // Curve timing distribution slightly toward the middle
      const offset = Math.pow(Math.random(), 0.85) * (duration - 0.35);
      const clapTime = now + offset;

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      // Bandpass filter centered around realistic hand-clap resonant frequencies
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 850 + Math.random() * 2200;
      filter.Q.value = 1.2 + Math.random() * 1.8;

      // Percussive clap envelope: ultra-fast attack (<2ms), sharp decay (~35ms)
      const clapGain = ctx.createGain();
      const peakVol = 0.3 + Math.random() * 0.6;
      clapGain.gain.setValueAtTime(0.001, clapTime);
      clapGain.gain.linearRampToValueAtTime(peakVol, clapTime + 0.002);
      clapGain.gain.exponentialRampToValueAtTime(0.001, clapTime + 0.035 + Math.random() * 0.025);

      noise.connect(filter);
      filter.connect(clapGain);
      clapGain.connect(masterGain);

      noise.start(clapTime);
      noise.stop(clapTime + 0.08);
    }

    // 2. Crowd cheer ambient roar layer
    const cheerSource = ctx.createBufferSource();
    cheerSource.buffer = noiseBuffer;
    cheerSource.loop = true;

    const cheerFilter = ctx.createBiquadFilter();
    cheerFilter.type = 'bandpass';
    cheerFilter.frequency.setValueAtTime(650, now);
    cheerFilter.frequency.exponentialRampToValueAtTime(1350, now + 0.8);
    cheerFilter.frequency.exponentialRampToValueAtTime(750, now + duration);
    cheerFilter.Q.value = 0.75;

    const cheerGain = ctx.createGain();
    cheerGain.gain.setValueAtTime(0.001, now);
    cheerGain.gain.linearRampToValueAtTime(0.22, now + 0.25);
    cheerGain.gain.linearRampToValueAtTime(0.001, now + duration - 0.1);

    cheerSource.connect(cheerFilter);
    cheerFilter.connect(cheerGain);
    cheerGain.connect(masterGain);

    cheerSource.start(now);
    cheerSource.stop(now + duration);

    // 3. Bright celebratory fanfare chime intro (C5 -> E5 -> G5 -> C6)
    const fanfareNotes = [523.25, 659.25, 783.99, 1046.5];
    fanfareNotes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.075;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      noteGain.gain.setValueAtTime(0.001, noteTime);
      noteGain.gain.linearRampToValueAtTime(0.18, noteTime + 0.01);
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });

    // Close AudioContext when finished playing
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, (duration + 0.4) * 1000);
  } catch (err) {
    console.warn('Audio playback not permitted or failed:', err);
  }
};
