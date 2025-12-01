import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'
import 'katex/dist/katex.min.css'
import { TooltipProvider } from './components/ui/tooltip'

console.log('[main.tsx] Starting render...')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </React.StrictMode>,
)
