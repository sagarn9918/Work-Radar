import { Link, useParams } from 'react-router-dom';
import { useApp } from '../store.jsx';
import { breakdown } from '../lib/scoring.js';
import { reasonLine, duration } from '../lib/reasons.js';
import { bandClass, ownerName } from '../components/ItemRow.jsx';
import Actions from '../components/Actions.jsx';
import { Avatar } from '../components/BlockedList.jsx';
import { Back, External, SourceIcon } from '../components/Icons.jsx';

export default function Detail() {
  const { id } = useParams();
  const { byId, peopleById, state, meta } = useApp();
  const item = byId[id];

  if (!item) {
    return (
      <section className="card empty">
        <h1 className="h2-lg">We can't find that item</h1>
        <p className="muted">It may have been removed from its source.</p>
        <Link className="btn btn-primary" to="/feed" style={{ marginTop: 12 }}>Go to Priority Feed</Link>
      </section>
    );
  }

  const rows = breakdown(item);
  const owner = ownerName(item, peopleById);
  const waiting = (item.peopleWaiting || []).map((p) => peopleById[p]).filter(Boolean);
  const assigned = state.assigned[item.id];

  return (
    <>
      <Link to="/feed" className="btn" style={{ alignSelf: 'flex-start', border: 0, background: 'transparent', paddingLeft: 0 }}>
        <Back size={16} />
        Priority Feed
      </Link>

      <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <span className={`tag ${bandClass(item.band)}`}>{item.band} · score {item.score}</span>
          {item.needsManager && <span className="tag tag-needs">Needs you</span>}
          {assigned && <span className="tag tag-ok">Assigned to {assigned}</span>}
          <span className="xs muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <SourceIcon source={item.source} />
            {item.source} · {item.ref}
          </span>
          <span className="mock-pill" style={{ marginLeft: 'auto' }}>Mock data</span>
        </div>
        <h1 className="h1" style={{ marginTop: 0, fontSize: 34 }}>{item.title}</h1>
        <p className="muted">
          {owner ? `Owner: ${owner}` : ''}
          {item.status ? ` · ${item.status}` : ''}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Actions item={item} primaryDone />
          <a className="btn" href={item.url} target="_blank" rel="noopener noreferrer">
            Open in {item.source}
            <External size={14} />
            <span className="sr-only">(opens in a new tab; mock link to the tool's home page)</span>
          </a>
        </div>
      </header>

      <div className="split">
        <div className="wide" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section className="card card-pad" aria-labelledby="why-h">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              <h2 id="why-h" className="h2-lg" style={{ fontSize: 20 }}>Why this is here</h2>
              <span className="tag tag-plain">Built from the score factors</span>
            </div>
            <p style={{ marginTop: 12, fontSize: 17, lineHeight: 1.55 }}>{reasonLine(item, peopleById)}.</p>
            <h3 className="small muted" style={{ margin: '22px 0 12px', fontWeight: 600 }}>Score breakdown · {item.score} of 100</h3>
            <ul className="bars">
              {rows.map((r) => (
                <li key={r.key} className="bar-row">
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{r.label}</div>
                  <div className="bar-track" aria-hidden="true">
                    <div className="bar-fill" style={{ width: `${(r.value / r.max) * 100}%` }} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>{r.value}</strong> of {r.max}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="card card-pad" aria-labelledby="src-h">
            <h2 id="src-h" className="h2-lg" style={{ fontSize: 20, marginBottom: 12 }}>From the source</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6 }}>{item.body}</p>
            {item.facts?.length > 0 && (
              <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {item.facts.map((f) => <li key={f} className="chip">{f}</li>)}
              </ul>
            )}
          </section>

          <section className="card card-pad" aria-labelledby="tl-h">
            <h2 id="tl-h" className="h2-lg" style={{ fontSize: 20, marginBottom: 16 }}>Timeline across tools</h2>
            <ol className="timeline">
              {item.timeline.map((t, i) => (
                <li key={i} className="tl-item">
                  <span className="small muted">{t.when}</span>
                  <span className="tl-dot" aria-hidden="true"><span /><span /></span>
                  <span>
                    <strong>{t.source}</strong> · {t.text}
                    {t.detected && <em className="muted"> · detected blocker</em>}
                  </span>
                </li>
              ))}
              <li className="tl-item">
                <span className="small muted">Thu, {meta.syncedAt}</span>
                <span className="tl-dot" aria-hidden="true"><span /><span /></span>
                <span><strong>WorkRadar</strong> · Ranked {item.band}, score {item.score}</span>
              </li>
            </ol>
          </section>
        </div>

        <div className="narrow">
          <section className="card card-pad" aria-labelledby="ppl-h" style={{ padding: '22px 24px' }}>
            <h2 id="ppl-h" className="h2" style={{ marginBottom: 16 }}>People</h2>
            <ul className="people">
              {item.owner && peopleById[item.owner] && (
                <li className="person">
                  <Avatar person={peopleById[item.owner]} />
                  <div>
                    <div className="person-name">{peopleById[item.owner].name}</div>
                    <div className="person-sub">
                      {waiting.some((p) => p.id === item.owner) ? `Owner · waiting ${duration(item.waitHours)}` : 'Owner'}
                    </div>
                  </div>
                </li>
              )}
              {waiting.filter((p) => p.id !== item.owner).map((p) => (
                <li key={p.id} className="person">
                  <Avatar person={p} />
                  <div><div className="person-name">{p.name}</div><div className="person-sub">Waiting {duration(item.waitHours)}</div></div>
                </li>
              ))}
              {item.needsManager && (
                <li className="person">
                  <Avatar person={{ initials: meta.manager.initials, tint: 'var(--ground)' }} />
                  <div><div className="person-name">You</div><div className="person-sub">{item.needsReason ? item.needsReason[0].toUpperCase() + item.needsReason.slice(1) : 'Needed'}</div></div>
                </li>
              )}
            </ul>
          </section>

          {item.related?.length > 0 && (
            <section className="card card-pad" aria-labelledby="rel-h" style={{ padding: '22px 24px' }}>
              <h2 id="rel-h" className="h2" style={{ marginBottom: 12 }}>Related across tools</h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {item.related.map((rid) => byId[rid]).filter(Boolean).map((r) => (
                  <li key={r.id}>
                    <Link to={`/item/${r.id}`} style={{ display: 'block', padding: '10px 0', textDecoration: 'none' }}>
                      <span className="xs muted" style={{ display: 'block' }}>{r.source} · {r.ref} · {r.status}</span>
                      <span style={{ display: 'block', fontWeight: 600 }}>{r.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
