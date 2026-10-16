import { useState } from 'react';
import { useApp } from '../store.jsx';
import { Chevron } from '../components/Icons.jsx';

// Set when built for the online demo, where the browser cannot reach the Claude API.
const HOSTED = import.meta.env.VITE_HOSTED === 'true';

const MODELS = [
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 (fastest)' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5' },
];

export default function Settings() {
  const { state, actions } = useApp();
  const { apiKey, model, simulate } = state.settings;
  const [draft, setDraft] = useState('');
  const [msg, setMsg] = useState('');

  const save = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    actions.settings({ apiKey: draft.trim() });
    setDraft('');
    setMsg('Key saved. The brief on the Today page will now be written by Claude.');
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="h1" style={{ marginTop: 0 }}>Settings</h1>
          <p className="sub">AI brief and demo controls</p>
        </div>
      </header>

      <section className="card card-pad" aria-labelledby="ai-h" style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 760 }}>
        <div>
          <h2 id="ai-h" className="h2">AI brief</h2>
          <p className="small muted" style={{ marginTop: 6, lineHeight: 1.55 }}>
            Without a key, the brief is rule-based and labelled that way. With an Anthropic API key, Claude writes it from the
            same mock items, and any sentence without a valid source is removed before display.
          </p>
        </div>

        {HOSTED ? (
          <p className="small" style={{ background: 'var(--butter)', borderRadius: 12, padding: '12px 14px', lineHeight: 1.5 }}>
            This online demo cannot reach the Claude API, so the brief is rule-based here. To see the AI-written brief, run the
            app on your own computer (see the README) and add an API key.
          </p>
        ) : apiKey ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            <span className="tag tag-ok">Key added · ends in {apiKey.slice(-4)}</span>
            <button type="button" className="btn" onClick={() => { actions.settings({ apiKey: '' }); setMsg('Key removed. The brief is rule-based again.'); }}>
              Remove key
            </button>
          </div>
        ) : (
          <form onSubmit={save} className="field">
            <label htmlFor="key">Anthropic API key</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <input id="key" type="password" autoComplete="off" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="sk-ant-…" style={{ flex: '1 1 280px' }} aria-describedby="key-note" />
              <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>Save key</button>
            </div>
            <p id="key-note" className="xs muted">
              Stored only in this browser and sent only to api.anthropic.com. For a local demo only; a production build would keep the key on a server.
            </p>
          </form>
        )}

        <div className="field">
          <label htmlFor="model">Model</label>
          <span className="select-wrap" style={{ alignSelf: 'flex-start' }}>
            <select id="model" value={model} onChange={(e) => actions.settings({ model: e.target.value })}>
              {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <Chevron size={12} />
          </span>
        </div>
        <p role="status" aria-live="polite" className="small">{msg}</p>
      </section>

      <section className="card card-pad" aria-labelledby="demo-h" style={{ maxWidth: 760 }}>
        <h2 id="demo-h" className="h2">Demo states</h2>
        <p className="small muted" style={{ marginTop: 6, marginBottom: 8 }}>Turn these on to show the empty and error states.</p>
        {[
          { key: 'jiraDown', label: 'Jira is not responding', hint: 'Shows the source-unavailable banner and hides Jira items.' },
          { key: 'aiFail', label: 'AI summary fails', hint: 'Shows the summary-unavailable state; the feed keeps working.' },
          { key: 'empty', label: 'Empty feed', hint: "Shows the \"You're all caught up\" state." },
        ].map((t) => (
          <div key={t.key} className="switch-row">
            <label htmlFor={`sim-${t.key}`} style={{ flex: 1 }}>
              <span style={{ display: 'block', fontWeight: 600 }}>{t.label}</span>
              <span className="small muted">{t.hint}</span>
            </label>
            <input id={`sim-${t.key}`} type="checkbox" role="switch" checked={!!simulate[t.key]} onChange={(e) => actions.simulate({ [t.key]: e.target.checked })} />
          </div>
        ))}
        <div className="switch-row">
          <div style={{ flex: 1 }}>
            <span style={{ display: 'block', fontWeight: 600 }}>Reset demo data</span>
            <span className="small muted">Clears Done, Snooze and Assign actions.</span>
          </div>
          <button type="button" className="btn" onClick={actions.reset}>Reset</button>
        </div>
      </section>
    </>
  );
}
