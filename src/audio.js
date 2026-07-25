// Web Audio API Procedural Mechanical Sound Synthesizer for Pepper Timer

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('pepper_timer_muted') === 'true';
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('pepper_timer_muted', this.muted);
    return this.muted;
  }

  setMuted(state) {
    this.muted = state;
    localStorage.setItem('pepper_timer_muted', this.muted);
  }

  // 1. Classic Mechanical Kitchen Timer Bell Ring (Ding)
  playBell() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Master bell output gain
    const bellGain = this.ctx.createGain();
    bellGain.gain.setValueAtTime(0.7, now);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
    bellGain.connect(this.ctx.destination);

    // Mechanical strike impact noise (clapper hit)
    const bufferSize = this.ctx.sampleRate * 0.04;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1800;
    noiseFilter.Q.value = 3;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(bellGain);
    noiseSource.start(now);

    // Inharmonic bell partials (classic brass bell ratios)
    const partials = [
      { freq: 659.25, gain: 0.8, decay: 2.5 },   // E5 fundamental
      { freq: 1318.5, gain: 0.5, decay: 2.0 },   // E6 octave
      { freq: 1800.0, gain: 0.35, decay: 1.6 },  // Inharmonic 1
      { freq: 2470.0, gain: 0.25, decay: 1.2 },  // B6 fifth
      { freq: 3100.0, gain: 0.15, decay: 0.8 },  // Inharmonic 2
      { freq: 4400.0, gain: 0.08, decay: 0.5 }   // High ring
    ];

    partials.forEach(({ freq, gain, decay }) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = 'sine';
      // Slight pitch glide on impact mimicking physical bell deformation
      osc.frequency.setValueAtTime(freq * 1.015, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.03);

      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(gain, now + 0.005);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(oscGain);
      oscGain.connect(bellGain);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });
  }

  // 2. Mechanical Dial Winding Ratchet Click
  playDialClick(fineTone = false) {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreq = fineTone ? 1400 : 950;

    // Short wooden/metal ratchet click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.012);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.015);
  }

  // 3. Heavy Physical Lever Toggle Clunk Sound
  playLeverClick() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Metal thud impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);

    // Metal latch snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(1200, now + 0.01);
    snapOsc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

    snapGain.gain.setValueAtTime(0.4, now + 0.01);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(now + 0.01);
    snapOsc.stop(now + 0.04);
  }

  // 4. Tactile Brass Push Button Click
  playButtonClick() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.02);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  }
}

export const sounds = new SoundManager();
