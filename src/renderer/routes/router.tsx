import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '@renderer/components/layout/AppShell';
import { DashboardScreen } from '@renderer/screens/DashboardScreen';
import { EventsScreen } from '@renderer/screens/EventsScreen';
import { TemplatesScreen } from '@renderer/screens/TemplatesScreen';
import { SessionScreen } from '@renderer/screens/SessionScreen';
import { HistoryScreen } from '@renderer/screens/HistoryScreen';
import { PrintScreen } from '@renderer/screens/PrintScreen';
import { SettingsScreen } from '@renderer/screens/SettingsScreen';
import { DiagnosticsScreen } from '@renderer/screens/DiagnosticsScreen';
import { GalleryScreen } from '@renderer/screens/GalleryScreen';
import { EventModeScreen } from '@renderer/screens/EventModeScreen';
import { PublicViewScreen } from '@renderer/screens/PublicViewScreen';

/** HashRouter keeps deep links working under the file:// protocol in production. */
export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        {/* Event mode + public view run OUTSIDE the admin shell (no sidebar, fullscreen). */}
        <Route path="/evento" element={<EventModeScreen />} />
        <Route path="/publico" element={<PublicViewScreen />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardScreen />} />
          <Route path="/eventos" element={<EventsScreen />} />
          <Route path="/plantillas" element={<TemplatesScreen />} />
          <Route path="/sesion" element={<SessionScreen />} />
          <Route path="/historial" element={<HistoryScreen />} />
          <Route path="/impresion" element={<PrintScreen />} />
          <Route path="/configuracion" element={<SettingsScreen />} />
          <Route path="/diagnostico" element={<DiagnosticsScreen />} />
          <Route path="/galeria-ui" element={<GalleryScreen />} />
          <Route path="*" element={<DashboardScreen />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
