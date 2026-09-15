(function () {
  'use strict';
  const TAU = Math.PI * 2, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = v => 1 - Math.pow(1 - clamp(v), 3);
  const ink = '#302f2a', red = '#a24732', blue = '#435f73';
  function random(seed) { return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }; }
  function path(ctx, points, width, color, alpha = 1) {
    ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.globalAlpha = 1;
  }
  class Painter {
    constructor(canvas, images) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.images = images;
      this.particles = []; this.ribbons = []; this.rings = []; this.sprites = []; this.pulses = [0, 0, 0];
      this.blooms = []; this.petals = [];
      this.mouse = { x: -1000, y: -1000 }; this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.rng = random(713); this.resize();
    }
    resize() {
      this.w = innerWidth; this.h = innerHeight; this.mobile = this.w < 650;
      const dpr = Math.min(devicePixelRatio || 1, 1.7, 2200 / this.w);
      this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.dpr = dpr;
      this.paper = document.createElement('canvas'); this.paper.width = Math.min(this.w, 1600); this.paper.height = Math.min(this.h, 1200);
      const p = this.paper.getContext('2d'), w = this.paper.width, h = this.paper.height, rng = random(1988);
      const data = p.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4, cloud = Math.sin(x / 87 + Math.sin(y / 110)) * 1.8 + Math.cos(y / 56 + x / 159) * 1.4;
        const grain = (rng() - 0.5) * 10 + cloud;
        data.data[i] = 237 + grain; data.data[i + 1] = 226 + grain; data.data[i + 2] = 205 + grain; data.data[i + 3] = 255;
      }
      p.putImageData(data, 0, 0);
      for (let i = 0; i < 11000; i++) {
        const x = rng() * w, y = rng() * h, a = rng() * TAU, len = 1 + rng() * 11;
        path(p, [[x, y], [x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5], [x + Math.cos(a + 0.3) * len, y + Math.sin(a + 0.3) * len]], 0.35, i % 2 ? '#a89a7e' : '#fff9e9', 0.13);
      }
      this.layout();
    }
    layout() {
      const w = this.w, h = this.h;
      this.gourds = this.mobile ? [
        { x: w * 0.20, y: h * 0.51, height: Math.min(h * 0.22, w * 0.43) },
        { x: w * 0.51, y: h * 0.50, height: Math.min(h * 0.28, w * 0.59) },
        { x: w * 0.81, y: h * 0.51, height: Math.min(h * 0.22, w * 0.43) }
      ] : [
        { x: w * 0.48, y: h * 0.28, height: h * 0.34 },
        { x: w * 0.68, y: h * 0.24, height: h * 0.52 },
        { x: w * 0.87, y: h * 0.34, height: h * 0.37 }
      ];
      this.gourds.forEach(g => { g.width = g.height * 0.67; });
    }
    reset() { this.particles.length = 0; this.ribbons.length = 0; this.rings.length = 0; this.sprites.length = 0; this.blooms.length = 0; this.petals.length = 0; this.pulses = [0, 0, 0]; }
    hit(x, y) {
      let best = -1, distance = 1.5;
      this.gourds.forEach((g, i) => {
        const d = Math.pow((x - g.x) / (g.width * 0.55), 2) + Math.pow((y - (g.y + g.height * 0.51)) / (g.height * 0.53), 2);
        if (d < distance) { distance = d; best = i; }
      }); return best;
    }
    tap(index, chaos, opened, strength = 1) {
      const g = this.gourds[index]; this.pulses[index] = Math.max(.4, strength);
      if (this.rings.length >= 24) this.rings.shift();
      this.rings.push({ x: g.x, y: g.y + g.height * 0.55, life: 0, max: g.width * 0.75, color: this.palette ? this.palette[index % this.palette.length] : chaos ? ink : [red, blue, '#a67b38'][index] });
      this.flourish(g.x, g.y + g.height * .53, index, chaos, false);
      if (opened) this.burst(index, chaos, 0.28);
    }
    flourish(x, y, index, chaos, strong) {
      const r=this.rng, colors=this.palette?this.palette:chaos?['#5f5360','#86634c',red]:['#b8964f',blue,red,'#bd6d56','#d4af6a'];
      if(this.blooms.length>=12)this.blooms.shift();
      this.blooms.push({x,y,age:0,life:strong?4.5:2.5,size:(strong?200:90)*(this.mobile?.6:1),color:colors[index%colors.length],seed:r()*10});
      const count=this.reduced?(strong?12:3):(strong?70:14),cap=this.reduced?40:160;
      for(let i=0;i<count&&this.petals.length<cap;i++){
        const a=r()*TAU,speed=(strong?120:65)*(0.5+r())*(this.mobile?.6:1)*(this.reduced?.3:1);
        this.petals.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-55,age:0,life:4+r()*4,
          size:(strong?5:3)+r()*6,angle:r()*TAU,spin:(r()-.5)*2.5,color:colors[Math.floor(r()*colors.length)],kind:i%4,phase:r()*TAU});
      }
    }
    washes(dt) {
      const c=this.ctx;
      this.blooms=this.blooms.filter(b=>b.age<b.life);
      for(const b of this.blooms){
        b.age+=dt;const t=clamp(b.age/b.life),radius=b.size*(.2+ease(t))*(this.reduced?.7:1);
        c.save();c.translate(b.x,b.y);c.fillStyle=b.color;c.globalCompositeOperation='multiply';
        for(let layer=0;layer<5;layer++){
          c.globalAlpha=(1-t)*.018;c.beginPath();
          for(let i=0;i<=56;i++){const a=i/56*TAU,rr=radius*(.65+layer*.07)*(1+Math.sin(a*7+b.seed)*.08+Math.sin(a*13)*.035);const x=Math.cos(a)*rr,y=Math.sin(a)*rr*.78;i?c.lineTo(x,y):c.moveTo(x,y);}
          c.closePath();c.fill();
        }
        for(let j=0;j<3;j++){
          const pts=[];for(let i=0;i<42;i++){const a=i/42*Math.PI*1.5+b.seed+j*2.1,rr=radius*(.55+i/84);pts.push([Math.cos(a)*rr,Math.sin(a)*rr*.78]);}
          path(c,pts,.75,'#ad8b40',(1-t)*.25);
        }c.restore();
      }
    }
    burst(index, chaos, strength = 1) {
      const g = this.gourds[index], r = this.rng, cap = this.reduced ? 90 : 300;
      const count = Math.floor((this.reduced ? 18 : 65) * strength);
      for (let i = 0; i < count && this.particles.length < cap; i++) {
        const angle = r() * 2.9 + 0.3, speed = (40 + r() * 170) * Math.min(1, this.w / 900) * (this.reduced ? 0.35 : 1);
        this.particles.push({ x: g.x, y: g.y + g.height * 0.52, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 100,
          age: 0, life: 6 + r() * 6, size: 2 + r() * 3.5, angle: r() * TAU, spin: (r() - 0.5) * 6,
          color: chaos && r() < 0.3 ? '#36352e' : r() < 0.3 ? '#b88b47' : '#f7ecd4', kind: index === 2 ? 'coin' : 'rice', settled: false });
      }
      if (strength > 0.5) {
        this.flourish(g.x,g.y+g.height*.52,index,chaos,true);
        for (let i = 0; i < (this.reduced ? 1 : 5) && this.ribbons.length < 18; i++) this.ribbons.push({ x: g.x, y: g.y + g.height * 0.55, age: 0, life: 11, color: [red,blue,'#bc9148',blue,red][i%5], seed: r() * 9, direction: index === 2 ? -1 : 1, width: 14 + r() * 18 });
        if (chaos) for (let i = 0; i < 5 && this.sprites.length < 20; i++) this.sprites.push({ x: g.x, y: g.y + g.height * 0.5, vx: (r() - 0.5) * 230, vy: -90 - r() * 140, age: 0, size: 10 + r() * 10, phase: r() * TAU });
      }
    }
    disturb(x, y) {
      let count = 0;
      for (const p of this.particles) if (Math.hypot(p.x - x, p.y - y) < 80) { p.vx += (p.x - x) * 2; p.vy = -90; p.settled = false; count++; }
      for (const p of this.sprites) if (Math.hypot(p.x - x, p.y - y) < 90) { p.vy = -170; p.vx *= -1; count++; }
      return count > 0;
    }
    leaf(x, y, size, rotation, alpha, seed) {
      const c = this.ctx, rng = random(seed); c.save(); c.translate(x, y); c.rotate(rotation);
      c.globalAlpha = alpha; c.fillStyle = ink; c.beginPath(); c.moveTo(0, 0);
      for (let i = 0; i <= 18; i++) {
        const t = i / 18, width = Math.sin(t * Math.PI) * size * (0.45 + Math.sin(t * 8 * Math.PI) * 0.1);
        c.lineTo(width, -t * size);
      }
      for (let i = 18; i >= 0; i--) { const t = i / 18; c.lineTo(-Math.sin(t * Math.PI) * size * (0.45 + Math.sin(t * 8 * Math.PI) * 0.1), -t * size); }
      c.closePath(); c.fill(); c.clip();
      for (let i = 0; i < 45; i++) { c.fillStyle = '#d9c9aa'; c.globalAlpha = rng() * 0.14; c.fillRect((rng() - 0.5) * size, -rng() * size, 1 + rng() * 9, 0.6 + rng() * 2); }
      path(c, [[0, 0], [0, -size]], 0.6, '#b1a589', 0.35); c.restore();
    }
    vine(growth, clock, chaos = false) {
      const c = this.ctx, w = this.w, h = this.h, mobile = this.mobile;
      c.save(); c.beginPath(); c.rect(w * (1 - growth), 0, w, h); c.clip();
      const y0 = mobile ? h * 0.465 : h * 0.12;
      const points = [];
      for (let i = 0; i <= 90; i++) { const x = w * (0.3 + i / 90 * 0.75); points.push([x, y0 + Math.sin(i / 14) * 20 + Math.cos(i / 9) * 13]); }
      for (let i = 0; i < 5; i++) path(c, points.map(([x,y], j) => [x + Math.sin(j * 3 + i) * 1.5, y + i * 0.7]), (mobile ? 2 : 4) * (1 - i / 7), ink, 0.23);
      for (let i = 0; i < 21; i++) {
        const x = w * (0.35 + i / 21 * 0.67), y = y0 + Math.sin(i * 0.65) * (mobile ? 10 : 24);
        const rot = (i % 2 ? -1 : 1) * (0.5 + Math.sin(i * 3) * 0.8) + (this.reduced ? 0 : Math.sin(clock * 0.5 + i) * 0.025);
        this.leaf(x, y, (mobile ? 16 : 38) + (i % 4) * (mobile ? 4 : 9), rot + Math.sin(i * 2.3), 0.35 + (i % 3) * 0.16, i + 7);
        if (i % 3 === 0) {
          const tendril = [];
          for (let j = 0; j < 50; j++) { const a = j / 49 * Math.PI * 3; tendril.push([x + Math.sin(a) * (22 - j * 0.35), y + j * 1.5 + Math.cos(a) * (22 - j * 0.35)]); }
          path(c, tendril, 0.9, ink, 0.6);
        }
      }
      this.gourds.forEach((g, i) => {
        const p = [];
        for(let j=0;j<=28;j++){const t=j/28;p.push([g.x+Math.sin(t*Math.PI*2)*(1-t)*11,g.y*t+y0*(1-t)+16*t]);}
        path(c, p, 1.7 + (chaos ? 0.8 : 0), ink, 0.6);
      }); c.restore();
    }
    gourd(index, story, growth = 1) {
      const c = this.ctx, g = this.gourds[index], pulse = this.pulses[index], charge = story.charge(index);
      const chaotic = story.chaotic || (story.scene === 'free' && index === 2);
      const opened = story.opened[index], open = opened ? ease((story.clock - story.opens[index]) / 1.5) : 0;
      const s = ease(growth), motion = this.reduced ? 0.2 : 1;
      const wobble = Math.sin(story.clock * 15) * pulse * 0.055 * motion + Math.sin(story.clock * 0.7 + index) * 0.017 * motion;
      const sx = 1 + (chaotic ? 0.08 : 0) + Math.sin(story.clock * 19) * pulse * 0.04 * motion;
      c.save(); c.translate(g.x, g.y); c.rotate(wobble + (chaotic ? (index - 1) * 0.07 : 0)); c.scale(sx * s, s / sx);
      const w = g.width, h = g.height;
      if (!opened) c.drawImage(this.images.gourd, -w/2, 0, w, h);
      else for (let side = -1; side <= 1; side += 2) {
        c.save(); c.translate(side * open * w * 0.08, open * h * 0.02); c.rotate(-side * open * 0.13);
        c.beginPath(); c.moveTo(0, -h * 0.1);
        for (let j = 0; j <= 18; j++) c.lineTo(Math.sin(j * 2.4 + 1) * w * 0.025, j / 18 * h);
        c.lineTo(side * w, h * 1.2); c.lineTo(side * w, -h * 0.1); c.closePath(); c.clip();
        c.drawImage(this.images.gourd, -w / 2, 0, w, h);
        c.restore();
      }
      if (charge > 0 && !opened) {
        const p = [];
        for (let j = 0; j <= Math.floor(charge * 30); j++) p.push([Math.sin(j * 2.1) * w * 0.022, h * (0.18 + j / 30 * 0.69)]);
        if (p.length > 1) path(c, p, 1.5, ink, 0.8);
        if (charge >= 1) { c.fillStyle = red; c.globalAlpha = 0.7; c.beginPath(); c.arc(0, h * 0.92, 3, 0, TAU); c.fill(); c.globalAlpha = 1; }
      }
      c.restore();
      if (!opened && story.playable && !(this.mobile && story.scene === 'free')) {
        c.save(); c.font = '11px serif'; c.textAlign = 'center'; c.fillStyle = '#7b6b52'; c.fillText(['쌀 · A', '비단 · S', chaotic ? '소동 · D' : '보물 · D'][index], g.x, g.y + g.height + 20); c.restore();
      }
    }
    bird(x, y, size, clock, alpha = 1) {
      const c = this.ctx, flap = this.reduced ? 0.3 : Math.sin(clock * 5) * 0.6;
      c.save(); c.translate(x, y); c.scale(size, size); c.globalAlpha = alpha;
      for (const side of [-1, 1]) {
        c.save(); c.scale(1, side * (0.65 + flap * 0.3)); c.fillStyle = ink; c.beginPath(); c.moveTo(-3, 0); c.bezierCurveTo(-12, -13, -29, -24, -47, -36); c.lineTo(-22, -4); c.lineTo(6, 3); c.closePath(); c.fill();
        for (let i = 0; i < 6; i++) path(c, [[-12-i*4, -5-i*3], [-28-i*3,-17-i*3]], 0.7, '#d5c8ad', 0.3 * alpha);
        c.restore();
      }
      c.fillStyle = ink; c.beginPath(); c.ellipse(0, 0, 16, 7, -0.2, 0, TAU); c.fill();
      c.fillStyle = '#e8dcc5'; c.beginPath(); c.ellipse(3, 3, 10, 3, -0.2, 0, TAU); c.fill();
      c.fillStyle = ink; c.beginPath(); c.arc(14, -4, 6, 0, TAU); c.fill();
      c.fillStyle = red; c.beginPath(); c.ellipse(16, 0, 4, 2, -0.3, 0, TAU); c.fill();
      path(c, [[18,-5],[25,-4],[19,-2]], 1.4, ink, alpha);
      path(c, [[-11,1],[-39,17],[-20,2],[-43,8]], 1.8, ink, alpha); c.restore();
    }
    hands(story) {
      const c = this.ctx, isNolbu = story.scene.startsWith('nolbu'), image = this.images.hands;
      const size = this.mobile ? this.w * 0.96 : Math.min(this.h * 0.8, this.w * 0.52);
      const x = this.mobile ? this.w * 0.5 : this.w * (isNolbu ? 0.72 : 0.33);
      const y = this.mobile ? this.h * 0.59 : this.h * 0.56;
      const enter = ['heal','nolbu'].includes(story.scene)?ease(story.time / 1.3):1, p = story.healed;
      const change=isNolbu?(story.scene==='nolbu'?0:story.scene==='nolbuDone'?1:ease(story.time/.9)):ease(clamp((p-.18)/.65));
      const shake=story.scene==='nolbuBreak'&&!this.reduced?Math.sin(story.time*35)*Math.exp(-story.time*4)*3:0;
      c.save();c.translate(x+shake,y+(1-enter)*30);c.rotate(this.reduced?0:Math.sin(story.clock*.8)*.005);
      // White-backed keyframes blend with the paper; the original sprite has real alpha.
      if(isNolbu){
        if(change<1){c.globalAlpha=enter*(1-change);c.drawImage(image,image.width/2,0,image.width/2,image.height,-size/2,-size/2,size,size);}
        if(change>0){c.globalAlpha=enter*change;c.globalCompositeOperation='multiply';c.drawImage(this.images.hurtAfter,-size/2,-size/2,size,size);}
      }else{
        if(change<1){c.globalAlpha=enter*(1-change);c.globalCompositeOperation='multiply';c.drawImage(this.images.healBefore,-size/2,-size/2,size,size);}
        if(change>0){c.globalAlpha=enter*change;c.globalCompositeOperation='source-over';c.drawImage(image,0,0,image.width/2,image.height,-size/2,-size/2,size,size);}
      }c.restore();
      if (!isNolbu) {
        const xx = x + size * 0.195, yy = y - size * 0.112;
        const points = [];
        for (let i = 0; i < (story.scene === 'heal' ? p : 0) * 100; i++) { const t = i / 100; points.push([xx + Math.cos(t * TAU * 2) * size * 0.025, yy + Math.sin(t * TAU * 2) * size * 0.01 + t * size * 0.023]); }
        if (points.length > 1) { path(c, points, size * 0.006, '#fcf5e4', 0.9); path(c, points, 0.5, '#96876c', 0.4); }
        if(story.scene==='heal'){c.save(); c.strokeStyle = '#b0a186'; c.lineWidth = 1; c.beginPath(); c.arc(x, y + size * 0.39, 17, -Math.PI/2, -Math.PI/2 + p*TAU); c.stroke(); c.restore();}
        else {
          for(let i=0;i<7;i++){const a=i/7*TAU+story.time*.25,r=size*(.13+Math.min(story.time,2)*.025);c.save();c.globalAlpha=.3;c.fillStyle='#b38d45';c.beginPath();c.ellipse(xx+Math.cos(a)*r,yy+Math.sin(a)*r*.65,2.5,1, a,0,TAU);c.fill();c.restore();}
        }
      } else if (story.scene==='nolbuBreak') {
        const points = [[x-size*.12,y+size*.08],[x-size*.22,y-size*.01],[x-size*.15,y-size*.06],[x-size*.27,y-size*.14]];
        path(c,points,2.2,ink,Math.max(0,Math.sin(story.time/1.7*Math.PI))*.6);
      }
    }
    seed(story) {
      const c = this.ctx, w = this.w, h = this.h, ending = story.scene === 'ending';
      const t = story.time, x = w * (this.mobile ? 0.55 : 0.65), y = h * 0.62;
      const fly = clamp(t / 6);
      this.bird(w * (0.3 + fly * 0.5), h * (this.mobile ? 0.42 : 0.33) - Math.sin(fly * Math.PI) * 70, this.mobile ? 1 : 1.45, t, 1-fly*0.7);
      const drop = ending ? 1 : ease(t / 1.8);
      c.save(); c.translate(x, y - (1-drop)*100); c.rotate(0.7); c.fillStyle = '#b99459'; c.strokeStyle='#695c44'; c.lineWidth=0.8;
      c.beginPath(); c.ellipse(0,0,9,5,0,0,TAU); c.fill(); c.stroke(); c.restore();
      const ring = 17 + (this.reduced ? 0 : Math.sin(t*1.4)*3); c.save(); c.strokeStyle='#99897166'; c.lineWidth=0.7; c.beginPath(); c.arc(x,y,ring,0,TAU); c.stroke(); c.restore();
      if (ending) path(c,[[x,y-3],[x+3,y-17],[x+11,y-25]],1,ink,0.6);
    }
    effects(dt, story) {
      const c = this.ctx, h = this.h, w = this.w, reduced = this.reduced;
      const floor = h * (this.mobile ? 0.78 : 0.86);
      this.rings = this.rings.filter(r => r.life < 1.8);
      for (const r of this.rings) {
        r.life += dt; c.save(); c.globalAlpha = (1-r.life/1.8)*0.25; c.strokeStyle=r.color; c.lineWidth=0.8;
        c.beginPath(); c.ellipse(r.x,r.y,8+r.life*r.max,5+r.life*r.max*0.85,0,0,TAU); c.stroke(); c.restore();
      }
      this.ribbons = this.ribbons.filter(r => r.age < r.life);
      for (const r of this.ribbons) {
        r.age += dt; const fade = clamp((r.life-r.age)/2), len = Math.min(r.age*180, this.mobile ? 320 : 920), pts=[];
        const attract = Math.hypot(this.mouse.x-r.x,this.mouse.y-r.y) < 250 ? 0.2 : 0;
        for (let i=0;i<=45;i++) {
          const u=i/45, wave = Math.sin(u*8-r.age*1.1+r.seed);
          pts.push([r.x-r.direction*u*len+Math.sin(u*4+r.age*.4)*20 + (this.mouse.x-r.x)*attract*u,
            Math.min(floor, r.y+u*len*.55)+wave*(this.mobile?46:105)*u*(reduced?.25:1)]);
        }
        c.save();
        const left=[],right=[];
        for(let i=0;i<pts.length;i++){
          const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
          const width=Math.sin(i/(pts.length-1)*Math.PI)*r.width*.5;
          left.push([pts[i][0]-dy/length*width,pts[i][1]+dx/length*width]);
          right.push([pts[i][0]+dy/length*width,pts[i][1]-dx/length*width]);
        }
        c.globalAlpha=fade*.82;c.fillStyle=r.color;c.beginPath();[...left,...right.reverse()].forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();
        path(c,pts.map(([x,y],i)=>[x,y+Math.sin(i*1.2)*.6]),.7,'#e9d9b8',fade*.35);
        c.restore();
      }
      this.petals=this.petals.filter(p=>p.age<p.life);
      for(const p of this.petals){
        p.age+=dt;p.vy+=dt*20;p.vx*=Math.pow(.988,dt*60);p.x+=(p.vx+Math.sin(p.age*2+p.phase)*12)*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;
        c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.globalAlpha=clamp((p.life-p.age)/1.5)*.8;c.fillStyle=p.color;
        if(p.kind===0){
          for(let j=0;j<5;j++){c.rotate(TAU/5);c.beginPath();c.ellipse(p.size*.45,0,p.size*.6,p.size*.27,0,0,TAU);c.fill();}
          c.fillStyle='#ecd5a2';c.beginPath();c.arc(0,0,1.6,0,TAU);c.fill();
        }else if(p.kind===1){c.strokeStyle='#ac8235';c.lineWidth=.8;c.beginPath();c.moveTo(-p.size,0);c.lineTo(p.size,0);c.moveTo(0,-p.size);c.lineTo(0,p.size);c.stroke();}
        else{c.beginPath();c.moveTo(-p.size,0);c.bezierCurveTo(0,-p.size,p.size,-p.size*.4,p.size,0);c.bezierCurveTo(0,p.size*.9,-p.size*.5,p.size*.5,-p.size,0);c.fill();}
        c.restore();
      }
      this.particles = this.particles.filter(p=>p.age<p.life);
      for (const p of this.particles) {
        p.age+=dt; if (!p.settled) { p.vy+=dt*170; p.x+=p.vx*dt; p.y+=p.vy*dt; p.angle+=p.spin*dt; p.vx*=Math.pow(.99,dt*60);
          if(p.y>floor){p.y=floor;p.vy*=-.39;p.vx*=.72;if(Math.abs(p.vy)<13)p.settled=true;}
          if(p.x<5||p.x>w-5){p.x=clamp(p.x,5,w-5);p.vx*=-.7;}
        }
        c.save();c.globalAlpha=clamp((p.life-p.age)/2)*.85;c.translate(p.x,p.y);c.rotate(p.angle);c.fillStyle=p.color;c.strokeStyle='#89714c';c.lineWidth=.4;
        c.beginPath();c.ellipse(0,0,p.size,p.kind==='coin'?p.size*.72:p.size*.4,0,0,TAU);c.fill();c.stroke();c.restore();
      }
      this.sprites=this.sprites.filter(p=>p.age<17);
      for(const p of this.sprites){
        p.age+=dt;p.vy+=dt*250;p.x+=p.vx*dt;p.y+=p.vy*dt;
        if(p.y>floor){p.y=floor;p.vy=-(reduced?25:70+Math.sin(p.phase+p.age)*50);}
        if(p.x<20||p.x>w-20){p.x=clamp(p.x,20,w-20);p.vx*=-1;}
        const a=p.age*6+p.phase;c.save();c.globalAlpha=clamp((17-p.age)/3)*.83;c.translate(p.x,p.y);c.rotate(Math.sin(a)*.12);c.fillStyle=ink;
        c.beginPath();c.ellipse(0,-p.size,p.size*.6,p.size*.8,.1,0,TAU);c.fill();c.beginPath();c.arc(2,-p.size*1.95,p.size*.34,0,TAU);c.fill();
        for(const side of [-1,1]){path(c,[[side*p.size*.4,-p.size*1.5],[side*p.size,-p.size*(1.5+Math.sin(a)*.5)],[side*p.size*1.3,-p.size*(1.8+Math.sin(a)*.5)]],2.1,ink,.8);path(c,[[side*3,-p.size*.4],[side*p.size*.5,Math.sin(a+side)*6],[side*p.size*.9,Math.sin(a+side)*6]],2.1,ink,.8);}
        c.restore();
      }
    }
    draw(story, dt) {
      const c=this.ctx; c.setTransform(this.dpr,0,0,this.dpr,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
      c.drawImage(this.paper,0,0,this.w,this.h);
      this.washes(dt);
      this.pulses=this.pulses.map(v=>Math.max(0,v-dt*2.5));
      const scene=story.scene;
      if(scene==='intro'){
        if(this.mobile){
          const previous=this.gourds[1];this.gourds[1]={x:this.w*.7,y:this.h*.575,height:this.h*.32,width:this.h*.32*.67};
          this.gourd(1,story);this.gourds[1]=previous;
          this.bird(this.w*.31,this.h*.72,.9,story.clock);
        }else{this.vine(1,story.clock);this.gourds.forEach((g,i)=>this.gourd(i,story));this.bird(this.w*.43,this.h*.19,1.1,story.clock);}
      }else if(['heal','healDone','nolbu','nolbuBreak','nolbuDone'].includes(scene))this.hands(story);
      else if(['seed','nolbuSeed','ending'].includes(scene))this.seed(story);
      else {
        const growth=['grow','nolbuGrow'].includes(scene)?clamp(story.time/3):1;
        this.vine(growth,story.clock,story.chaotic);
        this.gourds.forEach((g,i)=>this.gourd(i,story,clamp(growth*1.5-i*.15)));
      }
      this.effects(dt,story);
    }
  }
  window.BakPainter=Painter;
})();
