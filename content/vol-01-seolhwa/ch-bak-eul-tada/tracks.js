(function (root) {
  'use strict';

  // Original, through-arranged eight-beat phrases. Degrees refer to the
  // track's own scale; negative degrees descend into the preceding octave.
  // A/B phrases, a quieter bridge, and a written cadence keep each minute
  // from becoming a repeated short loop.
  function midi(tonic, scale, degree) {
    const octave = Math.floor(degree / scale.length);
    return tonic + 12 * octave + scale[((degree % scale.length) + scale.length) % scale.length];
  }
  function compose(config) {
    const score = [];
    function note(beat, gourd, degree, strength, length, chaos) {
      if (beat >= config.beats) return;
      score.push({ beat, gourd,
        pitch: midi(config.root + (gourd - 1) * 12, config.scale, degree),
        strength, length: Math.min(length, config.beats - beat),
        ...(chaos ? { chaos: true } : {}) });
    }
    config.phrases.forEach((phrase, index) => {
      const base = index * 8;
      const ending = index === config.phrases.length - 1;
      const bridge = index >= config.bridge[0] && index < config.bridge[1];
      const level = bridge ? 0.75 : (index < 2 ? 0.88 : 1);
      const bass = config.bass[index % config.bass.length];
      note(base, 0, bass, 0.55 * level, ending ? 3.4 : 2.4, false);
      if (!ending) note(base + config.bassSecond, 0, bass + (index % 3 === 1 ? 2 : 0), 0.42 * level, 1.8, false);
      // A sparse middle-register answer leaves the high melody intelligible.
      const answers = ending ? [[0, 0], [4, 0]] : config.answers[index % config.answers.length];
      answers.forEach(([offset, degree]) => note(base + offset, 1, degree + (bridge ? -1 : 0), 0.36 * level, ending ? 2.6 : 1.2, false));
      phrase.forEach(([offset, degree, length, accent]) => {
        if (degree === null) return;
        note(base + offset, 2, degree, (accent || config.strength) * level, length || config.length, config.chaos && !ending && index >= 2);
      });
    });
    score.sort((a, b) => a.beat - b.beat || a.gourd - b.gourd);
    return { title: config.title, description: config.description,
      pulse: config.pulse, beats: config.beats, root: config.root,
      scale: config.scale, palette: config.palette, score };
  }

  const tracks = {
    spring: compose({
      title: '작은 봄', description: '따뜻한 선율과 조용한 응답이 피어나는 봄',
      pulse: 0.61, beats: 96, root: 60, scale: [0, 2, 4, 7, 9],
      palette: ['#ba883c', '#ccaa62', '#a7a46c', '#ead6a2', '#af6651'],
      bass: [0, -1, 2, 0, 1, -1], bassSecond: 4,
      answers: [[[2, 2], [6, 1]], [[2, 1], [6, 0]]],
      bridge: [6, 8], strength: 0.61, length: 1.1,
      phrases: [
        [[0,0,1.5],[2,1],[3,2,1.5],[6,1,1.5]],
        [[0,2],[1.5,3],[3,2,1.5],[5,0,2]],
        [[0,0],[1,1],[2,2],[4,4,1.5],[6,3]],
        [[0,2,1.5],[2,1],[3.5,0,2],[6,-1]],
        [[0,3],[1.5,4],[3,5,1.5],[5,4],[6.5,2]],
        [[0,4,1.5],[2,3],[3,1,1.5],[5,2,2]],
        [[1,-1,2],[4,0,1.5],[6,1]],
        [[0,2,2],[3,0,1.5],[5,-1,2]],
        [[0,0],[1,1],[2,2,1.5],[4,4],[5,3],[6,2]],
        [[0,3,1.5],[2,5],[3,4],[4.5,2,1.5],[6,1]],
        [[0,2,1.5],[2,1],[3,0,1.5],[5,-1],[6,1]],
        [[0,2,1.5],[2,1,1.5],[4,0,3.5]],
      ],
    }),
    swallow: compose({
      title: '제비의 춤', description: '가벼운 높은 음이 날갯짓하듯 오가는 춤',
      pulse: 0.46, beats: 128, root: 62, scale: [0, 2, 4, 7, 9],
      palette: ['#357b7b', '#70a8a2', '#c89751', '#b1c9b8', '#426778'],
      bass: [0, 2, -1, 1], bassSecond: 4,
      answers: [[[1.5,2],[5.5,3]], [[2.5,1],[6.5,2]]],
      bridge: [8, 10], strength: 0.55, length: 0.52,
      phrases: [
        [[0,2],[1,4],[2,3],[3,2],[4,4],[5.5,5],[7,3]],
        [[0,4],[0.5,3],[1,2],[3,1],[4,2],[5,3],[6,2,1.2]],
        [[0,2],[0.5,3],[1,4],[2,5],[3,4],[4,2],[5,3],[6,4]],
        [[0,5],[1,4],[2,2],[3,3],[4,1],[5.5,2,1.2]],
        [[0,3],[1,5],[2,6],[3,5],[4,3],[5,4],[6,5],[7,3]],
        [[0,4],[0.5,5],[1,4],[2,2],[3,3],[4,1],[6,2,1.2]],
        [[0,2],[1,3],[2,5],[2.5,4],[3,3],[4,4],[5,6],[6,5]],
        [[0,4],[1,2],[2,3],[3.5,1],[5,0,1.5]],
        [[1,0,1.2],[3,2,1.2],[5,1],[7,2]],
        [[0,3,1.2],[2,1],[4,2,1.2],[6,3]],
        [[0,2],[0.5,4],[1,3],[2,5],[3,4],[4,2],[5,4],[6,5]],
        [[0,6],[1,5],[2,3],[3,4],[4,2],[5,3],[6,4],[7,2]],
        [[0,3],[1,5],[2,6],[3,4],[4,5],[5,3],[6,4],[7,2]],
        [[0,5],[1,4],[2,2],[3,3],[4,1],[5,2],[6,3]],
        [[0,4],[1,3],[2,2],[3,1],[4,2],[5,0],[6,1,1]],
        [[0,2,1.2],[2,1,1.2],[4,0,3]],
      ],
    }),
    feast: compose({
      title: '박 타는 잔치', description: '힘찬 낮은 장단에 선율이 주고받는 잔치',
      pulse: 0.53, beats: 112, root: 57, scale: [0, 2, 5, 7, 9],
      palette: ['#bf623c', '#d9a039', '#a44136', '#e3c06b', '#577a69'],
      bass: [0, 0, 2, -1, 1, 2, 0], bassSecond: 3,
      answers: [[[1,0],[4.5,2],[6,0]], [[1.5,2],[4,1],[6.5,2]]],
      bridge: [6, 8], strength: 0.7, length: 0.75,
      phrases: [
        [[0,0],[1.5,2],[3,3],[4,2],[5.5,0],[7,2]],
        [[0,3],[1,2],[2.5,0],[4,1],[5.5,2],[7,0]],
        [[0,2],[1.5,3],[3,4],[4,3],[5,2],[6.5,4]],
        [[0,3],[1.5,2],[3,0],[4,2],[5.5,1],[7,0]],
        [[0,4],[1,3],[2.5,5],[4,4],[5.5,2],[7,3]],
        [[0,4],[1.5,2],[3,3],[4,1],[5.5,2,1.3]],
        [[0,0,1.5],[3,1],[4.5,2,1.5]],
        [[1,2],[2.5,0,1.5],[5,1],[6.5,2]],
        [[0,0],[1,2],[2.5,3],[4,4],[5.5,3],[7,2]],
        [[0,3],[1.5,5],[3,4],[4,3],[5.5,2],[7,4]],
        [[0,5],[1,4],[2.5,3],[4,2],[5,3],[6.5,4]],
        [[0,3],[1.5,2],[3,0],[4,2],[5.5,3],[7,1]],
        [[0,2],[1,3],[2.5,2],[4,1],[5.5,0],[7,1]],
        [[0,2,1.2],[2,1,1.2],[4,0,3]],
      ],
    }),
    mischief: compose({
      title: '놀부의 소동', description: '엇박과 멈칫하는 쉼표가 만드는 익살스러운 소동',
      pulse: 0.52, beats: 112, root: 57, scale: [0, 3, 5, 7, 10],
      palette: ['#65506d', '#3d4357', '#a5654e', '#9c859c', '#a79460'],
      bass: [0, -1, 1, 0, 2, -1, 0], bassSecond: 4.5,
      answers: [[[1.5,1],[5.5,-1]], [[2.5,2],[6.5,0]]],
      bridge: [6, 8], strength: 0.6, length: 0.56, chaos: true,
      phrases: [
        [[0,0],[1.5,3],[3,1],[5.5,2],[7,0]],
        [[0.5,2],[2,0],[3.5,-1],[6,1],[7,0]],
        [[0,3],[0.5,2],[1,1],[3,4],[4.5,2],[7,0]],
        [[1,1],[2.5,3],[4,0],[5.5,-1],[6.5,1]],
        [[0,2],[1.5,4],[3,3],[4.5,1],[6,2],[7.5,0]],
        [[0.5,3],[2,2],[3.5,0],[5,1],[7,-1]],
        [[0,-1,1.2],[3.5,0],[6,1]],
        [[1,2],[2.5,0],[5,-1,1.2],[7,0]],
        [[0,0],[1.5,3],[2.5,2],[4,4],[5.5,1],[7,2]],
        [[0.5,3],[2,1],[3.5,2],[5,0],[6.5,-1]],
        [[0,4],[0.5,3],[1,2],[2.5,3],[4,1],[6,2],[7.5,0]],
        [[0.5,2],[2,1],[3.5,-1],[5,0],[6.5,2]],
        [[0,3],[1.5,1],[3,2],[4.5,0],[6,-1],[7,1]],
        [[0.5,2,1],[2.5,1,1],[4.5,0,2.7]],
      ],
    }),
    moon: compose({
      title: '달빛 아래 한지', description: '낮은 울림과 긴 쉼표 사이로 번지는 달빛',
      pulse: 0.92, beats: 64, root: 55, scale: [0, 2, 5, 7, 10],
      palette: ['#3f5873', '#6e849b', '#a7b4bd', '#8b80a3', '#c1b892'],
      bass: [0, -1, 2, 1], bassSecond: 4.5,
      answers: [[[3,2]], [[2.5,0],[6,1]]],
      bridge: [3, 5], strength: 0.46, length: 1.9,
      phrases: [
        [[0,2,2.2],[3,1,1.5],[5.5,0,2]],
        [[1,3,2],[4,2,2],[7,1,0.8]],
        [[0,4,2.4],[3.5,3,1.5],[6,2,1.7]],
        [[1.5,0,2.2],[5,-1,2.4]],
        [[0,1,2],[3.5,2,2],[6.5,3,1]],
        [[0,4,2.5],[3.5,2,1.7],[6,3,1.6]],
        [[0,2,2],[3,1,2],[6,0,1.7]],
        [[0,1,2.5],[4,0,3.6]],
      ],
    }),
  };
  root.BakTracks = tracks;
  if (typeof module !== 'undefined') module.exports = tracks;
})(globalThis);
