/* global __dirname */
/* Run with node scripts/test-grand-staff-playback.cjs. No browser or audio device required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
let time = 0;
let nextId = 0;
const timers = new Map();
const frames = new Map();
const voices = [];
const param = () => ({
  value: 0.3, setValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {},
});
class FakeAudioContext {
  get currentTime() { return time; }
  state = 'running';
  destination = {};
  createOscillator() {
    const voice = {
      frequency: param(), connect() {}, disconnect() {},
      start(at) { this.startedAt = at; },
      stop(at) { this.stoppedAt = at; },
    };
    voices.push(voice);
    return voice;
  }
  createGain() { return { gain: param(), connect() {}, disconnect() {} }; }
}
const mod = { exports: {} };
const source = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../src/services/grandStaffAudio.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
vm.runInNewContext(source, {
  module: mod, exports: mod.exports,
  require: () => ({ getNoteFrequency: () => 440 }),
  window: { AudioContext: FakeAudioContext },
  performance: { now: () => time * 1000 },
  setInterval: (callback) => { timers.set(++nextId, callback); return nextId; },
  clearInterval: (id) => timers.delete(id),
  requestAnimationFrame: (callback) => { frames.set(++nextId, callback); return nextId; },
  cancelAnimationFrame: (id) => frames.delete(id),
});
const audio = mod.exports.grandStaffAudio;
const note = (id, measure, beat, durationBeats) => ({
  id, measure, beat, durationBeats, pitch: 'C4', frequencyHz: 440,
});
const song = {
  tempoBpm: 60, beatsPerMeasure: 4, totalMeasures: 3, lyrics: [],
  trebleNotes: [note('held', 0, 1, 2), note('short', 0, 1.2, 0.1), note('next', 0, 2, 1), note('late', 2, 1, 1)],
  bassNotes: [],
};
let tick;
const approx = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, a + ' != ' + b);
const advance = (to, animate = true) => {
  time = to;
  for (const callback of [...timers.values()]) callback();
  if (animate) {
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback();
  }
};
audio.start(song, 1, 0, (state) => { tick = state; });
assert.equal(voices.length, 2);
approx(voices[1].startedAt, 0.2); // Future note is queued before its beat.
advance(0.85, false); // Audio scheduler continues without any UI frame.
approx(voices[2].startedAt, 1);
advance(0.9);
audio.pause();
assert.equal(timers.size, 0);
assert.equal(frames.size, 0);
assert.ok(voices.every((voice) => voice.stoppedAt <= 0.92 + 1e-8));
time = 3;
const beforeResume = voices.length;
audio.resume();
approx(tick.currentBeat, 1.9);
assert.equal(voices.length - beforeResume, 2); // Held note and next beat, never the expired short note.
approx(voices[beforeResume].stoppedAt, 3.005 + 1.1 + 0.05);
approx(voices[beforeResume + 1].startedAt, 3.1);
advance(3.2);
audio.pause();
const pausedBeat = tick.currentBeat;
audio.setTempoMultiplier(0.75);
time = 10;
audio.resume();
approx(tick.currentBeat, pausedBeat); // Paused speed changes preserve musical position.
const beforeSeek = voices.length;
audio.seekToMeasure(2);
assert.equal(voices.length - beforeSeek, 1); // No notes from earlier measures replay.
audio.pause();
audio.seekToMeasure(100);
assert.equal(tick.currentMeasure, 2);
audio.stop();
assert.equal(timers.size, 0);
assert.equal(frames.size, 0);
time = 20;
audio.start(song, 1, 0, (state) => { tick = state; });
const beforeDelay = voices.length;
advance(21.5, false); // Simulate a long main-thread interruption.
assert.equal(voices.length - beforeDelay, 1);
approx(voices.at(-1).stoppedAt, 21.505 + 0.5 + 0.05);
advance(22.5);
audio.stop();
assert.equal(timers.size, 0);
assert.equal(frames.size, 0);
console.log('Playback timing: lookahead, delayed frames, pause/resume, paused tempo, seek, and cleanup passed.');
