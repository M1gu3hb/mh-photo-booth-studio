import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Local, self-hosted fonts (offline-first — no Google Fonts at runtime).
import '@fontsource/cinzel/500.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/pinyon-script/400.css';

import './styles/tokens.css';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container #root not found in index.html');
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
