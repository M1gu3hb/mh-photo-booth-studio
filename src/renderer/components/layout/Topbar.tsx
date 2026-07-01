import { useLocation } from 'react-router-dom';
import { Icon } from '@renderer/components/ui';
import { useEvents } from '@renderer/state/EventsProvider';
import { NAV_ITEMS, GALLERY_ITEM } from '@renderer/routes/navigation';
import './layout.css';

const TITLES = [...NAV_ITEMS, GALLERY_ITEM];

function resolveTitle(pathname: string): string {
  const exact = TITLES.find((item) => item.path === pathname);
  if (exact) return exact.label;
  const nested = TITLES.find((item) => item.path !== '/' && pathname.startsWith(item.path));
  return nested?.label ?? 'Dashboard';
}

/** Top bar shows the current screen and the active-event slot (real, from state). */
export function Topbar() {
  const { pathname } = useLocation();
  const { activeEvent } = useEvents();
  const title = resolveTitle(pathname);

  return (
    <header className="pb-topbar">
      <h1 className="pb-topbar__title">{title}</h1>
      <div className="pb-topbar__right">
        {activeEvent ? (
          <span className="pb-eventchip pb-eventchip--set">
            <Icon name="events" size={16} className="pb-eventchip__icon" />
            <span className="pb-eventchip__name">{activeEvent.name}</span>
          </span>
        ) : (
          <span className="pb-eventchip pb-eventchip--empty">
            <Icon name="events" size={16} className="pb-eventchip__icon" />
            <span>Sin evento activo</span>
          </span>
        )}
      </div>
    </header>
  );
}
