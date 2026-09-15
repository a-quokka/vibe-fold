window.BakSound = class {
  constructor() { this.ctx = null; this.muted = true; this.voices = new Set(); }
  async activate() {
    try {
      if (!this.ctx) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return false;
        const c = this.ctx = new Audio();
        this.master = c.createGain(); this.master.gain.value = 0;
        const limit = c.createDynamicsCompressor(); limit.threshold.value = -18; limit.ratio.value = 8;
        this.analyser = c.createAnalyser(); this.analyser.fftSize = 256;
        this.master.connect(limit); limit.connect(this.analyser); this.analyser.connect(c.destination);
        const impulse = c.createBuffer(2, Math.floor(c.sampleRate * 1.5), c.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const a = impulse.getChannelData(channel);
          for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / a.length, 3) * 0.22;
        }
        const reverb = c.createConvolver(); reverb.buffer = impulse;
        this.wet = c.createGain(); this.wet.gain.value = 0.25; this.wet.connect(reverb); reverb.connect(this.master);
      }
      await this.ctx.resume(); return this.ctx.state === 'running';
    } catch { return false; }
  }
  mute(value) { this.muted = value; if (this.ctx) this.master.gain.setTargetAtTime(value ? 0 : 0.7, this.ctx.currentTime, 0.035); }
  async pause() { if (this.ctx?.state === 'running') await this.ctx.suspend(); }
  note(index = 0, chaos = false, strength = 1, pan = 0, midi = null, at = null, duration = 1.4) {
    if (!this.ctx || this.ctx.state !== 'running' || this.muted || this.voices.size >= 24) return;
    const c = this.ctx, now = Math.max(c.currentTime, at ?? c.currentTime);
    const f = midi !== null ? 440 * Math.pow(2, (midi - 69) / 12) : [220, 293.665, 440, 587.33, 659.25][Math.abs(index) % 5];
    const osc = c.createOscillator(), env = c.createGain(), filter = c.createBiquadFilter(), stereo = c.createStereoPanner();
    osc.type = index % 3 === 1 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(f * (chaos ? 0.51 : 1), now);
    if (chaos) osc.frequency.exponentialRampToValueAtTime(f * 0.36, now + 0.15);
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(chaos ? 1500 : 3800, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.65);
    env.gain.setValueAtTime(0.0001, now); env.gain.exponentialRampToValueAtTime(0.19 * Math.min(1.2, strength), now + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, now + (chaos ? 0.45 : duration));
    stereo.pan.value = Math.max(-0.8, Math.min(0.8, pan));
    osc.connect(filter); filter.connect(env); env.connect(stereo); stereo.connect(this.master); stereo.connect(this.wet);
    this.voices.add(osc); osc.onended = () => { osc.disconnect(); filter.disconnect(); env.disconnect(); stereo.disconnect(); this.voices.delete(osc); };
    osc.start(now); osc.stop(now + Math.max(.75,duration) + .1);
    if (midi === null && (index % 3 === 0 || chaos)) this.rustle(strength * 0.35, pan);
    return osc;
  }
  rustle(strength = 0.2, pan = 0) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running' || this.voices.size >= 24) return;
    const c = this.ctx, now = c.currentTime, source = c.createBufferSource();
    const b = c.createBuffer(1, Math.floor(c.sampleRate * 0.16), c.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.025));
    source.buffer = b; const gain = c.createGain(), filter = c.createBiquadFilter(), stereo = c.createStereoPanner();
    filter.type = 'bandpass'; filter.frequency.value = 1250; filter.Q.value = 0.8; gain.gain.value = strength;
    stereo.pan.value = Math.max(-0.8, Math.min(0.8, pan));
    source.connect(filter); filter.connect(gain); gain.connect(stereo); stereo.connect(this.master);
    this.voices.add(source); source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); stereo.disconnect(); this.voices.delete(source); };
    source.start(now);
  }
  chord(chaos = false) { [0, 2, 4].forEach((n, i) => this.note(n, chaos, 0.65, (i - 1) * 0.4)); }
};
