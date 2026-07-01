import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@renderer/components/ui';
import { useBranding } from '@renderer/theme/ThemeProvider';
import { navItemsForEvent, GALLERY_ITEM } from '@renderer/routes/navigation';
import { useEvents } from '@renderer/state/EventsProvider';
import './layout.css';

interface SidebarProps {
  version: string;
}

/** Brass rail over felt. Each entry navigates to a real screen. */
export function Sidebar({ version }: SidebarProps) {
  const branding = useBranding();
  const { activeEvent } = useEvents();
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    void window.photoBooth.branding.getLogo().then((r) => {
      if (on && r.ok) setLogo(r.data);
    });
    return () => {
      on = false;
    };
  }, [branding.logoPath]);

  return (
    <aside className="pb-sidebar">
      <div className="pb-sidebar__brand">
        <span className="pb-sidebar__mark" aria-hidden>
          {logo ? <img className="pb-sidebar__logo" src={logo} alt="" /> : <Icon name="session" size={26} />}
        </span>
        <span className="pb-sidebar__brand-text">
          <strong>{branding.productName}</strong>
          <small>{branding.venueName}</small>
        </span>
      </div>

      <nav className="pb-sidebar__nav" aria-label="Navegación principal">
        {navItemsForEvent(activeEvent).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `pb-navitem ${isActive ? 'pb-navitem--active' : ''}`.trim()
            }
          >
            <Icon name={item.icon} size={20} className="pb-navitem__icon" />
            <span className="pb-navitem__label">{item.label}</span>
          </NavLink>
        ))}

        <div className="pb-sidebar__divider" role="separator" />
        <span className="pb-sidebar__group-label">Desarrollo</span>
        <NavLink
          to={GALLERY_ITEM.path}
          className={({ isActive }) => `pb-navitem ${isActive ? 'pb-navitem--active' : ''}`.trim()}
        >
          <Icon name={GALLERY_ITEM.icon} size={20} className="pb-navitem__icon" />
          <span className="pb-navitem__label">{GALLERY_ITEM.label}</span>
        </NavLink>
      </nav>

      <footer className="pb-sidebar__footer">
        <span data-testid="app-version">v{version}</span>
      </footer>
    </aside>
  );
}
