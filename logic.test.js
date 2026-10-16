// Run with: npm test   (uses Node's built-in test runner, no extra packages)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { score, band, rank, breakdown } from './scoring.js';
import { reasonLine, blockedPeople } from './reasons.js';
import { validateBrief, rulesBrief, parseModelJson } from './brief.js';

const data = JSON.parse(readFileSync(new URL('../data/mockData.json', import.meta.url), 'utf8'));
const peopleById = Object.fromEntries(data.people.map((p) => [p.id, p]));
const byId = Object.fromEntries(data.items.map((i) => [i.id, i]));

test('scores match the PRD worked example and the designs', () => {
  const expected = { pr318: 78, pay398: 70, fin: 58, pay405: 48, tara: 46, pay417: 33, pr322: 31, 'slk-alerts': 17, pay420: 13, vend: 13 };
  for (const [id, s] of Object.entries(expected)) assert.equal(score(byId[id]), s, id);
});

test('bands follow the thresholds', () => {
  assert.equal(band(70), 'Urgent');
  assert.equal(band(69), 'Today');
  assert.equal(band(40), 'Today');
  assert.equal(band(39), 'Later');
});

test('breakdown adds up to the raw score', () => {
  const total = breakdown(byId.pr318).reduce((s, r) => s + r.value, 0);
  assert.ok(Math.abs(total - 77.5) < 0.2);
});

test('feed is sorted by score, highest first', () => {
  const ranked = rank(data.items.filter((i) => i.inFeed));
  for (let i = 1; i < ranked.length; i++) assert.ok(ranked[i - 1].score >= ranked[i].score);
  assert.equal(ranked[0].id, 'pr318');
});

test('reason lines are built from the score factors', () => {
  assert.equal(reasonLine(byId.pr318, peopleById), 'Blocking Ravi and Ana for 2 days · due tomorrow · needs your review');
  assert.equal(reasonLine(byId.pay398, peopleById), 'Overdue · blocking Sam and Lena for 2 days');
  assert.equal(reasonLine(byId.fin, peopleById), 'Due today · asked you directly');
});

test("who's blocked lists people, not tickets", () => {
  const rows = blockedPeople(data.items.filter((i) => i.inFeed), peopleById);
  const names = rows.map((r) => r.person.name);
  assert.ok(names.includes('Ravi Kumar') && names.includes('Tara Nair'));
  assert.equal(rows.length, 6); // Sam waits on two items but is listed once
  assert.equal(rows.find((r) => r.person.id === 'sam').others, 1);
});

test('guardrail drops sentences without a valid source', () => {
  const raw = {
    top: [{ text: 'Grounded', sources: ['pr318'] }, { text: 'Made up', sources: ['nope'] }],
    happened: [{ text: 'No sources at all' }],
    attention: [],
    blocked: [{ text: 'Mixed', sources: ['nope', 'pay398'] }],
  };
  const { sections, dropped } = validateBrief(raw, ['pr318', 'pay398']);
  assert.equal(dropped, 2);
  assert.equal(sections[0].sentences.length, 1);
  assert.deepEqual(sections[3].sentences[0].sources, ['pay398']);
});

test('rule-based brief fills all four sections with sourced sentences', () => {
  const ranked = rank(data.items);
  const raw = rulesBrief({ ranked, happened: data.happened, peopleById });
  const { sections, dropped } = validateBrief(raw, data.items.map((i) => i.id));
  assert.equal(dropped, 0);
  for (const s of sections) assert.ok(s.sentences.length > 0, s.key);
});

test('model JSON is parsed even with text around it', () => {
  assert.deepEqual(parseModelJson('Here you go:\n{"top":[]}\n'), { top: [] });
  assert.throws(() => parseModelJson('no json here'));
});
