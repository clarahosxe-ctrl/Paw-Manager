import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppProvider } from './state'
import { App } from './App'

createRoot(document.getElementById('root')!).render(<StrictMode><AppProvider><App /></AppProvider></StrictMode>)

if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(() => {})
