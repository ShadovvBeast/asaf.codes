import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
        },
        (err) => {
            console.error('Service Worker registration failed:', err);
        }
    );
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
