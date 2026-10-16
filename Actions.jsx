import { useApp } from '../store.jsx';
import { Chevron } from './Icons.jsx';

export const SNOOZE_OPTIONS = [
  { value: 'for 2 hours', label: 'For 2 hours' },
  { value: 'until tomorrow, 9:00 AM', label: 'Until tomorrow' },
  { value: 'until next Monday', label: 'Until next week' },
];

// Assign · Done · Snooze. Native controls, so keyboard and screen readers work out of the box.
export default function Actions({ item, primaryDone = false }) {
  const { people, actions, state } = useApp();
  const done = !!state.done[item.id];
  const snoozed = state.snoozed[item.id];

  if (done || snoozed) {
    return (
      <div className="row-actions">
        <span className={`tag ${done ? 'tag-ok' : 'tag-plain'}`}>{done ? 'Done' : `Snoozed ${snoozed}`}</span>
        <button type="button" className="btn" onClick={() => actions.restore(item)} aria-label={`Move back to feed: ${item.title}`}>
          Move back to feed
        </button>
      </div>
    );
  }

  return (
    <div className="row-actions">
      {primaryDone && (
        <button type="button" className="btn btn-primary" onClick={() => actions.markDone(item)}>
          Mark done
        </button>
      )}
      <label className="select-wrap">
        <span className="sr-only">Assign {item.title} to</span>
        <select
          value=""
          onChange={(e) => e.target.value && actions.assign(item, e.target.value)}
        >
          <option value="">Assign</option>
          {people.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <Chevron size={12} />
      </label>
      {!primaryDone && (
        <button type="button" className="btn" onClick={() => actions.markDone(item)} aria-label={`Mark done: ${item.title}`}>
          Done
        </button>
      )}
      <label className="select-wrap">
        <span className="sr-only">Snooze {item.title}</span>
        <select value="" onChange={(e) => e.target.value && actions.snooze(item, e.target.value)}>
          <option value="">Snooze</option>
          {SNOOZE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Chevron size={12} />
      </label>
    </div>
  );
}
