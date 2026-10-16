import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../store.jsx';
import { blockedPeople } from '../lib/reasons.js';
import { Radar, Today, List, Person, Blocked, Search, Gear, Check, Alert } from './Icons.jsx';

const TITLES = { '/': 'Today', '/feed': 'Priority Feed', '/blocked': "Who's Blocked", '/search': 'Search', '/settings': 'Settings' };

function NavItem({ to, icon: Icon, label, count, countLabel, active }) {
  return (
    <Link to={to} className={`nav-link${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
      <Icon />
      {label}
      {count !== undefined && (
        <span className="nav-count">
          <span className="sr-only">, </span>
          {count}
          <span className="sr-only"> {countLabel}</span>
        </span>
      )}
    </Link>
  );
}

export default function Layout() {
  const { open, peopleById, toast, undo, state } = useApp();
  const loc = useLocation();
  const mainRef = useRef(null);
  const view = new URLSearchParams(loc.search).get('view');
  const path = loc.pathname;

  // On navigation (not first load): set the tab title and move focus to the page heading,
  // so screen-reader users hear where they landed.
  const firstLoad = useRef(true);
  useEffect(() => {
    const base = path.startsWith('/item/') ? 'Item details' : TITLES[path] || 'WorkRadar';
    document.title = `${base} · WorkRadar`;
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    const h1 = mainRef.current?.querySelector('h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus();
    }
  }, [path, view]);

  const needs = open.filter((i) => i.needsManager).length;
  const blocked = blockedPeople(open, peopleById).length;
  const sim = state.settings.simulate;

  return (
    <>
      <a className="skip" href="#content" onClick={(e) => { e.preventDefault(); mainRef.current?.querySelector('h1')?.focus(); }}>
        Skip to content
      </a>
      <div className="app">
        <nav className="sidebar" aria-label="Main">
          <Link to="/" className="brand">
            <Radar />
            WorkRadar
          </Link>
          <NavItem to="/" icon={Today} label="Today" active={path === '/'} />
          <NavItem to="/feed" icon={List} label="Priority Feed" count={open.length} countLabel="items" active={path === '/feed' && view !== 'needs'} />
          <NavItem to="/feed?view=needs" icon={Person} label="Needs Me" count={needs} countLabel="items" active={path === '/feed' && view === 'needs'} />
          <NavItem to="/blocked" icon={Blocked} label="Who's Blocked" count={blocked} countLabel="people" active={path === '/blocked'} />
          <NavItem to="/search" icon={Search} label="Search" active={path === '/search'} />
          <NavItem to="/settings" icon={Gear} label="Settings" active={path === '/settings'} />
          <h2 className="nav-section">Sources</h2>
          <ul className="source-list">
            {['Slack', 'Jira', 'GitHub', 'Email'].map((s) => {
              const down = s === 'Jira' && sim.jiraDown;
              return (
                <li key={s}>
                  {down ? <Alert size={14} /> : <Check size={14} />}
                  {s}
                  <span className="sr-only">{down ? ', not responding' : ', connected'}</span>
                  {down && <span className="xs muted" aria-hidden="true">· not responding</span>}
                </li>
              );
            })}
          </ul>
        </nav>

        <main id="content" className="main" ref={mainRef}>
          {sim.jiraDown && (
            <div className="banner" role="status" style={{ background: 'var(--butter)' }}>
              <span className="banner-icon" aria-hidden="true"><Alert /></span>
              <div>
                <p style={{ fontWeight: 600 }}>Jira isn't responding</p>
                <p className="small" style={{ marginTop: 4 }}>
                  Your feed still shows Slack, GitHub and Email. Jira items from after 8:49 AM may be missing.{' '}
                  <Link to="/settings">Demo setting</Link>
                </p>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.key}>
            <span>{toast.message}</span>
            {toast.canUndo && (
              <button type="button" onClick={undo}>
                Undo
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
