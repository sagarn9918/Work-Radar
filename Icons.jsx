// Simple stroke icons. Decorative unless a label is passed.
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

function Svg({ size = 18, label, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" {...base} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
      {children}
    </svg>
  );
}

export const Radar = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
    <circle cx="13" cy="13" r="11" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="13" cy="13" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.4" />
    <path d="M13 13L21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="13" cy="13" r="1.8" fill="currentColor" />
  </svg>
);
export const Today = (p) => <Svg {...p}><circle cx="10" cy="10" r="7" /><circle cx="10" cy="10" r="3" /></Svg>;
export const List = (p) => <Svg {...p}><path d="M4 6h12M4 10h12M4 14h8" /></Svg>;
export const Person = (p) => <Svg {...p}><circle cx="10" cy="7" r="3" /><path d="M4 17c1-3 3.5-4.5 6-4.5s5 1.5 6 4.5" /></Svg>;
export const Blocked = (p) => <Svg {...p}><circle cx="10" cy="10" r="7" /><path d="M7 10h6" /></Svg>;
export const Search = (p) => <Svg {...p}><circle cx="9" cy="9" r="5" /><path d="M13 13l4 4" /></Svg>;
export const Gear = (p) => <Svg {...p}><circle cx="10" cy="10" r="2.5" /><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" /></Svg>;
export const Check = (p) => <Svg {...p}><path d="M4 10l4 4 8-8" /></Svg>;
export const Chevron = (p) => <Svg {...p}><path d="M5 8l5 5 5-5" /></Svg>;
export const Back = (p) => <Svg {...p}><path d="M12 4l-6 6 6 6" /></Svg>;
export const External = (p) => <Svg {...p}><path d="M8 4h8v8M16 4l-9 9" /></Svg>;
export const Close = (p) => <Svg {...p}><path d="M5 5l10 10M15 5L5 15" /></Svg>;
export const Alert = (p) => <Svg {...p}><circle cx="10" cy="10" r="7.5" /><path d="M10 6v5M10 14v.5" /></Svg>;
export const ThumbUp = (p) => <Svg {...p}><path d="M6 9v8H3V9zM6 9l4-6c1.5 0 2 1 2 2v3h4.5c1 0 1.7.9 1.5 1.9l-1.2 5.5c-.2.9-1 1.6-1.9 1.6H6" /></Svg>;
export const ThumbDown = (p) => <Svg {...p}><path d="M6 11V3H3v8zM6 11l4 6c1.5 0 2-1 2-2v-3h4.5c1 0 1.7-.9 1.5-1.9l-1.2-5.5C16.6 3.7 15.8 3 14.9 3H6" /></Svg>;

const SOURCE_ICONS = {
  GitHub: (p) => <Svg {...p}><circle cx="6" cy="5" r="2" /><circle cx="6" cy="15" r="2" /><circle cx="14" cy="7" r="2" /><path d="M6 7v6M14 9c0 3.5-4 4-8 4" /></Svg>,
  Jira: (p) => <Svg {...p}><rect x="3" y="5" width="14" height="10" rx="2" /><path d="M7 5v10" strokeDasharray="2 2" /></Svg>,
  Email: (p) => <Svg {...p}><rect x="3" y="5" width="14" height="10" rx="2" /><path d="M3 6l7 5 7-5" /></Svg>,
  Slack: (p) => <Svg {...p}><path d="M4 5h12v8H9l-4 3v-3H4z" /></Svg>,
};

export function SourceIcon({ source, size = 14 }) {
  const I = SOURCE_ICONS[source];
  return I ? <I size={size} /> : null;
}
