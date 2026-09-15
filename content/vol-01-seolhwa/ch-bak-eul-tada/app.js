(async function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('art'), story = new BakStory(), sound = new BakSound();
  let painter, paused = false, last = performance.now(), scratch = 0, pour = 0, uiSignature = '', ready = false;
  const pressed = new Set();
  let performanceStarting = false, concertRequest = 0;
  const flashes = [0,0,0];
  const music = new BakPerformance(sound, event => {
    painter.tap(event.gourd, !!event.chaos, story.opened[event.gourd], event.strength);
    flashes[event.gourd] = sound.ctx.currentTime + .15;
  });
  function concertUI() {
    const wasActive = $('perform').getAttribute('aria-pressed') === 'true';
    $('perform').setAttribute('aria-pressed', String(music.active));
    if (wasActive && !music.active) $('concert-label').textContent = music.track.description;
    $('perform').textContent = music.active ? '연주 멈추기 · P' : '한 곡 들려주기 · P';
    $('concert-progress').value = music.progress;
    document.querySelectorAll('[data-track]').forEach(button => {
      const selected = button.dataset.track === music.trackId, active = selected && music.active;
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-disabled', String(performanceStarting));
      button.querySelector('.track-action').textContent = selected && performanceStarting ? '준비 중…' : active ? '■ 멈추기' : '▶ 듣기';
    });
    if (music.active) {
      const elapsed=Math.floor(music.progress*music.duration), total=Math.round(music.duration);
      $('concert-label').textContent = music.track.title + ' · '+ Math.floor(elapsed/60)+':'+String(elapsed%60).padStart(2,'0')+' / '+Math.floor(total/60)+':'+String(total%60).padStart(2,'0');
    }
    document.querySelectorAll('[data-note]').forEach((button,i) => {
      button.dataset.sounding = String(music.active && sound.ctx.currentTime < flashes[i]);
    });
  }
  function stopConcert() { concertRequest++; music.stop(); flashes.fill(0); concertUI(); }
  async function toggleConcert() {
    if (!ready || paused || document.hidden || transition.active || story.scene !== 'free' || performanceStarting) return;
    if (music.active) { stopConcert(); return; }
    performanceStarting = true; const request = ++concertRequest; $('perform').disabled = true; concertUI();
    try {
      await enableSound();
      if (request === concertRequest && story.scene === 'free' && !paused && !document.hidden && !transition.active) {
        if (!music.start()) $('concert-label').textContent = '소리를 켠 뒤 다시 눌러 주세요.';
        else $('concert-label').textContent = music.track.description;
      }
    } finally { performanceStarting = false; $('perform').disabled = false; concertUI(); }
  }
  $('perform').addEventListener('click', toggleConcert);
  function chooseTrack(id) {
    stopConcert(); music.select(id);
    $('intro-song').value = id;
    $('listen').textContent = '연주 듣기 · ' + music.track.title + ' ♫';
    $('concert-label').textContent = music.track.description;
    if (painter) { painter.reset(); painter.palette = story.scene === 'free' ? music.track.palette : null; }
  }
  $('intro-song').addEventListener('change',event=>chooseTrack(event.target.value));
  for (const select of [$('intro-song')]) {
    select.replaceChildren(...Object.entries(BakTracks).map(([id,track]) => {
      const option = document.createElement('option'); option.value=id; option.textContent=track.title+' · 약 1분';return option;
    }));
  }
  for (const [id, track] of Object.entries(BakTracks)) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.track = id;
    button.setAttribute('aria-label', track.title + ' · 약 1분');
    button.setAttribute('aria-pressed', 'false');
    const name = document.createElement('span'); name.className = 'track-name'; name.textContent = track.title;
    const action = document.createElement('span'); action.className = 'track-action'; action.textContent = '▶ 듣기';
    button.append(name, action);
    button.addEventListener('click', () => {
      if (paused || transition.active || performanceStarting || story.scene !== 'free') return;
      if (music.trackId !== id) chooseTrack(id);
      toggleConcert();
    });
    $('song-list').append(button);
  }
  chooseTrack('spring');
  const transition = new BakTransition($('ink-transition'));
  const chapterCuts = new Set(['seed','grow','nolbu','nolbuSeed','nolbuGrow','ending','free']);
  function transitionUI(active) {
    document.body.dataset.transition = String(active);
    $('guide').inert = active;
    $('song-library').inert = active;
    canvas.setAttribute('aria-busy', String(active));
  }
  story.beforeScene = scene => {
    if (transition.active) return true;
    if (story.scene === 'intro' || !chapterCuts.has(scene)) return false;
    stopInput(); transitionUI(true);
    transition.start(scene, () => { story.go(scene, true); refreshUI(); }, painter.reduced);
    return true;
  };
  const chapters = {
    heal: ['一 · 은혜', '작은 날개를\n돌보는 손', '다친 제비를 가만히 받쳐 주세요.\n그 작은 손길이 이야기가 됩니다.'],
    healDone: ['一 · 치료', '천을 감고,\n다리를 고쳐 주다', '흥부는 다친 다리를 정성껏 매어 주었습니다.\n제비가 다시 날 수 있도록.'],
    seed: ['二 · 보답', '제비가 놓고 간\n씨앗 하나', '다시 돌아온 봄.\n제비는 작은 씨앗으로 인사를 건넵니다.'],
    grow: ['三 · 자람', '먹선이 자라\n박이 되다', '구불구불, 한 줄기의 선이\n서로 다른 세 소리를 품습니다.'],
    heungbu: ['三 · 흥부의 박', '속에서\n대답하는 소리', '두드려 듣고, 꾹 눌렀다 놓으세요.\n박 속에 무엇이 기다리고 있을까요.'],
    abundance: ['四 · 풍요', '온 세상이\n한 박 가득', '쌀알은 구르고, 비단은 흐르고.\n쏟아진 것들까지 함께 연주합니다.'],
    nolbu: ['五 · 욕심', '제비를\n붙잡은 손', '흥부의 소문을 들은 놀부.\n보상을 탐내 제비를 붙잡았습니다.'],
    nolbuBreak: ['五 · 어긋난 손길', '욕심에\n꺾인 작은 다리', '놀부는 멀쩡한 제비의 다리를\n일부러 부러뜨렸습니다.'],
    nolbuDone: ['五 · 남은 상처', '같은 손길,\n다른 마음', '은혜를 흉내 낸 욕심은\n제비에게 상처를 남겼습니다.'],
    nolbuSeed: ['五 · 또 하나의 씨앗', '또다시 봄,\n다른 씨앗', '놀부에게도 제비가 돌아왔습니다.\n이 박에서는 무엇이 나올까요.'],
    nolbuGrow: ['六 · 놀부의 박', '넝쿨도\n버거운 욕심', '커지고, 부풀고, 기우뚱.\n어딘가 수상한 소리가 납니다.'],
    chaos: ['六 · 소동', '뒤죽박죽\n덩기덕', '장난꾸러기들이 장단을 가로챕니다.\n두드리고, 열고, 한바탕 놀아 보세요.'],
    ending: ['八 · 다시', '한바탕 지나고,\n다시 한 박', '먹빛도 소리도 잦아듭니다.\n작은 씨앗 하나가 남았습니다.'],
    free: ['餘 · 자유 연주', '당신의\n장단으로', '쌀, 비단, 그리고 작은 소동.\n이제 마음 가는 대로 연주하세요.']
  };
  async function enableSound() {
    const ok = await sound.activate(); sound.mute(!ok);
    $('sound').textContent = ok ? '소리 끄기' : '소리 켜기'; $('sound').setAttribute('aria-pressed', String(ok));
  }
  function stopInput() { pressed.clear(); story.cancel(); scratch = 0; }
  function refreshUI() {
    const scene = story.scene, complete = story.opened.every(Boolean);
    const signature = scene + complete + story.canContinue;
    if (signature === uiSignature) return; uiSignature = signature;
    document.body.dataset.scene = scene;
    $('intro').hidden = scene !== 'intro'; $('chapter').hidden = scene === 'intro'; $('guide').hidden = scene === 'intro';
    const chapter = chapters[scene];
    if (chapter) { $('chapter-number').textContent = scene === 'chaos' && complete ? '七 · 한바탕 장단' : chapter[0]; $('chapter-title').textContent = chapter[1]; $('chapter-copy').textContent = chapter[2]; }
    $('keys').hidden = !story.playable;
    $('concert').hidden = scene !== 'free';
    $('song-library').hidden = scene !== 'free';
    if(painter)painter.palette = scene === 'free' ? music.track.palette : null;
    $('next').hidden = !story.canContinue;
    $('next').textContent = scene === 'healDone' ? '제비를 떠나보내기' : scene === 'nolbuDone' ? '다음 봄으로' : scene === 'ending' ? '자유롭게 연주하기' : scene === 'chaos' ? '소동을 마무리하기' : '놀부의 이야기로';
    $('next').textContent += '  ·  Space';
    const instructions = {
      heal: '화면을 꾹 눌러 제비를 돌봐 주세요.  ·  Space도 가능해요',
      healDone: '치료를 마쳤습니다. 제비를 잠시 바라봐 주세요.',
      seed: '씨앗을 건드려 주세요.  ·  Space', nolbuSeed: '씨앗을 건드려 다음 이야기를 펼치세요.  ·  Space',
      grow: '천천히 자라는 먹선을 따라가 보세요.', nolbuGrow: '욕심만큼 부푸는 박…',
      heungbu: '짧게 두드려 연주 · 꾹 눌러 먹선이 끝까지 내려오면 놓기',
      abundance: '쏟아진 쌀과 비단을 만져 보세요. 박을 다시 두드려도 좋아요.',
      nolbu: '놀부의 손길에 장단이 잠시 끊깁니다.',
      nolbuBreak: '다리를 붙잡은 손이 움직이고, 장단이 끊깁니다.',
      nolbuDone: '놀부의 행동이 남긴 장면을 보고 다음으로 넘어가세요.',
      chaos: complete ? '먹 장난꾸러기를 건드려 장단을 바꿔 보세요.' : '놀부의 박도 꾹 눌렀다 놓아 열어 보세요.',
      ending: '남은 씨앗을 건드리면 자유 연주가 시작됩니다.',
      free: '칠 때마다 달라지는 음 · A 낮게 / S 맑게 / D 높게'
    };
    $('instruction').textContent = instructions[scene] || '';
    $('progress-label').textContent = story.playable ? '짧게: 연주  /  길게 눌렀다 놓기: 박 열기' : '';
    $('keys').querySelector('[data-note="2"]').innerHTML = '<kbd>D</kbd> ' + (story.chaotic || scene === 'free' ? '소동' : '보물');
  }
  async function begin(free = false, listen = false) {
    if (!ready) return;
    stopConcert(); music.turns.fill(0); stopInput(); painter.reset(); story.reset(); story.go(free ? 'free' : 'heal');
    const request = concertRequest;
    refreshUI(); canvas.focus({ preventScroll: true });
    await enableSound();
    if (listen && request === concertRequest && story.scene === 'free') await toggleConcert();
  }
  function down(key, index) {
    if (!ready || paused || document.hidden || transition.active) return;
    if (pressed.has(key)) return;
    pressed.add(key); story.down(key, index); refreshUI();
  }
  function up(key, cancelled = false) { pressed.delete(key); story.up(key, cancelled); }
  function point(event) { const r = canvas.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top }; }
  canvas.addEventListener('pointerdown', event => {
    if (!ready || paused || transition.active || story.scene === 'intro') return;
    const p = point(event), index = painter.hit(p.x, p.y);
    canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId);
    if (story.playable && index < 0) { if (painter.disturb(p.x,p.y)) sound.note(3, story.chaotic, .45, p.x/painter.w*2-1); return; }
    down('p' + event.pointerId, Math.max(0,index)); event.preventDefault();
  });
  canvas.addEventListener('pointermove', event => { if (!painter) return; painter.mouse = point(event); });
  canvas.addEventListener('pointerleave', () => { if(painter)painter.mouse={x:-1000,y:-1000}; });
  canvas.addEventListener('pointerup', event => up('p'+event.pointerId));
  canvas.addEventListener('pointercancel', event => up('p'+event.pointerId,true));
  canvas.addEventListener('lostpointercapture', event => up('p'+event.pointerId,true));
  document.querySelectorAll('[data-note]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      button.setPointerCapture(event.pointerId); down('b'+event.pointerId,Number(button.dataset.note)); event.preventDefault();
    });
    button.addEventListener('pointerup', event => up('b'+event.pointerId));
    button.addEventListener('pointercancel', event => up('b'+event.pointerId,true));
    button.addEventListener('lostpointercapture', event => up('b'+event.pointerId,true));
    button.addEventListener('click', event => { if (event.detail === 0) { down('accessible',Number(button.dataset.note)); up('accessible'); } });
  });
  const noteKeys = { KeyA:0, KeyS:1, KeyD:2 };
  document.addEventListener('keydown', event => {
    if (event.code === 'Escape' && paused) { closeHelp(); return; }
    if (paused) {
      if (event.key === 'Tab') {
        const first=$('close-help'),last=$('reduced');
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }return;
    }
    if(event.code==='KeyM'&&!event.repeat){$('sound').click();return;}
    if (event.ctrlKey || event.metaKey || event.altKey || ['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName)) return;
    if (event.code === 'KeyP' && !event.repeat) { event.preventDefault(); toggleConcert(); return; }
    if (event.code === 'Space') {
      // Space always advances the available story action, regardless of button focus.
      event.preventDefault();
      if (event.repeat || !ready || document.hidden || transition.active) return;
      if (story.scene === 'intro') begin(['play','listen'].includes(event.target.id), event.target.id === 'listen');
      else if (story.scene === 'free' && event.target.closest('[data-track]')) event.target.closest('[data-track]').click();
      else if (story.scene === 'free' && event.target.id === 'perform') toggleConcert();
      else if (story.canContinue) $('next').click();
      else down('kSpace', 0);
      return;
    }
    if (event.code in noteKeys) {
      event.preventDefault(); if(event.repeat)return; down('k'+event.code,noteKeys[event.code]??0);
    }
  });
  document.addEventListener('keyup', event => up('k'+event.code));
  window.addEventListener('blur', stopInput);
  document.addEventListener('visibilitychange', () => {
    stopInput(); last=performance.now();
    if(document.hidden)sound.pause(); else if(!paused&&!sound.muted)sound.activate();
  });
  $('start').addEventListener('click', () => begin()); $('play').addEventListener('click', () => begin(true));
  $('listen').addEventListener('click', () => begin(true, true));
  $('sound').addEventListener('click', async () => {
    if(sound.muted)await enableSound();else{stopConcert();sound.mute(true);$('sound').textContent='소리 켜기';$('sound').setAttribute('aria-pressed','false');}
  });
  $('restart').addEventListener('click', () => {
    if(!ready)return;stopConcert();transition.cancel();transitionUI(false);stopInput();story.reset();painter.reset();
    for(const voice of sound.voices){try{voice.stop();}catch{}}
    refreshUI();$('start').focus();
  });
  $('next').addEventListener('click', () => { if(transition.active||paused)return; stopInput(); story.next(); refreshUI();canvas.focus({preventScroll:true}); });
  $('help').addEventListener('click', () => {
    stopInput();paused=true;sound.pause();$('help-panel').hidden=false;$('help').setAttribute('aria-expanded','true');$('close-help').focus();
  });
  function closeHelp(){paused=false;last=performance.now();$('help-panel').hidden=true;$('help').setAttribute('aria-expanded','false');if(!sound.muted)sound.activate();$('help').focus();}
  $('close-help').addEventListener('click',closeHelp);
  $('reduced').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('reduced').addEventListener('change',()=>{if(painter)painter.reduced=$('reduced').checked;});
  window.addEventListener('resize',()=>{transition.resize();stopInput();if(painter){painter.reset();painter.resize();}});
  try {
    const images={};
    await Promise.all(Object.entries(BakImages).map(async([key,src])=>{const im=new Image();im.src=src;await im.decode();images[key]=im;}));
    painter=new BakPainter(canvas,images);ready=true;
    $('start').disabled=false;$('start').textContent='이야기 펼치기';$('play').disabled=false;$('listen').disabled=false;
    delete window.BakImages;refreshUI();
  }catch(error){$('error').hidden=false;console.error('Artwork assets failed to load',error);return;}
  function frame(now){
    const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
    if(!paused&&!document.hidden){
      const transitioning = transition.active;
      if (transitioning) {
        transition.step(dt);
        if (!transition.active) transitionUI(false);
      } else story.step(dt);
      for(const event of story.drain()){
        if(event.type==='tap'){
          const chaotic=story.chaotic||story.scene==='free'&&event.index===2;
          painter.tap(event.index,chaotic,story.opened[event.index]);
          if (story.scene === 'free') sound.note(event.index,false,1,(event.index-1)*.6,music.nextPitch(event.index));
          else sound.note(event.index,chaotic,1,(event.index-1)*.6);
        }else if(event.type==='open'){
          const chaotic=story.chaotic||story.scene==='free'&&event.index===2;
          painter.burst(event.index,chaotic);sound.chord(story.scene === 'free' ? false : chaotic);
        }else if(event.type==='scene'){
          stopInput();
          if(event.scene !== 'free') stopConcert();
          else music.turns.fill(0);
          if(['heal','seed','nolbu','nolbuSeed','grow','nolbuGrow','free'].includes(event.scene))painter.reset();
          if(event.scene==='seed'||event.scene==='ending'||event.scene==='healDone')sound.chord();
          if(event.scene==='nolbu')sound.note(0,true,.6);
          if(event.scene==='nolbuBreak'){sound.rustle(.4);sound.note(0,true,.7);}
        }
      }
      if(story.held.size&&story.playable){scratch+=dt;if(scratch>.17){scratch=0;sound.rustle(.055);}}
      else scratch=0;
      if(story.playable){pour+=dt;if(pour>.12){pour=0;for(let i=0;i<3;i++)if(story.opened[i]&&story.clock-story.opens[i]<3.5)painter.burst(i,story.chaotic||story.scene==='free'&&i===2,.07);}}
      if(story.scene === 'free' && !transitioning) { music.step(); concertUI(); }
      painter.draw(story,transitioning ? 0 : dt);refreshUI();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
