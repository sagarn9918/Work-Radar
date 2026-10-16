// Priority score, as specified in the PRD (Appendix A2).
//
//   P = 30·B + 25·W + 25·D + 20·M      (0 ≤ P ≤ 100)
//
// B  Blocking   people waiting on the item: one third per person, capped at 1
// W  Wait time  0 under 2 working hours, rising linearly to 1 at 2 working days (16 h)
// D  Deadline   1 = due today or overdue, 0.5 = due within 3 days, else 0
// M  Needs me   1 = only the manager can unblock it, else 0
//
// Weights are the PRD's starting assumptions. The AI never changes a score;
// it only explains it.

export const WEIGHTS = { blocking: 30, wait: 25, deadline: 25, needsMe: 20 };
export const BANDS = { urgent: 70, today: 40 };

const clamp01 = (x) => Math.max(0, Math.min(1, x));

export function factors(item) {
  const people = (item.peopleWaiting || []).length;
  const B = Math.min(people, 3) / 3; // one third per person, capped at 3 people
  const W = clamp01(((item.waitHours || 0) - 2) / 14);
  const d = item.dueInDays;
  const D = d === null || d === undefined ? 0 : d <= 0 ? 1 : d <= 3 ? 0.5 : 0;
  const M = item.needsManager ? 1 : 0;
  return { B, W, D, M };
}

export function breakdown(item) {
  const f = factors(item);
  return [
    { key: 'blocking', label: 'Blocking people', value: round1(f.B * WEIGHTS.blocking), max: WEIGHTS.blocking },
    { key: 'wait', label: 'Wait time', value: round1(f.W * WEIGHTS.wait), max: WEIGHTS.wait },
    { key: 'deadline', label: 'Deadline', value: round1(f.D * WEIGHTS.deadline), max: WEIGHTS.deadline },
    { key: 'needsMe', label: 'Needs you', value: round1(f.M * WEIGHTS.needsMe), max: WEIGHTS.needsMe },
  ];
}

export function rawScore(item) {
  const f = factors(item);
  return f.B * WEIGHTS.blocking + f.W * WEIGHTS.wait + f.D * WEIGHTS.deadline + f.M * WEIGHTS.needsMe;
}

export function score(item) {
  // Round half up so 77.5 shows as 78 and 12.5 as 13.
  return Math.floor(rawScore(item) + 0.5 + 1e-9);
}

export function band(s) {
  if (s >= BANDS.urgent) return 'Urgent';
  if (s >= BANDS.today) return 'Today';
  return 'Later';
}

export function rank(items) {
  return items
    .map((it) => ({ ...it, score: score(it), band: band(score(it)) }))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

function round1(x) {
  return Math.round(x * 10) / 10;
}
