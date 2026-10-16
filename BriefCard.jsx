import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store.jsx';
import { ThumbUp, ThumbDown } from './Icons.jsx';

export default function BriefCard() {
  const { brief, generateBrief, showRulesBrief, byId, state } = useApp();
  const [feedback, setFeedback] = useState(null);

  const label =
    brief.mode === 'ai'
      ? `AI-generated · ${brief.model}`
      : 'Rule-based · no AI key added';

  return (
    <section className="card card-pad" aria-labelledby="brief-h" aria-busy={brief.status === 'loading'}>
      <div className="brief-head">
        <h2 id="brief-h" className="h2-lg">Today's brief</h2>
        {brief.status === 'ready' && <span className={`tag ${brief.mode === 'ai' ? 'tag-ai' : 'tag-plain'}`}>{label}</span>}
        {brief.status === 'error' && <span className="tag tag-urgent">Summary unavailable</span>}
        {brief.status === 'ready' && <span className="small muted">{brief.at} · every line links to its source</span>}
      </div>

      {(brief.status === 'loading' || brief.status === 'idle') && (
        <div className="grid-auto" aria-label="Writing today's brief">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="skeleton" style={{ width: '40%' }} />
              <div className="skeleton" />
              <div className="skeleton" style={{ width: '80%' }} />
            </div>
          ))}
        </div>
      )}

      {brief.status === 'error' && (
        <div role="alert">
          <p style={{ fontSize: 16, lineHeight: 1.5 }}>
            We couldn't write today's brief. Your feed is still up to date and ranked by score; only the written summary is missing.
          </p>
          <p className="small muted" style={{ marginTop: 6 }}>Details: {brief.error}</p>
          <div className="brief-foot">
            <button type="button" className="btn btn-primary" onClick={generateBrief}>Try again</button>
            <button type="button" className="btn" onClick={showRulesBrief}>Show rule-based brief</button>
            <Link className="btn" to="/feed">Go to Priority Feed</Link>
          </div>
        </div>
      )}

      {brief.status === 'ready' && (
        <>
          <div className="grid-auto">
            {brief.sections.map((s) => (
              <div className="brief-section" key={s.key}>
                <h3>{s.title}</h3>
                {s.sentences.length === 0 ? (
                  <p className="muted">Nothing to report.</p>
                ) : (
                  s.sentences.map((sent, i) => <p key={i}>{sent.text}</p>)
                )}
                {s.sentences.length > 0 && (
                  <div className="brief-sources">
                    {[...new Set(s.sentences.flatMap((x) => x.sources))].map((id) =>
                      byId[id] ? (
                        <Link key={id} className="chip" to={`/item/${id}`}>
                          <span className="sr-only">Source: </span>
                          {byId[id].ref}
                        </Link>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="brief-foot">
            <span className="small muted" style={{ marginRight: 'auto' }}>
              {feedback ? 'Thanks for the feedback.' : 'Was this brief useful?'}
              {brief.dropped > 0 && ` ${brief.dropped} unsourced ${brief.dropped === 1 ? 'line was' : 'lines were'} removed.`}
            </span>
            <button type="button" className="btn btn-icon" aria-label="Brief was helpful" aria-pressed={feedback === 'up'} onClick={() => setFeedback('up')}>
              <ThumbUp />
            </button>
            <button type="button" className="btn btn-icon" aria-label="Brief was not helpful" aria-pressed={feedback === 'down'} onClick={() => setFeedback('down')}>
              <ThumbDown />
            </button>
            <button type="button" className="btn btn-primary" onClick={generateBrief}>
              Regenerate
            </button>
            {!state.settings.apiKey && import.meta.env.VITE_HOSTED !== 'true' && (
              <Link className="btn" to="/settings">Use AI</Link>
            )}
          </div>
        </>
      )}
    </section>
  );
}
