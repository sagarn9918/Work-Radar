import { Link } from 'react-router-dom';
import { useApp } from '../store.jsx';
import { reasonLine } from '../lib/reasons.js';
import { SourceIcon } from './Icons.jsx';
import Actions from './Actions.jsx';

export const bandClass = (band) => ({ Urgent: 'tag-urgent', Today: 'tag-today', Later: 'tag-later' })[band];

export function ScoreBox({ item }) {
  return (
    <div className="score-box">
      <span className={`tag ${bandClass(item.band)}`}>{item.band}</span>
      <span className="score-num">
        <span className="sr-only">Priority score </span>
        {item.score}
        <span className="sr-only"> of 100</span>
      </span>
    </div>
  );
}

export function ownerName(item, peopleById) {
  return item.owner ? peopleById[item.owner]?.name : item.ownerLabel;
}

export default function ItemRow({ item }) {
  const { peopleById, state } = useApp();
  const assigned = state.assigned[item.id];
  const owner = ownerName(item, peopleById);
  return (
    <div className="row">
      <ScoreBox item={item} />
      <div className="row-body">
        <p className="row-meta">
          <SourceIcon source={item.source} />
          {item.source} · {item.ref}
          {owner && item.source !== 'Email' ? ` · ${owner}` : ''}
          {item.needsManager && <span className="tag tag-needs">Needs you</span>}
          {assigned && <span className="tag tag-ok">Assigned to {assigned}</span>}
        </p>
        <h3 className="row-title">
          <Link to={`/item/${item.id}`}>{item.title}</Link>
        </h3>
        <p className="row-reason">{reasonLine(item, peopleById)}</p>
      </div>
      <Actions item={item} />
    </div>
  );
}
