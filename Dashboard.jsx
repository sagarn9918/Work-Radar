import { Link } from 'react-router-dom';
import { useApp } from '../store.jsx';
import { blockedPeople } from '../lib/reasons.js';
import BriefCard from '../components/BriefCard.jsx';
import ItemRow from '../components/ItemRow.jsx';
import BlockedList from '../components/BlockedList.jsx';
import { Search, Check } from '../components/Icons.jsx';

export default function Dashboard() {
  const { meta, open, peopleById, data, byId } = useApp();
  const urgent = open.filter((i) => i.band === 'Urgent').length;
  const needs = open.filter((i) => i.needsManager).length;
  const blocked = blockedPeople(open, peopleById).length;
  const top = open.slice(0, 5);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">{meta.todayLabel} · {meta.team} team</p>
          <h1 className="h1">Good morning, {meta.manager.name}</h1>
        </div>
        <div className="head-tools">
          <Link to="/search" className="btn" style={{ width: 280, maxWidth: '100%', color: 'var(--ink-2)' }}>
            <Search size={16} />
            Search people, tickets, PRs
          </Link>
          <span className="small muted">Synced {meta.syncedAt}</span>
          <span className="mock-pill">Mock data</span>
        </div>
      </header>

      <BriefCard />

      <ul className="stats" aria-label="At a glance">
        <li className="stat" style={{ background: 'var(--rose)' }}>
          <Link to="/feed?view=urgent"><span className="stat-label">Urgent</span><span className="stat-num">{urgent}</span></Link>
        </li>
        <li className="stat" style={{ background: 'var(--lavender)' }}>
          <Link to="/feed?view=needs"><span className="stat-label">Needs me</span><span className="stat-num">{needs}</span></Link>
        </li>
        <li className="stat" style={{ background: 'var(--peach)' }}>
          <Link to="/blocked"><span className="stat-label">People blocked</span><span className="stat-num">{blocked}</span></Link>
        </li>
        <li className="stat" style={{ background: 'var(--mint)' }}>
          <div><span className="stat-label">Closed since yesterday</span><span className="stat-num">{data.stats.closedSinceYesterday}</span></div>
        </li>
      </ul>

      <div className="split">
        <section className="card wide" aria-labelledby="top-h" style={{ paddingBottom: 6 }}>
          <div className="card-head">
            <h2 id="top-h" className="h2">Top priorities</h2>
            {open.length > 0 && <Link to="/feed" className="small" style={{ fontWeight: 500 }}>See all {open.length}</Link>}
          </div>
          {top.length === 0 ? (
            <div className="empty">
              <span className="empty-icon" style={{ background: 'var(--mint)' }} aria-hidden="true"><Check size={28} /></span>
              <p className="h2-lg">You're all caught up</p>
              <p className="muted">Nothing needs you right now. WorkRadar checks your tools again at {meta.nextSyncAt}.</p>
            </div>
          ) : (
            <ol className="feed">
              {top.map((item) => (
                <li key={item.id}><ItemRow item={item} /></li>
              ))}
            </ol>
          )}
        </section>

        <div className="narrow">
          <section className="card card-pad" aria-labelledby="blk-h" style={{ padding: '22px 24px' }}>
            <h2 id="blk-h" className="h2" style={{ marginBottom: 16 }}>Who's blocked</h2>
            <BlockedList />
          </section>
          <section className="card card-pad" aria-labelledby="hap-h" style={{ padding: '22px 24px' }}>
            <h2 id="hap-h" className="h2" style={{ marginBottom: 16 }}>What happened</h2>
            <ul className="people" style={{ gap: 14 }}>
              {data.happened.map((h, i) => (
                <li key={i} style={{ display: 'flex', gap: 12 }}>
                  <span className="small muted" style={{ width: 76, flex: 'none' }}>{h.when}</span>
                  {h.itemId && byId[h.itemId] ? <Link to={`/item/${h.itemId}`}>{h.text}</Link> : <span>{h.text}</span>}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
