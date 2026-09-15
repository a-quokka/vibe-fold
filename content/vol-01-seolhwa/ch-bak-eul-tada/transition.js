(function (root) {
  'use strict';
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  class InkTransition {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.active = false; this.resize();
      // Stable bristles: texture never flickers between animation frames.
      this.bristles = Array.from({length: 95}, (_, i) => ({
        y: (i + .5) / 95, length: .015 + (Math.sin(i * 57.13) + 1) * .026,
        width: .001 + (Math.cos(i * 17.31) + 1) * .0015
      }));
    }
    resize() {
      this.w = innerWidth; this.h = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.active) this.draw();
    }
    start(scene, commit, reduced) {
      if (this.active) return;
      this.active = true; this.age = 0; this.committed = false;
      this.commit = commit; this.reduced = reduced;
      this.rough = ['nolbu', 'nolbuGrow', 'ending'].includes(scene);
      this.color = this.rough ? '#242824' : '#55564d';
      this.midpoint = reduced ? .16 : .68;
      this.duration = reduced ? .4 : scene === 'ending' ? 1.65 : 1.4;
      this.canvas.hidden = false; this.draw();
    }
    cancel() {
      this.active = false; this.commit = null; this.canvas.hidden = true;
      this.ctx.clearRect(0, 0, this.w, this.h);
    }
    step(dt) {
      if (!this.active) return;
      this.age += Math.min(.05, Math.max(0, dt));
      if (!this.committed && this.age >= this.midpoint) {
        this.committed = true; this.commit(); this.commit = null;
      }
      this.draw();
      if (this.age >= this.duration) this.cancel();
    }
    brush(progress, erase = false) {
      const c = this.ctx, w = this.w, h = this.h;
      const rows = 5, band = h / rows;
      for (let row = 0; row < rows; row++) {
        const p = smooth((progress - row * .10) / .60);
        if (!p) continue;
        const reverse = row % 2;
        c.save(); if (reverse) { c.translate(w, 0); c.scale(-1, 1); }
        const end = -w * .18 + p * w * 1.44;
        const top = row * band - band * .30, bottom = top + band * 1.7;
        const shape = new Path2D(); shape.moveTo(-w * .3, top);
        for (let j = 0; j <= 40; j++) {
          const x = -w * .3 + (end + w * .21) * j / 40;
          shape.lineTo(x, top + x * .10 + Math.sin(j * 1.9 + row) * band * .012);
        }
        for (let i = 0; i <= 180; i++) {
          const u = i / 180;
          const rough = Math.sin(i * 13.7 + row * 8) * .004 + Math.sin(i * .17 + row) * .012;
          shape.lineTo(end + w * (rough - Math.pow(Math.abs(u - .48), 2) * .36), top + end * .10 + u * (bottom - top));
        }
        for (let j = 40; j >= 0; j--) {
          const x = -w * .3 + (end + w * .21) * j / 40;
          shape.lineTo(x, bottom + x * .10 + Math.sin(j * 2.1 + row) * band * .02);
        }
        shape.closePath(); c.fill(shape);
        if (!erase) {
          c.save(); c.clip(shape); c.strokeStyle = '#d5cbb5';
          for (let i = 0; i < 70; i++) {
            const y = top + i / 70 * (bottom - top);
            c.globalAlpha = .035 + (i % 4) * .013;
            c.lineWidth = .35 + (i % 3) * .22;
            c.beginPath(); c.moveTo(-w * .15, y - w * .015);
            c.quadraticCurveTo(end * .4, y + end * .04 + Math.sin(i) * 4, end, y + end * .10);
            c.stroke();
          }
          c.restore();
        }
        if (!erase) {
          // Translucent wet edge, followed by dry, separated bristle tips.
          c.globalAlpha = .20; c.lineWidth = 17; c.strokeStyle = this.color; c.stroke(shape);
          c.globalAlpha = .55;
          for (const b of this.bristles) {
            const y = top + end * .10 + b.y * (bottom - top);
            c.fillRect(end - w * .06, y, w * b.length, Math.max(.6, band * b.width));
          }
          if (this.rough) for (let i = 0; i < 9; i++) {
            c.globalAlpha = .3 + (i % 3) * .13;
            c.beginPath(); c.ellipse(end + w * (.02 + (i % 4) * .015), top + band * (i * .19), 1 + i % 4, 1 + i % 3, i, 0, Math.PI * 2); c.fill();
          }
        }
        c.restore();
      }
    }
    draw() {
      const c = this.ctx, w = this.w, h = this.h;
      c.clearRect(0, 0, w, h); c.save(); c.fillStyle = this.color;
      if (this.reduced) {
        c.globalAlpha = this.age <= this.midpoint ? smooth(this.age / this.midpoint) : 1 - smooth((this.age - this.midpoint) / (this.duration - this.midpoint));
        c.fillRect(0, 0, w, h);
      } else if (this.age < this.midpoint) {
        this.brush(this.age / (this.midpoint - .06));
        // Finish the wash before committing: no uncovered seams at the cut.
        c.globalAlpha = smooth((this.age - this.midpoint + .13) / .09);
        c.fillRect(0, 0, w, h);
      } else {
        const reveal = clamp((this.age - this.midpoint - .07) / (this.duration - this.midpoint - .07));
        c.globalAlpha = 1 - smooth(reveal) * .7; c.fillRect(0, 0, w, h);
        c.globalAlpha = 1; c.globalCompositeOperation = 'destination-out';
        this.brush(reveal, true);
      }
      c.restore();
    }
  }
  root.BakTransition = InkTransition;
})(globalThis);
