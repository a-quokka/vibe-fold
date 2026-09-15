(function (root) {
  'use strict';
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  class Story {
    constructor() { this.reset(); }
    reset(scene = 'intro') {
      this.scene = scene; this.time = 0; this.clock = 0; this.healed = 0;
      this.held = new Map(); this.opened = [false, false, false];
      this.opens = [0, 0, 0]; this.events = []; this.chaotic = false;
    }
    go(scene, immediate = false) {
      if (!immediate && this.beforeScene && this.beforeScene(scene)) return;
      this.held.clear(); this.scene = scene; this.time = 0;
      if (['grow', 'nolbuGrow', 'heungbu', 'chaos', 'free'].includes(scene)) {
        this.opened = [false, false, false]; this.opens = [0, 0, 0];
      }
      this.chaotic = ['nolbu', 'nolbuBreak', 'nolbuDone', 'nolbuSeed', 'nolbuGrow', 'chaos'].includes(scene);
      this.events.push({ type: 'scene', scene });
    }
    get playable() { return ['heungbu', 'abundance', 'chaos', 'free'].includes(this.scene); }
    get canContinue() {
      return ['healDone','nolbuDone'].includes(this.scene) ? this.time >= 1.8 :
        ['abundance','ending'].includes(this.scene) || this.scene === 'chaos' && this.opened.every(Boolean);
    }
    down(key, index = 0) {
      if (this.held.has(key)) return;
      if (this.scene === 'seed') { this.go('grow'); return; }
      if (this.scene === 'nolbuSeed') { this.go('nolbuGrow'); return; }
      if (this.scene === 'ending') { this.go('free'); return; }
      if (this.scene !== 'heal' && !this.playable) return;
      this.held.set(key, { index, at: this.clock });
      if (this.playable) this.events.push({ type: 'tap', index });
    }
    up(key, cancelled = false) {
      const hold = this.held.get(key); this.held.delete(key);
      if (!hold || cancelled || !this.playable) return;
      if (this.clock - hold.at >= 1.05 && !this.opened[hold.index]) {
        this.opened[hold.index] = true; this.opens[hold.index] = this.clock;
        this.events.push({ type: 'open', index: hold.index });
      }
    }
    cancel() { this.held.clear(); }
    charge(index) {
      let value = 0;
      for (const h of this.held.values()) if (h.index === index) value = Math.max(value, clamp((this.clock - h.at) / 1.05));
      return value;
    }
    next() {
      if (!this.canContinue) return;
      if (this.scene === 'healDone') this.go('seed');
      else if (this.scene === 'nolbuDone') this.go('nolbuSeed');
      else if (this.scene === 'abundance') this.go('nolbu');
      else if (this.scene === 'chaos' && this.opened.every(Boolean)) this.go('ending');
      else if (this.scene === 'ending') this.go('free');
    }
    step(dt) {
      dt = clamp(dt, 0, 0.05); this.clock += dt; this.time += dt;
      if (this.scene === 'heal') {
        this.healed = clamp(this.healed + (this.held.size ? dt / 2.2 : -dt / 14));
        if (this.healed >= 1) this.go('healDone');
      }
      if (this.scene === 'grow' && this.time > 3.2) this.go('heungbu');
      if (this.scene === 'nolbuGrow' && this.time > 3.2) this.go('chaos');
      if (this.scene === 'heungbu' && this.opened.every(Boolean) && this.clock - Math.max(...this.opens) > 2.5) this.go('abundance');
      if (this.scene === 'nolbu' && this.time > 2.4) this.go('nolbuBreak');
      if (this.scene === 'nolbuBreak' && this.time > 1.7) this.go('nolbuDone');
      if (this.scene === 'free') for (let i = 0; i < 3; i++) {
        if (this.opened[i] && this.clock - this.opens[i] > 4.5) this.opened[i] = false;
      }
    }
    drain() { return this.events.splice(0); }
  }
  root.BakStory = Story;
  if (typeof module !== 'undefined') module.exports = { Story, clamp };
})(globalThis);
