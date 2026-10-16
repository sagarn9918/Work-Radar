import BlockedList from '../components/BlockedList.jsx';

export default function Blocked() {
  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="h1" style={{ marginTop: 0 }}>Who's Blocked</h1>
          <p className="sub">People first, not tickets. Longest wait at the top.</p>
        </div>
        <span className="mock-pill">Mock data</span>
      </header>
      <section className="card card-pad" aria-label="Blocked people">
        <BlockedList />
        <p className="small muted" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--hair)' }}>
          "Detected from chat" means the blocker was found in a message, not a ticket status. Check it before acting.
        </p>
      </section>
    </>
  );
}
