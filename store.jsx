import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import data from './data/mockData.json';
import { rank } from './lib/scoring.js';
import { aiBrief, buildContext, rulesBrief, validateBrief, DEFAULT_MODEL } from './lib/brief.js';

// All user actions (Assign, Done, Snooze) stay inside WorkRadar, as the PRD scopes for the MVP.
// They are saved in the browser so a refresh keeps them; Settings > Reset clears them.

const STORAGE_KEY = 'workradar.v1';

const initialState = {
  done: {},
  snoozed: {},
  assigned: {},
  settings: { apiKey: '', model: DEFAULT_MODEL, simulate: { jiraDown: false, aiFail: false, empty: false } },
};

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return initialState;
    return {
      ...initialState,
      ...saved,
      settings: { ...initialState.settings, ...saved.settings, simulate: { ...initialState.settings.simulate, ...(saved.settings?.simulate || {}) } },
    };
  } catch {
    return initialState;
  }
}

function without(obj, key) {
  const next = { ...obj };
  delete next[key];
  return next;
}

function reducer(state, action) {
  switch (action.type) {
    case 'done':
      return { ...state, done: { ...state.done, [action.id]: true } };
    case 'snooze':
      return { ...state, snoozed: { ...state.snoozed, [action.id]: action.until } };
    case 'assign':
      return { ...state, assigned: { ...state.assigned, [action.id]: action.to } };
    case 'restore':
      return { ...state, done: without(state.done, action.id), snoozed: without(state.snoozed, action.id) };
    case 'unassign':
      return { ...state, assigned: without(state.assigned, action.id) };
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'simulate':
      return { ...state, settings: { ...state.settings, simulate: { ...state.settings.simulate, ...action.simulate } } };
    case 'reset':
      return { ...initialState, settings: { ...state.settings, simulate: initialState.settings.simulate } };
    default:
      return state;
  }
}

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [toast, setToast] = useState(null);
  const undoRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be blocked; the app still works for this session */
    }
  }, [state]);

  const peopleById = useMemo(() => Object.fromEntries(data.people.map((p) => [p.id, p])), []);
  const ranked = useMemo(() => rank(data.items), []);
  const byId = useMemo(() => Object.fromEntries(ranked.map((i) => [i.id, i])), [ranked]);

  const sim = state.settings.simulate;
  const open = useMemo(() => {
    if (sim.empty) return [];
    return ranked.filter(
      (i) => i.inFeed && !state.done[i.id] && !state.snoozed[i.id] && !(sim.jiraDown && i.source === 'Jira')
    );
  }, [ranked, state.done, state.snoozed, sim.empty, sim.jiraDown]);

  const showToast = useCallback((message, undo) => {
    clearTimeout(timerRef.current);
    undoRef.current = undo || null;
    setToast({ message, canUndo: !!undo, key: Date.now() });
    timerRef.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const undo = useCallback(() => {
    if (undoRef.current) undoRef.current();
    undoRef.current = null;
    clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const actions = useMemo(
    () => ({
      markDone(item) {
        dispatch({ type: 'done', id: item.id });
        showToast(`Marked done: ${item.title}`, () => dispatch({ type: 'restore', id: item.id }));
      },
      snooze(item, until) {
        dispatch({ type: 'snooze', id: item.id, until });
        showToast(`Snoozed ${until}: ${item.title}`, () => dispatch({ type: 'restore', id: item.id }));
      },
      assign(item, person) {
        const prev = state.assigned[item.id];
        dispatch({ type: 'assign', id: item.id, to: person });
        showToast(`Assigned to ${person}: ${item.title}`, () =>
          prev ? dispatch({ type: 'assign', id: item.id, to: prev }) : dispatch({ type: 'unassign', id: item.id })
        );
      },
      restore(item) {
        dispatch({ type: 'restore', id: item.id });
        showToast(`Back in your feed: ${item.title}`);
      },
      settings(settings) {
        dispatch({ type: 'settings', settings });
      },
      simulate(simulate) {
        dispatch({ type: 'simulate', simulate });
      },
      reset() {
        dispatch({ type: 'reset' });
        showToast('Demo data reset');
      },
    }),
    [showToast, state.assigned]
  );

  // ---- Brief (cached for the session; regenerated on request) ----
  const [brief, setBrief] = useState({ status: 'idle' });
  const briefRun = useRef(0);

  const generateBrief = useCallback(async () => {
    const run = ++briefRun.current;
    const items = open;
    const validIds = data.items.map((i) => i.id);
    const ctxArgs = { ranked: items, happened: data.happened, peopleById, meta: data.meta };
    const { apiKey, model } = state.settings;

    if (!apiKey && !sim.aiFail) {
      const { sections, dropped } = validateBrief(rulesBrief(ctxArgs), validIds);
      setBrief({ status: 'ready', mode: 'rules', sections, dropped, at: data.meta.syncedAt });
      return;
    }
    setBrief({ status: 'loading' });
    try {
      if (sim.aiFail) throw new Error('Simulated failure (Settings > Demo states).');
      const raw = await aiBrief({ apiKey, model, context: buildContext(ctxArgs) });
      if (run !== briefRun.current) return;
      const { sections, dropped } = validateBrief(raw, items.map((i) => i.id).concat(data.happened.map((h) => h.itemId).filter(Boolean)));
      setBrief({ status: 'ready', mode: 'ai', model, sections, dropped, at: 'Just now' });
    } catch (err) {
      if (run !== briefRun.current) return;
      setBrief({ status: 'error', error: err.message || 'Unknown error' });
    }
  }, [open, peopleById, state.settings, sim.aiFail]);

  // Write the brief on first load, and again whenever the key, model or a demo state changes.
  const generateRef = useRef(generateBrief);
  generateRef.current = generateBrief;
  const { apiKey, model } = state.settings;
  const briefKey = [apiKey, model, sim.aiFail, sim.empty, sim.jiraDown].join('|');
  useEffect(() => {
    generateRef.current();
  }, [briefKey]);

  const showRulesBrief = useCallback(() => {
    const ctxArgs = { ranked: open, happened: data.happened, peopleById, meta: data.meta };
    const { sections, dropped } = validateBrief(rulesBrief(ctxArgs), data.items.map((i) => i.id));
    setBrief({ status: 'ready', mode: 'rules', sections, dropped, at: data.meta.syncedAt });
  }, [open, peopleById]);

  const value = {
    data,
    meta: data.meta,
    people: data.people,
    peopleById,
    ranked,
    byId,
    open,
    state,
    actions,
    toast,
    undo,
    brief,
    generateBrief,
    showRulesBrief,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
