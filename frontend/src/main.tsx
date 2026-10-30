import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { SentryProvider } from './services/providers/monitoring/sentryProvider'

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    SentryProvider.getInstance().captureException(event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    SentryProvider.getInstance().captureException(event.reason);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
