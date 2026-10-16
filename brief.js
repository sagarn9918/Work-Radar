// The daily brief: four sections, every sentence tied to source items.
//
// Two ways to produce it:
//   1. aiBrief()    — calls Claude (if the user supplies an API key in Settings).
//   2. rulesBrief() — a deterministic fallback built from the same data.
// Both go through validateBrief(), which enforces the PRD guardrail
// "citation or drop": a sentence with no valid source is removed before display.

import { reasonLine, blockedPeople, joinNames, firstName } from './reasons.js';

export const SECTIONS = [
  { key: 'top', title: 'Top work' },
  { key: 'happened', title: 'What happened' },
  { key: 'attention', title: 'Needs your attention' },
  { key: 'blocked', title: "Who's blocked" },
];

export const DEFAULT_MODEL = 'claude-haiku-5-5';

const prose = (s) => s.replace(/ · /g, ', ');

// ---- Guardrail -------------------------------------------------------------

export function validateBrief(raw, validIds) {
  const ids = new Set(validIds);
  let dropped = 0;
  const sections = SECTIONS.map(({ key, title }) => {
    const list = Array.isArray(raw?.[key]) ? raw[key] : [];
    const sentences = [];
    for (const s of list) {
      const text = typeof s?.text === 'string' ? s.text.trim() : '';
      const sources = Array.isArray(s?.sources) ? s.sources.filter((id) => ids.has(id)) : [];
      if (!text || sources.length === 0) {
        dropped += 1;
        continue;
      }
      sentences.push({ text, sources: [...new Set(sources)] });
    }
    return { key, title, sentences };
  });
  return { sections, dropped };
}

// ---- Context sent to the model (only what the brief may use) ---------------

export function buildContext({ ranked, happened, peopleById, meta }) {
  const open = ranked.filter((i) => i.inFeed);
  return {
    today: meta.todayLabel,
    team: meta.team,
    items: open.map((i) => ({
      id: i.id,
      source: i.source,
      ref: i.ref,
      title: i.title,
      band: i.band,
      score: i.score,
      reason: reasonLine(i, peopleById),
      needsManager: !!i.needsManager,
      peopleWaiting: (i.peopleWaiting || []).map((p) => peopleById[p]?.name).filter(Boolean),
    })),
    happened: happened.filter((h) => h.itemId).map((h) => ({ when: h.when, text: h.text, id: h.itemId })),
  };
}

// ---- Rule-based fallback ---------------------------------------------------

export function rulesBrief({ ranked, happened, peopleById }) {
  const open = ranked.filter((i) => i.inFeed);
  const raw = { top: [], happened: [], attention: [], blocked: [] };

  const top = open[0];
  if (top) {
    raw.top.push({
      text: `Start with ${top.ref}, "${top.title}". ${prose(reasonLine(top, peopleById))}.`,
      sources: [top.id],
    });
  }

  for (const h of happened.filter((x) => x.itemId).slice(0, 3)) {
    raw.happened.push({ text: `${h.text}.`, sources: [h.itemId] });
  }

  for (const it of open.filter((i) => i.needsManager && i.id !== top?.id).slice(0, 2)) {
    const reason = prose(reasonLine(it, peopleById));
    const title = it.title.replace(/[?.]$/, '');
    raw.attention.push({ text: `${title}: ${reason[0].toLowerCase()}${reason.slice(1)}.`, sources: [it.id] });
  }

  const rows = blockedPeople(open, peopleById);
  if (rows.length) {
    const byItem = new Map();
    for (const r of rows) {
      if (!byItem.has(r.item.id)) byItem.set(r.item.id, { item: r.item, names: [] });
      byItem.get(r.item.id).names.push(firstName(r.person));
    }
    const groups = [...byItem.values()];
    const parts = groups.map((g) => `${joinNames(g.names)} on ${g.item.ref}`);
    raw.blocked.push({
      text: `${rows.length} ${rows.length === 1 ? 'person is' : 'people are'} waiting: ${parts.join('; ')}.`,
      sources: groups.map((g) => g.item.id),
    });
  }

  return raw;
}

// ---- AI (Claude) -----------------------------------------------------------

export const SYSTEM_PROMPT = `You write a busy engineering manager's morning brief.
Rules:
- Use ONLY the items and events in the JSON you are given. Never invent people, numbers, dates or events.
- Every sentence must list the ids of the items it is based on in "sources".
- Four sections: top (the single most important piece of work), happened (what changed since yesterday), attention (what needs the manager personally), blocked (who is waiting and on what).
- At most 2 sentences per section and under 120 words in total. Plain, direct English. No emoji, no headings.
- Respond with JSON only, in exactly this shape:
{"top":[{"text":"...","sources":["id"]}],"happened":[...],"attention":[...],"blocked":[...]}`;

export function parseModelJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('The model did not return JSON.');
  return JSON.parse(text.slice(start, end + 1));
}

export async function aiBrief({ apiKey, model = DEFAULT_MODEL, context, signal }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // Needed for calls made straight from a browser. Fine for a local demo;
      // in production the call would go through a small server so the key stays private.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Today's data:\n${JSON.stringify(context)}` }],
    }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error?.message || '';
    } catch {
      /* ignore */
    }
    throw new Error(`Claude API error ${res.status}${detail ? `: ${detail}` : ''}`);
  }
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  return parseModelJson(text);
}
