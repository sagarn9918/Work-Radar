import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './store.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Feed from './pages/Feed.jsx';
import Blocked from './pages/Blocked.jsx';
import Detail from './pages/Detail.jsx';
import Search from './pages/Search.jsx';
import Settings from './pages/Settings.jsx';

// HashRouter so the built app works from any static host (GitHub Pages, a ZIP opened locally via `npm run preview`).
export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="feed" element={<Feed />} />
            <Route path="blocked" element={<Blocked />} />
            <Route path="item/:id" element={<Detail />} />
            <Route path="search" element={<Search />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
