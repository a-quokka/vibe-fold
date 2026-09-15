const test = require('node:test');
const assert = require('node:assert/strict');
const context = {module:{exports:{}}};
require('node:vm').runInNewContext(require('node:fs').readFileSync(__dirname + '/tracks.js','utf8'),context);
require('node:vm').runInNewContext(require('node:fs').readFileSync(__dirname + '/music.js','utf8'),context);
const {Performance, tracks} = context.module.exports;
function setup() {
  const notes = [], shown = [];
  const sound = {ctx:{currentTime:0,state:'running'},muted:false,voices:new Set(),note(...args){
    const voice = {stopped:false,stop(){this.stopped=true;}};this.voices.add(voice);notes.push({args,voice});return voice;
  }};
  return {sound, notes, shown, music:new Performance(sound,event=>shown.push(event))};
}
test('each gourd offers five distinct pentatonic pitches in its own register',()=>{
  const {music}=setup();
  const groups=[0,1,2].map(g=>Array.from({length:8},()=>music.nextPitch(g)));
  for(const group of groups)assert.equal(new Set(group).size,5);
  assert.ok(Math.max(...groups[0])<Math.min(...groups[1]));
  assert.ok(Math.max(...groups[1])<Math.min(...groups[2]));
});
test('audio schedules ahead while visible strikes wait for their onset',()=>{
  const {music,sound,notes,shown}=setup();assert.equal(music.start(),true);music.step();
  assert.ok(notes.length>0);assert.equal(shown.length,0);
  assert.equal(notes[0].args[5],.08);
  sound.ctx.currentTime=.08;music.step();assert.ok(shown.length>0);
  music.stop();assert.ok(notes.every(n=>n.voice.stopped));assert.equal(music.pending.length,0);
});
test('pause preserves position, completion stops, and stalls do not replay missed beats',()=>{
  const {music,sound,notes}=setup();music.start();sound.ctx.state='suspended';music.step();assert.equal(notes.length,0);
  sound.ctx.state='running';sound.ctx.currentTime=10;music.step();assert.ok(notes.length<=6);
  sound.ctx.currentTime=music.origin+music.duration+.1;music.step();assert.equal(music.active,false);
  assert.ok(tracks.spring.score.length>50);
});
test('muted audio cannot start an invisible performance',()=>{
  const {music,sound}=setup();sound.muted=true;assert.equal(music.start(),false);assert.equal(music.active,false);
});
test('selecting another track cancels old voices and pending strikes',()=>{
  const {music,sound,notes}=setup();music.start();music.step();
  assert.equal(music.select('moon'),true);assert.equal(music.active,false);
  assert.equal(music.pending.length,0);assert.ok(notes.every(n=>n.voice.stopped));
  assert.ok(music.duration>=58&&music.duration<=63);
  assert.equal(music.select('unknown'),false);assert.equal(music.trackId,'moon');
  music.start();music.step();assert.ok(notes.length>0);
  sound.ctx.currentTime=music.origin+music.duration+.1;music.step();assert.equal(music.active,false);
});

test('five original arrangements span a minute and finish with valid audio events',()=>{
  const ids=Object.keys(tracks);assert.equal(ids.length,5);assert.equal(tracks.blue,undefined);
  const scores = new Set();
  for(const id of ids){
    const {music,sound,notes}=setup();music.select(id);const track=music.track;
    assert.ok(music.duration>=58&&music.duration<=63,id);
    assert.equal(new Set(track.score.map(n=>n.gourd)).size,3,id);
    let previous=-1;
    for(const n of track.score){
      assert.ok(n.beat>=previous && n.beat>=0,id);previous=n.beat;
      assert.ok(Number.isInteger(n.pitch)&&n.pitch>=24&&n.pitch<=96,id);
      assert.ok(n.strength>0&&n.strength<=1.2,id);
      assert.ok(n.length>0&&(n.beat+n.length)*track.pulse<=music.duration,id);
    }
    scores.add(JSON.stringify(track.score));music.start();
    for(let time=0;time<music.duration+.2;time+=.025){sound.ctx.currentTime=time;music.step();}
    assert.equal(music.active,false,id);assert.equal(notes.length,track.score.length,id);
  }
  assert.equal(scores.size,5);
});
