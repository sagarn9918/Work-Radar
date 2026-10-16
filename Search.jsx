import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../store.jsx';
import { ownerName } from '../components/ItemRow.jsx';
import { Search as SearchIcon, Close, Chevron } from '../components/Icons.jsx';

const SOURCES = ['Slack', 'Jira', 'GitHub', 'Email'];

export default function Search() {
  const { ranked, people, peopleById, state } = useApp();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const off = new Set((params.get('off') || '').split(',').filter(Boolean));
  const person = params.get('person') || '';

  const update = (next) => {
    const merged = { q, off: [...off].join(','), person, ...next };
    const clean = Object.fromEntries(Object.entries(merged).filter(([, v]) => v));
    setParams(clean, { replace: true });
  };
  const toggle = (s) => {
    const n = new Set(off);
    n.has(s) ? n.delete(s) : n.add(s);
    update({ off: [...n].join(',') });
  };

  const needle = q.trim().toLowerCase();
  const hits = ranked.filter((it) => {
    if (off.has(it.source)) return false;
    const names = [ownerName(it, peopleById), ...(it.peopleWaiting || []).map((p) => peopleById[p]?.name)].filter(Boolean);
    if (person && !names.includes(person)) return false;
    if (!needle) return true;
    return [it.title, it.ref, it.body, it.status, ...names].join(' ').toLowerCase().includes(needle);
  });
  const groups = SOURCES.map((s) => ({ name: s, items: hits.filter((h) => h.source === s) })).filter((g) => g.items.length);

  const statusTag = (it) => {
    if (state.done[it.id]) return { text: 'Done in WorkRadar', cls: 'tag-ok' };
    if (state.snoozed[it.id]) return { text: 'Snoozed', cls: 'tag-plain' };
    if (it.inFeed) return { text: `${it.band} · ${it.score}`, cls: { Urgent: 'tag-urgent', Today: 'tag-today', Later: 'tag-later' }[it.band] };
    return { text: it.status, cls: 'tag-plain' };
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="h1" style={{ marginTop: 0 }}>Search</h1>
          <p className="sub">One search across Slack, Jira, GitHub and Email</p>
        </div>
        <span className="mock-pill">Mock data</span>
      </header>

      <form role="search" className="search-box" onSubmit={(e) => e.preventDefault()}>
        <SearchIcon size={20} />
        <label htmlFor="q" className="sr-only">Search people, tickets, PRs and messages</label>
        <input
          id="q"
          type="search"
          value={q}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="Search people, tickets, PRs and messages"
          autoComplete="off"
        />
        {q && (
          <button type="button" className="btn btn-icon" style={{ width: 36, minHeight: 36, borderRadius: '50%', border: 0, background: 'var(--hair)' }} aria-label="Clear search" onClick={() => update({ q: '' })}>
            <Close size={12} />
          </button>
        )}
      </form>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <span id="src-label" className="small muted" style={{ marginRight: 4 }}>Sources</span>
        <div role="group" aria-labelledby="src-label" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SOURCES.map((s) => (
            <button key={s} type="button" className="pill-toggle" aria-pressed={!off.has(s)} onClick={() => toggle(s)}>
              {s}
            </button>
          ))}
        </div>
        <label className="select-wrap" style={{ marginLeft: 'auto' }}>
          <span className="sr-only">Filter by person</span>
          <select value={person} onChange={(e) => update({ person: e.target.value })} style={{ borderRadius: 999, minHeight: 40 }}>
            <option value="">Anyone</option>
            {people.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <Chevron size={12} />
        </label>
      </div>

      <p role="status" aria-live="polite" className="muted">
        {hits.length === 0
          ? 'No results'
          : `${hits.length} ${hits.length === 1 ? 'result' : 'results'}${needle ? ` for "${q.trim()}"` : ''} · grouped by source`}
      </p>

      {hits.length === 0 ? (
        <section className="card empty" aria-label="No results">
          <p className="h2-lg">{needle ? `No results for "${q.trim()}"` : 'No results'}</p>
          <p className="muted">Check the spelling, try a ticket ID like PAY-412, or turn more sources on.</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setParams({}, { replace: true })}>
            Reset filters
          </button>
        </section>
      ) : (
        groups.map((g) => (
          <section key={g.name} className="card" aria-label={`${g.name}, ${g.items.length} results`} style={{ padding: '8px 0' }}>
            <h2 className="h2" style={{ padding: '14px 24px 8px', fontSize: 15 }}>
              {g.name} <span className="muted" style={{ fontWeight: 500 }}>{g.items.length}</span>
            </h2>
            <ul className="feed">
              {g.items.map((it) => {
                const tag = statusTag(it);
                return (
                  <li key={it.id} style={{ borderTop: '1px solid var(--hair)' }}>
                    <Link to={`/item/${it.id}`} className="result-link">
                      <span style={{ flex: '1 1 320px', minWidth: 0 }}>
                        <span className="row-meta" style={{ display: 'block' }}>
                          {it.ref}
                          {it.source !== 'Email' && ownerName(it, peopleById) ? ` · ${ownerName(it, peopleById)}` : ''}
                        </span>
                        <span className="row-title" style={{ display: 'block' }}>{it.title}</span>
                      </span>
                      <span className={`tag ${tag.cls}`}>{tag.text}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
