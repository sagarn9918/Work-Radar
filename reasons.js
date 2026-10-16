// Reason lines and the Who's Blocked list, built from the same signals as the score.
// The reason line is deterministic on purpose: it can never say something the
// score does not reflect. (Trade-off documented in the README.)

export function firstName(person) {
  return person ? person.name.split(' ')[0] : '';
}

export function joinNames(names) {
  if (names.length <= 1) return names.join('');
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

export function duration(hours) {
  if (hours >= 16) return '2 days';
  if (hours >= 8) return '1 day';
  if (hours <= 1) return '1 hour';
  return `${Math.round(hours)} hours`;
}

export function deadlineText(d) {
  if (d === null || d === undefined) return null;
  if (d < 0) return 'overdue';
  if (d === 0) return 'due today';
  if (d === 1) return 'due tomorrow';
  if (d <= 3) return `due in ${d} days`;
  return null;
}

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function reasonLine(item, peopleById) {
  const names = (item.peopleWaiting || []).map((id) => firstName(peopleById[id]));
  const blocking = names.length ? `blocking ${joinNames(names)} for ${duration(item.waitHours || 0)}` : null;
  const deadline = deadlineText(item.dueInDays);
  const needs = item.needsManager ? item.needsReason || 'needs you' : null;

  const urgentDeadline = item.dueInDays !== null && item.dueInDays !== undefined && item.dueInDays <= 0;
  const parts = urgentDeadline ? [deadline, blocking, needs] : [blocking, deadline, needs];
  const line = parts.filter(Boolean).join(' · ');
  return cap(line) || 'No deadline and no one waiting';
}

// People who are waiting, across all open items. One row per person (people,
// not tickets): their longest wait is shown, plus a count of anything else.
export function blockedPeople(openItems, peopleById) {
  const byPerson = new Map();
  for (const item of openItems) {
    for (const pid of item.peopleWaiting || []) {
      const person = peopleById[pid];
      if (!person) continue;
      const entry = {
        person,
        item,
        waitingOn: item.waitingOn || 'Waiting',
        waitHours: item.waitHours || 0,
        fromChat: (item.detectedFromChat || []).includes(pid),
      };
      const prev = byPerson.get(pid);
      if (!prev) byPerson.set(pid, { ...entry, others: 0 });
      else if (entry.waitHours > prev.waitHours) byPerson.set(pid, { ...entry, others: prev.others + 1 });
      else prev.others += 1;
    }
  }
  // Longest wait first; ties go to the more urgent item, then by name.
  return [...byPerson.values()].sort(
    (a, b) =>
      b.waitHours - a.waitHours ||
      (b.item.score ?? 0) - (a.item.score ?? 0) ||
      a.person.name.localeCompare(b.person.name)
  );
}
