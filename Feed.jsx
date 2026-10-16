import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../store.jsx';
import ItemRow from '../components/ItemRow.jsx';
import { Check } from '../components/Icons.jsx';

const VIEWS = [
  { key: 'all', label: 'All' },
  { key: 'needs', label: 'Needs me' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'snoozed', label: 'Snoozed' },
  { key: 'done', label: 'Done' },
];

export default function Feed() {
  const { open, ranked, state, meta } = useApp();
  const [params, setParams] = useSearchParams();
  const view = VIEWS.some((v) => v.key === params.get('view')) ? params.get('view') : 'all';

  const lists = {
    all: open,
    needs: open.filter((i) => i.needsManager),
    urgent: open.filter((i) => i.band === 'Urgent'),
    snoozed: ranked.filter((i) => state.snoozed[i.id]),
    done: ranked.filter((i) => state.done[i.id]),
  };
  const items = lists[view];

  const empty = {
    all: { title: "You're all caught up", body: `Nothing needs you right now. WorkRadar checks your tools again at ${meta.nextSyncAt}.` },
    needs: { title: 'Nothing is waiting on you', body: 'No reviews, approvals or direct questions right now.' },
    urgent: { title: 'Nothing urgent', body: 'No item scores 70 or more right now.' },
    snoozed: { title: 'No snoozed items', body: 'Items you snooze appear here until they return.' },
    done: { title: 'Nothing marked done yet', body: 'Items you mark done appear here, so you can undo.' },
  }[view];

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="h1" style={{ marginTop: 0 }}>Priority Feed</h1>
          <p className="sub">Ranked by cost of delay · synced {meta.syncedAt}</p>
        </div>
        <span className="mock-pill">Mock data</span>
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div className="seg" role="group" aria-label="Filter the feed">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              aria-pressed={view === v.key}
              onClick={() => setParams(v.key === 'all' ? {} : { view: v.key })}
            >
              {v.label}{' '}
              <span className="count">{lists[v.key].length}</span>
            </button>
          ))}
        </div>
        <details className="card" style={{ padding: '0 16px', maxWidth: 520, border: '1px solid var(--line)', boxShadow: 'none', borderRadius: 12 }}>
          <summary style={{ minHeight: 42, display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>How ranking works</summary>
          <p className="small muted" style={{ paddingBottom: 14, lineHeight: 1.55 }}>
            Score out of 100 = Blocking people (30) + Wait time (25) + Deadline (25) + Needs you (20). Urgent is 70 or more,
            Today 40 to 69, Later under 40. The reason line is built from the same factors, so it always matches the score.
          </p>
        </details>
      </div>

      <section className="card" aria-labelledby="feed-h" style={{ padding: '4px 0' }}>
        <h2 id="feed-h" className="sr-only">{VIEWS.find((v) => v.key === view).label} items</h2>
        {items.length === 0 ? (
          <div className="empty">
            <span className="empty-icon" style={{ background: 'var(--mint)' }} aria-hidden="true"><Check size={28} /></span>
            <p className="h2-lg">{empty.title}</p>
            <p className="muted">{empty.body}</p>
            {view !== 'all' && <Link className="btn" to="/feed" style={{ marginTop: 12 }}>Show all items</Link>}
          </div>
        ) : (
          <ol className="feed">
            {items.map((item, i) => (
              <li key={item.id} style={i === 0 ? { marginTop: -1 } : undefined}>
                <ItemRow item={item} />
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
