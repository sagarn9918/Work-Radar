import { Link } from 'react-router-dom';
import { useApp } from '../store.jsx';
import { blockedPeople, duration } from '../lib/reasons.js';

export function Avatar({ person }) {
  return (
    <span className="avatar" aria-hidden="true" style={{ background: person.tint }}>
      {person.initials}
    </span>
  );
}

export default function BlockedList({ limit }) {
  const { open, peopleById } = useApp();
  const rows = blockedPeople(open, peopleById);
  const shown = limit ? rows.slice(0, limit) : rows;

  if (rows.length === 0) {
    return <p className="small muted">No one is waiting on anything right now.</p>;
  }
  return (
    <ul className="people">
      {shown.map((r) => (
        <li key={r.person.id} className="person">
          <Avatar person={r.person} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="person-name">{r.person.name}</div>
            <div className="person-sub">
              {r.waitingOn} · <Link to={`/item/${r.item.id}`}>{r.item.ref}</Link>
              {r.fromChat && <em> · detected from chat</em>}
              {r.others > 0 && ` · +${r.others} more`}
            </div>
          </div>
          <span className="wait">{duration(r.waitHours)}</span>
        </li>
      ))}
    </ul>
  );
}
