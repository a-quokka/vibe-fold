(function (root) {
  'use strict';
  const tracks = root.BakTracks;
  class Performance {
    constructor(sound, onBeat) {
      this.sound = sound; this.onBeat = onBeat; this.active = false;
      this.voices = new Set(); this.pending = []; this.turns = [0,0,0];
      this.select('spring');
    }
    select(id) {
      if (!tracks[id]) return false;
      this.stop(); this.trackId = id; this.track = tracks[id];
      this.pulse = this.track.pulse; this.duration = this.track.beats*this.pulse+1.5;
      this.turns.fill(0); return true;
    }
    nextPitch(gourd) {
      const walk = [0,2,1,3,4,2,3,1];
      const degree = walk[this.turns[gourd]++ % walk.length];
      return this.track.root + (gourd-1)*12 + this.track.scale[degree % this.track.scale.length];
    }
    start() {
      if (!this.sound.ctx || this.sound.muted || this.sound.ctx.state !== 'running') return false;
      this.stop(); this.active = true; this.cursor = 0;
      this.origin = this.sound.ctx.currentTime + .08; return true;
    }
    stop() {
      for (const voice of this.voices) { try { voice.stop(); } catch {} }
      this.voices.clear(); this.pending.length = 0; this.active = false;
    }
    get progress() {
      return this.active ? Math.max(0, Math.min(1, (this.sound.ctx.currentTime - this.origin) / this.duration)) : 0;
    }
    step() {
      if (!this.active || this.sound.ctx.state !== 'running') return;
      const now = this.sound.ctx.currentTime;
      for (const voice of this.voices) if (!this.sound.voices.has(voice)) this.voices.delete(voice);
      // Brief lookahead schedules sound on the audio clock. Visuals follow at onset.
      while (this.cursor < this.track.score.length && this.origin + this.track.score[this.cursor].beat * this.pulse < now + .10) {
        const event = this.track.score[this.cursor++], time = this.origin + event.beat * this.pulse;
        if (time < now - .10) continue; // Never bunch missed beats after a stalled frame.
        const voice = this.sound.note(event.gourd, !!event.chaos, event.strength, (event.gourd-1)*.6, event.pitch, Math.max(now,time), event.length ? Math.max(.5,event.length*this.pulse) : 1.4);
        if (voice) this.voices.add(voice);
        this.pending.push({...event, time});
      }
      while (this.pending.length && this.pending[0].time <= now) this.onBeat(this.pending.shift());
      if (now >= this.origin + this.duration) this.stop();
    }
  }
  root.BakPerformance = Performance;
  if (typeof module !== 'undefined') module.exports = {Performance, tracks};
})(globalThis);
