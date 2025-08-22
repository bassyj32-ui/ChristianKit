import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SupabaseAuthProvider } from './components/SupabaseAuthProvider'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultMode="dark">
      <SupabaseAuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SupabaseAuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
