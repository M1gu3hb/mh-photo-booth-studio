import { ThemeProvider } from './theme/ThemeProvider';
import { ToastProvider } from './components/ui';
import { EventsProvider } from './state/EventsProvider';
import { AppRouter } from './routes/router';

/**
 * Root composition: theme/branding → toast layer → events state → routed shell.
 * Business logic lives inside each screen (filled in per phase).
 */
export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <EventsProvider>
          <AppRouter />
        </EventsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
