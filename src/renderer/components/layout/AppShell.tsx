import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import type { AppInfo } from '@shared/types/app';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import './layout.css';

/** Admin layout: brass sidebar + topbar + routed content area. */
export function AppShell() {
  const [version, setVersion] = useState('0.1.0');

  useEffect(() => {
    let active = true;
    window.photoBooth.app
      .getInfo()
      .then((result) => {
        if (active && result.ok) setVersion((result.data as AppInfo).version);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="pb-shell">
      <Sidebar version={version} />
      <div className="pb-shell__main">
        <Topbar />
        <main className="pb-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
