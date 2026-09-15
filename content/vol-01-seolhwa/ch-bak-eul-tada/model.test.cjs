const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const context = { module: { exports: {} } };
vm.runInNewContext(fs.readFileSync(__dirname + '/model.js', 'utf8'), context);
const { Story } = context.module.exports;
function elapse(s, seconds) { for (let t=0;t<seconds;t+=.025)s.step(.025); }
test('cancelled and short presses never open a gourd', () => {
  const s = new Story();s.go('heungbu');s.down('touch',0);elapse(s,1.5);s.up('touch',true);
  assert.equal(s.opened[0],false);s.down('key',1);elapse(s,.4);s.up('key');assert.equal(s.opened[1],false);
});
test('a background-sized delta cannot complete a hold', () => {
  const s = new Story();s.go('heungbu');s.down('a',0);s.step(80);s.up('a');assert.equal(s.opened[0],false);
});
test('a scene boundary cancels pending input', () => {
  const s = new Story();s.go('heungbu');s.down('a',0);elapse(s,1.4);s.go('chaos');s.up('a');assert.equal(s.opened[0],false);
});
test('two pointers on one gourd emit only one opening', () => {
  const s = new Story();s.go('heungbu');s.down('a',0);s.down('b',0);elapse(s,1.2);s.up('a');s.up('b');
  assert.equal(s.drain().filter(e=>e.type==='open').length,1);
});
test('story requires all three gourds, then preserves them for abundance', () => {
  const s = new Story();s.go('heungbu');
  for(let i=0;i<2;i++){s.down('a',i);elapse(s,1.2);s.up('a');}elapse(s,4);assert.equal(s.scene,'heungbu');
  s.down('a',2);elapse(s,1.2);s.up('a');elapse(s,3);assert.equal(s.scene,'abundance');assert.equal(s.opened.every(Boolean),true);
});
test('healing needs an active hold and free play regenerates opened gourds', () => {
  const s = new Story();s.go('heal');elapse(s,10);assert.equal(s.scene,'heal');s.down('space');elapse(s,2.3);assert.equal(s.scene,'healDone');
  s.go('free');s.down('a',0);elapse(s,1.2);s.up('a');assert.equal(s.opened[0],true);elapse(s,4.8);assert.equal(s.opened[0],false);
});
test('Nolbu growth resets Heungbu opening state before the first rendered frame', () => {
  const s=new Story();s.go('heungbu');
  for(let i=0;i<3;i++){s.down('a',i);elapse(s,1.2);s.up('a');}
  elapse(s,3);assert.equal(s.scene,'abundance');s.next();elapse(s,5);
  assert.equal(s.scene,'nolbuDone');elapse(s,2);s.next();assert.equal(s.scene,'nolbuSeed');s.down('seed');
  assert.equal(s.scene,'nolbuGrow');assert.equal(s.opened.some(Boolean),false);assert.equal(s.opens.every(v=>v===0),true);
});
test('healing result remains visible until the viewer continues', () => {
  const s=new Story();s.go('heal');s.down('touch');elapse(s,2.3);assert.equal(s.scene,'healDone');
  s.next();assert.equal(s.scene,'healDone');elapse(s,10);assert.equal(s.scene,'healDone');
  s.next();assert.equal(s.scene,'seed');
});
test('Nolbu action is shown separately and cannot be skipped by held input', () => {
  const s=new Story();s.go('nolbu');s.next();assert.equal(s.scene,'nolbu');elapse(s,2.6);
  assert.equal(s.scene,'nolbuBreak');s.down('space');s.next();assert.equal(s.scene,'nolbuBreak');
  elapse(s,1.8);assert.equal(s.scene,'nolbuDone');elapse(s,12);assert.equal(s.scene,'nolbuDone');
});

test('a deferred scene cut preserves the old scene until the covered-frame commit', () => {
  const story = new Story(); story.go('healDone'); story.time = 2;
  let requested;
  story.beforeScene = scene => { requested = scene; story.cancel(); return true; };
  story.next();
  assert.equal(requested, 'seed');
  assert.equal(story.scene, 'healDone');
  story.go(requested, true);
  assert.equal(story.scene, 'seed');
  assert.equal(story.time, 0);
  assert.equal(story.held.size, 0);
});
